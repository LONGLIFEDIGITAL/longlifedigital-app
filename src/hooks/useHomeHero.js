import { normalizeHomeContent } from '../services/homePage';
import usePublishedContent from './usePublishedContent';
import { wordpressApiUrl } from '../services/siteSettings';

export default function useHomeHero() {
  const managed = Boolean(wordpressApiUrl);
  const { data, isPending, isFetching, refetch } = usePublishedContent(
    new URLSearchParams({ resource: 'home' }),
    normalizeHomeContent,
  );
  return {
    managed,
    content: data,
    hero: data?.hero,
    status: !managed
      ? 'empty'
      : data === null
        ? 'empty'
        : data !== undefined
          ? 'ready'
          : isPending || isFetching
            ? 'loading'
            : 'error',
    retry: refetch,
  };
}
