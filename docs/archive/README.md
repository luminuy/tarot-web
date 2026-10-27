# 🗄️ คลังเอกสารเก่า (Archive)

ของในโฟลเดอร์นี้คือ **บันทึก ณ วันนั้น** — ห้ามแก้เนื้อหาย้อนหลัง แก้ได้แค่ลิงก์ที่พัง
ใช้ค้นหาเคสเก่าด้วยการค้นคำ (`grep -rn "<คำ>" docs/archive/`) ไม่ต้องอ่านทั้งไฟล์

| โฟลเดอร์/ไฟล์ | มีอะไร | ย้ายมาอย่างไร |
|---|---|---|
| `work-log/WORK_LOG_YYYY-MM.md` | รอบงานเก่ากว่า 31 วันจาก [`docs/WORK_LOG.md`](../WORK_LOG.md) แยกรายเดือน | `npm run docs:archive` |
| `incidents/INCIDENT_LOG_YYYY-MM.md` | เหตุการณ์เก่ากว่า 31 วันจาก [`docs/INCIDENT_LOG.md`](../INCIDENT_LOG.md) แยกรายเดือน — เลข INC ในนี้ยังอ้างได้ (ด่าน `test-docs-numbers` อ่านรวม) | `npm run docs:archive` |
| `KNOWN_ISSUES_CLOSED.md` | บั๊กที่ปิดแล้วจาก [`docs/KNOWN_ISSUES.md`](../KNOWN_ISSUES.md) | ย้ายด้วยมือตอนปิดบั๊ก |

แผนที่เป็นประวัติล้วนอยู่อีกที่หนึ่ง: [`docs/plans/archive/`](../plans/archive/) (ไม่อยู่ในตารางแผนของ `npm run docs:index`)

บทเรียนจากทุกเหตุการณ์ (รวมที่ย้ายมาแล้ว) สรุปไว้ในหัวข้อ "กฎถาวรสรุป" ของ [`docs/INCIDENT_LOG.md`](../INCIDENT_LOG.md) — อ่านตรงนั้นก่อน
