import { wordpressApiUrl } from './siteSettings';

const prefix = `lld:published:v1:${encodeURIComponent(wordpressApiUrl)}:`;
const MAX_AGE = 24 * 60 * 60 * 1000;

export function rememberPublished(key, data) {
  const entry = { data, updatedAt: Date.now() };
  try {
    const encoded = JSON.stringify(entry);
    if (encoded.length > 500_000) return;
    localStorage.setItem(prefix + key, encoded);
    const keys = Object.keys(localStorage).filter((name) => name.startsWith(prefix));
    if (keys.length > 24) {
      const oldest = keys
        .filter((name) => name !== prefix + key)
        .sort(
          (a, b) =>
            (JSON.parse(localStorage.getItem(a))?.updatedAt || 0) -
            (JSON.parse(localStorage.getItem(b))?.updatedAt || 0),
        );
      for (const name of oldest.slice(0, keys.length - 24)) localStorage.removeItem(name);
    }
  } catch {
    /* Browsing with storage blocked must still work. */
  }
}

export function initialPublished(key, normalize) {
  const candidates = [];
  try {
    const snapshot = JSON.parse(document.getElementById('lld-content')?.textContent || 'null');
    if (snapshot?.version === 1 && snapshot.cmsUrl === wordpressApiUrl && snapshot.entries?.[key])
      candidates.push(snapshot.entries[key]);
  } catch {
    /* No build snapshot, or invalid markup. */
  }
  try {
    const saved = JSON.parse(localStorage.getItem(prefix + key) || 'null');
    // Keep a confirmed removal so an older build snapshot cannot resurrect it.
    if (saved && (saved.data === null || Date.now() - saved.updatedAt < MAX_AGE))
      candidates.unshift(saved);
  } catch {
    /* Optional browser cache. */
  }
  for (const entry of candidates.sort((a, b) => b.updatedAt - a.updatedAt)) {
    try {
      if (!Number.isFinite(entry.updatedAt)) continue;
      return {
        initialData: entry.data === null ? null : normalize(entry.data),
        initialDataUpdatedAt: entry.updatedAt,
      };
    } catch {
      /* Ignore an incompatible cached record. */
    }
  }
  return {};
}

export const postsContentKey = ({ slug, page = 1, limit = 9, include = [] }) =>
  slug ? `post:${slug}` : `posts:${page}:${limit}:${include.join(',')}`;
