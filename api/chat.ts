import process from 'node:process';
import { GoogleGenAI, ThinkingLevel } from '@google/genai';

const str = (v: unknown, max: number) => (typeof v === 'string' ? v.slice(0, max) : '');

const apiKey = process.env.GEMINI_API_KEY;
const hasValidKey = Boolean(apiKey && apiKey !== 'MY_GEMINI_API_KEY' && apiKey.length > 10);
const ai = hasValidKey
  ? new GoogleGenAI({
      apiKey,
      httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
    })
  : null;

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

    const rawMessages = Array.isArray(body?.messages) ? body.messages.slice(-8) : [];
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
    const visitorName = str(ctx.visitorName, 40);
    const timeOfDay = str(ctx.timeOfDay, 20) || 'day';
    const currentPage = str(ctx.currentPage, 40) || '/';
    const preferredService = str(ctx.preferredService, 60);

    const services = (Array.isArray(ctx.services) ? ctx.services : []).slice(0, 14).map((s: Record<string, unknown>) => ({
      n: str(s?.name, 70),
      p: str(s?.price, 35),
      d: str(s?.delivery, 40),
      desc: str(s?.description, 140),
    }));
    const portfolio = (Array.isArray(ctx.portfolio) ? ctx.portfolio : []).slice(0, 10).map((p: Record<string, unknown>) => ({
      t: str(p?.title, 70),
      c: str(p?.category, 45),
    }));

    const serviceSummary = services.map((s) => `${s.n} (${s.p}${s.d ? `, ${s.d}` : ''}): ${s.desc}`).join(' | ');
    const portfolioSummary = portfolio.map((p) => `${p.t} [${p.c}]`).join(', ');
    const visitorLine = [
      visitorName ? `Name: ${visitorName}` : null,
      `Local time: ${timeOfDay}`,
      `Page: ${currentPage}`,
      preferredService ? `Recent interest: ${preferredService}` : null,
    ].filter(Boolean).join(' · ');

    const systemInstruction = `You are ${aiName}, the warm, fast, personalized virtual assistant for ${company} (${motto}).
Visitor context: ${visitorLine}
Contact: WhatsApp ${whatsapp}, Phone ${phone}, Email ${email}.
Services (KSh): ${serviceSummary || 'Website development, redesign, e-commerce, landing pages, SEO, social media management'}
Projects: ${portfolioSummary || 'Available in Selected Projects'}
Rules:
1. Personalize replies: use the visitor's name naturally if known (or remembered from chat), match their tone, and tailor explanations/examples to their business type or goals.
2. Answer everyday & general questions warmly ("How are you?", "What is a website?", "Why is a website important?", business/tech tips).
3. If asked who you are, introduce yourself as "${aiName}, the ${company} virtual assistant". Never mention AI models or tech.
4. For ${company} facts/prices (KSh only, never USD), only state listed info—never invent prices, discounts, or office addresses. For custom quotes, invite them to share details or WhatsApp ${whatsapp}.
5. Be crisp and fast to read (35–85 words unless detail is requested).`;

    const serviceLines = services.length
      ? services.map((s) => `• ${s.n}${s.p ? ` — ${s.p}` : ''}`).join('\n')
      : '• Website development, redesign, e-commerce, landing pages, SEO and social media management';
    const hiName = visitorName ? `, ${visitorName}` : '';

    const fallbackReply = (q: string) => {
      const lower = q.toLowerCase().trim();
      if (/(how are you|how r u|how's it going|how are things|how do you do|how u doing)/.test(lower)) {
        return `I'm doing great${hiName}, thank you for asking! Hope you're having a wonderful ${timeOfDay}. How can I help you today?`;
      }
      if (/^(hi|hello|hey|good morning|good afternoon|good evening|habari|sasa|mambo|greetings)[!.\s?]*$/i.test(lower)) {
        return `Good ${timeOfDay}${hiName}! Great to chat with you. I'm ${aiName}, the ${company} virtual assistant—ask me anything, from general website questions to personalized project quotes!`;
      }
      if (/(thank you|thanks|appreciate|shukran|asante)/.test(lower)) {
        return `You're very welcome${hiName}! Anytime you need help, just ask here or message us on WhatsApp (${whatsapp}).`;
      }
      if (/(who are you|what is your name|what's your name|your name)/.test(lower)) {
        return `I'm ${aiName}, the ${company} virtual assistant. I can answer everyday questions, explain website concepts, or tailor a project recommendation for you${hiName}.`;
      }
      if (/(what is a website|define website|meaning of.*website|what's a website)/.test(lower)) {
        return `A website is your 24/7 online home under a unique address (like yourbusiness.com)—a collection of pages where customers can learn about you, explore services or products, and contact or buy from you anytime.`;
      }
      if (/(importance|benefit|why.*(need|have)|advantage|value).*(website|site)|website.*(important|useful|matter|benefit)/.test(lower)) {
        return `A website gives you 24/7 visibility, instant credibility, and full control—unlike social media algorithms. It helps people find you on Google, builds trust with real projects and reviews, and turns visitors into WhatsApp or email leads. Want me to recommend the right package for you${hiName}?`;
      }
      if (/(what is.*domain|domain name|web hosting|what is hosting)/.test(lower)) {
        return `A domain name is your website's address (like emgwebsolutions.com), while hosting is the secure server space where your site lives online 24/7.`;
      }
      if (/(what is.*seo|search engine opt)/.test(lower)) {
        return `SEO (Search Engine Optimization) helps your website rank higher on Google when people search for what you offer—bringing steady organic customers without paying per click.`;
      }
      if (/(price|cost|how much|rate|package|quote|quotation)/.test(lower)) {
        return `Here are our services and pricing (KSh)${hiName}:\n${serviceLines}\n\nTell me a bit about your business or message us on WhatsApp (${whatsapp}) for an exact quote.`;
      }
      if (/(phone|call|contact|whatsapp|reach|number|email)/.test(lower)) {
        return `You can reach ${company} on WhatsApp or phone at ${whatsapp}, or by email at ${email}.`;
      }
      if (/(work|portfolio|project|example)/.test(lower)) {
        return portfolio.length
          ? `Some of our projects: ${portfolio.map((p) => p.t).join(', ')}. You can view them all in our Projects section.`
          : `Our Projects section showcases our work. For examples tailored to your industry${hiName}, message us on WhatsApp (${whatsapp}).`;
      }
      if (/(consult|book|meeting|appointment)/.test(lower)) {
        return `We'd love to book a quick consultation${hiName}. Message us on WhatsApp (${whatsapp}) or use the contact form and our team will respond promptly.`;
      }
      return `Good ${timeOfDay}${hiName}! I'm ${aiName}, the ${company} virtual assistant. Ask me anything—from everyday questions to tailored website options:\n${serviceLines}`;
    };

    fallback = fallbackReply(userMessage);

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
