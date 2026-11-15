import React, { useEffect, useMemo, useState } from 'react';
import { ArrowUpRight, CheckCircle2, Mail, MessageCircle, Phone, X } from 'lucide-react';
import { useSite } from '../context/SiteContext';
import { socialLinks } from '../data/links';
import { waLink } from '../lib/format';
import { toast } from '../lib/toast';
import { Reveal } from './Reveal';

interface Props { initialService?: string; isOpenModal?: boolean; onCloseModal?: () => void }

const field = 'w-full rounded-xl border border-white/15 bg-black px-4 py-3.5 text-white placeholder:text-zinc-500 transition-colors focus:border-brand focus:outline-none';
const label = 'mb-2 block font-mono text-xs uppercase tracking-wider text-muted';

const ContactForm: React.FC<{ initialService?: string }> = ({ initialService }) => {
  const { settings, services, submitInquiry } = useSite();
  const options = useMemo(() => Array.from(new Set([...(initialService ? [initialService] : []), ...services.map((s) => s.name), 'Not sure yet'])), [initialService, services]);
  const [f, setF] = useState({ name: '', email: '', business: '', phone: '', service: initialService || services[0]?.name || 'Not sure yet', message: '' });
  const [trap, setTrap] = useState('');
  const [errMsg, setErrMsg] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setF((p) => ({ ...p, [k]: e.target.value }));
  const summary = `Name: ${f.name}\nBusiness: ${f.business || '-'}\nService: ${f.service}\n\n${f.message}`;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (trap) { setStatus('sent'); return; }
    setStatus('sending'); setErrMsg('');
    try {
      const timeout = new Promise<never>((_, rej) => setTimeout(() => rej(new Error('timeout')), 12000));
      await Promise.race([timeout, submitInquiry({
        name: f.name.trim().slice(0, 80), email: f.email.trim().slice(0, 100), phone: f.phone.trim().slice(0, 30) || 'Not provided',
        service: f.service, budget: '', message: `Business: ${f.business.trim() || '-'}\n\n${f.message.trim()}`.slice(0, 2000),
      })]);
      setStatus('sent'); toast('success', 'Message sent. We will get back to you soon.');
    } catch (x) { setErrMsg((x as Error).message); setStatus('error'); }
  };

  if (status === 'sent') {
    return (
      <div className="rounded-2xl border border-emerald/40 bg-emerald/5 p-8 text-center" role="status">
        <CheckCircle2 className="mx-auto mb-4 text-emerald" size={44} />
        <h3 className="font-display text-2xl font-semibold">Message sent</h3>
        <p className="mt-2 text-muted">Thanks {f.name.split(' ')[0]}, we will reply to {f.email}. For a faster answer, message us on WhatsApp.</p>
        <a href={waLink(settings.whatsapp || settings.phone, summary)} target="_blank" rel="noopener noreferrer" className="mt-6 inline-flex items-center gap-2 rounded-full bg-emerald px-6 py-3 font-bold text-black"><MessageCircle size={18} /> Continue on WhatsApp</a>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5 rounded-2xl border border-white/10 bg-navy p-6 sm:p-8">
      <div className="grid gap-5 sm:grid-cols-2">
        <div><label className={label} htmlFor="c-name">Name</label><input id="c-name" required maxLength={80} autoComplete="name" className={field} value={f.name} onChange={set('name')} placeholder="Your full name" /></div>
        <div><label className={label} htmlFor="c-email">Email</label><input id="c-email" type="email" required maxLength={100} autoComplete="email" className={field} value={f.email} onChange={set('email')} placeholder="you@company.com" /></div>
        <div><label className={label} htmlFor="c-biz">Business name</label><input id="c-biz" maxLength={80} autoComplete="organization" className={field} value={f.business} onChange={set('business')} placeholder="Your business" /></div>
        <div><label className={label} htmlFor="c-phone">Phone / WhatsApp (optional)</label><input id="c-phone" type="tel" maxLength={30} autoComplete="tel" className={field} value={f.phone} onChange={set('phone')} placeholder="+254 ..." /></div>
      </div>
      <div><label className={label} htmlFor="c-service">Service required</label>
        <select id="c-service" className={field} value={f.service} onChange={set('service')}>{options.map((o) => <option key={o} value={o}>{o.length > 70 ? `${o.slice(0, 70)}…` : o}</option>)}</select></div>
      <div><label className={label} htmlFor="c-msg">Project description</label><textarea id="c-msg" required rows={5} maxLength={1500} className={`${field} resize-y`} value={f.message} onChange={set('message')} placeholder="Tell us about your business and what you need." /></div>
      <div className="hidden" aria-hidden="true"><label>Leave empty<input tabIndex={-1} autoComplete="off" value={trap} onChange={(e) => setTrap(e.target.value)} /></label></div>
      {status === 'error' && <p role="alert" className="rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-300">{errMsg || 'We could not send your message.'} You can also use the WhatsApp or email buttons.</p>}
      <button type="submit" disabled={status === 'sending'} className="group inline-flex w-full items-center justify-center gap-2 rounded-full bg-brand px-8 py-4 font-bold text-white transition-all hover:shadow-[0_8px_40px_-8px_#147FF5] disabled:opacity-60">
        {status === 'sending' ? 'SENDING…' : 'SEND MESSAGE'} <ArrowUpRight size={18} className="transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
      </button>
    </form>
  );
};

export const ContactSection: React.FC<Props> = ({ initialService, isOpenModal, onCloseModal }) => {
  const { settings } = useSite();

  useEffect(() => {
    if (!isOpenModal) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onCloseModal?.();
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
  }, [isOpenModal, onCloseModal]);

  if (isOpenModal) {
    return (
      <div className="fixed inset-0 z-[90] flex items-start justify-center overflow-y-auto bg-black/80 p-4 backdrop-blur-sm sm:items-center" onClick={onCloseModal} role="dialog" aria-modal="true" aria-label="Start a project">
        <div className="animate-fade-in relative my-8 w-full max-w-2xl" onClick={(e) => e.stopPropagation()}>
          <button onClick={onCloseModal} aria-label="Close" className="absolute -top-3 right-0 z-10 grid h-10 w-10 -translate-y-full place-items-center rounded-full bg-white text-black sm:-right-3"><X size={18} /></button>
          <h2 className="mb-4 font-display text-3xl font-bold">Start a project</h2>
          <ContactForm initialService={initialService} />
        </div>
      </div>
    );
  }

  const socials = socialLinks(settings);
  const btn = 'flex items-center justify-between gap-3 rounded-xl border border-white/15 px-5 py-4 font-semibold transition-colors hover:border-brand hover:bg-brand/10';
  return (
    <section id="contact" className="relative overflow-hidden border-t border-white/10 px-5 py-24 sm:px-8 lg:py-32">
      <div className="pointer-events-none absolute -left-40 bottom-0 h-96 w-96 rounded-full bg-brand/20 blur-[120px]" />
      <div className="relative mx-auto grid max-w-7xl gap-14 lg:grid-cols-[1fr_1.1fr]">
        <Reveal>
          <h2 className="font-display text-4xl font-bold uppercase leading-[0.98] tracking-tight sm:text-5xl lg:text-6xl">{settings.ctaTitle || "Let's build something great together."}</h2>
          <p className="mt-6 max-w-md text-lg leading-relaxed text-muted">{settings.ctaSubtitle}</p>
          <div className="mt-10 grid max-w-md gap-3">
            <a href={waLink(settings.whatsapp || settings.phone)} target="_blank" rel="noopener noreferrer" className={btn}><span className="flex items-center gap-3"><MessageCircle size={20} className="text-emerald" /> WhatsApp us</span><span className="font-mono text-sm text-muted">{settings.whatsapp || settings.phone}</span></a>
            <a href={`mailto:${settings.email}?subject=${encodeURIComponent('New project enquiry')}`} className={btn}><span className="flex items-center gap-3"><Mail size={20} className="text-brand" /> Email us</span><span className="truncate font-mono text-sm text-muted">{settings.email}</span></a>
            <a href={`tel:${settings.phone}`} className={btn}><span className="flex items-center gap-3"><Phone size={20} className="text-amber" /> Call us</span><span className="font-mono text-sm text-muted">{settings.phone}</span></a>
          </div>
          {socials.length > 0 && (
            <ul className="mt-8 flex flex-wrap gap-3">{socials.map((s) => <li key={s.label}><a href={s.href} target="_blank" rel="noopener noreferrer" className="rounded-full border border-white/15 px-4 py-2 text-sm text-muted transition-colors hover:border-white hover:text-white">{s.label}</a></li>)}</ul>
          )}
        </Reveal>
        <Reveal delay={0.1}><ContactForm initialService={initialService} /></Reveal>
      </div>
    </section>
  );
};
