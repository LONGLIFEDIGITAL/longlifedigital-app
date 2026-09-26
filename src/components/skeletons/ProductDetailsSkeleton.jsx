import { Box, Container, Group, SimpleGrid, Stack } from '@mantine/core';
import SkeletonBlock from './SkeletonBlock';
import SkeletonRegion from './SkeletonRegion';

export default function ProductDetailsSkeleton() {
  return (
    <SkeletonRegion label="Loading product details">
      <Box maw={1280} mx="auto" p="16px 24px">
        <SkeletonBlock height={20} width="min(70%, 20rem)" />
      </Box>
      <Container>
        <SimpleGrid cols={{ base: 1, md: 2 }} spacing={{ base: 24, md: 48 }} p="24px 0 60px">
          <Box h={{ base: 280, sm: 360, md: 420 }}>
            <SkeletonBlock height="100%" radius={16} />
          </Box>
          <Stack gap={20}>
            <SkeletonBlock height={18} width="40%" />
            <Stack gap={10}>
              <SkeletonBlock height={30} />
              <SkeletonBlock height={30} width="75%" />
            </Stack>
            <Group gap={12}>
              <SkeletonBlock height={44} width={90} />
              <SkeletonBlock height={24} width={60} />
            </Group>
            <Stack gap={12}>
              {Array.from({ length: 5 }, (_, index) => (
                <SkeletonBlock key={index} height={14} width={index === 4 ? '65%' : '100%'} />
              ))}
            </Stack>
            <SimpleGrid cols={2} spacing={12} mt={8}>
              <SkeletonBlock height={50} />
              <SkeletonBlock height={50} />
            </SimpleGrid>
          </Stack>
        </SimpleGrid>
      </Container>
    </SkeletonRegion>
  );
}
