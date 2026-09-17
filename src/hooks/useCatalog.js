import { useCallback, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { INIT_PRODUCTS, CATS } from '../constants/data';
import { catalogCategories, fetchCatalog, storeApiUrl } from '../services/catalog';

const EMPTY_PRODUCTS = [];
const REFRESH_INTERVAL = 30_000;

export default function useCatalog() {
  const managed = Boolean(storeApiUrl);
  // The legacy editor still owns demo products; CMS data stays in the query cache.
  const [localProducts, setProducts] = useState(managed ? EMPTY_PRODUCTS : INIT_PRODUCTS);
  const { data, isPending, isFetching, refetch } = useQuery({
    queryKey: ['woocommerce', 'catalog', storeApiUrl],
    queryFn: ({ signal }) => fetchCatalog(signal),
    enabled: managed,
    staleTime: REFRESH_INTERVAL,
    refetchInterval: REFRESH_INTERVAL,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: 'always',
    refetchOnReconnect: 'always',
    retry: 2,
  });

  const retry = useCallback(() => refetch(), [refetch]);
  const products = managed ? (data ?? EMPTY_PRODUCTS) : localProducts;
  // Keep the last successful catalog during refetches, including failed ones.
  // Only the first load or a retry without cached data needs page skeletons.
  const status =
    !managed || data !== undefined ? 'ready' : isPending || isFetching ? 'loading' : 'error';

  return {
    products,
    setProducts,
    status,
    retry,
    managed,
    categories: managed ? catalogCategories(products) : CATS,
  };
}
