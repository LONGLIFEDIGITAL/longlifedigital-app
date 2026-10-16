import { defineConfig } from '@playwright/test';
import base from './playwright.fluid.config.js';
export default defineConfig({
  ...base,
  testMatch: ['services.spec.js', 'translation.spec.js'],
  outputDir: 'test-results/services',
  use: {
    ...base.use,
    ...(process.env.PLAYWRIGHT_EXECUTABLE_PATH
      ? { launchOptions: { executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH } }
      : {}),
  },
});
