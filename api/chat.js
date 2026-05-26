import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `You are an AI assistant for Longlife Digital (longlifedigital.co), a premium digital store. Be friendly, helpful, and concise.

Longlife Digital offers:
- Digital Marketing Services: Affiliate Marketing, SEO, LLC Formation Assistance, Website Design, Social Media Management, Google Business Optimization, Facebook & Google Ads, AI Automation Services, Branding & Graphic Design, Digital Product Creation
- Online Courses & Training in digital marketing and business
- Premium Domain Names for sale (brandable, local business, AI-related, marketing, real estate domains)
- Digital Products: eBooks, templates, marketing tools, AI tools

Promo: 10% off first order with code WELCOME10. Instant digital delivery. Email: support@longlifedigital.co

Help visitors find the right service or product, answer questions about pricing or offerings, and guide them toward making a purchase. Keep responses short (2-4 sentences max). If asked about specific pricing, tell them to contact us directly or check the relevant product page.`;

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(200).json({ reply: "Hi! Our AI assistant is being set up. In the meantime, email us at support@longlifedigital.co or browse our services above. 😊" });
  }

  const { messages } = req.body;
  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: "Invalid messages" });
  }

  try {
    const response = await client.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 300,
      system: SYSTEM_PROMPT,
      messages: messages.slice(-10),
    });

    res.status(200).json({ reply: response.content[0].text });
  } catch (err) {
    console.error("Chat error:", err);
    res.status(500).json({ error: "Failed to get response" });
  }
}
