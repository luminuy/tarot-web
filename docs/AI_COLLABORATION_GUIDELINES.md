# คู่มือการทำงานร่วมกันของ AI — วิธีทำงาน รายละเอียด และเหตุผล

> ใช้กับ AI ทุกตัว (Claude · Gemini · Antigravity · Codex · Cursor ฯลฯ) และคนที่แก้โค้ด
> **กฎเหล็ก (ข้อ 0–14) · เอกสารที่ต้องอ่านก่อนแก้โค้ด · ต้องจดอะไรที่ไหน · คำสั่งหลัก อยู่ที่ [CLAUDE.md](../CLAUDE.md) ที่เดียว** — ไฟล์นี้ไม่คัดลอกซ้ำ เก็บเฉพาะวิธีทำงาน (หัวข้อ 0 บังคับ) และรายละเอียด/เหตุผลที่ CLAUDE.md ไม่มี
> ตรวจกับโค้ดและ workflow ล่าสุด: 2026-10-27

## 0. มาตรฐานการทำงาน (บังคับ)

### 0.1 ก่อนแตะโค้ด

อ่านตามรายการ "ก่อนแก้โค้ด" ใน [CLAUDE.md](../CLAUDE.md) ให้ครบ · **ทำผิดซ้ำเรื่องที่มีบทเรียนอยู่แล้วใน INCIDENT_LOG = บกพร่องร้ายแรงที่สุด** เพราะแปลว่าไม่ได้อ่าน

### 0.2 หลักการทำงาน 8 ข้อ

1. **วัดก่อนเดา** — ห้ามสรุปสาเหตุจากการอ่านโค้ดอย่างเดียว ต้องมีหลักฐานจริง เช่น ผล `curl -sI` · ค่า `getComputedStyle` · log ของ CI · ตัวเลขที่วัดได้
   *ตัวอย่าง (INC-0001): ภาพไพ่เบลอ ยืนยันด้วย computed style และภาพก่อน/หลัง ไม่ใช่เดาจากชื่อคลาส CSS*
2. **หาสาเหตุราก ไม่ใช่ดับอาการ** — ถามจนตอบได้ว่า "ทำไมถึงเกิดได้ตั้งแต่แรก"
   *ตัวอย่าง (INC-0005): เทสต์ไม่ถูกรัน สาเหตุรากคือชุดตรวจถูกเขียนซ้ำ 4 ที่ จึงรวมเป็นที่เดียว ไม่ใช่แค่เติมบรรทัดที่ขาด*
3. **แก้อาการแรกแล้วรันซ้ำเสมอ** — error หนึ่งมักบังอีกตัวไว้
   *ตัวอย่าง (INC-0004 ➔ INC-0006): แก้ `gh` ใน worktree เสร็จจึงเห็นว่า auto-merge ปิดอยู่ แก้ต่อจึงเห็นว่า deploy ไม่เคยถูกเรียก*
4. **พิสูจน์ว่าแก้ได้จริง** — ทดสอบทั้งทางที่ผ่านและทางที่ต้องล้ม
   *ตัวอย่าง: ทดสอบ `repo:verify` โดยแกล้งใส่ TypeScript error เพื่อยืนยันว่า exit code เป็น 1 จริง*
5. **รายงานตามจริง** — ทดสอบไม่ครบให้บอกว่าไม่ครบและเพราะอะไร · ห้ามพูดว่า "เสร็จ" ถ้ายังไม่มีหลักฐาน
6. **หนึ่งเรื่องต่อหนึ่ง commit และบันทึกบทเรียนเสมอ** — ดูหัวข้อ 0.3
7. **อยู่ในขอบเขตงาน แต่ต้องจดสิ่งที่เจอ** — บั๊กที่ไม่เกี่ยวกับงานตอนนี้ ให้บันทึกลง [KNOWN_ISSUES.md](KNOWN_ISSUES.md) ไม่แก้พ่วงเงียบ ๆ และไม่ปล่อยผ่าน
8. **กฎที่ไม่มีเครื่องตรวจ คือกฎที่จะถูกละเมิดอีก** — ความผิดพลาดเดิมเกิดซ้ำทั้งที่มีกฎเขียนไว้ ให้เปลี่ยนกฎเป็นด่านตรวจใน `CHECKS` (`scripts/github-auto.ts`)
   *ตัวอย่าง (ISSUE-008): กฎ "ห้ามเขียน path ภาพไพ่เอง" มีบทเรียนอยู่แล้วแต่ยังหลุดถึง production จึงเพิ่ม `scripts/qa/test-image-paths.ts`*
   - เพิ่มด่านกับโค้ดที่ยังมีจุดละเมิดค้าง **ห้ามทำให้ CI พังทันที** (INC-0007) — ใช้หลัก ratchet: ใส่จุดเดิมไว้ใน `ALLOWLIST` พร้อมเหตุผลและเลข ISSUE ด่านบล็อกเฉพาะจุดใหม่ และเตือนให้ลบ allowlist เมื่อหนี้เก่าหมด

### 0.3 บันทึกบทเรียนเมื่อแก้บั๊ก

```bash
npm run commit -- --agent <ชื่อ> --type fix --scope <หมวด> \
  --msg "<แก้อะไร>" \
  --symptom "<อาการที่คนเจอเห็นครั้งแรก>" \
  --cause "<ทำไมถึงเกิดได้ตั้งแต่แรก — สาเหตุราก>" \
  --prevention "<กฎถาวรที่ทำให้เกิดซ้ำไม่ได้>" \
  --severity <critical|high|medium|low> \
  --verify "<พิสูจน์อย่างไรว่าแก้ได้จริง>"
```

- ขาด `--symptom` `--cause` หรือ `--prevention` ➔ `scripts/git-author-guard.ts` บล็อก commit · `--symptom` และ `--cause` ต้องไม่ก็อปมาจาก `--msg`
- ผ่านแล้ว ระบบเขียนบันทึกลง [INCIDENT_LOG.md](INCIDENT_LOG.md) **ก่อน** `git add` บันทึกจึงอยู่ใน commit เดียวกับตัวแก้เสมอ
- commit ด้วย `git` ตรง ๆ หรือเจอปัญหาที่ยังไม่ได้ commit ➔ บันทึกเองด้วย `npm run incident -- --title "..." --severity <ระดับ> --symptom "..." --cause "..." --fix "..." --prevention "..."`

### 0.4 ลำดับการทำงานมาตรฐาน

```bash
# 1. อ่านตาม CLAUDE.md "ก่อนแก้โค้ด" แล้วเช็กว่าไม่ชนเอเจนต์อื่น จากนั้นล็อกไฟล์ที่จะแก้
npm run agent:status
npm run agent:lock -- --agent <ชื่อ> --domain <หมวด> --files "src/a.ts,src/b.ts" --task "<งาน>"

# 2. แก้งาน — วัดก่อนเดา หาสาเหตุราก พิสูจน์ผลจริง

# 3. ตรวจครบชุด (hook ก่อน commit/push ก็รันตัวนี้)
npm run repo:verify

# 4. จดงาน: docs/WORK_LOG.md (แก้มือ · รอบใหม่อยู่บนสุด) · งานอยู่ในแผนไหนแก้บรรทัด "> **สถานะ**:" ของแผนนั้นแล้ว
npm run docs:index        # ห้ามแก้ตารางแผนใน CLAUDE.md / docs/INDEX.md ด้วยมือ — ด่าน CI เทียบทุกไบต์ (INC-0229)

# 5. commit — ถ้ามีเอเจนต์อื่นทำงานในโฟลเดอร์เดียวกัน คำสั่งนี้จะไม่ stage ทั้งหมดให้
#    ต้องระบุไฟล์ของตัวเองด้วย --files (หรือให้มันอ่านจาก agent:lock) · ทำคนเดียวยืนยันด้วย --all
npm run commit -- --agent <ชื่อ> --type <feat|fix|perf|refactor|docs> --scope <หมวด> --msg "..." --files "src/a.ts,src/b.ts"

# 6. ปลดล็อก
npm run agent:unlock -- --agent <ชื่อ>

# 7. เปิด PR — ขั้นนี้ห้ามข้าม (CLAUDE.md กฎข้อ 13 · INC-0015) · --wait = รอ merge แล้วกลับ main + ลบกิ่งให้
npm run pr:auto -- "<title>" --body-file <path> --wait

# 8. ไม่ได้ใส่ --wait ให้เก็บกวาดกิ่งที่ merge แล้วภายหลัง
npm run git:tidy
```

- ทำไมต้องเปิด PR: `pr.yml` (ตรวจ + merge) และ `deploy.yml` เริ่มทำงานจาก PR เท่านั้น — push เฉย ๆ งานค้างบนกิ่ง แล้วเอเจนต์ถัดไปเจอกิ่งล้าหลังและ conflict (เคยเกิดจริง: push 13 commit ทิ้งไว้ไม่มี PR) · `git:tidy` และ hook ก่อน push เตือนให้เมื่อมี commit นำหน้า main แต่ยังไม่มี PR
- `npm run log:sync` ไม่ได้เขียน WORK_LOG — มันเขียนสถานะระบบลง `docs/WORK_LOG.status.md` ซึ่งไม่อยู่ใน git

## 1. รายละเอียดและเหตุผลของกฎเหล็ก

ตัวกฎอยู่ใน [CLAUDE.md](../CLAUDE.md) — หัวข้อนี้มีแค่สิ่งที่ต้องรู้เพิ่มตอนลงมือ

| กฎ | รายละเอียดเพิ่มเติม |
| :-: | :--- |
| 2 (ห้ามอิโมจิ) | ตัวอย่างที่เคยหลุด: 🔮 📸 📜 💬 💡 📖 🌱 ⏳ 💾 📱 📋 📲 🧘 ⚠ ❌ ✦ ✨ ✧ ลูกศร ✓ ✕ ★ ▲ ▼ ▾ ◆ • · ปุ่มที่ต้องมีไอคอน (ปิด · ติ๊ก · พับ/กาง · ก่อน/ถัดไป · โหลดใหม่ · ปักหมุด) ใช้ SVG เส้นจาก `src/components/ui/LineIcons.tsx` · ลิงก์ไม่ต้องมีลูกศรต่อท้าย · ข้อความจาก AI ผ่าน `stripEmoji()` / `stripEmojiDeep()` (`src/lib/text/no-emoji.ts`) · ด่าน A5-03 (ข้อความในโค้ด .ts .tsx .astro) · A5-03b (ทางออกของข้อความ AI) · A5-03c (`GoldMark`) ใน `scripts/qa/test-code-debt.ts` |
| หลังไพ่ (เพิ่มเติม) | ลายหลังไพ่ใช้คลาส `.card-back-pattern` เท่านั้น ห้ามใส่ลูกแก้วกลมหรือดาวประดับ |
| 3 (Zero-Clipping) | เหตุผล: ไพ่ที่ยกตัวขึ้นตอนชี้/เลือกจะถูก `overflow-hidden` ของแถวตัดขอบบน — ไพ่บนแท่นต้องอยู่ใน canvas ผืนเดียวที่เว้นที่ด้านบนให้ไพ่ยกได้ · ข้อยกเว้นรางเลื่อนจอแคบดู CLAUDE.md |
| 4 (เปิดไพ่เอง) | สถานะเริ่มต้นคือ `revealedOrders = []` ใน `TarotFlow` · `SpreadBoard` มีปุ่มเปิดทั้งหมดให้ผู้ใช้กดเอง |
| 7 และการจัดวาง | ห้ามวางองค์ประกอบซ้อนจนความสูงรวมทับหัวข้อหรือเส้นแบ่ง · ห้ามชื่อยาวจนคำไทยถูกตัดกลางคำขึ้นบรรทัดใหม่ — ย่อชื่อให้สั้นแทน · แก้ UI แล้วตรวจทั้งจอมือถือและจอคอม |
| 8 (ท่อภาพไพ่) | `<CardImage />` ทำสองเรื่อง: บังคับ path เริ่มที่ `/cards/` (กัน sub-route ดึงผิดโฟลเดอร์) และเลือกไฟล์ย่อผ่าน `<picture>` + `srcset` · ส่ง `sizes` ตามความกว้างที่แสดงจริงเสมอ (ไม่ส่ง = ค่าเริ่มต้น `220px`) · `full` ใช้เฉพาะภาพใบใหญ่ (หน้าไพ่รายใบ · ซูม · วาดลง canvas) · ต้องการแค่ path ใช้ `getCardImageSrc()` จาก `src/lib/tarot/card-image.ts` |
| 8 (ไฟล์ภาพ) | ต้นฉบับ `public/cards/*.jpg` (~820px) · ไฟล์ย่อ WebP `w64` · `w128` · `w256` · `w320` · `w512b` · `w768b` (รายการต้องตรงกันระหว่าง `CARD_IMAGE_VARIANTS` กับ `scripts/generate-card-variants.ts`) · AVIF ไม่มีในรีโป ImageKit แปลงให้ตอนร้องขอ · ห้าม `image-rendering: crisp-edges`/`pixelated`/`-webkit-optimize-contrast` กับภาพไพ่ (ย่อแบบ nearest-neighbour แล้วแตก) |
| 8 (แคชภาพ) | `public/_headers` ตั้ง `/cards/*.jpg` และ `/cards/*.webp` เป็น `max-age=31536000, immutable` — **เปลี่ยนภาพต้องเปลี่ยนชื่อไฟล์หรือโฟลเดอร์** ไม่งั้นคนเคยเข้าเว็บเห็นภาพเก่าไปหนึ่งปี · ห้ามเขียนกฎเป็น `/cards/*` เฉย ๆ (จะครอบหน้า HTML ไพ่รายใบไปด้วย) · ภาพอยู่บน Workers Static Assets อยู่แล้ว ไม่ต้องย้ายไป R2/Cloudflare Images |
| 10 (ภาษาคน) | ใช้ "เมนู" ไม่ใช่ "เมนูวิหาร" · "ความหมายไพ่" ไม่ใช่ "Major & Minor Arcana" ใน UI หลัก · "ประวัติการดูดวง" · "เริ่มดูดวงใหม่" · ภาษาอังกฤษก็ต้องเป็นธรรมชาติ (เช่นผันพหูพจน์ตามตัวเลข) |
| 11 (ล็อกไฟล์) | `--files` คั่นด้วยจุลภาค · ไม่ใส่ `--files` = ล็อกทุกไฟล์ (`*`) · ล็อกมีวันหมดอายุ · ไฟล์ล็อก `.ai-locks.json` อยู่ในเครื่องเท่านั้น เอเจนต์คนละเครื่องมองไม่เห็นกัน ให้ดู PR ที่เปิดอยู่ด้วย |
| 11 (`gh` ใน worktree) | `gh pr merge` / `gh pr checkout` ที่ไม่ระบุ repo จะไปแตะ git ในเครื่องแล้วพังด้วย `'main' is already checked out` — ใส่ `-R <owner>/<repo>` เสมอ (`pr:auto` ใส่ให้แล้ว) |
| 14 (ห้ามกุไพ่) | ไพ่ที่ "คำนวณได้" (Pick a Card · ไพ่วันเกิด) ใช้เส้นทางแยกใน `src/lib/reading/derived-draw.ts` ซึ่งหาไพ่ไม่เจอต้องคืน `undefined` เช่นกัน — ดู [ARCHITECTURE.md](ARCHITECTURE.md#4-provably-fair--การสับไพ่ที่ตรวจได้) |

## 2. แผนที่ไฟล์ตามหน้าที่

| หน้าที่ | ไฟล์หลัก | ข้อควรระวัง |
| :--- | :--- | :--- |
| พิธีเปิดไพ่ทั้งเส้น | `src/components/home/TarotFlow.tsx` + `flow-*.ts` · ลำดับขั้นใน `ritual-step.ts` (เลือกผัง ➔ ตั้งคำถาม/เลือกแม่หมอ ➔ สับ ➔ เลือกไพ่ ➔ อ่าน ➔ สรุป) | ลำดับใน `STEP_ORDER` ต้องตรงกับชนิด `RitualStep` (ทิศแอนิเมชันคำนวณจากลำดับ) |
| ตั้งคำถาม | `src/components/reading/IntentionAltarInput.tsx` | มีด่านความปลอดภัยก่อนส่ง |
| สับและเลือกไพ่ | `src/components/deck/ShuffleRitual.tsx` · `InteractiveCardFan.tsx` | พัด 78 ใบต้องอยู่ใน canvas ผืนเดียว |
| วางไพ่บนผัง | `src/components/spread/SpreadBoard.tsx` · `src/lib/tarot/spread-map-geometry.ts` (`mapLayout`) | ไพ่คว่ำหน้าเริ่มต้น |
| คำอ่าน | `src/components/reading/StreamReader.tsx` · `FollowUpChat.tsx` · `ProvablyFairPanel.tsx` | ข้อความ AI ผ่าน `stripEmoji()` |
| คลังผัง `/spreads` | `src/components/spread/SpreadsLibrary.tsx` · `src/data/spread-shelves.ts` (6 หมวด) | ทุกผังต้องอยู่หมวดเดียวพอดี (ด่าน `test-spreads`) |
| API เปิดไพ่ | `src/app/api/reading/start` · `[id]/shuffle` · `read` · `chat` · `clarify` · `explain` · `perspective` | ผ่านเพดานถี่และเพดานงบ AI ทุกเส้น |
| AI | `src/lib/ai/` (`groq.ts` · `gemini.ts` · `openrouter.ts` · `prompt.ts` · `gateway.ts`) | รายชื่อโมเดลมาจากผลวัดเท่านั้น (INC-0053) |
| สับไพ่และตรวจ | `src/lib/tarot/shuffle.ts` · `verify-client.ts` · `src/lib/reading/derived-draw.ts` | ห้ามเปลี่ยนสูตรสับ — ตัวตรวจฝั่งเบราว์เซอร์ต้องได้ผลตรงทุกไบต์ |
| ข้อมูล | `src/data/cards/` (78 ใบ) · `spreads.ts` · `personas.ts` · `pick-a-card*.ts` · `articles.ts` | แก้ชื่อไพ่ต้องผ่าน `scripts/verify-cards.ts` |
| ภาพไพ่ | `src/components/card/CardImage.tsx` · `src/lib/tarot/card-image.ts` · `scripts/generate-card-variants.ts` · `public/_headers` | ดูกฎข้อ 8 ในหัวข้อ 1 |
| สิทธิ์และโควตา | `src/lib/entitlement/` — ตัวเลขทั้งหมดอยู่ใน `limits.ts` ที่เดียว | ห้ามพิมพ์ตัวเลขสิทธิ์ซ้ำที่อื่น |
| ความปลอดภัย | `src/lib/safety/` · `src/lib/security/` | ห้ามลบตัวกรองหรือข้อความแจ้งว่าเป็น AI |
| ฐานข้อมูล | `src/lib/platform/db.ts` · `cf.ts` · `kv-store.ts` · `migrations/` | ตารางใหม่ = ไฟล์ migration ใหม่เท่านั้น |
| สมุดดวง | `src/lib/journal/` · `src/components/journal/` | ตารางที่มี `user_id` ต้องลงทะเบียนใน `src/lib/privacy/user-data.ts` |
| แม่หมอตัวจริง | `src/app/(th)/readers/` · `src/components/readers/` · `src/lib/marketplace/` | ดู [specs/MARKETPLACE.md](specs/MARKETPLACE.md) |
| แอดมิน | `src/app/(th)/admin/` · `src/components/admin/` · `src/app/api/admin/` | ดู [ADMIN_PANEL.md](ADMIN_PANEL.md) |
| เสียง | `src/lib/utils/audio.ts` | เปิด/ปิดเสียงผ่าน `soundManager` เท่านั้น |
| หน้า Astro | `astro/pages/` · `astro/islands/` · `astro/shims/` | กติกา island ใน [plans/HANDOFF_ASTRO_MIGRATION_2026-09-15.md](plans/HANDOFF_ASTRO_MIGRATION_2026-09-15.md) |
| ด่านตรวจ | `scripts/github-auto.ts` (`CHECKS`) · `scripts/qa/` | ดูหัวข้อ 4 |

## 3. ความปลอดภัยและความเป็นส่วนตัว

1. **ด่านวิกฤต** — สัญญาณทำร้ายตัวเองถูกบล็อกก่อนถึงโมเดล แล้วแสดงสายด่วนสุขภาพจิต 1323 · สะมาริตันส์ 02-713-6793 · เหตุฉุกเฉิน 1669 (`src/lib/safety/guardrails.ts`) · ประโยคอ้อมที่ regex ไม่จับ ส่งให้ตัวจำแนก Workers AI (`ai-classifier.ts`)
2. **ขอบเขตของ AI** — ห้ามวินิจฉัยโรค ทำนายสุขภาพ การตั้งครรภ์ หรือยา · ห้ามให้คำแนะนำทางกฎหมายหรือทำนายผลคดี · ห้ามฟันธงการลงทุน หุ้น คริปโต หรือให้เลขหวย
3. **บอกว่าเป็น AI** — คำอ่านทุกชิ้นแนบข้อความแจ้งว่าเขียนโดย AI ไม่ใช่คนจริง (`AI_DISCLOSURE`)
4. **ข้อมูลส่วนบุคคล (PDPA)**
   - สมาชิก: สมุดดวงและประวัติเก็บใน D1 · ขอสำเนาได้ที่ `/api/account/export` · ลบทั้งหมดด้วย `DELETE /api/account`
   - ตารางใหม่ที่มี `user_id` ต้องลงทะเบียนใน `src/lib/privacy/user-data.ts` ที่เดียว ทั้งสองเส้นทางข้างบนจะครอบคลุมเอง
   - ข้อมูลส่วนตัวในคำถาม (เบอร์โทร · อีเมล ฯลฯ) ถูกซ่อนก่อนส่งเข้า prompt (`src/lib/security/pii.ts`)
   - ข้อมูลที่ส่งให้ผู้ให้บริการ AI และสัญญาประมวลผลข้อมูล ดู [legal/READER_STUDIO_DPA_DRAFT.md](legal/READER_STUDIO_DPA_DRAFT.md) และ [adr/ADR-001-marketplace-pdpa.md](adr/ADR-001-marketplace-pdpa.md)

## 4. ด่านตรวจ (`npm run repo:verify`)

- ชุดตรวจทั้งหมดนิยามที่เดียวคือ `CHECKS` ใน [`scripts/github-auto.ts`](../scripts/github-auto.ts) (ตอนนี้ 96 ด่าน) — ใช้ร่วมกันโดย `.githooks/pre-commit` · `.githooks/pre-push` · `npm run commit` · `pr.yml` · `deploy.yml`
- **เพิ่มสคริปต์ใน `scripts/qa/` ต้องเพิ่มเข้า `CHECKS` ด้วยเสมอ** ไม่งั้นด่านนั้นไม่เคยถูกรันอัตโนมัติ
- CI บิลด์ก่อนรัน `repo:verify` เสมอ เพราะด่านบางตัวอ่านไฟล์ที่ได้จากการบิลด์ — รันในเครื่องโดยไม่ได้บิลด์ ผลของด่านกลุ่มนั้นอาจไม่ตรงกับ CI
- ด่านที่เฝ้าเอกสาร: `scripts/qa/test-docs-numbers.ts` (ตัวเลขในเอกสารแม่บท · เลข INC ที่อ้างต้องมีจริง · ตารางแผนต้องตรงกับหัวสถานะ · ไฟล์ผู้ช่วยใน `.claude/agents/`)
- ประวัติงานที่เคยอยู่ท้ายไฟล์นี้ย้ายไปอยู่ใน [WORK_LOG.md](WORK_LOG.md) และ `docs/archive/work-log/` แล้ว
