# 🔧 แผงแอดมิน (Admin Panel) — คู่มือระบบ

> สถานะ: **M0–M3 เสร็จสมบูรณ์** (platform · auth · shell · สถิติ · แก้เนื้อหา live) · D1 Database ใช้งานจริง (migrations 0001–0006) · แท็บ Cloud Health ตรวจสัญญาณสดและเมตริก D1 ทำงาน 100% · M4–M7 (Marketplace Booking) อยู่ในเฟสถัดไป

---

## ภาพรวม

แผงที่ `/admin` ให้แอดมิน:
1. **ดูสถิติและเมตริก D1**: สถิติการใช้งาน, ผู้ใช้, การเปิดไพ่, โควตา (M2)
2. **แก้ prompt / ความหมายไพ่ / บุคลิกแม่หมอ แบบ live โดยไม่ต้อง deploy** (M3)
3. **ตรวจสอบสุขภาพระบบสด (Cloud Health Diagnostics)**: สัญญาณ D1, KV, Groq LPU, Gemini, Resend, Turnstile, AI Gateway
4. จัดการ **Marketplace แม่หมอตัวจริง** (M4–M7)

เข้าด้วย **รหัสผ่านแอดมินแยก** — ไม่เกี่ยวกับ Google/LINE OAuth ของผู้ใช้ทั่วไป

---

## สถาปัตยกรรมที่เก็บข้อมูล

| ชั้น | ใช้เก็บอะไร | หมายเหตุ |
| :-- | :-- | :-- |
| **KV** (`NEXT_INC_CACHE_KV`, prefix `app:`) | config overrides, feature flags, stat counters, audit log | reuse namespace เดิม — eventually-consistent (~60s) |
| **D1** (`APP_DB`) | users, reading_journal, reading_usage, user_bonus, marketplace | ใช้งานจริงบน Cloudflare D1 (database_id: `560fdbe7...`) |
| in-memory (`src/server/store.ts`) | reading state ระหว่างขั้นตอน (อายุสั้น 2 ชม. มี KV backstop) | ไม่เกี่ยวกับแอดมิน |

**Platform access layer** (`src/lib/platform/`):
- `cf.ts` — `getAppKV()` / `getWaitUntil()` · fallback เป็น in-memory shim อัตโนมัติเมื่อรันนอก Cloudflare (`next dev`)
- `kv-store.ts` — typed JSON helpers + `KEY` builders + memo cache

⚠️ **ห้ามเพิ่ม `initOpenNextCloudflareForDev()` ใน `next.config.ts`** — สตาร์ท workerd ที่พังบน macOS < 13.5 (ISSUE-004) จะทำให้ `npm run dev` ใช้ไม่ได้

---

## Auth (M1)

| ไฟล์ | หน้าที่ |
| :-- | :-- |
| `src/lib/auth/admin-auth.ts` | sign/verify HMAC session, verify password (constant-time), `isAdminConfigured()` |
| `src/lib/auth/require-admin.ts` | `requireAdmin()` guard (ใช้ทุก `/api/admin/*`), `isAdminRequest()` |
| `src/lib/admin/audit.ts` | audit log บน KV — `recordAudit()` / `listAudit()` |

- cookie `tarot_admin` · httpOnly · secure (prod) · sameSite lax · อายุ **8 ชม.**
- เซ็นด้วย `TAROT_SESSION_SECRET` + `ADMIN_PASSWORD` → เปลี่ยนรหัสผ่าน = ทุก session หลุดทันที
- login rate-limit: **5 ครั้ง / 15 นาที / IP**
- routes: `POST /api/admin/login` · `POST /api/admin/logout` · `GET /api/admin/session` → `{ configured, admin }`

### ตั้งค่า Production
```bash
npx wrangler secret put ADMIN_PASSWORD   # ต้อง ≥ 12 ตัวอักษร
```
Local dev: ใส่ `ADMIN_PASSWORD=...` ใน `.env.local`

---

## สถิติและการวิเคราะห์รายวัน (Daily Analytics & Stats)

| ไฟล์ | หน้าที่ |
| :-- | :-- |
| `src/lib/stats/record.ts` | `recordEvent()` — buffer ระดับ isolate + flush debounce 20 วิ ผ่าน `waitUntil` |
| `src/lib/stats/read.ts` | `getStats(days)` ช่วงวัน · `getDayStats(day)` วันเดียว + วันก่อน + สมาชิกใหม่/ความเห็นจาก D1 — force-flush ก่อนอ่านเสมอ |
| `src/lib/stats/admin-metrics.ts` | ทะเบียนชื่อเมตริกที่แผงอ่าน + `summarize()` จัดหมวด (การใช้งาน · ความปลอดภัย · สิทธิ์ · AI · ธุรกิจ) — ใช้ร่วมทุกแผง |
| `src/components/admin/StatsDashboard.tsx` | แดชบอร์ด 3 หมวด: **สรุปรายวัน** (เลือกวันได้) / **แนวโน้ม & ความนิยม** / **AI & ระบบ** |
| `src/components/admin/DailySummary.tsx` | สรุปของวันเดียว — ปุ่มวันก่อน/ถัดไป/วันนี้ + ปฏิทิน ย้อนได้ 400 วัน · เทียบวันก่อนทุกตัวเลข |
| `src/components/admin/DailyStatsTable.tsx` | แนวโน้มช่วง 7–90 วัน: กราฟเริ่ม/อ่านจบ · ความนิยม · ตารางย้อนหลัง (กดวัน ➔ เปิดสรุปรายวัน) · CSV |
| `GET /api/admin/stats?days=N` | คืน `{ stats, audit, ai }` (guard requireAdmin) |
| `GET /api/admin/stats?day=YYYY-MM-DD` | คืน `{ day, prevDay, current, previous, activity, prevActivity, isToday, ai }` |

- ⚠️ **โควตา AI วันนี้ต้องอ่านผ่าน `getAiUsageToday()` เท่านั้น** — เปิด Upstash อยู่ ตัวนับอยู่ใน Redis, อ่าน KV ตรง ๆ ได้ 0 เสมอ (ด่าน `test-admin-stats-keys` เฝ้า)
- วันของระบบสถิติคือวัน UTC (ตัดรอบ 07:00 น. เวลาไทย)
- KV keys: `app:stat:day:<YYYY-MM-DD>` (TTL 400 วัน) + `app:stat:all`
- เมนู 4 หมวด (จัดใหม่ 2026-09-23 — `NAV_SECTIONS` ใน `src/app/(th)/admin/page.tsx`):
  1. **ภาพรวม**: ภาพรวม · สถิติการใช้งาน
  2. **ผู้ใช้**: สมาชิก (ค้นหา · สิทธิ์คงเหลือ · ให้สิทธิ์เพิ่ม · รายชื่อรับข่าวสาร) · ความเห็นจากผู้ใช้ · รหัสแลกสิทธิ์
  3. **ตั้งค่าบริการ**: สิทธิ์ & โควตา · แม่หมอ & ไพ่ 78 ใบ · หมอดูพาร์ทเนอร์
  4. **ระบบ**: สุขภาพระบบ & AI
  - ลิงก์เก่า `?tab=marketing` เด้งไปแท็บ "สมาชิก" (`TAB_ALIASES`)
- **ทุก metric เป็น enum/count ล้วน — ไม่มี PII**
- รองรับการส่งออกรายงาน CSV พร้อม UTF-8 BOM สำหรับเปิดใน Microsoft Excel และ Google Sheets ได้ทันทีโดยภาษาไทยไม่เพี้ยน

## ธีมและแผงที่เพิ่ม (2026-09-23)

| เรื่อง | ไฟล์ | หมายเหตุ |
| :-- | :-- | :-- |
| ธีมขาวมาตรฐาน | `src/app/(th)/admin/admin-theme.css` | โหลดเฉพาะ layout ของแอดมิน · สลับโทเคนสีใต้ `.admin-shell` · หน้าเว็บจริงไม่โดนแตะ |
| สมาชิก | `MembersPanel.tsx` · `GET/POST /api/admin/members` | ค้นจากอีเมล/ชื่อ/รหัส · ดูสิทธิ์คงเหลือ + ประวัติโบนัส · ให้สิทธิ์เพิ่ม 1–50 ครั้ง (ต้องใส่เหตุผล · reason `admin_<uuid>` ไม่นับเป็นสิทธิ์จ่ายเงิน · บันทึก `member_bonus_grant` ใน audit) |
| ความเห็นจากผู้ใช้ | `FeedbackPanel.tsx` · `GET /api/feedback` | API มีอยู่แล้วแต่ไม่เคยมีหน้าจออ่าน · กรองตามหมวด · คะแนนเฉลี่ย |
| ภาพรวม | `AdminOverview.tsx` | ไฟสถานะบริการอ่านค่าจริงจาก `/api/admin/system-health` (เดิม KV/AI/Vectorize เขียวตายตัว) · ชื่อไทยครบทุก action ใน audit |

## แก้เนื้อหา live (M3)

| ไฟล์ | หน้าที่ |
| :-- | :-- |
| `src/lib/content/overrides.ts` | เก็บ override JSON ก้อนเดียวใน KV `app:override:content` + `resolveSystemCore/Persona/CardByIndex` + `applyCardOverride` |
| `src/components/admin/ContentEditor.tsx` | UI 3 tab: prompt กลาง / บุคลิกแม่หมอ / ความหมายไพ่ 78 ใบ |
| `GET/PUT /api/admin/content` | อ่าน/เขียน doc (Zod strict, audit) |
| `scripts/qa/test-overrides-safety.ts` | gate ที่ 8 — override ห้ามแตะโครงไพ่ |

- override แก้ได้เฉพาะ **ข้อความ**: `systemPrompt`, persona `voice/tagline/nameTh`, card `meanings/keywords/yesNo`
- **ห้ามแตะ**: card `id/number/arcana/suit/element/image/astrology/numerology`, ลำดับ DECK (cardIndex load-bearing)
- ค่าว่าง/ช่องว่าง → fallback ไป default อัตโนมัติ
- มีผลกับคำอ่านใหม่ภายใน ~60 วินาที (memo cache TTL)
- consumer ที่เดินสายผ่าน: `gemini.ts`, `claude.ts`, `api/reading/[id]/read`, `api/reading/[id]/chat`

## ระบบรหัสแลกสิทธิ์ (Redeem Codes Manager — /admin?tab=redeem)

| ไฟล์ | หน้าที่ |
| :-- | :-- |
| `src/lib/entitlement/redeem.ts` | แกนแลกสิทธิ์ · แยกชนิด `gift` / `premium` จาก `reason_prefix` · จองสิทธิ์แบบอะตอมมิก |
| `src/lib/entitlement/redeem-admin.repo.ts` | Repository สำหรับดึง/สร้าง/แก้ไขรหัสแลกสิทธิ์ และรายการประวัติการแลกบน D1 |
| `src/components/admin/RedeemCodesManager.tsx` | แดชบอร์ดจัดการรหัสแลกสิทธิ์ สร้างรหัส สุ่มรหัส ปิดใช้งาน และดูประวัติ |
| `GET/POST/PATCH /api/admin/redeem` | REST endpoints สำหรับรายการ, สร้าง, และแก้ไขรหัสแลกสิทธิ์ |
| `GET /api/admin/redeem/[code]/redemptions` | รายการประวัติผู้ใช้ที่นำรหัสดังกล่าวไปแลก |
| `scripts/qa/test-redeem-code.ts` | ชุดทดสอบความถูกต้อง กลไก atomic rollback และ rate limit (ผูกในด่านแกนสิทธิ์) |

- **โค้ดแจก (`gift_*`)** — เพิ่มรอบเปิดไพ่เท่านั้น ผังมาตรฐานตามปกติ ไม่ปลดฟีเจอร์พรีเมียม
- **โค้ด VIP (`purchase_*`)** — นับเป็นเครดิตที่ซื้อ ➔ `hasPaidCredits = true` ปลดผังใหญ่ + ปรมาจารย์ลับ ตราบใดที่ยังมีรอบเหลือ
- **ระบบสุ่มรหัส** — มีปุ่มสุ่มรูปแบบ `SEER-XXXX-XXXX` และ**บังคับใส่เพดานจำนวนคน + วันหมดอายุทุกใบ**
  ไม่มีช่อง "ไม่จำกัดคน" / "ไม่มีวันหมดอายุ" แล้ว — ปฏิเสธซ้ำทั้ง 3 ชั้น (หน้าจอ · zod ใน route · `redeem-admin.repo.ts`)
  เพราะรหัสที่ดับไม่ได้คือรหัสที่หลุดแล้วแจกสิทธิ์ต่อไปเรื่อย ๆ (INC-0134)
- **ทางเข้าเดียว** — การ์ด "5 · รหัสแลกสิทธิ์" ในแท็บ "สิทธิ์เปิดไพ่" เหลือเป็นป้ายบอกทางเท่านั้น
  (เคยมีหน้าจอ + API ชุดที่สอง `/api/admin/entitlement/codes` ทำงานซ้ำกันจากการทำพร้อมกันสองสาย — ยุบแล้ว)
- **ข้อกำหนดและความปลอดภัย (Security & Business Rules)**:
  1. **ห้ามมีปุ่มลบรหัส**: ใช้การ toggle `is_active` (0 หรือ 1) เปิด/ปิดสถานะแทน เพื่อรักษา Audit Trail
  2. **ห้ามแก้ `code` และ `credits` หากถูกแลกไปแล้ว (`used_count > 0`)**: ป้องกันความผิดพลาดของสิทธิ์
  3. **ห้ามลบประวัติการแลก (`redeem_redemptions`)**: ประวัติการแลกเป็น immutable
  4. **PDPA / Zero PII**: บันทึก Audit Log ผ่าน `recordAudit()` โดยเก็บเฉพาะ `code` และ `credits` เท่านั้น ไม่บันทึกข้อมูลส่วนบุคคล
  5. **ตัวบังคับจริง**: `UPDATE ... WHERE (max_uses = -1 OR used_count < max_uses)` เงื่อนไขเดียวจบ (กัน TOCTOU)
     — เงื่อนไข `max_uses = -1` คงไว้เพื่อรองรับ**แถวยุคเก่า**เท่านั้น รหัสใหม่สร้างเป็น -1 ไม่ได้แล้ว

## ความปลอดภัย / PDPA

- `/admin` + `/api/admin` — `robots` disallow + `noindex`
- audit log และ stat events **ห้ามมี PII** (ไม่มีข้อความคำถาม / ชื่อเล่น / IP — เก็บแค่ enum + count)
- Marketplace (M4+) จะเก็บ PII ลูกค้า → ต้องมี consent gate + ADR + แก้ `src/app/privacy/page.tsx` ก่อนเริ่ม

---

## ต่อไป: Phase 2 Marketplace

งาน M4–M7 (D1 + reader profiles → คิว walk-up/จองล่วงหน้า → AI screening → payments) มีเอกสารส่งต่อละเอียดแยกที่
**[`docs/MARKETPLACE.md`](MARKETPLACE.md)** — บล็อกอยู่ที่เจ้าของต้อง provision D1 + PDPA sign-off ก่อน
