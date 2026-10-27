# 🔮 Marketplace แม่หมอตัวจริง — สเปกระบบ

> **สถานะ**: ใช้งานจริงบน production · M4–M7 ครบ + วิดีโอคอล (#644) · นัดล่วงหน้าและจ่ายก่อนคุย (#648) · ขั้นตอนปรึกษาแบบใหม่ (#666) · ต่อสายใหม่อัตโนมัติ (#703) · แก้ผลตรวจ 2026-10-18 (#706 · #710) · ปรึกษาฟรีสำหรับบัญชีที่ได้สิทธิ์ (#720) · **ตรวจกับโค้ดล่าสุด**: 2026-10-26
>
> เอกสารนี้บอก "ระบบตอนนี้เป็นอย่างไร" (ไฟล์ · ตาราง · กติกา · กับดัก) · ประวัติการสร้างทีละขั้นดู `git log` และ [`WORK_LOG.md`](../WORK_LOG.md)
> Reader Studio (เครื่องมือจดลูกค้า/ร่างคำอ่านของแม่หมอ · `/readers/studio`) เป็นอีกระบบ อยู่ในแผน [`REFLECTION_JOURNAL_PLAN_2026-10-05.md`](../plans/REFLECTION_JOURNAL_PLAN_2026-10-05.md) หัวข้อ 1.13 — ปิดไว้ด้วย `READER_STUDIO_ENABLED` รอทนายรับรองร่างใน [`docs/legal/`](../legal/)

---

## 0. อ่านก่อนแตะโค้ด

| ไฟล์ | อ่านเพื่อ |
| :-- | :-- |
| [`CLAUDE.md`](../../CLAUDE.md) | กฎเหล็ก + วิธีเปิด PR (ที่เดียวที่เป็นทางการ — ไม่คัดลอกมาไว้ที่นี่) |
| [`INCIDENT_LOG.md`](../INCIDENT_LOG.md) · [`KNOWN_ISSUES.md`](../KNOWN_ISSUES.md) | บทเรียนเก่า + บั๊กที่ยังเปิด |
| [`CONSULT_FLOW_UX_PLAN_2026-10-11.md`](../plans/CONSULT_FLOW_UX_PLAN_2026-10-11.md) | หลักออกแบบหน้าจอง/คิว/แผงแม่หมอ 7 ข้อ (หัวข้อ 2) + กับดัก (หัวข้อ 7) |
| [`ADR-001`](../adr/ADR-001-marketplace-pdpa.md) | การตัดสินใจเรื่อง PDPA ตอนเริ่มเฟสนี้ (บางข้อเปลี่ยนแล้ว — ดูหัวสถานะของไฟล์) |
| [`ADMIN_PANEL.md`](../ADMIN_PANEL.md) | แผงแอดมินที่ใช้จัดการแม่หมอ การจอง และการเงิน |
| [`PENDING_SETUP.md`](../PENDING_SETUP.md) | ค่าลับที่ระบบนี้ใช้ (Stripe · TURN) และอาการเมื่อยังไม่ตั้ง |

---

## 1. ภาพรวม + การตัดสินใจที่เจ้าของเคาะแล้ว

ลูกค้าจองแม่หมอที่เป็นคนจริง → AI คัดกรองคำถามและสรุปบรีฟให้แม่หมอ → จ่ายเงินก่อนเสมอ → คุยทางวิดีโอคอลในเว็บ (LINE เป็นทางสำรอง)

| หัวข้อ | ค่าที่ใช้อยู่ |
| :-- | :-- |
| รูปแบบคิว | ทั้งคิวสด (walk-up) และนัดเวลาล่วงหน้า |
| ช่องทางคุย | วิดีโอคอลตัวต่อตัวในเว็บ + LINE เป็นทางสำรอง (เคาะ 2026-10-02 · เดิมส่งต่อ LINE อย่างเดียว) |
| การจ่ายเงิน | Stripe Checkout · จ่ายก่อนคุยทุกครั้ง (คิวสดด้วย) · ราคาคิดฝั่งเซิร์ฟเวอร์เท่านั้น |
| ราคา | ค่ากลาง 299 บาท / 30 นาที (`CONSULTATION_PRICE_THB` · `CONSULTATION_MINUTES` ใน `offer.ts`) · แอดมินตั้งรายแม่หมอได้ 99–5,000 บาท (`readers.price_thb`) |
| ส่วนแบ่ง | ค่าคอมมิชชันแพลตฟอร์มต่อแม่หมอ `readers.commission_pct` (ค่าเริ่มต้น 20%) |
| ที่เก็บข้อมูล | D1 `APP_DB` (ตารางทั้งหมดของระบบนี้) · KV `APP_KV` เฉพาะตัวนับ/ค่าตั้ง |
| ปรึกษาฟรี | บัญชีในรายชื่อ `FREE_CONSULT_EMAILS` (`free-consult.ts` · ตอนนี้ `seerada.tarot@gmail.com`) ที่ยืนยันอีเมลแล้ว จองได้โดยไม่ผ่านหน้าจ่ายเงิน — บันทึก `payments` ยอด 0 `provider = comp` · ไม่นับเป็นยอดขายหรือรายได้แม่หมอ · แยกจาก `UNLIMITED_EMAILS` (บัญชี VIP ข้ามแค่ค่า AI) · เพิ่ม/ถอดอีเมลต้องแก้โค้ดผ่าน PR (เคาะ 2026-10-25) |

---

## 2. แผนที่โค้ด

| ชั้น | ที่อยู่ |
| :-- | :-- |
| หน้าเว็บ (Next · ไม่ใช่ Astro) | `src/app/(th)/readers/` — `(directory)` รายชื่อ · `[id]` โปรไฟล์ · `[id]/book` หน้าจองเต็มจอ · `queue/[id]` ห้องรอ/ห้องวิดีโอของลูกค้า · `console` แผงแม่หมอ · `room/[code]` ลิงก์ห้องส่วนตัว · `bookings` นัดของฉัน · `studio` Reader Studio · `sitemap.ts` sitemap โปรไฟล์แม่หมอ |
| คอมโพเนนต์ | `src/components/marketplace/` — `BookingFlow` · `SlotPicker` · `ReaderDetailClient` · `QueueBookingParts` · `ConsoleBookingParts` · `PrivateRoomCard` · `VideoCallRoom` · `WaitlistForm` · `ConsultStage` |
| API ลูกค้า/แม่หมอ | `src/app/api/marketplace/` — `tickets` (จอง + เปิดหน้าจ่าย) · `tickets/[id]` (+ `access` · `review`) · `payments` (จ่ายต่อ) · `payments/confirm` · `payments/webhook` · `calls/[ticketId]` · `console/{queue,schedule,settings,invites}` · `readers/[id]/{slots,waitlist}` · `readers/featured` · `my-bookings` · `studio/**` |
| API แอดมิน | `src/app/api/admin/{readers,readers/[id],bookings,payments,studio-pass}` + `src/components/admin/{ReadersManager,BookingsAdmin,PaymentsPanel}.tsx` |
| งานรอบ | `src/app/api/cron/booking-reminders` — ทุก 15 นาทีผ่าน `.github/workflows/booking-reminders.yml` (cron ของ GitHub ไม่ตรงเวลา ปลายทางจึงไม่พึ่งการรันตรงเวลา) |
| ตรรกะ | `src/lib/marketplace/` — ดูตารางแต่ละหัวข้อด้านล่าง · ยืนยันตัวแม่หมอ `src/lib/auth/reader-auth.ts` (HMAC เซ็นด้วย `readers.session_secret`) · คัดกรองความปลอดภัย `src/lib/safety/guardrails.ts` |
| ฐานข้อมูล | `migrations/0001` readers · admin_audit · `0002` reader_availability · ai_screening · queue_tickets · bookings · `0003` payments · payouts · `0015` payments (เจ้าของรายการ) · `0019` call_sessions · `0020` นัดล่วงหน้า · `0021` reader_blocked_dates · reader_reviews · booking_waitlist · `0029` ยินยอมข้อมูลอ่อนไหว · `0030` lead_min · `0031` last_seen_at · `0032` reader_invites · `0035` pii_cleared_at + index · Reader Studio `0027` |
| ฐานในเครื่อง | `src/lib/platform/db.ts` สร้างฐาน SQLite จาก `migrations/` เอง (ห้ามเขียนสคีมาซ้ำในโค้ด — ด่าน `test-code-debt` ข้อ 14) |

---

## 3. คิวสด + AI คัดกรอง

| เรื่อง | ไฟล์ / กติกา |
| :-- | :-- |
| ตั๋วคิว | `queue.repo.ts` — สถานะ `pending_payment` ➔ `waiting` ➔ `ready` ➔ `handed_off` (หรือ `cancelled` / `expired`) · ตั๋วเข้าคิวเมื่อจ่ายเงินแล้วเท่านั้น |
| คิวสด "เปิดจริง" | สวิตช์เปิด + เห็นแผงแม่หมอภายใน 15 นาที (`LIVE_PRESENCE_TIMEOUT_MINUTES` · `reader_availability.last_seen_at`) |
| AI คัดกรอง | `screening.ts` — ด่าน 1 `checkQuestion()` บล็อกสัญญาณทำร้ายตัวเอง + สายด่วน 1323 · ด่าน 2 แยกหมวด (ความรัก · งาน · เงิน · ตัวเอง · ทั่วไป) · ด่าน 3 บรีฟสั้นให้แม่หมอ + ผังที่แนะนำ |
| ลำดับด่านตอนจอง | `POST /api/marketplace/tickets`: รูปแบบข้อมูล ➔ แม่หมอ ➔ เปิดรับ/เวลาว่างจริง ➔ โควตาต่อลูกค้า ➔ ระบบจ่ายเงินพร้อม ➔ AI คัดกรอง (เสียเงิน ทำหลังสุด) ➔ กันที่ ➔ หน้าจ่าย Stripe |
| เพดานต่อลูกค้า | ถือคิว/นัดที่ยังไม่จบได้พร้อมกัน 3 ใบ (`MAX_ACTIVE_PER_CUSTOMER`) |
| ห้องรอลูกค้า | `/readers/queue/[id]` ถามสถานะทุก 4 วินาทีเมื่อแท็บมองเห็น · ลิงก์ LINE ของแม่หมอโผล่เมื่อถึงคิว (`ready` / `handed_off`) เท่านั้น |
| ความเป็นเจ้าของตั๋ว | `ticket-owner.ts` (`isTicketOwner`: คุกกี้ `tarot_customer_ref` หรือ `user_id` ของบัญชี) — ห้ามเทียบ `customerRef` เองที่อื่น · `customerRef` อ่านจากคุกกี้ที่เซ็นเองเท่านั้น ห้ามรับจาก query/body (`customer-ref.ts`) |

---

## 4. 📹 วิดีโอคอลตัวต่อตัว (เคาะ 2026-10-02)

| หัวข้อ | ค่าที่เคาะ | เหตุผล |
| :-- | :-- | :-- |
| ผู้ให้บริการ | **Cloudflare Realtime TURN** (ไม่ใช้ SFU / RealtimeKit) | ฟรี 1,000 GB/เดือน · RealtimeKit ไม่มีโควตาฟรี |
| เส้นทางภาพ | WebRTC แบบ P2P แต่ **บังคับผ่าน TURN ทุกสาย** (`iceTransportPolicy: "relay"`) | ลูกค้า↔แม่หมอเป็นคนแปลกหน้า — **ห้ามเห็น IP ของกันและกัน** |
| คุณภาพ | ล็อก **720p** · เพดาน 1.5 Mbps | ตัวต่อตัว ~1.35 GB/ชม. ➔ 50 คน × 1.5 ชม. ≈ 100 GB/เดือน (~10% ของโควตาฟรี) |
| นัดเชื่อมสาย | D1 `call_sessions` (migrations/0019) + ถามสถานะเป็นระยะ ไม่ใช้ WebSocket | ICE แบบไม่ trickle = เขียน 2 ครั้งต่อการต่อสาย |
| บันทึก | **ไม่บันทึกภาพ เสียง หรือบทสนทนา** · ล้าง SDP ทันทีที่วางสาย · ลบแถวพร้อมตั๋ว | PDPA |
| ต่อสายใหม่อัตโนมัติ | `call-recovery.ts` — ฝั่งลูกค้าสั่งต่อใหม่ฝั่งเดียว · รอ ICE ฟื้น 5 วิ · เว้น 10/20/30 วิ แล้วหยุดให้คนกดเอง (เจ้าของสั่ง 2026-10-19) | เน็ตสะดุดแล้วลูกค้าไม่กดต่อใหม่เอง |
| สถิติสาย | `call-metrics.ts` ➔ Analytics Engine (binding `CALL_METRICS` · dataset `seertarot_calls`) · ดูด้วย `npm run cf:call-stats` | วัดว่าการต่อสายใหม่ได้ผลไหม · ไม่มีชื่อ/อีเมล/IP |

**ไฟล์**: `turn.ts` (ออก/เพิกถอนรหัสผ่าน TURN อายุ 3 ชม.) · `call.repo.ts` (ห้อง + `sanitizeRelaySdp`) · `src/app/api/marketplace/calls/[ticketId]/route.ts` · `VideoCallRoom.tsx` (ใช้ทั้ง `/readers/queue/[id]` และ `/readers/console`) · `beauty-filter.ts` (ฟิลเตอร์หน้าแม่หมอ ทำในเครื่องแม่หมอ)

**กับดักที่ห้ามพลาด**
- ทั้งเว็บปิดกล้อง/ไมค์ (`Permissions-Policy: camera=()`) — เปิด `camera=(self)` **เฉพาะสองหน้านี้** ผ่าน `CALL_PAGE_SOURCES` ใน `src/lib/config/security-headers.ts` (Next ให้ค่าที่ประกาศทีหลังชนะ)
- เซิร์ฟเวอร์ล้าง SDP ซ้ำ: ตัด candidate ที่ไม่ใช่ `typ relay` + แทน `raddr` เป็น `0.0.0.0` — ไคลเอนต์ที่ถูกดัดแปลงส่ง IP จริงข้ามฝั่งไม่ได้
- ยังไม่ตั้ง `CLOUDFLARE_TURN_KEY_ID` / `CLOUDFLARE_TURN_KEY_API_TOKEN` = ปุ่มวิดีโอไม่โผล่ ลูกค้าคุยผ่าน LINE ได้ตามเดิม (ดู [`PENDING_SETUP.md`](../PENDING_SETUP.md))
- ด่านตรวจ: `test-marketplace-readers` ข้อ 16.x

---

## 5. 📅 นัดเวลาล่วงหน้า + จ่ายก่อนคุย (เคาะ 2026-10-03)

| หัวข้อ | ค่าที่เคาะ |
| :-- | :-- |
| ตารางรับนัด | แม่หมอตั้งรายสัปดาห์ในแผงแม่หมอ (`reader_availability.mode = 'scheduled'`) · ช่องละ 30 นาที · จองล่วงหน้าอย่างน้อยตาม `readers.lead_min` (ค่าเริ่มต้น 2 ชม.) · ไกลสุด 14 วัน · เวลาไทย |
| จ่ายเงิน | ทุกการปรึกษาจ่ายก่อน (คิวสดด้วย) ผ่าน Stripe Checkout · ราคาจากเซิร์ฟเวอร์เท่านั้น |
| กันที่ | 36 นาที (`HOLD_MINUTES`) · หน้าจ่ายหมดอายุ 31 นาที (`CHECKOUT_EXPIRES_MINUTES` — หน้าจ่ายต้องหมดก่อนที่นั่งเสมอ) |
| กันจองซ้อน | unique index `idx_bookings_slot_active` (reader_id, slot_start) เฉพาะ `kind='scheduled'` และสถานะ `reserved/confirmed` |
| ยกเลิก/คืนเงิน | ก่อนนัด ≥ 24 ชม. คืนเต็ม · < 24 ชม. ไม่คืน · แม่หมอยกเลิก/ไม่เริ่มนัดภายใน 15 นาที คืนเต็ม · คิวสดระหว่างรอ คืนเต็ม · เลื่อนได้ 1 ครั้ง (≥ 24 ชม.) · **ภายใน 10 นาทีหลังจ่าย (นัดห่าง ≥ 1 ชม.) ยกเลิกคืนเต็ม/เลื่อนได้** (เคาะ 2026-10-12 · `PAID_GRACE_MINUTES`) |
| ลูกค้าไม่มา (`no_show`) | แม่หมอแจ้งได้เมื่อมีหลักฐานจากห้องวิดีโอฝั่งเซิร์ฟเวอร์เท่านั้น: เลยเวลานัด 15 นาที · แม่หมอเริ่มนัดแล้ว · แม่หมออยู่ในห้องรอครบ 15 นาทีและลูกค้าไม่เคยเข้า (`customerMissedRoom`) · ไม่คืนเงิน · กลับด้านกัน (แม่หมอเริ่มนัดแต่ไม่เข้าห้อง ลูกค้ารอครบเวลา) = ลูกค้ายกเลิกได้เงินคืนเต็ม (`readerMissedRoom`) และงานรอบปิดนัดให้เอง |

**ไฟล์**: `booking-policy.ts` (กติกา — ไม่มี I/O ใช้ร่วมหน้าเว็บ/API) · `booking.repo.ts` (วงจรใบจอง + `settleConsultationPayment` จุดเดียวที่เปลี่ยนเงินเข้าเป็นนัด) · `consultation-checkout.ts` · `SlotPicker.tsx` · `BookingFlow.tsx` (หน้าจองเต็มจอ `/readers/[id]/book` — แทน `BookQueueModal` ที่ถอดแล้ว 2026-10-11) · `QueueBookingParts.tsx` · `ConsoleBookingParts.tsx` · migrations/0020

**กับดักที่ห้ามพลาด**
- ห้ามยืนยันนัดที่อื่นนอก `settleConsultationPayment` (เดิม `updatePaymentStatus` ตั้ง bookings = 'paid' เองโดยไม่ดูว่าที่ว่างไหม — ถอดแล้ว)
- อายุตั๋ว (PDPA) นับจากเวลานัด ไม่ใช่วันสร้าง (`ticketExpiresAt`) — นัดไกล 14 วัน ถ้านับจากวันสร้างตั๋วจะถูกลบก่อนถึงวันนัด
- เวลาที่ไคลเอนต์ส่งมาไม่เชื่อ: `slotRejection` ตรวจกับตารางจริงทุกครั้ง แล้ว unique index เป็นด่านสุดท้าย
- ด่านตรวจ: `test-marketplace-readers` ข้อ 17.x

---

## 6. 💌 ดูแลลูกค้าครบวงจร (2026-10-03)

| เรื่อง | ไฟล์ / กติกา |
| :-- | :-- |
| อีเมลทุกชนิด | `booking-mail.ts` — never throw · ส่งครั้งเดียว (`bookings.confirm_email_at` · `reminder_24h_at` · `reminder_1h_at`) |
| ลิงก์เปิดนัดทุกเครื่อง | `/api/marketplace/tickets/[id]/access?k=` · `signBookingAccess` / `verifyBookingAccess` |
| วันหยุด · พัก · เพดานต่อวัน | `reader_blocked_dates` · `readers.buffer_min` · `readers.daily_cap` ➔ `generateSlots(..., SlotOptions)` · ด่านเซิร์ฟเวอร์ `checkSlotBookable` |
| ราคาต่อแม่หมอ | `readers.price_thb` · `readerPriceThb()` ใน `offer.ts` (ทั้งหน้าเว็บและตอนเรียกเก็บ) |
| รีวิว | `reviews.repo.ts` · ตาราง `reader_reviews` · `POST /api/marketplace/tickets/[id]/review` — `handed_off` + จ่ายแล้ว + UNIQUE(ticket_id) · ห้ามมีทางเขียนรีวิวจากที่อื่น (ไม่มีรีวิวตั้งต้น/จากแอดมิน) · แอดมินซ่อนได้ แก้ไม่ได้ · คะแนนรวมแคช 5 นาที |
| รอคิวว่าง | `booking_waitlist` · `POST /api/marketplace/readers/[id]/waitlist` · งานรอบแจ้งครั้งเดียวแล้วลบ |
| แอดมิน | `/api/admin/bookings` + `BookingsAdmin.tsx` (แท็บ "การจอง & การเงิน") |

**กับดัก**: เวลาพัก/เพดานต่อวันเป็น "ความสะดวก" — สองคนจองช่องติดกันพร้อมกันเป๊ะอาจหลุดได้ ส่วนการจองเวลาเดียวกันซ้อน unique index กันไว้แล้ว ·
อย่าใส่คำถามลูกค้าลงอีเมลแม่หมอ (อีเมลไม่ใช่ช่องทางที่ล็อกอิน) · ด่าน `test-marketplace-readers` 18.x

---

## 7. 🛎️ ขั้นตอนปรึกษาแม่หมอแบบใหม่ (2026-10-11 · แผน [`CONSULT_FLOW_UX_PLAN_2026-10-11.md`](../plans/CONSULT_FLOW_UX_PLAN_2026-10-11.md))

ที่มา: ลูกค้าจริงเปิดลิงก์แม่หมอในแอป LINE แล้วจองไม่ได้ ("เข้าไม่ได้ค่ะ · ทำไมยากจัง · มันเลือกเวลาอื่นอ่ะ")

| เรื่อง | ไฟล์ / กติกา |
| :-- | :-- |
| หน้าจองเต็มจอ | `/readers/[id]/book` (noindex) · `BookingFlow.tsx` — ขั้น "เวลา ➔ ชื่อและคำถาม" · ย้อนกลับ = ถอยขั้น · ปุ่มชำระเงินกดได้เสมอ ขาดอะไรพาไปช่องนั้น |
| เลือกเวลา | `SlotPicker.tsx` — เวลาว่างเร็วที่สุด 3 ช่อง · แถววันแบ่งหน้า (ไม่เลื่อนแนวนอน) · วันที่แตะล่าสุดชนะเสมอ (`resolveVisibleDay`) |
| รับนัดล่วงหน้าอย่างน้อย | `readers.lead_min` (migrations/0030) · ตัวเลือก `LEAD_OPTIONS_MIN` · ค่าเริ่มต้น 2 ชม. · `generateSlots` และ `slotRejection` ใช้ค่าเดียวกัน |
| ลิงก์นัดส่วนตัว | `accessUrl` ใน `GET /api/marketplace/tickets/[id]` — **เจ้าของตั๋วเท่านั้น** (แม่หมอ = null) |
| เบราว์เซอร์ในแอป | `in-app-browser.ts` — LINE ใช้ `openExternalBrowser=1` · แอปอื่นบอกวิธีเปิดเอง + คัดลอกลิงก์ |
| แผงแม่หมอ | การ์ด "ส่งลิงก์ให้ลูกค้า" บอกว่าลูกค้าที่เปิดตอนนี้จะคุยได้เลย/ได้แค่นัด/จองไม่ได้ · เตือนก่อนลิงก์แผงหมดอายุ 3 ชม. · หมดกลางคิวไม่ล้างหน้า · ค่าจาก AI เป็นคำไทย |
| ห้องวิดีโอ | จัดจอ 3 แบบ (เห็นเท่ากัน · ภาพฉันใหญ่ · อีกฝั่งใหญ่) · `object-contain` · แม่หมอเริ่มไม่กลับด้าน · สลับกล้องด้วย `replaceTrack` |
| แอดมิน "หมอดูพาร์ทเนอร์" | `ReadersManager.tsx` — สถานะงานของแม่หมอแต่ละคน · ส่งลิงก์แผงพร้อมเวลาหมดอายุ · พักงาน/ลบต้องยืนยันในหน้า · API ไม่ส่ง `sessionSecret` (`toAdminReader`) |
| ลิงก์แผงแม่หมอ | อายุ 1 · 7 · 30 วัน (`console-link.ts` · ค่าเริ่มต้น 30) · "ยกเลิกลิงก์เก่าทั้งหมด" = หมุน `session_secret` (`POST /api/admin/readers/[id]` `revoke_links`) |
| ฟิลเตอร์หน้าสวย (แม่หมอ) | `beauty-filter.ts` — WebGL ในเครื่องแม่หมอ เกลี่ยเฉพาะผิวแบบรักษาขอบ · ส่งภาพที่แต่งแล้วด้วย `replaceTrack` · ไม่บันทึก/ไม่ส่งภาพไปประมวลผลที่ไหน |
| แถบคุกกี้ในกลุ่ม /readers | แถบย่อใต้หัวเว็บ (`ConsentBanner` `COMPACT_PATH`) — ไม่บังปุ่มจอง/ชำระเงินที่ขอบล่าง |
| ห้องคุยส่วนตัว (ลิงก์แบบห้องประชุมออนไลน์) | `reader_invites` (migrations/0032) · `invites.repo.ts` — แม่หมอสร้างลิงก์ `/readers/room/<code>` ให้ลูกค้าคนเดียว (24 ชม. · ยกเลิกได้ · เพดาน 10 ลิงก์ที่ยังไม่มีใครใช้) · **จ่ายบนเว็บก่อนเข้าห้องเสมอ** (เจ้าของเคาะ 2026-10-12) ผ่าน `POST /api/marketplace/tickets` + `inviteCode` ซึ่งข้ามแค่สวิตช์คิวสดกับคำถามขั้นต่ำ · การ์ด `PrivateRoomCard` ในแผง + ปุ่ม "รับเข้าห้อง" (เรียกคิว + เปิดห้องวิดีโอ) · จัดการลิงก์ที่ `POST/PATCH /api/marketplace/console/invites` |

**กับดัก**: ห้ามเชื่อเวลา `?slot=` จากไคลเอนต์ (ตรวจด้วย `checkSlotBookable` เสมอ) · ห้ามส่ง `accessUrl` / `customerRef` ให้แม่หมอ · ห้ามให้ `sessionSecret` ออกนอกเซิร์ฟเวอร์ ·
ลิงก์ห้องส่วนตัวห้ามข้ามการจ่ายเงิน/โควตา/AI คัดกรอง (ข้ามได้แค่สวิตช์คิวสด) และรหัสห้องไม่ใช่ตัวตนลูกค้า ·
ด่าน `test-marketplace-readers` 19.x

---

## 8. 💳 เงิน — จ่าย · คืนเงิน · โอนให้แม่หมอ

| เรื่อง | ไฟล์ / กติกา |
| :-- | :-- |
| เกตเวย์ | `payment-gateway.ts` — **Stripe Checkout** (บัตร · PromptPay · ช่องทางที่เปิดในแดชบอร์ด Stripe) · เว็บไม่เก็บข้อมูลบัตร · ไม่ตั้ง `STRIPE_SECRET_KEY` = ตัวจำลอง (`provider = simulator`) ผ่านด่านยืนยันได้เฉพาะนอก production |
| หลักฐานการจ่าย | มีสองทางเท่านั้น: webhook ที่ลายเซ็น `Stripe-Signature` ผ่าน (`STRIPE_WEBHOOK_SECRET`) หรือเซิร์ฟเวอร์ถาม Stripe เองด้วยคีย์ลับ · `POST /api/marketplace/payments/confirm` (ลูกค้ากลับมาพร้อม `?paid=1`) **ไม่ใช่หลักฐาน** — ยอด · สกุลเงิน · เลขตั๋วต้องตรงแถวของเราทุกตัว |
| จ่ายต่อ | `POST /api/marketplace/payments` — หน้าจ่ายเดิมยังเปิด = ส่งลิงก์เดิม · หมดอายุแต่ยังกันที่ = เปิดใบใหม่ (ไม่เกิน 3 ครั้งต่อการจอง) · ที่นั่งหลุด = 409 |
| จ่ายซ้ำ/จ่ายหลังที่หลุด | `settleConsultationPayment` คืนเงินอัตโนมัติ ไม่ยืนยันนัดซ้อน · คืนเงินรายการที่ซ้ำไม่ยกเลิกนัดของรายการที่จ่ายถูกต้อง |
| คืนเงินจากแดชบอร์ด Stripe | `refund-sync.ts` (event `charge.refunded`) — นัด/คิวที่ยังไม่จบถูกยกเลิก (`cancelled_by = system`) + อีเมลแจ้งลูกค้า · คืนบางส่วนไม่ถอนอัตโนมัติ |
| ปรึกษาฟรี | `confirmComplimentaryConsultation()` — `payments` ยอด 0 `provider = comp` (`COMP_PROVIDER`) แล้วยืนยันผ่าน `settleConsultationPayment` จุดเดียวกับเงินจริง · ยกเลิกไม่ยิง Stripe · ด่านโควตา/AI คัดกรอง/กันที่ยังตรวจครบ |
| ยอดโอนแม่หมอรายงวด | `calculateReaderEarnings` / `settleReaderPayout` ใน `payments.repo.ts` · งวด = เดือนตามเวลาไทย (`YYYY-MM`) ตาม**เวลานัด** · นับเฉพาะ `paid` ที่ไม่ค้างคืน + ใบจอง `done` · `no_show` · ลูกค้ายกเลิกช้าแบบไม่คืนเงิน · หักค่าคอมมิชชัน แล้วหักยอดที่บันทึกโอนแล้วในงวดเดียวกัน (กดซ้ำไม่โอนซ้ำ) · แอดมินกด `record_payout` ที่ `POST /api/admin/bookings` — ยอดคำนวณฝั่งเซิร์ฟเวอร์ ไม่รับตัวเลขเงินจากหน้าเว็บ (แก้ผลตรวจ 2026-10-18 · #710) |
| เส้นที่ถอดแล้ว | `/api/admin/payouts` และ `/api/readers` (ลบใน #706 · ไม่มีผู้เรียก) |

---

## 9. 🔒 ข้อมูลส่วนบุคคล (PDPA)

| เรื่อง | ของจริงตอนนี้ |
| :-- | :-- |
| ข้อมูลที่ส่งให้แม่หมอ | ชื่อเล่น · คำถาม · ไพ่/คำทำนายที่แนบ (ถ้ามี) · บรีฟจาก AI — เฉพาะแม่หมอที่ลูกค้าเลือก · ช่องยินยอมข้อมูลอ่อนไหวแยก ไม่บังคับ (`sensitive_consent_at` · migrations/0029) |
| ข้อมูลที่ไม่ออกหน้าสาธารณะ | อีเมลแจ้งเตือนแม่หมอ (`notify_email`) · LINE ของแม่หมอ (โผล่เมื่อถึงคิว) · `session_secret` · `customerRef` |
| อายุตั๋ว | `ticketExpiresAt` = 7 วันหลังสร้างหรือหลังเวลานัด (อันที่ช้ากว่า) · งานรอบ `cleanupExpiredTickets()` ใน `booking-reminders` |
| ตั๋วที่ไม่มีเงินผ่านมือ | ลบทั้งแถวพร้อมข้อมูลที่ผูกอยู่ |
| ตั๋วที่มีเงินผ่านมือ | เก็บแถว `queue_tickets` / `bookings` / `payments` เป็นหลักฐานบัญชีและยอดโอนแม่หมอ แต่ล้างชื่อเล่น · คำถาม · ไพ่ · ผลคัดกรอง AI · ห้องวิดีโอ · อีเมลติดต่อ แล้วประทับ `pii_cleared_at` · ตั๋วที่ยังค้างคืนเงิน รอเรื่องเงินปิดก่อน |
| วิดีโอคอล | ไม่บันทึกภาพ/เสียง/บทสนทนา · SDP ล้างเมื่อวางสาย |
| นโยบายที่ผู้ใช้เห็น | `src/app/_shared/pages/privacy-th.tsx` (+ `privacy-en.tsx`) แสดงที่ `/privacy` · `/en/privacy` — มีหัวข้อวิดีโอคอลและการจองแม่หมอแล้ว |

---

## 10. วิธีตรวจ

- ด่านหลักของระบบนี้: `npx tsx scripts/qa/test-marketplace-readers.ts` (ข้อ 16 วิดีโอ · 17 นัด/จ่าย · 18 ดูแลลูกค้า · 19 ขั้นตอนใหม่/ห้องส่วนตัว · 20 ปรึกษาฟรี) · Reader Studio `test-reader-studio`
- ก่อนเปิด PR: `npm run repo:verify` (ครบทุกด่าน) + `npm run typecheck`
- ของที่ด่านในเครื่องตรวจไม่ได้: จ่ายเงินจริง + วิดีโอจริงบนมือถือสองเครื่อง (รอบตรวจใช้ตัวจำลอง) — แผน CONSULT_FLOW แนะนำให้ลองห้องส่วนตัวจริง 1 ครั้ง

---

## 11. ประวัติ (ย่อ)

| ช่วง | สิ่งที่ลง |
| :-- | :-- |
| 2026-09-01 | Phase 1 แผงแอดมิน (M0–M3) · Phase 2 เริ่ม: M4 D1 + โปรไฟล์แม่หมอ · M5 คิวสด + แผงแม่หมอ · M6 AI คัดกรอง · M7 การจ่ายเงิน (เดิมเป็น Omise) |
| 2026-10-02 | เปลี่ยนเกตเวย์ Omise ➔ Stripe Checkout (#640) · วิดีโอคอลผ่าน TURN (#644) |
| 2026-10-03 | นัดล่วงหน้า · จ่ายก่อนคุย · อีเมล · รีวิว · waitlist (#648) · คืนเงินจากแดชบอร์ด Stripe (#649) |
| 2026-10-11 – 2026-10-12 | ขั้นตอนปรึกษาแบบใหม่ · ห้องคุยส่วนตัว · ผ่อนผัน 10 นาที · ลิงก์แผงอายุยาว (#666) |
| 2026-10-19 | ต่อสายใหม่อัตโนมัติ + สถิติสายบน Analytics Engine (#703) |
| 2026-10-20 – 2026-10-21 | แก้ผลตรวจใหญ่: ยอดโอนรายงวด · หลักฐานลูกค้าไม่มา · ลบตั๋วตาม PDPA · index (#706 · #710) |
| 2026-10-25 | ปรึกษาฟรีสำหรับบัญชีที่ได้สิทธิ์ (#720) |
