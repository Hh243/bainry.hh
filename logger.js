const fs = require('fs');
const path = require('path');

const logFilePath = path.join(__dirname, 'signals.txt');

function getShamsiDate() {
  const date = new Date();
  return date.toLocaleDateString('fa-IR');
}

function getTime() {
  return new Date().toLocaleTimeString('fa-IR');
}

function logSignal({ pair, price, signalType, strategy }) {
  const log = 
`زمان: ${getShamsiDate()} - ${getTime()}
جفت‌ارز: ${pair}
قیمت ورود: ${price}
سیگنال: ${signalType === 'CALL' ? 'خرید (CALL)' : 'فروش (PUT)'}
استراتژی: ${strategy}

--------------------------\n`;

  fs.writeFileSync(logFilePath, log, 'utf8');
  console.log("سیگنال در فایل ذخیره شد.");
}

module.exports = { logSignal };
