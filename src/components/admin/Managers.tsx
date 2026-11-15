import React, { useMemo, useState } from 'react';
import { Check, EyeOff, Mail, MessageCircle, Pencil, Plus, Trash2, ExternalLink, Star } from 'lucide-react';
import { useSite } from '../../context/SiteContext';
import { EstimatorConfig, EstimatorOption, GoogleReview, Project, Service } from '../../types';
import { formatKsh, isHttpUrl, priceLabel, priceNeedsReview, waLink } from '../../lib/format';
import { ConfirmDialog, Field, ImageField, Spinner, Toggle, btn, btnDanger, btnGhost, btnPrimary, input, useAction } from './ui';
import { toast } from '../../lib/toast';

const lines = (t: string) => t.split('\n').map((l) => l.trim()).filter(Boolean);
const Header: React.FC<{ title: string; action?: React.ReactNode; note?: string }> = ({ title, action, note }) => (
  <div className="mb-6 flex flex-wrap items-start justify-between gap-3"><div><h2 className="font-display text-2xl font-bold">{title}</h2>{note && <p className="mt-1 text-sm text-muted">{note}</p>}</div>{action}</div>
);
const Card: React.FC<{ children: React.ReactNode }> = ({ children }) => <div className="rounded-2xl border border-white/10 bg-navy p-4 sm:p-5">{children}</div>;

/* ───────────── Services ───────────── */
const ICONS = ['Code', 'RefreshCcw', 'ShoppingBag', 'Layout', 'Search', 'Share2', 'Palette', 'Gauge', 'ShieldCheck'];
type SForm = { id?: string; name: string; icon: string; shortDesc: string; fullDesc: string; featuresText: string; priceText: string; quoteOnly: boolean; deliveryTime: string; popular: boolean; order: string };
const toSForm = (s?: Service): SForm => ({ id: s?.id, name: s?.name || '', icon: s?.icon || 'Code', shortDesc: s?.shortDesc || '', fullDesc: s?.fullDesc || '', featuresText: (s?.features || []).join('\n'), priceText: s?.priceKsh ? String(s.priceKsh) : '', quoteOnly: !!s?.quoteOnly, deliveryTime: s?.deliveryTime || '', popular: !!s?.popular, order: s?.order ? String(s.order) : '' });

export const ServicesManager: React.FC = () => {
  const { services, saveService, deleteService, isLoading } = useSite();
  const { busy, run } = useAction();
  const [f, setF] = useState<SForm | null>(null);
  const [del, setDel] = useState<Service | null>(null);
  const set = <K extends keyof SForm>(k: K, v: SForm[K]) => setF((p) => (p ? { ...p, [k]: v } : p));

  const save = async () => {
    if (!f) return;
    const price = f.priceText.replace(/[,\s]/g, '');
    if (!f.name.trim() || !f.shortDesc.trim()) return void toast('error', 'Name and short description are required.');
    if (price && !/^\d+$/.test(price)) return void toast('error', 'Price must be a whole number in KSh, e.g. 15000.');
    const features = lines(f.featuresText);
    const ok = await run(() => saveService({
      id: f.id, name: f.name.trim(), icon: f.icon, shortDesc: f.shortDesc.trim(), fullDesc: f.fullDesc.trim() || f.shortDesc.trim(), features, deliverables: features.slice(0, 3),
      priceKsh: price ? Number(price) : null, quoteOnly: f.quoteOnly, deliveryTime: f.deliveryTime.trim(), popular: f.popular, order: f.order ? Number(f.order) : undefined,
    }), 'Service saved to Firebase.');
    if (ok !== undefined) setF(null);
  };

  if (f) return (
    <div>
      <Header title={f.id ? 'Edit service' : 'Add service'} />
      <Card><div className="grid gap-4 sm:grid-cols-2">
        <Field label="Service name"><input className={input} value={f.name} onChange={(e) => set('name', e.target.value)} maxLength={80} /></Field>
        <Field label="Icon"><select className={input} value={f.icon} onChange={(e) => set('icon', e.target.value)}>{ICONS.map((i) => <option key={i}>{i}</option>)}</select></Field>
        <Field label="Short description" className="sm:col-span-2"><textarea rows={2} className={input} value={f.shortDesc} onChange={(e) => set('shortDesc', e.target.value)} maxLength={220} /></Field>
        <Field label="Full description" className="sm:col-span-2"><textarea rows={3} className={input} value={f.fullDesc} onChange={(e) => set('fullDesc', e.target.value)} /></Field>
        <Field label="Features (one per line)" className="sm:col-span-2"><textarea rows={4} className={input} value={f.featuresText} onChange={(e) => set('featuresText', e.target.value)} /></Field>
        <Field label="Starting price (KSh)" hint="Whole number, e.g. 15000. Leave empty if not decided yet."><input inputMode="numeric" className={input} value={f.priceText} onChange={(e) => set('priceText', e.target.value)} placeholder="e.g. 15000" /></Field>
        <Field label="Delivery time"><input className={input} value={f.deliveryTime} onChange={(e) => set('deliveryTime', e.target.value)} placeholder="e.g. 7 - 14 days" /></Field>
        <Field label="Display order"><input inputMode="numeric" className={input} value={f.order} onChange={(e) => set('order', e.target.value.replace(/\D/g, ''))} /></Field>
        <div className="flex flex-col justify-end gap-1"><Toggle label="Custom quotation only (hide price)" checked={f.quoteOnly} onChange={(v) => set('quoteOnly', v)} /><Toggle label="Mark as popular" checked={f.popular} onChange={(v) => set('popular', v)} /></div>
      </div>
      <div className="mt-6 flex justify-end gap-3"><button className={btnGhost} onClick={() => setF(null)} disabled={busy}>Cancel</button><button className={btnPrimary} onClick={save} disabled={busy}>{busy ? 'Saving…' : 'Save service'}</button></div></Card>
    </div>);

  return (
    <div>
      <Header title="Services" note="Prices are in Kenyan Shillings and appear on the website immediately after saving." action={<button className={btnPrimary} onClick={() => setF(toSForm())}><Plus size={16} />Add service</button>} />
      {isLoading ? <Spinner /> : services.length === 0 ? <p className="text-muted">No services yet.</p> : (
        <div className="space-y-3">{services.map((s) => (
          <Card key={s.id}><div className="flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0"><p className="font-semibold">{s.name}</p><p className="mt-1 text-sm text-muted">{priceLabel(s)}{priceNeedsReview(s) && <span className="ml-2 rounded bg-amber/15 px-2 py-0.5 font-mono text-[11px] text-amber">price needs review</span>}</p></div>
            <div className="flex gap-2"><button className={btnGhost} onClick={() => setF(toSForm(s))}><Pencil size={15} />Edit</button><button className={btnDanger} onClick={() => setDel(s)} aria-label={`Delete ${s.name}`}><Trash2 size={15} /></button></div>
          </div></Card>))}</div>)}
      {del && <ConfirmDialog message={`Delete the service “${del.name}”? This cannot be undone.`} onCancel={() => setDel(null)} onConfirm={async () => { const d = del; setDel(null); await run(() => deleteService(d.id), 'Service deleted.'); }} />}
    </div>
  );
};

/* ───────────── Portfolio ───────────── */
type PForm = { id?: string; title: string; category: string; client: string; year: string; description: string; techText: string; liveUrl: string; image: string; featured: boolean };
const toPForm = (p?: Project): PForm => ({ id: p?.id, title: p?.title || '', category: p?.category || '', client: p?.client || '', year: p?.year || '', description: p?.description || '', techText: (p?.techStack || []).join(', '), liveUrl: p?.liveUrl || '', image: p?.image || '', featured: !!p?.featured });

export const PortfolioManager: React.FC = () => {
  const { portfolio, saveProject, deleteProject, isLoading } = useSite();
  const { busy, run } = useAction();
  const [f, setF] = useState<PForm | null>(null);
  const [del, setDel] = useState<Project | null>(null);
  const list = portfolio.filter((p) => !p.id.startsWith('placeholder'));
  const set = <K extends keyof PForm>(k: K, v: PForm[K]) => setF((p) => (p ? { ...p, [k]: v } : p));
  const save = async () => {
    if (!f) return;
    if (!f.title.trim() || !f.category.trim() || !f.description.trim()) return void toast('error', 'Title, category and description are required.');
    if (f.liveUrl && !isHttpUrl(f.liveUrl)) return void toast('error', 'Live URL must start with https://');
    if (f.image && !isHttpUrl(f.image)) return void toast('error', 'Image must be an https:// URL or an upload.');
    const old = portfolio.find((p) => p.id === f.id);
    const ok = await run(() => saveProject({
      id: f.id, title: f.title.trim(), category: f.category.trim(), client: f.client.trim(), year: f.year.trim(), description: f.description.trim(), image: f.image.trim(), liveUrl: f.liveUrl.trim(),
      techStack: f.techText.split(',').map((t) => t.trim()).filter(Boolean), featured: f.featured, challenge: old?.challenge || '', solution: old?.solution || '', outcome: old?.outcome || '', metrics: old?.metrics || [],
    }), 'Project saved to Firebase.');
    if (ok !== undefined) setF(null);
  };
  if (f) return (
    <div><Header title={f.id && !f.id.startsWith('placeholder') ? 'Edit project' : 'Add project'} />
      <Card><div className="grid gap-4 sm:grid-cols-2">
        <Field label="Project name"><input className={input} value={f.title} onChange={(e) => set('title', e.target.value)} maxLength={100} /></Field>
        <Field label="Industry / category"><input className={input} value={f.category} onChange={(e) => set('category', e.target.value)} maxLength={60} /></Field>
        <Field label="Client (optional)"><input className={input} value={f.client} onChange={(e) => set('client', e.target.value)} /></Field>
        <Field label="Year (optional)"><input className={input} value={f.year} onChange={(e) => set('year', e.target.value)} /></Field>
        <Field label="Description" className="sm:col-span-2"><textarea rows={3} className={input} value={f.description} onChange={(e) => set('description', e.target.value)} /></Field>
        <Field label="Technologies (comma separated)" className="sm:col-span-2"><input className={input} value={f.techText} onChange={(e) => set('techText', e.target.value)} placeholder="React, Firebase, Tailwind" /></Field>
        <Field label="Live website URL" className="sm:col-span-2" hint="If you leave the image empty, a screenshot of this URL is used automatically."><input type="url" className={input} value={f.liveUrl} onChange={(e) => set('liveUrl', e.target.value)} placeholder="https://" /></Field>
        <div className="sm:col-span-2"><ImageField value={f.image} onChange={(v) => set('image', v)} folder="portfolio" /></div>
        <div className="sm:col-span-2"><Toggle label="Featured project (shown first)" checked={f.featured} onChange={(v) => set('featured', v)} /></div>
      </div><div className="mt-6 flex justify-end gap-3"><button className={btnGhost} onClick={() => setF(null)} disabled={busy}>Cancel</button><button className={btnPrimary} onClick={save} disabled={busy}>{busy ? 'Saving…' : 'Save project'}</button></div></Card></div>);
  return (
    <div><Header title="Portfolio" note="Only add genuine, completed projects." action={<button className={btnPrimary} onClick={() => setF(toPForm())}><Plus size={16} />Add project</button>} />
      {isLoading ? <Spinner /> : list.length === 0 ? <p className="text-muted">No projects yet. The website shows placeholder cards until you add one.</p> : (
        <div className="space-y-3">{list.map((p) => (
          <Card key={p.id}><div className="flex flex-wrap items-center gap-4">
            {p.image ? <img src={p.image} alt="" className="h-14 w-20 rounded-md object-cover" loading="lazy" /> : <div className="grid h-14 w-20 place-items-center rounded-md bg-white/5 text-xs text-muted">No image</div>}
            <div className="min-w-0 flex-1"><p className="font-semibold">{p.title}{p.featured && <span className="ml-2 rounded bg-brand/20 px-2 py-0.5 font-mono text-[11px] text-brand">featured</span>}</p><p className="text-sm text-muted">{p.category}</p></div>
            <div className="flex gap-2">{isHttpUrl(p.liveUrl) && <a href={p.liveUrl} target="_blank" rel="noopener noreferrer" className={btnGhost} aria-label="Open live site"><ExternalLink size={15} /></a>}<button className={btnGhost} onClick={() => setF(toPForm(p))}><Pencil size={15} />Edit</button><button className={btnDanger} onClick={() => setDel(p)} aria-label={`Delete ${p.title}`}><Trash2 size={15} /></button></div>
          </div></Card>))}</div>)}
      {del && <ConfirmDialog message={`Delete the project “${del.title}”? This cannot be undone.`} onCancel={() => setDel(null)} onConfirm={async () => { const d = del; setDel(null); await run(() => deleteProject(d.id), 'Project deleted.'); }} />}
    </div>
  );
};

/* ───────────── Reviews ───────────── */
export const ReviewsManager: React.FC = () => {
  const { reviews, updateReview, deleteReview, addManualReview, isLoading } = useSite();
  const { busy, run } = useAction();
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'hidden'>('all');
  const [del, setDel] = useState<GoogleReview | null>(null);
  const [reply, setReply] = useState<Record<string, string>>({});
  const [adding, setAdding] = useState(false);
  const [g, setG] = useState({ name: '', rating: 5, service: '', text: '', confirm: false });
  const st = (r: GoogleReview) => r.status ?? 'pending';
  const list = useMemo(() => [...reviews].sort((a, b) => ((b as { createdAt?: string }).createdAt || b.date || '').localeCompare((a as { createdAt?: string }).createdAt || a.date || '')).filter((r) => filter === 'all' || st(r) === filter), [reviews, filter]);
  const badge = (r: GoogleReview) => r.source === 'google' && r.verifiedGoogleReview ? 'Verified Google review' : 'Customer review';

  const addGoogle = async () => {
    if (!g.confirm) return void toast('error', 'Please confirm this is a genuine Google review.');
    if (g.name.trim().length < 2 || g.text.trim().length < 5) return void toast('error', 'Name and review text are required.');
    const ok = await run(() => addManualReview({ authorName: g.name.trim(), rating: g.rating, reviewText: g.text.trim(), serviceReviewed: g.service.trim() || 'Website', date: new Date().toISOString(), source: 'google', status: 'approved', verifiedGoogleReview: true }), 'Google review added.');
    if (ok !== undefined) { setAdding(false); setG({ name: '', rating: 5, service: '', text: '', confirm: false }); }
  };

  return (
    <div>
      <Header title="Reviews" note="Customer-submitted reviews stay hidden until you approve them. They are never posted to Google." action={<button className={btnGhost} onClick={() => setAdding((a) => !a)}><Plus size={16} />Add verified Google review</button>} />
      {adding && <div className="mb-6"><Card><div className="grid gap-4 sm:grid-cols-2">
        <Field label="Reviewer name"><input className={input} value={g.name} onChange={(e) => setG({ ...g, name: e.target.value })} maxLength={80} /></Field>
        <Field label="Rating"><select className={input} value={g.rating} onChange={(e) => setG({ ...g, rating: Number(e.target.value) })}>{[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n} stars</option>)}</select></Field>
        <Field label="Service (optional)" className="sm:col-span-2"><input className={input} value={g.service} onChange={(e) => setG({ ...g, service: e.target.value })} /></Field>
        <Field label="Review text (copy exactly from Google)" className="sm:col-span-2"><textarea rows={3} className={input} value={g.text} onChange={(e) => setG({ ...g, text: e.target.value })} maxLength={1500} /></Field>
        <div className="sm:col-span-2"><Toggle label="I confirm this is a genuine review posted on Google" checked={g.confirm} onChange={(v) => setG({ ...g, confirm: v })} /></div>
      </div><div className="mt-4 flex justify-end"><button className={btnPrimary} disabled={busy} onClick={addGoogle}>Add review</button></div></Card></div>}
      <div className="mb-5 flex flex-wrap gap-2">{(['all', 'pending', 'approved', 'hidden'] as const).map((k) => <button key={k} onClick={() => setFilter(k)} className={`${btn} ${filter === k ? 'bg-brand text-white' : 'border border-white/15 text-muted'}`}>{k[0].toUpperCase() + k.slice(1)} ({k === 'all' ? reviews.length : reviews.filter((r) => st(r) === k).length})</button>)}</div>
      {isLoading ? <Spinner /> : list.length === 0 ? <p className="text-muted">No reviews here.</p> : (
        <div className="space-y-3">{list.map((r) => (
          <Card key={r.id}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div><p className="font-semibold">{r.authorName} <span className="ml-1 inline-flex text-gold">{Array.from({ length: r.rating }).map((_, i) => <Star key={i} size={13} fill="currentColor" />)}</span></p><p className="text-xs text-muted">{r.serviceReviewed} · {badge(r)} · <span className="uppercase">{st(r)}</span></p></div>
              <div className="flex flex-wrap gap-2">
                {st(r) !== 'approved' && <button className={btnPrimary} disabled={busy} onClick={() => run(() => updateReview(r.id, { status: 'approved' }), 'Review approved and published.')}><Check size={15} />Approve</button>}
                {st(r) !== 'hidden' && <button className={btnGhost} disabled={busy} onClick={() => run(() => updateReview(r.id, { status: 'hidden' }), 'Review hidden.')}><EyeOff size={15} />Hide</button>}
                <button className={btnDanger} onClick={() => setDel(r)} aria-label="Delete review"><Trash2 size={15} /></button>
              </div>
            </div>
            <p className="mt-3 whitespace-pre-line text-sm text-white/90">{r.reviewText}</p>
            <div className="mt-4"><Field label="Public response from your business"><div className="flex gap-2"><input className={input} value={reply[r.id] ?? r.responseFromOwner?.text ?? ''} onChange={(e) => setReply({ ...reply, [r.id]: e.target.value })} maxLength={500} /><button className={btnGhost} disabled={busy || reply[r.id] === undefined} onClick={() => run(() => updateReview(r.id, { responseFromOwner: { text: reply[r.id].trim(), date: new Date().toISOString() } }), 'Response saved.')}>Save</button></div></Field></div>
          </Card>))}</div>)}
      {del && <ConfirmDialog message={`Delete the review from ${del.authorName}? This cannot be undone.`} onCancel={() => setDel(null)} onConfirm={async () => { const d = del; setDel(null); await run(() => deleteReview(d.id), 'Review deleted.'); }} />}
    </div>
  );
};

/* ───────────── Enquiries ───────────── */
export const InquiriesManager: React.FC = () => {
  const { inquiries, deleteInquiry, settings } = useSite();
  const { run } = useAction();
  const [del, setDel] = useState<string | null>(null);
  return (
    <div><Header title="Enquiries" note="Messages sent through the website contact form." />
      {inquiries.length === 0 ? <p className="text-muted">No enquiries yet.</p> : (
        <div className="space-y-3">{inquiries.map((q) => (
          <Card key={q.id}>
            <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="font-semibold">{q.name}</p><p className="text-xs text-muted">{new Date(q.createdAt).toLocaleString()} · {q.service || 'General'}</p></div>
              <div className="flex gap-2"><a className={btnGhost} href={`mailto:${q.email}?subject=${encodeURIComponent(`Re: your enquiry to ${settings.companyName}`)}`}><Mail size={15} />Email</a>{q.phone && q.phone !== 'Not provided' && <a className={btnGhost} target="_blank" rel="noopener noreferrer" href={waLink(q.phone, `Hello ${q.name}, thanks for contacting ${settings.companyName}.`)}><MessageCircle size={15} />WhatsApp</a>}<button className={btnDanger} onClick={() => setDel(q.id)} aria-label="Delete enquiry"><Trash2 size={15} /></button></div></div>
            <p className="mt-2 text-sm text-muted">{q.email}{q.phone && q.phone !== 'Not provided' ? ` · ${q.phone}` : ''}</p>
            <p className="mt-3 whitespace-pre-line text-sm">{q.message}</p>
          </Card>))}</div>)}
      {del && <ConfirmDialog message="Delete this enquiry permanently?" onCancel={() => setDel(null)} onConfirm={async () => { const d = del; setDel(null); await run(() => deleteInquiry(d), 'Enquiry deleted.'); }} />}
    </div>
  );
};

/* ───────────── Estimator ───────────── */
export const EstimatorManager: React.FC = () => {
  const { estimator, updateSettings } = useSite();
  const [d, setD] = useState<EstimatorConfig>(() => JSON.parse(JSON.stringify(estimator)));
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const dRef = React.useRef(d);
  dRef.current = d;
  const dirtyRef = React.useRef(false);
  const timerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const groups: { key: keyof EstimatorConfig; title: string }[] = [{ key: 'types', title: 'Project types' }, { key: 'pages', title: 'Sizes' }, { key: 'addons', title: 'Extras' }];

  React.useEffect(() => {
    if (!dirtyRef.current) {
      setD(JSON.parse(JSON.stringify(estimator)));
    }
  }, [estimator]);

  const persist = React.useCallback(async (next: EstimatorConfig, silent = false) => {
    if (groups.some((g) => next[g.key].some((o) => !o.label.trim())) || !next.types.length || !next.pages.length) {
      if (!silent) toast('error', 'Every option needs a label, and at least one type and size are required.');
      return;
    }
    setSaveStatus('saving');
    try {
      await updateSettings({ estimator: next });
      dirtyRef.current = false;
      setSaveStatus('saved');
      if (!silent) toast('success', 'Estimator saved to Firebase.');
    } catch (e) {
      setSaveStatus('error');
      toast('error', `Not saved: ${(e as Error).message}`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [updateSettings]);

  React.useEffect(() => () => {
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  const scheduleSave = (next: EstimatorConfig, immediate = false) => {
    dirtyRef.current = true;
    dRef.current = next;
    setD(next);
    if (timerRef.current) clearTimeout(timerRef.current);
    if (immediate) {
      void persist(next, true);
      return;
    }
    setSaveStatus('idle');
    timerRef.current = setTimeout(() => {
      void persist(dRef.current, true);
    }, 600);
  };

  const edit = (g: keyof EstimatorConfig, i: number, patch: Partial<EstimatorOption>) => {
    const next = { ...dRef.current, [g]: dRef.current[g].map((o, k) => (k === i ? { ...o, ...patch } : o)) };
    scheduleSave(next);
  };

  return (
    <div>
      <Header
        title="Estimator prices (KSh)"
        note="Leave a price empty to show “Quote” for that option. Changes auto-save to Firebase and update the calculator immediately."
      />
      <div className="space-y-6">{groups.map((g) => (
        <Card key={g.key}><h3 className="mb-4 font-display text-lg font-semibold">{g.title}</h3><div className="space-y-3">
          {d[g.key].map((o, i) => (
            <div key={o.id} className="grid gap-2 sm:grid-cols-[1.5fr_1fr_auto]">
              <input className={input} value={o.label} onChange={(e) => edit(g.key, i, { label: e.target.value })} onBlur={() => void persist(dRef.current, true)} aria-label="Label" maxLength={80} />
              <input className={input} inputMode="numeric" placeholder="Price KSh (empty = quote)" value={o.priceKsh === null ? '' : String(o.priceKsh)} onChange={(e) => { const v = e.target.value.replace(/\D/g, ''); edit(g.key, i, { priceKsh: v === '' ? null : Number(v) }); }} onBlur={() => void persist(dRef.current, true)} aria-label="Price in KSh" />
              <button className={btnDanger} onClick={() => { const next = { ...dRef.current, [g.key]: dRef.current[g.key].filter((_, k) => k !== i) }; scheduleSave(next, true); }} aria-label="Remove option"><Trash2 size={15} /></button>
            </div>))}
          <button className={btnGhost} onClick={() => { const next = { ...dRef.current, [g.key]: [...dRef.current[g.key], { id: `o-${Date.now().toString(36)}`, label: 'New option', priceKsh: null }] }; scheduleSave(next, true); }}><Plus size={15} />Add option</button>
        </div>{g.key === 'types' && d.types.some((o) => typeof o.priceKsh === 'number') && <p className="mt-3 text-xs text-muted">Example: {formatKsh(d.types.find((o) => typeof o.priceKsh === 'number')!.priceKsh as number)}</p>}</Card>))}
      </div>
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <span className="text-xs text-muted">
          {saveStatus === 'saving' ? 'Saving to Firebase…' : saveStatus === 'saved' ? '✓ Saved to Firebase & live' : saveStatus === 'error' ? 'Failed to save — check your entries' : 'Auto-saves on change'}
        </span>
        <button className={btnPrimary} disabled={saveStatus === 'saving'} onClick={() => void persist(dRef.current, false)}>{saveStatus === 'saving' ? 'Saving…' : 'Save to Firebase'}</button>
      </div>
    </div>
  );
};
