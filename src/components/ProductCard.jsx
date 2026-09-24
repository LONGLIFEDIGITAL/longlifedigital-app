import { Box, Button, Flex, Text } from '@mantine/core';
import { stars, fmtPrice, catLabel, getProdTheme } from '../utils/helpers';
import classes from './ProductCard.module.css';
import LoadingImage from './LoadingImage';

export default function ProductCard({
  p,
  addCart,
  goProduct,
  isAdmin,
  openEdit,
  openDel,
  compact = false,
}) {
  const summary = p.summary || p.desc;
  return (
    <Box
      component="article"
      className={`pcard ${classes.card}`}
      data-compact={compact || undefined}
    >
      <Flex
        align="center"
        justify="center"
        wrap="wrap"
        bg={p.image ? 'transparent' : getProdTheme(p.id).bg}
        className={classes.media}
      >
        {p.image ? (
          <>
            <LoadingImage
              src={p.image}
              alt={p.imageAlt || p.name}
              className={classes.image}
              loading="lazy"
            />
            <Box bg={getProdTheme(p.id).bar} h={3} pos="absolute" top={0} left={0} right={0} />
            {p.tag && (
              <Box
                className={classes.tag}
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
              className={classes.imagePrice}
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
              <Box c="#fff" fz={26} fw={700} ff="'Plus Jakarta Sans',sans-serif" lh={1}>
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
              className={classes.imageCategory}
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
                className={classes.tag}
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
              className={classes.imagePrice}
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
                ff="'Plus Jakarta Sans',sans-serif"
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
      </Flex>
      <Box className={classes.details}>
        <Flex className={classes.categoryRow} align="center" gap={6} wrap="wrap">
          <Text component="p" className={classes.category}>
            {p.categoryLabel || catLabel(p.cat)}
          </Text>
          {p.pdfFile && (
            <Text component="span" className={classes.fileBadge}>
              📄 PDF READY
            </Text>
          )}
        </Flex>
        <h3 className={classes.title}>
          <button
            type="button"
            className={classes.productLink}
            aria-label={`View ${p.name}`}
            onClick={() => goProduct(p)}
          >
            <span className={classes.productName}>{p.name}</span>
          </button>
        </h3>
        {summary && (
          <Text component="p" className={classes.summary} lineClamp={3}>
            {summary}
          </Text>
        )}
        {p.reviews > 0 && (
          <Flex className={classes.reviews} align="center" gap={6} wrap="wrap">
            <Text component="span" inherit c="#F59E0B" fz={12}>
              {stars(p.rating).slice(0, 5)}
            </Text>
            <Text component="span" className={classes.reviewCount}>
              {p.rating} ({p.reviews})
            </Text>
          </Flex>
        )}
        <Flex align="center" gap={8} wrap="wrap">
          <Text component="span" className={classes.price}>
            {fmtPrice(p.price, p.currency, p.minorUnit)}
          </Text>
          {p.oldPrice && (
            <Text component="span" className={classes.oldPrice}>
              {fmtPrice(p.oldPrice, p.currency, p.minorUnit)}
            </Text>
          )}
        </Flex>
        {p.availability && <Text className={classes.availability}>{p.availability}</Text>}
        <Box className={classes.actions}>
          <Button
            className={`btn-h ${classes.addButton}`}
            disabled={p.canAddToCart === false}
            onClick={(event) => {
              event.stopPropagation();
              addCart(p);
            }}
            variant="gradient"
            gradient={{ from: '#C9963F', to: '#E8C97A', deg: 135 }}
            c="#24113d"
            fullWidth
            type="button"
          >
            Add to Cart
          </Button>
        </Box>
        {isAdmin && (
          <Flex className={classes.adminActions} gap={8} wrap="wrap" mt={10} pt={10}>
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
