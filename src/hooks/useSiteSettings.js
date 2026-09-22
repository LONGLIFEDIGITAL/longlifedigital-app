import usePublishedContent from './usePublishedContent';
import {
  DEMO_SITE_SETTINGS,
  EMPTY_SITE_SETTINGS,
  normalizeSiteSettings,
  wordpressApiUrl,
} from '../services/siteSettings';

export default function useSiteSettings() {
  const managed = Boolean(wordpressApiUrl);
  const { data, isPending, isFetching, refetch } = usePublishedContent(
    new URLSearchParams({ resource: 'settings' }),
    normalizeSiteSettings,
  );
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
