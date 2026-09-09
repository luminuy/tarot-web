# 🔮 คู่มือแม่บทวิศวกรรม (AI Operating Guidelines)

เว็บดูดวงไพ่ทาโรต์ออนไลน์พรีเมียม (Interactive Provably-Fair Tarot Web)

> 💬 **สไตล์การตอบแชท**: ตอบสั้น กระชับ ได้ใจความ ไม่ต้องอธิบายยืดยาว (คำสั่งจากเจ้าของโปรเจกต์)

> ⚠️ **ก่อนแก้โค้ด ต้องอ่าน 4 ไฟล์นี้เสมอ**
> 1. [docs/INDEX.md](docs/INDEX.md) — ศูนย์รวมสารบรรณและแผนที่เอกสารทั้งหมด
> 2. [docs/INCIDENT_LOG.md](docs/INCIDENT_LOG.md) — บทเรียนความผิดพลาด + กฎป้องกันถาวร **ทำผิดซ้ำ = บกพร่องร้ายแรงสุด**
> 3. [docs/KNOWN_ISSUES.md](docs/KNOWN_ISSUES.md) — บั๊กค้าง กันแก้ซ้ำกับ Agent อื่น
> 4. [docs/AI_COLLABORATION_GUIDELINES.md](docs/AI_COLLABORATION_GUIDELINES.md) — คู่มือแม่บท (หัวข้อ 0 = มาตรฐานบังคับ)

---

## 🧭 ดัชนีเอกสาร (Documentation Index & Sitemap)

| ไฟล์ | เนื้อหา |
|---|---|
| [docs/INDEX.md](docs/INDEX.md) | 🌟 แผนที่นำทางเอกสารทั้งหมดและคำแนะนำการอ่านตามบทบาท |
| [docs/INCIDENT_LOG.md](docs/INCIDENT_LOG.md) | บทเรียนความผิดพลาด (INC-0001 เป็นต้นไป) — อ่านก่อนเสมอ |
| [docs/KNOWN_ISSUES.md](docs/KNOWN_ISSUES.md) | บั๊กค้าง/สถานะระบบ (อัปเดตล่าสุด 2026-09-02) |
| [docs/WORK_LOG.md](docs/WORK_LOG.md) | ประวัติงานที่ทำ — **ต้องอัปเดตทุกครั้ง** |
| [docs/SEO_INDEXING_LOG.md](docs/SEO_INDEXING_LOG.md) | ทะเบียนส่ง URL เข้า Google Search Console — **ต้องจดทุกครั้งที่ส่ง** ไม่งั้นรอบหน้าจะยิงซ้ำเปลืองโควตา |
| [docs/AI_COLLABORATION_GUIDELINES.md](docs/AI_COLLABORATION_GUIDELINES.md) | กฎการทำงานร่วมกัน, แบ่ง Domain, ดีไซน์ |
| [docs/CLOUDFLARE_DEPLOYMENT_GUIDE.md](docs/CLOUDFLARE_DEPLOYMENT_GUIDE.md) | ขั้นตอน deploy ขึ้น Cloudflare Workers & Custom Domain |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | สถาปัตยกรรมระดับองค์กร + Provably Fair Flow |
| [docs/ADMIN_PANEL.md](docs/ADMIN_PANEL.md) | แผงแอดมิน `/admin` พร้อมตรวจสุขภาพระบบ Cloud Health |
| [docs/PENDING_SETUP.md](docs/PENDING_SETUP.md) | ทะเบียนการตั้งค่าและ Secrets บน Production (ครบ 100%) |
| [docs/specs/INTERACTIVE_CARD_PICKING.md](docs/specs/INTERACTIVE_CARD_PICKING.md) | ระบบจับไพ่ด้วยตนเอง 3D |
| [docs/specs/MARKETPLACE.md](docs/specs/MARKETPLACE.md) | สเปกระบบ Marketplace แม่หมอตัวจริง |
| [docs/specs/ENTITLEMENT_ABUSE_MODEL.md](docs/specs/ENTITLEMENT_ABUSE_MODEL.md) | ระบบกันโกงสิทธิ์ฟรี — threat model |
| [docs/plans/ENTITLEMENT_PLAN.md](docs/plans/ENTITLEMENT_PLAN.md) | แผนพัฒนาระบบสมาชิกและโควตาเปิดไพ่ |
| [docs/plans/MASTER_PLAN_2026-09-06.md](docs/plans/MASTER_PLAN_2026-09-06.md) | 🗺️ **แผนแม่บทรวม — เริ่มอ่านที่นี่** · ทุกงานที่ค้างอยู่ในตารางเดียว (ใคร · ขนาด · สถานะ · ติดอะไร) พร้อมลิงก์ไปแผนย่อยทุกฉบับ และ 3 เรื่องที่รอเจ้าของเคาะ |
| [docs/plans/HANDOFF_BUNDLE_DIET_2026-09-07.md](docs/plans/HANDOFF_BUNDLE_DIET_2026-09-07.md) | ⚡ **แผนส่งต่อ — ลดน้ำหนัก JS รอบสุดท้าย** · เหลือของหนัก 3 ก้อน (motion 40KB · ข้อมูลผัง 17KB · พจนานุกรม 4KB) ทุกก้อนเป็นบั๊กแบบ P-01 · พร้อมข้อค้นพบว่าตัวเลขเดิมสูงเกินจริง 39KB เพราะนับ polyfills ที่ `noModule` |
| [docs/plans/HANDOFF_EN_TRANSLATION_2026-09-06.md](docs/plans/HANDOFF_EN_TRANSLATION_2026-09-06.md) | 🌏 **แผนส่งงานแปลไทย → อังกฤษ (ขั้น C)** — 318 หน่วยข้อความ · 8,848 คำ · อภิธานศัพท์บังคับ · เพดานความยาว · เกณฑ์รับงาน · ไฟล์ส่งทีมแปลสร้างด้วย `npm run i18n:export` |
| [docs/plans/AGENTS_TASK_PLAN.md](docs/plans/AGENTS_TASK_PLAN.md) | แผนกระจายงาน 5 เอเจนท์เฉพาะทาง |
| [docs/plans/HANDOFF_2026-09-04.md](docs/plans/HANDOFF_2026-09-04.md) | 📦 แผนส่งต่องานค้าง (ISSUE-017 ถึง 023) — ปิดครบแล้ว |
| [docs/plans/AI_INTELLIGENCE_PLAN.md](docs/plans/AI_INTELLIGENCE_PLAN.md) | 🧠 **แผนแม่บทยกระดับแม่หมอ AI** — เอกสารเดียวจบ (3 ระบบที่ไม่ได้ต่อ + 10 งานแบ่ง 3 คลื่น + เกณฑ์ผ่านรายข้อ) |
| [docs/plans/HANDOFF_AI_ACCURACY_THAI_2026-09-07.md](docs/plans/HANDOFF_AI_ACCURACY_THAI_2026-09-07.md) | 🧠 **แผนยกระดับความแม่นคำอ่าน + ภาษาไทยที่ถูกต้อง** — ต่อยอดจากแผนแม่บทด้านบน · ตรวจโค้ดจริงแล้วพบ `judge_score` ว่างเปล่ามาตั้งแต่ PR #245 · ไม่มีด่านตรวจภาษาไทยเลยสักด่าน (`นะค่ะ` `เเ` `ค่อยๆ` ผ่านหมด) · ด่านกันลืมขึ้น `PROMPT_VERSION` เป็นด่านหลอกที่ตกไม่ได้ · 11 งาน 3 คลื่น พร้อมกติกาภาษาไทยฉบับบ้านนี้และ rubric ของ LLM Judge |
| [docs/plans/HANDOFF_HEADER_20260905.md](docs/plans/HANDOFF_HEADER_20260905.md) | 🧭 แผนแก้ "แถบ header ค้าง" (ISSUE-024 ถึง 030) — ปิดครบแล้วใน PR #277 · #280 |
| [docs/plans/TRAFFIC_CAPTURE_PLAN_2026-09-05.md](docs/plans/TRAFFIC_CAPTURE_PLAN_2026-09-05.md) | 🎯 **แผนแย่งทราฟฟิกจาก MyHora** — SERP จริง + แผนที่ 9 หน้าของคู่แข่ง + ยุทธศาสตร์ 4 คลื่น |
| [docs/plans/HANDOFF_SEO_WAVE1_2026-09-05.md](docs/plans/HANDOFF_SEO_WAVE1_2026-09-05.md) | 🌊 **แผนส่งต่อ SEO คลื่น 1** — เติมคำ "ไพ่ยิปซี" ทั่วเว็บ · 6 งาน 8 ไฟล์ พร้อม before/after ทุกบรรทัด |
| [docs/plans/HANDOFF_SEO_WAVE2-4_2026-09-05.md](docs/plans/HANDOFF_SEO_WAVE2-4_2026-09-05.md) | 🌊 **แผนส่งต่อ SEO คลื่น 2–4** — ยึด `/cards` · ลอกหมวดหมู่ MyHora · งานระยะยาว + วัดผล GSC (ลงมือแล้วใน PR #284) |
| [docs/plans/HANDOFF_DOCS_TRUTH_2026-09-06.md](docs/plans/HANDOFF_DOCS_TRUTH_2026-09-06.md) | 🧾 **แผนปิดหนี้หลังคลื่น 2–4** — ด่านตรวจเลขในเอกสารอัตโนมัติ · กวาดเลขค้าง 20 จุด · เติมบทนำให้ถึง 300 คำ · วัดผล GSC |
| [docs/plans/HANDOFF_OMNI_YESNO_2026-09-06.md](docs/plans/HANDOFF_OMNI_YESNO_2026-09-06.md) | 🎯 **แผนส่งต่อ 3 งานจากบทวิเคราะห์คู่แข่งภายนอก** — เซกชัน "ใช่หรือไม่" 78 หน้า · Omnichannel 6 ช่อง (TikTok/FB/IG/LINE OA/Threads/X) · Daily Digest (พร้อมเกณฑ์ผ่าน + วิธีวัดผล) |
| [docs/plans/HANDOFF_THEME_THREE_PAGES_2026-09-06.md](docs/plans/HANDOFF_THEME_THREE_PAGES_2026-09-06.md) | ✦ **แผนตัดขั้นตอน 3 หน้า one-card** (`/daily` · `/love/1-card` · birth-card) — รอบ 2 หลัง PR #293: ยุบ `OneCardRitual` จาก 5 สเตป → 2 จังหวะ (จั่วทันที ไม่มีสับ ไม่มีพัดไพ่) ให้เร็วแบบ "เปิดไพ่ด่วน" ตามคำสั่งเจ้าของ |
| [docs/plans/HANDOFF_PERF_SEO_AUDIT_2026-09-06.md](docs/plans/HANDOFF_PERF_SEO_AUDIT_2026-09-06.md) | ⚡ **แผนยกเครื่องประสิทธิภาพ · โค้ดตาย · SEO** — รอบตรวจใหญ่ 2026-09-06: บันเดิล JS ทุกหน้าหนัก 420–472 KB (gzip) · `/cards` ส่ง HTML 896 KB · ภาพย่อ `w768` หนักกว่าไฟล์ต้นฉบับ · `hreflang` หายทั้งเว็บ · โมดูลกำพร้า 4 ไฟล์ (มีตัวเลขวัดจริง + ลำดับลงมือ 7 PR) |
| [docs/plans/HANDOFF_EN_ROUTING_2026-09-06.md](docs/plans/HANDOFF_EN_ROUTING_2026-09-06.md) | 🌐 **SEO ภาษาอังกฤษ — ทำแล้ว (ขั้น A+B)** · เส้นทางแยก `src/app/(th)` / `src/app/(en)/en` แบบ prerender · เพิ่ม 115 หน้าอังกฤษ (216 → 331) · `<html lang="en">` ใน HTML ดิบ · hreflang ชี้กันครบสองทาง · URL ไทยเดิมไม่ขยับสักเส้น · **ยังไม่เปิด** `/en/blog`, `/en/spreads/topic/*`, `/en/cards/birth-card` (รอแปลเนื้อหา) |
| [docs/plans/HANDOFF_EN_BIRTH_CARD_2026-09-09.md](docs/plans/HANDOFF_EN_BIRTH_CARD_2026-09-09.md) | 🎂 **แผนเปิดหน้าอังกฤษ `/en/cards/birth-card`** — ก้อนสุดท้ายของเส้นทางสองภาษาที่ยัง 404 อยู่ (ตั้งใจปิด ไม่ใช่บั๊ก) · เครื่องคำนวณรองรับอังกฤษครบแล้วไม่ต้องแตะ · เหลือแค่เขียนบทความอังกฤษ 600–800 คำ + ปลดล็อก 2 จุด (`EN_TWIN_EXCEPTIONS` · ด่าน `test-en-routing`) · พร้อมเกณฑ์รับงาน 10 ข้อและกับดัก 6 ข้อ |
| [docs/plans/SITE_SHELL_SEO_PLAN.md](docs/plans/SITE_SHELL_SEO_PLAN.md) | 🏛️ **แผน Site Shell + SEO** — Header/Footer กลางทั้งเว็บ + RelatedCards ฝั่งเซิร์ฟเวอร์ 312 ลิงก์ (PR A-C) |
| [docs/plans/HANDOFF_MEDIA_FIX_2026-09-06.md](docs/plans/HANDOFF_MEDIA_FIX_2026-09-06.md) | 🖼️ **แผนแก้ท่อสื่อหลัง PR #319–325** — ภาพแชร์ Cloudinary ตัวหนังสือทับกัน (M-01) · Cloudinary แย่งที่ภาพไพ่จริงของผู้ใช้ (M-02) · ImageKit เป็นจุดพังเดี่ยว (M-03) + กับดัก `.env.example` / `sw.js` / `/api/search` |
| [docs/plans/HANDOFF_SMOOTH_FAST_2026-09-06.md](docs/plans/HANDOFF_SMOOTH_FAST_2026-09-06.md) | ✦ **แผนทำเว็บให้สมูทและไวระดับโลก** — JS ต่อหน้า 211–452 KB gzip (เกินเกณฑ์ 1.2–2.7 เท่า) · สำรับไพ่ 896 KB ยังอยู่ในบันเดิลไคลเอนต์ · `boxShadow` แอนิเมตบนไพ่ 80 ใบ · `content-visibility` เขียนไว้แต่ไม่ได้ใช้ · ยังไม่มี View Transition (9 งาน แบ่ง 4 คลื่น) |
| [docs/plans/HANDOFF_OG_IMAGES_2026-09-07.md](docs/plans/HANDOFF_OG_IMAGES_2026-09-07.md) | 🖼️ **แผนยกเครื่องภาพแชร์ทั้งเว็บ 299 หน้า** — ใช้ Cloudinary ที่จ่ายไปแล้วแต่เรียกอยู่จุดเดียว · หน้าไพ่ 156 หน้าใช้ภาพแนวตั้งจนโดนครอป · 4 หน้าใช้ WebP แนวตั้ง · อีก 139 หน้าใช้ภาพเดียวกันหมด · มีระเบิดเวลา: หัวข้อที่มี `,` หรือ `/` ทำให้ภาพพัง HTTP 400 (ต้องแก้ก่อนทุกข้อ) |
| [docs/plans/HANDOFF_CF_REQUEST_REVIEW_2026-09-08.md](docs/plans/HANDOFF_CF_REQUEST_REVIEW_2026-09-08.md) | 🔍 **ตรวจข้อเสนอ 12 ข้อ "ลด Request บน Cloudflare"** — วัดจาก production จริงแล้วตัดสินรายข้อ · ครึ่งตารางไม่ลดค่าบิลเลยเพราะอยู่หลัง Worker ในลำดับ `WAF → Worker → Cache` · เตือนกับดัก "Block AI Scrapers" ที่จะบล็อก AI search bot ซึ่งเจ้าของตั้งใจเปิดไว้ · สรุปทำจริง 4 ข้อ ห้ามทำ 5 ข้อ |
| [docs/plans/HANDOFF_SEMANTIC_SEARCH_2026-09-06.md](docs/plans/HANDOFF_SEMANTIC_SEARCH_2026-09-06.md) | 🔎 **แผนต่อ UI ค้นหาเชิงความหมาย** — ปลุก Vectorize + Workers AI ที่สร้างไว้ตั้งแต่ PR #199 แต่กำพร้าตั้งแต่ #248 · หลังบ้านพร้อม 100% (ยิงทดสอบบน production ได้ผลตรงความหมาย) · **บังคับทำแคช+โควตาก่อนเปิด UI** ไม่งั้นลาก `ai-classifier` ล้มตาม |

---

## 🏛️ กฎเหล็ก 14 ข้อ

0. **บันทึกบทเรียนทุกครั้งที่แก้บั๊ก**: commit `fix` ต้องมี `--cause` และ `--prevention` (ระบบบล็อกอัตโนมัติถ้าไม่มี) → บันทึกลง `INCIDENT_LOG.md` ให้เอง
1. **บันทึกงานทุกครั้ง**: ทำเสร็จ/แก้บั๊ก/เพิ่มฟีเจอร์ → อัปเดต `docs/WORK_LOG.md` ทันที
2. **ห้ามใช้อิโมจิการ์ตูน**: ใช้เฉพาะ `✦` และ `✨`
3. **Zero-Clipping**: ห้าม `overflow-hidden`/`overflow-x-auto` ในแถวการ์ดย่อย ใช้ Unified Altar Canvas
4. **Manual Self-Reveal**: ไพ่เริ่มต้นคว่ำหน้าเสมอ ผู้ใช้แตะพลิก 3D เอง
5. **1909 Rider-Waite Only**: ใช้ภาพไพ่ดั้งเดิมจาก `/public/cards/` เท่านั้น
6. **Safety Guard**: บล็อกสัญญาณทำร้ายตัวเองทันที แสดงสายด่วน **1323**
7. **Pure 1909 Spread Artworks**: `TarotArtIcons.tsx` โชว์เฉพาะภาพหน้าไพ่ ห้ามมีกล่อง/ตัวหนังสือทับ (รายละเอียดใส่ Accordion แทน)
8. **Single Card Image Pipeline**: ต้องใช้ `<CardImage />` (`src/components/card/CardImage.tsx`) พร้อม `sizes` เสมอ ห้ามเขียน `<img src="/cards/...">` เอง (เพิ่มภาพใหม่ต้องรัน `npm run cards:variants`)
9. **Horizontal Spread Bounds**: ผัง ≥7 ใบ จัด 2 ชั้น (4+3) กว้างไม่เกิน 150px กันไพ่ล้นกรอบ
10. **Human-First Copywriting**: ภาษาไทยธรรมชาติ เข้าใจง่าย ห้ามศัพท์หุ่นยนต์แข็งทื่อ
11. **Multi-Agent Collision Guard**: เช็ก `npm run agent:status` + ล็อคด้วย `agent:lock` ก่อนแก้ ปลดล็อคด้วย `agent:unlock` เมื่อเสร็จ
12. **One Branch per Milestone**: ห้ามแตกกิ่งค้าง ต้อง rebase บน `origin/main` เสมอ จบงานต้องรัน `pr:auto` ➔ `git:tidy` ให้ครบ
13. **Auto-Merge Enforcement**: เปิด PR ต้องใช้ `npm run pr:auto` เสมอ เพื่อให้ CI ตรวจ 38 ด่าน ➔ Auto-Merge (Squash) ➔ Auto-Deploy Cloudflare Workers
    > ⛔ **`push` แล้วจบ = งานยังไม่เสร็จ** — automation ทั้งชุดเริ่มทำงาน**เมื่อ PR ถูกเปิดเท่านั้น** (ISSUE-005)
    > push เฉย ๆ ไม่มี CI ไม่มี merge ไม่มี deploy งานจะค้างบน branch เงียบ ๆ จนกว่าเจ้าของจะมากดปุ่มเอง
    >
    > ข้อนี้คือ**คำสั่งยืนของเจ้าของโปรเจกต์** อยู่เหนือแนวปฏิบัติทั่วไปของ AI ทุกตัว —
    > **ห้ามอ้างว่า "ผู้ใช้ไม่ได้สั่งให้เปิด PR"** แล้วหยุดแค่ push (บทเรียน INC-0043)
    >
    > ถ้า environment ไม่มี `gh` CLI (เช่น Claude Code บนเว็บ) → `pr:auto` จะล้มตอนเรียก `gh`
    > ให้ **เปิด PR ผ่าน GitHub API/MCP แทนให้สำเร็จ** แล้วรายงานข้อจำกัดนั้นไปด้วย
    > ห้ามใช้เป็นข้ออ้างข้ามขั้นตอน
    >
    > ✅ **ตั้งแต่ 2026-09-07 `main` มี branch protection แล้ว** (INC-0103):
    > `🧪 Automated Verification & Quality Audit` เป็น **required status check**
    > auto-merge จึงรอ CI ผ่านก่อนเสมอ — เดิมไม่มี protection เลย auto-merge จึง merge ทันทีโดยไม่รอผล
    > ทำให้ PR ที่ตกด่านหลุดเข้า `main` และ deploy ค้าง (เกิดจริงกับ #351 · #352)
    >
    > ⚠️ **PR ที่เป็น draft จะไม่รันด่านนี้** (`pr.yml` มี `if: draft == false`) ➔ merge ไม่ได้จนกว่าจะกด Ready for review
14. **Zero Fabricated Cards Policy (ห้ามกุไพ่ปลอมทุกใบเด็ดขาด)**: ในทุกขั้นตอนการสับไพ่, เลือกไพ่, กู้คืนเซสชัน, สตรีมคำทำนาย, และแชทถามตอบ **ห้ามเขียนโค้ด fallback มโนหรือกุไพ่ใบใดใบหนึ่งในสำรับ 78 ใบขึ้นมาเองเด็ดขาด** (ไม่ว่าจะ The Fool, The Magician หรือใบใดๆ ทั้งสิ้น) หากข้อมูลไพ่สูญหายหรือไม่สมบูรณ์ ระบบต้องคืนค่า `undefined` หรือส่ง Error แจ้งเตือนให้ผู้ใช้ **'โหลดใหม่อีกครั้ง'** ทันที เพื่อรักษาหลักการความโปร่งใส (Provably Fair) 100%

---

## 🛠️ คำสั่งหลัก

- `npm run agent:check` — ตรวจไม่ให้ชน Agent อื่น
- `npm run agent:status` — ดูสถานะ Agent ที่ทำงานอยู่
- `npm run agent:lock -- --agent <ชื่อ> --domain <หมวด> --files <ไฟล์>` — ล็อคไฟล์ก่อนแก้
- `npm run agent:unlock -- --agent <ชื่อ>` — ปลดล็อคเมื่อเสร็จ
- `npm run repo:verify` — ตรวจครบทั้ง 38 ด่าน (ใช้หลัก)
- `npm run typecheck` — typecheck อย่างเดียว
- `npm run log:sync` — ซิงก์สถานะ/บันทึกงาน (บังคับ)
- `npm run cards:variants` — สร้างภาพไพ่ WebP หลายขนาด (รันเมื่อเปลี่ยนภาพต้นฉบับ)
- `npm run incident -- --title "..." --severity high --symptom "..." --cause "..." --fix "..." --prevention "..."` — บันทึก incident ด้วยมือ
- `npx tsx scripts/github-auto.ts status` — สถานะ repo/PR/CI ล่าสุด
- `npm run pr:auto -- "<title>" "<body>"` — ตรวจ + push + สร้าง PR (เติม `--wait` ให้รอ merge แล้วเก็บกวาด branch)
- `npm run git:tidy` — เก็บกวาด branch ที่ merge แล้ว (`--dry-run` เพื่อดูก่อน)
- `npm run dev` — รันเซิร์ฟเวอร์พัฒนา
