# A1-backend-auth

## ความคืบหน้า

## ข้อค้นพบ

### 🟠 A1-01 · รีเซ็ตรหัสผ่าน: เผาโทเคนทิ้งก่อนตรวจนโยบายรหัสผ่าน
- ที่: `src/app/api/auth/email/reset/route.ts:62` (consumeToken) ก่อน `:75` (validatePasswordPolicy)
- ปัญหา: `consumeToken()` ตั้ง `used_at` แล้วค่อยตรวจนโยบาย (มีอีเมลในรหัส/รหัสยอดนิยม ฯลฯ) ถ้าไม่ผ่านตอบ 400 แต่ลิงก์ใช้ไม่ได้อีกแล้ว
- ผลกระทบ/สถานการณ์พัง: ผู้ใช้กรอกรหัสที่ไม่ผ่านเกณฑ์ครั้งแรก ➔ แก้แล้วกดใหม่ได้ "ลิงก์หมดอายุหรือถูกใช้ไปแล้ว" ต้องกลับไปขออีเมลใหม่ (โดนเพดาน forgot ด้วย)
- แนวแก้: ตรวจ `validatePasswordPolicy` ก่อน consume (ต้องรู้อีเมล: SELECT user จาก token_hash แบบไม่ consume ก่อน หรือตรวจนโยบายส่วนที่ไม่พึ่งอีเมลก่อน) แล้วค่อย `consumeToken`

### 🟠 A1-02 · เพดานกันเดารหัส (auth-ratelimit) ไม่ atomic — ยิงขนานทะลุเพดานได้ รวมถึงล็อกอินแอดมิน
- ที่: `src/lib/security/auth-ratelimit.ts:170-185` (`recordUnchecked` = readBucket ➔ +1 ➔ writeBucket บน KV) · ใช้ที่ `src/app/api/admin/login/route.ts:34` · `tester/login` · `auth/email/login` (peek ก่อน record ทีหลัง `login/route.ts:73`)
- ปัญหา: read-modify-write บน KV ไม่มี atomic + KV จำกัด 1 write/วินาที/คีย์ (put ที่เกินจะ throw แล้วถูกกลืนเงียบใน `writeBucket` ➔ นับแค่ใน Map ของ isolate) · ฝั่ง email login ยิ่งหนัก: `peek` ทั้งชุดก่อน แล้วค่อย `recordAuthFailure` หลัง PBKDF2 เสร็จ
- ผลกระทบ/สถานการณ์พัง: ยิง 200 คำขอพร้อมกันไป `/api/admin/login` ทุกตัวอ่านเจอ count < 8 ➔ ผ่านหมด = เดารหัสแอดมินได้หลายร้อยครั้งต่อรอบแทน 8 ครั้ง/15 นาที · เหมือนกันกับเดารหัสสมาชิก
- แนวแก้: ใช้ตัวนับ atomic แบบเดียวกับ `lib/security/edge-ratelimit.ts` (Redis INCRBY ➔ ถอยไป KV) หรือ D1 `INSERT ... ON CONFLICT DO UPDATE SET count=count+1 RETURNING count` แล้วตัดสินจากค่าที่คืน ไม่ใช่ค่าที่ peek

### 🟠 A1-03 · ลิงก์ยืนยันอีเมล (GET) ออกเซสชันให้ใครก็ได้ที่กด = Login CSRF / ยัดบัญชีคนอื่นให้เหยื่อ
- ที่: `src/app/api/auth/email/verify/route.ts:36-59`
- ปัญหา: GET ที่ consume token แล้ว `setAuthCookie()` ของเจ้าของ token ทันที โดยไม่สนว่าเบราว์เซอร์นั้นล็อกอินเป็นใครอยู่ และไม่มีการยืนยันใด ๆ
- ผลกระทบ/สถานการณ์พัง: ผู้โจมตีสมัครด้วยอีเมลตัวเอง ➔ เอาลิงก์ยืนยันส่งให้เหยื่อ (หรือฝังเป็น `<img>`/ลิงก์) ➔ เหยื่อถูกสลับเข้าบัญชีผู้โจมตีเงียบ ๆ (ทับเซสชันเดิมของเหยื่อด้วย) ➔ คำถาม/คำทำนาย/ข้อมูลวันเกิดที่เหยื่อกรอกต่อจากนั้นไปลงบัญชีผู้โจมตีให้อ่านได้ (PDPA) · อีกด้าน ตัวสแกนลิงก์ของอีเมล (Outlook Safe Links) ที่เปิดลิงก์ก่อนจะเผาโทเคนทิ้ง ผู้ใช้กดเองได้ `verify_error=expired`
- แนวแก้: ยืนยันอีเมลอย่างเดียว ไม่ออกคุกกี้ (หรือออกเฉพาะเมื่อไม่มีเซสชันเดิมและ user id ตรงกับคุกกี้ใบ้) · ย้ายการ consume ไปเป็น POST จากหน้า `/verify-email?token=` ให้ผู้ใช้กดปุ่ม

### 🟡 A1-04 · ส่งออกข้อมูลบัญชี (PDPA) ตัดสมุดบันทึกเงียบ ๆ ที่ 200 รายการ
- ที่: `src/app/api/account/export/route.ts:26` (`listJournal(user.id, { limit: 200 })`) · เพดาน `src/lib/journal/journal.repo.ts:93`
- ปัญหา: ตาราง `reading_journal` ไม่มีเพดานจำนวน แต่ export ดึงแค่ 200 แถวล่าสุด และรายงาน `readingJournalCount: journal.length` เหมือนเป็นยอดทั้งหมด · response ข้อมูลส่วนบุคคลไม่มี `Cache-Control: no-store`
- ผลกระทบ/สถานการณ์พัง: ผู้ใช้ที่เปิดไพ่ทุกวัน > 200 วัน ขอสำเนาข้อมูลตามสิทธิ์ PDPA ได้ไม่ครบ และไฟล์บอกยอดผิด
- แนวแก้: วนหน้าด้วย `before` จนหมด (หรือ query ไม่มี LIMIT แยกสำหรับ export) · ใส่ยอดจริงจาก COUNT · เติม `Cache-Control: no-store, private`

### 🔴 A1-05 · ผู้ใช้ Google/LINE ที่เคยลบบัญชี ล็อกอินกลับไม่ได้อีกตลอดกาล (ดูเหมือนสำเร็จแต่เด้งออกทันที)
- ที่: `src/app/api/auth/[provider]/callback/route.ts:163-174` · `src/lib/users/users.repo.ts:384-392` (softDelete ไม่แตะ `oauth_identities`)
- ปัญหา: ลบบัญชี = `deleted_at` อย่างเดียว แถว `oauth_identities` ยังชี้ user id เดิม ➔ ล็อกอินใหม่เข้ากิ่ง "ผูกไว้แล้ว" ➔ `getUserById()` กรอง `deleted_at IS NULL` คืน null ➔ ไม่มีการเรียก `upsertUserOnLogin` (ที่คอมเมนต์ `users.repo.ts:194` อ้างว่าเป็นตัวคืนชีพ) ➔ ออกคุกกี้ให้ id ที่ถูกลบ ➔ `getRevocationState()` ตอบ `deleted` ➔ `/api/auth/me` ล้างคุกกี้ทุกครั้ง
- ผลกระทบ/สถานการณ์พัง: ผู้ใช้ OAuth ที่ลบบัญชีแล้วกลับมาใช้ใหม่ เห็น `auth_success=1` แต่ไม่เคยล็อกอินติดเลย ไม่มีข้อความ error ใด ๆ (สมัครด้วยอีเมลเดิมก็เข้ากิ่ง revive เป็น provider email แทน)
- แนวแก้: ใน callback ถ้า `existingLinkedUserId` แต่ `linkedUser` เป็น null ให้เรียก `upsertUserOnLogin({ id: existingLinkedUserId, ... })` เพื่อคืนชีพ (หรือให้ `softDeleteUser` ลบแถว `oauth_identities` ของผู้ใช้นั้นทิ้ง) + เทสต์ลบแล้วล็อกอินใหม่

### 🟡 A1-06 · "ลบบัญชี" ไม่ได้ลบข้อมูลส่วนบุคคลจริง — อีเมล/ชื่อ/แฮชรหัส/avatar ค้างถาวร
- ที่: `src/lib/users/users.repo.ts:389` (`UPDATE users SET deleted_at = ?` เท่านั้น) · ไม่มีงาน cron ใดลบแถวที่ `deleted_at` ไม่ว่าง (grep ทั้ง `src`)
- ปัญหา: หน้า `/api/account` ตอบ "ลบบัญชีและข้อมูล…ทั้งหมดเรียบร้อยแล้ว" แต่ `email`, `name`, `avatar_url`, `password_hash`, `oauth_identities` อยู่ครบ
- ผลกระทบ/สถานการณ์พัง: ขัดสิทธิ์ลบข้อมูลตาม PDPA ที่ประกาศไว้ · ถ้าฐานข้อมูลรั่ว ผู้ที่ลบบัญชีไปแล้วก็รั่วด้วย
- แนวแก้: ตอน soft delete ให้ล้าง `name/avatar_url/password_hash` ทันที (เก็บ `email_lower` ไว้เฉพาะถ้าจำเป็นกับ unique index หรือแทนด้วยแฮช) + ลบ `oauth_identities` (สอดคล้องกับ A1-05)

### 🟠 A1-07 · OAuth callback กลืน error D1 แล้วออกคุกกี้ให้ id ผี — ชน UNIQUE อีเมลของบัญชีที่ถูกลบ = ล็อกอินไม่ติดถาวร
- ที่: `src/app/api/auth/[provider]/callback/route.ts:195-206` (กิ่ง "ผู้ใช้ใหม่มีอีเมล") + `:227-230` (`catch (dbErr)` ➔ ไปต่อ)
- ปัญหา: `getUserByEmail()` กรองแถวที่ถูกลบทิ้ง แต่ `idx_users_email_lower` (`src/lib/platform/db.ts:345`) ไม่สน `deleted_at` ➔ คนที่เคยสมัครอีเมลแล้วลบบัญชี กด "เข้าด้วย Google" อีเมลเดียวกัน ➔ `upsertUserOnLogin` INSERT ชน unique ➔ throw ➔ catch กลืน ➔ ออกคุกกี้ `google_<id>` ที่ไม่มีแถวใน DB ➔ `/api/auth/me` เห็นเป็น `deleted` ล้างคุกกี้ (บั๊กเดียวกับ INC-0048 ที่แก้ไว้แค่ฝั่ง signup อีเมล) · D1 สะดุดชั่วคราวในกิ่งอื่นก็ได้ผลเดียวกัน หรือได้ `tokenVersion` 0 ทั้งที่ของจริง ≥1 ➔ `revoked` ทันที
- ผลกระทบ/สถานการณ์พัง: ผู้ใช้เห็น `auth_success=1` แต่ไม่ได้ล็อกอิน ไม่มีข้อความบอกเหตุ ไม่มีทางแก้เอง
- แนวแก้: ใช้ `getUserByEmailIncludingDeleted` แล้วคืนชีพแถวเดิม (เหมือน signup) · ถ้า D1 พังให้ `fail(origin, "server_error")` แทนการออกคุกกี้ที่รู้อยู่แล้วว่าจะถูกปฏิเสธ
PROGRESS: [x] src/app/api/auth
PROGRESS: [x] src/app/api/account

### 🟡 A1-08 · checkout ส่ง `error.message` ดิบกลับหน้าเว็บ
- ที่: `src/app/api/entitlement/checkout/route.ts:103-107`
- ปัญหา: `catch (error: any)` ➔ `{ error: error?.message }` status 500 — ข้อความจาก `createGatewayCharge` (Omise API/fetch) หรือ D1 (`createPaymentRecord` เช่น `D1_ERROR: no such column ...`) หลุดถึงผู้ใช้ตรง ๆ
- ผลกระทบ/สถานการณ์พัง: เปิดเผยโครงสร้างตาราง/ผู้ให้บริการชำระเงิน และผู้ใช้เห็นข้อความอังกฤษเทคนิคแทนภาษาไทยที่เข้าใจได้
- แนวแก้: log เต็มฝั่งเซิร์ฟเวอร์ ตอบข้อความคงที่ "ไม่สามารถสร้างรายการสั่งซื้อได้ กรุณาลองใหม่" (+ `recordEvent`)

### 🟡 A1-09 · แผงแอดมินรายงานธง "ประกาศ" (announce) ว่าเปิด ทั้งที่ของจริงปิด
- ที่: `src/app/api/admin/entitlement/route.ts:21-26,38` (`truthy(null)` คืน `true`) เทียบ `src/lib/entitlement/snapshot.ts` (`announceDoc.value === true` เท่านั้น)
- ปัญหา: `truthy()` ถือว่า "ไม่มีค่า" = เปิด ซึ่งถูกกับ `entitlement.enforced` (ค่าเริ่มต้นเปิด) แต่ผิดกับ `entitlement.announce` ที่ค่าเริ่มต้นคือปิด
- ผลกระทบ/สถานการณ์พัง: ก่อนแอดมินเคยกดสวิตช์ ประกาศไม่แสดงบนเว็บ แต่แผงแอดมินขึ้นว่าเปิดอยู่ ➔ แอดมินเชื่อว่าผู้ใช้เห็นประกาศแล้ว (และ `announceResetDate` ว่าง)
- แนวแก้: `announce: announceRaw?.value === true` ให้ตรงกับตัวอ่านฝั่งผู้ใช้

### 🟠 A1-10 · บันทึก audit ของแอดมินจะ "ค้างอยู่ที่ของเก่า" เมื่อเกิน 1,000 รายการ — เหตุการณ์ใหม่ไม่โผล่เลย
- ที่: `src/lib/admin/audit.ts` (`listAudit`: `kvListKeys(prefix, 1000)` แล้ว `slice(-limit)`) · `src/lib/platform/kv-store.ts:92-101`
- ปัญหา: KV `list` คืนคีย์เรียงจากน้อยไปมาก (`app:audit:<ts>` เก่าสุดก่อน) และ `kvListKeys` หยุดที่ 1,000 คีย์แรก ➔ ท้ายของ 1,000 ตัวแรกไม่ใช่ของใหม่สุด เมื่อมีมากกว่า 1,000 รายการใน 180 วัน (TTL)
- ผลกระทบ/สถานการณ์พัง: `admin_login_fail` ถูกบันทึกทุกครั้งที่เดารหัสผิด ผู้โจมตีเดาจากหลาย IP ให้ครบพันรายการ ➔ แผงแอดมินแสดงแต่เหตุการณ์เก่า การล็อกอินสำเร็จ/แก้โค้ดแลกสิทธิ์/ปิดโควตาหลังจากนั้นมองไม่เห็นจนกว่าคีย์เก่าจะหมดอายุ
- แนวแก้: ใช้คีย์เรียงย้อน (`app:audit:<(9999999999999 - ts)>`) แล้วอ่าน `limit` ตัวแรก หรือวนจนครบทุกหน้าแล้วตัดท้าย · ย้าย audit ไป D1 (`ORDER BY ts DESC LIMIT ?`)
PROGRESS: [x] src/app/api/admin
PROGRESS: [x] src/app/api/entitlement
PROGRESS: [x] src/app/api/{tester,bootstrap,config}

### 🟠 A1-11 · สิทธิ์ "ใช้ไม่จำกัด" (UNLIMITED_EMAILS) ให้ตามอีเมลในคุกกี้ โดยไม่ดูว่าอีเมลยืนยันแล้วหรือยัง
- ที่: `src/lib/security/privileged.ts:42-45` · อีเมลในคุกกี้มาจาก `src/app/api/auth/email/signup/route.ts:156-163` (ออกเซสชันทันทีตอน `email_verified = 0`)
- ปัญหา: ใครก็สมัครด้วยอีเมลที่อยู่ในรายชื่อ `UNLIMITED_EMAILS` ได้ ถ้าอีเมลนั้นยังไม่มีบัญชี (หุ้นส่วนที่ยังไม่เคยสมัคร/ใช้ LINE ที่ไม่มีอีเมล) หรือเคยลบบัญชีไปแล้ว (เข้ากิ่ง `reviveEmailUser`) ➔ ได้คุกกี้ที่มีอีเมลนั้นทันทีโดยไม่ต้องกดยืนยัน
- ผลกระทบ/สถานการณ์พัง: ผู้ถือเซสชันนั้นข้ามเพดานอัตรา/เพดานพร้อมกัน/เพดานค่า AI รายวัน/ด่าน origin และโควตาเปิดไพ่ (`snapshot.ts` คืน 9999) = เผาโควตา Groq/Gemini ของเว็บได้ไม่จำกัด
- แนวแก้: ใน `isPrivilegedTestRequest` ต้องตรวจ `emailVerified` จาก DB (`getCachedUser`) ก่อนให้สิทธิ์ · หรือยอมรับเฉพาะ provider `google` ที่ยืนยันแล้ว

### 🟡 A1-12 · รายชื่อผู้รับข่าวสาร (CSV แอดมิน) รวมอีเมลที่ยังไม่ยืนยัน
- ที่: `src/lib/users/users.repo.ts:404-413` (`listConsentedUsersWithEmail` ไม่มี `email_verified = 1`) · ใช้ที่ `src/app/api/admin/marketing/route.ts:50`
- ปัญหา: ต่างจากคิว digest (`src/lib/digest/digest.repo.ts:37` กรอง `email_verified = 1`) — ใครก็สมัครด้วยอีเมลคนอื่นแล้วติ๊กยินยอมรับข่าวสารได้ (signup ไม่ต้องยืนยันก่อน)
- ผลกระทบ/สถานการณ์พัง: เจ้าของเว็บเอา CSV ไปยิงแคมเปญ ➔ ส่งถึงคนที่ไม่เคยยินยอมจริง (ความยินยอมไม่สมบูรณ์ตาม PDPA) + โดนรายงานสแปม เสียชื่อโดเมนส่งเมล
- แนวแก้: เพิ่ม `AND email_verified = 1` ในคิวรี (ให้ตรงกับ digest)

### 🟡 A1-13 · สถิติเปิดไพ่ติดต่อกัน (streak) นับก่อนหักสิทธิ์ — โดนปฏิเสธ/AI ล้มก็ยังได้ streak
- ที่: `src/lib/entitlement/entitlement.ts:372-375` (`recordDailyReading` ก่อนตรวจโควตา) · คืนสิทธิ์ที่ `refundReading` (`:471`) ไม่ลบแถว `daily_readings`
- ปัญหา: ผัง `daily` บันทึกวันลง `daily_readings` ทันทีที่เข้า `consumeReading` ไม่ว่าผลจะเป็น `denied` หรือถูก refund ภายหลัง
- ผลกระทบ/สถานการณ์พัง: สมาชิกที่โควตาวันนี้หมดกดเปิด "ไพ่ประจำวัน" ได้ 403 แต่ `EntitlementStatusCard` โชว์ streak +1 · AI ล่มแล้วคืนสิทธิ์ ผู้ใช้ก็ได้ streak ฟรี (ตัวเลขบนการ์ดไม่ตรงความจริง)
- แนวแก้: ย้าย `recordDailyReading` ไปหลังได้ `inserted`/`already`/`guest-allowed` เท่านั้น (หรือบันทึกตอนสตรีมจบสำเร็จ)
PROGRESS: [x] src/lib/{auth,security,entitlement,account,admin,users,api}
STATUS: DONE
