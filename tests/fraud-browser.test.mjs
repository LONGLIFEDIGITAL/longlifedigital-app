import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

// Isolate the browser adapter without network access or a local web server.
const source = readFileSync(new URL('../src/services/fraudProtection.js', import.meta.url), 'utf8');
async function browser({
  disabled = false,
  failedLoad = false,
  stalled = false,
  repeated = false,
  failConfigOnce = false,
} = {}) {
  const calls = { scripts: [], acquired: 0, resets: 0, config: 0 };
  const context = vm.createContext({
    window: {},
    setTimeout: (callback, ms) => setTimeout(callback, Math.min(ms, 30)),
    clearTimeout,
    document: {
      createElement: () => ({ remove() {} }),
      head: {
        append(script) {
          calls.scripts.push(script.src);
          queueMicrotask(() => {
            if (failedLoad) return script.onerror();
            if (script.src === 'initializer') {
              assert.equal(calls.scripts[0], 'sdk');
              context.window.wcFraudProtection.acquireSessionId = async () => {
                calls.acquired++;
                if (stalled) return new Promise(() => {});
                return repeated ? 'same-session' : `session-${calls.acquired}`;
              };
              context.window.wcFraudProtection.reset = () => calls.resets++;
            }
            script.onload();
          });
        },
      },
    },
  });
  const dependency = new vm.SyntheticModule(
    ['commerce'],
    function () {
      this.setExport('commerce', async (action) => {
        assert.equal(action, 'fraud-config');
        calls.config++;
        if (failConfigOnce && calls.config === 1) throw new Error('Temporary outage');
        return disabled
          ? { enabled: false }
          : { enabled: true, scripts: ['sdk', 'initializer'], config: { apiKey: 'woo:123' } };
      });
    },
    { context },
  );
  const module = new vm.SourceTextModule(source, { context });
  await module.link(() => dependency);
  await module.evaluate();
  return { api: module.namespace, calls };
}

test('SDK prepares once in dependency order; collection happens only at submission', async () => {
  const { api, calls } = await browser();
  await Promise.all([api.prepareCheckoutFraud(), api.prepareCheckoutFraud()]);
  assert.equal(calls.config, 1);
  assert.deepEqual(calls.scripts, ['sdk', 'initializer']);
  assert.equal(calls.acquired, 0);
  assert.equal((await api.acquireCheckoutFraud()).sessionId, 'session-1');
  api.resetCheckoutFraud();
  assert.equal(calls.resets, 1);
  assert.equal((await api.acquireCheckoutFraud()).sessionId, 'session-2');
});
test('a consumed session cannot be reused if the native reset fails', async () => {
  const { api } = await browser({ repeated: true });
  assert.equal((await api.acquireCheckoutFraud()).sessionId, 'same-session');
  api.resetCheckoutFraud();
  const result = await api.acquireCheckoutFraud();
  assert.equal(result.sessionId, '');
  assert.equal(result.error, 'sdk_error');
});
test('absent protection is distinct from a failed SDK; neither invents a fraud verdict', async () => {
  const absent = await browser({ disabled: true });
  assert.equal(await absent.api.acquireCheckoutFraud(), undefined);
  assert.equal(absent.calls.scripts.length, 0);
  const failed = await browser({ failedLoad: true });
  const result = await failed.api.acquireCheckoutFraud();
  assert.equal(result.sessionId, '');
  assert.equal(result.error, 'sdk_unavailable');
  assert.equal(result.decision, undefined);
});
test('a stalled SDK has a bounded wait and reports a missing session', async () => {
  const { api } = await browser({ stalled: true });
  await api.prepareCheckoutFraud();
  const result = await api.acquireCheckoutFraud();
  assert.equal(result.sessionId, '');
  assert.equal(result.error, 'timeout');
});
test('transient configuration failures recover on a later attempt without manual email approval', async () => {
  const { api, calls } = await browser({ failConfigOnce: true });
  await api.prepareCheckoutFraud();
  assert.equal((await api.acquireCheckoutFraud()).sessionId, 'session-1');
  assert.equal(calls.config, 2);
});
