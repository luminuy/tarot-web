# ⚙️ บันทึกการตั้งค่าระบบและการเชื่อมต่อภายนอก (Production Configuration Registry)

> อัปเดตล่าสุด: **2026-09-02**  
> สถานะรวม: ✅ **ทุกบริการภายนอกและค่าคอนฟิกบน Production ตั้งค่าครบถ้วนสมบูรณ์ 100%**

---

## 🟢 1. บริการภายนอกที่เปิดใช้งานและทดสอบสำเร็จแล้ว (100% Active)

| บริการ / ระบบ | สถานะ | รายละเอียดและการตั้งค่าที่เสร็จสิ้น |
| :--- | :---: | :--- |
| **🌐 โดเมนจริง (`seertarot.net`)** | ✅ **พร้อมใช้งาน** | ผูก DNS Cloudflare เรียบร้อย, SSL Mode: Full, TLS 1.2+, Always Use HTTPS: ON, Route: `*seertarot.net/*` ชี้ไปที่ Worker `tarot-web` |
| **🔑 Google OAuth** | ✅ **พร้อมใช้งาน** | Authorized Origins: `https://seertarot.net`, Redirect URI: `https://seertarot.net/api/auth/google/callback`, Client ID & Secret ใส่ใน Worker แล้ว |
| **💬 LINE Login** | ✅ **พร้อมใช้งาน** | LINE Channel: `SeerTarot` (Status: Published 🟢), Channel ID: `2011389525`, Callback URL: `https://seertarot.net/api/auth/line/callback` |
| **✉️ Resend Email Service** | ✅ **พร้อมใช้งาน** | โดเมน `seertarot.net` ผ่านการ Verify DKIM/SPF ครบ 100%, ผู้ส่ง: `แม่หมอทาโรต์ <noreply@seertarot.net>`, โควตาฟรี 3,000 ฉบับ/เดือน |
| **🔒 ระบบเข้ารหัสผ่าน (PBKDF2)** | ✅ **พร้อมใช้งาน** | `PASSWORD_PEPPER` ขนาด 32 ไบต์ ติดตั้งบน Worker เรียบร้อย สมัครและล็อกอินด้วยอีเมลได้สมบูรณ์ |
| **🤖 เครื่องยนต์ AI (Gemini)** | ✅ **พร้อมใช้งาน** | `GEMINI_API_KEY` ติดตั้งแล้ว สตรีมคำทำนายจริง 3 องก์ และคุยต่อเนื่องในห้องแชทได้ 100% |
| **🗄️ ฐานข้อมูล Cloudflare D1** | ✅ **พร้อมใช้งาน** | รัน Migration 0001–0006 บน Remote DB เรียบร้อย รองรับตาราง `users`, `reading_journal`, `reading_usage` |
| **⚡ Cloudflare KV Edge Cache** | ✅ **พร้อมใช้งาน** | ผูก `NEXT_INC_CACHE_KV` (prefix `app:`) สำหรับ Stat Counters, Config Overrides และ Session Backstop |
| **🏛️ แผงควบคุมแอดมิน (`/admin`)** | ✅ **พร้อมใช้งาน** | รหัสผ่าน `ADMIN_PASSWORD` ติดตั้งแล้ว พร้อมแท็บใหม่ **"✦ สถานะระบบ (Cloud Health)"** ตรวจสัญญาณสดแบบ Real-time |

---

## 📋 2. รายการ Secrets ทั้งหมดบน Cloudflare Worker (`tarot-web`)

สามารถตรวจสอบได้ด้วยคำสั่ง: `npx wrangler secret list`

```
├── ADMIN_PASSWORD          # รหัสผ่านสำหรับเข้าแผงควบคุมหลังบ้าน (/admin)
├── APP_ORIGIN              # https://seertarot.net (ใช้สร้าง Callback และลิงก์รีเซ็ตรหัสผ่าน)
├── EMAIL_FROM              # แม่หมอทาโรต์ <noreply@seertarot.net>
├── GEMINI_API_KEY          # Google Gemini AI API Key
├── GOOGLE_CLIENT_ID        # Google OAuth Client ID
├── GOOGLE_CLIENT_SECRET    # Google OAuth Client Secret
├── LINE_CHANNEL_ID         # LINE Login Channel ID (2011389525)
├── LINE_CHANNEL_SECRET     # LINE Login Channel Secret
├── PASSWORD_PEPPER         # กุญแจลับระดับเซิร์ฟเวอร์สำหรับ PBKDF2 Password Hashing
├── RESEND_API_KEY          # Resend API Key (re_...) สำหรับส่งอีเมล
├── TAROT_SESSION_SECRET    # กุญแจลับสำหรับเซ็น Session Token (Provably Fair & Auth)
├── TESTER_PASSWORD         # รหัสผ่านสำหรับโหมดผู้ทดสอบไม่จำกัด (/tester)
└── UNLIMITED_EMAILS        # บัญชีอีเมลที่ได้รับสิทธิ์ดูดวงไม่จำกัด
```

### ⏳ รอตั้งเพิ่ม — AI Gateway (ดู `docs/plans/CLOUDFLARE_FREE_STACK.md` Wave 1-1)

```
├── CF_AI_GATEWAY_ACCOUNT_ID   # Cloudflare Account ID (dashboard → AI Gateway)
├── CF_AI_GATEWAY_ID           # ชื่อ gateway (แนะนำ: seertarot-ai)
└── CF_AI_GATEWAY_TOKEN        # (ไม่บังคับ) ใส่เมื่อเปิด Authenticated Gateway
```

> ยังไม่ตั้ง = การเรียก AI ยิงตรงไป provider เหมือนเดิม ไม่พัง — helper `src/lib/ai/gateway.ts` fallback ให้อัตโนมัติ

### ⏳ รอตั้งเพิ่ม — Turnstile (Wave 1-3)

```
├── TURNSTILE_SITE_KEY     # Site Key — ตั้งผ่าน secret (pipeline ไม่ส่ง env ตอน build) · client ดึงผ่าน /api/config/turnstile
└── TURNSTILE_SECRET_KEY   # Secret Key
```

> Dashboard → Turnstile → Add widget (Widget Mode: **Managed**, Domain: `seertarot.net` + `localhost`)
> ```
> npx wrangler secret put TURNSTILE_SITE_KEY      # 0x4AAAA...
> npx wrangler secret put TURNSTILE_SECRET_KEY    # 0x4AAAA...
> ```
> ต้องตั้งคู่กันทั้งสองตัว ด่านกันบอทหน้า signup/login/forgot ถึงจะเปิด — ไม่ตั้ง = ด่านผ่านตลอด
> (verify ฝั่ง server มี fail-safe: siteverify ล่ม/timeout = ปล่อยผ่าน · ตั้งมาแค่ตัวเดียว = ถือว่ายังไม่เปิด)

---

## 🧪 3. การตรวจสอบความพร้อมด้วย Live Diagnostics

แอดมินสามารถตรวจสอบสถานะการเชื่อมต่อของทุกบริการข้างต้นแบบ Real-time ได้ตลอดเวลา:
1. เข้าสู่ระบบที่ **[https://seertarot.net/admin](https://seertarot.net/admin)**
2. ไปที่แท็บ **"✦ สถานะระบบ (Cloud Health)"**
3. กดปุ่ม **"✦ ยิงตรวจสัญญาณสดทั้งหมด"** ระบบจะทดสอบและรายงานสถานะ Latency (ms) ของทุกระบบทันที
