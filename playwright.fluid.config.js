import { defineConfig } from '@playwright/test';
import base from './playwright.production.config.js';

export default defineConfig({
  ...base,
  testMatch: ['fluid-layout.spec.js'],
  timeout: 120000,
  outputDir: 'test-results/fluid-layout',
  webServer: {
    ...base.webServer,
    env: {
      ...base.webServer.env,
      VITE_WORDPRESS_API_URL: 'https://content.example.test/wp-json/wp/v2',
      VITE_HEADLESS_COMMERCE: 'true',
    },
  },
});
