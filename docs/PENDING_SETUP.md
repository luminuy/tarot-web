# ⚙️ งานตั้งค่าที่ยังค้าง (Pending Production Setup)

> เช็กลิสต์สำหรับเจ้าของโปรเจกต์ — สิ่งที่ต้องตั้งค่าบน Cloudflare / บริการภายนอก
> โค้ดพร้อมหมดแล้ว รอแค่ค่า config · อัปเดตล่าสุด: 2026-09-01

---

## ✅ ตั้งค่าแล้ว (Cloudflare Worker Secrets)

`npx wrangler secret list` → มี 4 ตัว:

| Secret | ใช้ทำอะไร |
| :-- | :-- |
| `TAROT_SESSION_SECRET` | เซ็น session token (Provably-Fair, OAuth, guest cookie, admin) |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | ล็อกอิน Google |
| `ADMIN_PASSWORD` | เข้าแผงแอดมิน `/admin` |

**ใช้งานได้ตอนนี้:** ดูดวง 5 ขั้น · Google login · แผงแอดมิน (`/admin` — สถิติ, แก้ prompt/ไพ่, marketplace, สิทธิ์เปิดไพ่)

---

## ⏳ ยังค้าง

### 1. อีเมล (Email Auth) — ✋ **ตัดสินใจ 2026-09-01: ใส่ทีหลัง ไม่ปิดฟีเจอร์**

**สถานะ:** ปุ่ม/ฟอร์ม "สมัคร/ล็อกอินด้วยอีเมล" ใน `AuthModal` ยังแสดงอยู่
**ผลตอนนี้:** ถ้ามีคนกดสมัครด้วยอีเมลบน production จะได้ error 500 (เพราะ `PASSWORD_PEPPER` ไม่ได้ตั้ง — `src/lib/auth/password.ts:60` throw ใน prod) · **Google login ไม่กระทบ**

**ต้องตั้ง 4 secret (ต้องมีโดเมนก่อน — ดูข้อ 2):**
```bash
npx wrangler secret put PASSWORD_PEPPER     # openssl rand -hex 32  (จำเป็น)
npx wrangler secret put AUTH_SECRET         # openssl rand -hex 32  (ไม่บังคับ — fallback ไป TAROT_SESSION_SECRET)
npx wrangler secret put RESEND_API_KEY      # re_xxx จาก resend.com (ต้อง verify โดเมน)
npx wrangler secret put EMAIL_FROM          # แม่หมอลูมินัย <noreply@โดเมนคุณ>
```

**บริการอีเมลแนะนำ:** [Resend](https://resend.com) — ฟรี 3,000 อีเมล/เดือน (100/วัน) · โค้ด `src/lib/email/send.ts` เขียนเรียก Resend API ไว้แล้ว · **ต้อง verify โดเมน** (เพิ่ม DNS 3 records)
ทางเลือกถ้าไม่อยากผูกโดเมน: Brevo (ฟรี 300/วัน, verify sender ด้วย Gmail ได้) — ต้องแก้ `send.ts` เปลี่ยน API (~15 บรรทัด)

### 2. โดเมน (Custom Domain) — ยังใช้ `tarot-web.bankjack10452.workers.dev`

**ปัญหา:** โค้ดฮาร์ดโค้ด `luminuy.com` / `tarot.luminuy.com` ไว้ **แต่โดเมนนี้ยังไม่ได้จด** (curl → ไม่ตอบ)

**ทางเลือก:**
- จด `luminuy.com` (ถ้ายังว่าง) → โค้ดใช้ได้เลยไม่ต้องแก้ · Cloudflare Registrar ราคาทุน `.com` ~$10.44/ปี
- จดโดเมนอื่น → ต้องแก้ `luminuy.com` ในไฟล์เหล่านี้:
  - `src/app/layout.tsx` (`metadataBase`), `src/app/sitemap.ts`, `src/app/robots.ts`
  - `src/lib/security/anti-theft.ts` (allowlist host), `src/lib/email/send.ts` (EMAIL_FROM default)
  - `next.config.ts`? · docs ต่าง ๆ
- ผูก Custom Domain ใน Cloudflare Workers dashboard → Settings → Domains & Routes

**ได้อะไร:** URL สวย + ปลดล็อกอีเมล (ข้อ 1)

### 3. LINE Login — ยังไม่ได้ตั้ง (ฟรี ไม่ต้องโดเมน)

ปุ่ม "LINE" ใน `AuthModal` แสดงอยู่ แต่ `/api/auth/line` จะพังเพราะไม่มี:
```bash
npx wrangler secret put LINE_CHANNEL_ID       # จาก LINE Developers Console
npx wrangler secret put LINE_CHANNEL_SECRET
```
ตั้ง Callback URL ที่ LINE console: `https://tarot-web.bankjack10452.workers.dev/api/auth/line/callback`
> คนไทยใช้ LINE เยอะ — คุ้มค่าทำก่อนอีเมล

### 4. ระบบสมาชิก/โควตาเปิดไพ่ (Entitlement) — โค้ดครบ · ธงปิด

เปิดใช้งานได้ 100% จาก `/admin` → แท็บ **"สิทธิ์เปิดไพ่"** (4 ปุ่ม: เตรียม DB → โบนัส → ประกาศ → เปิด)
runbook เต็ม: [`docs/ENTITLEMENT_PLAN.md`](ENTITLEMENT_PLAN.md) ท้ายไฟล์

### 5. D1 Migrations ไม่รันอัตโนมัติตอน deploy

`.github/workflows/deploy.yml` ไม่มีขั้น `wrangler d1 migrations apply`
- ตารางของ marketplace/users/journal/email (0001–0006) — apply ด้วยมือไปแล้ว (ฟีเจอร์ทำงานอยู่)
- ตาราง entitlement (0007) — ใช้ปุ่ม **"เตรียมฐานข้อมูล"** ในแท็บ "สิทธิ์เปิดไพ่" แทน (หรือ `npm run db:migrate`)
- ถ้าเพิ่ม migration ใหม่ → ต้อง `npm run db:migrate` เอง หรือเพิ่มขั้นใน deploy.yml

---

## 📌 สรุปลำดับแนะนำ

1. **ตอนนี้ (ฟรี):** ตั้ง LINE login (ข้อ 3) — 10 นาที
2. **มีงบ ~฿370:** จดโดเมน (ข้อ 2) → ตั้ง Resend + email secrets (ข้อ 1)
3. **พร้อมเปิดตลาด:** เปิดระบบสมาชิก (ข้อ 4) ตาม runbook
