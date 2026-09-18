import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { createContentHandler } from './api/content.js';

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_');
  const storeApiUrl = env.VITE_WOOCOMMERCE_STORE_API_URL?.trim();
  const store = storeApiUrl ? new URL(storeApiUrl) : null;
  return {
    plugins: [
      react(),
      {
        name: 'wordpress-content',
        configureServer(server) {
          const handler = createContentHandler({ baseUrl: env.VITE_WORDPRESS_API_URL });
          server.middlewares.use('/api/content', (req, res) => handler(req, res));
        },
      },
    ],
    server: {
      proxy: store
        ? {
            '/api/catalog': {
              target: store.origin,
              changeOrigin: true,
              rewrite: (path) =>
                path.replace('/api/catalog', `${store.pathname.replace(/\/+$/, '')}/products`),
              configure: (proxy) => {
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
