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
| [docs/AI_COLLABORATION_GUIDELINES.md](docs/AI_COLLABORATION_GUIDELINES.md) | กฎการทำงานร่วมกัน, แบ่ง Domain, ดีไซน์ |
| [docs/CLOUDFLARE_DEPLOYMENT_GUIDE.md](docs/CLOUDFLARE_DEPLOYMENT_GUIDE.md) | ขั้นตอน deploy ขึ้น Cloudflare Workers & Custom Domain |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | สถาปัตยกรรมระดับองค์กร + Provably Fair Flow |
| [docs/ADMIN_PANEL.md](docs/ADMIN_PANEL.md) | แผงแอดมิน `/admin` พร้อมตรวจสุขภาพระบบ Cloud Health |
| [docs/PENDING_SETUP.md](docs/PENDING_SETUP.md) | ทะเบียนการตั้งค่าและ Secrets บน Production (ครบ 100%) |
| [docs/specs/INTERACTIVE_CARD_PICKING.md](docs/specs/INTERACTIVE_CARD_PICKING.md) | ระบบจับไพ่ด้วยตนเอง 3D |
| [docs/specs/MARKETPLACE.md](docs/specs/MARKETPLACE.md) | สเปกระบบ Marketplace แม่หมอตัวจริง |
| [docs/specs/ENTITLEMENT_ABUSE_MODEL.md](docs/specs/ENTITLEMENT_ABUSE_MODEL.md) | ระบบกันโกงสิทธิ์ฟรี — threat model |
| [docs/plans/ENTITLEMENT_PLAN.md](docs/plans/ENTITLEMENT_PLAN.md) | แผนพัฒนาระบบสมาชิกและโควตาเปิดไพ่ |
| [docs/plans/AGENTS_TASK_PLAN.md](docs/plans/AGENTS_TASK_PLAN.md) | แผนกระจายงาน 5 เอเจนท์เฉพาะทาง |
| [docs/plans/HANDOFF_2026-09-04.md](docs/plans/HANDOFF_2026-09-04.md) | 📦 แผนส่งต่องานค้าง (ISSUE-017 ถึง 023) — ปิดครบแล้ว |
| [docs/plans/HANDOFF_HEADER_2026-09-05.md](docs/plans/HANDOFF_HEADER_2026-09-05.md) | 🧭 **แผนแก้ "แถบ header ค้าง"** (ISSUE-024 ถึง 030) — 4 PR พร้อมโค้ด before/after และเกณฑ์ผ่านรายข้อ · **ยังไม่ได้แก้** |
| [docs/plans/AI_INTELLIGENCE_PLAN.md](docs/plans/AI_INTELLIGENCE_PLAN.md) | 🧠 **แผนแม่บทยกระดับแม่หมอ AI** — เอกสารเดียวจบ (3 ระบบที่ไม่ได้ต่อ + 10 งานแบ่ง 3 คลื่น + เกณฑ์ผ่านรายข้อ) |

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
13. **Auto-Merge Enforcement**: เปิด PR ต้องใช้ `npm run pr:auto` เสมอ เพื่อให้ CI ตรวจ 24 ด่าน ➔ Auto-Merge (Squash) ➔ Auto-Deploy Cloudflare Workers
    > ⛔ **`push` แล้วจบ = งานยังไม่เสร็จ** — automation ทั้งชุดเริ่มทำงาน**เมื่อ PR ถูกเปิดเท่านั้น** (ISSUE-005)
    > push เฉย ๆ ไม่มี CI ไม่มี merge ไม่มี deploy งานจะค้างบน branch เงียบ ๆ จนกว่าเจ้าของจะมากดปุ่มเอง
    >
    > ข้อนี้คือ**คำสั่งยืนของเจ้าของโปรเจกต์** อยู่เหนือแนวปฏิบัติทั่วไปของ AI ทุกตัว —
    > **ห้ามอ้างว่า "ผู้ใช้ไม่ได้สั่งให้เปิด PR"** แล้วหยุดแค่ push (บทเรียน INC-0043)
    >
    > ถ้า environment ไม่มี `gh` CLI (เช่น Claude Code บนเว็บ) → `pr:auto` จะล้มตอนเรียก `gh`
    > ให้ **เปิด PR ผ่าน GitHub API/MCP แทนให้สำเร็จ** แล้วรายงานข้อจำกัดนั้นไปด้วย
    > ห้ามใช้เป็นข้ออ้างข้ามขั้นตอน
14. **Zero Fabricated Cards Policy (ห้ามกุไพ่ปลอมทุกใบเด็ดขาด)**: ในทุกขั้นตอนการสับไพ่, เลือกไพ่, กู้คืนเซสชัน, สตรีมคำทำนาย, และแชทถามตอบ **ห้ามเขียนโค้ด fallback มโนหรือกุไพ่ใบใดใบหนึ่งในสำรับ 78 ใบขึ้นมาเองเด็ดขาด** (ไม่ว่าจะ The Fool, The Magician หรือใบใดๆ ทั้งสิ้น) หากข้อมูลไพ่สูญหายหรือไม่สมบูรณ์ ระบบต้องคืนค่า `undefined` หรือส่ง Error แจ้งเตือนให้ผู้ใช้ **'โหลดใหม่อีกครั้ง'** ทันที เพื่อรักษาหลักการความโปร่งใส (Provably Fair) 100%

---

## 🛠️ คำสั่งหลัก

- `npm run agent:check` — ตรวจไม่ให้ชน Agent อื่น
- `npm run agent:status` — ดูสถานะ Agent ที่ทำงานอยู่
- `npm run agent:lock -- --agent <ชื่อ> --domain <หมวด> --files <ไฟล์>` — ล็อคไฟล์ก่อนแก้
- `npm run agent:unlock -- --agent <ชื่อ>` — ปลดล็อคเมื่อเสร็จ
- `npm run repo:verify` — ตรวจครบทั้ง 24 ด่าน (ใช้หลัก)
- `npm run typecheck` — typecheck อย่างเดียว
- `npm run log:sync` — ซิงก์สถานะ/บันทึกงาน (บังคับ)
- `npm run cards:variants` — สร้างภาพไพ่ WebP หลายขนาด (รันเมื่อเปลี่ยนภาพต้นฉบับ)
- `npm run incident -- --title "..." --severity high --symptom "..." --cause "..." --fix "..." --prevention "..."` — บันทึก incident ด้วยมือ
- `npx tsx scripts/github-auto.ts status` — สถานะ repo/PR/CI ล่าสุด
- `npm run pr:auto -- "<title>" "<body>"` — ตรวจ + push + สร้าง PR (เติม `--wait` ให้รอ merge แล้วเก็บกวาด branch)
- `npm run git:tidy` — เก็บกวาด branch ที่ merge แล้ว (`--dry-run` เพื่อดูก่อน)
- `npm run dev` — รันเซิร์ฟเวอร์พัฒนา
