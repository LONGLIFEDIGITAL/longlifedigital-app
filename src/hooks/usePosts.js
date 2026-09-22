import { DEMO_POSTS, normalizePosts } from '../services/posts';
import usePublishedContent from './usePublishedContent';
import { wordpressApiUrl } from '../services/siteSettings';

export default function usePosts({ slug, page = 1, limit = 9, include = [], enabled = true } = {}) {
  const managed = Boolean(wordpressApiUrl);
  const params = new URLSearchParams({ resource: slug ? 'post' : 'posts' });
  if (slug) params.set('slug', slug);
  else {
    params.set('limit', String(limit));
    if (include.length) params.set('include', include.join(','));
    else params.set('page', String(page));
  }
  const query = usePublishedContent(params, (data) => normalizePosts(data, slug), enabled);
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
