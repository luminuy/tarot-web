# 💻 คู่มือการติดตั้งและรันระบบในเครื่อง (Local Development Setup Guide)

> เอกสารแนะนำการตั้งค่าสภาพแวดล้อม พอร์ตที่ใช้งาน ตัวแปรแวดล้อม (Environment Variables) และแนวปฏิบัติสำหรับวิศวกรและ AI ที่ทำงานบนเครื่อง Local

---

## 📋 1. ข้อกำหนดขั้นต่ำของระบบ (Prerequisites)

* **Node.js**: เวอร์ชัน `>= 20.9.0` (แนะนำ **Node 20 LTS** หรือ **Node 22 LTS**)
* **Package Manager**: **`npm`** (ใช้ `npm` เท่านั้น — **ห้ามใช้ `pnpm` หรือ `yarn`** เนื่องจากโปรเจกต์ผูกมัดกับ `package-lock.json` และ Cloudflare OpenNext Adapter ทำงานเข้ากันได้สูงสุดกับ `npm`)
* **Git**: เวอร์ชัน `>= 2.30` พร้อมติดตั้ง GitHub CLI (`gh`) หากต้องการใช้งานระบบ Auto-Merge (`npm run pr:auto`)
* **OS**: รองรับทั้ง **macOS** (Apple Silicon M1/M2/M3/M4 & Intel), Linux (Ubuntu/Debian) และ Windows (ผ่าน WSL2)

---

## 🚀 2. ขั้นตอนการติดตั้ง (Installation)

### 2.1 Clone Repository
```bash
git clone https://github.com/luminuy/tarot-web.git
cd เว็บไพ่  # หรือชื่อโฟลเดอร์ที่คุณ clone ไว้
```

### 2.2 ติดตั้ง Dependencies
```bash
npm install
```

> 💡 **หมายเหตุ**: โปรเจกต์ใช้ React 19.2 และ Next.js 16.3 ล่าสุด หากพบคำเตือน peer dependencies ทั่วไป `npm install` จะจัดการโครงสร้างให้อย่างถูกต้องตาม `package-lock.json` โดยไม่ต้องใส่ `--force` หรือ `--legacy-peer-deps`

---

## 🔑 3. การตั้งค่า Environment Variables (`.env.local`)

โปรเจกต์ออกแบบให้สามารถ **รันในเครื่องได้ทันทีแม้ยังไม่มี API Key ใดๆ** (ระบบมีคลังคำทำนายสำรองระดับปรมาจารย์รองรับเสมอ) แต่หากต้องการทดสอบพลัง AI แบบเต็มพิกัด ให้สร้างไฟล์ `.env.local` ที่ Root Directory:

```env
# ==========================================
# 🔮 AI Interpretation Engines
# ==========================================
# 1. Google Gemini (คีย์หลักสำหรับอ่านคำทำนาย & แชท)
GEMINI_API_KEY="AIzaSy..."
# หรือใช้ชื่อ GOOGLE_API_KEY สำรอง
# GOOGLE_API_KEY="AIzaSy..."

# 2. Groq Cloud LPU (คีย์สำรองความเร็วสูงพิเศษ 400ms เมื่อ Gemini ชนโควตา)
GROQ_API_KEY="gsk_..."

# ==========================================
# 🔐 Security & Authentication
# ==========================================
# Secret สำหรับลงนาม Session Token และ JWT
SESSION_SECRET="your-super-secret-random-key-at-least-32-chars"
JWT_SECRET="your-super-secret-jwt-key"

# รหัสผ่านแอดมินสำหรับเข้าสู่แผงควบคุม /admin
ADMIN_PASSWORD="your-secure-admin-password"
ADMIN_TOKEN="your-admin-bearer-token"

# ==========================================
# ⚙️ Platform & Simulation Flags (Optional for Dev)
# ==========================================
# บังคับใช้ SQLite Local Mock แทน Cloudflare D1 เมื่อไม่ได้รัน wrangler
# NODE_ENV="development"
```

---

## 🏃 4. การรัน Development Server

### 4.1 เริ่มเซิร์ฟเวอร์
```bash
npm run dev
```
* หน้าเว็บจะเปิดที่: **`http://localhost:3000`**
* แผงควบคุมผู้ดูแลระบบ: **`http://localhost:3000/admin`**
* หน้าตรวจสอบความพร้อมระบบ: **`http://localhost:3000/health`**

### 4.2 การเปลี่ยนพอร์ต (Port Conflict)
หากพอร์ต `3000` ถูกโปรแกรมอื่นใช้งานอยู่ ให้รันด้วย:
```bash
PORT=3001 npm run dev
```

---

## 🍏 5. ข้อควรระวังเฉพาะระบบปฏิบัติการ (macOS & Platform Quirks)

1. **พอร์ตที่ต้องหลีกเลี่ยงบน macOS (AirPlay Receiver Conflict)**:
   * **พอร์ต 5000 และ 7000**: บน macOS Monterey (12.x) ขึ้นไป ฟีเจอร์ *AirPlay Receiver* ของระบบจะจองพอร์ต `5000` และ `7000` ไว้เป็นค่าเริ่มต้น ทำให้ไม่สามารถรัน dev server บนพอร์ตเหล่านี้ได้ (แนะนำให้ใช้ `3000`, `3001`, หรือ `8080`)
2. **การสังเคราะห์เสียงอ่านคำทำนาย (Web Speech API)**:
   * บน macOS Safari และ Chrome จะมีเสียงภาษาไทย (เช่น "Kanya", "Narisa") มาให้ในเครื่องโดยอัตโนมัติ ไม่ต้องติดตั้งโปรแกรมเพิ่ม
3. **ประสิทธิภาพบน Apple Silicon**:
   * การประมวลผล Next.js Compiler (Turbopack) และ TypeScript ทำงานแบบ Native ARM64 รวดเร็ว ไม่ต้องผ่าน Rosetta 2

---

## 🧪 6. คำสั่งสำคัญในกระบวนการพัฒนา (Essential Commands)

| คำสั่ง | วัตถุประสงค์ |
| :--- | :--- |
| `npm run repo:verify` | **(สำคัญที่สุด)** รันชุดตรวจความสมบูรณ์ 21 ด่าน (Typecheck, ไพ่ 78 ใบ, ผัง 20 แบบ, Provably Fair, Agent Lock ฯลฯ) |
| `npm run typecheck` | ตรวจสอบความถูกต้องของ TypeScript Typecheck อย่างเดียว (ต้องได้ 0 errors เสมอ) |
| `npm run cards:variants` | สร้างรูปภาพไพ่ WebP หลายขนาด (`w128`, `w256`, `w512`, `w1024`) อัตโนมัติ (รันเมื่อมีการเพิ่มภาพใหม่ใน `/public/cards/`) |
| `npm run agent:status` | ตรวจสอบสถานะการล็อคไฟล์ของ AI Agent เพื่อป้องกันการแก้ไขชนกัน |
| `npm run agent:lock` | ล็อคไฟล์ก่อนเริ่มทำงาน `npm run agent:lock -- --agent <ชื่อ> --domain <หมวด> --files <ไฟล์>` |
| `npm run agent:unlock` | ปลดล็อคไฟล์เมื่อทำงานเสร็จ |
| `npm run commit` | บันทึก Commit ผ่านระบบ Git Author Guard |
| `npm run pr:auto` | ตรวจ 21 ด่าน ➔ Push ➔ สร้าง PR ➔ Auto-Merge ➔ Deploy อัตโนมัติ |
| `npm run git:tidy` | เก็บกวาด Branch ที่ถูก Merge ไปแล้วออกจากเครื่องและ Remote |

---

## 🌐 7. การจำลองสภาพแวดล้อม Cloudflare Edge (Wrangler Dev)

หากต้องการทดสอบระบบในสภาพแวดล้อม Cloudflare Workers เสมือนจริง (รวม Cloudflare D1 และ KV):
```bash
# พรีวิวสภาพแวดล้อม Worker
npm run preview
# หรือรันผ่าน wrangler
npx wrangler dev
```
คีย์ Secret บน Cloudflare Workers จริงจะตั้งค่าผ่าน:
```bash
npx wrangler secret put GEMINI_API_KEY
npx wrangler secret put GROQ_API_KEY
npx wrangler secret put ADMIN_PASSWORD
```
