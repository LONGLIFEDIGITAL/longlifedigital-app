import { Box, Button, Flex } from '@mantine/core';
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
    '.Input': {
      border: '1px solid rgba(147,51,234,0.4)',
      backgroundColor: '#0a001e',
    },
    '.Input:focus': {
      border: '1px solid #9333EA',
      boxShadow: '0 0 0 2px rgba(147,51,234,0.2)',
    },
    '.Label': {
      color: '#c4b5fd',
      fontWeight: '600',
      fontSize: '13px',
    },
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
    <Box onSubmit={handleSubmit} w="100%" component="form">
      <Box mb={16}>
        <Box c="#c4b5fd" fz={12} fw={600} lts={1} tt="uppercase" mb={8}>
          Secure Payment — {productName}
        </Box>
        <Box c="#E8C97A" fz={20} fw={700} mb={16}>
          ${amount}
        </Box>
      </Box>

      <PaymentElement
        options={{
          layout: 'tabs',
          wallets: {
            applePay: 'auto',
            googlePay: 'auto',
          },
        }}
      />

      {message && (
        <Box
          c="#fca5a5"
          bg="rgba(239,68,68,0.15)"
          fz={13}
          mt={12}
          p="10px 14px"
          style={{
            border: '1px solid rgba(239,68,68,0.4)',
            borderRadius: 8,
          }}
        >
          {message}
        </Box>
      )}

      <Button
        type="submit"
        disabled={!stripe || processing}
        variant="transparent"
        color="dark"
        px={0}
        c="#fff"
        bg={processing ? 'rgba(147,51,234,0.4)' : 'linear-gradient(135deg,#7C3AED,#9333EA)'}
        fz={16}
        fw={700}
        lts={0.5}
        w="100%"
        mt={20}
        p="14px"
        style={{
          border: 'none',
          borderRadius: 10,
          cursor: processing ? 'not-allowed' : 'pointer',
          transition: 'all 0.2s',
        }}
      >
        {processing ? 'Processing…' : `Pay $${amount}`}
      </Button>

      <Flex
        align="center"
        justify="center"
        gap={6}
        wrap="wrap"
        c="#6b7280"
        fz={11}
        ta="center"
        mt={12}
      >
        <span>🔒</span>
        <span>Secured by Stripe · SSL Encrypted</span>
      </Flex>
    </Box>
  );
}
export default function StripeCheckout({ clientSecret, productName, amount, onSuccess, onError }) {
  if (!clientSecret) return null;
  return (
    <Elements
      stripe={getStripe()}
      options={{
        clientSecret,
        appearance: elementsAppearance,
      }}
    >
      <PaymentForm
        productName={productName}
        amount={amount}
        onSuccess={onSuccess}
        onError={onError}
      />
    </Elements>
  );
}
