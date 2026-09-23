# A4-frontend-shell

## ความคืบหน้า

## ข้อค้นพบ

### 🔴 A4-01 · ปุ่ม "รีบิลด์ Vector Search Index" ในแผงแอดมินยิงเส้นทางที่ไม่มีอยู่
- ที่: `src/components/admin/AdminOverview.tsx:151`
- ปัญหา: เรียก `POST /api/admin/rebuild-index` แต่เส้นทางจริงคือ `src/app/api/admin/rebuild-search-index/route.ts` (ไม่มีโฟลเดอร์ `rebuild-index` เลย)
- ผลกระทบ/สถานการณ์พัง: กดปุ่มทุกครั้งได้ 404 (HTML) ➔ `res.json()` โยน ➔ toast ขึ้น "เชื่อมต่อเซิร์ฟเวอร์ไม่ได้" ซึ่งชี้ผิดทาง แอดมินรีบิลด์ดัชนีค้นหาจาก UI ไม่ได้เลย
- แนวแก้: เปลี่ยนเป็น `/api/admin/rebuild-search-index` + เพิ่มด่านเทียบสตริง `/api/*` ในคอมโพเนนต์กับ `src/app/api/**/route.ts`

### 🟠 A4-02 · ปุ่มลอย TikTok ไม่ถูกซ่อนบนหน้าแชท `/reading/chat` (และทุกหน้า Astro) เพราะเรนเดอร์แบบ static กับ shim `usePathname`
- ที่: `astro/components/StaticChrome.tsx:16` + `src/components/ui/TikTokFloatingButton.tsx:26-27` + `astro/shims/next-navigation.ts:51-56`
- ปัญหา: `FloatingChromeRoot` ถูกวางใน `BaseLayout.astro:176` โดยไม่มี `client:*` = เรนเดอร์ HTML ครั้งเดียวตอนบิลด์ · shim `usePathname()` คืน server snapshot `""` เสมอ ➔ เงื่อนไข `pathname?.startsWith("/reading")` ไม่เคยจริง (ไม่มีการ hydrate มาแก้ทีหลัง) · และต่อให้ได้ pathname จริง ก็ไม่ครอบ `/en/reading`
- ผลกระทบ/สถานการณ์พัง: หน้า `/reading/chat` · `/en/reading/chat` (แชทเต็มจอ `100dvh`) มีปุ่มกลม 52–56px `fixed bottom-right z-30` ลอยทับพื้นที่ช่องพิมพ์/ปุ่มส่งมุมขวาล่าง ทั้งที่โค้ดตั้งใจซ่อน
- แนวแก้: ส่ง prop `hidden`/`pathname` จากหน้า Astro (`Astro.url.pathname`) เข้า `FloatingChromeRoot` แล้วไม่เรนเดอร์บนเส้น `/reading` และ `/en/reading` (ใช้ `stripLocalePrefix`) · หรือให้ BaseLayout รับ prop `hideFloating`

### 🔴 A4-03 · หน้าแรก `/` และ `/en`: สคริปต์หัวเว็บแบบ vanilla ผูกซ้ำกับหัวเว็บ React ที่ hydrate แล้ว ➔ ปิดเมนูแล้วหน้าเลื่อนไม่ได้
- ที่: `astro/layouts/BaseLayout.astro:184-187` (โหลด `site-header.ts` ทุกหน้า) + `astro/scripts/site-header.ts:26-110` + `src/components/ui/SacredNavDropdown.tsx:48,262-300` + `src/lib/use-dialog-behavior.ts:67-68,111`
- ปัญหา: `site-header.ts` ออกแบบมาสำหรับหัวเว็บ static เท่านั้น แต่ไม่มีเงื่อนไขกันหน้าแรก ซึ่งหัวเว็บอยู่ใน island `TarotFlowRoot client:load` (React คุมเอง) ➔ ปุ่ม `[aria-controls="sacred-nav-panel"]` · scrim · ปุ่มปิด · keydown มีตัวจัดการสองชุดพร้อมกัน
- ผลกระทบ/สถานการณ์พัง (ไล่ลำดับจริง): เปิดเมนู ➔ vanilla ตั้ง `body.style.overflow="hidden"` ทันทีใน click ➔ effect ของ `useDialogBehavior` รันทีหลังแล้วจำ `originalOverflow = "hidden"` ➔ กดปิด/Esc/scrim ➔ vanilla คืนเป็น `""` แต่ cleanup ของ React คืนเป็น `"hidden"` ทับ ➔ **หน้าแรกเลื่อนไม่ได้อีกเลย** จนรีโหลด · นอกจากนี้คลาส entering/exiting และ focus ถูกสองฝั่งแย่งกันสลับ
- แนวแก้: ให้ `installNavDrawer()` ข้ามเมื่อหัวเว็บอยู่ใน island (เช่นเช็ก `trigger.closest("astro-island")` แล้ว return) หรือใส่ `data-static-header` เฉพาะ `SiteHeaderRoot` ที่เรนเดอร์ static แล้วให้สคริปต์เลือกเฉพาะตัวนั้น · ควรยืนยันด้วยเบราว์เซอร์จริงอีกครั้ง

### 🟡 A4-04 · เมนูลิ้นชักบนหน้า Astro ทุกหน้าไม่ไฮไลต์หน้าปัจจุบัน (ตัวบ่ง active หายเงียบ)
- ที่: `src/components/ui/SacredNavDropdown.tsx:45-46,165-167` + `astro/shims/next-navigation.ts:51-56`
- ปัญหา: `SiteHeaderRoot` ถูกเรนเดอร์ static (ไม่มี `client:*` ใน `astro/pages/**`) ➔ `usePathname()` ของ shim คืน server snapshot `""` ➔ `currentPath = "/"` ทุกหน้า ➔ `isActive` เป็นเท็จกับทุกเมนู (href ไม่มี `/`) และ `site-header.ts` ไม่ได้เติมให้ภายหลัง
- ผลกระทบ/สถานการณ์พัง: หน้า `/cards/*` `/spreads` `/blog/*` ฯลฯ (~330 หน้า) เปิดเมนูแล้วไม่มีแถบทอง/ตัวหนาบอกว่าอยู่หน้าไหน ทั้งที่ฝั่ง Next มี · ไม่มี `aria-current` ด้วย
- แนวแก้: ส่ง `currentPath` เป็น prop จาก `Astro.url.pathname` ลง `SiteHeaderRoot ➔ SiteHeader ➔ SacredNavDropdown` (ใช้แทน `usePathname` เมื่อมี) และใส่ `aria-current="page"` ให้ลิงก์ที่ active

### 🟡 A4-05 · CSP `connect-src`/`frame-src` แคบกว่าที่ gtag ต้องใช้จริง ➔ ยอด GA4 (เมื่อเปิด Google Signals) และ Google Ads conversion ถูกบล็อกเงียบ
- ที่: `src/lib/config/security-headers.ts:25-31` · `public/_headers:25`
- ปัญหา: อนุญาตแค่ `www.google-analytics.com` + `region1.google-analytics.com` · ตามคู่มือ CSP ของ Google Tag ต้องมี `https://*.google-analytics.com https://*.analytics.google.com https://*.googletagmanager.com` และถ้ามี Google Ads (`NEXT_PUBLIC_GOOGLE_ADS_ID` ซึ่งโค้ดรองรับใน `analytics-bootstrap.ts` และ `trackEvent` conversion) ต้องมี `https://www.googleadservices.com https://googleads.g.doubleclick.net https://www.google.com` (connect) และ `https://td.doubleclick.net https://www.googletagmanager.com` (frame)
- ผลกระทบ/สถานการณ์พัง: วันที่เจ้าของเติม Ads ID หรือเปิด Google Signals คำขอ `/g/collect` ไป `region1.analytics.google.com` และ conversion `reading_complete` จะโดน CSP ตัดทิ้ง (เห็นแค่ใน console) — แดชบอร์ดยอดตกโดยไม่มีด่านไหนฟ้อง
- แนวแก้: เติมโดเมนตามคู่มือ Google ลง `security-headers.ts` แล้วคัดลอกไป `_headers` (ด่าน `test-static-headers.ts` จะเทียบให้)
PROGRESS: [x] astro/shims astro/layouts astro/scripts public/sw.js public/_headers src/components/analytics src/components/pwa src/components/ui(LocaleLink,RouteLink,SacredNav)

### 🟡 A4-06 · Service Worker รุ่นใหม่ค้างเป็น waiting ตลอด — ไม่มีใครส่ง `SKIP_WAITING` ทั้งที่คอมเมนต์บอกว่า "ขึ้นทำงานตอนโหลดหน้าครั้งถัดไป"
- ที่: `public/sw.js:40-50,190-194` · `src/components/pwa/sw-register.ts:51,74-90`
- ปัญหา: install ไม่เรียก `skipWaiting()` (ตั้งใจ) และ grep ทั้งรีโปไม่มีโค้ดส่ง `{type:"SKIP_WAITING"}` เลย · ตามสเปก waiting worker จะ activate ก็ต่อเมื่อ **ไม่มีแท็บไหนถูกตัวเก่าคุมอยู่** — การรีโหลด/นำทางในแท็บเดียวไม่พอ (หน้าใหม่ถูกตัวเก่าคุมต่อ) · ตัวจับ `controllerchange` ใน `sw-register.ts` จึงแทบไม่เคยทำงาน
- ผลกระทบ/สถานการณ์พัง: ผู้ใช้ที่เปิดแท็บค้าง/ติดตั้ง PWA ใช้กฎแคชของ SW เก่าไปเรื่อย ๆ — การแก้กฎใน `sw.js` (เช่นบทเรียน INC-0164 ลำดับกฎ `/cards/`) ไปไม่ถึงคนกลุ่มนี้ และแคช static รุ่นเก่า (`seertarot-static-v-…`) ไม่ถูกล้าง
- แนวแก้: ใน `setupServiceWorker` เมื่อ `installingWorker.state === "installed" && container.controller` ให้ `postMessage({type:"SKIP_WAITING"})` ในจังหวะปลอดภัย (เช่นตอน `visibilitychange` เป็น hidden หรือก่อนนำทางครั้งถัดไป) แล้วให้ `controllerchange` รีโหลดตามที่ออกแบบไว้แล้ว · หรือแก้คอมเมนต์ให้ตรงความจริง

### 🟠 A4-07 · หน้าบัญชี: สวิตช์ความยินยอมการตลาด/ดวงประจำวันทางอีเมลแสดงว่า "บันทึกแล้ว" แม้เซิร์ฟเวอร์ตอบ 401/403/500
- ที่: `src/components/account/AccountClient.tsx:188-195` และ `:210-217`
- ปัญหา: `await fetch(...)` แล้ว `patchSessionUser(...)` ทันทีโดยไม่เช็ก `res.ok` — `fetch` ไม่โยนเมื่อได้ 4xx/5xx · ขณะที่ `src/app/api/account/consent/route.ts:28,34,48,73` ตอบ 403/401/400/500 ได้ · คอมเมนต์ใน catch เขียนเองว่า "ไม่แกล้งทำเป็นบันทึกสำเร็จ" แต่ทำจริงแค่กรณีเน็ตหลุด
- ผลกระทบ/สถานการณ์พัง: เซสชันหมดอายุ/D1 ล่ม ➔ ผู้ใช้กดยกเลิกรับอีเมล (PDPA opt-out) เห็นสวิตช์ปิดแล้ว แต่ฐานข้อมูลยังเปิดอยู่ ➔ ยังได้รับอีเมลการตลาด/ดวงรายวันต่อ = ละเมิดการถอนความยินยอมโดยไม่รู้ตัว
- แนวแก้: `const res = await fetch(...); if (!res.ok) { แสดงข้อความ error จาก body; return; }` ก่อน `patchSessionUser`

### 🟠 A4-08 · ปุ่ม "ลบข้อมูลทั้งหมด" กลืน error ของเซิร์ฟเวอร์เงียบ — บัญชีบนคลาวด์ไม่ถูกลบแต่ผู้ใช้เข้าใจว่าลบแล้ว
- ที่: `src/lib/account/delete-all-data.ts` (ฟังก์ชัน `deleteAllData`: `await fetch("/api/account",{method:"DELETE"}).catch(()=>{})` ไม่เช็ก `res.ok`) — ใช้ทั้ง `astro/scripts/delete-all-data.ts` และ `DeleteAllDataButton.tsx`
- ปัญหา: `src/app/api/account/route.ts:52` ตอบ 500 เมื่อลบใน D1 ไม่สำเร็จ (และ 403 เมื่อ origin ไม่ผ่าน) แต่ฝั่งหน้าเว็บล้าง storage แล้วพากลับหน้าแรกเหมือนสำเร็จเสมอ · ข้อความยืนยันบอกว่าจะลบ "ทั้งในเครื่องและบนบัญชี"
- ผลกระทบ/สถานการณ์พัง: D1 สะดุด/โดน 403 ➔ ประวัติ ไดอารี และบัญชีบนเซิร์ฟเวอร์ยังอยู่ครบ คุกกี้ httpOnly ยังล็อกอินอยู่ ผู้ใช้เชื่อว่าใช้สิทธิ์ลบข้อมูล (PDPA) แล้วทั้งที่ไม่เกิดขึ้น
- แนวแก้: แยกกรณี: 401 (ไม่ได้ล็อกอิน) ➔ ล้างเครื่องต่อได้ · 5xx/403/ออฟไลน์ขณะล็อกอินอยู่ ➔ แจ้ง "ลบบนบัญชีไม่สำเร็จ ลองใหม่" และไม่ redirect (หรืออย่างน้อยแจ้งว่าลบเฉพาะในเครื่อง)
PROGRESS: [x] src/components/account src/components/auth(partial) src/components/admin(endpoints) astro/lib

### 🟠 A4-09 · แผงค้นหาด้วยความรู้สึก (`/cards`) ยิง `/api/search` ทุกตัวอักษรที่พิมพ์ ไม่มี debounce/abort ➔ ผลลัพธ์สลับลำดับ + เปลือง Workers AI
- ที่: `src/components/encyclopedia/SemanticSearchPanel.tsx:23-62` + `src/components/encyclopedia/CardsExplorer.tsx:165,348-352`
- ปัญหา: เมื่อเปิดแผงแล้ว `query={searchQuery}` ผูกกับช่องพิมพ์ตรง ๆ (`onChange ➔ setSearchQuery`) ➔ `useEffect([query])` เรียก `fetchResults` ทุกคีย์ · ไม่มี `AbortController` หรือเช็กว่าคำตอบเป็นของ query ล่าสุด
- ผลกระทบ/สถานการณ์พัง: พิมพ์ "เสียใจเรื่องแฟน" 15 ตัว = 15 คำขอ embed + Vectorize (ทุกคำขอเป็น Worker invocation + Workers AI neuron) · คำตอบของ "เสีย" ที่มาช้ากว่าอาจทับผลของคำเต็ม ➔ ผู้ใช้เห็นไพ่ไม่ตรงคำที่พิมพ์ · ยิงชนเพดานโควตา `/api/search` จนได้ error ทั้งที่ใช้ปกติ
- แนวแก้: debounce ~400 ms ภายในแผง + `AbortController` ยกเลิกคำขอเก่าใน cleanup ของ effect (หรือเก็บ `latestQueryRef` แล้วทิ้งคำตอบที่ไม่ตรง)

### 🟠 A4-10 · ข้อความค้นหา "ความรู้สึก" ของผู้ใช้ถูกส่งดิบเข้า GA4 และ Meta Pixel — ขัดกับคำสัญญาในแถบความยินยอม
- ที่: `src/components/encyclopedia/SemanticSearchPanel.tsx:52-56` (`trackEvent("semantic_search", { query: q.trim() })`) · `src/components/encyclopedia/CardsExplorer.tsx:126` (`card_search` + `query`) · ส่งต่อใน `src/lib/analytics.ts:258-281` (ทั้ง `gtag("event")` และ `fbq("trackCustom", name, payload)`)
- ปัญหา: แถบยินยอม (`ConsentBanner.tsx`) บอกผู้ใช้ว่า "คำถามและคำทำนายของคุณไม่ถูกส่งเข้าระบบสถิติ" แต่ช่องค้นหาด้วยความรู้สึกออกแบบมาให้พิมพ์เรื่องส่วนตัว ("เสียใจเรื่องแฟน" ฯลฯ) แล้วส่งข้อความเต็มเป็นพารามิเตอร์ event · GA ภายใต้ Consent Mode (analytics_storage=denied) ยังส่ง cookieless ping พร้อมพารามิเตอร์ไป Google ได้ด้วย
- ผลกระทบ/สถานการณ์พัง: ข้อความส่วนตัว/อ่อนไหว (รวมถึงสัญญาณทำร้ายตัวเองที่ Safety Guard ควรกัน) ไปอยู่ใน GA4/Meta · เสี่ยง PDPA และขัดคำสัญญาในหน้าเว็บ
- แนวแก้: ส่งเฉพาะ `query_len` + `results_count` (ตัด `query` ออกจากทั้งสอง event และจาก type ใน `analytics.ts`) หรือส่งเฉพาะเมื่อเป็นชื่อไพ่ที่ตรงสำรับ

### 🟠 A4-11 · event `card_detail_view` และ `blog_read` บนหน้า Astro หายทุกครั้ง — ยิงก่อน gtag ถูกติดตั้ง และ `trackEvent` ไม่มีคิว
- ที่: `astro/scripts/card-orientation.ts` (บล็อก `trackEvent("card_detail_view", …)` ท้ายไฟล์) · `astro/scripts/article-share.ts` (`trackEvent("blog_read", …)`) · `src/lib/analytics.ts:260-262` · `src/lib/analytics-bootstrap.ts` (`scheduleWhenUserEngages` รอ scroll/click หรือ idle+15 วิ)
- ปัญหา: สคริปต์หน้าไพ่/บทความเรียก `trackEvent` ทันทีตอนโมดูลโหลด แต่ `bootstrapAnalytics()` ตั้งใจเลื่อนการสร้าง `window.gtag` ไปจนผู้ใช้โต้ตอบ · `trackEvent` เช็ก `typeof window.gtag === "function"` แล้วข้ามเงียบ ไม่ต่อคิวลง `dataLayer` (ต่างจาก `setAnalyticsConsent` ที่ต่อคิวเอง)
- ผลกระทบ/สถานการณ์พัง: หน้าไพ่ 156 หน้า + บทความทุกหน้า ไม่เคยส่ง event สองตัวนี้เลยตั้งแต่ย้ายมา Astro — รายงานยอดอ่านไพ่/บทความใน GA4 เป็นศูนย์หรือต่ำผิดจริง โดยไม่มีด่านไหนฟ้อง (ด่าน `test-analytics-integrity` ตรวจแค่ชื่อ/คีย์)
- แนวแก้: ให้ `trackEvent` ต่อคิวแบบเดียวกับ `setAnalyticsConsent` เมื่อยังไม่มี gtag (`window.dataLayer.push(arguments)` รูปแบบ `["event", name, payload]`) หรือให้สองสคริปต์นี้รอ event "analytics-ready" ก่อนยิง

### 🟡 A4-12 · (ระเบิดเวลา) `astro.config.mjs` ไม่ define `NEXT_PUBLIC_GOOGLE_ADS_ID`/`_CONVERSION_LABEL` ➔ หน้า Astro จะไม่มี Google Ads/conversion แม้ตั้งค่าแล้ว
- ที่: `astro.config.mjs` บล็อก `vite.define` (มีแค่ GA_ID · META_PIXEL_ID · IMAGEKIT · CLOUDINARY) · `src/lib/analytics.ts:63-71`
- ปัญหา: Vite แทน `process.env` ที่ไม่ได้ define ด้วย `{}` — ยืนยันจาก `dist/_astro/analytics.*.js`: `let e={}.NEXT_PUBLIC_GOOGLE_ADS_ID?.trim()` ➔ คืน undefined เสมอ · และเมื่อ `NEXT_PUBLIC_GA_ID` ถูกฝังแล้ว `bootstrapAnalytics` จะไม่ไปอ่าน `/api/config/analytics` เลย จึงไม่มีทางได้ Ads ID จากที่อื่น · ขั้น `npm run build` ใน `deploy.yml:55-61` ก็ไม่ส่งสองตัวนี้ (ส่งแค่ขั้น deploy บรรทัด 161-162)
- ผลกระทบ/สถานการณ์พัง: วันที่เจ้าของเริ่มใช้ Google Ads ตามคอมเมนต์ใน `deploy.yml:110-116` conversion `reading_complete` ซึ่งเกิดบนหน้าแรก (Astro) จะไม่ถูกยิงเลย ฝั่ง Next ได้ แต่ Astro ไม่ได้ — ยอดโฆษณาผิดเงียบ ๆ
- แนวแก้: เติม define สองตัวใน `astro.config.mjs` + ส่ง env สองตัวในขั้น build ของ `deploy.yml`/`pr.yml` · หรือเปลี่ยนเป็น `import.meta.env` ที่มีด่านตรวจว่า define ครบทุก `process.env.NEXT_PUBLIC_*` ที่ถูกอ้าง
PROGRESS: [x] astro/scripts astro.config.mjs src/components/encyclopedia(search) src/components/security

### 🟠 A4-13 · ใส่รหัสผ่านผิดครั้งเดียวแล้วลองใหม่ไม่ได้ — token Turnstile ใช้ซ้ำหลังคำขอแรก (siteverify ตอบ duplicate)
- ที่: `src/components/auth/AuthModal.tsx:247-253` (ส่ง `turnstileToken` เดิม) · `:535` (`resetKey={mode}` รีเซ็ตเฉพาะตอนสลับโหมด) · `src/app/api/auth/email/login/route.ts:44` (ตรวจ Turnstile ก่อนตรวจรหัส จึงเผา token ทุกครั้ง)
- ปัญหา: token ของ Turnstile ใช้ได้ครั้งเดียว · หลังคำขอเข้าสู่ระบบ/สมัคร/ลืมรหัสล้ม (รหัสผิด · อีเมลซ้ำ · 429) โค้ดไม่เรียก `turnstile.reset()` และไม่ตั้ง token กลับเป็น `""` · Turnstile เปิดจริงบน production (`PENDING_SETUP.md:72-73,157`)
- ผลกระทบ/สถานการณ์พัง: พิมพ์รหัสผิด ➔ แก้แล้วกดใหม่ ➔ siteverify ตอบ `timeout-or-duplicate` ➔ ถูกปฏิเสธด้วยข้อความ Turnstile ทุกครั้ง จนกว่าจะปิดหน้าต่างหรือสลับแท็บสมัคร/เข้าสู่ระบบ — ผู้ใช้จริงเข้าใจว่าล็อกอินพัง
- แนวแก้: ใน `catch` ของ `handleSubmit` ให้บังคับรีเซ็ต widget (เพิ่ม state `attempt` แล้วส่ง `resetKey={\`${mode}-${attempt}\`}`) และ `setTurnstileToken("")` ทันทีหลังส่งทุกครั้ง
PROGRESS: [x] src/components/auth src/components/marketplace src/components/providers src/components/pwa

### 🟠 A4-14 · token รีเซ็ตรหัสผ่านใน URL รั่วไป GA4 (page_location) และถูกเก็บใน Cache Storage ของ Service Worker
- ที่: `src/app/(th)/reset-password/page.tsx:14-15` (อ่าน `?token=` แต่ไม่ลบออกจาก URL) · `src/lib/analytics-bootstrap.ts` `installGoogleTag` (`gtag("config", gaId, { send_page_view: true })` — GA4 ส่ง `page_location` = URL เต็มรวม query) · `public/sw.js:81-104` (network-first เก็บทุกหน้า HTML ที่ได้ 200 ลง `seertarot-runtime-*` โดยใช้ URL เต็มเป็นคีย์)
- ปัญหา: หน้านี้ไม่อยู่ในรายการยกเว้นของ SW (`/api` `/admin` `/account` `/readers/console` `/readers/queue`) และไม่ `history.replaceState` ตัด token ก่อน analytics บูต (บูตหลังผู้ใช้แตะ/scroll ครั้งแรก ซึ่งต้องเกิดแน่เพราะต้องพิมพ์รหัสใหม่) · Consent Mode ที่ denied ยังส่ง cookieless ping พร้อม `page_location` ได้
- ผลกระทบ/สถานการณ์พัง: token ที่ใช้ตั้งรหัสผ่านใหม่ได้ (อายุ 15 นาที) ไปอยู่ในรายงาน GA4 ของทุกคนที่มีสิทธิ์ดู property และค้างอยู่ใน Cache Storage ของเครื่อง (เครื่องสาธารณะ/เครื่องร่วม) หลังใช้งาน
- แนวแก้: ในหน้า reset-password เก็บ token ลง state แล้ว `history.replaceState(null, "", location.pathname)` ทันทีตอน mount · เพิ่ม `/reset-password` (และ `/tester`) ในรายการ network-only ของ `sw.js` · ทางเลือกเสริม: ให้ `installGoogleTag` ส่ง `page_location` ที่ตัด query ออกสำหรับเส้นทางที่มีความลับ
PROGRESS: [x] src/app/(th|en) layouts src/components/blog src/components/readers
STATUS: DONE
