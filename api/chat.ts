import process from 'node:process';
import { GoogleGenAI, ThinkingLevel } from '@google/genai';

const str = (v: unknown, max: number) => (typeof v === 'string' ? v.slice(0, max) : '');

export async function POST(request: Request): Promise<Response> {
  let wantsStream = false;
  let fallback = "Thanks for reaching out! For quick help, please message our team on WhatsApp or use the contact form on this page.";

  try {
    const body = (await request.json().catch(() => ({}))) as {
      stream?: boolean;
      messages?: { role?: string; content?: string }[];
      siteContext?: Record<string, unknown>;
    };
    wantsStream = body?.stream === true;

    const rawMessages = Array.isArray(body?.messages) ? body.messages.slice(-10) : [];
    const messages = rawMessages
      .map((m) => ({
        role: m?.role === 'assistant' ? 'assistant' : 'user',
        content: str(m?.content, 1000),
      }))
      .filter((m) => m.content.trim());

    const userMessage = messages[messages.length - 1]?.content || '';
    if (!userMessage) {
      return new Response(JSON.stringify({ error: 'Message content is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const ctx = (body?.siteContext || {}) as Record<string, unknown>;
    const company = str(ctx.companyName, 80) || 'EMG WEB SOLUTIONS';
    const aiName = str(ctx.aiName, 40) || 'Evans';
    const phone = str(ctx.phone, 30) || '0142201120';
    const whatsapp = str(ctx.whatsapp, 30) || phone;
    const email = str(ctx.email, 100) || 'contact@emgwebsolutions.com';
    const motto = str(ctx.motto, 100) || 'Your Vision, Our Code!';

    const services = (Array.isArray(ctx.services) ? ctx.services : []).slice(0, 16).map((s: Record<string, unknown>) => ({
      n: str(s?.name, 70),
      p: str(s?.price, 35),
      d: str(s?.delivery, 40),
      desc: str(s?.description, 160),
      f: Array.isArray(s?.features) ? s.features.slice(0, 6).map((x) => str(x, 60)) : [],
    }));
    const portfolio = (Array.isArray(ctx.portfolio) ? ctx.portfolio : []).slice(0, 12).map((p: Record<string, unknown>) => ({
      t: str(p?.title, 70),
      c: str(p?.category, 45),
      u: str(p?.url, 150),
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
      ? services.map((s) => `• ${s.n}${s.p ? ` — ${s.p}` : ''}`).join('\n')
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
          ? `Some of our projects: ${portfolio.map((p) => p.t).join(', ')}. You can see them in the Selected Projects section.`
          : `Our Selected Projects section shows our work. For examples relevant to your industry, message us on WhatsApp (${whatsapp}).`;
      }
      if (/(consult|book|meeting|appointment)/.test(lower)) {
        return `We'd be glad to arrange a consultation. Message us on WhatsApp (${whatsapp}) or send your details through the contact form and we'll get back to you.`;
      }
      return `Hello! I'm ${aiName}, the ${company} virtual assistant. We offer:\n${serviceLines}\n\nHow can I help you today?`;
    };

    fallback = fallbackReply(userMessage);

    const key = process.env.GEMINI_API_KEY;
    const hasValidKey = Boolean(key && key !== 'MY_GEMINI_API_KEY' && key.length > 10);
    const ai = hasValidKey
      ? new GoogleGenAI({
          apiKey: key,
          httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
        })
      : null;

    const model = process.env.GEMINI_MODEL || 'gemini-4-hydrogen';
    const contents = messages.map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

    if (wantsStream) {
      const encoder = new TextEncoder();
      const readable = new ReadableStream({
        async start(controller) {
          const push = (payload: Record<string, unknown>) => {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`));
          };
          let sentAny = false;
          if (ai) {
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
                  push({ delta });
                }
              }
            } catch (err) {
              console.warn('AI stream failed; using built-in reply:', err instanceof Error ? err.message : err);
            }
          }
          if (!sentAny) push({ delta: fallback });
          push({ done: true });
          controller.close();
        },
      });

      return new Response(readable, {
        headers: {
          'Content-Type': 'text/event-stream; charset=utf-8',
          'Cache-Control': 'no-cache, no-transform',
          Connection: 'keep-alive',
        },
      });
    }

    if (ai) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents,
          config: {
            systemInstruction,
            thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          },
        });
        return new Response(JSON.stringify({ reply: response.text || fallback }), {
          headers: { 'Content-Type': 'application/json' },
        });
      } catch (err) {
        console.warn('AI request failed; using built-in reply:', err instanceof Error ? err.message : err);
      }
    }

    return new Response(JSON.stringify({ reply: fallback }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Vercel /api/chat error:', error);
    if (wantsStream) {
      const encoder = new TextEncoder();
      const body = `data: ${JSON.stringify({ delta: fallback })}\n\ndata: ${JSON.stringify({ done: true })}\n\n`;
      return new Response(encoder.encode(body), {
        headers: { 'Content-Type': 'text/event-stream; charset=utf-8' },
      });
    }
    return new Response(JSON.stringify({ reply: fallback }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
