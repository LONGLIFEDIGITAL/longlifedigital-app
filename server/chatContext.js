import { createContentHandler } from '../api/content.js';
import { CONTENT_SYNC } from '../shared/contentSync.js';
const clean = (value) =>
  String(value || '')
    .replace(/<[^>]*>/g, '')
    .slice(0, 600);
let handler;
let cmsUrl;
export async function chatContext() {
  if (!handler || cmsUrl !== process.env.VITE_WORDPRESS_API_URL) {
    cmsUrl = process.env.VITE_WORDPRESS_API_URL;
    handler = createContentHandler({ baseUrl: cmsUrl, cacheTtl: CONTENT_SYNC.serverCacheMs });
  }
  const read = async (resource) => {
    let status, body;
    await handler(
      { method: 'GET', url: `/api/content?resource=${resource}` },
      {
        set statusCode(value) {
          status = value;
        },
        setHeader() {},
        end(value) {
          body = JSON.parse(value);
        },
      },
    );
    return status === 200 ? body : null;
  };
  const [settings, services] = await Promise.all([read('settings'), read('services')]);
  return {
    store: settings?.brand.name || '',
    contact: settings?.contact.email || '',
    responseNote: settings?.contact.responseNote || '',
    promotion: settings?.announcement.enabled ? settings.announcement : null,
    services: (services || []).slice(0, 20).map((service) => ({
      title: clean(service.title),
      summary: clean(service.description),
      url: `/services#${encodeURIComponent(service.slug)}`,
    })),
    unavailableMessage: settings?.chat?.unavailableMessage || '',
  };
}
