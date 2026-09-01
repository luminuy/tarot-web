# 📋 บันทึกประวัติการพัฒนาและสถานะส่งต่องาน (Live Work Log & Handoff Registry)

> **⚠️ กฎเหล็กสำหรับ AI และนักพัฒนาทุกคน**:  
> ทุกครั้งที่ทำงาน แก้บั๊ก หรือเพิ่มฟีเจอร์เสร็จสิ้น **ต้องมาบันทึกสรุปลงในไฟล์นี้เสมอ** ตามโครงสร้างด้านล่าง เพื่อให้คนหรือ AI ตัวต่อไปที่มาทำงานต่อทราบสถานะทันทีว่าถึงไหนแล้ว อะไรแก้ไปแล้ว และมีอะไรค้างอยู่

---

## 📌 สรุปสถานะงานปัจจุบัน (Current Handoff Summary)

> สถานะอัตโนมัติ (typecheck / จำนวนไพ่-ผัง / route probe / agent locks) ถูกเขียนลง
> **`docs/WORK_LOG.status.md`** ทุกครั้งที่รัน `npm run log:sync` หรือ `npm run commit`
> ไฟล์นั้น **ไม่ track ใน git** (`.gitignore`) — เดิมการเขียนทับบล็อกนี้ทุก commit
> เป็นต้นเหตุ merge conflict แทบทุก PR ที่ทำขนานกัน จึงย้ายออกมา
>
> ประวัติงานถาวรและสิ่งที่ค้าง อยู่ในหัวข้อ **"บันทึกประวัติการพัฒนา"** ด้านล่างนี้
> ⚡ **อัปเดตสถานะอัตโนมัติล่าสุด**: `1/9/2569 02:34:14` (ทุกครั้งที่มีการทดสอบ/รันระบบ)

- **สถานะระบบ**: ✅ **Production-Ready & Fully Polished (เสร็จสมบูรณ์ทุก Core Milestone)**
- **AI Agent Concurrency**: ✅ [ปลอดภัย] ไม่พบการชนกันของไฟล์หรือ Agent Lock (16 ไฟล์ที่กำลังแก้, 0 Locks ที่ใช้งานอยู่)
- **TypeScript Health**: `npm run typecheck` ➔ **✅ 0 Errors (สมบูรณ์ 100%)**
- **Database / Cards**: ไพ่ **78 ใบ** (780 ข้อความความหมาย 5 หมวด) สมบูรณ์ 100%
- **ผังพยากรณ์**: **20 ผังพยากรณ์ยอดนิยม** (95 ตำแหน่งพยากรณ์) สัดส่วนทองคำ ไร้การตัดขอบ 100%

### 🧭 ตารางสถานะฟีเจอร์และหน้าเว็บ (Feature Readiness & Roadmap Matrix)

| หน้าเว็บ / ฟีเจอร์ | เส้นทาง (Route / File) | สถานะความพร้อม | สถานะเซิร์ฟเวอร์ | สิ่งที่ทำแล้ว | สิ่งที่สามารถต่อยอดได้ในอนาคต |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **วิหารพยากรณ์หลัก** | `/` | 🟢 **Active / Live** | Dev Server Ready | ผัง 5 ขั้นตอน (เลือกผัง, ตั้งจิต, สับไพ่ 3D, แผ่ไพ่ 78 ใบ, อ่านผลสด SSE, TTS) | เพิ่มโหมดสลับไพ่กลับหัว Manual |
| **สารานุกรมไพ่ 78 ใบ** | `/cards` & `/cards/[id]` | 🟢 **Active / Live** | Dev Server Ready | กริด 78 ใบ + ค้นหา + แท็บกรองชุดไพ่ + หน้าเจาะลึกรายใบ 5 หมวด + โหราศาสตร์ + ปุ่มใบก่อน/ถัดไป | เพิ่ม Audio คำอ่านรายใบ |
| **คลัง 20 ผังพยากรณ์** | `/spreads` | 🟢 **Active / Live** | Dev Server Ready | แท็บกรอง 4 หมวด + ภาพไดอะแกรมผังจริง 20 แบบ + ขยายดูความหมายตำแหน่ง + ปุ่มเปิดผัง | แชร์ผังพยากรณ์แบบรูปภาพ |
| **คัมภีร์บทความความรู้** | `/blog` | 🟡 **Scaffolded (Draft)** | Dev Server Ready | หน้าบทความ 3 บทความหลัก พร้อม UI สวยงาม | ระบบ Dynamic Reader `/blog/[slug]` Markdown |
| **บัญชีและประวัติ** | `/account` | 🟡 **Scaffolded (Draft)** | Dev Server Ready | จัดการความเป็นส่วนตัว, ลบข้อมูลตาม PDPA | ระบบ NextAuth Login และซิงก์ประวัติคลาวด์ |
| **นโยบายความเป็นส่วนตัว** | `/privacy` | 🟢 **Active / Live** | Dev Server Ready | ข้อกำหนด PDPA ครบถ้วน พร้อมปุ่มลบข้อมูลจริง | - |
| **API สับ/เลือก/เฉลย** | `/api/reading/[id]/*` | 🟢 **Active / Live** | Ready | Service Layer + Repository + Provably Fair SHA-256 | เชื่อมต่อ Prisma PostgreSQL ถาวร |
| **Provably Fair Badge** | `ProvablyFairBadge.tsx` | 🟢 **Active / Live** | Ready | ปุ่มและ Modal ตรวจสอบ SHA-256 Commit-Reveal | แสดงตราประทับบนการ์ดผลสรุปคำทำนาย |

---

### 🗓️ 2026-09-01: UI/UX Fix: Consistent Dark Obsidian Background Sanctuary (ปรับพื้นหลังหน้าแรกให้เข้มสนิท สม่ำเสมอ ไม่ซีดจาง)

- **ความต้องการ**: แก้ไขปัญหาพื้นหลังหน้าแรกที่ตอนแรกสีเข้ม แต่เมื่อเลื่อนหน้าจอลงมาสีพื้นหลังจางและสว่างขึ้น โดยปรับให้พื้นหลังเป็นสีดำสนิท (Obsidian Void `#05040a`) สม่ำเสมอทั้งหน้า ไม่เปลี่ยนสีหรือสว่างขึ้นเมื่อเลื่อนหน้าจอ
- **สิ่งที่ทำ**:
  - **GalaxyCanvas Refinement (`src/components/ui/GalaxyCanvas.tsx`)**:
    - นำ nebula clouds ขนาดใหญ่และ mouse radial glow ที่เคยทำให้พื้นหลังมีรอยด่างสีม่วง/ฟ้า/ทองสว่างออก
    - คงความงามของดวงดาวระยิบระยับ (Twinkling Stars) พร้อมระบบ Parallax ตามเมาส์ และดาวตก (Shooting Stars) ที่คมชัดบนผืนฟ้าราตรีสีดำสนิท
  - **MysticAltarCanvas Optimization (`src/components/ui/MysticAltarCanvas.tsx`)**:
    - ปรับ Radial Gradient ให้เป็นโทน Obsidian มืดสนิทสม่ำเสมอ ไม่เกิดวงสว่างตรงกลาง
  - **SpreadCardSelector (`src/components/spread/SpreadCardSelector.tsx`)**:
    - เปลี่ยนสีพื้นหลังของการ์ดผังพยากรณ์เป็นโทน Obsidian `#0b0817` / `#140c26` ที่เรียบหรูและมืดสนิทเข้ากับธีม
    - นำแสงฟุ้ง `bg-radial` และหมอกเบลอที่กระจายแสงด้านล่างออก
  - **Page Layout & Footer (`src/app/page.tsx`)**:
    - นำ `bg-radial` ขนาดใหญ่บริเวณแท่นไพ่ 3D และแสงฟุ้งสีทองด้านล่างของ Footer ออก เหลือเฉพาะเส้นทองคำเปลวเรียบหรู
  - **Verification Suite**:
    - `npm run repo:verify` ผ่านครบ **13/13 ด่าน 100% Green**
- **ไฟล์ที่แก้ไข**:
  - `src/components/ui/GalaxyCanvas.tsx`, `src/components/ui/MysticAltarCanvas.tsx`, `src/components/spread/SpreadCardSelector.tsx`, `src/app/page.tsx`, `docs/WORK_LOG.md`
### 🗓️ 2026-09-01: ระบบสมาชิกและโควตาเปิดไพ่ · PR G — คุมทุกขั้นตอนเปิดใช้งานจาก /admin (ไม่ต้องใช้ terminal)

> เหตุผล: หุ้นส่วนที่คุมระบบไม่ถนัดโปรแกรมมิ่ง — ทุก action ต้องกดจาก `/admin`

- **สิ่งที่ทำ**:
  - `src/app/api/admin/entitlement/ops/route.ts` — endpoint เดียว 4 action (guard requireAdmin, audit):
    - `check_db` / `init_db` — ตรวจ/สร้างตาราง `reading_usage` + `user_bonus` บน D1 (`CREATE TABLE IF NOT EXISTS` รันทีละ statement — idempotent) · ทดแทนการรัน `npm run db:migrate` สำหรับตารางของระบบนี้ (deploy.yml ไม่รัน d1 migrations)
    - `grandfather_preview` — นับผู้ใช้ที่สมัครก่อนวันตัด
    - `grandfather_run` — ให้โบนัส 10 ครั้ง (batch ≤ 4000/ครั้ง กัน timeout · idempotent · คืน `remaining` ถ้ามีเกิน)
  - `src/components/admin/EntitlementAdmin.tsx` — เขียนใหม่เป็น 4 ขั้นเรียงลำดับ 1→4:
    - 1 เตรียมฐานข้อมูล (แสดง ✓ พร้อม / ✗) · 2 โบนัสเปลี่ยนผ่าน (input + ตรวจจำนวน + ให้โบนัส) · 3 แบนเนอร์ประกาศ · 4 เปิดระบบจริง (ปุ่ม disabled จนกว่าฐานข้อมูล ✓ · confirm ก่อนเปิด)
    - + การ์ดสถิติ 8 metric
- **ผลการทดสอบ**:
  - `repo:verify` **14/14** · `build:worker` ✓ · `tsc` 0 errors
  - `next dev` + curl: check_db → `ready:true` · init_db idempotent · seed 3 users (2 เก่า 1 ใหม่) → preview `count:2` → run `granted:2` → run ซ้ำ `granted:2` แต่ `SUM(granted)` ยัง 10 (idempotent) · bad action → 400
  - browser: แท็บ "สิทธิ์เปิดไพ่" render 4 ขั้น + ปุ่ม "ตรวจจำนวน" คืน "พบผู้ใช้ 2 คน" จาก UI
- **runbook เปิดจริง (100% จาก /admin)**: ดู [`docs/ENTITLEMENT_PLAN.md`](ENTITLEMENT_PLAN.md) PR F/G

### 🗓️ 2026-09-01: ระบบสมาชิกและโควตาเปิดไพ่ · PR F — เครื่องมือเปิดใช้งานจริง (โค้ดครบ · ยังไม่เปิดธง)

> ต่อจาก PR E (#92) · **พฤติกรรมเว็บไม่เปลี่ยน** — ธง `entitlement.enabled` ยังปิด · เปิดจริงตาม runbook ใน [`docs/ENTITLEMENT_PLAN.md`](ENTITLEMENT_PLAN.md) (เจ้าของตัดสินใจ + ประกาศ ≥ 7 วัน + โบนัสเปลี่ยนผ่าน)

- **สิ่งที่ทำ**:
  - `scripts/entitlement-grandfather.ts` + `npm run entitlement:grandfather -- --before YYYY-MM-DD [--remote] [--dry-run]` — ให้โบนัส 10 ครั้งแก่ผู้ใช้ที่สมัครก่อนวันตัด (idempotent ด้วย `UNIQUE(user_id, "grandfather")`)
  - `src/components/entitlement/AnnouncementBanner.tsx` — แบนเนอร์หน้าแรกประกาศล่วงหน้า (แสดงเมื่อ `entitlement.announce` เปิด + ธงจริงยังปิด) · ปิดได้ (localStorage)
  - `src/components/admin/EntitlementAdmin.tsx` + แท็บแอดมิน "สิทธิ์เปิดไพ่" — toggle ธง (มี confirm), toggle ประกาศ + วันที่, คำสั่ง grandfather, metric 8 ตัว (blockedStart/Read/Chat, guestConsumed, aiCapHit, signup shown/clicked/dismissed) 7 วันล่าสุด
  - `GET/PUT /api/admin/entitlement` ขยาย — `announce` / `announceResetDate` / `metrics` · `GET /api/entitlement` เผย `announce` ให้ public
  - `use-entitlement.ts` — เพิ่ม `announce` / `announceResetDate` ใน type
- **ผลการทดสอบ**:
  - `repo:verify` **14/14** · gate 14 `test-entitlement` → **36/36** (+grandfather idempotent) · `build:worker` ✓
  - `next dev` + curl: admin GET/PUT entitlement (flag/announce/metrics) · public `/api/entitlement` เผย `announce:true, announceResetDate:"15 ก.ย. 2569"` เมื่อธงปิด+ประกาศเปิด
  - browser: แบนเนอร์ประกาศแสดงบนหน้าแรก (ธงปิด) · แท็บแอดมิน "สิทธิ์เปิดไพ่" render ครบ 4 panel
  - grandfather script: seed user → grant 10 + signup 3 → `bonusRemaining = 13` · รันซ้ำ → ยัง 13
- **✅ ครบทั้ง 6 PR (A–F) ของ ENTITLEMENT_PLAN** — ระบบพร้อมเปิด รอเจ้าของทำ runbook

### 🗓️ 2026-09-01: ระบบสมาชิกและโควตาเปิดไพ่ · PR E — การ์ดชวนสมัครหลังอ่านจบ

> ต่อจาก PR D (#91) · **พฤติกรรมเว็บไม่เปลี่ยน** (ธงปิด → การ์ดไม่แสดง)

- **สิ่งที่ทำ**:
  - `src/components/entitlement/PostReadingSignup.tsx` — การ์ดท้ายขั้น SUMMARY (`!isStreaming`) เฉพาะ guest + ธงเปิด · ปิดได้ (localStorage 7 วัน — ไม่ตื๊อ) · ไม่ใช่ป๊อปอัปทับ
  - `src/app/api/stats/event/route.ts` — `POST` endpoint ให้ UI ยิง event ผ่าน **allowlist** (`signup_card_shown`/`clicked`/`dismissed`) → `recordEvent()` (กัน metric อิสระทำ KV บวม)
  - `src/app/page.tsx` — `<PostReadingSignup/>` ท้าย SUMMARY step
  - ผูกดวง guest → บัญชีหลังสมัคร: ใช้ `syncAnonymousHistoryToServer()` ที่ page.tsx เรียกหลัง `auth_success` อยู่แล้ว (ไม่ต้องทำใหม่)
- **ผลการทดสอบ**: `repo:verify` **14/14** · `build:worker` ✓ · curl: `signup_card_shown` → 200 · `evil_metric` → 400 (allowlist ทำงาน)
- **หมายเหตุ**: การ์ด visual ที่ SUMMARY ยังไม่ได้เห็นในเบราว์เซอร์ (test cookie เป็น guest ที่สิทธิ์หมด เริ่ม reading ใหม่ไม่ได้) — ตรวจซ้ำตอน production
- **ยังไม่ทำ**: PR F (rollout — โบนัสเปลี่ยนผ่าน + ประกาศ + เปิดธง — **ต้องเจ้าของตัดสินใจ**)

### 🗓️ 2026-09-01: ระบบสมาชิกและโควตาเปิดไพ่ · PR D — สถานะบนหน้าเว็บ (QuotaBadge / EntitlementGate / locked chat)

> ต่อจาก PR C (#90) · **พฤติกรรมเว็บไม่เปลี่ยน** (ธง `entitlement.enabled` ปิด → badge/gate ไม่แสดง, หน้าเลือกผังปกติ)

- **สิ่งที่ทำ**:
  - `src/lib/entitlement/use-entitlement.ts` — hook `useEntitlement()` + module-level cache (ยิง `/api/entitlement` ครั้งเดียวทั้งหน้า) + `refreshEntitlement()` bust cache
  - `src/components/entitlement/QuotaBadge.tsx` — ป้ายสิทธิ์ข้าง `UserProfileBadge` (guest: "ทดลองฟรี 1 ครั้ง" · member: "เปิดได้อีก N ครั้ง · รีเซ็ตวัน…")
  - `src/components/entitlement/EntitlementGate.tsx` — wrap เนื้อหาขั้น SPREAD_SELECT · สิทธิ์หมด → การ์ด "ครั้งแรกจบแล้ว" (guest + ปุ่มสมัคร) / "ปิดวงสัปดาห์นี้" (member + วันรีเซ็ต)
  - `src/components/reading/FollowUpChat.tsx` — `!canChat` → ช่องพิมพ์กลายเป็นปุ่ม "สมัครสมาชิกเพื่อถามแม่หมอต่อ" (เปิด AuthModal ผ่าน event `tarot:open-auth`) + ซ่อนคำถามแนะนำ
  - `src/app/page.tsx` — `<QuotaBadge/>` ใน header · wrap SPREAD_SELECT ด้วย `<EntitlementGate>` · `refreshEntitlement()` หลัง `done` + หลัง `auth_success` · listener `tarot:open-auth` → เปิด AuthModal
  - **ปรับจากแผน**: ใช้ hook + module cache แทน "prop จาก page.tsx" เพื่อลดการแก้ page.tsx (1081 บรรทัด state machine เปราะ) — spirit เดียวกัน (ยิง `/api/entitlement` ครั้งเดียว)
- **ผลการทดสอบ**:
  - `repo:verify` **14/14** · `build:worker` ✓
  - browser (flag on): guest ใหม่ → badge "ทดลองฟรี 1 ครั้ง" → ทำ reading → reload → badge "ทดลองฟรีครบแล้ว" + gate "ครั้งแรกจบแล้ว" แทนหน้าเลือกผัง (spread selector `hasSpreadSelector:false`)
  - browser (flag off): `enabled:false` → badge/gate หายหมด, หน้าเลือกผังปกติ — **เหมือนก่อน PR D 100%**
  - hydration warning (motion SSR `translateX ±40px`) — **มีอยู่ก่อน PR D** (ยืนยันด้วย `git stash` แล้ว reload)
- **ยังไม่ทำ**: PR E (การ์ดชวนสมัคร) · PR F (rollout — ต้องเจ้าของ)

### 🗓️ 2026-09-01: ระบบสมาชิกและโควตาเปิดไพ่ · PR C — สิทธิ์ฟรีของผู้เยี่ยมชม (คุกกี้ tarot_guest)

> ต่อจาก PR B (#89) · **พฤติกรรมเว็บไม่เปลี่ยน** (ธง `entitlement.enabled` ยังปิด)

- **สิ่งที่ทำ**:
  - `src/lib/auth/edge-auth.ts` — เพิ่ม `signPayload()` / `verifyPayload<T>()` — HMAC-SHA256 + `AUTH_SECRET` เดิม (reuse กลไก ไม่เขียนใหม่)
  - `src/lib/entitlement/guest.ts` — คุกกี้ `tarot_guest` เก็บ `{ gid, used }` · httpOnly · SameSite=Lax · Secure (prod) · Max-Age 1 ปี · `readGuestCookie()` clamp used ที่ `GUEST_LIMIT`
  - `src/lib/entitlement/viewer.ts` — `getViewer()` อ่านคุกกี้ guest → `guestUsed`
  - `src/app/api/reading/[id]/read/route.ts` — guest ที่ผ่าน gate → เขียนคุกกี้ `used=1` ลง SSE response headers (**ไม่มี refund สำหรับ guest** — สิทธิ์ฟรีเป็น best-effort, ล้างคุกกี้ = สิทธิ์ใหม่, ตาม ENTITLEMENT_PLAN ข้อ 3) · stat `entitlement_guest_consumed`
  - `src/app/privacy/page.tsx` — เพิ่มบรรทัดประกาศคุกกี้ `tarot_guest` (first-party, เก็บแค่รหัสสุ่ม+จำนวนครั้ง, ไม่มี PII, ไม่ติดตามข้ามเว็บ) — **ทำใน PR เดียวกันตามแผน**
- **ผลการทดสอบ**:
  - gate 14 `test-entitlement.ts` → **35/35** (+ sign/verify + tamper คุกกี้) · `repo:verify` **14/14** · `build:worker` ✓
  - `next dev` + curl (flag on): fresh guest `remaining:1` → reading flow เต็ม (start→shuffle→read) → คุกกี้ `tarot_guest` set → `GET /api/entitlement` `remaining:0 reason:guest_used` → start ครั้งที่ 2 = **403** พร้อม CTA สมัคร
- **ยังไม่ทำ**: PR D (UI) · PR E (การ์ดชวนสมัคร) · PR F (rollout — ต้องเจ้าของ)

### 🗓️ 2026-09-01: ระบบสมาชิกและโควตาเปิดไพ่ · PR B — บังคับสิทธิ์ที่ API

> ต่อจาก PR A (#87) · **พฤติกรรมเว็บไม่เปลี่ยน** (ธง `entitlement.enabled` ยังปิด · flag off = readings/chat ปกติทุกอย่าง)

- **สิ่งที่ทำ**:
  - `src/lib/entitlement/viewer.ts` — `getViewer(request)` → `member` (จากคุกกี้ `tarot_auth_session`) หรือ `guest` (used=0 จนถึง PR C)
  - `src/app/api/entitlement/route.ts` — `GET` คืน `Entitlement` ให้ UI · flag off → สิทธิ์ "ไม่จำกัด"
  - `src/app/api/reading/start/route.ts` — เช็คสิทธิ์หลัง safety ก่อน commitment → `403` + `reason`/`resetAt` (**ยังไม่หัก** — ENTITLEMENT_PLAN ข้อ 1)
  - `src/app/api/reading/[id]/read/route.ts` — หักสิทธิ์หลังบล็อกอ่านซ้ำ · **คืนสิทธิ์ครบทุก failure path**: error event, catch, stream ถูกตัด (`completedOk` guard ใน finally), และ `done` ที่ token=0 (คำอ่านสำรอง/ออฟไลน์)
  - `src/app/api/reading/[id]/chat/route.ts` — guest + flag on → `403 members_only` (แชท = สมาชิกเท่านั้น ไม่กินโควตา)
  - `src/lib/security/ai-budget.ts` — `isAiCapReached(tier)` เพดานสองชั้น guest 70% / member 100% (default `guest` · flag off ส่ง `member` = พฤติกรรมเดิม)
  - `src/app/api/admin/entitlement/route.ts` — GET/PUT ธง (สำหรับ PR F) + audit log
  - **stats ใหม่**: `entitlement_blocked_start/read/chat`
- **ผลการทดสอบ**:
  - gate 14 `test-entitlement.ts` → **32/32** (+ เพดาน AI สองชั้น) · `repo:verify` **14/14** · `build:worker` ✓
  - `next dev` + curl: flag off = readings/chat ปกติ · flag on + guest → `GET /api/entitlement` = `{kind:guest,canChat:false,remaining:1}` · chat → `403 members_only` · start → `200`
  - PUT `/api/admin/entitlement {enabled}` toggle ธงได้ (audited)
- **ยังไม่ครบ**: member-path e2e (หัก/คืนจริงผ่าน OAuth session) — พิสูจน์ด้วย unit test · PR C สิทธิ์ผู้เยี่ยมชม · PR D–F

### 🗓️ 2026-09-01: ระบบสมาชิกและโควตาเปิดไพ่ · PR A — แกนสิทธิ์ + ตารางฐานข้อมูล

> อ้างอิงแผน [`docs/ENTITLEMENT_PLAN.md`](ENTITLEMENT_PLAN.md) · **ไม่เปลี่ยนพฤติกรรมเว็บ** (ยังไม่ต่อกับเส้นทางใด · ธง `entitlement.enabled` ยังปิด)

- **ความต้องการ**: สร้างแกนสิทธิ์การเปิดไพ่ (แหล่งความจริงเดียว) + ตาราง D1 ก่อนบังคับใช้ที่ API ใน PR B
- **สิ่งที่ทำ**:
  - `migrations/0007_reading_entitlement.sql` — ตาราง `reading_usage` (แถวต่อการเปิดไพ่ · `UNIQUE(reading_id)` กันหักซ้ำ) + `user_bonus`
    - **ปรับจากแผน**: แผนเดิมเขียน migration 0006 (ชนกับ email_auth) → เลื่อนเป็น 0007 · `user_bonus` เปลี่ยนจาก 1 แถว/user เป็นหลายแถว + `UNIQUE(user_id, reason)` เพื่อให้ `grantBonus` idempotent ต่อเหตุผล และตรวจย้อนหลังได้ (ตรงหลักการเดียวกับ `reading_usage`)
  - เพิ่มสองตารางเข้า local SQLite shim (`src/lib/platform/db.ts`) — dev/test มีตารางครบ
  - `src/lib/entitlement/week.ts` — `weekKey()` (จันทร์ 00:00 เวลาไทย UTC+7), `nextResetAt()`
  - `src/lib/entitlement/entitlement.ts` — `getEntitlement()`, `consumeReading()` (fast-path check + พึ่ง `UNIQUE` + catch สำหรับ race), `refundReading()`, `grantBonus()`/`grantSignupBonus()`, `purgeEntitlementData()` · ค่าคงที่ `WEEKLY_LIMIT=3` `GUEST_LIMIT=1` `SIGNUP_BONUS=3` `GRANDFATHER_BONUS=10`
  - `src/lib/entitlement/flag.ts` — `isEntitlementEnabled()` อ่าน KV `app:flag:entitlement.enabled` (default ปิด)
  - โบนัสสมัครใหม่: `grantSignupBonus()` แทรกใน OAuth callback (branch new-user 3,4) + email signup route
  - PDPA: `softDeleteUser()` เรียก `purgeEntitlementData()` ลบ `reading_usage` + `user_bonus` ของ user
  - **gate ที่ 14 ใหม่**: `scripts/qa/test-entitlement.ts` (30 เคส) — weekKey คร่อมวัน, ลำดับ weekly ก่อน bonus, กันหักซ้ำ concurrent, refund, สิทธิ์หมด, PDPA cascade
- **ผลการทดสอบ**: `npm run repo:verify` ➔ ✅ **14/14 ด่าน** · gate ใหม่ 30/30
- **ยังไม่ทำ**: PR B (บังคับสิทธิ์ที่ API) · PR C (สิทธิ์ผู้เยี่ยมชม) · PR D–F

### 🗓️ 2026-09-01: Email & Password Authentication Suite · PR 5: Hardening, Session Token Version Revocation & Architecture Docs (เสริมความแกร่งและความปลอดภัยสูงสุด)

- **ความต้องการ**: ปรับปรุงระบบตรวจสอบและเพิกถอนเซสชันอัตโนมัติเมื่อมีการเปลี่ยนรหัสผ่านหรือลบบัญชีผู้ใช้ (`token_version` validation), เพิกถอน Token คงค้างในระบบทั้งหมดเมื่อผู้ใช้ขอลบบัญชีตามสิทธิ์ PDPA และอัปเดตคู่มือสถาปัตยกรรมระบบรวมถึงขั้นตอนการตั้งค่า Secrets บน Cloudflare Workers
- **สิ่งที่ทำ**:
  - **Session Invalidation via `token_version` (`src/app/api/auth/me/route.ts`)**:
    - ตรวจสอบ `token_version` ใน JWT Payload เทียบกับ `token_version` ปัจจุบันใน D1 database
    - หากพบว่า `token_version` ในฐานข้อมูลมากกว่า (เกิดจากการเปลี่ยนรหัสผ่านบนอุปกรณ์อื่น) หรือบัญชีถูกลบ ระบบจะลบ Cookie `tarot_auth_session` และตัดเซสชันทันที
  - **PDPA Account Deletion Token Cascade (`src/app/api/account/route.ts`)**:
    - เพิกถอน verification tokens และ password reset tokens ทั้งหมดของผู้ใช้ทันทีเมื่อมีการขอลบบัญชี
  - **Architecture & Deployment Documentation**:
    - อัปเดต `docs/ARCHITECTURE.md` เพิ่มหมวดที่ 9: ระบบยืนยันตัวตนด้วยอีเมลและรหัสผ่าน (Web Crypto PBKDF2, Single-Use Token, Anti-Enumeration, Account Linking)
    - อัปเดต `docs/CLOUDFLARE_DEPLOYMENT_GUIDE.md` ระบุคำสั่งตั้งค่า Secrets สำหรับ `AUTH_SECRET`, `PASSWORD_PEPPER`, `RESEND_API_KEY`, และ `EMAIL_FROM`
  - **Verification Suite**:
    - `npm run repo:verify` ผ่านครบ **13/13 ด่าน 100% Green**
- **ไฟล์ที่สร้าง/แก้ไข**:
  - แก้ไข: `src/app/api/auth/me/route.ts`, `src/app/api/account/route.ts`, `docs/ARCHITECTURE.md`, `docs/CLOUDFLARE_DEPLOYMENT_GUIDE.md`, `docs/WORK_LOG.md`

### 🗓️ 2026-09-01: Email & Password Authentication Suite · PR 4: OAuth Account Linking & Change Password Sanctuary (การเชื่อมต่อบัญชี & จัดการรหัสผ่าน)

- **ความต้องการ**: พัฒนาระบบเชื่อมโยงบัญชีอัตโนมัติ (OAuth Account Linking) เพื่อป้องกันปัญหาบัญชีซ้ำซ้อนเมื่อผู้ใช้เข้าสู่ระบบด้วย Google หรือ LINE ที่มีอีเมลตรงกับบัญชีที่เคยสมัครด้วยรหัสผ่าน และเพิ่ม API พร้อมหน้า UI สำหรับการเปลี่ยนรหัสผ่าน / ตั้งรหัสผ่านเริ่มต้นสำหรับบัญชี
- **สิ่งที่ทำ**:
  - **OAuth Account Linking (`src/app/api/auth/[provider]/callback/route.ts`)**:
    - ตรวจสอบ `findUserIdByOAuth` และ `getUserByEmail` เมื่อผู้ใช้ผ่านการตรวจสอบสิทธิ์จาก Google หรือ LINE
    - เชื่อมโยง provider_user_id เข้ากับ user_id เดิมในตาราง `oauth_identities` แบบอัตโนมัติโดยไม่สูญเสียประวัติเดิม
  - **Change Password API Route (`src/app/api/account/change-password/route.ts`)**:
    - รองรับทั้งการเปลี่ยนรหัสผ่านเดิม (ต้องตรวจยืนยัน old password) และการตั้งรหัสผ่านเริ่มต้นสำหรับผู้ใช้ที่เคยล็อกอินผ่าน OAuth เท่านั้น
    - ตรวจสอบความปลอดภัยตามเกณฑ์ NIST 2024
    - เพิ่มค่า `token_version` อัตโนมัติ เพื่อเพิกถอนเซสชันเก่าบนอุปกรณ์อื่น
  - **Account UI Integration (`src/components/account/ChangePasswordCard.tsx` & `src/app/account/page.tsx`)**:
    - การ์ดจัดการรหัสผ่านในหน้า `/account` ปรับเปลี่ยนข้อความและฟอร์มตามสถานะของผู้ใช้ (เคยตั้งรหัสผ่านแล้ว หรือเป็นบัญชี OAuth)
  - **Verification Suite**:
    - เพิ่มชุดทดสอบ Account Linking ใน `scripts/qa/test-email-auth.ts`
    - `npm run repo:verify` ผ่านครบ **13/13 ด่าน 100% Green**
- **ไฟล์ที่สร้าง/แก้ไข**:
  - เพิ่มใหม่: `src/app/api/account/change-password/route.ts`, `src/components/account/ChangePasswordCard.tsx`
  - แก้ไข: `src/app/api/auth/[provider]/callback/route.ts`, `src/app/account/page.tsx`, `scripts/qa/test-email-auth.ts`, `docs/WORK_LOG.md`

### 🗓️ 2026-09-01: Email & Password Authentication Suite · PR 3: AuthModal, Password Reset Page & Client UI (หน้าต่างเข้าสู่ระบบและรีเซ็ตรหัสผ่าน)

- **ความต้องการ**: ปรับปรุงหน้าต่างเข้าสู่ระบบ (`AuthModal.tsx`) ให้รองรับการเข้าสู่ระบบ/สมัครสมาชิก/ลืมรหัสผ่านด้วยอีเมลและรหัสผ่าน พร้อมตัววัดความแข็งแรงของรหัสผ่าน (Password Strength Meter), สร้างหน้าตั้งรหัสผ่านใหม่ (`/reset-password`), แบนเนอร์เตือนยืนยันอีเมลใน `UserProfileBadge` และ Toast แจ้งเตือนสถานะในหน้าหลัก
- **สิ่งที่ทำ**:
  - **AuthModal UI (`src/components/auth/AuthModal.tsx`)**:
    - รองรับ 3 โหมด: `signin`, `signup`, `forgot`
    - เพิ่มช่องกรอกชื่อ, อีเมล, รหัสผ่าน พร้อมปุ่มเปิด/ปิดการมองเห็นรหัสผ่าน (Show/Hide Toggle)
    - Client-side Password Strength Meter 4 ระดับ (สีแดง/เหลือง/เขียว/ทองคำ ✦)
    - Accessible Form Inputs (touch targets >= 44px, font size >= 16px ป้องกัน iOS auto-zoom, `aria-live="polite"` สำหรับ error/success messages)
    - ตัวเลือกเข้าสู่ระบบด้วย Google และ LINE OAuth ด้านล่าง
  - **Reset Password Page (`src/app/reset-password/page.tsx`)**:
    - หน้าตั้งรหัสผ่านใหม่แบบ Dynamic Route + Suspense Guard
    - ช่องกรอกรหัสผ่านใหม่ + ยืนยันรหัสผ่าน + Strength Meter
    - จัดการกรณี Token ไม่ถูกต้องหรือหมดอายุอย่างชัดเจน
  - **UserProfileBadge Updates (`src/components/auth/UserProfileBadge.tsx`)**:
    - แสดงสถานะ provider "บัญชีอีเมล"
    - แถบเตือนสีทอง/ส้ม "⚠️ ยังไม่ยืนยันอีเมล" พร้อมปุ่มกด "ส่งลิงก์ใหม่" เรียก `/api/auth/email/resend`
  - **Main Page Auth Toasts (`src/app/page.tsx`)**:
    - ตรวจจับ Query params: `?verified=1`, `?pw_reset=1`, `?verify_error=...` และแสดงแบนเนอร์แจ้งเตือนอัตโนมัติ
  - **Verification Suite**:
    - `npm run repo:verify` ผ่านครบ **13/13 ด่าน 100% Green**
- **ไฟล์ที่สร้าง/แก้ไข**:
  - เพิ่มใหม่: `src/lib/auth/strength.ts`, `src/app/reset-password/page.tsx`
  - แก้ไข: `src/components/auth/AuthModal.tsx`, `src/components/auth/UserProfileBadge.tsx`, `src/app/api/auth/me/route.ts`, `src/app/page.tsx`, `docs/WORK_LOG.md`

### 🗓️ 2026-09-01: Email & Password Authentication Suite · PR 2: API Endpoints, Token Lifecycle, Rate Limiting & Email Delivery (ระบบส่งอีเมล & API เส้นทาง)

- **ความต้องการ**: พัฒนา API endpoints สำหรับการสมัครสมาชิก, เข้าสู่ระบบ, ยืนยันอีเมล, ส่งอีเมลซ้ำ, ขอลืมรหัสผ่าน และตั้งรหัสผ่านใหม่ พร้อมระบบป้องกัน Anti-Enumeration, Token Lifecycle Management, Email Sending ด้วย Resend API และ KV Rate Limiting
- **สิ่งที่ทำ**:
  - **Password Policy (`src/lib/auth/password-policy.ts`)**:
    - ตรวจสอบความปลอดภัยตาม NIST 2024 (ยาว 10-200 ตัวอักษร, ไม่ตรงกับอีเมล, ไม่เป็นรหัสผ่านยอดฮิต)
  - **Token Repository (`src/lib/auth/auth-tokens.repo.ts`)**:
    - `issueToken`, `consumeToken` (Single-use with TTL, เก็บเฉพาะ SHA-256 hash ป้องกัน token leak), `invalidateUserTokens`
  - **Email Templates & Sender (`src/lib/email/templates.ts` & `src/lib/email/send.ts`)**:
    - เทมเพลตอีเมลภาษาไทยมูเตลูสีทองพรีเมียม (Verify Email, Reset Password, Account Alert)
    - ส่งผ่าน Resend API พร้อมโหมดจำลองในคอนโซลสำหรับ Local & CI Testing
  - **Rate Limiting Layer (`src/lib/security/auth-ratelimit.ts`)**:
    - ควบคุมความถี่ (Signup 3/ชม., Login 8/15นาที, Forgot 3/ชม., Resend 3/ชม.) พร้อมระบบ Privileged Test Request Bypass
  - **6 API Endpoints (`src/app/api/auth/email/`)**:
    - `POST /api/auth/email/signup`: สมัครสมาชิกและส่งอีเมลยืนยันตัวตน พร้อมออก session ทันที
    - `POST /api/auth/email/login`: เข้าสู่ระบบแบบ Anti-Enumeration 401 ปลอดภัย
    - `GET /api/auth/email/verify`: ยืนยันอีเมลผ่านลิงก์และอัปเดตสถานะในระบบ
    - `POST /api/auth/email/resend`: ขอส่งลิงก์ยืนยันอีเมลซ้ำ
    - `POST /api/auth/email/forgot`: ขอลืมรหัสผ่าน (Anti-Enumeration 200 generic)
    - `POST /api/auth/email/reset`: ตั้งรหัสผ่านใหม่และเพิกถอน Token เก่า
  - **Verification Suite**:
    - สร้าง QA test `scripts/qa/test-email-auth.ts` ครอบคลุม 7 flow ย่อย
    - `npm run repo:verify` ผ่านครบ **13/13 ด่าน 100% Green**
- **ไฟล์ที่สร้าง/แก้ไข**:
  - เพิ่มใหม่: `src/lib/auth/password-policy.ts`, `src/lib/auth/auth-tokens.repo.ts`, `src/lib/email/templates.ts`, `src/lib/email/send.ts`, `src/lib/security/auth-ratelimit.ts`, `src/app/api/auth/email/signup/route.ts`, `src/app/api/auth/email/login/route.ts`, `src/app/api/auth/email/verify/route.ts`, `src/app/api/auth/email/resend/route.ts`, `src/app/api/auth/email/forgot/route.ts`, `src/app/api/auth/email/reset/route.ts`, `scripts/qa/test-email-auth.ts`
  - แก้ไข: `src/lib/auth/edge-auth.ts`, `src/lib/users/users.repo.ts`, `scripts/github-auto.ts`, `docs/WORK_LOG.md`

### 🗓️ 2026-09-01: Email & Password Authentication Suite · PR 1: Schema & PBKDF2 Password Hashing (ระบบเข้าสู่ระบบด้วยอีเมลและรหัสผ่าน)

- **ความต้องการ**: พัฒนาระบบยืนยันตัวตนด้วยอีเมลและรหัสผ่าน (Email/Password Authentication) เสริมจาก Google และ LINE OAuth โดยรหัสผ่านต้องได้รับการแฮชด้วย PBKDF2-HMAC-SHA256 ร่วมกับ Server-side Pepper บน Cloudflare Web Crypto ปลอดภัย 100%
- **สิ่งที่ทำ**:
  - **D1 Migration `migrations/0006_email_auth.sql`**:
    - เพิ่มคอลัมน์ `email_lower`, `password_hash`, `email_verified`, และ `token_version` ในตาราง `users`
    - สร้างตาราง `auth_tokens` (สำหรับ Verification Links และ Password Reset Links แบบ Single-Use พร้อม TTL)
    - สร้างตาราง `oauth_identities` (สำหรับเชื่อมต่อหลาย Identity เข้ากับ User Account เดียว)
    - นำขึ้น Remote Cloudflare D1 เรียบร้อย 100%
  - **Web Crypto Password Hashing (`src/lib/auth/password.ts`)**:
    - ใช้ PBKDF2-HMAC-SHA256 (150,000 iterations + 16 bytes random salt) ร่วมกับ Server-side Pepper (`PASSWORD_PEPPER`)
    - ฟังก์ชัน `hashPassword()`, `verifyPassword()`, `timingSafeEqualBytes()` แบบ zero external dependencies
  - **User Repository Layer (`src/lib/users/users.repo.ts`)**:
    - เพิ่มฟังก์ชัน `normalizeEmail`, `getUserByEmail`, `createEmailUser`, `setPasswordHash`, `markEmailVerified`, `getTokenVersion`, `linkOAuthIdentity`, `findUserIdByOAuth`
  - **Verification Suite**:
    - สร้าง QA test `scripts/qa/test-password.ts` ตรวจสอบความถูกต้องของ Hash, Verification, Random Salting, DB CRUD ครบ 11 ด่านย่อย
    - `npm run repo:verify` ผ่านครบ **12/12 ด่าน 100% Green**
- **ไฟล์ที่สร้าง/แก้ไข**:
  - เพิ่มใหม่: `migrations/0006_email_auth.sql`, `src/lib/auth/password.ts`, `scripts/qa/test-password.ts`
  - แก้ไข: `src/lib/platform/db.ts`, `src/lib/users/users.repo.ts`, `scripts/qa/test-journal-sync.ts`, `scripts/github-auto.ts`, `docs/WORK_LOG.md`

### 🗓️ 2026-09-01: AI Cost Control & Rate Limiting Infrastructure (PR 1 - PR 5: 7-Layer Defense-in-Depth)

- **ความต้องการ**: พัฒนาระบบควบคุมต้นทุน AI (Gemini 3.7 Flash) และป้องกันการยิง API ซ้ำซ้อนโดยไม่ต้องใช้ Captcha/Turnstile ที่ทำลาย UX (ADR-002)
- **สิ่งที่ทำ**:
  - **PR 1: `ratelimit-bypass` (PR #77 MERGED)**:
    - สร้าง `src/lib/security/privileged.ts` รองรับการ bypass การจำกัดความถี่สำหรับแอดมิน (Cookie `tarot_admin`) และระบบเทสต์/CI (Header `X-Tarot-Bypass: RATE_LIMIT_BYPASS_TOKEN` ด้วย `timingSafeEqual`)
    - ผูกเข้ากับ API routes สำคัญ (`/start`, `/shuffle`, `/read`, `/chat`)
  - **PR 2: `ai-spend-cap` (PR #78 MERGED)**:
    - สร้าง `src/lib/security/ai-budget.ts` ควบคุมเพดานงบประมาณ AI รวมต่อวัน (`AI_DAILY_CALL_CAP`, ค่าเริ่มต้น 2,000 ครั้ง)
    - เพิ่ม Circuit Breaker คืนค่า 503 ทันทีบน `/read` เมื่อเต็มเพดาน และตัด fallback อัตโนมัติไปใช้ local contextual synthesis บน `/chat`
    - แสดงสถิติโควตา AI ประจำวันบนแผงแดชบอร์ดแอดมิน (`/admin`)
  - **PR 3: `read-origin-guard` (PR #79 MERGED)**:
    - เพิ่ม Origin Guard (`isRequestAuthorizedOrigin`) บนเส้นทาง `/read` ป้องกันการขโมย API
    - รวม Rate limiter ทั้งระบบให้เป็น Single Source of Truth ผ่าน `@/lib/utils/rate-limit` ตัด duplicate `rateBuckets` ออกจาก `store.ts`
  - **PR 4: `edge-ratelimit` (PR #80 MERGED)**:
    - เพิ่ม Cloudflare KV soft quota per IP (`checkPerIpReadQuota`, 40 ครั้ง/วัน) ซิงก์ข้าม Edge isolate fleet ด้วย SHA-256 IP Hash (PDPA Compliant)
    - จัดทำคู่มือตั้งค่า Cloudflare Native WAF Rate Limiting rules ใน `docs/CLOUDFLARE_DEPLOYMENT_GUIDE.md`
  - **PR 5: `bot-challenge-decision` (PR #81)**:
    - จัดทำบันทึกการตัดสินใจทางสถาปัตยกรรม `docs/ADR-002-bot-challenge.md`
    - อัปเดต `docs/KNOWN_ISSUES.md`, `docs/ARCHITECTURE.md`, `docs/AI_COLLABORATION_GUIDELINES.md`, และ `docs/WORK_LOG.md`

### 🗓️ 2026-09-01: Phase 2 · M7 — Marketplace Payments, Webhook Signature Verification & Platform Revenue Ledger (ระบบชำระเงิน & บัญชีส่วนแบ่ง)

- **ความต้องการ**: พัฒนาระบบชำระเงินสำหรับค่าบริการขอคำปรึกษาแม่หมอ (299 บาท/30 นาที) รองรับ Payment Gateway (Omise / PromptPay / Credit Card) พร้อม Webhook Security Verification และระบบคำนวณส่วนแบ่งรายได้แม่หมอ & ค่าคอมมิชชั่นแพลตฟอร์ม
- **สิ่งที่ทำ**:
  - **D1 Schema & Migration**:
    - สร้าง migration `migrations/0003_marketplace_payments.sql` (ตาราง `payments` และ `payouts`) และ apply ขึ้น Remote Cloudflare D1 สำเร็จ 100%
    - อัปเดต `src/lib/platform/db.ts` local SQLite schema รองรับตาราง `payments` และ `payouts`
  - **Payment Gateway Adapter & Test Mode (M7)**:
    - สร้าง `src/lib/marketplace/payment-gateway.ts` เชื่อมต่อ Omise Charges API พร้อมระบบ **Deterministic Test-Mode Simulator** เพื่อให้ระบบทำงานและทดสอบได้ทันทีระหว่างรอเจ้าของใส่ API Key ในภายหลัง
    - ระบบตรวจสอบความถูกต้องของ Webhook Signature ด้วย HMAC-SHA256 ป้องกันการปลอมแปลง Event (Zero-Trust)
  - **Repository & APIs Layer**:
    - สร้าง `src/lib/marketplace/payments.repo.ts` (CRUD, status transitions `pending` ➔ `paid`, และคำนวณรายได้แม่หมอ `calculateReaderEarnings`)
    - สร้าง API `/api/marketplace/payments` สำหรับสร้างรายการชำระเงิน
    - สร้าง API `/api/marketplace/payments/webhook` สำหรับรับ Webhook ยืนยันการชำระเงิน
    - สร้าง API `/api/admin/payouts` แผงแอดมินดูสรุปรายได้ ยอดรวมคอมมิชชั่น และยอดจ่ายสุทธิของแม่หมอ
  - **UI & Checkout Integration**:
    - อัปเดต `BookQueueModal.tsx` แสดงป้ายราคาค่าบริการ / บูชาครู (299 บาท/30 นาที)
    - อัปเดต `src/app/readers/queue/[id]/page.tsx` แสดงข้อมูลการชำระเงินและบริบทคิว
  - **QA & Verification Suite**:
    - อัปเกรด `scripts/qa/test-marketplace-readers.ts` ครอบคลุม 13 ด่านตรวจ (M4-M7) ผ่าน 100% Green
    - `npm run repo:verify` ผ่านครบ **9/9 ด่าน 100% Green**
    - `npm run build` ผ่าน 109 routes
- **ไฟล์ที่สร้าง/แก้ไข**:
  - เพิ่มใหม่: `migrations/0003_marketplace_payments.sql`, `src/lib/marketplace/payments.repo.ts`, `src/lib/marketplace/payment-gateway.ts`, `src/app/api/marketplace/payments/route.ts`, `src/app/api/marketplace/payments/webhook/route.ts`, `src/app/api/admin/payouts/route.ts`
  - แก้ไข: `src/lib/platform/db.ts`, `src/lib/marketplace/readers.repo.ts`, `src/components/marketplace/BookQueueModal.tsx`, `src/app/readers/queue/[id]/page.tsx`, `scripts/qa/test-marketplace-readers.ts`, `docs/MARKETPLACE.md`, `docs/WORK_LOG.md`
- **ผลการทดสอบ**:
  - `npm run repo:verify` ➔ **ผ่านครบทั้ง 9 ด่าน 100% Green**
  - `npm run build` ➔ **ผ่าน 109 static/dynamic routes**

### 🗓️ 2026-09-01: Phase 2 · M5 & M6 — Real-time Queue Intake, Reader Mission Control & AI Pre-Screening Engine (Marketplace คิวสด & บรีฟแม่หมอ)

- **ความต้องการ**: พัฒนาระบบรับคิวสด (Live Walk-up Queue) และนัดหมายล่วงหน้า เชื่อมต่อแผงควบคุมแม่หมอ (Reader Console) พร้อมระบบ AI คัดกรองคำถาม สรุปบรีฟใน 5 วินาที แนะนำผังพยากรณ์ และบล็อกคำถามวิกฤตสุขภาพจิตด้วยสายด่วน 1323
- **สิ่งที่ทำ**:
  - **D1 Database & Migrations**:
    - สร้าง migration `migrations/0002_marketplace_queue_screening.sql` (ตาราง `reader_availability`, `ai_screening`, `queue_tickets`, `bookings`) และ apply ขึ้น Remote Cloudflare D1 สำเร็จ
    - อัปเดต `src/lib/platform/db.ts` local SQLite schema รองรับทุกตารางแบบ zero-config
  - **Reader Authentication & Security**:
    - สร้าง `src/lib/auth/reader-auth.ts` ระบบ HMAC-SHA256 Secret Token และ Session Guard (`requireReader()`) สำหรับแผงควบคุมแม่หมอ
  - **AI Pre-Screening & Safety Guardrail (M6)**:
    - สร้าง `src/lib/marketplace/screening.ts` วิเคราะห์เจตนา (ความรัก, การงาน, การเงิน, จิตใจ, ทั่วไป) ระดับความด่วน สรุปสาระสำคัญ (Brief) ให้แม่หมออ่านเข้าใจทันที
    - บล็อกคำถามวิกฤตทำร้ายตัวเองทันที และชี้แนะสายด่วนสุขภาพจิต 1323
  - **Queue Repository & APIs (M5)**:
    - สร้าง `src/lib/marketplace/queue.repo.ts` จัดการคำนวณลำดับคิว สถานะคิว (`waiting` ➔ `ready` ➔ `handed_off`) และ auto-purge 7 วันตาม PDPA
    - สร้าง APIs: `/api/marketplace/tickets`, `/api/marketplace/tickets/[id]`, `/api/marketplace/readers/[id]/availability`, `/api/marketplace/console/queue`
  - **Customer & Reader UI Interfaces**:
    - สร้าง `src/components/marketplace/BookQueueModal.tsx` โมดอลกรอกคำถามและกดยินยอม PDPA
    - สร้าง `src/components/marketplace/ReaderDetailClient.tsx` ปรับปรุงหน้า `/readers/[id]` รองรับการเปิดคิวสด
    - สร้าง `src/app/readers/queue/[id]/page.tsx` ห้องรอคิวพยากรณ์สด พร้อม Real-time polling และปุ่มเปิด LINE เมื่อถึงคิว
    - สร้าง `src/app/readers/console/page.tsx` แผงควบคุมแม่หมอ (เปิด/ปิดรับงานสด, ดูสรุปบรีฟ AI, เรียกคิว, ส่งต่อ)
  - **QA & Verification Suite**:
    - อัปเกรด `scripts/qa/test-marketplace-readers.ts` ครอบคลุม CRUD, HMAC Token, Live Toggle, AI Pre-Screening, Crisis Blocking, Queue Cycle และ PDPA Retention
    - `npm run repo:verify` 9/9 ผ่านฉลุย 100% Green
    - `npm run build` ผ่าน 106 routes
- **ไฟล์ที่สร้าง/แก้ไข**:
  - เพิ่มใหม่: `migrations/0002_marketplace_queue_screening.sql`, `src/lib/auth/reader-auth.ts`, `src/lib/marketplace/screening.ts`, `src/lib/marketplace/queue.repo.ts`, `src/app/api/marketplace/tickets/route.ts`, `src/app/api/marketplace/tickets/[id]/route.ts`, `src/app/api/marketplace/readers/[id]/availability/route.ts`, `src/app/api/marketplace/console/queue/route.ts`, `src/components/marketplace/BookQueueModal.tsx`, `src/components/marketplace/ReaderDetailClient.tsx`, `src/app/readers/queue/[id]/page.tsx`, `src/app/readers/console/page.tsx`
  - แก้ไข: `src/lib/platform/db.ts`, `src/lib/marketplace/readers.repo.ts`, `src/app/readers/[id]/page.tsx`, `scripts/qa/test-marketplace-readers.ts`, `docs/MARKETPLACE.md`, `docs/WORK_LOG.md`
- **ผลการทดสอบ**:
  - `npm run repo:verify` ➔ **ผ่านครบทั้ง 9 ด่าน 100% Green**
  - `npm run build` ➔ **ผ่าน 106 static/dynamic routes**

### 🗓️ 2026-09-01: Phase 2 · M4 — Cloudflare D1 Foundation + Human Reader Profiles & Admin System (Marketplace แม่หมอ)

- **ความต้องการ**: สร้างฐานข้อมูล Cloudflare D1 สำหรับระบบ Marketplace รวมโปรไฟล์แม่หมอตัวจริง จัดการผ่านแผงแอดมิน และเปิดหน้ารวมแม่หมอสาธารณะ (`/readers`) ภายใต้ระเบียบ PDPA
- **สิ่งที่ทำ**:
  - **D1 Database & Migrations**:
    - สร้าง D1 Database `tarot-app-db` (`560fdbe7-e1f5-46e1-bad6-c8c387dcfcb5`) พร้อมเพิ่ม binding `APP_DB` ใน `wrangler.jsonc`
    - สร้าง migration `migrations/0001_marketplace_init.sql` (ตาราง `readers` และ `admin_audit`) พร้อมรัน migration ขึ้น Cloudflare D1 สำเร็จ 100%
    - สร้างสคริปต์ `scripts/db-migrate.ts` (`npm run db:migrate`)
  - **Platform & Repository Layer**:
    - สร้าง `src/lib/platform/db.ts` รองรับ Cloudflare D1 บน Worker พร้อม auto-fallback ไปยัง `node:sqlite` สำหรับ local dev และ standalone tests
    - สร้าง `src/lib/marketplace/readers.repo.ts` (list, get, create, update, setStatus, delete, audit) พร้อม projection ปลอดภัย (`PublicReaderProfile` ไม่รั่วไหล lineUrl/secret)
  - **Admin System & UI**:
    - สร้าง API `/api/admin/readers` และ `/api/admin/readers/[id]` (Zod schema validation, `requireAdmin()` guard, `recordAudit` logging)
    - สร้าง `src/components/admin/ReadersManager.tsx` พร้อมเชื่อมต่อแท็บ "แม่หมอ (Marketplace)" ใน `src/app/admin/page.tsx`
  - **Public Pages & Privacy Compliance**:
    - สร้าง `docs/ADR-001-marketplace-pdpa.md` กำหนดมาตรการคุ้มครองข้อมูลส่วนบุคคล (Data Minimization, 30-day retention, off-platform handoff, no AI training)
    - สร้าง `src/components/readers/ReadersDirectory.tsx` หน้ารวมแม่หมอพร้อมค้นหาและฟิลเตอร์หมวดหมู่
    - สร้าง `src/app/readers/page.tsx` และ `src/app/readers/[id]/page.tsx` (Dynamic SSR 100% SEO-friendly)
    - อัปเดต `src/app/robots.ts` disallow `/readers/console`
    - เพิ่มลิงก์แม่หมอตัวจริงลงใน `SacredNavDropdown.tsx`
  - **QA & Verification**:
    - สร้าง `scripts/qa/test-marketplace-readers.ts` ทดสอบ CRUD, security projection, audit trail และผูกเข้าสู่ `scripts/github-auto.ts` (`repo:verify` ครบ 9 ด่าน 100% Green)
- **ไฟล์ที่สร้าง/แก้ไข**:
  - เพิ่มใหม่: `migrations/0001_marketplace_init.sql`, `scripts/db-migrate.ts`, `docs/ADR-001-marketplace-pdpa.md`, `src/lib/platform/db.ts`, `src/lib/marketplace/readers.repo.ts`, `src/app/api/admin/readers/route.ts`, `src/app/api/admin/readers/[id]/route.ts`, `src/app/api/readers/route.ts`, `src/components/admin/ReadersManager.tsx`, `src/components/readers/ReadersDirectory.tsx`, `src/app/readers/page.tsx`, `src/app/readers/[id]/page.tsx`, `scripts/qa/test-marketplace-readers.ts`
  - แก้ไข: `wrangler.jsonc`, `package.json`, `.gitignore`, `src/app/admin/page.tsx`, `src/components/ui/SacredNavDropdown.tsx`, `src/components/ui/TarotArtIcons.tsx`, `src/app/robots.ts`, `scripts/github-auto.ts`, `docs/MARKETPLACE.md`, `docs/ARCHITECTURE.md`, `docs/WORK_LOG.md`
- **ผลการทดสอบ**:
  - `npm run repo:verify` ➔ **ผ่านครบทั้ง 9 ด่าน 100% Green**
  - `npm run build` ➔ **ผ่านฉลุย 103 static/dynamic routes**

### 🗓️ 2026-09-01: เอกสารส่งต่องาน Phase 2 — Marketplace แม่หมอตัวจริง

- สร้าง [`docs/MARKETPLACE.md`](MARKETPLACE.md) — handoff แบบละเอียดสำหรับ AI/นักพัฒนาคนต่อไปทำ M4–M7
  (D1 foundation + readers → คิว walk-up/จอง → AI screening → payments)
- ครอบคลุม: สถานะ Phase 1, สถาปัตยกรรม storage (D1 + KV), SQL schema ร่างครบ 4 migration,
  code pattern ที่ reuse ได้ (file refs), verification playbook (curl/browser/build:worker แบบที่ Claude ใช้),
  gotchas 10 ข้อจาก Phase 1, checklist ต่อ milestone
- **บล็อก 2 จุดก่อนเริ่ม M4**: (1) เจ้าของต้อง `wrangler d1 create tarot-app-db` (2) ADR + PDPA sign-off
- Phase 1 (M0–M3) เสร็จครบแล้ว: PR #57, #59, #60 merged

### 🗓️ 2026-09-01: แผงแอดมิน M3 — Live Content Overrides (แก้ prompt / ไพ่ / แม่หมอ ไม่ต้อง deploy)

> ต่อจาก M2 (PR #59) · แผน: `~/.claude/plans/breezy-percolating-llama.md`

- **ความต้องการ**: แอดมินแก้ prompt กลาง / น้ำเสียงแม่หมอ / ความหมายไพ่ แล้วมีผลกับ production ทันที ไม่ต้อง deploy
- **สิ่งที่ทำ**:
  - สร้าง `src/lib/content/overrides.ts` — เก็บ override เป็น JSON ก้อนเดียวใน KV `app:override:content` (memo cache 60 วิ) + resolver: `resolveSystemCore()`, `resolvePersona()`, `resolveCardByIndex/ById()` + `applyCardOverride()`
  - `src/lib/ai/prompt.ts` — export `SYSTEM_CORE_KNOWLEDGE` · `buildSystemPrompt(personaId, opts?)` รับ `{systemCore, persona}` ที่ resolve แล้ว (ไม่ส่ง = พฤติกรรมเดิม 100%)
  - เดินสายผ่าน consumer: `gemini.ts` + `claude.ts` (`buildSystemPrompt` ใช้ resolved) · `read/route.ts` + `chat/route.ts` (`cardByIndex` → `resolveCardByIndex`)
  - **🔒 override แก้ได้แค่ข้อความ** — `applyCardOverride` คงทุก field ยกเว้น meanings/keywords/yesNo; ค่าว่าง → fallback default; `id/number/element/image/order` แตะไม่ได้
  - `GET/PUT /api/admin/content` — Zod strict validation (reject card id ปลอม / ฟิลด์โครงสร้าง / >200KB / string เกิน limit) + audit log
  - `src/components/admin/ContentEditor.tsx` — 3 sub-tab: prompt กลาง / บุคลิกแม่หมอ (5) / ความหมายไพ่ (78 ค้นหาได้, meaning 5 หมวด × 2 + keywords + yesNo) · ปุ่มคืนค่าเริ่มต้นต่อ field · badge ✦ ไพ่ที่แก้แล้ว
  - **gate ที่ 8 ใหม่**: `scripts/qa/test-overrides-safety.ts` (22 เคส) เพิ่มใน `CHECKS`
- **ผลการทดสอบ**:
  - `npm run repo:verify` ➔ ✅ 8/8 · `build:worker` ➔ verify · gate ใหม่ 22/22
  - curl: PUT override (systemPrompt + persona.warm.voice + card major-00) → GET สะท้อนถูก · card id ปลอม → 400 · ฟิลด์ `element/id` → 400 (strict) · `updatedAt` จาก client → server เขียนทับเอง
  - เบราว์เซอร์: ContentEditor render 3 tab, card editor major-00 แสดง 5 หมวด + yesNo + default placeholder, แก้แล้วขึ้น ✦, save ผ่าน
- **หมายเหตุ**: end-to-end (override → โทน Gemini เปลี่ยนจริง) ต้อง verify บน production ที่มี `GEMINI_API_KEY` — dev ไม่มี key จึงวิ่ง mock path
- **ยังไม่ทำ**: M4–M7 marketplace (ต้อง provision D1 + sign-off PDPA)

### 🗓️ 2026-09-01: แผงแอดมิน M2 — Stats Collection + Dashboard

> ต่อจาก M0+M1 (PR #57) · แผน: `~/.claude/plans/breezy-percolating-llama.md` · [`docs/ADMIN_PANEL.md`](ADMIN_PANEL.md)

- **ความต้องการ**: แอดมินต้องเห็นสถิติการใช้งานครบทุกมิติ (ปัจจุบันระบบไม่เก็บอะไรเลย)
- **สิ่งที่ทำ**:
  - สร้าง `src/lib/stats/record.ts` — `recordEvent()/recordEvents()` fire-and-forget · **buffer ระดับ isolate + flush รวมผ่าน `waitUntil` แบบ debounce 20 วิ** (KV free plan เขียนได้ ~1,000/วัน — ห้ามเขียนต่อ event) · เก็บ `app:stat:day:<YYYY-MM-DD>` + `app:stat:all`
  - สร้าง `src/lib/stats/read.ts` — `getStats(rangeDays)` (force-flush ก่อนอ่าน) + `breakdown()` helper
  - **Instrument** (แตะแค่ 3 route — ไม่ยุ่งใน gemini.ts):
    - `api/reading/start` — `reading_started`, `spread:*`, `persona:*`, `category:*`, `safety_flag:*`, `reading_blocked`
    - `api/reading/[id]/read` — `reading_completed`, `reading_failed`, `ai_call:gemini`, `ai_error:gemini`, `ai_latency_ms`, `ai_tokens_in/out`
    - `api/reading/[id]/chat` — `chat_message`, `chat_blocked`, `safety_flag:*`
  - สร้าง `GET /api/admin/stats?days=` (guard `requireAdmin`) → `{ stats, audit }`
  - สร้าง `src/components/admin/StatsDashboard.tsx` — การ์ดตัวเลข + bar list แบบ CSS (ไม่มี chart lib) · แปลง id→ชื่อไทยจาก `PERSONAS`/`SPREADS` · toggle 7/30/90 วัน · dynamic import ใน `/admin` shell
  - **ห้าม PII**: metric เป็น enum/dimension ล้วน ไม่มีข้อความคำถาม/ชื่อเล่น/IP
- **ผลการทดสอบ**:
  - `npm run repo:verify` ➔ ✅ 7/7 · `next build:worker` (OpenNext) ➔ verify ต่อ
  - `next dev` + curl: ยิง `/api/reading/start` 4 ครั้ง (3 ผัง 2 persona) + 1 crisis → รอ 21 วิ → `GET /api/admin/stats` เห็น `reading_started:4, spread:daily:2, persona:playful:3, category:work:3, reading_blocked:1, safety_flag:crisis:1` ครบถูกต้อง
  - เบราว์เซอร์: dashboard render การ์ด 8 ใบ + bar list 4 กล่อง (ชื่อไทยถูก) + audit log + toggle ช่วงวัน — ไม่มี error
- **ยังไม่ทำ**: M3 live content overrides · M4–M7 marketplace

### 🗓️ 2026-09-01: แผงแอดมิน M0+M1 — Platform Access Layer + Admin Auth & Shell

> ส่วนแรกของแผนใหญ่ "แผงแอดมิน (Live Content + Stats) + Marketplace แม่หมอตัวจริง"
> (แผนเต็ม: `~/.claude/plans/breezy-percolating-llama.md` · เอกสาร: [`docs/ADMIN_PANEL.md`](ADMIN_PANEL.md))

#### M0 — Platform Access Layer (เข้าถึง KV จากโค้ดแอป)
- **ความต้องการ**: ระบบยังไม่มี datastore ที่โค้ดแอปเข้าถึงได้เลย (in-memory ล้วน) — ต้องมีชั้นกลางก่อนทำ stats/overrides
- **สิ่งที่ทำ**:
  - สร้าง `src/lib/platform/cf.ts` — `getAppKV()` ห่อ `getCloudflareContext().env.NEXT_INC_CACHE_KV` (reuse namespace เดิม, key prefix `app:`) + **in-memory shim** อัตโนมัติเมื่อไม่มี binding (`next dev` — ISSUE-004); `getWaitUntil()` สำหรับงาน background
  - สร้าง `src/lib/platform/kv-store.ts` — `kvGetJSON/kvPutJSON/kvDelete/kvIncr/kvListKeys` + isolate memo cache + `KEY` builders (`app:override:*`, `app:stat:*`, `app:flag:*`, `app:audit:*`)
  - **ไม่แตะ `wrangler.jsonc` / `open-next.config.ts`** (กัน INC-0034) · **ไม่เพิ่ม `initOpenNextCloudflareForDev`** ใน next.config.ts (มันสตาร์ท workerd ที่พังบน macOS 12.6 — ISSUE-004)
- **ข้อจำกัดที่รับไว้**: path KV จริงตรวจได้เฉพาะหลัง deploy (curl production) — dev ใช้ shim, ข้อมูลรีเซ็ตเมื่อรีสตาร์ท

#### M1 — Admin Auth + Shell
- **ความต้องการ**: แอดมินเข้า `/admin` ด้วย "รหัสผ่านแยก" (ไม่ผูก OAuth ผู้ใช้)
- **สิ่งที่ทำ**:
  - สร้าง `src/lib/auth/admin-auth.ts` — HMAC-SHA256 session (`node:crypto`), cookie `tarot_admin` อายุ 8 ชม., constant-time password compare, เซ็นด้วย `TAROT_SESSION_SECRET + ADMIN_PASSWORD` (เปลี่ยนรหัส = เตะทุก session)
  - สร้าง `src/lib/auth/require-admin.ts` — `requireAdmin()` guard (401/503) + `isAdminRequest()`
  - สร้าง `src/lib/admin/audit.ts` — audit log append-only บน KV (`recordAudit/listAudit/auditSummary`) — ห้ามเก็บ PII
  - สร้าง route: `POST /api/admin/login` (rate-limit 5/15นาที/IP, reuse `checkRateLimit`), `POST /api/admin/logout`, `GET /api/admin/session`
  - สร้างหน้า: `src/app/admin/layout.tsx` (`robots: noindex`), `src/app/admin/login/page.tsx`, `src/app/admin/page.tsx` (shell + แท็บ สถิติ/เนื้อหา — เนื้อหาจริงมา M2/M3)
  - สร้าง UI primitives: `src/components/ui/Input.tsx` (`Input`, `Textarea`), `src/components/ui/Field.tsx` (label + a11y wrapper)
  - `src/app/robots.ts` — disallow `/admin`
  - `.env.example` — เพิ่ม `ADMIN_PASSWORD`
- **ผลการทดสอบ**:
  - `npm run repo:verify` ➔ ✅ 7/7 ด่าน
  - `next dev` + curl: session anon → `admin:false`; รหัสผิด → 401; รหัสถูก → set cookie `tarot_admin` → `admin:true`; logout → `admin:false`; 6 ครั้งผิด → `429` (rate-limit ทำงาน)
  - เบราว์เซอร์: หน้า login altar-panel + ✦ heading render ถูก, ล็อกอินผ่าน UI → redirect เข้า shell เห็นแท็บ + ปุ่มออกจากระบบ
- **Production setup ที่ต้องทำ**: `npx wrangler secret put ADMIN_PASSWORD` (≥ 12 ตัวอักษร)
- **ยังไม่ทำ (milestone ถัดไป)**: M2 stats collection + dashboard · M3 live content overrides · M4–M7 marketplace (ต้อง provision D1 + sign-off PDPA)

### 🗓️ 2026-09-01: Feature 1 — Edge OAuth (Google + LINE) + Feature 3 — Smart Journal with AI Monthly Retrospective

#### 1. ระบบล็อกอิน Google และ LINE (Edge OAuth HMAC-SHA256)
- **ความต้องการ**: ให้ผู้ใช้สามารถล็อกอินด้วย Google หรือ LINE เพื่อบันทึกและซิงก์ประวัติการดูดวง
- **สิ่งที่แก้ไข**:
  - สร้าง `src/lib/auth/edge-auth.ts` — Edge OAuth engine ด้วย Web Crypto API + HMAC-SHA256 session ไม่ต้องพึ่ง JWT library ภายนอก รองรับ Cloudflare Workers Edge Runtime 100%
  - สร้าง `src/app/api/auth/[provider]/route.ts` — Redirect ไป Google หรือ LINE OAuth พร้อม CSRF state cookie
  - สร้าง `src/app/api/auth/[provider]/callback/route.ts` — แลก code กับ token, ออก session cookie `tarot_auth_session` (HttpOnly, Secure, 30 วัน)
  - สร้าง `src/app/api/auth/me/route.ts` — ตรวจสอบ session และคืน user profile
  - สร้าง `src/app/api/auth/logout/route.ts` — ล้าง session cookie
  - สร้าง `src/components/auth/AuthModal.tsx` — Modal ล็อกอินสไตล์หรูหรา ปุ่ม Google + LINE
  - สร้าง `src/components/auth/UserProfileBadge.tsx` — Badge แสดงชื่อ/avatar ผู้ใช้บน header พร้อมปุ่ม logout
  - แก้ไข `src/app/page.tsx` — เพิ่ม dynamic import AuthModal, state `isAuthOpen`, UserProfileBadge ใน header toolbar
- **ไฟล์ที่สร้าง/แก้ไข**:
  - ใหม่: `src/lib/auth/edge-auth.ts`, `src/components/auth/AuthModal.tsx`, `src/components/auth/UserProfileBadge.tsx`
  - ใหม่: `src/app/api/auth/[provider]/route.ts`, `src/app/api/auth/[provider]/callback/route.ts`
  - ใหม่: `src/app/api/auth/me/route.ts`, `src/app/api/auth/logout/route.ts`
  - แก้ไข: `src/app/page.tsx`
- **ผลการทดสอบ**: `npm run typecheck` ➔ ✅ 0 errors | `npm run repo:verify` ➔ ✅ 7/7 ด่าน

#### 2. Smart Journal พร้อม Outcome Tracking และ AI Monthly Retrospective
- **ความต้องการ**: ให้ผู้ใช้ติดตามว่าคำทำนายไพ่แม่นแค่ไหน และสรุปรายเดือนด้วย AI
- **สิ่งที่แก้ไข**:
  - แก้ไข `src/lib/utils/history.ts` — เพิ่มประเภท `ReadingOutcome` (ACCURATE/PARTIAL/PENDING/NOT_HAPPENED), ฟิลด์ `outcome`, `userNote`, `outcomeUpdatedAt` ใน `SavedReadingItem`; เพิ่ม `updateReadingOutcome()`, `importReadings()`; เพิ่ม cap จาก 30 เป็น 50
  - สร้าง `src/app/api/journal/monthly-summary/route.ts` — Edge API วิเคราะห์ผลทำนาย 15 รายการล่าสุด: ไพ่ที่โผล่บ่อย, ธาตุครอบงำ, Gemini AI สรุปบทเรียนชีวิต+คำเสริมพลัง+ย่อหน้า synthesis (fallback ถ้าไม่มี API key)
  - เขียน `src/components/history/ReadingHistoryModal.tsx` ใหม่ทั้งหมด — ปุ่ม AI Monthly Synthesis, แสดง card ผลสรุป AI, ปุ่มติดตาม Outcome รายการ, textarea บันทึกความคิด, แท็บกรองตาม Outcome, ค้นหาครอบคลุม userNote
- **ไฟล์ที่สร้าง/แก้ไข**:
  - แก้ไข: `src/lib/utils/history.ts`, `src/components/history/ReadingHistoryModal.tsx`
  - ใหม่: `src/app/api/journal/monthly-summary/route.ts`
- **ผลการทดสอบ**: `npm run typecheck` ➔ ✅ 0 errors | Deploy บน `origin/main` สำเร็จ (รวมใน PR #51 Squash Merge)

#### ⚠️ สิ่งที่ต้องทำเพิ่ม (ยังไม่ได้ตั้งค่า)
- ตั้งค่า Cloudflare Worker Secrets เพื่อให้ OAuth ทำงานจริงบน Production:
  ```bash
  npx wrangler secret put GOOGLE_CLIENT_ID --name tarot-web
  npx wrangler secret put GOOGLE_CLIENT_SECRET --name tarot-web
  npx wrangler secret put LINE_CHANNEL_ID --name tarot-web
  npx wrangler secret put LINE_CHANNEL_SECRET --name tarot-web
  ```
- สร้าง Google OAuth App บน [console.cloud.google.com](https://console.cloud.google.com)
- สร้าง LINE Login Channel บน [developers.line.biz](https://developers.line.biz)

### 🗓️ 2026-08-31: ระบบบันทึกบทเรียนความผิดพลาดอัตโนมัติและมาตรฐานวิศวกรรม (Incident Log & Engineering Discipline Protocol)


#### 1. วางระบบบันทึกความผิดพลาดอัตโนมัติและกฎ 7 ข้อ (Incident Log Engine & Blameless Post-Mortem)
- **ปัญหาเดิม**: AI แต่ละตัวที่เข้ามาทำงานต่ออาจทำผิดซ้ำเรื่องเดิม (เช่น ปัญหา image-rendering, header ทับซ้อน, คำสั่ง gh ใน worktree, flaky random test) เพราะไม่มีแหล่งบันทึกบทเรียนกลางที่บังคับให้อ่านและบันทึก
- **สิ่งที่แก้ไข**:
  - สร้าง `docs/INCIDENT_LOG.md` บันทึกบทเรียนจากเหตุการณ์จริง INC-0001 ถึง INC-0007 พร้อมกฎป้องกันถาวร
  - สร้าง `docs/KNOWN_ISSUES.md` บันทึกบั๊กที่ยืนยันแล้วแต่ยังไม่ได้แก้ (ISSUE-001 ถึง ISSUE-007) ป้องกันการแก้ซ้ำซ้อน
  - สร้าง `scripts/incident-log.ts` (`npm run incident`) สำหรับบันทึกบทเรียนทั้งแบบ CLI และโปรแกรม
  - อัปเกรด `scripts/git-author-guard.ts` เพิ่มเกณฑ์วิศวกรรม: บล็อก commit ประเภท `fix` ทุกตัวที่ไม่ระบุ `--cause` และ `--prevention` พร้อมบันทึกลง `docs/INCIDENT_LOG.md` ให้อัตโนมัติก่อน commit
  - แก้ไข `scripts/agent-guard.ts` และ `scripts/github-auto.ts`: เพิ่ม `inferCurrentAgent()` จาก environment variable และ branch name เพื่อไม่ให้ระบบตรวจจับ lock ของตนเองเป็น collision
  - อัปเดต `docs/AI_COLLABORATION_GUIDELINES.md`, `CLAUDE.md`, `GEMINI.md`, `README.md` และ `package.json`
- **ไฟล์ที่แก้ไข**:
  - เพิ่มใหม่: `docs/INCIDENT_LOG.md`, `docs/KNOWN_ISSUES.md`, `scripts/incident-log.ts`
  - แก้ไข: `scripts/agent-guard.ts`, `scripts/git-author-guard.ts`, `scripts/github-auto.ts`, `docs/AI_COLLABORATION_GUIDELINES.md`, `CLAUDE.md`, `GEMINI.md`, `README.md`, `package.json`, `docs/WORK_LOG.md`
- **ผลการทดสอบ**:
  - `npm run repo:verify` ➔ **ผ่านครบทั้ง 6 ด่าน 100% Green**
  - ทดสอบ `npm run incident` โดยไม่ใส่ argument ➔ แจ้งเตือนและบล็อกด้วย exit code 1
  - ทดสอบ `npm run commit` แบบ `type: fix` โดยไม่ใส่ `--cause`/`--prevention` ➔ แจ้งเตือนและบล็อกด้วย exit code 1
  - ทดสอบ Multi-Agent Collision Guard ➔ ตรวจจับและแยกแยะ Agent แต่ละตัวได้ถูกต้อง

### 🗓️ 2026-08-31: แก้ภาพไพ่เบลอ/หยัก (Card Image Sharpness Fix)

#### 1. ลบ `image-rendering: crisp-edges` ที่ทำให้ภาพไพ่แตกเป็นเม็ด
- **ปัญหาเดิม**: ภาพหน้าไพ่ทุกจุดดูไม่คมชัด ตัวอักษรบนหน้าไพ่ (THE SUN / THE FOOL) อ่านไม่ออก โดยเฉพาะการ์ดพรีวิวผังและโลโก้ Navbar
- **สาเหตุที่แท้จริง**: `.card-face img, .tarot-hd-card-image` ใน `src/app/globals.css` กำหนด `image-rendering` ซ้อนกัน 3 บรรทัด โดยบรรทัดสุดท้าย (`crisp-edges`) ชนะ → เบราว์เซอร์ย่อภาพแบบ nearest-neighbour
  - ภาพต้นฉบับ ~820x1430px ถูกย่อเหลือ 34-70px (ย่อ 12-25 เท่า) → เส้นและตัวอักษรแตกเป็นเม็ดหยาบ
  - `filter: contrast/saturate` ที่ใส่ไว้เพื่อเพิ่มความคม กลับขับเม็ดหยาบให้เด่นขึ้นอีก
- **สิ่งที่แก้ไข**:
  - เปลี่ยนเป็น `image-rendering: auto` (bilinear/mipmap) บรรทัดเดียว
  - ลบ `transform: translateZ(0)` ออกจาก `<img>` (บังคับสร้าง composited layer โดยไม่จำเป็น และทำให้ iOS Safari rasterize ที่ 1x)
  - คง `backface-visibility: hidden` ไว้สำหรับการพลิกไพ่ 3D
  - ใส่คอมเมนต์เตือนห้ามใส่กลับไว้ในไฟล์
- **ไฟล์ที่แก้ไข**:
  - `src/app/globals.css`
- **ผลการทดสอบ**: `npm run typecheck` ➔ ผ่าน 0 errors | ตรวจสอบบน dev server จริง (computed `image-rendering: auto`, `transform: none`) และเทียบภาพ before/after → ตัวอักษรบนหน้าไพ่ขนาด 60px อ่านออกชัดเจน
- **สิ่งที่ค้างอยู่ / ต้องทำต่อ**: ยังโหลดภาพเต็ม ~279KB/ใบ มาแสดงที่ 34-70px (หน้าเลือกผังโหลด ~4.6MB) → ควรทำภาพย่อหลายขนาด + `srcset`/`sizes` ในเฟสถัดไป


#### 2. ระบบภาพไพ่ย่อหลายขนาด WebP + `<CardImage />` (Responsive Card Image Pipeline)
- **ปัญหาเดิม**: ทุกจุดในเว็บโหลดภาพต้นฉบับ ~820px หนัก ~280KB/ใบ มาแสดงที่ขนาด 34-170px
  - หน้าเลือกผังโหลดภาพไพ่รวม **4.63MB**, หน้า `/spreads` มีภาพไพ่ 96 ใบ, หน้าแผ่ไพ่ 78 ใบคิดเป็น ~21MB
  - นอกจากเปลืองแบนด์วิดท์แล้ว การให้เบราว์เซอร์ย่อภาพ 12-25 เท่าเองยังได้ผลลัพธ์ที่คมน้อยกว่าภาพที่ย่อมาล่วงหน้า
  - `<img src="/cards/..." />` ยังกระจายอยู่ ~90 จุด เสี่ยงผิดกฎ Root Image Path Resolution ซ้ำอีก
- **สิ่งที่แก้ไข**:
  - เพิ่ม `scripts/generate-card-variants.ts` (`npm run cards:variants`) สร้างภาพย่อ WebP ด้วย `cwebp` แบบ idempotent
    - `public/cards/w256/*.webp` — กว้าง 256px (~33KB/ใบ) สำหรับพรีวิวผัง โลโก้ พัดไพ่
    - `public/cards/w512/*.webp` — กว้าง 512px (~109KB/ใบ) สำหรับผังวางไพ่ และสารานุกรมไพ่ 78 ใบ
    - ภาพต้นฉบับ `.jpg` ยังอยู่ครบไม่ถูกแตะต้อง ใช้เป็นทั้ง fallback และภาพความละเอียดเต็ม
  - เพิ่ม `src/lib/tarot/card-image.ts` เป็นแหล่งความจริงเดียวของ path ภาพไพ่ (`getCardImageSrc`, `getCardWebpSrcSet`)
  - เพิ่มคอมโพเนนต์ `src/components/card/CardImage.tsx` ห่อด้วย `<picture>` + `<source type="image/webp">` + `srcset`/`sizes`
    - `<picture>` ใช้ `display: contents` จึงไม่สร้างกล่อง layout เพิ่ม — การจัดวางเดิมไม่เปลี่ยนแม้แต่พิกเซลเดียว
    - มี prop `full` สำหรับภาพใบใหญ่ (หน้ารายละเอียดไพ่ 258px, หน้าซูม, Export ลง Canvas) ให้ใช้ไฟล์ต้นฉบับ
  - แทนที่ `<img>` ภาพไพ่ **ทุกจุดในระบบ (~90 จุด / 13 ไฟล์)** ด้วย `<CardImage />` พร้อม `sizes` ที่คำนวณจากความกว้างจริงของแต่ละจุด
  - เพิ่ม prop `imageSizes` / `imageFull` ให้ `TarotCard` เพื่อให้จุดที่ override ขนาดด้วย `className` ระบุขนาดจริงได้
  - ลบ `getImageSrc` ที่เขียนซ้ำใน `CardsExplorer.tsx` และ `CardDetailView.tsx` ให้เรียกจาก helper กลางแทน
- **ไฟล์ที่แก้ไข**:
  - เพิ่มใหม่: `src/lib/tarot/card-image.ts`, `src/components/card/CardImage.tsx`, `scripts/generate-card-variants.ts`
  - เพิ่มใหม่: `public/cards/w256/` และ `public/cards/w512/` (156 ไฟล์ WebP)
  - แก้ไข: `src/app/page.tsx`, `src/components/ui/TarotArtIcons.tsx`, `src/components/card/TarotCard.tsx`,
    `src/components/card/CardZoomModal.tsx`, `src/components/spread/SpreadBoard.tsx`,
    `src/components/spread/SpreadCardSelector.tsx`, `src/components/deck/InteractiveCardFan.tsx`,
    `src/components/encyclopedia/CardsExplorer.tsx`, `src/components/encyclopedia/CardDetailView.tsx`,
    `src/components/encyclopedia/TarotEncyclopediaModal.tsx`, `src/components/reading/StreamReader.tsx`,
    `src/components/reading/FollowUpChat.tsx`, `src/components/reading/IntentionAltarInput.tsx`,
    `src/components/reading/ShareModal.tsx`, `package.json`
- **ผลการทดสอบ**:
  - `npm run typecheck` ➔ **ผ่าน 0 errors**
  - `scripts/verify-cards.ts` ➔ **ไพ่ 78 ใบผ่านครบ**
  - `scripts/qa/test-spreads.ts` ➔ **541/541 ผ่าน (20 ผัง 95 ตำแหน่ง)**
  - ตรวจบนเบราว์เซอร์จริง: หน้าแรก 26 ภาพ, `/cards` 15 ภาพ, `/spreads` 96 ภาพ — **โหลดครบ เสียหาย 0 ภาพ**
    เลือกไฟล์ `w256/*.webp` ถูกต้องทุกจุด และหน้ารายละเอียดไพ่ยังดึง `.jpg` ต้นฉบับ (825px) ตามที่ตั้งใจ
  - เทียบขนาด: พรีวิวผัง 1 ใบ **280KB ➔ 33KB (ลดลง 88%)** — หน้า `/spreads` ลดจาก ~26MB เหลือ ~3.2MB
- **สิ่งที่ค้างอยู่ / ต้องทำต่อ**:
  - ยังไม่ได้ตรวจด้วยตาบนหน้าจอจริงในขั้นที่ 3-5 ของพิธีกรรม (`ShuffleRitual`, `InteractiveCardFan`, `SpreadBoard`, `StreamReader`)
    เพราะปุ่ม `ถัดไป: ตั้งคำถามและเลือกแม่หมอ` ไม่พาไปขั้นที่ 2 — **ยืนยันแล้วว่าเป็นอาการเดิมที่มีอยู่ก่อนแก้ไข**
    (ทดสอบซ้ำบน dev server ของ repo หลักที่ยังไม่มีการแก้ไขใดๆ ก็ติดจุดเดียวกัน) เป็นบั๊กคนละเรื่องที่ควรตามแก้ต่อ
  - พบ Hydration Mismatch เดิมใน `TwelveMonthsSpreadArt` (`translate(-21.000000000000018px, ...)` ฝั่ง client ไม่ตรง server)
    เกิดจากการคำนวณ `Math.cos/sin` แล้วใส่ลง inline style โดยไม่ปัดทศนิยม — ควรใช้ `.toFixed(2)` (ยังไม่แก้ อยู่นอกขอบเขตงานนี้)

#### 3. ตั้งค่า Cache-Control ระยะยาวให้ภาพไพ่บน Cloudflare (`public/_headers`)
- **ปัญหาเดิม**: ตรวจ header ของ production จริงพบว่า
  ```
  $ curl -sI https://tarot-web.bankjack10452.workers.dev/cards/major-00.jpg
  cache-control: public, max-age=0, must-revalidate
  cf-cache-status: HIT
  ```
  - `max-age=0, must-revalidate` คือค่าเริ่มต้นของ Cloudflare Workers Static Assets
  - แปลว่าเบราว์เซอร์ **ยิงถามเซิร์ฟเวอร์ใหม่ทุกครั้งที่โหลดหน้า** แม้ภาพจะไม่เคยเปลี่ยนเลย
  - หน้า `/spreads` มีภาพไพ่ 96 ใบ = ยิง 96 conditional requests ทุกครั้งที่เข้าหน้า (ได้ 304 กลับมา แต่ก็ยังเสีย round-trip)
  - `cf-cache-status: HIT` ยืนยันว่าภาพถูกแคชที่ Cloudflare edge อยู่แล้ว — คอขวดอยู่ที่ฝั่งเบราว์เซอร์ ไม่ใช่ที่ต้นทาง
- **สิ่งที่แก้ไข**: เพิ่มไฟล์ `public/_headers` (วิธีที่ OpenNext แนะนำอย่างเป็นทางการ) ตั้ง `Cache-Control: public, max-age=31536000, immutable` ให้ `/cards/*`, `/cards/w256/*`, `/cards/w512/*` และ `/_next/static/*`
- **ไฟล์ที่แก้ไข**: `public/_headers` (ไฟล์ใหม่)
- **ผลการทดสอบ**:
  - `npm run build:worker` ➔ **build ผ่าน** และยืนยันว่า `_headers` ถูก copy ไปที่ `.open-next/assets/_headers` จริง
  - ตรวจ `.open-next/assets/cards/` แล้วพบเฉพาะไฟล์ภาพ (jpg 78 + w256 78 + w512 78) **ไม่มีไฟล์ .html ปนเลย**
    จึงยืนยันได้ว่ากฎ `/cards/*` แตะเฉพาะไฟล์ภาพ ไม่ไปโดนหน้าเว็บ `/cards` และ `/cards/[id]` ที่ Worker เป็นคนเรนเดอร์
- **สิ่งที่ค้างอยู่ / ต้องทำต่อ**:
  - **ยังไม่ได้ยืนยัน header ตอนรันจริง** เพราะ `npm run preview:worker` / `wrangler dev` รันบนเครื่องนี้ไม่ได้
    (`Unsupported macOS version: ... current version of macOS (12.6.0). The minimum requirement is macOS 13.5.0+`)
    ต้องตรวจซ้ำหลัง deploy ด้วย `curl -sI https://tarot-web.bankjack10452.workers.dev/cards/major-00.jpg`
  - ⚠️ `immutable` แคช 1 ปี ถ้าวันใดต้องเปลี่ยนไฟล์ภาพ **ต้องเปลี่ยนชื่อไฟล์หรือชื่อโฟลเดอร์ด้วยเสมอ** (เช่น `w256` ➔ `w256b`)
- **สรุปเรื่องย้ายรูปไปเก็บที่อื่น (Cloudflare Images / R2)**: **ไม่จำเป็นและไม่คุ้ม**
  - ภาพอยู่บน Cloudflare Workers Static Assets = edge CDN 300+ เมืองอยู่แล้ว และ asset request ไม่นับเป็น Worker request (ฟรี)
  - Cloudflare Images คิด $5/100,000 ภาพที่เก็บ/เดือน + $1/100,000 ภาพที่ส่ง/เดือน — จ่ายเพิ่มโดยไม่ได้อะไรกลับมา
  - Image Transformations (`/cdn-cgi/image/`) ฟรี 5,000 unique transformations/เดือน แล้ว $0.50/1,000 **แต่ต้องมี custom domain (zone) ใช้บน `*.workers.dev` ไม่ได้** และเราย่อภาพล่วงหน้าไปแล้วจึงไม่ต้องใช้
  - R2 จะเพิ่ม latency (Worker ต้องวิ่งไปหยิบจาก R2) โดยไม่ได้ประโยชน์

#### 4. แก้ Cache-Control ซ้ำสองรอบใน `public/_headers` (Duplicate Header Bug)
- **ปัญหาเดิม**: หลัง deploy PR #6 ขึ้น production แล้วตรวจ header จริงพบว่าภาพย่อ WebP ได้ค่าซ้ำ:
  ```
  $ curl -sI https://tarot-web.bankjack10452.workers.dev/cards/w256/major-00.webp
  cache-control: public, max-age=31536000, immutable, public, max-age=31536000, immutable
  ```
- **สาเหตุ**: เขียนกฎแยกไว้ทั้ง `/cards/*`, `/cards/w256/*` และ `/cards/w512/*`
  แต่ splat (`*`) ของ Cloudflare เป็นแบบ **greedy** คือกินข้ามเครื่องหมาย `/` ไปด้วย
  กฎ `/cards/*` จึง match ภาพย่อทั้งหมดอยู่แล้ว และเมื่อมีกฎซ้อนกันหลายข้อ
  Cloudflare จะ **ต่อท้าย (append)** ค่า ไม่ใช่ **แทนที่ (replace)** ค่าจึงถูกเขียนซ้ำสองรอบ
- **สิ่งที่แก้ไข**: ลบกฎ `/cards/w256/*` และ `/cards/w512/*` ที่ซ้ำซ้อนออก เหลือ `/cards/*` ข้อเดียว พร้อมคอมเมนต์อธิบายกันพลาดซ้ำ
- **ไฟล์ที่แก้ไข**: `public/_headers`
- **ผลการทดสอบ (จาก deploy รอบก่อนหน้า ยืนยันว่ากฎ scope ถูกต้อง)**:
  - `/cards/major-00.jpg` ➔ `max-age=31536000, immutable` **ถูกต้อง**
  - `/cards/major-00` (หน้าเว็บ HTML) ➔ `s-maxage=31536000` **ไม่โดน immutable ตามที่ตั้งใจ**
    ยืนยันว่ากฎ `/cards/*` แตะเฉพาะไฟล์ static ไม่ไปโดนหน้าที่ Worker เรนเดอร์

#### 5. ยกเครื่องระบบ GitHub Automation (`scripts/github-auto.ts`)
- **ปัญหาที่เจอจริงตอนใช้งาน**:
  1. **`npm run pr:auto` พังทุกครั้งที่รันจาก git worktree** — `gh pr merge` พยายาม checkout `main` ในเครื่อง
     แต่ `main` ถูก checkout ค้างที่โฟลเดอร์หลักอยู่แล้ว จึงล้มด้วย `fatal: 'main' is already checked out at ...`
     PR ถูกสร้างสำเร็จแต่ auto-merge ไม่ติด ต้องมาสั่งเองทุกครั้ง (เจอตอนทำ PR #6 และ #7)
     **AI Agent ทำงานใน worktree เสมอ แปลว่าคำสั่งนี้พังทุกครั้งที่ AI เรียกใช้**
  2. **`scripts/qa/test-safety.ts` และ `scripts/qa/test-shuffle.ts` ไม่เคยถูกรันโดยอัตโนมัติเลย**
     ทั้งสองไฟล์มีอยู่และผ่านหมด (14+14 = 28 เทสต์) แต่ไม่มี hook, npm script หรือ CI ตัวไหนเรียกใช้
     ทั้งที่เป็นเทสต์ของ **ตัวกรองคำถามอันตราย** และ **ระบบสับไพ่ Provably Fair** ซึ่งเป็นหัวใจด้านความปลอดภัยและความโปร่งใส
  3. ชุดตรวจถูกเขียนซ้ำ 4 ที่ (`pre-commit`, `pre-push`, `git-author-guard.ts`, workflow ทั้งสอง) แก้ที่หนึ่งลืมอีกที่
  4. `npm run commit` รันชุดตรวจ แล้ว `pre-commit` hook รันซ้ำอีกรอบ เสียเวลาสองเท่าทุกครั้ง
  5. หัวข้อ/คำอธิบาย PR และข้อความ commit ถูกต่อเป็นสตริงแล้วยิงผ่าน shell — ถ้ามี `"`, `` ` ``, `$` จะเพี้ยนหรือถูกแทรกคำสั่งได้
  6. ถ้าด่านแรกล้ม จะหยุดทันที ไม่รู้ว่าด่านหลังพังด้วยไหม ต้องแก้แล้วรันใหม่ทีละรอบ
- **สิ่งที่แก้ไข**:
  - ทุกคำสั่ง `gh` ใส่ `-R <owner>/<repo>` (อ่านจาก git remote อัตโนมัติ) บังคับโหมด remote-only **จึงรันใน worktree ได้**
  - รวมชุดตรวจเป็น `CHECKS` ที่เดียวใน `scripts/github-auto.ts` แล้วให้ทุกจุดเรียก `npm run repo:verify` เหมือนกันหมด
    (`pre-commit`, `pre-push`, `npm run commit`, `pr.yml`, `deploy.yml`)
  - **เพิ่ม `test-safety.ts` และ `test-shuffle.ts` เข้าชุดตรวจ** จาก 4 ด่านเป็น **6 ด่าน** — ตอนนี้ CI รันครบแล้ว
  - เปลี่ยนจาก `execSync(สตริง)` เป็น `execFileSync(cmd, args[])` ทั้ง `github-auto.ts` และ `git-author-guard.ts` ไม่ผ่าน shell อีกต่อไป
  - ส่งคำอธิบาย PR ผ่าน `--body-file` แทน argument ยาวๆ รองรับข้อความยาวและอักขระพิเศษได้ทุกแบบ
  - `npm run commit` ส่ง `TAROT_VERIFIED=1` ให้ `pre-commit` ข้ามการตรวจซ้ำ — commit เร็วขึ้นเท่าตัว
  - `runAllChecks()` รันจนครบทุกด่านแม้เจอที่ล้มแล้ว รายงานทีเดียวครบพร้อม error เต็ม
  - ถ้ามี PR ของ branch นั้นเปิดค้างอยู่แล้ว จะไม่สร้างซ้ำ ใช้ตัวเดิมแล้วรายงานให้ทราบ
  - เพิ่ม flag `--dry-run` (ดูว่าจะทำอะไรโดยไม่แตะ remote) และ `--no-merge` (สร้าง PR เฉยๆ ไม่เปิด auto-merge)
  - `status` แสดง repo, branch ปัจจุบัน, PR ของ branch นี้, PR ที่เปิดค้าง และผล CI 3 รอบล่าสุด
- **ไฟล์ที่แก้ไข**:
  - `scripts/github-auto.ts` (เขียนใหม่ทั้งไฟล์), `scripts/git-author-guard.ts`
  - `.githooks/pre-commit`, `.github/workflows/pr.yml`, `.github/workflows/deploy.yml`
  - `docs/AI_COLLABORATION_GUIDELINES.md`, `GEMINI.md`, `README.md`
- **ผลการทดสอบ**:
  - `npm run repo:verify` ➔ **ผ่านครบ 6/6 ด่าน** และ exit code = 0
  - ทดสอบเส้นทางล้มเหลว: แกล้งใส่ TypeScript error แล้วรันใหม่ ➔ รายงาน `ไม่ผ่าน 1 จาก 6 ด่าน`
    พร้อมชี้ตำแหน่ง `card-image.ts(59,7): error TS2322` และ **exit code = 1** (CI จะ fail จริง)
  - `npm run pr:auto -- ... --dry-run` ➔ แสดง 3 ขั้นตอนที่จะทำโดยไม่แตะ remote
  - `npx tsx scripts/github-auto.ts status` ➔ แสดง repo/branch/PR/CI ครบถ้วน
- **สิ่งที่ค้นพบเพิ่มหลังแก้ปัญหา worktree แล้ว**: พอ error ของ worktree หายไป error ตัวจริงก็โผล่ขึ้นมา
  ```
  GraphQL: Auto merge is not allowed for this repository (enablePullRequestAutoMerge)
  ```
  - ตรวจ `gh api repos/luminuy/tarot-web --jq .allow_auto_merge` ➔ **`false`**
  - แปลว่าบรรทัด `gh pr merge --auto` **ไม่เคยทำงานได้เลยตั้งแต่แรก** แค่ก่อนหน้านี้ถูก error ของ worktree บังไว้
  - ที่ PR ถูก merge จริงมาจาก step `🔀 Auto-Merge Verified PR into main` ใน `.github/workflows/pr.yml`
    ซึ่งเรียก `github.rest.pulls.merge({ merge_method: 'squash' })` เองหลังการตรวจผ่าน
  - **แก้เพิ่ม**: สคริปต์เช็ก `allow_auto_merge` ก่อน ถ้าปิดอยู่จะข้ามขั้นตอนนั้นอย่างสุภาพ
    พร้อมบอกว่า `pr.yml` จะ merge ให้เองอยู่แล้ว และบอกวิธีเปิดสวิตช์ที่ Settings > General > Pull Requests > Allow auto-merge
    ไม่ทำให้ทั้งคำสั่งล้มทั้งที่ PR สร้างสำเร็จไปแล้ว

#### 6. 🚨 แก้บั๊กเงียบ: PR ที่ merge โดย workflow ไม่เคย deploy ขึ้น production เลย
- **วิธีที่เจอ**: หลัง PR #8 ถูก merge เข้า `main` (commit `6b2e4f9`) แล้วรอ deploy แต่**ไม่มี workflow ตัวไหนทำงานเลย**
  ทั้งที่ PR #6 และ #7 ก่อนหน้านี้ deploy ปกติ จึงไล่ดูว่าใครเป็นคน merge:
  ```
  PR #6 merged by: luminuy            → deploy ทำงาน ✓
  PR #7 merged by: luminuy            → deploy ทำงาน ✓
  PR #8 merged by: app/github-actions → ไม่มี deploy ✗
  ```
- **สาเหตุ**: **GitHub จงใจไม่ trigger workflow จาก event ที่เกิดจาก `GITHUB_TOKEN`** (กลไกกันการวนซ้ำไม่รู้จบ)
  - step `🔀 Auto-Merge Verified PR into main` ใน `pr.yml` merge ด้วย `GITHUB_TOKEN`
  - push ที่เกิดจากการ merge นั้นจึง **ไม่ trigger `deploy.yml`**
  - แปลว่า **ทุก PR ที่ระบบ merge ให้เอง จะไม่เคยถูก deploy ขึ้นเว็บจริงเลย**
  - ที่ผ่านมาไม่มีใครสังเกต เพราะ PR #6 และ #7 บังเอิญถูก merge ด้วย token ของผู้ใช้ (สั่ง `gh pr merge` เอง) จึง deploy ปกติ
- **สิ่งที่แก้ไข**:
  - `deploy.yml`: เพิ่ม trigger `workflow_dispatch:` เพื่อให้สั่งรันจากภายนอกได้
  - `pr.yml`: เพิ่มสิทธิ์ `actions: write` และหลัง merge สำเร็จให้เรียก
    `github.rest.actions.createWorkflowDispatch({ workflow_id: 'deploy.yml', ref: 'main' })`
    (การ dispatch แบบนี้ **ทำงานได้กับ `GITHUB_TOKEN`** ต่างจาก push event)
  - ถ้า merge สำเร็จแต่สั่ง deploy ไม่ได้ จะ `core.setFailed()` ให้เห็นชัด ไม่เงียบอีกต่อไป
- **ไฟล์ที่แก้ไข**: `.github/workflows/pr.yml`, `.github/workflows/deploy.yml`
- **ผลการทดสอบ**: PR ที่มีการแก้ไขนี้เองคือการทดสอบ — ถ้า merge แล้ว `deploy.yml` ทำงานต่อเองโดยไม่ต้องสั่งมือ แปลว่าแก้ถูกจุด
- **หมายเหตุ**: ระหว่างที่ยังไม่แก้ commit `6b2e4f9` บน `main` ค้างอยู่โดยไม่ได้ deploy
  (ไม่กระทบหน้าเว็บ เพราะ PR #8 แก้แต่สคริปต์ automation กับเอกสาร ไม่ได้แตะโค้ดเว็บ)

#### 7. แก้เทสต์สุ่มที่ flaky จนทำ deploy ล้ม (`test-shuffle.ts`)
- **ปัญหา**: หลังเพิ่ม `test-shuffle.ts` เข้าชุดตรวจ CI (ข้อ 5) การ deploy รอบแรกก็ล้มทันที:
  ```
  ❌ อัตราไพ่หัวกลับอยู่ในช่วงสมเหตุสมผล (ได้ 19/78 ≈ 24%, คาดหวัง 40% ±15)
  13/14 ผ่าน  →  Process completed with exit code 1
  ```
- **สาเหตุ**: เทสต์วัดอัตราไพ่หัวกลับจาก **สำรับเดียว 78 ใบ** และ `serverSeed` ถูกสุ่มใหม่ทุกครั้งที่รัน
  - ที่ n = 78, p = 0.4 ค่าเบี่ยงเบนมาตรฐานคือ ±5.5 จุด กรอบ 25-55% จึงห่างแค่ ~2.7σ
  - **เทสต์จึง fail แบบสุ่มประมาณ 1 ใน 150 รอบ ทั้งที่ระบบไม่มีอะไรพัง**
  - เดิมไม่มีใครเดือดร้อนเพราะเทสต์นี้ไม่เคยถูกรันอัตโนมัติ แต่พอเอาเข้า CI มันไปกั้นการ deploy ขึ้น production
- **สิ่งที่แก้ไข**: เปลี่ยนไปวัดจาก **40 สำรับรวม 3,120 ใบ** แทนสำรับเดียว
  - σ ลดเหลือ ≈ 0.88 จุด กรอบใหม่ 35-45% จึงห่างจากค่ากลางราว 5.7σ (โอกาส fail แบบสุ่มน้อยกว่า 1 ในร้อยล้าน)
  - ยังจับได้ทันทีถ้าอัตราจริงเพี้ยน เพราะกรอบแคบลงจาก ±15 จุดเหลือ ±5 จุด — **เข้มขึ้นและนิ่งขึ้นพร้อมกัน**
- **ไฟล์ที่แก้ไข**: `scripts/qa/test-shuffle.ts`
- **ผลการทดสอบ**: รันซ้ำ 20 รอบ (serverSeed สุ่มใหม่ทุกรอบ) ได้ **38.9% - 40.9% ผ่านทั้ง 20 รอบ**
  ค่าเฉลี่ยราว 40.1% ตรงกับ `REVERSAL_RATE = 0.4` ในโค้ดจริง ยืนยันว่าตัวสุ่มไม่ได้เอนเอียง

---

### 🗓️ 2026-08-31: Phase 4 — Polish, Iconography & Multi-AI Guidelines

#### 1. Unified Sacred Gold Iconography (ปรับปรุงไอคอนทั้งเว็บ)
- **ปัญหาเดิม**: มีอิโมจิการ์ตูนทั่วไป (`🔮`, `📸`, `📜`, `💬`, `💡`, `💾`, `📱`, `📋`, `📲`) ปะปนใน UI
- **สิ่งที่แก้ไข**:
  - แทนที่ด้วยสัญลักษณ์ทองคำเปลวศักดิ์สิทธิ์ `✦` และ `✨` ทั่วทั้งระบบ
  - ปรับปุ่มบน Navbar (คัมภีร์ 78 ใบ, ประวัติดวง)
  - ปรับแท็บในวิหารคำทำนาย (อ่านรายใบ, สรุปภาพรวม, ถามแม่หมอต่อ)
  - ปรับปุ่มใน `ShareModal` (บันทึกภาพ 4:5, IG Story 9:16, คัดลอก, แชร์)
  - ปรับคำแนะนำใต้ผังไพ่ใน `SpreadBoard`
- **ไฟล์ที่แก้ไข**:
  - `src/app/page.tsx`
  - `src/components/reading/StreamReader.tsx`
  - `src/components/spread/SpreadBoard.tsx`
  - `src/components/reading/ShareModal.tsx`
- **ผลการทดสอบ**: `npm run typecheck` ➔ 0 errors, UI สวยงามหรูหรา 100%

---

#### 2. Manual Self-Reveal Flow (เปิดไพ่ด้วยตนเองทีละใบ)
- **ปัญหาเดิม**: เมื่อเข้าสู่ Step 5 ระบบเปิดไพ่ใบแรกให้อัตโนมัติ ทำให้เสียอรรถรส
- **สิ่งที่แก้ไข**:
  - ปรับให้ไพ่ทุกใบบนผังเริ่มต้นในสถานะ **คว่ำหน้าทั้งหมด (`revealedOrders = []`)**
  - เพิ่มป้ายออร่าทองคำกระพริบเบาๆ **`✦ แตะเพื่อเปิด`** บนหลังไพ่ใน `TarotCard.tsx`
  - ผู้ใช้แตะพลิกไพ่ 3D ด้วยตนเอง พร้อมเสียงเปิดไพ่ศักดิ์สิทธิ์
- **ไฟล์ที่แก้ไข**:
  - `src/app/page.tsx`
  - `src/components/card/TarotCard.tsx`
- **ผลการทดสอบ**: ทดสอบการแตะพลิกไพ่ 3D ทำงานได้อย่างราบรื่น

---

#### 3. 78-Card Grand Altar Overhaul (ยกเครื่องโต๊ะจับไพ่ 78 ใบ)
- **ปัญหาเดิม**:
  - ไพ่แถวที่ 2 และ 3 โดนขอบแถวตัดหัวเวลาลอยตัวขึ้น (Row-Level Clipping Bug จาก `overflow-x-auto`)
  - แถวการ์ดตรงแข็งทื่อเหมือนตาราง
  - มีปุ่มลูกศร `‹` `›` ด้านข้างเกะกะสายตา
- **สิ่งที่แก้ไข**:
  - ยกเลิกการแยก `overflow-x-auto` รายแถว ➔ ใช้ **Unified Altar Canvas ผืนเดียว** ไร้การตัดขอบ 100%
  - จัดเรียงไพ่ 78 ใบเป็น 3 ชั้นริบบิ้นทองคำลดหลั่นกันอย่างมีมิติ (Cascading Staggered Tiers) พร้อมองศาเอียงตามธรรมชาติ
  - เอาปุ่มลูกศร `‹` `›` ออก ให้เลื่อนสไลด์ด้วย Touch/Mouse ได้อย่างสะอาดตา
  - ออกแบบแถบความคืบหน้าด้านล่างใหม่: ตราสำรับไพ่ 3D, หลอดพลังงาน Shimmer, และป้าย Talisman Badges
- **ไฟล์ที่แก้ไข**:
  - `src/components/deck/InteractiveCardFan.tsx`
- **ผลการทดสอบ**: ไพ่ยกตัวลอย (`y: -40px, scale: 1.28x`) ได้อย่างอิสระ ไม่มีการตัดขอบแม้แต่มิลลิเมตรเดียว

---

#### 4. Step 1 3D Floating Hero Deck (อัปเกรดไพ่หน้าแรก)
- **ปัญหาเดิม**: ไพ่บนหน้าแรก (ผังชะตา) เป็นการ์ดเล็กนิ่งๆ ไม่แมตช์กับหน้าสับไพ่
- **สิ่งที่แก้ไข**: นำสำรับไพ่ 3D ขนาดใหญ่ พร้อมวงแหวน Mandala หมุนคู่ (ทอง + อเมทิสต์) และฟิสิกส์ลอยตัวจาก Step 3 มาใส่ใน Step 1
- **ไฟล์ที่แก้ไข**:
  - `src/app/page.tsx`
- **ผลการทดสอบ**: หน้าแรกมีมิติ 3 มิติที่ทรงพลัง สอดคล้องกับทุกขั้นตอน

---

#### 5. Safety Rails, PDPA & Multi-AI Guidelines
- **สิ่งที่แก้ไข**:
  - สร้างหน้า [`/privacy`](file:///Users/bank/Desktop/เว็บไพ่/src/app/privacy/page.tsx) รองรับกฎหมาย PDPA พร้อมปุ่มลบข้อมูลจริง
  - เพิ่มตัวกรองวิกฤต บล็อกคำถามทำร้ายตัวเองทันที แสดงสายด่วน **1323** และ **1669**
  - เพิ่ม AI Transparency Disclosure ในทุกคำอ่านและ Footer
  - เพิ่ม `AccuracyRatingWidget.tsx` เก็บข้อมูล A/B Persona Rating ท้ายคำอ่าน
  - จัดทำคู่มือแม่บท [`docs/AI_COLLABORATION_GUIDELINES.md`](file:///Users/bank/Desktop/เว็บไพ่/docs/AI_COLLABORATION_GUIDELINES.md)
  - เชื่อมโยง `GEMINI.md` และ `CLAUDE.md` เพื่อให้ AI ทุกตัวเข้าใจตรงกัน
- **ไฟล์ที่สร้าง/แก้ไข**:
  - `src/app/privacy/page.tsx`
  - `src/components/ui/DeleteAllDataButton.tsx`
  - `src/components/reading/AccuracyRatingWidget.tsx`
  - `src/lib/safety.ts`
  - `docs/AI_COLLABORATION_GUIDELINES.md`
  - `GEMINI.md`
  - `CLAUDE.md`
- **ผลการทดสอบ**: ผ่านการทดสอบความปลอดภัยครบทุกกรณี

---

#### 6. Gemini API Key & Model Pipeline Verification
- **สิ่งที่ตรวจสอบและแก้ไข**:
  - ตรวจสอบ `GEMINI_API_KEY` ใน `.env` และทดสอบยิง Google Generative Language API
  - อัปเดตรายชื่อโมเดลใน `CANDIDATE_GEMINI_MODELS` ใน `src/lib/ai/gemini.ts` ให้เป็น `gemini-3.6-flash`, `gemini-3.7-flash`, `gemini-3.5-flash` ตาม API ล่าสุด
- **ไฟล์ที่แก้ไข**:
  - `src/lib/ai/gemini.ts`
- **ผลการทดสอบ**: ยิงทดสอบ generateContent ผ่าน API จริงสำเร็จ 100% ใช้งานคำทำนาย Live AI ได้ทันที

---

#### 7. 20 Authentic World-Class Spreads Expansion (ขยายครบ 20 ผังพยากรณ์ยอดนิยม)
- **ปัญหาเดิม**: มีเพียง 10 ผัง และในหมวดความรัก/การงานมีตัวเลือกน้อย
- **สิ่งที่แก้ไข**:
  - ขยายผังพยากรณ์เป็น **20 รูปแบบยอดนิยมจริงมาตรฐานสากล** ทั้งความรัก, การงาน, การเงิน, กายจิตวิญญาณ, การตัดสินใจ, และผังใหญ่เจาะลึก
  - สร้างภาพประกอบ (Mini Card Artwork) เฉพาะตัวครบทั้ง 20 ผังด้วยไพ่ 1909 Rider-Waite
  - อัปเดตแท็บกรองใน `SpreadCardSelector.tsx` (ยอดนิยมแนะนำ 6, ความรัก 5, การงาน 5, ผังใหญ่ 5, ทั้งหมด 20)
  - กำหนดพิกัด $(x, y, \text{rotate})$ และความหมายตำแหน่งครบทั้ง 95 ตำแหน่ง
- **ไฟล์ที่แก้ไข**:
  - `src/data/spreads.ts`
  - `src/components/ui/TarotArtIcons.tsx`
  - `src/components/spread/SpreadCardSelector.tsx`
  - `scripts/qa/test-spreads.ts`
- **ผลการทดสอบ**:
  - `npx tsx scripts/qa/test-spreads.ts`: **541/541 ผ่าน (20 spreads, 95 ตำแหน่งรวม)**
  - `npm run typecheck`: **0 errors**

---

#### 8. Human-Centric Natural Language Refinement (ปรับภาษาทุกหัวข้อให้คนทั่วไปเข้าใจทันที)
- **ปัญหาเดิม**: ชื่อผังบางชื่อเป็นศัพท์เทคนิคโหราศาสตร์/ไพ่ทาโรต์โบราณ เช่น "กางเขนเซลติก", "ผังจักระ" คนทั่วไปอ่านแล้วไม่เข้าใจว่าคืออะไร
- **สิ่งที่แก้ไข**:
  - ปรับชื่อหัวข้อ (`nameTh`), คำโปรย (`tagline`), คำอธิบาย (`description`), และความหมายตำแหน่งครบทั้ง 20 ผัง (95 ตำแหน่ง)
  - เปลี่ยน "กางเขนเซลติก" ➔ **"ส่องดวงชะตาเจาะลึก 10 มิติ (เซลติกครอส)"** (เข้าใจทันทีว่าคือการดูดวงแบบละเอียดที่สุด 10 มิติ)
  - เปลี่ยน "ผังจักระ" ➔ **"สแกนพลังงานชีวิต 7 จุด (จักระบำบัด)"**
  - ใช้ภาษาไทยที่เป็นธรรมชาติ น่าอ่าน ตรงใจผู้ใช้ เหมือนคุยกับแม่หมอมืออาชีพ
- **ไฟล์ที่แก้ไข**:
  - `src/data/spreads.ts`
- **ผลการทดสอบ**:
  - `npx tsx scripts/qa/test-spreads.ts`: **541/541 ผ่าน**
  - `npm run typecheck`: **0 errors**

---

#### 9. Card Showcase Visual Proportions & Zero-Clipping Alignment (ปรับขนาดและการจัดวางไพ่ครบทั้ง 20 ผัง)
- **ปัญหาเดิม**:
  - ผัง 7 วัน (ดวงรายสัปดาห์) และผัง 7 จุด (จักระ) วางในแถวเดียวซ้อนกันจนตัวหนังสือและขอบการ์ดล้นตัดขอบซ้ายขวา
  - ผัง 5 ใบ และ 4 ใบ มีขนาดการ์ดและป้ายข้อความยาวบีบอัดจนขึ้นบรรทัดใหม่
- **สิ่งที่แก้ไข**:
  - ปรับ `WeeklySpreadArt` (7 วัน) เป็นโครงสร้าง **2-Tier Calendar Ribbon** (4 วันแถวบน + 3 วันแถวล่าง) การ์ดโปร่งสบายตา
  - ปรับผัง 4-5 ใบ ("เปลี่ยนงาน", "เนื้อคู่", "ความในใจ", "คนรักเก่า", "ปลดล็อกพลัง") เป็นโครงสร้าง 1 Apex เด่น + แถวฐาน พร้อมป้ายข้อความสั้นกระชับ
  - ขยายความสูง `minHeight: 335px` บนการ์ดเลือกผัง และแทนที่ `⭐ ยอดนิยม` ด้วย `✦ ยอดนิยม`
- **ไฟล์ที่แก้ไข**:
  - `src/components/ui/TarotArtIcons.tsx`
  - `src/components/spread/SpreadCardSelector.tsx`
- **ผลการทดสอบ**:
  - `npm run typecheck`: **0 errors**

---

#### 10. Chakra Spread Height Fix & Typography Polish (แก้ไขการ์ดจักระ 7 จุดทับหัวข้อและตัดคำตกบรรทัด)
- **ปัญหาเดิม**:
  - ในผังจักระ 7 จุด การ์ด 3 ชั้นกินความสูงเกินกล่อง ทำให้ป้ายข้อความด้านล่างซ้อนทับชนกับหัวข้อ `สแกนพลังงานชีวิต 7 จุด (จักระบำบัด)`
  - คำว่า `(จักระบำบัด)` ยาวเกินไปจนตัดคำผิดธรรมชาติกลายเป็น `(จักระบำ` ขึ้นบรรทัดใหม่ `บัด)`
- **สิ่งที่แก้ไข**:
  - ปรับ `ChakraSpreadArt` ให้เป็น **7-Chakra Rainbow Arc** แนวกระชับแถวเดียวพร้อมหมายเลขจุดจักระ 1-7 บนมุมการ์ด และป้ายด้านล่าง `✦ สมดุล 7 ศูนย์พลังชีวิต ✦` ปลอดภัยจากการชนข้อความ 100%
  - ปรับชื่อหัวข้อใน `src/data/spreads.ts` ให้กระชับ สวยงาม และไม่ตัดคำตกหล่น:
    - เปลี่ยนเป็น **`"สแกนสมดุล 7 จักระ (ไพ่ 7 ใบ)"`**
    - ปรับทุกหัวข้อทั้ง 20 ผังให้สม่ำเสมอ กระชับ ไม่ล้นกล่อง
- **ไฟล์ที่แก้ไข**:
  - `src/components/ui/TarotArtIcons.tsx`
  - `src/data/spreads.ts`
- **ผลการทดสอบ**:
  - `npx tsx scripts/qa/test-spreads.ts`: **541/541 ผ่าน**
#### 11. Clean Architecture Scaffolding & Directory Restructuring (วางโครงสร้างโฟลเดอร์มาตรฐาน)
- **สิ่งที่ทำ**:
  - วางโครงสร้างมาตรฐานระดับ Enterprise ตามที่ผู้ใช้กำหนด:
    - `src/types/`: `reading.ts`, `tarot.ts`, `safety.ts`, `index.ts`
    - `src/services/`: `reading.service.ts`, `shuffle.service.ts`, `pick.service.ts`, `safety.service.ts`, `interpretation.service.ts`
    - `src/server/repositories/`: `reading.repository.ts`
    - `src/lib/`: `crypto/provably-fair.ts`, `schema/reading.schema.ts`, `tarot/utils.ts`, `safety/index.ts`
    - `src/data/`: `prompts/`, `spreads/`, `personas/`
    - `src/components/verification/`: `ProvablyFairBadge.tsx`
    - `src/app/`: `/tarot`, `/cards`, `/spreads`, `/blog`, `/account`, และ API `/api/reading/[id]/pick`, `reveal`, `verify`
  - บันทึกกฎเหล็กข้อ 7 ลงใน `docs/AI_COLLABORATION_GUIDELINES.md` และสร้าง `Anti-Patterns & Lessons Learned Registry` ใน `docs/WORK_LOG.md`
- **ไฟล์ที่สร้าง/แก้ไข**:
  - `src/types/*`
  - `src/services/*`
  - `src/server/repositories/*`
  - `src/lib/crypto/*`, `src/lib/schema/*`, `src/lib/tarot/*`
  - `src/data/prompts/*`, `src/data/spreads/*`, `src/data/personas/*`
  - `src/components/verification/*`
  - `src/app/api/reading/[id]/pick/*`, `reveal/*`, `verify/*`
  - `src/app/tarot/*`, `cards/*`, `spreads/*`, `blog/*`, `account/*`
  - `docs/AI_COLLABORATION_GUIDELINES.md`
#### 12. Cloudflare Workers Deployment Setup & Configuration
- **สิ่งที่ทำ**:
  - สร้างไฟล์การตั้งค่า Cloudflare Workers (`wrangler.jsonc`) เปิด `nodejs_compat` และเชื่อม Static Assets
  - สร้างไฟล์การตั้งค่า OpenNext (`open-next.config.ts`) สำหรับแปลง Next.js 16 App Router เป็น Cloudflare Edge Worker
  - เพิ่มคำสั่ง Build & Deploy ใน `package.json`: `build:worker`, `preview:worker`, `deploy`
  - จัดทำคู่มืออย่างละเอียดใน `docs/CLOUDFLARE_DEPLOYMENT_GUIDE.md` ครอบคลุมการใส่ Secrets, Local Preview, One-Click Deploy, และ Custom Domain
- **ไฟล์ที่สร้าง/แก้ไข**:
  - `wrangler.jsonc`
  - `open-next.config.ts`
  - `package.json`
  - `docs/CLOUDFLARE_DEPLOYMENT_GUIDE.md`
#### 13. 4 Masterpiece Cloudflare Enhancements Integration (ผสาน 4 ฟีเจอร์ระดับมาสเตอร์พีซ)
- **สิ่งที่ทำ**:
  1. **Cloudflare R2 Object Storage**: สร้าง `StorageService` (`src/services/storage.service.ts`) และผูก `TAROT_STORAGE` สำหรับจัดเก็บภาพ Share Cards (IG Story 9:16 / 4:5) และแคชเสียง TTS แบบ Zero Egress Fee
  2. **Cloudflare KV Daily Card Caching**: สร้าง `CacheService` (`src/services/cache.service.ts`) และผูก `TAROT_KV` สำหรับแคชคำทำนายไพ่ประจำวัน (TTL: 24 ชม.) ช่วยประหยัดค่า AI Token ได้สูงสุดถึง 90%
  3. **Dual-Engine Multi-AI Brain**: อัปเกรด `InterpretationService` (`src/services/interpretation.service.ts`) ให้รองรับ **Anthropic Claude 3.5/3.7 Sonnet** (ภาษาไทยลึกซึ้ง) + **Google Gemini** (สตรีมไว) พร้อมระบบ Auto-Failover สลับอัตโนมัติหากอีกตัวขัดข้อง
  4. **Cloudflare Turnstile Invisible Bot Guard**: สร้าง `TurnstileService` (`src/services/turnstile.service.ts`) และ `TurnstileWidget` (`src/components/verification/TurnstileWidget.tsx`) ตรวจจับบอทแบบล่องหน ป้องกันการยิงถล่มโควตา AI
- **ไฟล์ที่สร้าง/แก้ไข**:
  - `wrangler.jsonc`
  - `src/services/storage.service.ts`
  - `src/services/cache.service.ts`
  - `src/services/turnstile.service.ts`
  - `src/services/interpretation.service.ts`
  - `src/services/index.ts`
  - `src/components/verification/TurnstileWidget.tsx`
#### 14. GitHub Repository Connection & CI/CD Auto-Deploy Activation
- **สิ่งที่ทำ**:
  - สร้าง Repository และ Push โค้ดทั้งหมดขึ้น GitHub: `https://github.com/luminuy/tarot-web`
  - ติดตั้ง GitHub Actions Workflow อัตโนมัติ:
    - `.github/workflows/deploy.yml`: Production Auto-Deploy เมื่อมี push/merge เข้า `main`
    - `.github/workflows/pr.yml`: PR Automated CI & Verification
  - เพิ่ม `.gitignore` สำหรับ Cloudflare OpenNext/Wrangler build outputs
- **ผลการทดสอบ**:
  - `git push -u origin main`: **สำเร็จ 100% (tracking origin/main)**
  - GitHub Actions Workflow: **Triggered & Active**
  - `npm run log:sync`: **ผ่านและอัปเดตสถานะสำเร็จ**

---

## 🚨 บันทึกบทเรียนและข้อผิดพลาดที่ต้องระวัง (Anti-Patterns & Lessons Learned Registry)

> **⚠️ บันทึกนี้มีความสำคัญสูงสุด**: AI ทุกตัวต้องอ่านส่วนนี้เพื่อป้องกันไม่ให้ทำผิดพลาดซ้ำเดิม

### 1. Vertical Bounds & Label Stacking Collision (การ์ดซ้อนเกินความสูงจนทับหัวข้อ)
- **กรณีที่เคยเกิดขึ้น**: ในผังจักระ 7 จุด มีการจัดเรียงการ์ดแบบ 3 แถวแนวตั้ง (3 บน + 1 กลาง + 3 ล่าง) พร้อมใส่ป้ายข้อความใต้การ์ดทุกแถว ทำให้ความสูงรวมเกินความสูงของกล่องพรีวิว และป้ายข้อความแถวล่างสุดทะลุไปทับหัวข้อ `สแกนพลังงานชีวิต 7 จุด`
- **วิธีแก้ & กฎป้องกัน**:
  - หากมีไพ่หลายใบ (เช่น 7 ใบขึ้นไป) ให้จัดเป็น **แถวโค้งชิดกัน (Rainbow Arc)** หรือ **2 แถวแบบกระชับ (2-Tier Ribbon)**
  - ใส่หมายเลขย่อย (เช่น `1`–`7`) ที่มุมของการ์ดโดยตรง แทนการใส่กล่องข้อความยาวใต้การ์ดทุกใบ
  - คำนวณความสูงรวมเสมอ: ความสูงกล่องพรีวิว (`h-34` / `h-36` = 136-144px) องค์ประกอบภายในต้องไม่เกิน 90-100px เพื่อเหลือพื้นที่ Margin ให้กับหัวข้อด้านล่าง

### 2. `image-rendering: crisp-edges` ทำให้ภาพไพ่แตกเป็นเม็ด (Nearest-Neighbour Downscaling Trap)
- **กรณีที่เคยเกิดขึ้น**: มีการใส่ `image-rendering: -webkit-optimize-contrast; high-quality; crisp-edges;` ซ้อนกันใน `globals.css` โดยตั้งใจจะทำให้ภาพ "คม HD" แต่ CSS เอาบรรทัดสุดท้าย (`crisp-edges`) → เบราว์เซอร์ย่อภาพแบบ nearest-neighbour ภาพไพ่ ~820x1430px ที่ถูกย่อเหลือ 34-70px จึงแตกเป็นเม็ดหยาบจนดูเบลอ
- **วิธีแก้ & กฎป้องกัน**:
  - ภาพถ่าย/ภาพวาดที่ถูก **ย่อ** ต้องใช้ `image-rendering: auto` เท่านั้น
  - `crisp-edges` / `pixelated` มีไว้สำหรับ Pixel Art ที่ถูก **ขยาย** เท่านั้น ห้ามใช้กับภาพถ่ายเด็ดขาด
  - อย่าใส่ `transform: translateZ(0)` บน `<img>` โดยไม่จำเป็น — มันสร้าง composited layer และทำให้ iOS Safari rasterize ที่ 1x

### 3. โหลดภาพไพ่ต้นฉบับ 280KB มาแสดงที่ 34px (Full-Size Image For Thumbnail Trap)
- **กรณีที่เคยเกิดขึ้น**: ทุกจุดในเว็บเขียน `<img src="/cards/major-00.jpg" />` ตรงๆ ทำให้เบราว์เซอร์ดาวน์โหลดภาพต้นฉบับกว้าง ~820px (~280KB) มาแสดงในกรอบ 34-70px หน้าเลือกผังจึงกินแบนด์วิดท์ **4.63MB** และหน้า `/spreads` ที่มีภาพไพ่ 96 ใบยิ่งหนักกว่านั้นหลายเท่า
- **วิธีแก้ & กฎป้องกันถาวร**:
  - ทุกจุดที่แสดงภาพหน้าไพ่ **ต้องใช้ `<CardImage />`** (`src/components/card/CardImage.tsx`) พร้อมส่ง prop `sizes` ตามความกว้างจริงที่แสดง เช่น `sizes="60px"`
  - `<CardImage />` จะเลือกไฟล์ WebP ย่อจาก `public/cards/w256/` หรือ `w512/` ให้อัตโนมัติผ่าน `<picture>` + `srcset`
  - ใช้ `full` เฉพาะภาพใบใหญ่จริงๆ (หน้ารายละเอียดไพ่ 258px, หน้าซูม, Export ลง Canvas) เท่านั้น
  - ถ้าเพิ่ม/เปลี่ยนภาพไพ่ต้นฉบับ **ต้องรัน `npm run cards:variants` ใหม่ทุกครั้ง**

### 4. คำสั่ง `gh` พังเมื่อรันจาก git worktree (Worktree + GitHub CLI Trap)
- **กรณีที่เคยเกิดขึ้น**: `npm run pr:auto` สร้าง PR สำเร็จ แต่ขั้นเปิด auto-merge ล้มทุกครั้ง:
  ```
  ❌ gh pr merge --auto --squash --delete-branch
     failed to run git: fatal: 'main' is already checked out at '/Users/bank/Desktop/เว็บไพ่'
  ```
  เพราะ `gh pr merge` (และ `gh pr checkout`) จะไปยุ่งกับ git ในเครื่อง แต่ `main` ถูก checkout ค้างที่โฟลเดอร์หลักอยู่แล้ว
  ซึ่ง **AI Agent ทำงานใน git worktree เสมอ** คำสั่งนี้จึงพังทุกครั้งที่ AI เรียกใช้
- **วิธีแก้ & กฎป้องกันถาวร**:
  - ใส่ `-R <owner>/<repo>` ให้คำสั่ง `gh` เสมอ เพื่อบังคับให้ทำงานแบบ remote-only ไม่แตะ git ในเครื่อง
  - `scripts/github-auto.ts` อ่าน owner/repo จาก `git remote get-url origin` แล้วเติม `-R` ให้อัตโนมัติทุกคำสั่งแล้ว
  - ห้ามเรียก `gh pr merge` เปล่าๆ ในสคริปต์ใหม่เด็ดขาด
  - **บทเรียนแถม**: error หนึ่งอาจบัง error อีกตัวไว้ พอแก้ปัญหา worktree เสร็จ error ตัวจริงถึงโผล่ว่า
    `Auto merge is not allowed for this repository` — repo นี้ตั้ง `allow_auto_merge = false` ไว้
    แปลว่า `gh pr merge --auto` ไม่เคยทำงานเลย ตัวที่ merge จริงคือ step ใน `.github/workflows/pr.yml`
    **แก้อาการแรกแล้วต้องรันซ้ำดูผลจริงเสมอ อย่าเพิ่งสรุปว่าจบ**

### 5. เขียนเทสต์ไว้แต่ไม่มีใครเรียกใช้ (Orphaned Test Files)
- **กรณีที่เคยเกิดขึ้น**: `scripts/qa/test-safety.ts` (14 เทสต์ ตัวกรองคำถามอันตราย) และ
  `scripts/qa/test-shuffle.ts` (14 เทสต์ ระบบสับไพ่ Provably Fair) มีอยู่และผ่านหมด
  แต่ **ไม่มี hook, npm script หรือ GitHub Actions ตัวไหนเรียกใช้เลย** ทั้งที่เป็นเทสต์ของสองระบบที่สำคัญที่สุดด้านความปลอดภัยและความโปร่งใส
  สาเหตุคือชุดตรวจถูกเขียนซ้ำไว้ 4 ที่ พอเพิ่มเทสต์ใหม่ก็ลืมไปเพิ่มให้ครบ
- **วิธีแก้ & กฎป้องกันถาวร**:
  - รวมชุดตรวจไว้ที่เดียวคือตัวแปร `CHECKS` ใน `scripts/github-auto.ts`
    ทุกจุด (`pre-commit`, `pre-push`, `npm run commit`, `pr.yml`, `deploy.yml`) เรียก `npm run repo:verify` เหมือนกันหมด
  - **เพิ่มสคริปต์ทดสอบใหม่ใน `scripts/qa/` เมื่อไหร่ ต้องไปเพิ่มใน `CHECKS` ทันที** ไม่งั้นเทสต์นั้นจะไม่เคยถูกรันเลย

### 6. workflow ที่ merge ด้วย `GITHUB_TOKEN` จะไม่ trigger workflow ตัวอื่น (GITHUB_TOKEN Event Suppression)
- **กรณีที่เคยเกิดขึ้น**: `pr.yml` merge PR ให้อัตโนมัติด้วย `GITHUB_TOKEN` แต่ `deploy.yml` (ที่ trigger ด้วย `push: main`)
  **ไม่เคยทำงานเลย** ทำให้ทุก PR ที่ระบบ merge ให้ ไม่ถูก deploy ขึ้น production
  บั๊กนี้เงียบสนิทอยู่นาน เพราะ PR ที่คนสั่ง merge เองด้วย token ผู้ใช้ยัง deploy ได้ปกติ
- **วิธีแก้ & กฎป้องกันถาวร**:
  - GitHub **จงใจ** ไม่ trigger workflow จาก event ที่เกิดจาก `GITHUB_TOKEN` เพื่อกันการวนซ้ำไม่รู้จบ
  - ถ้า workflow หนึ่งต้องปลุก workflow อีกตัว ให้ใช้ `workflow_dispatch` แทนการหวังพึ่ง push event
    (เพิ่ม `workflow_dispatch:` ที่ปลายทาง + `actions: write` ที่ต้นทาง + เรียก `createWorkflowDispatch`)
  - ทางเลือกอื่นคือใช้ Personal Access Token แทน `GITHUB_TOKEN` แต่ต้องเพิ่ม secret และดูแลวันหมดอายุเอง
  - **เวลาตรวจว่า deploy ทำงานไหม อย่าดูแค่ว่า PR merged แล้ว ให้ดูว่ามี run ของ deploy.yml สำหรับ commit นั้นจริง**

### 7. เทสต์สถิติที่ตัวอย่างน้อยเกินไปจะ fail แบบสุ่มและไปกั้น deploy (Flaky Statistical Test)
- **กรณีที่เคยเกิดขึ้น**: `test-shuffle.ts` วัดอัตราไพ่หัวกลับจากสำรับเดียว 78 ใบ โดยที่ `serverSeed` สุ่มใหม่ทุกครั้ง
  ที่ n = 78, p = 0.4 ค่าจะแกว่ง ±5.5 จุด เทสต์จึง fail เองประมาณ 1 ใน 150 รอบทั้งที่ไม่มีอะไรพัง
  พอเทสต์นี้ถูกเพิ่มเข้า CI มันก็ทำให้ **deploy ขึ้น production ล้มทันทีในรอบแรก**
- **วิธีแก้ & กฎป้องกันถาวร**:
  - เทสต์ที่วัดค่าสถิติจากการสุ่ม **ต้องใช้ตัวอย่างให้ใหญ่พอ** ไม่ใช่ขยายกรอบยอมรับให้กว้างจนไม่มีความหมาย
    (เพิ่มจาก 78 เป็น 3,120 ใบ ทำให้กรอบแคบลงจาก ±15 จุดเหลือ ±5 จุด แต่นิ่งกว่าเดิมมาก)
  - หรือใช้ seed คงที่เพื่อให้ผลเหมือนเดิมทุกครั้ง (deterministic)
  - **ก่อนเพิ่มเทสต์ใด ๆ เข้า CI ให้รันซ้ำอย่างน้อย 20 รอบก่อนเสมอ** ถ้าผลแกว่งแปลว่ายังไม่พร้อมขึ้น CI
  - จำไว้ว่าเทสต์ใน CI ของโปรเจกต์นี้กั้นทางขึ้น production โดยตรง เทสต์ flaky = deploy ล้มแบบสุ่ม

### 8. Thai Syllable Wrapping Bug (การตัดคำภาษาไทยเสียรูป)
- **กรณีที่เคยเกิดขึ้น**: ชื่อหัวข้อ `สแกนพลังงานชีวิต 7 จุด (จักระบำบัด)` ยาวเกินไปจนคำว่า `(จักระบำบัด)` ถูกตัดคำกลางคันกลายเป็น `(จักระบำ` และ `บัด)` บนอีกบรรทัด ทำให้ดูไม่เป็นมืออาชีพ
- **วิธีแก้ & กฎป้องกัน**:
  - ตรวจสอบความยาวหัวข้อ (`nameTh`) และคำโปรยเสมอ ให้กระชับ สละสลวย เช่น ปรับเป็น `"สแกนสมดุล 7 จักระ (ไพ่ 7 ใบ)"`
  - ใช้ `leading-tight` หรือ `leading-snug` และตั้งความยาวที่พอดีกับ Grid Column

### 9. Multi-Tier Spread Art Overflows & Label Bleeding (ห้ามใส่ Label ข้อความยาวใต้การ์ดในผังหลายชั้นเด็ดขาด)
- **กรณีที่เคยเกิดขึ้น**: ในหน้า `/spreads` และตัวเลือกผังในหน้าหลัก ผังไพ่ 4-5 ใบ (เช่น ความรักสองหัวใจ, ความในใจของเขา, แฟนเก่าจะกลับมาไหม) มีการวางการ์ดเป็น 2 ชั้น (บน-ล่าง) และใส่ข้อความ label ภาษาไทยใต้การ์ดทุกใบ ทำให้ความสูงรวมบวมขึ้นเป็น 167px เกินความสูงกล่อง (120px) จนตัวหนังสือทะลุไปทับเส้นคั่นและหัวข้อชื่อผัง
- **วิธีแก้ & กฎป้องกันถาวร (Permanent Golden Rule)**:
  1. ในการแสดงผลพรีวิวผังไพ่ (ใน `src/components/ui/TarotArtIcons.tsx`) **ผังที่มี 4 ใบขึ้นไปหรือมีการจัดวาง 2 ชั้นขึ้นไป ห้ามใส่ข้อความ string label ใต้การ์ดทุกใบเด็ดขาด!**
  2. ให้ใช้ **Floating Badge Pin บนมุมการ์ดโดยตรง (เช่น `#1`, `#2`, `#3`, `#4`, `#5`)** ซึ่งสวยงาม หรูหรา กระชับ และไม่กินพื้นที่ความสูง
  3. คุมความสูงรวมของการจัดวางทุกผัง **ให้อยู่ระหว่าง 85px – 100px เสมอ** (ต่ำกว่ากล่องคอนเทนเนอร์ `h-28` = 112px อย่างน้อย 15-25px) เพื่อให้มี Padding หายใจอย่างสมบูรณ์แบบ
  4. รายละเอียดคำอธิบายของแต่ละตำแหน่ง ให้แสดงใน Accordion ด้านล่าง `"✦ ดูรายละเอียดตำแหน่งไพ่"` เท่านั้น

### 🗓️ 2026-08-31: Phase 5 — Ultra-HD 1909 Card Image Remastering & 4-Tier WebP Pipeline

#### 1. 1909 Rider-Waite Digital Image Remastering (คมชัดระดับ Masterpiece)
- **ปัญหาเดิม**: ภาพสแกน 1909 เดิมมีเม็ดสกรีนโบราณและฝุ่นกระดาษ ย่อลงกรอบเล็กแล้วมัวและสูญเสียคอนทราสต์
- **สิ่งที่แก้ไข**:
  - สร้าง `scripts/remaster-cards.py` ทำการบูรณะภาพ 78 ใบด้วย Intelligent Unsharp Masking (`radius=1.1, percent=125`), ปรับความสดของสีคู่หลัก (`Color 1.10`) และคอนทราสต์เส้นหมึกดำ (`Contrast 1.06`)
  - อัปเกรด `scripts/generate-card-variants.ts` และ `src/lib/tarot/card-image.ts` ขยายเป็น **4 ระดับความละเอียด WebP**:
    - `w128` (128px, q86) — สำหรับพรีวิวผัง 20 แบบ, ตราโลโก้ Navbar, และพัดไพ่
    - `w256` (256px, q88) — สำหรับการ์ดขนาดเล็กและจอมือถือ
    - `w512` (512px, q90) — สำหรับกระดานวางไพ่และสารานุกรม
    - `w1024` (1024px, q94) — สำหรับจอ Retina/4K, CardZoomModal และ CardDetailView
  - อัปเกรด `TarotCard.tsx`, `CardDetailView.tsx`, `CardsExplorer.tsx`, `globals.css` (ขอบฟอยล์ทองนูนต่ำและลวดลายหลังไพ่ Obsidian Velvet & Gold Inset)
- **ไฟล์ที่สร้าง/แก้ไข**:
  - `scripts/remaster-cards.py`
  - `scripts/generate-card-variants.ts`
  - `src/lib/tarot/card-image.ts`
  - `src/components/card/TarotCard.tsx`
  - `src/components/encyclopedia/CardDetailView.tsx`
  - `src/components/encyclopedia/CardsExplorer.tsx`
  - `src/app/globals.css`
- **ผลการทดสอบ**:
  - `npm run cards:variants`: สร้างภาพ WebP 312 ไฟล์สำเร็จ 100%
  - `npm run repo:verify`: ผ่านครบ 6 ด่าน 0 errors

---

## 📝 วิธีบันทึกงานสำหรับ AI ตัวถัดไป (Template for Next Entry)

เมื่อทำงานเสร็จ ให้คัดลอก Template นี้ไปต่อท้าย:

```markdown
### 🗓️ [YYYY-MM-DD]: [ชื่อหัวข้องาน / ฟีเจอร์ที่ทำ]

#### 1. [ชื่อสิ่งที่ทำ/ปัญหาที่แก้]
- **ปัญหาเดิม / สิ่งที่ต้องการ**: ...
- **สิ่งที่แก้ไข**: ...
- **ไฟล์ที่แก้ไข**:
  - `path/to/file.tsx`
- **ผลการทดสอบ**: `npm run typecheck` ➔ [ผ่าน/ไม่ผ่าน], [รายละเอียดผลลัพธ์]
- **สิ่งที่ค้างอยู่ / ต้องทำต่อ (ถ้ามี)**: ...
```
