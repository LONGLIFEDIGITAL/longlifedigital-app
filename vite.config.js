import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_');
  const storeApiUrl = env.VITE_WOOCOMMERCE_STORE_API_URL?.trim();
  const store = storeApiUrl ? new URL(storeApiUrl) : null;
  return {
    plugins: [react()],
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
