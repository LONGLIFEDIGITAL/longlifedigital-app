import { defineConfig } from '@playwright/test';
import base from './playwright.config.js';

export default defineConfig({
  ...base,
  testMatch: ['site-settings.spec.js', 'home-content.spec.js', 'content-pages.spec.js'],
  use: { ...base.use, baseURL: 'http://127.0.0.1:5185' },
  webServer: {
    command: 'npm run dev -- --mode test --host 127.0.0.1 --port 5185 --strictPort',
    url: 'http://127.0.0.1:5185',
    env: {
      VITE_WOOCOMMERCE_STORE_API_URL: 'https://catalog.example.test/wp-json/wc/store/v1',
      VITE_WORDPRESS_API_URL: 'https://content.example.test/wp-json/wp/v2',
    },
  },
});
