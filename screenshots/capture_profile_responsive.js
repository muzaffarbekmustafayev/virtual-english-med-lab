const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');
const http = require('http');

const CHROME_PATH = fs.existsSync('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe')
  ? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
  : 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

const SCREENSHOT_DIR = __dirname;
const BASE_URL = 'http://localhost:5173';

function loginApi(email, password) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({ email, password });
    const req = http.request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    });
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

async function captureProfileResponsive() {
  console.log('Launching browser with:', CHROME_PATH);
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    defaultViewport: { width: 1440, height: 960 }
  });

  const page = await browser.newPage();

  async function authenticateSession(email, password) {
    const authData = await loginApi(email, password);
    if (!authData.token || !authData.user) {
      throw new Error(`Login API failed for ${email}`);
    }
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });
    await page.evaluate((tok, usr) => {
      localStorage.setItem('token', tok);
      localStorage.setItem('user', JSON.stringify(usr));
    }, authData.token, authData.user);
    await new Promise(r => setTimeout(r, 300));
  }

  try {
    await authenticateSession('student@vpe.uz', 'student123');

    // 1. Desktop Profile View (1440x960)
    console.log('1. Capturing Desktop Profile...');
    await page.setViewport({ width: 1440, height: 960 });
    await page.goto(`${BASE_URL}/student/profile`, { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 1200));
    const desktopPath = path.join(SCREENSHOT_DIR, 'profile_desktop_view.png');
    await page.screenshot({ path: desktopPath, fullPage: true });
    console.log('Saved:', desktopPath);

    // 2. Tablet Profile View (768x1024)
    console.log('2. Capturing Tablet Profile...');
    await page.setViewport({ width: 768, height: 1024 });
    await page.goto(`${BASE_URL}/student/profile`, { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 1200));
    const tabletPath = path.join(SCREENSHOT_DIR, 'profile_tablet_view.png');
    await page.screenshot({ path: tabletPath, fullPage: true });
    console.log('Saved:', tabletPath);

    // 3. Mobile Profile View (390x844 - iPhone 14 / modern smartphone)
    console.log('3. Capturing Mobile Profile...');
    await page.setViewport({ width: 390, height: 844 });
    await page.goto(`${BASE_URL}/student/profile`, { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 1200));
    const mobilePath = path.join(SCREENSHOT_DIR, 'profile_mobile_view.png');
    await page.screenshot({ path: mobilePath, fullPage: true });
    console.log('Saved:', mobilePath);

    console.log('✅ All profile responsive screenshots captured!');
  } catch (err) {
    console.error('Error during capture:', err);
  } finally {
    await browser.close();
  }
}

captureProfileResponsive();
