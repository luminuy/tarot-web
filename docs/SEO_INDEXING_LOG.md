# 🔎 ทะเบียนส่ง URL เข้า Google Search Console (Manual Indexing Request Log)

> **ทำไมต้องมีไฟล์นี้**: การกด "ขอการจัดทำดัชนี" ใน GSC ไม่มีประวัติย้อนหลังให้ดู
> ถ้าไม่จดไว้ รอบถัดไปจะไม่รู้ว่าทำถึงไหน แล้วจะยิงซ้ำหน้าเดิมจนเปลืองโควตารายวัน
> **กฎ**: ทุกครั้งที่ส่ง URL เข้า GSC ต้องมาต่อท้ายตารางนี้ทันที

- **พร็อพเพอร์ตี้**: `sc-domain:seertarot.net`
- **ลำดับการส่ง**: ไล่ตามลำดับใน `https://seertarot.net/sitemap.xml` (299 URL)
- **สถานะภาพรวม**: หน้าไทยหลักถูกจัดทำดัชนีแล้ว · หน้าอังกฤษ `/en/*` (เพิ่งเปิดใน #340 · #343) ยังไม่ถูกจัดทำดัชนีเลย จึงเป็นคิวหลักที่ต้องไล่ส่ง
- **ส่งแล้ว 30 URL · เหลือในคิว 119 URL** (ตรวจความพร้อมครบทุกเส้นแล้วเมื่อ 2026-09-09 — ดูหัวข้อคิวถัดไปด้านล่าง)

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

## ⏭️ คิวถัดไป — 119 URL แบ่ง 4 ชุด (ตรวจแล้ว 2026-09-09 · พร้อมกดทันที)

> รอบก่อนส่ง 30 URL รวดเดียวไม่ติดโควตา จึงแบ่งชุดละ 30 ตามนั้น
> ✅ ทุกเส้นในตารางนี้ **ผ่านด่านตรวจข้างบนครบแล้ว** — เข้า GSC กด "ขอการจัดทำดัชนี" ได้เลย
> ไม่ต้องเสียเวลาอ่านผล URL Inspection ทีละหน้าเหมือนรอบก่อน (หน้าเหล่านี้ยังไม่เคยถูกส่งสักเส้น)
> **กดเสร็จชุดไหน ให้มาติ๊ก `[x]` ที่หัวชุดนั้นทันที** แล้วเพิ่มบันทึกรอบใหม่ไว้ด้านบน

### [ ] ชุด A — ไพ่ชุดใหญ่ที่เหลือ + ไม้เท้า + ถ้วย 1–10 (30 หน้า)

`/en/cards/major-16` `/en/cards/major-17` `/en/cards/major-18` `/en/cards/major-19` `/en/cards/major-20` `/en/cards/major-21`
`/en/cards/wands-01` … `/en/cards/wands-14` (14 หน้าเรียงเลข)
`/en/cards/cups-01` … `/en/cards/cups-10` (10 หน้าเรียงเลข)

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

### หลังจบชุด D

หน้าไทยที่เหลือ — **ต้องตรวจ URL Inspection ก่อนทุกครั้ง ห้ามยิงมั่ว** เพราะส่วนใหญ่ถูกจัดทำดัชนีแล้ว
(ต่างจากคิว `/en/*` ข้างบนที่รู้แน่ว่ายังไม่เคยถูกส่งเลย)

---

## 🧭 ขั้นตอนมาตรฐาน

เปิด GSC → พิมพ์ URL ในช่องตรวจสอบด้านบน → รอผล →
ถ้าขึ้น "URL ไม่ได้อยู่ใน Google" ให้กด **ขอการจัดทำดัชนี** → รอ 40–70 วินาที
→ ได้แบนเนอร์เขียว "ขอการจัดทำดัชนีแล้ว" → กด ตกลง → ทำหน้าถัดไป

> ⚠️ **ข้อจำกัดที่ต้องรู้ก่อนรับงานนี้**: งานนี้ทำได้เฉพาะเซสชันที่**มีเบราว์เซอร์ล็อกอินบัญชีเจ้าของ**
> Claude Code บนเว็บ/คอนเทนเนอร์ระยะไกล **ทำไม่ได้** — ไม่มีทั้งเบราว์เซอร์ที่ล็อกอินและ service account
> และ Google Indexing API ก็รองรับเฉพาะ `JobPosting`/`BroadcastEvent` ใช้กับหน้าทั่วไปไม่ได้
> เซสชันแบบนั้นให้ทำ **ด่านตรวจความพร้อม** แบบรอบ 2026-09-09 แทน แล้วส่งไม้ต่อ อย่ารายงานว่าส่งแล้ว
