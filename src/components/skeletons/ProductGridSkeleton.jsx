import { SimpleGrid, useMantineTheme } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import SkeletonRegion from './SkeletonRegion';
import ProductCardSkeleton from './ProductCardSkeleton';
import collection from '../ProductCollection.module.css';

export default function ProductGridSkeleton({
  label = 'Loading products',
  count = 4,
  minColWidth = 250,
  compactMobile = true,
  mobilePeek = false,
}) {
  const theme = useMantineTheme();
  const desktop = useMediaQuery(`(min-width: ${theme.breakpoints.sm})`, undefined, {
    getInitialValueInEffect: false,
  });
  const peek = mobilePeek && !desktop;
  const compact = compactMobile && !desktop && !peek;
  const cards = Array.from({ length: count }, (_, index) => (
    <ProductCardSkeleton key={index} compact={compact} peek={peek} />
  ));
  return (
    <SkeletonRegion label={label}>
      {peek ? (
        <div className={collection.peekSkeleton}>{cards}</div>
      ) : compact ? (
        <div className={collection.viewport}>
          <div className={collection.pageGrid}>{cards}</div>
        </div>
      ) : (
        <SimpleGrid minColWidth={`min(100%, ${minColWidth}px)`} spacing={20}>
          {cards}
        </SimpleGrid>
      )}
    </SkeletonRegion>
  );
}
