import { plainText } from './catalog';

const normalize = (post) => ({
  ...post,
  title: plainText(post.title),
  excerpt: plainText(post.excerpt),
  categories: (post.categories || []).map(plainText),
  tags: (post.tags || []).map(plainText),
  image: { ...post.image, alt: plainText(post.image?.alt) },
});

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
