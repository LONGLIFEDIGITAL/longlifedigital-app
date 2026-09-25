import { seoContent } from './siteContent.js';
const text = (value) => (typeof value === 'string' ? value.trim() : '');
const ids = (value, limit) =>
  [
    ...new Set(
      Array.isArray(value) ? value.filter((id) => Number.isSafeInteger(id) && id > 0) : [],
    ),
  ].slice(0, limit);

export async function homeSections(acf, read, button) {
  const home = acf.lld_home || {};
  const about = home.about || {};
  const blog = home.blog || {};
  const selections = {
    trust: ids(home.trust_items, 8),
    hero: ids(home.hero_stats, 3),
    benefits: ids(about.benefits, 8),
    stats: ids(about.stats, 4),
  };
  const all = [...new Set(Object.values(selections).flat())];
  const records = all.length
    ? await read(
        `lld-blocks?include=${all.join(',')}&per_page=100&status=publish&acf_format=light&_fields=id,type,status,title,excerpt,acf`,
      )
    : [];
  if (!Array.isArray(records)) throw new Error('Invalid content blocks.');
  const blocks = (selection, kind) =>
    selections[selection].flatMap((id) => {
      const block = records.find(
        (record) =>
          record.id === id &&
          record.status === 'publish' &&
          record.type === 'lld_block' &&
          !record.excerpt?.protected &&
          record.acf?.lld_kind === kind,
      );
      return block
        ? [
            {
              id,
              title: text(block.title?.rendered),
              description: text(block.excerpt?.rendered),
              icon: text(block.acf.lld_icon),
              value: text(block.acf.lld_stat_value),
            },
          ]
        : [];
    });
  return {
    collections: {
      catalog: { title: text(home.catalog_title), intro: text(home.catalog_intro) },
      featured: { title: text(home.featured_title), intro: text(home.featured_intro) },
      more: { title: text(home.more_title), intro: text(home.more_intro) },
      cta: button(home.collection_cta),
    },
    offer: { title: text(home.offer_title), button: text(home.offer_button) },
    trustItems: blocks('trust', 'trust'),
    heroStats: blocks('hero', 'stat'),
    about: {
      eyebrow: text(about.eyebrow),
      heading: text(about.heading),
      body: text(about.body),
      benefits: blocks('benefits', 'benefit'),
      stats: blocks('stats', 'stat'),
      cta: button(about.cta),
    },
    blog: {
      heading: text(blog.heading),
      intro: text(blog.intro),
      postIds: ids(blog.posts, 3),
      cta: button(blog.cta),
    },
    closingCta: {
      heading: text(acf.lld_cta?.heading),
      body: text(acf.lld_cta?.body),
      ...button(acf.lld_cta),
    },
  };
}

export function validPostQuery(resource, query) {
  const allowed =
    resource === 'posts'
      ? ['resource', 'page', 'limit', 'include']
      : resource === 'post'
        ? ['resource', 'slug']
        : ['resource'];
  if ([...query.keys()].some((key) => !allowed.includes(key) || query.getAll(key).length !== 1))
    return false;
  if (resource === 'post') return /^[\p{L}\p{N}_%-]{1,200}$/u.test(query.get('slug') || '');
  if (resource !== 'posts') return true;
  for (const [key, max] of [
    ['page', 10000],
    ['limit', 12],
  ]) {
    if (query.has(key) && (!/^[1-9]\d*$/.test(query.get(key)) || Number(query.get(key)) > max))
      return false;
  }
  return (
    !query.has('include') ||
    (!query.has('page') &&
      /^[1-9]\d*(,[1-9]\d*){0,2}$/.test(query.get('include')) &&
      query
        .get('include')
        .split(',')
        .every((id) => Number.isSafeInteger(Number(id))))
  );
}

export function postRequest(resource, query) {
  const params = new URLSearchParams({
    status: 'publish',
    _embed: 'wp:featuredmedia,wp:term',
    acf_format: 'light',
    _fields: `id,slug,type,status,title,excerpt,date,acf,_links,_embedded${resource === 'post' ? ',content' : ''}`,
  });
  if (resource === 'post') {
    params.set('slug', query.get('slug'));
    params.set('per_page', '2');
  } else {
    params.set('per_page', query.get('include') ? '3' : query.get('limit') || '9');
    params.set('orderby', query.has('include') ? 'include' : 'date');
    params.set('order', 'desc');
    if (query.has('include')) params.set('include', query.get('include'));
    else params.set('page', query.get('page') || '1');
  }
  return `posts?${params}`;
}

export function postContent(post, detail, httpsUrl) {
  if (
    post.type !== 'post' ||
    post.status !== 'publish' ||
    post.excerpt?.protected ||
    post.content?.protected ||
    !Number.isSafeInteger(post.id) ||
    !text(post.slug)
  )
    return null;
  const media = post._embedded?.['wp:featuredmedia']?.[0];
  const categories = (post._embedded?.['wp:term'] || [])
    .flat()
    .filter((term) => term.taxonomy === 'category');
  return {
    id: post.id,
    slug: post.slug,
    seo: seoContent(post.acf, httpsUrl),
    title: text(post.title?.rendered),
    excerpt: text(post.excerpt?.rendered),
    date: text(post.date),
    categories: categories.map((term) => text(term.name)).filter(Boolean),
    tags: (post._embedded?.['wp:term'] || [])
      .flat()
      .filter((term) => term.taxonomy === 'post_tag')
      .map((term) => text(term.name))
      .filter(Boolean),
    image: {
      src: media?.media_type === 'image' ? httpsUrl(media.source_url) : '',
      alt: text(media?.alt_text),
    },
    ...(detail ? { body: text(post.content?.rendered) } : {}),
  };
}
