import { Box, Button, Drawer, Flex, Text, Title } from '@mantine/core';
import { fmtPrice, catLabel } from '../utils/helpers';
import { CATS } from '../constants/data';
export default function CartDrawer({ cart, setShowCart, rmCart, setPage, openCheckout, setCart }) {
  const cartTotal = cart.reduce((sum, p) => sum + Number(p.price), 0);
  return (
    <Drawer.Root
      opened
      onClose={() => setShowCart(false)}
      position="right"
      size={420}
      padding={0}
      zIndex={300}
    >
      <Drawer.Overlay />
      <Drawer.Content aria-label="Shopping cart">
        <Drawer.Body>
          <Flex
            onClick={(e) => e.stopPropagation()}
            direction="column"
            wrap="nowrap"
            bg="#fff"
            w="100%"
            mih="100dvh"
            style={{
              boxShadow: '-4px 0 30px rgba(0,0,0,0.15)',
            }}
          >
            <Flex
              align="center"
              justify="space-between"
              wrap="wrap"
              p="20px 24px"
              style={{
                borderBottom: '1px solid #F3F4F6',
              }}
            >
              <Title order={3} c="#111827" fz={18} fw="700" ff="'Playfair Display',serif">
                Your Cart ({cart.length})
              </Title>
              <Button
                className="btn-h"
                onClick={() => setShowCart(false)}
                aria-label="Close cart"
                variant="transparent"
                color="dark"
                px={0}
                type="button"
                c="#374151"
                bg="none"
                fz={20}
                style={{
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                ✕
              </Button>
            </Flex>
            {cart.length === 0 ? (
              <Flex
                align="center"
                justify="center"
                direction="column"
                wrap="nowrap"
                ta="center"
                p="40px 24px"
                flex={1}
              >
                <Box fz={48} mb={12}>
                  🛒
                </Box>
                <Text component="p" inherit c="#9CA3AF" mb={20}>
                  Your cart is empty
                </Text>
                <Button
                  className="btn-h"
                  onClick={() => {
                    setShowCart(false);
                    setPage('shop');
                  }}
                  variant="filled"
                  color="brand"
                  px="lg"
                  type="button"
                >
                  Browse Products
                </Button>
              </Flex>
            ) : (
              <Flex
                direction="column"
                wrap="nowrap"
                flex={1}
                style={{
                  minHeight: 0,
                }}
              >
                <Box
                  p="16px 24px"
                  flex={1}
                  style={{
                    overflowY: 'auto',
                  }}
                >
                  {cart.map((item) => (
                    <Flex
                      key={item.id}
                      align="center"
                      gap={14}
                      wrap="nowrap"
                      p="14px 0"
                      style={{
                        borderBottom: '1px solid #F9FAFB',
                      }}
                    >
                      <Flex
                        align="center"
                        justify="center"
                        wrap="wrap"
                        bg="#F3EEFF"
                        fz={22}
                        w={44}
                        h={44}
                        style={{
                          borderRadius: 8,
                          flexShrink: 0,
                        }}
                      >
                        {CATS.find((c) => c.id === item.cat)?.icon || '📦'}
                      </Flex>
                      <Box flex={1}>
                        <Box c="#111827" fz={13} fw="600" mb={3}>
                          {item.name}
                        </Box>
                        <Box c="#9CA3AF" fz={11}>
                          {catLabel(item.cat)}
                        </Box>
                      </Box>
                      <Box ta="right">
                        <Box c="#111827" fz={16} fw="700" ff="'Playfair Display',serif" mb={4}>
                          {fmtPrice(item.price)}
                        </Box>
                        <Button
                          onClick={() => rmCart(item.id)}
                          variant="light"
                          color="red"
                          px="lg"
                          size="xs"
                          type="button"
                          fz={10}
                          p="2px 8px"
                        >
                          Remove
                        </Button>
                      </Box>
                    </Flex>
                  ))}
                </Box>
                <Box
                  p="16px 24px 24px"
                  style={{
                    borderTop: '1px solid #F3F4F6',
                  }}
                >
                  <Box
                    bg="linear-gradient(90deg,transparent,rgba(201,150,63,0.3),transparent)"
                    h={1}
                    mb={16}
                  />
                  <Flex align="center" justify="space-between" wrap="wrap" mb={6}>
                    <Text component="span" inherit c="#374151" fz={15} fw="700">
                      Order Total
                    </Text>
                    <Text
                      component="span"
                      inherit
                      c="#9333EA"
                      fz={24}
                      fw="700"
                      ff="'Playfair Display',serif"
                    >
                      {fmtPrice(cartTotal)}
                    </Text>
                  </Flex>
                  <Text component="p" inherit c="#9CA3AF" fz={12} lh={1.5} m="8px 0 16px">
                    Secure checkout powered by Stripe. Google Pay & Apple Pay accepted.
                  </Text>
                  <Flex gap={6} wrap="wrap" mb={16}>
                    {['💳 Card', '🔵 Google Pay', '🍎 Apple Pay', '🔒 Stripe'].map((b) => (
                      <Text
                        key={b}
                        component="span"
                        inherit
                        c="#6B7280"
                        bg="#F9FAFB"
                        fz={10}
                        p="3px 8px"
                        style={{
                          border: '1px solid #E5E7EB',
                          borderRadius: 6,
                        }}
                      >
                        {b}
                      </Text>
                    ))}
                  </Flex>
                  {cart.length === 1 ? (
                    <Button
                      className="btn-h"
                      onClick={() => {
                        setShowCart(false);
                        openCheckout(cart[0]);
                      }}
                      variant="filled"
                      color="brand"
                      px="lg"
                      type="button"
                      fz={14}
                      w="100%"
                      mb={8}
                      p="14px"
                    >
                      ✦ Checkout — {fmtPrice(cart[0].price)}
                    </Button>
                  ) : (
                    <Flex direction="column" gap={8} wrap="nowrap">
                      {cart.map((item) => (
                        <Button
                          key={item.id}
                          className="btn-h"
                          onClick={() => {
                            setShowCart(false);
                            openCheckout(item);
                          }}
                          variant="filled"
                          color="brand"
                          px="lg"
                          type="button"
                          fz={12}
                          ta="left"
                          p="10px"
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                          }}
                        >
                          <span>{item.name}</span>
                          <span>{fmtPrice(item.price)}</span>
                        </Button>
                      ))}
                    </Flex>
                  )}
                  <Button
                    className="btn-h"
                    onClick={() => setCart([])}
                    variant="outline"
                    color="brand"
                    px="lg"
                    type="button"
                    fz={12}
                    w="100%"
                    mt={10}
                  >
                    Clear Cart
                  </Button>
                </Box>
              </Flex>
            )}
          </Flex>
        </Drawer.Body>
      </Drawer.Content>
    </Drawer.Root>
  );
}
