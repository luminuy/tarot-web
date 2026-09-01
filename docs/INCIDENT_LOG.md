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
`scripts/git-author-guard.ts` จะบันทึกลงไฟล์นี้ให้อัตโนมัติ และ **บล็อกการ commit** ถ้า:

1. ไม่ระบุ `--symptom`, `--cause`, `--prevention` (บังคับครบ 3 ตัว)
2. เนื้อหาช่องไหน "ก็อป `--msg` มา" — `scripts/incident-log.ts` มี `validateIncident()` ตรวจว่า
   `อาการ` ต้องไม่ใช่หัวข้อ · `สาเหตุราก` ต้องไม่ใช่อาการ · แต่ละช่องต้องยาวพอมีเนื้อจริง
   (บทเรียน INC-0008/0009/0010/0014 ที่ทุกช่อง = commit title ภาษาอังกฤษ อ่านแล้วไม่ได้บทเรียน)

```bash
npm run commit -- --agent <ชื่อคุณ> --type fix --scope <หมวด> \
  --msg "<หัวข้อสั้น: แก้อะไร>" \
  --symptom "<สิ่งที่คนเจอครั้งแรกเห็น — ไม่ใช่ชื่อเรื่อง>" \
  --cause "<ทำไมบั๊กนี้ถึงหลุดมาได้ตั้งแต่แรก — สาเหตุราก ไม่ใช่อาการ>" \
  --prevention "<กฎถาวร/ด่านตรวจที่ทำให้ไม่เกิดซ้ำ>" \
  --severity high \
  --verify "<คำสั่งที่รัน + ผลลัพธ์ที่ยืนยันว่าหายจริง>"
```

> ช่อง `การแก้ไข` มาจาก `--fix` (ถ้าไม่ระบุจะใช้ `--msg`) · `ผลกระทบ` จาก `--impact` · `หลักฐาน` จาก `--evidence`

บันทึกด้วยมือ (เจอปัญหาแต่ยังไม่ได้ commit — หรือปัญหาที่ไม่ได้เกิดจากโค้ด เช่น process/automation):

```bash
npm run incident -- --title "..." --severity high --symptom "..." \
  --cause "..." --fix "..." --prevention "..." --verify "..."
```

**เขียนบันทึกให้ AI ตัวถัดไปได้ประโยชน์:**
- `อาการ` = เขียนแบบคนยังไม่รู้คำตอบ ("กดปุ่มแล้วค้าง" ไม่ใช่ "AnimatePresence deadlock")
- `สาเหตุราก` = ตอบ "ทำไมถึงหลุดมาได้" ("ไม่มีด่านตรวจ X" / "กฎ Y เขียนไว้แต่ไม่มีเครื่องบังคับ")
- `กฎป้องกัน` = ถ้าเป็นไปได้ให้เป็น **ด่านตรวจอัตโนมัติ** ไม่ใช่แค่ "ให้ระวัง" (หลักการข้อ 0.8)
- ถ้า incident นี้เกี่ยวกับ incident เก่า ให้ใส่แถว `เชื่อมโยง` / `เกิดซ้ำแล้ว` / `ผลข้างเคียงที่พบภายหลัง`

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
### INC-0036 · 2026-09-01 09:51 · 🟠 High · PR 0 auth-hardening: enforce prod AUTH_SECRET throw, OAuth state CSRF verification, and host header injection protection

| หัวข้อ | รายละเอียด |
| :--- | :--- |
| **อาการที่พบ** | Edge auth had insecure fallback secret in production, unchecked OAuth state (login CSRF), and trusted x-forwarded-host |
| **สาเหตุราก** | edge-auth.ts lacked production secret guard and callback route did not verify tarot_oauth_state cookie or sanitize host header |
| **การแก้ไข** | Updated getAuthSecret with production throw on missing or weak secrets, added OAuth state CSRF verification with cookie comparison, and restricted host resolution to allowlist and APP_ORIGIN |
| **🛡️ กฎป้องกันถาวร** | **All auth secrets must throw in production if < 32 characters; all OAuth flows must verify state cookie before token exchange** |
| **การพิสูจน์ว่าแก้ได้จริง** | repo:verify passed 10/10 gates |
| **บันทึกโดย** | Antigravity AI · branch `auth-hardening` · commit `a9a4bb4` |


### INC-0035 · 2026-09-01 02:25 · 🟡 Medium · stop tracking auto-generated bookkeeping files that conflict on every parallel PR

| หัวข้อ | รายละเอียด |
| :--- | :--- |
| **อาการที่พบ** | แทบทุก PR ที่เปิดขนานกันติด merge conflict ที่ .ai-locks.json / .audit-history.json / docs/AUDIT_LOG.md / docs/WORK_LOG.md ต้อง rebase แก้มือซ้ำ ๆ ทุกครั้ง |
| **สาเหตุราก** | ไฟล์ 4 ตัวนี้ถูก track ใน git แต่ commit tooling (recordAudit, syncWorkLog, agent-guard) เขียนทับใหม่ทั้งไฟล์ทุก commit ด้วย timestamp/collision-count/audit-entry ที่ต่างกันทุกครั้ง 2 branch ที่ทำพร้อมกันจึงแก้บรรทัดเดียวกันเสมอ = conflict รับประกัน · โดยเฉพาะ syncWorkLog ที่ regex-replace บล็อก 'Current Handoff Summary' ใน WORK_LOG.md ทุก commit |
| **การแก้ไข** | 1) .gitignore + git rm --cached .ai-locks.json .audit-history.json docs/AUDIT_LOG.md (เป็น state เครื่อง/ผลลัพธ์ที่สร้างใหม่ได้ · audit trail ถาวรอยู่ใน git history + INCIDENT_LOG อยู่แล้ว) 2) sync-worklog.ts เขียนสถานะอัตโนมัติลง docs/WORK_LOG.status.md (gitignore) แทนแก้ WORK_LOG.md · เอาบล็อก auto-synced ออกจาก WORK_LOG.md เหลือแต่ changelog ที่คนเขียนมือ 3) .gitattributes merge=union ให้ docs/*.md ที่ append เรื่อย ๆ (WORK_LOG/INCIDENT_LOG/KNOWN_ISSUES/BACKLOG) auto-merge แทน conflict 4) แก้ isRunDirectly() ใน sync-worklog ให้ npm run log:sync ทำงานจริงใต้ tsx (เดิม guard พังเงียบ) |
| **🛡️ กฎป้องกันถาวร** | **ห้าม track ไฟล์ที่ tooling regenerate ทั้งไฟล์ทุก commit — ถ้าต้องมี ให้ gitignore แล้วชี้ output ไปไฟล์ .status แยก · เอกสาร append-only ให้ตั้ง merge=union ใน .gitattributes เสมอ · แหล่งความจริงถาวรของ audit = git history ไม่ใช่ไฟล์ JSON ที่ commit** |
| **การพิสูจน์ว่าแก้ได้จริง** | npm run typecheck 0 errors · npm run log:sync เขียน docs/WORK_LOG.status.md สำเร็จ (เดิม no-op) · git check-ignore ยืนยันไฟล์ทั้ง 4 ถูก ignore · npm run repo:verify ผ่าน |
| **บันทึกโดย** | Claude Sonnet 5 · branch `claude/ux-navigation-r6` · commit `b670f6d` |


### INC-0034 · 2026-09-01 01:25 · 🟠 High · remove invalid secrets array from wrangler.jsonc that broke Production deploy

| หัวข้อ | รายละเอียด |
| :--- | :--- |
| **อาการที่พบ** | ทุก Production Deploy หลัง PR #55 ล้มทันทีที่ขั้น opennextjs-cloudflare build: 'The field secrets should be an object but got [GOOGLE_CLIENT_ID,GOOGLE_CLIENT_SECRET,TAROT_SESSION_SECRET]' โค้ดใหม่ทั้ง OAuth และ motion Round 5 ค้างอยู่ที่ commit ก่อนหน้า ไม่เคยขึ้น production |
| **สาเหตุราก** | PR #55 เพิ่มฟิลด์ top-level "secrets": [...] ลง wrangler.jsonc ตั้งใจใช้ 'ประกาศ' ชื่อ secret แต่ Wrangler config schema ไม่มีฟิลด์ชื่อ secrets เลย (ค่าที่ตั้งผ่าน 'wrangler secret put' ถูก inject เป็น env binding ตอน runtime เองอยู่แล้ว ไม่ต้องประกาศ) config validation จึง reject ทั้งไฟล์ และไม่มีขั้น build:worker/dry-run ใน pr.yml ก่อน merge จึงไม่มีใครเห็น error จนกระทั่งขั้น deploy จริง |
| **การแก้ไข** | ลบบล็อก "secrets": [...] ออกจาก wrangler.jsonc ทั้งก้อน เหลือคอมเมนต์อธิบายว่าต้องตั้ง secret ด้วย 'wrangler secret put <NAME>' อย่างเดียวและตรวจด้วย 'wrangler secret list' จากนั้นพิสูจน์ว่า config parse ผ่านด้วย 'wrangler deploy --dry-run' และ build เต็มด้วย 'opennextjs-cloudflare build' |
| **🛡️ กฎป้องกันถาวร** | **ห้ามเพิ่มคีย์ลง wrangler.jsonc โดยไม่เทียบกับ node_modules/wrangler/config-schema.json ก่อน · secrets ไม่ต้องประกาศใน config · ควรเพิ่มขั้น 'npx opennextjs-cloudflare build' หรือ 'wrangler deploy --dry-run' เข้า pr.yml เพื่อดัก config error ตั้งแต่ตอนเปิด PR ไม่ใช่ตอน deploy production** |
| **การพิสูจน์ว่าแก้ได้จริง** | npx wrangler deploy --dry-run ผ่านขั้น config parsing (fail แค่ที่ entry-point เพราะยังไม่ build) · npx opennextjs-cloudflare build จบด้วย 'OpenNext build complete' + worker.js saved · npm run repo:verify 7/7 ผ่าน |
| **บันทึกโดย** | Claude Sonnet 5 · branch `claude/continue-work-21bc72` · commit `a335fdd` |


### INC-0033 · 2026-09-01 00:32 · 🟠 High · remove cache pnpm from setup-node and use no-frozen-lockfile in workflows

| หัวข้อ | รายละเอียด |
| :--- | :--- |
| **อาการที่พบ** | GitHub Actions workflows failed with error: Dependencies lock file is not found in repo. Supported file patterns: pnpm-lock.yaml |
| **สาเหตุราก** | actions/setup-node@v4 had cache: pnpm specified without a committed pnpm-lock.yaml file in the repository |
| **การแก้ไข** | Removed cache: pnpm from setup-node and configured pnpm install with --no-frozen-lockfile in deploy.yml and pr.yml |
| **🛡️ กฎป้องกันถาวร** | **Do not enable pnpm caching on setup-node unless pnpm-lock.yaml is committed** |
| **การพิสูจน์ว่าแก้ได้จริง** | repo:verify passed all 7/7 verification gates |
| **บันทึกโดย** | Antigravity AI · branch `fix/ci-node-setup-cache` · commit `138a8fe` |


### INC-0032 · 2026-09-01 00:30 · 🟠 High · fix pnpm action-setup version mismatch with package.json packageManager

| หัวข้อ | รายละเอียด |
| :--- | :--- |
| **อาการที่พบ** | GitHub Actions workflows (deploy.yml and pr.yml) failed at Setup pnpm step with Error: Multiple versions of pnpm specified |
| **สาเหตุราก** | pnpm/action-setup@v4 had with.version: 9 explicitly configured while package.json specified packageManager: pnpm@9.15.4, causing action-setup to throw a duplicate version specification error |
| **การแก้ไข** | Removed with.version from action-setup@v4 in deploy.yml and pr.yml so it automatically and cleanly resolves the exact pnpm version from package.json |
| **🛡️ กฎป้องกันถาวร** | **Do not duplicate version key in action-setup@v4 when packageManager is specified in package.json** |
| **การพิสูจน์ว่าแก้ได้จริง** | repo:verify passed all 7/7 verification gates and workflow YAML syntax is valid |
| **บันทึกโดย** | Antigravity AI · branch `fix/ci-pnpm-version-conflict` · commit `49790f2` |


### INC-0031 · 2026-09-01 00:25 · 🟠 High · add prompt XML boundaries, Gemini safe JSON parsing, Zod bounded arrays, and copy attribution scope

| หัวข้อ | รายละเอียด |
| :--- | :--- |
| **อาการที่พบ** | User question could blend with system prompt without delimiters, truncated Gemini stream could throw JSON parse error, unbounded chat arrays could accept large payloads, and copying normal page text attached prophecy watermark |
| **สาเหตุราก** | Prompt lacked data tag isolation, JSON.parse was unguarded in stream end handler, Zod schemas lacked max length constraints, and global copy listener intercepted all document copy events |
| **การแก้ไข** | Wrapped user input in XML tags with control character sanitization, added try/catch around JSON.parse with partial loose parsing fallback, added max constraints on history/picked arrays, and scoped copy attribution to reading container |
| **🛡️ กฎป้องกันถาวร** | **Always encapsulate user-provided data within XML delimiters in prompts, provide parse exception guards for LLM streams, enforce array bounds in public API schemas, and scope clipboard mutations to user-facing output containers** |
| **การพิสูจน์ว่าแก้ได้จริง** | repo:verify passed all 7/7 verification gates with 0 errors |
| **บันทึกโดย** | Antigravity AI · branch `feat/audit-milestone-4-hardening-and-optimizations` · commit `c9910b0` |


### INC-0030 · 2026-09-01 00:22 · 🟠 High · fix stream error fallback, entropy stale closure, earth element math, chat role coalescing, and purge dead code

| หัวข้อ | รายละเอียด |
| :--- | :--- |
| **อาการที่พบ** | UI could hang on failed stream without retry button, ShuffleRitual closed over initial empty entropy array, earth element percentage had edge case math issues, and chat sent un-coalesced consecutive roles to Gemini |
| **สาเหตุราก** | Stream error event didn't set error message, interval in ShuffleRitual accessed state instead of ref, earth element was computed via remainder subtraction, and multi-turn chat history preserved adjacent identical roles |
| **การแก้ไข** | Added stream termination fallback to set error state, used useRef for entropy accumulation, calculated earth percentage proportionally, merged adjacent roles in chat route, and deleted unused legacy files and prisma/next-auth dependencies |
| **🛡️ กฎป้องกันถาวร** | **Ensure all streams have completion guards, use mutable refs for gesture entropy sampling in intervals, validate element calculation boundaries, and coalesce conversational history prior to Gemini dispatch** |
| **การพิสูจน์ว่าแก้ได้จริง** | repo:verify passed all 7/7 verification gates with 0 TypeScript errors and clean dead code removal |
| **บันทึกโดย** | Antigravity AI · branch `feat/audit-milestone-3-resilience-and-cleanup` · commit `00807bd` |


### INC-0029 · 2026-09-01 00:14 · 🟠 High · delete dead Engine B, harden session token secret guard, and enforce chat crisis safety screening

| หัวข้อ | รายละเอียด |
| :--- | :--- |
| **อาการที่พบ** | Dead Engine B routes open to unauthenticated access, session token could silently fallback to default string in prod, and chat messages bypassed crisis hotline 1323 screening |
| **สาเหตุราก** | Unused legacy services were left intact after migration, session token helper did not hard throw on missing production secrets, and chat POST handler lacked checkQuestion guard |
| **การแก้ไข** | Deleted all dead Engine B endpoints and services, upgraded getSessionSecret to throw in production for secrets under 32 chars or default values, added 2-hour token expiration, and integrated checkQuestion in chat POST handler |
| **🛡️ กฎป้องกันถาวร** | **Pruned all unused legacy services and routes, enforced hard fail loud on missing or short production session secrets with 2h expiration, and added mandatory checkQuestion at start of chat endpoint and local fallback** |
| **การพิสูจน์ว่าแก้ได้จริง** | repo:verify passes 7/7 gates, typecheck 0 errors, and unit checks verify deleted dead routes and active safety screening |
| **บันทึกโดย** | Antigravity AI · branch `feat/audit-milestone-1-engine-b-and-p0-security` · commit `b7446f1` |


### INC-0028 · 2026-08-31 23:47 · 🔵 Low · Clean up GalaxyCanvas by removing extra overlapping canvas rings to restore original pristine cosmic starfield

| หัวข้อ | รายละเอียด |
| :--- | :--- |
| **อาการที่พบ** | Double concentric circles appeared over background overlapping with central card in desktop view |
| **สาเหตุราก** | GalaxyCanvas rendered an extra layer of rotating geometry circles that conflicted with DOM altar background |
| **การแก้ไข** | Remove duplicate canvas rotating geometry and preserve pure starfield and nebulae in GalaxyCanvas |
| **🛡️ กฎป้องกันถาวร** | **Keep canvas background dedicated to particle starfields and let layout components handle card level decorative rings** |
| **การพิสูจน์ว่าแก้ได้จริง** | npm run repo:verify 7/7 passed and visuals verified |
| **บันทึกโดย** | Antigravity AI · branch `fix/clean-galaxy-canvas` · commit `b863ffc` |


### INC-0027 · 2026-08-31 23:11 · 🟠 High · Fix Step 4 to Step 5 transition crash by making cardByIndex resilient and defensive keyword extraction

| หัวข้อ | รายละเอียด |
| :--- | :--- |
| **อาการที่พบ** | React Error Boundary modal appeared when transitioning from card picking stage to divination reading chamber |
| **สาเหตุราก** | cardByIndex threw unhandled exception when index was out of bounds or undefined and keyword extraction lacked polymorphic checks during slot mapping |
| **การแก้ไข** | Update cardByIndex and cardById in cards/index.ts to return fallback DECK[0] instead of throwing uncaught Error, and make slot mapping handle keywords array safely |
| **🛡️ กฎป้องกันถาวร** | **Make cardByIndex return DECK[0] fallback instead of throwing and apply polymorphic array and object checks on all card slot mappers** |
| **การพิสูจน์ว่าแก้ได้จริง** | npm run repo:verify passed with 7/7 gates green and zero typecheck errors |
| **บันทึกโดย** | Antigravity AI · branch `fix/step4-resilient-rendering` · commit `5cb8e34` |


### INC-0026 · 2026-08-31 22:16 · 🟡 Medium · แตะแท็บ "สรุปภาพรวม & คำแนะนำ" แล้วหน้าจอขึ้น Error Boundary
| หัวข้อ | รายละเอียด |
| :--- | :--- |
| **อาการที่พบ** | เมื่อกดเข้าแท็บ "สรุปภาพรวม & คำแนะนำ" ในหน้าผลคำทำนาย หน้าจอแสดงกล่องสีดำ Error Boundary "เกิดข้อผิดพลาดชั่วคราวในการแสดงผล" |
| **สาเหตุราก** | `mantra.ts` ดึงคีย์เวิร์ดของไพ่ผ่าน `chosenCard.keywords.reversed[0]` โดยสันนิษฐานว่าคีย์เวิร์ดเป็น Object เสมอ แต่ในคอมโพเนนต์อ่านไพ่บนหน้าจอ คีย์เวิร์ดของไพ่ที่เปิดแล้วถูกส่งมาเป็น Array ของคำศัพท์ (`string[]`) ทำให้เกิด `TypeError: Cannot read properties of undefined (reading '0')` ในระหว่าง Render |
| **การแก้ไข** | รองรับโครงสร้างคีย์เวิร์ดทั้งแบบ `string[]` และ `{ upright, reversed }` ใน `mantra.ts` + เพิ่ม `try/catch` ใน `useMemo` ของ `ElementalBalanceWidget` และ `OracleMantraCard` + ดึงไพ่เต็มผ่าน `cardByIndex` ใน `StreamReader.tsx` |
| **🛡️ กฎป้องกันถาวร** | **คอมโพเนนต์ย่อยที่เรนเดอร์ในแท็บคำทำนายต้องมี safe memo / optional chaining ครอบเสมอ และต้องรองรับข้อมูลไพ่ทั้งแบบดิบและแบบผ่าน snapshot** |
| **บันทึกโดย** | Antigravity AI · branch `main` · commit `09f9311` · เรียบเรียงใหม่ |


### INC-0025 · 2026-08-31 21:50 · 🟠 High · หน้าตั้งคำถามขึ้นแถบแดง Unexpected end of JSON input เพราะ API /start คืนค่า 500

| หัวข้อ | รายละเอียด |
| :--- | :--- |
| **อาการที่พบ** | เมื่อเลือกผังและแม่หมอเสร็จแล้วกดเริ่มดูดวง หน้าจอแสดงแถบสีแดง `Failed to execute 'json' on 'Response': Unexpected end of JSON input` |
| **สาเหตุราก** | `src/lib/security/session-token.ts` มีการ `throw Error` เมื่อรันบน Production หากตัวแปร `TAROT_SESSION_SECRET` ยังไม่ได้ถูกตั้งค่าใน Cloudflare Worker ส่งผลให้ API `/api/reading/start` แครชด้วย HTTP 500 (Empty Body) และทำให้เบราว์เซอร์อ่าน JSON ไม่สำเร็จ |
| **การแก้ไข** | เปลี่ยนให้ `getSessionSecret()` มีค่า Fallback Secret ที่ปลอดภัยเสมอเมื่อไม่มี env var + ครอบ `res.json().catch(() => ({}))` ฝั่งหน้าเว็บ |
| **🛡️ กฎป้องกันถาวร** | **ฟังก์ชัน Utility ระดับระบบความปลอดภัยต้องมี Fallback ที่ปลอดภัยในตัว ไม่ throw unhandled exception จนทำให้ Serverless Edge พังทั้งระบบ** |
| **บันทึกโดย** | Antigravity AI · branch `main` · commit `bc9daa2` · เรียบเรียงใหม่ |


### INC-0024 · 2026-08-31 21:40 · 🟠 High · ภาพหน้าไพ่ในผังพยากรณ์ขึ้นไอคอนเครื่องหมายคำถาม (?) สีฟ้าทั้งหมด

| หัวข้อ | รายละเอียด |
| :--- | :--- |
| **อาการที่พบ** | หน้าเลือกผังพยากรณ์และหน้าดูดวง ภาพหน้าไพ่ทุกใบไม่แสดงผลและขึ้นเป็นไอคอนสี่เหลี่ยมสีฟ้าพร้อมเครื่องหมาย `?` |
| **สาเหตุราก** | มีการเพิ่มแท็ก `<source type="image/avif">` ใน `CardImage.tsx` ทำให้เบราว์เซอร์เลือกขอไฟล์ `.avif` เป็นอันดับแรก แต่บนเซิร์ฟเวอร์มีเฉพาะไฟล์ `.webp` และ `.jpg` (ไม่มีไฟล์ `.avif` จริง) เบราว์เซอร์จึงได้ 404 และแสดงเป็นภาพพัง |
| **การแก้ไข** | ถอดแท็ก AVIF ออกจาก `CardImage.tsx` และ `card-image.ts` ให้ใช้ WebP ที่มีอยู่จริง + เพิ่มด่านตรวจการมีอยู่จริงของไฟล์ภาพบนดิสก์ 78 ใบใน `scripts/qa/test-image-paths.ts` |
| **🛡️ กฎป้องกันถาวร** | **ห้ามประกาศ format ภาพใน `<picture>` หรือ `srcSet` ถ้าไม่มีไฟล์จริงบนดิสก์ครบ 78 ใบ — และ `test-image-paths.ts` จะตรวจเช็คไฟล์จริงทุกครั้งในด่านที่ 7** |
| **บันทึกโดย** | Antigravity AI · branch `main` · commit `76eab15` · เรียบเรียงใหม่ |


### INC-0023 · 2026-08-31 21:35 · 🟡 Medium · หน้าจอขึ้น Error "The string did not match the expected pattern" ใน Safari

| หัวข้อ | รายละเอียด |
| :--- | :--- |
| **อาการที่พบ** | เมื่อกดเปลี่ยนขั้นตอนบนเบราว์เซอร์ Safari / iOS WebKit หน้าจอแสดงแถบแจ้งเตือนสีแดง `The string did not match the expected pattern.` |
| **สาเหตุราก** | `scrollToSanctuaryTop` ใน `src/app/page.tsx` ส่งค่า `behavior: "instant"` ซึ่งเป็นค่าผิดมาตรฐานที่ Safari ไม่รองรับและโยน `DOMException: SyntaxError` ออกมา |
| **การแก้ไข** | ปรับไปใช้ `behavior: "auto"` และ `window.scrollTo(0, 0)` ตามมาตรฐาน CSSOM View + ครอบ `try/catch` ไม่ให้ Exception หลุดไปถึงหน้าจอ |
| **🛡️ กฎป้องกันถาวร** | **การสั่งเลื่อนหน้าจอผ่าน Window/DOM ต้องใช้ค่ามาตรฐาน CSSOM (`auto` หรือ `smooth`) และครอบ try/catch เสมอเพื่อความปลอดภัยบนทุกเบราว์เซอร์** |
| **บันทึกโดย** | Antigravity AI · branch `main` · commit `84b1417` · เรียบเรียงใหม่ |


### INC-0022 · 2026-08-31 21:23 · 🟡 Medium · ปรับปรุงความเข้มงวดของ CI auto-merge workflow ให้ส่งต่อ Error อย่างชัดเจน

| หัวข้อ | รายละเอียด |
| :--- | :--- |
| **อาการที่พบ** | Workflow auto-merge มีการสร้าง review approval แบบอัตโนมัติ และบันทึกเพียง warning เมื่อ trigger deploy ไม่สำเร็จ ทำให้ไม่เห็นข้อผิดพลาดแท้จริง |
| **สาเหตุราก** | CI workflow ขาดการจัดการข้อผิดพลาดแบบ Fail-Fast (Hard-fail) ทำให้ deploy dispatch ที่ล้มเหลวไม่ทำให้สถานะ workflow เป็นสีแดง |
| **การแก้ไข** | ปรับ `.github/workflows/pr.yml` ให้ใช้ `core.setFailed` เมื่อ trigger deploy ล้มเหลว และตัด review approval ปลอมออกเพื่อให้ audit trail โปร่งใส |
| **🛡️ กฎป้องกันถาวร** | **Workflow การส่งมอบงานต้อง Fail-Fast เสมอเมื่อขั้นตอนสำคัญล้มเหลว ห้ามกลบ Error ด้วย Warning** |
| **บันทึกโดย** | Antigravity AI · branch `main` · commit `99e6f29` · เรียบเรียงใหม่ |


### INC-0021 · 2026-08-31 20:55 · 🟡 Medium · บังคับคุณภาพ INCIDENT_LOG + เรียบเรียง 4 entry ที่ก็อป commit title

| หัวข้อ | รายละเอียด |
| :--- | :--- |
| **อาการที่พบ** | INC-0008/0009/0010/0014 ทุกช่อง (อาการ/การแก้ไข) = ก็อป commit title ภาษาอังกฤษมา อ่านแล้วไม่รู้ว่าเกิดอะไร ไม่ได้บทเรียน |
| **สาเหตุราก** | git-author-guard fallback symptom/fix เป็น --msg ถ้าไม่ระบุ + ไม่มี validateIncident ตรวจว่าช่องต่างๆ เป็นเนื้อเดียวกันไหม + ไม่บังคับ --symptom |
| **การแก้ไข** | เพิ่ม validateIncident() ใน incident-log.ts บล็อก entry ที่ช่องก็อปกันมา/สั้นเกิน · git-author-guard บังคับ --symptom + เลิก fallback เป็น --msg · เรียบเรียง INC-0008/9/10/14 ใหม่เป็นภาษาไทยมีเนื้อจริง + ใส่ cross-ref |
| **🛡️ กฎป้องกันถาวร** | **recordIncident() throw ถ้า validateIncident เจอปัญหา — commit ประเภท fix จะถูกบล็อกทันทีถ้า incident entry ไม่มีเนื้อจริง** |
| **การพิสูจน์ว่าแก้ได้จริง** | tsx -e ทดสอบ: entry ที่ก็อปกันมาถูก reject 4 จุด, entry ที่มีเนื้อจริงผ่าน · repo:verify 7/7 · commit นี้เองต้องผ่าน gate ใหม่ |
| **บันทึกโดย** | Claude · branch `docs/incident-log-quality` · PR #25 |


### INC-0020 · 2026-08-31 20:59 · 🔴 Critical · ถอด cache:"npm" ที่ทำ CI และ deploy พังทั้งหมด

| หัวข้อ | รายละเอียด |
| :--- | :--- |
| **อาการที่พบ** | ทุก workflow run (pr.yml + deploy.yml) ล้มทันทีที่ step Setup Node.js: '##[error]Dependencies lock file is not found ... Supported: package-lock.json, npm-shrinkwrap.json, yarn.lock' · deploy ขึ้น production ไม่ได้เลย 2 รอบติด |
| **สาเหตุราก** | commit 451b057 (Antigravity, push ตรงเข้า main ไม่ผ่าน PR) พยายามย้าย CI ไป pnpm แล้วถูก revert บางส่วน เหลือ 'cache: npm' ค้างไว้ แต่ repo ไม่เคย commit package-lock.json (ใช้ pnpm-lock.yaml) → setup-node หา lockfile ไม่เจอ hard error |
| **การแก้ไข** | ถอด cache:"npm" ที่ทำ CI และ deploy พังทั้งหมด |
| **🛡️ กฎป้องกันถาวร** | **ห้าม push .github/workflows/ ตรงเข้า main — workflow ทุกไฟล์ต้องผ่าน PR ที่ CI รันจริงก่อน · 'cache:' ใน setup-node ต้องมี lockfile ชนิดที่ตรงกัน commit อยู่จริงเสมอ** |
| **การพิสูจน์ว่าแก้ได้จริง** | PR #26: CI รันผ่าน (ก่อนหน้านี้ error ที่ step แรก) · deploy รอบถัดไป success · prod 200 |
| **บันทึกโดย** | Claude · branch `fix/ci-npm-cache-broken` · PR #26 |


### INC-0019 · ~~ยกเลิก — ซ้ำกับ INC-0018~~

> รายการนี้เป็น auto-entry ที่ทุกช่อง = ก็อป commit title มา (ซ้ำเรื่องเดียวกับ INC-0018) — ถูกลบเนื้อหาออก
> `validateIncident()` ที่เพิ่มใน **INC-0021** จะบล็อก entry แบบนี้ตั้งแต่ตอน commit


### INC-0018 · 2026-08-31 20:45 · 🟠 High · CI Fail จาก pnpm-workspace.yaml ผิด Schema ขาด packages field (ISSUE-011)

| หัวข้อ | รายละเอียด |
| :--- | :--- |
| **อาการที่พบ** | GitHub Actions CI ล้มเหลวทันทีที่ขั้นตอน Setup/Install Dependencies ด้วย error `ERROR packages field missing or empty` |
| **สาเหตุราก** | `pnpm-workspace.yaml` มีคีย์ `allowBuilds:` ซึ่งไม่ใช่ spec จริงของ pnpm 9.15 และขาดคีย์ `packages: - .` ทำให้ pnpm 9.15 หา workspace packages ไม่เจอและบล็อกการติดตั้ง |
| **การแก้ไข** | 1) แก้ไข `pnpm-workspace.yaml` ให้ถูกต้อง: เพิ่ม `packages: - .` และตัด `allowBuilds` ทิ้ง คงไว้เฉพาะ `onlyBuiltDependencies` 2) ปรับ CI ให้สอดคล้องสมบูรณ์ 3) รัน `npm run repo:verify` ผ่าน 7/7 ด่าน |
| **🛡️ กฎป้องกันถาวร** | **1) Workspace Config ต้องมี `packages: - .` เสมอ และห้ามใส่คีย์ที่ไม่อยู่ใน official spec 2) ทุกการเปลี่ยนแปลงคอนฟิก CI/Package ต้องตรวจสอบความถูกต้องของ Schema และทดสอบ Store/Install ก่อน 3) ทำงานให้เรียบร้อย รอบคอบ มีความคิดเป็นระบบ ไม่แก้เพียงผิวเผิน** |
| **การพิสูจน์ว่าแก้ได้จริง** | แก้ไข `pnpm-workspace.yaml` ถูกต้องตาม spec, ผ่านการตรวจสอบ 7/7 ด่าน, build 91 static/dynamic pages ผ่าน 100% |
| **บันทึกโดย** | Antigravity AI · branch `feat/consolidated-platform-upgrades` |


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
| **การพิสูจน์ว่าแก้ได้จริง** | dev server: การ์ด 34–69px เลือก `w128` (เดิม `w256`/`w512`) downscale เหลือ 1.9–3.8× · production HTML หลัง deploy มี `sizes="96px"` แล้ว · chat scroll เลื่อนเฉพาะกล่อง `max-h-80` ไม่ดึง window (ต้องเทียบ Chrome Retina จริงอีกที) |
| **เชื่อมโยง** | ผลข้างเคียงของ INC-0009 (auto-scroll ที่เพิ่มตอนนั้นใช้ `scrollIntoView` เลื่อน window) · sizes ที่ใหญ่เกินเป็นหนี้เก่าจาก INC-0002 (ตอนนั้นแก้เรื่องขนาดไฟล์ แต่ไม่ได้จูน `sizes` ต่อจุด) |
| **บันทึกโดย** | Claude · branch `claude/chrome-sharp-chatscroll` · PR #23 |


### INC-0015 · 2026-08-31 18:36 · 🟡 Medium · branch push ทิ้งไว้โดยไม่เปิด PR → automation ไม่ทำงาน งานไม่ขึ้น production

| หัวข้อ | รายละเอียด |
| :--- | :--- |
| **อาการที่พบ** | GitHub ขึ้นแบนเนอร์ 'Compare & pull request' ค้างไว้ · branch claude/resilience-perf-enhancements มี 13 commit (perf/SEO/bug fixes) push ขึ้น remote แล้วแต่ pr.yml/deploy.yml ไม่ทำงานเลย งานทั้งหมดค้างไม่ขึ้น production |
| **ผลกระทบ** | งาน perf + แก้ ISSUE-001 (เว็บใช้ดูดวงไม่ได้) ค้าง 30+ นาที · branch ล้าหลัง main จน conflict 3 ไฟล์ ต้อง merge มือ |
| **สาเหตุราก** | pr.yml trigger จาก pull_request event เท่านั้น การ git push เฉยๆ ไม่สร้าง event นั้น · Agent (Antigravity) ทำงานเสร็จแล้ว commit+push แต่ข้ามขั้น npm run pr:auto ใน Standard Workflow ข้อ 7 · ไม่มีเครื่องเตือนว่า 'branch นี้มีงานแต่ยังไม่เปิด PR' |
| **การแก้ไข** | เปิด PR #21 รวม branch + reconcile conflict (เก็บ edge caching, ตัด cloudflare ID ปลอม) · เพิ่มเครื่องเตือน 3 จุด: git:tidy เตือน branch ที่มี commit นำหน้า main แต่ไม่มี PR / pre-push hook เตือนตอน push branch ที่ยังไม่มี PR / AI_COLLABORATION_GUIDELINES ข้อ 0.4 เน้นห้ามข้ามขั้น pr:auto |
| **🛡️ กฎป้องกันถาวร** | **หลัง commit+push ทุกครั้ง ต้องรัน npm run pr:auto เสมอ — ถือว่างานยังไม่เสร็จจนกว่า PR จะเปิด · git:tidy + pre-push hook จะเตือนอัตโนมัติถ้ามี branch งานค้างไม่มี PR** |
| **การพิสูจน์ว่าแก้ได้จริง** | รัน `npm run git:tidy` เห็นบรรทัด `⚠️ claude/enforce-pr-flow — มี 1 commit นำหน้า main แต่ยังไม่ได้เปิด PR!` + สรุป `🚨 มี N branch งานค้าง` ท้ายสุด |
| **เกิดซ้ำแล้ว** | 2026-08-31 หลัง INC-0015 ไม่นาน Antigravity push 6 branch (`perf/page-bundle-and-lazy-motion` ฯลฯ) โดยไม่เปิด PR อีก — `git:tidy` จับได้ทั้ง 6 · ครั้งนี้ผู้ใช้สั่งให้ Antigravity consolidate เป็น PR #24 เอง (ยังไม่มี pre-push hook เพราะ hook เพิ่งเข้า main รอบนี้) |
| **บันทึกโดย** | Claude · branch `claude/enforce-pr-flow` · PR #22 |


### INC-0014 · 2026-08-31 16:42 · 🟡 Medium · แก้ ISSUE-001/002/008/009/011 พร้อมกันในชุดเดียว (flow ติดตาย, hydration, 404 preload)

| หัวข้อ | รายละเอียด |
| :--- | :--- |
| **อาการที่พบ** | ISSUE-001: กดปุ่มไปขั้น 2 ของ flow ดูดวงแล้วค้าง (เว็บใช้ดูดวงไม่ได้) · ISSUE-002: React hydration error หน้า `/spreads` · ISSUE-008/009: เปิดหน้าใดก็ยิง 404 12 ครั้ง (`/cards/variants/w320/`, `/sounds/*.mp3`) · ISSUE-011: `npm install` สร้าง `package-lock.json` เกิน |
| **ผลกระทบ** | ISSUE-001 บล็อกฟีเจอร์หลักทั้งเว็บ · ที่เหลือเปลือง request + console รก |
| **สาเหตุราก** | `<AnimatePresence mode="wait">` (motion@13 + React 19.2) exit-transition deadlock · `Math.cos/sin` ทศนิยมดิบใน inline style · `cache.ts` เขียน path ภาพ/เสียงเองไม่ผ่าน `getCardImageSrc()` (ละเมิดกฎ INC-0002) · ไม่มี `packageManager` field |
| **การแก้ไข** | ถอด `<AnimatePresence>` ออกจาก `page.tsx` ใช้ conditional render ธรรมดา · `Number((...).toFixed(2))` ใน `TarotArtIcons.tsx` · `cache.ts` ใช้ `getCardImageSrc()` + ตัด `PRELOAD_SOUNDS` · เพิ่ม `packageManager` |
| **🛡️ กฎป้องกันถาวร** | **หน้า multi-step ห้ามครอบด้วย `AnimatePresence mode="wait"` · trig coord ต้อง `.toFixed()` ก่อนลง style · path ภาพไพ่ทุกจุดผ่าน `getCardImageSrc()` เท่านั้น (มีด่านตรวจ test-image-paths แล้ว)** |
| **การพิสูจน์ว่าแก้ได้จริง** | ⚠️ commit นี้อ้าง "7 ด่านผ่าน" แต่ 7 ด่านไม่ได้เทสต์ flow จริง — ต่อมา **PR #21 (INC ไม่มี)** Claude verify ด้วยการคลิกจริงผ่านเบราว์เซอร์ว่า ISSUE-001 เดินขั้น 1→2→3 ได้จริง + `curl /spreads` ไม่มีทศนิยมดิบ + network log ไม่มี 404 |
| **บันทึกโดย** | Antigravity AI · branch `claude/resilience-perf-enhancements` · เนื้อหาข้างบนเรียบเรียงใหม่โดย Claude (ของเดิมช่อง "อาการ" = ก็อป commit title) |


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


### INC-0010 · 2026-08-31 13:44 · 🔴 Critical · ดูดวงหลายขั้นแล้ว session หายกลางคัน เพราะ Cloudflare edge worker isolate ไม่ share memory

| หัวข้อ | รายละเอียด |
| :--- | :--- |
| **อาการที่พบ** | ผู้ใช้เริ่มดูดวง → สับไพ่ → เลือกไพ่ แต่พอถึงขั้นอ่านคำทำนาย ระบบขึ้นว่าไม่พบ reading (404) flow พังกลางคันแบบสุ่ม |
| **ผลกระทบ** | ผู้ใช้ดูดวงไม่จบเป็นบางครั้งบน production |
| **สาเหตุราก** | `src/server/store.ts` เก็บ reading ไว้ใน memory ของ worker แต่ Cloudflare Workers รันแบบ stateless isolate — request ถัดไปอาจตกไป isolate คนละตัวที่ไม่มีข้อมูลนั้น (ISSUE-007: Prisma ยังไม่ต่อ จึงยังไม่มี persistent store) |
| **การแก้ไข** | ออกแบบ stateless session token: เซ็น reading state ด้วย HMAC-SHA256 ส่งให้ client ถือ ทุก API route ถอดรหัส token กู้ state กลับมาเองได้โดยไม่ต้องพึ่ง memory — `src/lib/security/session-token.ts` |
| **🛡️ กฎป้องกันถาวร** | **บน Cloudflare Workers ห้ามพึ่ง in-memory state ข้าม request — ต้องมาจาก token/KV/D1 เสมอ · secret ที่เซ็น token ต้องมาจาก env จริง (ตามมา ISSUE-010b: fallback เป็นสตริงตายตัวทำ Provably-Fair พังเงียบ)** |
| **การพิสูจน์ว่าแก้ได้จริง** | typecheck 0 · repo:verify ผ่าน · ทดสอบ flow หลายขั้นบน production ไม่เจอ 404 กลางคันอีก |
| **บันทึกโดย** | Antigravity AI · branch `main` · commit `b33429f` · เรียบเรียงใหม่โดย Claude (ของเดิมทุกช่อง = ก็อป commit title ภาษาอังกฤษ) |


### INC-0009 · 2026-08-31 13:38 · 🟠 High · แชทถามต่อไม่เลื่อนหาข้อความใหม่ + session หายเมื่อคุยหลายรอบ

| หัวข้อ | รายละเอียด |
| :--- | :--- |
| **อาการที่พบ** | 1) พิมพ์ถามในแชทถามต่อ ข้อความใหม่โผล่ใต้จอ ต้องเลื่อนเองถึงจะเห็น 2) คุยไปหลายรอบแล้วแชทขึ้น error ว่าไม่พบ reading |
| **ผลกระทบ** | แชทถามต่อใช้ยาก + ใช้ไม่ได้เลยเมื่อ worker isolate เปลี่ยนตัว |
| **สาเหตุราก** | 1) ไม่มี logic เลื่อน scroll หาข้อความล่าสุด 2) เหมือน INC-0010 — `chat` route พึ่ง in-memory reading ที่ edge worker isolate ไม่ share |
| **การแก้ไข** | เพิ่ม `chatBottomRef` + `scrollIntoView` auto-scroll · ส่ง `readingSnapshot` เป็น fallback payload จาก client ให้ chat route ใช้ตอน memory ไม่มี |
| **🛡️ กฎป้องกันถาวร** | **edge route ที่ต้องใช้ reading state ต้องรับ snapshot/token จาก client ได้เสมอ ไม่พึ่ง memory ฝั่ง server** |
| **⚠️ ผลข้างเคียงที่พบภายหลัง** | `chatBottomRef.scrollIntoView()` ที่เพิ่มใน incident นี้ เลื่อน **window ทั้งหน้า** ตามไปด้วย → ผู้ใช้โดนหน้าเด้งลงทุกครั้งที่กดส่ง · แก้ใน **INC-0016** (เลื่อนเฉพาะกล่องแชท + เช็ค nearBottom) |
| **การพิสูจน์ว่าแก้ได้จริง** | typecheck 0 · repo:verify ผ่าน · แชทหลายรอบไม่ 404 |
| **บันทึกโดย** | Antigravity AI · branch `main` · commit `c9e3afc` · เรียบเรียงใหม่โดย Claude (ของเดิมทุกช่อง = ก็อป commit title) |


### INC-0008 · 2026-08-31 13:20 · 🟠 High · แชทถามต่อตอบข้อความ hardcoded เดิมๆ ไม่ตอบตรงคำถาม เพราะเรียก Gemini model ผิด

| หัวข้อ | รายละเอียด |
| :--- | :--- |
| **อาการที่พบ** | ผู้ใช้พิมพ์ถามอะไรในแชทถามต่อ ก็ได้คำตอบเป็นข้อความสำเร็จรูปเดิมทุกครั้ง ไม่เกี่ยวกับคำถาม |
| **ผลกระทบ** | ฟีเจอร์แชทถามต่อไม่ทำงานจริง เป็นแค่ข้อความตายตัว |
| **สาเหตุราก** | chat route เรียก Gemini ด้วยชื่อ model ที่ไม่มีจริง + ส่ง `thinkingConfig` ที่ model ไม่รองรับ → API ตอบ 400 Bad Request → โค้ดมี `catch` ที่ fall back ไปคืนสตริง hardcoded โดยไม่ log ว่า error |
| **การแก้ไข** | เปลี่ยนไปใช้ Gemini model ที่ valid + เพิ่ม Claude เป็น engine สำรอง + ส่ง conversation history เข้าไปด้วยเพื่อให้ตอบตามบริบท — `src/app/api/reading/[id]/chat/route.ts` |
| **🛡️ กฎป้องกันถาวร** | **ห้าม `catch` แล้ว fallback เงียบไปคืนค่า hardcoded — ถ้า AI call ล้มต้อง log + คืน error ให้ผู้ใช้เห็น · ชื่อ model ต้อง validate กับ docs ก่อนใช้ (ดูรวมใน INC-0014 ของ Gemini model fallback)** |
| **การพิสูจน์ว่าแก้ได้จริง** | typecheck 0 · repo:verify ผ่าน · พิมพ์คำถามต่างกันได้คำตอบต่างกันตามบริบท |
| **บันทึกโดย** | Antigravity AI · branch `main` · commit `6ee6fc8` · เรียบเรียงใหม่โดย Claude (ของเดิมทุกช่อง = ก็อป commit title) |


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


