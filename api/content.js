import { randomUUID } from 'node:crypto';

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
  return target.origin === new URL(website).origin
    ? target.pathname + target.search + target.hash
    : url;
}

function send(res, status, body) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(body));
}

// The same handler runs in Vite locally and in a Vercel Function after deployment.
export function createContentHandler({ baseUrl, preview = true, fetcher = fetch }) {
  return async function content(req, res) {
    res.setHeader('Cache-Control', 'no-store');
    if (req.method !== 'GET') {
      res.setHeader('Allow', 'GET');
      return send(res, 405, { error: 'Method not allowed.' });
    }
    const query = new URL(req.url, 'http://localhost').searchParams;
    if (
      query.get('resource') !== 'settings' ||
      query.getAll('resource').length !== 1 ||
      [...query.keys()].some((key) => key !== 'resource')
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
      const signal = AbortSignal.timeout(12000);
      const read = async (path) => {
        const url = new URL(path, base);
        // WordPress's edge can serve a cached REST response even with no-cache headers.
        // Refresh upstream on every handler request; Vercel controls the shared TTL.
        url.searchParams.set('_lld_refresh', randomUUID());
        const response = await fetcher(url, {
          cache: 'no-store',
          headers: { Accept: 'application/json', 'Cache-Control': 'no-cache' },
          signal,
          redirect: 'error',
        });
        if (!response.ok) throw new Error('Content unavailable.');
        return response.json();
      };
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
      const settings = {
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
      if (!preview)
        res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=30, must-revalidate');
      return send(res, 200, settings);
    } catch {
      return send(res, 502, { error: 'Site settings are temporarily unavailable.' });
    }
  };
}

export default function handler(req, res) {
  return createContentHandler({
    baseUrl: process.env.VITE_WORDPRESS_API_URL,
    preview: process.env.VERCEL_ENV !== 'production',
  })(req, res);
}
