# ☁️ แผนใช้บริการฟรีของ Cloudflare ต่อยอด SeerTarot

> **สถานะ:** Wave 1-1 / 1-3 / 2-4 โค้ด merge เข้า main แล้ว (#189 #191 #192)
> ทั้ง 3 ตัวออกแบบให้ **ไม่กระทบระบบเดิมถ้ายังไม่ตั้งค่า** (helper fallback / fail-open)
> **ฐานอ้างอิง:** สาขา `claude/image-logo-adjustments-943250` (2026-09-03)
> **เจ้าของโปรเจกต์เลือกเอง:** เอาทั้ง 7 บริการ จัดลำดับตามพึ่งพา + คุ้มแรง

---

## ลำดับรวม (4 Wave)

| Wave | บริการ | ค่าฟรี | สถานะ |
| :--- | :--- | :--- | :--- |
| 1-1 | **AI Gateway** | ไม่จำกัด | ✅ #189 merge · รอ dashboard เปิดใช้ |
| 1-2 | **Email Routing** | ไม่จำกัด | 🔴 บล็อก — รอซื้อโดเมน |
| 1-3 | **Turnstile** | 1M verify/เดือน | ✅ #191 merge · รอ site key + secret |
| 2-4 | **Workers AI** — safety guard (กฎ 6) | ~10k neurons/วัน | ✅ #192 merge · ใช้ได้เลยหลัง deploy |
| 2-5 | **KV ไพ่ประจำวัน + Cron Triggers** | KV 100k read/วัน · cron ไม่จำกัด | 🟠 ต้อง spike custom worker entry (`scheduled()`) — เสี่ยงพัง deploy ต้องทดสอบ pipeline จริง |
| 3-6 | **R2** — Destiny Card share image | 10 GB + egress ฟรี | ⏳ ต้องสร้าง bucket + เพิ่ม lib เรนเดอร์ภาพ (satori/resvg) |
| 3-7 | **Vectorize** — ค้นหาเชิงความหมาย | 30M dim-query/เดือน | ⏳ ต้องสร้าง index + สร้าง embedding pipeline (ใช้ Workers AI จาก 2-4) |
| 4-8 | **Durable Objects** | free tier (SQLite) | ⏳ payoff จริงตอนมี Marketplace |
| 4-9 | **Realtime (SFU/TURN)** | 1,000 GB/เดือน | 🔴 บล็อก — รอ Marketplace (D1 + PDPA) |

**เส้นทางวิกฤต:** 1-1 → 2-4 → 3-7 (AI Gateway ปลดล็อก Workers AI ปลดล็อก Vectorize embeddings)

### 📌 ต้องทำก่อนไปต่อ (เจ้าของโปรเจกต์)
| # | สิ่งที่ต้องทำใน Cloudflare | ปลดล็อกอะไร |
| :--- | :--- | :--- |
| 1 | สร้าง AI Gateway `seertarot-ai` → ตั้ง `CF_AI_GATEWAY_ACCOUNT_ID` + `CF_AI_GATEWAY_ID` | เปิดใช้ 1-1 จริง + เป็นท่อของ Workers AI |
| 2 | Turnstile → Add widget (Managed) → `wrangler secret put TURNSTILE_SITE_KEY` + `TURNSTILE_SECRET_KEY` | เปิดใช้ 1-3 จริง |
| 3 | ซื้อโดเมน + ผูก Cloudflare | ปลดบล็อก 1-2 (Email Routing) |
| 4 | สร้าง R2 bucket `seertarot-share` | เริ่ม 3-6 ได้ |
| 5 | สร้าง Vectorize index `card-meanings` (768 dim, cosine) | เริ่ม 3-7 ได้ |

> Wave 2-4 (Workers AI) **ไม่ต้องทำอะไรเพิ่ม** — binding `AI` ทำงานเลยหลัง deploy รอบถัดไป

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

**ทำอะไร:** รับเมลที่ `@seertarot.net` (support@, จัดการ bounce ของ noreply@) — ต่อกับระบบ email auth ที่มีอยู่

**บล็อก:** ยังไม่ได้ซื้อโดเมน (ดู `docs/PENDING_SETUP.md`) — Email Routing ตั้งค่าใน dashboard ล้วน แทบไม่มีโค้ด ทำได้ทันทีที่ domain ผูกกับ Cloudflare

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

## Wave 2-5 — KV ไพ่ประจำวัน + Cron

**Spike ก่อนลงมือ:** OpenNext (`@opennextjs/cloudflare`) export `scheduled()` handler ได้ไหม — ถ้าไม่ได้ ต้องเขียน worker wrapper เอง

**งาน:**
- `kv_namespaces` เพิ่ม binding `DAILY_TAROT_KV` (แยกจาก `NEXT_INC_CACHE_KV`)
- `triggers.crons`:
  - `0 17 * * *` (= 00:00 ไทย) → สุ่มไพ่ประจำวัน (provably-fair seed จากวันที่) เขียนลง KV
  - `30 18 * * *` → ลบ auth token หมดอายุ + แถว rate-limit เก่าใน D1
- การ์ด "ไพ่ประจำวัน" บนหน้าแรกอ่านจาก KV (0ms edge) แทนสุ่มสดตอนโหลด

**หมายเหตุ:** โควตารายวัน/สัปดาห์เป็น rolling-window (`lib/entitlement/week.ts`) อยู่แล้ว → cron ไม่เกี่ยวกับการรีเซ็ตโควตา

---

## Wave 3 — R2 + Vectorize

### 3-6 R2 — Destiny Card share image
- route ใหม่ `GET /api/share/[readingId]/card.png` → render ภาพสรุปคำทำนาย (satori หรือ `@cf/` image) → เก็บ R2 (`SHARE_BUCKET`) → คืน URL
- ใส่ใน OG tag ของหน้าแชร์ → พรีวิวสวยตอนแปะ IG/FB/LINE = viral loop

### 3-7 Vectorize — ค้นหาเชิงความหมาย
- index `card-meanings` (78 ใบ) + `articles` (20 บทความ) — embed ด้วย Workers AI (3-4)
- ใช้: "ไพ่/บทความที่ใกล้เคียง", แนะนำบทความจากผลไพ่, ค้นหาในสารานุกรมแบบเข้าใจความหมาย

---

## Wave 4 — รอปลดบล็อก

- **Durable Objects:** ใช้ได้เลยสำหรับ provably-fair session state + rate-limit แม่นยำต่อผู้ใช้ แต่ payoff ใหญ่คือห้องคุยสด Marketplace → ทำพร้อม Marketplace
- **Realtime (SFU/TURN):** บล็อกเต็มตัว — รอ Marketplace ปลดบล็อก (D1 provisioning + PDPA sign-off ตาม `docs/specs/MARKETPLACE.md`)
