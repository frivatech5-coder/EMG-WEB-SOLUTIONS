import React from 'react';
import { motion } from 'motion/react';
import { ArrowUpRight, MessageCircle } from 'lucide-react';
import { useSite } from '../context/SiteContext';
import { waLink } from '../lib/format';

interface Props { onOpenContact?: () => void; onOpenChat?: () => void }
const ease = [0.22, 1, 0.36, 1] as const;

export const Hero: React.FC<Props> = () => {
  const { settings } = useSite();
  const words = settings.heroTitle.split(' ');
  return (
    <section id="top" className="relative isolate overflow-hidden px-5 pb-20 pt-14 sm:px-8 lg:pb-28 lg:pt-20">
      <div className="grid-bg absolute inset-0 -z-10" />
      <div className="glow-drift absolute left-[30%] top-0 -z-10 h-[520px] w-[760px] -translate-x-1/2 rounded-full bg-brand/25 blur-[140px]" />
      <div className="absolute -right-32 bottom-0 -z-10 h-96 w-96 rounded-full bg-navy-2 blur-[100px]" />
      <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[1.3fr_1fr]">
        <div>
          <motion.p initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 1.0, ease }} className="mb-6 flex flex-wrap items-center gap-x-4 gap-y-3 font-mono text-xs uppercase tracking-wider">
            {settings.heroBadgeText.trim() && <span className="inline-flex items-center gap-2.5 rounded-full border border-white/12 bg-white/[0.03] px-4 py-2"><span className="pulse-dot h-2 w-2 rounded-full bg-emerald" />{settings.heroBadgeText}</span>}
            {settings.tagline.trim() && <span className="text-muted">{settings.tagline}</span>}
          </motion.p>
          <h1 className="font-display text-[2.5rem] font-bold uppercase leading-[0.96] tracking-tight sm:text-6xl lg:text-[3.6rem] xl:text-[4.3rem]">
            {words.map((w, i) => (
              <span key={i} className="inline-block overflow-hidden pb-[0.1em] align-bottom">
                <motion.span className="inline-block" initial={{ y: '110%' }} animate={{ y: 0 }} transition={{ duration: 0.8, delay: 1.05 + i * 0.07, ease }}>{w}{i < words.length - 1 ? '\u00A0' : ''}</motion.span>
              </span>
            ))}
          </h1>
          <motion.p initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 1.6, ease }} className="mt-7 max-w-xl text-lg leading-relaxed text-muted">{settings.heroSubtitle}</motion.p>
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 1.75, ease }} className="mt-9 flex flex-wrap gap-3 sm:gap-4">
            <a href="#contact" className="group inline-flex min-h-12 items-center gap-2 rounded-full bg-brand px-7 py-3.5 text-base font-bold text-white transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_40px_-8px_#147FF5]">
              {settings.heroPrimaryCta.toUpperCase()} <ArrowUpRight size={18} className="transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
            </a>
            <a href={waLink(settings.whatsapp || settings.phone)} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-12 items-center gap-2 rounded-full border border-emerald/50 px-7 py-3.5 text-base font-bold text-emerald transition-colors hover:bg-emerald hover:text-black">
              <MessageCircle size={18} /> {settings.heroWhatsappCta.toUpperCase()}
            </a>
            <a href="#work" className="inline-flex min-h-12 items-center rounded-full border border-white/20 px-7 py-3.5 text-base font-bold transition-colors hover:border-white hover:bg-white hover:text-black">{settings.heroSecondaryCta.toUpperCase()}</a>
          </motion.div>
        </div>
        <motion.div className="relative mx-auto w-full max-w-[420px]" initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 1, delay: 1.3, ease }}>
          <div className="absolute inset-6 rounded-full bg-brand/25 blur-[90px]" aria-hidden="true" />
          <motion.img src="/assets/emg-logo-dark.webp" alt={`${settings.companyName} logo: ${settings.tagline}. ${settings.motto}`} width={520} height={499} className="logo-glow relative h-auto w-full"
            animate={{ y: [0, -8, 0] }} transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }} fetchPriority="high" />
        </motion.div>
      </div>
    </section>
  );
};
