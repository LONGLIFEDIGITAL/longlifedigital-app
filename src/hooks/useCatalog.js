import { useCallback, useEffect, useState } from 'react';
import { INIT_PRODUCTS, CATS } from '../constants/data';
import { catalogCategories, fetchCatalog, storeApiUrl } from '../services/catalog';

export default function useCatalog() {
  const managed = Boolean(storeApiUrl);
  const [products, setProducts] = useState(managed ? [] : INIT_PRODUCTS);
  const [status, setStatus] = useState(managed ? 'loading' : 'ready');
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!managed) return;
    const controller = new AbortController();
    fetchCatalog(controller.signal)
      .then((items) => {
        if (controller.signal.aborted) return;
        setProducts(items);
        setStatus('ready');
      })
      .catch(() => {
        if (!controller.signal.aborted) setStatus('error');
      });
    return () => controller.abort();
  }, [managed, attempt]);

  const retry = useCallback(() => {
    setStatus('loading');
    setAttempt((value) => value + 1);
  }, []);

  return {
    products,
    setProducts,
    status,
    retry,
    managed,
    categories: managed ? catalogCategories(products) : CATS,
  };
}
