import { Box, Button, Flex, SimpleGrid, Text } from '@mantine/core';
import { stars, fmtPrice, catLabel, getProdTheme } from '../utils/helpers';
export default function ProductCard({ p, addCart, goProduct, fire, isAdmin, openEdit, openDel }) {
  return (
    <Box
      className="pcard"
      bg="#fff"
      style={{
        border: '1px solid #F3F4F6',
        borderRadius: 12,
        overflow: 'hidden',
        transition: 'all 0.3s',
        boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
      }}
    >
      <Flex
        onClick={() => goProduct(p)}
        align="center"
        justify="center"
        wrap="wrap"
        bg={p.image ? 'transparent' : getProdTheme(p.id).bg}
        h={220}
        pos="relative"
        style={{
          cursor: 'pointer',
          overflow: 'hidden',
        }}
      >
        {p.image ? (
          <>
            <img
              src={p.image}
              alt={p.imageAlt || p.name}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                display: 'block',
              }}
            />
            <Box bg={getProdTheme(p.id).bar} h={3} pos="absolute" top={0} left={0} right={0} />
            {p.tag && (
              <Box
                c="#E8C97A"
                bg="rgba(0,0,0,0.55)"
                fz={9}
                fw={700}
                lts={1}
                p="3px 10px"
                pos="absolute"
                top={10}
                right={10}
                style={{
                  backdropFilter: 'blur(8px)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: 20,
                  zIndex: 2,
                }}
              >
                {p.tag}
              </Box>
            )}
            <Flex
              align="center"
              justify="space-between"
              wrap="wrap"
              bg="linear-gradient(0deg,rgba(0,0,0,0.75) 0%,transparent 100%)"
              p="12px 14px"
              pos="absolute"
              left={0}
              right={0}
              bottom={0}
              style={{
                zIndex: 2,
              }}
            >
              <Box c="#fff" fz={26} fw={700} ff="'Playfair Display',serif" lh={1}>
                {fmtPrice(p.price, p.currency, p.minorUnit)}
              </Box>
              {p.oldPrice && (
                <Box
                  c="#E8C97A"
                  bg="rgba(201,150,63,0.25)"
                  fz={8}
                  fw={700}
                  p="2px 7px"
                  style={{
                    border: '1px solid rgba(201,150,63,0.4)',
                    borderRadius: 20,
                  }}
                >
                  -{Math.round((1 - p.price / p.oldPrice) * 100)}%
                </Box>
              )}
            </Flex>
          </>
        ) : (
          <>
            <Box
              bg={`radial-gradient(circle,${getProdTheme(p.id).orb1} 0%,transparent 70%)`}
              w="70%"
              h="70%"
              pos="absolute"
              top="-20%"
              right="-15%"
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
            <Box bg={getProdTheme(p.id).bar} h={3} pos="absolute" top={0} left={0} right={0} />
            <Box
              c={getProdTheme(p.id).tagColor}
              bg="rgba(0,0,0,0.4)"
              fz={9}
              fw={700}
              lts={2}
              tt="uppercase"
              p="3px 10px"
              pos="absolute"
              top={10}
              left={10}
              style={{
                backdropFilter: 'blur(8px)',
                border: '1px solid rgba(255,255,255,0.15)',
                borderRadius: 20,
                zIndex: 2,
              }}
            >
              {getProdTheme(p.id).icon} {(p.categoryLabel || catLabel(p.cat)).toUpperCase()}
            </Box>
            {p.tag && (
              <Box
                c="#E8C97A"
                bg="rgba(0,0,0,0.4)"
                fz={9}
                fw={700}
                lts={1}
                p="3px 10px"
                pos="absolute"
                top={10}
                right={10}
                style={{
                  backdropFilter: 'blur(8px)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  borderRadius: 20,
                  zIndex: 2,
                }}
              >
                {p.tag}
              </Box>
            )}
            <Box
              fz={80}
              opacity={0.08}
              style={{
                pointerEvents: 'none',
                userSelect: 'none',
                zIndex: 1,
              }}
            >
              {getProdTheme(p.id).icon}
            </Box>
            <Flex
              align="center"
              justify="space-between"
              wrap="wrap"
              bg="linear-gradient(0deg,rgba(0,0,0,0.88) 0%,transparent 100%)"
              p="12px 14px"
              pos="absolute"
              left={0}
              right={0}
              bottom={0}
              style={{
                zIndex: 2,
              }}
            >
              <Box
                c={getProdTheme(p.id).priceColor}
                fz={26}
                fw={700}
                ff="'Playfair Display',serif"
                lh={1}
              >
                {fmtPrice(p.price, p.currency, p.minorUnit)}
              </Box>
              <Flex align="center" gap={6} wrap="wrap">
                {p.oldPrice && (
                  <Box c="rgba(255,255,255,0.35)" fz={11} td="line-through">
                    {fmtPrice(p.oldPrice, p.currency, p.minorUnit)}
                  </Box>
                )}
                {p.oldPrice && (
                  <Box
                    c="#E8C97A"
                    bg="rgba(201,150,63,0.2)"
                    fz={8}
                    fw={700}
                    p="2px 7px"
                    style={{
                      border: '1px solid rgba(201,150,63,0.3)',
                      borderRadius: 20,
                    }}
                  >
                    -{Math.round((1 - p.price / p.oldPrice) * 100)}%
                  </Box>
                )}
              </Flex>
            </Flex>
          </>
        )}
        <Box
          className="quick-add"
          bg="rgba(17,24,39,0.9)"
          p="12px"
          pos="absolute"
          left={0}
          right={0}
          bottom={0}
        >
          <Button
            disabled={p.canAddToCart === false}
            onClick={(e) => {
              e.stopPropagation();
              addCart(p);
            }}
            variant="transparent"
            color="dark"
            px={0}
            type="button"
            c="#111827"
            bg="#fff"
            fz={13}
            fw="600"
            ff="'Inter',sans-serif"
            w="100%"
            p="8px"
            style={{
              border: 'none',
              borderRadius: 6,
              cursor: 'pointer',
            }}
          >
            + Add to Cart
          </Button>
        </Box>
      </Flex>
      <Box p="16px">
        <Flex align="center" gap={6} wrap="wrap" mb={4}>
          <Box c="#9333EA" fz={11} fw="600" lts={1.5} tt="uppercase" mb={6}>
            {p.categoryLabel || catLabel(p.cat)}
          </Box>
          {p.pdfFile && (
            <Text
              component="span"
              inherit
              c="#DC2626"
              bg="rgba(239,68,68,0.08)"
              fz={9}
              fw={700}
              lts={0.5}
              p="2px 6px"
              style={{
                border: '1px solid rgba(239,68,68,0.15)',
                borderRadius: 10,
              }}
            >
              📄 PDF READY
            </Text>
          )}
        </Flex>
        <Box
          onClick={() => goProduct(p)}
          c="#111827"
          fz={15}
          fw="600"
          lh={1.3}
          mb={8}
          style={{
            cursor: 'pointer',
          }}
        >
          {p.name}
        </Box>
        {p.reviews > 0 && (
          <Flex align="center" gap={6} wrap="wrap" mb={10}>
            <Text component="span" inherit c="#F59E0B" fz={12}>
              {stars(p.rating).slice(0, 5)}
            </Text>
            <Text component="span" inherit c="#9CA3AF" fz={12}>
              {p.rating} ({p.reviews})
            </Text>
          </Flex>
        )}
        <Flex align="center" gap={8} wrap="wrap" mb={12}>
          <Text component="span" inherit c="#111827" fz={20} fw="700" ff="'Playfair Display',serif">
            {fmtPrice(p.price, p.currency, p.minorUnit)}
          </Text>
          {p.oldPrice && (
            <Text component="span" inherit c="#9CA3AF" fz={14} td="line-through">
              {fmtPrice(p.oldPrice, p.currency, p.minorUnit)}
            </Text>
          )}
        </Flex>
        <SimpleGrid cols={2} spacing={8}>
          <Button
            className="btn-h"
            disabled={p.canAddToCart === false}
            onClick={() => addCart(p)}
            variant="filled"
            color="dark"
            px="lg"
            size="sm"
            type="button"
          >
            Add to Cart
          </Button>
          <Button
            className="btn-h"
            onClick={() =>
              p.source === 'woocommerce'
                ? goProduct(p)
                : p.payhipUrl
                  ? window.open(p.payhipUrl, '_blank')
                  : fire('Payhip link coming soon!', 'info')
            }
            variant="filled"
            color="brand"
            px="lg"
            size="sm"
            type="button"
          >
            {p.source === 'woocommerce' ? 'View Details' : 'Buy Now'}
          </Button>
        </SimpleGrid>
        {p.availability && (
          <Text size="xs" c="dimmed" mt="sm">
            {p.availability}
          </Text>
        )}
        {isAdmin && (
          <Flex
            gap={8}
            wrap="wrap"
            mt={10}
            pt={10}
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
      </Box>
    </Box>
  );
}
