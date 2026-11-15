import React, { useEffect, useState } from 'react';
import { ArrowLeft, ArrowUpRight } from 'lucide-react';
import { useSite } from '../context/SiteContext';
import { navigate } from '../lib/router';
import { ProjectCard } from '../components/PortfolioSection';
import { ACCENTS } from '../data/accents';

const Shell: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => {
  const { settings } = useSite();
  useEffect(() => { document.title = `${title} | ${settings.companyName}`; }, [title, settings.companyName]);
  return (
    <main className="mx-auto max-w-3xl px-5 py-16 sm:px-8 sm:py-24">
      <a href="/" onClick={(e) => { e.preventDefault(); navigate('/'); }} className="mb-10 inline-flex items-center gap-2 text-sm text-muted hover:text-white"><ArrowLeft size={16} /> Back to website</a>
      <h1 className="font-display text-4xl font-bold sm:text-5xl">{title}</h1>
      <div className="mt-10 space-y-8 leading-relaxed text-white/85 [&_h2]:mb-3 [&_h2]:font-display [&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:text-white [&_a]:text-brand [&_a]:underline [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-6">{children}</div>
    </main>
  );
};

export const ProjectsPage: React.FC<{ onStartProject: () => void }> = ({ onStartProject }) => {
  const { portfolio, settings, isLoading } = useSite();
  const [category, setCategory] = useState('All');

  useEffect(() => {
    document.title = `Projects | ${settings.companyName}`;
  }, [settings.companyName]);

  const finished = portfolio.filter((p) => !p.id.startsWith('placeholder'));
  const allItems = [...(finished.length ? finished : portfolio)].sort((a, b) => Number(b.featured) - Number(a.featured));
  const categories = ['All', ...Array.from(new Set(allItems.map((p) => p.category).filter(Boolean)))];
  const visible = category === 'All' ? allItems : allItems.filter((p) => p.category === category);

  return (
    <main className="mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-24">
      <a href="/" onClick={(e) => { e.preventDefault(); navigate('/'); }} className="mb-10 inline-flex items-center gap-2 text-sm text-muted hover:text-white">
        <ArrowLeft size={16} /> Back to website
      </a>
      <div className="flex flex-col justify-between gap-6 border-b border-white/10 pb-10 md:flex-row md:items-end">
        <div className="max-w-2xl">
          <p className="font-mono text-xs uppercase tracking-widest text-brand">Portfolio</p>
          <h1 className="mt-3 font-display text-4xl font-bold sm:text-5xl lg:text-6xl">{settings.portfolioTitle}</h1>
          {settings.portfolioIntro && <p className="mt-4 text-lg text-muted">{settings.portfolioIntro}</p>}
        </div>
        <button
          onClick={onStartProject}
          className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-full bg-brand px-7 py-3.5 text-sm font-bold text-white transition-shadow hover:shadow-[0_0_32px_-6px_#147FF5]"
        >
          START A PROJECT <ArrowUpRight size={18} />
        </button>
      </div>

      {categories.length > 2 && (
        <div className="mt-8 flex flex-wrap gap-2" role="tablist" aria-label="Filter projects by category">
          {categories.map((cat) => (
            <button
              key={cat}
              role="tab"
              aria-selected={category === cat}
              onClick={() => setCategory(cat)}
              className={`rounded-full border px-4 py-2 text-xs font-semibold transition-colors ${category === cat ? 'border-brand bg-brand text-white' : 'border-white/15 bg-navy text-muted hover:border-white/30 hover:text-white'}`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      <div className="mt-12 grid gap-x-8 gap-y-16 md:grid-cols-2">
        {visible.length === 0 && isLoading && [0, 1, 2, 3].map((i) => <div key={i} className="skeleton aspect-[16/11] rounded-2xl" aria-hidden="true" />)}
        {visible.map((p, i) => (
          <ProjectCard key={p.id} p={p} color={ACCENTS[(i * 2) % ACCENTS.length]} delay={(i % 2) * 0.08} />
        ))}
      </div>

      {!isLoading && visible.length === 0 && (
        <p className="py-16 text-center text-muted">No projects found in this category yet.</p>
      )}
    </main>
  );
};

export const PrivacyPage: React.FC = () => {
  const { settings: s } = useSite();
  return (
    <Shell title="Privacy Policy">
      <p className="text-sm text-muted">Last updated: November 2026. This is a general policy template; have it reviewed against your legal obligations.</p>
      <section><h2>Who we are</h2><p>{s.companyName} ("we", "us") provides website design, development and digital services. You can contact us at <a href={`mailto:${s.email}`}>{s.email}</a> or {s.phone}.</p></section>
      <section><h2>Information we collect</h2><ul><li>Details you submit in our contact form or quote requests: name, email, phone number, business name, service required and your message.</li><li>Reviews you choose to submit: your name, rating, service received and feedback.</li><li>Messages you send to our website chat assistant.</li><li>Basic technical data your browser sends when visiting the site, and small items stored in your browser to remember preferences and limit repeat form submissions.</li></ul></section>
      <section><h2>How we use it</h2><p>We use your information to reply to enquiries, prepare quotations, deliver services, moderate and display reviews, and keep the website secure. We do not sell your personal data.</p></section>
      <section><h2>Where data is stored</h2><p>Website content, enquiries and reviews are stored with Google Firebase. Chat messages are processed by an AI service to generate replies. These providers may process data outside your country.</p></section>
      <section><h2>Reviews</h2><p>Reviews submitted through this website are customer reviews shown here after approval. They are not posted to Google. We may hide or remove reviews that are abusive, misleading or unrelated.</p></section>
      <section><h2>Your rights</h2><p>You may ask us to access, correct or delete the personal data we hold about you, in line with applicable data protection law, including the Kenya Data Protection Act, 2019. Contact us using the details above.</p></section>
      <section><h2>Retention</h2><p>We keep enquiry data only as long as needed to respond and to maintain business records.</p></section>
    </Shell>
  );
};

export const TermsPage: React.FC = () => {
  const { settings: s } = useSite();
  return (
    <Shell title="Terms & Conditions">
      <p className="text-sm text-muted">Last updated: November 2026. This is a general template; have it reviewed before relying on it as a contract.</p>
      <section><h2>Using this website</h2><p>By using this website you agree to these terms. Content is provided for general information about {s.companyName} and its services.</p></section>
      <section><h2>Quotations and pricing</h2><p>Prices shown are in Kenyan Shillings (KSh) and are a guide only. A written quotation confirms the scope, price and timeline for each project before work begins.</p></section>
      <section><h2>Projects</h2><p>Project scope, deliverables, payment terms and timelines are agreed in writing with each client. Delivery times depend on prompt feedback and content from the client.</p></section>
      <section><h2>Intellectual property</h2><p>Unless agreed otherwise in writing, the website design, code and content on this site belong to {s.companyName}. Client-owned material remains the property of the client.</p></section>
      <section><h2>Reviews and user content</h2><p>You are responsible for what you submit. We may remove content that is offensive, misleading or unlawful.</p></section>
      <section><h2>Liability</h2><p>We take care to keep information accurate but provide this website "as is". To the extent permitted by law we are not liable for losses arising from its use.</p></section>
      <section><h2>Contact</h2><p>Questions about these terms: <a href={`mailto:${s.email}`}>{s.email}</a>.</p></section>
    </Shell>
  );
};

export const NotFoundPage: React.FC = () => {
  const { settings } = useSite();
  useEffect(() => { document.title = `Page not found | ${settings.companyName}`; }, [settings.companyName]);
  return (
    <main className="grid min-h-[70vh] place-items-center px-5 text-center">
      <div>
        <p className="font-mono text-sm text-brand">ERROR 404</p>
        <h1 className="mt-3 font-display text-5xl font-bold sm:text-7xl">Page not found</h1>
        <p className="mx-auto mt-5 max-w-md text-muted">The page you are looking for does not exist or has moved.</p>
        <a href="/" onClick={(e) => { e.preventDefault(); navigate('/'); }} className="mt-8 inline-flex min-h-12 items-center rounded-full bg-brand px-8 py-3.5 font-bold">BACK TO HOME</a>
      </div>
    </main>
  );
};
