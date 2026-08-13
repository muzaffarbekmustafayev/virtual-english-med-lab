const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const CHROME_PATH = fs.existsSync('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe')
  ? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
  : 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

const SCREENSHOT_DIR = __dirname;
const BASE_URL = 'http://localhost:5173';

async function capture() {
  console.log('Launching browser using:', CHROME_PATH);
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    defaultViewport: { width: 1440, height: 900 }
  });

  const page = await browser.newPage();

  // Helper to take screenshot
  async function takeScreenshot(name) {
    await new Promise(r => setTimeout(r, 1200)); // wait for animations & data fetching
    const filePath = path.join(SCREENSHOT_DIR, `${name}.png`);
    await page.screenshot({ path: filePath, fullPage: false });
    console.log(`Saved screenshot: ${name}.png`);
    return filePath;
  }

  // Helper to goto page
  async function goTo(urlPath) {
    await page.goto(`${BASE_URL}${urlPath}`, { waitUntil: 'domcontentloaded' });
    await new Promise(r => setTimeout(r, 500));
  }

  // Helper to login
  async function login(email, password) {
    await goTo('/login');
    await page.type('input[type="email"]', email);
    await page.type('input[type="password"]', password);
    await page.click('button[type="submit"]');
    await new Promise(r => setTimeout(r, 1500));
  }

  // Helper to clear localStorage
  async function logout() {
    await page.evaluate(() => localStorage.clear());
    await new Promise(r => setTimeout(r, 300));
  }

  try {
    // 1. Login Page
    console.log('Capturing Login Page...');
    await goTo('/login');
    await takeScreenshot('01_login');

    // 2. Register Page
    console.log('Capturing Register Page...');
    await goTo('/register');
    await takeScreenshot('02_register');

    // 3. Student Flow
    console.log('Logging in as Student...');
    await logout();
    await login('student@vpe.uz', 'student123');

    console.log('Capturing Student pages...');
    await goTo('/student/dashboard');
    await takeScreenshot('03_student_dashboard');

    await goTo('/student/modules');
    await takeScreenshot('04_student_modules');

    await goTo('/student/modules/1');
    await takeScreenshot('05_student_module_detail');

    await goTo('/student/grammar');
    await takeScreenshot('06_student_grammar');

    await goTo('/student/forum');
    await takeScreenshot('07_student_forum');

    await goTo('/student/profile');
    await takeScreenshot('08_student_profile');

    // 4. Teacher Flow
    console.log('Logging in as Teacher...');
    await logout();
    await login('teacher@vpe.uz', 'teacher123');

    console.log('Capturing Teacher pages...');
    await goTo('/teacher/dashboard');
    await takeScreenshot('09_teacher_dashboard');

    await goTo('/teacher/groups');
    await takeScreenshot('10_teacher_groups');

    await goTo('/teacher/reports');
    await takeScreenshot('11_teacher_reports');

    // 5. Admin Flow
    console.log('Logging in as Admin...');
    await logout();
    await login('admin@vpe.uz', 'admin123');

    console.log('Capturing Admin pages...');
    await goTo('/admin/overview');
    await takeScreenshot('12_admin_overview');

    await goTo('/admin/users');
    await takeScreenshot('13_admin_users');

    await goTo('/admin/groups');
    await takeScreenshot('14_admin_groups');

    await goTo('/admin/content');
    await takeScreenshot('15_admin_content');

    console.log('All screenshots captured successfully!');
  } catch (err) {
    console.error('Error during capture:', err);
  } finally {
    await browser.close();
  }
}

capture();
