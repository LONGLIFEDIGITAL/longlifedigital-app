import { Box, Stack } from '@mantine/core';
import SkeletonBlock from './SkeletonBlock';
import card from '../ProductCard.module.css';
import classes from './Skeletons.module.css';

export default function ProductCardSkeleton({ compact = false, peek = false }) {
  return (
    <div
      className={`${card.card} ${classes.card}`}
      data-compact={compact || undefined}
      data-peek={peek || undefined}
      data-product-skeleton
    >
      <div className={card.media}>
        <SkeletonBlock height="100%" radius={0} />
      </div>
      <div className={card.details}>
        <SkeletonBlock height={compact ? 13.5 : 16.5} width="75%" />
        <Stack gap={compact ? 7 : 9} className={classes.cardTitle} mih={peek ? 60 : undefined}>
          <SkeletonBlock height={compact ? 12 : 16} />
          <SkeletonBlock height={compact ? 12 : 16} width="70%" />
        </Stack>
        <SkeletonBlock height={compact || peek ? 36 : 24} width="85%" />
        <SkeletonBlock height={compact ? 25 : 30} width="45%" />
        <Box mt="auto" pt={compact ? 0 : 4} className={card.actions}>
          <SkeletonBlock height={34} radius="md" />
          <SkeletonBlock height={34} radius="md" />
        </Box>
      </div>
    </div>
  );
}
