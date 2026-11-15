import { EstimatorConfig, Project, Service, GoogleReview, SiteSettings } from '../types';

/** Fallback content shown ONLY when Firestore has nothing yet. It is never written to Firestore automatically. */
export const DEFAULT_SITE_SETTINGS: SiteSettings = {
  companyName: 'EMG WEB SOLUTIONS',
  tagline: 'Design • Develop • Grow',
  motto: 'Your Vision, Our Code!',
  phone: '0142201120',
  whatsapp: '0142201120',
  email: 'contact@emgwebsolutions.com',
  address: 'Available worldwide',
  aiLogo: '/assets/aistudio/EMG_AI_Neon_Tech_Logo_34e96ab4.png',
  aiName: 'Evans',
  heroTitle: 'We build digital experiences that move businesses forward.',
  heroSubtitle: 'Professional websites and digital solutions that help businesses establish a strong online presence.',
  heroBadgeText: 'Available for new projects',
  heroPrimaryCta: 'Get a Website',
  heroWhatsappCta: 'WhatsApp Us',
  heroSecondaryCta: 'View Our Work',
  aboutTitle: 'A modern digital solutions agency for businesses that want to be taken seriously online.',
  aboutText: 'EMG WEB SOLUTIONS designs and builds websites that look credible, load quickly and make it easy for customers to get in touch. Every project is shaped around your business goals, not a template.',
  servicesTitle: 'Our services',
  servicesIntro: 'Everything a business needs to launch, improve and grow its online presence, from one team.',
  portfolioTitle: 'Selected projects',
  portfolioIntro: 'A look at websites we have built. Each preview links to the live project.',
  whyTitle: 'Why choose EMG WEB SOLUTIONS?',
  processTitle: 'Our work process',
  testimonialsTitle: 'Client feedback',
  estimatorTitle: 'Plan your project',
  stats: [],
  ctaTitle: "Let's build something great together.",
  ctaSubtitle: "Have a business that deserves a better online presence? Let's discuss your next digital project.",
  announcementText: '',
  showAnnouncement: false,
  instagram: '', facebook: '', linkedin: '', x: '', tiktok: '',
  seoTitle: 'EMG WEB SOLUTIONS | Website Design, Development & Digital Growth',
  seoDescription: 'EMG WEB SOLUTIONS builds modern, fast, SEO-ready websites, e-commerce stores and landing pages, and manages social media for ambitious businesses.',
};

const svc = (
  id: string, name: string, icon: string, shortDesc: string, fullDesc: string,
  features: string[], deliveryTime: string, order: number, popular = false,
): Service => ({ id, name, icon, shortDesc, fullDesc, features, priceKsh: null, quoteOnly: false, deliveryTime, popular, deliverables: features.slice(0, 3), order });

/** Prices are intentionally unset: the owner must enter real KSh prices in Admin. */
export const DEFAULT_SERVICES: Service[] = [
  svc('website-development', 'Website Development', 'Code', 'Custom-built websites that load fast, look credible and are ready to grow with your business.', 'Bespoke websites built with modern technology: responsive on every screen, SEO-ready and easy to maintain.', ['Mobile-first responsive build', 'Clean, maintainable code', 'SEO-ready structure', 'Backend and API integrations'], 'Depends on scope', 1, true),
  svc('website-redesign', 'Website Redesign', 'RefreshCcw', 'Turn an outdated site into a modern one that earns trust and brings in enquiries.', 'We audit what you have, keep what works and rebuild the rest with a fresh design and better performance.', ['Design and content audit', 'Modern visual refresh', 'Speed and usability fixes', 'Safe content migration'], 'Depends on scope', 2),
  svc('ecommerce-development', 'E-commerce Development', 'ShoppingBag', 'Online stores with smooth checkout, local and international payments and easy product management.', 'Sell online with a store built around your products, payment methods and customers.', ['Product catalogue and variants', 'Payment gateway integration', 'Order and inventory management', 'Mobile-friendly checkout'], 'Depends on scope', 3, true),
  svc('landing-pages', 'Landing Pages', 'Layout', 'Focused pages designed to turn campaign traffic into leads and sales.', 'A single-purpose page with persuasive structure, clear calls to action and tracking in place.', ['Conversion-focused layout', 'WhatsApp and click-to-call actions', 'Lead forms', 'Analytics set-up'], 'Depends on scope', 4),
  svc('seo-optimization', 'SEO Optimization', 'Search', 'Make your website easier for Google and your customers to find.', 'On-page SEO, performance tuning and structured data so your site is built to be found.', ['Meta and content optimization', 'Core Web Vitals tuning', 'Structured data (JSON-LD)', 'Search Console set-up'], 'Depends on scope', 5),
  svc('social-media-management', 'Social Media Management', 'Share2', 'Consistent, on-brand social presence that supports your website and your sales.', 'Strategic planning, content and posting so your social channels work together with your website.', ['Content planning', 'Branded post design', 'Scheduled publishing', 'Channel growth strategy'], 'Ongoing', 6),
];

export const DEFAULT_ESTIMATOR: EstimatorConfig = {
  types: [
    { id: 'landing', label: 'Landing page', priceKsh: null, note: 'Single-purpose page' },
    { id: 'business', label: 'Business website', priceKsh: null, note: 'Multi-page branded website' },
    { id: 'ecommerce', label: 'E-commerce store', priceKsh: null, note: 'Online shop with payments' },
    { id: 'custom', label: 'Custom web app', priceKsh: null, note: 'Database and custom logic' },
  ],
  pages: [
    { id: 'p1', label: '1 - 3 pages', priceKsh: 0 },
    { id: 'p2', label: '4 - 7 pages', priceKsh: null },
    { id: 'p3', label: '8 - 14 pages', priceKsh: null },
    { id: 'p4', label: '15+ pages', priceKsh: null },
  ],
  addons: [
    { id: 'seo', label: 'SEO set-up', priceKsh: null },
    { id: 'payments', label: 'M-Pesa / card payments', priceKsh: null },
    { id: 'cms', label: 'Admin panel to edit content', priceKsh: null },
    { id: 'hosting', label: 'Hosting and SSL (1 year)', priceKsh: null },
  ],
};

const placeholder = (n: number): Project => ({
  id: `placeholder-${n}`, title: 'Your project name', category: 'Industry or business category', client: '', image: '',
  description: 'Placeholder: sign in to Admin, open Portfolio, and add a completed project with its name, description, technologies, image and live URL.',
  challenge: '', solution: '', outcome: '', techStack: [], liveUrl: '', featured: false, year: '', metrics: [],
});
export const DEFAULT_PORTFOLIO: Project[] = [placeholder(1), placeholder(2)];
export const DEFAULT_GOOGLE_REVIEWS: GoogleReview[] = [];

/** Hero copy saved by earlier versions; replaced with the current default when found. */
export const isLegacyHeroCopy = (v: string) =>
  v.includes('Architecting High-Performance') || v.includes('custom bespoke web platforms') || v.includes('Accepting New Client') || v.includes('establish a powerful online presence');

/** Fictional demo records from the original template. Never displayed publicly. */
const LEGACY_DEMO_IDS = new Set(['apex-logistics', 'kazi-hub', 'finvault-saas', 'lumina-clinic', 'solarpulse-energy', 'nexus-realty', 'rev-1', 'rev-2', 'rev-3', 'rev-4', 'rev-5']);
export const isDemoContent = (id: string) => LEGACY_DEMO_IDS.has(id);
