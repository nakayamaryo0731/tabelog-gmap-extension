import puppeteer from 'puppeteer';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const assetsDir = path.join(__dirname, '..', 'store-assets');

async function captureScreenshots() {
  console.log('Starting browser...');
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  const page = await browser.newPage();

  // Screenshot 1280x800
  console.log('Capturing screenshot (1280x800)...');
  await page.setViewport({ width: 1280, height: 800 });
  await page.goto(`file://${path.join(assetsDir, 'screenshot.html')}`);
  await page.screenshot({
    path: path.join(assetsDir, 'screenshot.png'),
    type: 'png',
  });
  console.log('✓ Saved: store-assets/screenshot.png');

  // Promo small 440x280
  console.log('Capturing promo image (440x280)...');
  await page.setViewport({ width: 440, height: 280 });
  await page.goto(`file://${path.join(assetsDir, 'promo-small.html')}`);
  await page.screenshot({
    path: path.join(assetsDir, 'promo-small.png'),
    type: 'png',
  });
  console.log('✓ Saved: store-assets/promo-small.png');

  // Store icon 128x128
  console.log('Capturing store icon (128x128)...');
  await page.setViewport({ width: 128, height: 128 });
  await page.goto(`file://${path.join(assetsDir, 'icon-store.html')}`);
  await page.screenshot({
    path: path.join(assetsDir, 'icon-store.png'),
    type: 'png',
  });
  console.log('✓ Saved: store-assets/icon-store.png');

  await browser.close();
  console.log('\nDone! Images saved to store-assets/');
}

captureScreenshots().catch(console.error);
