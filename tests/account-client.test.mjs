import { test } from 'node:test';
import assert from 'node:assert/strict';

test('server and connection failures reject immediately and leave the queue usable', async (t) => {
  const { accountRequest } = await import('../src/services/account.js?error-regression');
  const responses = [
    () => Response.json({ error: 'This reset link is invalid or expired.' }, { status: 400 }),
    () => new Response('Bad gateway', { status: 502 }),
    () => Response.json(null, { status: 503 }),
    () => {
      throw new TypeError('Failed to fetch');
    },
    () => Response.json({ ok: true }),
  ];
  t.mock.method(globalThis, 'fetch', async () => responses.shift()());
  await assert.rejects(accountRequest('reset', {}), /invalid or expired/);
  await assert.rejects(accountRequest('reset', {}), /temporarily unavailable/);
  await assert.rejects(accountRequest('reset', {}), /temporarily unavailable/);
  await assert.rejects(accountRequest('reset', {}), {
    name: 'NetworkError',
    message: 'We couldn’t reach the account server. Check your connection and try again.',
  });
  assert.deepEqual(await accountRequest('reset', {}), { ok: true });
});

test('the whole-request deadline clears a stuck request and prevents queued password writes', async (t) => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const { accountRequest } = await import('../src/services/account.js?queue-regression');
  const calls = [];
  let activeSignal;
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    const action = new URL(url, 'https://store.example.test').searchParams.get('action');
    calls.push(action);
    if (action === 'session') return Response.json({ user: null });
    activeSignal = options.signal;
    return new Promise(() => {});
  });
  const first = assert.rejects(accountRequest('login', {}), { name: 'TimeoutError' });
  const queued = assert.rejects(accountRequest('reset', {}), { name: 'TimeoutError' });
  await Promise.resolve();
  assert.deepEqual(calls, ['login']);
  t.mock.timers.tick(25000);
  await Promise.all([first, queued]);
  assert.equal(activeSignal.aborted, true);
  assert.deepEqual(await accountRequest('session'), { user: null });
  assert.deepEqual(calls, ['login', 'session'], 'the expired password write must never execute');
});

test('a response whose body never finishes also releases the pending submission', async (t) => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const { accountRequest } = await import('../src/services/account.js?body-regression');
  let reading;
  const bodyStarted = new Promise((resolve) => {
    reading = resolve;
  });
  t.mock.method(globalThis, 'fetch', async () => ({
    ok: true,
    json() {
      reading();
      return new Promise(() => {});
    },
  }));
  const request = assert.rejects(accountRequest('reset', {}), { name: 'TimeoutError' });
  await bodyStarted;
  t.mock.timers.tick(25000);
  await request;
});
