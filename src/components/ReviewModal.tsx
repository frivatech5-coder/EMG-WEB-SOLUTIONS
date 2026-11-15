import React, { useEffect, useState } from 'react';
import { CheckCircle2, Star, X } from 'lucide-react';
import { useSite } from '../context/SiteContext';
import { toast } from '../lib/toast';

const field = 'w-full rounded-xl border border-white/15 bg-black px-4 py-3.5 text-white placeholder:text-zinc-500 focus:border-brand focus:outline-none';
const lab = 'mb-2 block font-mono text-xs uppercase tracking-wider text-muted';

export const ReviewModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { services, submitReview } = useSite();
  const [name, setName] = useState('');
  const [rating, setRating] = useState(0);
  const [service, setService] = useState('');
  const [text, setText] = useState('');
  const [trap, setTrap] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', k); document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', k); document.body.style.overflow = ''; };
  }, [onClose]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setErr('');
    if (trap) { setDone(true); return; } // honeypot: silently drop bots
    if (name.trim().length < 2) return setErr('Please enter your name.');
    if (rating < 1) return setErr('Please choose a star rating.');
    if (!service) return setErr('Please select the service you received.');
    if (text.trim().length < 15) return setErr('Please write at least a sentence or two of feedback.');
    setBusy(true);
    try { await submitReview({ authorName: name, rating, serviceReviewed: service, reviewText: text }); setDone(true); toast('success', 'Thank you! Your review was submitted for approval.'); }
    catch (x) { setErr((x as Error).message); } finally { setBusy(false); }
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-start justify-center overflow-y-auto bg-black/80 p-4 backdrop-blur-sm sm:items-center" onClick={onClose} role="dialog" aria-modal="true" aria-label="Add a review">
      <div className="animate-fade-in relative my-8 w-full max-w-lg rounded-2xl border border-white/10 bg-navy p-6 sm:p-8" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} aria-label="Close" className="absolute right-4 top-4 grid h-10 w-10 place-items-center rounded-full border border-white/15 hover:bg-white hover:text-black"><X size={18} /></button>
        {done ? (
          <div className="py-6 text-center" role="status">
            <CheckCircle2 className="mx-auto mb-4 text-emerald" size={48} />
            <h3 className="font-display text-2xl font-semibold">Thank you for your feedback</h3>
            <p className="mt-2 text-muted">Your review has been received and will appear on the website once our team has approved it.</p>
            <button onClick={onClose} className="mt-6 rounded-full bg-brand px-7 py-3 font-bold">Close</button>
          </div>
        ) : (
          <form onSubmit={submit} noValidate className="space-y-5">
            <h3 className="pr-10 font-display text-2xl font-semibold">Add a review</h3>
            <p className="-mt-3 text-sm text-muted">Reviews submitted here are customer reviews shown on this website. They are not posted to Google.</p>
            <div><label className={lab} htmlFor="r-name">Your name</label><input id="r-name" className={field} value={name} maxLength={80} onChange={(e) => setName(e.target.value)} autoComplete="name" /></div>
            <fieldset><legend className={lab}>Rating</legend>
              <div className="flex gap-1" role="radiogroup" aria-label="Star rating">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button type="button" key={n} role="radio" aria-checked={rating === n} aria-label={`${n} star${n > 1 ? 's' : ''}`} onClick={() => setRating(n)} className="grid h-11 w-11 place-items-center rounded-lg hover:bg-white/5">
                    <Star size={28} className={n <= rating ? 'text-gold' : 'text-zinc-600'} fill={n <= rating ? 'currentColor' : 'none'} />
                  </button>
                ))}
              </div></fieldset>
            <div><label className={lab} htmlFor="r-service">Service received</label>
              <select id="r-service" className={field} value={service} onChange={(e) => setService(e.target.value)}>
                <option value="">Select a service</option>{services.map((s) => <option key={s.id} value={s.name}>{s.name}</option>)}<option value="Other">Other</option>
              </select></div>
            <div><label className={lab} htmlFor="r-text">Your feedback</label><textarea id="r-text" rows={5} maxLength={1500} className={`${field} resize-y`} value={text} onChange={(e) => setText(e.target.value)} /></div>
            <div className="hidden" aria-hidden="true"><label>Leave empty<input tabIndex={-1} autoComplete="off" value={trap} onChange={(e) => setTrap(e.target.value)} /></label></div>
            {err && <p role="alert" className="rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-300">{err}</p>}
            <button type="submit" disabled={busy} className="w-full rounded-full bg-brand px-8 py-4 font-bold text-white disabled:opacity-60">{busy ? 'SUBMITTING…' : 'SUBMIT REVIEW'}</button>
          </form>
        )}
      </div>
    </div>
  );
};
