import ResponsiveModal from './ResponsiveModal';
import { ActionIcon, Box, Button, Flex, Input, Text, Title } from '@mantine/core';
import { fmtPrice } from '../utils/helpers';
import { getItemQuantity, getLineTotal } from '../utils/cart';
import { CATS } from '../constants/data';
import { StripeCheckout } from '../payments';
export default function CheckoutModal({
  showCheckout,
  checkoutItem,
  setShowCheckout,
  checkoutStep,
  setCheckoutStep,
  orderInfo,
  setOrderInfo,
  stripeLoading,
  stripeError,
  clientSecret,
  createPaymentIntent,
  resetStripe,
  setCart,
  fire,
  setPage,
  setOrderNum,
}) {
  if (!showCheckout || !checkoutItem) return null;
  const quantity = getItemQuantity(checkoutItem);
  const total = getLineTotal(checkoutItem);
  const productName = quantity > 1 ? `${checkoutItem.name} × ${quantity}` : checkoutItem.name;
  return (
    <ResponsiveModal
      onClose={() => setShowCheckout(false)}
      size={420}
      zIndex={500}
      label="Secure checkout"
    >
      <Box
        onClick={(e) => e.stopPropagation()}
        bg="#fff"
        w="100%"
        maw={420}
        pos="relative"
        style={{
          borderRadius: 20,
          overflow: 'hidden',
          boxShadow: '0 24px 60px rgba(0,0,0,0.4)',
        }}
      >
        <Box bg="linear-gradient(90deg,#7C3AED,#C9963F,#E8C97A)" h={4} />
        <Box p="28px 28px 24px">
          <ActionIcon
            onClick={() => setShowCheckout(false)}
            variant="transparent"
            color="dark"
            px={0}
            type="button"
            c="#374151"
            bg="#F3F4F6"
            fz={13}
            w={28}
            h={28}
            pos="absolute"
            top={16}
            right={16}
            style={{
              border: 'none',
              borderRadius: '50%',
              cursor: 'pointer',
            }}
            aria-label="Close dialog"
          >
            ✕
          </ActionIcon>
          <Box ta="center" mb={20}>
            <Flex
              align="center"
              justify="center"
              wrap="wrap"
              bg="linear-gradient(135deg,#1a0533,#2d1066)"
              fz={22}
              w={52}
              h={52}
              m="0 auto 12px"
              style={{
                borderRadius: 12,
              }}
            >
              {CATS.find((c) => c.id === checkoutItem.cat)?.icon || '📦'}
            </Flex>
            <Title order={3} c="#1a0533" fz={18} ff="'Playfair Display',serif" mb={4}>
              {checkoutItem.name}
            </Title>
            <Box c="#9333EA" fz={28} fw={700} ff="'Playfair Display',serif">
              {fmtPrice(total, checkoutItem.currency, checkoutItem.minorUnit)}
            </Box>
            {quantity > 1 && (
              <Text size="sm" c="dimmed" mt={4}>
                {quantity} ×{' '}
                {fmtPrice(checkoutItem.price, checkoutItem.currency, checkoutItem.minorUnit)} each
              </Text>
            )}
          </Box>
          {checkoutStep === 3 ? (
            <Box ta="center">
              <Flex
                align="center"
                justify="center"
                wrap="wrap"
                bg="linear-gradient(135deg,#059669,#10B981)"
                fz={24}
                w={52}
                h={52}
                m="0 auto 14px"
                style={{
                  borderRadius: '50%',
                }}
              >
                ✓
              </Flex>
              <Title order={3} c="#1a0533" fz={20} ff="'Playfair Display',serif" mb={8}>
                Payment Successful!
              </Title>
              <Text component="p" inherit c="#6B7280" fz={13} mb={16}>
                Thank you {orderInfo.name}! Check {orderInfo.email} for your download link.
              </Text>
              {checkoutItem?.pdfFile && (
                <a
                  href={checkoutItem.pdfFile}
                  download={checkoutItem.pdfName || 'product.pdf'}
                  style={{
                    display: 'block',
                    background: 'linear-gradient(135deg,#059669,#10B981)',
                    borderRadius: 10,
                    padding: '12px',
                    textAlign: 'center',
                    color: '#fff',
                    fontWeight: 700,
                    fontSize: 13,
                    textDecoration: 'none',
                    marginBottom: 12,
                  }}
                >
                  ⬇ Download Now
                </a>
              )}
              <Button
                className="btn-h"
                onClick={() => {
                  setShowCheckout(false);
                  setPage('shop');
                }}
                variant="filled"
                color="brand"
                px="lg"
                type="button"
                w="100%"
              >
                Continue Shopping
              </Button>
            </Box>
          ) : checkoutStep === 2 ? (
            <Box p="4px 0">
              {stripeLoading && (
                <Box c="#9333EA" fz={13} ta="center" p="40px 0">
                  Setting up secure payment…
                </Box>
              )}
              {stripeError && (
                <Box
                  c="#ef4444"
                  bg="rgba(239,68,68,0.12)"
                  fz={13}
                  mb={12}
                  p="10px 14px"
                  style={{
                    border: '1px solid rgba(239,68,68,0.3)',
                    borderRadius: 8,
                  }}
                >
                  {stripeError}
                </Box>
              )}
              {clientSecret && !stripeLoading && (
                <StripeCheckout
                  clientSecret={clientSecret}
                  productName={productName}
                  amount={total}
                  onSuccess={(pi) => {
                    setOrderNum('LD-' + pi.id.slice(-6).toUpperCase());
                    setCheckoutStep(3);
                    setCart((prev) => prev.filter((i) => i.id !== checkoutItem?.id));
                    fire('Payment successful! ✦');
                  }}
                  onError={(msg) => fire(msg, 'err')}
                />
              )}
              <Button
                onClick={() => {
                  setCheckoutStep(1);
                  resetStripe();
                }}
                variant="transparent"
                color="dark"
                px={0}
                type="button"
                c="#9333EA"
                bg="none"
                fz={12}
                w="100%"
                mt={10}
                style={{
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                ← Back
              </Button>
            </Box>
          ) : (
            <div>
              <Box
                component="label"
                c="#9CA3AF"
                fz={11}
                lts={1}
                tt="uppercase"
                mt={10}
                mb={5}
                style={{
                  display: 'block',
                }}
              >
                Full Name *
              </Box>
              <Input
                className="inp-f"
                placeholder="John Smith"
                value={orderInfo.name}
                onChange={(e) =>
                  setOrderInfo({
                    ...orderInfo,
                    name: e.target.value,
                  })
                }
                styles={{
                  input: {
                    marginBottom: 10,
                  },
                }}
              />
              <Box
                component="label"
                c="#9CA3AF"
                fz={11}
                lts={1}
                tt="uppercase"
                mt={10}
                mb={5}
                style={{
                  display: 'block',
                }}
              >
                Email * (download sent here)
              </Box>
              <Input
                className="inp-f"
                placeholder="john@email.com"
                value={orderInfo.email}
                onChange={(e) =>
                  setOrderInfo({
                    ...orderInfo,
                    email: e.target.value,
                  })
                }
              />
              <Button
                className="btn-h"
                onClick={() => {
                  if (!orderInfo.name || !orderInfo.email || !orderInfo.email.includes('@')) {
                    fire('Fill name and email', 'err');
                    return;
                  }
                  createPaymentIntent({
                    amount: total,
                    productName,
                    customerEmail: orderInfo.email,
                    customerName: orderInfo.name,
                  });
                  setCheckoutStep(2);
                }}
                variant="filled"
                color="brand"
                px="lg"
                type="button"
                w="100%"
                mt={14}
                p="13px"
              >
                Continue to Payment →
              </Button>
              <Text component="p" inherit c="#9CA3AF" fz={11} ta="center" mt={10}>
                🔒 Secured by Stripe
              </Text>
            </div>
          )}
        </Box>
      </Box>
    </ResponsiveModal>
  );
}
