import React, { useEffect, useState } from 'react';
import { ArrowUpRight, Menu, X } from 'lucide-react';
import { NAV_LINKS } from '../data/links';
import { useSite } from '../context/SiteContext';

interface Props { onOpenContact?: () => void; onOpenChat?: () => void }

export const Navbar: React.FC<Props> = () => {
  const { settings } = useSite();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  return (
    <header className={`sticky top-0 z-50 transition-colors duration-300 ${scrolled || open ? 'border-b border-white/10 bg-black/85 backdrop-blur-xl' : 'bg-black/30 backdrop-blur-sm'}`}>
      <nav aria-label="Main" className="mx-auto flex h-[84px] max-w-7xl items-center justify-between px-5 sm:px-8">
        <a href="/" className="flex items-center" aria-label={`${settings.companyName} home`}>
          <img src="/assets/emg-logo-dark.webp" alt={settings.companyName} width={68} height={65} className="h-16 w-auto" />
        </a>
        <ul className="hidden items-center gap-8 md:flex">
          {NAV_LINKS.slice(0, 4).map((l) => <li key={l.href}><a href={`/${l.href}`} className="text-sm font-medium text-muted transition-colors hover:text-white">{l.label}</a></li>)}
        </ul>
        <a href="/#contact" className="group hidden items-center gap-2 rounded-full bg-brand px-5 py-2.5 text-sm font-bold text-white transition-shadow hover:shadow-[0_0_32px_-6px_#147FF5] md:inline-flex">
          {settings.heroPrimaryCta.toUpperCase()} <ArrowUpRight size={16} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </a>
        <button className="grid h-11 w-11 place-items-center rounded-lg border border-white/15 md:hidden" onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-controls="mobile-menu" aria-label={open ? 'Close menu' : 'Open menu'}>
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </nav>
      {open && (
        <div id="mobile-menu" className="border-t border-white/10 bg-black px-5 pb-6 pt-2 md:hidden">
          {NAV_LINKS.map((l) => <a key={l.href} href={`/${l.href}`} onClick={() => setOpen(false)} className="block border-b border-white/10 py-4 font-display text-2xl font-semibold">{l.label}</a>)}
          <a href="/#contact" onClick={() => setOpen(false)} className="mt-5 flex items-center justify-center gap-2 rounded-full bg-brand py-4 font-bold">{settings.heroPrimaryCta.toUpperCase()} <ArrowUpRight size={18} /></a>
        </div>
      )}
    </header>
  );
};
