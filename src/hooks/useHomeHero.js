import { DEMO_HOME_CONTENT, normalizeHomeContent } from '../services/homePage';
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
    content: managed ? data : DEMO_HOME_CONTENT,
    hero: managed ? data?.hero : DEMO_HOME_CONTENT.hero,
    status: !managed
      ? 'ready'
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
