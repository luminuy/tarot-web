# A1-security-core

> ผู้ตรวจ: A1 (ความปลอดภัยแกนกลาง) · ฐาน `47efdef` · 2026-10-18
> ขอบเขต: `src/lib/security/**` · auth/session · `src/server/store.ts` · `src/app/api/{auth,admin,tester,cron,account,config,push,studio,stats}/**` · middleware · ส่วนหัว/CSP · ตารางสิทธิ์ API ทั้ง 121 เส้น

## ความคืบหน้า

## ข้อค้นพบ


### 🟠 A1-01 · กล้อง/ไมค์ถูกบล็อกเมื่อเข้าหน้าคิววิดีโอด้วยการเปลี่ยนหน้าฝั่ง client (`<Link>`) — Permissions-Policy ติดมากับเอกสารแรก
- ที่: `src/app/(th)/readers/bookings/page.tsx:120` (`<Link href="/readers/queue/...">`) · `src/lib/config/security-headers.ts:70` (`CALL_PAGE_SOURCES`) · `next.config.ts:140`
- ปัญหา: ทั้งเว็บส่ง `Permissions-Policy: camera=(), microphone=()` เปิดให้ `camera=(self)` เฉพาะ `/readers/queue/:id` กับ `/readers/console` — แต่นโยบายนี้ผูกกับ **เอกสาร (document) ที่โหลดครั้งแรก** เท่านั้น การเปลี่ยนหน้าแบบ soft navigation ของ Next (`<Link>` / `router.push` ภายใต้ root layout เดียวกัน `src/app/(th)/layout.tsx`) ไม่โหลดเอกสารใหม่ ส่วนหัวของหน้า queue จึงไม่ถูกใช้เลย
- ผลกระทบ/สถานการณ์พัง: ลูกค้าจ่ายเงินจองแล้ว ➔ `/account` ➔ "การจองของฉัน" (`/readers/bookings` โหลดเต็ม ได้ `camera=()`) ➔ แตะรายการ ➔ `<Link>` พาไป `/readers/queue/<id>` แบบ soft nav ➔ ถึงเวลาคอล `getUserMedia()` โยน `NotAllowedError` ทันทีโดยไม่มีหน้าต่างขออนุญาต ➔ จอขึ้น "ยังไม่ได้อนุญาตให้ใช้กล้องและไมโครโฟน กรุณากดอนุญาตในเบราว์เซอร์" (`VideoCallRoom.tsx:277`) ซึ่งกดอนุญาตที่ไหนก็ไม่ได้ ลองใหม่กี่ครั้งก็พังจนกว่าจะรีเฟรชหน้า — คอลที่จ่ายเงินแล้วเริ่มไม่ได้ (เส้นอื่นที่โหลดเต็มหน้า เช่นลิงก์ในอีเมล · `redirect()` จาก `/readers/room/[code]` · กลับจาก Stripe ไม่โดน)
- หลักฐาน: GET production `/readers/queue/test123` ➔ `permissions-policy: camera=(self), microphone=(self)` · `/readers` ➔ `camera=()` (ยืนยันว่าหัวแยกตามเส้นจริง) · `grep` พบ `<Link href={`/readers/queue/${item.ticketId}`}>` ใน bookings และทั้งสองหน้าอยู่ใต้ root layout เดียว (`(th)/layout.tsx` ไม่มี `<html>` แยก) · สเปก Permissions Policy: นโยบายกำหนดตอนสร้าง Document, `history.pushState` ไม่เปลี่ยน
- แนวแก้: ใช้ `<a href>` ธรรมดา (หรือ `reloadDocument`/`window.location.assign`) ทุกลิงก์ที่ชี้ไป `/readers/queue/*` และ `/readers/console` · หรือขยาย `camera=(self)` ไปทุกหน้าใต้ `/readers/*` ที่พาไปหน้าคอลได้ · ใน `VideoCallRoom` ถ้า `document.featurePolicy?.allowsFeature?.("camera") === false` (หรือ `NotAllowedError` โดยไม่มี prompt) ให้ `location.reload()` เองหนึ่งครั้ง
- ความมั่นใจ: ไล่โค้ดแล้ว (traced) — ไม่มีเบราว์เซอร์ในเครื่องให้ repro; ฝาก A6 ยืนยันบนเบราว์เซอร์จริง

### 🟠 A1-02 · Open redirect หลังล็อกอิน Google/LINE — `returnUrl=/%09/evil.com` ผ่านด่าน แล้ว `new URL()` ตัดแท็บทิ้งกลายเป็น `//evil.com`
- ที่: `src/app/api/auth/[provider]/route.ts:22-29` (ตรวจ `returnUrl`) · `src/app/api/auth/[provider]/callback/route.ts:268-276` (`new URL(targetPath, origin)`)
- ปัญหา: ด่านกัน open redirect ตรวจแค่ "ขึ้นต้น `/` · ไม่ขึ้นต้น `//` · ไม่มี `\`" แต่ตัวแยก URL ของ WHATWG **ลบอักขระ tab/CR/LF ทิ้งทุกตำแหน่ง** ก่อนแยก — `"/\t/evil.example"` จึงผ่านด่าน แล้ว `new URL("/\t/evil.example", origin)` ได้ `https://evil.example/` · ค่ารอดผ่านคุกกี้ `tarot_oauth_return` ได้ด้วย (Next เข้ารหัสเป็น `%2F%09%2F...` ตอนเขียน และถอดกลับตอนอ่าน)
- ผลกระทบ/สถานการณ์พัง: ผู้โจมตีส่งลิงก์ `https://seertarot.net/api/auth/google?returnUrl=/%09/evil.example/login` (โดเมนเราจริง ดูน่าเชื่อ) ➔ เหยื่อเลือกบัญชี Google ➔ callback ออกคุกกี้เซสชันแล้ว 302 ไป `https://evil.example/login?auth_success=1` ซึ่งทำหน้าตาเหมือน SeerTarot ขอ "ยืนยันรหัสผ่าน/บัตร" (phishing ต่อจากการล็อกอินจริง) · ใช้ LINE ได้เหมือนกัน
- หลักฐาน: repro ในเครื่อง (`scratchpad/a1/cookie-test.cjs` ใช้ `ResponseCookies`/`RequestCookies` ของ Next ตัวจริง): `Set-Cookie: tarot_oauth_return=%2F%09%2Fevil.example%2Fx` ➔ อ่านกลับได้ `"/\t/evil.example/x"` ➔ `passes guard: true -> https://evil.example/x`
- แนวแก้: ตรวจหลังแยก URL แทนการตรวจสตริง — `const u = new URL(raw, origin); if (u.origin !== origin) ใช้ "/"; targetPath = u.pathname + u.search + u.hash` (ทำทั้งตอนรับใน `[provider]/route.ts` และตอนใช้ใน callback) · หรือปฏิเสธทุกค่าที่มีอักขระ `[\x00-\x1F\x7F]`
- ความมั่นใจ: ยืนยันแล้ว (repro)

### 🟠 A1-03 · โทเคนเข้าแผงแม่หมอ (อายุสูงสุด 30 วัน) ค้างอยู่ใน URL `/readers/console?token=` แล้วถูกส่งเข้า GA4 (และ Meta Pixel) ทุกครั้งที่เปิดแผง
- ที่: `src/app/(th)/readers/console/page.tsx:79-80` (อ่าน `token` จาก query แต่ไม่เคย `history.replaceState` ลบออก) · `src/lib/analytics-bootstrap.ts:204` (`gtag("config", …)` ยิง page_view พร้อม `page_location` = `location.href` เต็ม) · `src/app/_shared/RootHtml.tsx:214` (GA โหลดทุกหน้าที่ Next เรนเดอร์ รวมหน้าแผงนี้) · ลิงก์ออกโดย `src/components/admin/ReadersManager.tsx:192`
- ปัญหา: โทเคนแม่หมอคือ credential ตัวเดียวของแผงคิว (`requireReader` รับผ่าน `Authorization: Bearer`) อายุ 1/7/30 วัน (`console-link.ts`) และเพิกถอนไม่ได้นอกจากหมุน `sessionSecret` — หน้านี้ไม่ลบโทเคนออกจาก URL ต่างจากหน้าที่แก้ไปแล้ว (`/reset-password` A4-14 · `/readers/studio` · `StudioApp`) · นอกจากนี้ `fetchConsoleData` ยังต่อ `?token=` ลง URL ของ `/api/marketplace/console/queue` ทุก 5 วินาที (ฝั่ง API ไม่ได้อ่านแล้ว แต่โทเคนไปค้างใน log ของ Cloudflare ตามที่คอมเมนต์ `reader-auth.ts:93` ห้ามไว้เอง)
- ผลกระทบ/สถานการณ์พัง: แม่หมอเปิดลิงก์แผง ➔ แตะหน้าจอครั้งแรก ➔ gtag ส่ง `dl=https://seertarot.net/readers/console?id=…&token=<โทเคน>` ไป GA4 (Consent Mode ส่ง ping แบบไม่มีคุกกี้แม้ยังไม่ยินยอม) ➔ ใครก็ตามที่มีสิทธิ์ดูรายงาน GA4 (ทีมการตลาด/เอเจนซี) เปิดรายงาน "Page location" แล้วก๊อปลิงก์ไปเข้าแผงแม่หมอได้ทันทีจนโทเคนหมดอายุ: เห็นคิว/ชื่อ/คำถามลูกค้า เปิดห้องวิดีโอในนามแม่หมอ แก้ตารางเวลา/ตั้งค่า · ถ้าผู้ใช้กดยินยอมคุกกี้ Meta Pixel ก็ได้ URL เดียวกันไปด้วย
- หลักฐาน: production ใช้ GA4 จริง (`/_astro/analytics.BRSy-apt.js` มี `G-LT8YMJNT2R`) · `grep replaceState src/app/(th)/readers/console/page.tsx` ไม่พบ · `analytics.ts:402-412` ใช้ `window.location.href` เป็น `page_location` · บรรทัด 109 ของหน้าแผง `params.set("token", token)` ต่อท้าย URL ของ API
- แนวแก้: ทำแบบหน้าสตูดิโอ — อ่านโทเคนครั้งเดียวเก็บ `sessionStorage` แล้ว `history.replaceState` ลบ `token` ออกทันทีตอน mount (ก่อน gtag จะติดตั้ง) · ลบ `params.set("token", token)` ใน `fetchConsoleData` · ระยะยาว: ให้ลิงก์จากแอดมินเป็นรหัสแลกครั้งเดียว (exchange) ที่ได้คุกกี้ httpOnly แทนโทเคนอายุ 30 วันใน URL · ทางกันซ้อน: ไม่ติดตั้ง GA/Pixel บนเส้นส่วนตัว (`/readers/console` · `/readers/studio` · `/r/*` · `/reset-password`) — `/r/<token>` (ลิงก์คำอ่านลูกค้าของ Reader Studio) ก็ส่งโทเคนใน path ไป GA4 แบบเดียวกันทันทีที่เปิดสตูดิโอ แม้หน้าจะตั้ง `referrer: no-referrer` ไว้แล้วก็ตาม
- ความมั่นใจ: ไล่โค้ดแล้ว (traced)
