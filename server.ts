import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, ThinkingLevel } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.disable('x-powered-by');
app.use(express.json({ limit: '50kb' }));
app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

// Initialize server-side Gemini client with required User-Agent
let ai: GoogleGenAI | null = null;
if (process.env.GEMINI_API_KEY) {
  ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// ── AI chatbot ───────────────────────────────────────────────────────────────
// Simple in-memory rate limit: 20 requests / minute / IP.
const hits = new Map<string, number[]>();
const limited = (ip: string) => {
  const now = Date.now();
  const list = (hits.get(ip) || []).filter((t) => now - t < 60000);
  list.push(now);
  hits.set(ip, list);
  return list.length > 20;
};

const str = (v: unknown, max: number) => (typeof v === 'string' ? v.slice(0, max) : '');

app.post('/api/chat', async (req, res) => {
  const wantsStream = req.body?.stream === true;
  try {
    if (limited(req.ip || 'unknown')) {
      return res.status(429).json({ error: 'Too many requests' });
    }

    const rawMessages = Array.isArray(req.body?.messages) ? req.body.messages.slice(-10) : [];
    const messages = rawMessages
      .map((m: { role?: string; content?: string }) => ({ role: m?.role === 'assistant' ? 'assistant' : 'user', content: str(m?.content, 1000) }))
      .filter((m: { content: string }) => m.content.trim());
    const userMessage = messages[messages.length - 1]?.content || '';
    if (!userMessage) return res.status(400).json({ error: 'Message content is required' });

    // Business facts come from the website (Firestore) via the client.
    const ctx = req.body?.siteContext || {};
    const company = str(ctx.companyName, 80) || 'EMG WEB SOLUTIONS';
    const aiName = str(ctx.aiName, 40) || 'Evans';
    const phone = str(ctx.phone, 30) || '0142201120';
    const whatsapp = str(ctx.whatsapp, 30) || phone;
    const email = str(ctx.email, 100) || 'contact@emgwebsolutions.com';
    const motto = str(ctx.motto, 100) || 'Your Vision, Our Code!';
    const services = (Array.isArray(ctx.services) ? ctx.services : []).slice(0, 16).map((s: Record<string, unknown>) => ({
      n: str(s.name, 70),
      p: str(s.price, 35),
      d: str(s.delivery, 40),
      desc: str(s.description, 160),
      f: Array.isArray(s.features) ? s.features.slice(0, 6).map((x) => str(x, 60)) : [],
    }));
    const portfolio = (Array.isArray(ctx.portfolio) ? ctx.portfolio : []).slice(0, 12).map((p: Record<string, unknown>) => ({
      t: str(p.title, 70),
      c: str(p.category, 45),
      u: str(p.url, 150),
    }));

    const systemInstruction = `You are ${aiName}, virtual assistant for ${company} (${motto}).
Contact: WhatsApp ${whatsapp}, Phone ${phone}, Email ${email}.
Services (KSh): ${JSON.stringify(services)}
Projects: ${JSON.stringify(portfolio)}
Rules:
1. Introduce yourself as "${aiName}, the ${company} virtual assistant" when greeting. Never mention AI models or underlying tech.
2. Only state listed facts/prices in KSh (never USD). If pricing says Custom quote or isn't listed, invite them to share details or WhatsApp ${whatsapp}.
3. Reply fast, warm, and concisely (under 90 words unless detail is needed). Stay on topic (web/digital services).`;

    const serviceLines = services.length
      ? services.map((s: { n: string; p: string }) => `• ${s.n}${s.p ? ` — ${s.p}` : ''}`).join('\n')
      : '• Website development, redesign, e-commerce, landing pages, SEO and social media management';

    const fallbackReply = (q: string) => {
      const lower = q.toLowerCase();
      if (/(price|cost|how much|rate|package|quote|quotation)/.test(lower)) {
        return `Here are our services and pricing (KSh):\n${serviceLines}\n\nFor an exact quotation, tell us about your project on WhatsApp (${whatsapp}) or use the contact form on this page.`;
      }
      if (/(phone|call|contact|whatsapp|reach|number|email)/.test(lower)) {
        return `You can reach ${company} on WhatsApp or phone at ${whatsapp}, or by email at ${email}.`;
      }
      if (/(work|portfolio|project|example)/.test(lower)) {
        return portfolio.length
          ? `Some of our projects: ${portfolio.map((p: { t: string }) => p.t).join(', ')}. You can see them in the Selected Projects section.`
          : `Our Selected Projects section shows our work. For examples relevant to your industry, message us on WhatsApp (${whatsapp}).`;
      }
      if (/(consult|book|meeting|appointment)/.test(lower)) {
        return `We'd be glad to arrange a consultation. Message us on WhatsApp (${whatsapp}) or send your details through the contact form and we'll get back to you.`;
      }
      return `Hello! I'm ${aiName}, the ${company} virtual assistant. We offer:\n${serviceLines}\n\nHow can I help you today?`;
    };

    const key = process.env.GEMINI_API_KEY;
    const hasValidKey = Boolean(key && key !== 'MY_GEMINI_API_KEY' && key.length > 10);
    const model = process.env.GEMINI_MODEL || 'gemini-4-hydrogen';
    const contents = messages.map((m: { role: string; content: string }) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

    if (wantsStream) {
      res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
      res.setHeader('Cache-Control', 'no-cache, no-transform');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('X-Accel-Buffering', 'no');
      res.flushHeaders?.();

      const writeEvent = (payload: Record<string, unknown>) => {
        if (!res.writableEnded) {
          res.write(`data: ${JSON.stringify(payload)}\n\n`);
        }
      };

      let sentAny = false;
      if (ai && hasValidKey) {
        try {
          const stream = await ai.models.generateContentStream({
            model,
            contents,
            config: {
              systemInstruction,
              thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
            },
          });
          for await (const chunk of stream) {
            const delta = chunk.text;
            if (delta) {
              sentAny = true;
              writeEvent({ delta });
            }
          }
        } catch (err) {
          console.warn('AI stream failed; using built-in reply:', err instanceof Error ? err.message : err);
        }
      }

      if (!sentAny) {
        writeEvent({ delta: fallbackReply(userMessage) });
      }
      writeEvent({ done: true });
      return res.end();
    }

    if (ai && hasValidKey) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents,
          config: {
            systemInstruction,
            thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          },
        });
        return res.json({ reply: response.text || fallbackReply(userMessage) });
      } catch (err) {
        console.warn('AI request failed; using built-in reply:', err instanceof Error ? err.message : err);
      }
    }
    return res.json({ reply: fallbackReply(userMessage) });
  } catch (error) {
    console.error('Chat endpoint error:', error);
    if (wantsStream && res.headersSent) {
      if (!res.writableEnded) {
        res.write(`data: ${JSON.stringify({ delta: "Thanks for reaching out! Please message our team on WhatsApp or use the contact form on this page." })}\n\n`);
        res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
        res.end();
      }
      return;
    }
    return res.json({ reply: "Thanks for reaching out! For quick help, please message our team on WhatsApp or use the contact form on this page." });
  }
});

// Setup Vite in development or serve static in production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`EMG Web Solutions server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
