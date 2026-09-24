import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { createContentHandler } from './api/content.js';
import { contentBootstrapPlugin } from './server/contentBootstrap.js';
import { freshWordPressUrl } from './server/wordpressRequest.js';
import { createCommerceHandler } from './api/commerce.js';
import retiredPaymentHandler from './api/create-payment-intent.js';

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Server handlers need private settings too; Vite still exposes only VITE_ values to React.
  const env = { ...process.env, ...loadEnv(mode, process.cwd(), '') };
  const storeApiUrl = env.VITE_WOOCOMMERCE_STORE_API_URL?.trim();
  const store = storeApiUrl ? new URL(storeApiUrl) : null;
  const commerceHandler = createCommerceHandler({ env });
  const contentListeners = new Set();
  const contentHandler = createContentHandler({
    baseUrl: env.VITE_WORDPRESS_API_URL,
    onRead: (entry) => contentListeners.forEach((listener) => listener(entry)),
  });
  return {
    plugins: [
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
          // Give local Vite responses the same small interface as Vercel Functions.
          const adapt = (handler) => (req, res) => {
            res.status = (code) => { res.statusCode = code; return res; };
            res.json = (body) => {
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify(body));
            };
            return handler(req, res);
          };
          server.middlewares.use('/api/commerce', commerceHandler);
          server.middlewares.use('/api/create-payment-intent', adapt(retiredPaymentHandler));
          server.middlewares.use('/api/stripe-webhook', adapt(retiredPaymentHandler));
        },
      },
    ],
    optimizeDeps: {
      entries: ['index.html'],
    },
    server: {
      watch: { ignored: ['**/.cache/**'] },
      proxy: store
        ? {
            '/api/catalog': {
              target: store.origin,
              changeOrigin: true,
              rewrite: (path) => {
                const upstream = freshWordPressUrl(
                  new URL(
                    path.replace('/api/catalog', `${store.pathname.replace(/\/+$/, '')}/products`),
                    store.origin,
                  ),
                );
                return upstream.pathname + upstream.search;
              },
              configure: (proxy) => {
                proxy.on('proxyReq', (request) => request.setHeader('Cache-Control', 'no-cache'));
                proxy.on('proxyRes', (response) => {
                  // Local publishing checks should not reuse browser-cached CMS responses.
                  response.headers['cache-control'] = 'no-store';
                });
              },
            },
          }
        : undefined,
    },
  };
});
