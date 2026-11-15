import React, { Suspense, lazy, useEffect, useState } from 'react';
import { MotionConfig } from 'motion/react';
import { SiteProvider, useSite } from './context/SiteContext';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { AboutSection } from './components/AboutSection';
import { ServicesSection } from './components/ServicesSection';
import { PortfolioSection } from './components/PortfolioSection';
import { WhyChoose } from './components/WhyChoose';
import { ProcessSection } from './components/ProcessSection';
import { CostCalculator } from './components/CostCalculator';
import { Testimonials } from './components/Testimonials';
import { ContactSection } from './components/ContactSection';
import { Footer } from './components/Footer';
import { AnnouncementBar } from './components/AnnouncementBar';
import { WhatsAppFab } from './components/WhatsAppFab';
import { Toaster } from './components/Toaster';
import { PrivacyPage, TermsPage, NotFoundPage } from './pages/Pages';
import { usePath } from './lib/router';
import { socialLinks } from './data/links';

const AiChatbot = lazy(() => import('./components/AiChatbot').then((m) => ({ default: m.AiChatbot })));
const AdminPanel = lazy(() => import('./components/admin/AdminPanel').then((m) => ({ default: m.AdminPanel })));

function useSeo(path: string) {
  const { settings } = useSite();
  useEffect(() => {
    if (path !== '/') return;
    document.title = settings.seoTitle;
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute('content', settings.seoDescription);
    document.querySelector('meta[property="og:title"]')?.setAttribute('content', settings.seoTitle);
    document.querySelector('meta[property="og:description"]')?.setAttribute('content', settings.seoDescription);
    const ld = document.getElementById('ld-json');
    if (ld) {
      ld.textContent = JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'ProfessionalService',
        name: settings.companyName,
        description: settings.seoDescription,
        email: settings.email,
        telephone: settings.phone,
        areaServed: 'Worldwide',
        slogan: settings.motto,
        image: `${window.location.origin}/assets/emg-logo.webp`,
        url: window.location.origin,
        sameAs: socialLinks(settings).map((l) => l.href),
      });
    }
  }, [path, settings]);
}

function MainApp() {
  const { isAdminOpen } = useSite();
  const path = usePath();
  useSeo(path);
  const [contactOpen, setContactOpen] = useState(false);
  const [contactService, setContactService] = useState<string | undefined>();
  const [chatOpen, setChatOpen] = useState(false);

  const openContact = (service?: string) => {
    setContactService(service);
    setContactOpen(true);
  };

  return (
    <div className="flex min-h-screen flex-col bg-black font-sans text-white antialiased">
      <a href="#main" className="sr-only z-[200] rounded bg-brand px-4 py-2 focus:not-sr-only focus:fixed focus:left-4 focus:top-4">
        Skip to content
      </a>
      <div className="page-curtain" aria-hidden="true">
        <img src="/assets/emg-logo-dark.webp" alt="" width={160} height={153} className="logo-glow h-auto w-36" />
      </div>
      <AnnouncementBar />
      <Navbar />
      {path === '/' ? (
        <main id="main" className="flex-1">
          <Hero />
          <AboutSection />
          <ServicesSection onSelectService={openContact} />
          <PortfolioSection />
          <WhyChoose />
          <ProcessSection />
          <CostCalculator onBookScope={openContact} />
          <Testimonials />
          <ContactSection />
        </main>
      ) : path === '/privacy' ? (
        <div id="main" className="flex-1">
          <PrivacyPage />
        </div>
      ) : path === '/terms' ? (
        <div id="main" className="flex-1">
          <TermsPage />
        </div>
      ) : (
        <div id="main" className="flex-1">
          <NotFoundPage />
        </div>
      )}
      <Footer />
      <WhatsAppFab />
      <Suspense fallback={null}>
        <AiChatbot isOpen={chatOpen} onClose={() => setChatOpen(false)} onOpen={() => setChatOpen(true)} />
        {isAdminOpen && <AdminPanel />}
      </Suspense>
      {contactOpen && (
        <ContactSection
          isOpenModal
          initialService={contactService}
          onCloseModal={() => {
            setContactOpen(false);
            setContactService(undefined);
          }}
        />
      )}
      <Toaster />
    </div>
  );
}

export default function App() {
  return (
    <MotionConfig reducedMotion="user">
      <SiteProvider>
        <MainApp />
      </SiteProvider>
    </MotionConfig>
  );
}
