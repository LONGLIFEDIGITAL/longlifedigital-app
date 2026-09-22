// Build with the configured CMS first: npm run build -- --mode development
// Measures local cold-profile paint, not public-network or deployed Vercel latency.
import { createServer } from 'node:http';
import { readFile, stat, writeFile, mkdir } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { gzipSync } from 'node:zlib';
import { chromium } from '@playwright/test';

const root = resolve('dist');
const types = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
};
const server = createServer(async (req, res) => {
  try {
    const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    let path = resolve(root, `.${pathname}`);
    if (path !== root && !path.startsWith(root + sep)) {
      res.writeHead(404);
      return res.end();
    }
    try {
      if ((await stat(path)).isDirectory()) path = resolve(path, 'index.html');
    } catch {
      path = resolve(root, 'index.html');
    }
    const content = await readFile(path);
    res.writeHead(200, {
      'Content-Type': types[extname(path)] || 'application/octet-stream',
      'Content-Encoding': 'gzip',
      'Cache-Control': 'no-store',
    });
    res.end(gzipSync(content));
  } catch {
    res.writeHead(500);
    res.end();
  }
});
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const origin = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const results = [];
try {
  await mkdir('test-results', { recursive: true });
  for (const width of [393, 1440]) {
    for (let run = 1; run <= 3; run++) {
      const context = await browser.newContext({ viewport: { width, height: 900 } });
      const page = await context.newPage();
      const errors = [];
      page.on('pageerror', (error) => errors.push(error.message));
      // The initial screen must not depend on the CMS responding.
      await page.route('**/api/**', (route) =>
        route.fulfill({ status: 503, json: { error: 'CMS unavailable during measurement' } }),
      );
      await page.addInitScript(() => {
        new MutationObserver(() => {
          if (!window.initialHeroAt && document.querySelector('#initial-content h1'))
            window.initialHeroAt = performance.now();
          if (!window.reactHeroAt && document.querySelector('#root main h1'))
            window.reactHeroAt = performance.now();
        }).observe(document, { childList: true, subtree: true });
      });
      await page.goto(origin, { waitUntil: 'domcontentloaded' });
      await page.locator('#root main h1').waitFor();
      await page.evaluate(
        () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))),
      );
      const timings = await page.evaluate(() => ({
        initialHero: window.initialHeroAt,
        interactiveHero: window.reactHeroAt,
        firstContentfulPaint: performance.getEntriesByName('first-contentful-paint')[0]?.startTime,
        overflow: document.documentElement.scrollWidth - innerWidth,
        initialRemains: Boolean(document.getElementById('initial-content')),
      }));
      results.push({ width, run, ...timings, errors });
      if (errors.length || timings.overflow > 1 || timings.initialRemains || !timings.initialHero)
        throw new Error(JSON.stringify(results.at(-1)));
      if (run === 1) await page.screenshot({ path: `test-results/production-home-${width}.png` });
      await context.close();
    }
  }
  const blocked = await browser.newContext({ viewport: { width: 393, height: 852 } });
  const page = await blocked.newPage();
  await page.route('**/*.js', (route) => route.abort());
  await page.goto(origin);
  await page.locator('#initial-content h1').waitFor();
  await page.screenshot({ path: 'test-results/hero-without-javascript.png' });
  await blocked.close();
  console.log(JSON.stringify(results, null, 2));
  await writeFile('test-results/content-performance.json', JSON.stringify(results, null, 2));
} finally {
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
}
