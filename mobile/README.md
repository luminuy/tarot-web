# 📱 SeerTarot — แอป iOS (Expo / React Native)

> ตรวจกับโค้ดล่าสุด: 2026-10-26 · Expo ~54 · React Native 0.81 · ยังไม่ได้ทดสอบบนเครื่องจริงและยังไม่ส่งสโตร์ (สถานะเต็มอยู่ในแผนแม่บท)

แผนแม่บท: [`docs/plans/IOS_APP_PLAN_2026-09-29.md`](../docs/plans/IOS_APP_PLAN_2026-09-29.md)
แอปเป็น "หน้าร้านใหม่" ของหลังบ้านเดิม — ใช้ Worker / D1 / KV / AI / Provably Fair ชุดเดียวกับเว็บ ไม่มีหลังบ้านของตัวเอง

## รันในเครื่อง

```bash
cd mobile
npm install
npm run ios          # iOS Simulator (ต้องมี Mac + Xcode) หรือ: npx expo start แล้วสแกน QR ด้วย Expo Go บน iPhone
npm run typecheck && npm test
```

ไม่ต้องมี Mac ก็ทดสอบบน iPhone จริงได้ด้วย Expo Go · ต้องมีบัญชี Apple Developer เมื่อจะใช้ Sign in with Apple · Push · Widget · IAP · TestFlight (ดูหัวข้อ "ยังไม่ทำ")

ชี้แอปไปหลังบ้านอื่น (เช่น dev server ของเว็บ): แก้ `expo.extra.apiBaseUrl` ใน `app.json`

## โครงสร้าง

| ที่ | หน้าที่ |
| :-- | :-- |
| `app/(tabs)/` | 4 แท็บ: วันนี้ (`index`) · เปิดไพ่ (`read`) · สมุด (`journal`) · คลังไพ่ (`cards`) · บัญชี = `app/account.tsx` แผ่นเด้งจากปุ่มรูปคนบนหน้าวันนี้ · `app/login.tsx` · `app/onboarding.tsx` · `app/card/` หน้าไพ่รายใบ |
| `components/ui.tsx` · `glass.tsx` · `lib/theme.ts` | ระบบดีไซน์ (ดู `DESIGN.md`) — กระจกเฉพาะชั้นนำทาง · เนื้อหาใช้ `Card` · จุดเน้นใช้ `NightPanel` |
| `app/reading/[spreadId].tsx` · `lib/reading-flow.ts` · `lib/useReadingFlow.ts` | พิธีเปิดไพ่ 5 ขั้น: คำถาม ➔ แม่หมอ ➔ เลือกไพ่เอง ➔ พลิกเอง ➔ คำอ่านสตรีม + ตรวจ Provably Fair (state machine แยกไว้ใน `reading-flow.ts` ให้เทสต์ได้) |
| `lib/api/client.ts` | ตัวเรียกหลังบ้านตัวเดียว (Bearer · `X-Client: ios` · `X-App-Version` · SSE ผ่าน `expo/fetch`) |
| `lib/api/types.ts` | สัญญา response ที่แอปพึ่งพา — เว็บ **เพิ่มฟิลด์ได้อย่างเดียว ห้ามลบ/เปลี่ยนชื่อ** |
| `lib/auth/session.ts` | โทเคนเซสชันใน Keychain (`expo-secure-store`) |
| `lib/provably-fair.ts` | พอร์ตตัวตรวจจาก `src/lib/tarot/verify-client.ts` ใช้ `expo-crypto` |
| `lib/cardImages.ts` · `components/CardImageNative.tsx` | แผนที่ภาพไพ่ 78 ใบ ชี้ตรงไป `../public/cards/w512b` (ไม่มีสำเนา) · แสดงภาพไพ่ผ่าน `CardImageNative` จุดเดียว |
| `@core/*` | alias ไป `../src/*` — ข้อมูลไพ่ · ผัง · แม่หมอ อ่านจากที่เดียวกับเว็บ **ห้ามคัดลอกข้อมูลมาไว้ในแอป** |

## กฎเหล็กของเว็บที่แอปต้องถือเหมือนกัน

เลขข้อตามกฎเหล็กใน [`CLAUDE.md`](../CLAUDE.md): ไพ่คว่ำเสมอ ผู้ใช้พลิกเอง (ข้อ 4) · ภาพ 1909 เท่านั้นผ่าน `CardImageNative` จุดเดียว (ข้อ 5, 8) · ห้ามอิโมจิและสัญลักษณ์ประดับ ไอคอนใช้ `@expo/vector-icons` (ข้อ 2) ·
สายด่วน 1323 + ปุ่มโทร (ข้อ 6) · ห้ามกุไพ่ — ข้อมูลขาด = "โหลดใหม่อีกครั้ง" (ข้อ 14)

## เทสต์

- `__tests__/provably-fair.test.ts` — ผลจั่วไพ่ของแอปต้องตรงกับ `src/lib/tarot/shuffle.ts` ของเซิร์ฟเวอร์ทุกใบ (125 รอบสุ่ม)
- `__tests__/card-images.test.ts` — ภาพครบ 78 ใบ ตรงกับสำรับของเว็บ และไฟล์มีอยู่จริง
- `__tests__/reading-flow.test.ts` — state machine พิธีเปิดไพ่ (ปลดคำอ่านเมื่อพลิกครบเอง · สตรีมขาดไม่กลายเป็นผลลัพธ์)

CI: `.github/workflows/mobile.yml` (`npm ci` · typecheck · jest · expo-doctor) รันเมื่อ `mobile/**` หรือแกนร่วม (`src/data/**` · `src/lib/tarot/**`) เปลี่ยน — แยกจาก `repo:verify` ของเว็บ

> ⚠️ แอปใช้ไฟล์ใต้ `src/` ผ่าน `@core/*` — ก่อนลบหรือย้ายไฟล์ใน `src/` ต้อง grep ใน `mobile/` ด้วย (INC-0281)

## ยังไม่ทำ (รอบัญชี Apple Developer / เจ้าของ)

- Sign in with Apple (บังคับข้อ 4.8 ของ Apple ก่อนส่งตรวจ) · App Attest · ล็อกอิน Google/LINE
- ล็อกอินอีเมลจากแอป: ด่าน Origin (`src/lib/security/anti-theft.ts` · `NATIVE_APP_PRELOGIN_PATHS`) รับคำขอ `X-Client: ios` ที่ไม่มี Bearer เฉพาะ `POST /api/auth/email/login` (และต้องไม่มีหัวของเบราว์เซอร์) — ด่านถัดไปคือ Turnstile: เมื่อหลังบ้านตั้ง `TURNSTILE_SECRET_KEY` ไว้ แอปซึ่งไม่มี widget จะได้ 403 "ไม่ใช่การใช้งานจากคนจริง" จนกว่า App Attest (แผน 4.2) จะพร้อม · ด่าน Origin ไม่ใช่ด่านกันบอท ห้ามขยายรายการเส้นทางนี้ไปเส้นที่เรียกโมเดลหรือใช้เงิน
- เปิดไพ่จากแอปต้องล็อกอินก่อน (ส่ง Bearer) — ผู้เยี่ยมชมที่ยังไม่ล็อกอินโดนด่าน Origin ตอบ 403 ตั้งแต่ `/api/reading/start` แอปจึงนับ 403 ตอนไม่มีโทเคนเป็น "ต้องเข้าสู่ระบบ" (`isSignInReason` ใน `lib/useReadingFlow.ts`) และขึ้นปุ่มเข้าสู่ระบบแทนข้อความดิบ
- IAP ซื้อเครดิต · Push · Widget · Universal Links
- ไอคอนแอป / splash (`app.json` ยังไม่ตั้ง `icon`) · ภาพหน้าร้าน · Bundle ID ยืนยัน `net.seertarot.app`
- ⚠️ ออกจากระบบในแอปล้างแค่ Keychain — โทเคนฝั่งเซิร์ฟเวอร์ยังใช้ได้จนหมดอายุ 30 วัน (เว็บก็เป็นแบบเดียวกัน) ก่อนขึ้น App Store ควรมีทางเพิกถอนโทเคนของเครื่องเดียว
- ⚠️ กฎ WAF `[phase1]` ท้าทาย (managed challenge) คำขอเปลี่ยนสถานะที่ `/api/` ซึ่งไม่มี `Origin` ของเว็บ (`scripts/cloudflare-phase1.ts` · ยังไม่มีข้อยกเว้นให้แอป) — ต้องเพิ่มข้อยกเว้นให้หัว `Authorization: Bearer` / `X-Client: ios` ก่อนปล่อยแอป ไม่งั้นแอปโดนก่อนถึง Worker
