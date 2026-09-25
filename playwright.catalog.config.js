import { defineConfig } from '@playwright/test';
import base from './playwright.config.js';

export default defineConfig({
  ...base,
  outputDir: 'test-results/catalog',
  testMatch: [
    'catalog.spec.js',
    'navigation.spec.js',
    'loading.spec.js',
    'catalog-refresh.spec.js',
  ],
  use: { ...base.use, baseURL: 'http://127.0.0.1:5184' },
  webServer: {
    command: 'npm run dev -- --mode test --host 127.0.0.1 --port 5184 --strictPort',
    url: 'http://127.0.0.1:5184',
    env: {
      VITE_WOOCOMMERCE_STORE_API_URL: 'https://catalog.example.test/wp-json/wc/store/v1',
      VITE_WORDPRESS_API_URL: '',
      VITE_HEADLESS_COMMERCE: 'false',
      VITE_DEMO_REVIEWS: 'true',
    },
  },
});
