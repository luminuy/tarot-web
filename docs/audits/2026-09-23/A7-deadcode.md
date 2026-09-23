# A7-deadcode

## ความคืบหน้า

## ข้อค้นพบ

### 🟠 A7-01 · ปุ่ม "ลบข้อมูลทั้งหมด" (PDPA) ไม่ดูผลตอบกลับของเซิร์ฟเวอร์ — ลบบนคลาวด์ล้มแต่ผู้ใช้เข้าใจว่าลบแล้ว
- ที่: `src/lib/account/delete-all-data.ts:43-45` (ใช้ทั้ง `/account` และ `astro/scripts/delete-all-data.ts` บน `/privacy`)
- ปัญหา: `await fetch("/api/account",{method:"DELETE"}).catch(()=>{})` ไม่เช็ก `res.ok` เลย · API ตอบ 401/403/429/500 ได้ (`src/app/api/account/route.ts:12-28,50`) แต่ฝั่งเครื่องล้าง localStorage แล้วพากลับหน้าแรกเหมือนสำเร็จ
- ผลกระทบ/สถานการณ์พัง: ผู้ใช้ที่ล็อกอินอยู่กดลบ → D1 ล้ม (500) หรือกดซ้ำเกิน 3 ครั้ง/ชม. (429) → ประวัติดูดวงบนคลาวด์ + บัญชียังอยู่ครบ คุกกี้ยังไม่ถูกล้าง (ล้างเฉพาะทางสำเร็จ บรรทัด 46) ผู้ใช้ยังล็อกอินอยู่ แต่ไม่มีข้อความเตือนใด ๆ → ละเมิดคำสัญญา Right to Erasure แบบเงียบ (ส่วนกรณี 401 = ไม่มีบัญชี ถือว่าถูกต้องที่ล้างเครื่องต่อ)
- แนวแก้: เก็บ `res` · ถ้า `!res.ok && res.status !== 401` ให้ยังล้างเครื่องได้ แต่ `alert()` บอกว่า "ลบบนบัญชีไม่สำเร็จ กรุณาลองใหม่" และไม่ redirect (หรือคืน `false` ให้ปุ่มกลับมากดได้) · ด่าน `test-code-debt` ที่เฝ้าไฟล์นี้ควรเพิ่มเงื่อนไขว่าต้องมี `.ok`

### 🟡 A7-02 · ตัวห่อฝั่ง Next ของหน้าที่ย้ายไป Astro แล้ว ค้างเป็นโค้ดตาย 10 ตัว (มีตรรกะ redirect ซ้ำกับ next.config)
- ที่: `src/app/_shared/pages/blog-detail.tsx:194,223` (`BlogDetailBody` · `buildBlogDetailMetadata`) · `card-detail.tsx:25,134,319,345` (`cardStaticParams` · `buildCardDetailMetadata` · `CardDetailContent` · `CardDetailBody`) · `spread-detail.tsx:321,339` · `spread-topic.tsx:325,343` · `home.tsx:86` (`HomePageBody`)
- ปัญหา: grep ทั่ว `src/ astro/ scripts/` = 0 จุดเรียก (นอกจากเรียกกันเองในไฟล์) · `src/app` เหลือ `page.tsx` 9 ไฟล์ ไม่มีหน้าไหนใช้ตัวเหล่านี้แล้ว (ฝั่ง Astro ใช้ `*Metadata`/`*StaticParams`/`*Content` แทน) · `BlogDetailBody` ยังถือตรรกะ `ARTICLE_SLUG_ALIASES → redirect()` ซ้ำกับกฎ 301 ใน `next.config.ts:97,102` ซึ่งเป็นตัวจริง
- ผลกระทบ/สถานการณ์พัง: คนถัดไปแก้ alias/SEO ที่ตัวห่อ (คอมเมนต์ในไฟล์ยังบอกว่า "ฝั่ง Next เรียกผ่าน...") แล้วไม่มีผลบน production · คอมเมนต์ด่าน `scripts/qa/test-sticky-header.ts:455,554` ยังอ้าง `page ➔ HomePageBody ➔ TarotFlow` ที่ไม่มีแล้ว
- แนวแก้: ✅ ลบได้ปลอดภัย (ยืนยัน 0 reference) — ลบ 10 ฟังก์ชัน + import ที่ค้าง (`redirect`/`notFound`/`ArticleReadingClient` ถ้าไม่มีใครใช้ต่อ) · `CardDetailContent` เปลี่ยนเป็นไม่ export หรือลบพร้อม `CardDetailBody` · แก้คอมเมนต์ใน test-sticky-header · รันคลื่น 5 ของแผน Astro ไม่ต้องรอ

### 🟡 A7-03 · ไอคอนเมนู 7 ตัวใน `TarotArtIcons.tsx` ไม่มีใครใช้
- ที่: `src/components/ui/TarotArtIcons.tsx:880-1012` (`TarotSpreadNavIcon` · `TarotDeckNavIcon` · `JournalScrollNavIcon` · `MarketplaceReaderNavIcon` · `DailyTarotNavIcon` · `LoveTarotNavIcon` · `BirthCardNavIcon`)
- ปัญหา: grep `-w` ทั่ว src/astro/scripts = 1 ครั้งต่อชื่อ (บรรทัดประกาศเอง) · ~130 บรรทัด SVG ตาย
- ผลกระทบ: ไม่พังรันไทม์ (tree-shake ได้) แต่เพิ่มภาระอ่าน/ด่านกฎข้อ 7 ที่สแกนไฟล์นี้
- แนวแก้: ✅ ลบได้ปลอดภัย
PROGRESS: [x] knip report (deps/exports/duplicates) + tsc (0 error) + eslint --quiet (0 error)

### 🟡 A7-04 · alias/re-export "เพื่อความเข้ากันได้" ที่ไม่มีผู้เรียกเหลือแล้ว (0 reference)
- ที่: `src/lib/motion.ts:74` (`export { useMotionSafe }` — ผู้ใช้ทุกจุดนำเข้าจาก `@/lib/use-motion-safe` ตรงแล้ว) · `src/lib/motion.ts:38,45` (`TWEEN` · `stepVariants` ไม่มีใครนำเข้า) · `src/server/store.ts:146` (`clientKeyFromRequest`) · `src/lib/config/canonical-host.ts:46` (`canonicalRedirectTarget` — คอมเมนต์อ้างว่า "ใช้ร่วมกันทั้งชั้นขอบและชั้น Worker" แต่ไม่มีใครเรียก) · `src/lib/entitlement/entitlement.ts:42` (`isConsumeAllowed` — route เดียวที่ใช้ `read/route.ts:172` เช็ก `status === "denied"` เอง) · `src/lib/observability/caught.ts:68` (`recordDegraded` — metric `degraded:*` ไม่เคยถูกยิงเลย)
- ปัญหา: grep `-w` ทั่ว src/astro/scripts/config = เจอเฉพาะบรรทัดประกาศ · `useMotionSafe` re-export ใน `lib/motion.ts` ยังเสี่ยงให้คนนำเข้าจากที่เดิมแล้ว (ถ้าวันหนึ่งไฟล์กลับไป import `motion/react` แบบ runtime) ลากไลบรารี 40 KB กลับเข้าหน้าแรก
- ผลกระทบ: ไม่พังรันไทม์ · `recordDegraded` ทำให้คนอ่านเข้าใจผิดว่า `/admin` มีตัวนับ "ถอยไปทางสำรอง" ทั้งที่ว่างตลอด
- แนวแก้: ✅ ลบได้ปลอดภัยทั้ง 7 ตัว (หรือถ้าตั้งใจเก็บ `recordDegraded` ให้ต่อสายจุด fallback จริง เช่น Groq→Gemini failover)

### 🟠 A7-05 · `StreamReader` ลาก zod ทั้งก้อน (~24 KB gzip) เข้าเบราว์เซอร์ เพียงเพื่อแผนที่ข้อความ 3 คีย์
- ที่: `src/components/reading/StreamReader.tsx:7` → `import { YES_NO_DISPLAY_EN, type Reading } from "@/lib/schema/reading"` · ไฟล์ปลายทาง `src/lib/schema/reading.ts:1,14,73` มี `z.object(...)` ระดับโมดูล
- ปัญหา: `YES_NO_DISPLAY_EN` เป็นค่า runtime ตัวเดียวที่ไคลเอนต์ต้องการ แต่อยู่ไฟล์เดียวกับสคีมา zod ที่สร้างตอนโหลดโมดูล (มี side effect → tree-shake ไม่ออก) · วัดจากบิลด์จริง `dist/_astro/StreamReader.BQxTOZKZ.js` = 106 KB raw / 29.6 KB gzip พบสัญลักษณ์ zod 352 จุด (`ZodError`·`safeParse`·`invalid_union`…) ช่วงโค้ด zod ≈ 80 KB raw / ≈ 24 KB gzip (ประมาณการบน, zod 4.5.4)
- ผลกระทบ/สถานการณ์พัง: ทุกคนที่เปิดไพ่บนหน้าแรกต้องโหลด+parse ไลบรารีตรวจสคีมาที่ไคลเอนต์ไม่ได้ใช้ตรวจอะไรเลย (`QuickChatResult`/`flow-reading` ใช้แค่ `import type` ถูกแล้ว) — เป็นบั๊กแบบ P-01 เดียวกับที่ `HANDOFF_BUNDLE_DIET` ไล่อยู่
- แนวแก้: ย้าย `YES_NO_DISPLAY_EN` ไปไฟล์ไม่มี import (เช่น `src/lib/schema/reading-display.ts`) แล้วให้ `reading.ts` re-export ต่อเพื่อไม่ให้ `scripts/qa/test-mock-reading.ts:31` พัง · เพิ่มด่านห้าม `src/components/**` นำเข้าค่า (ไม่ใช่ `import type`) จาก `@/lib/schema/*`

### 🟡 A7-06 · devDependency `@eslint/js` ไม่มีใครใช้
- ที่: `package.json:70`
- ปัญหา: grep ทั่ว repo (ไม่รวม node_modules/lockfile) = เจอแค่ใน package.json · `eslint.config.mjs` ใช้ `typescript-eslint`·`react-hooks`·`unused-imports`·`@next/eslint-plugin-next` เท่านั้น · `npm ls @eslint/js` = ไม่มีแพ็กเกจอื่นพึ่ง
- ผลกระทบ: ติดตั้งเปล่า + ต้องไล่อัปเดตเวอร์ชันโดยไม่มีประโยชน์
- แนวแก้: ✅ ลบได้ปลอดภัย (`npm rm -D @eslint/js`)

## รายการที่ knip ฟ้องแต่ "ต้องเก็บไว้" (ตรวจแล้ว)
- `tailwindcss` (devDep) — ใช้ผ่าน `@import "tailwindcss"` ใน `src/app/globals.css:1` + peer ของ `@tailwindcss/postcss` → knip มองไม่เห็น CSS import · ห้ามลบ
- `server-only` (unlisted) — Next resolve ให้เองจาก `next/dist/compiled/server-only` · สคริปต์ QA ใช้สตับ `scripts/qa/stubs/server-only.ts` · ตั้งใจ
- Duplicate exports 5 คู่ (`DECK|ALL_CARDS` · `DECK_SIZE|TOTAL_CARDS` · `getAppDB|getDB` · `refreshEntitlement|mutateEntitlement` · `LocaleLink|default`) — ทั้งสองชื่อยังมีผู้เรียกจริงทุกคู่ (เช่น `getDB` 3 · `ALL_CARDS` 4 · `LocaleLink` default ใน `reading-chat-*.tsx`) → ลบไม่ได้โดยไม่แก้ผู้เรียก
- export ~90 ตัวที่ใช้ภายในไฟล์ตัวเอง (เช่น `flushCounters` · `pruneExpiredAuthTokens` · `getTokenVersion` · `consumeEdgeRateLimit` · `authCookieOptions` · `computeContentHash`) — **ถูกเรียกใช้จริงในไฟล์** แค่ export เกิน · ถอด `export` ได้แต่ไม่ใช่โค้ดตาย
- กลุ่มที่แผน R-31 ตั้งใจเก็บ (`payments.repo` `getPaymentById/ByOrderId` · `embedTexts` · `apiOk/apiFail` · คู่ `_EN` ของข้อมูล · `CRISIS_RULES_*`) — ตาม `HANDOFF_ROUND2_CLOSEOUT_2026-09-17.md` §3.3
- `eslint-disable` 13 จุด / `any` ~20 จุด — ไล่ดูแล้ว (exhaustive-deps 4 จุดมีเหตุผลกำกับ · `keywordsEn` มีจริงใน type) ไม่พบบั๊กซ่อน · TODO/FIXME ใน src/astro = 0
- ข้อสังเกตเล็ก: `TarotFlow.tsx:994-1015` กับ `:1125-1146` เป็นตัวแปลง `drawn → DrawnSlotCard` ที่ลอกกันทั้งก้อน (เคารพกฎข้อ 14 ทั้งคู่) — รวมเป็นฟังก์ชันเดียวได้ตอนแตะไฟล์ครั้งหน้า

PROGRESS: [x] src/ astro/ scripts/ (verify ทุกตัวในรายงาน knip) + zod client bundle + delete-all-data
STATUS: DONE
