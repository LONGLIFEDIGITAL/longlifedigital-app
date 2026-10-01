import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { createContentHandler } from './api/content.js';
import { contentBootstrapPlugin } from './server/contentBootstrap.js';
import { createCatalogHandler } from './api/catalog.js';
import { CONTENT_SYNC } from './shared/contentSync.js';
import { devServerLifecyclePlugin } from './server/devServerLifecycle.js';
import { createAccountHandler } from './api/account.js';
import { createInquiryHandler } from './api/inquiry.js';
import { createCommerceHandler } from './api/commerce.js';
import retiredPaymentHandler from './api/create-payment-intent.js';

// https://vite.dev/config/
export default defineConfig(({ mode, command }) => {
  // Server handlers need private settings too; Vite still exposes only VITE_ values to React.
  const env = { ...process.env, ...loadEnv(mode, process.cwd(), '') };
  const catalogHandler = createCatalogHandler({ baseUrl: env.VITE_WOOCOMMERCE_STORE_API_URL });
  const commerceHandler = createCommerceHandler({ env });
  const contentListeners = new Set();
  const contentHandler = createContentHandler({
    baseUrl: env.VITE_WORDPRESS_API_URL,
    // Pre-rendering can wait longer than a visitor-facing API request.
    requestTimeoutMs: command === 'build' ? 15000 : CONTENT_SYNC.upstreamTimeoutMs,
    buildDiagnostics: command === 'build',
    onRead: (entry) => contentListeners.forEach((listener) => listener(entry)),
  });
  return {
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
      watch: { ignored: ['**/.cache/**'] },
    },
    build: {
      cssCodeSplit: false,
    },
  };
});
