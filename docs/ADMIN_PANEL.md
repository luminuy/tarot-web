# แผงแอดมิน (`/admin`) — คู่มือระบบ

> ตรวจกับโค้ดล่าสุด: 2026-10-26 (`src/app/(th)/admin/` · `src/app/api/admin/**` · `src/components/admin/` · `src/lib/admin/`)
> หน้าตาและเมนูชุดปัจจุบันมาจากการจัดใหม่ 2026-10-17 และคอนโซลแบบองค์กร 2026-10-19 (#704 · #705)
> secret ที่แผงนี้ใช้ ➔ [`PENDING_SETUP.md`](PENDING_SETUP.md) · ระบบ Marketplace ➔ [`specs/MARKETPLACE.md`](specs/MARKETPLACE.md)

---

## 1. เข้าใช้งาน

| เรื่อง | รายละเอียด |
| :--- | :--- |
| หน้า | `/admin` (Next · `src/app/(th)/admin/page.tsx`) · `/admin/login` |
| รหัส | `ADMIN_PASSWORD` (อย่างน้อย 12 ตัว) แยกจากบัญชีผู้ใช้ทั่วไป · เครื่องพัฒนาใส่ใน `.env.local` |
| คุกกี้ | `tarot_admin` · httpOnly · secure บน production · sameSite lax · อายุ 8 ชม. · เซ็นด้วย `ADMIN_PASSWORD` + `TAROT_SESSION_SECRET` (เปลี่ยนรหัส = ทุก session หลุด) |
| เพดานเดารหัส | 8 ครั้ง / 15 นาที (ต่อ IP · ต่อคู่ · ต่อตัวตน — `admin_login` ใน `src/lib/security/auth-ratelimit.ts`) |
| ด่านฝั่ง API | `requireAdmin()` ใน `src/lib/auth/require-admin.ts` ทุกเส้น `/api/admin/*` · ยกเว้น 2 เส้นที่รับ `ADMIN_REPORT_TOKEN` ได้ด้วย (หัวข้อ 5) |
| SEO | หน้าแอดมินเป็น `noindex` (`layout.tsx`) · `robots.txt` ปิด `/api/` |
| ไฟล์หลัก | `src/lib/auth/admin-auth.ts` (เซ็น/ตรวจคุกกี้ · เทียบรหัสแบบเวลาคงที่) · `src/app/api/admin/{login,logout,session}` |

---

## 2. เมนู

เมนูอยู่ใน `NAV_SECTIONS` ของ `src/app/(th)/admin/page.tsx` — 5 หมวด เรียงตามงานที่ทำบ่อย

| หมวด | เมนู (`?tab=`) | หมวดย่อย (`?sub=`) | แผง (`src/components/admin/`) |
| :--- | :--- | :--- | :--- |
| ดูตัวเลข | แดชบอร์ดผู้บริหาร `executive` (หน้าแรกของแอดมิน) | `summary` · `marketing` · `operations` | `ExecutiveDashboard.tsx` · `ExecCharts.tsx` |
| | สถานะระบบวันนี้ `overview` | — | `AdminOverview.tsx` |
| | สถิติละเอียดรายวัน `stats` | `daily` · `trend` · `ai` | `StatsDashboard.tsx` · `DailySummary.tsx` · `DailyStatsTable.tsx` |
| เงินและแม่หมอ | รายการชำระเงิน `payments` | `all` · `paid` · `pending` · `failed` · `refunded` | `PaymentsPanel.tsx` |
| | การจองและการเงิน `bookings` | `todo` (เงินต้องคืน) · `bookings` · `payouts` · `reviews` | `BookingsAdmin.tsx` |
| | แม่หมอพาร์ทเนอร์ `readers` | `list` · `pricing` (ราคา AI ช่วยเขียน) | `ReadersManager.tsx` · `StudioPassPricing.tsx` |
| ลูกค้า | สมาชิก `members` | `list` · `audience` (รายชื่อรับข่าวสาร + CSV) | `MembersPanel.tsx` · `MarketingAudience.tsx` |
| | ความเห็นจากผู้ใช้ `feedback` | `all` · `low` (คะแนน 1–2) · รายหมวดความเห็น | `FeedbackPanel.tsx` |
| | รหัสแลกสิทธิ์ `redeem` | ตัวกรองในหน้า: ทั้งหมด · พร้อมใช้ · ปิดใช้งาน · หมดอายุ · สิทธิ์เต็ม | `RedeemCodesManager.tsx` |
| ตั้งค่าเว็บ | โควตาฟรีและสิทธิ์ `entitlement` | `switch` · `metrics` · `health` · `announce` · `setup` | `EntitlementAdmin.tsx` |
| | แก้คำทำนาย AI และไพ่ `content` | `prompt` · `persona` · `card` | `ContentEditor.tsx` |
| ระบบ | สุขภาพระบบ `health` | `system` (เว็บและฐานข้อมูล) · `ai` | `SystemHealthPanel.tsx` · `AiHealthPanel.tsx` |
| | บันทึกการทำงานแอดมิน `audit` | `all` + หมวดใน `AUDIT_GROUP_NAME` | `AuditLogPanel.tsx` |

- ⚠️ `id` ของเมนูคือค่า `?tab=` — เปลี่ยนชื่อเมนูได้ ห้ามเปลี่ยน id (ลิงก์ที่บุ๊กมาร์กไว้จะพัง) · ไม่ใส่ `?tab=` = แดชบอร์ดผู้บริหาร
- ลิงก์เก่า: `?tab=marketing` ➔ สมาชิก (`TAB_ALIASES`) · `?tab=system` / `?tab=ai` ➔ สุขภาพระบบหมวดนั้น
- ค้นหาเมนู Ctrl+K / Cmd+K (`CommandPalette.tsx`) จากชื่อ คำอธิบาย และ `keywords`
- ตัวเลขเตือนบนเมนูจาก `GET /api/admin/nav-badges`: เงินต้องคืน (แดง) · แม่หมอรอตรวจ (เหลือง) · ความเห็นใหม่ 7 วัน (เทา) — แสดงเมื่อมากกว่า 0
- คีย์ Stripe เป็นโหมดทดสอบ (`sk_test_` / `rk_test_`) = แถบเหลือง "Stripe โหมดทดสอบ" บนหัว (`stripeKeyMode()` · ไม่เรียก API)

### โครงหน้ากลาง (`AdminLayout.tsx`)

ทุกเมนูใช้โครงเดียวกัน: ตัวเลขสรุป (`KpiGrid` + `StatCard`) ➔ แท็บหมวดย่อย (`AdminSubTabs` + `useSubTab` จำค่าใน `?sub=` · เปลี่ยนเมนูแล้วล้าง) ➔ การ์ดแต่ละส่วน (`AdminSection`) · รายละเอียดแถวเปิดเป็นแผงข้าง (`AdminDrawer` · Esc ปิด) · ไม่มีข้อมูลใช้ `EmptyState` · หัวทุกเมนูมีกล่อง "วิธีใช้หน้านี้" (`help` ใน `NAV_SECTIONS`)

### หน้าตา (`src/app/(th)/admin/admin-theme.css`)

- โหลดเฉพาะ layout ของแอดมิน · สลับโทเคนสีภายใต้ `.admin-shell` · หน้าเว็บจริงไม่โดนแตะ
- เมนูข้างเต็มความสูง (มือถือเป็นลิ้นชัก) · พื้นที่ทำงานเทาอ่อน · การ์ดขาว · แท็บย่อยเป็นเส้นใต้
- สีเน้นมีสีเดียว `--admin-accent` (น้ำเงิน) — โทเคน `gold*` ถูกสลับเป็นน้ำเงินภายใต้ `.admin-shell` · แผงใหม่ใช้คลาส/คอมโพเนนต์กลางตามปกติ ห้ามใส่ hex ใน tsx (ด่าน palette-drift)
- ตัวเลขไม่ใช้ฟอนต์พิมพ์ดีด (CSS ทับ `.font-mono` ยกเว้น textarea/code/kbd)

---

## 3. ที่เก็บข้อมูลของแผง

| ข้อมูล | ที่เก็บ | หมายเหตุ |
| :--- | :--- | :--- |
| ตัวนับสถิติรายวัน | D1 `stat_counters` (หลัก) · KV `app:stat:day:<YYYY-MM-DD>` / `app:stat:all` (ทางถอย) | `src/lib/stats/record.ts` buffer ระดับ isolate แล้วเขียนทุก 20 วินาที · ตัวอ่าน `read.ts` รวมสองแหล่ง |
| บันทึกการทำงานแอดมิน | D1 `admin_audit` (เก็บ 180 วัน) | `src/lib/admin/audit.ts` · ของเก่าบน KV อ่านเสริมจนหมดอายุ |
| content override | KV `app:override:content` (JSON ก้อนเดียว) | `src/lib/content/overrides.ts` |
| สวิตช์/ธงต่าง ๆ | KV `app:*` | `src/lib/platform/kv-store.ts` (`KEY` builders + memo cache) |
| ผู้ใช้ · สิทธิ์ · การจ่ายเงิน · แม่หมอ · การจอง · รหัสแลกสิทธิ์ · ความเห็น | D1 `APP_DB` | |

ชั้นเข้าถึงแพลตฟอร์ม `src/lib/platform/`: `cf.ts` (`getAppKV()` · `getWaitUntil()` · binding อื่น ๆ — นอก Cloudflare ถอยเป็น shim ในหน่วยความจำ) · `db.ts` · `kv-store.ts` · `redis.ts`

> ⚠️ ห้ามเพิ่ม `initOpenNextCloudflareForDev()` ใน `next.config.ts` — ทำให้ `npm run dev` พังบน macOS < 13.5 (ISSUE-004)

---

## 4. รายละเอียดรายแผง

### 4.1 แดชบอร์ดผู้บริหาร

| ไฟล์ | หน้าที่ |
| :--- | :--- |
| `src/lib/admin/executive-report.ts` | คำนวณล้วน (ทดสอบได้ไม่ต้องมี DB): ช่วงนี้/ช่วงก่อน · รายได้แยกสินค้า · "สิ่งที่ต้องดู" แบบกฎตายตัว (ไม่ใช้ AI) |
| `src/lib/admin/executive-data.ts` | อ่าน D1 + ตัวนับรายวัน 2 ช่วง + Stripe · ทุกคำถามแยก try (อ่านไม่ได้ = `null` ไม่ใช่ 0) |
| `getStripeAdminSummary()` ใน `src/lib/marketplace/payment-gateway.ts` | อ่านอย่างเดียวจาก Stripe: ยอดพร้อมโอน/รอเคลียร์ · ยอดรับ ค่าธรรมเนียม เงินคืน ข้อพิพาท · รอบโอน 5 ครั้งล่าสุด · คีย์ `rk_` ที่ขาดสิทธิ์ = ข้อความเตือน ไม่ล่ม |
| `GET /api/admin/executive?days=7\|28\|90` | รายงานทั้งก้อน |

- รายได้ = เงินจริงเท่านั้น: ตัด `provider` = `simulator` / `comp` (ปรึกษาฟรี) และ Stripe โหมดทดสอบ (`provider_ref` ขึ้นต้น `cs_test_`) แล้วรายงานจำนวนที่ตัด
- แยกสินค้าจาก `order_id`: `ord_` = แพ็กเติมรอบ · `stp_` = AI ช่วยเขียนของแม่หมอ · อื่น ๆ = ปรึกษาแม่หมอ
- "ชนโควตา" นับการถูกกั้นสิทธิ์ทุกแบบ ยกเว้น `ai_cap_hit` (เพดานงบ AI ของระบบ)
- "สมาชิกที่กลับมาใช้" อ่านจาก `users.last_seen_at` (เก็บแค่ครั้งล่าสุด) จึงไม่มีตัวเลขเทียบช่วงก่อน
- สีกราฟเป็นโทเคน `--viz-*` ใน `admin-theme.css` · ตัวนับรายวันอ่านย้อนได้ 180 วัน (`readD1Counters` แบ่งคำถามละ 90 วัน เพราะ D1 รับพารามิเตอร์ไม่เกิน 100)
- ด่าน `test-admin-stats-keys` ตรวจการแบ่งช่วง · การตัดรายการทดสอบ · กฎสิ่งที่ต้องดู · อ่าน D1 ไม่ได้ต้องได้ `null`

### 4.2 สถิติละเอียดรายวัน

| ไฟล์ / เส้นทาง | หน้าที่ |
| :--- | :--- |
| `src/lib/stats/read.ts` | `getStats(days)` · `getDayStats(day)` (วันนั้น + วันก่อน + สมาชิกใหม่/ความเห็นจาก D1) — flush buffer ก่อนอ่านเสมอ |
| `src/lib/stats/admin-metrics.ts` | ทะเบียนชื่อเมตริก + `summarize()` จัดหมวด (การใช้งาน · ความปลอดภัย · สิทธิ์ · AI · ธุรกิจ) |
| `DailySummary.tsx` | ทีละวัน ย้อนได้ 400 วัน · เทียบวันก่อนทุกตัวเลข |
| `DailyStatsTable.tsx` | แนวโน้ม 7–90 วัน · ความนิยม · ตารางย้อนหลัง · CSV (UTF-8 BOM เปิดใน Excel ได้) |
| `GET /api/admin/stats?days=N` · `?day=YYYY-MM-DD` | ข้อมูลของสองมุมมองข้างบน |
| `GET /api/admin/quality` | สถิติคุณภาพและความเร็วของ AI |

- ⚠️ โควตา AI วันนี้ต้องอ่านผ่าน `getAiUsageToday()` เท่านั้น — เปิด Upstash อยู่ตัวนับอยู่ใน Redis อ่าน KV ตรง ๆ ได้ 0 (ด่าน `test-admin-stats-keys`)
- วันของระบบสถิติคือวัน UTC (ตัดรอบ 07:00 น. เวลาไทย)
- ทุกเมตริกเป็น enum/จำนวนล้วน ไม่มีข้อมูลส่วนบุคคล

### 4.3 เงิน · การจอง · แม่หมอ

| เรื่อง | ไฟล์ / เส้นทาง | หมายเหตุ |
| :--- | :--- | :--- |
| รายการชำระเงิน | `PaymentsPanel.tsx` · `src/lib/admin/payments-admin.ts` · `GET /api/admin/payments?status=&product=&mode=&q=&before=` | ทุกสินค้าในตาราง `payments` · ค่าเริ่มต้นเห็นเฉพาะเงินจริง · ค้นด้วยรหัสรายการ/คำสั่งซื้อ/ผู้ใช้/Stripe (ตรงตัว) · หน้าละ 50 · ปุ่มเปิดใน Stripe · ไม่ดึงอีเมลหรือชื่อ |
| การจองและการเงิน | `BookingsAdmin.tsx` · `GET/POST /api/admin/bookings?period=YYYY-MM` | เงินต้องคืน · การจอง · ยอดโอนให้แม่หมอ · รีวิว · ปุ่มตรวจรายการคืนเงินจาก Stripe |
| แม่หมอพาร์ทเนอร์ | `ReadersManager.tsx` · `/api/admin/readers` · `/api/admin/readers/[id]` | ตรวจ อนุมัติ ส่งลิงก์แผงแม่หมอ แก้ข้อมูล |
| ราคา AI ช่วยเขียน 30 วัน | `StudioPassPricing.tsx` · `GET/PUT/PATCH /api/admin/studio-pass` | ราคากลาง + ราคาเฉพาะแม่หมอ · ไม่ตั้ง = `STUDIO_PRO_PRICE_THB` ใน `wrangler.jsonc` |

### 4.4 ลูกค้า

| เรื่อง | ไฟล์ / เส้นทาง | หมายเหตุ |
| :--- | :--- | :--- |
| สมาชิก | `MembersPanel.tsx` · `GET/POST /api/admin/members` | ค้นจากอีเมล/ชื่อ/รหัส · ดูสิทธิ์คงเหลือ + ประวัติโบนัส · ให้สิทธิ์เพิ่ม 1–50 ครั้ง (ต้องใส่เหตุผล · บันทึก `member_bonus_grant`) |
| รายชื่อรับข่าวสาร | `MarketingAudience.tsx` · `GET /api/admin/marketing` | ส่งออก CSV |
| ความเห็นจากผู้ใช้ | `FeedbackPanel.tsx` · `GET /api/feedback` (แอดมินเท่านั้น) | 50 รายการล่าสุด · คะแนนเฉลี่ย · กรองตามหมวด |

**รหัสแลกสิทธิ์** (`RedeemCodesManager.tsx` · `src/lib/entitlement/redeem.ts` · `src/lib/entitlement/redeem-admin.repo.ts` · `GET/POST/PATCH /api/admin/redeem` · `GET /api/admin/redeem/[code]/redemptions` · ทดสอบโดย `scripts/qa/test-redeem-code.ts`)

- `gift_*` เพิ่มรอบเปิดไพ่เท่านั้น · `purchase_*` (VIP) นับเป็นเครดิตที่ซื้อ ➔ ปลดผังใหญ่และฟีเจอร์พรีเมียมตราบที่ยังมีรอบเหลือ
- สุ่มรหัสรูปแบบ `SEER-XXXX-XXXX` · **บังคับเพดานจำนวนคนและวันหมดอายุทุกใบ** ตรวจซ้ำ 3 ชั้น (หน้าจอ · zod ใน route · repo) เพราะรหัสที่ดับไม่ได้คือรหัสที่หลุดแล้วแจกต่อไปเรื่อย ๆ (INC-0134)
- ห้ามมีปุ่มลบรหัส (ใช้เปิด/ปิด `is_active`) · ห้ามแก้ `code` / `credits` เมื่อ `used_count > 0` · ห้ามลบ `redeem_redemptions`
- ตัวบังคับจริง: `UPDATE ... WHERE (max_uses = -1 OR used_count < max_uses)` (กัน TOCTOU) — `-1` เหลือไว้รองรับแถวยุคเก่าเท่านั้น
- audit เก็บแค่ `code` และ `credits` ไม่มีข้อมูลส่วนบุคคล

### 4.5 ตั้งค่าเว็บ

**โควตาฟรีและสิทธิ์** — `EntitlementAdmin.tsx` · `GET/PUT /api/admin/entitlement` · `POST /api/admin/entitlement/ops` (ขั้นตั้งระบบสิทธิ์) · สวิตช์บังคับใช้สิทธิ์ · ตัวเลข · สุขภาพ · ประกาศล่วงหน้า

**แก้คำทำนาย AI และไพ่ (ไม่ต้อง deploy)** — `ContentEditor.tsx` · `GET/PUT /api/admin/content` (Zod strict · บันทึก audit)

- แก้ได้เฉพาะข้อความ: `systemPrompt` · persona `voice` / `tagline` / `nameTh` · ไพ่ `meanings` / `keywords` / `yesNo`
- ห้ามแตะโครงไพ่ (`id` · `number` · `arcana` · `suit` · `element` · `image` · `astrology` · `numerology`) และลำดับ `DECK` — ด่าน `scripts/qa/test-overrides-safety.ts`
- ค่าว่าง = ใช้ค่าเริ่มต้น · มีผลกับคำอ่านใหม่ภายในราว 60 วินาที (memo cache)
- ผู้ใช้ค่าเหล่านี้: `src/lib/ai/{gemini,groq,openrouter}.ts` · `/api/reading/[id]/read` · `/chat` · `/perspective` · `/api/reading/explain`

### 4.6 ระบบ

| เรื่อง | ไฟล์ / เส้นทาง | หมายเหตุ |
| :--- | :--- | :--- |
| สุขภาพระบบ (เว็บและฐานข้อมูล) | `SystemHealthPanel.tsx` · `GET /api/admin/system-health` | 4 กลุ่ม: เว็บ/ความปลอดภัย · ล็อกอิน/อีเมล · ฐานข้อมูล · AI/บริการเสริม · ไฟสถานะของ `AdminOverview.tsx` อ่านจากเส้นนี้ |
| สุขภาพ AI | `AiHealthPanel.tsx` · `GET /api/admin/ai-health` | ยิงรายโมเดล ➔ ห้องคุยจริง ➔ คุณภาพคำอ่านจริง · ไม่คืนค่าคีย์ (บอกแค่ตั้งไว้ไหม) |
| สร้าง index ค้นหาใหม่ | `GET/POST /api/admin/rebuild-search-index` | กดหลังแก้ข้อมูลไพ่/บทความ (Vectorize `card-meanings`) |
| บันทึกการทำงาน | `AuditLogPanel.tsx` · `GET /api/admin/audit?limit=` (1–500 · ค่าเริ่ม 300) | กรองตามหมวด · ค้นข้อความ · แถบแดงเมื่อใส่รหัสแอดมินผิดใน 24 ชม. |
| ชื่อไทยของ action | `src/lib/admin/audit-labels.ts` | ที่เดียวทั้งระบบ — เพิ่ม `recordAudit("ใหม่")` ต้องเพิ่มชื่อที่นี่ |

---

## 5. รหัสอ่านรายงาน · ตัวเช็กเว็บล่ม · อีเวนต์ซื้อ

| เรื่อง | ไฟล์ | หมายเหตุ |
| :--- | :--- | :--- |
| `ADMIN_REPORT_TOKEN` | `requireAdminOrReportToken()` ใน `src/lib/auth/require-admin.ts` | ใช้ได้แค่ `GET /api/admin/executive` · `GET /api/admin/nav-badges` · หัว `Authorization: Bearer` ผิด = 401 ทันที ไม่ถอยไปตรวจคุกกี้ · วิธีตั้งใน [`PENDING_SETUP.md`](PENDING_SETUP.md) หัวข้อ 4 |
| `npm run exec:report` | `scripts/exec-report.ts` | สรุปภาษาไทย 7/28/90 วัน · `--json` เก็บผลดิบ · ยิงเข้าโดเมนหลัก (`/api/*` บน `*.workers.dev` ถูกส่งกลับโดเมนหลัก — ห้ามเพิ่มข้อยกเว้นให้เส้นรายงาน) |
| ตัวเช็กเว็บล่ม | `.github/workflows/uptime.yml` | ทุก 10 นาที · ล่ม = เปิด issue `[เว็บล่ม]` · กลับมา = ปิดเอง (รายละเอียดใน [`CLOUDFLARE_DEPLOYMENT_GUIDE.md`](CLOUDFLARE_DEPLOYMENT_GUIDE.md) หัวข้อ 8) |
| อีเวนต์ `purchase` ของ GA4 | `trackPurchase()` ใน `src/lib/analytics.ts` | ยิงเฉพาะเงินจริงที่เซิร์ฟเวอร์ยืนยัน · ดูแยกช่องทาง `npm run seo:ga4 -- purchases` |

---

## 6. ความปลอดภัยและ PDPA

- audit log และ stat events ห้ามมีข้อมูลส่วนบุคคล (ไม่มีข้อความคำถาม · ชื่อเล่น · IP — เก็บแค่ enum และจำนวน)
- แผงที่แสดงข้อมูลลูกค้า (สมาชิก · การจอง) ดึงเฉพาะที่จำเป็น · รายการชำระเงินไม่ดึงอีเมลหรือชื่อ
- เพิ่มแผงหรือ route ใหม่: ใช้ `requireAdmin()` · บันทึก `recordAudit()` เมื่อเปลี่ยนข้อมูล · เติมชื่อ action ใน `audit-labels.ts` · ใช้โครงจาก `AdminLayout.tsx`
