import fs from 'node:fs';
import { chromium } from 'playwright';

const URL = process.env.SCREENSHOT_URL || 'http://localhost:3000/';
const OUT_DIR = 'scripts/screenshots';
fs.mkdirSync(OUT_DIR, { recursive: true });

const browser = await chromium.launch();
const ctx = await browser.newContext({
  viewport: { width: 1280, height: 800 },
  deviceScaleFactor: 2,
});
const page = await ctx.newPage();

page.on('console', (msg) => {
  if (msg.type() === 'error' || msg.type() === 'warning') {
    console.log(`[browser ${msg.type()}]`, msg.text());
  }
});
page.on('pageerror', (err) => console.log('[pageerror]', err.message));

await page.goto(URL, { waitUntil: 'networkidle' });
// Clear stale localStorage from prior runs so we generate a fresh pet
await page.evaluate(() => localStorage.clear());
await page.reload({ waitUntil: 'networkidle' });
// give the canvas a moment to render the first idle pose
await page.waitForTimeout(1500);

const initialPath = `${OUT_DIR}/01-initial.png`;
await page.screenshot({ path: initialPath, fullPage: false });
console.log('wrote', initialPath);

// Try sending a chat message (will fail upstream due to allowlist; we just want UI behavior)
const input = await page.$('.chat-input input');
if (input) {
  await input.fill('你好呀');
  await page.click('.chat-input button');
  await page.waitForTimeout(2000);
  await page.screenshot({ path: `${OUT_DIR}/02-after-chat.png`, fullPage: false });
  console.log('wrote', `${OUT_DIR}/02-after-chat.png`);
}

// Click feed
const feedBtn = await page.$('button:has-text("feed")');
if (feedBtn) {
  await feedBtn.click();
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${OUT_DIR}/03-feed.png`, fullPage: false });
  console.log('wrote', `${OUT_DIR}/03-feed.png`);
}

const petBtn = await page.$('button:has-text("pet")');
if (petBtn) {
  await petBtn.click();
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${OUT_DIR}/04-pet.png`, fullPage: false });
  console.log('wrote', `${OUT_DIR}/04-pet.png`);
}

await browser.close();
