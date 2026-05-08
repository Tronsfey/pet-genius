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
// Force a fresh first-load state.
await page.evaluate(() => localStorage.clear());
await page.reload({ waitUntil: 'networkidle' });
await page.waitForSelector('.create-pet', { timeout: 5000 });
await page.waitForTimeout(400);

await page.screenshot({ path: `${OUT_DIR}/01-create.png`, fullPage: false });
console.log('wrote 01-create.png');

// Click 召唤 to summon a pet (the sprite endpoint uses USE_TEST_PET in dev).
await page.click('.summon');
await page.waitForSelector('.pet-canvas-host canvas', { timeout: 15000 });
await page.waitForTimeout(1500);

await page.screenshot({ path: `${OUT_DIR}/02-pet-idle.png`, fullPage: false });
console.log('wrote 02-pet-idle.png');

// Inject a thought bubble manually to capture the visual since /api/action is
// blocked by the upstream allowlist in this sandbox. Mirrors what onThought
// would do when the model returns a thought field.
await page.evaluate(() => {
  // Reach into the running app via a custom event the StatusBar/App listens to?
  // Simpler: directly mutate DOM by inserting a clone of what ThoughtBubble emits.
  const wrap = document.querySelector('.stage-canvas-wrap');
  if (!wrap) return;
  const div = document.createElement('div');
  div.className = 'thought-bubble';
  div.textContent = '有点饿了…';
  wrap.appendChild(div);
});
await page.waitForTimeout(400);
await page.screenshot({ path: `${OUT_DIR}/03-thought.png`, fullPage: false });
console.log('wrote 03-thought.png');

// Remove the injected bubble before clicking feed
await page.evaluate(() => {
  document.querySelectorAll('.thought-bubble').forEach((el) => el.remove());
});

// Click feed
const feedBtn = await page.$('button:has-text("feed")');
if (feedBtn) {
  await feedBtn.click();
  await page.waitForTimeout(450);
  await page.screenshot({ path: `${OUT_DIR}/04-feed.png`, fullPage: false });
  console.log('wrote 04-feed.png');
}

// Click pet
const petBtn = await page.$('button:has-text("pet")');
if (petBtn) {
  await petBtn.click();
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${OUT_DIR}/05-pet-action.png`, fullPage: false });
  console.log('wrote 05-pet-action.png');
}

await browser.close();
