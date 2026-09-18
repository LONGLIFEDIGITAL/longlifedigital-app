import { chromium } from '@playwright/test';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { resolve, dirname } from 'node:path';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const folder = resolve(root, 'docs/cms');
const browser = await chromium.launch({ channel: 'chrome', headless: true });
try {
  const page = await browser.newPage();
  await page.goto(pathToFileURL(resolve(folder, 'Longlife-Digital-ACF-Field-Definitions.html')).href);
  await page.emulateMedia({ media: 'print' });
  await page.evaluate(() => document.fonts.ready);
  const overflow = await page.locator('td').evaluateAll((cells) => cells.filter((cell) => cell.scrollWidth > cell.clientWidth + 1).map((cell) => cell.textContent));
  if (overflow.length) throw new Error(`Overflowing table cells: ${JSON.stringify(overflow)}`);
  await page.pdf({
    path: resolve(folder, 'Longlife-Digital-ACF-Field-Definitions.pdf'),
    printBackground: true, preferCSSPageSize: true, displayHeaderFooter: true,
    headerTemplate: '<div></div>',
    footerTemplate: '<div style="font-family:Arial,sans-serif;font-size:8px;color:#796a84;width:100%;padding:0 64px;display:flex;justify-content:space-between"><span>LONGLIFE DIGITAL · ACF REFERENCE · v1.0</span><span><span class="pageNumber"></span> / <span class="totalPages"></span></span></div>',
    tagged: true, outline: true,
  });
  console.log('Generated docs/cms/Longlife-Digital-ACF-Field-Definitions.pdf');
} finally {
  await browser.close();
}
