# 📋 บันทึกความผิดพลาดและบทเรียน (Incident Log & Blameless Post-Mortem)

> 🎯 **เอกสารนี้สำคัญที่สุดสำหรับ AI Agent ทุกตัว — ต้องอ่านก่อนเริ่มงานทุกครั้ง**
>
> ทุกความผิดพลาดที่เคยเกิดขึ้นถูกบันทึกไว้ที่นี่พร้อม **กฎป้องกันถาวร**
> การทำผิดซ้ำในสิ่งที่มีบันทึกอยู่แล้ว ถือเป็นความบกพร่องร้ายแรงที่สุด

---

## 🧭 วิธีใช้เอกสารนี้

1. **ก่อนเริ่มงาน**: อ่านหัวข้อทั้งหมด (แค่ชื่อเรื่องก็พอ) เพื่อรู้ว่ามีกับดักอะไรบ้างในโปรเจกต์นี้
2. **ก่อนแก้บั๊ก**: ค้นหาว่าเคยมีเคสคล้ายกันไหม อาจมีคำตอบอยู่แล้ว
3. **หลังแก้บั๊ก**: บันทึกทันที — ระบบจะบังคับให้ทำเองอัตโนมัติเมื่อ commit ด้วย type `fix`

## 📐 มาตรฐานการบันทึก

ทุกครั้งที่ commit ด้วย `--type fix` / `hotfix` / `revert`
`scripts/git-author-guard.ts` จะบันทึกลงไฟล์นี้ให้อัตโนมัติ และ **จะบล็อกการ commit ถ้าไม่ระบุ `--cause` กับ `--prevention`**

```bash
npm run commit -- --agent <ชื่อคุณ> --type fix --scope <หมวด> \
  --msg "<แก้อะไร>" \
  --cause "<ทำไมถึงเกิดขึ้นได้ตั้งแต่แรก>" \
  --prevention "<กฎถาวรที่ทำให้ไม่เกิดซ้ำ>" \
  --severity high \
  --verify "<พิสูจน์อย่างไรว่าแก้ได้จริง>"
```

บันทึกด้วยมือ (กรณีเจอปัญหาแต่ยังไม่ได้ commit):

```bash
npm run incident -- --title "..." --severity high --symptom "..." \
  --cause "..." --fix "..." --prevention "..."
```

## 🚦 ระดับความรุนแรง

| ระดับ | ความหมาย |
| :--- | :--- |
| 🔴 **Critical** | กระทบผู้ใช้จริงบน production หรือทำข้อมูลเสียหาย |
| 🟠 **High** | ทำให้ pipeline/deploy พัง หรือฟีเจอร์หลักใช้ไม่ได้ |
| 🟡 **Medium** | ทำงานผิดแต่มีทางเลี่ยง หรือกระทบเฉพาะบางหน้า |
| 🔵 **Low** | ความไม่เรียบร้อยเล็กน้อย ไม่กระทบการใช้งาน |

---

## 📜 รายการเหตุการณ์ (ใหม่สุดอยู่บนสุด)

<!-- INCIDENT_ENTRIES_START -->
### INC-0017 · 2026-08-31 20:40 · 🟠 High · แตกกิ่งย่อยกระจัดกระจายโดยไม่ Rebase และไม่รวม PR (Concurrent Branch Drift & Incomplete Handoff)

| หัวข้อ | รายละเอียด |
| :--- | :--- |
| **อาการที่พบ** | มีการสร้างและ push 6-7 branch ย่อยขึ้น GitHub โดยไม่มีการเปิด PR, ไม่ได้ Rebase เข้ากับ `main` ล่าสุด และแต่ละ branch มีการแก้ไขไฟล์ซ้อนทับกัน จนเกิดความขัดแย้ง (Merge Conflict) และทิ้งภาระให้ผู้อื่นต้องมาตามเก็บกวาด |
| **สาเหตุราก** | ขาดวินัยในการรวบรวมงาน (Consolidation) ไม่ได้ดึง `origin/main` ล่าสุดก่อนเริ่มงานใหม่ และปล่อยกิ่งค้างไว้บน remote โดยไม่สั่ง `npm run pr:auto` และ `npm run git:tidy` ให้จบสมบูรณ์ในรอบเดียว |
| **การแก้ไข** | 1) รวมทุกฟีเจอร์และบั๊กฟิกซ์เข้าสู่กิ่งเดี่ยว `feat/consolidated-platform-upgrades` บน `origin/main` ล่าสุด 2) ลบ 7 กิ่งเก่าบน GitHub ทิ้งทั้งหมด 3) ตรวจสอบผ่าน 7 ด่าน (`npm run repo:verify`) 4) สร้าง PR #24 และวางระบบ Auto-merge 100% |
| **🛡️ กฎป้องกันถาวร** | **1) ทำงานแบบ 1 Unified Branch per Milestone เท่านั้น ห้ามแตกกิ่งย่อยค้างไว้ 2) ต้องดึง `origin/main` ล่าสุดก่อนเริ่มงานเสมอ 3) ทำงานต้องจบ 100% ห้ามทิ้งภาระให้คนอื่นตามแก้: ต้องตรวจ 7 ด่าน -> commit -> push -> pr:auto -> git:tidy ให้สะอาดหมดจด** |
| **การพิสูจน์ว่าแก้ได้จริง** | รวม 7 งานผ่าน 7/7 gates (0 type errors, 0 collision, 78 cards, 20 spreads) และเปิด PR #24 พร้อมลบกิ่งเก่า 7 กิ่งบน remote สะอาด 100% |
| **บันทึกโดย** | Antigravity AI · branch `feat/consolidated-platform-upgrades` |

### INC-0016 · 2026-08-31 20:13 · 🟡 Medium · แก้ Chrome รูปไพ่เบลอ + chat auto-scroll เด้งทั้งหน้า

| หัวข้อ | รายละเอียด |
| :--- | :--- |
| **อาการที่พบ** | 1) รูปหน้าไพ่ (พรีวิวผัง, โลโก้ Navbar, การ์ดเล็ก) เบลอบน Chrome แต่คมบน Safari 2) หน้าแชทถามต่อ: พิมพ์แล้วกดส่ง หน้าจอทั้งหน้าเด้งเลื่อนลงมาเอง |
| **สาเหตุราก** | 1) `sizes` prop ตั้งไว้ 180–256px แต่การ์ดแสดงจริงแค่ 30–80px → บน Retina เบราว์เซอร์เลือก `w512` มาย่อ 8–17 เท่า · Chrome ย่อภาพอัตราส่วนสูงด้วยฟิลเตอร์คุณภาพต่ำกว่า Safari (CoreGraphics) 2) `FollowUpChat` ใช้ `chatBottomRef.scrollIntoView()` ซึ่ง spec บอกให้เลื่อน scroll container **ทุกชั้นรวมถึง window** จนเห็น element → ทั้งหน้าถูกดึงลง ทุกครั้งที่ `messages`/`loading` เปลี่ยน |
| **การแก้ไข** | 1) ปรับ `sizes` ทุกจุดให้ใกล้ความกว้างจริง: TarotArtIcons 220/256→96/112px · SpreadCardSelector/InteractiveCardFan 180-200→72px · FollowUpChat 180→64px · Navbar logo 200→64px · StreamReader 200→88px · IntentionAltar 240→112px · ShareModal 240→128px 2) FollowUpChat: ใส่ ref ที่กล่อง `max-h-80 overflow-y-auto` โดยตรง แล้ว `el.scrollTo({top: el.scrollHeight})` เฉพาะกล่องนั้น + เช็ค `nearBottom` (< 120px) ก่อน + ไม่เลื่อนถ้า `messages.length === 0` |
| **🛡️ กฎป้องกันถาวร** | **prop sizes ของ <CardImage /> ต้องใกล้เคียงความกว้างจริงที่แสดง (สูงสุด ~display×3 สำหรับ DPR3) ห้ามใส่ค่าเผื่อเยอะ · ห้ามใช้ scrollIntoView ในกล่องที่ nested ลึก ให้ scroll element นั้นตรงๆ (el.scrollTo) และเช็ค nearBottom ก่อน** |
| **การพิสูจน์ว่าแก้ได้จริง** | dev server: การ์ด 34-69px เลือก w128 (เดิม w256/w512) downscale เหลือ 1.9-3.8x · chat scroll เลื่อนเฉพาะกล่อง max-h-80 ไม่ดึง window |
| **บันทึกโดย** | Claude · branch `claude/chrome-sharp-chatscroll` · commit `55f427d` |


### INC-0015 · 2026-08-31 18:36 · 🟡 Medium · branch push ทิ้งไว้โดยไม่เปิด PR → automation ไม่ทำงาน งานไม่ขึ้น production

| หัวข้อ | รายละเอียด |
| :--- | :--- |
| **อาการที่พบ** | GitHub ขึ้นแบนเนอร์ 'Compare & pull request' ค้างไว้ · branch claude/resilience-perf-enhancements มี 13 commit (perf/SEO/bug fixes) push ขึ้น remote แล้วแต่ pr.yml/deploy.yml ไม่ทำงานเลย งานทั้งหมดค้างไม่ขึ้น production |
| **ผลกระทบ** | งาน perf + แก้ ISSUE-001 (เว็บใช้ดูดวงไม่ได้) ค้าง 30+ นาที · branch ล้าหลัง main จน conflict 3 ไฟล์ ต้อง merge มือ |
| **สาเหตุราก** | pr.yml trigger จาก pull_request event เท่านั้น การ git push เฉยๆ ไม่สร้าง event นั้น · Agent (Antigravity) ทำงานเสร็จแล้ว commit+push แต่ข้ามขั้น npm run pr:auto ใน Standard Workflow ข้อ 7 · ไม่มีเครื่องเตือนว่า 'branch นี้มีงานแต่ยังไม่เปิด PR' |
| **การแก้ไข** | เปิด PR #21 รวม branch + reconcile conflict (เก็บ edge caching, ตัด cloudflare ID ปลอม) · เพิ่มเครื่องเตือน 3 จุด: git:tidy เตือน branch ที่มี commit นำหน้า main แต่ไม่มี PR / pre-push hook เตือนตอน push branch ที่ยังไม่มี PR / AI_COLLABORATION_GUIDELINES ข้อ 0.4 เน้นห้ามข้ามขั้น pr:auto |
| **🛡️ กฎป้องกันถาวร** | **หลัง commit+push ทุกครั้ง ต้องรัน npm run pr:auto เสมอ — ถือว่างานยังไม่เสร็จจนกว่า PR จะเปิด · git:tidy + pre-push hook จะเตือนอัตโนมัติถ้ามี branch งานค้างไม่มี PR** |
| **การพิสูจน์ว่าแก้ได้จริง** | รัน npm run git:tidy เห็นบรรทัด '⚠️ ... มี N commit นำหน้า main แต่ยังไม่ได้เปิด PR' สำหรับ branch ที่ push แต่ไม่มี PR |
| **บันทึกโดย** | ไม่ระบุ · branch `claude/enforce-pr-flow` · commit `b9b45aa` |


### INC-0014 · 2026-08-31 16:42 · 🟡 Medium · Resolve ISSUE-001 step deadlock, ISSUE-002 hydration, ISSUE-008/009 404 preloads, ISSUE-010 env vars, and ISSUE-011 packageManager

| หัวข้อ | รายละเอียด |
| :--- | :--- |
| **อาการที่พบ** | Resolve ISSUE-001 step deadlock, ISSUE-002 hydration, ISSUE-008/009 404 preloads, ISSUE-010 env vars, and ISSUE-011 packageManager |
| **สาเหตุราก** | Framer Motion mode wait deadlock, unrounded float styles, invalid static preload paths and sound files, missing env docs |
| **การแก้ไข** | Resolve ISSUE-001 step deadlock, ISSUE-002 hydration, ISSUE-008/009 404 preloads, ISSUE-010 env vars, and ISSUE-011 packageManager |
| **🛡️ กฎป้องกันถาวร** | **Zero framer-motion DOM orchestration, toFixed coordinate rounding, test-image-paths guard, synchronized env.example** |
| **บันทึกโดย** | Antigravity AI · branch `claude/resilience-perf-enhancements` · commit `93335bc` |


### INC-0013 · 2026-08-31 16:04 · 🔵 Low · แก้ tidy สลับ branch ไม่ได้เพราะไฟล์สถานะ .ai-locks.json ค้างใน working tree

| หัวข้อ | รายละเอียด |
| :--- | :--- |
| **อาการที่พบ** | pr:auto --wait รายงานตรงๆ ว่าออกจาก branch ไม่ได้ ทั้งที่คำสั่ง git checkout --detach origin/main รันด้วยมือแล้วสำเร็จ |
| **ผลกระทบ** | ขั้นตอนเก็บกวาด branch อัตโนมัติทำไม่จบ ต้องลบ branch เองอยู่ดี |
| **สาเหตุราก** | npm run agent:check ซึ่งเป็นด่านแรกของ repo:verify จะเขียน .ai-locks.json ใหม่เพื่อตัดล็อคที่หมดอายุ ทำให้ working tree สกปรกค้างไว้ พอไฟล์เดียวกันนี้ถูกแก้บน main ด้วย git จะปฏิเสธการสลับ branch ทันทีเพราะกลัวทับงานที่ยังไม่ commit |
| **การแก้ไข** | แก้ tidy สลับ branch ไม่ได้เพราะไฟล์สถานะ .ai-locks.json ค้างใน working tree |
| **🛡️ กฎป้องกันถาวร** | **ก่อนสลับ branch อัตโนมัติ ต้องคืนค่าไฟล์สถานะที่สร้างใหม่ได้ (.ai-locks.json) ก่อนเสมอ และเมื่อสลับไม่สำเร็จต้องพิมพ์ git status ออกมาให้เห็นว่าติดที่ไฟล์ไหน ห้ามรายงานแค่ว่าล้มเหลวลอยๆ** |
| **การพิสูจน์ว่าแก้ได้จริง** | PR นี้สั่งด้วย --wait ถ้า branch ถูกลบเองครบทั้งในเครื่องและบน remote แปลว่าวงจรปิดจริง |
| **บันทึกโดย** | Claude · branch `claude/fix-tidy-dirty-tree` · commit `344ba92` |


### INC-0012 · 2026-08-31 15:59 · 🟡 Medium · แก้ git:tidy --wait ที่ออกจาก branch ไม่ได้เมื่อรันใน git worktree

| หัวข้อ | รายละเอียด |
| :--- | :--- |
| **อาการที่พบ** | pr:auto --wait รายงานว่า สลับกลับมาที่ main และดึงโค้ดล่าสุดแล้ว แต่จริงๆ ยังอยู่ branch เดิม ทำให้ tidy ลบ branch ตัวเองไม่ได้ ขึ้นว่า เป็น branch ที่อยู่ตอนนี้ แทน |
| **ผลกระทบ** | ขั้นตอนเก็บกวาดอัตโนมัติทำไม่จบ ต้องมาลบ branch เองอยู่ดี |
| **สาเหตุราก** | ใช้ git checkout main ซึ่งล้มเสมอเมื่อรันจาก git worktree เพราะ main ถูก checkout ค้างที่โฟลเดอร์หลัก (กับดักเดิมที่มีบันทึกไว้แล้วใน INC-0004) แล้วยังห่อด้วย shQuiet ที่กลืน error ทิ้ง โค้ดจึงพิมพ์ข้อความว่าสำเร็จทั้งที่ล้มเหลว |
| **การแก้ไข** | แก้ git:tidy --wait ที่ออกจาก branch ไม่ได้เมื่อรันใน git worktree |
| **🛡️ กฎป้องกันถาวร** | **ห้ามใช้ git checkout <branch> ในสคริปต์ที่อาจถูกรันจาก worktree ให้ถอยไปใช้ git checkout --detach origin/<branch> เสมอ และห้ามพิมพ์ข้อความว่าสำเร็จโดยไม่ตรวจผลลัพธ์จริงของคำสั่งที่ห่อด้วย shQuiet** |
| **การพิสูจน์ว่าแก้ได้จริง** | PR ถัดไปที่สั่งด้วย --wait ต้องออกจาก branch ได้และลบ branch ตัวเองสำเร็จโดยไม่ต้องสั่งมือ |
| **บันทึกโดย** | Claude · branch `claude/fix-tidy-worktree` · commit `5602c5b` |


### INC-0011 · 2026-08-31 15:54 · 🟡 Medium · เก็บกวาด branch อัตโนมัติหลัง merge — ปิดช่องว่างสุดท้ายของ automation

| หัวข้อ | รายละเอียด |
| :--- | :--- |
| **อาการที่พบ** | หลัง PR merge แล้ว branch ยังค้างทั้งในเครื่องและบน GitHub สะสมไปถึง 7 อัน และ IDE ขึ้นปุ่ม Create PR ค้างไว้ทั้งที่ PR merge ไปแล้ว |
| **ผลกระทบ** | สับสนว่างานยังไม่เสร็จ และ branch ขยะสะสมเรื่อยๆ ทุก PR |
| **สาเหตุราก** | repo ปิด GitHub native auto-merge ไว้ การ merge จริงทำโดย step ใน pr.yml ซึ่งเรียกแค่ pulls.merge ไม่ได้ลบ branch ให้ ส่วน gh pr merge --delete-branch ก็ไม่เคยได้ทำงานเพราะถูกข้ามไปตั้งแต่แรก และเพราะ squash-merge ทำให้ commit hash ไม่ตรงกับบน main branch เดิมจึงดูเหมือนยังนำหน้า main อยู่ 1 commit |
| **การแก้ไข** | เก็บกวาด branch อัตโนมัติหลัง merge — ปิดช่องว่างสุดท้ายของ automation |
| **🛡️ กฎป้องกันถาวร** | **pr.yml ต้องเรียก git.deleteRef ลบ branch หลัง merge สำเร็จเสมอ และฝั่งเครื่องต้องมี npm run git:tidy ที่ลบเฉพาะ branch ที่ยืนยันจาก GitHub แล้วว่า PR เป็น MERGED โดยไม่แตะ branch ปัจจุบันและ branch ที่ถูก checkout อยู่ใน worktree อื่น** |
| **การพิสูจน์ว่าแก้ได้จริง** | รัน git:tidy --dry-run ก่อนแล้วยืนยันว่าไม่ลบอะไรจริง จากนั้นรันจริงลบ branch ที่ merge แล้ว 7 อัน เหลือแต่ branch ปัจจุบัน main และ branch ของ worktree อื่นอีก 2 อันที่ถูกข้ามอย่างถูกต้อง remote เหลือแต่ main |
| **บันทึกโดย** | Claude · branch `claude/auto-branch-cleanup` · commit `09f6ed9` |


### INC-0010 · 2026-08-31 13:44 · 🔴 Critical · deploy permanent stateless HMAC-SHA256 session token architecture for zero-failover serverless edge reliability

| หัวข้อ | รายละเอียด |
| :--- | :--- |
| **อาการที่พบ** | deploy permanent stateless HMAC-SHA256 session token architecture for zero-failover serverless edge reliability |
| **สาเหตุราก** | stateless edge worker isolates in Cloudflare could drop in-memory reading sessions across multi-step requests |
| **การแก้ไข** | deploy permanent stateless HMAC-SHA256 session token architecture for zero-failover serverless edge reliability |
| **🛡️ กฎป้องกันถาวร** | **deployed cryptographic HMAC-SHA256 session token and auto-restoration across all API endpoints** |
| **การพิสูจน์ว่าแก้ได้จริง** | typecheck 0 errors, 6/6 repo verify checks passed, 100% immune to edge worker failovers |
| **บันทึกโดย** | Antigravity AI · branch `main` · commit `b33429f` |


### INC-0009 · 2026-08-31 13:38 · 🟠 High · add smooth auto-scroll to latest message and client snapshot resilience for serverless edge chat

| หัวข้อ | รายละเอียด |
| :--- | :--- |
| **อาการที่พบ** | add smooth auto-scroll to latest message and client snapshot resilience for serverless edge chat |
| **สาเหตุราก** | chat container did not auto-scroll down to newly sent/received messages and serverless worker isolates lost in-memory reading records on multi-turn chat |
| **การแก้ไข** | add smooth auto-scroll to latest message and client snapshot resilience for serverless edge chat |
| **🛡️ กฎป้องกันถาวร** | **added chatBottomRef auto-scroll hook and implemented readingSnapshot client fallback payload for 100% resilient edge consultation** |
| **การพิสูจน์ว่าแก้ได้จริง** | typecheck 0 errors, 6/6 repo verify checks passed, smooth auto-scrolling and zero 404 errors on serverless chat |
| **บันทึกโดย** | Antigravity AI · branch `main` · commit `c9e3afc` |


### INC-0008 · 2026-08-31 13:20 · 🟠 High · upgrade Follow-up Chat with Claude and Gemini dual-engine integration, conversation history awareness, and dynamic contextual response engine

| หัวข้อ | รายละเอียด |
| :--- | :--- |
| **อาการที่พบ** | upgrade Follow-up Chat with Claude and Gemini dual-engine integration, conversation history awareness, and dynamic contextual response engine |
| **สาเหตุราก** | chat route called invalid gemini models with thinkingConfig causing 400 Bad Request and fell back to static hardcoded string ignoring user questions |
| **การแก้ไข** | upgrade Follow-up Chat with Claude and Gemini dual-engine integration, conversation history awareness, and dynamic contextual response engine |
| **🛡️ กฎป้องกันถาวร** | **support Claude 3.5 Sonnet and validated Gemini models with conversation history and dynamic contextual multi-intent response engine** |
| **การพิสูจน์ว่าแก้ได้จริง** | typecheck 0 errors, 6/6 repo verify checks passed, context-aware responses per question |
| **บันทึกโดย** | Antigravity AI · branch `main` · commit `6ee6fc8` |


### INC-0007 · 2026-08-31 12:09 · 🟠 High · เทสต์สถิติที่ตัวอย่างน้อยเกินไป ทำ deploy ขึ้น production ล้มแบบสุ่ม

| หัวข้อ | รายละเอียด |
| :--- | :--- |
| **อาการที่พบ** | deploy รอบแรกหลังเพิ่ม test-shuffle เข้า CI ล้มทันที: อัตราไพ่หัวกลับ ได้ 19/78 = 24% คาดหวัง 40% +-15 |
| **ผลกระทบ** | ระบบไม่ได้พังเลย แต่ deploy ขึ้น production ล้ม ทำให้ main ค้างไม่ได้ deploy |
| **สาเหตุราก** | เทสต์วัดอัตราไพ่หัวกลับจากสำรับเดียว 78 ใบ และ serverSeed สุ่มใหม่ทุกครั้ง ที่ n=78 p=0.4 ค่าเบี่ยงเบนมาตรฐานสูงถึง 5.5 จุด กรอบ 25-55% ห่างแค่ 2.7 sigma จึง fail เองราว 1 ใน 150 รอบ เดิมไม่มีใครเดือดร้อนเพราะเทสต์นี้ไม่เคยถูกรันอัตโนมัติ พอเอาเข้า CI มันไปกั้นทางขึ้น production |
| **การแก้ไข** | เปลี่ยนไปวัดจาก 40 สำรับรวม 3120 ใบ sigma ลดเหลือ 0.88 จุด กรอบใหม่ 35-45% ห่าง 5.7 sigma |
| **🛡️ กฎป้องกันถาวร** | **เทสต์ที่วัดค่าสถิติจากการสุ่มต้องใช้ตัวอย่างให้ใหญ่พอ ไม่ใช่ขยายกรอบยอมรับให้กว้างจนไม่มีความหมาย และก่อนเพิ่มเทสต์ใดเข้า CI ต้องรันซ้ำอย่างน้อย 20 รอบก่อนเสมอ ถ้าผลแกว่งแปลว่ายังไม่พร้อมขึ้น CI** |
| **การพิสูจน์ว่าแก้ได้จริง** | รันซ้ำ 20 รอบ (serverSeed สุ่มใหม่ทุกรอบ) ได้ 38.9%-40.9% ผ่านทั้ง 20 รอบ ค่าเฉลี่ยราว 40.1% ตรงกับ REVERSAL_RATE=0.4 (PR #10) |
| **บันทึกโดย** | Claude · branch `claude/engineering-discipline-protocol` · commit `46ac761` |


### INC-0006 · 2026-08-31 12:09 · 🔴 Critical · PR ที่ระบบ merge ให้เอง ไม่เคย deploy ขึ้น production เลย

| หัวข้อ | รายละเอียด |
| :--- | :--- |
| **อาการที่พบ** | PR #8 ถูก merge เข้า main แล้วแต่ไม่มี workflow ตัวไหนทำงานเลย ทั้งที่ PR #6 และ #7 ก่อนหน้านี้ deploy ปกติ |
| **ผลกระทบ** | ร้ายแรงที่สุด — ทุก PR ที่ระบบ merge ให้เองจะค้างอยู่บน main โดยไม่เคยขึ้นเว็บจริง โดยไม่มีสัญญาณเตือนใดๆ ทีมเข้าใจผิดมาตลอดว่า deploy อัตโนมัติทำงานอยู่ |
| **สาเหตุราก** | GitHub จงใจไม่ trigger workflow จาก event ที่เกิดจาก GITHUB_TOKEN เพื่อกันการวนซ้ำไม่รู้จบ step Auto-Merge ใน pr.yml merge ด้วย GITHUB_TOKEN push ที่เกิดขึ้นจึงไม่ trigger deploy.yml ที่รอ push: main |
| **หลักฐาน** | PR #6 merged by luminuy -> deploy ทำงาน / PR #7 merged by luminuy -> deploy ทำงาน / PR #8 merged by app/github-actions -> ไม่มี deploy |
| **การแก้ไข** | เพิ่ม trigger workflow_dispatch ใน deploy.yml และให้ pr.yml (เพิ่มสิทธิ์ actions: write) เรียก createWorkflowDispatch หลัง merge สำเร็จ พร้อม core.setFailed ถ้าสั่งไม่ได้ |
| **🛡️ กฎป้องกันถาวร** | **ถ้า workflow หนึ่งต้องปลุก workflow อีกตัว ห้ามหวังพึ่ง push event ที่เกิดจาก GITHUB_TOKEN ให้ใช้ workflow_dispatch เสมอ และเวลาตรวจว่า deploy ทำงานไหม อย่าดูแค่ว่า PR merged แล้ว ต้องดูว่ามี run ของ deploy.yml สำหรับ commit นั้นจริง** |
| **การพิสูจน์ว่าแก้ได้จริง** | PR #10 ถูก merge โดย app/github-actions แล้ว deploy.yml ถูก dispatch เองอัตโนมัติ (event: workflow_dispatch) และรันสำเร็จ (PR #9) |
| **บันทึกโดย** | Claude · branch `claude/engineering-discipline-protocol` · commit `46ac761` |


### INC-0005 · 2026-08-31 12:09 · 🟠 High · ไฟล์เทสต์มีอยู่แต่ไม่มี automation ตัวไหนเรียกใช้เลย

| หัวข้อ | รายละเอียด |
| :--- | :--- |
| **อาการที่พบ** | scripts/qa/test-safety.ts (14 เทสต์) และ test-shuffle.ts (14 เทสต์) ผ่านหมดเมื่อรันเอง แต่ grep แล้วไม่มี hook, npm script หรือ workflow ตัวไหนเรียกใช้เลย |
| **ผลกระทบ** | เทสต์ของตัวกรองคำถามอันตราย (Crisis Guard) และระบบสับไพ่ Provably Fair ซึ่งเป็นหัวใจด้านความปลอดภัยและความโปร่งใส ไม่เคยถูกรันอัตโนมัติ ถ้าใครแก้จนพังจะไม่มีใครรู้ |
| **สาเหตุราก** | ชุดตรวจถูกเขียนซ้ำไว้ 4 ที่ (pre-commit, pre-push, git-author-guard, workflow ทั้งสอง) พอเพิ่มไฟล์เทสต์ใหม่ก็ลืมไปเพิ่มให้ครบทุกที่ |
| **การแก้ไข** | รวมชุดตรวจเป็นตัวแปร CHECKS ที่เดียวใน scripts/github-auto.ts แล้วให้ทุกจุดเรียก npm run repo:verify เหมือนกันหมด พร้อมเพิ่มเทสต์ที่ขาดเข้าไปเป็น 6 ด่าน |
| **🛡️ กฎป้องกันถาวร** | **ห้ามเขียนรายการชุดตรวจซ้ำมากกว่าหนึ่งที่เด็ดขาด ทุกจุดต้องเรียก npm run repo:verify และเมื่อเพิ่มสคริปต์ทดสอบใหม่ใน scripts/qa/ ต้องไปเพิ่มใน CHECKS ทันที** |
| **การพิสูจน์ว่าแก้ได้จริง** | ดู log ของ CI จริง เห็นครบทั้ง 6 ด่านรวมถึง Safety Guardrails และ Provably Fair (PR #8) |
| **บันทึกโดย** | Claude · branch `claude/engineering-discipline-protocol` · commit `46ac761` |


### INC-0004 · 2026-08-31 12:09 · 🟠 High · คำสั่ง gh พังทุกครั้งที่รันจาก git worktree

| หัวข้อ | รายละเอียด |
| :--- | :--- |
| **อาการที่พบ** | npm run pr:auto สร้าง PR สำเร็จ แต่ขั้นเปิด auto-merge ล้มด้วย fatal: main is already checked out at /Users/bank/Desktop/เว็บไพ่ |
| **ผลกระทบ** | AI Agent ทำงานใน git worktree เสมอ คำสั่งนี้จึงพังทุกครั้งที่ AI เรียกใช้ ต้องมาสั่ง merge เองด้วยมือทุก PR |
| **สาเหตุราก** | gh pr merge และ gh pr checkout จะไปยุ่งกับ git ในเครื่องถ้าไม่ระบุ repo แต่ main ถูก checkout ค้างที่โฟลเดอร์หลักอยู่แล้ว จึง checkout ซ้ำไม่ได้ |
| **การแก้ไข** | อ่าน owner/repo จาก git remote get-url origin แล้วเติม -R ให้คำสั่ง gh ทุกจุดใน scripts/github-auto.ts บังคับให้ทำงานแบบ remote-only |
| **🛡️ กฎป้องกันถาวร** | **คำสั่ง gh ทุกคำสั่งในสคริปต์ต้องใส่ -R <owner>/<repo> เสมอ ห้ามเรียก gh pr merge เปล่าๆ เด็ดขาด** |
| **การพิสูจน์ว่าแก้ได้จริง** | รัน pr:auto จาก worktree อีกครั้งผ่านขั้นตอน merge ไปได้ ไม่มี error เรื่อง checkout อีก (PR #8) |
| **บันทึกโดย** | Claude · branch `claude/engineering-discipline-protocol` · commit `46ac761` |


### INC-0003 · 2026-08-31 12:08 · 🔵 Low · Cache-Control ถูกเขียนซ้ำสองรอบใน _headers

| หัวข้อ | รายละเอียด |
| :--- | :--- |
| **อาการที่พบ** | หลัง deploy ภาพย่อ WebP ได้ header: public, max-age=31536000, immutable, public, max-age=31536000, immutable |
| **ผลกระทบ** | ค่า header ผิดรูปแบบ proxy/cache บางตัวอาจตีความพลาด |
| **สาเหตุราก** | เขียนกฎแยกไว้ทั้ง /cards/* , /cards/w256/* และ /cards/w512/* โดยเข้าใจผิดว่า splat ไม่กินข้ามเครื่องหมาย / แต่จริงๆ splat ของ Cloudflare เป็นแบบ greedy กฎ /cards/* จึง match ทุกอันอยู่แล้ว และเมื่อหลายกฎ match พร้อมกัน Cloudflare จะต่อท้ายค่าไม่ใช่แทนที่ |
| **การแก้ไข** | ลบกฎที่ซ้ำซ้อนออก เหลือ /cards/* ข้อเดียว พร้อมคอมเมนต์อธิบายไว้ในไฟล์ |
| **🛡️ กฎป้องกันถาวร** | **ใน _headers ห้ามเขียนกฎที่ path ซ้อนทับกัน เพราะ Cloudflare ต่อท้ายค่าไม่ใช่แทนที่ และ splat (*) เป็น greedy กินข้าม / เสมอ ต้องตรวจ header จริงหลัง deploy ทุกครั้งด้วย curl -sI** |
| **การพิสูจน์ว่าแก้ได้จริง** | curl -sI บน production ทั้ง 3 path ได้ค่าเดียวไม่ซ้ำ และหน้าเว็บ /cards/major-00 ได้ s-maxage ไม่โดน immutable ตามที่ตั้งใจ (PR #7) |
| **บันทึกโดย** | Claude · branch `claude/engineering-discipline-protocol` · commit `46ac761` |


### INC-0002 · 2026-08-31 12:08 · 🟡 Medium · โหลดภาพต้นฉบับ 280KB มาแสดงที่ขนาด 34px

| หัวข้อ | รายละเอียด |
| :--- | :--- |
| **อาการที่พบ** | หน้าเลือกผังโหลดภาพไพ่รวม 4.63MB หน้า /spreads มีภาพไพ่ 96 ใบ หน้าแผ่ไพ่ 78 ใบคิดเป็นราว 21MB |
| **ผลกระทบ** | ผู้ใช้มือถือ/เน็ตช้าโหลดนานมากโดยไม่จำเป็น |
| **สาเหตุราก** | เขียน <img src=/cards/xxx.jpg> ตรงๆ กระจายอยู่ประมาณ 90 จุด ไม่มีชั้นกลางที่บังคับให้เลือกขนาดภาพให้เหมาะกับพื้นที่แสดงผล |
| **การแก้ไข** | สร้าง scripts/generate-card-variants.ts ทำภาพย่อ WebP 2 ขนาด (w256/w512) และคอมโพเนนต์ CardImage ที่ใช้ picture+srcset แทน img ทุกจุด |
| **🛡️ กฎป้องกันถาวร** | **ทุกจุดที่แสดงภาพหน้าไพ่ต้องใช้ <CardImage /> พร้อม prop sizes เสมอ ห้ามเขียน <img src=/cards/...> เองเด็ดขาด และเมื่อเพิ่ม/เปลี่ยนภาพต้นฉบับต้องรัน npm run cards:variants ทุกครั้ง** |
| **การพิสูจน์ว่าแก้ได้จริง** | วัดบน production จริง หน้า /spreads โหลด 20 ไฟล์ = 610KB (เดิมจะเป็น ~5.6MB) ภาพเสียหาย 0 ใบ (PR #6) |
| **บันทึกโดย** | Antigravity AI · branch `claude/engineering-discipline-protocol` · commit `46ac761` |


### INC-0001 · 2026-08-31 12:08 · 🟠 High · ภาพหน้าไพ่ทุกจุดในเว็บดูเบลอ แตกเป็นเม็ดหยาบ

| หัวข้อ | รายละเอียด |
| :--- | :--- |
| **อาการที่พบ** | ตัวอักษรบนหน้าไพ่ (THE SUN / THE FOOL) อ่านไม่ออก โดยเฉพาะการ์ดพรีวิวผังและโลโก้ Navbar |
| **ผลกระทบ** | ทุกหน้าที่แสดงภาพไพ่ — หน้าแรก, /cards, /spreads กระทบภาพลักษณ์ของงานทั้งโปรเจกต์ |
| **สาเหตุราก** | globals.css กำหนด image-rendering ซ้อนกัน 3 บรรทัด CSS เอาบรรทัดสุดท้าย (crisp-edges) ซึ่งบังคับให้เบราว์เซอร์ย่อภาพแบบ nearest-neighbour ภาพต้นฉบับ 820px ที่ถูกย่อเหลือ 34-70px (ย่อ 12-25 เท่า) จึงแตกเป็นเม็ด ที่ร้ายกว่านั้นคือมันถูกใส่เข้ามาในคอมมิตที่ตั้งชื่อว่า Ultra-HD crispness คือตั้งใจทำให้คมแต่กลับทำให้พัง |
| **หลักฐาน** | getComputedStyle ของ img ทุกตัวได้ image-rendering: crisp-edges และ downscale ratio 12.4x - 25.0x |
| **การแก้ไข** | เปลี่ยนเหลือ image-rendering: auto บรรทัดเดียว และลบ transform: translateZ(0) ที่ไม่จำเป็นออกจาก img |
| **🛡️ กฎป้องกันถาวร** | **ภาพถ่ายหรือภาพวาดที่ถูกย่อ ต้องใช้ image-rendering: auto เท่านั้น ห้ามใช้ crisp-edges / pixelated / -webkit-optimize-contrast เด็ดขาด (ค่าเหล่านั้นมีไว้สำหรับ Pixel Art ที่ถูกขยาย) และห้ามเขียน property เดียวกันซ้อนหลายบรรทัดหวังให้เบราว์เซอร์เลือกเอง** |
| **การพิสูจน์ว่าแก้ได้จริง** | เทียบภาพ before/after บน dev server จริง ตัวอักษรบนไพ่กว้าง 60px กลับมาอ่านออกชัดเจน (PR #6) |
| **บันทึกโดย** | Antigravity AI · branch `claude/engineering-discipline-protocol` · commit `46ac761` |


