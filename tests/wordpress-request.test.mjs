import { test } from 'node:test';
import assert from 'node:assert/strict';
import { setTimeout as delay } from 'node:timers/promises';
import { createWordPressRequester } from '../server/wordpressRequest.js';
import { createCatalogHandler } from '../api/catalog.js';
import { createContentHandler } from '../api/content.js';
import { homeRecord } from './fixtures/home.js';

const baseUrl = 'https://cms.example.test/wp-json/wp/v2';
test('public reads share a bounded queue instead of bursting at WordPress', async () => {
  const request = createWordPressRequester({ minIntervalMs: 0 });
  let active = 0;
  let peak = 0;
  const fetcher = async () => {
    peak = Math.max(peak, ++active);
    await delay(10);
    active--;
    return Response.json([]);
  };
  const results = await Promise.all(
    Array.from({ length: 8 }, (_, i) => request(`${baseUrl}/pages?page=${i}`, { fetcher })),
  );
  assert.equal(peak, 2);
  assert.ok(results.every((response) => response.status === 200));
});

test('429 pauses other reads on the same origin and retries only once', async () => {
  const request = createWordPressRequester({
    maxConcurrent: 1,
    minIntervalMs: 0,
    rateLimitDelayMs: 40,
  });
  const starts = [];
  const fetcher = async () => {
    starts.push(Date.now());
    return starts.length === 1
      ? new Response('', { status: 429, headers: { 'Retry-After': '0' } })
      : Response.json([]);
  };
  const results = await Promise.all([
    request(`${baseUrl}/pages`, { fetcher }),
    request(`${baseUrl}/posts`, { fetcher }),
  ]);
  assert.equal(starts.length, 3);
  assert.ok(starts[1] - starts[0] >= 35, 'a different resource must also respect cooldown');
  assert.ok(results.every((response) => response.status === 200));
  let failures = 0;
  const response = await request(`${baseUrl}/pages`, {
    fetcher: async () => {
      failures++;
      return new Response('', { status: 429 });
    },
  });
  assert.equal(response.status, 429);
  assert.equal(failures, 2);
});

test('a long Retry-After obeys the original deadline without a delayed extra fetch', async () => {
  const request = createWordPressRequester({ minIntervalMs: 0 });
  let calls = 0;
  const fetcher = async () => {
    calls++;
    return new Response('', { status: 429, headers: { 'Retry-After': '3600' } });
  };
  const keepingEventLoopAlive = delay(80);
  await assert.rejects(request(`${baseUrl}/pages`, { fetcher, signal: AbortSignal.timeout(25) }), {
    name: 'TimeoutError',
  });
  await keepingEventLoopAlive;
  assert.equal(calls, 1);
});

test('aborted queued reads are removed, and a failed fetch releases its slot', async () => {
  const request = createWordPressRequester({ maxConcurrent: 1, minIntervalMs: 0 });
  let calls = 0;
  const fetcher = async () => {
    if (++calls === 1) {
      await delay(30);
      throw new Error('Network offline');
    }
    return Response.json([]);
  };
  const first = assert.rejects(request(`${baseUrl}/pages`, { fetcher }), /Network offline/);
  const abort = new AbortController();
  const second = assert.rejects(request(`${baseUrl}/posts`, { fetcher, signal: abort.signal }), {
    name: 'AbortError',
  });
  abort.abort();
  await Promise.all([first, second]);
  assert.equal(calls, 1);
  assert.equal((await request(`${baseUrl}/pages`, { fetcher })).status, 200);
});

async function invoke(handler, url) {
  const result = { headers: {} };
  await handler(
    { method: 'GET', url },
    {
      set statusCode(value) {
        result.status = value;
      },
      setHeader(key, value) {
        result.headers[key] = value;
      },
      end(body) {
        result.body = JSON.parse(body);
      },
    },
  );
  return result;
}

test('preview content shares recent reads, refreshes after expiry and never caches errors', async () => {
  let calls = 0;
  let now = 1000;
  const handler = createContentHandler({
    baseUrl,
    now: () => now,
    fetcher: async () => {
      calls++;
      return calls === 2 ? new Response('', { status: 503 }) : Response.json([homeRecord]);
    },
  });
  const read = () => invoke(handler, '/api/content?resource=home');
  const [first, second] = await Promise.all([read(), read()]);
  assert.equal(first.status, 200);
  assert.equal(second.status, 200);
  assert.equal(calls, 1);
  assert.equal(first.headers['Cache-Control'], 'no-store');
  now += 5001;
  assert.equal((await read()).status, 502);
  assert.equal((await read()).status, 200);
  assert.equal(calls, 3);
});

test('local and deployed catalogs share the same bounded rate-limit recovery and read cache', async () => {
  let calls = 0;
  const handler = createCatalogHandler({
    baseUrl: 'https://store.example.test/wp-json/wc/store/v1',
    fetcher: async () => {
      calls++;
      return calls === 1
        ? new Response('', { status: 429, headers: { 'Retry-After': '0' } })
        : Response.json([{ id: 42 }], { headers: { 'X-WP-TotalPages': '1' } });
    },
  });
  const results = await Promise.all(
    Array.from({ length: 5 }, () => invoke(handler, '/api/catalog?page=1')),
  );
  assert.ok(results.every((result) => result.status === 200));
  assert.equal(results[0].headers['X-WP-TotalPages'], '1');
  assert.equal(results[0].headers['Cache-Control'], 'no-store');
  assert.equal(calls, 2);
});
