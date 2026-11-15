import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, BarChart3, Database, FileText, Inbox, LogOut, Settings as SettingsIcon, Calculator, Layers, Briefcase, MessageSquareQuote, X, ShieldAlert, LogIn, Check, Loader2, Sparkles, Upload, Bot } from 'lucide-react';
import { AdminTab, useSite } from '../../context/SiteContext';
import { SiteSettings } from '../../types';
import { isDemoContent } from '../../data/defaultData';
import { priceNeedsReview } from '../../lib/format';
import { Field, Spinner, Toggle, btnDanger, btnGhost, btnPrimary, ConfirmDialog, input, useAction } from './ui';
import { ServicesManager, PortfolioManager, ReviewsManager, InquiriesManager, EstimatorManager } from './Managers';
import { toast } from '../../lib/toast';

const UPLOADED_AI_LOGO = '/assets/aistudio/EMG_AI_Neon_Tech_Logo_34e96ab4.png';

type Spec = { key: keyof SiteSettings; label: string; kind?: 'text' | 'area' | 'toggle' | 'url'; hint?: string };
const GROUPS: Record<'content' | 'settings', { title: string; fields: Spec[] }[]> = {
  content: [
    { title: 'Company', fields: [{ key: 'companyName', label: 'Company name' }, { key: 'tagline', label: 'Tagline' }, { key: 'motto', label: 'Motto' }, { key: 'address', label: 'Location / address text', hint: 'Shown in the footer. Only enter what is true.' }] },
    { title: 'Landing page (hero)', fields: [{ key: 'heroBadgeText', label: 'Availability badge' }, { key: 'heroTitle', label: 'Headline', kind: 'area' }, { key: 'heroSubtitle', label: 'Description', kind: 'area' }, { key: 'heroPrimaryCta', label: 'Primary button text' }, { key: 'heroWhatsappCta', label: 'WhatsApp button text' }, { key: 'heroSecondaryCta', label: 'View work button text' }] },
    { title: 'About', fields: [{ key: 'aboutTitle', label: 'About headline', kind: 'area' }, { key: 'aboutText', label: 'About text', kind: 'area' }] },
    { title: 'Section headings', fields: [{ key: 'servicesTitle', label: 'Services title' }, { key: 'servicesIntro', label: 'Services intro', kind: 'area' }, { key: 'portfolioTitle', label: 'Portfolio title' }, { key: 'portfolioIntro', label: 'Portfolio intro', kind: 'area' }, { key: 'whyTitle', label: 'Why choose us title' }, { key: 'processTitle', label: 'Process title' }, { key: 'estimatorTitle', label: 'Estimator title' }, { key: 'testimonialsTitle', label: 'Reviews title' }] },
    { title: 'Contact section', fields: [{ key: 'ctaTitle', label: 'Headline' }, { key: 'ctaSubtitle', label: 'Supporting text', kind: 'area' }] },
    { title: 'Announcement bar', fields: [{ key: 'showAnnouncement', label: 'Show announcement bar', kind: 'toggle' }, { key: 'announcementText', label: 'Announcement text' }] },
  ],
  settings: [
    {
      title: 'AI Assistant & Logo',
      fields: [
        { key: 'aiName', label: 'AI assistant name', hint: 'Displayed in chatbot header, greetings and button (e.g. Evans).' },
        { key: 'aiLogo', label: 'AI assistant logo path or URL', hint: 'Image used for chatbot floating button, header & message avatar.' },
      ],
    },
    { title: 'Contact details', fields: [{ key: 'phone', label: 'Phone number' }, { key: 'whatsapp', label: 'WhatsApp number', hint: 'Local (0712…) or international (+254712…) format.' }, { key: 'email', label: 'Email address' }] },
    { title: 'Social links', fields: [{ key: 'instagram', label: 'Instagram URL', kind: 'url' }, { key: 'facebook', label: 'Facebook URL', kind: 'url' }, { key: 'linkedin', label: 'LinkedIn URL', kind: 'url' }, { key: 'x', label: 'X (Twitter) URL', kind: 'url' }, { key: 'tiktok', label: 'TikTok URL', kind: 'url' }] },
    { title: 'SEO', fields: [{ key: 'seoTitle', label: 'Page title', hint: 'Aim for under 60 characters.' }, { key: 'seoDescription', label: 'Meta description', kind: 'area', hint: 'Aim for 150-160 characters.' }] },
  ],
};

async function compressLogoFile(file: File): Promise<string> {
  if (!file.type.startsWith('image/')) throw new Error('Please choose an image file.');
  if (file.size > 12 * 1024 * 1024) throw new Error('Image is too large (max 12 MB).');
  const bmp = await createImageBitmap(file);
  const scale = Math.min(1, 256 / Math.max(bmp.width, bmp.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(bmp.width * scale));
  canvas.height = Math.max(1, Math.round(bmp.height * scale));
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not process image.');
  ctx.drawImage(bmp, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL('image/webp', 0.88);
}

const SettingsForm: React.FC<{ which: 'content' | 'settings' }> = ({ which }) => {
  const { settings, updateSettings } = useSite();
  const [draft, setDraft] = useState<Partial<SiteSettings>>({});
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const debounceRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const draftRef = React.useRef<Partial<SiteSettings>>(draft);

  const dirty = Object.keys(draft).length > 0;
  const val = <K extends keyof SiteSettings>(k: K) => (k in draft ? draft[k] : settings[k]) as SiteSettings[K];

  const flushSave = React.useCallback(async (overridePatch?: Partial<SiteSettings>) => {
    const patch = overridePatch ? { ...draftRef.current, ...overridePatch } : { ...draftRef.current };
    if (!patch || Object.keys(patch).length === 0) return;

    const bad = (Object.entries(patch) as [keyof SiteSettings, unknown][]).find(
      ([k, v]) => ['instagram', 'facebook', 'linkedin', 'x', 'tiktok'].includes(k as string) && v && !/^https?:\/\//i.test(String(v))
    );
    if (bad) {
      toast('error', `${String(bad[0])} must start with https://`);
      setSaveStatus('error');
      return;
    }
    if (patch.email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(String(patch.email))) {
      toast('error', 'Email address looks invalid.');
      setSaveStatus('error');
      return;
    }

    setSaveStatus('saving');
    try {
      await updateSettings(patch);
      const remaining = { ...draftRef.current };
      Object.keys(patch).forEach((k) => delete remaining[k as keyof SiteSettings]);
      draftRef.current = remaining;
      setDraft(remaining);
      setSaveStatus('saved');
      setLastSaved(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    } catch (e) {
      console.error('Failed to save settings:', e);
      setSaveStatus('error');
      toast('error', `Failed to save: ${(e as Error).message}`);
    }
  }, [updateSettings]);

  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
        debounceRef.current = null;
      }
      if (Object.keys(draftRef.current).length > 0) {
        void updateSettings(draftRef.current).catch(() => {});
      }
    };
  }, [updateSettings]);

  const setField = (k: keyof SiteSettings, v: unknown, immediate = false) => {
    const nextDraft = { ...draftRef.current, [k]: v } as Partial<SiteSettings>;
    draftRef.current = nextDraft;
    setDraft(nextDraft);

    if (immediate) {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      void flushSave({ [k]: v });
      return;
    }

    // Auto-save debounce for typing
    setSaveStatus('idle');
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      void flushSave();
    }, 600);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      setSaveStatus('saving');
      const dataUrl = await compressLogoFile(file);
      await flushSave({ aiLogo: dataUrl });
      toast('success', 'AI logo uploaded and saved to Firebase!');
    } catch (err) {
      toast('error', (err as Error).message || 'Failed to process image file');
      setSaveStatus('error');
    }
  };

  const applyUploadedPreset = async () => {
    await flushSave({ aiLogo: UPLOADED_AI_LOGO });
    toast('success', 'AI logo updated to neon tech picture and saved to Firebase!');
  };

  return (
    <div className="space-y-8">
      {/* Live AI Logo Management Banner in Settings Tab */}
      {which === 'settings' && (
        <section className="relative overflow-hidden rounded-2xl border border-brand/40 bg-gradient-to-br from-navy via-navy to-brand/10 p-5 sm:p-6 shadow-xl">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="relative group grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-2xl border-2 border-brand bg-black p-1 shadow-[0_0_30px_rgba(20,127,245,0.4)]">
                <img
                  src={String(val('aiLogo') || settings.aiLogo || UPLOADED_AI_LOGO)}
                  alt="AI Assistant Logo"
                  className="h-full w-full object-cover rounded-xl"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = UPLOADED_AI_LOGO;
                  }}
                />
                <div className="absolute inset-0 bg-brand/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                  <Sparkles size={20} className="text-white drop-shadow" />
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-emerald/15 px-2.5 py-0.5 font-mono text-[11px] font-semibold text-emerald border border-emerald/30">
                    Live Active Logo
                  </span>
                  <span className="text-xs text-muted">Instant Firebase Sync</span>
                </div>
                <h3 className="mt-1 font-display text-xl font-bold text-white flex items-center gap-2">
                  AI Virtual Assistant Logo & Avatar
                </h3>
                <p className="mt-1 text-xs text-muted max-w-md">
                  This picture appears on the floating chat launcher, chatbot header, Evans avatar, and incoming response bubbles across the platform.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={applyUploadedPreset}
                className="inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-brand/30 hover:bg-blue-500 transition-all hover:scale-[1.02]"
              >
                <Sparkles size={15} /> Set to Uploaded Neon Tech Logo
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileUpload}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/5 px-4 py-2.5 text-xs font-semibold text-white hover:bg-white/10 transition-colors"
              >
                <Upload size={14} /> Upload Custom Picture
              </button>
            </div>
          </div>
        </section>
      )}

      {GROUPS[which].map((g) => (
        <section key={g.title} className="rounded-2xl border border-white/10 bg-navy p-5 sm:p-6">
          <h3 className="mb-5 font-display text-xl font-semibold flex items-center justify-between">
            <span>{g.title}</span>
            <span className="text-[11px] font-mono text-muted font-normal">Auto-saves instantly</span>
          </h3>
          <div className="grid gap-4 sm:grid-cols-2">
            {g.fields.map((f) =>
              f.kind === 'toggle' ? (
                <div key={f.key} className="sm:col-span-2">
                  <Toggle
                    label={f.label}
                    checked={Boolean(val(f.key))}
                    onChange={(v) => setField(f.key, v, true)}
                  />
                </div>
              ) : (
                <Field key={f.key} label={f.label} hint={f.hint} className={f.kind === 'area' ? 'sm:col-span-2' : ''}>
                  {f.kind === 'area' ? (
                    <textarea
                      rows={3}
                      className={input}
                      value={String(val(f.key) ?? '')}
                      onChange={(e) => setField(f.key, e.target.value)}
                      onBlur={() => flushSave()}
                    />
                  ) : (
                    <input
                      className={input}
                      type={f.kind === 'url' ? 'url' : 'text'}
                      value={String(val(f.key) ?? '')}
                      onChange={(e) => setField(f.key, e.target.value)}
                      onBlur={() => flushSave()}
                    />
                  )}
                </Field>
              )
            )}
          </div>
        </section>
      ))}

      {/* Floating Status Bar with Instant Save Confirmation */}
      <div className="sticky bottom-0 -mx-1 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 bg-black/95 px-4 py-3.5 backdrop-blur-md rounded-b-2xl shadow-2xl">
        <div className="flex items-center gap-2.5 text-sm">
          {saveStatus === 'saving' && (
            <span className="flex items-center gap-2 text-brand font-medium animate-pulse">
              <Loader2 size={15} className="animate-spin" /> Saving changes to Firebase...
            </span>
          )}
          {saveStatus === 'saved' && (
            <span className="flex items-center gap-2 text-emerald font-medium">
              <Check size={16} /> Saved to Firebase instantly {lastSaved ? `(${lastSaved})` : ''}
            </span>
          )}
          {saveStatus === 'error' && (
            <span className="flex items-center gap-2 text-red-400 font-medium">
              Error saving. Please check your network or format.
            </span>
          )}
          {saveStatus === 'idle' && (
            <span className="text-muted text-xs">
              {dirty ? 'Typing... will auto-save to Firebase' : '✓ All adjustments saved to Firebase & live'}
            </span>
          )}
        </div>
        <div className="flex gap-2.5">
          <button
            className={btnGhost}
            disabled={!dirty || saveStatus === 'saving'}
            onClick={() => {
              if (debounceRef.current) clearTimeout(debounceRef.current);
              draftRef.current = {};
              setDraft({});
              setSaveStatus('idle');
            }}
          >
            Discard
          </button>
          <button
            className={btnPrimary}
            disabled={saveStatus === 'saving'}
            onClick={() => flushSave()}
          >
            {saveStatus === 'saving' ? 'Saving…' : 'Save to Firebase Now'}
          </button>
        </div>
      </div>
    </div>
  );
};

const Dashboard: React.FC<{ go: (t: AdminTab) => void }> = ({ go }) => {
  const { services, portfolio, reviews, inquiries, isFirebaseConnected, isLoading, seedStarterContent, deleteProject, deleteReview } = useSite();
  const { busy, run } = useAction();
  const [confirm, setConfirm] = useState(false);
  const real = portfolio.filter((p) => !p.id.startsWith('placeholder') && !isDemoContent(p.id));
  const demo = useMemo(() => [...portfolio.filter((p) => isDemoContent(p.id)).map((p) => ({ kind: 'p' as const, id: p.id })), ...reviews.filter((r) => isDemoContent(r.id)).map((r) => ({ kind: 'r' as const, id: r.id }))], [portfolio, reviews]);
  const review = services.filter(priceNeedsReview).length;
  const pending = reviews.filter((r) => r.status === 'pending').length;
  const stats = [{ label: 'Services', value: services.length, tab: 'services' as const }, { label: 'Projects', value: real.length, tab: 'portfolio' as const }, { label: 'Reviews', value: reviews.length, tab: 'reviews' as const }, { label: 'Enquiries', value: inquiries.length, tab: 'inquiries' as const }];
  if (isLoading) return <Spinner label="Loading content from Firebase…" />;
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">{stats.map((s) => <button key={s.label} onClick={() => go(s.tab)} className="rounded-2xl border border-white/10 bg-navy p-5 text-left hover:border-brand"><p className="font-display text-4xl font-bold">{s.value}</p><p className="mt-1 text-sm text-muted">{s.label}</p></button>)}</div>
      <div className="space-y-3">
        <p className={`flex items-center gap-2 rounded-xl border p-4 text-sm ${isFirebaseConnected ? 'border-emerald/40 text-emerald' : 'border-red-500/40 text-red-300'}`}>{isFirebaseConnected ? 'Connected to Firebase. Every change you save is stored in Firestore.' : 'Firebase connection problem. Changes may not be saved until it is restored.'}</p>
        {review > 0 && <button onClick={() => go('services')} className="flex w-full items-center gap-2 rounded-xl border border-amber/40 p-4 text-left text-sm text-amber"><AlertTriangle size={16} />{review} service(s) have no KSh price set and show as “Custom quote”. Click to review prices.</button>}
        {pending > 0 && <button onClick={() => go('reviews')} className="flex w-full items-center gap-2 rounded-xl border border-brand/40 p-4 text-left text-sm text-brand"><MessageSquareQuote size={16} />{pending} review(s) waiting for approval.</button>}
        {demo.length > 0 && <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber/40 p-4 text-sm text-amber"><span className="flex items-center gap-2"><AlertTriangle size={16} />{demo.length} fictional demo record(s) from the original template are still in Firebase (hidden from visitors).</span><button className={btnDanger} onClick={() => setConfirm(true)}>Delete demo records</button></div>}
        {services.length === 0 && <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/15 p-4 text-sm"><span>No services saved in Firebase yet.</span><button className={btnPrimary} disabled={busy} onClick={() => run(async () => `${await seedStarterContent()} items`, 'Starter content added to Firebase.')}>Add starter services</button></div>}
      </div>
      {confirm && <ConfirmDialog message={`Permanently delete ${demo.length} fictional demo record(s)?`} onCancel={() => setConfirm(false)} onConfirm={async () => { setConfirm(false); await run(async () => { for (const d of demo) { if (d.kind === 'p') await deleteProject(d.id); else await deleteReview(d.id); } }, 'Demo records deleted.'); }} />}
    </div>
  );
};

const Backup: React.FC = () => {
  const { exportBackup, importBackup, seedStarterContent } = useSite();
  const { busy, run } = useAction();
  const [pending, setPending] = useState<string | null>(null);
  const download = () => { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([exportBackup()], { type: 'application/json' })); a.download = `emg-backup-${new Date().toISOString().slice(0, 10)}.json`; a.click(); };
  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-white/10 bg-navy p-6"><h3 className="font-display text-xl font-semibold">Export backup</h3><p className="mt-2 text-sm text-muted">Download your settings, services, projects and reviews as a JSON file.</p><button className={`${btnPrimary} mt-4`} onClick={download}>Download backup</button></section>
      <section className="rounded-2xl border border-white/10 bg-navy p-6"><h3 className="font-display text-xl font-semibold">Restore from backup</h3><p className="mt-2 text-sm text-muted">Records in the file replace records with the same ID. Nothing else is deleted.</p>
        <input type="file" accept="application/json" className="mt-4 block text-sm" onChange={async (e) => { const f = e.target.files?.[0]; if (f) setPending(await f.text()); e.target.value = ''; }} /></section>
      <section className="rounded-2xl border border-white/10 bg-navy p-6"><h3 className="font-display text-xl font-semibold">Add starter content</h3><p className="mt-2 text-sm text-muted">Adds the default services and estimator only where they do not exist. Existing data is never overwritten.</p><button className={`${btnGhost} mt-4`} disabled={busy} onClick={() => run(async () => seedStarterContent(), 'Starter content added.')}>Add missing starter content</button></section>
      {pending && <ConfirmDialog confirmLabel="Restore" message="Restore this backup into Firebase? Matching records will be overwritten." onCancel={() => setPending(null)} onConfirm={async () => { const j = pending; setPending(null); await run(() => importBackup(j), 'Backup restored.'); }} />}
    </div>
  );
};

const TABS: { id: AdminTab; label: string; icon: React.ReactNode }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: <BarChart3 size={18} /> }, { id: 'content', label: 'Content', icon: <FileText size={18} /> },
  { id: 'services', label: 'Services', icon: <Layers size={18} /> }, { id: 'portfolio', label: 'Portfolio', icon: <Briefcase size={18} /> },
  { id: 'reviews', label: 'Reviews', icon: <MessageSquareQuote size={18} /> }, { id: 'inquiries', label: 'Enquiries', icon: <Inbox size={18} /> },
  { id: 'estimator', label: 'Estimator', icon: <Calculator size={18} /> }, { id: 'settings', label: 'Settings', icon: <SettingsIcon size={18} /> }, { id: 'backup', label: 'Backup', icon: <Database size={18} /> },
];

export const AdminPanel: React.FC = () => {
  const { setIsAdminOpen, activeAdminTab, setActiveAdminTab, currentUser, isAdmin, isAuthChecking, loginWithGoogle, logoutUser } = useSite();
  const [loginErr, setLoginErr] = useState('');
  useEffect(() => { const k = (e: KeyboardEvent) => e.key === 'Escape' && setIsAdminOpen(false); document.addEventListener('keydown', k); document.body.style.overflow = 'hidden'; return () => { document.removeEventListener('keydown', k); document.body.style.overflow = ''; }; }, [setIsAdminOpen]);

  const body = (() => {
    if (isAuthChecking) return <Spinner label="Checking sign-in…" />;
    if (!currentUser) return (
      <div className="mx-auto max-w-sm py-16 text-center">
        <LogIn className="mx-auto mb-4 text-brand" size={36} /><h2 className="font-display text-2xl font-bold">Administrator sign-in</h2>
        <p className="mt-2 text-sm text-muted">Sign in with the Google account authorised to manage this website.</p>
        <button className={`${btnPrimary} mt-6 w-full`} onClick={() => loginWithGoogle().catch((e: Error) => setLoginErr(e.message))}>Sign in with Google</button>
        {loginErr && <p role="alert" className="mt-4 text-sm text-red-300">{loginErr}</p>}
      </div>);
    if (!isAdmin) return (
      <div className="mx-auto max-w-md py-16 text-center">
        <ShieldAlert className="mx-auto mb-4 text-red-400" size={36} /><h2 className="font-display text-2xl font-bold">Not authorised</h2>
        <p className="mt-2 text-sm text-muted">{currentUser.email} is not an administrator account for this website.</p><button className={`${btnGhost} mt-6`} onClick={() => logoutUser()}>Sign out</button>
      </div>);
    return (
      <>
        {activeAdminTab === 'dashboard' && <Dashboard go={setActiveAdminTab} />}
        {activeAdminTab === 'content' && <SettingsForm key="content" which="content" />}
        {activeAdminTab === 'settings' && <SettingsForm key="settings" which="settings" />}
        {activeAdminTab === 'services' && <ServicesManager />}
        {activeAdminTab === 'portfolio' && <PortfolioManager />}
        {activeAdminTab === 'reviews' && <ReviewsManager />}
        {activeAdminTab === 'inquiries' && <InquiriesManager />}
        {activeAdminTab === 'estimator' && <EstimatorManager />}
        {activeAdminTab === 'backup' && <Backup />}
      </>);
  })();

  return (
    <div className="fixed inset-0 z-[120] flex flex-col bg-black" role="dialog" aria-modal="true" aria-label="Admin dashboard">
      <header className="flex items-center justify-between border-b border-white/10 bg-navy px-4 py-3 sm:px-6">
        <div className="flex items-center gap-3"><img src="/assets/emg-logo-dark.webp" alt="EMG WEB SOLUTIONS" width={48} height={46} className="h-11 w-auto" /><span className="hidden font-display text-lg font-bold sm:block">Admin</span></div>
        <div className="flex items-center gap-2">
          {currentUser && <span className="hidden text-xs text-muted md:block">{currentUser.email}</span>}
          {currentUser && <button className={btnGhost} onClick={() => logoutUser()}><LogOut size={16} /><span className="hidden sm:inline">Sign out</span></button>}
          <button className={btnGhost} onClick={() => setIsAdminOpen(false)} aria-label="Close admin"><X size={18} /></button>
        </div>
      </header>
      <div className="flex min-h-0 flex-1 flex-col md:flex-row">
        {isAdmin && (
          <nav aria-label="Admin sections" className="no-scrollbar flex shrink-0 gap-1 overflow-x-auto border-b border-white/10 p-2 md:w-52 md:flex-col md:border-b-0 md:border-r md:p-3">
            {TABS.map((t) => <button key={t.id} onClick={() => setActiveAdminTab(t.id)} aria-current={activeAdminTab === t.id} className={`flex min-h-11 shrink-0 items-center gap-2.5 rounded-lg px-3.5 text-sm font-semibold transition-colors ${activeAdminTab === t.id ? 'bg-brand text-white' : 'text-muted hover:bg-white/5 hover:text-white'}`}>{t.icon}{t.label}</button>)}
          </nav>
        )}
        <main className="min-w-0 flex-1 overflow-y-auto p-4 sm:p-8"><div className="mx-auto max-w-4xl">{body}</div></main>
      </div>
    </div>
  );
};
