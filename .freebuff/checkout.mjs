import { chromium } from 'playwright-core';
const exe = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const browser = await chromium.launch({ executablePath: exe, headless: true, args: ['--disable-gpu', '--hide-scrollbars'] });
for (const width of [1440, 390]) {
  const ctx = await browser.newContext({ viewport: { width, height: width > 500 ? 1000 : 844 }, deviceScaleFactor: 1 });
  await ctx.addInitScript(() => localStorage.setItem('stylehub:cookie-consent', JSON.stringify({ essential: true, analytics: true, marketing: false, at: new Date().toISOString() })));
  const page = await ctx.newPage();
  const errors = [];
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto('http://localhost:3000/login', { waitUntil: 'load' });
  await page.fill('input[type="email"]', 'qa-redesign@styleup.test');
  await page.fill('input[type="password"]', 'Redesign2026!');
  await page.getByRole('button', { name: 'Sign in' }).click();
  await page.waitForTimeout(2200);
  await page.goto('http://localhost:3000/bags/bucket-bags/mini-bucket-bag', { waitUntil: 'load' });
  await page.getByRole('button', { name: /Add to cart/i }).first().click();
  await page.waitForTimeout(900);
  await page.goto('http://localhost:3000/checkout', { waitUntil: 'load' });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: `.freebuff/shots/qa-checkout2-${width}.png`, fullPage: true });
  console.log('checkout', width, page.url(), errors.slice(0, 5));
  await ctx.close();
}
await browser.close();
