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

  // 1. Dashboard Light Mode
  console.log('Capturing 1. Dashboard...');
  await page.goto('http://127.0.0.1:5173/student/dashboard', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1000));
  await page.screenshot({ path: path.join(screenshotDir, 'dashboard_light_preview.png') });

  // 2. Module Detail - Vocabulary Step (Step 1)
  console.log('Capturing 2. Vocabulary...');
  await page.goto('http://127.0.0.1:5173/student/modules/1', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1000));
  
  await page.evaluate(() => {
    const spans = Array.from(document.querySelectorAll('span'));
    const vocabSpan = spans.find(s => s.textContent.trim() === "Lug'at" || s.textContent.trim() === "Vocabulary");
    if (vocabSpan) vocabSpan.click();
  });
  await new Promise(r => setTimeout(r, 1500));
  await page.screenshot({ path: path.join(screenshotDir, 'vocab_light_preview.png') });

  // 3. Module Detail - Virtual Patient Chat (Step 5)
  console.log('Capturing 3. Chat...');
  await page.evaluate(() => {
    const spans = Array.from(document.querySelectorAll('span'));
    const chatSpan = spans.find(s => s.textContent.trim() === "Virtual Bemor" || s.textContent.trim() === "Virtual Patient");
    if (chatSpan) chatSpan.click();
  });
  await new Promise(r => setTimeout(r, 1500));
  await page.screenshot({ path: path.join(screenshotDir, 'chat_light_preview.png') });

  // 4. Click Test Pass 100% to generate results and capture Step 6
  console.log('Capturing 4. Results...');
  await page.evaluate(() => {
    const pass100Btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('100%') || b.textContent.includes('Test:'));
    if (pass100Btn) pass100Btn.click();
  });
  await new Promise(r => setTimeout(r, 2000));
  await page.screenshot({ path: path.join(screenshotDir, 'results_light_preview.png') });

  console.log('All 4 light mode screenshots captured successfully!');
  await browser.close();
}

capture().catch(err => {
  console.error('Capture error:', err);
  process.exit(1);
});
