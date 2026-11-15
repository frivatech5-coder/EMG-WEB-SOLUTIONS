import React from 'react';
import { MessageCircle } from 'lucide-react';
import { useSite } from '../context/SiteContext';
import { waLink } from '../lib/format';

export const WhatsAppFab: React.FC = () => {
  const { settings } = useSite();
  return (
    <a href={waLink(settings.whatsapp || settings.phone)} target="_blank" rel="noopener noreferrer" aria-label="Chat with us on WhatsApp"
      className="fixed bottom-5 left-4 z-40 grid h-14 w-14 place-items-center rounded-full bg-[#25D366] text-black shadow-xl shadow-black/50 transition-transform hover:scale-110 sm:bottom-6 sm:left-6">
      <MessageCircle size={26} />
    </a>
  );
};
