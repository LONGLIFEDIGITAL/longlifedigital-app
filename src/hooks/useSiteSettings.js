import { useQuery } from '@tanstack/react-query';
import {
  DEMO_SITE_SETTINGS,
  EMPTY_SITE_SETTINGS,
  fetchSiteSettings,
  wordpressApiUrl,
} from '../services/siteSettings';

export default function useSiteSettings() {
  const managed = Boolean(wordpressApiUrl);
  const { data, isPending, isFetching, refetch } = useQuery({
    queryKey: ['wordpress', 'site-settings', wordpressApiUrl],
    queryFn: ({ signal }) => fetchSiteSettings(signal),
    enabled: managed,
    staleTime: 30_000,
    refetchInterval: 30_000,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: 'always',
    refetchOnReconnect: 'always',
    retry: 2,
  });
  return {
    settings: managed ? (data ?? EMPTY_SITE_SETTINGS) : DEMO_SITE_SETTINGS,
    managed,
    status:
      !managed || data !== undefined ? 'ready' : isPending || isFetching ? 'loading' : 'error',
    retry: refetch,
  };
}
