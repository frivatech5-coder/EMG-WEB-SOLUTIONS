import React, { useMemo, useState } from 'react';
import { Calculator, Check, MessageCircle, ArrowUpRight } from 'lucide-react';
import { useSite } from '../context/SiteContext';
import { formatKsh, waLink } from '../lib/format';
import { Reveal, SectionTitle } from './Reveal';
import { EstimatorOption } from '../types';

export const CostCalculator: React.FC<{ onBookScope: (summary: string) => void }> = ({ onBookScope }) => {
  const { settings, estimator } = useSite();
  const [type, setType] = useState(estimator.types[1]?.id || estimator.types[0]?.id);
  const [pages, setPages] = useState(estimator.pages[0]?.id);
  const [addons, setAddons] = useState<string[]>([]);

  const picked = useMemo(() => {
    const t = estimator.types.find((x) => x.id === type) || estimator.types[0];
    const p = estimator.pages.find((x) => x.id === pages) || estimator.pages[0];
    return [t, p, ...estimator.addons.filter((a) => addons.includes(a.id))].filter(Boolean) as EstimatorOption[];
  }, [estimator, type, pages, addons]);
  const known = picked.reduce((s, o) => s + (o.priceKsh || 0), 0);
  const complete = picked.every((o) => typeof o.priceKsh === 'number');
  const summary = `Project plan: ${picked.map((o) => o.label).join(', ')}.${complete ? ` Estimated total ${formatKsh(known)}.` : ' Please send me a quotation.'}`;
  const price = (o: EstimatorOption) => (typeof o.priceKsh !== 'number' ? 'Quote' : o.priceKsh === 0 ? 'Included' : `+${formatKsh(o.priceKsh)}`);
  const opt = (active: boolean) => `rounded-xl border p-4 text-left transition-colors ${active ? 'border-brand bg-brand/10' : 'border-white/10 bg-black hover:border-white/30'}`;

  return (
    <section id="estimator" className="border-t border-white/10 px-5 py-24 sm:px-8 lg:py-32">
      <div className="mx-auto max-w-7xl">
        <SectionTitle title={settings.estimatorTitle} intro="Choose what you need and we will send you a clear quotation. Prices are in Kenyan Shillings (KSh)." />
        <Reveal className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
          <div className="space-y-8 rounded-2xl border border-white/10 bg-navy p-6 sm:p-8">
            <fieldset><legend className="mb-3 font-mono text-xs uppercase tracking-wider text-muted">1. Type of project</legend>
              <div className="grid gap-3 sm:grid-cols-2">{estimator.types.map((o) => (
                <button key={o.id} type="button" aria-pressed={type === o.id} onClick={() => setType(o.id)} className={opt(type === o.id)}>
                  <span className="flex items-center justify-between gap-2 font-semibold">{o.label}<span className="font-mono text-xs text-brand">{typeof o.priceKsh === 'number' ? formatKsh(o.priceKsh) : 'Quote'}</span></span>
                  {o.note && <span className="mt-1 block text-sm text-muted">{o.note}</span>}
                </button>))}</div></fieldset>
            <fieldset><legend className="mb-3 font-mono text-xs uppercase tracking-wider text-muted">2. Size</legend>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">{estimator.pages.map((o) => (
                <button key={o.id} type="button" aria-pressed={pages === o.id} onClick={() => setPages(o.id)} className={`${opt(pages === o.id)} text-center`}>
                  <span className="block text-sm font-semibold">{o.label}</span><span className="font-mono text-[11px] text-muted">{price(o)}</span>
                </button>))}</div></fieldset>
            <fieldset><legend className="mb-3 font-mono text-xs uppercase tracking-wider text-muted">3. Extras</legend>
              <div className="grid gap-3 sm:grid-cols-2">{estimator.addons.map((o) => {
                const on = addons.includes(o.id);
                return (<button key={o.id} type="button" role="checkbox" aria-checked={on} onClick={() => setAddons((p) => (on ? p.filter((x) => x !== o.id) : [...p, o.id]))} className={`${opt(on)} flex items-center justify-between gap-3`}>
                  <span className="flex items-center gap-3"><span className={`grid h-5 w-5 place-items-center rounded border ${on ? 'border-brand bg-brand' : 'border-white/30'}`}>{on && <Check size={14} />}</span><span className="text-sm font-semibold">{o.label}</span></span>
                  <span className="font-mono text-[11px] text-muted">{price(o)}</span></button>);
              })}</div></fieldset>
          </div>
          <aside className="h-fit rounded-2xl border border-brand/40 bg-gradient-to-b from-navy-2 to-navy p-6 sm:p-8 lg:sticky lg:top-28">
            <p className="flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-muted"><Calculator size={14} /> Your plan</p>
            <ul className="mt-4 space-y-2 text-sm">{picked.map((o) => <li key={o.id} className="flex justify-between gap-3"><span>{o.label}</span><span className="font-mono text-muted">{price(o)}</span></li>)}</ul>
            <div className="mt-6 border-t border-white/10 pt-6">
              {complete ? (<><p className="text-sm text-muted">Estimated total</p><p className="font-display text-4xl font-bold">{formatKsh(known)}</p><p className="mt-2 text-xs text-muted">Final price is confirmed after a short consultation.</p></>)
                : (<><p className="font-display text-2xl font-bold">Custom quotation</p><p className="mt-2 text-sm text-muted">We will confirm the price in KSh after discussing your requirements.{known > 0 && ` Items already priced: ${formatKsh(known)}.`}</p></>)}
            </div>
            <button onClick={() => onBookScope(summary)} className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-brand px-6 py-4 font-bold text-white">REQUEST THIS QUOTE <ArrowUpRight size={18} /></button>
            <a href={waLink(settings.whatsapp || settings.phone, summary)} target="_blank" rel="noopener noreferrer" className="mt-3 flex w-full items-center justify-center gap-2 rounded-full border border-emerald/50 px-6 py-3.5 font-bold text-emerald hover:bg-emerald hover:text-black"><MessageCircle size={18} /> SEND ON WHATSAPP</a>
          </aside>
        </Reveal>
      </div>
    </section>
  );
};
