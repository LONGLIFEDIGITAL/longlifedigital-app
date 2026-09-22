import { mkdir, readFile, writeFile, rename } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { join } from 'node:path';
import { CONTENT_PAGES } from '../src/contentPages.js';
import { initialMarkup, metadataMarkup } from './initialMarkup.js';

export function bootstrapTag(snapshot) {
  return {
    tag: 'script',
    attrs: { type: 'application/json', id: 'lld-content' },
    children: JSON.stringify(snapshot).replace(/</g, '\\u003c'),
    injectTo: 'head',
  };
}

// Materialize real published CMS content before serving/building the app. A
// visitor's initial render then has no dependency on the CMS or its rate limits.
export async function createBootstrap({ handler, cmsUrl, previous, now = Date.now }) {
  const entries =
    previous?.cmsUrl === cmsUrl && previous.version === 1 ? { ...previous.entries } : {};
  const read = async (key, query) => {
    let status;
    let body;
    await handler(
      { method: 'GET', url: `/api/content?${query}` },
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
    if (status === 200 || status === 404)
      entries[key] = { data: status === 404 ? null : body, updatedAt: now() };
    else if (!entries[key]) throw new Error(`Published content is unavailable (${key}).`);
    return entries[key].data;
  };
  const home = await read('home', 'resource=home');
  const latest = await read('posts:1:9:', 'resource=posts&page=1&limit=9');
  const selected = home?.blog?.postIds || [];
  if (selected.length) {
    await read(
      `posts:1:3:${selected.join(',')}`,
      `resource=posts&limit=3&include=${selected.join(',')}`,
    );
  } else if (latest) {
    entries['posts:1:3:'] = {
      ...entries['posts:1:9:'],
      data: { ...latest, posts: latest.posts.slice(0, 3), totalPages: undefined },
    };
  }
  // Seed full articles for the cards visible on Home as well as the blog index.
  // A newly published article not in this snapshot is still fetched normally.
  const preview = entries[`posts:1:3:${selected.join(',')}`]?.data?.posts || [];
  for (const post of preview) {
    try {
      await read(`post:${post.slug}`, `resource=post&slug=${encodeURIComponent(post.slug)}`);
    } catch {
      /* Optional article preloading must not prevent the homepage build. */
    }
  }
  const extraKeys = ['settings', 'navigation', 'services', 'assets', 'asset-categories', 'faqs'];
  // Build-time work does not delay visitors. Limit upstream concurrency to avoid
  // overwhelming WordPress on staging, and retain last-good optional content.
  const tasks = [
    ...extraKeys.map((key) => [key, `resource=${key}`]),
    ...Object.keys(CONTENT_PAGES)
      .filter((key) => key !== 'home')
      .map((key) => [`page:${key}`, `resource=page&key=${key}`]),
  ];
  for (let i = 0; i < tasks.length; i += 2) {
    await Promise.all(
      tasks.slice(i, i + 2).map(async ([key, query]) => {
        try {
          await read(key, query);
        } catch {
          /* Runtime retry remains available. */
        }
      }),
    );
  }
  // Do not carry deleted/old article records into subsequent deployments.
  const retained = new Set([
    'home',
    'posts:1:9:',
    `posts:1:3:${selected.join(',')}`,
    ...preview.map((post) => `post:${post.slug}`),
    ...tasks.map(([key]) => key),
  ]);
  return {
    version: 1,
    cmsUrl,
    entries: Object.fromEntries(Object.entries(entries).filter(([key]) => retained.has(key))),
  };
}

export function contentBootstrapPlugin({ handler, cmsUrl, mode, root }) {
  let snapshot;
  const enabled = Boolean(cmsUrl) && mode !== 'test';
  return {
    name: 'published-content-bootstrap',
    async buildStart() {
      if (!enabled) return;
      const directory = join(root, '.cache');
      const filename = join(
        directory,
        `content-${createHash('sha256').update(cmsUrl).digest('hex').slice(0, 12)}.json`,
      );
      let previous;
      try {
        previous = JSON.parse(await readFile(filename, 'utf8'));
      } catch {
        /* First run. */
      }
      try {
        snapshot = await createBootstrap({ handler, cmsUrl, previous });
        await mkdir(directory, { recursive: true });
        await writeFile(`${filename}.tmp`, JSON.stringify(snapshot));
        await rename(`${filename}.tmp`, filename);
      } catch (error) {
        this.error(
          `Cannot prepare published homepage content: ${error.message} Check VITE_WORDPRESS_API_URL and CMS availability.`,
        );
      }
    },
    transformIndexHtml: {
      order: 'post',
      handler(html, context) {
        if (!snapshot) return html;
        const path = (context.originalUrl || context.path || '/').split('?')[0];
        const route = path === '/index.html' ? '/' : path;
        // Critical copy is real HTML. Non-critical app CSS/fonts no longer block it.
        const rendered = html
          .replace('<!--initial-content-->', initialMarkup(snapshot, route))
          .replace('<!--page-metadata-->', metadataMarkup(snapshot, route))
          .replace(
            /<link([^>]*rel="stylesheet"[^>]*)>/g,
            (_match, attributes) =>
              `<link${attributes}${/href="\/assets\//.test(attributes) ? ' data-app-css' : ''} media="print" onload="this.media='all'">`,
          );
        return { html: rendered, tags: [bootstrapTag(snapshot)] };
      },
    },
    generateBundle: {
      order: 'post',
      handler(_options, bundle) {
        if (!snapshot || !bundle['index.html']) return;
        const source = String(bundle['index.html'].source);
        const paths = [
          ...Object.values(CONTENT_PAGES)
            .map((page) => page.path)
            .filter((path) => path !== '/'),
          ...Object.keys(snapshot.entries)
            .filter((key) => key.startsWith('post:') && snapshot.entries[key]?.data)
            .map((key) => `/blog/${key.slice(5)}`),
        ];
        for (const path of paths) {
          const html = source
            .replace(
              /<!--initial-start-->[\s\S]*?<!--initial-end-->/,
              initialMarkup(snapshot, path),
            )
            .replace(
              /<!--metadata-start-->[\s\S]*?<!--metadata-end-->/,
              metadataMarkup(snapshot, path),
            );
          this.emitFile({ type: 'asset', fileName: `${path.slice(1)}/index.html`, source: html });
        }
      },
    },
  };
}
