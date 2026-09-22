import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { createContentHandler } from './api/content.js';
import { contentBootstrapPlugin } from './server/contentBootstrap.js';

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_');
  const storeApiUrl = env.VITE_WOOCOMMERCE_STORE_API_URL?.trim();
  const store = storeApiUrl ? new URL(storeApiUrl) : null;
  const contentHandler = createContentHandler({ baseUrl: env.VITE_WORDPRESS_API_URL });
  return {
    plugins: [
      react(),
      contentBootstrapPlugin({
        handler: contentHandler,
        cmsUrl: env.VITE_WORDPRESS_API_URL?.trim(),
        mode,
        root: process.cwd(),
      }),
      {
        name: 'wordpress-content',
        configureServer(server) {
          server.middlewares.use('/api/content', (req, res) => contentHandler(req, res));
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
