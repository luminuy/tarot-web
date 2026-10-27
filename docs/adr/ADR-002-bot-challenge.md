# ADR-002: สถาปัตยกรรมป้องกันบอทและควบคุมต้นทุน AI โดยไม่ใช้ Captcha/Turnstile

- **สถานะ**: อนุมัติแล้ว (Accepted) · ยังใช้กับขั้นเปิดไพ่ — ขอบเขตแคบลง (ดูหมายเหตุ) · **ตรวจกับโค้ดล่าสุด**: 2026-10-26
- **วันที่**: 2026-09-01
- **ผู้มีส่วนร่วม**: Antigravity AI Team & Core Architecture

> **หมายเหตุ (ตรวจกับโค้ด 2026-10-26)** — เนื้อหาการตัดสินใจด้านล่างคงไว้ตามวันที่เขียน
> - ขั้นเปิดไพ่ (`/api/reading/*`) ยังไม่มี captcha/Turnstile ตามที่ตัดสินไว้
> - Turnstile ถูกใช้แล้ว **เฉพาะหน้าอีเมลสมัคร/ล็อกอิน/ลืมรหัส** (`src/lib/security/turnstile.ts` · ไม่ตั้งคีย์ = ผ่านตลอด) เพื่อกันฟาร์มบัญชี — ADR นี้ไม่ครอบคลุมหน้านั้น
> - ตั้งแต่ 2026-09-09 ต้องล็อกอินก่อนเปิดไพ่ที่เรียก AI (`GUEST_LIMIT = 0`) — ด่านหน้าจึงย้ายไปฝั่งบัญชี
> - ชั้น 3 เปลี่ยนจากหน่วยความจำต่อ isolate เป็นเพดานข้าม isolate บน D1 `edge_rate_buckets` (`consumeEdgeRateLimits`) · ชั้น 4 ยัง 40 ครั้ง/วัน/IP แต่นับผ่าน `bumpCounter` (Redis ถ้าตั้ง ไม่งั้น KV) · ชั้น 5 ค่าเริ่มต้น 2,000 ครั้ง/วัน และแชทตอบ 429 เมื่อเต็ม (ไม่ถอยไปคำตอบในเครื่อง) · เพิ่มเพดานโทเคนต่อคนต่อวัน (`cost-ledger.ts`)
> - ชั้น 6 อยู่นอกโค้ด — ดู [`CLOUDFLARE_OPTIMIZATION_GUIDE.md`](../CLOUDFLARE_OPTIMIZATION_GUIDE.md)
> - รายละเอียดชั้นป้องกันปัจจุบัน: [`specs/ENTITLEMENT_ABUSE_MODEL.md`](../specs/ENTITLEMENT_ABUSE_MODEL.md)

---

## 📌 บริบท (Context)

ในการให้บริการดูดวงไพ่ทาโรต์ด้วยปัญญาประดิษฐ์ (Google Gemini 3.7 Flash) ต้นทุนการประมวลผลและการเรียก API มีค่าใช้จ่ายจริง ระบบจึงจำเป็นต้องมีมาตรการป้องกันการถูก Scraping, การยิงสแปม และการเรียกซ้ำซ้อนจากสคริปต์อัตโนมัติ

ก่อนหน้านี้มีข้อเสนอในการนำ Cloudflare Turnstile หรือ Captcha มาใช้ยืนยันตัวตนก่อนผู้ใช้จะเปิดไพ่ อย่างไรก็ตาม จากการวิเคราะห์ประสบการณ์ผู้ใช้ (UX) และประสิทธิภาพของระบบ พบข้อจำกัดสำคัญ:
1. **UX Friction & Drop-Off**: การแสดง Captcha ระหว่างขั้นตอนการทำสมาธิและเลือกไพ่ทำลายบรรยากาศและอารมณ์ร่วมของผู้ใช้ (Immersive Sacred Experience) ส่งผลให้อัตรา Drop-off เพิ่มขึ้นอย่างมีนัยสำคัญ
2. **Third-Party Script Latency**: สคริปต์ภายนอกเพิ่มขนาด Bundle และหน่วงเวลา Time-to-Interactive (TTI) บนอุปกรณ์มือถือ
3. **PWA / Offline Degradation**: ไม่สามารถทำงานแบบไร้รอยต่อในโหมดเครือข่ายจำกัด

---

## 🎯 การตัดสินใจ (Decision)

**เราตัดสินใจไม่ติดตั้ง Cloudflare Turnstile หรือ Captcha ในปัจจุบัน** แต่เลือกใช้ **ยุทธศาสตร์การป้องกันเชิงลึก 7 ชั้น (7-Layer Defense-in-Depth Strategy)** ที่ทำงานแบบโปร่งใส (Frictionless Security) แทน:

### 7 ชั้นการป้องกันเชิงลึก (7-Layer Multi-Tier Defense):

1. **Provably Fair Entropy Binding**: การสับและเลือกไพ่ต้องอาศัย `clientSeed` จากการลากนิ้ว/ขยับเมาส์ของผู้ใช้จริง และมี `commitment` ล่วงหน้าจากเซิร์ฟเวอร์ บอทไม่สามารถยิง bypass ขั้นตอนได้โดยตรง
2. **Strict Origin & Anti-Theft Guard**: ตรวจสอบ `Sec-Fetch-Site`, `Origin`, และ `Referer` บนทุก API endpoint สำคัญ (`/api/reading/*`) ป้องกันการเรียกข้ามโดเมนและการขโมย API
3. **Sliding Window Rate Limiter**: จำกัดความถี่ต่อ Client IP (`getClientIdentifier`) ผ่าน sliding-window memory store ป้องกันการยิงถี่เกินมนุษย์ปกติ
4. **Cloudflare KV Cross-Fleet Soft Quota**: ควบคุมโควตารายวันต่อ IP (40 ครั้ง/วัน) ซิงก์ข้าม Edge isolate fleet ทั่วโลก โดยเก็บเฉพาะ SHA-256 IP Hash ตามมาตรฐาน PDPA
5. **AI Daily Spend Cap & Circuit Breaker**: เพดานจำกัดการเรียก Gemini รวมทั้งระบบต่อวัน (`AI_DAILY_CALL_CAP`) พร้อมตัดวงจรอัตโนมัติ (HTTP 503 บน `/read` และ fallback ไปยัง local contextual synthesis บน `/chat`)
6. **Cloudflare Native WAF Edge Rate Limiting**: บล็อกสแปมตั้งแต่ระดับ DNS/Edge ก่อนที่ทราฟฟิกจะมาถึง Serverless Worker
7. **Privileged Testing Bypass**: มีระบบ Bypass ปลอดภัยสำหรับผู้ดูแลและระบบทดสอบอัตโนมัติ (`RATE_LIMIT_BYPASS_TOKEN` และ admin session cookie)

---

## 🔄 เกณฑ์การทบทวนในอนาคต (Review Triggers)

เราจะทบทวนการตัดสินใจนี้และพิจารณาเปิดใช้ Invisible Turnstile อีกครั้งก็ต่อเมื่อ:
- สถิติพบทราฟฟิกบอทที่เล็ดลอดระบบ 7 ชั้นเกิน 10% ของคำขอทั้งหมด
- มีการโจมตีแบบ Distributed Botnet จาก IP หลายพันแห่งที่ไม่ตรงตามเกณฑ์ Rate limit ปกติ
- Cloudflare WAF ส่งสัญญาณ Bot Score ต่ำกว่า 20 เกินกว่า 15% ของทราฟฟิก
