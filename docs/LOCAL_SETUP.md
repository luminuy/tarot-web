# รันในเครื่อง (Local Setup)

> ตรวจกับโค้ดล่าสุด: 2026-10-26 (`package.json` · `src/lib/platform/db.ts` · `astro.config.mjs` · `.env.example`)
> ภาพรวมระบบดู [ARCHITECTURE.md](ARCHITECTURE.md) · กติกาการทำงานและคำสั่งทั้งหมดดู [CLAUDE.md](../CLAUDE.md)

## 1. สิ่งที่ต้องมี

| อะไร | รุ่น | เหตุผล |
| :--- | :--- | :--- |
| Node.js | **22.12 ขึ้นไป** | Astro ต้องการ ≥ 22.12 · ฐานข้อมูลในเครื่องใช้ `node:sqlite` ของ Node 22 · CI ใช้ Node 22 |
| npm | ที่มากับ Node | รีโปล็อกด้วย `package-lock.json` และ CI ติดตั้งด้วย `npm ci` — อย่าใช้ pnpm/yarn |
| Git | รุ่นใดก็ได้ที่รองรับ `core.hooksPath` | hook ใน `.githooks/` รัน `repo:verify` ก่อน commit/push |
| GitHub CLI (`gh`) | ไม่บังคับ | ใช้กับ `npm run pr:auto` |

## 2. ติดตั้ง

```bash
git clone https://github.com/luminuy/tarot-web.git
cd tarot-web
npm ci                      # ติดตั้งตาม lockfile · ตั้ง git hooks ให้เอง (สคริปต์ prepare)
cp .env.example .env.local  # แล้วเติมเฉพาะค่าที่ต้องใช้ (ดูหัวข้อ 3)
```

## 3. ตัวแปรแวดล้อม (`.env.local`)

รายชื่อทุกตัวพร้อมคำอธิบายอยู่ใน [`.env.example`](../.env.example) · ค่าบน production และสถานะการตั้งค่าอยู่ใน [PENDING_SETUP.md](PENDING_SETUP.md)

**ไม่ต้องตั้งอะไรเลยก็รันได้** — สิ่งที่เกิดเมื่อไม่มีค่า:

| ไม่ได้ตั้ง | ผลในเครื่อง |
| :--- | :--- |
| `GROQ_API_KEY` · `GEMINI_API_KEY` | คำอ่านทุกชิ้นเป็นคำอ่านสำรองออฟไลน์ (ไม่ใช่ AI จริง) |
| `RESEND_API_KEY` | อีเมล (ลิงก์ยืนยัน · รีเซ็ตรหัส) ถูกพิมพ์ลง console แทนการส่งจริง |
| `TAROT_SESSION_SECRET` · `PASSWORD_PEPPER` | ใช้ค่าสำหรับ dev ในโค้ด — บน production ไม่ตั้ง = เริ่มทำงานไม่ได้ |
| `ADMIN_PASSWORD` | เข้า `/admin` ไม่ได้ |
| `TURNSTILE_*` · `CF_AI_GATEWAY_*` · `UPSTASH_*` | ข้ามด่าน/ยิงตรงไปผู้ให้บริการ/ใช้ KV ตามเดิม |

> เปิดไพ่ต้องลงชื่อก่อนเสมอ (`GUEST_LIMIT = 0`) — ในเครื่องให้สมัครด้วยอีเมล แล้วคัดลอกลิงก์ยืนยันจาก console

## 4. ฐานข้อมูลในเครื่อง

- ไม่ต้องตั้งอะไร — ครั้งแรกที่โค้ดเปิดฐาน จะสร้างไฟล์ `.dev-marketplace.db` (SQLite) แล้วรันทุกไฟล์ใน `migrations/` ให้เอง ชุดเดียวกับ D1 บน production
- มี migration ใหม่ ➔ รันให้เองตอนเปิดฐานครั้งถัดไป · ฐานรุ่นเก่า (สร้างก่อน 2026-10-25 จากสคีมาเขียนมือ) ถูกย้ายไปไว้ข้าง ๆ เป็น `.dev-marketplace.db.legacy-*` แล้วสร้างใหม่
- migration ไฟล์ไหนรันไม่ผ่าน = error พร้อมชื่อไฟล์ ไม่ถอยไปฐานเปล่าเงียบ ๆ
- `npm run db:migrate` เปล่า ๆ = ฐานในเครื่องของ wrangler (ใช้เมื่อจะลอง `preview:worker` · คนละไฟล์กับ `.dev-marketplace.db`) · ฐานจริงต้องสั่ง `-- --remote` เอง ซึ่ง `deploy.yml` ทำให้ทุกรอบ — ไม่ต้องรันเองจากเครื่อง (เปลี่ยนค่าเริ่มต้น 2026-10-27 · #729)

## 5. dev server

เว็บมีสองเครื่องเรนเดอร์ จึงมี dev server สองตัวที่ทำงานแยกกัน:

| คำสั่ง | พอร์ต | เสิร์ฟอะไร | ข้อจำกัด |
| :--- | :--- | :--- | :--- |
| `npm run dev` | 3000 | Next.js — `/api/*` · `/admin` · `/readers/*` · `/tester` · `/reset-password` · `/r/*` · `/s/*` | ไม่มีหน้าเนื้อหา (`/` · `/cards` ฯลฯ ไม่มีใน Next) |
| `npm run dev:astro` | 4321 | Astro — หน้าเนื้อหาสาธารณะทั้งหมด | ไม่มี proxy ไป API — ส่วนที่เรียก `/api/*` (ลงชื่อ · เปิดไพ่) ได้ 404 |

ต้องการทั้งเว็บพร้อม API ในที่เดียว (ใกล้ production ที่สุด):

```bash
npm run build:worker     # บิลด์ Astro + Next แล้วรวมไฟล์ (ใช้เวลาหลายนาที)
npm run preview:worker   # Worker จำลองด้วย wrangler ที่ http://localhost:8787
```

ถ้าเครื่องรัน wrangler ไม่ได้ (macOS ต่ำกว่า 13.5) ใช้ลิงก์ทดลองบน Cloudflare แทน — ดู [CLOUDFLARE_DEPLOYMENT_GUIDE.md](CLOUDFLARE_DEPLOYMENT_GUIDE.md) หัวข้อลิงก์ทดลอง

## 6. ตรวจก่อนส่งงาน

```bash
npm run typecheck     # TypeScript อย่างเดียว
npm run repo:verify   # ด่านตรวจทั้งชุด 94 ด่าน — hook รันให้เองก่อน commit/push
```

ด่านบางตัวอ่านผลบิลด์ (`dist/` · `.open-next/`) — ถ้าไม่ได้บิลด์มาก่อน ผลของด่านกลุ่มนั้นจะไม่ตรงกับ CI ซึ่งบิลด์ก่อนตรวจเสมอ
ขั้นตอน commit · PR · ล็อกไฟล์ ดู [AI_COLLABORATION_GUIDELINES.md](AI_COLLABORATION_GUIDELINES.md) หัวข้อ 0.4

## 7. ข้อควรรู้เฉพาะเครื่อง

- macOS: พอร์ต 5000 และ 7000 ถูก AirPlay Receiver จองไว้ — อย่าตั้ง dev server ไปพอร์ตนั้น
- เสียงอ่านคำทำนาย (Web Speech API) ใช้เสียงภาษาไทยที่มากับระบบปฏิบัติการ/เบราว์เซอร์ — ถ้าเครื่องไม่มีเสียงไทย ปุ่มอ่านออกเสียงจะไม่มีเสียงไทยให้เลือก
- `.claude/launch.json` มีชุดคำสั่งเปิด dev server ทั้งสองตัวสำหรับ preview ของ Claude Code
