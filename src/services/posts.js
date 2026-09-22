import { BLOG_POSTS } from '../constants/data';
import { plainText } from './catalog';
import { postsContentKey, rememberPublished } from './publishedContent';

export const DEMO_POSTS = BLOG_POSTS.map((post) => ({
  ...post,
  slug: `demo-${post.id}`,
  categories: [post.tag],
  image: { src: '', alt: '' },
  body: `<p>${post.excerpt}</p>`,
}));

const normalize = (post) => ({
  ...post,
  title: plainText(post.title),
  excerpt: plainText(post.excerpt),
  categories: (post.categories || []).map(plainText),
  image: { ...post.image, alt: plainText(post.image?.alt) },
});

export async function fetchPosts({ signal, slug, page = 1, limit = 9, include = [] }) {
  const params = new URLSearchParams({ resource: slug ? 'post' : 'posts' });
  if (slug) params.set('slug', slug);
  else {
    params.set('limit', String(limit));
    if (include.length) params.set('include', include.join(','));
    else params.set('page', String(page));
  }
  const response = await fetch(`/api/content?${params}`, {
    cache: 'no-store',
    credentials: 'omit',
    headers: { Accept: 'application/json' },
    signal: AbortSignal.any([signal, AbortSignal.timeout(8000)]),
  });
  const key = postsContentKey({ slug, page, limit, include });
  if (slug && response.status === 404) {
    rememberPublished(key, null);
    return null;
  }
  if (!response.ok) throw new Error('Articles could not be loaded.');
  const data = await response.json();
  const normalized = normalizePosts(data, slug);
  rememberPublished(key, data);
  return normalized;
}

export function postDate(date) {
  if (!/^\d{4}-\d{2}-\d{2}/.test(date)) return date;
  // WordPress's date is local to the publisher; avoid shifting it across time zones.
  const value = new Date(`${date.slice(0, 10)}T12:00:00`);
  return Number.isNaN(value.getTime())
    ? ''
    : value.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

export function normalizePosts(data, slug) {
  return slug ? normalize(data) : { ...data, posts: data.posts.map(normalize) };
}
