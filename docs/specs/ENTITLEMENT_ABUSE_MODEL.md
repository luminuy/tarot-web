# 🛡️ ระบบกันโกงของสิทธิ์ฟรีผู้เยี่ยมชม (Guest Entitlement — Abuse Model)

> **สถานะ:** P0 + P1 ลงแล้ว (2026-09-01, PR harden-guest-entitlement) · P2/P3 เลื่อนโดยตั้งใจ — สร้างเมื่อ metric บอกว่าจำเป็น
> **อ่านคู่กับ:** [`ENTITLEMENT_PLAN.md`](ENTITLEMENT_PLAN.md) (ข้อ 3 = ปรัชญา "กันไม่ได้ 100% ไม่ไล่อุด") · [`INCIDENT_LOG.md`](INCIDENT_LOG.md) INC-0038

---

## 1. หลักคิด — มันคือ 2 ปัญหา ไม่ใช่ปัญหาเดียว

| | เป้าหมาย | ระดับการลงแรง |
| :-- | :-- | :-- |
| **A. Dedup มนุษย์** (กันคนกดซ้ำ / incognito) | ลด friction ของ conversion funnel | **น้อย** — ยอมรับช่องโหว่ตาม ENTITLEMENT_PLAN ข้อ 3 · ยิ่งกั้นยิ่งฆ่ายอดสมัคร |
| **B. กัน automation** (สคริปต์เผางบ AI / ดูดคอนเทนต์) | ปกป้องเงินค่า AI และ IP ของคอนเทนต์ | **มาก** — นี่คือที่ที่วิศวกรรมควรอยู่ |

**คุกกี้ `tarot_guest` ไม่ใช่ระบบกันโกง** — มันคือ UX state marker
การกัน automation ทั้งหมดอยู่ที่: origin guard + rate limit + per-IP quota + AI daily cap + (ใหม่) server-authoritative gid marker + guest IP/subnet quota

---

## 2. Threat model

| ผู้กระทำ | แรงจูงใจ | ความพยายาม | ปริมาณ | การป้องกัน |
| :-- | :-- | :-- | :-- | :-- |
| คนอยากดูรอบ 2 | ส่วนตัว | incognito | 1–5 | ✅ ยอมรับ (ข้อ 3) — funnel ทำงานของมัน |
| power user ขี้เหนียว | เลี่ยงสมัคร | ล้างคุกกี้ | 5–50/สัปดาห์ | ⚠️ ยอมรับ แต่มี ceiling ต่อ IP (P1) |
| สคริปต์เผางบ AI | ทำร้ายต้นทุน | กลาง | 100–1400/วัน | 🟢 P1 (IP 5/วัน + subnet 20/วัน) + AI cap 70% |
| คู่แข่งดูดคอนเทนต์ | ขโมย prompt/ความหมายไพ่ | กลาง | bulk | 🟡 origin guard + P1 · scrape บน origin เราเองยังทำได้บ้าง → P2 ถ้าจำเป็น |

---

## 3. ชั้นป้องกัน (ปัจจุบัน)

```
Layer 0  origin guard (isRequestAuthorizedOrigin)         — บล็อก off-site fetch
Layer 1  rate limit ต่อ IP (checkRateLimit)               — 15/600s, concurrent 1 · in-memory ต่อ isolate
Layer 2  per-IP read quota (checkPerIpReadQuota)          — 40/วัน/IP · KV ข้าม fleet · IP hash SHA-256
Layer 3  AI daily cap สองชั้น (isAiCapReached)            — guest 70% / member 100% ของ AI_DAILY_CALL_CAP
Layer 4  🆕 server-authoritative guest marker             — KV app:guest:used:<gid> · start เช็คเอง
Layer 5  🆕 guest IP + subnet quota                       — IP 5/วัน · /24|/64 20/วัน · KV · นับเฉพาะอ่านจบจริง
```

### จุดอ่อนที่รู้ตัว (ยอมรับ)

| จุด | ผลกระทบ | ทำไมยอมรับ |
| :-- | :-- | :-- |
| ล้างคุกกี้ / incognito → gid ใหม่ | สิทธิ์ฟรีใหม่ | ENTITLEMENT_PLAN ข้อ 3 · การไล่อุดต้องใช้ fingerprint = ขัด PDPA |
| KV eventually-consistent (~60s global) | double-`start` จากคนละ POP ผ่านได้ 1–2 ครั้ง | bounded ด้วย Layer 5 (IP 5/วัน) · same-POP อ่านสด (memo) |
| `checkRateLimit` in-memory ต่อ isolate | patient/distributed abuse เลี่ยง Layer 1 ได้ | Layer 2/5 (KV) คือ ceiling จริง · Layer 1 แค่กันกดรัว |
| headless browser บน origin เราเอง | scrape คอนเทนต์ได้ทีละน้อย | bounded ด้วย Layer 5 · P2 (PoW) ถ้า metric แย่ |

---

## 4. P0 — Server-authoritative guest marker

**ปัญหาที่แก้:** หลัง PR #96 การหักสิทธิ์ guest เกิดที่ `POST /api/entitlement/guest-consume` (client ยิง)
→ client ที่บล็อก call นั้นทำให้คุกกี้ค้าง `used=0` = เปิดไพ่ได้ไม่จำกัด (เพดานแค่ Layer 2 = 40/วัน)

**วิธี:**

1. `start` route ปักหมุด `gid` ลงคุกกี้ตั้งแต่ขั้นแรก (`used=0`) — ทุก reading ผูก gid ที่มีอยู่ก่อนเริ่ม
2. `read` route ตอนอ่านจบจริง (`realReading`) → `markGuestUsedOnServer(gid)` เขียน KV `app:guest:used:<gid>` ฝั่ง server (TTL 400 วัน)
3. `getViewer()` อ่าน marker นี้ → ถ้ามี ทับค่าคุกกี้เป็น `guestUsed = GUEST_LIMIT` เสมอ
4. `guest-consume` เขียน marker ซ้ำ (defense-in-depth) + set คุกกี้ `used=1` (ให้ badge/UI ตรง)

**ผล:** บล็อก `guest-consume` ไม่ช่วยแล้ว — `start` เห็น marker → 403 · ช่องที่เหลือ = ล้างคุกกี้ (gid ใหม่) ตามข้อ 3
**PDPA:** gid เป็น pseudonym (ไม่มี PII) · TTL หมดอายุเอง ไม่ต้องมี cleanup job

---

## 5. P1 — Guest IP + subnet quota

**ปัญหาที่แก้:** ล้างคุกกี้ 40 รอบ/IP/วัน (เพดาน Layer 2) = 40 AI call ฟรี/IP/วัน

**วิธี:** `src/lib/security/ai-budget.ts`

| ตัวนับ | เพดาน default | env override | คีย์ KV |
| :-- | :-- | :-- | :-- |
| ต่อ IP ต่อวัน | `5` | `GUEST_IP_DAILY_READS` | `app:guest:ipq:<day>:<ipHash>` |
| ต่อซับเน็ต /24 (v4) หรือ /64 (v6) ต่อวัน | `20` | `GUEST_SUBNET_DAILY_READS` | `app:guest:subq:<day>:<subnetHash>` |

- เช็คที่ `read` route (guest + flag on) ก่อนเรียก AI · นับที่ `realReading` เท่านั้น
- เกิน → `403` ข้อความ **ชวนสมัคร** ไม่ใช่ error ("...จากเครือข่ายนี้ครบแล้ว สมัครสมาชิกเพื่อเปิดต่อ")
- household NAT ที่ชน = conversion opportunity · IP hash SHA-256 (ไม่เก็บ IP ดิบ)
- stat `entitlement_guest_ip_capped`

---

## 6. สิ่งที่ไม่ทำ (และเหตุผล)

| ไม่ทำ | เหตุผล |
| :-- | :-- |
| Canvas/WebGL/font fingerprint · fingerprint SDK | ขัด PDPA + นโยบายที่ประกาศแล้ว (ENTITLEMENT_PLAN ข้อ 3) |
| IP+UA hash เป็น identity | quasi-fingerprint · household ชนกันเยอะเกินไป |
| Hard CAPTCHA (reCAPTCHA v2) | UX พัง + reCAPTCHA ส่งข้อมูลให้ Google (ประเด็น PDPA) |
| verify เบอร์/อีเมลก่อนได้สิทธิ์ฟรี | ฆ่า funnel "ทดลองฟรี 1 ครั้ง" |

---

## 7. เลื่อนไว้ (metric-driven — สร้างเมื่อจำเป็น)

### P2 · Proof-of-Work challenge (guest, ก่อนเรียก AI)

`start` คืน `{ prefix, difficulty }` → client หา nonce ที่ `sha256(prefix+nonce)` มี N bit นำเป็น 0 (~200ms) → `read` verify
- scraper จ่าย CPU จริงทุก reading · มนุษย์ไม่รู้สึก · **zero third-party, zero data — PDPA สะอาด**
- ถ้าไม่พอ → fallback Cloudflare Turnstile (privacy-preserving กว่า reCAPTCHA)
- แทนที่ ADR-002 ที่ค้าง

### P3 · Velocity alert + auto-degrade

- guest AI spend > X% ใน Y นาที → auto-flip guest เป็น "signup required" ชั่วคราว + แจ้ง admin
- เพิ่ม metric ในการ์ดแอดมิน "สถิติระบบสิทธิ์"

### เกณฑ์ตัดสินใจ

ก่อนสร้าง P2/P3 — ดู metric: distribution `entitlement_guest_consumed` ต่อ IP/gid · อัตรา `entitlement_blocked_start` / `entitlement_guest_ip_capped` · AI spend แยก tier
**ถ้า abuse < 5% ของ guest volume → P0+P1 พอ** · สัญชาตญาณของแผน ("อย่าไล่อุด") ถูก จนกว่าตัวเลขจะบอกเป็นอย่างอื่น
