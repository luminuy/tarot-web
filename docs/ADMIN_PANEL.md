# 🔧 แผงแอดมิน (Admin Panel) — คู่มือระบบ

> สถานะ: **M0 + M1 เสร็จ** (platform layer + auth + shell) · M2–M3 ระหว่างทำ · M4–M7 (marketplace) ยังไม่เริ่ม
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

## ความปลอดภัย / PDPA

- `/admin` + `/api/admin` — `robots` disallow + `noindex`
- audit log และ stat events **ห้ามมี PII** (ไม่มีข้อความคำถาม / ชื่อเล่น / IP — เก็บแค่ enum + count)
- Marketplace (M4+) จะเก็บ PII ลูกค้า → ต้องมี consent gate + ADR + แก้ `src/app/privacy/page.tsx` ก่อนเริ่ม
