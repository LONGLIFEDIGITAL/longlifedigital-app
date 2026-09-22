import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { createContentHandler } from './api/content.js';
import { contentBootstrapPlugin } from './server/contentBootstrap.js';
import { freshWordPressUrl } from './server/wordpressRequest.js';

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_');
  const storeApiUrl = env.VITE_WOOCOMMERCE_STORE_API_URL?.trim();
  const store = storeApiUrl ? new URL(storeApiUrl) : null;
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
