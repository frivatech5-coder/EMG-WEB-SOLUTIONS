import { Service } from '../types';

export const formatKsh = (n: number) => `KSh ${Math.round(n).toLocaleString('en-KE')}`;

/** Public price label. Dollar amounts and unset prices are never shown. */
export const priceLabel = (s: Pick<Service, 'priceKsh' | 'quoteOnly' | 'startingPrice'>): string => {
  if (s.quoteOnly) return 'Custom quote';
  if (typeof s.priceKsh === 'number' && s.priceKsh > 0) return `From ${formatKsh(s.priceKsh)}`;
  const legacy = s.startingPrice?.trim();
  if (legacy && /^ksh/i.test(legacy)) return legacy;
  return 'Custom quote';
};
export const priceNeedsReview = (s: Pick<Service, 'priceKsh' | 'quoteOnly'>) => !s.quoteOnly && !(typeof s.priceKsh === 'number' && s.priceKsh > 0);

/** Strip HTML tags, control characters and collapse whitespace in user-supplied text. */
export const clean = (v: string, max = 1500) =>
  v.replace(/<[^>]*>/g, '').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '').replace(/[ \t]{2,}/g, ' ').trim().slice(0, max);

export const isHttpUrl = (u?: string) => !!u && /^https?:\/\/[^\s]+$/i.test(u);

export const toWaNumber = (phone: string) => {
  const d = (phone || '').replace(/\D/g, '');
  return d.startsWith('0') ? `254${d.slice(1)}` : d;
};
export const waLink = (phone: string, text = "Hello EMG WEB SOLUTIONS, I'd like to discuss a project.") =>
  `https://wa.me/${toWaNumber(phone)}?text=${encodeURIComponent(text)}`;
