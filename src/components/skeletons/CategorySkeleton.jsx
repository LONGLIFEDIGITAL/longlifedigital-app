import { Stack } from '@mantine/core';
import SkeletonBlock from './SkeletonBlock';
import SkeletonRegion from './SkeletonRegion';
import classes from './Skeletons.module.css';

export default function CategorySkeleton({ variant = 'list', label = 'Loading categories' }) {
  return (
    <SkeletonRegion label={label}>
      {variant === 'tiles' ? (
        <div className={classes.categoryTiles}>
          {Array.from({ length: 4 }, (_, index) => (
            <div key={index} className={classes.categoryTile}>
              <SkeletonBlock height={32} width={32} radius="md" />
              <SkeletonBlock height={12} width="85%" />
              <SkeletonBlock height={10} width="45%" />
            </div>
          ))}
        </div>
      ) : variant === 'select' ? (
        <Stack gap={6}>
          <SkeletonBlock height={20} width={75} />
          <SkeletonBlock height={44} />
        </Stack>
      ) : (
        <Stack gap={variant === 'links' ? 10 : 6}>
          {Array.from({ length: 4 }, (_, index) => (
            <SkeletonBlock key={index} height={variant === 'links' ? 18 : 38} />
          ))}
        </Stack>
      )}
    </SkeletonRegion>
  );
}
