import { createHash } from "node:crypto";
import { KEY } from "@/lib/platform/kv-store";
import { bumpCounter, readCounter } from "@/lib/platform/kv-counter";
import { utcDay } from "@/lib/stats/record";

/**
 * ⚠️ ตัวนับทุกตัวในไฟล์นี้ต้องเขียนผ่าน `bumpCounter()` เท่านั้น ห้ามเรียก `kvPutJSON`
 * ตรง ๆ อีก — ของเดิมเขียน KV ทุกครั้งที่มีคนเปิดไพ่ (โควตา AI 1 + ต่อ IP 1 +
 * ผู้เยี่ยมชม 2 = ~4 ครั้งต่อการเปิดไพ่ 1 ครั้ง) ชนเพดาน KV ฟรี 1,000 ครั้ง/วัน
 * ตั้งแต่ยังไม่ถึง 250 คน ทั้งที่เพดาน AI ตั้งไว้ 2,000 ครั้ง/วัน
 * รายละเอียดข้อแลกเปลี่ยนอยู่ในหัวไฟล์ `src/lib/platform/kv-counter.ts`
 */

const DEFAULT_DAILY_CAP = 2000;
/** ผู้เยี่ยมชมถูกตัดที่สัดส่วนนี้ของเพดาน สมาชิกใช้ได้ถึง 100% (ENTITLEMENT_PLAN ข้อ 6) */
const GUEST_CAP_RATIO = 0.7;

export function getAiDailyCap(): number {
  const n = Number(process.env.AI_DAILY_CALL_CAP);
  return Number.isFinite(n) && n > 0 ? n : DEFAULT_DAILY_CAP;
}

/**
 * true ถ้าวันนี้เรียก AI เกินเพดานแล้ว — ตรวจสอบก่อนเริ่ม stream Gemini
 * เพดานสองชั้น: ผู้เยี่ยมชมตัดที่ 70% · สมาชิกใช้ได้ถึง 100%
 * (default = "guest" เพื่อความปลอดภัย — call site ต้องระบุ "member" เอง)
 */
export async function isAiCapReached(tier: "guest" | "member" = "guest"): Promise<boolean> {
  const day = utcDay();
  const count = await readCounter(KEY.aiCap(day));
  const cap = getAiDailyCap();
  const effective = tier === "member" ? cap : Math.floor(cap * GUEST_CAP_RATIO);
  return count >= effective;
}

/**
 * เรียกหลังจุด Gemini call สำเร็จ (ใน done handler) — สะสมใน buffer แล้ว flush รวมทีเดียว
 */
export async function recordAiCall(n = 1): Promise<void> {
  bumpCounter(KEY.aiCap(utcDay()), 60 * 60 * 48, n);
}

const DEFAULT_IP_READ_QUOTA = 40; // 40 readings per day per IP
function hashIpForDay(ip: string, day: string): string {
  return createHash("sha256").update(`${ip}:${day}`).digest("hex").slice(0, 16);
}

/**
 * ตรวจสอบโควตาการเปิดไพ่ต่อ IP ข้าม Edge fleet (Cloudflare KV Backed)
 * ป้องกันการยิงคำขอต่อเนื่องข้าม Edge Nodes
 */
export async function checkPerIpReadQuota(ip: string): Promise<{ allowed: boolean; remaining: number }> {
  const day = utcDay();
  const ipHash = hashIpForDay(ip, day);
  const count = await readCounter(`app:ipq:read:${day}:${ipHash}`);
  const remaining = Math.max(0, DEFAULT_IP_READ_QUOTA - count);
  return { allowed: count < DEFAULT_IP_READ_QUOTA, remaining };
}

// ─────────────────────────────────────────────────────────────────────────────
// เพดานเฉพาะผู้เยี่ยมชม (ENTITLEMENT_PLAN — ป้องกันการล้างคุกกี้ซ้ำเพื่อเผางบ AI)
// ต่อ IP: ต่ำ (household NAT ที่ชน = โอกาสให้สมัคร ไม่ใช่ error)
// ต่อซับเน็ต /24 (IPv4) หรือ /64 (IPv6): จับ IP rotation ในผู้กระทำรายเดียว
// ทั้งคู่นับเฉพาะ "อ่านจบจริง" · KV eventually-consistent (~60s) — ยอมรับได้ตามข้อ 3
// ─────────────────────────────────────────────────────────────────────────────
const GUEST_IP_DAILY = numFromEnv("GUEST_IP_DAILY_READS", 5);
const GUEST_SUBNET_DAILY = numFromEnv("GUEST_SUBNET_DAILY_READS", 20);

function numFromEnv(name: string, fallback: number): number {
  const n = Number(process.env[name]);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

/** ย่อ IP เป็น prefix ซับเน็ต: IPv4 → /24 · IPv6 → /64 (คร่าว ๆ พอสำหรับ bucket) */
export function subnetPrefix(ip: string): string {
  if (ip.includes(":")) {
    const h = ip.split(":");
    return h.slice(0, 4).join(":") + "::/64";
  }
  const o = ip.split(".");
  return o.length === 4 ? `${o[0]}.${o[1]}.${o[2]}.0/24` : ip;
}

/** true ถ้าผู้เยี่ยมชมจาก IP/ซับเน็ตนี้เปิดไพ่ครบเพดานวันนี้แล้ว */
export async function isGuestReadQuotaReached(ip: string): Promise<boolean> {
  const day = utcDay();
  const ipHash = hashIpForDay(ip, day);
  const subHash = hashIpForDay(subnetPrefix(ip), day);
  const [ipCount, subCount] = await Promise.all([
    readCounter(KEY.guestIpQuota(day, ipHash)),
    readCounter(KEY.guestSubnetQuota(day, subHash)),
  ]);
  return ipCount >= GUEST_IP_DAILY || subCount >= GUEST_SUBNET_DAILY;
}

/** บันทึกการเปิดไพ่ของผู้เยี่ยมชม (เรียกตอนอ่านจบจริงเท่านั้น) · caller ห่อ `void` เอง */
export async function recordGuestRead(ip: string): Promise<void> {
  const day = utcDay();
  bumpCounter(KEY.guestIpQuota(day, hashIpForDay(ip, day)), 60 * 60 * 36);
  bumpCounter(KEY.guestSubnetQuota(day, hashIpForDay(subnetPrefix(ip), day)), 60 * 60 * 36);
}

/**
 * บันทึกการใช้งานโควตาต่อ IP หลังเริ่มอ่านสำเร็จ
 */
export async function recordPerIpReadQuota(ip: string): Promise<void> {
  const day = utcDay();
  bumpCounter(`app:ipq:read:${day}:${hashIpForDay(ip, day)}`, 60 * 60 * 24);
}
