#!/usr/bin/env node
/**
 * 🖼️ ภาพสินค้าในหน้าจ่ายเงิน Stripe (สี่เหลี่ยมจัตุรัส 1200×1200 · JPEG คุณภาพ 86 ราว 200 KB)
 * ---------------------------------------------------------------------------
 * หน้าจ่ายเงินของ Stripe แสดงภาพสินค้าตามสัดส่วนจริง — ภาพไพ่ดิบ (แนวตั้ง 1:1.72) จึงยืดยาว
 * ดูเหมือนภาพหลุดมา ไม่ใช่ภาพสินค้า · ไฟล์นี้ประกอบภาพสินค้าจากภาพไพ่ 1909 Rider-Waite ต้นฉบับ
 * บนผืนกำมะหยี่ขอบทอง (ภาษาภาพเดียวกับ `.consult-stage` ในเว็บ)
 *
 * วิธีใช้:  node scripts/generate-checkout-art.mjs
 * ต้องมี:   playwright-core + Chromium (ในเครื่อง cloud มีที่ /opt/pw-browsers)
 *           ตั้ง CHROMIUM_PATH ถ้า Chromium อยู่ที่อื่น
 * ผลลัพธ์: public/checkout/credits.jpg · public/checkout/consultation.jpg
 */
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const OUT_DIR = path.join(ROOT, "public", "checkout");
const SIZE = 1200;

const ART = [
  { file: "credits.jpg", cards: ["major-10.jpg", "pentacles-01.jpg", "major-19.jpg"] },
  { file: "consultation.jpg", cards: ["major-17.jpg", "major-02.jpg", "major-21.jpg"] },
];

const cardUrl = (name) => pathToFileURL(path.join(ROOT, "public", "cards", name)).href;
const fontUrl = pathToFileURL(path.join(ROOT, "public", "fonts", "noto-serif-thai-700.woff2")).href;

function html(cards) {
  const [left, center, right] = cards.map(cardUrl);
  return `<!doctype html><html><head><meta charset="utf-8"><style>
  @font-face { font-family: Brand; src: url("${fontUrl}") format("woff2"); font-weight: 700; }
  * { margin: 0; box-sizing: border-box; }
  body { width: ${SIZE}px; height: ${SIZE}px; overflow: hidden; }
  .stage {
    position: relative; width: 100%; height: 100%;
    background-color: #2E211A;
    background-image:
      radial-gradient(120% 70% at 50% -10%, rgba(210,163,84,0.34), transparent 62%),
      radial-gradient(80% 60% at 100% 100%, rgba(150,92,48,0.40), transparent 70%),
      radial-gradient(60% 50% at 0% 90%, rgba(90,52,30,0.55), transparent 70%);
  }
  .frame { position: absolute; inset: 44px; border: 2px solid rgba(210,163,84,0.42); border-radius: 48px; }
  .frame::after { content: ""; position: absolute; inset: 14px; border: 1px solid rgba(210,163,84,0.18); border-radius: 36px; }
  .fan { position: absolute; left: 50%; top: 170px; height: 690px; }
  .card {
    position: absolute; left: 0; top: 0; height: 100%; aspect-ratio: 1 / 1.72;
    border-radius: 22px; overflow: hidden; transform-origin: 50% 100%;
    box-shadow: 0 0 0 2px rgba(210,163,84,0.55), 0 40px 80px -24px rgba(0,0,0,0.75);
  }
  .card img { width: 100%; height: 100%; object-fit: cover; display: block; }
  .l { transform: translateX(-88%) translateY(34px) rotate(-14deg); }
  .c { transform: translateX(-50%); z-index: 2; }
  .r { transform: translateX(-12%) translateY(34px) rotate(14deg); }
  .brand {
    position: absolute; left: 0; right: 0; bottom: 118px; text-align: center;
    font-family: Brand, serif; font-weight: 700; font-size: 58px; letter-spacing: 0.06em; color: #D2A354;
  }
  .brand span { font-size: 34px; vertical-align: 10px; margin: 0 22px; opacity: 0.85; }
  </style></head><body><div class="stage">
    <div class="frame"></div>
    <div class="fan">
      <div class="card l"><img src="${left}"></div>
      <div class="card r"><img src="${right}"></div>
      <div class="card c"><img src="${center}"></div>
    </div>
    <div class="brand"><span>✦</span>SeerTarot<span>✦</span></div>
  </div></body></html>`;
}

const { chromium } = await import("playwright-core").catch(() => {
  console.error("ต้องติดตั้ง playwright-core ก่อน: npm i --no-save playwright-core");
  process.exit(1);
});
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || "/opt/pw-browsers/chromium-1194/chrome-linux/chrome",
});
const page = await browser.newPage({ viewport: { width: SIZE, height: SIZE } });
fs.mkdirSync(OUT_DIR, { recursive: true });
for (const art of ART) {
  const tmp = path.join(OUT_DIR, `.tmp-${art.file}.html`);
  fs.writeFileSync(tmp, html(art.cards));
  await page.goto(pathToFileURL(tmp).href);
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(200);
  await page.screenshot({ path: path.join(OUT_DIR, art.file), type: "jpeg", quality: 86 });
  fs.unlinkSync(tmp);
  console.log("✓", path.join("public/checkout", art.file));
}
await browser.close();
