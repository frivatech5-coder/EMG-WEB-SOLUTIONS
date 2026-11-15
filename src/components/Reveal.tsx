import React from 'react';
import { motion } from 'motion/react';

export const Reveal: React.FC<{ children: React.ReactNode; delay?: number; className?: string }> = ({ children, delay = 0, className }) => (
  <motion.div
    className={className}
    initial={{ opacity: 0, y: 22 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: '-70px' }}
    transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
  >
    {children}
  </motion.div>
);

export const SectionTitle: React.FC<{ title: string; intro?: string }> = ({ title, intro }) => (
  <Reveal className="mb-12 grid gap-6 lg:grid-cols-[1.3fr_1fr] lg:items-end">
    <h2 className="font-display text-4xl font-bold uppercase leading-[0.98] tracking-tight text-white sm:text-5xl lg:text-6xl">{title}</h2>
    {intro && <p className="max-w-md text-base leading-relaxed text-muted lg:justify-self-end">{intro}</p>}
  </Reveal>
);
