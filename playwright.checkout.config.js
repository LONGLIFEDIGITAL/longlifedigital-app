import { defineConfig } from '@playwright/test';
import base from './playwright.config.js';
export default defineConfig({
  ...base,
  outputDir: 'test-results/checkout',
  testMatch: ['checkout.spec.js'],
  use: { ...base.use, baseURL: 'http://127.0.0.1:5187' },
  webServer: {
    command: 'npm run dev -- --mode test --host 127.0.0.1 --port 5187 --strictPort',
    url: 'http://127.0.0.1:5187',
    env: {
      VITE_WORDPRESS_API_URL: '',
      VITE_WOOCOMMERCE_STORE_API_URL: 'https://catalog.example.test/wp-json/wc/store/v1',
      VITE_HEADLESS_COMMERCE: 'true',
    },
  },
});
