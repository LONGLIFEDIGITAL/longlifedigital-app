import { Alert, Button, Text } from '@mantine/core';
import ProductGridSkeleton from './skeletons/ProductGridSkeleton';

export default function CatalogStatus({ status, retry, empty = false, loading }) {
  if (status === 'loading') return loading ?? <ProductGridSkeleton />;
  if (status === 'error')
    return (
      <Alert color="red" title="Products are temporarily unavailable" role="alert" my="lg">
        <Text size="sm">Please try again in a moment.</Text>
        <Button variant="light" color="red" mt="sm" onClick={retry}>
          Try again
        </Button>
      </Alert>
    );
  if (empty)
    return (
      <Text role="status" ta="center" py="xl">
        No products available yet.
      </Text>
    );
  return null;
}
