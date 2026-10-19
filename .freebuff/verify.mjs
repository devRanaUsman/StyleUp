import { chromium } from 'playwright-core';
const exe = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const browser = await chromium.launch({ executablePath: exe, headless: true, args: ['--disable-gpu', '--hide-scrollbars'] });
const consent = () => localStorage.setItem('stylehub:cookie-consent', JSON.stringify({ essential: true, analytics: true, marketing: false, at: new Date().toISOString() }));
const errors = [];

// Desktop header behaviour
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  await ctx.addInitScript(consent);
  const page = await ctx.newPage();
  page.on('console', (m) => { if (m.type() === 'error') errors.push('desktop: ' + m.text()); });
  await page.goto('http://localhost:3000/', { waitUntil: 'load' });
  await page.getByRole('button', { name: 'Categories' }).click();
  await page.waitForTimeout(400);
  console.log('catmenu links:', await page.locator('#catmenu-panel a').count());
  await page.screenshot({ path: '.freebuff/shots/ui-catmenu.png' });
  await page.keyboard.press('Escape');
  await page.getByRole('link', { name: 'Women', exact: true }).first().hover();
  await page.waitForTimeout(450);
  console.log('mega visible:', await page.locator('.mega').count());
  await page.screenshot({ path: '.freebuff/shots/ui-mega.png' });
  await page.mouse.move(700, 600);
  await page.fill('#site-search', 'linen');
  await page.locator('.hsearch').press('Enter');
  await page.waitForTimeout(2200);
  console.log('search url:', page.url(), 'heading:', await page.locator('h1').first().innerText());
  await ctx.close();
}

// Mobile menu + cart + checkout
{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  await ctx.addInitScript(consent);
  const page = await ctx.newPage();
  page.on('console', (m) => { if (m.type() === 'error') errors.push('mobile: ' + m.text()); });
  await page.goto('http://localhost:3000/', { waitUntil: 'load' });
  await page.getByRole('button', { name: 'Open menu' }).click();
  await page.waitForTimeout(500);
  await page.screenshot({ path: '.freebuff/shots/ui-mobile-menu.png' });
  console.log('mobile menu rows:', await page.locator('.mmenu__row').count());
  await page.keyboard.press('Escape');
  await page.waitForTimeout(400);
  await page.goto('http://localhost:3000/login', { waitUntil: 'load' });
  await page.fill('input[type="email"]', 'qa-redesign@styleup.test');
  await page.fill('input[type="password"]', 'Redesign2026!');
  await page.getByRole('button', { name: 'Sign in' }).click();
  await page.waitForTimeout(2200);
  await page.goto('http://localhost:3000/bags/bucket-bags/mini-bucket-bag', { waitUntil: 'load' });
  await page.waitForTimeout(900);
  const sizes = await page.locator('.sizes [role="radio"]').count();
  if (sizes) await page.locator('.sizes [role="radio"]').first().click();
  const colors = await page.locator('.pdp__option .swatch:not(:disabled)').count();
  if (colors) await page.locator('.pdp__option .swatch:not(:disabled)').first().click();
  await page.locator('.pdp__buy .btn').first().click();
  await page.waitForTimeout(1200);
  console.log('cart drawer:', await page.locator('.drawer').count(), 'sizes', sizes, 'colors', colors);
  await page.goto('http://localhost:3000/cart', { waitUntil: 'load' });
  const cartItems = await page.locator('.cart-line').count();
  console.log('cart items:', cartItems);
  await page.screenshot({ path: '.freebuff/shots/m-cart-filled.png', fullPage: true });
  await page.goto('http://localhost:3000/checkout', { waitUntil: 'load' });
  await page.waitForTimeout(900);
  console.log('checkout form fields:', await page.locator('.co-section input').count());
  await page.screenshot({ path: '.freebuff/shots/m-checkout-filled.png', fullPage: true });
  await ctx.close();
}

console.log('ERRORS', errors.slice(0, 8));
await browser.close();
