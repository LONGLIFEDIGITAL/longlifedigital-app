import { Box, SimpleGrid } from '@mantine/core';
import { catalogStatistics } from '../utils/catalogStatistics';
import SkeletonBlock from './skeletons/SkeletonBlock';
import SkeletonRegion from './skeletons/SkeletonRegion';
import classes from './CatalogStatistics.module.css';

export default function CatalogStatistics({ products, status }) {
  const { categoryCount, aiToolsProductCount: aiToolsProductCount } = catalogStatistics(products);
  return (
    <SimpleGrid cols={2} spacing={16} w="100%" role="group" aria-label="Store statistics">
      {[
        { label: 'Product Categories', value: categoryCount, dynamic: true },
        { label: 'AI Tools', value: aiToolsProductCount, dynamic: true },
        { label: 'Support', value: '24hr' },
        { label: 'Digital', value: '100%' },
      ].map(({ label, value, dynamic }) => (
        <Box key={label} className={classes.card} role="group" aria-label={label}>
          <div className={classes.value}>
            {dynamic && status === 'loading' ? (
              <SkeletonRegion label={`Loading ${label.toLowerCase()} count`}>
                <SkeletonBlock height={30} width={48} mx="auto" />
              </SkeletonRegion>
            ) : dynamic && status === 'error' ? (
              <span aria-label="Currently unavailable">—</span>
            ) : (
              value
            )}
          </div>
          <div className={classes.label}>{label}</div>
        </Box>
      ))}
    </SimpleGrid>
  );
}
