import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Bot, MessageCircle, Send, Sparkles, Trash2, User, X } from 'lucide-react';
import { useSite } from '../context/SiteContext';
import { ChatMessage } from '../types';
import { priceLabel, waLink } from '../lib/format';

interface Props { isOpen: boolean; onClose: () => void; onOpen: () => void; initialMessage?: string }
const now = () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
const VISITOR_KEY = 'emg_visitor';
const NON_NAMES = new Set(['good', 'fine', 'great', 'okay', 'ok', 'well', 'doing', 'looking', 'interested', 'asking', 'building', 'trying', 'here', 'new', 'ready', 'sure', 'not', 'just', 'from', 'a', 'an', 'the', 'happy', 'glad', 'sorry', 'back', 'planning', 'starting', 'running', 'searching', 'wondering', 'curious', 'having']);

const getTimeOfDay = () => {
  const h = new Date().getHours();
  return h < 12 ? 'morning' : h < 17 ? 'afternoon' : 'evening';
};

const readVisitor = (): { name: string; service: string } => {
  try {
    const raw = localStorage.getItem(VISITOR_KEY);
    if (!raw) return { name: '', service: '' };
    const parsed = JSON.parse(raw) as { name?: string; service?: string };
    return { name: (parsed.name || '').slice(0, 40), service: (parsed.service || '').slice(0, 60) };
  } catch {
    return { name: '', service: '' };
  }
};

const detectVisitorName = (text: string): string => {
  const m = text.match(/\b(?:my name is|call me|i['’]?m|i am)\s+([A-Za-z][A-Za-z'-]{1,20})\b/i);
  if (!m) return '';
  const word = m[1];
  if (NON_NAMES.has(word.toLowerCase())) return '';
  return word.charAt(0).toUpperCase() + word.slice(1);
};

export const AiChatbot: React.FC<Props> = ({ isOpen, onClose, onOpen, initialMessage }) => {
  const { settings, services, portfolio } = useSite();
  const wa = settings.whatsapp || settings.phone;
  const aiName = settings.aiName || 'Evans';
  const aiLogo = settings.aiLogo || '/assets/aistudio/EMG_AI_Neon_Tech_Logo_34e96ab4.png';
  const [visitor, setVisitor] = useState(readVisitor);

  const buildWelcomeText = (name: string) => {
    const tod = getTimeOfDay();
    const hi = name ? `Good ${tod}, ${name}!` : `Good ${tod}!`;
    return `${hi} I'm ${aiName}, the ${settings.companyName} virtual assistant. Ask me anything—from everyday questions to tailored website quotes and services.`;
  };

  const welcome = (name = visitor.name): ChatMessage => ({
    id: 'welcome', role: 'assistant', timestamp: now(),
    content: buildWelcomeText(name),
  });
  const [messages, setMessages] = useState<ChatMessage[]>(() => [welcome(readVisitor().name)]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const sentInitial = useRef<string | undefined>(undefined);

  useEffect(() => {
    const syncVisitor = () => setVisitor(readVisitor());
    window.addEventListener('emg-visitor-updated', syncVisitor);
    return () => window.removeEventListener('emg-visitor-updated', syncVisitor);
  }, []);

  useEffect(() => {
    setMessages((prev) =>
      prev.map((m) => (m.id === 'welcome' ? { ...m, content: buildWelcomeText(visitor.name) } : m))
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aiName, settings.companyName, visitor.name]);

  useEffect(() => { if (isOpen) endRef.current?.scrollIntoView({ behavior: busy ? 'auto' : 'smooth' }); }, [messages, busy, isOpen]);
  useEffect(() => {
    if (isOpen && initialMessage && sentInitial.current !== initialMessage) { sentInitial.current = initialMessage; void send(initialMessage); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialMessage, isOpen]);

  const compactServices = useMemo(
    () => services.slice(0, 14).map((s) => ({ name: s.name, price: priceLabel(s), delivery: s.deliveryTime, description: s.shortDesc })),
    [services]
  );
  const compactPortfolio = useMemo(
    () => portfolio.filter((p) => !p.id.startsWith('placeholder')).slice(0, 10).map((p) => ({ title: p.title, category: p.category })),
    [portfolio]
  );

  const chips = ['What services do you offer?', 'How much does a website cost?', 'Why is a website important?', 'Book a consultation'];

  const localReply = (q: string, activeName = visitor.name) => {
    const lower = q.toLowerCase().trim();
    const tod = getTimeOfDay();
    const hiName = activeName ? `, ${activeName}` : '';
    const serviceLines = services.length
      ? services.map((s) => `• ${s.name} — ${priceLabel(s)}`).join('\n')
      : '• Website development, redesign, e-commerce, landing pages, SEO and social media management';
    if (/(how are you|how r u|how's it going|how are things|how do you do|how u doing)/.test(lower)) {
      return `I'm doing great${hiName}, thank you for asking! Hope you're having a wonderful ${tod}. How can I help you today?`;
    }
    if (/^(hi|hello|hey|good morning|good afternoon|good evening|habari|sasa|mambo|greetings)[!.\s?]*$/i.test(lower)) {
      return `Good ${tod}${hiName}! Great to chat with you. I'm ${aiName}, the ${settings.companyName} virtual assistant—ask me anything, from everyday questions to personalized project quotes!`;
    }
    if (/(thank you|thanks|appreciate|shukran|asante)/.test(lower)) {
      return `You're very welcome${hiName}! Anytime you need help, just ask here or reach us on WhatsApp (${wa}).`;
    }
    if (/(who are you|what is your name|what's your name|your name)/.test(lower)) {
      return `I'm ${aiName}, the ${settings.companyName} virtual assistant. I can answer everyday questions, explain website concepts, or tailor a recommendation for you${hiName}.`;
    }
    if (/(what is a website|define website|meaning of.*website|what's a website)/.test(lower)) {
      return `A website is your 24/7 online home under a unique address (like yourbusiness.com)—a collection of pages where customers can learn about you, explore services or products, and contact or buy from you anytime.`;
    }
    if (/(importance|benefit|why.*(need|have)|advantage|value).*(website|site)|website.*(important|useful|matter|benefit)/.test(lower)) {
      return `A website gives you 24/7 visibility, instant credibility, and full control—unlike social media algorithms. It helps people find you on Google, builds trust with real projects and reviews, and turns visitors into WhatsApp or email leads. Want me to recommend the best option for you${hiName}?`;
    }
    if (/(what is.*domain|domain name|web hosting|what is hosting)/.test(lower)) {
      return `A domain name is your website's address (like emgwebsolutions.com), while hosting is the secure server space where your site lives online 24/7.`;
    }
    if (/(what is.*seo|search engine opt)/.test(lower)) {
      return `SEO (Search Engine Optimization) helps your website rank higher on Google when people search for what you offer—bringing steady organic customers without paying per click.`;
    }
    const matchedService = services.find((s) => lower.includes(s.name.toLowerCase()));
    if (matchedService) {
      return `${matchedService.name} (${priceLabel(matchedService)}${matchedService.deliveryTime ? `, ${matchedService.deliveryTime}` : ''}): ${matchedService.shortDesc}\n\nMessage us on WhatsApp (${wa}) or use the contact form to get started${hiName}.`;
    }
    if (/(price|cost|how much|rate|package|quote|quotation|service|offer)/.test(lower)) {
      return `Here are our services and pricing (KSh)${hiName}:\n${serviceLines}\n\nTell me what kind of project you have in mind or message us on WhatsApp (${wa}) for an exact quote.`;
    }
    if (/(phone|call|contact|whatsapp|reach|number|email)/.test(lower)) {
      return `You can reach ${settings.companyName} on WhatsApp or phone at ${wa}, or by email at ${settings.email}.`;
    }
    if (/(work|portfolio|project|example)/.test(lower)) {
      return compactPortfolio.length
        ? `Some of our projects: ${compactPortfolio.map((p) => p.title).join(', ')}. You can view them all in our Projects section.`
        : `Our Projects section showcases our work. For examples tailored to your industry${hiName}, message us on WhatsApp (${wa}).`;
    }
    if (/(consult|book|meeting|appointment)/.test(lower)) {
      return `We'd love to book a quick consultation${hiName}. Message us on WhatsApp (${wa}) or use the contact form and our team will get right back to you.`;
    }
    return `Good ${tod}${hiName}! I'm ${aiName}, the ${settings.companyName} virtual assistant. Ask me anything—from everyday questions to tailored website options:\n${serviceLines}`;
  };

  const send = async (text?: string) => {
    const content = (text ?? input).trim();
    if (!content || busy) return;
    const detectedName = detectVisitorName(content);
    const activeVisitorName = detectedName || visitor.name;
    if (detectedName && detectedName !== visitor.name) {
      const next = { ...visitor, name: detectedName };
      setVisitor(next);
      try { localStorage.setItem(VISITOR_KEY, JSON.stringify(next)); } catch { /* ignore */ }
    }

    const userMsg: ChatMessage = { id: `u-${Date.now()}`, role: 'user', content: content.slice(0, 1000), timestamp: now() };
    const history = [...messages, userMsg];
    setMessages(history); setInput(''); setBusy(true); setFailed(false);
    const assistantId = `a-${Date.now()}`;
    let addedBubble = false;

    const appendDelta = (delta: string) => {
      if (!delta) return;
      if (!addedBubble) {
        addedBubble = true;
        setMessages((p) => [...p, { id: assistantId, role: 'assistant', content: delta, timestamp: now() }]);
      } else {
        setMessages((p) => p.map((m) => (m.id === assistantId ? { ...m, content: m.content + delta } : m)));
      }
    };

    try {
      const res = await fetch('/api/chat', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stream: true,
          messages: history.filter((m) => m.id !== 'welcome').slice(-8).map((m) => ({ role: m.role, content: m.content })),
          siteContext: {
            companyName: settings.companyName, motto: settings.motto, phone: settings.phone, whatsapp: wa, email: settings.email,
            aiName,
            visitorName: activeVisitorName,
            preferredService: visitor.service,
            timeOfDay: getTimeOfDay(),
            currentPage: typeof window !== 'undefined' ? window.location.pathname : '/',
            services: compactServices,
            portfolio: compactPortfolio,
          },
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('text/event-stream') && res.body) {
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const events = buffer.split('\n\n');
          buffer = events.pop() || '';
          for (const evt of events) {
            const line = evt.split('\n').find((l) => l.startsWith('data:'));
            if (!line) continue;
            try {
              const payload = JSON.parse(line.slice(5).trim()) as { delta?: string; done?: boolean };
              if (payload.delta) appendDelta(String(payload.delta));
            } catch { /* ignore partial JSON */ }
          }
        }
        if (!addedBubble) throw new Error('empty');
      } else if (contentType.includes('application/json')) {
        const data = await res.json();
        if (!data.reply) throw new Error('empty');
        appendDelta(String(data.reply));
      } else {
        throw new Error('unsupported-response');
      }
    } catch {
      if (!addedBubble) {
        setFailed(true);
        setMessages((p) => [...p, { id: `e-${Date.now()}`, role: 'assistant', timestamp: now(), content: localReply(content, activeVisitorName) }]);
      }
    } finally { setBusy(false); }
  };

  const clear = () => { setMessages([welcome()]); setFailed(false); setInput(''); };

  if (!isOpen) {
    return (
      <div className="fixed bottom-5 right-4 z-40 flex items-center gap-3 sm:bottom-6 sm:right-6">
        <span className="hidden items-center gap-2 rounded-full border border-brand/40 bg-navy/95 px-3.5 py-2 text-xs font-semibold shadow-xl sm:flex">
          <span className="h-2 w-2 animate-pulse rounded-full bg-emerald" />Chat with {aiName}
        </span>
        <button
          onClick={onOpen}
          aria-label={`Open chat with ${aiName}, the virtual assistant`}
          className="group relative grid h-14 w-14 place-items-center overflow-hidden rounded-2xl border border-brand/50 bg-black text-white shadow-xl shadow-brand/40 transition-all duration-300 hover:scale-105 hover:border-brand hover:shadow-brand/60"
        >
          {aiLogo ? (
            <img src={aiLogo} alt={aiName} onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/assets/aistudio/EMG_AI_Neon_Tech_Logo_34e96ab4.png'; }} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110" />
          ) : (
            <Sparkles size={24} className="text-brand" />
          )}
          <span className="absolute -right-0.5 -top-0.5 h-3.5 w-3.5 rounded-full border-2 border-black bg-emerald" />
        </button>
      </div>
    );
  }

  return (
    <div role="dialog" aria-label={`Chat with ${aiName}`} className="fixed inset-x-2 bottom-2 z-50 flex h-[min(640px,calc(100dvh-1rem))] flex-col overflow-hidden rounded-3xl border border-white/15 bg-black shadow-2xl shadow-black sm:inset-x-auto sm:bottom-6 sm:right-6 sm:w-[410px]">
      <div className="flex items-center justify-between border-b border-white/10 bg-navy p-3.5">
        <div className="flex items-center gap-3">
          <div className="relative grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-xl border border-brand/40 bg-black">
            {aiLogo ? (
              <img src={aiLogo} alt={aiName} onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/assets/aistudio/EMG_AI_Neon_Tech_Logo_34e96ab4.png'; }} className="h-full w-full object-cover" />
            ) : (
              <Bot size={20} className="text-brand" />
            )}
            <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border border-navy bg-emerald" />
          </div>
          <div>
            <h2 className="text-sm font-bold">{aiName}</h2>
            <p className="text-[11px] text-muted">{settings.companyName} virtual assistant</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={clear} aria-label="Clear chat" title="Clear chat" className="grid h-10 w-10 place-items-center rounded-lg text-muted hover:bg-white/10 hover:text-white"><Trash2 size={17} /></button>
          <button onClick={onClose} aria-label="Close chat" className="grid h-10 w-10 place-items-center rounded-lg text-muted hover:bg-white/10 hover:text-white"><X size={18} /></button>
        </div>
      </div>
      <div className="flex-1 space-y-4 overflow-y-auto p-4" aria-live="polite">
        {messages.map((m) => (
          <div key={m.id} className={`flex gap-2.5 ${m.role === 'user' ? 'justify-end' : ''}`}>
            {m.role === 'assistant' && (
              <div className="mt-1 grid h-7 w-7 shrink-0 place-items-center overflow-hidden rounded-lg border border-brand/30 bg-black">
                {aiLogo ? (
                  <img src={aiLogo} alt={aiName} onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/assets/aistudio/EMG_AI_Neon_Tech_Logo_34e96ab4.png'; }} className="h-full w-full object-cover" />
                ) : (
                  <Bot size={15} className="text-brand" />
                )}
              </div>
            )}
            <div className={`max-w-[82%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${m.role === 'user' ? 'rounded-br-sm bg-brand text-white' : 'rounded-bl-sm border border-white/10 bg-navy'}`}>
              <p className="whitespace-pre-line">{m.content}</p><span className="mt-1.5 block text-[10px] opacity-60">{m.timestamp}</span>
            </div>
            {m.role === 'user' && <div className="mt-1 grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-white/10"><User size={15} /></div>}
          </div>
        ))}
        {busy && messages[messages.length - 1]?.role === 'user' && (
          <div className="flex items-center gap-2.5" role="status" aria-label={`${aiName} is typing`}>
            <div className="grid h-7 w-7 shrink-0 place-items-center overflow-hidden rounded-lg border border-brand/30 bg-black">
              {aiLogo ? (
                <img src={aiLogo} alt={aiName} onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/assets/aistudio/EMG_AI_Neon_Tech_Logo_34e96ab4.png'; }} className="h-full w-full object-cover" />
              ) : (
                <Bot size={15} className="text-brand" />
              )}
            </div>
            <div className="flex items-center gap-1.5 rounded-2xl border border-white/10 bg-navy px-4 py-3">{[0, 0.2, 0.4].map((d) => <span key={d} className="h-1.5 w-1.5 animate-bounce rounded-full bg-brand" style={{ animationDelay: `${d}s` }} />)}</div>
          </div>
        )}
        {failed && <a href={waLink(wa)} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 rounded-xl bg-[#25D366] py-3 text-sm font-bold text-black"><MessageCircle size={18} /> Continue on WhatsApp</a>}
        <div ref={endRef} />
      </div>
      <div className="no-scrollbar flex gap-2 overflow-x-auto border-t border-white/10 p-2.5">
        {chips.map((c) => <button key={c} onClick={() => send(c)} disabled={busy} className="whitespace-nowrap rounded-full border border-white/15 px-3.5 py-2 text-xs text-white/80 hover:border-brand hover:text-white disabled:opacity-50">{c}</button>)}
      </div>
      <form onSubmit={(e) => { e.preventDefault(); void send(); }} className="flex items-center gap-2 border-t border-white/10 bg-navy p-3">
        <label htmlFor="chat-input" className="sr-only">Message {aiName}</label>
        <input id="chat-input" value={input} onChange={(e) => setInput(e.target.value)} maxLength={1000} placeholder="Ask me anything—websites, services, pricing…" className="min-w-0 flex-1 rounded-xl border border-white/15 bg-black px-4 py-3 text-sm focus:border-brand focus:outline-none" />
        <a href={waLink(wa)} target="_blank" rel="noopener noreferrer" aria-label="Chat on WhatsApp" className="grid h-11 w-11 place-items-center rounded-xl border border-[#25D366]/50 text-[#25D366] hover:bg-[#25D366] hover:text-black"><MessageCircle size={18} /></a>
        <button type="submit" disabled={busy || !input.trim()} aria-label="Send message" className="grid h-11 w-11 place-items-center rounded-xl bg-brand text-white disabled:opacity-50"><Send size={18} /></button>
      </form>
    </div>
  );
};
