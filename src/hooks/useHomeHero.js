import { useQuery } from '@tanstack/react-query';
import { DEMO_HOME_CONTENT, fetchHomeContent, normalizeHomeContent } from '../services/homePage';
import { initialPublished } from '../services/publishedContent';
import { wordpressApiUrl } from '../services/siteSettings';

export default function useHomeHero() {
  const managed = Boolean(wordpressApiUrl);
  const { data, isPending, isFetching, refetch } = useQuery({
    queryKey: ['wordpress', 'home-content', wordpressApiUrl],
    queryFn: ({ signal }) => fetchHomeContent(signal),
    enabled: managed,
    ...initialPublished('home', normalizeHomeContent),
    staleTime: 30_000,
    refetchInterval: 30_000,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: 'always',
    refetchOnReconnect: 'always',
    refetchOnMount: 'always',
    retry: false,
  });
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
