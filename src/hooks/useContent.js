import { useQuery } from '@tanstack/react-query';
import { wordpressApiUrl } from '../services/siteSettings';
import { initialPublished, rememberPublished } from '../services/publishedContent';
import { plainText } from '../services/catalog';

function normalizeRecord(record) {
  if (!record) return record;
  const normalized = { ...record };
  for (const key of [
    'title',
    'heading',
    'intro',
    'eyebrow',
    'description',
    'navLabel',
    'navSummary',
  ]) {
    if (typeof record[key] === 'string') normalized[key] = plainText(record[key]);
  }
  if (record.about)
    normalized.about = { ...record.about, sections: record.about.sections.map(normalizeRecord) };
  return normalized;
}
const normalize = (data) =>
  Array.isArray(data) ? data.map(normalizeRecord) : normalizeRecord(data);

export default function useContent(resource, key) {
  const cacheKey = resource === 'page' ? `page:${key}` : resource;
  const managed = Boolean(wordpressApiUrl);
  const query = useQuery({
    queryKey: ['wordpress', cacheKey, wordpressApiUrl],
    enabled: managed,
    ...initialPublished(cacheKey, normalize),
    queryFn: async ({ signal }) => {
      const params = new URLSearchParams({ resource });
      if (key) params.set('key', key);
      const response = await fetch(`/api/content?${params}`, {
        signal: AbortSignal.any([signal, AbortSignal.timeout(8000)]),
        cache: 'no-store',
        credentials: 'omit',
        headers: { Accept: 'application/json' },
      });
      if (resource === 'page' && response.status === 404) {
        rememberPublished(cacheKey, null);
        return null;
      }
      if (!response.ok) throw new Error('Content could not be loaded.');
      const data = await response.json();
      if (resource !== 'page' && !Array.isArray(data))
        throw new Error('Invalid content collection.');
      rememberPublished(cacheKey, data);
      return normalize(data);
    },
    staleTime: 30_000,
    refetchInterval: 30_000,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: 'always',
    refetchOnReconnect: 'always',
    refetchOnMount: 'always',
    retry: false,
  });
  const data = managed ? query.data : resource === 'page' ? null : [];
  return {
    data,
    retry: query.refetch,
    status:
      data === null || (Array.isArray(data) && !data.length)
        ? 'empty'
        : data !== undefined
          ? 'ready'
          : query.isPending
            ? 'loading'
            : 'error',
  };
}
