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

  await page.evaluate((auth) => {
    localStorage.setItem('token', auth.token);
    localStorage.setItem('user', JSON.stringify(auth.user));
    localStorage.setItem('language', 'uz');
  }, authData);

  await page.goto('http://127.0.0.1:5173/student/modules/1', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 2500));

  // 1. Click Step 1 (Lug'at)
  console.log('1. Clicking Step 1: Lug\'at...');
  await page.evaluate(() => {
    const elements = Array.from(document.querySelectorAll('span, button'));
    const step1 = elements.find(el => el.textContent.trim() === "Lug'at" || el.textContent.trim() === "Vocabulary");
    if (step1) step1.click();
  });
  await new Promise(r => setTimeout(r, 1500));
  await page.screenshot({ path: path.join(screenshotDir, '01_vocab_step_light.png') });

  // 2. Click Step 2 (Klinik Iboralar)
  console.log('2. Clicking Step 2: Klinik Iboralar...');
  await page.evaluate(() => {
    const elements = Array.from(document.querySelectorAll('span, button'));
    const step2 = elements.find(el => el.textContent.trim() === "Klinik Iboralar" || el.textContent.trim() === "Phrasebook");
    if (step2) step2.click();
  });
  await new Promise(r => setTimeout(r, 1500));
  await page.screenshot({ path: path.join(screenshotDir, '02_phrase_step_light.png') });

  console.log('Done capturing steps 1 and 2!');
  await browser.close();
}

capture().catch(err => {
  console.error('Capture error:', err);
  process.exit(1);
});
