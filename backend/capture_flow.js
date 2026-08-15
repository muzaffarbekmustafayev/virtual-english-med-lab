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
    defaultViewport: { width: 1440, height: 1100, deviceScaleFactor: 2 },
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.goto('http://127.0.0.1:5173/login', { waitUntil: 'domcontentloaded' });

  await page.evaluate((auth) => {
    localStorage.setItem('token', auth.token);
    localStorage.setItem('user', JSON.stringify(auth.user));
    localStorage.setItem('module_1_completed', JSON.stringify([1, 2, 3, 4, 5, 6]));
    localStorage.setItem('lang', 'uz');
  }, authData);

  const screenshotDir = 'C:/Users/muzaf/Desktop/virtual-english-med-lab/screenshots';

  // 1. Vocabulary Step
  console.log('1. Navigating to Step 1 Vocabulary...');
  await page.goto('http://127.0.0.1:5173/student/modules/1', { waitUntil: 'networkidle0' });
  await page.evaluate(() => {
    const allSpans = Array.from(document.querySelectorAll('span'));
    const vocab = allSpans.find(s => s.textContent.trim() === "Lug'at");
    if (vocab) vocab.click();
  });
  await new Promise(r => setTimeout(r, 1500));
  await page.screenshot({ path: path.join(screenshotDir, 'vocab_light_preview.png') });
  console.log('Saved vocab_light_preview.png');

  // 2. Chat Step
  console.log('2. Navigating to Step 5 Chat...');
  await page.evaluate(() => {
    const allSpans = Array.from(document.querySelectorAll('span'));
    const chat = allSpans.find(s => s.textContent.trim() === "Virtual Bemor");
    if (chat) chat.click();
  });
  await new Promise(r => setTimeout(r, 1500));
  await page.screenshot({ path: path.join(screenshotDir, 'chat_light_preview.png') });
  console.log('Saved chat_light_preview.png');

  // 3. Complete Chat with 100% to generate results
  console.log('3. Completing chat with 100%...');
  await page.evaluate(() => {
    const allButtons = Array.from(document.querySelectorAll('button'));
    const test100 = allButtons.find(b => b.textContent.includes('100%'));
    if (test100) test100.click();
  });
  await new Promise(r => setTimeout(r, 2000));
  await page.screenshot({ path: path.join(screenshotDir, 'results_light_preview.png') });
  console.log('Saved results_light_preview.png');

  await browser.close();
}

capture().catch(err => {
  console.error('Capture error:', err);
  process.exit(1);
});
