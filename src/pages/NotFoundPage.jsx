import { Button, Container, Stack, Text, Title } from '@mantine/core';

export default function NotFoundPage({ product = false, setPage }) {
  return (
    <Container py="xl">
      <Stack align="center" gap="md" py="xl" ta="center">
        <Title order={1}>{product ? 'Product not found' : 'Page not found'}</Title>
        <Text c="dimmed">
          {product ? 'This product is no longer available.' : 'We couldn’t find that page.'}
        </Text>
        <Button onClick={() => setPage(product ? 'shop' : 'home')}>
          {product ? 'Browse Products' : 'Back to Home'}
        </Button>
      </Stack>
    </Container>
  );
}
