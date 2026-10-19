import { chromium } from 'playwright-core';
const exe = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const pages = process.argv.slice(2);
const browser = await chromium.launch({ executablePath: exe, headless: true, args: ['--disable-gpu', '--hide-scrollbars', '--disable-dev-shm-usage'] });
for (const width of [1440, 390]) {
  const ctx = await browser.newContext({ viewport: { width, height: width > 500 ? 1000 : 844 }, deviceScaleFactor: 1 });
  await ctx.addInitScript(() => {
    localStorage.setItem('stylehub:cookie-consent', JSON.stringify({ essential: true, analytics: true, marketing: false, at: new Date().toISOString() }));
  });
  const page = await ctx.newPage();
  for (const entry of pages) {
    const [name, path] = entry.split('=');
    try {
      await page.goto('http://localhost:3000' + path, { waitUntil: 'load', timeout: 60000 });
      await page.waitForTimeout(1500);
      const height = await page.evaluate(() => document.body.scrollHeight);
      for (let y = 0; y < height; y += 600) { await page.evaluate((v) => window.scrollTo(0, v), y); await page.waitForTimeout(120); }
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.waitForTimeout(700);
      await page.screenshot({ path: `.freebuff/shots/${name}-${width}.png`, fullPage: true });
      console.log('shot', name, width);
    } catch (e) {
      console.log('ERR', name, width, e.message.split('\n')[0]);
    }
  }
  await ctx.close();
}
await browser.close();
