# การตั้งค่าขอบ Cloudflare · การคุมต้นทุน · วิธีวัด

> ตรวจกับโค้ดล่าสุด: 2026-10-26 (`scripts/cloudflare-phase1.ts` · `wrangler.jsonc` · `public/_headers` · `src/lib/security/`)
> ฉบับก่อนหน้า (รายการไอเดีย 60 ข้อ ตารางความจุ และแผน 3 เฟส) ถูกตัดออกแล้ว เพราะส่วนใหญ่ล้าสมัยหรือไม่ได้ทำ — ดูย้อนหลังได้จาก git history ของไฟล์นี้
>
> - deploy · ถอยกลับ · binding · สิทธิ์ token ➔ [`CLOUDFLARE_DEPLOYMENT_GUIDE.md`](CLOUDFLARE_DEPLOYMENT_GUIDE.md)
> - เหตุผลรายข้อของข้อเสนอ "ลด request" 12 ข้อ (2026-09-08) ➔ [`plans/HANDOFF_CF_REQUEST_REVIEW_2026-09-08.md`](plans/HANDOFF_CF_REQUEST_REVIEW_2026-09-08.md)
> - บริการฟรีของ Cloudflare ที่ใช้อยู่ (AI Gateway · Turnstile · R2 · Vectorize ฯลฯ) ➔ [`plans/CLOUDFLARE_FREE_STACK.md`](plans/CLOUDFLARE_FREE_STACK.md)

---

## 1. หลักคิด: อะไรปลุก Worker (= เสียค่าคำขอ)

```
คำขอ ➔ กฎความปลอดภัยของโซน (WAF · rate limit · บอต) ➔ แคชของโซน ➔ ไฟล์ static (assets) ➔ Worker
        บล็อกตรงนี้ = Worker ไม่ถูกปลุกเลย                        ตรงไฟล์ = ไม่ปลุก Worker    คิดเงินตรงนี้
```

- หน้าเนื้อหาทั้งหมดเป็นไฟล์ Astro ใน assets ➔ ตอบจากขอบ ไม่ปลุก Worker
- ที่ยังปลุก Worker คือรายการ `run_worker_first` ใน `wrangler.jsonc` (`/api/*` · `/admin` · `/readers` · `/r/*` · `/s/*` · `/tester` · `/reset-password` · `/_next/image*` · `sitemap.xml` · `robots.txt` · `manifest.webmanifest`)
- URL ที่ไม่มีอยู่ตอบ `404.html` จากขอบ (`not_found_handling: "404-page"`) ไม่ปลุก Worker
- ของที่ "อยู่หลัง Worker" (Cache Rules ของหน้า · Tiered Cache · Crawler Hints) ช่วยความเร็ว/แบนด์วิดท์ แต่ **ไม่ลดจำนวนคำขอที่เข้า Worker**

---

## 2. ค่าที่ตั้งอยู่

### 2.1 ที่ขอบของโซน — ตั้งด้วย `npm run cf:phase1` (กฎทุกข้อมีป้าย `[phase1]` · รันซ้ำได้)

| เรื่อง | ค่า | หมายเหตุ |
| :--- | :--- | :--- |
| Cache Rule ไฟล์ static | edge + browser 1 ปี (ภาพไพ่ · `_next/static` · ฟอนต์) | |
| Cache Rule หน้า SSG | edge TTL 7 วัน · ตัดพารามิเตอร์โฆษณาออกจาก cache key | ⚠️ เขียนบนข้อสมมติรุ่นเก่า (`src/proxy.ts` ถูกถอดแล้ว · ภาษาเป็นเส้นทาง `/en/...`) — ทบทวนก่อนรันซ้ำ (หัวไฟล์สคริปต์) · ตัดพารามิเตอร์ออกจาก cache key ทำไม่ได้บนแพ็กเกจ Free |
| WAF: URL ขยะ | `block` — `wp-*` · `.php` · `.env` · `.git` · `phpmyadmin` | |
| WAF: บอตเทรนโมเดล + สแกนเนอร์ SEO | `block` ตามชื่อ user-agent | รายชื่อต้องตรงกับ `src/app/robots.ts` (ด่าน `test-bot-policy` ตรวจ) · บอตค้นหา AI และบอตแชร์โซเชียลต้องไม่อยู่ในรายการ |
| WAF: เครื่องมือสคริปต์ที่ `/api/` | `block` — `curl` · `python-requests` · `scrapy` ฯลฯ | ยกเว้น webhook รับเงิน · งานตั้งเวลาของเราจึงต้องตั้ง User-Agent เอง (INC-0141) |
| WAF: คำขอเปลี่ยนสถานะที่ `/api/` ที่ไม่มี `Origin` ของเว็บเรา | `managed_challenge` | ยกเว้น `/api/marketplace/payments/webhook` · `/api/cron/` — เพิ่ม endpoint ที่เซิร์ฟเวอร์ภายนอกเรียก ต้องเติมข้อยกเว้นในสคริปต์ |
| Rate limit | 20 ครั้ง / 10 วินาที / IP บน `/api/reading/start` · `/api/reading/*/read` · `/api/reading/*/chat` · บล็อก 10 วินาที | แพ็กเกจ Free ได้กฎเดียวและ period 10 วินาที |
| บอต | `ai_bots_protection: block` (บอตที่ Cloudflare รับรองยังเข้าได้) · `crawler_protection` เปิด · **Bot Fight Mode ปิด** | ดูหัวข้อ 3 |
| Tiered Cache | Smart topology | |
| โปรโตคอล | HTTP/3 · 0-RTT · Early Hints | |

ตั้งบน Dashboard (ไม่อยู่ในสคริปต์): SSL/TLS = Full (Strict) · Crawler Hints เปิด (ตั้งเมื่อ 2026-09-08 ตาม [บันทึกตรวจ](plans/HANDOFF_CF_REQUEST_REVIEW_2026-09-08.md)) — ค่าบน Dashboard ปัจจุบันตรวจจาก repo ไม่ได้

กฎ www ➔ โดเมนหลัก (301) ดันขึ้นขอบทุก deploy ด้วย `npm run cf:canonical-host` (INC-0203)

### 2.2 ในโค้ด

| เรื่อง | ที่อยู่ |
| :--- | :--- |
| แคชเบราว์เซอร์ 1 ปีแบบ `immutable` ให้ภาพไพ่ + ส่วนหัวความปลอดภัยของไฟล์ static | `public/_headers` (ต้องตรงกับ `src/lib/config/security-headers.ts` · ด่าน `test-static-headers`) |
| ภาพไพ่ผ่าน ImageKit (ดึงจากเว็บเรา · `?tr=orig-true` ไม่แปลงภาพ) มีทางถอยเป็นไฟล์ในเว็บ | `src/lib/tarot/card-image.ts` · ค่า endpoint อยู่ใน `vars` ของ `wrangler.jsonc` |
| ภาพพรีวิวลิงก์แชร์ `/s/*` ผ่าน Cloudinary (ไม่ได้ตั้ง = ใช้ `og/default.png`) | `src/lib/media/cloudinary.ts` |
| เพดานถี่ข้าม isolate แบบ atomic | ตาราง D1 `edge_rate_buckets` · `consumeEdgeRateLimits()` ใน `src/lib/security/edge-ratelimit.ts` |
| เพดานงบ AI รวมทั้งระบบต่อวัน + เพดานผู้เยี่ยมชมต่อ IP/ซับเน็ต | `src/lib/security/ai-budget.ts` (ปรับด้วย env — ดู [`PENDING_SETUP.md`](PENDING_SETUP.md)) |
| เพดานโทเคน AI ต่อคนต่อวัน | `src/lib/security/cost-ledger.ts` |
| ตัวนับสถิติ: buffer ระดับ isolate แล้วเขียน D1 `stat_counters` ทีเดียว | `src/lib/stats/record.ts` |
| Upstash Redis (ไม่บังคับ): ตัวนับ/เซสชันแบบ atomic แทน KV · ไม่ตั้ง = ใช้ KV | `src/lib/platform/redis.ts` |
| แคชหน้า Next อยู่ใน static assets ไม่ใช่ KV | `open-next.config.ts` (INC-0287) |

---

## 3. ห้ามเปิด / ห้ามทำ

| อย่า | เหตุผล | ที่มา |
| :--- | :--- | :--- |
| เปิด Bot Fight Mode | ฉีดสคริปต์ตรวจบอตเข้าทุกหน้า คะแนน Lighthouse มือถือตก 25–32 จุด · ของที่กันค่าใช้จ่ายจริงอยู่ในกฎ WAF/rate limit ครบแล้ว · จะเปิดกลับต้องแนบตัวเลขทั้งสองด้าน | INC-0177 · หัวฟังก์ชัน `taskBots()` |
| เปิด Hotlink Protection | ขวาง Google Images · ภาพพรีวิวตอนแชร์ · ImageKit ที่ดึงภาพจากเว็บเรา | บันทึกตรวจ 2026-09-08 ข้อ 9 |
| บล็อก `curl` / `python` ทั้งเว็บ หรือบล็อก UA `SeerTarot-Cron/1.0` · `SeerTarot-Uptime/1.0` | งานตั้งเวลา ด่านยืนยันหลัง deploy และสคริปต์ของเราใช้ | INC-0141 |
| เปิด Under Attack Mode ค้างไว้ | ท้าทายทุกคนรวม Googlebot — ใช้เป็นปุ่มฉุกเฉินตอนถูกยิงจริงเท่านั้น | บันทึกตรวจ ข้อ 12 |
| ย้ายไป Cloudflare Pages · เพิ่มฐาน SQL ตัวที่สอง (เช่น Turso) | รื้อสถาปัตยกรรมเพื่อเงินจำนวนน้อย · มีสองที่เก็บข้อมูล = หนี้ | บันทึกตรวจ ข้อ 11 |
| กลับไปใช้ `kv-incremental-cache` | seed หน้าทั้งชุดลง KV ทุก deploy ไม่เคยลบ — เคยสะสมจนเกิน 14 GB | INC-0287 |
| เปิด `enableCacheInterception` ของ OpenNext | prefetch ของ Next 16 วนยิงไม่รู้จบ | INC-0106 |
| ตัดสินว่าบอต AI ถูกบล็อกจาก `curl -A "<ชื่อบอต>"` | Cloudflare ยืนยันบอตจาก IP — ดู Dashboard ➔ AI Crawl Control ➔ Security (Bytes Transferred / Allowed) แทน | INC-0105 |
| ใส่ `Disallow` ให้หน้าเว็บใน `robots.ts` | บอตจะไม่เห็น `noindex` · URL โผล่ใน Google แบบไม่มีคำอธิบาย | หัวไฟล์ `src/app/robots.ts` |

---

## 4. วิธีวัด

```bash
# หน้า Astro ตอบจากขอบ (มี cf-cache-status = ไม่ปลุก Worker)
curl -sSI https://seertarot.net/cards | grep -iE "cf-cache-status|cache-control"

# เส้นที่ต้องเข้า Worker (ไม่มี cf-cache-status = เข้า Worker) — ใช้หาว่าเส้นไหนต้องอยู่ใน run_worker_first
curl -sSI https://seertarot.net/readers | grep -i cf-cache-status

# ภาพไพ่ในเว็บ — ต้องมี cache-control 1 ปี
curl -sSI https://seertarot.net/cards/w256/cups-01.webp | grep -iE "cf-cache-status|cache-control"

# URL ขยะต้องถูกบล็อกที่ขอบ (403) · HTTP/3 ต้องเปิด
curl -s -o /dev/null -w '%{http_code}\n' https://seertarot.net/wp-login.php
curl -sSI https://seertarot.net/ | grep -i alt-svc
```

| อยากรู้ | ดูที่ |
| :--- | :--- |
| ค่าใช้จ่ายรายวัน | Dashboard ➔ Billing ➔ Billable Usage · ตั้งแจ้งเตือนตาม [`PENDING_SETUP.md`](PENDING_SETUP.md) หัวข้อแจ้งเตือนค่าใช้จ่าย |
| คำขอที่ถูกบล็อก/ท้าทาย | Dashboard ➔ Security ➔ Events (กรองตามกฎ `[phase1]`) |
| บอต AI เข้าได้จริงไหม | Dashboard ➔ AI Crawl Control ➔ Security |
| ข้อผิดพลาดของ Worker | Dashboard ➔ Workers & Pages ➔ `tarot-web` ➔ Logs · `npx wrangler tail` |
| จำนวนคำขอ `/api/*` ต่อการเปิดหน้า | DevTools ➔ Network ➔ Fetch/XHR (ผู้ชมที่ยังไม่ล็อกอินควรเป็น 0) |
| ความเร็วหน้า | `npm run perf:lh` · ขนาด JS ต่อเส้นทาง: ด่าน `test-bundle-budget` (`npm run test:budget`) |
| สถิติวิดีโอคอล | `npm run cf:call-stats` |
| โควตา AI / ไฟสถานะบริการ | `/admin` ➔ สุขภาพระบบ · สถิติละเอียดรายวัน |
