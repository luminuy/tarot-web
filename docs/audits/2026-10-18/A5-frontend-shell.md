# A5-frontend-shell

> ผู้ตรวจ: A5 · Frontend เชลล์ · Astro islands · UI 2.0 · PWA · สองภาษา · 2026-10-18
> ฐานโค้ด: 47efdef

## ความคืบหน้า
- [x] public/sw.js · src/components/pwa/** · scripts/bump-sw-version.ts

## ข้อค้นพบ

### 🟠 A5-01 · Service Worker เก็บหน้าที่มี "กุญแจใน URL" ลง Cache Storage อีก 2 เส้น: `/readers/studio?token=` (โทเคนแม่หมอ) และ `/r/<token>` (คำอ่านส่วนตัวของลูกค้า รวมฉบับที่ปลดรหัสแล้ว)
- ที่: `public/sw.js:83-98` (รายการ Network-Only) + `public/sw.js:113-125` (`cache.put(request, …)` ทุกการเปิดหน้า) · ต้นทาง: `src/app/(th)/readers/console/page.tsx:318` (ลิงก์ `/readers/studio?token=…`) · `src/app/(th)/r/[token]/page.tsx:97-110`
- ปัญหา: รอบก่อน (A4-14) ตัดเฉพาะ `/reset-password` · `/readers/room` · `/readers/console` · `/readers/queue` ออกจากการแคชหน้า แต่ยังมีอีก 2 เส้นที่ URL เป็นความลับ และไม่อยู่ในรายการ ➔ ตกไปบล็อก navigate ที่ `cache.put(request, response)` เก็บทั้ง URL (คีย์) และ HTML ลง `seertarot-runtime-<ver>`
  1. `/readers/studio?token=<โทเคนแม่หมอ>` — หน้า studio ตั้งใจย้ายโทเคนไป sessionStorage แล้ว `replaceState` ลบออกจาก URL ("ลิงก์ที่ก๊อปจากแถบที่อยู่/ประวัติจึงไม่มีโทเคน") แต่ SW เก็บ URL เต็มพร้อมโทเคนเป็นคีย์แคชไปก่อนแล้ว (โทเคนเดียวกับแผงคิว ใช้เป็น Bearer เปิดข้อมูลลูกค้าใน Reader Studio)
  2. `/r/<token>` (force-dynamic · noindex · `referrer: no-referrer`) — หลังลูกค้าใส่รหัสผ่าน หน้าเรนเดอร์คำถาม/คำอ่านเต็มเป็น HTML ➔ SW เก็บฉบับที่ "ปลดรหัสแล้ว" ไว้ · ตอนออฟไลน์ `caches.match(request)` เสิร์ฟให้ทันทีโดย **ไม่ผ่านการตรวจคุกกี้รหัส/หมดอายุ/เพิกถอน** ที่หน้าเขียนไว้ว่า "ตรวจทุกครั้งที่เปิด"
- ผลกระทบ/สถานการณ์พัง: (1) แม่หมอกด "สตูดิโอ" จากแผงคิวบนเครื่องร้าน/เครื่องที่ใช้ร่วม ➔ เปิด DevTools > Application > Cache Storage > `seertarot-runtime-*` เห็นคีย์ `https://seertarot.net/readers/studio?token=eyJ…` ยกไปใช้ต่อได้จนโทเคนหมดอายุ (2) ลูกค้าเปิดลิงก์ `/r/<token>` ใส่รหัส อ่านจบ ➔ แม่หมอเพิกถอนลิงก์ ➔ ใครก็ได้ที่ใช้เครื่องนั้นต่อ ปิดเน็ตแล้วเปิดลิงก์จากประวัติ ได้คำอ่านส่วนตัวเต็มทั้งที่ถูกเพิกถอน/มีรหัสอยู่
- หลักฐาน: ไล่โค้ด — บล็อก Network-Only (`sw.js:83-98`) เช็กด้วย `startsWith` 9 ตัว ไม่มี `/readers/studio` และ `/r/` · เส้น navigate เก็บทุก response 200 ไม่ดู `Cache-Control: no-store` · `test-pwa.ts:88` ทดสอบแค่ `/api/journal` `/account` `/reset-password`
- แนวแก้: เพิ่ม `/readers/studio` และ `/r/` (ระวังอย่าให้ไปจับ `/readers`/`/reading` — ใช้ `pathname.startsWith("/r/")`) เข้ารายการ Network-Only · ดีกว่านั้นให้เส้น navigate ไม่เก็บ response ที่มี `Cache-Control` `no-store`/`private` หรือ URL ที่มี query `token=` เลย (กันเส้นใหม่ในอนาคต) · เพิ่มกรณีทั้งสองใน `test-pwa.ts`
- ความมั่นใจ: ไล่โค้ดแล้ว (traced)

### 🟠 A5-02 · `/journal` มีหน้าอังกฤษ `/en/journal` แล้วแต่ไม่อยู่ใน `EN_TWIN_ROUTES` ➔ ทุกหน้าอังกฤษ (432 หน้า) ลิงก์ "My tarot journal" ไปหน้าไทย และปุ่มสลับภาษาบน `/journal` · `/en/journal` บอกผิดว่า "หน้านี้มีเฉพาะภาษาไทย"
- ที่: `src/lib/i18n/paths.ts:15-36` (ไม่มี `"/journal"`) · ผู้ใช้: `src/components/layout/header-nav.ts:112` · `src/components/ui2/Ui2NextSteps.tsx:74` · `src/components/home2/Ui2StaticSections.tsx:402` (ผ่าน `localeHref`) · `src/components/layout/LanguageSwitcher.tsx:39,190-216` · หน้าที่มีจริง: `astro/pages/en/journal.astro` (มาตั้งแต่ #653)
- ปัญหา: `hasEnglishTwin("/journal") === false` ➔ (1) `localeHref("/journal","en")` คืน `/journal` เมนูนำทาง/กล่อง "Keep a tarot journal" บนหน้าอังกฤษจึงพาไปหน้าไทย (2) `LanguageSwitcher` บน `/journal` และ `/en/journal` เรนเดอร์เป็น `<button>` จำภาษาอย่างเดียว ไม่ใช่ลิงก์ไปฝาแฝด พร้อมข้อความ "This page is in Thai only — your choice applies to other pages." ทั้งที่หน้าอังกฤษมีอยู่จริง (3) หน้า Astro ตรึงภาษาตาม URL การกดปุ่มจึงไม่เปลี่ยนอะไรบนหน้านั้นเลย
- ผลกระทบ/สถานการณ์พัง: ผู้ใช้อังกฤษอยู่ `/en/cards` ➔ เปิดเมนู ➔ "My tarot journal" ➔ ได้หน้าสมุดดวงภาษาไทยทั้งหน้า (ไม่มีทางสลับกลับ เพราะปุ่มภาษาบนหน้านั้นเป็นปุ่มจำค่า ไม่พาไป `/en/journal`) · ผู้ใช้ไทยบน `/journal` กด English ก็ไม่ไปไหน
- หลักฐาน: `scratchpad/a5/links.py` บน `dist/` — `/journal` ถูกลิงก์จากหน้าอังกฤษ 432 หน้า (ตัวอื่นที่ติดอันดับคือ `/readers` · `/account` ซึ่งตั้งใจไม่มีฝาแฝด) · `grep "This page is in Thai only" dist/en/journal.html` เจอ · `dist/en/cards.html` มี `<a href="/journal" class="nv-row">`
- แนวแก้: เพิ่ม `"/journal"` ใน `EN_TWIN_ROUTES` · ให้ `test-en-routing.ts` ไล่ไฟล์ `astro/pages/en/**` จริงแล้วเทียบกับ `hasEnglishTwin` สองทาง (มีไฟล์แต่ไม่ประกาศ = ตก) — ตอนนี้ด่านตรวจทางเดียว (ประกาศแล้วต้องมีหน้า)
- ความมั่นใจ: ยืนยันแล้ว (ตรวจจาก HTML ที่บิลด์แล้ว)

### 🟠 A5-03 · ตัวแก้ A4-06 (ส่ง `SKIP_WAITING` ตอน `pagehide`) ทำให้ "ทุกแท็บอื่น" ของเว็บรีโหลดเองทันทีหลัง deploy — รวมแท็บห้องวิดีโอปรึกษาที่จ่ายเงินแล้ว
- ที่: `src/components/pwa/sw-register.ts:111-124` (ส่ง SKIP_WAITING ตอนแท็บนี้ออกจากหน้า) + `:96-103` (`controllerchange` ➔ `reload()`) + `public/sw.js:66-67` (`clients.claim()` ตอน activate) · ใช้ทั้งหน้า Astro (`astro/scripts/site-chrome.ts:77`) และหน้า Next ทุกหน้า (`src/app/_shared/RootHtml.tsx:213`)
- ปัญหา: ธงกันรีโหลด (`skipFlag`) อยู่ใน **sessionStorage ของแท็บที่ส่ง SKIP_WAITING เท่านั้น** · พอตัวใหม่ activate แล้ว `clients.claim()` ยึดทุกแท็บที่ตัวเก่าคุมอยู่ ➔ ทุกแท็บอื่นได้ `controllerchange` โดย `hadController = true` และไม่มีธง ➔ `window.location.reload()` ทันทีโดยไม่ถาม ไม่สนว่าแท็บนั้นกำลังทำอะไร (คอมเมนต์ในโค้ดเขียนว่า "ไม่รีโหลดหน้าที่เขากำลังใช้อยู่" ซึ่งจริงเฉพาะแท็บที่กดเปลี่ยนหน้า)
- ผลกระทบ/สถานการณ์พัง: เว็บ deploy อัตโนมัติทุก PR ที่ merge (หลายครั้งต่อวัน) · ลูกค้าคุยวิดีโอกับแม่หมออยู่ในแท็บ `/readers/queue/<id>` หรือ `/readers/room/<code>` และเปิดอีกแท็บอ่านความหมายไพ่ ➔ หลัง deploy ลูกค้ากดลิงก์ใดก็ได้ในแท็บที่สอง ➔ แท็บห้องวิดีโอรีโหลดเอง สายหลุดกลางการปรึกษาที่จ่ายเงิน · แบบเดียวกันกับแท็บที่พิมพ์คำถาม/แชทกับแม่หมอ AI ค้างไว้ หรือแม่หมอที่เปิดแผงคิว + สตูดิโอคนละแท็บ
- หลักฐาน: ยืนยันด้วย Playwright (`scratchpad/a5/sw/repro.js` · เสิร์ฟ `dist/` + `public/sw.js` บนพอร์ต 4305) — แท็บ A `/cards` · แท็บ B `/spreads` (ตั้ง `window.__marker`) ➔ เปลี่ยน `CACHE_VERSION` ➔ แท็บ A เปิด `/cards/all` (log "New content available") ➔ แท็บ A เปิด `/cards/major` ➔ ผล: `B load event /spreads` ครั้งที่ 2 · `B marker after: undefined` (แท็บ B ถูกรีโหลด) ขณะที่แท็บ A ไม่รีโหลด (`nav type navigate`)
- แนวแก้: แท็บที่ไม่ได้เป็นคนสั่ง SKIP_WAITING ไม่ควรรีโหลดทันที — ตั้งธง "มีรุ่นใหม่" แล้วรีโหลดตอนแท็บนั้นถูกซ่อน (`visibilitychange` ➔ hidden) หรือตอนผู้ใช้เปลี่ยนหน้าครั้งถัดไป · อย่างน้อยยกเว้นหน้าที่ "กำลังใช้งานสด" (`/readers/room` · `/readers/queue` · `/reading/chat` · `/readers/console` · `/readers/studio`) · หรือเลือกส่ง SKIP_WAITING เฉพาะเมื่อมีแท็บเดียว (`clients.matchAll` ฝั่ง SW) · เพิ่มกรณีหลายแท็บใน `test-sw-reload.ts`
- ความมั่นใจ: ยืนยันแล้ว (repro)

### 🟡 A5-04 · กดการแจ้งเตือน Push แล้ว SW "ยึด" แท็บเว็บที่เปิดอยู่แท็บแรกไปเปลี่ยนหน้า — ทับงานที่ผู้ใช้ทำค้าง (แชท/ห้องวิดีโอ/คำถามที่พิมพ์ไว้) และไม่มีทางสำรองเมื่อ `navigate()` ล้ม
- ที่: `public/sw.js:265-279` (`notificationclick`)
- ปัญหา: วนหา window ของ origin เดียวกันตัวแรกจาก `clients.matchAll({ includeUncontrolled: true })` (ลำดับคือแท็บที่โฟกัสล่าสุดก่อน) แล้ว `w.navigate(url)` ทันที ไม่ดูว่าแท็บนั้นอยู่หน้าอะไร · และ `WindowClient.navigate()` ใช้ได้เฉพาะแท็บที่ SW ตัวนี้คุมอยู่ — แท็บที่ไม่ถูกคุม (เช่นเปิดด้วย Shift+Reload หรือเปิดก่อน SW ตัวใหม่ activate) ทำให้ promise reject ➔ ไม่ `openWindow` ต่อ = กดแจ้งเตือนแล้วไม่มีอะไรเกิดขึ้น
- ผลกระทบ/สถานการณ์พัง: ผู้ใช้เปิดรับแจ้งเตือน "พิธีเช้า 2 นาที" (`/api/cron/push-reminders` ➔ `url: "/daily?utm_source=push"`) ➔ เช้าวันหนึ่งกำลังคุยกับแม่หมอ AI ใน `/reading/chat` หรืออยู่ในห้องวิดีโอ `/readers/queue/<id>` ➔ กดแจ้งเตือนบนมือถือ ➔ แท็บนั้นถูกพาไป `/daily` ทันที บทสนทนา/สายหลุด
- หลักฐาน: ไล่โค้ด — `for (const w of wins) { if (sameOrigin && "focus" in w) return w.navigate(url).then(...) }` ไม่มี `.catch` ไปทาง `openWindow`
- แนวแก้: หาแท็บที่อยู่ที่ URL ปลายทางแล้ว (`new URL(w.url).pathname === pathOf(url)`) ➔ `focus()` อย่างเดียว · ไม่เจอ ➔ `clients.openWindow(url)` (ไม่ยึดแท็บที่กำลังใช้) · ถ้ายังอยากใช้ navigate ให้ `.catch(() => clients.openWindow(url))`
- ความมั่นใจ: ไล่โค้ดแล้ว (traced)

