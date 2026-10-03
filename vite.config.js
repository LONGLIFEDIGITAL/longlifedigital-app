import { defineConfig, loadEnv } from 'vite';
import { createHash } from 'node:crypto';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import react from '@vitejs/plugin-react';
import { createContentHandler } from './api/content.js';
import { contentBootstrapPlugin } from './server/contentBootstrap.js';
import { createCatalogHandler } from './api/catalog.js';
import { CONTENT_SYNC } from './shared/contentSync.js';
import { devServerLifecyclePlugin } from './server/devServerLifecycle.js';
import { createAccountHandler } from './api/account.js';
import { createInquiryHandler } from './api/inquiry.js';
import { createFormsHandler } from './api/forms.js';
import { createCommerceHandler } from './api/commerce.js';
import retiredPaymentHandler from './api/create-payment-intent.js';

// https://vite.dev/config/
export default defineConfig(({ mode, command }) => {
  const cloudWorkspace =
    process.platform === 'darwin' && process.cwd().includes('/Library/Mobile Documents/');
  // Server handlers need private settings too; Vite still exposes only VITE_ values to React.
  const env = { ...process.env, ...loadEnv(mode, process.cwd(), '') };
  const catalogHandler = createCatalogHandler({ baseUrl: env.VITE_WOOCOMMERCE_STORE_API_URL });
  const commerceHandler = createCommerceHandler({ env });
  const contentListeners = new Set();
  const contentHandler = createContentHandler({
    baseUrl: env.VITE_WORDPRESS_API_URL,
    // Pre-rendering can wait longer than a visitor-facing API request.
    requestTimeoutMs: command === 'build' ? 15000 : CONTENT_SYNC.upstreamTimeoutMs,
    // All page projections in one build share the same published page listing.
    pagesCacheTtl: command === 'build' ? Infinity : CONTENT_SYNC.serverCacheMs,
    buildDiagnostics: command === 'build',
    onRead: (entry) => contentListeners.forEach((listener) => listener(entry)),
  });
  return {
    // iCloud can offload generated dependencies and emit hydration events as
    // file changes. Keep this disposable cache on local disk during development.
    cacheDir:
      cloudWorkspace && command === 'serve'
        ? join(
            tmpdir(),
            'longlife-vite',
            createHash('sha256').update(process.cwd()).digest('hex').slice(0, 12),
          )
        : undefined,
    plugins: [
      devServerLifecyclePlugin(),
      react(),
      contentBootstrapPlugin({
        handler: contentHandler,
        cmsUrl: env.VITE_WORDPRESS_API_URL?.trim(),
        mode,
        root: process.cwd(),
        subscribe: (listener) => {
          contentListeners.add(listener);
          return () => contentListeners.delete(listener);
        },
      }),
      {
        name: 'wordpress-content',
        configureServer(server) {
          server.middlewares.use('/api/content', (req, res) => contentHandler(req, res));
          server.middlewares.use('/api/catalog', catalogHandler);
          // Give local Vite responses the same small interface as Vercel Functions.
          const adapt = (handler) => (req, res) => {
            res.status = (code) => {
              res.statusCode = code;
              return res;
            };
            res.json = (body) => {
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify(body));
            };
            return handler(req, res);
          };
          server.middlewares.use('/api/commerce', commerceHandler);
          server.middlewares.use('/api/account', createAccountHandler({ env }));
          server.middlewares.use('/api/inquiry', createInquiryHandler({ env }));
          server.middlewares.use('/api/forms', createFormsHandler({ env }));
          server.middlewares.use('/api/create-payment-intent', adapt(retiredPaymentHandler));
          server.middlewares.use('/api/stripe-webhook', adapt(retiredPaymentHandler));
        },
      },
    ],
    optimizeDeps: {
      entries: ['index.html'],
    },
    server: {
      // Never leave a browser or checkout origin pointing at an abandoned port.
      port: 5173,
      strictPort: true,
      watch: {
        // Poll file timestamps in cloud workspaces instead of reacting to
        // metadata-only filesystem events that repeatedly restart the server.
        ...(cloudWorkspace ? { usePolling: true, interval: 750, binaryInterval: 1500 } : {}),
        // Exported HTML and plugin ZIPs are not storefront entry points.
        ignored: ['**/.cache/**', '**/docs/**', '**/wordpress/**', '**/playwright-report/**'],
      },
    },
    build: {
      cssCodeSplit: false,
    },
  };
});
