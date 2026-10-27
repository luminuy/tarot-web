# ทะเบียนบั๊กที่ยังเปิดอยู่ (Known Issues)

> ไฟล์นี้เก็บ **เฉพาะเรื่องที่ยังไม่ได้แก้** และยืนยันแล้วว่ามีจริง — อ่านก่อนเริ่มงาน กันแก้ซ้ำกับ Agent อื่น
> เรื่องที่ปิดแล้วอยู่ใน [`docs/archive/KNOWN_ISSUES_CLOSED.md`](archive/KNOWN_ISSUES_CLOSED.md) · บทเรียนและกฎป้องกันถาวรอยู่ใน [`docs/INCIDENT_LOG.md`](INCIDENT_LOG.md)
> เพิ่มเรื่องใหม่ใช้เลข `ISSUE-NNN` ตัวถัดไป (**ว่างตัวถัดไป: ISSUE-063** · ห้ามใช้เลขซ้ำ) · ปิดเรื่องเมื่อไหร่ ให้ย้ายหัวข้อทั้งก้อนไปคลังในรูป `### ISSUE-NNN · ชื่อเรื่อง — ปิด YYYY-MM-DD` พร้อมเลข PR/INC ที่ปิด แล้วลบแถวในตารางข้างล่าง

**อัปเดตล่าสุด: 2026-10-26** — ทุกข้อในไฟล์นี้ตรวจกับโค้ด · `git log origin/main` · GitHub API ในวันนั้น (เอกสารเป็นแค่ปากทาง ไม่ใช่หลักฐาน — INC-0229)

## สรุปเรื่องที่ยังเปิด

| เลข | เรื่อง | ระดับ | ด้าน | สถานะ | ต้องใช้เจ้าของ |
| :-- | :--- | :-- | :-- | :--- | :-: |
| ISSUE-061 | INP ผู้ใช้จริง 215 ms (CrUX มือถือ) — ตัวเดียวที่ทำ Core Web Vitals ตก · ยังไม่รู้ตัวการ | กลาง | ประสิทธิภาพ | รอข้อมูลตัวเก็บ INP ~1 สัปดาห์ (`npm run cf:inp-stats`) | ไม่ |
| ISSUE-062 | PerplexityBot โดน 403 ที่ Cloudflare ทั้งที่ `robots.txt` อนุญาต | กลาง | SEO · Cloudflare | รอเจ้าของดูแดชบอร์ด | ใช่ |
| ISSUE-053 | อัปเกรด TypeScript 7 ยังทำไม่ได้ (`typescript-eslint` ตรึง peer `<6.1.0`) | ต่ำ | เครื่องมือ · dependency | รอต้นทาง · มีทางเลี่ยงใน PR #721 (draft) | ไม่ |
| ISSUE-048 | ฟอนต์ยังไม่มี `unicode-range` — หน้า `/en` โหลดอักษรไทยที่ไม่ได้ใช้ | ต่ำ | ประสิทธิภาพ | ตั้งใจเลื่อน | ไม่ |
| ISSUE-004 | รัน Worker ในเครื่อง (`preview:worker` / `wrangler dev`) บน macOS ต่ำกว่า 13.5 ไม่ได้ | ต่ำ | เครื่องมือพัฒนา | ข้อจำกัดเครื่อง | ใช่ |

---

## ISSUE-061 · INP ผู้ใช้จริง 215 ms — ต้องรู้ตัวการก่อนแก้

- **อาการ**: PSI มือถือหน้าแรก 75 · CrUX: LCP 1.4 วิ ผ่าน แต่ **INP 215 ms** ตัวเดียวที่ทำ Core Web Vitals ตก (พบ 2026-10-26) · FCP/LCP ในแล็บแก้แล้ว (WORK_LOG รอบ 313 · หน้าแรกไม่พรีโหลดฟอนต์ตัวหนา)
- **ที่วัดได้แล้ว**: แตะปุ่มหน้าแรกที่ CPU ×4 = 150–470 ms ส่วนใหญ่เป็น presentation delay (Commit/Raster) · 134 เลเยอร์ (66 จากอนิเมชันผูกการเลื่อนที่เจ้าของสั่ง) · ปิดอนิเมชันทั้งหมดลดได้แค่ ~20% · forced reflow ใน `ui2-home` (~42 ms) แก้แล้วรอบ 315 แต่ INP ในแล็บแทบไม่ขยับ = ไม่ใช่ตัวการหลัก · แตะ FAQ/ปุ่มท้ายเว็บช้าเพราะรอคิว 104–369 ms
- **ทำไมยังไม่แก้**: ตัดอนิเมชันที่เจ้าของสั่ง = เปลี่ยนหน้าตาแลกผลแค่ ~20% · เดาไม่ได้ว่าผู้ใช้จริงแตะอะไร
- **ทางที่รอข้อมูล**: `.ui2-wrap.ui2-sheet` มีสองอนิเมชันบนชิ้นเดียว (`ui2-grow` + `ui2-sec-out`) ➔ Chrome ไม่ส่งให้ compositor · รวมเป็นอนิเมชันเดียวด้วย keyframe ช่วงไทม์ไลน์ได้ แต่ต้องลองบน Safari 26 ก่อน (งบ DOM หน้าแรก 1,487/1,500 เพิ่ม element ห่อไม่ได้) · ภาพริบบิ้น AVIF เล็กกว่า WebP 47% แต่ `<img>` เดี่ยวพังบน iOS ≤ 15 และ `<picture>` เกินงบ DOM — ภาพ lazy ใต้จอแรก ไม่กระทบ LCP
- **ขั้นต่อไป**: ~1 สัปดาห์หลังตัวเก็บ INP (`src/lib/observability/inp-reporter.ts` · PR #724) ขึ้น production รัน `npm run cf:inp-stats` ดูหน้า · element · ช่วงเวลา · ระดับเอฟเฟกต์ · ชนิดเครื่อง แล้วแก้ตามตัวการจริง

## ISSUE-062 · PerplexityBot โดน 403 ที่ Cloudflare

- **อาการ**: คำขอที่ใช้ user-agent ของ PerplexityBot ได้ 403 จากชั้น Cloudflare ส่วนเบราว์เซอร์ปกติได้ 200 ทั้งที่ `src/app/robots.ts` เปิดให้ PerplexityBot (`Allow: /`) ตามมติเจ้าของใน ISSUE-019 (เปิดรับบอตค้นหาของ AI ที่ลิงก์กลับมาหาเรา)
- **ผลกระทบ**: Perplexity ดึงหน้าเว็บไปอ้างอิงไม่ได้ — เสียทราฟฟิกจาก AI search ที่ตั้งใจเปิดรับไว้
- **ทำไมยังไม่แก้**: ต้นเหตุอยู่นอกโค้ด อยู่ในการตั้งค่า Cloudflare ซึ่งเจ้าของเป็นคนเข้าแดชบอร์ด · พบในรอบตรวจ 2026-10-18 ข้อ B3-08
- **ข้อจำกัดของหลักฐาน**: ยิงทดสอบจากเครื่องที่ไม่ใช่ IP ของ Perplexity — Cloudflare อาจบล็อกเฉพาะ "บอตปลอม UA" ก็ได้ ต้องดูคำขอของบอตตัวจริงใน Security › Events ถึงจะสรุปได้
- **ขั้นต่อไป**: เจ้าของเปิด Security › Events กรอง user-agent `PerplexityBot` ➔ ถ้าบอตตัวจริง (verified) โดนบล็อก ให้ดูว่ากฎหรือสวิตช์ไหนบล็อก แล้วเปิดข้อยกเว้นเฉพาะบอต AI search · จุดที่ควรดูก่อนคือสวิตช์บล็อกบอต AI ระดับโซน (ประวัติใน ISSUE-047 บันทึกว่าเปิด `ai_bots_protection=block` ไว้) · ห้ามเปิดให้บอตเทรนโมเดล (`GPTBot` · `ClaudeBot` ฯลฯ ยังต้องปิดตาม ISSUE-019)
- **หลักฐาน (2026-10-26)**: `curl -A "<UA ของ PerplexityBot>" https://seertarot.net/cards` ➔ 403 · UA เบราว์เซอร์ ➔ 200 · `https://seertarot.net/robots.txt` มี `User-Agent: PerplexityBot` + `Allow: /` · ที่มา: [`docs/plans/AUDIT_2026-10-18.md`](plans/AUDIT_2026-10-18.md) (บรรทัดสถานะ) · `docs/WORK_LOG.md` รอบ 309

## ISSUE-053 · อัปเกรด TypeScript 7 ยังทำไม่ได้

- **อาการ**: ยก `typescript` เป็น 7 ไม่ได้ เพราะ `typescript-eslint` ประกาศ peer `typescript ">=4.8.4 <6.1.0"` ➔ `npm ci` ตกด้วย ERESOLVE ตั้งแต่ขั้นติดตั้ง
- **ผลกระทบ**: ไม่กระทบผู้ใช้ · เสียแค่ความเร็ว typecheck ของ TS 7
- **ทำไมยังไม่แก้**: รอต้นทาง — ดัน `--legacy-peer-deps` ได้ แต่กฎ lint ที่อ่านชนิดข้อมูลจะเพี้ยนเงียบ ๆ จึงปิด PR #544 ไป (2026-09-21 · ตอนนั้นวัดว่าโค้ดเราผ่าน `tsc` 7.0.2 แบบ 0 errors)
- **กำลังทำ**: PR #721 (draft · ยังไม่ merge) ติดตั้ง TS 7.0.2 ใต้ชื่อแฝง `typescript-native` ให้ `npm run typecheck` ใช้ ส่วน `typescript` ตัวหลักคงรุ่น 6 ให้ lint/Next/Astro — ถ้า #721 merge ให้ย้ายข้อนี้ไปคลังแล้วจดงานต่อไว้ในคลังด้วย
- **ขั้นต่อไป**: เมื่อ `typescript-eslint` ออกรุ่นที่รองรับ TS 7 ให้ยก `typescript` กับ `typescript-eslint` พร้อมกัน (และถอดชื่อแฝงถ้า #721 merge ไปแล้ว)
- **หลักฐาน (2026-10-26)**: `package.json` — `typescript ~6.0.3` (ติดตั้งจริง 6.0.3) · `typescript-eslint ^8.71.2` · `npm view typescript-eslint@latest` = 8.72.0 ยังตรึง `<6.1.0` · `npm view typescript dist-tags` → `latest` 7.0.2 · `docs/WORK_LOG.md` บันทึกการปิด PR #544

## ISSUE-048 · ฟอนต์ยังไม่มี `unicode-range` (ข้อ T-24)

> เลข 048 ถูกใช้ซ้ำสองเรื่องในอดีต — อีกเรื่อง (หน้า `/cards` · ปิด 2026-09-15) และข้อ T-23 · T-25 ของชุดนี้ปิดแล้ว ดูในคลัง

- **อาการ**: `@font-face` ใน `src/app/globals.css` ไม่มี `unicode-range` และไฟล์ฟอนต์ไทยเป็นไฟล์รวมไทย+ละติน ➔ หน้า `/en` ก็พรีโหลดฟอนต์ที่มีอักษรไทยทั้งบล็อก (`FONT_PRELOADS` = `anuphan-500` + `sarabun-400` · 36,068 B ใน `src/app/_shared/root-metadata.ts`)
- **ผลกระทบ**: ต่ำ — ยังอยู่ในงบฟอนต์พรีโหลด `MAX_PRELOADED_FONT_BYTES` 40,000 B ของ `scripts/qa/test-bundle-budget.ts`
- **ทำไมยังไม่แก้**: ต้องแยกไฟล์ `.woff2` เป็นชุดไทยกับชุดละตินจริงก่อน — `scripts/subset-fonts.py` (`npm run fonts:subset`) ตอนนี้สร้างไฟล์รวมไทย+ละติน และต้องใช้ `fonttools` + `brotli` ซึ่งไม่มีในสภาพแวดล้อมที่ตรวจ · **ทำครึ่งทางไม่ได้**: ประกาศ `unicode-range` โดยไม่แยกไฟล์ = หน้า `/en` ไม่มีฟอนต์ละตินใช้
- **ขั้นต่อไป**: บนเครื่องที่มี `fonttools` — เพิ่มโหมดแยกไทย/ละตินใน `scripts/subset-fonts.py` ➔ สร้างไฟล์ใหม่ ➔ แก้ `@font-face` · `FONT_PRELOADS` / `FONT_PRELOADS_LOW` · `public/_headers` แล้ว commit พร้อมกันในครั้งเดียว
- **หลักฐาน (2026-10-26)**: ค้น `unicode-range` ใน `src/` · `astro/` · `public/` ไม่เจอเลย · `python3 -c "import fontTools"` ➔ ModuleNotFoundError · เหตุผลเดิมอยู่ในหัวไฟล์ `scripts/qa/test-bundle-budget.ts`

## ISSUE-004 · รัน Worker ในเครื่องบน macOS ต่ำกว่า 13.5 ไม่ได้

- **อาการ**: `npm run preview:worker` / `npx wrangler dev` ล้มด้วย `Unsupported macOS version ... minimum requirement is macOS 13.5.0` — บันทึกครั้งล่าสุดว่าเครื่องที่ใช้เป็น macOS 12.6 (`docs/WORK_LOG.md` รอบ 63 · 2026-09-14)
- **ผลกระทบ**: เครื่องนั้นทดสอบพฤติกรรมฝั่ง Worker ไม่ได้ · สำคัญตอน PR ของ dependabot แตะ `next` / `wrangler` / `@opennextjs/*` ซึ่ง `pr.yml` ไม่ auto-merge และให้คนลอง `npm run build:worker` + `npx wrangler dev` ก่อนกด merge (INC-0285)
- **ทำไมยังไม่แก้**: เป็นข้อจำกัดของเครื่อง ไม่ใช่ของโค้ด · ยืนยันจากที่นี่ไม่ได้ว่าเครื่องเจ้าของยังเป็น macOS 12.6 อยู่หรือไม่
- **ทางเลี่ยง**: ใช้เครื่อง Linux / DevContainer / เซสชัน Claude Code บนคลาวด์ (ตัว `workerd` ของ Linux รันได้) · งานฝั่ง Next อย่างเดียวใช้ `npm run dev` ได้ตามปกติ
- **ขั้นต่อไป**: เจ้าของอัปเกรด macOS เป็น 13.5 ขึ้นไป หรือยืนยันว่าเลิกใช้เครื่องนั้นแล้ว ➔ ปิดข้อนี้
- **หลักฐาน (2026-10-26)**: `node_modules/wrangler/wrangler-dist/cli.js` มี `MINIMUM_MACOS_VERSION = "13.5.0"` (wrangler 4.151) · `node_modules/.bin/workerd --version` บน Linux ➔ `workerd 2026-10-12` · ส่วนเดิมเรื่อง `.claude/launch.json` ใช้ path สัมพัทธ์ไม่มีแล้ว (ตอนนี้สั่ง `npm run dev` / `npm run dev:astro`)

---

## ปิดแล้ว

เรื่องที่ปิดแล้วทั้งหมด (ISSUE-001 ถึง 060 ยกเว้น 004 · 048 ข้อ T-24 · 053) พร้อมข้อความ ณ วันที่ปิด อยู่ใน [`docs/archive/KNOWN_ISSUES_CLOSED.md`](archive/KNOWN_ISSUES_CLOSED.md)
