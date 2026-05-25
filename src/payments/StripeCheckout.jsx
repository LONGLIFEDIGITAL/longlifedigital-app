import { useState } from 'react';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { getStripe } from './useStripePayment';

const elementsAppearance = {
  theme: 'night',
  variables: {
    colorPrimary: '#9333EA',
    colorBackground: '#1a0533',
    colorText: '#f3f4f6',
    colorDanger: '#ef4444',
    fontFamily: 'system-ui, sans-serif',
    borderRadius: '8px',
    spacingUnit: '4px',
  },
  rules: {
    '.Input': { border: '1px solid rgba(147,51,234,0.4)', backgroundColor: '#0a001e' },
    '.Input:focus': { border: '1px solid #9333EA', boxShadow: '0 0 0 2px rgba(147,51,234,0.2)' },
    '.Label': { color: '#c4b5fd', fontWeight: '600', fontSize: '13px' },
  },
};

function PaymentForm({ onSuccess, onError, productName, amount }) {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [message, setMessage] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setProcessing(true);
    setMessage(null);

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: window.location.origin + '?payment=success',
      },
      redirect: 'if_required',
    });

    if (error) {
      setMessage(error.message);
      onError?.(error.message);
    } else if (paymentIntent && paymentIntent.status === 'succeeded') {
      onSuccess?.(paymentIntent);
    } else {
      setMessage('An unexpected error occurred.');
      onError?.('An unexpected error occurred.');
    }

    setProcessing(false);
  };

  return (
    <form onSubmit={handleSubmit} style={{ width: '100%' }}>
      <div style={{ marginBottom: 16 }}>
        <div style={{ color: '#c4b5fd', fontSize: 12, fontWeight: 600, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>
          Secure Payment — {productName}
        </div>
        <div style={{ color: '#E8C97A', fontSize: 20, fontWeight: 700, marginBottom: 16 }}>
          ${amount}
        </div>
      </div>

      <PaymentElement
        options={{
          layout: 'tabs',
          wallets: { applePay: 'auto', googlePay: 'auto' },
        }}
      />

      {message && (
        <div style={{ marginTop: 12, padding: '10px 14px', background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.4)', borderRadius: 8, color: '#fca5a5', fontSize: 13 }}>
          {message}
        </div>
      )}

      <button
        type="submit"
        disabled={!stripe || processing}
        style={{
          marginTop: 20,
          width: '100%',
          padding: '14px',
          background: processing ? 'rgba(147,51,234,0.4)' : 'linear-gradient(135deg,#7C3AED,#9333EA)',
          color: '#fff',
          border: 'none',
          borderRadius: 10,
          fontSize: 16,
          fontWeight: 700,
          cursor: processing ? 'not-allowed' : 'pointer',
          transition: 'all 0.2s',
          letterSpacing: 0.5,
        }}
      >
        {processing ? 'Processing…' : `Pay $${amount}`}
      </button>

      <div style={{ marginTop: 12, textAlign: 'center', color: '#6b7280', fontSize: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
        <span>🔒</span>
        <span>Secured by Stripe · SSL Encrypted</span>
      </div>
    </form>
  );
}

export default function StripeCheckout({ clientSecret, productName, amount, onSuccess, onError }) {
  if (!clientSecret) return null;

  return (
    <Elements stripe={getStripe()} options={{ clientSecret, appearance: elementsAppearance }}>
      <PaymentForm
        productName={productName}
        amount={amount}
        onSuccess={onSuccess}
        onError={onError}
      />
    </Elements>
  );
}
