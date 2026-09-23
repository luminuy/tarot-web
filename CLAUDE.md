# 🔮 คู่มือแม่บทวิศวกรรม (AI Operating Guidelines)

เว็บดูดวงไพ่ทาโรต์ออนไลน์พรีเมียม (Interactive Provably-Fair Tarot Web)

> 💬 **สไตล์การตอบแชท**: ตอบสั้น กระชับ ได้ใจความ ไม่ต้องอธิบายยืดยาว (คำสั่งจากเจ้าของโปรเจกต์)

> ⚠️ **ก่อนแก้โค้ด ต้องอ่าน 4 ไฟล์นี้เสมอ**
> 1. [docs/INDEX.md](docs/INDEX.md) — ศูนย์รวมสารบรรณและแผนที่เอกสารทั้งหมด
> 2. [docs/INCIDENT_LOG.md](docs/INCIDENT_LOG.md) — บทเรียนความผิดพลาด + กฎป้องกันถาวร **ทำผิดซ้ำ = บกพร่องร้ายแรงสุด**
> 3. [docs/KNOWN_ISSUES.md](docs/KNOWN_ISSUES.md) — บั๊กค้าง กันแก้ซ้ำกับ Agent อื่น
> 4. [docs/AI_COLLABORATION_GUIDELINES.md](docs/AI_COLLABORATION_GUIDELINES.md) — คู่มือแม่บท (หัวข้อ 0 = มาตรฐานบังคับ)

> 🔎 **ก่อนบอกเจ้าของว่างานไหน "ค้าง" หรือ "เสร็จ"** — รัน `npm run docs:status` แล้ว**ยืนยันกับโค้ดจริง/`git log` ทุกครั้ง**
> เอกสารเป็นแค่ปากทาง ไม่ใช่หลักฐาน (INC-0229: ธีมกระจกลงครบทั้งเว็บแล้วแต่ดัชนียังเขียนว่ารอทีม ➔ รายงานเจ้าของผิด)

---

## 🧭 ดัชนีเอกสาร (Documentation Index & Sitemap)

| ไฟล์ | เนื้อหา |
|---|---|
| [docs/INDEX.md](docs/INDEX.md) | 🌟 แผนที่นำทางเอกสารทั้งหมดและคำแนะนำการอ่านตามบทบาท |
| [docs/INCIDENT_LOG.md](docs/INCIDENT_LOG.md) | บทเรียนความผิดพลาด (INC-0001 เป็นต้นไป) — อ่านก่อนเสมอ |
| [docs/KNOWN_ISSUES.md](docs/KNOWN_ISSUES.md) | บั๊กค้าง/สถานะระบบ (วันที่อัปเดตดูที่หัวไฟล์) |
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
| [docs/TAROT_CARD_FEATURES.md](docs/TAROT_CARD_FEATURES.md) | 🃏 **(CANONICAL SPEC)** สเปกระบบและสารบบไพ่ทาโรต์ 78 ใบ, 5 มิติความหมาย, ผัง 25 แบบ, Pick A Card 8 หัวข้อ, Provably Fair Flow |


### 📋 แผนงานทั้งหมด — สถานะจริงจากไฟล์แผน

<!-- PLANS_INDEX_START · สร้างด้วย npm run docs:index — ห้ามแก้มือ -->

> สถานะมาจากบรรทัด `> **สถานะ**:` ใต้หัวเรื่องของแต่ละไฟล์เท่านั้น — ทำงานตามแผนไหนเสร็จ ให้แก้บรรทัดนั้นแล้วรัน `npm run docs:index` ใน PR เดียวกัน (ด่าน CI ตรวจ)
> 🚧 ทำแล้วบางส่วน · ⏸️ รอคนนอก/เจ้าของ · ⏳ ยังไม่เริ่ม · ✅ เสร็จแล้ว · 📚 เอกสารอ้างอิง

| สถานะ | แผน | สรุปสถานะ |
|---|---|---|
| 🚧 | [🗺️ แผนแม่บทรวม — ทุกงานที่ค้างอยู่](docs/plans/MASTER_PLAN_2026-09-06.md) | เหลือ 3 งานในตารางข้อ 1 (Omnichannel · Marketplace เฟส 2 · SEO อังกฤษ) — ข้อ 1–3 · 5 · 6 ปิดแล้ว (ตรวจกับโค้ด 2026-09-23) · 📌 **อ่านก่อนแตะ**: เริ่มอ่านที่นี่ — ภาพรวมทุกงานในตารางเดียว · _ตรวจ 2026-09-23_ |
| 🚧 | [✦ แผนทำให้เว็บ "สมูทและไว" ระดับโลก — ทุกหน้า ทุกจังหวะ (2026-09-06)](docs/plans/HANDOFF_SMOOTH_FAST_2026-09-06.md) | ลงมือแล้วส่วนใหญ่ — เงาแยกชั้น · View Transition · สำรับออกจากบันเดิล (#338 · #345) · content-visibility ใช้ได้เฉพาะกริดไพ่ (INC-0174 · HANDOFF_CARD_TILE_CV) · ข้อ S-03 (ไพ่ 80 ใบใน DOM) ยังไม่ได้ตรวจยืนยัน · _ตรวจ 2026-09-23_ |
| 🚧 | [🎯 แผนส่งต่องาน 3 ชิ้น — Yes/No 78 หน้า · Omnichannel · Daily Digest](docs/plans/HANDOFF_OMNI_YESNO_2026-09-06.md) | เซกชัน "ใช่หรือไม่" 78 หน้า ✅ (`CardYesNoAnswer`) · Daily Digest ✅ · Omnichannel ⏸️ รอเจ้าของเปิดบัญชี (ตอนนี้มีแค่ TikTok ใน `BRAND_SOCIAL_PROFILES`) · _ตรวจ 2026-09-23_ |
| 🚧 | [🧠 แผนยกระดับ "ความแม่น" ของคำอ่าน + "ภาษาไทยที่ถูกต้อง" ของแม่หมอ AI](docs/plans/HANDOFF_AI_ACCURACY_THAI_2026-09-07.md) | คลื่น A + B ลงโค้ดครบ · เหลือรายงาน ai:judge ของ `PROMPT_VERSION` ล่าสุด (ดู HANDOFF_AI_JUDGE_BASELINE) · 📌 **อ่านก่อนแตะ**: prompt / ภาษาไทยของแม่หมอ — กติกาภาษาไทยฉบับบ้านนี้ + rubric ของ LLM Judge · _ตรวจ 2026-09-23_ |
| 🚧 | [🧠 แผนแม่บทยกระดับความฉลาดของแม่หมอ AI](docs/plans/AI_INTELLIGENCE_PLAN.md) | คลื่น 1 ลงแล้ว (#245) · งานต่อยอดย้ายไปแผน HANDOFF_AI_ACCURACY_THAI · เหลือผลวัด ai:judge ของ prompt รุ่นล่าสุด · _ตรวจ 2026-09-23_ |
| 🚧 | [💸 แผนคุมต้นทุน AI + รหัสทดสอบข้าม rate limit — handoff ให้ทีม Gemini](docs/plans/AI_COST_CONTROL_PLAN.md) | ทำแล้วส่วนใหญ่ — เพดานงบ AI รวมทั้งระบบ (`src/lib/security/ai-budget.ts`) + เพดานถี่ข้าม isolate บน D1 (`consumeEdgeRateLimits`) ของเส้นหลัก · ที่ยังเหลือ: `rate-limit.ts` ยังเก็บในหน่วยความจำต่อ isolate สำหรับเส้นรอง · _ตรวจ 2026-09-23_ |
| ⏸️ | [🔑 ชีทส่งต่อ — รัน `ai:judge` เก็บ baseline `20260911-1` แล้วลุยคลื่น B ต่อ](docs/plans/HANDOFF_AI_JUDGE_BASELINE_2026-09-11.md) | รอคนกดรัน workflow `ai-judge.yml` (ใช้ secrets ใน GitHub) — ยังไม่มีรายงานของ `PROMPT_VERSION` = `20260911-2` · baseline เดิมมีแค่ `20260911-1` · _ตรวจ 2026-09-23_ |
| ✅ | [🏛️ แผนลงมือ: Site Shell กลาง + Internal Link ที่บอทมองเห็น](docs/plans/SITE_SHELL_SEO_PLAN.md) | Header/Footer กลาง + RelatedCards ฝั่งเซิร์ฟเวอร์ · _ตรวจ 2026-09-23_ |
| ✅ | [👤 แผนสร้าง Consumer Retention Infra — handoff ให้ทีม Gemini](docs/plans/RETENTION_PLAN.md) | สมุดบันทึก · streak · ความทรงจำแม่หมอ · Daily Digest ใช้งานจริง · _ตรวจ 2026-09-23_ |
| ✅ | [⚡ แผนฟีเจอร์ "ทำนายด่วน" (Quick Fortune — 1 ใบ ไม่ต้องเลือกไพ่)](docs/plans/QUICK_FORTUNE_PLAN.md) | พัฒนาและตรวจสอบเสร็จสมบูรณ์ · _ตรวจ 2026-09-23_ |
| ✅ | [⚡ แผนฟีเจอร์ "หน้าผลลัพธ์ทำนายด่วน" (Quick Chat Result — แยกจากหน้าฝังใหญ่)](docs/plans/QUICK_CHAT_RESULT_PLAN.md) | หน้าผลลัพธ์ทำนายด่วน (`QuickChatResult`) ใช้งานจริงในหน้าแรก · _ตรวจ 2026-09-23_ |
| ✅ | [🔐 แผนปิดช่องว่าง Provably-Fair ที่เหลือ 2 จุด — handoff ให้ Gemini](docs/plans/PROVABLY_FAIR_PLAN.md) | แกนหลักปิดแล้ว · ด่าน Provably Fair / Shuffle Parity เฝ้าอยู่ · _ตรวจ 2026-09-23_ |
| ✅ | [🔍 แผนส่งต่อ — ผลตรวจ UX/UI ทั้งเว็บ (รอบ 2026-09-11)](docs/plans/HANDOFF_UX_UI_AUDIT_2026-09-11.md) | ปิดครบ 20 ข้อ · 📌 **อ่านก่อนแตะ**: สี/คอนทราสต์/ปุ่ม — วิธีตรวจ + หนี้ที่ตั้งใจเหลือไว้ 3 ข้อ · _ตรวจ 2026-09-23_ |
| ✅ | [✦ แผนส่งต่องาน — ตัดขั้นตอนสับ/เลือกไพ่ ให้ 3 หน้า one-card เร็วแบบ "เปิดไพ่ด่วน"](docs/plans/HANDOFF_THEME_THREE_PAGES_2026-09-06.md) | ยุบ OneCardRitual เหลือ 2 จังหวะแล้ว · _ตรวจ 2026-09-23_ |
| ✅ | [🌊 แผนส่งต่องาน SEO คลื่นที่ 2–4 (ยึด /cards · ลอกหมวดหมู่ MyHora · งานระยะยาว)](docs/plans/HANDOFF_SEO_WAVE2-4_2026-09-05.md) | ลงมือแล้ว · _ตรวจ 2026-09-23_ |
| ✅ | [🌊 แผนส่งต่องาน SEO คลื่นที่ 1 — เติมคำว่า "ไพ่ยิปซี" ทั่วเว็บ](docs/plans/HANDOFF_SEO_WAVE1_2026-09-05.md) | เติมคำ "ไพ่ยิปซี" ทั่วเว็บแล้ว · _ตรวจ 2026-09-23_ |
| ✅ | [🔎 แผนต่อ UI ค้นหาเชิงความหมาย — ปลุก Vectorize + Workers AI ที่สร้างไว้แล้วให้ได้ใช้จริง (2026-09-06)](docs/plans/HANDOFF_SEMANTIC_SEARCH_2026-09-06.md) | UI ค้นหาเชิงความหมายใช้งานแล้ว (`SemanticSearchPanel` ในหน้า /cards) · `/api/search` มีเพดานถี่และแคช · _ตรวจ 2026-09-23_ |
| ✅ | [🧾 ปิดสี่เรื่องสุดท้ายของผลตรวจรอบ 2 (ISSUE-049)](docs/plans/HANDOFF_ROUND2_CLOSEOUT_2026-09-17.md) | ปิด 3 เรื่อง · อีกเรื่อง (R-02) เปลี่ยนรูปไปรวมกับ T-23 · _ตรวจ 2026-09-23_ |
| ✅ | [🧪 แผนส่งต่องาน QA — พิสูจน์ผังใหม่ทั้ง 5 ด้วยการใช้งานจริง + ปิดช่องโหว่ `guestAllowed` ที่ไม่มีผลบังคับ](docs/plans/HANDOFF_QA_SPREADS_2026-09-06.md) | ปิดครบ · _ตรวจ 2026-09-23_ |
| ✅ | [⚡ แผนยกเครื่องประสิทธิภาพ · โค้ดตาย · SEO — รอบตรวจใหญ่ 2026-09-06](docs/plans/HANDOFF_PERF_SEO_AUDIT_2026-09-06.md) | P-01 ถึง P-04 · S-01 ถึง S-04 · D-02 · D-05 ลงแล้ว · _ตรวจ 2026-09-23_ |
| ✅ | [🖼️ แผนส่งต่อ — ยกเครื่องภาพแชร์ทั้งเว็บ 299 หน้า (OG Image Overhaul)](docs/plans/HANDOFF_OG_IMAGES_2026-09-07.md) | OG-01 ถึง OG-xx ปิดครบ · _ตรวจ 2026-09-23_ |
| ✅ | [🖼️ แผนแก้ท่อสื่อและกับดักที่เหลือ — ตรวจหลัง PR #319–#325 (2026-09-06)](docs/plans/HANDOFF_MEDIA_FIX_2026-09-06.md) | M-01 ถึง M-06 ปิดครบ (M-06 ต่อ UI แล้วที่ `SemanticSearchPanel`) · _ตรวจ 2026-09-23_ |
| ✅ | [🧭 บันทึกส่งต่อและผลการแก้ไข "แถบ header ค้าง" (Header Hang — Resolved & Verified Record)](docs/plans/HANDOFF_HEADER_20260905.md) | ISSUE-024 ถึง 030 ปิดครบ · _ตรวจ 2026-09-23_ |
| ✅ | [✦ แผนส่งต่องาน — หน้าแรก "ประตูเดียว" + ธีมกระจกอุ่น (Warm Liquid Glass)](docs/plans/HANDOFF_GLASS_HOME_2026-09-21.md) | ธีมกระจกอุ่น + หน้าแรกประตูเดียว ใช้งานจริงครบทั้งเว็บ · 📌 **อ่านก่อนแตะ**: สี/พื้นผิวกระจก — ห้าม `backdrop-filter` (INC-0056) · ด่าน a11y อ่านโทเคนไม่ได้อ่านพิกเซล · _ตรวจ 2026-09-23_ |
| ✅ | [🌏 แผนส่งงานแปลไทย → อังกฤษ (ขั้น C ของแผนเปิด SEO ภาษาอังกฤษ)](docs/plans/HANDOFF_EN_TRANSLATION_2026-09-06.md) | ปิดแล้ว · 📌 **อ่านก่อนแตะ**: งานแปลไทย ➔ อังกฤษ — อภิธานศัพท์บังคับ + เพดานความยาว · _ตรวจ 2026-09-23_ |
| ✅ | [🌐 แผนเปิด SEO ภาษาอังกฤษจริง — เส้นทางแยก `/en/...` แบบ prerender สองภาษา](docs/plans/HANDOFF_EN_ROUTING_2026-09-06.md) | เส้นทางสองภาษาเปิดครบทุกเส้น · _ตรวจ 2026-09-23_ |
| ✅ | [🎂 แผนเปิดหน้าอังกฤษ `/en/cards/birth-card` (ขั้น C ก้อนสุดท้ายของเส้นทางสองภาษา)](docs/plans/HANDOFF_EN_BIRTH_CARD_2026-09-09.md) | `/en/cards/birth-card` เปิดแล้ว · _ตรวจ 2026-09-23_ |
| ✅ | [🧾 แผนส่งต่องาน — ปิดหนี้ที่เหลือหลัง SEO คลื่น 2–4 (เอกสารตรงกับของจริง + บทนำถึงเกณฑ์)](docs/plans/HANDOFF_DOCS_TRUTH_2026-09-06.md) | ด่านตรวจเลขในเอกสารแม่บททำงานใน CI แล้ว · _ตรวจ 2026-09-23_ |
| ✅ | [📐 คู่มือสูตรความสูงการ์ดไพ่ + วิธีวัดใหม่ (ทำวันที่ 2026-09-15)](docs/plans/HANDOFF_CARD_TILE_CV_2026-09-15.md) | ใช้งานจริง · ด่าน test-card-tile-height เฝ้าอยู่ · 📌 **อ่านก่อนแตะ**: หน้าตาการ์ดไพ่ในกริด — สูตรความสูง + กับดัก "หัก 26px" (ด่านที่ 62 เฝ้าอยู่) · _ตรวจ 2026-09-23_ |
| ✅ | [⚡ แผนส่งต่องาน — ลดน้ำหนัก JS รอบสุดท้ายให้เข้าเกณฑ์ระดับโลก](docs/plans/HANDOFF_BUNDLE_DIET_2026-09-07.md) | ถึงเป้า ≤ 170 KB ทุกเส้นทาง (วัดบิลด์จริง 2026-09-23: หนักสุด `/` 146 KB) · ตัวเลขปัจจุบันดูจาก `test-bundle-budget` ไม่ใช่ตารางในไฟล์นี้ · _ตรวจ 2026-09-23_ |
| ✅ | [⚡ แผนส่งต่อ — หา TBT ที่หายไปของหน้า `/blog` (ทำวันที่ 2026-09-12)](docs/plans/HANDOFF_BLOG_TBT_2026-09-12.md) | ปิดเคส ISSUE-043 (TBT 660 ➔ 24 ms) · 📌 **อ่านก่อนแตะ**: การวัดประสิทธิภาพ — วิธีวัดโดยไม่พึ่งโควตา PSI + กับดักการวัด 4 ข้อ · _ตรวจ 2026-09-23_ |
| ✅ | [🪶 แผนย้ายเว็บไปสถาปัตยกรรม Astro + React Island](docs/plans/HANDOFF_ASTRO_MIGRATION_2026-09-15.md) | คลื่น 1–4 ครบ ทุกหน้าสาธารณะเป็นของ Astro · คลื่น 5 (ถอด Next) พักตามคำสั่งเจ้าของ · 📌 **อ่านก่อนแตะ**: หน้า `.astro` / island ใด ๆ — กติกา island 5 ข้อ + กับดัก 7 ข้อ (import ข้อมูลใน island = บันเดิลพุ่ง) · _ตรวจ 2026-09-23_ |
| ✅ | [🎟️ แผนส่งต่อ — หน้าจัดการรหัสแลกสิทธิ์ในแผงแอดมิน (Admin Redeem Code Manager)](docs/plans/HANDOFF_ADMIN_REDEEM_2026-09-12.md) | ระเบิดเวลา 4 ข้อปิดครบ + หน้าแอดมินรหัสแลกสิทธิ์ใช้งานได้ (ดูตารางหัวข้อ 0) · _ตรวจ 2026-09-23_ |
| ✅ | [📦 แผนส่งต่องานที่ยังค้าง หลังการตรวจใหญ่ 2026-09-04 (Handoff Plan)](docs/plans/HANDOFF_2026-09-04.md) | ISSUE-017 ถึง 023 ปิดครบ · _ตรวจ 2026-09-23_ |
| ✅ | [🎟 ระบบสมาชิกและโควตาเปิดไพ่ — แผนลงมือสำหรับทีม Antigravity](docs/plans/ENTITLEMENT_PLAN.md) | ระบบสิทธิ์และโควตาใช้งานจริง (`entitlement.enforced` = เปิด) · _ตรวจ 2026-09-23_ |
| ✅ | [📧 แผนเพิ่ม "เข้าสู่ระบบด้วยอีเมล + รหัสผ่าน" — handoff ให้ทีมอีกทีม](docs/plans/EMAIL_AUTH_PLAN.md) | ล็อกอินอีเมล/รหัสผ่านใช้งานจริง · ด่าน test-email-auth เฝ้าอยู่ · _ตรวจ 2026-09-23_ |
| ✅ | [☁️ แผนใช้บริการฟรีของ Cloudflare ต่อยอด SeerTarot](docs/plans/CLOUDFLARE_FREE_STACK.md) | 6 บริการใช้งานจริงบน production · _ตรวจ 2026-09-23_ |
| 📚 | [🎯 แผนยกเครื่อง UX · ความไว · ความสมูท — 2026-09-01](docs/plans/UX_PERF_PLAN.md) | แผนยุคแรก — ถูกแทนด้วย HANDOFF_SMOOTH_FAST และผลตรวจ UX/UI รุ่นหลัง · _ตรวจ 2026-09-23_ |
| 📚 | [🎯 แผนแย่งทราฟฟิกจาก MyHora และเจ้าตลาดดูดวงไทย (Traffic Capture Plan)](docs/plans/TRAFFIC_CAPTURE_PLAN_2026-09-05.md) | ยุทธศาสตร์ + ข้อมูล SERP — ลงมือผ่านแผน SEO Wave 1–4 แล้ว · _ตรวจ 2026-09-23_ |
| 📚 | [🔍 ตรวจข้อเสนอ 12 ข้อ "ลด Request บน Cloudflare" (2026-09-08)](docs/plans/HANDOFF_CF_REQUEST_REVIEW_2026-09-08.md) | บันทึกการตัดสินใจรายข้อ — ข้อที่เป็นโค้ดทำแล้ว · ข้อที่เป็นสวิตช์ Cloudflare เป็นของเจ้าของ · 📌 **อ่านก่อนแตะ**: การตั้งค่า Cloudflare — ข้อเสนอที่ห้ามทำ 5 ข้อ (เช่น Block AI Scrapers) · _ตรวจ 2026-09-23_ |
| 📚 | [📋 Backlog — งานที่ยังเหลือ (2026-09-04)](docs/plans/BACKLOG.md) | คลังงานรอคิว — รายการที่เสร็จถูกขีดฆ่าในไฟล์ · ก่อนหยิบงานให้เช็กโค้ดจริงก่อน · _ตรวจ 2026-09-23_ |
| 📚 | [🔍 รายงานตรวจสอบเต็มรูปแบบ (Full Audit) — 2026-09-01](docs/plans/AUDIT_2026-09-01.md) | ผลตรวจรอบ 2026-09-01 — เก็บเป็นประวัติ (ไม่ได้ไล่ติ๊กรายข้อในไฟล์นี้) · ฐานล่าสุดคือผลตรวจ `docs/audits/2026-09-23/` ซึ่งปิดครบ 99 ข้อ · _ตรวจ 2026-09-23_ |
| 📚 | [🤖 แผนงานและการแบ่งหน้าที่สำหรับ AI Agents (Multi-Agent Task Orchestration)](docs/plans/AGENTS_TASK_PLAN.md) | ประวัติ — milestone ในเอกสารติ๊กครบทุกข้อแล้ว · การแบ่งงานปัจจุบันใช้ agent:lock · _ตรวจ 2026-09-23_ |

<!-- PLANS_INDEX_END -->

---

## 🏛️ กฎเหล็ก 14 ข้อ

0. **บันทึกบทเรียนทุกครั้งที่แก้บั๊ก**: commit `fix` ต้องมี `--cause` และ `--prevention` (ระบบบล็อกอัตโนมัติถ้าไม่มี) → บันทึกลง `INCIDENT_LOG.md` ให้เอง
1. **บันทึกงานทุกครั้ง**: ทำเสร็จ/แก้บั๊ก/เพิ่มฟีเจอร์ → อัปเดต `docs/WORK_LOG.md` ทันที · **งานนั้นอยู่ในแผนไหน → แก้บรรทัด `> **สถานะ**:` ของแผนนั้น + รัน `npm run docs:index` ใน PR เดียวกัน** (ตารางแผนในไฟล์นี้สร้างอัตโนมัติ ห้ามแก้มือ · ด่าน CI ตรวจ)
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
13. **Auto-Merge Enforcement**: เปิด PR ต้องใช้ `npm run pr:auto` เสมอ เพื่อให้ CI ตรวจ 81 ด่าน ➔ Auto-Merge (Squash) ➔ Auto-Deploy Cloudflare Workers
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
- `npm run repo:verify` — ตรวจครบทั้ง 81 ด่าน (ใช้หลัก)
- `npm run typecheck` — typecheck อย่างเดียว
- `npm run log:sync` — ซิงก์สถานะ/บันทึกงาน (บังคับ)
- `npm run docs:status` — รายการแผนที่ยังเปิดอยู่ + อายุการตรวจล่าสุด (รันก่อนรายงานงานค้างทุกครั้ง)
- `npm run docs:index` — สร้างตารางแผนงานใน CLAUDE.md / docs/INDEX.md ใหม่จากหัวสถานะของไฟล์แผน
- `npm run cards:variants` — สร้างภาพไพ่ WebP หลายขนาด (รันเมื่อเปลี่ยนภาพต้นฉบับ)
- `npm run incident -- --title "..." --severity high --symptom "..." --cause "..." --fix "..." --prevention "..."` — บันทึก incident ด้วยมือ
- `npx tsx scripts/github-auto.ts status` — สถานะ repo/PR/CI ล่าสุด
- `npm run pr:auto -- "<title>" "<body>"` — ตรวจ + push + สร้าง PR (เติม `--wait` ให้รอ merge แล้วเก็บกวาด branch)
- `npm run git:tidy` — เก็บกวาด branch ที่ merge แล้ว (`--dry-run` เพื่อดูก่อน)
- `npm run cf:canonical-host -- --check` — ยิงจริงดูว่าโฮสต์ `www` เด้ง 301 กลับโดเมนหลักหรือยัง (ถอด `--check` = ดันกฎขึ้นขอบ · ต้องมี `CLOUDFLARE_API_TOKEN` สิทธิ์ `Zone · Single Redirect · Edit` **ไม่ใช่ `Transform Rules`**)
- `npm run dev` — รันเซิร์ฟเวอร์พัฒนา
