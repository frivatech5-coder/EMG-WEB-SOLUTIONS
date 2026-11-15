import React, { useEffect, useRef, useState } from 'react';
import { Bot, MessageCircle, Send, Sparkles, Trash2, User, X } from 'lucide-react';
import { useSite } from '../context/SiteContext';
import { ChatMessage } from '../types';
import { priceLabel, waLink } from '../lib/format';

interface Props { isOpen: boolean; onClose: () => void; onOpen: () => void; initialMessage?: string }
const now = () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

export const AiChatbot: React.FC<Props> = ({ isOpen, onClose, onOpen, initialMessage }) => {
  const { settings, services, portfolio } = useSite();
  const wa = settings.whatsapp || settings.phone;
  const aiName = settings.aiName || 'Evans';
  const aiLogo = settings.aiLogo || '/assets/aistudio/EMG_AI_Neon_Tech_Logo_34e96ab4.png';

  const welcome = (): ChatMessage => ({
    id: 'welcome', role: 'assistant', timestamp: now(),
    content: `Hello! I'm ${aiName}, the ${settings.companyName} virtual assistant. I can help you with our services, pricing, quotations or booking a consultation. What would you like to know?`,
  });
  const [messages, setMessages] = useState<ChatMessage[]>([welcome()]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const sentInitial = useRef<string | undefined>(undefined);

  useEffect(() => {
    setMessages((prev) =>
      prev.map((m) =>
        m.id === 'welcome'
          ? { ...m, content: `Hello! I'm ${aiName}, the ${settings.companyName} virtual assistant. I can help you with our services, pricing, quotations or booking a consultation. What would you like to know?` }
          : m
      )
    );
  }, [aiName, settings.companyName]);

  useEffect(() => { if (isOpen) endRef.current?.scrollIntoView({ behavior: busy ? 'auto' : 'smooth' }); }, [messages, busy, isOpen]);
  useEffect(() => {
    if (isOpen && initialMessage && sentInitial.current !== initialMessage) { sentInitial.current = initialMessage; void send(initialMessage); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialMessage, isOpen]);

  const chips = ['What services do you offer?', 'How much does a website cost?', 'I need a quotation', 'Book a consultation'];

  const send = async (text?: string) => {
    const content = (text ?? input).trim();
    if (!content || busy) return;
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
          messages: history.filter((m) => m.id !== 'welcome').slice(-10).map((m) => ({ role: m.role, content: m.content })),
          siteContext: {
            companyName: settings.companyName, motto: settings.motto, phone: settings.phone, whatsapp: wa, email: settings.email,
            aiName,
            services: services.map((s) => ({ name: s.name, price: priceLabel(s), delivery: s.deliveryTime, description: s.shortDesc, features: s.features.slice(0, 6) })),
            portfolio: portfolio.filter((p) => !p.id.startsWith('placeholder')).map((p) => ({ title: p.title, category: p.category, url: p.liveUrl || '' })),
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
      } else {
        const data = await res.json();
        if (!data.reply) throw new Error('empty');
        appendDelta(String(data.reply));
      }
    } catch {
      if (!addedBubble) {
        setFailed(true);
        setMessages((p) => [...p, { id: `e-${Date.now()}`, role: 'assistant', timestamp: now(), content: "Sorry, I'm having trouble connecting right now. You can reach our team directly on WhatsApp and we'll help you straight away." }]);
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
        <input id="chat-input" value={input} onChange={(e) => setInput(e.target.value)} maxLength={1000} placeholder="Ask about services, pricing, quotes…" className="min-w-0 flex-1 rounded-xl border border-white/15 bg-black px-4 py-3 text-sm focus:border-brand focus:outline-none" />
        <a href={waLink(wa)} target="_blank" rel="noopener noreferrer" aria-label="Chat on WhatsApp" className="grid h-11 w-11 place-items-center rounded-xl border border-[#25D366]/50 text-[#25D366] hover:bg-[#25D366] hover:text-black"><MessageCircle size={18} /></a>
        <button type="submit" disabled={busy || !input.trim()} aria-label="Send message" className="grid h-11 w-11 place-items-center rounded-xl bg-brand text-white disabled:opacity-50"><Send size={18} /></button>
      </form>
    </div>
  );
};
