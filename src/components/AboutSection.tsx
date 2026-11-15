import React from 'react';
import { Check } from 'lucide-react';
import { Reveal } from './Reveal';
import { useSite } from '../context/SiteContext';

const SPECIALTIES = [
  'Professional website development', 'Business website redesign', 'Landing page development',
  'E-commerce websites', 'Website optimization', 'SEO-ready websites', 'Strategic social media management',
];

export const AboutSection: React.FC = () => {
  const { settings } = useSite();
  return (
    <section id="about" className="border-t border-white/10 px-5 py-24 sm:px-8 lg:py-32">
      <div className="mx-auto grid max-w-7xl gap-16 lg:grid-cols-2">
        <Reveal>
          <h2 className="font-display text-4xl font-bold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
            {settings.aboutTitle}
          </h2>
          <p className="mt-8 max-w-lg text-lg leading-relaxed text-muted">
            {settings.aboutText}
          </p>
          <div className="mt-10 flex items-center gap-5">
            <img src="/assets/emg-logo-dark.webp" alt="" width={112} height={107} loading="lazy" className="h-auto w-28 shrink-0" />
            <p className="font-sora text-lg font-semibold leading-snug">{settings.tagline}<br /><span className="text-brand">{settings.motto}</span></p>
          </div>
        </Reveal>
        <Reveal delay={0.1}>
          <p className="mb-4 font-mono text-xs uppercase tracking-wider text-muted">What we specialize in</p>
          <ul className="divide-y divide-white/10 border-y border-white/10">
            {SPECIALTIES.map((s) => (
              <li key={s} className="group flex items-center justify-between py-5 transition-colors hover:text-brand">
                <span className="font-display text-xl font-medium sm:text-2xl">{s}</span>
                <Check size={20} className="text-brand opacity-60 transition-opacity group-hover:opacity-100" />
              </li>
            ))}
          </ul>
        </Reveal>
      </div>
    </section>
  );
};
