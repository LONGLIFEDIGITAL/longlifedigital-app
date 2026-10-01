import { test } from 'node:test';
import assert from 'node:assert/strict';
import { setTimeout as delay } from 'node:timers/promises';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createContentHandler } from '../api/content.js';
import { createBootstrap, contentBootstrapPlugin } from '../server/contentBootstrap.js';
import { homeRecord } from './fixtures/home.js';

const cmsUrl = 'https://cms.example.test/wp-json/wp/v2';
function cms(homeResponse, options = {}) {
  let homeCalls = 0;
  return {
    handler: createContentHandler({
      baseUrl: cmsUrl,
      buildDiagnostics: true,
      ...options,
      fetcher: async (input, request) => {
        const url = new URL(input);
        if (url.searchParams.get('slug') === 'home') return homeResponse(++homeCalls, request);
        return Response.json([]);
      },
    }),
    calls: () => homeCalls,
  };
}
const snapshot = (handler, extra = {}) =>
  createBootstrap({ handler, cmsUrl, retryDelayMs: 0, ...extra });

test('a cold build retries a temporary homepage failure and embeds real published content', async () => {
  const source = cms((count) =>
    count === 1 ? new Response('', { status: 503 }) : Response.json([homeRecord]),
  );
  const result = await snapshot(source.handler);
  assert.equal(source.calls(), 2);
  assert.equal(result.entries.home.data.hero.prefix, 'Created in WordPress');
});

test('a persistent upstream failure stops after one retry with the upstream status', async () => {
  const source = cms(() => new Response('Private upstream body', { status: 503 }));
  await assert.rejects(snapshot(source.handler), /home; HTTP 502.*CMS returned HTTP 503 for pages/);
  assert.equal(source.calls(), 2);
});

test('access denial and invalid content fail without retrying or leaking response bodies', async () => {
  for (const response of [
    () => new Response('Private upstream body', { status: 403 }),
    () => new Response('<html>Private upstream body</html>'),
  ]) {
    const source = cms(response);
    await assert.rejects(snapshot(source.handler), (error) => {
      assert.match(error.message, /CMS returned HTTP 403|CMS returned unexpected content/);
      assert.doesNotMatch(error.message, /Private upstream body/);
      return true;
    });
    assert.equal(source.calls(), 1);
  }
});

test('the build request timeout is bounded and reported clearly', async () => {
  const source = cms(
    async (_count, { signal }) => {
      await delay(100, undefined, { signal });
      return Response.json([homeRecord]);
    },
    { requestTimeoutMs: 10 },
  );
  await assert.rejects(snapshot(source.handler), /CMS request timed out after 0.01s/);
  // The second attempt can expire in the shared queue before reaching WordPress.
  assert.ok(source.calls() >= 1 && source.calls() <= 2);
});

test('public API errors remain generic when build diagnostics are disabled', async () => {
  const source = cms(() => new Response('Private upstream body', { status: 403 }), {
    buildDiagnostics: false,
  });
  let result;
  await source.handler(
    { method: 'GET', url: '/api/content?resource=home' },
    {
      setHeader() {},
      end(value) {
        result = JSON.parse(value);
      },
    },
  );
  assert.deepEqual(result, { error: 'Homepage content is temporarily unavailable.' });
});

test('a timeout while reading the response body is also retryable', async () => {
  const source = cms(
    async (_count, { signal }) => {
      const response = Response.json([homeRecord]);
      response.json = async () => {
        await delay(100, undefined, { signal });
        return [homeRecord];
      };
      return response;
    },
    { requestTimeoutMs: 10 },
  );
  await assert.rejects(snapshot(source.handler), /CMS request timed out after 0.01s/);
  assert.ok(source.calls() >= 1 && source.calls() <= 2);
});

test('same-CMS last-good content is retained, but another CMS snapshot is never reused', async () => {
  const good = await snapshot(cms(() => Response.json([homeRecord])).handler);
  const failed = cms(() => new Response('', { status: 503 }));
  const retained = await snapshot(failed.handler, { previous: good });
  assert.deepEqual(retained.entries.home, good.entries.home);
  assert.equal(failed.calls(), 1);
  await assert.rejects(
    snapshot(failed.handler, { previous: { ...good, cmsUrl: 'https://another.example.test' } }),
    /CMS returned HTTP 503/,
  );
});

test('the production plugin recovers from a cold-start failure and renders initial HTML', async () => {
  const root = await mkdtemp(join(tmpdir(), 'lld-bootstrap-test-'));
  try {
    const source = cms((count) =>
      count === 1 ? new Response('', { status: 502 }) : Response.json([homeRecord]),
    );
    const plugin = contentBootstrapPlugin({
      handler: source.handler,
      cmsUrl,
      root,
      mode: 'production',
    });
    await plugin.buildStart.call({
      error(message) {
        throw new Error(message);
      },
    });
    const output = plugin.transformIndexHtml.handler(
      '<html><head><!--page-metadata--></head><body><!--initial-content--></body></html>',
      { path: '/' },
    );
    assert.match(output.html, /Created in WordPress/);
    assert.equal(output.tags[0].attrs.id, 'lld-content');
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('local restarts reuse the saved snapshot, while production builds refresh it', async () => {
  const root = await mkdtemp(join(tmpdir(), 'lld-bootstrap-restart-'));
  const context = { error(message) { throw new Error(message); } };
  try {
    const initial = cms(() => Response.json([homeRecord]));
    const build = contentBootstrapPlugin({ handler: initial.handler, cmsUrl, root, mode: 'production' });
    await build.buildStart.call(context);

    let reads = 0;
    const dev = contentBootstrapPlugin({ handler: () => { reads++; throw new Error('CMS offline'); }, cmsUrl, root, mode: 'development' });
    dev.configResolved({ command: 'serve' });
    await dev.buildStart.call(context);
    assert.equal(reads, 0, 'a warm local restart must not wait for CMS requests');
    const output = dev.transformIndexHtml.handler('<html><!--initial-content--></html>', { path: '/' });
    assert.match(output.html, /Created in WordPress/);

    const latest = cms(() => Response.json([homeRecord]));
    const prod = contentBootstrapPlugin({ handler: latest.handler, cmsUrl, root, mode: 'production' });
    prod.configResolved({ command: 'build' });
    await prod.buildStart.call(context);
    assert.equal(latest.calls(), 1, 'production builds still fetch current CMS content');
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
