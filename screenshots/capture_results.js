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

async function captureAllResults() {
  console.log('Launching browser with:', CHROME_PATH);
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    defaultViewport: { width: 1440, height: 960 }
  });

  const page = await browser.newPage();

  async function takeScreenshot(name, fullPage = false) {
    await new Promise(r => setTimeout(r, 1500)); // wait for transitions/charts
    const filePath = path.join(SCREENSHOT_DIR, `${name}.png`);
    await page.screenshot({ path: filePath, fullPage });
    console.log(`📸 Saved screenshot: ${name}.png`);
    return filePath;
  }

  async function authenticateSession(email, password) {
    const authData = await loginApi(email, password);
    if (!authData.token || !authData.user) {
      throw new Error(`Login API failed for ${email}: ${JSON.stringify(authData)}`);
    }
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });
    await page.evaluate((tok, usr) => {
      localStorage.setItem('token', tok);
      localStorage.setItem('user', JSON.stringify(usr));
    }, authData.token, authData.user);
    await new Promise(r => setTimeout(r, 300));
  }

  const generatedScreenshots = [];

  try {
    // ═══════════════════════════════════════════════════════
    // 1. TALABA NATIJALARI (STUDENT RESULTS)
    // ═══════════════════════════════════════════════════════
    console.log('\n--- 1. Capturing Student Results ---');
    await authenticateSession('student@vpe.uz', 'student123');

    // Student Dashboard
    console.log('Navigating to /student/dashboard...');
    await page.goto(`${BASE_URL}/student/dashboard`, { waitUntil: 'networkidle0' });
    generatedScreenshots.push(await takeScreenshot('01_student_results_dashboard', false));

    // Student Profile (Full Performance & Score Analytics)
    console.log('Navigating to /student/profile...');
    await page.goto(`${BASE_URL}/student/profile`, { waitUntil: 'networkidle0' });
    generatedScreenshots.push(await takeScreenshot('02_student_results_profile', true));

    // Student Modules List with completion badges
    console.log('Navigating to /student/modules...');
    await page.goto(`${BASE_URL}/student/modules`, { waitUntil: 'networkidle0' });
    generatedScreenshots.push(await takeScreenshot('03_student_modules_progress', false));

    // ═══════════════════════════════════════════════════════
    // 2. O'QITUVCHI NATIJALARI (TEACHER REPORTS & DASHBOARD)
    // ═══════════════════════════════════════════════════════
    console.log('\n--- 2. Capturing Teacher Results & Reports ---');
    await authenticateSession('teacher@vpe.uz', 'teacher123');

    // Teacher Dashboard
    console.log('Navigating to /teacher/dashboard...');
    await page.goto(`${BASE_URL}/teacher/dashboard`, { waitUntil: 'networkidle0' });
    generatedScreenshots.push(await takeScreenshot('04_teacher_results_dashboard', false));

    // Teacher Reports (Detailed Student Performance & Grade Table)
    console.log('Navigating to /teacher/reports...');
    await page.goto(`${BASE_URL}/teacher/reports`, { waitUntil: 'networkidle0' });
    generatedScreenshots.push(await takeScreenshot('05_teacher_results_reports', true));

    // Teacher Groups Overview
    console.log('Navigating to /teacher/groups...');
    await page.goto(`${BASE_URL}/teacher/groups`, { waitUntil: 'networkidle0' });
    generatedScreenshots.push(await takeScreenshot('06_teacher_groups_overview', false));

    console.log('\n✅ All screenshots captured successfully:');
    console.log(JSON.stringify(generatedScreenshots, null, 2));

  } catch (err) {
    console.error('Error during capture:', err);
  } finally {
    await browser.close();
  }
}

captureAllResults();
