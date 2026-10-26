# 🔎 ทะเบียนส่ง URL เข้า Google Search Console (Manual Indexing Request Log)

> **ทำไมต้องมีไฟล์นี้**: การกด "ขอการจัดทำดัชนี" ใน GSC ไม่มีประวัติย้อนหลังให้ดู
> ถ้าไม่จดไว้ รอบถัดไปจะไม่รู้ว่าทำถึงไหน แล้วจะยิงซ้ำหน้าเดิมจนเปลืองโควตารายวัน
> **กฎ**: ทุกครั้งที่ส่ง URL เข้า GSC ต้องมาต่อท้ายตารางนี้ทันที

- **พร็อพเพอร์ตี้**: `sc-domain:seertarot.net` — ในหน้าเลือกพร็อพเพอร์ตี้ของ GSC คือรายการที่ขึ้นว่า
  **`seertarot.net` เฉย ๆ (ไม่มี `https://` นำหน้า)** ➔ **ใช้ตัวนี้เสมอ**
  อีกรายการที่ขึ้นว่า `https://seertarot.net/` เป็นคนละพร็อพเพอร์ตี้ (แบบ URL-prefix)
  ครอบแค่พรีฟิกซ์นั้นเป๊ะ ๆ · **ถ้าเผลอส่งจากตัวนั้นต้องจดกำกับไว้ด้วย** ไม่งั้นทะเบียนนี้จะเพี้ยน
- **ลำดับการส่ง**: ไล่ตามลำดับใน `https://seertarot.net/sitemap.xml` (299 URL · ไทย 151 · อังกฤษ 148)
- **สถานะฝั่งอังกฤษ `/en/*`**: ส่งแล้ว **59 URL** · เหลือ **89 URL** ตรวจความพร้อมครบแล้วทุกเส้น
  ⏸️ **พักไว้ก่อน** — คำสั่งเจ้าของ 2026-09-09: _"ต้องทำฝั่งไทยให้เสร็จให้หมดก่อน เพราะเราทำตลาดไทย"_
- **สถานะฝั่งไทย 151 หน้า — 🚨 วิกฤตกว่าที่เคยเข้าใจ**
  รายงาน "การจัดทำดัชนีหน้า" (4/9/26) ระบุ **127 หน้าไทยติดสถานะ `พบแล้ว - ยังไม่ได้จัดทำดัชนี`**
  และคอลัมน์ Crawl ขึ้น `1970-01-01` ทุกแถว = **Google ไม่เคยเข้ามาคลานเลยสักครั้ง**
  ➔ หน้าไทยที่ถูกคลานแล้วมีแค่ **24 จาก 151** · **นี่คือคิวหลัก ไม่ใช่ `/en`**
  🔄 **อัปเดต 2026-09-27 (API)**: เข้าดัชนีแล้ว **50 / 180** หน้าไทย — ดูหัวข้อ "ผลจริงครั้งแรกจาก API"

---

## 🔌 ดึงข้อมูลผ่าน API — `npm run seo:gsc` (เพิ่ม 2026-09-27)

ไม่ต้องส่งออกไฟล์จากหน้า GSC มาให้ AI อีก — ใช้ Service Account **ของโปรเจกต์เราเอง** ยิงถาม API ตรง

| คำสั่ง | ได้อะไร |
|---|---|
| `npm run seo:gsc` | คำค้นไทย 28 วันล่าสุด — คลิก · แสดงผล · อันดับเฉลี่ย · นับกี่คำติดหน้าแรก |
| `npm run seo:gsc -- pages` | หน้าไหนขึ้นผลค้นหาเท่าไร |
| `npm run seo:gsc -- pairs` | คำค้นไทย ➔ หน้าที่ Google เอาไปแสดง — ใช้ตัดสินว่าต้องแก้ title หน้าไหน (เพิ่ม 2026-10-16 · workflow เก็บทุกสัปดาห์) |
| `npm run seo:gsc -- inspect` | สถานะดัชนีทุกหน้าไทยใน sitemap จริง (`--en` / `--all` ได้) · ใช้โควตา 2,000 ครั้ง/วัน |
| `npm run seo:gsc -- sitemaps --submit` | ส่ง `sitemap.xml` ซ้ำ + ดูว่า Google โหลดล่าสุดเมื่อไร |

ตัวเลือก: `--days <n>` · `--limit <n>` · `--json <ไฟล์>`

**ตั้งค่าครั้งเดียว (เจ้าของทำ)**:
1. Google Cloud Console → สร้าง/เลือกโปรเจกต์ของ SeerTarot → เปิด **Google Search Console API**
2. IAM → Service Accounts → สร้างบัญชี (เช่น `seertarot-gsc`) → Keys → Add key → JSON
3. GSC พร็อพเพอร์ตี้ `seertarot.net` → การตั้งค่า → ผู้ใช้และสิทธิ์ → เพิ่มอีเมล `…iam.gserviceaccount.com` สิทธิ์ **เต็ม** (ไม่ต้องให้ "เจ้าของ")
4. ใส่เนื้อหาไฟล์ JSON เป็น secret `GSC_SERVICE_ACCOUNT_JSON` ในการตั้งค่า environment (วางทั้งก้อนหรือ base64 ก็ได้) — **ห้ามวางในแชท/commit ลงเรโป**

**รันอัตโนมัติทุกวันจันทร์ 09:07 น.** ด้วย [`.github/workflows/seo-gsc.yml`](../.github/workflows/seo-gsc.yml)
(ใช้ repository secret `GSC_SERVICE_ACCOUNT_JSON` · ดูผลที่หน้า Summary ของ run · กด Run workflow เองได้)
Service Account ที่ใช้: `seertarot-gsc@tarot-web-507218.iam.gserviceaccount.com` (สิทธิ์ "เต็ม")
⛔ **ห้าม commit ไฟล์กุญแจลงรีโป** — รีโปเป็นสาธารณะ และ Google สแกนเจอจะปิดกุญแจทันที

> ⚠️ ปุ่ม **"ขอการจัดทำดัชนี" ยังไม่มีใน API** (Indexing API รองรับแค่ `JobPosting`/`BroadcastEvent`)
> API บอกได้ว่า**หน้าไหนยังไม่เข้า** แต่การกดขอยังต้องทำมือตาม "ขั้นตอนมาตรฐาน" ด้านล่าง

### 📊 GA4 — `npm run seo:ga4` (เพิ่ม 2026-10-17)

ใช้ Service Account ตัวเดียวกัน อ่านพฤติกรรมผู้ใช้จาก GA4 พร็อพเพอร์ตี้ **SeerTarot Web `552869134`**

| คำสั่ง | ได้อะไร |
|---|---|
| `npm run seo:ga4` | ภาพรวม ผู้ใช้ · เซสชัน · อัตรามีส่วนร่วม เทียบช่วงก่อนหน้า |
| `npm run seo:ga4 -- channels` / `sources` | ช่องทางและแหล่งที่พาคนมา |
| `npm run seo:ga4 -- landing` / `pages` | หน้าแรกที่คนเข้ามาเจอ · หน้าที่ถูกเปิดดู |
| `npm run seo:ga4 -- funnel` | เริ่มเปิดไพ่ ➔ อ่านจบ ➔ แชร์ / ดูแพ็กเกจ / ปรึกษาแม่หมอ |
| `npm run seo:ga4 -- events` / `devices` | อีเวนต์ทั้งหมด · อุปกรณ์ |

**ตั้งค่าครั้งเดียว (เจ้าของทำ)**:
1. เปิด **Google Analytics Data API** ในโปรเจกต์ `tarot-web-507218`
2. GA4 → ผู้ดูแลระบบ → คอลัมน์**พร็อพเพอร์ตี้** SeerTarot Web → การจัดการสิทธิ์เข้าถึงพร็อพเพอร์ตี้ → เพิ่ม `seertarot-gsc@tarot-web-507218.iam.gserviceaccount.com` บทบาท **ผู้ดู**
   ⚠️ อย่าเพิ่มที่ระดับบัญชี — บัญชี Default Account for Firebase มีพร็อพเพอร์ตี้อื่นปนอยู่หลายตัว

**รันอัตโนมัติทุกวันจันทร์ 09:17 น.** ด้วย [`.github/workflows/seo-ga4.yml`](../.github/workflows/seo-ga4.yml) · ได้ 403 = ข้อ 1 หรือ 2 ยังไม่เสร็จ
GA4 ยังไม่มีอีเวนต์ซื้อแพ็กเกจ — ยอดซื้อจริงดูที่ `/admin`

---

## 🇹🇭 2026-10-26 — คิวใหม่จาก API: 76 หน้าไทยที่ยังไม่เข้าดัชนี (3 ชุด) ⭐ **ใช้ชุดนี้แทนคิว 2026-10-20**

> ที่มา: `npm run seo:gsc -- inspect` ใน workflow run [40287477998](https://github.com/luminuy/tarot-web/actions/runs/40287477998) (2026-10-26 · รายสัปดาห์)
> เข้าดัชนีแล้ว **126 / 202** หน้าไทย (2026-10-19 = 84 · +42 ใน 1 สัปดาห์) · ยังไม่เข้า 76 = Google ไม่รู้จัก 21 · พบแล้วแต่ไม่เคยคลาน 53 · คลานแล้วไม่เก็บ 2
> ✅ ตรวจความพร้อมแล้ว 2026-10-26 ยิงจริงบน production ครบ 76 เส้น: HTTP 200 · ไม่มี `noindex` · `canonical` ชี้ตัวเอง — **กดได้ทันที**
> คิว 2026-10-20 ด้านล่างไม่มีชุดไหนถูกติ๊กว่ากดแล้ว (42 หน้าในคิวนั้นเข้าดัชนีเอง) — **อย่าไล่ตามคิวเก่า**
> ⚠️ เซสชัน Claude บนคลาวด์ที่ทำคิวนี้ **ไม่ได้กดขอ** (ไม่มีเบราว์เซอร์ที่ล็อกอิน GSC · API ไม่มีปุ่มนี้) — เจ้าของกดมือตามขั้นตอนมาตรฐานท้ายไฟล์ แล้วติ๊ก `[x]` พร้อมวันที่

### [ ] ชุด 1 — 21 หน้าที่ Google ไม่รู้จัก URL + ผังพยากรณ์ 5 + ไพ่ชุดใหญ่ 4 (30 หน้า) ⭐ **ทำก่อน**

`/blog/how-to-ask-tarot-questions` `/blog/tarot-history-1909-rider-waite` `/blog/tarot-job-interview-one-card` `/blog/tarot-single-timing-love` `/blog/the-fool-journey-meaning` `/blog/the-wheel-of-fortune-meaning` `/cards/cups-02` `/cards/cups-04` `/cards/cups-14` `/cards/pentacles-06` `/cards/pentacles-08` `/cards/pentacles-09` `/cards/pentacles-11` `/cards/pentacles-14` `/cards/swords-01` `/cards/swords-09` `/cards/swords-13` `/cards/wands-12` `/contact` `/spreads/career-switch` `/spreads/topic/study` `/spreads/inner-potential` `/spreads/mind-body-spirit` `/spreads/situation-solution` `/spreads/study` `/spreads/topic/health` `/cards/major-05` `/cards/major-09` `/cards/major-11` `/cards/major-13`

### [ ] ชุด 2 — ไพ่ชุดใหญ่ที่เหลือ + บทความ 10 + ไพ่ถ้วย/เหรียญ/ดาบ (30 หน้า)

`/cards/major-20` `/blog/ai-tarot-oracle-vs-human-reader` `/blog/tarot-7-chakras-spread` `/blog/tarot-daily-card-guide` `/blog/tarot-ex-return-signs` `/blog/tarot-love-3-cards-feelings` `/blog/tarot-wealth-money-cards` `/blog/tarot-yes-no-spread-guide` `/blog/the-devil-love-tarot-guide` `/blog/the-tower-and-death-meaning` `/blog/top-10-soulmate-tarot-cards` `/cards/cups-01` `/cards/cups-03` `/cards/cups-05` `/cards/cups-06` `/cards/cups-07` `/cards/cups-08` `/cards/cups-09` `/cards/cups-11` `/cards/cups-12` `/cards/cups-13` `/cards/pentacles-02` `/cards/pentacles-05` `/cards/pentacles-07` `/cards/pentacles-10` `/cards/swords-02` `/cards/swords-06` `/cards/swords-07` `/cards/swords-08` `/cards/swords-11`

### [ ] ชุด 3 — ไพ่ไม้เท้า + หน้าข้อมูลเว็บ + 2 หน้าที่คลานแล้วไม่เก็บ (16 หน้า)

`/cards/swords-14` `/cards/wands-01` `/cards/wands-02` `/cards/wands-03` `/cards/wands-04` `/cards/wands-05` `/cards/wands-06` `/cards/wands-07` `/cards/wands-08` `/cards/wands-09` `/cards/wands-11` `/cards/wands-14` `/about` `/privacy` `/cards/minor` `/spreads/ex-reconciliation`

> 📌 `/cards/minor` (คลานล่าสุด 2026-09-14) และ `/spreads/ex-reconciliation` (2026-09-29) "รวบรวมข้อมูลแล้ว - ยังไม่ได้จัดทำดัชนี" ติดต่อกันหลายรอบ = Google เลือกไม่เก็บ กดซ้ำอาจไม่ช่วย ต้องดูเนื้อหาหน้า (ซ้ำกับหน้ารวม/หน้าผังอื่นมากไปไหม)
> 📌 หลังกิ่ง `claude/hopeful-knuth-j66hv9` (PR #721) ขึ้น production: หน้าผัง `/spreads/<id>` และหน้าหมวด `/spreads/topic/*` เนื้อหา/ลิงก์บนหน้าเปลี่ยนจริง (ไพ่ผังกลาง) ➔ รัน `npm run seo:ping` (IndexNow · Bing/Yandex) อีกรอบ

## 📊 2026-10-26 — ผล GSC รายสัปดาห์ + สิ่งที่แก้ (run [40287477998](https://github.com/luminuy/tarot-web/actions/runs/40287477998) · 28 วัน)

| ตัวชี้วัด | 2026-10-19 | **2026-10-26** |
|---|---:|---:|
| ทั้งเว็บ (รายหน้า) | คลิก 539 · แสดงผล 13,523 · 154 หน้า | **คลิก 877 · แสดงผล 21,546 · 210 หน้า** |
| หน้าอันดับ ≤ 3 / ≤ 10 | 14 / 112 | **17 / 169** |
| คู่คำค้นไทย ➔ หน้า | 372 คู่ · คลิก 81 · แสดงผล 2,821 | **611 คู่ · คลิก 146 · แสดงผล 5,397** |
| หน้าไทยที่เข้าดัชนี | 84 / 202 | **126 / 202** |

> หน้าต่าง 28 วันสองรอบซ้อนกัน 21 วัน — บอกทิศทาง ไม่ใช่การเติบโตรายสัปดาห์

**คำที่ขยับ**: `ดูดวงไพ่ยิปซี ai` 4.6 ➔ 3.3 · `ไพ่ยิปซีรายเดือน` 25.1 ➔ 13.0 · `ไพ่ยิปซีรายวัน` 20.5 ➔ 16.6 · `ดูดวงครอบครัว` 8.6 ➔ 7.2 · `ดูดวงไพ่ยิปซี อดีต ปัจจุบัน อนาคต ฟรี` อันดับ 8.9 เท่าเดิม แต่แสดงผล 287 ➔ 707
**ยังไม่ขยับ**: `ดูดวงไพ่ยิปซีความรัก` 39.5 ➔ 38.9 — งานดันหน้า (รอบ 304 · PR #709) ขึ้น production ~2026-10-21 หลังช่วงข้อมูลส่วนใหญ่ของรอบนี้ ➔ **ไม่แก้ซ้ำ** วัดอีกครั้งรายงาน 2026-11-09 · ฝั่งโค้ดครบแล้ว (หน้าแรกลิงก์คำนี้ 3 จุด · ท้ายเว็บทุกหน้า · ผังลูก) ทางที่เหลือเป็นลิงก์จากนอกเว็บ (TikTok · Facebook · LINE OA ชี้มาที่ `/spreads/topic/love`)
**คำใหญ่** `ดูดวง` · `ดูดวงไพ่ยิปซี` · `ดูดวงฟรี` ไม่อยู่ใน 50 คำแรกตามจำนวนแสดงผล — ยังแข่งเจ้าใหญ่ไม่ได้

**title ที่แก้รอบนี้** (หน้าที่ไม่ได้อยู่ในชุดรอบ 244 — 9 หน้าของรอบ 244 ยังอยู่ในช่วงรอวัดผล ไม่แตะซ้ำ):

| หน้า | คำค้นที่มาขึ้น (แสดงผล · อันดับ · CTR) | title ใหม่ |
|---|---|---|
| `/love/1-card` | ไพ่ยิปซี ความรัก 1 ใบ 77 · 9.1 · 2.6% + ไพ่ยิปซีความรัก 1 ใบ 29 · 0% | ไพ่ยิปซีความรัก 1 ใบ ดูดวงความรักแม่น ๆ ไขคำตอบหัวใจ (+ description ขึ้นต้นวลีเดียวกัน) |
| `/spreads/weekly` | ดูดวงไพ่ยิปซี 7 วันข้างหน้า 139 · 6.7 · 2.9% | ดูดวงไพ่ยิปซี 7 วันข้างหน้า รายสัปดาห์ 7 ใบ ฟรี |
| `/spreads/luck` | ไพ่ยิปซีโชคลาภ 42 · 9.7 · 4.8% | ไพ่ยิปซีโชคลาภ ดูดวงเสี่ยงโชค 4 ใบ |

- sitemap: lastModified 2026-10-26 ให้หน้าผัง 26 + หน้าหมวด 6 (สองภาษา) เพราะไพ่ผังกลางเปลี่ยนภาพผัง/ลิงก์บนหน้าจริง · หน้าที่แก้แค่ title ไม่ขยับ lastModified (กติกาใน `src/app/sitemap.ts`)
- อยู่ในกิ่ง `claude/hopeful-knuth-j66hv9` (PR #721 · draft รอเจ้าของดู preview) — **ยังไม่ขึ้น production**
- **วัดผล**: รายงาน 2026-11-09 และ 2026-11-16 ดู `pairs` ของ 3 หน้านี้ + 9 หน้าของรอบ 244

---

## 🇹🇭 2026-10-20 — คิวใหม่จาก API: 118 หน้าไทยที่ยังไม่เข้าดัชนี (4 ชุด) (เก่า — ใช้คิว 2026-10-26 ด้านบนแทน)

> ที่มา: `npm run seo:gsc -- inspect` ใน workflow run [39217517780](https://github.com/luminuy/tarot-web/actions/runs/39217517780) (2026-10-19)
> เข้าดัชนีแล้ว **84 / 202** หน้าไทย (รอบ 2026-10-16 = 76) · ยังไม่เข้า 118 = Google ไม่รู้จัก 20 · พบแล้วแต่ไม่เคยคลาน 96 · คลานแล้วไม่เก็บ 2
> ✅ ตรวจความพร้อมแล้ว 2026-10-20 ยิงจริงบน production ครบ 118 เส้น: HTTP 200 · ไม่มี `noindex` · `canonical` ชี้ตัวเอง — **กดได้ทันที**
> คิว 5 ชุดของ 2026-09-09 ด้านล่างเก่าแล้ว (หลายหน้าเข้าดัชนีไปเอง) — **อย่าไล่ตามคิวเก่า**
> **กดจบชุดไหน มาติ๊ก `[x]` พร้อมวันที่ทันที** · รอบก่อน ๆ กดได้ 30 หน้าต่อรอบไม่ติดโควตา

### [ ] ชุด 1 — หน้าฮับ `/questions` + 20 หน้าที่ Google ไม่รู้จักเลย + ผังยอดนิยม 9 (30 หน้า) ⭐ **ทำก่อน**

หน้าที่ "ไม่รู้จัก URL" คือ Google ยังไม่เจอแม้แต่ลิงก์ — กดขอคือทางเดียวที่เร็ว · ผังพยากรณ์เป็นหน้าที่คนเข้ามาเปิดไพ่จริง

`/questions` `/blog/celtic-cross-spread-guide` `/blog/major-arcana-22-cards-complete-guide` `/blog/provably-fair-tarot-guide` `/blog/tarot-and-carl-jung-psychology` `/blog/the-lovers-card-meaning` `/cards/cups-10` `/cards/major-16` `/cards/pentacles-01` `/cards/pentacles-12` `/cards/swords-03` `/cards/swords-04` `/cards/swords-10` `/cards/swords-12` `/cards/wands-13` `/questions/is-there-someone-else` `/questions/should-i-change-jobs` `/questions/should-i-quit-my-job` `/questions/what-should-i-ask-tarot` `/questions/will-my-business-succeed` `/spreads/chakra` `/spreads/money` `/spreads/career` `/spreads/decision` `/spreads/daily` `/spreads/weekly` `/spreads/year-ahead` `/spreads/family` `/spreads/luck` `/spreads/love-six`

### [ ] ชุด 2 — ผังที่เหลือ + หน้าคำถาม + บทความ 14 (30 หน้า)

`/spreads/career-switch` `/spreads/ex-reconciliation` `/spreads/inner-potential` `/spreads/mind-body-spirit` `/spreads/quick` `/spreads/situation-solution` `/spreads/study` `/spreads/topic/health` `/spreads/topic/study` `/questions/how-are-my-finances-this-year` `/questions/how-often-should-i-read-tarot` `/questions/how-will-my-new-job-go` `/questions/what-does-he-think-of-me` `/questions/will-he-contact-me` `/questions/will-i-get-the-job` `/questions/will-my-family-get-along` `/blog/ai-tarot-oracle-vs-human-reader` `/blog/how-to-ask-tarot-questions` `/blog/how-to-read-tarot-for-beginners` `/blog/minor-arcana-4-suits-guide` `/blog/reversed-tarot-cards-guide` `/blog/tarot-7-chakras-spread` `/blog/tarot-daily-card-guide` `/blog/tarot-ex-return-signs` `/blog/tarot-history-1909-rider-waite` `/blog/tarot-job-interview-one-card` `/blog/tarot-love-3-cards-feelings` `/blog/tarot-love-reading-guide` `/blog/tarot-single-timing-love` `/blog/tarot-wealth-money-cards`

> 📌 `/spreads/ex-reconciliation` สถานะ "รวบรวมข้อมูลแล้ว - ยังไม่ได้จัดทำดัชนี" = Google คลานแล้วแต่เลือกไม่เก็บ กดซ้ำอาจไม่ช่วย ถ้ารอบหน้ายังไม่เข้าต้องดูที่เนื้อหาหน้า

### [ ] ชุด 3 — บทความที่เหลือ + ไพ่รายใบ 24 (30 หน้า)

`/blog/tarot-yes-no-spread-guide` `/blog/the-devil-love-tarot-guide` `/blog/the-fool-journey-meaning` `/blog/the-tower-and-death-meaning` `/blog/the-wheel-of-fortune-meaning` `/blog/top-10-soulmate-tarot-cards` `/cards/cups-01` `/cards/cups-02` `/cards/cups-03` `/cards/cups-04` `/cards/cups-05` `/cards/cups-06` `/cards/cups-07` `/cards/cups-08` `/cards/cups-09` `/cards/cups-11` `/cards/cups-12` `/cards/cups-13` `/cards/cups-14` `/cards/major-05` `/cards/major-09` `/cards/major-11` `/cards/major-13` `/cards/major-20` `/cards/minor` `/cards/pentacles-02` `/cards/pentacles-05` `/cards/pentacles-06` `/cards/pentacles-07` `/cards/pentacles-08`

> 📌 `/cards/minor` สถานะ "รวบรวมข้อมูลแล้ว - ยังไม่ได้จัดทำดัชนี" เหมือนกัน (คลานล่าสุด 2026-09-14)

### [ ] ชุด 4 — ไพ่รายใบที่เหลือ + หน้าข้อมูลเว็บ (28 หน้า)

`/cards/pentacles-09` `/cards/pentacles-10` `/cards/pentacles-11` `/cards/pentacles-14` `/cards/swords-01` `/cards/swords-02` `/cards/swords-06` `/cards/swords-07` `/cards/swords-08` `/cards/swords-09` `/cards/swords-11` `/cards/swords-13` `/cards/swords-14` `/cards/wands-01` `/cards/wands-02` `/cards/wands-03` `/cards/wands-04` `/cards/wands-05` `/cards/wands-06` `/cards/wands-07` `/cards/wands-08` `/cards/wands-09` `/cards/wands-11` `/cards/wands-12` `/cards/wands-14` `/about` `/contact` `/privacy`

### หลังจบ 4 ชุด

ดูผลได้จากรายงานรายสัปดาห์ (workflow `seo-gsc.yml` วันจันทร์) บรรทัด "เข้าดัชนีแล้ว x / 202" — ไม่ต้อง inspect เองทีละหน้า

---

## 🛠️ 2026-10-16 (รอบ 244) — แก้ตามผล GSC: title/description ตามคำค้นจริง + ลิงก์ภายในที่ขาด

**ข้อมูลที่ใช้**: โหมดใหม่ `seo:gsc -- pairs` (run [38854232058](https://github.com/luminuy/tarot-web/actions/runs/38854232058) · 318 คู่คำค้นไทย ➔ หน้า) — รู้ว่าคำค้นไหนไปขึ้นหน้าไหน

**ข้อผิดพลาดที่เจอ (หาสาเหตุราก)**: หน้าที่ยังไม่เข้าดัชนีมีลิงก์ภายในเข้าเฉลี่ย **30** หน้า เทียบกับ **65** ของหน้าที่เข้าแล้ว
· `/spreads/weekly` `year-ahead` `monthly-ten` มีลิงก์เข้าแค่ **2** หน้า (ตัวเอง + หน้ารวม) ขณะที่ผังหัวหมวดได้ 231
· ต้นเหตุ: แถว "ผังอื่นที่น่าสนใจ" และ "บทความที่เกี่ยวข้อง" เลือก n ตัวแรกของหมวดชุดเดิมทุกหน้า (`filter` + `slice`)
➔ แก้เป็นหมุนวนตามตำแหน่ง (`src/lib/seo/rotating-neighbors.ts`) · วัดจากบิลด์จริง: ทุกหน้าที่เคยได้ 2–3 ลิงก์ ➔ **6** · บันทึก INCIDENT_LOG + ด่าน `test-seo-wave4` หัวข้อ 4.1

**title / description ที่แก้ (ใส่วลีที่คนค้นจริงไว้ต้นประโยค)**:

| หน้า | คำค้นที่มาขึ้น (แสดงผล · อันดับ) | title ใหม่ |
|---|---|---|
| `/spreads/three-card` | เปิดไพ่ 3 ใบ 277 · 9.9 | เปิดไพ่ 3 ใบ ดูดวงไพ่ยิปซี อดีต ปัจจุบัน อนาคต ฟรี (+ description ใหม่) |
| `/blog/tarot-4-cards-love-career` | เปิดไพ่ 4 ใบ 188 · ไพ่4ใบ 59 · เปิดไพ่4ใบ 46 | เปิดไพ่ 4 ใบ ดูดวงไพ่ยิปซีความรักและการงาน ฟรี (+ description) |
| `/spreads/monthly` | สุ่มไพ่ 4 ใบ 13 · 3.2 | title เดิม · description ขึ้นต้น "เปิดไพ่ 4 ใบ" |
| `/spreads/celtic-cross` | ไพ่ทาโร่ 10 ใบ (~20) | ดูดวงไพ่ยิปซี ไพ่ทาโร่ 10 ใบ เซลติกครอส ฟรี |
| `/spreads/topic/family` | ดูดวงบริวาร 19 · ดูดวงเรื่องครอบครัว 10 | ดูดวงครอบครัว ดูดวงบริวาร ด้วยไพ่ยิปซี แม่น ๆ ฟรี |
| `/spreads/topic/money` | การเงิน โชคลาภ 12 · 23 | ดูดวงการเงิน โชคลาภ ด้วยไพ่ยิปซี — กระแสเงิน เสี่ยงโชค ฟรี |
| `/cards/zodiac` | ไพ่ราศี 14 · ไพ่ประจําราศี 13 | ไพ่ประจำราศี 12 ราศี — ดูดวงไพ่ยิปซีตามวันเกิด ฟรี (+ description) |
| `/cards/birth-card` | ไพ่ประจำตัว 26 · 8.9 · 0 คลิก | คำนวณไพ่ประจำตัว ไพ่ทาโรต์ประจำวันเกิด (Birth Card) ฟรี |
| `/blog/the-moon-love-tarot-guide` | the moon ความรัก / ความหมาย ~50 · 0 คลิก | ไพ่ The Moon ความรัก ความหมายหัวตั้ง กลับหัว เขาคิดอะไรอยู่ |

- meta keywords ของหน้าผังทั้ง 26 หน้าเพิ่ม `เปิดไพ่ N ใบ` · `สุ่มไพ่ N ใบ` · `ดูดวง N ใบ` · `ไพ่ทาโร่ N ใบ`
- sitemap: lastModified 2026-10-16 ให้หน้าผัง 26 + บทความ 30 (สองภาษา = 112 URL) เพราะลิงก์บนหน้าเปลี่ยนจริง
- **ไม่ได้แตะ**: แม่แบบ title หน้าไพ่รายใบ 78 ใบ (`/cards/major-18` ติด "the moon ความหมาย" อันดับ 10 อยู่แล้ว แบบ title ถูกต้อง — เป็นเรื่องอันดับ ไม่ใช่ CTR) · หน้าแรก (คำค้น `sai เคราะห์` ไม่เกี่ยว)
- **วัดผล**: รอ 2–4 สัปดาห์ แล้วดู `pairs` ของ 9 หน้านี้เทียบ CTR/อันดับกับตารางข้างบน
- **ขึ้นจริงแล้ว** (PR #673 · deploy run 38856475762 สำเร็จ 2026-10-16 12:41 น.) — ตรวจ title จริงบน seertarot.net ตรงกับตาราง · sitemap มี 112 URL วันที่ 2026-10-16
- **IndexNow**: 116 URL (หน้าผัง 26 × 2 ภาษา · บทความไทย 30 + อังกฤษที่มีฉบับแปล · `/cards/zodiac` · `/cards/birth-card` · `/spreads/topic/family` · `/spreads/topic/money`) ➔ HTTP 200

---

## 📊 2026-10-16 — ดึงผล GSC รอบใหม่ (28 วัน · workflow run [38852241290](https://github.com/luminuy/tarot-web/actions/runs/38852241290))

> ผลดิบ JSON (คำค้นไทย · หน้า · สถานะดัชนี) อยู่ใน artifact `gsc-report` ของ run นั้น (เก็บถึง 2027-01-14) — ไม่ commit ลงรีโป

| ตัวชี้วัด | 2026-09-27 (90 วัน) | **2026-10-16 (28 วัน)** |
|---|---:|---:|
| หน้าไทยที่เข้าดัชนี | 50 / 180 | **76 / 202** |
| พบแล้ว - ยังไม่ได้จัดทำดัชนี | 116 | 112 |
| Google ไม่รู้จัก URL | 11 | 12 |
| คำค้นไทย | 59 คำ · แสดงผล 105 · คลิก 1 | **284 คำ · แสดงผล 1,988 · คลิก 52** |
| คำค้นไทยอันดับ ≤ 3 / ≤ 10 | 0 / 7 | **13 / 183** |
| ทั้งเว็บ (รายหน้า) | คลิก 102 | **คลิก 409 · แสดงผล 10,728** · 145 หน้า (≤ 10: 102 หน้า) |
| sitemap | 358 URL · โหลด 2026-09-26 | 402 URL · Google โหลดล่าสุด 2026-10-15 · error 0 |

**หน้าที่แสดงผลเยอะแต่คลิกน้อย (อันดับดีแล้ว — แก้ title/description ได้ผลเร็วสุด)**:

| หน้า | อันดับ | แสดงผล | คลิก | CTR |
|---|---:|---:|---:|---:|
| `/spreads/three-card` | 8.8 | 1,324 | 31 | 2.3% |
| `/blog/tarot-4-cards-love-career` | 8.7 | 565 | 8 | 1.4% |
| `/cards/all` | 8.6 | 466 | 9 | 1.9% |
| `/cards/zodiac` | 6.1 | 416 | 4 | 1.0% |
| `/en/cards/birth-card` | 19.4 | 369 | 0 | 0% |
| `/blog/the-moon-love-tarot-guide` | 6.5 | 239 | 0 | 0% |
| `/cards` | 7.8 | 208 | 1 | 0.5% |
| `/en/cards/major-03` | 10.1 | 204 | 0 | 0% |
| `/blog` | 3.0 | 159 | 0 | 0% |

หน้าที่ทำได้ดี: หน้าแรก 212 คลิก (CTR 21.5%) · `/cards/birth-card` 31 คลิก อันดับ 5.9 · `/daily` 21 คลิก อันดับ 5.2 · `/spreads/yes-no` 16 คลิก · `/readers` 12 คลิก อันดับ 3.8

**สัญญาณจากคำค้น**:
- **"เปิดไพ่ 4 ใบ" กลุ่มใหญ่สุดที่ยังไม่มีคลิก** — `เปิดไพ่ 4 ใบ` 188 · `ไพ่4ใบ` 59 · `เปิดไพ่4ใบ` 46 · `ไพ่ยิปซี ความรัก 4 ใบ` 37 · `สุ่มไพ่ 4 ใบ` 14 (รวม ~350 แสดงผล · 1 คลิก) — มีผัง 4 ใบอยู่ 4 ผังใน `src/data/spreads.ts` แต่ไม่มีหน้ารวม "เปิดไพ่ 4 ใบ" ตรง ๆ
- `เปิดไพ่ 3 ใบ` 277 แสดงผล อันดับ 9.9 แค่ 2 คลิก ➔ ตรงกับ CTR ต่ำของ `/spreads/three-card`
- `the moon ความหมาย` + `the moon ความรัก` (หลายแบบรวม ~90 แสดงผล · 0 คลิก) ➔ ตรงกับ `/blog/the-moon-love-tarot-guide`
- `ดูดวงไพ่ยิปซีความรัก` ยังอันดับ 39.5 · `ความหมายไพ่ทาโร่ 78 ใบ` อันดับ 38.1 · `ไพ่ยิปซีรายวัน` 19.4

**Google ไม่รู้จัก URL 12 หน้า ➔ กด "ขอการจัดทำดัชนี" ก่อน** (ต้องทำมือใน GSC):
`/blog/ai-tarot-oracle-vs-human-reader` · `/blog/tarot-and-carl-jung-psychology` · `/blog/tarot-wealth-money-cards` · `/blog/the-devil-love-tarot-guide` · `/cards/cups-01` · `/cards/cups-07` · `/cards/major-16` · `/cards/pentacles-09` · `/cards/wands-06` · `/spreads/family` · `/spreads/situation-solution` · `/spreads/weekly`

**หน้าที่ยังไม่เข้าดัชนีเป็นกลุ่ม**: `/questions` ทั้ง 21 หน้า รวมหน้ารวม (เปิด 2026-10-07 · ยังไม่เคยถูกคลาน) · ไพ่ชุดเล็กส่วนใหญ่ · บทความ 25 หน้า · `/about` `/contact` `/privacy` · `/cards/minor` กับ `/spreads/ex-reconciliation` คลานแล้วแต่ไม่จัดทำดัชนี (คุณภาพ/ซ้ำซ้อน — ควรดูเนื้อหา)

---

## 📡 2026-09-27 (หลัง #631 deploy) — แจ้งเครื่องมือค้นหาว่าหน้าเปลี่ยน

- IndexNow: 23 URL (หน้าแรก · `/en` · `/pick-a-card` · `/spreads` · `/spreads/topic/love` · `/cards` `/cards/all` `/cards/major` `/cards/minor` · `/cards/zodiac/*` 12) ➔ HTTP 200
- sitemap: lastModified ของ 23 หน้านี้ = 2026-09-27 (ขึ้นจริงหลัง PR รอบ 188 merge) ➔ แล้วสั่ง workflow `seo-gsc.yml` แบบ `submit_sitemap: true`
- ⚠️ ยังไม่ได้กด "ขอการจัดทำดัชนี" ใน GSC (ไม่มีใน API) — รอบหน้าที่มีเบราว์เซอร์ให้กด 6 หน้า: `/` `/daily` `/spreads/topic/love` `/cards` `/cards/zodiac/cancer` `/pick-a-card`

---

## 🎯 2026-09-27 — อ่านผลเพื่อทำอันดับ (28 วัน · ต่อจากรอบบน)

**หน้าที่เกือบถึงหน้าแรก (อันดับ 8–17) — ดันง่ายสุด**:

| หน้า | อันดับเฉลี่ย | แสดงผล | คลิก |
|---|---:|---:|---:|
| `/spreads/three-card` | 13.1 | 152 | 0 |
| `/cards` | 16.7 | 107 | 0 |
| `/daily` | 11.9 | 99 | 8 |
| `/love/1-card` | 10.6 | 80 | 1 |
| `/cards/all` | 14.4 | 62 | 1 |
| `/spreads/yes-no` | 10.0 | 56 | 0 |
| `/en/cards/major-03` | 13.9 | 223 | 0 |

**สัญญาณจากคำค้นที่ควรรู้**:
- คนค้น `ความหมายไพ่ยิปซี 78 ใบ pdf` หลายแบบ (รวม ~9 แสดงผล) — เรายังไม่มีไฟล์/หน้าพิมพ์ ➔ โอกาสทำหน้า "พิมพ์/บันทึกเป็น PDF" ใน `/cards/all`
- คนสะกด `ไพ่ทาโร่` (ไม่มี ต์) บ่อย — ทั้งเว็บมีคำนี้แค่ใน `home-seo.ts`
- `ดูดวงไพ่ยิปซีรายเดือน` อันดับ 19.5 ทั้งที่ `/spreads/monthly` ยังไม่เข้าดัชนี

**ยิปซี vs ทาโร่ (Google Trends ไทย 12 เดือน)**: ความหมายไพ่… ยิปซี 41 · **ทาโร่ 47** · ทาโรต์ 2 ｜ ดูดวงไพ่… ยิปซี 84 · ทาโร่ 4 ｜ เปิดไพ่… ยิปซี 63 · ทาโร่ 4 ｜ ไพ่… 3 ใบ ยิปซี 59 · ทาโร่ 1
➔ หน้าดูดวงใช้ "ไพ่ยิปซี" · หน้าความหมายไพ่ใช้คู่ "ไพ่ทาโร่ + ไพ่ยิปซี" · "ทาโรต์" แทบไม่มีคนค้น (แก้แล้วรอบ 185)

**ต้นเหตุที่แก้แล้วรอบนี้ (หน้ากำพร้า)**: `/pick-a-card` ไม่มีลิงก์ไปหน้าหัวข้อ 8 หน้า · `/spreads` ไม่มีลิงก์ไป `/spreads/topic/*` 6 หน้า ➔ เติมลิงก์ `<a href>` ใน HTML แล้ว
**ยังต้องทำมือใน GSC (เจ้าของ)**: กด "ขอการจัดทำดัชนี" หน้าที่ขึ้นว่า "Google ไม่รู้จัก URL" 17 หน้า (รายชื่อดูที่ผล workflow `seo-gsc.yml`) — เริ่มจาก `/pick-a-card/*` และ `/spreads/topic/*`

---

## 📊 2026-09-27 — ผลจริงครั้งแรกจาก API (ย้อนหลัง 90 วัน)

| ตัวชี้วัด | ผล |
|---|---|
| หน้าไทยที่เข้าดัชนี | **50 / 180** (`/cards` 34/100 · `/spreads` 7/33 · `/blog` 5/31 · `/pick-a-card` 0/9) |
| พบแล้ว - ยังไม่ได้จัดทำดัชนี | 116 หน้า (ส่วนใหญ่ Google ยังไม่เคยคลาน) |
| Google ไม่รู้จัก URL | 11 หน้า — `/cards/major-05` `cups-12` `swords-06` `swords-08` `wands-04` · `/spreads/money` `monthly` · `/pick-a-card/future-of-your-relationship` `will-they-come-back` · `/blog/reversed-tarot-cards-guide` `the-devil-love-tarot-guide` ➔ **กดขอก่อน** |
| คำค้นไทย | 59 คำ · แสดงผล 105 · คลิก 1 · อันดับ ≤ 3 ไม่มีเลย · ≤ 10 มี 7 คำ (หางยาว เช่น `temperance กลับหัว`) |
| คำหลัก | `ดูดวงไพ่ยิปซี 3 ใบ` 39–58 · `ความหมายไพ่ยิปซี 78 ใบ` 56–76 · `ไพ่ยิปซีรายวัน` 50–62 |
| ทั้งเว็บ (รายหน้า) | คลิก 102 · หน้าแรก 74 · `/cards/birth-card` อันดับ 6.2 (11 คลิก) · `/daily` 8 คลิก |
| sitemap | Google โหลดล่าสุด 2026-09-26 · 358 URL · error 0 |

---

## 🗓️ 2026-09-15 — ⛔ โควตา PageSpeed Insights หมด (ไม่ได้ส่ง URL เข้าดัชนีในรอบนี้)

ยิง `pagespeedonline/v5/runPagespeed` ที่ `https://seertarot.net/blog` (mobile) เพื่อปิด ISSUE-043
➔ ได้ **HTTP 429 `RESOURCE_EXHAUSTED`** ("Queries per day" ของ consumer นิรนาม) **ทั้ง 4 ครั้งที่ยิง**
คือโควตาหมดตั้งแต่ก่อนรอบนี้จะเริ่ม ไม่ได้หมดเพราะรอบนี้

**สิ่งที่ทำแทน**: ติดตั้ง `lighthouse@12` (เอนจินตัวเดียวกับ PSI ทุกประการ) แล้วยิงบน production เอง
➔ ได้ผลครบและปิดเคสได้ (ดู [`HANDOFF_BLOG_TBT_2026-09-12.md`](plans/HANDOFF_BLOG_TBT_2026-09-12.md))

**บทเรียนสำหรับรอบหน้า**:
- ก่อนวางแผนพึ่ง PSI ให้**ยิงทดสอบหนึ่งนัดก่อนเสมอ** จะได้รู้ตั้งแต่ต้นว่าโควตาเหลือไหม
- ถ้า 429 **อย่าเสียเวลารอ** — ยิง Lighthouse CLI เองได้เลย ได้ audit ชุดเดียวกันและ**ยิงกี่รอบก็ได้**
  ข้อแลกเปลี่ยนคือรันบน CPU ของเครื่องเรา ➔ ตัวเลขดิบเทียบข้ามวัน/ข้ามเครื่องไม่ได้ **ต้องเทียบหน้าต่อหน้าในรอบเดียวกัน**
- ถ้าจะใช้ PSI จริงจังต้องขอ API key (ดู [`PENDING_SETUP.md`](PENDING_SETUP.md))

---

## 🗓️ 2026-09-07 — ส่ง 30 URL (โดย Claude Opus 5)

**ผลตรวจก่อนส่ง** (ยืนยันจาก URL Inspection ทีละหน้า):

| URL | สถานะก่อนส่ง | ส่งคำขอ |
| :--- | :--- | :--- |
| `/` | อยู่ใน Google | — (ไม่ต้องส่ง) |
| `/daily` | อยู่ใน Google | — |
| `/love/1-card` | อยู่ใน Google | — |
| `/cards/birth-card` | อยู่ใน Google | — |
| `/readers` | ไม่ได้อยู่ใน Google | ✅ |
| `/en` | ไม่ได้อยู่ใน Google | ✅ |
| `/en/daily` | ไม่ได้อยู่ใน Google | ✅ |
| `/en/love/1-card` | ไม่ได้อยู่ใน Google | ✅ |
| `/en/spreads` | ไม่ได้อยู่ใน Google | ✅ |
| `/en/cards` | ไม่ได้อยู่ใน Google | ✅ |
| `/en/cards/major` | ไม่ได้อยู่ใน Google | ✅ |
| `/en/cards/minor` | ไม่ได้อยู่ใน Google | ✅ |
| `/en/cards/wands` | ไม่ได้อยู่ใน Google | ✅ |
| `/en/cards/cups` | ไม่ได้อยู่ใน Google | ✅ |
| `/en/cards/swords` | ไม่ได้อยู่ใน Google | ✅ |
| `/en/cards/pentacles` | ไม่ได้อยู่ใน Google | ✅ |
| `/en/cards/all` | ไม่ได้อยู่ใน Google | ✅ |
| `/en/blog` | ไม่ได้อยู่ใน Google | ✅ |
| `/en/cards/major-00` ถึง `/en/cards/major-15` (16 หน้า) | ไม่ได้อยู่ใน Google ทุกหน้า | ✅ |

**รวมส่งวันนี้ 30 URL** — ทุกรายการได้รับข้อความยืนยัน "ขอการจัดทำดัชนีแล้ว"
ไม่พบข้อความเกินโควตารายวันเลยตลอดรอบ

---

## 🗓️ 2026-09-09 — ตรวจความพร้อมก่อนส่ง 119 URL (โดย Claude Opus 5)

> ⚠️ **รอบนี้ไม่ได้กดส่งเข้า GSC** — เซสชันนี้รันบนคอนเทนเนอร์ระยะไกลที่**ไม่มีเบราว์เซอร์ที่ล็อกอินบัญชี Google**
> และโปรเจกต์ไม่มี service account สำหรับ Search Console API จึงเปิดหน้า GSC ไม่ได้เลย
> สิ่งที่ทำแทนคือ **ตรวจความพร้อมทางเทคนิคของคิวทั้งหมดจาก production จริง** แล้วจัดเป็นชุดพร้อมกดทีละชุด
> เพื่อให้รอบที่มีเบราว์เซอร์เข้าไปกดได้รวดเดียวโดยไม่ต้องมานั่งตรวจซ้ำ

**ขอบเขตที่ตรวจ**: 119 URL ที่เหลือในคิว (ยิงจริงทุกเส้นบน `https://seertarot.net`)

| ด่านตรวจ | ผล |
| :--- | :--- |
| HTTP status | **200 ครบ 119/119** — ไม่มี 3xx/4xx/5xx สักเส้น |
| `<meta name="robots">` มี `noindex` | **ไม่มีเลย 0/119** |
| `<link rel="canonical">` ชี้ตัวเอง | **ตรงครบ 119/119** (ไม่มีหน้าไหน canonical ข้ามไปหน้าไทย) |
| `<html lang>` | **`en` ครบ 119/119** |
| `hreflang` (`th-TH` · `en-US` · `x-default`) | **ครบ 3 รายการทุกหน้า 119/119** และ `x-default` ชี้กลับหน้าไทยคู่ของมันถูกต้อง |
| เนื้อหาที่มองเห็นจริง (ตัด `<script>`/`<style>` แล้วนับคำ) | **น้อยสุด 279 คำ · ไม่มีหน้าไหนต่ำกว่า 250 คำ** |
| เนื้อหาเป็นภาษาอังกฤษจริง (ไม่ใช่ไทยสวมเสื้อ `lang="en"`) | ✅ สุ่มตรวจไพ่ · ผัง · บทความ — เป็นอังกฤษจริงทั้งหมด ที่เจอตัวไทยคือ**ชื่อไพ่ภาษาไทย 5–10 อักขระ**เท่านั้น ตั้งใจให้มี |

**ข้อค้นพบที่ขัดกับเอกสารเดิม**:
[`HANDOFF_EN_ROUTING_2026-09-06.md`](plans/HANDOFF_EN_ROUTING_2026-09-06.md) ระบุว่า `/en/blog/*`
และ `/en/spreads/topic/*` **"ยังไม่เปิด รอแปลเนื้อหา"** — แต่ตรวจ production จริงแล้ว
**เปิดครบและแปลเป็นอังกฤษเรียบร้อยแล้ว** (บทความ 26 หน้า เนื้อหาจริง 549–679 คำต่อหน้า ·
`/en/spreads/topic/*` 6 หน้า 606 คำ) และอยู่ใน `sitemap.xml` ด้วย
→ **ส่งเข้าดัชนีได้เลย ไม่ต้องรออะไรอีก**
ส่วน `/en/cards/birth-card` ยังไม่เปิดจริง (HTTP 404) และ**ไม่อยู่ใน sitemap** — ถูกต้องแล้ว ห้ามส่ง

**สรุป**: ไม่มีอุปสรรคทางเทคนิคขวางสักเส้น — คิวข้างล่างกดส่งได้ทั้งหมดโดยไม่ต้องตรวจ URL Inspection ซ้ำ

---

## 🗓️ 2026-09-09 (รอบบ่าย) — ส่งชุด A ครบ 30 URL + ตรวจหน้าไทยทั้ง 151 หน้า

### ✅ ส่งจริงแล้ว 30 URL (รายงานโดยเจ้าของ)

`/en/cards/major-16` → `/en/cards/cups-10` — **ครบทั้งชุด A** ไม่ติดโควตาแม้แต่ครั้งเดียว
ผล URL Inspection ที่เห็นระหว่างส่ง: _"URL พร้อมใช้งานสำหรับ Google · จัดทำดัชนีหน้าได้ ·
การแสดงเส้นทาง: ตรวจพบรายการที่ถูกต้อง 1 รายการ"_ ตรงกับผลตรวจล่วงหน้าทุกประการ

**รวมส่งสะสมทั้งหมด 60 URL** (30 จากรอบ 2026-09-07 + 30 รอบนี้)

### 🇹🇭 ตรวจหน้าไทยทั้ง 151 หน้า — ยิงจริงบน production ทุกเส้น

เจ้าของถามว่า _"ภาษาไทยครบแล้วเหรอ เห็นแต่ /en"_ ➔ ไล่ตรวจให้ครบทั้งหมด

| ด่านตรวจ | ผล |
| :--- | :--- |
| HTTP status | **200 ครบ 151/151** |
| `noindex` | ไม่มีเลย **0/151** |
| `canonical` ชี้ตัวเอง | ตรงครบ **151/151** |
| `<html lang>` | `th` ครบ **151/151** |
| อักขระไทยที่มองเห็นจริง (ตัด `<script>`/`<style>` แล้วนับ) | น้อยสุด **1,723 ตัวอักษร** · 150 จาก 151 หน้าเกิน 2,500 ตัวอักษร |

> ⚠️ **หมายเหตุวิธีนับ**: หน้าไทยนับเป็น **จำนวนอักขระ ไม่ใช่จำนวนคำ**
> เพราะภาษาไทยไม่เว้นวรรคระหว่างคำ การนับคำแบบเดียวกับภาษาอังกฤษจะได้ตัวเลขต่ำกว่าความจริงมาก
> ➔ ห้ามเอาตัวเลขคำของหน้า `/en` (279–679 คำ) มาเทียบกับตัวเลขนี้ตรง ๆ

**สรุป: ไม่มีอุปสรรคทางเทคนิคขวางหน้าไทยสักเส้นเดียว**
หน้าที่บางที่สุดคือ [`/readers`](https://seertarot.net/readers) (1,723 อักขระ) ซึ่งบังเอิญเป็น
หน้าเดียวที่ผลตรวจรอบ 2026-09-07 ขึ้นว่า **ไม่ได้อยู่ใน Google** และถูกส่งไปแล้ว
➔ ถ้ารอบหน้ายังไม่เข้าดัชนีอีก ให้สงสัยเรื่อง **เนื้อหาบาง** เป็นอันดับแรก

### ❗ สิ่งที่ผลตรวจนี้ **ไม่ได้** ตอบ

ตรวจได้แค่ว่า **"หน้าพร้อมให้เก็บ"** — ไม่ได้แปลว่า **"Google เก็บไปแล้ว"**
คำตอบนั้นมีที่เดียวคือ GSC และ**ห้ามไล่ inspect ทีละหน้า 146 ครั้ง** เพราะเปลืองเวลาและโควตา

**วิธีที่ถูก** — เปิด GSC → เมนู **"การจัดทำดัชนีหน้า"** (Page indexing)
→ เลื่อนลงส่วน **"ไม่ได้จัดทำดัชนี"** → มันลิสต์ URL ที่ Google รู้จักแต่ยังไม่เก็บ
พร้อมเหตุผลรายข้อ (_ค้นพบแล้ว-ยังไม่ได้จัดทำดัชนี_ · _รวบรวมข้อมูลแล้ว-ยังไม่ได้จัดทำดัชนี_ ·
_หน้าที่ซ้ำกัน_ ฯลฯ) ➔ **ยิงเฉพาะที่อยู่ในรายการนั้น** จบใน 5 นาที

> รอบ 2026-09-07 รายงานนี้ยังขึ้น _"กำลังประมวลผลข้อมูล"_ จึงใช้ไม่ได้ — ตอนนี้ควรมีข้อมูลแล้ว

---

## 🚨 2026-09-09 (รอบเย็น) — วิเคราะห์รายงาน "การจัดทำดัชนีหน้า" ฉบับส่งออกจริง

เจ้าของส่งออกไฟล์ `CoverageDrilldown` จากพร็อพเพอร์ตี้ `https://seertarot.net/` มาให้วิเคราะห์

### ผลวิเคราะห์ — แย่กว่าที่ทุกเอกสารเคยเขียนไว้

| ข้อ | ผล |
| :--- | :--- |
| ปัญหาที่รายงาน | `พบแล้ว - ยังไม่ได้จัดทำดัชนี` · **127 หน้า** (ข้อมูลวันที่ 2026-09-04) |
| คอลัมน์ "ทำการ Crawl ครั้งล่าสุด" | `1970-01-01` **ทุกแถวไม่มีข้อยกเว้น** = Google **ไม่เคยเข้ามาคลานเลยสักครั้ง** |
| ภาษา | **ไทย 127 · อังกฤษ 0** |
| แยกหมวด | `/cards` **79** (หน้าฮับ + **ไพ่ครบทั้ง 78 ใบ**) · `/blog` **25** จาก 27 · `/spreads` **21** จาก 25 · `/readers` · `/privacy` |
| หน้าไทยที่ถูกคลานแล้ว | **24 จาก 151** — และเกือบทั้งหมดอยู่ห่างหน้าแรกแค่ 1–2 คลิก |

> ⚠️ **ที่ไม่มี `/en` ในลิสต์ ไม่ได้แปลว่าอังกฤษดี** — รายงานลงวันที่ 4/9 ซึ่ง `/en` ยังไม่เกิด (เปิด 6/9)
> รายงานฉบับนี้บอกอะไรเกี่ยวกับฝั่งอังกฤษไม่ได้เลย

### สาเหตุ — ตรวจแล้ว ไม่ใช่บั๊กใหญ่ แต่เจอของจริง 2 อย่าง

✅ **ไม่ติดอะไรเลย**: `robots.txt` `Allow: /` + `Content-Signal: search=yes` ·
ยิงด้วย User-Agent ของ **Googlebot จริง** ได้ **200 ทุกหน้า** เร็ว 0.3–1.2 วิ (ไม่โดน WAF) ·
`/cards/all` มีลิงก์ไพ่ 160 เส้นใน HTML ดิบ · เนื้อหา 2,697+ อักขระ

❗ **แต่เจอ 2 จุดที่แก้ได้** (แก้แล้วในรอบนี้):

1. **หน้ากำพร้าจริง 4 หน้า** — ไล่ลิงก์ภายในจากหน้าไทยครบทั้ง 151 หน้าแล้ว พบว่า
   `/spreads/weekly` · `/spreads/monthly` · `/spreads/monthly-ten` · `/spreads/year-ahead`
   **ไม่มีหน้าไหนลิงก์หาเลยสักเส้น** มีอยู่แค่ใน `sitemap.xml`
2. **หน้าฮับ `/spreads` ส่งลิงก์ออกมาแค่ 7 จาก 25 ผัง** — `SpreadsLibrary` เป็น client component
   ที่เปิดมาด้วยแท็บ "ยอดนิยมแนะนำ" ที่เหลือโผล่ต่อเมื่อผู้ใช้กดแท็บ

**สาเหตุหลักที่เหลือคือโควตาการคลาน (crawl budget)** — Google ไล่ตามลิงก์ทีละฮอปและยังไปไม่ถึงชั้นที่ 2
(ไพ่ 78 ใบอยู่ห่างหน้าแรก 2 ฮอป) · และข้อมูลนี้ยัง**เก่า 5 วัน** เก็บ**ก่อน**แก้ INC-0106
(ลูปยิงคำขอ 180 ครั้ง/วินาที · 1.11 ล้านคำขอ/วัน ซึ่งกดอัตราการคลานให้ต่ำลงได้) และ**ก่อน**ส่ง 60 URL

### แก้ที่ต้นเหตุแล้วในรอบนี้

เพิ่ม **สารบัญผังฝั่งเซิร์ฟเวอร์** ใน [`src/app/_shared/pages/spreads-index.tsx`](../src/app/_shared/pages/spreads-index.tsx)
— `<nav>` ที่เรนเดอร์ `<a href>` ครบทั้ง 25 ผังลงใน HTML ดิบ โดย**ไม่แตะพฤติกรรมแท็บ**ของ `SpreadsLibrary` เลย
ยืนยันจาก build จริง: `/spreads` และ `/en/spreads` มีลิงก์ผัง **25/25** และหน้ากำพร้าทั้ง 4 มีลิงก์แล้ว
พร้อมตั้ง**ด่านตรวจถาวร**ใน `scripts/qa/test-seo-wave3.ts` กันใครเผลอย้ายกลับไปฝั่งไคลเอนต์อีก

---

## 🇹🇭 ~~คิวหลัก — 127 หน้าไทยที่ Google ไม่เคยคลานเลย (5 ชุด)~~ (เก่า — ใช้คิว 2026-10-20 ด้านบนแทน)

> **คำสั่งเจ้าของ 2026-09-09**: _"ต้องทำฝั่งไทยให้เสร็จให้หมดก่อน เพราะเราทำตลาดไทย"_
> คิว `/en` ที่เหลือ 89 URL **พักไว้** จนกว่าไทยจะจบ (รายการเดิมอยู่ท้ายไฟล์)
>
> ✅ ทุกเส้นตรวจแล้วเมื่อ 2026-09-09: HTTP 200 · ไม่มี `noindex` · `canonical` ชี้ตัวเอง ·
> `lang="th"` · เนื้อหา 2,697+ อักขระ — **กดได้ทันที ไม่ต้อง inspect ก่อน**
> **กดจบชุดไหน มาติ๊ก `[x]` ทันที**

### [ ] ชุด 1 — 3 หน้าฮับ + ไพ่ชุดใหญ่ 22 ใบ + บทความ 5 (30 หน้า) ⭐ **สำคัญที่สุด**

หน้าฮับต้องมาก่อนเสมอ — Google คลานฮับได้แล้วจะไล่ตามลิงก์ไปทั้งกิ่งเอง ไม่ต้องยิงทีละใบ

`/cards` `/blog` `/spreads`
`/cards/major-00` … `/cards/major-21` (22 หน้าเรียงเลข)
`/blog/` + `ai-tarot-oracle-vs-human-reader` `celtic-cross-spread-guide` `how-to-ask-tarot-questions` `major-arcana-22-cards-complete-guide` `minor-arcana-4-suits-guide`

### [ ] ชุด 2 — ไพ่ถ้วย + ไม้เท้า (28 หน้า)

`/cards/cups-01` … `/cards/cups-14`
`/cards/wands-01` … `/cards/wands-14`

### [ ] ชุด 3 — ไพ่เหรียญ + ดาบ (28 หน้า)

`/cards/pentacles-01` … `/cards/pentacles-14`
`/cards/swords-01` … `/cards/swords-14`

### [ ] ชุด 4 — ผังพยากรณ์ 20 + `/readers` + `/privacy` (22 หน้า)

`/spreads/` + `career` `career-switch` `celtic-cross` `chakra` `daily` `decision` `ex-reconciliation` `how-they-feel` `inner-potential` `love` `mind-body-spirit` `money` `monthly` `quick` `situation-solution` `soulmate` `three-card` `weekly` `year-ahead` `yes-no`
`/readers` `/privacy`

> 📌 `/readers` เคยส่งไปแล้วรอบ 2026-09-07 แต่ยังไม่เข้าดัชนี — เป็นหน้าที่บางที่สุดในเว็บ (1,723 อักขระ) ถ้ารอบนี้ยังไม่เข้าอีก ให้แก้เนื้อหาก่อนค่อยส่งซ้ำ

### [ ] ชุด 5 — บทความที่เหลือ (19 หน้า)

`/blog/` + `provably-fair-tarot-guide` `reversed-tarot-cards-guide` `tarot-7-chakras-spread` `tarot-and-carl-jung-psychology` `tarot-business-elements-spread` `tarot-career-change-spread` `tarot-daily-card-guide` `tarot-ex-return-signs` `tarot-history-1909-rider-waite` `tarot-job-interview-one-card` `tarot-love-3-cards-feelings` `tarot-single-timing-love` `tarot-wealth-money-cards` `tarot-yes-no-spread-guide` `the-fool-journey-meaning` `the-lovers-card-meaning` `the-tower-and-death-meaning` `the-wheel-of-fortune-meaning` `top-10-soulmate-tarot-cards`

### หลังจบ 5 ชุด

1. **รอ 3–5 วัน** แล้วเปิดรายงาน "การจัดทำดัชนีหน้า" ดูซ้ำว่าเลข 127 ลดลงเท่าไร
2. ถ้ายังค้างเยอะ = ปัญหาโควตาการคลานจริง ไม่ใช่เรื่องยิงไม่พอ ➔ ต้องแก้ที่อำนาจโดเมน (ลิงก์จากภายนอก) ไม่ใช่กดปุ่มเพิ่ม
3. ค่อยกลับไปต่อคิว `/en` ชุด B–D ท้ายไฟล์

---

## ⏸️ คิว `/en` ที่พักไว้ — เหลือ 89 URL

> ชุด A ส่งครบแล้ว 2026-09-09 · ที่เหลือรอจนกว่าฝั่งไทยจะจบตามคำสั่งเจ้าของ

### [x] ~~ชุด A — ไพ่ชุดใหญ่ที่เหลือ + ไม้เท้า + ถ้วย 1–10 (30 หน้า)~~ ✅ **ส่งครบแล้ว 2026-09-09**

~~`/en/cards/major-16` → `/en/cards/cups-10`~~ — ไม่ติดโควตา

### [ ] ชุด B — ถ้วยที่เหลือ + ดาบ + เหรียญ 1–12 (30 หน้า)

`/en/cards/cups-11` … `/en/cards/cups-14` (4 หน้า)
`/en/cards/swords-01` … `/en/cards/swords-14` (14 หน้า)
`/en/cards/pentacles-01` … `/en/cards/pentacles-12` (12 หน้า)

### [ ] ชุด C — เหรียญ 2 ใบสุดท้าย + ผังทั้งหมด (30 หน้า)

`/en/cards/pentacles-13` `/en/cards/pentacles-14`
`/en/spreads/` + `daily` `quick` `yes-no` `three-card` `situation-solution` `mind-body-spirit` `love` `how-they-feel` `ex-reconciliation` `soulmate` `career` `money` `career-switch` `decision` `inner-potential` `weekly` `monthly` `chakra` `celtic-cross` `year-ahead` `love-six` `monthly-ten` `family` `luck` `study` (25 หน้า)
`/en/spreads/topic/` + `love` `career` `money` (3 หน้า)

### [ ] ชุด D — หมวดหัวข้อที่เหลือ + บทความอังกฤษทั้งหมด (29 หน้า)

`/en/spreads/topic/` + `health` `family` `study` (3 หน้า)
`/en/blog/` + `tarot-love-3-cards-feelings` `tarot-love-reading-guide` `tarot-ex-return-signs` `top-10-soulmate-tarot-cards` `tarot-single-timing-love` `tarot-career-change-spread` `tarot-job-interview-one-card` `tarot-wealth-money-cards` `tarot-business-elements-spread` `how-to-read-tarot-for-beginners` `celtic-cross-spread-guide` `tarot-daily-card-guide` `tarot-7-chakras-spread` `how-to-ask-tarot-questions` `the-lovers-card-meaning` `the-tower-and-death-meaning` `the-fool-journey-meaning` `the-wheel-of-fortune-meaning` `reversed-tarot-cards-guide` `provably-fair-tarot-guide` `tarot-and-carl-jung-psychology` `ai-tarot-oracle-vs-human-reader` `tarot-history-1909-rider-waite` `major-arcana-22-cards-complete-guide` `minor-arcana-4-suits-guide` `tarot-yes-no-spread-guide` (26 หน้า)

---
## 🧭 ขั้นตอนมาตรฐาน

เปิด GSC → พิมพ์ URL ในช่องตรวจสอบด้านบน → รอผล →
ถ้าขึ้น "URL ไม่ได้อยู่ใน Google" ให้กด **ขอการจัดทำดัชนี** → รอ 40–70 วินาที
→ ได้แบนเนอร์เขียว "ขอการจัดทำดัชนีแล้ว" → กด ตกลง → ทำหน้าถัดไป

> ⚠️ **ข้อจำกัดที่ต้องรู้ก่อนรับงานนี้**: งานนี้ทำได้เฉพาะเซสชันที่**มีเบราว์เซอร์ล็อกอินบัญชีเจ้าของ**
> Claude Code บนเว็บ/คอนเทนเนอร์ระยะไกล **กดขอไม่ได้** — ไม่มีเบราว์เซอร์ที่ล็อกอิน
> (แต่ถ้ามี secret `GSC_SERVICE_ACCOUNT_JSON` แล้ว **ตรวจสถานะได้** ด้วย `npm run seo:gsc -- inspect`)
> และ Google Indexing API ก็รองรับเฉพาะ `JobPosting`/`BroadcastEvent` ใช้กับหน้าทั่วไปไม่ได้
> เซสชันแบบนั้นให้ทำ **ด่านตรวจความพร้อม** แบบรอบ 2026-09-09 แทน แล้วส่งไม้ต่อ อย่ารายงานว่าส่งแล้ว
