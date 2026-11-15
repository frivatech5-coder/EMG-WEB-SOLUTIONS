import React from 'react';
import { motion } from 'motion/react';
import { Reveal, SectionTitle } from './Reveal';
import { useSite } from '../context/SiteContext';

const STEPS = [
  { n: '01', title: 'DISCOVERY', text: "Understanding the client's business and goals.", color: '#147FF5' },
  { n: '02', title: 'DESIGN', text: 'Creating an attractive and strategic design.', color: '#8749ED' },
  { n: '03', title: 'DEVELOPMENT', text: 'Building and optimizing the website.', color: '#20C6A5' },
  { n: '04', title: 'LAUNCH', text: 'Testing, deployment and final delivery.', color: '#20C987' },
];

export const ProcessSection: React.FC = () => {
  const { settings } = useSite();
  return (
  <section id="process" className="border-t border-white/10 px-5 py-24 sm:px-8 lg:py-32">
    <div className="mx-auto max-w-7xl">
      <SectionTitle title={settings.processTitle} intro="Four clear steps from first conversation to a live website." />
      <div className="relative">
        <motion.div className="absolute left-0 right-0 top-[38px] hidden h-px origin-left bg-gradient-to-r from-brand via-violet to-emerald lg:block" initial={{ scaleX: 0 }} whileInView={{ scaleX: 1 }} viewport={{ once: true }} transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }} />
        <ol className="grid gap-10 lg:grid-cols-4 lg:gap-6">
          {STEPS.map((s, i) => (
            <Reveal key={s.n} delay={i * 0.12}>
              <li className="relative">
                <span className="relative mb-6 grid h-[76px] w-[76px] place-items-center rounded-full border bg-black font-sora text-2xl font-bold" style={{ borderColor: s.color, color: s.color }}>{s.n}</span>
                <h3 className="font-display text-2xl font-bold tracking-tight">{s.title}</h3>
                <p className="mt-2 max-w-[16rem] leading-relaxed text-muted">{s.text}</p>
              </li>
            </Reveal>
          ))}
        </ol>
      </div>
    </div>
  </section>
  );
};
