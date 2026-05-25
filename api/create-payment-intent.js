import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { amount, productName, customerEmail, customerName } = req.body;

  if (!amount || Number(amount) < 0.5) {
    return res.status(400).json({ error: 'Invalid amount. Minimum is $0.50.' });
  }

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(Number(amount) * 100),
      currency: 'usd',
      receipt_email: customerEmail || undefined,
      description: productName || 'Longlife Digital Purchase',
      metadata: {
        product_name: productName || '',
        customer_name: customerName || '',
        customer_email: customerEmail || '',
        store: 'Longlife Digital',
      },
      automatic_payment_methods: { enabled: true },
    });

    return res.status(200).json({ clientSecret: paymentIntent.client_secret });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
