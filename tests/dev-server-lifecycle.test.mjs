import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createServer } from 'vite';
import { devServerLifecyclePlugin } from '../server/devServerLifecycle.js';

test(
  'a restart during slow startup leaves one healthy listener on the original port',
  { timeout: 120000 },
  async () => {
    const root = await mkdtemp(join(tmpdir(), 'lld-server-restart-'));
    await writeFile(join(root, 'index.html'), '<script type="module" src="/main.js"></script>');
    await writeFile(join(root, 'main.js'), 'document.body.dataset.ready = "yes";');
    const started = Promise.withResolvers();
    const release = Promise.withResolvers();
    let boots = 0;
    const server = await createServer({
      configFile: false,
      root,
      mode: 'test',
      logLevel: 'silent',
      server: { host: '127.0.0.1', port: 0, strictPort: true },
      optimizeDeps: { noDiscovery: true, include: [] },
      plugins: [
        devServerLifecyclePlugin(),
        {
          name: 'slow-startup-fixture',
          async buildStart() {
            if (++boots === 1) {
              started.resolve();
              await release.promise;
            }
          },
        },
      ],
    });
    const originalHttp = server.httpServer;
    try {
      const listening = server.listen();
      await started.promise;
      // Reproduce saving a config dependency while CMS preload is still running.
      const restarting = server.restart();
      release.resolve();
      await listening;
      const port = server.httpServer.address().port;
      await restarting;
      assert.equal(originalHttp.listening, false, 'the old listener must be closed');
      for (let cycle = 0; cycle < 4; cycle++) {
        assert.equal(server.httpServer.address().port, port, 'restart must retain its port');
        for (const path of ['/', '/@vite/client', '/main.js']) {
          const response = await fetch(`http://127.0.0.1:${port}${path}`, {
            signal: AbortSignal.timeout(10000),
          });
          await response.text();
          assert.equal(response.status, 200, `${path} after restart ${cycle}`);
        }
        if (cycle < 3) await server.restart();
      }
    } finally {
      release.resolve();
      await server.close();
      originalHttp.closeAllConnections();
      if (originalHttp.listening) originalHttp.close();
      await rm(root, { recursive: true, force: true });
    }
  },
);
