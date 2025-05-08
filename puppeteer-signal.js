const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');
const { logSignal } = require('./logger');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function launchBrowser() {
  return await puppeteer.launch({
    executablePath: chromePath,
    headless: false,
    userDataDir: 'C:\\Users\\Yasin\\AppData\\Local\\Google\\Chrome\\User Data',
    args: ['--start-maximized', '--profile-directory=Profile 1'],
    defaultViewport: null
  });
}

function waitForNextCandle() {
  const now = new Date();
  const next = new Date(now);
  next.setSeconds(0);
  next.setMilliseconds(0);
  let minute = now.getMinutes();
  let nextMinute = minute % 2 === 0 ? minute + 2 : minute + 1;
  if (nextMinute >= 60) {
    next.setHours(now.getHours() + 1);
    nextMinute = 0;
  }
  next.setMinutes(nextMinute);
  const waitTime = next.getTime() - now.getTime();
  return new Promise(resolve => setTimeout(resolve, waitTime));
}

async function extractPrice(page) {
  return await page.evaluate(() => {
    const getValue = (title) => {
      const el = document.querySelector(`div[data-test-id-value-title="${title}"]`);
      return el ? el.textContent.trim() : null;
    };
    return {
      O: getValue('O'),
      H: getValue('H'),
      L: getValue('L'),
      C: getValue('C'),
    };
  });
}

(async () => {
  const browser = await launchBrowser();
  const page = await browser.newPage();
  await page.goto('https://www.tradingview.com/chart/');

  console.log("در حال انتظار برای لود چارت...");
  await page.waitForSelector('div[data-test-id-value-title="O"]', { timeout: 60000 }).catch(() => {
    console.log("چارت لود نشد.");
    process.exit(1);
  });

  while (true) {
    await waitForNextCandle();

    try {
      console.log("دریافت کندل جدید...");
      const ohlc = await extractPrice(page);

      if (ohlc.O && ohlc.C) {
        const signalType = parseFloat(ohlc.C) > parseFloat(ohlc.O) ? 'CALL' : 'PUT';
        const signalData = {
          pair: 'نماد تستی',
          price: ohlc.C,
          signalType,
          strategy: 'پایه‌ای - قیمت پایانی نسبت به ابتدایی'
        };
        logSignal(signalData);
      } else {
        console.log("خطا در دریافت قیمت.");
      }

      console.log("رفرش چارت برای کندل بعدی...");
      await page.reload({ waitUntil: ['networkidle0', 'domcontentloaded'] });

    } catch (err) {
      console.log("خطا:", err.message);
    }
  }
})();
