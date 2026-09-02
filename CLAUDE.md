# 🔮 คู่มือแม่บทวิศวกรรม (AI Operating Guidelines)

เว็บดูดวงไพ่ทาโรต์ออนไลน์พรีเมียม (Interactive Provably-Fair Tarot Web)

> 💬 **สไตล์การตอบแชท**: ตอบสั้น กระชับ ได้ใจความ ไม่ต้องอธิบายยืดยาว (คำสั่งจากเจ้าของโปรเจกต์)

> ⚠️ **ก่อนแก้โค้ด ต้องอ่าน 4 ไฟล์นี้เสมอ**
> 1. [docs/INCIDENT_LOG.md](docs/INCIDENT_LOG.md) — บทเรียนความผิดพลาด + กฎป้องกันถาวร **ทำผิดซ้ำ = บกพร่องร้ายแรงสุด**
> 2. [docs/KNOWN_ISSUES.md](docs/KNOWN_ISSUES.md) — บั๊กค้าง กันแก้ซ้ำกับ Agent อื่น
> 3. [docs/BACKLOG.md](docs/BACKLOG.md) — งานที่เหลือ + กติกา (ห้าม push ตรง main, 1 milestone = 1 PR)
> 4. [docs/AI_COLLABORATION_GUIDELINES.md](docs/AI_COLLABORATION_GUIDELINES.md) — คู่มือแม่บท (หัวข้อ 0 = มาตรฐานบังคับ)

---

## 🧭 ดัชนีเอกสาร

| ไฟล์ | เนื้อหา |
|---|---|
| [INCIDENT_LOG.md](docs/INCIDENT_LOG.md) | บทเรียนความผิดพลาด (INC-0001–0019) — อ่านก่อนเสมอ |
| [KNOWN_ISSUES.md](docs/KNOWN_ISSUES.md) | บั๊กค้าง/สถานะระบบ |
| [WORK_LOG.md](docs/WORK_LOG.md) | ประวัติงานที่ทำ — **ต้องอัปเดตทุกครั้ง** |
| [AI_COLLABORATION_GUIDELINES.md](docs/AI_COLLABORATION_GUIDELINES.md) | กฎการทำงานร่วมกัน, แบ่ง Domain, ดีไซน์ |
| [CLOUDFLARE_DEPLOYMENT_GUIDE.md](docs/CLOUDFLARE_DEPLOYMENT_GUIDE.md) | ขั้นตอน deploy ขึ้น Cloudflare Workers |
| [ARCHITECTURE.md](docs/ARCHITECTURE.md) | สถาปัตยกรรม + Provably Fair Flow |
| [INTERACTIVE_CARD_PICKING.md](docs/INTERACTIVE_CARD_PICKING.md) | ระบบจับไพ่ด้วยตนเอง |
| [AGENTS_TASK_PLAN.md](docs/AGENTS_TASK_PLAN.md) | แผนกระจายงาน 5 เอเจนท์ + Milestone |
| [ADMIN_PANEL.md](docs/ADMIN_PANEL.md) | แผงแอดมิน `/admin` (Phase 1: M0–M3 เสร็จ) |
| [MARKETPLACE.md](docs/MARKETPLACE.md) | HANDOFF Phase 2 — Marketplace แม่หมอ M4–M7 |
| [ENTITLEMENT_PLAN.md](docs/ENTITLEMENT_PLAN.md) | HANDOFF — ระบบสมาชิก/โควตาเปิดไพ่ |
| [PENDING_SETUP.md](docs/PENDING_SETUP.md) | งานตั้งค่า production ที่ค้าง (สำหรับเจ้าของ) |
| [ENTITLEMENT_ABUSE_MODEL.md](docs/ENTITLEMENT_ABUSE_MODEL.md) | ระบบกันโกงสิทธิ์ฟรี — threat model |

---

## 🏛️ กฎเหล็ก 13 ข้อ

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
13. **Auto-Merge Enforcement**: เปิด PR ต้องใช้ `npm run pr:auto` เสมอ (CI 7 ด่าน ➔ Auto-Merge ➔ Auto-Deploy)

---

## 🛠️ คำสั่งหลัก

- `npm run agent:check` — ตรวจไม่ให้ชน Agent อื่น
- `npm run agent:status` — ดูสถานะ Agent ที่ทำงานอยู่
- `npm run agent:lock -- --agent <ชื่อ> --domain <หมวด> --files <ไฟล์>` — ล็อคไฟล์ก่อนแก้
- `npm run agent:unlock -- --agent <ชื่อ>` — ปลดล็อคเมื่อเสร็จ
- `npm run repo:verify` — ตรวจครบ 7 ด่าน (ใช้หลัก)
- `npm run typecheck` — typecheck อย่างเดียว
- `npm run log:sync` — ซิงก์สถานะ/บันทึกงาน (บังคับ)
- `npm run cards:variants` — สร้างภาพไพ่ WebP หลายขนาด (รันเมื่อเปลี่ยนภาพต้นฉบับ)
- `npm run incident -- --title "..." --severity high --symptom "..." --cause "..." --fix "..." --prevention "..."` — บันทึก incident ด้วยมือ
- `npx tsx scripts/github-auto.ts status` — สถานะ repo/PR/CI ล่าสุด
- `npm run pr:auto -- "<title>" "<body>"` — ตรวจ + push + สร้าง PR (เติม `--wait` ให้รอ merge แล้วเก็บกวาด branch)
- `npm run git:tidy` — เก็บกวาด branch ที่ merge แล้ว (`--dry-run` เพื่อดูก่อน)
- `npm run dev` — รันเซิร์ฟเวอร์พัฒนา
