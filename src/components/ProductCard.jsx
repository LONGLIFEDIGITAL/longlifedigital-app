import { useRef, useState } from 'react';
import { AspectRatio, Box, Button, Card, Flex, Text } from '@mantine/core';
import { stars, fmtPrice, catLabel } from '../utils/helpers';
import { cardEmoji, cardReviews, cardTheme } from '../utils/cardPresentation';
import { headlessEnabled } from '../services/checkout';
import LoadingImage from './LoadingImage';
import EbookCardMedia from './EbookCardMedia';
import { isEbook } from '../utils/ebook';
import classes from './ProductCard.module.css';

const cardButtonStyles = { root: { minHeight: 'max(44px, 2.25rem)', paddingBlock: '0.375rem' } };

function ProductArtwork({ p }) {
  const theme = cardTheme(p);
  const emoji = cardEmoji(p);
  const category = p.categoryLabel || catLabel(p.cat);
  const onSale = p.oldPrice > p.price && p.price !== null;
  return (
    <div
      className={classes.artwork}
      style={{ background: theme.bg, '--card-accent': theme.accent }}
    >
      <div
        className={classes.orb}
        style={{ background: `radial-gradient(circle,${theme.orb1},transparent 70%)` }}
      />
      <div className={classes.accent} style={{ background: theme.bar }} />
      <div className={classes.badges}>
        <span className={classes.imageCategory}>
          <span aria-hidden="true">{emoji}</span> {category}
        </span>
        {p.tag && <span className={classes.tag}>{p.tag}</span>}
      </div>
      <span className={classes.emoji} aria-hidden="true">
        {emoji}
      </span>
      <div className={classes.imagePrice} aria-hidden="true">
        <span>{fmtPrice(p.price, p.currency, p.minorUnit)}</span>
        {onSale && (
          <div>
            <del>{fmtPrice(p.oldPrice, p.currency, p.minorUnit)}</del>
            <span className={classes.discount}>
              -{Math.round((1 - p.price / p.oldPrice) * 100)}%
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ProductCard({
  p,
  addCart,
  openCheckout,
  goProduct,
  compact = false,
  peek = false,
}) {
  const [pending, setPending] = useState('');
  const actionLock = useRef(false);
  const image = p.image || p.thumbnail;
  const ebook = isEbook(p);
  const review = cardReviews(p);
  const category = p.categoryLabel || catLabel(p.cat);
  const onSale = p.oldPrice > p.price && p.price !== null;
  const run = async (action) => {
    if (actionLock.current) return;
    actionLock.current = true;
    setPending(action);
    try {
      if (action === 'buy') await openCheckout(p);
      else await addCart(p);
    } finally {
      actionLock.current = false;
      setPending('');
    }
  };
  return (
    <Card
      component="article"
      padding={0}
      className={`pcard ${classes.card}`}
      data-compact={compact || undefined}
      data-peek={peek || undefined}
      data-kind={ebook ? 'ebook' : 'product'}
    >
      <AspectRatio ratio={compact ? 1 : 4 / 3} className={classes.mediaFrame}>
        <div className={classes.media}>
          {image ? (
            ebook ? (
              <EbookCardMedia product={p} fallback={<ProductArtwork p={p} />} />
            ) : (
              <LoadingImage
                src={image}
                alt={p.imageAlt || p.name}
                className={classes.productImage}
                imageClassName={classes.productArtwork}
                fit="contain"
                loading="lazy"
                fallback={<ProductArtwork p={p} />}
              />
            )
          ) : (
            <ProductArtwork p={p} />
          )}
        </div>
      </AspectRatio>
      <Box className={classes.details}>
        <Text component="p" className={classes.category}>
          {category}
        </Text>
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
        {review && (
          <div
            className={classes.reviews}
            aria-label={`${review.demo ? 'Preview: ' : ''}${review.rating} out of 5 stars, ${review.count} reviews`}
          >
            <span className={classes.stars} aria-hidden="true">
              {stars(review.rating).slice(0, 5)}
            </span>
            <span>
              {review.rating.toFixed(1)} ({review.count})
            </span>
            {review.demo && <span className={classes.previewLabel}>Preview</span>}
          </div>
        )}
        <Flex align="center" gap={8} wrap="wrap">
          <Text component="span" className={classes.price}>
            {fmtPrice(p.price, p.currency, p.minorUnit)}
          </Text>
          {onSale && (
            <Text component="span" className={classes.oldPrice}>
              {fmtPrice(p.oldPrice, p.currency, p.minorUnit)}
            </Text>
          )}
        </Flex>
        {p.availability && <Text className={classes.availability}>{p.availability}</Text>}
        <div className={classes.actions}>
          <Button
            className={classes.addButton}
            styles={cardButtonStyles}
            disabled={p.canAddToCart === false || !!pending}
            loading={pending === 'add'}
            onClick={() => run('add')}
            color="dark"
            type="button"
          >
            Add to Cart
          </Button>
          <Button
            className={classes.buyButton}
            styles={cardButtonStyles}
            disabled={
              !headlessEnabled ||
              !openCheckout ||
              p.source !== 'woocommerce' ||
              p.canAddToCart === false ||
              !!pending
            }
            loading={pending === 'buy'}
            onClick={() => run('buy')}
            color="brand"
            type="button"
          >
            Buy Now
          </Button>
        </div>
      </Box>
    </Card>
  );
}
