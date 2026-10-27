# SeerTarot — คู่มือสำหรับเอเจนต์ AI ทุกตัว (Codex · Cursor · Copilot ฯลฯ)

กติกาทั้งหมดของโปรเจกต์อยู่ที่ **[CLAUDE.md](CLAUDE.md)** ไฟล์เดียว และใช้กับ AI ทุกตัว ไม่ใช่เฉพาะ Claude — **อ่านก่อนเริ่มงานทุกครั้ง แล้วทำตามทุกข้อ**
แผนที่เอกสารทั้งหมดอยู่ที่ [docs/INDEX.md](docs/INDEX.md) · ห้ามคัดลอกกฎจาก CLAUDE.md มาไว้ที่นี่

ข้อเฉพาะของไฟล์นี้: บล็อกด้านล่างเป็นของ Next.js — `next dev` เขียนทับเองทุกครั้งที่รัน ห้ามแก้ข้างในบล็อก (แก้แล้วจะถูกเขียนกลับ)
โปรเจกต์ใช้ Next.js เฉพาะ API และหน้าแอปบางส่วน หน้าเนื้อหาสาธารณะเป็น Astro — ดู [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
