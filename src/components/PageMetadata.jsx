import useSiteSettings from '../hooks/useSiteSettings';

// React 19 hoists these tags into <head> and removes them when routes change.
export default function PageMetadata({ content, title, path }) {
  const { settings } = useSiteSettings();
  const seo = content?.seo || {};
  const name = settings.brand.name;
  const pageTitle = seo.title || [...new Set([title, name].filter(Boolean))].join(' | ');
  const description =
    seo.description ||
    content?.hero?.intro ||
    content?.intro ||
    content?.excerpt ||
    content?.summary ||
    '';
  const canonical =
    settings.brand.website && path ? new URL(path, settings.brand.website).href : '';
  return (
    <>
      <title>{pageTitle || 'Storefront'}</title>
      <meta name="description" content={description} />
      <meta name="robots" content={seo.noindex ? 'noindex,follow' : 'index,follow'} />
      <meta property="og:title" content={pageTitle} />
      <meta property="og:description" content={description} />
      {seo.image && <meta property="og:image" content={seo.image} />}
      {canonical && (
        <>
          <link rel="canonical" href={canonical} />
          <meta property="og:url" content={canonical} />
        </>
      )}
    </>
  );
}
