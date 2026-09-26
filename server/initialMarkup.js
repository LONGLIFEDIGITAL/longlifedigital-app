import { CONTENT_PAGES } from '../src/contentPages.js';
const escape = (value = '') =>
  String(value).replace(
    /[&<>"']/g,
    (character) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character],
  );
// Rendered WP titles can contain character entities. Keep markup out of initial HTML.
const plain = (value = '') =>
  String(value)
    .replace(/<[^>]*>/g, '')
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Math.min(Number(code), 0x10ffff)))
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&nbsp;/g, ' ');
const entry = (snapshot, key) => snapshot.entries[key]?.data;
function routeContent(snapshot, path) {
  const key = Object.keys(CONTENT_PAGES).find((key) => CONTENT_PAGES[key].path === path);
  return {
    key,
    content: key
      ? entry(snapshot, key === 'home' ? 'home' : `page:${key}`)
      : path.startsWith('/blog/')
        ? entry(snapshot, `post:${path.slice(6)}`)
        : null,
  };
}
export function metadataMarkup(snapshot, path) {
  const { key, content } = routeContent(snapshot, path);
  const settings = entry(snapshot, 'settings');
  const seo = content?.seo || {};
  const title =
    seo.title ||
    [
      key === 'home' ? '' : plain(content?.heading || content?.title || CONTENT_PAGES[key]?.title),
      settings?.brand.name,
    ]
      .filter(Boolean)
      .join(' | ') ||
    'Storefront';
  const description =
    seo.description || content?.hero?.intro || content?.intro || plain(content?.excerpt || '');
  const canonical = settings?.brand.website ? new URL(path, settings.brand.website).href : '';
  return `<!--metadata-start--><title data-initial-meta>${escape(title)}</title><meta data-initial-meta name="description" content="${escape(description)}"><meta data-initial-meta name="robots" content="${seo.noindex ? 'noindex,follow' : 'index,follow'}"><meta data-initial-meta property="og:title" content="${escape(title)}"><meta data-initial-meta property="og:description" content="${escape(description)}">${canonical ? `<link data-initial-meta rel="canonical" href="${escape(canonical)}"><meta data-initial-meta property="og:url" content="${escape(canonical)}">` : ''}${seo.image ? `<meta data-initial-meta property="og:image" content="${escape(seo.image)}">` : ''}<!--metadata-end-->`;
}
const css = `
:root{font-size:clamp(100%,calc(75% + 0.4vw),150%)}
#initial-content{font-family:Inter,Arial,sans-serif;color:#111827;line-height:1.55}#initial-content *{box-sizing:border-box}body{margin:0}
#initial-content a{color:inherit}#initial-content .initial-announcement{padding:0.5rem 1rem;background:#16062d;color:white;text-align:center;font-size:0.75rem}
#initial-content .initial-nav{display:flex;align-items:center;gap:0.625rem;background:#f3eeff;min-height:3.625rem;padding:0.625rem max(1rem,calc((100vw - 87rem)/2));border-bottom:2px solid #c9963f}#initial-content .initial-nav img{border-radius:0.625rem}#initial-content .initial-nav strong{font:700 1rem/1.25 'Plus Jakarta Sans',sans-serif}#initial-content .initial-nav small{display:block;color:#9333ea;letter-spacing:2px;text-transform:uppercase;font-size:0.625rem;font-weight:700;margin-top:0.25rem}
#initial-content .initial-hero{padding:clamp(2rem,4vw,6rem) clamp(1rem,4vw,6rem);background:radial-gradient(circle at 85% 5%,#9333ea44,transparent 45%),linear-gradient(135deg,#0a001e,#1a0533 35%,#2d0f6b 65%,#1a0533);color:#fff;display:flex;align-items:center}#initial-content .initial-inner{width:100%;max-width:120rem;margin:auto;display:grid;grid-template-columns:minmax(0,1.2fr) minmax(0,.9fr);gap:clamp(1.5rem,4vw,6rem);align-items:center}#initial-content .initial-copy{min-width:0}#initial-content .initial-badge{display:inline-block;color:#e8c97a;border:1px solid #c9963f55;background:#c9963f20;border-radius:1.875rem;font-size:clamp(0.625rem,.95vw,1.25rem);letter-spacing:.14em;text-transform:uppercase;padding:clamp(0.3125rem,.45vw,0.625rem) clamp(0.75rem,1.2vw,1.75rem);margin:0 0 clamp(1.5rem,2.5vw,3.75rem);max-width:100%}#initial-content h1{font:700 clamp(2rem,5vw,7rem)/1.1 'Playfair Display',Georgia,serif;margin:0 0 clamp(1.25rem,2vw,3rem);overflow-wrap:anywhere}#initial-content h1 span{display:block}#initial-content .initial-highlight{padding-bottom:.2em;margin-bottom:-.2em;background:linear-gradient(135deg,#c084fc,#e8c97a);background-clip:text;-webkit-background-clip:text;color:transparent}#initial-content .initial-intro{max-width:36em;margin:0 0 clamp(1.5rem,2.5vw,3.75rem);color:#ffffffb8;font-size:clamp(1rem,1.25vw,1.625rem);line-height:1.7;white-space:pre-line}#initial-content .initial-actions{display:flex;flex-wrap:wrap;gap:clamp(0.75rem,1.2vw,1.75rem)}#initial-content .initial-actions a{padding:clamp(0.625rem,.8vw,1.125rem) clamp(1.25rem,2vw,3rem);background:linear-gradient(135deg,#c9963f,#e8c97a);border-radius:0.5rem;color:#1a0533;text-decoration:none;font-size:clamp(0.9375rem,1.1vw,1.5rem);font-weight:600;min-height:3rem;line-height:1.4}#initial-content .initial-actions a+ a{background:#ffffff14;border:1px solid #ffffff33;color:white}#initial-content .initial-page{padding:3rem 1.5rem;max-width:75rem;margin:auto}#initial-content .initial-page h1{font-family:'Plus Jakarta Sans',sans-serif;font-size:clamp(1.75rem,5vw,3rem)}#initial-content .initial-page p{color:#6b7280}#initial-content .initial-blog{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:1.5rem}#initial-content article{padding:1.5rem;border:1px solid #eee;border-radius:1rem}#initial-content article h2{font:700 1.5rem 'Plus Jakarta Sans',sans-serif}
#initial-content .initial-count{margin-top:clamp(1.5rem,2.5vw,3.75rem);color:#ffffff73;font-size:clamp(0.6875rem,.85vw,1.125rem)}#initial-content .initial-count span{display:block;width:3rem;height:1.5625rem;background:#ffffff20;border-radius:0.5rem;margin:0 0 2px 0.75rem}#initial-content .initial-product{width:100%;aspect-ratio:1;min-height:17.5rem;border:1px solid #ffffff20;border-radius:1rem;background:#ffffff0f;padding:clamp(1rem,2vw,3rem);display:flex;flex-direction:column}#initial-content .initial-product div{flex:1;min-height:5rem;border-radius:0.5rem;background:#ffffff20}#initial-content .initial-product div+div{flex:none;min-height:0;height:clamp(1.125rem,1.4vw,2rem);margin-top:clamp(0.75rem,1.2vw,1.75rem)}#initial-content .initial-product div+div+div{width:65%}
@media(max-width:61.99em){#initial-content .initial-inner{grid-template-columns:1fr}#initial-content .initial-product{max-width:40rem;margin-inline:auto}}
@media(min-width:36em) and (max-width:61.99em){#initial-content .initial-hero h1{font-size:clamp(2rem,6.5vw,4rem)}}@media(max-width:48em){#initial-content .initial-nav strong{font-size:0.875rem}#initial-content .initial-blog{grid-template-columns:1fr}#initial-content .initial-nav small{display:none}}@media(max-width:36em){#initial-content .initial-actions{flex-direction:column}#initial-content .initial-actions a{text-align:center}}
`;
export function initialMarkup(snapshot, path) {
  const { key, content } = routeContent(snapshot, path);
  const settings = entry(snapshot, 'settings');
  const brand = settings?.brand;
  const announcement = settings?.announcement;
  const home = key === 'home';
  let body;
  if (home && content?.hero) {
    const hero = content.hero;
    const segments = [hero.prefix, hero.highlight, hero.suffix];
    const heading = segments.some(Boolean)
      ? segments
          .map((segment, index) =>
            segment
              ? `<span${index === 1 ? ' class="initial-highlight"' : ''}>${escape(segment)}</span>`
              : '',
          )
          .join('')
      : escape(hero.heading);
    const buttons = [hero.primaryCta, hero.secondaryCta].filter(
      (button) => button?.label && button.destination,
    );
    body = `<section class="initial-hero"><div class="initial-inner"><div class="initial-copy">${hero.eyebrow ? `<p class="initial-badge">✦ ${escape(hero.eyebrow)}</p>` : ''}<h1>${heading}</h1><p class="initial-intro">${escape(hero.intro)}</p><div class="initial-actions">${buttons.map((button) => `<a href="${escape(button.destination)}">${escape(button.label)}</a>`).join('')}</div><div class="initial-count"><span></span>Digital Products</div></div><div class="initial-product" aria-label="Loading featured product" role="status"><div></div><div></div><div></div></div></div></section>`;
    const posts =
      entry(snapshot, `posts:1:3:${(content.blog?.postIds || []).join(',')}`)?.posts || [];
    if (posts.length)
      body += `<section class="initial-page"><h2>${escape(content.blog?.heading || 'Blog')}</h2><div class="initial-blog">${posts.map((post) => `<article><h2>${escape(plain(post.title))}</h2><p>${escape(plain(post.excerpt))}</p><a href="/blog/${encodeURIComponent(post.slug)}">Read More →</a></article>`).join('')}</div></section>`;
  } else {
    body = `<main class="initial-page"><h1>${escape(plain(content?.heading || content?.title || CONTENT_PAGES[key]?.title || 'Storefront'))}</h1><p>${escape(content?.intro || (content ? plain(content.excerpt || '') : 'This content is being prepared. Please check back soon.'))}</p></main>`;
  }
  const banner =
    announcement?.enabled && announcement.message
      ? `<div class="initial-announcement">${escape(announcement.message)}${announcement.couponCode ? ` — Code: <strong>${escape(announcement.couponCode)}</strong>` : ''}</div>`
      : '';
  const header = `<header>${banner}<div class="initial-nav">${brand?.logo.src ? `<img src="${escape(brand.logo.src)}" alt="${escape(brand.logo.alt)}" width="36" height="36">` : ''}<div><strong>${escape(brand?.name || '')}</strong>${brand?.tagline ? `<small>${escape(brand.tagline)}</small>` : ''}</div></div></header>`;
  const routeJson = JSON.stringify(path).replace(/</g, '\\u003c');
  return `<!--initial-start--><style>${css}</style><div id="initial-content">${header}${body}</div><script>if(location.pathname.replace(/\\/$/,'')!==${routeJson}.replace(/\\/$/,'')){document.getElementById('initial-content')?.remove();document.querySelectorAll('[data-initial-meta]').forEach(n=>n.remove())}</script><!--initial-end-->`;
}
