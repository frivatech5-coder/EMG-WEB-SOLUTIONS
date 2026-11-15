import React from 'react';
import { BadgeDollarSign, LifeBuoy, Search, Smartphone, Sparkles, Target, Zap, type LucideIcon } from 'lucide-react';
import { Reveal } from './Reveal';
import { useSite } from '../context/SiteContext';
import { ACCENTS } from '../data/links';

const POINTS: { icon: LucideIcon; title: string; text: string }[] = [
  { icon: Sparkles, title: 'Modern, professional design', text: 'Clean, confident interfaces that make your business look as good as it is.' },
  { icon: Smartphone, title: 'Mobile-first development', text: 'Built for phones first, then scaled up, so it works for every visitor.' },
  { icon: Zap, title: 'Fast-loading websites', text: 'Lightweight code and optimized images keep pages quick.' },
  { icon: Search, title: 'SEO-ready structure', text: 'Semantic markup and metadata in place from day one.' },
  { icon: Target, title: 'Business-focused solutions', text: 'Every page is planned around what you need the site to achieve.' },
  { icon: LifeBuoy, title: 'Responsive customer support', text: 'Talk to the people building your site, by WhatsApp, phone or email.' },
  { icon: BadgeDollarSign, title: 'Transparent pricing', text: 'Clear quotes up front, so you know what you are paying for.' },
];

export const WhyChoose: React.FC = () => {
  const { settings } = useSite();
  return (
  <section id="why" className="border-t border-white/10 px-5 py-24 sm:px-8 lg:py-32">
    <div className="mx-auto grid max-w-7xl gap-14 lg:grid-cols-[1fr_1.4fr]">
      <Reveal className="lg:sticky lg:top-32 lg:self-start">
        <h2 className="font-display text-4xl font-bold uppercase leading-[0.98] tracking-tight sm:text-5xl lg:text-6xl">{settings.whyTitle}</h2>
        <p className="mt-6 max-w-md text-base leading-relaxed text-muted">A website is a business tool. We build ours to look sharp, perform well and help you win customers.</p>
      </Reveal>
      <ul className="divide-y divide-white/10 border-y border-white/10">
        {POINTS.map(({ icon: Icon, title, text }, i) => (
          <Reveal key={title} delay={0.03 * i}>
            <li className="group flex gap-5 py-6" style={{ '--c': ACCENTS[i % 2 === 0 ? 0 : (i % ACCENTS.length)] } as React.CSSProperties}>
              <span className="mt-1 grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-white/5 text-brand transition-colors group-hover:bg-[var(--c)] group-hover:text-white"><Icon size={22} /></span>
              <div><h3 className="font-display text-xl font-semibold sm:text-2xl">{title}</h3><p className="mt-1 text-muted">{text}</p></div>
            </li>
          </Reveal>
        ))}
      </ul>
    </div>
  </section>
  );
};
