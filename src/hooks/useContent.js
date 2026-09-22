import { wordpressApiUrl } from '../services/siteSettings';
import usePublishedContent from './usePublishedContent';
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
  const managed = Boolean(wordpressApiUrl);
  const params = new URLSearchParams({ resource });
  if (key) params.set('key', key);
  const query = usePublishedContent(params, (data) => {
    if (resource !== 'page' && !Array.isArray(data)) throw new Error('Invalid content collection.');
    if (resource === 'page' && (!data || data.key !== key || typeof data.body !== 'string'))
      throw new Error('Invalid page content.');
    return normalize(data);
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
