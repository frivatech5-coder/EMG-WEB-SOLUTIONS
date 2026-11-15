import { SiteSettings } from '../types';
export { ACCENTS } from './accents';
export { waLink, toWaNumber } from '../lib/format';

export const NAV_LINKS = [
  { label: 'About', href: '#about' },
  { label: 'Services', href: '#services' },
  { label: 'Work', href: '#work' },
  { label: 'Process', href: '#process' },
  { label: 'Contact', href: '#contact' },
];

export const socialLinks = (s: SiteSettings) =>
  [
    { label: 'Instagram', href: s.instagram }, { label: 'Facebook', href: s.facebook },
    { label: 'LinkedIn', href: s.linkedin }, { label: 'X', href: s.x }, { label: 'TikTok', href: s.tiktok },
  ].filter((l) => /^https?:\/\//i.test(l.href || ''));
