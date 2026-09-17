/**
 * scripts/seo/ping-indexnow.ts
 *
 * ยิงแจ้งเตือนบอตค้นหา (Bing, Yandex, Naver, Seznam ฯลฯ) ผ่าน IndexNow API
 * ทันทีที่มีการ Deploy หรืออัปเดต URL เนื้อหา
 *
 * รันด้วย: npx tsx scripts/seo/ping-indexnow.ts [--dry-run]
 */

import { DECK } from "../../src/data/cards";
import { SPREADS } from "../../src/data/spreads";
import { ARTICLES } from "../../src/data/articles";
import { SITE_ORIGIN } from "../../src/lib/config/site";

const INDEXNOW_KEY = "9a6df76e25d24b0785fce3bfdc89b142";
const HOST = "seertarot.net";
const KEY_LOCATION = `${SITE_ORIGIN}/${INDEXNOW_KEY}.txt`;

export function collectAllUrls(): string[] {
  const urls: string[] = [
    SITE_ORIGIN,
    `${SITE_ORIGIN}/cards`,
    `${SITE_ORIGIN}/cards/all`,
    `${SITE_ORIGIN}/cards/major`,
    `${SITE_ORIGIN}/cards/minor`,
    `${SITE_ORIGIN}/cards/wands`,
    `${SITE_ORIGIN}/cards/cups`,
    `${SITE_ORIGIN}/cards/swords`,
    `${SITE_ORIGIN}/cards/pentacles`,
    `${SITE_ORIGIN}/spreads`,
    `${SITE_ORIGIN}/blog`,
    `${SITE_ORIGIN}/daily`,
    `${SITE_ORIGIN}/love/1-card`,
    `${SITE_ORIGIN}/about`,
    `${SITE_ORIGIN}/contact`,
    `${SITE_ORIGIN}/privacy`,
    // English core
    `${SITE_ORIGIN}/en`,
    `${SITE_ORIGIN}/en/cards`,
    `${SITE_ORIGIN}/en/cards/all`,
    `${SITE_ORIGIN}/en/cards/major`,
    `${SITE_ORIGIN}/en/cards/minor`,
    `${SITE_ORIGIN}/en/cards/wands`,
    `${SITE_ORIGIN}/en/cards/cups`,
    `${SITE_ORIGIN}/en/cards/swords`,
    `${SITE_ORIGIN}/en/cards/pentacles`,
    `${SITE_ORIGIN}/en/spreads`,
    `${SITE_ORIGIN}/en/daily`,
    `${SITE_ORIGIN}/en/love/1-card`,
    `${SITE_ORIGIN}/en/contact`,
    `${SITE_ORIGIN}/en/privacy`,
  ];

  // 78 cards (TH + EN)
  for (const card of DECK) {
    urls.push(`${SITE_ORIGIN}/cards/${card.id}`);
    urls.push(`${SITE_ORIGIN}/en/cards/${card.id}`);
  }

  // 25 spreads (TH + EN)
  for (const spread of SPREADS) {
    urls.push(`${SITE_ORIGIN}/spreads/${spread.id}`);
    urls.push(`${SITE_ORIGIN}/en/spreads/${spread.id}`);
  }

  // Articles (TH + EN)
  for (const article of ARTICLES) {
    urls.push(`${SITE_ORIGIN}/blog/${article.slug}`);
    if (article.contentEn) {
      urls.push(`${SITE_ORIGIN}/en/blog/${article.slug}`);
    }
  }

  return Array.from(new Set(urls));
}

export async function pingIndexNow(isDryRun = false): Promise<boolean> {
  const urls = collectAllUrls();
  console.log(`[IndexNow] ตรวจพบ URL ทั้งหมด ${urls.length} รายการ`);

  if (isDryRun) {
    console.log(`[IndexNow] --dry-run โหมดจำลอง ไม่ได้ส่งคำขอจริง`);
    console.log(`[IndexNow] ตัวอย่าง URL: ${urls.slice(0, 5).join(", ")} ...`);
    return true;
  }

  const payload = {
    host: HOST,
    key: INDEXNOW_KEY,
    keyLocation: KEY_LOCATION,
    urlList: urls,
  };

  try {
    const res = await fetch("https://api.indexnow.org/indexnow", {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify(payload),
    });

    if (res.ok || res.status === 202) {
      console.log(`[IndexNow] สำเร็จ! สถานะ ${res.status} — แจ้งบอตเสิร์ชเอนจินเรียบร้อยแล้ว (${urls.length} URLs)`);
      return true;
    }

    console.warn(`[IndexNow] ได้รับรหัสสถานะ ${res.status}: ${res.statusText}`);
    return false;
  } catch (err) {
    console.error(`[IndexNow] เกิดข้อผิดพลาดในการส่งคำขอ:`, err);
    return false;
  }
}

if (process.argv[1]?.endsWith("ping-indexnow.ts")) {
  const dryRun = process.argv.includes("--dry-run");
  pingIndexNow(dryRun).then((ok) => process.exit(ok ? 0 : 1));
}
