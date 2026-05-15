import fs from 'node:fs';
import { chromium } from 'playwright';

const URL = process.env.SCREENSHOT_URL || 'http://localhost:4178/';
const OUT = 'scripts/screenshots';
fs.mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();
const ctx = await browser.newContext({
  viewport: { width: 1280, height: 800 },
  deviceScaleFactor: 2,
});
const page = await ctx.newPage();
page.on('pageerror', (e) => console.log('[pageerror]', e.message));

await page.goto(URL, { waitUntil: 'networkidle' });
await page.evaluate(() => localStorage.clear());
await page.reload({ waitUntil: 'networkidle' });
await page.waitForSelector('.create-pet', { timeout: 8000 });
await page.waitForTimeout(400);
await page.screenshot({ path: `${OUT}/web-demo-create.png` });
console.log('wrote web-demo-create.png');

await page.click('.summon');
await page.waitForSelector('.pet-widget', { timeout: 15000 });
await page.waitForTimeout(1600);
const w = await page.$('.pet-widget');
const box = await w.boundingBox();
await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
await page.waitForTimeout(500);
await page.screenshot({ path: `${OUT}/web-demo.png` });
console.log('wrote web-demo.png');

await browser.close();
