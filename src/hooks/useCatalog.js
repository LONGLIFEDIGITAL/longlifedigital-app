import { useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { catalogCategories, fetchCatalog, storeApiUrl } from '../services/catalog';

const EMPTY_PRODUCTS = [];

export default function useCatalog() {
  const managed = Boolean(storeApiUrl);
  const { data, isPending, isFetching, refetch } = useQuery({
    queryKey: ['woocommerce', 'catalog', storeApiUrl],
    queryFn: ({ signal }) => fetchCatalog(signal),
    enabled: managed,
  });

  const retry = useCallback(() => refetch(), [refetch]);
  const products = data || EMPTY_PRODUCTS;
  // Keep the last successful catalog during refetches, including failed ones.
  // Only the first load or a retry without cached data needs page skeletons.
  const status = !managed
    ? 'error'
    : data !== undefined
      ? 'ready'
      : isPending || isFetching
        ? 'loading'
        : 'error';

  return {
    products,
    status,
    retry,
    managed,
    categories: catalogCategories(products),
  };
}
