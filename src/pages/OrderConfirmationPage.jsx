import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  Anchor,
  Button,
  Container,
  Loader,
  Paper,
  Stack,
  Text,
  Title,
  Divider,
} from '@mantine/core';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { loadStripe } from '@stripe/stripe-js/pure';
import { clearBillingDraft, commerce, readAttempt, saveAttempt } from '../services/checkout';
import OrderDownloads from '../components/OrderDownloads';
import CmsFaqs from '../components/CmsFaqs';

const terminalStatuses = ['failed', 'cancelled', 'refunded'];
const maxChecks = 8;
const maxWait = 60000;

export default function OrderConfirmationPage({ reloadCart }) {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const attempt = params.get('attempt') || readAttempt()?.attempt;
  const [order, setOrder] = useState(null);
  const [exhausted, setExhausted] = useState(false);
  const [checks, setChecks] = useState(0);
  const [authError, setAuthError] = useState('');
  const [authenticating, setAuthenticating] = useState(false);
  const refreshed = useRef(false);
  const inFlight = useRef(null);
  useEffect(() => {
    if (params.has('payment_intent_client_secret') || params.has('setup_intent_client_secret')) {
      navigate(`/order-confirmation?attempt=${encodeURIComponent(attempt || '')}`, {
        replace: true,
      });
    }
  }, [params, attempt, navigate]);
  const check = useCallback(() => {
    if (inFlight.current) return inFlight.current;
    const task = commerce('order', { attempt, confirm: true });
    inFlight.current = task;
    task.then(
      () => {
        inFlight.current = null;
      },
      () => {
        inFlight.current = null;
      },
    );
    return task;
  }, [attempt]);
  const accept = useCallback(
    (next) => {
      setOrder(next);
      if (next.paid || terminalStatuses.includes(next.status)) {
        saveAttempt({ attempt, pending: false });
        if (next.paid) clearBillingDraft();
        if (!refreshed.current && !next.cartSyncPending) {
          refreshed.current = true;
          reloadCart().catch(() => {
            refreshed.current = false;
          });
        }
      }
    },
    [attempt, reloadCart],
  );
  useEffect(() => {
    if (!attempt) return;
    let active = true;
    let stopped = false;
    let timer;
    let count = 0;
    // Bound both retries and elapsed time, even when a network request stalls.
    const deadline = setTimeout(() => {
      stopped = true;
      clearTimeout(timer);
      setExhausted(true);
    }, maxWait);
    const poll = async () => {
      let next;
      try {
        next = await check();
        if (!active) return;
        accept(next);
      } catch {
        // A temporary transport failure is retried, not presented as a failed payment.
      }
      if (!active) return;
      setChecks(++count);
      if ((next?.paid && !next.cartSyncPending) || terminalStatuses.includes(next?.status)) {
        clearTimeout(deadline);
        return;
      }
      if (stopped || count >= maxChecks) {
        clearTimeout(deadline);
        setExhausted(true);
        return;
      }
      timer = setTimeout(poll, 3000);
    };
    poll();
    return () => {
      active = false;
      clearTimeout(timer);
      clearTimeout(deadline);
    };
  }, [attempt, check, accept]);

  const terminal = terminalStatuses.includes(order?.status);
  const needsAuthentication = order?.authentication && !order.paid && !terminal;
  const waiting = !!attempt && !order?.paid && !terminal && !exhausted;
  const resumeAuthentication = async () => {
    setAuthenticating(true);
    setAuthError('');
    try {
      const config = await commerce('config');
      if (!config.enabled) throw new Error('Payment authentication is temporarily unavailable.');
      const stripe = await loadStripe(config.publishableKey);
      if (!stripe) throw new Error('Payment authentication could not load.');
      const options = {
        clientSecret: order.authentication.clientSecret,
        redirect: 'if_required',
        confirmParams: {
          return_url: `${location.origin}/order-confirmation?attempt=${encodeURIComponent(attempt)}`,
        },
      };
      const result =
        order.authentication.type === 'pi'
          ? await stripe.confirmPayment(options)
          : await stripe.confirmSetup(options);
      accept(await check());
      if (result.error) setAuthError(result.error.message);
    } catch (error) {
      setAuthError(error.message);
    } finally {
      setAuthenticating(false);
    }
  };
  return (
    <Container size="sm" py={60}>
      <Stack gap="lg">
        <Title>
          {order?.paid
            ? 'Thank you for your purchase'
            : terminal
              ? order.status === 'refunded'
                ? 'Purchase refunded'
                : 'Payment was not completed'
              : exhausted
                ? 'We couldn’t confirm your payment yet'
                : 'Confirming your purchase'}
        </Title>
        {!attempt ? (
          <Alert>
            No checkout was found in this browser. Use your purchase email or contact support.
          </Alert>
        ) : order?.paid ? (
          <Paper withBorder radius="lg" p="lg">
            <Stack>
              <Text fw={700}>Your payment is confirmed and your purchase is complete.</Text>
              {order.number && <Text>Order #{order.number}</Text>}
              {order.items.map((item) => (
                <Text key={item.id}>
                  {item.name} × {item.quantity}
                </Text>
              ))}
              {order.currency && (
                <Text fw={700}>
                  Total:{' '}
                  {new Intl.NumberFormat(undefined, {
                    style: 'currency',
                    currency: order.currency,
                  }).format(Number(order.total))}
                </Text>
              )}
              <Divider my="md" />
              <OrderDownloads downloads={order.downloads} items={order.items} />
            </Stack>
          </Paper>
        ) : terminal ? (
          <Alert color={order.status === 'refunded' ? 'violet' : 'red'}>
            {order.status === 'refunded'
              ? 'This order has been refunded. Downloads are no longer available.'
              : order.failureReason === 'checkout_validation'
                ? 'Your order could not be submitted. Please review your billing details and try again.'
                : 'Your payment was declined or canceled. Please return to checkout to review your details or use another payment method.'}
          </Alert>
        ) : waiting ? (
          <Paper withBorder radius="lg" p="xl">
            <Stack align="center" role="status" aria-live="polite">
              <Loader color="violet" size="lg" aria-label="Confirming payment" />
              <Text ta="center">
                {needsAuthentication
                  ? 'Your bank needs you to complete payment authentication.'
                  : checks < 2
                    ? 'We’re securely confirming your payment…'
                    : checks < 5
                      ? 'We’re waiting for payment confirmation. This can take a few moments.'
                      : 'This is taking a little longer. We’re still checking automatically.'}
              </Text>
              <Text size="sm" c="dimmed">
                Please don’t submit another payment while we finish.
              </Text>
            </Stack>
          </Paper>
        ) : (
          <Alert color="yellow">
            We couldn’t confirm the result after several attempts. Your payment may still be
            processing. Please check your purchase email or contact support before trying to pay
            again.
          </Alert>
        )}
        {needsAuthentication && (
          <Button loading={authenticating} onClick={resumeAuthentication}>
            Complete payment authentication
          </Button>
        )}
        {authError && !order?.paid && <Alert color="yellow">{authError}</Alert>}
        {terminal && order.status !== 'refunded' && (
          <Button component={Link} to="/checkout">
            Return to checkout
          </Button>
        )}
        {order?.number && !order.paid && (terminal || exhausted) && (
          <Text size="sm">Order reference: #{order.number}</Text>
        )}
        {!waiting && (
          <CmsFaqs
            topic="products"
            includeGeneral
            heading="Questions about your purchase"
            optional
          />
        )}
        {(!waiting || needsAuthentication) && (
          <Anchor component={Link} to="/contact">
            Contact support
          </Anchor>
        )}
        {!waiting && (
          <Anchor component={Link} to="/products">
            Continue shopping
          </Anchor>
        )}
      </Stack>
    </Container>
  );
}
