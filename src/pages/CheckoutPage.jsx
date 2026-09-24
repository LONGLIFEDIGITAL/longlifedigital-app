import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Anchor,
  Button,
  Container,
  Group,
  Loader,
  Paper,
  Select,
  SimpleGrid,
  Stack,
  Text,
  TextInput,
  Title,
} from '@mantine/core';
import { Elements, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js/pure';
import { Link, Navigate, useNavigate } from 'react-router';
import {
  commerce,
  headlessEnabled,
  moneyMinor,
  readAttempt,
  saveAttempt,
  readBillingDraft,
  saveBillingDraft,
} from '../services/checkout';

const stripeClients = new Map();
function stripeClient(key) {
  if (!stripeClients.has(key)) {
    const promise = loadStripe(key).catch((error) => {
      stripeClients.delete(key);
      throw error;
    });
    stripeClients.set(key, promise);
  }
  return stripeClients.get(key);
}
function CardPayment(props) {
  const [generation, setGeneration] = useState(0);
  return (
    <PaymentSession
      key={generation}
      {...props}
      onRetry={() => setGeneration((value) => value + 1)}
    />
  );
}
function PaymentSession({ publishableKey, options, billing, data, onSubmitted, onBusy, onRetry }) {
  const [client, setClient] = useState(null);
  const [error, setError] = useState('');
  const validKey =
    typeof publishableKey === 'string' && /^pk_test_[A-Za-z0-9]+$/.test(publishableKey);
  useEffect(() => {
    if (!validKey) return;
    let active = true;
    const timer = setTimeout(() => {
      active = false;
      setError('Secure payment took too long to load. Please retry.');
    }, 15000);
    stripeClient(publishableKey)
      .then((stripe) => {
        clearTimeout(timer);
        if (active) {
          if (stripe) setClient(stripe);
          else setError('Payment could not load. Please reload this page.');
        }
      })
      .catch(() => {
        clearTimeout(timer);
        if (active)
          setError('Payment could not load. Please check your connection and reload this page.');
      });
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [publishableKey, validKey]);
  if (!validKey)
    return <Alert color="red">Payment is temporarily unavailable. Please try again shortly.</Alert>;
  if (error)
    return (
      <Alert color="red">
        <Stack>
          <Text>{error}</Text>
          <Button type="button" variant="light" onClick={onRetry}>
            Reload payment fields
          </Button>
        </Stack>
      </Alert>
    );
  // Mount the provider empty, then populate it after Stripe resolves. Mounting it
  // with a synchronous client recreates the iframe during React StrictMode replay.
  return (
    <Elements stripe={client} options={options}>
      <PaymentForm
        billing={billing}
        data={data}
        onSubmitted={onSubmitted}
        onBusy={onBusy}
        onRetry={onRetry}
      />
    </Elements>
  );
}
const initialBilling = {
  first_name: '',
  last_name: '',
  email: '',
  phone: '',
  address_1: '',
  address_2: '',
  city: '',
  country: '',
  state: '',
  postcode: '',
};

function PaymentForm({ billing, data, onSubmitted, onBusy, onRetry }) {
  const stripe = useStripe();
  const elements = useElements();
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  const [error, setError] = useState('');
  const [ready, setReady] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);
  useEffect(() => {
    if (ready || loadFailed) return;
    const timer = setTimeout(() => setLoadFailed(true), 15000);
    return () => clearTimeout(timer);
  }, [ready, loadFailed]);
  const submit = async (event) => {
    event.preventDefault();
    if (!stripe || !elements || !ready || loadFailed || lock.current) return;
    lock.current = true;
    setBusy(true);
    onBusy(true);
    setError('');
    let attempt;
    try {
      const validation = await elements.submit();
      if (validation.error) throw validation.error;
      const method = await stripe.createPaymentMethod({
        elements,
        params: {
          billing_details: {
            name: `${billing.first_name} ${billing.last_name}`,
            email: billing.email,
            phone: billing.phone,
            address: {
              line1: billing.address_1,
              line2: billing.address_2,
              city: billing.city,
              state: billing.state,
              postal_code: billing.postcode,
              country: billing.country,
            },
          },
        },
      });
      if (method.error) throw method.error;
      attempt = crypto.randomUUID();
      saveAttempt({ attempt, pending: true });
      const result = await commerce('checkout', {
        attempt,
        billing_address: billing,
        paymentMethod: method.paymentMethod.id,
        expectedTotal: data.totals.total_price,
      });
      if (result.authentication) {
        const params = {
          clientSecret: result.authentication.clientSecret,
          redirect: 'if_required',
          confirmParams: {
            return_url: `${location.origin}/order-confirmation?attempt=${encodeURIComponent(attempt)}`,
          },
        };
        const confirmed =
          result.authentication.type === 'pi'
            ? await stripe.confirmPayment(params)
            : await stripe.confirmSetup(params);
        // Even failed/cancelled authentication is resolved from the Woo order.
        if (confirmed.error) setError(confirmed.error.message);
      }
      onSubmitted(attempt);
    } catch (e) {
      if (attempt && e.retrySafe) {
        saveAttempt(null);
        setError(e.message);
      } else if (attempt) onSubmitted(attempt);
      else if (/elements store/i.test(e.message || '')) setLoadFailed(true);
      else setError(e.message || 'Please check your payment details.');
    } finally {
      lock.current = false;
      setBusy(false);
      onBusy(false);
    }
  };
  return (
    <form onSubmit={submit}>
      <Stack>
        <PaymentElement
          id="checkout-payment-element"
          onReady={() => setReady(true)}
          onLoadError={() => setLoadFailed(true)}
          options={{
            layout: { type: 'accordion', defaultCollapsed: false },
            fields: { billingDetails: 'never' },
            wallets: { applePay: 'never', googlePay: 'never' },
          }}
        />
        {!ready && !loadFailed && (
          <Group role="status">
            <Loader color="violet" size="sm" />
            <Text>Loading payment fields…</Text>
          </Group>
        )}
        {loadFailed && (
          <Alert color="red" role="alert">
            <Stack>
              <Text>
                The secure payment fields could not load. Please reload them to continue. Your
                billing details will be kept.
              </Text>
              <Button type="button" variant="light" disabled={busy} onClick={onRetry}>
                Reload payment fields
              </Button>
            </Stack>
          </Alert>
        )}
        {error && (
          <Alert color="red" role="alert">
            {error}
          </Alert>
        )}
        <Text size="sm">
          By placing your order, you agree to our{' '}
          <Anchor component={Link} to="/terms-of-service">
            terms
          </Anchor>{' '}
          and{' '}
          <Anchor component={Link} to="/privacy-policy">
            privacy policy
          </Anchor>
          .
        </Text>
        <Button
          type="submit"
          size="lg"
          loading={busy}
          disabled={!stripe || !elements || !ready || loadFailed}
        >
          Pay {moneyMinor(data.totals.total_price, data.totals)}
        </Button>
        {busy && (
          <Text role="status" c="dimmed">
            Submitting your payment securely…
          </Text>
        )}
      </Stack>
    </form>
  );
}
function Summary({ data }) {
  const t = data.totals;
  return (
    <Paper withBorder p="lg" radius="lg">
      <Stack>
        <Title order={2} size="h3">
          Your order
        </Title>
        {data.items.map((item) => (
          <Group key={item.key} justify="space-between" wrap="nowrap">
            <Text>
              {item.name} × {item.quantity}
            </Text>
            <Text fw={600} style={{ whiteSpace: 'nowrap', flexShrink: 0 }}>
              {moneyMinor(item.totals.line_subtotal, item.totals)}
            </Text>
          </Group>
        ))}
        <Group justify="space-between">
          <Text>Discount</Text>
          <Text>−{moneyMinor(t.total_discount, t)}</Text>
        </Group>
        <Group justify="space-between">
          <Text>Tax</Text>
          <Text>{moneyMinor(t.total_tax, t)}</Text>
        </Group>
        <Group justify="space-between">
          <Text fw={700}>Total</Text>
          <Text fw={700}>{moneyMinor(t.total_price, t)}</Text>
        </Group>
      </Stack>
    </Paper>
  );
}
export default function CheckoutPage({ cartState }) {
  const { data, busy, error: cartError, mutate, reload } = cartState;
  const navigate = useNavigate();
  const [config, setConfig] = useState(null);
  const [error, setError] = useState('');
  const [billing, setBilling] = useState(() => ({ ...initialBilling, ...readBillingDraft() }));
  const [fieldErrors, setFieldErrors] = useState({});
  const [paying, setPaying] = useState(false);
  const [reviewed, setReviewed] = useState(null);
  const [coupon, setCoupon] = useState('');
  const [submittingFree, setSubmittingFree] = useState(false);
  const [previous] = useState(readAttempt);
  useEffect(() => {
    saveBillingDraft(billing);
  }, [billing]);
  const postalRule = config?.billingFields?.[billing.country]?.postcode;
  const postalRequired = postalRule ? postalRule.required && !postalRule.hidden : true;
  useEffect(() => {
    if (!headlessEnabled) return;
    let active = true;
    commerce('config')
      .then((value) => {
        if (active) setConfig(value);
      })
      .catch(() => {
        if (active) setError('Checkout is being configured. Please try again later.');
      });
    return () => {
      active = false;
    };
  }, []);
  const options = useMemo(
    () => ({
      mode: 'payment',
      amount: Number(reviewed?.totals.total_price || 100),
      currency: (reviewed?.totals.currency_code || 'USD').toLowerCase(),
      paymentMethodCreation: 'manual',
      paymentMethodTypes: ['card'],
      appearance: { theme: 'stripe', variables: { colorPrimary: '#8b2cf5', borderRadius: '10px' } },
    }),
    [reviewed],
  );
  const done = (attempt) => navigate(`/order-confirmation?attempt=${encodeURIComponent(attempt)}`);
  const review = async (event) => {
    event.preventDefault();
    setError('');
    setFieldErrors({});
    try {
      const next = await mutate('customer', { billing_address: billing });
      setReviewed(next);
    } catch (e) {
      setFieldErrors(e.fieldErrors || {});
      setError(e.message);
    }
  };
  const couponAction = async (action, code) => {
    setError('');
    try {
      await mutate(action, { code });
      setCoupon('');
      setReviewed(null);
    } catch (e) {
      setError(e.message);
    }
  };
  const freeOrder = async () => {
    if (submittingFree) return;
    const attempt = crypto.randomUUID();
    try {
      saveAttempt({ attempt, pending: true });
    } catch {
      setError('Enable browser storage to continue securely.');
      return;
    }
    setSubmittingFree(true);
    try {
      await commerce('checkout', { attempt, billing_address: billing, expectedTotal: '0' });
      done(attempt);
    } catch (e) {
      if (e.retrySafe) {
        saveAttempt(null);
        setError(e.message);
      } else done(attempt);
    } finally {
      setSubmittingFree(false);
    }
  };
  if (!headlessEnabled)
    return (
      <Container py="xl">
        <Alert>Checkout is being configured. Please try again later.</Alert>
      </Container>
    );
  return (
    <Container size="lg" py={50}>
      <Stack gap="xl">
        <Title>Checkout</Title>
        <Text c="dimmed">Continue as a guest. No account is required.</Text>
        {previous?.pending ? (
          <Navigate
            replace
            to={`/order-confirmation?attempt=${encodeURIComponent(previous.attempt)}`}
          />
        ) : (
          <>
            {(error || cartError) && (
              <Alert color="red" role="alert">
                {error || cartError}
                {!error && cartError && (
                  <Button ml="sm" variant="subtle" onClick={() => reload().catch(() => {})}>
                    Refresh cart
                  </Button>
                )}
              </Alert>
            )}
            {!data ? (
              <Text role="status">Loading your cart…</Text>
            ) : !data.items.length ? (
              <Text>
                Your cart is empty.{' '}
                <Anchor component={Link} to="/products">
                  Browse products
                </Anchor>
              </Text>
            ) : data.needs_shipping ? (
              <Alert>These items need shipping. Please contact us before ordering.</Alert>
            ) : (
              <SimpleGrid cols={{ base: 1, md: 2 }} spacing="xl">
                <Stack>
                  <Paper withBorder p="lg" radius="lg">
                    <form onSubmit={review}>
                      <Stack>
                        <Title order={2} size="h3">
                          Billing details
                        </Title>
                        {Object.entries({
                          first_name: 'First name',
                          last_name: 'Last name',
                          email: 'Email address',
                          phone: 'Phone',
                          address_1: 'Address',
                          address_2: 'Apartment, suite (optional)',
                          city: 'City',
                        }).map(([key, label]) => (
                          <TextInput
                            key={key}
                            label={label}
                            type={key === 'email' ? 'email' : key === 'phone' ? 'tel' : 'text'}
                            error={fieldErrors[key]}
                            required={key !== 'address_2'}
                            autoComplete={
                              {
                                first_name: 'given-name',
                                last_name: 'family-name',
                                email: 'email',
                                address_1: 'address-line1',
                                address_2: 'address-line2',
                                city: 'address-level2',
                                phone: 'tel',
                              }[key]
                            }
                            value={billing[key]}
                            disabled={!!reviewed}
                            onChange={(e) => setBilling({ ...billing, [key]: e.target.value })}
                          />
                        ))}
                        <Select
                          label="Country"
                          error={fieldErrors.country}
                          required
                          searchable
                          data={Object.entries(config?.countries || {}).map(([value, label]) => ({
                            value,
                            label,
                          }))}
                          value={billing.country || null}
                          disabled={!!reviewed}
                          onChange={(country) =>
                            setBilling({ ...billing, country: country || '', state: '' })
                          }
                        />
                        {Object.keys(config?.states?.[billing.country] || {}).length ? (
                          <Select
                            label="State / region"
                            error={fieldErrors.state}
                            required
                            searchable
                            data={Object.entries(config.states[billing.country]).map(
                              ([value, label]) => ({ value, label }),
                            )}
                            value={billing.state || null}
                            disabled={!!reviewed}
                            onChange={(state) => setBilling({ ...billing, state: state || '' })}
                          />
                        ) : (
                          <TextInput
                            label="State / region"
                            error={fieldErrors.state}
                            value={billing.state}
                            disabled={!!reviewed}
                            onChange={(e) => setBilling({ ...billing, state: e.target.value })}
                          />
                        )}
                        {!postalRule?.hidden && (
                          <TextInput
                            label={postalRequired ? 'Postal code' : 'Postal code (optional)'}
                            required={postalRequired}
                            autoComplete="postal-code"
                            error={fieldErrors.postcode}
                            value={billing.postcode}
                            disabled={!!reviewed}
                            onChange={(e) => setBilling({ ...billing, postcode: e.target.value })}
                          />
                        )}
                        {reviewed ? (
                          <Button
                            type="button"
                            variant="light"
                            disabled={paying || submittingFree}
                            onClick={(event) => {
                              event.preventDefault();
                              setReviewed(null);
                            }}
                          >
                            Edit billing details
                          </Button>
                        ) : (
                          <Button type="submit" loading={busy} disabled={!config?.enabled}>
                            Review final total
                          </Button>
                        )}
                      </Stack>
                    </form>
                  </Paper>
                  {config && !config.enabled && (
                    <Alert>Checkout is being configured. Please try again later.</Alert>
                  )}
                  {reviewed && config?.enabled && (
                    <Paper withBorder p="lg" radius="lg">
                      <Stack>
                        <Title order={2} size="h3">
                          Payment
                        </Title>
                        <Alert color="yellow">Test checkout — use a Stripe test card.</Alert>
                        {Number(reviewed.totals.total_price) === 0 ? (
                          <Button onClick={freeOrder} loading={submittingFree}>
                            Place free order
                          </Button>
                        ) : (
                          <CardPayment
                            publishableKey={config.publishableKey}
                            options={options}
                            key={`${reviewed.totals.currency_code}:${reviewed.totals.total_price}`}
                            billing={billing}
                            data={reviewed}
                            onSubmitted={done}
                            onBusy={setPaying}
                          />
                        )}
                      </Stack>
                    </Paper>
                  )}
                </Stack>
                <Stack>
                  <Summary data={reviewed || data} />
                  {!reviewed && (
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        couponAction('apply-coupon', coupon);
                      }}
                    >
                      <Group align="end">
                        <TextInput
                          label="Coupon code"
                          value={coupon}
                          onChange={(e) => setCoupon(e.target.value)}
                        />
                        <Button type="submit" loading={busy} disabled={!coupon.trim()}>
                          Apply
                        </Button>
                      </Group>
                    </form>
                  )}
                  {data.coupons?.map(({ code }) => (
                    <Button
                      key={code}
                      variant="subtle"
                      disabled={busy || !!reviewed}
                      onClick={() => couponAction('remove-coupon', code)}
                    >
                      Remove coupon: {code}
                    </Button>
                  ))}
                  <Anchor component={Link} to="/products">
                    Continue shopping
                  </Anchor>
                </Stack>
              </SimpleGrid>
            )}
          </>
        )}
      </Stack>
    </Container>
  );
}
