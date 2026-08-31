# Claude Code Instructions

## ⚠️ อ่าน 2 ไฟล์นี้ก่อนแตะโค้ดทุกครั้ง (บังคับ)

1. **@docs/INCIDENT_LOG.md** — ความผิดพลาดทุกครั้งที่เคยเกิดขึ้นในโปรเจกต์นี้ พร้อมกฎป้องกันถาวร
   **การทำผิดซ้ำในสิ่งที่มีบันทึกอยู่แล้ว ถือเป็นความบกพร่องร้ายแรงที่สุด**
2. **@docs/KNOWN_ISSUES.md** — บั๊กที่ยืนยันแล้วว่ามีจริงแต่ยังไม่ได้แก้ (กันแก้ซ้ำซ้อนกับ Agent ตัวอื่น)

## 📜 กฎหลักของโปรเจกต์

อ่านคู่มือแม่บททั้งหมดใน:
@docs/AI_COLLABORATION_GUIDELINES.md

หัวข้อ **0. มาตรฐานการทำงานระดับวิศวกรมืออาชีพ** คือ "วิธีทำงาน" ที่บังคับใช้เสมอ
หัวข้อ 1-6 คือกฎเฉพาะของโปรเจกต์ (ดีไซน์ ความปลอดภัย การแบ่ง Domain)

ทุกการแก้ไขต้องเป็นไปตาม Golden Design Rules และ Safety Boundaries ในเอกสารนั้น

## 🛠️ ลำดับการทำงานมาตรฐาน

```bash
npm run agent:status                      # 1. เช็กว่าไม่ชนกับ Agent อื่น
npm run agent:lock -- --agent Claude ...  # 2. ล็อคไฟล์ที่จะแก้
npm run repo:verify                       # 3. ตรวจครบ 6 ด่าน
npm run commit -- --agent Claude ...      # 4. commit (type fix ต้องมี --cause และ --prevention)
npm run agent:unlock -- --agent Claude    # 5. ปลดล็อค
npm run log:sync                          # 6. ซิงก์ docs/WORK_LOG.md อัตโนมัติ
```

**commit ประเภท `fix` จะถูกบล็อกถ้าไม่ระบุ `--cause` และ `--prevention`**
เพราะทุกความผิดพลาดต้องถูกบันทึกลง `docs/INCIDENT_LOG.md` เพื่อไม่ให้ AI ตัวไหนทำผิดซ้ำอีก
