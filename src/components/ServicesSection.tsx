import React from 'react';
import { ArrowUpRight, Clock, Code, Gauge, Layout, Palette, RefreshCcw, Search, Share2, ShieldCheck, ShoppingBag, Sparkles, type LucideIcon } from 'lucide-react';
import { useSite } from '../context/SiteContext';
import { Reveal, SectionTitle } from './Reveal';
import { ACCENTS } from '../data/accents';
import { priceLabel } from '../lib/format';

const ICONS: Record<string, LucideIcon> = { Code, RefreshCcw, ShoppingBag, Layout, Search, Share2, Palette, Gauge, ShieldCheck };

export const ServicesSection: React.FC<{ onSelectService: (name: string) => void }> = ({ onSelectService }) => {
  const { services, settings, isLoading } = useSite();
  return (
    <section id="services" className="border-t border-white/10 px-5 py-24 sm:px-8 lg:py-32">
      <div className="mx-auto max-w-7xl">
        <SectionTitle title={settings.servicesTitle} intro={settings.servicesIntro} />
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {services.length === 0 && isLoading && Array.from({ length: 6 }).map((_, i) => <div key={i} className="skeleton h-64 rounded-2xl" aria-hidden="true" />)}
          {services.map((s, i) => {
            const Icon = ICONS[s.icon] || Sparkles;
            const color = ACCENTS[i % ACCENTS.length];
            return (
              <Reveal key={s.id} delay={(i % 3) * 0.08}>
                <button onClick={() => onSelectService(s.name)} style={{ '--c': color } as React.CSSProperties}
                  className="group relative flex h-full w-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-navy p-7 text-left transition-all duration-300 hover:-translate-y-1.5 hover:border-[var(--c)]">
                  <span className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-25" style={{ background: color }} />
                  <span className="mb-8 grid h-12 w-12 place-items-center rounded-xl transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-6" style={{ background: `${color}1f`, color }}><Icon size={24} /></span>
                  <h3 className="font-display text-2xl font-semibold">{s.name}</h3>
                  <p className="mt-3 flex-1 leading-relaxed text-muted">{s.shortDesc}</p>
                  <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-xs">
                    <span className="font-bold text-white">{priceLabel(s)}</span>
                    {s.deliveryTime && <span className="inline-flex items-center gap-1 text-muted"><Clock size={12} />{s.deliveryTime}</span>}
                  </div>
                  <span className="mt-6 inline-flex items-center gap-1.5 text-sm font-bold transition-colors group-hover:text-[var(--c)]">Request this service <ArrowUpRight size={16} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" /></span>
                </button>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
};
