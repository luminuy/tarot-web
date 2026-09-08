# 🔍 ตรวจข้อเสนอ 12 ข้อ "ลด Request บน Cloudflare" (2026-09-08)

> เอกสารนี้ตอบข้อเสนอที่เจ้าของโปรเจกต์ส่งมา (ตาราง 12 ข้อ จากผู้ช่วย AI ตัวอื่น)
> **ทุกข้อสรุปในนี้วัดจาก production จริง ไม่ได้เดาจากทฤษฎี** — คำสั่งที่ใช้วัดแนบไว้ท้ายเอกสาร

---

## 0. ภาพรวมก่อนตัดสินใจ

| ตัวเลขจริง | ค่า |
|---|---|
| Worker requests (รอบบิลปัจจุบัน) | 1.1M |
| ค่าใช้จ่ายรวม | **$1.42** (Workers Standard $1.20 + CPU ms $0.22) |
| CPU เฉลี่ย/คำขอ | 8.4 ms |
| คำขอที่ปลุก Worker ต่อการเปิดหน้า | 2 (HTML + `/api/config/analytics`) — ลดจาก 7 ใน PR #356 |

**ลำดับการทำงานของ Cloudflare ที่ต้องเข้าใจก่อน** (เป็นหัวใจของการตรวจข้อเสนอนี้):

```
คำขอเข้า → DDoS/Bot → WAF → Redirect Rules → ⚡ Worker → Cache → Origin
                                              ↑ บิลตรงนี้
```

ผลที่ตามมามี 2 ข้อ และมันพลิกข้อเสนอครึ่งตาราง:

1. **อะไรที่อยู่ "ก่อน" Worker (WAF · Bot · Rate Limit) = ลดค่าบิลได้จริง** เพราะบล็อกแล้ว Worker ไม่ถูกปลุกเลย
2. **อะไรที่อยู่ "หลัง" Worker (Cache Rules · Tiered Cache · Crawler Hints) = ไม่ลด Worker invocation แม้แต่คำขอเดียว**
   มันช่วยแค่ความเร็ว/แบนด์วิดท์ ซึ่งของเราฟรีอยู่แล้ว

**ยืนยันด้วยของจริง**: ภาพไพ่ตอบ `cf-cache-status: HIT` (ไม่ผ่าน Worker · ฟรี · แคช 1 ปีจาก `public/_headers`)
ส่วน HTML **ไม่มี** header `cf-cache-status` เลย แต่มี `x-opennext-cache: HIT` — แปลว่าทุกการเปิดหน้าปลุก Worker
แล้วอ่านคำตอบจาก KV (ถูกและเร็ว แต่ยังนับเป็น 1 request เสมอ · Cache Rules เปลี่ยนข้อนี้ไม่ได้)

---

## 1. ตารางคำตัดสินรายข้อ

| # | ข้อเสนอ | คำตัดสิน | เหตุผลจากของจริง |
|---|---|---|---|
| 1 | เปลี่ยนเป็น Custom Domain | ❌ **ไม่ต้องทำ — ข้ออ้างไม่จริง** | ข้อเสนอบอกว่าจะทำให้ไฟล์ static ฟรี **แต่มันฟรีอยู่แล้ว** Workers Static Assets เสิร์ฟก่อนถึงตัว Worker (วัดแล้ว `cf-cache-status: HIT` บนภาพไพ่) การย้าย route → Custom Domain ไม่ลดคำขอสักคำขอ แถมมีความเสี่ยงเรื่อง DNS/SSL ระหว่างสลับ |
| 2 | Block AI Scrapers & Bot Fight Mode | ⚠️ **ทำครึ่งเดียว** | **Bot Fight Mode: ทำได้** ช่วยจริงเพราะทำงานก่อน Worker · **Block AI Scrapers: ห้ามเปิด** สวิตช์นี้บล็อก `OAI-SearchBot` `Claude-SearchBot` `PerplexityBot` ด้วย ซึ่ง[เจ้าของตัดสินใจไว้เมื่อ 2026-09-04](../../src/app/robots.ts) ว่า **เปิดให้คลาน** เพื่อแลกทราฟฟิกจาก AI search · เปิดสวิตช์นี้ = ลบเว็บออกจากผลค้นหาของ ChatGPT/Claude/Perplexity ทั้งหมด ขัดกับแผน GEO ของเราเอง (บอตเทรนโมเดล เช่น GPTBot/ClaudeBot/Bytespider เราบล็อกใน `robots.ts` อยู่แล้ว) |
| 3 | WAF Rate Limiting 60 req/นาที/IP | ✅ **ทำ — คุ้มที่สุดในตาราง** | ทำงานก่อน Worker = ตัดค่าบิลตรง ๆ · แต่ **ห้ามตั้ง 60** สำหรับเว็บนี้: หน้า `/spreads` โหลดภาพไพ่ 96 ใบ ผู้ใช้จริงคนเดียวยิงเกิน 60 ได้ใน 10 วินาที · ตั้ง **rate limit เฉพาะ path ที่แพง** แทน (ดูข้อ 6 ด้านล่าง) |
| 4 | บล็อก UA ขูดเว็บ (Ahrefs/Semrush/python/curl/`.env`/`wp-`) | ⚠️ **ทำแล้วบางส่วน + มีกับดัก** | วัดจริง: `/.env` และ `/wp-login.php` **ตอบ 403 จาก Cloudflare อยู่แล้ว** (managed ruleset) ไม่ต้องเขียนกฎซ้ำ · ⛔ **ห้ามบล็อก `python` / `curl` แบบเหมา** — สคริปต์ของเราเองใน `scripts/` (ส่ง URL เข้า Search Console, rebuild search index, health check) ยิงด้วย UA พวกนี้ · บล็อก Ahrefs/Semrush/PetalBot ได้ ไม่มีผลเสีย |
| 5 | Cache Rules ที่ Edge (`.webp`/`.png`/`.js`/`.css` 1 ปี) | ✅ **ทำเสร็จแล้วในโค้ด — ไม่ต้องแตะ dashboard** | [`public/_headers`](../../public/_headers) ตั้ง `max-age=31536000, immutable` ให้ `/cards/*` และ `/_next/static/*` ไปแล้ว วัดยืนยันได้ · และย้ำอีกครั้ง: ต่อให้ตั้งใน dashboard ก็ **ไม่ลด Worker invocation** เพราะไฟล์กลุ่มนี้ไม่เคยปลุก Worker ตั้งแต่แรก |
| 6 | Smart Tiered Cache | 🟡 **เปิดก็ได้ ไม่เสียหาย แต่อย่าคาดหวังเรื่องบิล** | ฟรีและไม่มีความเสี่ยง ช่วยเรื่อง latency ของผู้ใช้ต่างภูมิภาค · **ไม่ลด Worker requests** (อยู่หลัง Worker) — ตัวเลข "ลด 50–70%" ในข้อเสนอเป็นตัวเลขของ origin fetch ไม่ใช่ของบิล Workers |
| 7 | Crawler Hints | 🟡 **เปิดได้ ฟรี ผลน้อย** | ช่วยลดการคลานซ้ำของบอตที่รองรับ IndexNow (Bing/Yandex เป็นหลัก · Googlebot ไม่ใช้) 30 วินาทีก็เปิดเสร็จ ไม่มีข้อเสีย |
| 8 | SSL/TLS = Full (Strict) | ✅ **ตรวจให้ชัวร์** | ไม่เกี่ยวกับจำนวนคำขอ แต่ถ้าเผลอตั้ง Flexible จะเกิด redirect loop จริง · Workers ไม่มี origin แยกอยู่แล้ว ตั้ง Full (Strict) ปลอดภัย 100% |
| 9 | Hotlink Protection | ❌ **อย่าเปิด** | ภาพไพ่เป็น public domain 1909 การกันคนอื่นใช้ไม่ได้ประโยชน์เชิงธุรกิจ · แต่มีผลเสียจริง: บล็อก Google Images (ทราฟฟิกที่เราอยากได้) และเสี่ยงทำภาพพรีวิวตอนแชร์ (`/og/*`, R2 share images) พังกับ crawler บางตัวที่ส่ง Referer มาด้วย · แถมภาพเราฟรีอยู่แล้ว ไม่มีอะไรให้ประหยัด |
| 10 | ย้ายภาพไปใช้ ImageKit CDN | ❌ **ไม่ต้องทำ (และแผนเดิมมีเหตุผลตรงข้าม)** | ภาพไพ่ตอนนี้ = 0 Worker request + 0 ค่าแบนด์วิดท์ (Cloudflare ไม่คิด egress) ย้ายไป ImageKit คือ **เพิ่ม** จุดพังจากภายนอกโดยไม่ประหยัดอะไร — ตรงกับข้อกังวล M-03 ใน [แผนแก้ท่อสื่อ](HANDOFF_MEDIA_FIX_2026-09-06.md) ที่บอกว่า ImageKit เป็นจุดพังเดี่ยว |
| 11 | ย้ายไป Cloudflare Pages | ❌ **ห้ามทำ** | สแตกเราคือ OpenNext + Workers (`assets` binding + KV cache interception + D1/R2/Vectorize/Workers AI bindings ครบ) · Cloudflare เองแนะนำทางกลับกันคือย้าย Pages → Workers · ทำข้อนี้ = รื้อสถาปัตยกรรมทั้งระบบเพื่อประหยัดเงินที่ปัจจุบันคือ **$1.42/เดือน** |
| 12 | Under Attack Mode | 🔴 **เก็บไว้เป็นปุ่มฉุกเฉินเท่านั้น** | ขึ้นหน้า challenge กับ **ทุกคน** รวม Googlebot → หลุด index ได้ถ้าเปิดค้าง · เปิดเฉพาะตอนถูกยิงจริงเท่านั้น |

---

## 2. ปรับให้เข้ากับของเราจริง — เราทำไปแล้วเกือบหมด

โปรเจกต์นี้มีสคริปต์ [`scripts/cloudflare-phase1.ts`](../../scripts/cloudflare-phase1.ts) (`npm run cf:phase1`)
ที่ตั้งค่า Cloudflare ผ่าน API v4 อยู่แล้วตั้งแต่ PR #308 — ข้อเสนอส่วนใหญ่จึง **ไม่ใช่คำถามว่า "ควรทำไหม"
แต่คือ "ทำไปแล้ว ผลเป็นยังไง"** ตรวจ production เมื่อ 2026-09-08 ได้ผลดังนี้:

| ข้อเสนอ | สถานะจริงของเรา |
|---|---|
| Rate limiting | ✅ ทำแล้ว — 20 ครั้ง/10 วินาที บนเส้น `/api/reading/*/read` · `/chat` · `/start` (แพ็กเกจ Free เลือก period ได้แค่ 10 วินาที และตั้งได้กฎเดียว) |
| Bot Fight Mode | ✅ เปิดแล้ว (`fight_mode: true`) |
| บล็อก URL ขยะ | ✅ ทำแล้ว — `wp-*` · `.php` · `.env` · `.git` · `phpmyadmin` ตอบ 403 จาก Cloudflare (ยิงยืนยันแล้ว) |
| บล็อกเครื่องมือสคริปต์ | ✅ ทำแล้ว — `curl` · `python-requests` · `scrapy` ฯลฯ ถูกบล็อกเฉพาะบน `/api/` (ยกเว้น webhook รับเงิน) |
| Cache Rules / Tiered Cache | ✅ ทำแล้ว — และสคริปต์เองบันทึกไว้ตั้งแต่ 2026-09-06 ว่า **แคชหน้า HTML ไม่ได้** เพราะ Worker อยู่หน้า cache |
| บล็อกสแกนเนอร์ SEO | ✅ **ทำแล้ว 2026-09-08** — เพิ่มกฎ WAF ข้อที่ 3 `[phase1] บล็อกบอตเทรนโมเดล + สแกนเนอร์ SEO` (Custom rules 3/5 · Active) · ยิงตรวจแล้ว `AhrefsBot` `SemrushBot` `PetalBot` `GPTBot` = **403** ส่วน `Googlebot` `bingbot` `facebookexternalhit` `Twitterbot` `LINE` และเบราว์เซอร์ปกติ = **200** |
| Block AI Scrapers | ✅ เปิดอยู่ และ **ทำงานถูกต้อง** — บล็อกบอตเทรนโมเดลกับคำขอที่ปลอม UA ส่วนบอตค้นหา AI ตัวจริงเข้าได้ปกติ (เคยสรุปผิดว่าบล็อกหมด ดูหัวข้อ 2.1) |
| Smart Tiered Cache | ✅ **Active** — Tiered Cache Topology = Active · Smart Tiered Cache ถูกเลือกอยู่ (ยืนยันในแดชบอร์ด 2026-09-08) |
| Crawler Hints | ✅ **เปิดอยู่แล้ว** — ตรวจ `aria-checked=true` ที่ Caching ➔ Configuration (2026-09-08) ไม่ต้องแตะอะไร |
| SSL/TLS Full (Strict) | ✅ **เปลี่ยนให้แล้ว 2026-09-08** — เดิมเป็น Automatic SSL/TLS ที่กำลังรันโหมด `Full` (ไม่ใช่ Flexible จึงไม่เคยมีความเสี่ยง redirect loop) · ตอนนี้ปักเป็น `Full (Strict)` แล้ว ยิงตรวจหลังเปลี่ยน `/` · `www` · `/cards` ได้ 200 ครบ |

### 2.1 ✅ ตรวจซ้ำแล้ว: บอตค้นหา AI ไม่เคยถูกบล็อก (แก้ข้อสรุปผิด — INC-0105)

เอกสารฉบับแรกเขียนว่า Cloudflare บล็อก `OAI-SearchBot` · `Claude-SearchBot` · `PerplexityBot`
โดยอ้างผล `curl` ที่ได้ 403 — **ข้อสรุปนั้นผิด** เข้าไปดู Cloudflare Dashboard จริงแล้วพบว่า:

| หลักฐานจาก Dashboard | ความหมาย |
|---|---|
| AI Crawl Control ➔ **Claude-SearchBot: 4.22 MB · Allowed 230** ใน 24 ชม. | บอตตัวจริงคลานเข้ามาได้ปกติ ไม่เคยถูกบล็อก |
| ช่อง Unsuccessful ของ OAI-SearchBot / PerplexityBot / GPTBot = **3 / 2 / 2** | ตรงกับจำนวนครั้งที่เรายิงทดสอบด้วย UA ปลอมเองพอดี |
| Security rules ➔ **Custom rules 2/5** มีแค่ `[phase1] block junk scan paths` และ `[phase1] block script tools on /api` | เอกสาร Cloudflare ระบุว่าการบล็อก crawler ต้องสร้าง WAF custom rule เสมอ — ไม่มีข้อไหนแตะบอต AI เลย |
| เอกสาร Cloudflare: *"Unsuccessful requests may come from any rule or response error"* | ช่องนี้ไม่ได้แปลว่าถูกบล็อก |

**ความจริง**: Cloudflare ยืนยันตัวตนบอตจาก **IP** ไม่ใช่ชื่อ user-agent — 403 ที่เจอคือการบล็อก
"คำขอที่อ้างตัวเป็นบอต AI จาก IP ที่ไม่ได้รับรอง" ซึ่งเป็นพฤติกรรมที่ถูกต้อง **ไม่มีอะไรเสียหาย**

> 🛡️ **กฎถาวรจาก INC-0105**: ห้ามสรุปว่าบอตถูกบล็อกจากการยิง `curl` ด้วย UA ปลอม
> ให้ดู **AI Crawl Control ➔ Security ➔ Bytes Transferred / Allowed** ของบอตตัวนั้นเสมอ

### 2.2 สิ่งที่ยังเป็นข้อค้นพบจริงและทำไปแล้ว

- ✅ **สแกนเนอร์ SEO ไม่เคยถูกบล็อกจริง** (custom rules มีแค่ 2 ข้อ) ➔ เพิ่มกฎ WAF บล็อก
  `AhrefsBot` `SemrushBot` `PetalBot` `MJ12bot` `DotBot` `DataForSeoBot` `BLEXBot` `SeekportBot`
- ✅ **เตรียมรับการเลิกใช้สวิตช์ `ai_bots_protection` วันที่ 15 ก.ย. 2026** ➔ ใส่รายชื่อบอตเทรนโมเดล
  (ตรงกับ `robots.ts`) ลงกฎ WAF ไว้เป็นตัวบังคับใช้ระยะยาว
- ✅ **ด่านที่ 37** `scripts/qa/test-bot-policy.ts` — บังคับให้ `ai_bots_protection` เป็น `"block"` เสมอ ·
  รายชื่อสองที่ต้องตรงกัน · ห้าม `Googlebot` / `Applebot` / `facebookexternalhit` / `twitterbot` / `LINE`
  หลุดเข้าไปในรายการบล็อก (ภาพพรีวิวตอนแชร์จะกลายเป็นกล่องเปล่าทั้งเว็บ)
- ⏭️ ค่าใหม่จะมีผลเมื่อรัน `npm run cf:phase1` พร้อม `CLOUDFLARE_API_TOKEN` — **ยังไม่ได้รัน**
  ค่าบน production จึงยังเป็นของเดิมที่ทำงานถูกอยู่แล้ว (ไม่เร่งด่วน)

---

## 3. เรื่องที่ข้อเสนอไม่ได้พูดถึง แต่สำคัญกว่าทุกข้อในตาราง

ค่าใช้จ่ายรวมตอนนี้คือ **$1.42/เดือน** ซึ่งแปลว่าเรื่องนี้ยังไม่ใช่ปัญหาเชิงเงิน
ตัวเลข 1.1M requests ที่ดูน่าตกใจ ส่วนใหญ่มาจากยุคก่อน PR #356 (7 คำขอ/หน้า) — ตัวเลขรอบบิลหน้าจะบอกความจริง
**อย่าเพิ่งรื้อสถาปัตยกรรม (ข้อ 10/11) เพื่อประหยัดเงินระดับนี้** ให้ดูตัวเลขรอบถัดไปก่อนแล้วค่อยตัดสินใจ

---

## 4. วิธีวัดซ้ำ (ทำได้ทุกเมื่อ)

```bash
# HTML — ต้องเห็น x-opennext-cache: HIT แต่ "ไม่มี" cf-cache-status (= ปลุก Worker เสมอ)
curl -sSI https://seertarot.net/ | grep -iE "cache|opennext"

# ภาพไพ่ — ต้องเห็น cf-cache-status: HIT (= ไม่ปลุก Worker · ฟรี)
curl -sSI https://seertarot.net/cards/w256/cups-01.webp | grep -iE "cache"

# เส้นบอตขยะ — ต้องได้ 403 จาก Cloudflare (บล็อกก่อนถึง Worker แล้ว)
curl -sSI https://seertarot.net/.env | head -1
```

จำนวนคำขอต่อการเปิดหน้าจริง: เปิด DevTools → Network → กรอง `Fetch/XHR` → โหลดหน้าใหม่ ต้องเห็นเส้น `/api/*` **0 เส้น** สำหรับผู้ชมที่ไม่เคยล็อกอิน

> ⛔ **ห้ามใช้ `curl -A "<ชื่อบอต>"` ตัดสินว่าบอตถูกบล็อกหรือไม่** (บทเรียน INC-0105)
> Cloudflare ยืนยันตัวตนบอตจาก IP ไม่ใช่ชื่อ user-agent — คำขอปลอมจากเครื่องเราจะได้ 403 เสมอ
> ทั้งที่บอตตัวจริงเข้าได้ปกติ · ให้ดูที่ **Dashboard ➔ AI Crawl Control ➔ Security**
> คอลัมน์ Bytes Transferred / Allowed ของบอตตัวนั้นแทน
