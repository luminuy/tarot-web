# A10-infra-data

> ผู้ตรวจ: A10 · ข้อมูล/สคีมา D1 · config โครงสร้าง (wrangler/next/open-next/astro) · CI และห่วงโซ่อุปทาน · สัญญา API แอป iOS
> ฐานโค้ด: `47efdef` · กิ่ง `claude/affectionate-davinci-4wne6s` · วันที่ 2026-10-18

## ความคืบหน้า
- [x] `migrations/` 0001–0032 — เลขต่อเนื่อง ไม่ซ้ำ ไม่ขาด · migrate ลง SQLite ผ่านครบ · ALTER ADD COLUMN รันซ้ำไม่ได้ 10 ไฟล์ (ปกติของ SQLite · ใช้ `wrangler d1 migrations apply` ซึ่งจำตาราง `d1_migrations` จึงไม่เป็นปัญหา)
- [x] SQL ใน `src/**` เทียบสคีมา — แกะ `.prepare()` ได้ 357 จุด: ผ่าน 344 · ที่ "ไม่ผ่าน" 7 จุดเป็นคอลัมน์ไดนามิกที่ตัวแกะแทนค่าไม่ได้ ไล่มือแล้วถูกทุกจุด (`call.repo` · `journal.repo` · `threads.repo` · `studio.repo` · `admin/members`) · จำนวน `?` ตรงกับอาร์กิวเมนต์ `.bind()` ครบ 308/308 จุดที่นับได้
- [x] สคีมาฐานจำลองในเครื่อง (`src/lib/platform/db.ts`) เทียบ migrations — ตาราง/คอลัมน์ตรงกันครบ (ขาดแค่ index 9 ตัว ไม่กระทบความถูกต้อง)
- [x] Foreign key / ลำดับการลบ (`cleanupExpiredTickets` · `deleteReader` · `softDeleteUser` · ทะเบียน `privacy/user-data.ts`)
- [x] `wrangler.jsonc` — binding ที่ประกาศ 6 ตัว (`ASSETS` `NEXT_INC_CACHE_KV` `APP_DB` `AI` `VECTORIZE` `SHARE_BUCKET`) ถูกใช้ครบ ไม่มีตัวที่โค้ดเรียกแต่ไม่ได้ประกาศ · `run_worker_first` ครอบทุกเส้นทาง Next (14 หน้า + sitemap/robots/manifest/_next/image) · cron ทั้ง 4 เส้นถูกยิงจาก GitHub Actions (ตั้งใจ — INC-0142)
- [x] INC-0285 (Next 16.4 ↔ OpenNext) + ยิงจริง production
- [x] `npm audit` (dev) 10 high — ไล่ทีละแพ็กเกจ
- [x] `.github/workflows/**` 15 ไฟล์ · `dependabot.yml` · `.githooks/**` · CHECKS = 94 ตรงกับเอกสาร ไม่มีด่านที่ลืมลงทะเบียน (87 ไฟล์ `test-*.ts` ลงครบ)
- [x] env/secrets — ไม่พบคีย์จริงหลุดในไฟล์ที่ track · `.env*` ที่ track มีแค่ `.env.example` (ค่าตัวอย่าง)
- [x] `mobile/` สัญญา API
- [x] `next.config.ts` · `open-next.config.ts` · `astro.config.mjs`

## ข้อค้นพบ

### 🟠 A10-01 · รหัสแลกสิทธิ์ตัวจริง `VIP3-TAROT-2026` โชว์เป็น "ตัวอย่าง" ในช่องกรอกรหัสบนหน้า `/pricing` และ `/en/pricing`
- ที่: `src/components/entitlement/RedeemCodeForm.tsx:95` (placeholder) · seed ที่ `migrations/0012_redeem_codes.sql:30` + `migrations/0013_redeem_code_hardening.sql:14-18` · `src/lib/platform/db.ts:537`
- ปัญหา: รหัสที่ seed ลง production ตั้งแต่ 0012 ยังมีชีวิต (0013 แค่รัดเป็น `max_uses = 50` · หมดอายุ 2026-12-31 · `is_active = 1` · `reason_prefix = 'purchase_redeem'` = สิทธิ์ระดับ "ลูกค้าจ่ายเงิน" ปลดผังใหญ่และปรมาจารย์ลับ) แต่ฟอร์มกรอกรหัสฝั่งผู้ใช้เขียน `placeholder="เช่น VIP3-TAROT-2026"` — รหัสตัวอย่างคือรหัสที่แลกได้จริง · แผน `HANDOFF_ADMIN_REDEEM_2026-09-12.md:273` เห็น placeholder นี้แล้วแต่ตีความว่าไม่ใช่การฮาร์ดโค้ด
- ผลกระทบ/สถานการณ์พัง: ใครเปิดหน้าราคาก็เห็นรหัส ➔ พิมพ์ตามแล้วได้ 3 เครดิตพรีเมียมฟรี (สมัครได้ฟรีไม่จำกัดบัญชี) จนครบ 50 สิทธิ์ ➔ เครดิตที่ควรขาย 150 ครั้งถูกแจกฟรี · เพดานเต็มเมื่อไรรหัสที่แอดมินตั้งใจแจกจริง (ถ้าใช้ชื่อนี้) ก็หมด · ยิ่งแย่เมื่อ crawler/บอตเก็บ HTML ไปเผยแพร่
- หลักฐาน: `curl -sS https://seertarot.net/pricing | grep -o VIP3-TAROT-2026` และ `/en/pricing` ➔ พบทั้งคู่ (ยิงจริง 2026-10-19) · `dist/pricing.html` · `dist/_astro/RedeemCodeForm.*.js` มีรหัสนี้ · เงื่อนไขแลก (`redeem.ts:169-170`) ตรวจแค่ `is_active = 1` + ยังไม่หมดอายุ + ยังไม่เต็ม ไม่มีอะไรกันรหัส seed · ⚠️ ตรวจสถานะแถวใน D1 production ไม่ได้ (ถ้าแอดมินปิดรหัสไปแล้วจากแผงแอดมิน ข้อนี้ลดเหลือ 🟡)
- แนวแก้: (1) เปลี่ยน placeholder เป็นรูปแบบที่ไม่มีอยู่จริง เช่น `SEER-XXXX-XXXX` (ทั้ง `RedeemCodeForm` และ `RedeemCodesManager.tsx:675`) (2) migration ใหม่ `UPDATE redeem_codes SET is_active = 0 WHERE code IN ('VIP3-TAROT-2026','SEER3PASS')` (3) เพิ่มด่านใน `test-redeem-code.ts`/`test-code-debt.ts`: ห้ามสตริงรหัสที่อยู่ใน migration seed โผล่ใน `src/components/**` หรือ `dist/**`
- ความมั่นใจ: ยืนยันแล้ว (หน้าเว็บจริง) · สถานะแถวใน D1 = ไล่โค้ดแล้ว

### 🟠 A10-02 · กันซ้ำ INC-0285 ยังไม่ครบ — dependabot ยังยก `@opennextjs/cloudflare` / `wrangler` / Next รุ่น patch แล้ว auto-merge + deploy ได้เอง และไม่มีด่านใดที่จับ "Worker ล้ม 1101" ก่อนหรือหลัง deploy
- ที่: `.github/dependabot.yml:18-20` · `scripts/qa/test-next-adapter-pair.ts:51,190-205` · `.github/workflows/pr.yml:197-283` (auto-merge ทุก PR ที่ไม่ใช่ draft) · `.github/workflows/deploy.yml` (ไม่มีขั้น smoke หลัง deploy)
- ปัญหา:
  1. `ignore` ใน dependabot ครอบแค่ `next` minor/major — แต่ INC-0285 เป็นปัญหา "คู่" ตัวแปลง `@opennextjs/cloudflare` (ตรึง exact `1.20.12` ใน devDependencies) ยังถูกเสนอยกทุกรุ่นและ merge อัตโนมัติ · `wrangler` (`^4.151.0`) และ next รุ่น patch ก็เช่นกัน — ทั้งสามตัวคือของที่ประกอบเป็น Worker จริง
  2. ด่าน `test-next-adapter-pair` เทียบแค่ "รุ่นใหญ่" (16 ↔ 1) + ช่วง peer ที่ตัวแปลงประกาศ ซึ่งเปิดปลายบน — `@opennextjs/cloudflare@1.20.5` ประกาศ `next: ">=15.5.24 <16 || >=16.3.3"` จึงรับ 16.4.1 ได้ ➔ **คู่ที่ทำ production ล่มใน INC-0285 ผ่านด่านนี้เขียว** และหลังเหตุการณ์ด่านนี้ไม่ได้ถูกแก้เลย (commit ล่าสุดของไฟล์คือ `d6b1ba1` ก่อน INC-0285) · 1.20.12 ก็ประกาศ `>=16.4.1` เปิดปลายเหมือนเดิม
  3. กฎถาวรของ INC-0285 ("ลอง `opennextjs-cloudflare build` + `wrangler dev` ยิง `/api/auth/me` ก่อน") เป็นขั้นตอนมือ ไม่มีใน CI · `deploy.yml` หลัง `npm run deploy` มีแค่ sync Stripe · purge cache · canonical host — ไม่มีขั้นยิงเส้นทาง Worker (`/api/auth/me` · `/readers`) แล้วถอยอัตโนมัติ ➔ INC-0285 ล่ม 36 นาที (03:24–04:00 UTC) จนคนมาเห็นเอง
- ผลกระทบ/สถานการณ์พัง: dependabot เปิด PR ยก `@opennextjs/cloudflare` 1.20.13 (หรือ next 16.4.3) ที่มีบั๊กแบบเดียวกัน ➔ บิลด์ + 94 ด่านผ่าน (พังเฉพาะตอนรันใน workerd) ➔ `pr.yml` merge ➔ `deploy.yml` ขึ้น production ➔ `/api/*` `/readers` `/admin` ตอบ 1101 ทั้งเว็บจนมีคนสังเกต (ประวัติจริง: dependabot merge แล้ว deploy วันเดียว 9 ใบเมื่อ 2026-10-18 — #684 ถึง #698)
- หลักฐาน: `git log --format='%an %s' | grep dependabot` ➔ #684 #685 #686 #688 #691 #692 #693 #696 #698 merge โดยไม่มีคนแตะ · `npm view @opennextjs/cloudflare@1.20.5 peerDependencies` ➔ `>=16.3.3` · รัน `npx tsx scripts/qa/test-next-adapter-pair.ts` ด้วยคู่ปัจจุบัน ➔ เขียว ทั้งที่ด่านไม่มีข้อไหนแยก 1.20.5 กับ 1.20.12 ออกจากกัน · ยิงจริงวันนี้ `/readers` `/api/stats/public` `/api/config/app` `/api/marketplace/readers/featured` `/api/auth/me` `/api/bootstrap` ➔ 200 ครบ (คู่ 16.4.2 + 1.20.12 ใช้งานได้จริง · ไม่มีหัว `x-powered-by`/เลขรุ่นรั่ว มีแค่ buildId ใน payload RSC ตามปกติ)
- แนวแก้: (1) `dependabot.yml` เพิ่ม `ignore` ให้ `@opennextjs/*` ทุก update-type และจัด `groups` ให้ next + `@opennextjs/cloudflare` + `wrangler` มาเป็น PR เดียว หรือให้ `pr.yml` **ไม่ auto-merge** PR ที่แตะแพ็กเกจกลุ่มนี้ (ตรวจ `package.json` diff) (2) ด่าน adapter-pair: ตรึง `PROVEN_PAIR` เป็น "รุ่นเต็มของ next + รุ่นเต็มของตัวแปลง" ที่พิสูจน์แล้ว — เปลี่ยนคู่เมื่อไรต้องแก้เลขในด่าน (บังคับให้คนลอง worker จริง) (3) `deploy.yml` เพิ่มขั้นหลัง deploy: ยิง `/api/auth/me` + `/readers` ผ่าน `*.workers.dev` 3 ครั้ง ถ้าไม่ 200 ให้ `wrangler rollback <version ก่อนหน้า>` ทันที (ใช้ version id ที่จดไว้ก่อน deploy ตามกฎ INC-0285) (4) ทางเลือก: job แยกใน PR ที่รัน `npm run build:worker` + `wrangler dev` ยิง smoke เมื่อ `package-lock.json` เปลี่ยน
- ความมั่นใจ: ยืนยันแล้ว

### 🟡 A10-03 · ขั้น "ยืนยันว่าเว็บกลับมาตอบ 200" ของ `rollback.yml` ตรวจหน้าแรกซึ่งเป็นไฟล์ static ของ Astro — มองไม่เห็นอาการ Worker ล่มแบบ INC-0285
- ที่: `.github/workflows/rollback.yml` ขั้น `🔎 ยืนยันว่าเว็บกลับมาตอบ 200` (`curl https://seertarot.net/`)
- ปัญหา: `/` ถูกตอบจากชั้น assets ที่ขอบโดยไม่ปลุก Worker (`wrangler.jsonc` `assets` + `not_found_handling: "404-page"`) · INC-0285 เองบันทึกว่า "หน้า Astro ยังปกติ" ขณะที่ `/api/*` `/readers` `/admin` ตอบ 1101
- ผลกระทบ/สถานการณ์พัง: ถอยไปเวอร์ชันที่ยังพัง (เช่นเว้น `version_id` แล้ว wrangler เลือกเวอร์ชันที่เกิดจาก `secret put` ซึ่งเป็นโค้ดชุดเดียวกับที่ล่ม — กับดักที่ INC-0285 เขียนไว้เอง) ➔ ขั้นนี้ขึ้นเขียว "เว็บกลับมาตอบ 200 แล้ว" ➔ คนสั่งถอยเข้าใจว่าจบ ทั้งที่ Worker ยังล่ม
- หลักฐาน: ยิง `curl -sSI https://seertarot.net/` เทียบ `/api/auth/me` — หน้าแรกไม่ผ่าน Worker (เส้นที่ต้องเข้า Worker มีแค่ตามรายการ `run_worker_first`) · ข้อความใน INC-0285 "หน้า Astro ยังปกติ"
- แนวแก้: ยิง `https://seertarot.net/api/auth/me` (คาด 200 + JSON `{"user":null}`) และ `/readers` แทน/เพิ่มจากหน้าแรก · ใช้สคริปต์ smoke ตัวเดียวกับข้อ A10-02 (3)
- ความมั่นใจ: ไล่โค้ดแล้ว

### 🟠 A10-04 · ห่วงโซ่อุปทาน: dependabot PR ไม่มีระยะรอ (cooldown) และ merge + deploy ขึ้น production อัตโนมัติโดยไม่มีคนดู ทั้งที่ job ตรวจ PR ถือ `GITHUB_TOKEN` สิทธิ์เขียนกว้าง
- ที่: `.github/dependabot.yml` (ไม่มี `cooldown`) · `.github/workflows/pr.yml:14-20` (สิทธิ์ระดับ workflow `contents/pull-requests/issues/statuses/checks/actions: write` ให้ทุก job รวม `pr-verification`) · `pr.yml:197-283` (merge ทุก PR ที่ผ่าน) · `deploy.yml` ขั้น `🚀 Build & Deploy` (`npm run deploy` รันโค้ดของแพ็กเกจระหว่างบิลด์ โดยมี `CLOUDFLARE_API_TOKEN` · `GEMINI_API_KEY` · `GROQ_API_KEY` · `OPENROUTER_API_KEY` อยู่ใน env)
- ปัญหา: แพ็กเกจใดถูกยึดแล้วปล่อยรุ่นใหม่ (เหตุการณ์แบบ npm worm ปี 2025 ที่ขโมยโทเคน CI) ➔ dependabot เปิด PR ภายในรอบสัปดาห์ ➔ `npm ci` รัน lifecycle script ของรุ่นนั้นใน job ที่มี token สิทธิ์เขียน (checkout เก็บ token ไว้ใน `.git/config`) ➔ ถ้ามัลแวร์เงียบพอ ด่านผ่าน ➔ merge อัตโนมัติ ➔ `deploy.yml` รันโค้ดของแพ็กเกจนั้นตอน `opennextjs-cloudflare build` พร้อมคีย์ Cloudflare/AI · ด้วย `checks: write` + `contents: write` + `actions: write` ใน job ตรวจ PR สคริปต์ติดตั้งยังสร้าง check run ชื่อเดียวกับ required check บน commit ไหนก็ได้ แล้วสั่ง `deploy.yml` (workflow_dispatch) ได้เอง
- ผลกระทบ/สถานการณ์พัง: คีย์ Cloudflare (Workers/KV/D1:Edit/R2/Cache Purge) และคีย์ AI หลุด หรือโค้ดแปลกปลอมขึ้น production โดยไม่มีมนุษย์อยู่ในวง — ต้องมีการยึดแพ็กเกจต้นทางก่อน (จึงเป็น 🟠 ไม่ใช่ 🔴)
- หลักฐาน: dependabot merge 9 ใบในวันเดียว (2026-10-18) โดยไม่มีคนรีวิว · `dependabot.yml` ไม่มี `cooldown` · `pr.yml` ไม่ได้แยกสิทธิ์รายงาน job — `pr-verification` ต้องการแค่อ่านโค้ด + ติดป้าย/คอมเมนต์ (`pull-requests: write`) เท่านั้น · ส่วนที่ดีแล้ว: ทุก action ตรึงด้วย SHA · ใช้ `pull_request` ไม่ใช่ `pull_request_target` · `${{ github.event.* }}` อยู่แค่ใน `run-name`/`with:` ไม่อยู่ใน `run:` (ไม่มี script injection) · `npm ci` บังคับ lockfile
- แนวแก้: (1) `dependabot.yml` เพิ่ม `cooldown: { default-days: 7 }` (2) ย้าย `permissions` ไประดับ job: `pr-verification` = `contents: read` + `pull-requests: write` + `issues: write` · เขียนเฉพาะ `auto-merge` · `actions/checkout` ใส่ `persist-credentials: false` (3) ให้ PR จาก `dependabot[bot]` ต้องมีคนกดอนุมัติ (หรืออย่างน้อยไม่ auto-merge แพ็กเกจที่อยู่ใน runtime/build ของ Worker) (4) ขั้น `npm ci` ใน `deploy.yml` ใช้ `--ignore-scripts` ถ้าไม่มีแพ็กเกจที่ต้องใช้ postinstall (ต้องลองว่า `sharp`/`@ast-grep/napi`/`workerd` ยังทำงาน)
- ความมั่นใจ: ไล่โค้ดแล้ว

### 🟡 A10-05 · `npm audit` (รวม dev) 10 high ทั้งหมดเป็นเครื่องมือตอนบิลด์/lint — ไม่มีตัวไหนอยู่ใน Worker · แต่ "ทางแก้" ที่ npm เสนอจะพา INC-0285 กลับมา
- ที่: `package.json` (`@opennextjs/cloudflare` `1.20.12` · `@next/eslint-plugin-next` `16.4.1` · `astro` `7.3.8` · `eslint`)
- ปัญหา (รายแพ็กเกจ):
  - `glob@10.3.3` (CLI `-c` command injection) ← `@node-minify/core@9.0.2` ← `@opennextjs/aws@4.1.11` ← `@opennextjs/cloudflare` · ใช้ตอน `opennextjs-cloudflare build` ผ่าน API ไม่ใช่ CLI ➔ ไม่เข้าเงื่อนไขช่องโหว่ และไม่ถูกบันเดิลเข้า `worker.js`
  - `brace-expansion@2.1.7` / `@5.0.9` (DoS) ← `minimatch` ของ glob ข้างบน และของ `eslint` ➔ บิลด์/lint เท่านั้น
  - `braces`/`micromatch`/`fast-glob` ← `@next/eslint-plugin-next` ➔ lint เท่านั้น
  - `http-cache-semantics@4.2.0` (cross-user cache) ← `astro@7.3.8` (`astro/dist/assets/build/remote.js` — แคชภาพระยะไกลตอนบิลด์) · `astro.config.mjs` เป็น `output: "static"` ไม่มี adapter ➔ ไม่มี runtime ของ Astro บน Worker · ไม่เกี่ยวกับแคช KV ของ OpenNext
  - `@opennextjs/aws` / `@opennextjs/cloudflare` / `@node-minify/core` ถูกนับเพราะลากตัวข้างบนมา
- ผลกระทบ/สถานการณ์พัง: ความเสี่ยงต่อผู้ใช้ ≈ 0 (`npm audit --omit=dev` = 0) · ความเสี่ยงจริงคือคนรัน `npm audit fix --force` ซึ่งจะ **ถอย `@opennextjs/cloudflare` ไป 1.20.9** (peer `next >=16.3.8` · ยังไม่ฝัง `preview-props.json` ที่ 1.20.12 แก้) ➔ คู่กับ next 16.4.2 = INC-0285 ซ้ำ
- หลักฐาน: `npm ls http-cache-semantics brace-expansion glob braces` · `npm view @opennextjs/cloudflare@1.20.9 peerDependencies` · คำอธิบาย commit `09d8e81`
- แนวแก้: `npm audit fix` (ไม่ใส่ `--force`) แก้ `http-cache-semantics` (4.3.0) + `brace-expansion` ได้เองโดยไม่แตะคู่ next/OpenNext · `glob@10` ใต้ `@node-minify/core` ใช้ `overrides` (`"@node-minify/core": { "glob": "^10.5.0" }`) หรือรอ OpenNext รุ่นถัดไป · เขียนเตือนในหัว `test-next-adapter-pair.ts`/`PENDING_SETUP` ว่าห้าม `audit fix --force`
- ความมั่นใจ: ไล่โค้ดแล้ว

### 🟡 A10-06 · `deleteReader` ไม่ลบ `ai_screening` ของตั๋วแม่หมอคนนั้น — แถวที่มี "คำถามเต็มของลูกค้า" ค้างถาวร และ `cleanupExpiredTickets` ก็ตามลบไม่ได้อีกแล้ว
- ที่: `src/lib/marketplace/readers.repo.ts:325-374` · คู่กับ `src/lib/marketplace/queue.repo.ts:466-469` · `src/lib/marketplace/screening.ts:121-137`
- ปัญหา: `ai_screening.brief` เก็บคำถามลูกค้าทั้งประโยค (`ลูกดวงสอบถามในหมวด [...]: "<คำถาม>"` + ไพ่ที่เปิดได้) · `ai_screening.ticket_id` ไม่มี FK · `deleteReader` ลบ `queue_tickets` ของแม่หมอทิ้งแต่ไม่ลบ `ai_screening` ที่ผูกตั๋วเหล่านั้น · ส่วน `cleanupExpiredTickets` ลบ `ai_screening` ด้วย `WHERE ticket_id IN (SELECT id FROM queue_tickets WHERE expires_at < ?)` — ตั๋วหายไปแล้ว แถวพวกนี้จึงไม่มีทางถูกเก็บกวาดอีก
- ผลกระทบ/สถานการณ์พัง: แอดมินลบแม่หมอ (เช่นแม่หมอขอลาออก/ถูกถอด) ➔ คำถามของลูกค้าทุกคนที่เคยจองแม่หมอคนนั้น (อาจเป็นข้อมูลอ่อนไหว ม.26) ค้างในฐานข้อมูลตลอดไป โดยไม่มีตั๋ว/ผู้ใช้ให้ไล่ขอลบหรือส่งออก (A2-01 ครอบเรื่องตั๋ว ไม่ครอบแถวกำพร้านี้)
- หลักฐาน: `grep -n "ai_screening" src/lib/marketplace/readers.repo.ts` ➔ ไม่พบ · `PRAGMA foreign_key_list(ai_screening)` ➔ ว่าง
- แนวแก้: ใน `deleteReader` ก่อนลบตั๋ว: `UPDATE queue_tickets SET ai_screen_id = NULL WHERE reader_id = ?` แล้ว `DELETE FROM ai_screening WHERE ticket_id IN (SELECT id FROM queue_tickets WHERE reader_id = ?)` · เพิ่ม `DELETE FROM ai_screening WHERE ticket_id IS NOT NULL AND ticket_id NOT IN (SELECT id FROM queue_tickets)` ในงานเก็บกวาด (ล้างของที่ค้างแล้ว) · ถ้าแก้ตาม A2-01 ให้รวมไว้ชุดเดียวกัน
- ความมั่นใจ: ไล่โค้ดแล้ว
