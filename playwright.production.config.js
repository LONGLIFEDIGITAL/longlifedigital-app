import { defineConfig } from '@playwright/test';
import base from './playwright.config.js';

export default defineConfig({
  ...base,
  testMatch: ['production-styles.spec.js'],
  outputDir: 'test-results/production-styles',
  use: { ...base.use, baseURL: 'http://127.0.0.1:5187' },
  webServer: {
    timeout: 180000,
    // Vite still creates an optimized production bundle; test mode skips CMS preloading.
    command:
      'npm run build -- --mode test && npm run preview -- --host 127.0.0.1 --port 5187 --strictPort',
    url: 'http://127.0.0.1:5187',
    env: {
      VITE_WOOCOMMERCE_STORE_API_URL: 'https://catalog.example.test/wp-json/wc/store/v1',
      VITE_WORDPRESS_API_URL: '',
      VITE_HEADLESS_COMMERCE: 'false',
    },
  },
});
