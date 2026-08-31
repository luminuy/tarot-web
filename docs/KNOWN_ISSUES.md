# 🐛 บั๊กและงานค้างที่รู้แล้วแต่ยังไม่ได้แก้ (Known Issues Registry)

> 🎯 **สำหรับ AI Agent ทุกตัว**: นี่คือรายการปัญหาที่ **ตรวจสอบยืนยันแล้วว่ามีจริง** แต่ยังไม่ได้แก้
>
> - **ก่อนเริ่มงานใหม่** ให้ดูก่อนว่ามีงานในนี้ที่เกี่ยวข้องกับสิ่งที่กำลังจะแก้หรือไม่
> - **ก่อนลงมือ** ให้ตรวจว่ามี Agent อื่นจับงานนี้อยู่หรือยัง (`npm run agent:status`) และล็อคไฟล์ก่อนเสมอ
> - **เมื่อแก้เสร็จ** ให้ย้ายรายการนั้นออกจากไฟล์นี้ แล้วบันทึกลง [`docs/INCIDENT_LOG.md`](INCIDENT_LOG.md) แทน
>
> ปัญหาที่ **แก้ไปแล้ว** อยู่ใน [`docs/INCIDENT_LOG.md`](INCIDENT_LOG.md) พร้อมกฎป้องกันถาวร — อ่านที่นั่นก่อนเริ่มงานทุกครั้ง
>
> 🔒 **หมายเหตุ**: `npm run repo:verify` มีด่าน **"การอ้างอิง path ภาพไพ่ถูกต้อง"** (ด่านที่ 7)
> ซึ่งจะบล็อกทันทีถ้ามีการเขียน path ภาพไพ่เองในจุดใหม่ (บทเรียนจาก ISSUE-008 ที่ละเมิดกฎซึ่งมีเขียนไว้แล้วใน INC-0002)

---

## 📅 การตรวจซ้ำครั้งล่าสุด (Last Full Re-Audit)

| หัวข้อ | ค่า |
| :--- | :--- |
| **วันที่** | 2026-08-31 |
| **commit ที่ตรวจ** | `46fe3e9` (main) |
| **วิธีตรวจ** | Next.js dev server (`next dev --webpack` :3100) + คลิกจริงผ่านเบราว์เซอร์ + `curl` ยิง path ตรง + `npm run repo:verify` (ผ่าน 7/7) |
| **ผลสรุป** | 🔴 **ISSUE-001 ยังเกิดอยู่ — เว็บใช้ดูดวงไม่ได้เลย** · ISSUE-002/003/008/009 ยังเกิดครบ · ISSUE-004–007 ยังเป็นข้อจำกัดเดิม · **เพิ่มใหม่** ISSUE-010 (`.env.example` เพี้ยน + ช่องโหว่ session secret), ISSUE-011 (npm/pnpm) |

### 🗂️ ดัชนีบั๊กที่ยังค้าง (เรียงตามความรุนแรง)

| # | ระดับ | หัวข้อย่อ | ไฟล์หลัก | สถานะล่าสุด |
| :-- | :-- | :--- | :--- | :-- |
| **001** | 🔴 Critical | flow ดูดวงติดตายที่ขั้น 1 (กดปุ่มแล้วไม่ไปขั้น 2) | `src/app/page.tsx` | 🔴 ยังเกิด — พบ root cause แล้ว |
| **002** | 🟠 High | Hydration mismatch ผังไพ่วงกลม/รัศมี | `src/components/ui/TarotArtIcons.tsx` | 🟠 ยังเกิด (9 จุดใน HTML) |
| **008** | 🟠 High | `cache.ts` พรีโหลดภาพจาก path ผิด → 404 × 9 | `src/lib/utils/cache.ts` | 🟠 ยังเกิด (dev + prod) |
| **009** | 🟠 High | `cache.ts` พรีโหลดไฟล์เสียง `.mp3` ที่ไม่มี → 404 × 3 | `src/lib/utils/cache.ts` | 🟠 ยังเกิด (dev + prod) |
| **010** | 🟡 Medium | `.env.example` ไม่ตรงกับ env ที่โค้ดใช้ + session secret fallback เป็นสตริงตายตัว | `.env.example`, `src/lib/security/session-token.ts` | 🟡 ยืนยัน 2026-08-31 |
| **003** | 🟡 Medium | ฐานข้อมูลไพ่เอียง "ใช่" (43/18/17) | `src/data/cards/*.ts` | 🟡 ยังเกิด (เท่าเดิม) |
| **011** | 🔵 Low | repo ใช้ pnpm แต่เอกสาร/ตั้งค่าพูดเป็น npm | `package.json`, docs | 🔵 ยืนยัน 2026-08-31 |
| **004** | 🔵 Low | รัน `wrangler dev` บน macOS 12.6 ไม่ได้ | (สภาพแวดล้อม) | 🔵 ข้อจำกัดเครื่อง |
| **005** | 🔵 Low | GitHub auto-merge ใช้ไม่ได้ (private repo + แพลนฟรี) | (ตั้งค่า GitHub) | 🔵 ปล่อยไว้ได้ |
| **006** | 🔵 Low | GitHub Actions เตือน Node 20 deprecated | `.github/workflows/*.yml` | 🔵 ยังเป็น `@v4` ทั้ง 3 ไฟล์ |
| **007** | 🔵 Low | Prisma schema พร้อมแต่ยังไม่ต่อใช้ (ใช้ in-memory) | `src/server/store.ts` | 🔵 หนี้เทคนิค |

---

## 🔴 ระดับ Critical — กระทบผู้ใช้จริง ต้องแก้ก่อน

### ISSUE-001 · ปุ่ม "ถัดไป: ตั้งคำถามและเลือกแม่หมอ" ไม่พาไปขั้นที่ 2 — flow ดูดวงติดตายที่ขั้น 1

| หัวข้อ | รายละเอียด |
| :--- | :--- |
| **อาการ** | กดปุ่ม `ถัดไป: ตั้งคำถามและเลือกแม่หมอ →` ท้ายหน้าเลือกผัง แถบลำดับขั้นเด้งเป็น `✓ เลือกผัง` + ไฮไลต์ `2 ตั้งคำถาม` แต่เนื้อหากลางจอยัง render `SpreadCardSelector` เหมือนเดิม `IntentionAltarInput` (ช่อง `<textarea>`) ไม่โผล่ กดซ้ำก็เท่าเดิม |
| **ผลกระทบ** | 🔴 **ผู้ใช้ดูดวงไม่ได้เลย** — flow 5 ขั้นติดตายที่ขั้นแรก ฟีเจอร์หลักทั้งเว็บใช้งานไม่ได้ |
| **ตรวจยืนยันล่าสุด** | 2026-08-31 บน `main` `46fe3e9` (dev server จริง คลิกผ่านเบราว์เซอร์) — หลังคลิก: `document.querySelectorAll('textarea').length === 0`, `body.innerText` ยังมี "เลือกผังการเปิดไพ่", progress bar = step 2, ไม่มี JS error ถูก throw |
| **🔍 สาเหตุราก (ยืนยันด้วยหลักฐาน — ใหม่ 2026-08-31)** | **`<AnimatePresence mode="wait">` ที่ [`src/app/page.tsx:400`](../src/app/page.tsx#L400) เกิด exit-transition deadlock**<br>หลักฐาน: หลังกดปุ่ม `motion.div key="spread-select"` (คลาส `space-y-8`) ค้างที่ `style.transform = "translateY(-5.31px)"` ซึ่งเป็น**ค่ากลางทาง**ของ exit target `y: -20` ที่หยุดนิ่งไม่ถึงปลายทาง → `onExitComplete` ไม่ยิง → `mode="wait"` จึงไม่ยอม mount `motion.div key="intention"` ตลอดกาล · ส่วน `RitualStepProgress` อยู่**นอก** `AnimatePresence` เลยอัปเดตเป็น step 2 ทันที กลายเป็นภาพ "progress ไปแล้วแต่เนื้อหาไม่ไป" (idle float ของไพ่ยังวิ่งอยู่ = motion engine ไม่ตาย ตายเฉพาะ transition นี้)<br>ต้นตอเวอร์ชัน: `motion@13.1.1` + **React 19.2.8 + Next 16.3.3** — `AnimatePresence mode="wait"` กับ concurrent rendering ของ React 19 มีบั๊ก drop exit-complete callback |
| **❌ สมมติฐานเดิมที่ตัดทิ้งได้แล้ว** | ปุ่มนี้ **ไม่ยิง network เลย** — โค้ดจริงแค่ `setCurrentStep("INTENTION_SELECT")` (ไม่มี `await fetch`) ส่วน `/api/reading/start` (`handleStartSession`) ถูกเรียกที่ปุ่ม **ขั้น 2→3** ต่างหาก ฉะนั้นเรื่อง `GEMINI_API_KEY` / Turnstile / API ล้มเงียบ **ไม่เกี่ยวกับ ISSUE นี้** |
| **แนวทางแก้ (เรียงจากเสี่ยงน้อยไปมาก)** | 1. **ถอด `mode="wait"` ออกจาก [`page.tsx:400`](../src/app/page.tsx#L400)** ให้ step cross-fade ทับกันสั้น ๆ แทนการรอ exit — เสี่ยงต่ำสุด แก้จุดเดียว<br>2. ใส่ `transition={{ duration: 0.2 }}` ที่ step `motion.div` ทุกตัว + `onExitComplete` fallback ที่ `AnimatePresence`<br>3. เปลี่ยนไป keyed `motion.div` ตรง ๆ โดยไม่ใช้ `AnimatePresence` หรือ pin `motion` ไปเวอร์ชันที่เข้ากับ React 19<br>⚠️ ต้องทดสอบครบทั้ง 5 step (`SPREAD_SELECT`/`INTENTION_SELECT`/`SHUFFLE`/`PICK_CARDS`/`READING`+`SUMMARY`) และรักษา Golden Rule ข้อ 5 (ไพ่คว่ำหน้าเริ่มต้น) |
| **เกณฑ์ว่าแก้สำเร็จ** | คลิกจริงผ่านเบราว์เซอร์แล้ว `IntentionAltarInput` ขึ้น และเดินต่อได้ครบถึงขั้น 5 (สับไพ่ → เลือกไพ่ → อ่านคำทำนาย) — ไม่ใช่แค่ดูจากโค้ด |
| **สถานะ** | 🔴 **ยังไม่ได้แก้** — Antigravity AI ปรับ ritual-flow/transition มาหลายรอบแต่ไม่โดนจุดนี้ |

---

## 🟠 ระดับ High — ทำงานผิดชัดเจน กระทบภาพลักษณ์/ความน่าเชื่อถือ

### ISSUE-002 · Hydration mismatch ในผังไพ่แบบวงกลม/รัศมี (`TarotArtIcons.tsx`)

| หัวข้อ | รายละเอียด |
| :--- | :--- |
| **อาการ** | หน้า `/spreads` — server ส่ง `transform: translate(-21.000000000000018px, -36.37306695894642px) rotate(330deg)` แต่ client serialize ทศนิยมไม่ตรง → React hydration error (`This won't be patched up`) |
| **ตรวจยืนยันล่าสุด** | 2026-08-31 บน `46fe3e9` — `curl -s http://localhost:3100/spreads` พบ `translate()` ทศนิยมดิบ **9 จุด** ใน HTML ที่ server render (เช่น `translate(21.000000000000004px, -36.373066958946424px)`) |
| **ผลกระทบ** | React ทิ้งการ patch subtree นั้น + console รก บดบัง error จริงอื่น |
| **สาเหตุ** | [`src/components/ui/TarotArtIcons.tsx:340`](../src/components/ui/TarotArtIcons.tsx#L340) — `const x = Math.cos(rad) * radius; const y = Math.sin(rad) * radius;` แล้วยัดดิบลง `` transform: `translate(${x}px, ${y}px) rotate(${angle + 90}deg)` `` (บรรทัด 349) |
| **แนวทางแก้** | ปัดก่อนใส่ style: `x.toFixed(2)` / `y.toFixed(2)` ทุกจุดในไฟล์ที่ใช้ trig วางพิกัด |
| **เกณฑ์ว่าแก้สำเร็จ** | เปิด `/spreads` แล้ว console ไม่มี hydration error และ HTML ที่ server render ไม่มี `translate()` ทศนิยมเกิน 2 ตำแหน่ง |
| **ข้อควรระวัง** | ไฟล์นี้ใช้ `<CardImage />` ทุกจุดแล้ว **ห้ามเปลี่ยนกลับเป็น `<img>` เด็ดขาด** (INC-0002) |
| **สถานะ** | 🟠 **ยังไม่ได้แก้** — ยังไม่มี `.toFixed()` ในไฟล์เลย |

### ISSUE-008 · `cache.ts` พรีโหลดภาพไพ่จาก path ที่ไม่มีจริง — ยิง 404 ทุกครั้งที่เปิดหน้า

| หัวข้อ | รายละเอียด |
| :--- | :--- |
| **อาการ** | ทุกหน้ายิง 404 **9 รายการ** ไปที่ `/cards/variants/w320/major-XX.webp` |
| **ตรวจยืนยันล่าสุด** | 2026-08-31 — dev: `curl -s -o /dev/null -w "%{http_code}" http://localhost:3100/cards/variants/w320/major-00.webp` ➔ **404** · path ที่ถูกต้อง `/cards/w256/major-00.webp` ➔ **200** · เคยยืนยันบน production ด้วย |
| **ผลกระทบ** | 1) เปลืองรีเควสต์เปล่า 9 ครั้ง/หน้า<br>2) **ระบบ pre-decoding เป็นศูนย์** — ไม่ได้พรีโหลดภาพจริงสักใบ<br>3) console เต็มไปด้วย 404 (รวม ISSUE-009 = **12 รีเควสต์ 404 ต่อการเปิดหน้าหนึ่งครั้ง**) |
| **สาเหตุ** | [`src/lib/utils/cache.ts`](../src/lib/utils/cache.ts) — `warmupTarotAssets()` เขียน `` img.src = `/cards/variants/w320/${cardFile}` `` แต่โฟลเดอร์จริงคือ `public/cards/w128/ · w256/ · w512/ · w1024/` — **ไม่มี `variants/` และไม่มี `w320`** |
| **เรียกใช้จาก** | `src/components/performance/AssetWarmup.tsx` → วางใน `src/app/layout.tsx` |
| **แนวทางแก้** | ใช้ `getCardImageSrc()` / `CARD_IMAGE_VARIANTS` จาก [`src/lib/tarot/card-image.ts`](../src/lib/tarot/card-image.ts) แทนการเขียน path เอง — ตรงกฎเหล็กข้อ 9 (ดู INC-0002) |
| **เกณฑ์ว่าแก้สำเร็จ** | เปิดหน้าใดก็ได้ console ไม่เหลือ 404 ของ `/cards/...` และ Network เห็นภาพ Major Arcana ถูกพรีโหลดจริง |
| **หลังแก้เสร็จต้องทำ** | ลบ `src/lib/utils/cache.ts` ออกจาก `ALLOWLIST` ใน `scripts/qa/test-image-paths.ts` |

### ISSUE-009 · `cache.ts` พรีโหลดไฟล์เสียง `.mp3` ที่ไม่มีในโปรเจกต์

| หัวข้อ | รายละเอียด |
| :--- | :--- |
| **อาการ** | ทุกหน้ายิง 404 อีก **3 รายการ**: `/sounds/shuffle.mp3`, `/sounds/card-pick.mp3`, `/sounds/reveal.mp3` |
| **ตรวจยืนยันล่าสุด** | 2026-08-31 — `curl` `http://localhost:3100/sounds/shuffle.mp3` ➔ **404** · `public/` มีแค่ `_headers` กับ `cards/` |
| **ผลกระทบ** | เปลืองรีเควสต์เปล่า 3 ครั้ง/หน้า |
| **สาเหตุ** | `src/lib/utils/cache.ts` ประกาศ `PRELOAD_SOUNDS` ชี้ไฟล์ mp3 ที่ไม่เคยมี — ระบบเสียงจริงใช้ **Web Audio API สังเคราะห์เอง** ใน `src/lib/utils/audio.ts` ไม่ใช้ไฟล์ |
| **แนวทางแก้** | ลบบล็อกพรีโหลดเสียงทิ้ง (ตรงสถาปัตยกรรมจริง) |
| **เกณฑ์ว่าแก้สำเร็จ** | เปิดหน้าใดก็ได้ ไม่เหลือ 404 ของ `/sounds/` |
| **ข้อควรระวัง** | ⚠️ ห้ามแตะ `soundManager` ใน `src/lib/utils/audio.ts` — เป็นระบบเสียงที่ใช้จริง |

> 💡 **ISSUE-008 + ISSUE-009 อยู่ไฟล์เดียวกัน** (`src/lib/utils/cache.ts`) — ล็อคไฟล์ครั้งเดียว แก้ทีเดียว commit ครั้งเดียวจบทั้งคู่ได้

---

## 🟡 ระดับ Medium — ทำงานผิดแต่ไม่บล็อกผู้ใช้

### ISSUE-010 · `.env.example` ไม่ตรงกับตัวแปรแวดล้อมที่โค้ดใช้จริง + session secret fallback เป็นสตริงตายตัว

| หัวข้อ | รายละเอียด |
| :--- | :--- |
| **อาการ** | คนตั้งเครื่องใหม่ทำตาม `.env.example` แล้วเว็บยังพัง เพราะไฟล์ตัวอย่างขาดคีย์สำคัญและมีคีย์ที่ไม่ได้ใช้ปนอยู่ |
| **ตรวจยืนยันล่าสุด** | 2026-08-31 — `grep -rhoE "process\.env\.[A-Z_]+" src/` เทียบกับ `.env.example` |
| **ขาดใน `.env.example` (โค้ดใช้จริง)** | `TAROT_SESSION_SECRET` · `TURNSTILE_SECRET_KEY` · `NEXT_PUBLIC_TURNSTILE_SITE_KEY` |
| **มีใน `.env.example` แต่โค้ดไม่ใช้** | `SHUFFLE_HMAC_SECRET` (โค้ดจริงชื่อ `TAROT_SESSION_SECRET`) · `AUTH_SECRET`/`AUTH_URL`/`AUTH_GOOGLE_*`/`AUTH_LINE_*` (มี dep `next-auth@5.0.0-beta.32` แต่ **ไม่มีไฟล์ไหน import เลย**) · `DATABASE_URL` (ยังไม่ต่อ — ดู ISSUE-007) |
| **🔒 ประเด็นความปลอดภัย** | [`src/lib/security/session-token.ts:16`](../src/lib/security/session-token.ts#L16) — ถ้า `TAROT_SESSION_SECRET` **และ** `CF_PAGES_COMMIT_SHA` ไม่ถูกตั้ง จะ fallback ไปใช้สตริงตายตัว `"tarot-sacred-altar-secret-provably-fair-2026"` → การันตี "ปลอมไพ่/seed ไม่ได้" ของ Provably-Fair **หายทันที** ถ้า deploy โดยลืมตั้ง env นี้ |
| **แนวทางแก้** | เขียน `.env.example` ใหม่ให้ตรงรายการที่โค้ดอ่านจริง แยกกลุ่ม "จำเป็นตอนนี้" กับ "เผื่ออนาคต (auth/DB)" ให้ชัด · พิจารณาให้ `signReadingSessionToken` **throw ตอน build/boot ใน production** ถ้าไม่มี secret จริง แทนที่จะ fallback เงียบ |
| **เกณฑ์ว่าแก้สำเร็จ** | ทำตาม `.env.example` บนเครื่องเปล่าแล้วเว็บทำงานครบ flow · ไม่มีคีย์ที่ไม่ได้ใช้หลงเหลือโดยไม่มีคอมเมนต์กำกับว่า "อนาคต" |

### ISSUE-003 · ฐานข้อมูลไพ่เอนเอียงด้าน "ใช่" มากเกินไป ทำให้ผังใช่/ไม่ใช่ ตอบเพี้ยน

| หัวข้อ | รายละเอียด |
| :--- | :--- |
| **อาการ** | `npm run repo:verify` เตือนทุกครั้ง: `yesNo เอียงไปด้านเดียวมาก (ใช่ 43 / ไม่ใช่ 18 / ไม่แน่ 17)` |
| **ตรวจยืนยันล่าสุด** | 2026-08-31 — `tsx scripts/verify-cards.ts` ➔ `yesNo — ใช่ 43 / ไม่ใช่ 18 / ไม่แน่ 17` (ยังเท่าเดิม) |
| **ผลกระทบ** | ผัง **"ใช่หรือไม่ (ไพ่ 3 ใบ)"** มีโอกาสตอบ "ใช่" ราว 55% ทั้งที่ควรสมดุลกว่านี้ |
| **เริ่มดูตรงไหน** | ฟิลด์ `yesNo` ใน `src/data/cards/*.ts` (78 ใบ) และ `scripts/verify-cards.ts` |
| **แนวทางแก้** | ทบทวน `yesNo` ของไพ่ที่ความหมายค่อนไปทางลบ/กลาง ให้สะท้อนตำรา 1909 Rider-Waite จริง — ไม่ใช่ปรับให้ตัวเลขสวย |
| **เกณฑ์ว่าแก้สำเร็จ** | `verify-cards.ts` ไม่ขึ้นคำเตือนนี้ และการเปลี่ยนแต่ละใบมีเหตุผลอ้างอิงความหมายไพ่กำกับ |
| **ข้อควรระวัง** | ⚠️ ห้ามแก้ `structure` ของไพ่ 78 ใบ · รัน `verify-cards.ts` ทุกครั้งหลังแก้ |

---

## 🔵 ระดับ Low — ข้อจำกัดสภาพแวดล้อม / หนี้ทางเทคนิค

### ISSUE-011 · โปรเจกต์ใช้ pnpm แต่เอกสาร/ตั้งค่าพูดเป็น npm ทั้งหมด

| หัวข้อ | รายละเอียด |
| :--- | :--- |
| **อาการ** | repo track `pnpm-lock.yaml` + `pnpm-workspace.yaml` แต่ `package.json` **ไม่มีฟิลด์ `packageManager`** และคู่มือทุกไฟล์เขียน `npm run ...` — รัน `npm install` จะสร้าง `package-lock.json` เกินมา (lockfile ซ้อน) และ resolve dependency คนละชุดกับที่ deploy ใช้ |
| **ตรวจยืนยันล่าสุด** | 2026-08-31 — `git ls-files \| grep lock` เห็นแต่ `pnpm-lock.yaml` · `grep packageManager package.json` = ว่าง · เจอปัญหาจริงตอน setup worktree ใหม่ |
| **ผลกระทบ** | Agent/คนใหม่สับสนว่าต้องใช้ตัวไหน · เสี่ยง commit `package-lock.json` ปนเข้ามา (เกิดขึ้นจริงแล้วครั้งหนึ่งใน PR #17 ต้องถอนออกก่อน merge) · `pnpm install` แบบ non-interactive อาจเด้ง prompt เรื่อง build script ของ `workerd` |
| **แนวทางแก้** | 1. เพิ่ม `"packageManager": "pnpm@<เวอร์ชัน>"` ใน `package.json`<br>2. เพิ่ม `package-lock.json` และ `yarn.lock` ลง `.gitignore`<br>3. เพิ่มหมายเหตุใน `CLAUDE.md` + `docs/AI_COLLABORATION_GUIDELINES.md`: scripts รันผ่าน `npm run` ได้ แต่ **ติดตั้ง dependency ต้อง `pnpm install` เท่านั้น** |
| **เกณฑ์ว่าแก้สำเร็จ** | เครื่องใหม่รัน `pnpm install && npm run repo:verify` ผ่าน · commit `package-lock.json` ไม่ได้อีก |

### ISSUE-004 · รัน Cloudflare Workers ในเครื่อง (`preview:worker` / `wrangler dev`) ไม่ได้

| หัวข้อ | รายละเอียด |
| :--- | :--- |
| **อาการ** | `✘ [ERROR] Unsupported macOS version: ... minimum requirement is macOS 13.5.0+` (เครื่องนี้ 12.6.0) |
| **ผลกระทบ** | ทดสอบพฤติกรรมฝั่ง Worker ในเครื่องไม่ได้ (เช่น HTTP header จาก `public/_headers`) ต้องรอตรวจบน production หลัง deploy |
| **สิ่งที่ยังทำได้ปกติ** | `next dev` (Next.js dev server) และ `npm run build:worker` — deploy ผ่าน GitHub Actions ไม่มีปัญหา |
| **ทางแก้** | อัปเกรด macOS ≥ 13.5 หรือใช้ DevContainer (Linux glibc 2.35+) |
| **วิธีตรวจแทนระหว่างนี้** | `curl -sI https://tarot-web.bankjack10452.workers.dev/cards/w256/major-00.webp` |
| **หมายเหตุ setup dev (ใหม่ 2026-08-31)** | `.claude/launch.json` ตั้ง `runtimeExecutable` เป็น path relative `node_modules/.bin/next` ซึ่ง preview sandbox บางตัวรันไม่ได้ (`Operation not permitted`) — ถ้าเปิด preview ไม่ขึ้น ให้สตาร์ท `next dev` เองผ่าน terminal (`node_modules/.bin/next dev --webpack -p <port>`) แล้วชี้เบราว์เซอร์ไปพอร์ตนั้น |

### ISSUE-005 · GitHub native auto-merge ใช้ไม่ได้ — repo เป็น private บนบัญชีฟรี

| หัวข้อ | รายละเอียด |
| :--- | :--- |
| **อาการ** | หน้า Settings ช่อง **"Allow auto-merge"** เป็นสีเทากดไม่ได้ (ลิงก์ *"Why is this option disabled?"*) · `gh pr merge --auto` ล้มด้วย `GraphQL: Auto merge is not allowed for this repository` |
| **สาเหตุที่แท้จริง** | `luminuy/tarot-web` เป็น repo **private** บน **บัญชีส่วนตัวแพลนฟรี** — GitHub เปิด auto-merge ให้เฉพาะ repo **public** (ทุกแพลน) หรือ repo **private** บนแพลน **Pro / Team / Enterprise**<br>ยืนยัน 2026-08-31: `PATCH repos/luminuy/tarot-web -f allow_auto_merge=true` → ตอบ 200 แต่ค่ายังเป็น `false` (ปฏิเสธเงียบ) |
| **ผลกระทบ** | ไม่กระทบงานจริง — `.github/workflows/pr.yml` squash-merge ให้เองหลัง CI ผ่าน (`scripts/github-auto.ts` ตรวจ `allow_auto_merge` แล้วข้ามอย่างสุภาพ) แล้วลบ branch (INC-0011) · ฝั่งเครื่องมี `npm run git:tidy` เก็บกวาดต่อ |
| **ทางแก้ (ถ้าจะเปิดจริง — AI ทำเองไม่ได้)** | 1. อัปเกรด `luminuy` เป็น **GitHub Pro** (~$4/เดือน) · 2. เปลี่ยน repo เป็น **public** |
| **สรุป** | **ปล่อยไว้แบบนี้ได้** — automation ปัจจุบันครบวงจร ไม่ต้องเสียเงิน |

### ISSUE-006 · GitHub Actions เตือน Node.js 20 กำลังเลิกรองรับ

| หัวข้อ | รายละเอียด |
| :--- | :--- |
| **อาการ** | ทุก workflow run ขึ้น annotation: `Node.js 20 is deprecated. ... actions/checkout@v4, actions/setup-node@v4` |
| **ตรวจยืนยันล่าสุด** | 2026-08-31 — `grep -rn "actions/checkout@\|actions/setup-node@" .github/workflows/` เจอ `@v4` ที่ `deploy.yml` (4 จุด), `pr.yml` (2 จุด), `auto-release.yml` (1 จุด) |
| **ผลกระทบ** | ตอนนี้ยังทำงานได้ แต่จะพังเมื่อ GitHub เลิกรองรับจริง |
| **ทางแก้** | อัปเป็น `actions/checkout@v5` + `actions/setup-node@v5` ให้ครบ **ทั้ง 3 ไฟล์** (`deploy.yml`, `pr.yml`, `auto-release.yml`) แล้วดู CI ผ่านครบ 7 ด่าน |

### ISSUE-007 · Prisma ออกแบบ schema ไว้แล้วแต่ยังไม่ได้ต่อใช้จริง

| หัวข้อ | รายละเอียด |
| :--- | :--- |
| **อาการ** | `prisma/schema.prisma` ครบแล้ว แต่ระบบยังใช้ `src/server/store.ts` (in-memory) — ข้อมูลหายทุกครั้งที่ Worker restart |
| **สาเหตุ** | Prisma 7 มี breaking change เรื่อง `datasource.url` (ต้องย้ายไป `prisma.config.ts` + เลือก adapter ก่อน) จึงตัด `prisma generate` ออกจาก build ชั่วคราว |
| **ผลกระทบ** | ประวัติดูดวงเก็บใน `localStorage` ผู้ใช้เท่านั้นตามนโยบาย PDPA — ยังไม่กระทบการใช้งาน แต่ขยายฟีเจอร์ที่ต้องใช้ DB ไม่ได้ |
| **เริ่มดูตรงไหน** | `prisma/schema.prisma`, `src/server/repositories/reading.repository.ts`, `src/server/store.ts` |
| **ข้อควรระวัง** | ⚠️ ต้องไม่ขัดกฎ PDPA — ข้อมูลผู้ใช้ห้ามเก็บถาวรบนเซิร์ฟเวอร์และห้ามนำไปเทรนโมเดล |

---

## 📌 ช่องว่างของเอกสาร (Documentation Gaps — สิ่งที่ยัง "ขาด" และ "ควรเพิ่ม")

รายการนี้ไม่ใช่บั๊ก แต่เป็นเอกสารที่ควรมีเพื่อให้ Agent/คนใหม่ทำงานต่อได้ไร้รอยต่อ:

| ช่องว่าง | ทำไมถึงต้องมี | ที่ควรอยู่ |
| :--- | :--- | :--- |
| **คู่มือตั้งเครื่อง dev (Local Setup)** | ตอนนี้ต้องเดาเอง: pnpm หรือ npm, ต้องมี env อะไรถึงจะเดินครบ flow, พอร์ตอะไร, dev server บน macOS 12 ต้องเลี่ยงอะไร | `README.md` หรือ `docs/LOCAL_SETUP.md` ใหม่ |
| **แผนที่ env var จริง** | `.env.example` เพี้ยน (ISSUE-010) — ควรมีตารางว่าคีย์ไหนใช้ที่ไฟล์ไหน จำเป็น/ไม่จำเป็น | `docs/ARCHITECTURE.md` |
| **บันทึกเหตุผลที่ใช้ stack ล้ำเวอร์ชัน** | `react@19.2`, `next@16.3`, `motion@13` นำหน้า ecosystem — เป็นต้นเหตุบั๊กอย่าง ISSUE-001 ควรมี ADR ว่าตั้งใจและรับความเสี่ยงอะไร | `docs/ARCHITECTURE.md` หรือ ADR |
| **มาตรฐานคุณภาพ INCIDENT_LOG** | INC-0008/0009/0010 ช่อง "อาการ" ก็อป "การแก้ไข" มา, "สาเหตุราก" กว้างลอย — ไม่ตรงมาตรฐานคู่มือข้อ 0.2 | เพิ่มการตรวจใน `scripts/incident-log.ts` |
| **cross-link `AGENTS_TASK_PLAN.md` ↔ KNOWN_ISSUES** | มี roadmap แยกแต่ไม่อ้างถึงกัน ไม่รู้ว่างาน backlog ชนกับบั๊กที่ค้างไหม | หัวไฟล์ทั้งสอง |
