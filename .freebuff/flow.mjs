import { chromium } from 'playwright-core';
const exe = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const email = 'qa-redesign@styleup.test';
const browser = await chromium.launch({ executablePath: exe, headless: true, args: ['--disable-gpu', '--hide-scrollbars'] });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1 });
await ctx.addInitScript(() => localStorage.setItem('stylehub:cookie-consent', JSON.stringify({ essential: true, analytics: true, marketing: false, at: new Date().toISOString() })));
const page = await ctx.newPage();
const errors = [];
page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));

async function snap(name) {
  await page.waitForTimeout(900);
  const h = await page.evaluate(() => document.body.scrollHeight);
  for (let y = 0; y < h; y += 700) { await page.evaluate((v) => window.scrollTo(0, v), y); await page.waitForTimeout(90); }
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(500);
  await page.screenshot({ path: `.freebuff/shots/${name}.png`, fullPage: true });
  console.log('snap', name, page.url());
}

await page.goto('http://localhost:3000/register', { waitUntil: 'load' });
await page.fill('input[autocomplete="name"]', 'QA Redesign');
await page.fill('input[type="email"]', email);
const pw = page.locator('input[autocomplete="new-password"]');
await pw.nth(0).fill('Redesign2026!');
await pw.nth(1).fill('Redesign2026!');
await page.locator('input[name="terms"]').check();
await page.getByRole('button', { name: 'Create account' }).click();
await page.waitForTimeout(2500);
console.log('after register:', page.url());
await snap('qa-account');

await page.goto('http://localhost:3000/account/orders', { waitUntil: 'load' });
await snap('qa-orders');

await page.goto('http://localhost:3000/bags/bucket-bags/mini-bucket-bag', { waitUntil: 'load' });
await page.getByRole('button', { name: /Add to cart/i }).first().click();
await page.waitForTimeout(1200);
await snap('qa-cart-drawer');
await page.goto('http://localhost:3000/cart', { waitUntil: 'load' });
await snap('qa-cart');

await page.goto('http://localhost:3000/checkout', { waitUntil: 'load' });
await snap('qa-checkout');

await page.goto('http://localhost:3000/wishlist', { waitUntil: 'load' });
await page.goto('http://localhost:3000/bags/bucket-bags/mini-bucket-bag', { waitUntil: 'load' });
await page.getByRole('button', { name: /wishlist/i }).first().click();
await page.waitForTimeout(500);
await page.goto('http://localhost:3000/wishlist', { waitUntil: 'load' });
await snap('qa-wishlist');

console.log('ERRORS', errors.slice(0, 10));
await browser.close();
