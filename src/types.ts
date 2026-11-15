export interface Project {
  id: string;
  title: string;
  category: string;
  client: string;
  image: string;
  description: string;
  challenge: string;
  solution: string;
  outcome: string;
  techStack: string[];
  liveUrl?: string;
  featured: boolean;
  year: string;
  metrics: { label: string; value: string }[];
}

export interface Service {
  id: string;
  name: string;
  shortDesc: string;
  fullDesc: string;
  icon: string;
  features: string[];
  /** Price in Kenyan Shillings. null = not set (shown as "Custom quote"; flagged for admin review). */
  priceKsh?: number | null;
  /** Force "Custom quote" even if a price exists. */
  quoteOnly?: boolean;
  /** Legacy free-text price from older versions. Never shown if it contains a $ amount. */
  startingPrice?: string;
  deliveryTime: string;
  popular?: boolean;
  deliverables: string[];
  order?: number;
}

export type ReviewStatus = 'pending' | 'approved' | 'hidden';

export interface GoogleReview {
  id: string;
  authorName: string;
  authorRole?: string;
  authorAvatar?: string;
  rating: number;
  date: string;
  reviewText: string;
  serviceReviewed: string;
  isLocalGuide?: boolean;
  reviewsCount?: number;
  /** True only when an administrator has manually entered a genuine Google review. */
  verifiedGoogleReview: boolean;
  source?: 'customer' | 'google';
  status?: ReviewStatus;
  responseFromOwner?: { text: string; date: string };
}

export interface EstimatorOption { id: string; label: string; priceKsh: number | null; note?: string }
export interface EstimatorConfig {
  types: EstimatorOption[];
  pages: EstimatorOption[];
  addons: EstimatorOption[];
}

export interface SiteSettings {
  companyName: string;
  tagline: string;
  motto: string;
  phone: string;
  whatsapp: string;
  email: string;
  address: string;
  aiLogo?: string;
  aiName?: string;
  heroTitle: string;
  heroSubtitle: string;
  heroBadgeText: string;
  heroPrimaryCta: string;
  heroWhatsappCta: string;
  heroSecondaryCta: string;
  aboutTitle: string;
  aboutText: string;
  servicesTitle: string;
  servicesIntro: string;
  portfolioTitle: string;
  portfolioIntro: string;
  whyTitle: string;
  processTitle: string;
  testimonialsTitle: string;
  estimatorTitle: string;
  stats: { label: string; value: string; detail: string }[];
  ctaTitle: string;
  ctaSubtitle: string;
  announcementText: string;
  showAnnouncement: boolean;
  instagram: string;
  facebook: string;
  linkedin: string;
  x: string;
  tiktok: string;
  seoTitle: string;
  seoDescription: string;
  /** Names of collections an administrator has already managed (stops default content re-appearing). */
  initializedCollections?: string[];
  estimator?: EstimatorConfig;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}
