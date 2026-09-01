# 🔧 แผงแอดมิน (Admin Panel) — คู่มือระบบ

> สถานะ: **M0–M3 เสร็จ** (platform · auth · shell · สถิติ · แก้เนื้อหา live) · M4–M7 (marketplace) ยังไม่เริ่ม
> แผนเต็ม: `~/.claude/plans/breezy-percolating-llama.md`

---

## ภาพรวม

แผงที่ `/admin` ให้แอดมิน:
1. **ดูสถิติ** ทุกมิติของการใช้งาน (M2)
2. **แก้ prompt / ความหมายไพ่ / บุคลิกแม่หมอ แบบ live โดยไม่ต้อง deploy** (M3)
3. จัดการ **Marketplace แม่หมอตัวจริง** (M4–M7)

เข้าด้วย **รหัสผ่านแอดมินแยก** — ไม่เกี่ยวกับ Google/LINE OAuth ของผู้ใช้ทั่วไป

---

## สถาปัตยกรรมที่เก็บข้อมูล

| ชั้น | ใช้เก็บอะไร | หมายเหตุ |
| :-- | :-- | :-- |
| **KV** (`NEXT_INC_CACHE_KV`, prefix `app:`) | config overrides, feature flags, stat counters, audit log | reuse namespace เดิม — ไม่ต้อง provision · eventually-consistent (~60s) |
| **D1** (`APP_DB`, เข้ามา M4) | readers, availability, queue, bookings, payments | ต้อง `wrangler d1 create` + binding ใน wrangler.jsonc |
| in-memory (`src/server/store.ts`) | reading state ระหว่างขั้นตอน (เดิม) | ไม่เกี่ยวกับแอดมิน |

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

## สถิติ (M2)

| ไฟล์ | หน้าที่ |
| :-- | :-- |
| `src/lib/stats/record.ts` | `recordEvent()` — buffer ระดับ isolate + flush debounce 20 วิ ผ่าน `waitUntil` |
| `src/lib/stats/read.ts` | `getStats(days)` — force-flush ก่อนอ่าน + รวม daily/all-time |
| `src/components/admin/StatsDashboard.tsx` | UI การ์ด + bar list (ไม่มี chart lib) |
| `GET /api/admin/stats?days=` | คืน `{ stats, audit }` (guard requireAdmin) |

- KV keys: `app:stat:day:<YYYY-MM-DD>` (TTL 400 วัน) + `app:stat:all`
- เขียน KV แบบ debounce เพราะ free plan จำกัด ~1,000 writes/วัน — ยอมสูญเสีย < 20 วิ/isolate ถ้า worker recycle
- metric ที่นับ: `reading_started/completed/failed/blocked`, `spread:*`, `persona:*`, `category:*`, `safety_flag:*`, `ai_call:gemini`, `ai_error:gemini`, `ai_latency_ms`, `ai_tokens_in/out`, `chat_message`, `chat_blocked`
- **ทุก metric เป็น enum/count ล้วน — ไม่มี PII**

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

## ความปลอดภัย / PDPA

- `/admin` + `/api/admin` — `robots` disallow + `noindex`
- audit log และ stat events **ห้ามมี PII** (ไม่มีข้อความคำถาม / ชื่อเล่น / IP — เก็บแค่ enum + count)
- Marketplace (M4+) จะเก็บ PII ลูกค้า → ต้องมี consent gate + ADR + แก้ `src/app/privacy/page.tsx` ก่อนเริ่ม

---

## ต่อไป: Phase 2 Marketplace

งาน M4–M7 (D1 + reader profiles → คิว walk-up/จองล่วงหน้า → AI screening → payments) มีเอกสารส่งต่อละเอียดแยกที่
**[`docs/MARKETPLACE.md`](MARKETPLACE.md)** — บล็อกอยู่ที่เจ้าของต้อง provision D1 + PDPA sign-off ก่อน
