import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readSiteContent } from '../server/siteContent.js';

for (const key of ['ebook', 'domains']) {
  test(`${key} projects public collection copy and validates featured IDs`, async () => {
    const result = await readSiteContent({
      resource: 'page', query: new URLSearchParams({ key }),
      readPages: async () => [{ id: 10, type: 'page', status: 'publish', slug: key,
        title: { rendered: 'Page title' }, content: { rendered: '' },
        acf: { lld_page_key: key, lld_featured_asset: 51, lld_collection: {
          collection_heading: ' The collection ', hero_note: ' A note ',
          primary: { label: ' Browse ', destination: '/domains#domain-collection' },
          secondary: { label: 'Unsafe', destination: 'javascript:alert(1)' },
          private_key: 'must not be published',
        } },
      }],
      destination: (value) => typeof value === 'string' && value.startsWith('/') ? value : '',
      httpsUrl: () => '',
    });
    assert.equal(result.collection.collection_heading, 'The collection');
    assert.equal(result.collection.hero_note, 'A note');
    assert.deepEqual(result.collection.primary, { label: 'Browse', destination: '/domains#domain-collection' });
    assert.equal(result.collection.secondary.destination, '');
    assert.equal(result.collection.featuredAsset, key === 'domains' ? 51 : null);
    assert.equal(result.collection.private_key, undefined);
    assert.equal(result.collection.closing_heading, '');
  });
}
