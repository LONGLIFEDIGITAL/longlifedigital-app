import { useQuery } from '@tanstack/react-query';
import { initialPublished, rememberPublished } from '../services/publishedContent';
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
    queryFn: async ({ signal }) => {
      const settings = await fetchSiteSettings(signal);
      rememberPublished('settings', settings);
      return settings;
    },
    ...initialPublished('settings', (settings) => {
      if (!settings?.brand || !settings.contact || !settings.footer || !settings.announcement)
        throw new Error('Invalid settings');
      return settings;
    }),
    enabled: managed,
    staleTime: 30_000,
    refetchInterval: 30_000,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: 'always',
    refetchOnReconnect: 'always',
    refetchOnMount: 'always',
    retry: false,
  });
  return {
    settings: managed ? (data ?? EMPTY_SITE_SETTINGS) : DEMO_SITE_SETTINGS,
    managed,
    status:
      data === null
        ? 'error'
        : !managed || data !== undefined
          ? 'ready'
          : isPending || isFetching
            ? 'loading'
            : 'error',
    retry: refetch,
  };
}
