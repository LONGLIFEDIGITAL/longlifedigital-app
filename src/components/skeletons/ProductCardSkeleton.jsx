import { Box, Stack } from '@mantine/core';
import SkeletonBlock from './SkeletonBlock';
import card from '../ProductCard.module.css';
import classes from './Skeletons.module.css';

export default function ProductCardSkeleton({ compact = false }) {
  return (
    <div
      className={`${card.card} ${classes.card}`}
      data-compact={compact || undefined}
      data-product-skeleton
    >
      <div className={card.media}>
        <SkeletonBlock height="100%" radius={0} />
      </div>
      <div className={card.details}>
        <SkeletonBlock tone="light" height={compact ? 13.5 : 16.5} width="75%" />
        <Stack gap={compact ? 7 : 9} className={classes.cardTitle}>
          <SkeletonBlock tone="light" height={compact ? 12 : 16} />
          <SkeletonBlock tone="light" height={compact ? 12 : 16} width="70%" />
        </Stack>
        {!compact && (
          <Stack gap={8} my={4}>
            <SkeletonBlock tone="light" height={12} />
            <SkeletonBlock tone="light" height={12} width="65%" />
          </Stack>
        )}
        <SkeletonBlock tone="light" height={compact ? 25 : 30} width="45%" />
        <Box mt="auto" pt={compact ? 0 : 4}>
          <SkeletonBlock tone="light" height={44} radius="md" />
        </Box>
      </div>
    </div>
  );
}
