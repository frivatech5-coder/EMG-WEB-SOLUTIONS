import React, { useEffect, useState } from 'react';
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';
import { subscribeToasts, ToastMsg } from '../lib/toast';

export const Toaster: React.FC = () => {
  const [items, setItems] = useState<ToastMsg[]>([]);
  useEffect(() => subscribeToasts((t) => {
    setItems((p) => [...p, t]);
    setTimeout(() => setItems((p) => p.filter((x) => x.id !== t.id)), t.kind === 'error' ? 7000 : 4000);
  }), []);
  const icon = { success: <CheckCircle2 size={18} className="text-emerald" />, error: <AlertTriangle size={18} className="text-red-400" />, info: <Info size={18} className="text-brand" /> };
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-[200] flex flex-col items-center gap-2 px-4" aria-live="polite">
      {items.map((t) => (
        <div key={t.id} role={t.kind === 'error' ? 'alert' : 'status'} className="animate-fade-in pointer-events-auto flex max-w-md items-start gap-3 rounded-xl border border-white/15 bg-navy px-4 py-3 text-sm shadow-2xl">
          <span className="mt-0.5">{icon[t.kind]}</span><span className="flex-1">{t.text}</span>
          <button onClick={() => setItems((p) => p.filter((x) => x.id !== t.id))} aria-label="Dismiss" className="text-muted hover:text-white"><X size={16} /></button>
        </div>
      ))}
    </div>
  );
};
