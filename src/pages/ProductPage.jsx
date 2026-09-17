import { Box, Button, Container, Flex, SimpleGrid, Text, Title } from '@mantine/core';
import LoadingImage from '../components/LoadingImage';
import { stars, fmtPrice, catLabel, getProdTheme } from '../utils/helpers';
import ProductCard from '../components/ProductCard';
import classes from './ProductPage.module.css';
export default function ProductPage({
  selProduct,
  products,
  setPage,
  addCart,
  fire,
  isAdmin,
  openEdit,
  openDel,
  goProduct,
}) {
  const p = selProduct;
  if (!p) return null;
  const discount = p.oldPrice ? Math.round((1 - p.price / p.oldPrice) * 100) : 0;
  const related = products.filter((r) => r.cat === p.cat && r.id !== p.id).slice(0, 4);
  return (
    <div>
      <Flex align="center" gap={8} wrap="wrap" maw={1280} m="0 auto" p="16px 24px">
        <Text
          onClick={() => setPage('home')}
          component="span"
          inherit
          c="#9333EA"
          fz={13}
          style={{
            cursor: 'pointer',
          }}
        >
          Home
        </Text>
        <Text component="span" inherit c="#D1D5DB" fz={13}>
          /
        </Text>
        <Text
          onClick={() => setPage('shop')}
          component="span"
          inherit
          c="#9333EA"
          fz={13}
          style={{
            cursor: 'pointer',
          }}
        >
          Shop
        </Text>
        <Text component="span" inherit c="#D1D5DB" fz={13}>
          /
        </Text>
        <Text component="span" inherit c="#9CA3AF" fz={13}>
          {p.name}
        </Text>
      </Flex>
      <Container>
        <SimpleGrid
          cols={{
            base: 1,
            md: 2,
          }}
          spacing={{
            base: 24,
            md: 48,
          }}
          maw={1280}
          m="0 auto"
          p="24px 0 60px"
          style={{
            alignItems: 'start',
          }}
        >
          <div>
            <Flex
              align="center"
              justify="center"
              wrap="wrap"
              h={{
                base: 280,
                sm: 360,
                md: 420,
              }}
              bg={getProdTheme(p.id).bg}
              pos="relative"
              style={{
                borderRadius: 16,
                border: '1px solid #F3F4F6',
                overflow: 'hidden',
              }}
            >
              {p.image && (
                <LoadingImage
                  src={p.image}
                  alt={p.imageAlt || p.name}
                  pos="absolute"
                  inset={0}
                  w="100%"
                  h="100%"
                  fit="contain"
                />
              )}
              <Box
                bg={`radial-gradient(circle,${getProdTheme(p.id).orb1} 0%,transparent 70%)`}
                w="70%"
                h="70%"
                pos="absolute"
                top="-20%"
                right="-10%"
                style={{
                  borderRadius: '50%',
                  pointerEvents: 'none',
                }}
              />
              <Box
                bg={`radial-gradient(circle,${getProdTheme(p.id).orb2} 0%,transparent 70%)`}
                w="50%"
                h="50%"
                pos="absolute"
                left="-10%"
                bottom="-15%"
                style={{
                  borderRadius: '50%',
                  pointerEvents: 'none',
                }}
              />
              <Box bg={getProdTheme(p.id).bar} h={4} pos="absolute" top={0} left={0} right={0} />
              {p.tag && (
                <Box
                  c="#E8C97A"
                  bg="rgba(0,0,0,0.4)"
                  fz={11}
                  fw={700}
                  lts={1}
                  p="5px 14px"
                  pos="absolute"
                  top={16}
                  left={16}
                  style={{
                    backdropFilter: 'blur(8px)',
                    border: '1px solid rgba(255,255,255,0.15)',
                    borderRadius: 20,
                  }}
                >
                  {p.tag}
                </Box>
              )}
              {!p.image && (
                <Box
                  fz={120}
                  opacity={0.1}
                  style={{
                    pointerEvents: 'none',
                    userSelect: 'none',
                  }}
                >
                  {getProdTheme(p.id).icon}
                </Box>
              )}
              <Flex
                align="center"
                gap={12}
                wrap="wrap"
                bg="linear-gradient(0deg,rgba(0,0,0,0.88) 0%,transparent 100%)"
                p="16px 20px"
                pos="absolute"
                left={0}
                right={0}
                bottom={0}
              >
                <Box
                  c={getProdTheme(p.id).priceColor}
                  fz={40}
                  fw={700}
                  ff="'Playfair Display',serif"
                  lh={1}
                >
                  {fmtPrice(p.price, p.currency, p.minorUnit)}
                </Box>
                {p.oldPrice && (
                  <>
                    <Box c="rgba(255,255,255,0.4)" fz={16} td="line-through">
                      {fmtPrice(p.oldPrice, p.currency, p.minorUnit)}
                    </Box>
                    <Box
                      c="#E8C97A"
                      bg="rgba(201,150,63,0.2)"
                      fz={11}
                      fw={700}
                      p="4px 12px"
                      style={{
                        border: '1px solid rgba(201,150,63,0.35)',
                        borderRadius: 20,
                      }}
                    >
                      SAVE {Math.round((1 - p.price / p.oldPrice) * 100)}%
                    </Box>
                  </>
                )}
              </Flex>
            </Flex>
          </div>
          <div>
            <Box c="#9333EA" fz={12} fw="600" lts={1.5} tt="uppercase" mb={10}>
              {p.categoryLabel || catLabel(p.cat)}
            </Box>
            <Title
              order={1}
              c="#111827"
              fz="clamp(24px,4vw,40px)"
              fw="700"
              ff="'Playfair Display',serif"
              lh={1.2}
              mb={14}
            >
              {p.name}
            </Title>
            {p.reviews > 0 && (
              <Flex align="center" wrap="wrap" mb={16}>
                <Text component="span" inherit c="#F59E0B">
                  {stars(p.rating).slice(0, 5)}
                </Text>
                <Text component="span" inherit c="#6B7280" fz={13} ml={8}>
                  {p.rating} ({p.reviews} reviews)
                </Text>
              </Flex>
            )}
            <Flex align="center" gap={12} wrap="wrap" mb={20}>
              <Text
                component="span"
                inherit
                c="#111827"
                fz={36}
                fw="700"
                ff="'Playfair Display',serif"
              >
                {fmtPrice(p.price, p.currency, p.minorUnit)}
              </Text>
              {p.oldPrice && (
                <Text component="span" inherit c="#9CA3AF" fz={20} td="line-through">
                  {fmtPrice(p.oldPrice, p.currency, p.minorUnit)}
                </Text>
              )}
              {discount > 0 && (
                <Text
                  component="span"
                  inherit
                  c="#92400E"
                  bg="#FEF3C7"
                  fz={13}
                  fw="700"
                  p="4px 12px"
                  style={{
                    borderRadius: 20,
                  }}
                >
                  Save {discount}%
                </Text>
              )}
            </Flex>
            {p.descriptionHtml ? (
              <Box
                component="section"
                aria-label="Product description"
                className={classes.description}
                dangerouslySetInnerHTML={{ __html: p.descriptionHtml }}
              />
            ) : (
              <Box
                component="section"
                aria-label="Product description"
                className={classes.description}
              >
                <p className={classes.plainDescription}>{p.desc}</p>
              </Box>
            )}
            {(p.level || p.duration || p.includes) && (
              <Flex
                direction="column"
                gap={8}
                wrap="nowrap"
                bg="#F9FAFB"
                mb={20}
                p="16px"
                style={{
                  borderRadius: 10,
                }}
              >
                {p.level && (
                  <Flex gap={8} wrap="wrap" c="#374151" fz={13}>
                    <Text component="span" inherit c="#111827" fw="600" miw={80}>
                      Level:
                    </Text>
                    <span>{p.level}</span>
                  </Flex>
                )}
                {p.duration && (
                  <Flex gap={8} wrap="wrap" c="#374151" fz={13}>
                    <Text component="span" inherit c="#111827" fw="600" miw={80}>
                      Duration:
                    </Text>
                    <span>{p.duration}</span>
                  </Flex>
                )}
                {p.includes && (
                  <Flex gap={8} wrap="wrap" c="#374151" fz={13}>
                    <Text component="span" inherit c="#111827" fw="600" miw={80}>
                      Includes:
                    </Text>
                    <span>{p.includes}</span>
                  </Flex>
                )}
              </Flex>
            )}
            <Flex
              gap={12}
              wrap="wrap"
              direction={{
                base: 'column',
                xs: 'row',
              }}
              align="stretch"
              mb={12}
            >
              <Button
                className="btn-h"
                disabled={p.canAddToCart === false}
                onClick={() => addCart(p)}
                variant="filled"
                color="brand"
                px="lg"
                type="button"
                fz={15}
                p="14px"
                flex={1}
              >
                Add to Cart
              </Button>
              <Button
                className="btn-h"
                disabled={p.source === 'woocommerce'}
                onClick={() =>
                  p.payhipUrl
                    ? window.open(p.payhipUrl, '_blank')
                    : fire('Payhip link coming soon!', 'info')
                }
                variant="gradient"
                color="brand"
                px="lg"
                gradient={{
                  from: '#C9963F',
                  to: '#E8C97A',
                  deg: 135,
                }}
                c="#1a0533"
                type="button"
                fz={15}
                p="14px"
                flex={1}
              >
                {p.source === 'woocommerce' ? 'Checkout coming soon' : 'Buy Now'}
              </Button>
            </Flex>
            {p.availability && (
              <Text size="sm" c="dimmed" mb="md">
                {p.availability}
              </Text>
            )}
            {p.stripeUrl && (
              <Button
                className="btn-h"
                onClick={() => window.open(p.stripeUrl, '_blank')}
                variant="transparent"
                color="dark"
                px={0}
                type="button"
                c="#635BFF"
                bg="#fff"
                fz={13}
                fw="700"
                ff="'Inter',sans-serif"
                w="100%"
                mb={20}
                p="11px"
                style={{
                  border: '2px solid #635BFF',
                  borderRadius: 8,
                  cursor: 'pointer',
                }}
              >
                💳 Pay with Stripe
              </Button>
            )}
            <Flex
              gap={8}
              wrap="wrap"
              p="16px 0"
              style={{
                borderTop: '1px solid #F3F4F6',
              }}
            >
              {(p.source === 'woocommerce'
                ? []
                : [
                    '⚡ Instant Download',
                    '🔒 Secure Payment',
                    '♾️ Lifetime Access',
                    '💬 24hr Support',
                  ]
              ).map((t) => (
                <Text
                  key={t}
                  component="span"
                  inherit
                  c="#6B7280"
                  bg="#F9FAFB"
                  fz={12}
                  p="5px 12px"
                  style={{
                    borderRadius: 20,
                  }}
                >
                  {t}
                </Text>
              ))}
            </Flex>
            {isAdmin && (
              <Flex
                gap={10}
                wrap="wrap"
                mt={20}
                pt={16}
                style={{
                  borderTop: '1px solid #F3F4F6',
                }}
              >
                <Button
                  onClick={() => openEdit(p)}
                  variant="light"
                  color="gray"
                  px="lg"
                  size="xs"
                  type="button"
                >
                  Edit
                </Button>
                <Button
                  onClick={() => openDel(p.id)}
                  variant="light"
                  color="red"
                  px="lg"
                  size="xs"
                  type="button"
                >
                  Delete
                </Button>
              </Flex>
            )}
          </div>
        </SimpleGrid>
        {related.length > 0 && (
          <Box
            mt={60}
            pt={40}
            style={{
              borderTop: '1px solid #F3F4F6',
            }}
          >
            <Title
              order={2}
              c="#111827"
              fz="clamp(24px,4vw,36px)"
              fw="700"
              ff="'Playfair Display',serif"
              mb={24}
            >
              You May Also Like
            </Title>
            <SimpleGrid minColWidth="min(100%, 250px)" spacing={20}>
              {related.map((r) => (
                <ProductCard
                  key={r.id}
                  p={r}
                  addCart={addCart}
                  goProduct={goProduct}
                  fire={fire}
                  isAdmin={isAdmin}
                  openEdit={openEdit}
                  openDel={openDel}
                />
              ))}
            </SimpleGrid>
          </Box>
        )}
      </Container>
    </div>
  );
}
