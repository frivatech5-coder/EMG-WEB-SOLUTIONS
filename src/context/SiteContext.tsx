import React, { createContext, useContext, useEffect, useMemo, useRef, useState, useCallback } from 'react';
import {
  collection, doc, onSnapshot, setDoc, deleteDoc, getDoc, getDocFromServer, query, where, arrayUnion, QuerySnapshot, DocumentData,
} from 'firebase/firestore';
import { signInWithPopup, signOut, onAuthStateChanged, GoogleAuthProvider, User } from 'firebase/auth';
import { db, auth, ADMIN_EMAILS, explainError } from '../firebase';
import { Project, Service, GoogleReview, SiteSettings, ReviewStatus, EstimatorConfig } from '../types';
import { DEFAULT_SITE_SETTINGS, DEFAULT_SERVICES, DEFAULT_PORTFOLIO, DEFAULT_ESTIMATOR, isDemoContent, isLegacyHeroCopy } from '../data/defaultData';
import { clean } from '../lib/format';

export interface Inquiry { id: string; name: string; phone: string; email: string; service: string; budget: string; message: string; createdAt: string }
export type AdminTab = 'dashboard' | 'content' | 'services' | 'portfolio' | 'reviews' | 'inquiries' | 'estimator' | 'settings' | 'backup';
export interface ReviewInput { authorName: string; rating: number; serviceReviewed: string; reviewText: string }
export interface InquiryInput { name: string; phone: string; email: string; service: string; budget: string; message: string }

interface SiteContextType {
  settings: SiteSettings;
  estimator: EstimatorConfig;
  services: Service[];
  portfolio: Project[];
  reviews: GoogleReview[];
  inquiries: Inquiry[];
  isLoading: boolean;
  isFirebaseConnected: boolean;
  updateSettings: (patch: Partial<SiteSettings>) => Promise<void>;
  saveService: (s: Omit<Service, 'id'> & { id?: string }) => Promise<void>;
  deleteService: (id: string) => Promise<void>;
  saveProject: (p: Omit<Project, 'id'> & { id?: string }) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  submitReview: (r: ReviewInput) => Promise<void>;
  addManualReview: (r: Omit<GoogleReview, 'id'>) => Promise<void>;
  updateReview: (id: string, patch: Partial<GoogleReview>) => Promise<void>;
  deleteReview: (id: string) => Promise<void>;
  submitInquiry: (i: InquiryInput) => Promise<void>;
  deleteInquiry: (id: string) => Promise<void>;
  seedStarterContent: () => Promise<number>;
  exportBackup: () => string;
  importBackup: (json: string) => Promise<number>;
  isAdminOpen: boolean;
  setIsAdminOpen: (o: boolean) => void;
  activeAdminTab: AdminTab;
  setActiveAdminTab: (t: AdminTab) => void;
  currentUser: User | null;
  isAdmin: boolean;
  isAuthChecking: boolean;
  loginWithGoogle: () => Promise<void>;
  logoutUser: () => Promise<void>;
}

const Ctx = createContext<SiteContextType | undefined>(undefined);
const CACHE = { settings: 'emg_cache_settings_v3', services: 'emg_cache_services_v3', portfolio: 'emg_cache_portfolio_v3', reviews: 'emg_cache_reviews_v3' };

const readCache = <T,>(k: string): T | null => { try { const v = localStorage.getItem(k); return v ? (JSON.parse(v) as T) : null; } catch { return null; } };
const writeCache = (k: string, v: unknown) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* storage full or blocked */ } };
const strip = <T,>(o: T): T => JSON.parse(JSON.stringify(o));
const rid = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
const toList = <T,>(snap: QuerySnapshot<DocumentData>) => snap.docs.map((d) => ({ ...d.data(), id: d.id }) as T);
enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map((provider) => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(explainError(error));
}

/** Runs a Firestore write; turns errors AND silent hangs (e.g. offline) into a readable error. */
const wrap = async <T,>(fn: () => Promise<T>, operationType: OperationType, path: string | null, timeoutMs = 15000): Promise<T> => {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, rej) => { timer = setTimeout(() => rej(new Error('No response from Firebase. Check your internet connection and try again.')), timeoutMs); });
  try { return await Promise.race([fn(), timeout]); }
  catch (e) {
    if ((e as Error).message === 'No response from Firebase. Check your internet connection and try again.') throw e;
    handleFirestoreError(e, operationType, path);
  }
  finally { clearTimeout(timer); }
};

/** Client-side abuse guard for public forms (rules still validate shape/size server-side). */
function throttle(key: string, minGapMs: number, maxPerDay: number) {
  let log: number[] = [];
  try { log = JSON.parse(localStorage.getItem(key) || '[]'); } catch { /* ignore */ }
  const now = Date.now();
  log = log.filter((t) => now - t < 86400000);
  if (log.length && now - log[log.length - 1] < minGapMs) throw new Error('Please wait a moment before submitting again.');
  if (log.length >= maxPerDay) throw new Error('Submission limit reached for today. Please contact us on WhatsApp instead.');
  log.push(now);
  try { localStorage.setItem(key, JSON.stringify(log)); } catch { /* ignore */ }
}

export const SiteProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [rawSettings, setRawSettings] = useState<Partial<SiteSettings> | null>(() => readCache(CACHE.settings));
  const [rawServices, setRawServices] = useState<Service[] | null>(() => readCache(CACHE.services));
  const [rawPortfolio, setRawPortfolio] = useState<Project[] | null>(() => readCache(CACHE.portfolio));
  const [rawReviews, setRawReviews] = useState<GoogleReview[] | null>(() => readCache(CACHE.reviews));
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loaded, setLoaded] = useState({ settings: false, services: false, portfolio: false, reviews: false });
  const [timedOut, setTimedOut] = useState(false);
  const [isFirebaseConnected, setConnected] = useState(true);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [activeAdminTab, setActiveAdminTab] = useState<AdminTab>('dashboard');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isAuthChecking, setAuthChecking] = useState(true);
  const settingsRef = useRef<Partial<SiteSettings> | null>(null);
  settingsRef.current = rawSettings;
  const servicesRef = useRef<Service[] | null>(null);
  servicesRef.current = rawServices;
  const portfolioRef = useRef<Project[] | null>(null);
  portfolioRef.current = rawPortfolio;
  const reviewsRef = useRef<GoogleReview[] | null>(null);
  reviewsRef.current = rawReviews;
  const inquiriesRef = useRef<Inquiry[]>([]);
  inquiriesRef.current = inquiries;

  // ── Validate connection to Firestore on boot ──
  useEffect(() => {
    async function testConnection() {
      try {
        await getDocFromServer(doc(db, 'settings', 'global'));
        setConnected(true);
      } catch (error) {
        if (error instanceof Error && error.message.includes('the client is offline')) {
          console.error('Please check your Firebase configuration.');
          setConnected(false);
        }
      }
    }
    void testConnection();
  }, []);

  // ── Auth + admin check (email allow-list, or a document in /admins/{uid}) ──
  useEffect(() => onAuthStateChanged(auth, async (user) => {
    setCurrentUser(user);
    if (!user) { setIsAdmin(false); setAuthChecking(false); return; }
    let ok = Boolean(user.email && user.emailVerified && ADMIN_EMAILS.includes(user.email.toLowerCase()));
    if (!ok) { try { ok = (await getDoc(doc(db, 'admins', user.uid))).exists(); } catch { ok = false; } }
    setIsAdmin(ok); setAuthChecking(false);
  }), []);

  useEffect(() => { const t = setTimeout(() => setTimedOut(true), 6000); return () => clearTimeout(t); }, []);

  // ── Realtime listeners. They only READ; nothing is ever auto-written from defaults. ──
  useEffect(() => {
    const done = (k: keyof typeof loaded) => setLoaded((l) => (l[k] ? l : { ...l, [k]: true }));
    const fail = (k: keyof typeof loaded) => (e: Error) => { console.warn(`Firestore ${k} listener:`, e.message); setConnected(false); done(k); };
    const unsubs = [
      onSnapshot(doc(db, 'settings', 'global'), (s) => {
        setConnected(true);
        if (s.exists()) { const d = s.data() as Partial<SiteSettings>; setRawSettings(d); writeCache(CACHE.settings, d); }
        done('settings');
      }, fail('settings')),
      onSnapshot(collection(db, 'services'), (s) => { const l = toList<Service>(s); setRawServices(l); writeCache(CACHE.services, l); done('services'); }, fail('services')),
      onSnapshot(collection(db, 'portfolio'), (s) => { const l = toList<Project>(s); setRawPortfolio(l); writeCache(CACHE.portfolio, l); done('portfolio'); }, fail('portfolio')),
      // Public visitors may only read approved reviews; admins read everything for moderation.
      onSnapshot(isAdmin ? collection(db, 'reviews') : query(collection(db, 'reviews'), where('status', '==', 'approved')), (s) => {
        const l = toList<GoogleReview>(s); setRawReviews(l); if (!isAdmin) writeCache(CACHE.reviews, l); done('reviews');
      }, fail('reviews')),
    ];
    if (isAdmin) unsubs.push(onSnapshot(collection(db, 'inquiries'), (s) => setInquiries(toList<Inquiry>(s).sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''))), (e) => console.warn('inquiries listener:', e.message)));
    return () => unsubs.forEach((u) => u());
  }, [isAdmin]);

  const isLoading = !timedOut && !(loaded.settings && loaded.services && loaded.portfolio && loaded.reviews);

  // ── Derived public data ──
  const settings = useMemo<SiteSettings>(() => {
    const merged = { ...DEFAULT_SITE_SETTINGS, ...(rawSettings || {}) } as SiteSettings;
    (['heroTitle', 'heroSubtitle'] as const).forEach((k) => { if (!merged[k] || isLegacyHeroCopy(merged[k])) merged[k] = DEFAULT_SITE_SETTINGS[k]; });
    if (merged.heroBadgeText === undefined || isLegacyHeroCopy(merged.heroBadgeText)) merged.heroBadgeText = DEFAULT_SITE_SETTINGS.heroBadgeText;
    if (!merged.whatsapp) merged.whatsapp = merged.phone;
    if (!merged.aiLogo) merged.aiLogo = DEFAULT_SITE_SETTINGS.aiLogo;
    if (!merged.aiName) merged.aiName = DEFAULT_SITE_SETTINGS.aiName;
    return merged;
  }, [rawSettings]);
  const initialized = settings.initializedCollections || [];
  const estimator = settings.estimator || DEFAULT_ESTIMATOR;

  const services = useMemo<Service[]>(() => {
    if (rawServices && rawServices.length) return [...rawServices].sort((a, b) => (a.order ?? 999) - (b.order ?? 999) || a.name.localeCompare(b.name));
    if (rawServices && initialized.includes('services')) return [];
    return loaded.services || timedOut ? DEFAULT_SERVICES : [];
  }, [rawServices, initialized, loaded.services, timedOut]);

  const portfolio = useMemo<Project[]>(() => {
    const list = (rawPortfolio || []).filter((p) => isAdmin || !isDemoContent(p.id));
    if (list.length) return list;
    if (rawPortfolio && initialized.includes('portfolio')) return [];
    return loaded.portfolio || timedOut ? DEFAULT_PORTFOLIO : [];
  }, [rawPortfolio, initialized, isAdmin, loaded.portfolio, timedOut]);

  const reviews = useMemo<GoogleReview[]>(() => (rawReviews || []).filter((r) => isAdmin || !isDemoContent(r.id)), [rawReviews, isAdmin]);

  // ── Writes (all awaited; errors are thrown with a readable message so the UI can show them) ──
  const markInit = async (name: string) => {
    if ((settingsRef.current?.initializedCollections || []).includes(name)) return;
    await setDoc(doc(db, 'settings', 'global'), { initializedCollections: arrayUnion(name) }, { merge: true });
  };

  const updateSettings = useCallback(async (patch: Partial<SiteSettings>) => {
    const prevSnapshot = settingsRef.current;
    const nextSnapshot = { ...(prevSnapshot || {}), ...patch };
    setRawSettings(nextSnapshot);
    writeCache(CACHE.settings, nextSnapshot);
    try {
      await wrap(async () => {
        await setDoc(doc(db, 'settings', 'global'), strip({ ...patch, updatedAt: new Date().toISOString() }), { merge: true });
      }, OperationType.WRITE, 'settings/global');
    } catch (e) {
      setRawSettings(prevSnapshot);
      writeCache(CACHE.settings, prevSnapshot);
      throw e;
    }
  }, []);

  const saveService = useCallback(async (s: Omit<Service, 'id'> & { id?: string }) => {
    const prevSnapshot = servicesRef.current;
    const id = s.id || `service-${rid()}`;
    const newService: Service = { ...s, id, order: s.order ?? (prevSnapshot?.length ?? 0) + 1 };
    const list = prevSnapshot ? [...prevSnapshot] : [];
    const idx = list.findIndex((item) => item.id === id);
    if (idx >= 0) list[idx] = newService;
    else list.push(newService);
    setRawServices(list);
    writeCache(CACHE.services, list);
    try {
      await wrap(async () => {
        await setDoc(doc(db, 'services', id), strip({ ...newService, updatedAt: new Date().toISOString() }));
        await markInit('services');
      }, OperationType.WRITE, `services/${id}`);
    } catch (e) {
      setRawServices(prevSnapshot);
      writeCache(CACHE.services, prevSnapshot);
      throw e;
    }
  }, []);

  const deleteService = useCallback(async (id: string) => {
    const prevSnapshot = servicesRef.current;
    const list = (prevSnapshot || []).filter((s) => s.id !== id);
    setRawServices(list);
    writeCache(CACHE.services, list);
    try {
      await wrap(async () => {
        await deleteDoc(doc(db, 'services', id));
        await markInit('services');
      }, OperationType.DELETE, `services/${id}`);
    } catch (e) {
      setRawServices(prevSnapshot);
      writeCache(CACHE.services, prevSnapshot);
      throw e;
    }
  }, []);

  const saveProject = useCallback(async (p: Omit<Project, 'id'> & { id?: string }) => {
    const prevSnapshot = portfolioRef.current;
    const id = p.id && !p.id.startsWith('placeholder') ? p.id : `project-${rid()}`;
    const newProject: Project = { ...p, id } as Project;
    const list = prevSnapshot ? [...prevSnapshot] : [];
    const idx = list.findIndex((item) => item.id === id);
    if (idx >= 0) list[idx] = newProject;
    else list.push(newProject);
    setRawPortfolio(list);
    writeCache(CACHE.portfolio, list);
    try {
      await wrap(async () => {
        await setDoc(doc(db, 'portfolio', id), strip({ ...newProject, updatedAt: new Date().toISOString() }));
        await markInit('portfolio');
      }, OperationType.WRITE, `portfolio/${id}`);
    } catch (e) {
      setRawPortfolio(prevSnapshot);
      writeCache(CACHE.portfolio, prevSnapshot);
      throw e;
    }
  }, []);

  const deleteProject = useCallback(async (id: string) => {
    const prevSnapshot = portfolioRef.current;
    const list = (prevSnapshot || []).filter((p) => p.id !== id);
    setRawPortfolio(list);
    writeCache(CACHE.portfolio, list);
    try {
      await wrap(async () => {
        await deleteDoc(doc(db, 'portfolio', id));
        await markInit('portfolio');
      }, OperationType.DELETE, `portfolio/${id}`);
    } catch (e) {
      setRawPortfolio(prevSnapshot);
      writeCache(CACHE.portfolio, prevSnapshot);
      throw e;
    }
  }, []);

  const submitReview = (r: ReviewInput) => {
    const id = `review-${rid()}`;
    return wrap(async () => {
      const text = clean(r.reviewText, 1500);
      const seenKey = 'emg_review_hashes';
      const hash = text.toLowerCase().replace(/\s+/g, ' ').slice(0, 200);
      let seen: string[] = []; try { seen = JSON.parse(localStorage.getItem(seenKey) || '[]'); } catch { /* ignore */ }
      if (seen.includes(hash)) throw new Error('This review has already been submitted.');
      throttle('emg_review_log', 60000, 2);
      await setDoc(doc(db, 'reviews', id), {
        authorName: clean(r.authorName, 80), rating: Math.round(r.rating), reviewText: text, serviceReviewed: clean(r.serviceReviewed, 100),
        date: new Date().toISOString(), createdAt: new Date().toISOString(), source: 'customer', status: 'pending', verifiedGoogleReview: false,
      });
      try { localStorage.setItem(seenKey, JSON.stringify([...seen, hash].slice(-20))); } catch { /* ignore */ }
    }, OperationType.CREATE, `reviews/${id}`);
  };

  const addManualReview = useCallback(async (r: Omit<GoogleReview, 'id'>) => {
    const prevSnapshot = reviewsRef.current;
    const id = `review-${rid()}`;
    const newReview = { ...r, id, createdAt: new Date().toISOString() } as GoogleReview;
    const list = [...(prevSnapshot || []), newReview];
    setRawReviews(list);
    try {
      await wrap(async () => {
        await setDoc(doc(db, 'reviews', id), strip(newReview));
      }, OperationType.CREATE, `reviews/${id}`);
    } catch (e) {
      setRawReviews(prevSnapshot);
      throw e;
    }
  }, []);

  const updateReview = useCallback(async (id: string, patch: Partial<GoogleReview>) => {
    const prevSnapshot = reviewsRef.current;
    const list = (prevSnapshot || []).map((r) => (r.id === id ? { ...r, ...patch } : r));
    setRawReviews(list);
    writeCache(CACHE.reviews, list);
    try {
      await wrap(async () => {
        await setDoc(doc(db, 'reviews', id), strip({ ...patch, updatedAt: new Date().toISOString() }), { merge: true });
      }, OperationType.UPDATE, `reviews/${id}`);
    } catch (e) {
      setRawReviews(prevSnapshot);
      writeCache(CACHE.reviews, prevSnapshot);
      throw e;
    }
  }, []);

  const deleteReview = useCallback(async (id: string) => {
    const prevSnapshot = reviewsRef.current;
    const list = (prevSnapshot || []).filter((r) => r.id !== id);
    setRawReviews(list);
    writeCache(CACHE.reviews, list);
    try {
      await wrap(async () => {
        await deleteDoc(doc(db, 'reviews', id));
      }, OperationType.DELETE, `reviews/${id}`);
    } catch (e) {
      setRawReviews(prevSnapshot);
      writeCache(CACHE.reviews, prevSnapshot);
      throw e;
    }
  }, []);

  const submitInquiry = (i: InquiryInput) => {
    const id = `inq-${rid()}`;
    return wrap(async () => {
      throttle('emg_inquiry_log', 30000, 5);
      await setDoc(doc(db, 'inquiries', id), {
        name: clean(i.name, 80), phone: clean(i.phone, 30) || 'Not provided', email: clean(i.email, 100), service: clean(i.service, 200),
        budget: clean(i.budget, 100), message: clean(i.message, 2000), createdAt: new Date().toISOString(),
      });
    }, OperationType.CREATE, `inquiries/${id}`);
  };

  const deleteInquiry = useCallback(async (id: string) => {
    const prevSnapshot = inquiriesRef.current;
    setInquiries(prevSnapshot.filter((q) => q.id !== id));
    try {
      await wrap(async () => {
        await deleteDoc(doc(db, 'inquiries', id));
      }, OperationType.DELETE, `inquiries/${id}`);
    } catch (e) {
      setInquiries(prevSnapshot);
      throw e;
    }
  }, []);

  /** Adds starter content only where nothing exists yet. Never overwrites existing documents. */
  const seedStarterContent = () => wrap(async () => {
    let n = 0;
    const settingsSnap = await getDoc(doc(db, 'settings', 'global'));
    if (!settingsSnap.exists()) { await setDoc(doc(db, 'settings', 'global'), { ...strip(DEFAULT_SITE_SETTINGS), updatedAt: new Date().toISOString() }); n++; }
    for (const s of DEFAULT_SERVICES) {
      const ref = doc(db, 'services', s.id);
      if (!(await getDoc(ref)).exists()) { await setDoc(ref, strip({ ...s, updatedAt: new Date().toISOString() })); n++; }
    }
    await markInit('services');
    if (!settingsSnap.data()?.estimator) await setDoc(doc(db, 'settings', 'global'), { estimator: strip(DEFAULT_ESTIMATOR) }, { merge: true });
    return n;
  }, OperationType.WRITE, 'settings/global', 90000);

  const exportBackup = () => JSON.stringify({ exportedAt: new Date().toISOString(), settings: rawSettings, services: rawServices, portfolio: rawPortfolio, reviews: rawReviews }, null, 2);
  const importBackup = (json: string) => wrap(async () => {
    const d = JSON.parse(json);
    let n = 0;
    if (d.settings) { await setDoc(doc(db, 'settings', 'global'), strip(d.settings), { merge: true }); n++; }
    for (const [col, list] of [['services', d.services], ['portfolio', d.portfolio], ['reviews', d.reviews]] as const) {
      for (const item of (Array.isArray(list) ? list : []) as { id?: string }[]) { if (item?.id) { await setDoc(doc(db, col, item.id), strip(item)); n++; } }
    }
    return n;
  }, OperationType.WRITE, 'backup', 90000);

  const loginWithGoogle = useCallback(async () => { try { await signInWithPopup(auth, new GoogleAuthProvider()); } catch (e) { throw new Error(explainError(e)); } }, []);
  const logoutUser = useCallback(async () => { await signOut(auth); }, []);

  const value: SiteContextType = {
    settings, estimator, services, portfolio, reviews, inquiries, isLoading, isFirebaseConnected,
    updateSettings, saveService, deleteService, saveProject, deleteProject,
    submitReview, addManualReview, updateReview, deleteReview, submitInquiry, deleteInquiry,
    seedStarterContent, exportBackup, importBackup,
    isAdminOpen, setIsAdminOpen, activeAdminTab, setActiveAdminTab,
    currentUser, isAdmin, isAuthChecking, loginWithGoogle, logoutUser,
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
};

export const useSite = () => {
  const c = useContext(Ctx);
  if (!c) throw new Error('useSite must be used within SiteProvider');
  return c;
};
export type { ReviewStatus };
