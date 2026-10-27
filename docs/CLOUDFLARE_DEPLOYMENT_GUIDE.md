# คู่มือ Deploy และดูแลระบบบน Cloudflare

> ที่เดียวสำหรับ: เส้นทาง deploy · migration · ลิงก์ทดลอง · ถอยกลับ · สำรอง/กู้คืน D1 · งานตั้งเวลา · คำสั่งดูแลระบบ
> ตรวจกับโค้ดล่าสุด: 2026-10-26 (`wrangler.jsonc` · `.github/workflows/*.yml` · `.github/scripts/worker-smoke.sh` · `package.json`)
>
> ที่อื่นที่เกี่ยวข้อง (ไม่คัดลอกมาไว้ที่นี่):
> - ชื่อ secret / env / ค่าที่ตั้งบน Dashboard เท่านั้น ➔ [`PENDING_SETUP.md`](PENDING_SETUP.md)
> - ค่าที่ตั้งที่ขอบ Cloudflare (WAF · rate limit · บอต · แคช) และสิ่งที่ห้ามเปิด ➔ [`CLOUDFLARE_OPTIMIZATION_GUIDE.md`](CLOUDFLARE_OPTIMIZATION_GUIDE.md)
> - รันในเครื่อง / จำลอง Worker ➔ [`LOCAL_SETUP.md`](LOCAL_SETUP.md) · ภาพรวมสถาปัตยกรรม ➔ [`ARCHITECTURE.md`](ARCHITECTURE.md)

---

## 1. ระบบที่ขึ้นไปอยู่บน Cloudflare

Worker ชื่อ `tarot-web` (Next ผ่าน `@opennextjs/cloudflare`) + ไฟล์ static ของ Astro ในชุด assets เดียวกัน

**ลำดับที่ Cloudflare ตัดสินคำขอ** (ตั้งใน `assets` ของ [`wrangler.jsonc`](../wrangler.jsonc)):

1. ตรงไฟล์ใน `.open-next/assets` ➔ ตอบจากขอบ **ไม่ปลุก Worker** (หน้าเนื้อหา Astro ทั้งหมด · ภาพไพ่ · `_next/static`)
2. อยู่ใน `run_worker_first` ➔ เข้า Worker เสมอ (`/api/*` · `/sitemap.xml` · `/robots.txt` · `/manifest.webmanifest` · `/_next/image*` · `/admin*` · `/readers*` · `/r/*` · `/reset-password` · `/s/*` · `/tester*`)
3. ไม่ตรงอะไรเลย ➔ `404.html` จากขอบ (`not_found_handling: "404-page"`) ไม่ปลุก Worker

> ⚠️ เพิ่มหน้าที่ Next เรนเดอร์ (มี `page.tsx`) ต้องเติมเส้นทางใน `run_worker_first` ด้วย ไม่งั้นหน้านั้น 404 บน production
> ย้ายหน้าไป Astro แล้วต้อง **เอาออก** จากรายการ ไม่งั้น Worker แย่งเส้นนั้นคืนจากไฟล์ static (รายละเอียดในคอมเมนต์ของ `wrangler.jsonc`)

**Binding** (ที่มา: `wrangler.jsonc`)

| Binding | ชนิด | ใช้ทำอะไร |
| :--- | :--- | :--- |
| `ASSETS` | Static Assets | หน้า Astro · ภาพไพ่ · `_next/static` · แคชหน้า Next (`cdn-cgi/_next_cache` · INC-0287) |
| `APP_KV` | KV | ข้อมูลแอปคีย์ `app:*` (ตัวนับสำรอง · ธง · content override · session backstop) — namespace เดิมของ `NEXT_INC_CACHE_KV` |
| `APP_DB` | D1 `tarot-app-db` | ผู้ใช้ · สมุดดวง · สิทธิ์ · การจ่ายเงิน · Marketplace · audit · ตัวนับสถิติ |
| `AI` | Workers AI | ตัวคัดกรองความปลอดภัยชั้น 3 · embedding ของการค้นหา |
| `VECTORIZE` | Vectorize `card-meanings` | ค้นหาเชิงความหมาย (1024 มิติ · cosine) |
| `SHARE_BUCKET` | R2 `seertarot-share` | ภาพการ์ดแชร์ (ลบเองทั้ง bucket เมื่อครบ 90 วัน · ห้ามเก็บของถาวร) |
| `STUDIO_BUCKET` | R2 `seertarot-studio` | โลโก้สตูดิโอแม่หมอ `studio-logo/` (ส่วนตัว · ถาวร · ห้ามมีกฎลบ) |
| `CALL_METRICS` | Analytics Engine `seertarot_calls` | สถิติวิดีโอคอล · อ่านด้วย `npm run cf:call-stats` |
| — | R2 `seertarot-d1-backups` | ไฟล์สำรอง D1 (ไม่ผูกกับ Worker · ดูหัวข้อ 7) |

อื่น ๆ ใน `wrangler.jsonc`: `observability` เปิด (Workers Logs เก็บ 7 วัน · ตัด query string ออกจาก log) · `vars` มีค่าที่ไม่ใช่ความลับ (`NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT` · `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` · `STUDIO_PRO_PRICE_THB`)

**สิ่งที่ไม่มีใน `wrangler.jsonc` โดยตั้งใจ**

- `routes` / `custom_domain` — ผูกโดเมนบน Dashboard (รายการต้องตั้งซ้ำเมื่อย้ายบัญชี: [`PENDING_SETUP.md`](PENDING_SETUP.md) หัวข้อ "ค่าที่อยู่บน Dashboard เท่านั้น")
- `workers_dev` — ไม่ได้ประกาศ = เปิดตามค่าเริ่มต้น · โฮสต์ `*.workers.dev` ใช้กับงานตั้งเวลาและด่านยืนยันหลัง deploy (ห้ามปิด)
- `triggers.crons` — OpenNext ไม่มี `scheduled()` งานตั้งเวลาทั้งหมดจึงเป็น GitHub Actions (หัวข้อ 8)
- secret — ห้ามใส่ใน `wrangler.jsonc` (ไม่มีฟิลด์นี้ใน schema · build ล้ม) ตั้งด้วย `wrangler secret put` หรือผ่าน workflow

`open-next.config.ts`: แคชหน้าใช้ `static-assets-incremental-cache` (ห้ามกลับไปใช้ KV · INC-0287) และ `enableCacheInterception` ต้องเป็น `false` (INC-0106)

---

## 2. Deploy อัตโนมัติ (ทางหลัก)

```
เปิด PR (npm run pr:auto)
  ➔ pr.yml: build + npm run repo:verify  (required check ของ main · PR draft ไม่รัน)
  ➔ ผ่าน = auto-merge แบบ squash ➔ สั่ง deploy.yml เอง (merge ด้วย GITHUB_TOKEN ไม่ปลุก push event)
  ➔ deploy.yml: ตรวจซ้ำบน main ➔ migration ➔ deploy ➔ ยืนยัน ➔ งานหลัง deploy
```

> PR ของ dependabot ที่ยก `next` / `wrangler` / `@opennextjs/*` **ไม่ merge เอง** (INC-0285) — ต้องรัน `npm run build:worker` แล้ว `npx wrangler dev` ยิง `/api/auth/me` กับ `/readers` ให้ปกติก่อนกด merge

**ขั้นตอนใน `deploy.yml`** (concurrency group `production-deploy` เดียวกับ `rollback.yml` · ไม่ยกเลิกงานที่กำลังรัน)

| ลำดับ | ขั้น | ล้มแล้วเป็นอย่างไร |
| :-: | :--- | :--- |
| 1 | job `quality-check`: `npm ci` ➔ `npm run build` ➔ `npm run repo:verify` | ไม่ deploy |
| 2 | `npm ci --ignore-scripts` + ตรวจว่า `esbuild` · `workerd` · `sharp` ยังรันได้ | ไม่ deploy |
| 3 | `npm run db:migrate -- --remote` (D1 remote · ข้าม migration ที่ลงแล้วเอง · ถอด `--remote` = ลงแค่ฐานในเครื่อง) | ไม่ deploy |
| 4 | เตือนถ้าค่าวัดผลที่ใช้อยู่ (`NEXT_PUBLIC_GA_ID`) ยังไม่ตั้ง | เตือนอย่างเดียว |
| 4b | `npm run cf:r2-buckets` สร้าง bucket R2 ใน `wrangler.jsonc` ที่ยังไม่มี (`wrangler deploy` ล้มถ้า bucket ไม่มี) · bucket โลโก้ต้องเป็นส่วนตัว | ไม่ deploy |
| 5 | จด version id ของ Worker ที่ใช้อยู่ (`PREV_VERSION_ID`) | อ่านไม่ได้ = ไม่ถอยอัตโนมัติ |
| 6 | `npm run deploy` | ไม่ขึ้น |
| 7 | `bash .github/scripts/worker-smoke.sh` | **ถอยกลับไป `PREV_VERSION_ID` เอง** แล้ว job แดง |
| 8 | ดัน `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` จาก GitHub Secrets เข้า Worker (ไม่ได้ตั้ง = ข้าม) | แดง (โค้ดขึ้นแล้ว) |
| 9 | ล้างแคชขอบทั้งโซน (ต้องมี `CLOUDFLARE_ZONE_ID`) | แดง (โค้ดขึ้นแล้ว) |
| 10 | `npm run cf:canonical-host` ดันกฎ www ➔ โดเมนหลัก แล้วยิงจริงยืนยัน (INC-0203) | แดงเฉพาะเมื่อ www ยังตอบ 200 |
| 11 | `npm run cf:kv-prune` ลบคีย์แคชหน้า Next รุ่นเก่าใน KV | ไม่ทำให้แดง |
| 12 | `npm run cf:r2-lifecycle` ตั้งกฎ `expire-share-90d` ทั้ง bucket `seertarot-share` · ตรวจว่า `seertarot-studio` ไม่มีกฎลบ | แดง (โค้ดขึ้นแล้ว) |

**`npm run deploy`** = `bump-sw-version.ts` ➔ `build:astro` ➔ `opennextjs-cloudflare build` ➔ `merge-astro-assets.ts` (คัดลอก HTML ของ Astro ลง `.open-next/assets`) ➔ `opennextjs-cloudflare deploy` (คัดลอกแคชหน้า Next เข้า assets แล้ว `wrangler deploy`)

> ⚠️ คีย์ AI ถูกส่งเข้า Worker ทีละชื่อในขั้น 6 (`GEMINI_API_KEY` · `GROQ_API_KEY` · `OPENROUTER_API_KEY`) — เพิ่มผู้ให้บริการ AI ใหม่ต้องเติมชื่อใน `deploy.yml` ด้วย (INC-0152)

**ด่านยืนยันหลัง deploy** (`worker-smoke.sh`) ยิงเข้า `*.workers.dev` ไม่ใช่หน้าแรก เพราะหน้าแรกเป็นไฟล์ static ตอบ 200 ได้แม้ Worker ล่ม (INC-0285):
`GET /readers` ต้อง 200 และ `POST /api/cron/daily-digest` ไม่แนบรหัสต้องได้ 401/403 · ลอง 6 ครั้ง ห่าง 10 วินาที (ปรับด้วย `SMOKE_TRIES` · `SMOKE_WAIT_SECONDS` · `SMOKE_BASE_URL`)

---

## 3. Migration ของ D1

- ไฟล์อยู่ที่ `migrations/NNNN_ชื่อ.sql` · ลง production อัตโนมัติในขั้น 3 ของ `deploy.yml` **ก่อน** โค้ดใหม่ขึ้น
- ลงในเครื่อง: `npm run db:migrate` (ค่าเริ่มต้นเป็นฐานในเครื่องตั้งแต่ 2026-10-27 · ฐานจริงต้อง `-- --remote`)
- เขียนให้โค้ดรุ่นก่อนยังทำงานได้: เพิ่มคอลัมน์แบบ nullable / มีค่าเริ่มต้น · ไม่ลบหรือเปลี่ยนชื่อคอลัมน์ในรอบเดียวกับโค้ดที่เลิกใช้
- การถอย Worker **ไม่ย้อน** migration (หัวข้อ 6.3) · migration ที่เสี่ยงให้กดสำรองฐานก่อน (หัวข้อ 7)
- ลิงก์ทดลอง (หัวข้อ 5) ไม่รัน migration — กิ่งที่มี migration ใหม่ต้องรอ deploy จริง

---

## 4. Deploy ด้วยมือ (ใช้เมื่อ GitHub Actions ใช้ไม่ได้เท่านั้น)

```bash
npx wrangler login               # หรือ export CLOUDFLARE_API_TOKEN + CLOUDFLARE_ACCOUNT_ID
npm run db:migrate -- --remote   # D1 remote
npm run deploy
bash .github/scripts/worker-smoke.sh
```

> deploy ด้วยมือ **ไม่ได้** ทำขั้น 8–12 ของ `deploy.yml` ให้ (Stripe sync · ล้างแคชขอบ · กฎ www · ล้าง KV · กฎ R2)
> และคีย์ AI ต้องมีใน env ของเครื่องตอนรัน — รันซ้ำผ่าน Actions ➔ "Production Deploy" ➔ Run workflow ทันทีที่ใช้ได้

---

## 5. ลิงก์ทดลอง (preview)

| เรื่อง | รายละเอียด |
| :--- | :--- |
| สั่งอย่างไร | push คอมมิตที่ข้อความมี `[preview]` บนกิ่งที่ไม่ใช่ `main` (หรือ Run workflow `preview.yml`) |
| ได้อะไร | Worker แยกชื่อ `tarot-web-preview` บน `*.workers.dev` · กิ่งล่าสุดที่สั่งทับลิงก์เดิม |
| ข้อควรระวัง | ใช้ D1 / KV / R2 **ตัวจริง** ร่วมกับ production · ไม่มี secret ของ production (ล็อกอิน/คำอ่าน AI อาจใช้ไม่ได้) · ไม่รัน migration |
| เอาลง | Actions ➔ `preview-down.yml` ➔ Run workflow (ลบเฉพาะ Worker `tarot-web-preview` · binding ไม่ถูกลบ) |

---

## 6. เมื่อ deploy พัง — ถอยกลับ (Rollback)

`deploy.yml` ถอยให้เองเมื่อด่านยืนยันในขั้น 7 ไม่ผ่าน · หัวข้อนี้สำหรับกรณีที่ต้องถอยเอง

### 6.1 ถอยด้วยปุ่มเดียว (ทางหลัก)

1. Actions ➔ **"⏪ Rollback — ถอย Worker กลับเวอร์ชันก่อนหน้า"** ➔ Run workflow
2. `version_id` — เว้นว่าง = เวอร์ชันก่อนหน้าเวอร์ชันที่ใช้อยู่ · ถอยไกลกว่านั้นดูรายการได้จากสรุปของการรัน (ขั้น "ดูเวอร์ชันที่มีอยู่")
3. `reason` — บังคับกรอก (ใช้บันทึก incident ต่อ)
4. workflow สั่ง `wrangler rollback` แล้วรัน `worker-smoke.sh` ชุดเดียวกับหลัง deploy · ไม่ผ่าน = จบแดง ให้ระบุ `version_id` ที่เคยใช้งานได้จริง หรือเข้า Dashboard

> ⚠️ ถอยแบบเว้นว่างอาจไปตกที่โค้ดชุดที่พังเอง เพราะขั้น Stripe sync สร้างเวอร์ชันใหม่ที่ใช้โค้ดชุดเดียวกัน (INC-0285) — ถ้ารู้ version id ที่ดี ให้ระบุเสมอ

### 6.2 ถอยด้วยมือ (เมื่อ GitHub Actions ใช้ไม่ได้)

```bash
npx wrangler versions list          # ดูว่ามีเวอร์ชันอะไรบ้าง
npx wrangler deployments list       # ดูว่าเวอร์ชันไหนกำลังรับทราฟฟิก
npx wrangler rollback <version_id>  # ถอยไปเวอร์ชันที่ระบุ
bash .github/scripts/worker-smoke.sh
```

หรือ Cloudflare Dashboard ➔ Workers & Pages ➔ `tarot-web` ➔ Deployments ➔ เลือกเวอร์ชัน ➔ Rollback

### 6.3 ⚠️ สิ่งที่การถอยกลับไม่ย้อนให้

| สิ่งที่ไม่ย้อน | ผลที่ตามมา | ต้องทำอะไร |
| :--- | :--- | :--- |
| migration ของ D1 | โค้ดเก่าเจอสคีมาใหม่ | เขียน migration ย้อนกลับเอง (เพิ่มคอลัมน์แบบ nullable เสมอจะไม่เจอปัญหานี้) |
| ข้อมูลใน KV / R2 | คีย์ที่เขียนไปแล้วยังอยู่ | ลบ/แก้ด้วย `wrangler kv key delete` ถ้าจำเป็น |
| secret ของ Worker | ค่าล่าสุดยังอยู่ | ตั้งใหม่ด้วย `wrangler secret put` |
| ไฟล์ static ของ Astro | ย้อนตามเวอร์ชัน (อยู่ในชุด assets ของเวอร์ชันนั้น) | — แต่แคชขอบอาจยังถือของใหม่ ให้ล้างแคชที่ Dashboard ➔ Caching ➔ Purge Everything |

### 6.4 หลังถอยกลับ — บังคับทุกครั้ง

```bash
npm run incident -- --title "..." --severity high \
  --symptom "..." --cause "..." --fix "..." --prevention "..."
```

---

## 7. สำรองและกู้คืน D1

**สำรอง** — `.github/workflows/d1-backup.yml` เรียก `npm run cf:d1-backup` (`scripts/cf-d1-backup.ts`) ทุกวันอาทิตย์ 03:17 น. เวลาไทย

- ปลายทาง: R2 bucket ส่วนตัว `seertarot-d1-backups` ที่ `d1/tarot-app-db/<ปี>/<เดือน>/tarot-app-db-<เวลา UTC>Z.sql.gz`
- ทุกรอบ: export ทั้งฐาน ➔ โหลดลองใน SQLite + `integrity_check` ➔ gzip ➔ อัปโหลด ➔ ดาวน์โหลดกลับเทียบ SHA-256 · ไฟล์อายุเกิน 35 วัน R2 ลบเอง
- ล้ม = เปิด issue `[สำรองข้อมูลล้ม]` · รอบถัดไปสำเร็จ = ปิดเอง
- ก่อนรัน migration ที่เสี่ยง: Actions ➔ D1 Backup ➔ Run workflow

> ⚠️ ระหว่าง export ฐานไม่รับคำขออื่นชั่วครู่ (ข้อจำกัดของ D1) — อย่ากดสำรองเองช่วงคนใช้เยอะ
> ⚠️ ไฟล์สำรองมีข้อมูลส่วนบุคคล — ห้ามเปิดลิงก์สาธารณะของ bucket (สคริปต์ไม่ยอมอัปโหลดถ้าเปิด) และห้ามแนบเป็น artifact ของ GitHub

**กู้คืน** — เลือกทางตามสถานการณ์

| สถานการณ์ | ทางที่ใช้ |
| :--- | :--- |
| ฐานยังอยู่ แค่ข้อมูลเสีย/ลบผิด ภายใน 30 วัน | Time Travel: `npx wrangler d1 time-travel restore tarot-app-db --timestamp=<เวลา UTC แบบ ISO ก่อนเกิดเหตุ>` |
| ฐานถูกลบ · เกิน 30 วัน · Time Travel ใช้ไม่ได้ | กู้จากไฟล์สำรองตามขั้นด้านล่าง |

```bash
# 1. หาไฟล์ล่าสุดที่ Dashboard ➔ R2 ➔ seertarot-d1-backups ➔ d1/tarot-app-db/ แล้วดาวน์โหลด
npx wrangler r2 object get seertarot-d1-backups/d1/tarot-app-db/<ปี>/<เดือน>/<ไฟล์>.sql.gz --remote --file backup.sql.gz
gunzip backup.sql.gz

# 2. กู้ลงฐาน "ใหม่" เสมอ — ห้ามรันทับฐาน production ที่ยังมีข้อมูลอยู่
npx wrangler d1 create tarot-app-db-restore
npx wrangler d1 execute tarot-app-db-restore --remote --file backup.sql

# 3. เทียบจำนวนแถวกับตารางใน step summary ของรอบสำรองนั้น
npx wrangler d1 execute tarot-app-db-restore --remote --command "SELECT count(*) FROM users"
```

4. เปลี่ยน `database_id` ของ `APP_DB` ใน `wrangler.jsonc` เป็นฐานใหม่แล้วเปิด PR ตามปกติ
   (ไฟล์สำรองมีตาราง `d1_migrations` ติดมา `db:migrate` ตอน deploy จึงรันเฉพาะ migration ที่ใหม่กว่าไฟล์สำรอง)
5. ข้อมูลหลังเวลาสำรองหายไป — เทียบรายการจ่ายเงินกับ Stripe ช่วงนั้นด้วยมือ แล้วบันทึก incident ตามหัวข้อ 6.4
6. ⚠️ บัญชีที่ผู้ใช้สั่งลบ**หลัง**เวลาสำรองจะกลับมาในฐานที่กู้ — ระบบยังไม่มีบันทึกการลบให้ลบซ้ำอัตโนมัติ · หน้านโยบายความเป็นส่วนตัวข้อ 3 สัญญาว่าใช้สำเนาเพื่อกู้ระบบเท่านั้นและสำเนาหมดอายุใน 35 วัน (#723) — ถ้ากู้จริงต้องไล่ลบคำขอลบช่วงนั้นซ้ำ

---

## 8. งานตั้งเวลา (GitHub Actions)

เวลาใน cron เป็น UTC · GitHub อาจดีเลย์หลายนาทีถึงหลายชั่วโมง ปลายทางทุกเส้นออกแบบให้ตามงานย้อนหลังเอง

| workflow | เวลา (UTC) | ทำอะไร | ความลับที่ใช้ |
| :--- | :--- | :--- | :--- |
| `booking-reminders.yml` | ทุก 15 นาที | `POST /api/cron/booking-reminders` เตือนนัด · แจ้งเวลาว่าง · ปล่อยที่ที่หมดเวลาจ่าย | `CRON_SECRET` |
| `daily-digest.yml` | 01:00 ทุกวัน | `POST /api/cron/daily-digest` ดวงประจำวันทางอีเมล แล้ว `/api/cron/checkins` | `CRON_SECRET` |
| `push-reminders.yml` | นาทีที่ 5 ทุกชั่วโมง | `POST /api/cron/push-reminders` เตือนพิธีเช้าทาง Web Push | `CRON_SECRET` |
| `uptime.yml` | ทุก 10 นาที | เช็กหน้าแรก · `/readers` · เส้น cron (ต้อง 401/403) · โดเมนหลัก · ล่ม = เปิด issue `[เว็บล่ม]` | — |
| `d1-backup.yml` | เสาร์ 20:17 | สำรอง D1 (หัวข้อ 7) | `CLOUDFLARE_API_TOKEN` · `CLOUDFLARE_ACCOUNT_ID` |
| `seo-gsc.yml` · `seo-ga4.yml` | จันทร์ 02:07 · 02:17 | ดึงผล Search Console / GA4 รายสัปดาห์ | `GSC_SERVICE_ACCOUNT_JSON` |

- เส้น `/api/cron/*` ยิงเข้า `*.workers.dev` ไม่ใช่ `seertarot.net` โดยตั้งใจ (INC-0141 · INC-0142) และตั้ง User-Agent เอง — ห้ามเปลี่ยนกลับ ด่านใน `repo:verify` ตรวจอยู่
- บนโฮสต์ `*.workers.dev` `/api/*` อื่นถูกส่งกลับโดเมนหลัก (`redirects()` ใน `next.config.ts`) เหลือเปิดตรงแค่ `/api/cron/*` · เส้น cron ใหม่ต้องตรวจ `CRON_SECRET` เองทุกเส้น (fail-closed)
- workflow ที่กดรันเองเท่านั้น: `rollback.yml` · `preview-down.yml` · `setup-vapid.yml` · `ai-judge.yml` · `ai-probe-openrouter.yml`

---

## 9. คำสั่งดูแลระบบ

| ต้องการ | คำสั่ง / ที่ดู |
| :--- | :--- |
| ดู log สด | `npx wrangler tail` |
| ดู log/ข้อผิดพลาดย้อนหลัง 7 วัน | Dashboard ➔ Workers & Pages ➔ `tarot-web` ➔ Logs |
| รายชื่อ secret บน Worker | `npx wrangler secret list` |
| เวอร์ชัน / การ deploy | `npx wrangler versions list` · `npx wrangler deployments list` |
| สถิติวิดีโอคอล | `npm run cf:call-stats` (token ต้องมี Account Analytics · Read) |
| เช็กว่า www เด้งกลับโดเมนหลัก | `npm run cf:canonical-host -- --check` |
| ตั้งค่าขอบ (WAF · rate limit · บอต · แคช) | `npm run cf:phase1 -- --dry-run` แล้วค่อยรันจริง (ดู [`CLOUDFLARE_OPTIMIZATION_GUIDE.md`](CLOUDFLARE_OPTIMIZATION_GUIDE.md)) |
| สุขภาพบริการทั้งหมด | `/admin` ➔ สุขภาพระบบ (ดู [`ADMIN_PANEL.md`](ADMIN_PANEL.md)) |

### สิทธิ์ของ `CLOUDFLARE_API_TOKEN` ใน CI

| สิทธิ์ | ใช้ในขั้น |
| :--- | :--- |
| Account · Workers Scripts · Edit | deploy · rollback · secret put · preview |
| Account · Workers KV Storage · Edit | deploy · `cf:kv-prune` |
| Account · Workers R2 Storage · Edit | ตรวจ binding R2 ตอน deploy · `cf:r2-buckets` · `cf:r2-lifecycle` · `cf:d1-backup` |
| Account · D1 · Edit | `db:migrate` · `cf:d1-backup` |
| Zone · Cache Purge · Purge | ล้างแคชขอบหลัง deploy |
| Zone · Single Redirect · Edit | `cf:canonical-host` (ไม่มี = เตือน ถ้ากฎตั้งด้วยมือไว้แล้ว) — ไม่ใช่ "Transform Rules" (INC-0204) |

สิทธิ์ของ `cf:phase1` (Zone Settings · Cache Rules · Firewall Services · Bot Management ฯลฯ) อยู่ในหัวไฟล์ `scripts/cloudflare-phase1.ts` — ใช้ token แยกได้

---

## 10. ตรวจหลัง deploy (ด้วยมือ เมื่อเปลี่ยนของใหญ่)

ด่านอัตโนมัติยืนยันแค่ว่า Worker รันได้ · เปลี่ยนของใหญ่ให้ลองเพิ่ม:

- [ ] หน้าแรก · `/cards` · หน้าไพ่รายใบ · `/spreads` (ผัง 26 แบบ) โหลดครบ
- [ ] เปิดไพ่จริง 1 รอบ: สับ ➔ เลือก ➔ พลิก ➔ คำอ่าน AI สตรีมจบ
- [ ] ล็อกอิน Google / LINE / อีเมล ได้
- [ ] `/admin` ➔ สุขภาพระบบ ไฟเขียวครบ
- [ ] www ➔ โดเมนหลัก: `npm run cf:canonical-host -- --check`
