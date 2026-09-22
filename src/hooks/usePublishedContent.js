import { useQuery } from '@tanstack/react-query';
import { wordpressApiUrl } from '../services/siteSettings';
import { initialPublished, rememberPublished } from '../services/publishedContent';
import { CONTENT_SYNC, contentCacheKey } from '../../shared/contentSync';

// All editorial hooks use this transport, validation and persistence path.
// Scheduling is inherited from the global QueryClient WordPress defaults.
export default function usePublishedContent(params, normalize, enabled = true) {
  const key = contentCacheKey(params);
  return useQuery({
    queryKey: ['wordpress', key, wordpressApiUrl],
    enabled: Boolean(wordpressApiUrl) && enabled,
    ...initialPublished(key, normalize),
    queryFn: async ({ signal }) => {
      const response = await fetch(`/api/content?${params}`, {
        cache: 'no-store',
        credentials: 'omit',
        headers: { Accept: 'application/json' },
        signal: AbortSignal.any([signal, AbortSignal.timeout(CONTENT_SYNC.requestTimeoutMs)]),
      });
      const singleton = ['page', 'home', 'post', 'settings'].includes(params.get('resource'));
      if (singleton && response.status === 404) {
        rememberPublished(key, null);
        return null;
      }
      if (!response.ok) throw new Error('Content could not be loaded.');
      const raw = await response.json();
      // A malformed response must not replace the last valid browser copy.
      const data = normalize(raw);
      rememberPublished(key, raw);
      return data;
    },
  });
}
