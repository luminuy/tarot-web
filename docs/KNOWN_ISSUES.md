# 🐛 บั๊กและงานค้างที่รู้แล้วแต่ยังไม่ได้แก้ (Known Issues Registry)

> 🎯 **สำหรับ AI Agent ทุกตัว**: นี่คือรายการปัญหาที่ **ตรวจสอบยืนยันแล้วว่ามีจริง** แต่ยังไม่ได้แก้
>
> - **ก่อนเริ่มงานใหม่** ให้ดูก่อนว่ามีงานในนี้ที่เกี่ยวข้องกับสิ่งที่กำลังจะแก้หรือไม่
> - **แผนงานและบทบาทของ AI แต่ละตัว**: ดูที่ [`docs/plans/AGENTS_TASK_PLAN.md`](plans/AGENTS_TASK_PLAN.md)
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
| **วันที่** | 2026-09-04 (รอบใหญ่: ความปลอดภัย + SEO + ประสิทธิภาพ + โค้ดตาย) |
| **commit ฐาน** | `main` — Production Live (`seertarot.net`) |
| **วิธีตรวจ** | dev server + `npm run repo:verify` (24/24 ด่าน) + เดินครบทุกขั้นพิธีกรรมบนเบราว์เซอร์จริง + `curl` เทียบ HTML ฝั่งเซิร์ฟเวอร์ก่อน/หลังทุกเส้นทางหลัก |
| **ผลสรุป** | ✅ **ISSUE-001 ถึง ISSUE-023 ปิดครบสมบูรณ์ 100%** · ตรวจสอบ 24 ด่าน ผ่าน 24/24 |

### 📅 การตรวจเฉพาะจุด: แถบหัวเว็บ (Header Audit) — 2026-09-05

| หัวข้อ | ค่า |
| :--- | :--- |
| **ที่มา** | เจ้าของโปรเจกต์แจ้งอาการ **"แถบ header ค้าง"** |
| **commit ฐาน** | `ba167ee` (`main`) |
| **วิธีตรวจ** | วัดกับ production `seertarot.net` จริงผ่าน DevTools protocol (`getComputedStyle`, `elementFromPoint`, วัด latency) + อ่านโค้ดควบคู่ — **`npm run dev` รันไม่ได้ใน worktree** (npm ตาย `EPERM: uv_cwd` จาก sandbox) |
| **ผลสรุป** | 🔴 **เปิด ISSUE-024 ถึง ISSUE-030 (7 รายการ)** · `position: sticky` และ z-index **ไม่พัง** (INC-0067 + INC-0081 ยังทำงานอยู่) · ปัญหาอยู่ที่ **จังหวะเวลาของ CSS transition และ React scheduling** ไม่ใช่เลย์เอาต์ |
| **แผนแก้** | [`docs/plans/HANDOFF_HEADER_2026-09-05.md`](plans/HANDOFF_HEADER_2026-09-05.md) — แบ่ง 4 PR พร้อมโค้ด before/after และเกณฑ์ผ่านรายข้อ |
| **ข้อจำกัด** | ยังไม่ได้ทดสอบบนอุปกรณ์จริง และแท็บที่ใช้ทดสอบอยู่ในสถานะ `visibilityState: "hidden"` ซึ่งเป็นตัวแปรกวน — ดูหัวข้อ "สิ่งที่ยังตอบไม่ได้" ท้ายบล็อก ISSUE-024–030 |

### 🗂️ ดัชนีสถานะปัญหาและข้อจำกัดของระบบ

| # | ระดับ | หัวข้อย่อ | ไฟล์หลัก | สถานะ |
| :-- | :-- | :--- | :--- | :-- |
| **024** | 🔴 High | แผงเมนูค้าง `visibility: hidden` ทั้งที่ `aria-expanded="true"` | `src/app/globals.css` | 🔴 **เปิดอยู่** — `visibility` อยู่ในรายการ `transition` แผงจึงโผล่ได้ต่อเมื่อ transition วิ่งจบ |
| **025** | 🔴 High | กด TH/EN แล้วหัวเว็บนิ่ง ไม่มี feedback (วัดได้ 353 ms) | `src/lib/i18n/context.tsx`, `src/components/layout/LanguageSwitcher.tsx` | 🔴 **เปิดอยู่** — `startTransition` กับ urgent update และทิ้ง `isPending` |
| **026** | 🟠 Medium | `LocaleProvider` ไม่ memo `value` → consumer ทั้งเว็บ re-render | `src/lib/i18n/context.tsx` | 🟠 **เปิดอยู่** — ตัวขยายของ ISSUE-025 |
| **027** | 🟠 Medium | `will-change` ค้างถาวรบนแผง dropdown ที่ปิดอยู่ | `src/app/globals.css` | 🟠 **เปิดอยู่** — ละเมิดกฎที่เขียนไว้เองที่ `globals.css:367` |
| **028** | 🟠 Medium | `window.dispatchEvent` อยู่ใน state updater | `src/components/ui/SacredNavDropdown.tsx`, `src/components/auth/UserProfileBadge.tsx` | 🟠 **เปิดอยู่** — updater ต้องเป็น pure function |
| **029** | 🟠 Medium | `AuthModal` ไม่ได้กันกับดัก deps ที่ `Modal.tsx` เขียนเตือนไว้ | `src/components/auth/AuthModal.tsx` | 🟠 **เปิดอยู่** — โฟกัสหลุดจากช่องกรอกทุกครั้งที่พ่อ re-render |
| **030** | 🔵 Low | ไม่มี `scroll-padding-top` ทั้งโปรเจกต์ ทั้งที่หัวเว็บ sticky 69-81px | `src/app/globals.css` | 🔵 **เปิดอยู่** — anchor ทุกจุดไปจอดใต้หัวเว็บ |
| **018** | 🟢 Resolved | ตั๋วคิวแม่หมออ่านได้ด้วย `customerRef` ใน URL (PDPA) | `src/lib/marketplace/customer-ref.ts`, `src/app/api/marketplace/tickets/**` | ✅ **แก้แล้ว** — ย้ายไปเป็น Signed HttpOnly Cookie และส่ง 404 ป้องกัน ID enumeration |
| **017** | 🟢 Resolved | โควตาเปิดไพ่ถูกใช้ซ้อนได้ถ้ายิงขนาน (Double-Spend) | `src/lib/entitlement/entitlement.ts` | ✅ **แก้แล้ว** — Conditional Atomic INSERT เช็ค `meta.changes > 0` ป้องกันขนาน 100% |
| **019** | 🟢 Resolved | `robots.txt` ปิดบอตค้นหา AI ทั้งหมด | `src/app/robots.ts` | ✅ **แก้แล้ว** — เปิดให้ AI Search & Live Citation Bots นำทางผู้ใช้เข้าเว็บ |
| **020** | 🟢 Resolved | `isSevereForeignLeak()` ไม่เคยถูกต่อใช้งาน | `src/lib/ai/groq.ts` | ✅ **แก้แล้ว** — ต่อเป็น Circuit Breaker สลับไป Gemini ทันทีเมื่ออักษรต่างด้าว $\ge 20$ |
| **022** | 🟢 Resolved | Poll ต่อเนื่องแม้แท็บถูกซ่อน | `src/lib/utils/use-visible-interval.ts` | ✅ **แก้แล้ว** — ใช้ `useVisibleInterval` หยุด Poll เมื่อแท็บซ่อนและยิงทันทีเมื่อแท็บกลับมา |
| **023** | 🟢 Resolved | `/readers` และ `/readers/[id]` ไม่มี BreadcrumbList | `src/app/readers/page.tsx`, `src/app/readers/[id]/page.tsx` | ✅ **แก้แล้ว** — เพิ่ม BreadcrumbList JSON-LD และ `<nav aria-label="Breadcrumb">` |
| **021** | 🟢 Resolved | `EntitlementGate` รับ props มาแล้วไม่ใช้เลย | `src/app/TarotFlow.tsx`, `docs/plans/ENTITLEMENT_PLAN.md` | ✅ **แก้แล้ว** — ย้ายประวัติการออกแบบไปบันทึกในเอกสารและขจัด Dead Code |
| **003** | 🟢 Resolved | สมดุลไพ่ Yes/No 78 ใบ (ใช่ 38 / ไม่ใช่ 22 / ไม่แน่ 18) | `src/data/cards/*.ts` | ✅ **แก้แล้ว** (ผ่าน 0 คำเตือน) |
| **010b** | 🟢 Resolved | session-token hard-throw error ใน Production | `src/lib/security/session-token.ts` | ✅ **แก้แล้ว** (Hard fail loud) |
| **011** | 🟢 Resolved | pnpm-workspace.yaml schema & CI package manager | `pnpm-workspace.yaml`, `.github/*` | ✅ **แก้แล้ว** (Schema สมบูรณ์ 100%) |
| **005** | 🟢 Resolved | ระบบ CI Auto-Merge อัตโนมัติ 100% | `.github/workflows/pr.yml` | ✅ **แก้แล้ว** (Autonomous review & squash) |
| **004** | 🔵 Note | รัน `wrangler dev` บน macOS 12.6 ไม่ได้ | (สภาพแวดล้อมเครื่อง) | 🔵 ข้อจำกัด OS เครื่อง (ใช้ dev server แทน) |
| **006** | 🔵 Note | GitHub Actions runner configuration | `.github/workflows/*.yml` | 🟢 อัปเกรด Node 22 รองรับครบ |
| **007** | 🟢 Resolved | ~~Prisma schema พร้อมต่อ PostgreSQL~~ → ย้ายไป Cloudflare D1 แล้ว | `wrangler.jsonc`, `migrations/`, `src/lib/platform/db.ts` | ✅ **ปิดแล้ว** — ไม่ใช้ Prisma · D1 ใช้งานจริง |
| **012** | 🟢 Resolved | อีเมล/โดเมน/LINE ตั้งค่าครบถ้วนสมบูรณ์ (seertarot.net, LINE, Resend) | secrets, `src/lib/config/site.ts` | ✅ **แก้แล้ว** — ผูกโดเมน seertarot.net, LINE, Resend ครบ 100% |
| **016** | 🟢 Resolved | คำอ่าน AI ตกไป mock/fallback → `usage=0` → ระบบสิทธิ์ไม่หักโควตา ทุกคนเปิดไพ่ไม่จำกัด | `src/lib/ai/gemini.ts`, secrets | ✅ **แก้แล้ว** (PR #104–110) |

---

## 🟢 แก้ไขเสร็จสิ้นล่าสุด 2026-09-04 (ISSUE-017 ถึง ISSUE-023)

| # | ระดับ | ปัญหาเดิม | แนวทางการแก้ไขที่ดำเนินการแล้ว | การทดสอบยืนยัน (Verification) |
| :-- | :--- | :--- | :--- | :--- |
| **018** | 🔴 High | ตั๋วคิวแม่หมออ่านได้ด้วย `customerRef` ใน URL | ย้ายเป็น Signed HttpOnly Cookie ผ่าน `src/lib/marketplace/customer-ref.ts` และส่ง 404 เมื่อไม่ได้รับอนุญาต (Zero Info Leakage) | ผ่าน `test-marketplace-readers.ts` ด่าน 12 |
| **017** | 🟠 Med | โควตาเปิดไพ่ถูกใช้ซ้อนได้ถ้ายิงขนาน (Double-Spend) | ปรับปรุง `consumeReading()` เป็น Conditional Atomic INSERT เช็ค `meta.changes > 0` | ผ่าน `test-entitlement.ts` ยิงขนาน 5 ครั้งสำเร็จ 1 |
| **019** | 🟡 Biz | robots.txt ปิดบอตค้นหา AI ทั้งหมด | เพิ่มกฎอนุญาตเฉพาะ Search & Citation Bots ใน `src/app/robots.ts` | ยืนยันโครงสร้าง metadata robots ผ่าน |
| **020** | 🟡 Med | `isSevereForeignLeak()` ไม่ถูกเรียกใช้งาน | เชื่อมต่อเป็น Circuit Breaker ในลูปโมเดล Groq เพื่อตัดข้ามไป Gemini เมื่อพบอักษรต่างด้าวสะสม $\ge 20$ ตัว | ผ่าน typecheck และ regex verification |
| **022** | 🔵 Low | Poll ต่อเนื่องแม้แท็บถูกซ่อน | สร้าง `src/lib/utils/use-visible-interval.ts` และนำไปปรับใช้ในหน้า console และ queue | ผ่านโค้ดและ browser API verification |
| **023** | 🔵 Low | `/readers` และ `/readers/[id]` ไม่มี BreadcrumbList | เพิ่ม Schema.org BreadcrumbList JSON-LD และ visible `<nav aria-label="Breadcrumb">` | ผ่าน 24 ด่าน repo:verify |
| **021** | 🔵 Low | `EntitlementGate` รับ props มาแล้วไม่ใช้ | ลบคอมโพเนนต์ Dead Code ทิ้ง บันทึกประวัติการออกแบบลง `ENTITLEMENT_PLAN.md` และ inline children | ผ่าน `npm run typecheck` สะอาด 0 errors |

---

## ✅ แก้เสร็จแล้ว + verify แล้ว (Merged into `main`)

| # | อาการเดิม | วิธีการแก้ไขระดับวิศวกรรม | การพิสูจน์ (Verification Result) |
| :-- | :--- | :--- | :--- |
| **001** 🔴 | flow ดูดวงติดตายขั้น 1 (AnimatePresence deadlock) | ปรับมาใช้ Conditional Rendering + GPU CSS | ✅ ผ่านฉลุย 1→2→3→4→5 |
| **002** 🟠 | Hydration mismatch จากทศนิยมตรีโกณมิติ | ปัดทศนิยม 2 ตำแหน่ง (`.toFixed(2)`) | ✅ SSR และ Client DOM ตรงกัน 100% |
| **003** 🟡 | ฐานข้อมูลไพ่เอนเอียง Yes มากเกินไป | ปรับค่า `yesNo` 78 ใบตามตำรา 1909 แท้จริง | ✅ `verify-cards.ts` ผ่าน 0 warnings |
| **008** 🟠 | โหลดภาพจาก path เก่า 404 | Single Source of Truth `getCardImageSrc()` | ✅ 0 Network Error 404 |
| **009** 🟠 | พรีโหลดไฟล์เสียง mp3 ที่ไม่มีอยู่จริง 404 | ใช้ Web Audio API Synthesizer ล้วนๆ | ✅ 0 Audio 404 |
| **010b** 🟡 | Session secret fallback ใน production | เพิ่ม `getSessionSecret()` บังคับ throw ใน production | ✅ Security Hard-Fail Guard |
| **011** 🟡 | `pnpm-workspace.yaml` ขาดฟิลด์ packages | ใส่ `packages: - .` และตัด `allowBuilds` | ✅ Schema compliant pnpm 9.15 |
| **012** 🟢 | ขาด Client-side Provably-Fair Verifier & KV Persistence | พอร์ต Web Crypto, สร้าง ProvablyFairPanel, 1000-case parity test, KV session backstop | ✅ ตรวจสอบได้อิสระในเบราว์เซอร์ 100% |
| **013** 🟢 | ขาด Consumer Retention & Reading Journal D1 Persistence | ตาราง `users`, `reading_journal`, dual-mode history sync, auto-merge on login | ✅ ซิงก์ประวัติข้ามอุปกรณ์และสำรอง D1 สมบูรณ์ |
| **014** 🟢 | Edge OAuth Hardening & State CSRF Guard | บังคับ throw ใน production สำหรับ AUTH_SECRET, ตรวจสอบ state cookie ป้องกัน CSRF, sanitize host header | ✅ ป้องกัน Login CSRF และ Host Injection 100% |
| **015** 🟢 | ขาดระบบป้องกันต้นทุน AI และการถูกยิง API ซ้ำซ้อน | กลยุทธ์ 7 ชั้น: Rate Limit Bypass, AI Daily Budget Cap, Origin Guard, KV per-IP Quota, WAF Rules (ADR-002) | ✅ ควบคุมต้นทุนและตัดวงจรอัตโนมัติสมบูรณ์ 100% |
| **016** 🟢 | **ผู้เยี่ยมชมเสียสิทธิ์ทดลองฟรีถาวรถ้า AI ล้มกลางคัน** — คุกกี้ `used=1` ถูกแนบไปกับ response header ซึ่งส่งออก **ก่อน** สตรีมเริ่มทำงาน · `refundReading()` ลบได้แค่แถวใน `reading_usage` (ตารางสมาชิก) เรียกคืนคุกกี้ไม่ได้ → คนเข้าเว็บครั้งแรกเจอ AI ล้มแล้วลองใหม่ไม่ได้อีกเลย | ย้ายการปั๊มคุกกี้ออกจาก response header ไปเป็น `POST /api/entitlement/guest-consume` ที่ client ยิงหลังได้ event `done` เท่านั้น (PR #98) | ✅ คืนสิทธิ์ครบทั้งสมาชิกและผู้เยี่ยมชม — ตรงเกณฑ์ผ่านข้อ 3 ของ `ENTITLEMENT_PLAN` |

> ✅ **BACKLOG P1 (ลด JS หน้าแรก)**: Code-split `@/data/cards` 780 ข้อความออกจาก Initial Chunk ของ `page.tsx` เรียบร้อย (PR #40)
> ✅ **BACKLOG P3 (pnpm CI)**: อัปเกรด GitHub Actions Workflows สู่ pnpm 9.15 + Cache เรียบร้อย (PR #39)
> ✅ **PROVABLY-FAIR (PR 1-4)**: Web Crypto client verifier, interactive ProvablyFairPanel, pre-shuffle commitment, 410 seed guard, and KV resilience (PR #68, #69, #70, #71)
> ✅ **RETENTION INFRA (PR 0-4)**: Edge auth hardening, D1 users table, server journal, retention loop & consent, and PDPA account export/deletion (PR #72, #73, #74, #75)
> ✅ **AI COST CONTROL & BOT DEFENSE (PR 1-5)**: Rate limit bypass token, daily AI spend cap circuit breaker, read origin guard, edge per-IP soft quota, ADR-002 bot challenge decision (PR #77, #78, #79, #80)

---

## 🟡 ระดับ Medium — ทำงานผิดแต่ไม่บล็อกผู้ใช้

### ISSUE-010b · session-token fallback เป็นสตริงตายตัวถ้าลืมตั้ง env → Provably-Fair พังเงียบ

| หัวข้อ | รายละเอียด |
| :--- | :--- |
| **อาการ** | [`src/lib/security/session-token.ts`](../src/lib/security/session-token.ts) — เดิมเคยมี fallback ไปใช้สตริงตายตัวถ้าไม่ได้ตั้ง `TAROT_SESSION_SECRET` |
| **ผลกระทบ** | ในอดีตหาก deploy โดยลืมตั้ง `TAROT_SESSION_SECRET` อาจเสี่ยงต่อการปลอมแปลง token |
| **การแก้ไข** | อัปเกรด `getSessionSecret()` ให้ **Hard-throw ทันทีใน Production** หากไม่มี `TAROT_SESSION_SECRET` หรือความยาวน้อยกว่า 32 ตัวอักษร หรือใช้ค่า default พร้อมตัด fallback เงียบออก 100% |
| **สถานะ** | ✅ **แก้ไขและผ่านการทดสอบ Hard Fail สมบูรณ์ 100%** |

### ~~ISSUE-003 · ฐานข้อมูลไพ่เอนเอียงด้าน "ใช่" มากเกินไป~~ — 🟢 **ปิดแล้ว (ตรวจ 2026-09-04)**

| หัวข้อ | รายละเอียด |
| :--- | :--- |
| **สรุป** | `npm run verify:cards` ตอบ `yesNo — ใช่ 38 / ไม่ใช่ 22 / ไม่แน่ 18` และ **ไม่ขึ้นคำเตือนแล้ว** ส่วนรายละเอียดเดิมในไฟล์นี้ยังอ้างตัวเลข 43/18/17 ของ 2026-08-31 ซึ่งล้าสมัยไปแล้ว |
| **ข้อควรระวังที่ยังใช้อยู่** | ⚠️ ห้ามแก้ `structure` ของไพ่ 78 ใบ · รัน `verify-cards.ts` ทุกครั้งหลังแก้ค่า `yesNo` |

---

## 🟡 ระดับ Medium — พบจากการตรวจใหญ่ 2026-09-04 (ยังไม่ได้แก้)

> 📦 **แผนแก้ทีละข้อพร้อมโค้ดเป้าหมาย เกณฑ์ผ่าน และข้อควรระวัง อยู่ที่
> [`docs/plans/HANDOFF_2026-09-04.md`](plans/HANDOFF_2026-09-04.md)** — อ่านที่นั่นก่อนลงมือ

### ISSUE-017 · โควตาเปิดไพ่ถูกใช้ซ้อนได้ถ้ายิงพร้อมกันหลายคำขอ (double-spend)

| หัวข้อ | รายละเอียด |
| :--- | :--- |
| **อาการ** | สมาชิกที่เหลือโควตา 1 ครั้ง เรียก `POST /api/reading/start` 3 ครั้งให้ได้ id A, B, C แล้วยิง `POST /api/reading/{A,B,C}/read` พร้อมกัน — ทั้งสามผ่านหมด ใช้ AI 3 รอบโดยหักโควตาแค่ 1 |
| **ต้นเหตุ** | [`consumeReading()`](../src/lib/entitlement/entitlement.ts) เป็น read-check-then-insert ที่ไม่มี transaction · `UNIQUE(reading_id)` กันได้แค่การหักซ้ำของ **reading เดียวกัน** ไม่ได้กันคนละ reading · ตัวจำกัด `maxConcurrent` ใน `rate-limit.ts` เก็บ state ใน Map ระดับโมดูล คนละ isolate จึงเห็น `concurrent = 0` เหมือนกันหมด |
| **แนวทางแก้** | เปลี่ยนเป็น `INSERT ... SELECT ... WHERE (SELECT COUNT(*) ...) < DAILY_LIMIT` แล้วถือว่า `changes === 0` คือโควตาหมด · หรือย้ายตัวนับไป Durable Object |
| **ความเสี่ยงจริง** | ต้องตั้งใจยิงขนานเท่านั้น ผู้ใช้ทั่วไปไม่เจอ — แต่เป็นช่องให้ใช้ AI เกินโควตาได้ |

### ISSUE-018 · ข้อมูลตั๋วคิวแม่หมออ่านได้ด้วย `customerRef` ที่ส่งมาใน query string (PDPA)

| หัวข้อ | รายละเอียด |
| :--- | :--- |
| **อาการ** | `GET /api/marketplace/tickets?customerRef=...` และ `GET /api/marketplace/tickets/<id>` ไม่ตรวจ session เลย · `customerRef` เป็นความลับแบบ bearer แต่ถูกส่งใน URL จึงไปโผล่ใน log ของ CDN/proxy และ referrer ได้ |
| **ผลกระทบ** | คำถามดูดวงคือข้อมูลอ่อนไหวตรงตามที่ PDPA คุ้มครอง (สุขภาพ ความสัมพันธ์ การเงิน) · ถ้า `customerRef` รั่ว คนนอกอ่าน `nickname` `question` `readingSnapshot` และบทสรุป AI ได้ทั้งหมด |
| **แก้ไปแล้วบางส่วน** | 2026-09-04 บังคับ `customerRef` ตอน **ยกเลิก** ตั๋วและตอนเปิดรายการชำระเงินแล้ว (เดิมใช้แค่ ticket id) — ส่วนการ **อ่าน** ยังเปิดอยู่ |
| **แนวทางแก้** | ย้าย `customerRef` ไปเป็น httpOnly cookie ที่เซ็นด้วย `signPayload`/`verifyPayload` ใน `edge-auth.ts` แล้วตรวจจาก cookie แทน query string |
| **หมายเหตุ** | Marketplace ยังไม่เปิดใช้จริง (ติด PDPA sign-off) — ต้องแก้ให้เสร็จ **ก่อน** เปิดใช้งาน |

### ~~ISSUE-019 · robots.txt ปิดบอตค้นหา AI ทั้งหมด~~ — 🟢 **ตัดสินใจและแก้แล้ว (2026-09-04)**

| หัวข้อ | รายละเอียด |
| :--- | :--- |
| **มติเจ้าของโปรเจกต์** | **เอาทราฟฟิกเป็นหลัก** — ยอมให้เนื้อหาถูกอ่าน เพื่อแลกกับการถูกอ้างอิงจาก AI search |
| **สิ่งที่เปิด** | `OAI-SearchBot` · `ChatGPT-User` · `Claude-SearchBot` · `Claude-User` · `PerplexityBot` — บอตกลุ่มนี้อ่านหน้าเว็บเพื่อเอาไปตอบ **พร้อมอ้างอิงลิงก์กลับมาหาเรา** ทำหน้าที่เดียวกับ Googlebot |
| **สิ่งที่ยังปิด** | `GPTBot` · `ClaudeBot` · `CCBot` · `Google-Extended` · `Applebot-Extended` · `Bytespider` · `Amazonbot` · `meta-externalagent` · `Diffbot` — กลุ่มเก็บไปเทรนโมเดล **ไม่มีลิงก์กลับ ไม่มีทราฟฟิกคืนมาเลย** จึงไม่มีเหตุผลทางธุรกิจให้เปิด |
| **จุดที่พลาดง่าย** | กฎ robots.txt ใช้เฉพาะบล็อกที่ตรงกับ user-agent นั้นที่สุด — บอตที่มีบล็อกของตัวเองจะ **ไม่อ่าน** `User-agent: *` เลย จึงต้องประกาศ `disallow` หน้าส่วนตัวซ้ำในบล็อกของบอต AI search ด้วย (ใช้ค่าคงที่ `PRIVATE_PATHS` ร่วมกันกันลืม) |
| **การพิสูจน์** | `curl /robots.txt` แล้วเห็นบล็อกบอตค้นหาได้ `Allow: /` พร้อม `Disallow:` หน้าส่วนตัวครบ 12 บรรทัด ส่วนบล็อกบอตเทรนได้ `Disallow: /` |
| **ยังต้องทำต่อ** | Cloudflare แทรก Managed Content Signals (`ai-train=no`) ไว้หัวไฟล์ให้เองอีกชั้น — ถ้าจะเปลี่ยนนโยบายเรื่องการเทรนในอนาคต ต้องแก้ที่ Cloudflare dashboard ด้วย ไม่ใช่แค่ในโค้ด |

---

## 🔴 ระดับ High/Medium — พบจากการตรวจหัวเว็บ 2026-09-05 (ยังไม่ได้แก้)

> 📦 **แผนแก้ทีละข้อพร้อมโค้ด before/after เกณฑ์ผ่านที่รันได้จริง และข้อควรระวัง อยู่ที่
> [`docs/plans/HANDOFF_HEADER_2026-09-05.md`](plans/HANDOFF_HEADER_2026-09-05.md)** — อ่านที่นั่นก่อนลงมือ
>
> **ที่มา**: เจ้าของโปรเจกต์แจ้งอาการ "แถบ header ค้าง" · ตรวจกับ production `seertarot.net` จริง
> (`npm run dev` รันไม่ได้ใน worktree — npm ตาย `EPERM: uv_cwd` จาก sandbox)
>
> ✅ **ตรวจแล้วว่ายังไม่พัง ห้ามเสียเวลารื้อซ้ำ**: `position: sticky` ทำงานปกติทุกหน้า (`top === 0`
> ที่ y = 0→4000) · `z-index: 50` ถูกต้อง · แผงเมนูไม่ถูกเนื้อหาทับ (hit-test ผ่าน 4/4 จุด) ·
> `main` เป็น `overflow-x: clip` ไม่ใช่ `hidden` (ตรงกฎ INC-0067) · `:not([data-site-header])`
> ยังอยู่ใน `globals.css:186` (ตรงกฎ INC-0081) · จอ 320px ไม่ล้นแนวนอน ·
> scroll-lock ของโมดัลไม่รั่ว (ไล่ครบทุกคู่แล้ว)
>
> **ปัญหารอบนี้ไม่ได้อยู่ที่เลย์เอาต์ แต่อยู่ที่จังหวะเวลาของ CSS transition และ React scheduling**

### ISSUE-024 · แผงเมนูค้าง `visibility: hidden` ทั้งที่ `aria-expanded="true"` 🔴 High

| หัวข้อ | รายละเอียด |
| :--- | :--- |
| **อาการ** | กดปุ่มแฮมเบอร์เกอร์แล้ว **ไม่มีอะไรโผล่มา** ผู้ใช้กดซ้ำกลายเป็นสั่งปิด — ดูเหมือน "เมนูกดไม่ติด / หัวเว็บค้าง" |
| **หลักฐาน** | บน production เปิดเมนูแล้วรอ 1,200 ms: `aria-expanded="true"` + คลาส `dropdown-panel-entering` แต่ `visibility: "hidden"` · `opacity: "0"` · `elementFromPoint` ตอบเป็นเนื้อหาหน้าทั้ง 4 จุด · **ฉีด `transition: none` แล้วเปิดใหม่ → `visible` / `opacity 1` / hit-test ผ่าน 4/4 ทันที** (ตัดตัวแปรได้ว่า transition คือตัวปัญหา ไม่ใช่ z-index) |
| **ต้นเหตุ** | [`globals.css:484-506`](../src/app/globals.css) ใส่ `visibility` ลงในรายการ `transition` และ [`SacredNavDropdown.tsx:157-165`](../src/components/ui/SacredNavDropdown.tsx) render แผงค้างไว้ใน DOM ตลอด โดยเริ่มที่ `visibility: hidden` → **ทางเดียวที่แผงจะโผล่คือ transition ต้องวิ่งจนจบ** ถ้าเบราว์เซอร์ไม่ paint (แท็บพักหลังบ้าน · bfcache · main thread ติดยาว) แผงค้างที่ `hidden` ทั้งที่ React commit `isOpen = true` ไปแล้ว |
| **แนวทางแก้** | ถอด `visibility` ออกจาก `transition` ของ `.dropdown-panel-base` · ให้ `.dropdown-panel-entering` ตั้ง `visibility: visible` แบบมีผลทันที · ให้ `.dropdown-panel-exiting` หน่วงด้วย `transition: visibility 0s linear 160ms` เพื่อคง fade-out ไว้ (แก้ที่ CSS ที่เดียว ครอบทั้งเมนูหลักและเมนูโปรไฟล์) |
| **⚠️ ข้อจำกัดของหลักฐาน** | แท็บที่ทดสอบอยู่ในสถานะ `document.visibilityState === "hidden"` ซึ่งเป็นตัวเร่งอาการ — **ยืนยันได้ว่ากลไกพังจริงเมื่อเบราว์เซอร์ไม่ paint แต่ยังไม่ได้ยืนยันบนมือถือจริงของเจ้าของ** ผู้รับช่วงต้องทดสอบซ้ำบนอุปกรณ์จริง (สลับแอปไป-กลับ · กด Back เข้า bfcache · เปิดเมนูตอนหน้าโหลดหนัก) |
| **ไฟล์ที่ใช้คลาสชุดนี้** | [`SacredNavDropdown.tsx:162`](../src/components/ui/SacredNavDropdown.tsx) · [`UserProfileBadge.tsx:237`](../src/components/auth/UserProfileBadge.tsx) |

### ISSUE-025 · กด TH/EN แล้วหัวเว็บนิ่ง ไม่มี feedback ใด ๆ 🔴 High

| หัวข้อ | รายละเอียด |
| :--- | :--- |
| **อาการ** | กดปุ่มสลับภาษา → ปุ่มยังไฮไลต์ภาษาเดิม ไม่มีสัญญาณใด ๆ ว่าระบบรับคำสั่งแล้ว → ผู้ใช้คิดว่าเว็บค้างแล้วกดซ้ำ |
| **หลักฐาน** | วัดเวลาตั้งแต่ `.click()` จนกว่า `aria-pressed` เปลี่ยน บนหน้าแรก production = **353 ms** (เครื่อง desktop) — บนมือถือกลาง ๆ กับต้นไม้หน้าแรก (`DailyCardStrip` + `QuickFortunePicker` + 20 ผัง + SEO block + `AnimatePresence`) ตัวเลขนี้จะพุ่งเป็นวินาที |
| **ต้นเหตุ** | [`i18n/context.tsx:72-93`](../src/lib/i18n/context.tsx) พังสามชั้น: (1) ใช้ `startTransition` กับ urgent update ที่ผู้ใช้กดเอง React จึงค้างจอเดิมไว้จนกว่าจะ render ต้นไม้ทั้งหน้าเสร็จ (2) `const [, startTransition]` **ทิ้ง `isPending` ทั้งดุ้น** จึงไม่มีทางบอกผู้ใช้ได้เลยว่ากำลังทำงานอยู่ (3) cookie/localStorage/`<html lang>` เขียนทันทีนอก transition → **state ที่บันทึกกับที่เห็นบนจอไม่ตรงกัน** รีเฟรชระหว่างนั้นจะเด้งเป็นอีกภาษา |
| **แนวทางแก้** | รับ `isPending` มาใช้ · เพิ่ม `pendingLocale` ที่ตั้งค่า **นอก** `startTransition` (urgent) แล้วให้ [`LanguageSwitcher.tsx`](../src/components/layout/LanguageSwitcher.tsx) ไฮไลต์ตาม `pendingLocale ?? locale` พร้อม `aria-busy` |
| **เกณฑ์ผ่าน** | feedback latency ต้อง **< 50 ms** (เดิม 353 ms) |
| **ข้อจำกัดดีไซน์** | ห้ามใส่ spinner หรืออิโมจิการ์ตูน (กฎเหล็กข้อ 2) — ใช้ `opacity-70` หรือ `✦` เท่านั้น |

### ISSUE-026 · `LocaleProvider` ไม่ memo `value` → consumer ทั้งเว็บ re-render ทุกครั้ง 🟠 Medium

| หัวข้อ | รายละเอียด |
| :--- | :--- |
| **อาการ** | ไม่มีอาการตรง ๆ แต่เป็น **ตัวขยายของ ISSUE-025 โดยตรง** — ยิ่ง consumer เยอะ transition ยิ่งนาน |
| **ต้นเหตุ** | [`i18n/context.tsx:104-111`](../src/lib/i18n/context.tsx) สร้าง object `value` ใหม่ทุก render (และ `setLocale` เป็น function ใหม่ทุก render ด้วย) · `LocaleProvider` ครอบทั้งเว็บที่ [`layout.tsx:158`](../src/app/layout.tsx) → `value` เปลี่ยน identity ทุก render = consumer ทุกตัวทั้งเว็บ re-render |
| **ขอบเขต** | หัวเว็บอย่างเดียวเรียก `useLocale()` 4 จุด: [`SiteHeader.tsx:33`](../src/components/layout/SiteHeader.tsx) · [`SacredNavDropdown.tsx:31`](../src/components/ui/SacredNavDropdown.tsx) · [`LanguageSwitcher.tsx:11`](../src/components/layout/LanguageSwitcher.tsx) · [`UserProfileBadge.tsx:18`](../src/components/auth/UserProfileBadge.tsx) |
| **แนวทางแก้** | `useMemo` ค่า context + `useCallback` ที่ `setLocale` (ทำใน PR เดียวกับ ISSUE-025) |
| **การพิสูจน์ที่บังคับ** | ต้องแนบตัวเลข commit duration + จำนวน component ที่ re-render จาก React DevTools Profiler **before/after** ลงใน PR |

### ISSUE-027 · `will-change` ค้างถาวรบนแผง dropdown ที่ปิดอยู่ 🟠 Medium

| หัวข้อ | รายละเอียด |
| :--- | :--- |
| **อาการ** | เลื่อนหน้าแรกบนมือถือแล้วกระตุก (ยังไม่ได้วัด fps ยืนยัน — ดูหัวข้อ "ยังตอบไม่ได้") |
| **ต้นเหตุ** | [`globals.css:486`](../src/app/globals.css) ตั้ง `will-change: opacity, transform` ไว้บน `.dropdown-panel-base` ซึ่งติดอยู่กับแผง **ทั้งตอนเปิดและตอนปิด** → แผง dropdown 2 ตัวจอง GPU layer ถาวรตลอดทั้ง session แต่ละตัวมีเงาเบลอ 30px |
| **🚨 นี่คือการละเมิดกฎที่โปรเจกต์เขียนเตือนตัวเองไว้แล้ว** | [`globals.css:367-370`](../src/app/globals.css) เขียนไว้ชัดว่า *"ห้ามตั้ง `will-change: transform` ถาวรตรงนี้ เพราะมันสร้างเลเยอร์ GPU ค้างไว้ตลอดเวลา"* — **กฎอยู่บรรทัด 367 ถูกละเมิดที่บรรทัด 486 ในไฟล์เดียวกัน ห่างกัน 119 บรรทัด** เกี่ยวโยงกับ INC-0056 ที่เคยวัดได้ว่า fps เด้ง 30 → 58 หลังถอดเลเยอร์ที่ไม่จำเป็น |
| **แนวทางแก้** | ย้าย `will-change` ไปไว้ที่ `.dropdown-panel-entering` เท่านั้น (รวมใน PR เดียวกับ ISSUE-024) |
| **🔒 ต้องเพิ่มด่านตรวจ** | ตามกฎ 0.2 ข้อ 8 — เขียน `scripts/qa/test-will-change.ts` บล็อก `will-change` ใน selector ที่ไม่สื่อถึงสถานะกำลังอนิเมต ใช้หลัก **Ratchet** + ALLOWLIST ห้ามทำ CI พังทันที (INC-0007) |
| **การพิสูจน์ที่บังคับ** | วัด fps ด้วย `requestAnimationFrame` ก่อน/หลัง บนมือถือจริง (กฎป้องกันถาวรจาก INC-0056 — *"ไม่ใช่ดูด้วยตา"*) |

### ISSUE-028 · `window.dispatchEvent` อยู่ใน state updater ซึ่งต้องเป็น pure function 🟠 Medium

| หัวข้อ | รายละเอียด |
| :--- | :--- |
| **อาการ** | กดเมนูแล้ว "เปิดติดบ้างไม่ติดบ้าง" เพราะเมนูอาจสั่งปิดตัวเองไปพร้อมกัน |
| **ต้นเหตุ** | [`SacredNavDropdown.tsx:71-80`](../src/components/ui/SacredNavDropdown.tsx) และ [`UserProfileBadge.tsx:80-89`](../src/components/auth/UserProfileBadge.tsx) ยิง `window.dispatchEvent(new CustomEvent("tarot:close-menus", ...))` **ข้างใน** `setState(prev => ...)` · updater ต้องเป็น pure function React สงวนสิทธิ์เรียกซ้ำได้ (replay queue / StrictMode) · `dispatchEvent` เป็น synchronous → handler ของอีก component เรียก `setState` ของตัวเองระหว่างที่ React กำลังคำนวณ state ของ component นี้อยู่ |
| **แนวทางแก้** | ย้าย `dispatchEvent` ออกมาไว้ที่ handler โดยอ่านค่าปัจจุบันจาก `isOpenRef` แทน แล้วเรียก `setIsOpen(willOpen)` ตรง ๆ · **แก้ทั้ง 2 ไฟล์ให้เป็นรูปแบบเดียวกัน** |
| **หมายเหตุ** | ยังไม่พบ warning `Cannot update a component while rendering a different component` บน production build (React ตัด warning ออกใน production) — แต่โครงสร้างผิดหลักการชัดเจนและอธิบายอาการ "กดติดบ้างไม่ติดบ้าง" ได้ตรงที่สุด · ทดสอบซ้ำในโหมด `npm run dev` (StrictMode เปิด) |

### ISSUE-029 · `AuthModal` ไม่ได้กันกับดักที่ `Modal.tsx` เขียนเตือนไว้ 🟠 Medium

| หัวข้อ | รายละเอียด |
| :--- | :--- |
| **อาการ** | โฟกัสถูกดึงออกจากช่องอีเมล/รหัสผ่านทุกครั้งที่ `TarotFlow` re-render (ฟอร์มพิมพ์ได้ทีละตัวอักษร) |
| **ต้นเหตุ** | [`AuthModal.tsx:114`](../src/components/auth/AuthModal.tsx) ใช้ deps `[isOpen, onClose]` และ [`TarotFlow.tsx:1495-1503`](../src/app/TarotFlow.tsx) ส่ง arrow function ใหม่ทุก render → effect cleanup + รันใหม่ทุกครั้ง → `restoreFocusRef.current?.focus?.()` ดึงโฟกัสกลับไปที่ปุ่มที่เปิดโมดัล |
| **🚨 กฎนี้เขียนเตือนไว้แล้วแต่ยังถูกละเมิด** | [`Modal.tsx:33-47`](../src/components/ui/Modal.tsx) เขียนคอมเมนต์ยาวเหยียดพร้อมชื่ออาการ 3 ข้อ และแก้ด้วย `onCloseRef` ไว้แล้ว **แต่ `AuthModal.tsx` ไม่เคยได้รับการแก้นี้** |
| **✅ ตรวจแล้วว่าไม่ใช่ปัญหา — อย่าแก้เกิน** | อาการที่ 1 ที่ `Modal.tsx` เตือน (เลื่อนหน้าไม่ได้ถาวร) **ไม่เกิดในโค้ดชุดปัจจุบัน** — ไล่ scroll-lock ซ้อนครบทุกคู่แล้ว (`AccessDialog.handlePrimary` และ `BuyCreditsModal.handleStartCheckout` เรียก `onClose()` ก่อนเปิดตัวใหม่ทุกเส้นทาง และ React รัน cleanup ทั้ง commit ก่อน mount) → `document.body.style.overflow` ไม่รั่ว |
| **ทำไมยังต้องแก้** | โครงสร้างนี้เปราะมาก วันหลังใครเพิ่มเส้นทางเปิดโมดัลซ้อนขึ้นมาอีกเส้นเดียว อาการที่ 1 จะโผล่ทันที — และ `body { overflow: hidden }` ที่รั่วคือสิ่งที่ฆ่า sticky header ตรง ๆ (INC-0067) |
| **แนวทางแก้** | ลอกรูปแบบ `onCloseRef` จาก `Modal.tsx` มาตรง ๆ · deps เหลือแค่ `[isOpen]` · เปลี่ยน [`AuthModal.tsx:84`](../src/components/auth/AuthModal.tsx) เป็น `onCloseRef.current()` |
| **🔒 ต้องเพิ่มด่านตรวจ** | `scripts/qa/test-modal-effect-deps.ts` — สแกนไฟล์ที่มี `document.body.style.overflow = "hidden"` ถ้า `useEffect` ก้อนนั้นมี prop ที่เป็น function ใน deps → fail (Ratchet + ALLOWLIST) |

### ISSUE-030 · ไม่มี `scroll-padding-top` ทั้งโปรเจกต์ ทั้งที่หัวเว็บ sticky 🔵 Low

| หัวข้อ | รายละเอียด |
| :--- | :--- |
| **อาการ** | anchor `#hash` และ `scrollIntoView({ block: 'start' })` ทุกจุดไปจอด **ใต้หัวเว็บ** ผู้ใช้เห็นเป็น "หัวเว็บบังเนื้อหา / ค้างทับอยู่" |
| **หลักฐาน** | ค้นทั้ง `src/` ไม่พบ `scroll-padding-top` เลยแม้แต่ที่เดียว · หัวเว็บวัดได้สูง **69px (มือถือ) / 81px (desktop)** · [`FollowUpChat.tsx:338`](../src/components/reading/FollowUpChat.tsx) ต้องแปะ `scroll-mt-24` แก้เฉพาะจุดเอง = หลักฐานว่าปัญหามีจริงและกำลังถูกรักษาทีละอาการ |
| **แนวทางแก้** | ประกาศ `--site-header-h` (76px / 88px ที่ `min-width: 640px`) แล้วตั้ง `html { scroll-padding-top: var(--site-header-h); }` จากนั้นถอด `scroll-mt-24` ที่ `FollowUpChat.tsx` ออก |
| **⚠️ ห้ามแตะ** | บรรทัด `overflow-x: clip` ที่ [`globals.css:135`](../src/app/globals.css) — นั่นคือกฎป้องกันถาวรจาก INC-0067 เปลี่ยนเป็น `hidden` เมื่อไหร่ sticky ตายทันที |

### 🔍 สิ่งที่ยังตอบไม่ได้ ผู้รับช่วงต้องหาต่อ (รายงานตามจริง — กฎ 0.2 ข้อ 5)

| # | เรื่องที่ยังไม่รู้ | ต้องทำอะไรต่อ |
| :-: | :--- | :--- |
| 1 | **ยังไม่ยืนยันว่าอาการที่เจ้าของเจอคือ ISSUE-024 หรือ ISSUE-025** — ทั้งคู่ให้อาการ "ค้าง" เหมือนกันแต่คนละกลไก | ถามเจ้าของให้ชัด: กดเมนูแล้วไม่ขึ้น? / กด TH-EN แล้วนิ่ง? / เลื่อนแล้วกระตุก? |
| 2 | **ยังไม่ได้ทดสอบบนอุปกรณ์จริง** — ทดสอบผ่าน DevTools protocol บน desktop เท่านั้น และแท็บอยู่ในสถานะ `visibilityState: "hidden"` ซึ่งเป็นตัวแปรกวน | ทดสอบซ้ำบนมือถือจริงตามเกณฑ์ผ่านในแผน |
| 3 | **ยังไม่มีตัวเลข fps จริงตอนเลื่อนหน้า** — `PerformanceObserver({entryTypes:['longtask']})` คืนค่าว่าง แต่เชื่อถือไม่ได้เพราะแท็บไม่ paint | วัด fps ด้วย rAF บนมือถือจริง ก่อน/หลังแก้ ISSUE-027 |
| 4 | **iOS Safari + `100dvh`** — แผงเมนูใช้ `max-h-[calc(100dvh-4.5rem)]` บน iOS ค่า `dvh` เปลี่ยนตอนแถบ URL ยุบ/ขยาย แผงอาจเปลี่ยนขนาดกลางคัน | ถ้าเจ้าของใช้ iPhone ต้องตรวจข้อนี้เพิ่ม |

---

## 🔵 ระดับ Low — หนี้เล็ก ๆ ที่บันทึกไว้ (ตรวจ 2026-09-04)

| # | เรื่อง | ไฟล์ | รายละเอียด |
| :-- | :--- | :--- | :--- |
| **020** | `isSevereForeignLeak()` เขียนไว้เป็น circuit breaker สลับไป Gemini เมื่อคำอ่านหลุดภาษาต่างด้าว แต่**ไม่เคยถูกเรียกใช้เลย** | [`src/lib/ai/language.ts`](../src/lib/ai/language.ts) | คงไว้โดยตั้งใจ (ไม่ลบทิ้งเหมือน dead code ตัวอื่น) เพราะเป็นกลไกความปลอดภัยที่ตั้งใจทำ — ต้องต่อเข้ากับ `streamGroqReading` ให้ครบ |
| **021** | `EntitlementGate` รับ props มาแล้วไม่ใช้เลย คืน `<>{children}</>` เฉย ๆ | [`src/components/entitlement/EntitlementGate.tsx`](../src/components/entitlement/EntitlementGate.tsx) | คอมเมนต์ในไฟล์อธิบายประวัติการออกแบบไว้ดี จึงยังไม่ลบ — ให้ตัดสินใจว่าจะคืนบทบาทให้มันหรือ inline children ไปเลย |
| **022** | หน้าแผงคิวแม่หมอและหน้าสถานะคิว poll ทุก 4-5 วินาทีโดยไม่ดู `document.visibilityState` | [`readers/console`](../src/app/readers/console/page.tsx) · [`readers/queue/[id]`](../src/app/readers/queue/[id]/page.tsx) | แท็บที่เปิดค้างไว้เบื้องหลังจะยิง D1 ทั้งวัน — ควรหยุด poll เมื่อแท็บถูกซ่อน |
| **023** | `MarketplaceReaderNavIcon` และหน้า `/readers/[id]` ยังไม่มี BreadcrumbList | [`src/app/readers/[id]/page.tsx`](../src/app/readers/[id]/page.tsx) | หน้าอื่นมีครบแล้ว (blog, spreads, cards) เหลือกลุ่ม readers |

---

## 🔵 ระดับ Low — ข้อจำกัดสภาพแวดล้อม / หนี้ทางเทคนิค

### ISSUE-004 · รัน Cloudflare Workers ในเครื่อง (`preview:worker` / `wrangler dev`) ไม่ได้

| หัวข้อ | รายละเอียด |
| :--- | :--- |
| **อาการ** | `✘ [ERROR] Unsupported macOS version: ... minimum requirement is macOS 13.5.0+` (เครื่องนี้ 12.6.0) |
| **ผลกระทบ** | ทดสอบพฤติกรรมฝั่ง Worker ในเครื่องไม่ได้ ต้องรอตรวจบน production หลัง deploy |
| **สิ่งที่ยังทำได้ปกติ** | `next dev` · `npm run build:worker` (`opennextjs-cloudflare build`) — deploy ผ่าน GitHub Actions ไม่มีปัญหา |
| **ทางแก้** | อัปเกรด macOS ≥ 13.5 หรือใช้ DevContainer (Linux glibc 2.35+) |
| **วิธีตรวจแทน** | `curl -D- https://tarot-web.bankjack10452.workers.dev/cards/major-00 \| grep x-opennext-cache` (คาดหวัง `HIT`) |
| **หมายเหตุ setup dev** | `.claude/launch.json` ตั้ง `runtimeExecutable` เป็น path relative `node_modules/.bin/next` ซึ่ง preview sandbox บางตัวรันไม่ได้ (`Operation not permitted`) — ถ้าเปิด preview ไม่ขึ้น ให้สตาร์ท `next dev` เองผ่าน terminal แล้วชี้เบราว์เซอร์ไปพอร์ตนั้น |

### ISSUE-005 · GitHub native auto-merge ใช้ไม่ได้ — repo เป็น private บนบัญชีฟรี

| หัวข้อ | รายละเอียด |
| :--- | :--- |
| **อาการ** | หน้า Settings ช่อง **"Allow auto-merge"** เป็นสีเทากดไม่ได้ · `gh pr merge --auto` ล้มด้วย `GraphQL: Auto merge is not allowed for this repository` |
| **สาเหตุที่แท้จริง** | `luminuy/tarot-web` เป็น repo **private** บน **บัญชีส่วนตัวแพลนฟรี** — GitHub เปิด auto-merge ให้เฉพาะ repo **public** (ทุกแพลน) หรือ repo **private** บนแพลน **Pro / Team / Enterprise**<br>ยืนยัน 2026-08-31: `PATCH ... allow_auto_merge=true` → ตอบ 200 แต่ค่ายังเป็น `false` (ปฏิเสธเงียบ) |
| **ผลกระทบ** | ไม่กระทบงานจริง — `.github/workflows/pr.yml` squash-merge ให้เองหลัง CI ผ่าน แล้วลบ branch (INC-0011) · `npm run git:tidy` เก็บกวาดต่อ<br>⚠️ **automation เริ่มทำงานเมื่อ PR ถูกเปิดเท่านั้น** — push commit เฉยๆ ไม่มี PR = ไม่มีอะไร auto ต้องรัน `npm run pr:auto` เปิด PR ก่อน (draft PR ก็ถูกข้าม `pr.yml` เพราะ `if: draft == false`) |
| **ทางแก้ (ถ้าจะเปิดจริง — AI ทำเองไม่ได้)** | 1. อัปเกรด `luminuy` เป็น **GitHub Pro** (~$4/เดือน) · 2. เปลี่ยน repo เป็น **public** |
| **สรุป** | **ปล่อยไว้แบบนี้ได้** — automation ปัจจุบันครบวงจร ไม่ต้องเสียเงิน |

### ~~ISSUE-006 · GitHub Actions เตือน Node.js 20 กำลังเลิกรองรับ~~ — 🟢 **แก้แล้ว (2026-09-04)**

| หัวข้อ | รายละเอียด |
| :--- | :--- |
| **การแก้ไข** | อัปเป็น `actions/checkout@v5` + `actions/setup-node@v5` + `actions/github-script@v8` ครบทั้ง 4 ไฟล์ (`pr.yml`, `deploy.yml`, `auto-release.yml`, `dependabot-automerge.yml`) |
| **ที่ยังเหลือ** | `pnpm/action-setup@v4` · `softprops/action-gh-release@v2` · `dependabot/fetch-metadata@v2` ยังรันบน node20 — เป็น action ของบุคคลที่สาม รอต้นทางอัปเดตเอง เราบังคับไม่ได้ |

### ~~ISSUE-008 · Hydration mismatch ที่หน้าแรก~~ — 🟢 **แก้แล้ว (2026-09-04, INC-0075)**

| หัวข้อ | รายละเอียด |
| :--- | :--- |
| **สาเหตุรากที่แท้จริง** | ไม่ใช่แค่ `stepDirectionRef` — `useReducedMotion()` ของ motion **คืน `null` ตอน SSR** แต่คืน `true`/`false` จริงบนเบราว์เซอร์ ผู้ใช้ที่เปิด prefers-reduced-motion จึงได้ HTML คนละแบบกับฝั่งเซิร์ฟเวอร์ · ซ้ำร้าย motion เขียนค่า `initial` ลงเป็น inline style ตั้งแต่ใน HTML ทำให้เนื้อหาหลักถูกส่งออกไปเป็น `opacity:0` (หน้า `/blog` ส่งการ์ดบทความ **ทั้ง 24 ใบ** ออกไปแบบมองไม่เห็น) |
| **การแก้ไข** | ย้ายทิศทางไป `useState` · ใส่ `initial={false}` ให้ทุก `AnimatePresence` ที่ถูก SSR · เพิ่ม hook `useHasMounted()` ใน `src/lib/motion.ts` สำหรับ motion component ที่ไม่ได้อยู่ใน AnimatePresence |
| **การพิสูจน์** | reproduce ได้จริงบนเบราว์เซอร์ที่เปิด Reduced Motion — ก่อนแก้ console แสดง diff `opacity:0 / translateX(-40px)` เทียบกับ `opacity:1 / none` · หลังแก้ console สะอาด 0 error และ `curl` ทุกหน้าหลักไม่พบ `opacity:0` ใน HTML ฝั่งเซิร์ฟเวอร์อีก |
| 🛡️ **กฎถาวร** | ห้ามอ่านค่าที่ขึ้นกับเบราว์เซอร์ระหว่างเรนเดอร์ของคอมโพเนนต์ที่ถูก SSR · motion component ที่ถูก SSR ต้องเรนเดอร์แรกออกมาที่สถานะปลายทางเสมอ |

### ~~ISSUE-007 · Prisma ออกแบบ schema ไว้แล้วแต่ยังไม่ได้ต่อใช้จริง~~ — 🟢 **ปิดแล้ว (ตรวจ 2026-09-01)**

| หัวข้อ | รายละเอียด |
| :--- | :--- |
| **สรุป** | ระบบ **ย้ายไป Cloudflare D1 เรียบร้อยแล้ว** ไม่ได้ใช้ Prisma และ **ไม่มีโฟลเดอร์ `prisma/` ในโปรเจกต์แล้ว** — ประเด็น Prisma 7 `datasource.url` จึงหมดความหมาย |
| **ของจริงตอนนี้** | binding `APP_DB` ใน `wrangler.jsonc` (`database_id: 560fdbe7…`) · migrations `0001`–`0006` · ตัวช่วย `getAppDB()` ที่ `src/lib/platform/db.ts` |
| **ตารางที่ใช้จริง** | `users` (0004) · `reading_journal` (0005) · `reading_usage` + `user_bonus` (0006) · marketplace (0001–0003) |
| **`src/server/store.ts` ยังอยู่ไหม** | ยังอยู่ แต่เปลี่ยนบทบาทเป็น **session ระหว่างเปิดไพ่** (อายุสั้น มี KV เป็น durable backstop) ไม่ใช่ที่เก็บข้อมูลถาวรอีกแล้ว — ตั้งใจให้เป็นแบบนี้ ไม่ใช่หนี้ทางเทคนิค |
| **ข้อควรระวังที่ยังใช้อยู่** | ⚠️ กฎ PDPA เดิมยังบังคับ — `softDeleteUser()` ต้องลบ `reading_usage`/`user_bonus` ตามไปด้วย และห้ามนำข้อมูลผู้ใช้ไปเทรนโมเดล |

---

## 📌 ช่องว่างของเอกสาร (Documentation Gaps — แก้ไขครบถ้วน 100% แล้ว)

| ช่องว่าง | ทำไมถึงต้องมี | สถานะและการแก้ไข | ลิงก์เอกสารที่จัดทำ |
| :--- | :--- | :---: | :--- |
| ~~**คู่มือตั้งเครื่อง dev (Local Setup)**~~ ✅ | ต้องเดาเอง: pnpm/npm, env อะไรบ้าง, พอร์ตอะไร, dev server บน macOS 12 ต้องเลี่ยงอะไร | **เสร็จสมบูรณ์** | [`docs/LOCAL_SETUP.md`](LOCAL_SETUP.md) |
| ~~**แผนที่ env var จริง**~~ ✅ | ควรมีตารางว่าคีย์ไหนใช้ที่ไฟล์ไหน จำเป็น/ไม่จำเป็น | **เสร็จสมบูรณ์** | ตาราง Section 10 ใน [`docs/ARCHITECTURE.md`](ARCHITECTURE.md#10-แผนที่ตัวแปรแวดล้อมระบบจริง-environment-variables-map) |
| ~~**บันทึกเหตุผลที่ใช้ stack ล้ำเวอร์ชัน**~~ ✅ | `react@19.2`, `next@16.3`, `motion@13` เป็นต้นเหตุ ISSUE-001 ควรมี ADR ว่าตั้งใจและรับความเสี่ยงอะไร | **เสร็จสมบูรณ์** | [`docs/adr/ADR-003-cutting-edge-stack-rationale.md`](adr/ADR-003-cutting-edge-stack-rationale.md) |
| ~~**มาตรฐานคุณภาพ INCIDENT_LOG**~~ ✅ | ~~INC-0008/0009/0010/0014 ช่อง "อาการ" ก็อป "การแก้ไข"~~ | **เสร็จสมบูรณ์** | `validateIncident()` ใน `scripts/incident-log.ts` บล็อก entry ที่ก็อปกันมา + เรียบเรียง INC-0008/9/10/14 ใหม่ |
| ~~**cross-link `AGENTS_TASK_PLAN.md` ↔ KNOWN_ISSUES**~~ ✅ | มี roadmap แยกแต่ไม่อ้างถึงกัน | **เสร็จสมบูรณ์** | หัวไฟล์ทั้งสอง: [`AGENTS_TASK_PLAN.md`](plans/AGENTS_TASK_PLAN.md) และ [`KNOWN_ISSUES.md`](KNOWN_ISSUES.md) |

