// One freshness policy for every public WordPress/ACF/WooCommerce read.
export const CONTENT_SYNC = Object.freeze({
  intervalMs: 15_000,
  serverCacheMs: 5_000,
  edgeCacheSeconds: 5,
  requestTimeoutMs: 8_000,
});

export const contentCacheKey = (params) => {
  const resource = params.get('resource');
  if (resource === 'page') return `page:${params.get('key')}`;
  if (resource === 'post') return `post:${params.get('slug')}`;
  if (resource === 'posts')
    return `posts:${params.get('page') || 1}:${params.get('limit') || 9}:${params.get('include') || ''}`;
  return resource;
};

export const contentCacheControl = (preview) =>
  preview
    ? 'no-store'
    : `public, max-age=0, s-maxage=${CONTENT_SYNC.edgeCacheSeconds}, must-revalidate`;
