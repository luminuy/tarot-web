# 📱 SeerTarot — แอป iOS (Expo / React Native)

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
| `app/(tabs)/` | 5 แท็บ: วันนี้ · เปิดไพ่ · สมุด · สารานุกรม · บัญชี |
| `app/reading/[spreadId].tsx` | เปิดไพ่ครบวงจร: คำถาม → แม่หมอ → เลือกไพ่เอง → พลิกเอง → คำอ่านสตรีม → ตรวจ Provably Fair |
| `lib/api/client.ts` | ตัวเรียกหลังบ้านตัวเดียว (Bearer · `X-Client: ios` · `X-App-Version` · SSE ผ่าน `expo/fetch`) |
| `lib/api/types.ts` | สัญญา response ที่แอปพึ่งพา — เว็บ **เพิ่มฟิลด์ได้อย่างเดียว ห้ามลบ/เปลี่ยนชื่อ** |
| `lib/auth/session.ts` | โทเคนเซสชันใน Keychain (`expo-secure-store`) |
| `lib/provably-fair.ts` | พอร์ตตัวตรวจจาก `src/lib/tarot/verify-client.ts` ใช้ `expo-crypto` |
| `lib/cardImages.ts` | แผนที่ภาพไพ่ 78 ใบ ชี้ตรงไป `../public/cards/w512b` (ไม่มีสำเนา) |
| `@core/*` | alias ไป `../src/*` — ข้อมูลไพ่ · ผัง · แม่หมอ อ่านจากที่เดียวกับเว็บ **ห้ามคัดลอกข้อมูลมาไว้ในแอป** |

## กฎเหล็กของเว็บที่แอปต้องถือเหมือนกัน

ไพ่คว่ำเสมอ ผู้ใช้พลิกเอง (ข้อ 4) · ภาพ 1909 เท่านั้นผ่าน `CardImageNative` จุดเดียว (ข้อ 5, 8) · ห้ามอิโมจิการ์ตูน ใช้ `✦` (ข้อ 2) ·
สายด่วน 1323 + ปุ่มโทร (ข้อ 6) · ห้ามกุไพ่ — ข้อมูลขาด = "โหลดใหม่อีกครั้ง" (ข้อ 14)

## เทสต์

- `__tests__/provably-fair.test.ts` — ผลจั่วไพ่ของแอปต้องตรงกับ `src/lib/tarot/shuffle.ts` ของเซิร์ฟเวอร์ทุกใบ (125 รอบสุ่ม)
- `__tests__/card-images.test.ts` — ภาพครบ 78 ใบ ตรงกับสำรับของเว็บ และไฟล์มีอยู่จริง

CI: `.github/workflows/mobile.yml` (typecheck · jest · expo-doctor) รันเมื่อ `mobile/**` หรือแกนร่วม (`src/data/**` · `src/lib/tarot/**`) เปลี่ยน

## ยังไม่ทำ (รอบัญชี Apple Developer / เจ้าของ)

- Sign in with Apple (บังคับข้อ 4.8 ของ Apple ก่อนส่งตรวจ) · App Attest · ล็อกอิน Google/LINE
- ล็อกอินอีเมลจากแอปยังผ่านไม่ได้เมื่อหลังบ้านเปิด Turnstile (แอปไม่มี widget) — ต้องรอ App Attest แทน
- IAP ซื้อเครดิต · Push · Widget · Universal Links
- ไอคอนแอป / splash (`app.json` ยังไม่ตั้ง `icon`) · ภาพหน้าร้าน · Bundle ID ยืนยัน `net.seertarot.app`
- ⚠️ ออกจากระบบในแอปล้างแค่ Keychain — โทเคนฝั่งเซิร์ฟเวอร์ยังใช้ได้จนหมดอายุ 30 วัน (เว็บก็เป็นแบบเดียวกัน) ก่อนขึ้น App Store ควรมีทางเพิกถอนโทเคนของเครื่องเดียว
- ⚠️ WAF ของ Cloudflare (ISSUE-047 กฎข้อ 4) challenge POST ที่ไม่มี `Origin` — ต้องเพิ่มข้อยกเว้นให้หัว `Authorization: Bearer` / `X-Client: ios` ไม่งั้นแอปโดนก่อนถึง Worker
