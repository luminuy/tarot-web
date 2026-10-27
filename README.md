# SeerTarot

เว็บดูดวงไพ่ทาโรต์ออนไลน์ภาษาไทย–อังกฤษ ใช้ภาพไพ่ Rider-Waite-Smith ฉบับ 1909 · ผู้ใช้สับและเลือกไพ่เอง ตรวจย้อนหลังได้ว่าไม่มีใครเลือกไพ่ให้ (Provably Fair) · แม่หมอ AI อ่านไพ่ใบที่ออกจริงให้แบบสตรีม

**เว็บจริง: [seertarot.net](https://seertarot.net)** (ภาษาอังกฤษที่ [`/en`](https://seertarot.net/en))

[![License](https://img.shields.io/badge/License-PolyForm%20Noncommercial%201.0.0-lightgrey)](LICENSE)

## มีอะไรบ้าง

| ส่วน | สรุป | อ่านต่อ |
| :--- | :--- | :--- |
| สำรับ 78 ใบ | ภาพ 1909 ต้นฉบับ · ความหมาย 5 หมวด (ทั่วไป · ความรัก · การงาน · การเงิน · ตัวเอง) ทั้งหัวตั้งและกลับหัว ไทยและอังกฤษ | [TAROT_CARD_FEATURES](docs/TAROT_CARD_FEATURES.md) |
| ผังพยากรณ์ | 26 ผัง (136 ตำแหน่ง) แบ่ง 6 หมวดในหน้า `/spreads` | [TAROT_CARD_FEATURES](docs/TAROT_CARD_FEATURES.md#4-ผังพยากรณ์-26-ผัง) |
| สับไพ่แบบตรวจได้ | เซิร์ฟเวอร์ผูกคำมั่น SHA-256 ก่อนผู้ใช้แตะไพ่ แล้วเฉลยเมล็ดหลังอ่านจบ เบราว์เซอร์คำนวณซ้ำเองได้ · AI ไม่เคยเป็นคนจั่วไพ่ | [ARCHITECTURE](docs/ARCHITECTURE.md#4-provably-fair--การสับไพ่ที่ตรวจได้) |
| แม่หมอ AI | 5 บุคลิก (2 บุคลิกสำหรับผู้มีสิทธิ์พิเศษ) · สตรีมผ่าน SSE · ลำดับผู้ให้บริการ Groq ➔ Gemini ➔ OpenRouter (โมเดลฟรี) ➔ คำอ่านสำรองออฟไลน์ | [ARCHITECTURE](docs/ARCHITECTURE.md#5-ai-อ่านไพ่) |
| Pick a Card | 8 หัวข้อ · เลือก 1 จาก 4 กอง · สำรับเปลี่ยนทุกวันตามเวลาไทย | [TAROT_CARD_FEATURES](docs/TAROT_CARD_FEATURES.md#5-pick-a-card) |
| สมาชิก | ต้องลงชื่อก่อนเปิดไพ่ · ผังมาตรฐานเปิดฟรีวันละ 1 ครั้ง · ผังใหญ่ใช้แพ็กเกจหรือรหัสแลกสิทธิ์ · สมุดดวงเก็บประวัติและขอสำเนา/ลบได้ | [ENTITLEMENT_ABUSE_MODEL](docs/specs/ENTITLEMENT_ABUSE_MODEL.md) |
| แม่หมอตัวจริง | หน้ารวมแม่หมอ · จองคิว · ห้องวิดีโอคอล | [MARKETPLACE](docs/specs/MARKETPLACE.md) |
| ความปลอดภัย | คำถามที่มีสัญญาณทำร้ายตัวเองถูกหยุดทันทีและแสดงสายด่วน 1323 | [AI_COLLABORATION_GUIDELINES](docs/AI_COLLABORATION_GUIDELINES.md#3-ความปลอดภัยและความเป็นส่วนตัว) |
| แอป iPhone | Expo / React Native ใน `mobile/` — ยังไม่ขึ้น App Store | [mobile/README.md](mobile/README.md) |

## เทคโนโลยี

เวอร์ชันจริงดูที่ [`package.json`](package.json) — ตารางนี้บอกแค่ว่าใช้อะไรทำอะไร

| ชั้น | ใช้อะไร |
| :--- | :--- |
| หน้าเนื้อหาสาธารณะ | Astro + React island — สร้างเป็น HTML ตอนบิลด์ เสิร์ฟเป็นไฟล์ static จากขอบ Cloudflare ไม่ปลุก Worker |
| API และหน้าแอป (`/api/*` · `/admin` · `/readers/*` ฯลฯ) | Next.js ผ่าน `@opennextjs/cloudflare` บน Cloudflare Workers |
| ข้อมูล | Cloudflare D1 (`APP_DB`) · KV (`APP_KV`) · R2 (`SHARE_BUCKET` · `STUDIO_BUCKET`) · Vectorize · Workers AI |
| AI | Groq · Google Gemini (สองเจ้านี้วิ่งผ่าน Cloudflare AI Gateway เมื่อตั้งค่าไว้) · OpenRouter (โมเดลฟรี) · Workers AI (ตัวคัดกรองความปลอดภัย · ค้นหาเชิงความหมาย) |
| ภาษาและสไตล์ | TypeScript · Tailwind CSS · Zod |

รายละเอียดทั้งหมด: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)

## โครงสร้างรีโป

| โฟลเดอร์ | มีอะไร |
| :--- | :--- |
| `astro/` | หน้า Astro (`pages/`) · island · layout · shim ของ `next/*` |
| `src/app/` | Next.js App Router — API 118 เส้นใน `api/` และหน้าแอปที่เหลือใน `(th)/` |
| `src/components/` · `src/lib/` · `src/data/` | คอมโพเนนต์ React ที่ใช้ร่วมกันทั้งสองฝั่ง · ตรรกะ (AI · สับไพ่ · สิทธิ์ · ความปลอดภัย) · ข้อมูลไพ่/ผัง/บทความ |
| `migrations/` | สคีมา D1 — ใช้ทั้ง production และฐานในเครื่อง |
| `scripts/` | เครื่องมือ CLI และด่านตรวจ (`scripts/qa/`) |
| `public/` | ภาพไพ่ 1909 (`public/cards/` + ไฟล์ย่อ WebP) · ฟอนต์ · `_headers` |
| `mobile/` | แอป iPhone (Expo) |
| `docs/` | เอกสารทั้งหมด — เริ่มที่ [docs/INDEX.md](docs/INDEX.md) |

## เริ่มรันในเครื่อง

```bash
npm ci            # ใช้ npm เท่านั้น (ล็อกด้วย package-lock.json)
npm run dev       # Next.js — API และหน้าแอป ที่ http://localhost:3000
npm run dev:astro # Astro — หน้าเนื้อหา ที่ http://localhost:4321
```

ต้องใช้ Node.js 22.12 ขึ้นไป · ขั้นตอนเต็ม ตัวแปรแวดล้อม และข้อจำกัดของ dev server อยู่ที่ [docs/LOCAL_SETUP.md](docs/LOCAL_SETUP.md)

## สำหรับคนและ AI ที่จะแก้โค้ด

- กติกาการทำงาน · กฎเหล็ก · คำสั่งหลัก: [CLAUDE.md](CLAUDE.md) (ใช้กับ AI ทุกตัว)
- แผนที่เอกสาร: [docs/INDEX.md](docs/INDEX.md)
- deploy: [docs/CLOUDFLARE_DEPLOYMENT_GUIDE.md](docs/CLOUDFLARE_DEPLOYMENT_GUIDE.md) — งานขึ้น production ผ่าน PR ที่ผ่านด่าน CI เท่านั้น

## สัญญาอนุญาต

[PolyForm Noncommercial 1.0.0](LICENSE) · © 2026 SeerTarot — ใช้เพื่อศึกษา วิจัย และทดสอบส่วนตัวได้ · ห้ามใช้เชิงพาณิชย์โดยไม่ได้รับอนุญาตเป็นลายลักษณ์อักษร
