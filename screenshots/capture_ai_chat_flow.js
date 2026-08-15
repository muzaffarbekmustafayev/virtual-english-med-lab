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

async function captureRealtimeFlow() {
  console.log('Launching browser for Complete AI Consultation capture...');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    defaultViewport: { width: 1440, height: 960 }
  });

  const page = await browser.newPage();

  async function authenticateSession(email, password) {
    const authData = await loginApi(email, password);
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });
    await page.evaluate((tok, usr) => {
      localStorage.setItem('token', tok);
      localStorage.setItem('user', JSON.stringify(usr));
      localStorage.setItem('vpe_completed_steps_1', JSON.stringify([1, 2, 3, 4, 5]));
    }, authData.token, authData.user);
    await new Promise(r => setTimeout(r, 300));
  }

  try {
    await authenticateSession('student@vpe.uz', 'student123');

    // 1. Live Active Real-time Chat
    console.log('1. Active Real-time AI consultation...');
    await page.goto(`${BASE_URL}/student/modules/1`, { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 1200));

    // Ensure on step 6 by clicking step 6 pill or starting call
    await page.evaluate(() => {
      const allBtns = Array.from(document.querySelectorAll('button'));
      const step6Pill = allBtns.find(b => b.textContent.includes('Virtual Bemor'));
      if (step6Pill) step6Pill.click();
    });
    await new Promise(r => setTimeout(r, 600));

    // Click "Matnli Muloqot"
    await page.evaluate(() => {
      const allBtns = Array.from(document.querySelectorAll('button'));
      const textBtn = allBtns.find(b => b.textContent.includes('Matnli Muloqot'));
      if (textBtn) textBtn.click();
    });
    await new Promise(r => setTimeout(r, 600));

    // Type Doctor's Clinical Question
    const input = await page.$('input[placeholder*="tibbiy savol"], input[type="text"]');
    if (input) {
      await input.type("Good morning, James. Could you tell me where the pain is located and if cold water makes it worse?");
      await page.keyboard.press('Enter');
      console.log('Doctor message sent! Waiting for Gemini AI...');
      await new Promise(r => setTimeout(r, 3500));
    }

    // 1. Live Active Realtime Chat
    const activeChatPath = path.join(SCREENSHOT_DIR, '01_ai_realtime_chat_active.png');
    await page.screenshot({ path: activeChatPath, fullPage: false });
    console.log('Saved 01_ai_realtime_chat_active.png');

    // 2. Live Transcript View
    await page.evaluate(() => {
      const allBtns = Array.from(document.querySelectorAll('button'));
      const transBtn = allBtns.find(b => b.textContent.includes('Suhbat Matni'));
      if (transBtn) transBtn.click();
    });
    await new Promise(r => setTimeout(r, 800));
    const transcriptPath = path.join(SCREENSHOT_DIR, '02_ai_realtime_transcript_view.png');
    await page.screenshot({ path: transcriptPath, fullPage: false });
    console.log('Saved 02_ai_realtime_transcript_view.png');

    // 3. Step 7: Passed Evaluation Report (Score >= 60% -> Next Module 2 Unlocked)
    await page.evaluate(() => {
      const allBtns = Array.from(document.querySelectorAll('button'));
      const passBtn = allBtns.find(b => b.textContent.includes('Test: 100%'));
      if (passBtn) passBtn.click();
    });
    await new Promise(r => setTimeout(r, 1200));

    const passedEvalPath = path.join(SCREENSHOT_DIR, '03_ai_evaluation_passed_unlocked.png');
    await page.screenshot({ path: passedEvalPath, fullPage: false });
    console.log('Saved 03_ai_evaluation_passed_unlocked.png');

    // 4. Step 7: Failed Evaluation Report (Score < 60% -> Next Module Locked, Retry required)
    await page.evaluate(() => {
      // Modify step 7 to demonstrate under-60% evaluation
      const scoreElement = document.querySelector('.text-5xl, .text-6xl');
      if (scoreElement) scoreElement.textContent = '45%';
      
      const badge = document.querySelector('.bg-emerald-600');
      if (badge) {
        badge.className = 'inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-rose-600 text-white font-extrabold text-xs shadow-sm';
        badge.innerHTML = '<span>⚠️ Qayta topshirish talab etiladi</span>';
      }

      const desc = document.querySelector('.text-slate-600');
      if (desc) {
        desc.textContent = "Sizning to'plagan balingiz 45%. Moduldan o'tish va keyingi modulni ochish uchun kamida 60% talab qilinadi.";
      }

      // Next module button locked state
      const nextBtn = document.querySelector('.bg-gradient-to-r.from-emerald-600');
      if (nextBtn) {
        nextBtn.className = 'inline-flex items-center gap-1.5 px-5 py-3 rounded-2xl bg-slate-100 border border-slate-200 text-slate-400 font-extrabold text-xs cursor-not-allowed';
        nextBtn.innerHTML = '<span>🔒 Keyingi modul qulflangan (kamida 60% kerak)</span>';
      }

      // Prominent retry button
      const allBtns = Array.from(document.querySelectorAll('button'));
      const retryBtn = allBtns.find(b => b.textContent.includes('Qayta'));
      if (retryBtn) {
        retryBtn.className = 'px-6 py-3 rounded-2xl bg-gradient-to-r from-rose-600 to-amber-600 text-white font-extrabold text-xs shadow-md shadow-rose-200 cursor-pointer flex items-center gap-2';
        retryBtn.innerHTML = '<span>🔄 Qayta topshirish (Muloqotga qaytish)</span>';
      }
    });
    await new Promise(r => setTimeout(r, 600));

    const failedEvalPath = path.join(SCREENSHOT_DIR, '04_ai_evaluation_failed_retry.png');
    await page.screenshot({ path: failedEvalPath, fullPage: false });
    console.log('Saved 04_ai_evaluation_failed_retry.png');

    console.log('✅ All 4 real-time AI consultation and branching evaluation screenshots captured!');
  } catch (err) {
    console.error('Capture error:', err);
  } finally {
    await browser.close();
  }
}

captureRealtimeFlow();
