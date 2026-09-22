import { useQuery } from '@tanstack/react-query';
import { DEMO_POSTS, fetchPosts, normalizePosts } from '../services/posts';
import { initialPublished, postsContentKey } from '../services/publishedContent';
import { wordpressApiUrl } from '../services/siteSettings';

export default function usePosts({ slug, page = 1, limit = 9, include = [], enabled = true } = {}) {
  const managed = Boolean(wordpressApiUrl);
  const query = useQuery({
    queryKey: ['wordpress', 'posts', wordpressApiUrl, { slug, page, limit, include }],
    queryFn: ({ signal }) => fetchPosts({ signal, slug, page, limit, include }),
    enabled: managed && enabled,
    ...initialPublished(postsContentKey({ slug, page, limit, include }), (data) =>
      normalizePosts(data, slug),
    ),
    staleTime: 30_000,
    refetchInterval: 30_000,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: 'always',
    refetchOnReconnect: 'always',
    refetchOnMount: 'always',
    retry: false,
  });
  const data = managed
    ? query.data
    : slug
      ? DEMO_POSTS.find((post) => post.slug === slug) || null
      : { posts: DEMO_POSTS.slice(0, limit), totalPages: 1, page: 1 };
  return {
    data,
    status:
      data !== undefined ? 'ready' : query.isPending || query.isFetching ? 'loading' : 'error',
    retry: query.refetch,
  };
}
