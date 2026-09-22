import { Flex, Stack } from '@mantine/core';
import SkeletonBlock from './SkeletonBlock';
import SkeletonRegion from './SkeletonRegion';

export default function HomeHeroSkeleton() {
  return (
    <SkeletonRegion label="Loading homepage introduction">
      <SkeletonBlock tone="light" height={30} width="70%" radius="xl" mb={20} />
      <Stack gap={12} mb={20}>
        <SkeletonBlock tone="light" height="clamp(32px, 5vw, 64px)" width="95%" />
        <SkeletonBlock tone="light" height="clamp(32px, 5vw, 64px)" width="80%" />
        <SkeletonBlock tone="light" height="clamp(32px, 5vw, 64px)" width="90%" />
      </Stack>
      <Stack gap={12} mb={32}>
        <SkeletonBlock tone="light" height={18} width="90%" />
        <SkeletonBlock tone="light" height={18} width="80%" />
      </Stack>
      <Flex gap={12} direction={{ base: 'column', xs: 'row' }}>
        <SkeletonBlock tone="light" height={52} w={{ base: '100%', xs: 140 }} />
        <SkeletonBlock tone="light" height={52} w={{ base: '100%', xs: 140 }} />
      </Flex>
    </SkeletonRegion>
  );
}
