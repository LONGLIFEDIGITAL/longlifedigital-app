import { cacheContent } from '../server/contentCache.js';
import { requestWordPress } from '../server/wordpressRequest.js';
import { CONTENT_SYNC, contentCacheControl } from '../shared/contentSync.js';
import { homeSections, postContent, postRequest, validPostQuery } from '../server/editorial.js';
import { COLLECTIONS, readSiteContent, resolveSeo, validSiteQuery } from '../server/siteContent.js';
import { CONTENT_PAGES } from '../src/contentPages.js';

// Public storefront copy only; never expose arbitrary WordPress metadata or credentials.
function text(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function httpsUrl(value) {
  try {
    const url = new URL(text(value));
    return url.protocol === 'https:' && !url.username && !url.password ? url.href : '';
  } catch {
    return '';
  }
}

function destination(value, website) {
  const input = text(value);
  if (
    !input ||
    input.includes('\\') ||
    [...input].some((character) => character.charCodeAt(0) <= 32)
  )
    return '';
  if (input.startsWith('/') && !input.startsWith('//')) return input;
  const url = httpsUrl(input);
  if (!url) return '';
  const target = new URL(url);
  return website && target.origin === new URL(website).origin
    ? target.pathname + target.search + target.hash
    : url;
}

function send(res, status, body) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(body));
}

function sendContent(res, body, preview) {
  res.setHeader('Cache-Control', contentCacheControl(preview));
  return send(res, 200, body);
}

// The same handler runs in Vite locally and in a Vercel Function after deployment.
export function createContentHandler({
  baseUrl,
  preview = true,
  fetcher = fetch,
  cacheTtl = preview ? 0 : CONTENT_SYNC.serverCacheMs,
  now = Date.now,
  onRead,
}) {
  let pagesPending;
  const readPages = async (read) => {
    if (pagesPending) return pagesPending;
    const slugs = Object.entries(CONTENT_PAGES)
      .filter(([key]) => key !== 'home')
      .map(([, page]) => page.slug);
    pagesPending = read(
      `pages?slug=${slugs.join(',')}&status=publish&per_page=100&acf_format=light&_fields=id,slug,status,type,title,content,acf`,
    )
      .then((records) => {
        if (!Array.isArray(records)) throw new Error('Invalid pages.');
        return records;
      })
      .finally(() => {
        pagesPending = null;
      });
    return pagesPending;
  };
  const content = async (req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    if (req.method !== 'GET') {
      res.setHeader('Allow', 'GET');
      return send(res, 405, { error: 'Method not allowed.' });
    }
    const query = new URL(req.url, 'http://localhost').searchParams;
    const resource = query.get('resource');
    const siteResource = resource === 'page' || Object.hasOwn(COLLECTIONS, resource);
    if (
      (!siteResource && !['settings', 'home', 'posts', 'post'].includes(resource)) ||
      query.getAll('resource').length !== 1 ||
      !(siteResource ? validSiteQuery(resource, query) : validPostQuery(resource, query))
    ) {
      return send(res, 400, { error: 'Unknown content request.' });
    }
    if (!baseUrl?.trim()) return send(res, 503, { error: 'Site content is not configured.' });
    try {
      const base = new URL(`${baseUrl.trim().replace(/\/+$/, '')}/`);
      if (
        base.protocol !== 'https:' ||
        base.username ||
        base.password ||
        base.search ||
        base.hash
      ) {
        throw new Error('Invalid CMS configuration.');
      }
      const signal = AbortSignal.timeout(6000);
      const request = (path) => requestWordPress(new URL(path, base), { fetcher, signal });
      const read = async (path) => {
        const response = await request(path);
        if (!response.ok) throw new Error('Content unavailable.');
        return response.json();
      };
      if (siteResource) {
        const data = await readSiteContent({
          resource,
          query,
          request,
          read,
          readPages: () => readPages(read),
          destination,
          httpsUrl,
        });
        return data === null
          ? send(res, 404, { error: 'This page has not been published.' })
          : sendContent(res, data, preview);
      }
      if (resource === 'posts' || resource === 'post') {
        const response = await request(postRequest(resource, query));
        const records = await response.json();
        if (!response.ok) {
          if (
            resource === 'posts' &&
            response.status === 400 &&
            records.code === 'rest_post_invalid_page_number'
          )
            return sendContent(
              res,
              { posts: [], page: Number(query.get('page') || 1), totalPages: 0 },
              preview,
            );
          throw new Error('Articles unavailable.');
        }
        if (!Array.isArray(records)) throw new Error('Invalid articles response.');
        let posts = records
          .map((post) => postContent(post, resource === 'post', httpsUrl))
          .filter(Boolean);
        if (resource === 'post') {
          posts = posts.filter((post) => post.slug === query.get('slug'));
          if (posts.length === 1)
            posts[0].seo = await resolveSeo(
              records.find((record) => record.id === posts[0].id)?.acf,
              read,
              httpsUrl,
            );
          return posts.length === 1
            ? sendContent(res, posts[0], preview)
            : send(res, 404, { error: 'Article not found.' });
        }
        if (query.has('include')) {
          const order = query.get('include').split(',').map(Number);
          posts = order.flatMap((id) => posts.find((post) => post.id === id) || []);
        }
        const totalPages = Number(response.headers.get('X-WP-TotalPages'));
        return sendContent(
          res,
          {
            posts,
            page: Number(query.get('page') || 1),
            totalPages:
              Number.isSafeInteger(totalPages) && totalPages > 0
                ? totalPages
                : posts.length
                  ? 1
                  : 0,
          },
          preview,
        );
      }
      if (resource === 'home') {
        const pages = await read(
          'pages?slug=home&status=publish&per_page=2&acf_format=light&_fields=id,slug,status,type,title,acf',
        );
        if (Array.isArray(pages) && !pages.length)
          return send(res, 404, { error: 'The homepage has not been published.' });
        if (
          !Array.isArray(pages) ||
          pages.length !== 1 ||
          pages[0].slug !== 'home' ||
          pages[0].status !== 'publish' ||
          pages[0].type !== 'page' ||
          pages[0].acf?.lld_page_key !== 'home'
        ) {
          throw new Error('Invalid homepage record.');
        }
        const page = pages[0];
        const acf = page.acf;
        const home = acf.lld_home || {};
        const button = (value) => ({
          label: text(value?.label),
          destination: destination(value?.destination),
        });
        const sections = await homeSections(acf, read, button);
        return sendContent(
          res,
          {
            title: text(page.title?.rendered),
            seo: await resolveSeo(acf, read, httpsUrl),
            ...sections,
            hero: {
              eyebrow: text(acf.lld_eyebrow),
              heading: text(acf.lld_heading),
              intro: text(acf.lld_intro),
              prefix: text(home.hero_prefix),
              highlight: text(home.hero_highlight),
              suffix: text(home.hero_suffix),
              primaryCta: button(home.primary_cta),
              secondaryCta: button(home.secondary_cta),
            },
          },
          preview,
        );
      }
      const records = await read(
        'lld-settings?slug=storefront&status=publish&per_page=2&acf_format=light&_fields=id,slug,status,type,acf',
      );
      if (!Array.isArray(records)) throw new Error('Invalid settings response.');
      if (!records.length)
        return send(res, 404, { error: 'Site settings have not been published.' });
      if (
        records.length !== 1 ||
        records[0].slug !== 'storefront' ||
        records[0].status !== 'publish' ||
        records[0].type !== 'lld_settings' ||
        !records[0].acf
      ) {
        throw new Error('Invalid settings record.');
      }
      const acf = records[0].acf;
      const name = text(acf.lld_brand?.name);
      const website = httpsUrl(acf.lld_brand?.website);
      const email = text(acf.lld_contact?.email);
      if (!name || !website || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        throw new Error('Required settings are missing.');
      }
      const image = acf.lld_brand.logo || {};
      let logoSrc = httpsUrl(image.public_url);
      let logoAlt = text(image.alt);
      if (!logoSrc && Number.isSafeInteger(image.attachment) && image.attachment > 0) {
        try {
          const media = await read(
            `media/${image.attachment}?_fields=id,source_url,alt_text,media_type`,
          );
          if (media.id === image.attachment && media.media_type === 'image') {
            logoSrc = httpsUrl(media.source_url);
            logoAlt ||= text(media.alt_text);
          }
        } catch {
          // A missing logo must not take the site's contact information offline.
        }
      }
      const announcement = acf.lld_announcement || {};
      const footer = acf.lld_footer || {};
      const newsletter = acf.lld_newsletter || {};
      const chat = acf.lld_chat || {};
      const settings = {
        newsletter: {
          enabled: newsletter.enabled === true || newsletter.enabled === 1,
          popupEnabled: newsletter.popup_enabled === true || newsletter.popup_enabled === 1,
          popupDelay: Math.max(180, Number(newsletter.popup_delay_seconds) || 180),
          ...Object.fromEntries(
            [
              'heading',
              'body',
              'button_label',
              'consent_text',
              'success_message',
              'popup_heading',
              'popup_body',
            ].map((key) => [key, text(newsletter[key])]),
          ),
        },
        chat: {
          displayName: text(chat.display_name),
          welcome: text(chat.welcome),
          unavailableMessage: text(chat.unavailable_message),
          suggestedQuestions: text(chat.suggested_questions)
            .split(/\r?\n/)
            .map(text)
            .filter(Boolean)
            .slice(0, 4),
        },
        brand: {
          name,
          legalName: text(acf.lld_brand.legal_name),
          tagline: text(acf.lld_brand.tagline),
          website,
          websiteLabel: new URL(website).host,
          logo: { src: logoSrc, alt: logoAlt || name },
        },
        contact: {
          email,
          social: text(acf.lld_contact.social_handle),
          website: new URL(website).host,
          responseNote: text(acf.lld_contact.response_note),
          hours: text(acf.lld_contact.hours),
        },
        social: Object.fromEntries(
          ['instagram', 'facebook', 'tiktok', 'youtube', 'linkedin'].map((platform) => [
            platform,
            httpsUrl(acf.lld_social?.[platform]),
          ]),
        ),
        announcement: {
          enabled: announcement.enabled === true || announcement.enabled === 1,
          message: text(announcement.message),
          couponCode: text(announcement.coupon_code),
          deliveryNote: text(announcement.delivery_note),
          cta: {
            label: text(announcement.cta?.label),
            destination: destination(announcement.cta?.destination, website),
          },
        },
        footer: {
          description: text(footer.description),
          companyHeading: text(footer.company_heading),
          supportHeading: text(footer.support_heading),
          contactHeading: text(footer.contact_heading),
          copyrightName: text(footer.copyright_name) || name,
        },
      };
      return sendContent(res, settings, preview);
    } catch {
      return send(res, 502, {
        error:
          resource === 'home'
            ? 'Homepage content is temporarily unavailable.'
            : resource === 'settings'
              ? 'Site settings are temporarily unavailable.'
              : 'Content is temporarily unavailable.',
      });
    }
  };
  return cacheContent(content, { ttl: cacheTtl, now, onRead });
}

let activeHandler;
let activeConfig;
export default function handler(req, res) {
  const config = {
    baseUrl: process.env.VITE_WORDPRESS_API_URL,
    preview: process.env.VERCEL_ENV !== 'production',
  };
  const key = JSON.stringify(config);
  if (key !== activeConfig) {
    activeConfig = key;
    activeHandler = createContentHandler(config);
  }
  return activeHandler(req, res);
}
