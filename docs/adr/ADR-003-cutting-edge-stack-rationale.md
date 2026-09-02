# ADR-003: เหตุผลการเลือกใช้เทคโนโลยีเวอร์ชันล้ำสมัยและการบริหารความเสี่ยง (Cutting-Edge Stack Rationale & Risk Management)

> **สถานะ**: อนุมัติ (Approved)  
> **วันที่**: 2026-09-02  
> **ผู้จัดทำ**: ทีมวิศวกรรมสถาปัตยกรรมระบบ (Claude & Antigravity AI)  
> **อ้างอิง**: [`docs/ARCHITECTURE.md`](../ARCHITECTURE.md), [`docs/KNOWN_ISSUES.md`](../KNOWN_ISSUES.md) (ISSUE-001)

---

## 1. บริบทและความเป็นมา (Context)

โปรเจกต์ **SeerTarot** ถูกออกแบบให้เป็นเว็บพยากรณ์ไพ่ทาโรต์ระดับพรีเมียม (World-Class Interactive Provably-Fair Tarot Web) โดยมีเป้าหมายด้านประสิทธิภาพ ประสบการณ์ผู้ใช้ และความโปร่งใสดังนี้:
1. การเรนเดอร์ภาพไพ่ 78 ใบแบบ 3D พลิกไพ่ และการสลับแอนิเมชันแบบ **60fps ลื่นไหลไร้รอยต่อบนมือถือ**
2. การสตรีมมิ่งคำทำนายแบบเรียลไทม์ (SSE Streaming) ผ่าน Cloudflare Edge Network ทั่วโลกด้วย Latency ต่ำที่สุด
3. การคำนวณสับไพ่และตรวจสอบแฮชเข้ารหัส (Web Crypto API SHA-256) ที่แม่นยำและโปร่งใส 100%

ในการพัฒนา ทีมตัดสินใจเลือกใช้ชุดเทคโนโลยีล้ำสมัย (Cutting-Edge Stack) ได้แก่:
* **`react@19.2`** (React 19 ล่าสุด)
* **`next@16.3`** (Next.js 16 App Router)
* **`motion@13`** (`motion/react` 13)
* **`@opennextjs/cloudflare`**

การเลือกใช้เวอร์ชันล้ำสมัยนี้นำมาซึ่งคำถามทางสถาปัตยกรรม (ระบุไว้ใน ISSUE-001 ของ `KNOWN_ISSUES.md`) ว่าเหตุใดจึงเลือก stack นี้ และมีกลยุทธ์รับมือความเสี่ยงอย่างไร

---

## 2. เหตุผลการตัดสินใจทางเทคนิค (Architectural Rationales)

### 2.1 ทำไมต้อง React 19.2
1. **First-Class Server Actions & Form State**: การจัดการเซสชันเปิดไพ่ การจ่ายสิทธิ์ (Entitlement) และการตรวจสอบตัวตน ทำงานได้โดยไม่ต้องพึ่งพาระบบ Client State Management ขนาดใหญ่ (เช่น Redux/Zustand) ลดขนาด JavaScript Bundle ที่ส่งไปยังเบราว์เซอร์ผู้ใช้
2. **Resource Preloading & Asset Optimization**: React 19 รองรับการจัดลำดับ Preload ภาพไพ่และฟอนต์ (`preload`, `preinit`) ทำให้ภาพหน้าไพ่ 1909 ความละเอียดสูงแสดงผลได้ทันทีโดยไม่กระตุกหรือเกิดภาพขาว (Zero Layout Shift)
3. **Async Transition & Smooth UI**: รองรับการเปลี่ยนผ่านสถานะการดูดวง (สับไพ่ ➔ เลือกไพ่ ➔ พลิกไพ่ ➔ สตรีมคำทำนาย) อย่างต่อเนื่องโดยไม่บล็อก Main Thread

### 2.2 ทำไมต้อง Next.js 16.3 บน Cloudflare Edge
1. **Turbopack Native Compilation**: ความเร็วในการ Compile และสร้าง Static/Edge Artifacts รวดเร็วกว่า Webpack เดิมอย่างมหาศาล
2. **Edge Runtime Parity**: ทำงานร่วมกับ OpenNext Cloudflare Adapter ได้อย่างสมบูรณ์แบบ ทำให้ API ทั้งหมดสามารถประมวลผลบน Edge Worker ที่อยู่ใกล้ผู้ใช้มากที่สุดในระดับมิลลิวินาที
3. **Strict Caching & Streaming**: สถาปัตยกรรม App Router รองรับ Native `ReadableStream` สำหรับส่งข้อความคำทำนายแบบ SSE โดยไม่ต้องพึ่ง WebSocket Server แยกต่างหาก

### 2.3 ทำไมต้อง Motion 13 (`motion/react`)
1. **Native Hardware-Accelerated Transforms**: Motion 13 แยกการคำนวณ Animation ไปทำงานบน GPU Compositor Thread ป้องกันอาการ Frame Drop เมื่อแสดงผลไพ่พร้อมกันหลายสิบใบบนผัง Grand Spread
2. **Unified Gesture Pipeline**: รองรับทั้ง Touch Gesture บนมือถือ และ Mouse Drag บนเดสก์ท็อปผ่าน API เดียว ลดความซ้ำซ้อนของโค้ด

---

## 3. ความเสี่ยงและการบริหารจัดการ (Risks & Mitigations)

| ความเสี่ยง | สาเหตุที่เป็นไปได้ | มาตรการรับมือถาวร (Mitigations) |
| :--- | :--- | :--- |
| **Peer Dependency Warnings (ISSUE-001)** | ไลบรารีภายนอกบางตัวยังประกาศ peerDependencies เป็น `react@^18` | ล็อคเวอร์ชันด้วย `package-lock.json` เสมอ และหลีกเลี่ยงการใช้ flag `--force` ที่ไม่จำเป็น มีระบบ CI ตรวจสอบความเข้ากันได้ 21 ด่าน |
| **Breaking Changes ใน Minor Releases** | Next.js และ React เวอร์ชันใหม่มีการเปลี่ยนพฤติกรรม Async Request APIs | เพิ่มไฟล์คำเตือนกฎเฉพาะใน [`AGENTS.md`](../../AGENTS.md) และเอกสารคำแนะนำเพื่อเตือน AI และนักพัฒนาไม่ให้ใช้ syntax แบบเก่า |
| **Edge Runtime Incompatibility** | ฟังก์ชัน Node.js บางตัวไม่ทำงานบน Cloudflare Workers | ใช้ Web Standards APIs ล้วนๆ (`fetch`, `Web Crypto`, `ReadableStream`, `Headers`) และสร้าง Mock SQLite ในเครื่องสำหรับสภาพแวดล้อม Local Dev |

---

## 4. ผลลัพธ์และข้อสรุป (Consequences)

* **ข้อดี**: เว็บไซต์ได้คะแนน Core Web Vitals (LCP, INP, CLS) ระดับสูงสุด ภาพไพ่คมชัดและลื่นไหล 60fps และรองรับผู้ใช้งานพร้อมกันจำนวนมากด้วยต้นทุนโครงสร้างพื้นฐานระดับศูนย์
* **ข้อพึงระวัง**: ทุกการเพิ่มหรืออัปเกรดแพ็กเกจใหม่ ต้องผ่านการตรวจ `npm run repo:verify` ครบ 21 ด่านเสมอ
