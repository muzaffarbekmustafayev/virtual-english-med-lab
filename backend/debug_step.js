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
  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));
  page.on('pageerror', err => console.log('BROWSER PAGE ERROR:', err.message));

  await page.goto('http://127.0.0.1:5173/login', { waitUntil: 'domcontentloaded' });

  await page.evaluate((auth) => {
    localStorage.setItem('token', auth.token);
    localStorage.setItem('user', JSON.stringify(auth.user));
    localStorage.setItem('language', 'uz');
  }, authData);

  await page.goto('http://127.0.0.1:5173/student/modules/1', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 2000));

  console.log('Current Step before click:', await page.evaluate(() => {
    return document.body.innerText.slice(0, 300);
  }));

  console.log('Clicking Step 1...');
  await page.evaluate(() => {
    const el = Array.from(document.querySelectorAll('*')).find(e => e.textContent && e.textContent.trim() === "Lug'at");
    if (el) el.click();
  });

  await new Promise(r => setTimeout(r, 1500));

  console.log('Body Text after Step 1 click:', await page.evaluate(() => {
    return document.body.innerText.slice(0, 300);
  }));

  await browser.close();
}

capture().catch(err => {
  console.error('Capture error:', err);
  process.exit(1);
});
