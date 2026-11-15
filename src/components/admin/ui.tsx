import React, { useRef, useState } from 'react';
import { Loader2, Upload } from 'lucide-react';
import { toast } from '../../lib/toast';
import { uploadImage } from '../../lib/upload';
import { hasStorage } from '../../firebase';

export const input = 'w-full rounded-lg border border-white/15 bg-black px-3.5 py-2.5 text-sm text-white placeholder:text-zinc-500 focus:border-brand focus:outline-none';
export const btn = 'inline-flex min-h-10 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-bold transition-colors disabled:opacity-50';
export const btnPrimary = `${btn} bg-brand text-white hover:bg-blue-500`;
export const btnGhost = `${btn} border border-white/15 text-white hover:bg-white/10`;
export const btnDanger = `${btn} border border-red-500/40 text-red-300 hover:bg-red-500/15`;

export const Field: React.FC<{ label: string; hint?: string; children: React.ReactNode; className?: string }> = ({ label, hint, children, className = '' }) => (
  <label className={`block ${className}`}>
    <span className="mb-1.5 block font-mono text-[11px] uppercase tracking-wider text-muted">{label}</span>
    {children}
    {hint && <span className="mt-1 block text-xs text-zinc-500">{hint}</span>}
  </label>
);

export const Toggle: React.FC<{ label: string; checked: boolean; onChange: (v: boolean) => void }> = ({ label, checked, onChange }) => (
  <button type="button" role="switch" aria-checked={checked} onClick={() => onChange(!checked)} className="flex min-h-10 items-center gap-3 text-sm">
    <span className={`relative h-6 w-11 rounded-full transition-colors ${checked ? 'bg-brand' : 'bg-white/20'}`}><span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${checked ? 'left-[22px]' : 'left-0.5'}`} /></span>{label}
  </button>
);

export const Spinner: React.FC<{ label?: string }> = ({ label = 'Loading…' }) => <div className="flex items-center gap-2 py-10 text-muted" role="status"><Loader2 className="animate-spin" size={18} />{label}</div>;

/** Runs an async admin action with a busy flag and success/error notifications. */
export function useAction() {
  const [busy, setBusy] = useState(false);
  const run = async <T,>(fn: () => Promise<T>, success: string): Promise<T | undefined> => {
    setBusy(true);
    try { const r = await fn(); toast('success', success); return r; }
    catch (e) { toast('error', `Not saved: ${(e as Error).message}`); return undefined; }
    finally { setBusy(false); }
  };
  return { busy, run };
}

export const ConfirmDialog: React.FC<{ message: string; confirmLabel?: string; onConfirm: () => void; onCancel: () => void }> = ({ message, confirmLabel = 'Delete', onConfirm, onCancel }) => (
  <div className="fixed inset-0 z-[150] grid place-items-center bg-black/80 p-4" role="alertdialog" aria-modal="true" aria-label="Confirm action">
    <div className="animate-fade-in w-full max-w-sm rounded-2xl border border-white/15 bg-navy p-6">
      <p className="text-base">{message}</p>
      <div className="mt-6 flex justify-end gap-3"><button className={btnGhost} onClick={onCancel}>Cancel</button><button className={`${btn} bg-red-600 text-white hover:bg-red-500`} onClick={onConfirm}>{confirmLabel}</button></div>
    </div>
  </div>
);

export const ImageField: React.FC<{ value: string; onChange: (v: string) => void; folder: string }> = ({ value, onChange, folder }) => {
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const pick = async (f?: File) => {
    if (!f) return;
    setBusy(true);
    try { onChange(await uploadImage(f, folder)); toast('success', 'Image uploaded. Remember to save.'); } catch (e) { toast('error', (e as Error).message); } finally { setBusy(false); if (ref.current) ref.current.value = ''; }
  };
  return (
    <div>
      <span className="mb-1.5 block font-mono text-[11px] uppercase tracking-wider text-muted">Image</span>
      <div className="flex gap-2">
        <input className={input} value={value} onChange={(e) => onChange(e.target.value)} placeholder="https://… or upload" aria-label="Image URL" />
        {hasStorage && <><input ref={ref} type="file" accept="image/*" className="hidden" onChange={(e) => pick(e.target.files?.[0])} /><button type="button" className={btnGhost} onClick={() => ref.current?.click()} disabled={busy}>{busy ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}Upload</button></>}
      </div>
      {value && <img src={value} alt="Preview" className="mt-3 h-28 rounded-lg border border-white/10 object-cover" loading="lazy" />}
    </div>
  );
};
