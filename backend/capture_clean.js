const puppeteer = require('puppeteer-core');
const path = require('path');
const http = require('http');

function loginBackend() {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({ email: 'student@vpe.uz', password: 'student123' });
    const req = http.request({
      hostname: '127.0.0.1',
      port: 5000,
      path: '/api/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        resolve(JSON.parse(data));
      });
    });
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

async function capture() {
  const authData = await loginBackend();
  const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  
  const browser = await puppeteer.launch({
    executablePath: edgePath,
    headless: true,
    defaultViewport: { width: 1440, height: 1050, deviceScaleFactor: 2 },
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  const screenshotDir = 'C:/Users/muzaf/Desktop/virtual-english-med-lab/screenshots';

  await page.goto('http://127.0.0.1:5173/login', { waitUntil: 'domcontentloaded' });

  // --- 1. Chat in Uzbek ---
  await page.evaluate((auth) => {
    localStorage.setItem('token', auth.token);
    localStorage.setItem('user', JSON.stringify(auth.user));
    localStorage.setItem('module_1_completed', JSON.stringify([1, 2, 3, 4]));
    localStorage.setItem('language', 'uz');
  }, authData);

  console.log('1. Capturing Chat in Uzbek...');
  await page.goto('http://127.0.0.1:5173/student/modules/1', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 2000));
  await page.screenshot({ path: path.join(screenshotDir, 'chat_light_preview.png') });

  // --- 2. Chat in Russian (click RU pill) ---
  console.log('2. Capturing Chat in Russian...');
  await page.evaluate(() => {
    const ruBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('RU'));
    if (ruBtn) ruBtn.click();
  });
  await new Promise(r => setTimeout(r, 1500));
  await page.screenshot({ path: path.join(screenshotDir, 'chat_ru_light_preview.png') });

  // --- 3. Chat in English (click EN pill) ---
  console.log('3. Capturing Chat in English...');
  await page.evaluate(() => {
    const enBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('EN'));
    if (enBtn) enBtn.click();
  });
  await new Promise(r => setTimeout(r, 1500));
  await page.screenshot({ path: path.join(screenshotDir, 'chat_en_light_preview.png') });

  // --- 4. Switch back to UZ and Trigger 100% Test Pass for Results ---
  console.log('4. Capturing Results in Uzbek...');
  await page.evaluate(() => {
    const uzBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('UZ'));
    if (uzBtn) uzBtn.click();
  });
  await new Promise(r => setTimeout(r, 1000));
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const test100 = btns.find(b => b.textContent.includes('100%') || b.textContent.includes('Pass') || b.textContent.includes('⚡'));
    if (test100) test100.click();
  });
  await new Promise(r => setTimeout(r, 2500));
  await page.screenshot({ path: path.join(screenshotDir, 'results_light_preview.png') });

  console.log('All 4 light mode screenshots captured successfully!');
  await browser.close();
}

capture().catch(err => {
  console.error('Capture error:', err);
  process.exit(1);
});
