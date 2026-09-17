import { Box, Group, Stack } from '@mantine/core';
import SkeletonBlock from './SkeletonBlock';
import SkeletonRegion from './SkeletonRegion';
import home from '../../pages/HomePage.module.css';

export default function FeaturedProductSkeleton() {
  return (
    <SkeletonRegion label="Loading featured product" className={home.featuredCard}>
      <SkeletonBlock tone="light" height={26} width={130} radius="xl" mb={16} />
      <SkeletonBlock tone="light" height={160} mb={12} />
      <Stack gap={8} mb={12}>
        <SkeletonBlock tone="light" height={18} width="90%" />
        <SkeletonBlock tone="light" height={18} width="65%" />
      </Stack>
      <Group gap={10} mb={10}>
        <SkeletonBlock tone="light" height={38} width={80} />
        <SkeletonBlock tone="light" height={20} width={50} />
      </Group>
      <Box pt={12}>
        <SkeletonBlock tone="light" height={44} radius="md" />
      </Box>
    </SkeletonRegion>
  );
}
