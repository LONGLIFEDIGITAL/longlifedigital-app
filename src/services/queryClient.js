import { QueryClient } from '@tanstack/react-query';
import { CONTENT_SYNC } from '../../shared/contentSync';

export function createStorefrontQueryClient() {
  const client = new QueryClient();
  const publicContent = {
    staleTime: CONTENT_SYNC.intervalMs,
    refetchInterval: CONTENT_SYNC.intervalMs,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: 'always',
    refetchOnReconnect: 'always',
    // Navigation can remount several consumers; reuse the current 15-second copy.
    refetchOnMount: true,
    retry: false,
  };
  client.setQueryDefaults(['wordpress'], publicContent);
  client.setQueryDefaults(['woocommerce'], {
    ...publicContent,
    // Multiple product cards mount together; reuse a fresh catalog between them.
    refetchOnMount: true,
    retry: 2,
  });
  return client;
}
