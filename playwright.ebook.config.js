import { defineConfig } from '@playwright/test';
import base from './playwright.fluid.config.js';

export default defineConfig({
  ...base,
  testMatch: ['ebook.spec.js'],
  outputDir: 'test-results/ebook',
});
