-- migrations/0036_push_morning_target.sql
-- เตือนตอนเช้าให้เปิดอะไร (NATAL_CHART_PLAN รอบ 10 · เจ้าของสั่ง "ทำเลยทุกข้อ" 2026-10-28)
--   'daily' = พิธีเช้า /daily (ค่าเดิมของทุกแถว) · 'natal' = ดวงวันนี้จากผังเกิด /natal-chart#today
-- เซิร์ฟเวอร์ไม่รู้ผังเกิดของใคร: ข้อความเตือนเป็นข้อความกลาง ผังคำนวณในเครื่องผู้ใช้ตอนแตะเปิด
-- ต้องตรงกับ src/lib/push/push.repo.ts
ALTER TABLE push_subscriptions ADD COLUMN morning_target TEXT NOT NULL DEFAULT 'daily';
