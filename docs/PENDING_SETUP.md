# ⚙️ งานตั้งค่าที่ยังค้าง (Pending Production Setup)

> เช็กลิสต์สำหรับเจ้าของโปรเจกต์ — สิ่งที่ต้องตั้งค่าบน Cloudflare / บริการภายนอก
> โค้ดพร้อมหมดแล้ว รอแค่ค่า config · อัปเดตล่าสุด: 2026-09-01

---

## ✅ ตั้งค่าแล้ว (Cloudflare Worker Secrets)

`npx wrangler secret list` → มี 5 ตัว:

| Secret | ใช้ทำอะไร |
| :-- | :-- |
| `TAROT_SESSION_SECRET` | เซ็น session token (Provably-Fair, OAuth, guest cookie, admin) |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | ล็อกอิน Google |
| `ADMIN_PASSWORD` | เข้าแผงแอดมิน `/admin` |
| `TESTER_PASSWORD` | *(ยังไม่ตั้ง — ดูข้อ 4.5)* เข้า `/tester` ใช้เว็บไม่จำกัด โดยไม่เห็นแผงแอดมิน |
| `GEMINI_API_KEY` | คำอ่านไพ่ AI + แชทถามต่อ + สรุปดวงรายเดือน (ตั้ง 2026-09-01) |

**ใช้งานได้ตอนนี้:** ดูดวง 5 ขั้น (คำอ่าน AI จริงผ่าน Gemini + ระบบสิทธิ์/โควตา) · Google login · แผงแอดมิน (`/admin` — สถิติ, แก้ prompt/ไพ่, marketplace, สิทธิ์เปิดไพ่)

---

## ⏳ ยังค้าง

### 0. ✅ **คีย์ AI (Gemini) — ตั้งแล้ว 2026-09-01 · คำอ่าน AI + paywall ทำงานครบ**

> ตั้ง `GEMINI_API_KEY` แล้ว + แก้โค้ดฝั่ง Gemini (PR #104–110): ชื่อโมเดล `gemini-3.6/3.7-flash`
> (1.5/2.0/2.5 ถูก Google ปลด), request body แบบ 3.x, จับ thought-parts, `responseJsonSchema`
> · verify: curl guest flow บน prod ได้คำอ่าน AI จริง 3 องก์ + โควตา `remaining` 1→0 + reading ที่ 2 = 403
> · ถ้าจะเปลี่ยนโมเดลในอนาคต ยึด `GET https://generativelanguage.googleapis.com/v1beta/models?key=…`

<details><summary>บันทึกปัญหาเดิม (ก่อนแก้)</summary>

**สถานะ (ยืนยัน 2026-09-01):** `wrangler secret list` ไม่มี `GEMINI_API_KEY` / `GOOGLE_API_KEY`
→ `src/lib/ai/gemini.ts:92` เข้า branch `!apiKey` → เสิร์ฟ `streamMockGeminiReading` (คำอ่านสำเร็จรูปในโค้ด) ทุกครั้ง

**ผลกระทบลูกโซ่:**
- คำอ่านที่ผู้ใช้เห็นเป็นข้อความ template เดิมซ้ำ ๆ (เช่น "แม่หมอขอสรุปให้คุณ…ทุกอย่างมีทางออกที่ดีเสมอ…") ไม่ได้วิเคราะห์จริง
- mock ส่ง `usage = {inputTokens:0, outputTokens:0}` → `read` route ตัดสิน `realReading = false`
  → **ไม่หักสิทธิ์ผู้เยี่ยมชม/สมาชิก** (ตั้งใจกันโกงตาม INC-0096 "ห้ามคิดเงินถ้า AI เราพัง")
  → **ทุกคนเปิดไพ่ได้ไม่จำกัด แม้ธง `entitlement.enabled` เปิดอยู่** — ดู ISSUE-016 ใน KNOWN_ISSUES
- โค้ด logic ระบบสิทธิ์ถูกทดสอบครบ (`scripts/qa/test-entitlement.ts` 55/55) — บั๊กอยู่ที่ config ไม่ใช่โค้ด

**วิธีแก้ (ทำครั้งเดียว — ไม่ต้องมีโดเมน):**
```bash
# 1. ขอ API key ฟรีจาก https://aistudio.google.com/apikey
npx wrangler secret put GEMINI_API_KEY      # วางค่า AIza... (จำเป็น)
```
โมเดลที่โค้ดลองเรียงกัน: `CANDIDATE_GEMINI_MODELS` ใน `src/lib/ai/gemini.ts` (ปัจจุบัน `gemini-3.7-flash` → `gemini-2.0-flash`)
หลังตั้งคีย์: ทำ reading 1 ครั้ง แล้ว curl `GET /api/entitlement` ด้วยคุกกี้เดิม — `canStartReading` ต้องกลายเป็น `false` · Worker log ต้องไม่มีบรรทัด `[gemini] ไม่พบ GEMINI_API_KEY`

</details>

---

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

### 4.5 บัญชีผู้ทดสอบ (Tester) — ให้หุ้นส่วน/ทีมงานใช้เว็บไม่จำกัด · โค้ดครบ · รอตั้ง secret

**ปลดล็อกทุกลิมิต** (rate limit / โควตาเปิดไพ่ / เพดาน AI / origin guard / entitlement)
**ไม่เปิดแผงแอดมิน** — แก้ prompt / เห็นสถิติ / ยอดจ่าย ไม่ได้ (คนละกลไกกับ `/admin`)

```bash
npx wrangler secret put TESTER_PASSWORD    # ตั้งรหัสยาว ≥ 12 ตัว เช่น: openssl rand -base64 18
```

วิธีใช้ (ส่งให้หุ้นส่วน):
1. เปิด `https://<โดเมน>/tester`
2. ใส่รหัสผ่านผู้ทดสอบ → กด "ปลดล็อก"
3. กด "เข้าใช้งานเว็บ" → ใช้ได้ไม่จำกัด 30 วัน (ต่ออายุ = เข้า `/tester` ใส่รหัสใหม่)
4. เลิก = เข้า `/tester` → "ออกจากโหมดผู้ทดสอบ"

- cookie `tarot_tester` (httpOnly · 30 วัน) · เปลี่ยน `TESTER_PASSWORD` = เตะทุกเครื่องที่ปลดล็อกไว้ทิ้งทันที
- การใช้งานถูกนับใน stat `ratelimit_bypass:tester` (เห็นใน `/admin`)
- **ยังบังคับ:** safety guard (สายด่วน 1323), provably-fair integrity — เหมือน bypass ทุกแบบ
- dev: ใส่ `TESTER_PASSWORD=...` ใน `.env.local`

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
