import React from 'react';
import { ArrowUp } from 'lucide-react';
import { useSite } from '../context/SiteContext';
import { NAV_LINKS, socialLinks } from '../data/links';
import { waLink } from '../lib/format';
import { navigate } from '../lib/router';

export const Footer: React.FC = () => {
  const { settings, services, setIsAdminOpen } = useSite();
  const socials = [{ label: 'WhatsApp', href: waLink(settings.whatsapp || settings.phone) }, { label: 'Email', href: `mailto:${settings.email}` }, ...socialLinks(settings)];
  const h = 'mb-5 font-mono text-xs uppercase tracking-wider text-muted';
  const a = 'text-white/80 transition-colors hover:text-brand';
  const go = (to: string) => (e: React.MouseEvent) => { e.preventDefault(); navigate(to); };
  return (
    <footer className="border-t border-white/10 bg-black px-5 pb-8 pt-20 sm:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-[1.6fr_1fr_1fr_1.2fr]">
          <div>
            <img src="/assets/emg-logo-dark.webp" alt={settings.companyName} width={176} height={169} loading="lazy" className="h-auto w-40" />
            <p className="mt-4 max-w-xs text-muted">Building modern digital experiences for ambitious businesses.</p>
          </div>
          <nav aria-label="Footer"><p className={h}>Navigation</p><ul className="space-y-3">{NAV_LINKS.map((l) => <li key={l.href}><a href={`/${l.href}`} className={a}>{l.label}</a></li>)}</ul></nav>
          <div><p className={h}>Services</p><ul className="space-y-3">{services.map((s) => <li key={s.id}><a href="/#services" className={a}>{s.name}</a></li>)}</ul></div>
          <div>
            <p className={h}>Contact</p>
            <ul className="space-y-3"><li><a href={`tel:${settings.phone}`} className={a}>{settings.phone}</a></li><li><a href={`mailto:${settings.email}`} className={`${a} break-all`}>{settings.email}</a></li><li className="text-muted">{settings.address}</li></ul>
            <ul className="mt-6 flex flex-wrap gap-2">{socials.map((s) => <li key={s.label}><a href={s.href} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-10 items-center rounded-full border border-white/15 px-3.5 text-sm text-muted transition-colors hover:border-brand hover:text-white">{s.label}</a></li>)}</ul>
          </div>
        </div>
        <div className="mt-16 flex flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-6 text-sm text-muted">
          <p>© {new Date().getFullYear()} {settings.companyName}. All rights reserved.</p>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
            <a href="/privacy" onClick={go('/privacy')} className="hover:text-white">Privacy Policy</a>
            <a href="/terms" onClick={go('/terms')} className="hover:text-white">Terms &amp; Conditions</a>
            <button onClick={() => setIsAdminOpen(true)} className="hover:text-white">Admin</button>
            <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="inline-flex min-h-11 items-center gap-2 rounded-full border border-white/15 px-4 text-white transition-colors hover:bg-white hover:text-black" aria-label="Back to top">Back to top <ArrowUp size={16} /></button>
          </div>
        </div>
      </div>
    </footer>
  );
};
