export type ToastKind = 'success' | 'error' | 'info';
export interface ToastMsg { id: number; kind: ToastKind; text: string }
type Listener = (t: ToastMsg) => void;
const listeners = new Set<Listener>();
let n = 0;
export const subscribeToasts = (l: Listener) => { listeners.add(l); return () => { listeners.delete(l); }; };
export const toast = (kind: ToastKind, text: string) => listeners.forEach((l) => l({ id: ++n, kind, text }));
