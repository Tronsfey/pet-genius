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
await page.evaluate(() => localStorage.clear());
await page.reload({ waitUntil: 'networkidle' });
await page.waitForSelector('.create-pet', { timeout: 5000 });
await page.waitForTimeout(400);
await page.screenshot({ path: `${OUT_DIR}/01-create.png`, fullPage: false });
console.log('wrote 01-create.png');

await page.click('.summon');
await page.waitForSelector('.pet-widget', { timeout: 15000 });
await page.waitForTimeout(1500);
await page.screenshot({ path: `${OUT_DIR}/02-pet-default.png`, fullPage: false });
console.log('wrote 02-pet-default.png  (default-centered pet, no panel)');

// Hover over the widget so the control panel appears
const widget = await page.$('.pet-widget');
if (widget) {
  const box = await widget.boundingBox();
  if (box) {
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.waitForTimeout(450);
    await page.screenshot({ path: `${OUT_DIR}/03-hovered.png`, fullPage: false });
    console.log('wrote 03-hovered.png  (hover panel revealed)');
  }
}

// Inject a sample thought to capture the bubble
await page.evaluate(() => {
  const wrap = document.querySelector('.pet-widget-canvas');
  if (!wrap) return;
  const div = document.createElement('div');
  div.className = 'thought-bubble';
  div.textContent = '想出去走走…';
  wrap.appendChild(div);
});
await page.waitForTimeout(350);
await page.screenshot({ path: `${OUT_DIR}/04-thought.png`, fullPage: false });
console.log('wrote 04-thought.png');

// Drag the widget to a different spot on the page
await page.evaluate(() => {
  for (const el of document.querySelectorAll('.thought-bubble')) el.remove();
});
await page.mouse.move(0, 0); // unhover
await page.waitForTimeout(150);

const widget2 = await page.$('.pet-widget');
if (widget2) {
  const box = await widget2.boundingBox();
  if (box) {
    const startX = box.x + 30;
    const startY = box.y + 30;
    const targetX = 920; // far right of viewport
    const targetY = 540; // bottom-ish
    await page.mouse.move(startX, startY);
    await page.mouse.down();
    // step the move so the drag handler fires repeatedly
    for (let i = 1; i <= 10; i++) {
      const t = i / 10;
      await page.mouse.move(startX + (targetX - startX) * t, startY + (targetY - startY) * t, {
        steps: 1,
      });
      await page.waitForTimeout(20);
    }
    await page.mouse.up();
    await page.waitForTimeout(300);
    await page.screenshot({ path: `${OUT_DIR}/05-dragged.png`, fullPage: false });
    console.log('wrote 05-dragged.png  (pet moved to a corner)');
  }
}

await browser.close();
