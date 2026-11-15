import React from 'react';
import { useSite } from '../context/SiteContext';

export const AnnouncementBar: React.FC = () => {
  const { settings } = useSite();
  if (!settings.showAnnouncement || !settings.announcementText.trim()) return null;
  return <div className="relative z-[60] bg-brand px-4 py-2 text-center text-sm font-semibold text-white" role="region" aria-label="Announcement">{settings.announcementText}</div>;
};
