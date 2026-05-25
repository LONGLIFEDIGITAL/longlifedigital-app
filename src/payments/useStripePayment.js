import { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';

const PUBLISHABLE_KEY = 'pk_live_51TYT5WFUxxwF6THk5f6W6lnpuySIg76odRKfr78vYHPWeXmDPfxMRhVJrhq0Gp1BghRnjM2E8Lm41eoccOj33HIw00SuUZ07j5';

let stripePromise;
export function getStripe() {
  if (!stripePromise) stripePromise = loadStripe(PUBLISHABLE_KEY);
  return stripePromise;
}

export function useStripePayment() {
  const [clientSecret, setClientSecret] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function createPaymentIntent({ amount, productName, customerEmail, customerName }) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, productName, customerEmail, customerName }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create payment intent');
      setClientSecret(data.clientSecret);
      return data.clientSecret;
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setClientSecret(null);
    setError(null);
    setLoading(false);
  }

  return { clientSecret, loading, error, createPaymentIntent, reset };
}
