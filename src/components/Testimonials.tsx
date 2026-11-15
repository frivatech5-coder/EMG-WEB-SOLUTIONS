import React, { useState } from 'react';
import { BadgeCheck, PenLine, Quote, Star } from 'lucide-react';
import { useSite } from '../context/SiteContext';
import { Reveal, SectionTitle } from './Reveal';
import { ReviewModal } from './ReviewModal';

export const Testimonials: React.FC = () => {
  const { reviews, settings } = useSite();
  const [open, setOpen] = useState(false);
  const approved = reviews.filter((r) => r.status === 'approved');
  return (
    <section id="testimonials" className="border-t border-white/10 px-5 py-24 sm:px-8 lg:py-32">
      <div className="mx-auto max-w-7xl">
        <SectionTitle title={settings.testimonialsTitle} intro="Words from the businesses we have worked with." />
        {approved.length === 0 ? (
          <Reveal>
            <figure className="mx-auto max-w-3xl rounded-2xl border border-dashed border-white/25 p-8 sm:p-12">
              <Quote className="mb-6 text-brand" size={32} />
              <blockquote className="font-display text-2xl font-medium leading-snug sm:text-3xl">No reviews yet. Worked with us? Be the first to share your experience.</blockquote>
            </figure>
          </Reveal>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {approved.slice(0, 9).map((r, i) => {
              const google = r.source === 'google' && r.verifiedGoogleReview;
              return (
                <Reveal key={r.id} delay={(i % 3) * 0.08}>
                  <figure className="flex h-full flex-col rounded-2xl border border-white/10 bg-navy p-7">
                    <div className="mb-4 flex items-center justify-between gap-2">
                      <div className="flex gap-1 text-gold" role="img" aria-label={`${r.rating} out of 5 stars`}>{Array.from({ length: r.rating }).map((_, k) => <Star key={k} size={16} fill="currentColor" />)}</div>
                      <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 font-mono text-[10px] ${google ? 'bg-brand/15 text-brand' : 'bg-white/5 text-muted'}`}>{google && <BadgeCheck size={12} />}{google ? 'Verified Google review' : 'Customer review'}</span>
                    </div>
                    <blockquote className="flex-1 leading-relaxed text-white/90">{r.reviewText}</blockquote>
                    <figcaption className="mt-6 border-t border-white/10 pt-4"><p className="font-semibold">{r.authorName}</p><p className="text-sm text-muted">{r.serviceReviewed}</p></figcaption>
                    {r.responseFromOwner?.text && <p className="mt-4 rounded-lg bg-white/5 p-3 text-sm text-muted"><span className="font-semibold text-white">Response from {settings.companyName}: </span>{r.responseFromOwner.text}</p>}
                  </figure>
                </Reveal>
              );
            })}
          </div>
        )}
        <div className="mt-12 text-center">
          <button onClick={() => setOpen(true)} className="inline-flex min-h-12 items-center gap-2 rounded-full border border-brand px-7 py-3.5 font-bold text-brand transition-colors hover:bg-brand hover:text-white"><PenLine size={18} /> ADD A REVIEW</button>
        </div>
      </div>
      {open && <ReviewModal onClose={() => setOpen(false)} />}
    </section>
  );
};
