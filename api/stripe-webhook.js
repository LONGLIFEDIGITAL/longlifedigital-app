import Stripe from 'stripe';

export const config = { api: { bodyParser: false } };

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

async function getRawBody(readable) {
  const chunks = [];
  for await (const chunk of readable) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    return res.status(500).json({ error: 'STRIPE_WEBHOOK_SECRET is not set.' });
  }

  let event;
  try {
    const rawBody = await getRawBody(req);
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
  } catch (err) {
    return res.status(400).json({ error: `Webhook signature verification failed: ${err.message}` });
  }

  switch (event.type) {
    case 'payment_intent.succeeded': {
      const pi = event.data.object;
      console.log(`[Stripe] Payment succeeded: ${pi.id} — $${pi.amount / 100} — ${pi.metadata.product_name}`);
      // TODO: send confirmation email, provision digital product delivery, update orders DB
      break;
    }
    case 'payment_intent.payment_failed': {
      const pi = event.data.object;
      console.log(`[Stripe] Payment failed: ${pi.id} — ${pi.last_payment_error?.message}`);
      break;
    }
    case 'charge.refunded': {
      const charge = event.data.object;
      console.log(`[Stripe] Refund issued for charge: ${charge.id}`);
      break;
    }
    default:
      console.log(`[Stripe] Unhandled event: ${event.type}`);
  }

  return res.status(200).json({ received: true });
}
