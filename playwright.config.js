import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  testMatch: ['responsive.spec.js', 'newsletter.spec.js'],
  timeout: 60000,
  workers: 1,
  use: {
    baseURL: 'http://127.0.0.1:5183',
    channel: process.env.PLAYWRIGHT_CHANNEL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  webServer: {
    command: 'npm run dev -- --mode test --host 127.0.0.1 --port 5183 --strictPort',
    url: 'http://127.0.0.1:5183',
    env: {
      VITE_WOOCOMMERCE_STORE_API_URL: 'https://catalog.example.test/wp-json/wc/store/v1',
      VITE_WORDPRESS_API_URL: 'https://content.example.test/wp-json/wp/v2',
      VITE_HEADLESS_COMMERCE: 'false',
    },
  },
});
