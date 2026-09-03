# ☁️ แผนใช้บริการฟรีของ Cloudflare ต่อยอด SeerTarot

> **สถานะ (2026-09-03):** ✅ **6 บริการ LIVE + verified บน production แล้ว** — เหลือ 3 ตัวที่บล็อกจริง
> ทุกตัวออกแบบให้ **degrade เงียบ** — ไม่มี binding/config = ระบบเดิมทำงานปกติ
> **เจ้าของโปรเจกต์เลือกเอง:** เอาทั้ง 9 บริการ จัดลำดับตามพึ่งพา + คุ้มแรง

---

## ลำดับรวม (4 Wave)

| Wave | บริการ | สถานะ | PR |
| :--- | :--- | :--- | :--- |
| 1-1 | **AI Gateway** — log ค่าใช้จ่าย/latency ทุก provider + cache แบบเลือกเส้น | ✅ **LIVE** (verified — log เห็น traffic คำอ่านจริง) | #189 #196 |
| 1-2 | **Email Routing** | 🟢 พร้อมเปิด — dashboard-only (โดเมน `seertarot.net` อยู่บน Cloudflare แล้ว) · ดู §Wave 1-2 | — |
| 1-3 | **Turnstile** — กันบอท signup/login/forgot | ✅ **LIVE** (verified — flow ครบ) | #191 #194 #197 |
| 2-4 | **Workers AI** — safety guard ชั้น 3 (กฎ 6) | ✅ **LIVE** (auto) | #192 |
| 2-5 | **KV ไพ่ประจำวันของทุกคน** | ✅ **LIVE** (deterministic + KV, ไม่ต้อง cron) | #198 |
| — | Cron cleanup jobs | 🟢 ทำเป็น **lazy prune** แทน cron — `issueToken` เรียก `pruneExpiredAuthTokens()` ~5% ผ่าน `waitUntil` (OpenNext ไม่มี `scheduled()` · worker แยกไม่คุ้ม) | #206 |
| 3-6 | **R2** — ลิงก์แชร์การ์ดมี OG image | ✅ **LIVE** (verified — round-trip PNG) · lifecycle 90 วันตั้งแล้ว | #201 #202 #203 |
| 3-7 | **Vectorize** — ค้นหาเชิงความหมาย + "ไพ่ที่พลังงานใกล้เคียง" | ✅ **LIVE** (verified — `?q=` + related cards) · index มี 102 รายการ | #199 #200 |
| 4-8 | **Durable Objects** | 🔴 บล็อก — payoff คือห้องสด Marketplace · Marketplace ยังไม่เปิด (D1 provisioning + PDPA sign-off — `docs/specs/MARKETPLACE.md`) | — |
| 4-9 | **Realtime (SFU/TURN)** | 🔴 บล็อก — ต้องมี Marketplace + Durable Objects ก่อน | — |

### 📌 ค่าที่ตั้งบน production แล้ว
| ตัว | ค่า |
| :--- | :--- |
| AI Gateway | `CF_AI_GATEWAY_ACCOUNT_ID` = `f5af6f66302ba6872d8f51aebf43d3fe` · `CF_AI_GATEWAY_ID` = `seertarot-ai` (Unauthenticated · Cache 60s · Logs on) |
| Turnstile | `TURNSTILE_SITE_KEY` `0x4AAAAAAEl-wIjxl3hSrWTn` · `TURNSTILE_SECRET_KEY` (Managed widget) |
| Vectorize | index `card-meanings` 1024d/cosine · CI token ได้สิทธิ์ Vectorize (ไม่จำเป็น — ไม่ validate ตอน deploy) |
| R2 | bucket `seertarot-share` · CI token `tarot-web deploy` เพิ่ม **Workers R2 Storage: Edit** · lifecycle `auto-delete-90d` |

### 🔁 ต้องรันซ้ำเมื่อแก้ข้อมูลไพ่/บทความ
- `/admin` → แท็บสุขภาพระบบ → การ์ด Cloudflare Free Stack → ปุ่ม **"สร้าง index ใหม่"** (rebuild Vectorize)

---

## Wave 1-1 — AI Gateway ✅ (โค้ด)

**ทำอะไร:** route ทุกการเรียก AI (Gemini / Groq / Claude) ผ่าน gateway เดียว → dashboard เห็นค่าใช้จ่าย/latency/อัตราพลาดทุก provider + แคช response ซ้ำ + rate-limit/retry ระดับ gateway

**โค้ดที่เพิ่ม:**
- `src/lib/ai/gateway.ts` — helper สร้าง endpoint: ถ้าตั้ง env ก็ route ผ่าน gateway ไม่ตั้งก็ยิงตรง (ไม่พัง)
- แก้ 5 จุดที่เรียก AI: `gemini.ts`, `groq.ts` (เส้นจริง — ด่านตรวจสุขภาพยังยิงตรง), `claude.ts` (baseURL SDK), `journal/monthly-summary`, `reading/[id]/chat`
- **cache แบบเลือกเส้น** (`cf-aig-cache-ttl` ต่อ request):
  - คำอ่านไพ่ + แชทแม่หมอ → **ttl 0 (ห้ามแคชเด็ดขาด)** — ต้องสด + cache hit ทำให้ usage=0 → ระบบไม่หักโควตา (INC-0096)
  - สรุปดวงรายเดือน → ttl 6 ชม.
  - จึง**เปิด Cache Responses ที่ gateway ได้เลยอย่างปลอดภัย** — เส้นที่ห้ามแคชถูกกันด้วย header แล้ว

**ต้องทำต่อ (เจ้าของโปรเจกต์):**
1. Dashboard → AI → AI Gateway → **Create a custom gateway** ชื่อ `seertarot-ai`
   - **ปิด "Authenticated Gateway"** (โค้ดยิงผ่าน fetch ธรรมดา ถ้าเปิดจะโดน 401)
   - Collect Logs เปิด · Cache/Rate-limit/Retry เปิดทีหลังในหน้า gateway ได้
2. ตั้ง secret (ไม่ต้องมี token):
   ```
   npx wrangler secret put CF_AI_GATEWAY_ACCOUNT_ID   # f5af6f66302ba6872d8f51aebf43d3fe
   npx wrangler secret put CF_AI_GATEWAY_ID           # seertarot-ai
   ```
3. Deploy → เปิดหน้า Gateway ดู traffic ไหลเข้า + `/admin` → การ์ด Cloudflare Free Stack ต้องขึ้น "AI Gateway: เปิดใช้แล้ว"

**ความเสี่ยง/กันไว้:**
- ไม่ตั้ง env = พฤติกรรมเดิมเป๊ะ (helper คืน URL ตรง)
- SSE streaming ผ่าน gateway ได้ — ทดสอบแล้วว่า path ถูกต้อง
- ด่านตรวจสุขภาพ (`probeGroqHealth`, ai-health) **ตั้งใจยิงตรง** เพื่อวัด provider ต้นทาง ไม่ใช่ gateway

---

## Wave 1-2 — Email Routing

**ทำอะไร:** รับเมลที่ `@seertarot.net` (support@, เห็น bounce ของ noreply@) — โดเมนอยู่บน Cloudflare แล้ว (`docs/PENDING_SETUP.md`)

**dashboard-only · ไม่มีโค้ด** (แค่ forward ไป Gmail):
1. Cloudflare → เลือกโดเมน `seertarot.net` → **Email** → **Email Routing** → **Enable**
2. Cloudflare เพิ่ม MX + SPF records ให้อัตโนมัติ (กด Add records)
3. **Custom addresses** → Add:
   - `support@seertarot.net` → forward ไปอีเมลเจ้าของ (ต้อง verify อีเมลปลายทางครั้งเดียว)
   - `noreply@seertarot.net` → forward ไปเจ้าของ (เห็น bounce/reply ที่หลุดมา)
4. (ตัวเลือก) **Catch-all** → forward ทุกอย่างที่เหลือ

**ถ้าต้องประมวลผลเมลด้วยโค้ด** (parse bounce อัตโนมัติ) — ต้อง Email Worker แยก · OpenNext ไม่ export `email()` handler · ยังไม่คุ้มตอนนี้

---

## Wave 1-3 — Turnstile 🟡 (โค้ดเสร็จ)

**ทำอะไร:** กันบอทฟาร์มสิทธิ์เปิดไพ่ฟรี / spam สมัคร (ผูกกับ `docs/specs/ENTITLEMENT_ABUSE_MODEL.md`)

**โค้ดที่เพิ่ม:**
- `src/lib/security/turnstile.ts` — `verifyTurnstile(token, ip)`: ไม่มี secret = ผ่านตลอด · siteverify ล่ม = ผ่าน (fail-safe, ชั้น rate-limit เดิมยังทำงาน)
- `src/components/auth/TurnstileWidget.tsx` — client widget · ดึง site key จาก `/api/config/turnstile` ตอน runtime (ไม่ใช้ `NEXT_PUBLIC_*` เพราะ pipeline deploy ไม่ส่ง env ตอน build) · config = null → ไม่เรนเดอร์ ไม่บล็อกฟอร์ม
- `AuthModal.tsx` — ฝัง widget + ส่ง `turnstileToken` ไปกับ signup/login/forgot + ปุ่มส่งถูก disable จนกว่าจะผ่าน
- verify ฝั่ง server ใน `api/auth/email/{signup,login,forgot}` หลังเช็ค origin ก่อนงานหนัก
- CSP อนุญาต `challenges.cloudflare.com` (script/connect/frame) อยู่แล้ว

**ต้องทำต่อ (เจ้าของโปรเจกต์):**
- Dashboard → Turnstile → Add widget (Managed · Domain: `seertarot.net`, `localhost`)
- `npx wrangler secret put TURNSTILE_SITE_KEY` + `npx wrangler secret put TURNSTILE_SECRET_KEY`

**ยังไม่ครอบ:** OAuth (`api/auth/[provider]` — redirect flow, บอตฟาร์ม Google/LINE ยาก), `api/auth/email/resend` (มี rate-limit อยู่แล้ว) — เพิ่มได้ทีหลังถ้าเจอ abuse

---

## Wave 2-4 — Workers AI · safety guard ชั้น 3 🟡 (โค้ดเสร็จ)

**ทำแล้ว — คัดกรองสัญญาณทำร้ายตัวเองแบบอ้อม (กฎเหล็กข้อ 6):**
- `wrangler.jsonc`: เพิ่ม binding `ai` → `AI` (ตรวจ schema + `wrangler deploy --dry-run` ผ่าน — INC-0034)
- `src/lib/platform/cf.ts`: `getAiBinding()` — dev/ยังไม่ deploy = `null`
- `src/lib/safety/ai-classifier.ts` (ใหม่) — สถาปัตยกรรม 3 ชั้น:
  1. regex `checkQuestion()` จับรูปตรง (เดิม)
  2. `mayNeedDeepCrisisCheck()` — regex คำทุกข์ระดับอ่อน (คลุมเครือ) → คัดเฉพาะเคสที่ควรถามต่อ
  3. `assessCrisisRisk()` — ถาม Workers AI (`@cf/meta/llama-3.1-8b-instruct`) YES/NO เฉพาะเคสชั้น 2 · timeout 3.5s · **fail-open** (ไม่มี binding/ล่ม = ไม่บล็อก เพราะชั้น 1+prompt ยังทำงาน)
- ต่อเข้า `api/reading/start` + `api/reading/[id]/chat` หลัง regex → บล็อกด้วย `CRISIS_MESSAGE` เดิม (สายด่วน 1323)
- จำกัดจำนวนเรียก: เฉพาะเคสชั้น 2 เท่านั้น → ประหยัด neuron (ฟรี ~10k/วัน เหลือเฟือ)

**ต้องทำต่อ (เจ้าของโปรเจกต์):** ไม่มี — Workers AI binding ใช้ได้เลยหลัง deploy (ไม่ต้อง provision) · ตรวจ log `[safety-ai]` ใน Worker หลัง deploy

**ต่อยอดภายหลัง (ไม่อยู่ใน PR นี้):** AI สำรองตัวที่ 3, แปลไทย/ตรวจภาษาปน, embeddings สำหรับ Wave 3-7

---

## Wave 2-5 — KV ไพ่ประจำวัน 🟢 + Cron (ทำเป็น lazy prune)

**Spike ผล:** OpenNext 1.20.4 **ไม่ export `scheduled()`** — `cli/templates/worker.js` copy ตรง ๆ ไม่มี hook · จะทำ cron ต้อง (ก) แก้ `main` ชี้ wrapper (เสี่ยงพัง deploy ทั้ง repo · verify ไม่ได้ถ้าไม่มี CF_API_TOKEN) หรือ (ข) worker แยกอีกตัว + deploy step ที่ 2

**ที่ทำจริง:**
- **ไพ่ประจำวัน** (#198) — ไม่ต้อง cron: deterministic จากวันที่ + KV edge cache · คนแรกของวันเขียน คนอื่นอ่าน
- **Cron cleanup** → **lazy prune** (#206): `issueToken()` เรียก `pruneExpiredAuthTokens()` ~5% ของครั้ง ผ่าน `waitUntil` (fire-and-forget) — ลบ `auth_tokens` ที่หมดอายุเกิน 1 วัน batch 200 แถว · ไม่มี infra ใหม่ · เรียกตรงจาก `pruneExpiredAuthTokens()` ได้ถ้าอยากทำ endpoint

**หมายเหตุ:** โควตารายวัน/สัปดาห์เป็น rolling-window (`lib/entitlement/week.ts`) อยู่แล้ว — ไม่ต้อง cron รีเซ็ต · `queue_tickets` (Marketplace) จะ prune ตอน Marketplace เปิด

---

## Wave 3 — R2 + Vectorize

### 3-6 R2 — share image + OG 🟢 (เปิดแล้ว)
- ประวัติ: #201 merge → deploy fail (`CLOUDFLARE_API_TOKEN` ขาดสิทธิ์ R2) → #202 hotfix comment binding ทิ้ง → เจ้าของโปรเจกต์เติมสิทธิ์ **Account · Workers R2 Storage · Edit** ให้ token `tarot-web deploy` → #203 uncomment กลับ
- **ไม่ต้อง satori/resvg** — reuse `<canvas>` ที่ `ShareModal` สร้างอยู่แล้ว
- `wrangler.jsonc` — binding `SHARE_BUCKET` → `seertarot-share` (schema + opennext build + deploy ผ่าน)
- `POST /api/share/image` — รับ PNG จาก canvas (≤1.2MB, ตรวจ magic bytes, rate-limit 12/10นาที) → R2 → คืน `{ id, url: /s/<id> }`
- `GET /api/share/image/<id>` — Worker อ่าน R2 คืนรูป (ไม่เปิด public bucket)
- `GET /s/<id>` — หน้า OG จิ๋ว (`og:image` + `twitter:card`) + redirect ไปหน้าแรก · `robots: noindex`
- `ShareModal` — Twitter/Facebook/Threads อัปโหลด canvas → แชร์ `/s/<id>` (ขึ้นรูปพรีวิว) · IG/TikTok ยังใช้ native share + ดาวน์โหลดเหมือนเดิม
- **PDPA**: id สุ่ม (UUID) · meta เก็บแค่หัวข้อ+ชื่อผัง · lifecycle `auto-delete-90d` (Delete objects after 90 days) **ตั้งใน dashboard แล้ว**
- verified บน production: POST PNG → 200 · GET กลับ byte ตรงเป๊ะ · `/s/<id>` มี `og:image` + `twitter:card`

### 3-7 Vectorize — ค้นหาเชิงความหมาย 🟢 (LIVE)
- index `card-meanings` · **1024 มิติ · cosine** (ตรงกับ `@cf/baai/bge-m3` multilingual — รองรับไทย) · มี 102 รายการ (ไพ่ 78 + บทความ 24)
- verified บน production: `?q=ความรัก` → คู่รัก (The Lovers) อันดับ 1 · related cards ท้ายหน้าไพ่ทำงาน
- corpus = ความหมายไพ่ 78 + บทความ 24 · id `card:<id>` / `article:<slug>` · metadata string ล้วน (ไม่ต้อง metadata index)
- **โค้ด**: `src/lib/search/vectorize.ts` (corpus/embed/rebuild/search/relatedTo), `src/lib/platform/cf.ts` (`getVectorizeBinding`), `/api/search` (`?q=` หรือ `?like=card:<id>`), `/api/admin/rebuild-search-index`, `<RelatedCards>` ท้ายหน้ารายละเอียดไพ่
- **degrade เงียบ**: ไม่มี binding / index ว่าง → คืน `[]` → UI ซ่อนส่วนนั้น
- **ต้องทำต่อ (เจ้าของโปรเจกต์)** หลัง deploy: `POST /api/admin/rebuild-search-index` (ปุ่มในแท็บสุขภาพระบบ) รันครั้งเดียว — embed ทั้ง corpus เข้า index
- **ต่อยอด**: ช่องค้นหาเชิงความหมายในหน้า `/cards`, แนะนำบทความจากผลไพ่

---

## Wave 4 — รอปลดบล็อก

- **Durable Objects:** ใช้ได้เลยสำหรับ provably-fair session state + rate-limit แม่นยำต่อผู้ใช้ แต่ payoff ใหญ่คือห้องคุยสด Marketplace → ทำพร้อม Marketplace
- **Realtime (SFU/TURN):** บล็อกเต็มตัว — รอ Marketplace ปลดบล็อก (D1 provisioning + PDPA sign-off ตาม `docs/specs/MARKETPLACE.md`)
