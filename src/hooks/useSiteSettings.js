import usePublishedContent from './usePublishedContent';
import {
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
    settings: data || EMPTY_SITE_SETTINGS,
    managed,
    status:
      !managed || data === null
        ? 'error'
        : data !== undefined
          ? 'ready'
          : isPending || isFetching
            ? 'loading'
            : 'error',
    retry: refetch,
  };
}
