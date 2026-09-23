# A6-seo

## ความคืบหน้า

## ข้อค้นพบ

### 🟡 A6-01 · หน้าที่ noindex สืบทอด canonical/hreflang ของหน้าแรก (สัญญาณขัดกัน)
- ที่: `astro/layouts/BaseLayout.astro:73-83` (ผสาน `ROOT_ALTERNATES` ก่อน `...metadata`) · หน้าที่ไม่ประกาศ `alternates` เอง: `src/app/_shared/pages/reading-chat-th.tsx:36` · `reading-chat-en.tsx:33` · `account-th.ts:16` · `not-found.tsx:22,28`
- ปัญหา: วัดจาก `dist/` (astro build) — `/reading/chat` `/account` `/404` ได้ `<link rel=canonical href="https://seertarot.net">` + hreflang ชุดของหน้าแรก, ฝั่ง `/en/*` ชี้ `/en` · `/reading/chat` ยังได้ description ซ้ำกับหน้าแรกเป๊ะ
- ผลกระทบ: noindex + canonical ชี้ URL อื่น = สัญญาณขัดกัน (Google เตือนไม่ให้ผสม) มีโอกาสส่ง noindex ไปถึงหน้าแรกผ่านคลัสเตอร์ canonical; hreflang ประกาศว่าหน้านี้เป็นฝาแฝดของ `/` ซึ่งไม่จริง
- แนวแก้: หน้า noindex ให้ตั้ง `alternates: { canonical: <URL ตัวเอง> }` (หรือ `alternates: {}` เพื่อตัดทิ้ง) และ description เฉพาะหน้า

### 🟡 A6-02 · JSON-LD `SoftwareApplication` 6 หน้าไม่ผ่านเกณฑ์ Google (ขาด aggregateRating/review)
- ที่: `src/app/_shared/pages/daily-th.tsx:101` · `daily-en.tsx:83` · `love-one-card-th.tsx:116` · `love-one-card-en.tsx:81` · `pick-a-card-th.tsx:101` · `pick-a-card-en.tsx:101`
- ปัญหา: Software App rich result บังคับ `aggregateRating` หรือ `review` อย่างใดอย่างหนึ่ง ทั้ง 6 บล็อกมีแค่ name/offers (ยืนยันใน `dist/daily.html` ฯลฯ)
- ผลกระทบ: GSC รายงาน "Invalid items: Either aggregateRating or review should be specified" ทั้ง 6 หน้า ได้ rich result 0 — ห้ามแก้ด้วยการกุเรตติ้ง (ผิดนโยบาย/ถูก manual action)
- หมายเหตุ: `WebApplication` เป็น subtype เดียวกัน — หน้าแรก `/` `/en` (+อีก 2 หน้า รวม 4 บล็อกใน dist) ก็โดนเกณฑ์เดียวกัน
- แนวแก้: เปลี่ยนเป็น `WebPage` (ไม่อยู่ในรายการ rich result) หรือถอดออก ห้ามใส่ rating ปลอม

### 🟠 A6-03 · ลิงก์ภายในเสีย `/spreads/birth-card` (404) ในหน้าไพ่ 38 หน้า (ไทย 19 + อังกฤษ 19)
- ที่: `src/components/encyclopedia/CardSpreadLinks.tsx:39-41` (ใช้ `SPREADS` ทั้งก้อน ไม่กรอง `internal`)
- ปัญหา: ผัง `birth-card` เป็น `internal: true` (`src/data/spreads.ts:1289-1301`) จึงไม่มีหน้า `/spreads/birth-card` (ไม่อยู่ใน `PUBLIC_SPREADS`/getStaticPaths) แต่ไพ่ที่ `spreadCat === "self"` ได้การ์ดลิงก์ไปผังนี้ — ยืนยันใน `dist/cards/major-00.html` และ `dist/en/cards/major-00.html` (`href="/en/spreads/birth-card"`)
- ผลกระทบ: ผู้ใช้กดแล้วเจอ 404, Googlebot เจอ soft-broken link 38 หน้า เสีย crawl budget และ link equity ของกล่องลิงก์ภายในหลักของหน้าไพ่
- แนวแก้: เปลี่ยนเป็น `PUBLIC_SPREADS.filter(...)` (หรือเพิ่ม `&& !s.internal`) · ถ้าต้องการพาไปไพ่วันเกิดให้ชี้ `/cards/birth-card` แทน · เพิ่มด่านตรวจ href ภายในจาก dist

### 🟡 A6-04 · หน้า `/en/contact` ลิงก์ไป `/en/about` ซึ่งไม่มีอยู่ (404)
- ที่: `src/app/_shared/pages/contact-en.tsx:165`
- ปัญหา: ฮาร์ดโค้ด `href="/en/about"` แต่ `astro/pages/en/` ไม่มี `about.astro` (มีแค่ `/about` ไทย ไม่มีฝาแฝด) — dist ไม่มี `en/about.html`
- ผลกระทบ: ลิงก์ "About" หน้าติดต่อภาษาอังกฤษพาไป 404 (E-E-A-T: หน้าเกี่ยวกับเราเป็นสัญญาณความน่าเชื่อถือที่บอตตามจากหน้าติดต่อ)
- แนวแก้: ชี้ `/about` (ภาษาไทย) ชั่วคราว หรือสร้าง `/en/about` + เพิ่มใน `hasEnglishTwin`
PROGRESS: [x] dist internal links / canonical / hreflang / sitemap coverage (astro build)

### 🟠 A6-05 · Redirect 301 ของ URL เก่าใน `next.config.ts` ตายหมด — production ตอบ 404
- ที่: `next.config.ts:97-135` (`/blog/celtic-cross-spread-deep-dive` · `/blog/jungian-psychology-and-tarot` · `/tarot-daily` · `/daily-tarot` · `/tarot-love` · `/love` · `/love-tarot` · `/tarot`) × `wrangler.jsonc:48-63` (`not_found_handling: "404-page"` + `run_worker_first` ไม่มีเส้นเหล่านี้)
- ปัญหา: คำขอที่ไม่ตรงไฟล์ static และไม่อยู่ใน `run_worker_first` ถูกขอบตอบ `404.html` ทันที ไม่ถึง Worker → `redirects()` ของ Next ไม่เคยทำงาน (กลไกเดียวกับ INC-0203 ที่แก้เฉพาะเรื่องโฮสต์ www) · ยิงจริง 2026-09-23: ทั้ง 5 เส้นที่ลอง (`/tarot-daily` `/love` `/tarot` `/blog/celtic-cross-spread-deep-dive` `/blog/jungian-psychology-and-tarot`) ได้ **404**
- ผลกระทบ: backlink/บุ๊กมาร์ก/ผลค้นหาเก่าของบทความที่เปลี่ยน slug เสีย link equity ทั้งหมด, GSC ขึ้น 404 ของ URL ที่เคยถูก index · `/love` เป็น URL ที่คนพิมพ์เองบ่อย
- แนวแก้: เพิ่มเส้นเหล่านี้ใน `run_worker_first` (ถูกสุด) หรือย้ายไปเป็น `_redirects` ของ Assets/Single Redirect บนขอบ + เพิ่มด่านที่ไล่ `redirects()` ทุกกฎแล้วตรวจว่า source อยู่ใน `run_worker_first` หรือมีกฎขอบรองรับ

### 🟡 A6-06 · `/account` ถูก Disallow ใน robots.txt จนบอตอ่าน `noindex` ไม่ได้ ทั้งที่ลิงก์จาก 332 หน้า
- ที่: `src/app/robots.ts` (`PRIVATE_PATHS` มี `/account`, `/account/`) × `src/app/_shared/pages/account-th.ts:16` (`noindex, nofollow`)
- ปัญหา: robots.txt บล็อกการ crawl → Google ไม่เคยเห็นเมตา noindex; ขณะเดียวกัน `href="/account"` อยู่ในหัวเว็บทุกหน้า (dist 332 ไฟล์) คอมเมนต์ใน account-th.ts เองบอกว่า "ต้องประกาศ noindex ในตัวหน้า ไม่พึ่ง robots.txt" แต่ Disallow ทำให้ข้อนั้นไร้ผล
- ผลกระทบ: GSC ขึ้น "Indexed, though blocked by robots.txt" — URL `/account` โผล่ในผลค้นหาแบบไม่มีคำอธิบาย (เกิดกับ `/reset-password` `/tester` ได้เช่นกันถ้ามีลิงก์เข้า)
- แนวแก้: เอา `/account` (และหน้าที่มี noindex ในตัวแล้ว) ออกจาก Disallow ให้บอตเข้าไปเห็น noindex ได้ · คง Disallow ไว้เฉพาะ `/api/`
PROGRESS: [x] src/app/robots.ts src/app/sitemap.ts public/_headers wrangler assets

### 🟠 A6-07 · JSON-LD หน้ากลุ่มไพ่ภาษาอังกฤษ 6 หน้าชี้ URL ภาษาไทยทั้งหมด (url/breadcrumb/ItemList)
- ที่: `src/components/encyclopedia/CardGroupView.tsx:55,71,85,91` (`${SITE_ORIGIN}/cards/...` ตรง ๆ ไม่ผ่าน `localizedUrl`)
- ปัญหา: `/en/cards/{major,minor,wands,cups,swords,pentacles}` ประกาศ `CollectionPage.url` = `https://seertarot.net/cards/pentacles` (ไม่ใช่ `/en/...`) · breadcrumb "Home" → `/` ไทย, "Tarot Encyclopedia" → `/cards` ไทย · ItemList 14–56 รายการชี้หน้าไพ่ไทย (ยืนยันใน `dist/en/cards/pentacles.html`, `minor.html` 59 URL)
- ผลกระทบ: structured data ขัดกับ canonical/hreflang ของหน้า (`url` ≠ canonical), breadcrumb ใน SERP อังกฤษพาไปหน้าไทย, ItemList ส่งสัญญาณให้หน้าไทยแทนหน้าอังกฤษ
- แนวแก้: ใช้ `localizedUrl(path, locale)` ทุกจุด (หรือ `buildBreadcrumbJsonLd` จาก `src/app/_shared/seo.ts`) ส่วน `image` .jpg คงเดิมได้

### 🟡 A6-08 · Breadcrumb JSON-LD ของ `/en/contact` ชี้ `https://seertarot.net/en/en/contact` (404)
- ที่: `src/app/_shared/pages/contact-en.tsx:56` (`path: "/en/contact"` แล้ว `buildBreadcrumbJsonLd` ที่ `src/app/_shared/seo.ts:44` เติม `/en` ซ้ำผ่าน `localizedUrl`)
- ปัญหา: ยืนยันใน `dist/en/contact.html` — ListItem ตำแหน่ง 2 = `/en/en/contact`
- ผลกระทบ: Rich Results Test/GSC ขึ้นรายการ breadcrumb ชี้ URL ที่ไม่มีอยู่ (404) บนหน้าอังกฤษ
- แนวแก้: ส่ง `path: "/contact"` (path กลางแบบไม่มีคำนำหน้าภาษา) · เพิ่ม assert ใน buildBreadcrumbJsonLd ว่า path ห้ามขึ้นต้น `/en/`

### 🟠 A6-09 · หน้า Pick A Card อังกฤษ 8 หน้าลิงก์ข้ามไปหน้าไทย (กล่องลิงก์ภายในท้ายบทความ)
- ที่: `src/app/_shared/pages/pick-a-card-topic.tsx:664-669` (`href: \`/pick-a-card/${other.slug}\`` และ `"/pick-a-card"` ไม่ผ่าน `localeHref`)
- ปัญหา: `dist/en/pick-a-card/*.html` ทั้ง 8 หน้ามีลิงก์ 8 เส้นไป `/pick-a-card/...` ภาษาไทย (ทั้งที่มีฝาแฝด `/en/pick-a-card/...` ครบ) · ป้ายยังเขียน "All 4 pick a card topics" ทั้งที่มี 8 หัวข้อ (ไทยก็ "รวมทุกหัวข้อ" ถูก แต่อังกฤษผิดจำนวน)
- ผลกระทบ: ผู้ใช้อังกฤษกดแล้วตกไปหน้าไทยทั้งหน้า, link equity ภายในของคลัสเตอร์อังกฤษรั่วไปหน้าไทย (56 ลิงก์)
- แนวแก้: ใช้ `localeHref(path, locale)` จาก `@/lib/i18n/paths` · แก้ป้ายเป็น `All ${PICK_A_CARD_TOPICS.length} pick a card topics`

> ตรวจแล้วผ่าน (ไม่มีปัญหา): title/description ไม่ซ้ำทั้ง 334 หน้า · canonical ตรง URL ตัวเองทุกหน้า indexable · hreflang ไป-กลับครบ + x-default · `<html lang>` ตรง URL · sitemap ครอบทุกหน้า indexable ของ Astro และ hreflang ใน sitemap ตรงกับ HTML 100% · ไม่มีหน้า noindex ใน sitemap · ไม่มี aggregateRating/review ปลอม · Article ของบล็อกครบ headline/image/date/author · ภาพ OG Cloudinary ไม่มีข้อความที่มี `,`/`/` ดิบ · `.html` และ `/` ท้าย 307 ไป URL สะอาด · www → 301
PROGRESS: [x] astro/pages · astro/layouts · src/app/_shared/pages (SEO parts) · src/lib/i18n/paths.ts · JSON-LD ทั้ง dist
STATUS: DONE
