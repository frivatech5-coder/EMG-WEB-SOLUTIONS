import React, { useEffect, useState } from 'react';
import { ArrowUpRight, ImageIcon } from 'lucide-react';
import { useSite } from '../context/SiteContext';
import { Project } from '../types';
import { Reveal, SectionTitle } from './Reveal';
import { ACCENTS } from '../data/accents';
import { isHttpUrl } from '../lib/format';

const isLiveUrl = (u?: string) => isHttpUrl(u) && !/example\.com/i.test(u || '');
const previewSrc = (p: Project) => p.image?.trim() || (isLiveUrl(p.liveUrl) ? `https://image.thum.io/get/width/1200/crop/760/${p.liveUrl}` : '');

const ProjectCard: React.FC<{ p: Project; color: string; delay: number }> = ({ p, color, delay }) => {
  const [failed, setFailed] = useState(false);
  const src = previewSrc(p);
  useEffect(() => {
    setFailed(false);
  }, [src]);
  const placeholder = p.id.startsWith('placeholder');
  const live = isLiveUrl(p.liveUrl);
  return (
    <Reveal delay={delay}>
      <article className="group h-full" style={{ '--c': color } as React.CSSProperties}>
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-navy transition-colors duration-300 group-hover:border-[var(--c)]">
          <div className="flex items-center gap-1.5 border-b border-white/10 px-4 py-3">
            <i className="h-2 w-2 rounded-full bg-white/20" /><i className="h-2 w-2 rounded-full bg-white/20" /><i className="h-2 w-2 rounded-full bg-white/20" />
            <span className="ml-3 truncate rounded-md bg-white/5 px-3 py-0.5 font-mono text-[10px] text-muted">{live ? p.liveUrl!.replace(/^https?:\/\//, '') : 'preview'}</span>
          </div>
          <div className="relative aspect-[16/10] overflow-hidden bg-black">
            {src && !failed ? (
              <img key={src} src={src} alt={`${p.title} website preview`} loading="lazy" onError={() => setFailed(true)} className="h-full w-full object-cover object-top transition-transform duration-700 group-hover:scale-105" />
            ) : (
              <div className="grid h-full place-items-center bg-[radial-gradient(circle_at_50%_0%,rgba(20,127,245,.18),transparent_70%)] text-muted">
                <div className="text-center"><ImageIcon className="mx-auto mb-3" size={36} /><p className="font-mono text-xs">Website screenshot goes here</p></div>
              </div>
            )}
          </div>
        </div>
        <div className="px-1 pt-6">
          <div className="mb-3 flex flex-wrap items-center gap-3 font-mono text-xs">
            <span className="rounded-full px-3 py-1" style={{ background: `${color}22`, color }}>{p.category}</span>
            {placeholder && <span className="rounded-full border border-dashed border-white/25 px-3 py-1 text-muted">Placeholder</span>}
          </div>
          <h3 className="font-display text-2xl font-semibold sm:text-3xl">{p.title}</h3>
          <p className="mt-3 max-w-xl leading-relaxed text-muted">{p.description}</p>
          {p.techStack.length > 0 && (
            <ul className="mt-4 flex flex-wrap gap-2">{p.techStack.map((t) => <li key={t} className="rounded-md border border-white/10 px-2.5 py-1 font-mono text-[11px] text-muted">{t}</li>)}</ul>
          )}
          {live ? (
            <a href={p.liveUrl} target="_blank" rel="noopener noreferrer" className="mt-6 inline-flex items-center gap-2 border-b border-white/30 pb-1 text-sm font-bold transition-colors hover:border-[var(--c)] hover:text-[var(--c)]">
              VIEW LIVE PROJECT <ArrowUpRight size={16} />
            </a>
          ) : (
            <span className="mt-6 inline-flex items-center gap-2 border-b border-dashed border-white/20 pb-1 text-sm font-bold text-muted">VIEW LIVE PROJECT (add URL in Admin)</span>
          )}
        </div>
      </article>
    </Reveal>
  );
};

export const PortfolioSection: React.FC = () => {
  const { portfolio, settings, isLoading } = useSite();
  const finished = portfolio.filter((p) => !p.id.startsWith('placeholder'));
  const items = [...(finished.length ? finished : portfolio)].sort((a, b) => Number(b.featured) - Number(a.featured));
  return (
    <section id="work" className="border-t border-white/10 px-5 py-24 sm:px-8 lg:py-32">
      <div className="mx-auto max-w-7xl">
        <SectionTitle title={settings.portfolioTitle} intro={settings.portfolioIntro} />
        <div className="grid gap-x-8 gap-y-16 md:grid-cols-2">
          {items.length === 0 && isLoading && [0, 1].map((i) => <div key={i} className="skeleton aspect-[16/11] rounded-2xl" aria-hidden="true" />)}
          {items.map((p, i) => <ProjectCard key={p.id} p={p} color={ACCENTS[(i * 2) % ACCENTS.length]} delay={(i % 2) * 0.1} />)}
        </div>
      </div>
    </section>
  );
};
