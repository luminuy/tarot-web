# A2-marketplace-money

> ผู้ตรวจ: A2 (Marketplace · จ่ายเงิน · จอง · ห้องวิดีโอ · Reader Studio) · ฐานโค้ด 47efdef · 2026-10-18

## ความคืบหน้า

## ข้อค้นพบ

### 🟠 A2-01 · ลบตั๋วคิวตาม PDPA 7 วัน (`cleanupExpiredTickets`) ไม่เคยถูกเรียกบน production — คำถาม/คำทำนาย/อีเมลลูกค้าค้างถาวร และลบบัญชีก็ไม่ลบตั๋ว
- ที่: `src/lib/marketplace/queue.repo.ts:448` (นิยามฟังก์ชัน) · ผู้เรียกมีแค่ `scripts/qa/test-marketplace-readers.ts:510` · `src/app/api/cron/booking-reminders/route.ts` (cron เดียวของระบบจองไม่เรียก) · `src/lib/privacy/user-data.ts:18-49` (ทะเบียนลบข้อมูลไม่มี `queue_tickets`/`bookings`)
- ปัญหา: ทั้ง migration 0019 ("ลบตามตั๋วคิว PDPA 7 วัน"), `docs/specs/MARKETPLACE.md:260`, แผน CONSULT_FLOW R7 ("ลบลิงก์หลังหมดอายุ 7 วัน (`cleanupExpiredTickets`)") และคอมเมนต์ `ticketExpiresAt` อ้างว่าตั๋วถูกลบ 7 วันหลังนัด แต่ `grep -rn cleanupExpiredTickets` ทั้ง repo (ไม่นับ node_modules) เจอแค่ตัวนิยาม + ด่านทดสอบ — ไม่มี route/cron/worker ไหนเรียก (`git log -G` ยืนยันว่าไม่เคยถูกต่อสายตั้งแต่นำเข้า) · ส่วน `DELETE /api/account` ลบผ่าน `eraseExtraUserData` ซึ่งไม่มีตาราง `queue_tickets` (มีคอลัมน์ `user_id` ตั้งแต่ 0021) และ `/api/account/export` ก็ไม่ส่งออกตั๋ว
- ผลกระทบ/สถานการณ์พัง: ทุกการจองตั้งแต่เปิดระบบ เก็บ `nickname` · `question` (อาจมีข้อมูลอ่อนไหว ม.26) · `reading_snapshot` · `ai_screening` · `bookings.contact_email` · `call_sessions` (SDP) · `reader_invites.label` ไว้ตลอดไป ขัดกับที่เอกสารและการออกแบบสัญญาไว้ · ผู้ใช้ที่กด "ลบบัญชีและข้อมูลทั้งหมด" ยังมีคำถามดูดวงกับแม่หมอค้างในฐานข้อมูล (และยังโผล่ในแผงแม่หมอ/ประวัติ) — ละเมิดสิทธิ์ขอลบตาม PDPA
- หลักฐาน: `grep -rn "cleanupExpiredTickets" --include=*.ts . | grep -v node_modules` ➔ 2 ไฟล์ (นิยาม + test) · `grep -n queue src/lib/privacy/user-data.ts` ➔ ไม่พบ
- แนวแก้: เรียก `cleanupExpiredTickets()` จาก `/api/cron/booking-reminders` (มี cron 15 นาทีอยู่แล้ว · ทำวันละครั้งพอ) **แต่ต้องแก้ A2-02 ก่อน** (ห้ามลบแถว `payments` ที่ `paid`/`refund_due=1` — ข้อมูลบัญชี/เงินคืนค้าง) — ให้ลบ/ล้างเฉพาะคอลัมน์ข้อมูลส่วนบุคคลของตั๋ว (`question`, `reading_snapshot`, `nickname`, `contact_email`) แล้วเก็บแถวการเงินไว้ · เพิ่ม source `marketplaceTickets` ใน `user-data.ts` (export + erase ตาม `user_id`) 
- ความมั่นใจ: ไล่โค้ดแล้ว (traced)

### 🟠 A2-02 · "ยอดต้องโอนให้แม่หมอ" เป็นยอดสะสมตลอดกาล ไม่หักยอดที่โอนไปแล้ว ไม่ดูงวด และนับเงินที่ค้างคืนลูกค้าเป็นรายได้แม่หมอ
- ที่: `src/lib/marketplace/payments.repo.ts:223-268` (`calculateReaderEarnings`) · ผู้ใช้: `src/app/api/admin/bookings/route.ts:28-30` · `src/app/api/admin/payouts/route.ts:19-33` · แสดงที่ `src/components/admin/BookingsAdmin.tsx:102,111,186-212`
- ปัญหา: คำนวณ `targetPeriod` (เดือนปัจจุบัน) แต่ SQL ไม่กรองเวลาเลย — `SUM(amount_satang) ... WHERE b.reader_id = ? AND p.status = 'paid'` ทุกแถวตั้งแต่เปิดระบบ · ไม่มีการบันทึกยอดที่โอนแล้ว (`recordReaderPayout` ไม่มีผู้เรียกนอกด่านทดสอบ) จึงไม่มีอะไรหักออก · แถวที่ `status='paid'` แต่ `refund_due=1` (ต้องคืนลูกค้าแต่คืนไม่สำเร็จ) ถูกนับเป็นรายได้แม่หมอด้วย · ป้ายบนจอเขียนว่า "ยอดต้องโอนให้แม่หมอ · หักส่วนแบ่งเว็บและเงินคืนแล้ว" และ API payouts ส่ง `period: "YYYY-MM"` ทำให้ดูเหมือนยอดของงวดนี้
- ผลกระทบ/สถานการณ์พัง: เดือนแรกแอดมินโอนตามตัวเลข ➔ เดือนที่สองตัวเลขยังรวมยอดเดือนแรกอยู่ ➔ โอนซ้ำ (เงินออกเกิน) · ลูกค้าที่ระบบคืนเงินล้มเหลว เงินก้อนนั้นถูกโอนให้แม่หมอไปด้วย แล้วแพลตฟอร์มยังต้องคืนลูกค้าอีกรอบ · และถ้าวันหน้าต่อสาย `cleanupExpiredTickets` (A2-01) ตามที่เป็นอยู่ แถว payments จะถูกลบหลัง 7 วัน ตัวเลขจะหดลงเหลือแค่สัปดาห์ล่าสุด (โอนขาด)
- หลักฐาน: อ่าน SQL บรรทัด 246-254 ไม่มีเงื่อนไขเวลา/`refund_due` · `grep -rn recordReaderPayout src` ➔ ไม่มีผู้เรียก
- แนวแก้: กรองตามงวด (`p.updated_at` ในช่วงเดือน เวลาไทย) + `AND p.refund_due = 0` + นับเฉพาะใบจองที่ `done`/`no_show`/ยกเลิกช้าไม่คืนเงิน · มีตาราง payouts อยู่แล้ว ให้ปุ่ม "บันทึกว่าโอนแล้ว" เขียน `recordReaderPayout` แล้วหักออก · ห้ามลบแถว payments ใน `cleanupExpiredTickets` (ล้างเฉพาะคอลัมน์ข้อมูลส่วนบุคคล)
- ความมั่นใจ: ไล่โค้ดแล้ว (traced)

