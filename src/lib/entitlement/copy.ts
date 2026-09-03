/**
 * แหล่งความจริงเดียวของ "ถ้อยคำและสถานะสิทธิ์ที่ผู้ใช้เห็น"
 * ------------------------------------------------------------------
 * ห้ามเขียนข้อความเรื่องโควตา/สิทธิ์ตรง ๆ ในคอมโพเนนต์ — ให้เรียกจากไฟล์นี้เสมอ
 * เหตุผล: ก่อนหน้านี้ข้อความ "สัปดาห์ละ 3 ครั้ง" ค้างอยู่ 4 จุดหลังระบบเปลี่ยนเป็นรายวัน
 * ผู้ใช้จึงเห็นเงื่อนไขไม่ตรงกันในหน้าเดียวกัน
 *
 * ไฟล์นี้เป็น "ฟังก์ชันบริสุทธิ์" ล้วน — ไม่แตะ DOM ไม่แตะ network ไม่คำนวณสิทธิ์เอง
 * ค่าจริงทั้งหมดมาจาก GET /api/entitlement (server-authoritative) เท่านั้น
 */

import type { ClientEntitlement } from "@/lib/entitlement/use-entitlement";
import {
  DAILY_LIMIT,
  GUEST_LIMIT,
  SIGNUP_BONUS,
  STANDARD_SPREAD_IDS,
  isStandardSpread,
  MASTER_PERSONA_IDS,
  isMasterPersona,
} from "@/lib/entitlement/limits";
import { CREDIT_PACKAGES } from "@/lib/entitlement/packages";

/** ราคาแพ็กเกจถูกที่สุด — ใช้เป็นราคา "เริ่มต้น" ทุกที่ ห้ามพิมพ์ตัวเลขเอง */
export const CHEAPEST_PACKAGE_THB = Math.min(...CREDIT_PACKAGES.map((p) => p.priceThb));

export {
  DAILY_LIMIT,
  GUEST_LIMIT,
  SIGNUP_BONUS,
  STANDARD_SPREAD_IDS,
  isStandardSpread,
  MASTER_PERSONA_IDS,
  isMasterPersona,
};

/** เหตุผลที่ทำให้ผู้ใช้เจอกำแพงสิทธิ์ — ใช้เลือกถ้อยคำและปุ่มให้ตรงสถานการณ์ */
export type UpgradeReason =
  | "guest_used" // ผู้เยี่ยมชมใช้สิทธิ์ทดลองฟรีครบแล้ว
  | "daily_exhausted" // สมาชิกใช้โควตารายวันครบแล้ว
  | "members_only" // ฟีเจอร์เฉพาะสมาชิก (แชทถามต่อ)
  | "grand_spread" // ผังใหญ่ 5–12 ใบสำหรับผู้ถือญาณพยากรณ์พิเศษ
  | "master_persona" // 2 ปรมาจารย์ลับสำหรับผู้ถือญาณพยากรณ์พิเศษ
  | "explore"; // ผู้ใช้กดดูรายละเอียดสิทธิ์เอง (ไม่ได้ถูกบล็อก)

export type QuotaTone = "unlimited" | "ample" | "low" | "empty";

export interface EntitlementView {
  /** ระบบสิทธิ์เปิดใช้อยู่หรือไม่ (ธงปิด = ไม่ต้องแสดง UI สิทธิ์เลย) */
  enabled: boolean;
  /** แอดมินตัวจริงเท่านั้น (มีสิทธิ์เข้าแผง /admin) */
  isAdmin: boolean;
  /** ใช้ได้ไม่จำกัด — แอดมิน หรือผู้ทดสอบ/อีเมล allowlist ที่ไม่มีสิทธิ์แผงแอดมิน */
  isUnlimited: boolean;
  isGuest: boolean;
  isMember: boolean;
  remaining: number;
  limit: number;
  /** จำนวนที่ใช้ไปในรอบนี้ — ใช้วาดจุดไฟ (pips) */
  used: number;
  tone: QuotaTone;
  /** ข้อความสั้นสำหรับป้ายบนแถบหัว เช่น "ทดลองฟรี 1 ครั้ง" */
  badgeLabel: string;
  /** ข้อความบรรยายเต็มประโยค เช่น "เหลือ 2 จาก 3 ครั้งของวันนี้" */
  statusLine: string;
  /** ข้อความบอกเวลารีเซ็ต (ว่างถ้าไม่มี) */
  resetLine: string;
  /** ปุ่มหลักที่ควรเสนอในสถานะนี้ */
  action: "none" | "signup" | "credits" | "admin";
  actionLabel: string;
  /** ถูกบล็อกไม่ให้เปิดไพ่รอบใหม่หรือไม่ */
  blocked: boolean;
  /** เหตุผลของการบล็อก (ถ้าถูกบล็อก) */
  blockedReason: UpgradeReason | null;
}

/** แปลงเวลา ISO เป็นข้อความนับถอยหลังภาษาคน เช่น "อีก 5 ชม. 20 นาที" */
export function formatResetCountdown(iso: string | null, now: number = Date.now()): string {
  if (!iso) return "";
  const target = new Date(iso).getTime();
  if (!Number.isFinite(target)) return "";
  const diff = target - now;
  if (diff <= 0) return "ได้สิทธิ์ใหม่แล้ว";

  const totalMinutes = Math.ceil(diff / 60_000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours >= 1 && minutes > 0) return `อีก ${hours} ชม. ${minutes} นาที`;
  if (hours >= 1) return `อีก ${hours} ชม.`;
  return `อีก ${minutes} นาที`;
}

/** เวลาไทยของจุดรีเซ็ต เช่น "เที่ยงคืนวันนี้ (00:00 น.)" */
export function resetClockLabel(): string {
  return "เที่ยงคืน (00:00 น. เวลาไทย)";
}

/**
 * แปลงสถานะสิทธิ์ดิบจาก server เป็น "สิ่งที่หน้าจอต้องพูด"
 * คืน null เมื่อยังโหลดไม่เสร็จ หรือระบบสิทธิ์ปิดอยู่ (UI ต้องไม่แสดงอะไรเลย)
 */
export function describeEntitlement(ent: ClientEntitlement | null): EntitlementView | null {
  if (!ent || !ent.enabled) return null;

  const isUnlimited = ent.role === "unlimited";
  const isGuest = ent.kind === "guest";
  const remaining = Math.max(0, ent.remaining ?? 0);
  const limit = Math.max(1, ent.limit ?? (isGuest ? GUEST_LIMIT : DAILY_LIMIT));
  const bonus = Math.max(0, ent.bonusRemaining ?? 0);
  const used = Math.max(0, Math.min(limit, limit - Math.min(remaining, limit)));
  const countdown = formatResetCountdown(ent.resetAt);

  if (isUnlimited) {
    return {
      enabled: true,
      isAdmin: false,
      isUnlimited: true,
      isGuest: false,
      isMember: true,
      remaining,
      limit,
      used: 0,
      tone: "unlimited",
      badgeLabel: "ไม่จำกัดสิทธิ์",
      statusLine: "บัญชีไม่จำกัดสิทธิ์ — เปิดไพ่และคุยต่อได้ไม่จำกัด",
      resetLine: "",
      action: "none",
      actionLabel: "",
      blocked: false,
      blockedReason: null,
    };
  }

  if (isGuest) {
    const hasFree = remaining > 0;
    return {
      enabled: true,
      isAdmin: false,
      isUnlimited: false,
      isGuest: true,
      isMember: false,
      remaining,
      limit,
      used,
      tone: hasFree ? "ample" : "empty",
      badgeLabel: hasFree ? `ทดลองฟรี ${remaining} ครั้ง` : "ใช้สิทธิ์ทดลองครบแล้ว",
      statusLine: hasFree
        ? `คุณมีสิทธิ์เปิดไพ่ทดลองฟรี ${GUEST_LIMIT} ครั้ง โดยยังไม่ต้องสมัครสมาชิก`
        : `คุณใช้สิทธิ์ทดลองฟรี ${GUEST_LIMIT} ครั้งไปแล้ว — สมัครสมาชิกฟรีเพื่อเปิดไพ่ต่อ`,
      resetLine: hasFree ? "ใช้ได้ทันที ไม่มีวันหมดอายุ" : "",
      action: "signup",
      actionLabel: hasFree ? "สมัครสมาชิกฟรี" : "สมัครสมาชิกฟรีเพื่อเปิดไพ่ต่อ",
      blocked: !hasFree,
      blockedReason: hasFree ? null : "guest_used",
    };
  }

  const dailyRemaining = Math.max(0, ent.dailyRemaining ?? ent.weeklyRemaining ?? 0);
  const hasQuota = remaining > 0;
  const tone: QuotaTone = !hasQuota ? "empty" : remaining <= 1 ? "low" : "ample";

  const bonusSuffix = bonus > 0 ? ` (+ รอบที่เติมไว้ ${bonus} ครั้ง)` : "";

  return {
    enabled: true,
    isAdmin: false,
    isUnlimited: false,
    isGuest: false,
    isMember: true,
    remaining,
    limit,
    used: Math.max(0, limit - dailyRemaining),
    tone,
    badgeLabel: hasQuota ? `เหลือ ${remaining} ครั้ง` : "โควตาวันนี้ครบแล้ว",
    statusLine: hasQuota
      ? `วันนี้เหลือ ${dailyRemaining} จาก ${DAILY_LIMIT} ครั้ง${bonusSuffix}`
      : `คุณใช้โควตาฟรีของวันนี้ครบ ${DAILY_LIMIT} ครั้งแล้ว`,
    resetLine: countdown
      ? countdown.startsWith("อีก")
        ? `โควตาฟรีชุดใหม่ ${countdown}`
        : countdown
      : "",
    action: hasQuota ? "none" : "credits",
    actionLabel: hasQuota ? "" : "เติมรอบเปิดไพ่",
    blocked: !hasQuota,
    blockedReason: hasQuota ? null : "daily_exhausted",
  };
}

/** สิ่งที่สมาชิกได้รับ — ใช้ทั้งในหน้าต่างชวนสมัครและตารางเทียบสิทธิ์ */
export const MEMBER_BENEFITS: Array<{ title: string; detail: string }> = [
  {
    title: `เปิดไพ่ฟรีวันละ ${DAILY_LIMIT} ครั้ง`,
    detail: "รีเซ็ตให้ใหม่ทุกเที่ยงคืน สำหรับผังมาตรฐาน 1–4 ใบ",
  },
  {
    title: "คุยถามแม่หมอต่อได้หลังเปิดไพ่",
    detail: "ถามเจาะลึกต่อจากคำทำนายเดิมได้ 2 คำถามต่อรอบ",
  },
  {
    title: "เก็บประวัติดูดวงไว้ทุกเครื่อง",
    detail: "ย้อนดูคำทำนายเก่าได้ แม้เปลี่ยนเครื่องหรือล้างเบราว์เซอร์",
  },
];

/** ถ้อยคำของกำแพงสิทธิ์แต่ละแบบ — เขียนแบบคนคุยกัน ตรงไปตรงมา ไม่กดดัน */
export interface UpgradeCopy {
  eyebrow: string;
  title: string;
  body: string;
  primaryLabel: string;
  primaryAction: "signup" | "credits";
  secondaryLabel: string;
  /** สิ่งที่ผู้ใช้ยังทำได้ฟรีอยู่ — บอกไว้เพื่อไม่ให้รู้สึกเจอทางตัน */
  reassurance: string;
}

export const UPGRADE_COPY: Record<UpgradeReason, UpgradeCopy> = {
  guest_used: {
    eyebrow: "สิทธิ์ทดลองฟรี",
    title: "คุณใช้สิทธิ์ทดลองฟรีครบแล้ว",
    body: `เปิดไพ่ทดลองได้ ${GUEST_LIMIT} ครั้งโดยไม่ต้องสมัคร — ครั้งนั้นใช้ไปแล้ว สมัครสมาชิกฟรีเพื่อเปิดไพ่ต่อวันละ ${DAILY_LIMIT} ครั้ง`,
    primaryLabel: "สมัครสมาชิกฟรี",
    primaryAction: "signup",
    secondaryLabel: "มีบัญชีอยู่แล้ว เข้าสู่ระบบ",
    reassurance: "สมัครฟรี ไม่ต้องผูกบัตร · คำทำนายที่เพิ่งอ่านยังเปิดดูย้อนหลังได้",
  },
  daily_exhausted: {
    eyebrow: "สิทธิ์ประจำวัน",
    title: `วันนี้คุณเปิดไพ่ครบ ${DAILY_LIMIT} ครั้งแล้ว`,
    body: "สิทธิ์เปิดไพ่ฟรีจะรีเซ็ตใหม่ตอนเที่ยงคืน หากต้องการดูดวงต่อทันที สามารถเติมรอบเพื่อเปิดผังใหญ่และคุยถามแม่หมอต่อได้เลย",
    primaryLabel: "เติมรอบดูดวงต่อ",
    primaryAction: "credits",
    secondaryLabel: "ไว้พรุ่งนี้ค่อยมาใหม่",
    reassurance: "รอบที่เติมไว้ไม่มีวันหมดอายุ · ปลดล็อกผังใหญ่ 10–12 ใบและคุยถามได้ไม่จำกัด",
  },
  members_only: {
    eyebrow: "เฉพาะสมาชิก",
    title: "ถามแม่หมอต่อได้เมื่อสมัครสมาชิก",
    body: "การคุยถามเจาะลึกต่อจากไพ่ชุดเดิมเปิดให้สมาชิก เพราะต้องเก็บบทสนทนาผูกกับบัญชีของคุณ",
    primaryLabel: "สมัครสมาชิกฟรี",
    primaryAction: "signup",
    secondaryLabel: "มีบัญชีอยู่แล้ว เข้าสู่ระบบ",
    reassurance: `สมัครฟรี ไม่ต้องผูกบัตร · เปิดไพ่ได้วันละ ${DAILY_LIMIT} ครั้ง`,
  },
  explore: {
    eyebrow: "สิทธิ์การใช้งาน",
    title: "สิทธิ์การเปิดไพ่ของคุณ",
    body: "ดูว่าตอนนี้คุณเปิดไพ่ได้อีกกี่ครั้ง และสมาชิกได้อะไรเพิ่มบ้าง",
    primaryLabel: "สมัครสมาชิกฟรี",
    primaryAction: "signup",
    secondaryLabel: "ปิดหน้าต่างนี้",
    reassurance: "ไม่มีการเก็บเงินอัตโนมัติ · ยกเลิกหรือลบบัญชีได้ตลอดเวลา",
  },
  grand_spread: {
    eyebrow: "✦ ผังใหญ่พิเศษ",
    title: "ผังพยากรณ์เจาะลึกพิเศษ (5–12 ใบ)",
    body: "ผังนี้เป็นผังวิเคราะห์เชิงลึกระดับสูง (เช่น Celtic Cross 10 ใบ, จักรราศี 12 ภพ, 7 จักระ) สำหรับผู้ที่เติมรอบเปิดไพ่พิเศษ เพื่อดูดวงชะตาอย่างครอบคลุมทุกมิติ",
    primaryLabel: `เติมรอบเปิดผังนี้ (เริ่ม ${CHEAPEST_PACKAGE_THB}.-)`,
    primaryAction: "credits",
    secondaryLabel: "เลือกผังมาตรฐาน 1–4 ใบไปก่อน",
    reassurance: "รอบที่เติมไว้ไม่มีวันหมดอายุ · ปลดล็อกผังใหญ่ครบ 20 ผัง + คุยเจาะลึกไม่จำกัด",
  },
  master_persona: {
    eyebrow: "✦ แม่หมอผู้เชี่ยวชาญพิเศษ",
    title: "แม่หมอวิเคราะห์ดวงเชิงลึกเฉพาะทาง",
    body: "อาจารย์สายฟันธง และ แม่หมอสายพลัง เป็น 2 ท่านผู้เชี่ยวชาญด้านกลยุทธ์ฟันธงและจิตวิทยาเชิงลึก เฉพาะผู้ที่เติมรอบเปิดไพ่พิเศษ",
    primaryLabel: `เติมรอบเพื่อปรึกษา (เริ่ม ${CHEAPEST_PACKAGE_THB}.-)`,
    primaryAction: "credits",
    secondaryLabel: "เลือกแม่หมอท่านอื่นไปก่อน",
    reassurance: "รอบที่เติมไว้ไม่มีวันหมดอายุ · คุยถามเจาะลึกได้ไม่จำกัด",
  },
};

/** แผนสิทธิ์สำหรับตารางเทียบในหน้าต่าง "สิทธิ์การใช้งาน" */
export interface AccessPlan {
  id: "guest" | "member" | "credits";
  name: string;
  price: string;
  priceNote: string;
  highlight?: string;
  features: Array<{ label: string; included: boolean }>;
}

export const ACCESS_PLANS: AccessPlan[] = [
  {
    id: "guest",
    name: "ผู้เยี่ยมชม",
    price: "ฟรี",
    priceNote: "ไม่ต้องสมัคร",
    features: [
      { label: `เปิดไพ่ทดลอง ${GUEST_LIMIT} ครั้ง`, included: true },
      { label: "อ่านคำทำนายเต็มทุกองก์", included: true },
      { label: "คลังความหมายไพ่ 78 ใบ", included: true },
      { label: "คุยถามแม่หมอต่อ (ต้องเป็นสมาชิก)", included: false },
      { label: "เก็บประวัติข้ามอุปกรณ์ (ต้องเป็นสมาชิก)", included: false },
    ],
  },
  {
    id: "member",
    name: "สมาชิกทั่วไป",
    price: "ฟรี",
    priceNote: "สมัครด้วยอีเมล Google หรือ LINE",
    highlight: "แนะนำ",
    features: [
      { label: `เปิดไพ่ฟรีวันละ ${DAILY_LIMIT} ครั้ง (ผังมาตรฐาน)`, included: true },
      { label: "คุยถามแม่หมอต่อ 2 คำถาม/รอบ", included: true },
      { label: "เก็บประวัติคำทำนายข้ามเครื่อง", included: true },
      { label: "ขอลบข้อมูลทั้งหมดได้ทุกเมื่อ", included: true },
    ],
  },
  {
    id: "credits",
    name: "รอบดูดวงพิเศษ (Tarot Pass)",
    price: `เริ่ม ${CHEAPEST_PACKAGE_THB}.-`,
    priceNote: "จ่ายครั้งเดียว ไม่ตัดเงินอัตโนมัติ",
    features: [
      { label: "ปลดล็อกผังใหญ่ 10–12 ใบ (เซลติกครอส)", included: true },
      { label: "วิเคราะห์จังหวะเวลา (Timing) & ไพ่เงา", included: true },
      { label: "คุยถามแม่หมอเจาะลึกได้ไม่จำกัด", included: true },
      { label: "วอลเปเปอร์ยันต์ 4K & ใบดวงชะตาทองคำ", included: true },
      { label: "รอบที่เติมไว้ไม่มีวันหมดอายุ ไม่ใช่รายเดือน", included: true },
    ],
  },
];
