import { CONTENT_PAGES } from '../src/contentPages.js';

const text = (value) => (typeof value === 'string' ? value.trim() : '');
const id = (value) => (Number.isSafeInteger(value) && value > 0 ? value : null);
const ids = (value) => [...new Set(Array.isArray(value) ? value.filter(id) : [])];
const published = (record, type) =>
  record?.type === type &&
  record.status === 'publish' &&
  id(record.id) &&
  !record.content?.protected &&
  !record.excerpt?.protected;

export const COLLECTIONS = {
  services: ['lld-services', 'lld_service'],
  assets: ['lld-assets', 'lld_asset'],
  faqs: ['lld-faqs', 'lld_faq'],
  navigation: ['lld-navigation', 'lld_nav_item'],
  'asset-categories': ['lld-asset-categories', null],
};

export function validSiteQuery(resource, query) {
  const allowed = resource === 'page' ? ['resource', 'key'] : ['resource'];
  return (
    [...query.keys()].every((key) => allowed.includes(key) && query.getAll(key).length === 1) &&
    (resource !== 'page' ||
      (query.get('key') !== 'home' && Object.hasOwn(CONTENT_PAGES, query.get('key'))))
  );
}

export function seoContent(acf = {}, httpsUrl) {
  return {
    title: text(acf.lld_seo_title),
    description: text(acf.lld_meta_description),
    image: httpsUrl(acf.lld_share_image?.public_url),
    noindex: acf.lld_noindex === true || acf.lld_noindex === 1,
  };
}

export async function resolveSeo(acf, read, httpsUrl) {
  const seo = seoContent(acf, httpsUrl);
  const attachment = id(acf?.lld_share_image?.attachment);
  if (!seo.image && attachment) {
    try {
      const media = await read(`media/${attachment}?_fields=id,source_url,media_type`);
      if (media.id === attachment && media.media_type === 'image')
        seo.image = httpsUrl(media.source_url);
    } catch {
      /* An optional sharing image must not block content. */
    }
  }
  return seo;
}

// Explicit projections prevent private/plugin metadata from entering the public API.
export async function readSiteContent({
  resource,
  query,
  request,
  read,
  readPages,
  destination,
  httpsUrl,
}) {
  const button = (value = {}) => ({
    label: text(value.label),
    destination: destination(value.destination),
  });
  const baseRecord = (record) => ({
    id: record.id,
    slug: text(record.slug),
    title: text(record.title?.rendered),
    description: text(record.excerpt?.rendered),
    body: text(record.content?.rendered),
    order: Number(record.menu_order) || 0,
    seo: seoContent(record.acf, httpsUrl),
  });
  const pricing = (acf) => ({
    mode: ['estimate', 'product'].includes(acf.lld_pricing_mode) ? acf.lld_pricing_mode : 'contact',
    amount:
      acf.lld_amount !== '' &&
      Number.isFinite(Number(acf.lld_amount)) &&
      Number(acf.lld_amount) >= 0
        ? Number(acf.lld_amount)
        : null,
    currency: /^[A-Z]{3}$/.test(acf.lld_currency) ? acf.lld_currency : 'USD',
    period: ['month', 'year'].includes(acf.lld_billing_period) ? acf.lld_billing_period : 'once',
    productId: id(acf.lld_product),
  });
  if (resource === 'page') {
    const key = query.get('key');
    const { slug } = CONTENT_PAGES[key];
    const records = await readPages();
    if (!Array.isArray(records)) throw new Error('Invalid pages.');
    const pages = records.filter(
      (record) =>
        published(record, 'page') && record.slug === slug && record.acf?.lld_page_key === key,
    );
    if (!pages.length) return null;
    if (pages.length !== 1) throw new Error('Duplicate content page.');
    const page = pages[0];
    const acf = page.acf;
    let sections = [];
    if (key === 'about' && ids(acf.lld_about?.sections).length) {
      const selected = ids(acf.lld_about.sections).slice(0, 20);
      const blocks = await read(
        `lld-blocks?include=${selected.join(',')}&per_page=100&status=publish&acf_format=light&_fields=id,slug,type,status,title,excerpt,content,acf`,
      );
      if (!Array.isArray(blocks)) throw new Error('Invalid About sections.');
      sections = selected.flatMap((blockId) => {
        const block = blocks.find(
          (record) =>
            record.id === blockId &&
            published(record, 'lld_block') &&
            record.acf?.lld_kind === 'value',
        );
        return block ? [{ ...baseRecord(block), icon: text(block.acf.lld_icon) }] : [];
      });
    }
    return {
      ...baseRecord(page),
      key,
      eyebrow: text(acf.lld_eyebrow),
      seo: await resolveSeo(acf, read, httpsUrl),
      heading: text(acf.lld_heading) || text(page.title?.rendered),
      intro: text(acf.lld_intro),
      cta: {
        heading: text(acf.lld_cta?.heading),
        body: text(acf.lld_cta?.body),
        ...button(acf.lld_cta),
      },
      about: { tagline: text(acf.lld_about?.tagline), sections },
      contact: Object.fromEntries(
        [
          'information_heading',
          'form_heading',
          'form_intro',
          'success_heading',
          'success_body',
        ].map((field) => [field, text(acf.lld_contact?.[field])]),
      ),
      policy: {
        updatedOn: text(acf.lld_policy?.updated_on),
        heading: text(acf.lld_policy?.callout_heading),
        body: text(acf.lld_policy?.callout_body),
      },
    };
  }
  const [endpoint, type] = COLLECTIONS[resource];
  const records = [];
  for (let page = 1, totalPages = 1; page <= totalPages; page++) {
    const params = new URLSearchParams({
      per_page: '100',
      page: String(page),
      acf_format: 'light',
    });
    if (type) {
      params.set('status', 'publish');
      params.set(
        '_fields',
        'id,slug,type,status,title,excerpt,content,menu_order,acf,lld_asset_cat,_embedded,_links',
      );
      params.set('_embed', 'wp:featuredmedia');
    } else {
      params.set('hide_empty', 'false');
      params.set('_fields', 'id,slug,name,description,acf');
    }
    const response = await request(`${endpoint}?${params}`);
    if (!response.ok) throw new Error('Collection unavailable.');
    const data = await response.json();
    if (!Array.isArray(data)) throw new Error('Invalid collection.');
    records.push(...data);
    totalPages = Number(response.headers.get('X-WP-TotalPages')) || 1;
    if (!Number.isSafeInteger(totalPages) || totalPages < 1 || totalPages > 100)
      throw new Error('Invalid pagination.');
  }
  return records
    .filter((record) => (type ? published(record, type) : id(record.id)))
    .map((record) => {
      const acf = record.acf || {};
      const common = baseRecord(record);
      const media = record._embedded?.['wp:featuredmedia']?.[0];
      if (resource === 'services' || resource === 'assets')
        return {
          ...common,
          pricing: pricing(acf),
          cta: button(acf.lld_cta),
          image: {
            src: media?.media_type === 'image' ? httpsUrl(media.source_url) : '',
            alt: text(media?.alt_text),
          },
          ...(resource === 'services'
            ? {
                icon: text(acf.lld_icon),
                navLabel: text(acf.lld_nav_label),
                navSummary: text(acf.lld_nav_summary),
                packageDetails: text(acf.lld_package_details),
              }
            : {
                assetType: acf.lld_asset_type === 'website' ? 'website' : 'domain',
                availability: ['reserved', 'sold'].includes(acf.lld_availability)
                  ? acf.lld_availability
                  : 'available',
                badge: text(acf.lld_badge),
                demoUrl: httpsUrl(acf.lld_demo_url),
                categories: ids(record.lld_asset_cat),
              }),
        };
      if (resource === 'faqs')
        return {
          ...common,
          topics: Array.isArray(acf.lld_topics)
            ? acf.lld_topics.filter((topic) =>
                ['general', 'products', 'services', 'domains'].includes(topic),
              )
            : [],
        };
      if (resource === 'asset-categories')
        return {
          id: record.id,
          slug: text(record.slug),
          title: text(record.name),
          description: text(record.description),
          icon: text(acf.lld_icon),
          order: Number(acf.lld_order) || 0,
        };
      return {
        id: record.id,
        title: common.title,
        description: common.description,
        order: common.order,
        area: ['header', 'footer_company', 'footer_support', 'footer_legal'].includes(acf.lld_area)
          ? acf.lld_area
          : '',
        destination: /^(mailto:[^\s@]+@[^\s@]+\.[^\s@]+|tel:\+?[\d()-]+)$/.test(acf.lld_destination)
          ? acf.lld_destination
          : destination(acf.lld_destination),
        newTab: acf.lld_new_tab === true || acf.lld_new_tab === 1,
        icon: text(acf.lld_icon),
        parentId: id(acf.lld_parent),
        childrenSource: ['manual', 'services', 'asset_categories'].includes(acf.lld_children_source)
          ? acf.lld_children_source
          : 'none',
      };
    })
    .sort((a, b) => a.order - b.order || a.id - b.id);
}
