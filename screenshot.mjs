import puppeteer from 'puppeteer';

const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });
await page.goto('http://localhost:3099', { waitUntil: 'networkidle0', timeout: 15000 });
// Wait a moment for animations to settle
await new Promise(r => setTimeout(r, 2000));
await page.screenshot({ path: '/tmp/kickscan/hero-screenshot-desktop.jpg', type: 'jpeg', quality: 90 });

// Mobile view
await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });
await page.goto('http://localhost:3099', { waitUntil: 'networkidle0', timeout: 15000 });
await new Promise(r => setTimeout(r, 2000));
await page.screenshot({ path: '/tmp/kickscan/hero-screenshot-mobile.jpg', type: 'jpeg', quality: 90 });

await browser.close();
console.log('Screenshots saved!');
