/**
 * 📅 กติกาการนัดเวลา + นโยบายยกเลิก/คืนเงิน — แหล่งความจริงเดียว (ไม่มี I/O)
 * ---------------------------------------------------------------------------
 * ไฟล์นี้ **ห้าม import ฐานข้อมูล** — หน้าต่างจอง · หน้าคิว · แผงแม่หมอ (ฝั่งเบราว์เซอร์)
 * และ API (ฝั่งเซิร์ฟเวอร์) ใช้ตัวเลขชุดเดียวกัน ผู้ใช้จึงเห็นกติกาตรงกับที่ระบบบังคับจริงเสมอ
 *
 * เวลาทั้งหมดเก็บเป็น ms (UTC) · แสดงผลเป็นเวลาไทยผ่านโมดูลกลาง `@/lib/time/bangkok`
 * (ประกอบจากส่วนประกอบตัวเลขที่ระบุชื่อ — ผลเหมือนกันทั้งเซิร์ฟเวอร์และเบราว์เซอร์)
 */

import { CONSULTATION_MINUTES } from "@/lib/marketplace/offer";
import { APP_TIME_ZONE, bangkokDayStartMs, bangkokParts } from "@/lib/time/bangkok";

export const BOOKING_TIMEZONE = APP_TIME_ZONE;
const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/** ความยาวหนึ่งนัด = ความยาวการปรึกษา */
export const SLOT_MINUTES = CONSULTATION_MINUTES;
/** จองได้ล่วงหน้าอย่างน้อยกี่ชั่วโมง (แม่หมอต้องมีเวลาอ่านบรีฟ) */
export const BOOKING_LEAD_HOURS = 2;
/** เปิดให้จองไกลสุดกี่วัน */
export const BOOKING_HORIZON_DAYS = 14;
/** ยกเลิก/เลื่อนนัดได้ฟรีถ้าทำก่อนเวลานัดอย่างน้อยกี่ชั่วโมง */
export const FREE_CANCEL_HOURS = 24;
/** เลื่อนนัดได้กี่ครั้งต่อการจอง */
export const MAX_RESCHEDULES = 1;
/** แม่หมอไม่เริ่มนัดภายในกี่นาทีหลังเวลานัด = ลูกค้ายกเลิกได้และได้เงินคืนเต็ม / แม่หมอแจ้งลูกค้าไม่มาได้ */
export const NO_SHOW_GRACE_MINUTES = 15;
/** แม่หมอกด "เริ่มนัด" ได้ก่อนเวลากี่นาที */
export const EARLY_START_MINUTES = 15;
/**
 * หน้าจ่ายเงิน Stripe หมดอายุเมื่อไร — Stripe รับค่า 30 นาทีถึง 24 ชม. นับจากตอนสร้าง
 * ใส่ 31 นาทีเผื่อเวลาเดินทางของคำขอ (ใส่ 30 พอดีแล้วถึง Stripe ช้าไปวินาทีเดียว = ถูกปฏิเสธ)
 */
export const CHECKOUT_EXPIRES_MINUTES = 31;
/**
 * ระยะกันที่นั่งระหว่างรอจ่าย — ต้อง "ยาวกว่า" อายุหน้าจ่ายเงินเสมอ
 * Stripe รับเงินหลังหน้าจ่ายหมดอายุไม่ได้ จึงไม่มีทางที่ลูกค้าจ่ายสำเร็จหลังที่นั่งถูกปล่อยไปแล้ว
 * (ยกเว้น webhook มาช้าผิดปกติ — กรณีนั้น settle จะพยายามจองคืน ไม่ได้ก็คืนเงินอัตโนมัติ)
 */
export const HOLD_MINUTES = CHECKOUT_EXPIRES_MINUTES + 5;
/** ลูกค้าหนึ่งคนถือคิว/นัดที่ยังไม่จบได้พร้อมกันกี่ใบ (กันกวาดเวลาว่างทั้งตาราง) */
export const MAX_ACTIVE_PER_CUSTOMER = 3;

export const slotMs = SLOT_MINUTES * MINUTE;

/** ช่วงเวลารับนัดประจำสัปดาห์ของแม่หมอ (เวลาไทย · นาทีนับจากเที่ยงคืน) */
export interface ScheduleRule {
  /** 0 = อาทิตย์ … 6 = เสาร์ */
  weekday: number;
  startMin: number;
  endMin: number;
}

export interface SlotDay {
  /** วันที่แบบ YYYY-MM-DD ตามเวลาไทย */
  date: string;
  /** เวลาเริ่มของแต่ละช่อง (ms) เรียงจากเช้าไปค่ำ */
  slots: number[];
}

/** เที่ยงคืนเวลาไทยของวันที่ `ms` ตกอยู่ (คืนเป็น ms UTC) */
export function bkkDayStart(ms: number): number {
  return bangkokDayStartMs(ms);
}

const bkkParts = bangkokParts;
const pad2 = (n: number) => String(n).padStart(2, "0");

export function bkkDateKey(ms: number): string {
  const p = bkkParts(ms);
  return `${p.year}-${pad2(p.month + 1)}-${pad2(p.day)}`;
}

/** ตรวจรูปแบบตารางรับนัดที่แม่หมอส่งมา — คืนข้อความผิดพลาด หรือ null ถ้าผ่าน */
export function validateScheduleRules(rules: ScheduleRule[]): string | null {
  if (rules.length > 21) return "ตั้งช่วงเวลาได้ไม่เกิน 3 ช่วงต่อวัน";
  const byDay = new Map<number, ScheduleRule[]>();
  for (const r of rules) {
    if (!Number.isInteger(r.weekday) || r.weekday < 0 || r.weekday > 6) return "วันในสัปดาห์ไม่ถูกต้อง";
    if (!Number.isInteger(r.startMin) || !Number.isInteger(r.endMin)) return "เวลาไม่ถูกต้อง";
    if (r.startMin < 0 || r.endMin > 24 * 60) return "เวลาต้องอยู่ระหว่าง 00:00 ถึง 24:00";
    if (r.startMin % SLOT_MINUTES !== 0 || r.endMin % SLOT_MINUTES !== 0) {
      return `เวลาเริ่มและเลิกต้องลงตัวทีละ ${SLOT_MINUTES} นาที`;
    }
    if (r.endMin - r.startMin < SLOT_MINUTES) return `แต่ละช่วงต้องยาวอย่างน้อย ${SLOT_MINUTES} นาที`;
    const list = byDay.get(r.weekday) ?? [];
    list.push(r);
    byDay.set(r.weekday, list);
  }
  for (const list of byDay.values()) {
    if (list.length > 3) return "ตั้งช่วงเวลาได้ไม่เกิน 3 ช่วงต่อวัน";
    const sorted = [...list].sort((a, b) => a.startMin - b.startMin);
    for (let i = 1; i < sorted.length; i++) {
      if (sorted[i].startMin < sorted[i - 1].endMin) return "ช่วงเวลาในวันเดียวกันซ้อนกัน";
    }
  }
  return null;
}

/** ตั้งค่าการรับนัดของแม่หมอที่มีผลกับเวลาว่าง (migrations/0021) */
export interface SlotOptions {
  /** วันหยุดรายวัน (YYYY-MM-DD เวลาไทย) — ปิดทั้งวันทับตารางประจำสัปดาห์ */
  blockedDates?: ReadonlySet<string>;
  /** เวลาพักระหว่างนัด (นาที) — ช่องที่ชิดนัดเดิมน้อยกว่านี้จะไม่เปิดให้จอง */
  bufferMin?: number;
  /** เพดานนัดต่อวัน — ครบแล้วทั้งวันไม่เปิดเพิ่ม */
  dailyCap?: number | null;
}

/** ตัวเลือกเวลาพักที่แม่หมอเลือกได้ — ตารางเป็นช่องละ 30 นาที พักเศษกว่านั้นก็ต้องเว้นทั้งช่องอยู่ดี */
export const BUFFER_OPTIONS = [0, SLOT_MINUTES] as const;
export const DAILY_CAP_MAX = 24;

/**
 * เวลาว่างทั้งหมดในช่วงที่เปิดให้จอง
 * - ต้องอยู่ในตารางประจำสัปดาห์ · เริ่มหลัง "ตอนนี้ + เวลาจองล่วงหน้าขั้นต่ำ" · ไม่เกินขอบเขตวันที่เปิดจอง
 * - ไม่ซ้ำกับเวลาที่ถูกจอง/กันที่ไว้แล้ว (`taken`) · ไม่ใช่วันหยุด · เว้นเวลาพัก · ไม่เกินเพดานต่อวัน
 *
 * ⚠️ เวลาพัก/เพดานต่อวันเป็น "ความสะดวกของแม่หมอ" — สองคนจองช่องติดกันพร้อมกันเป๊ะอาจหลุดได้
 *    สิ่งที่ห้ามหลุดเด็ดขาด (สองคนเวลาเดียวกัน) ฐานข้อมูลกันไว้ด้วย unique index อยู่แล้ว
 */
export function generateSlots(
  rules: ScheduleRule[],
  nowMs: number,
  taken: ReadonlySet<number>,
  opts: SlotOptions = {}
): SlotDay[] {
  const earliest = nowMs + BOOKING_LEAD_HOURS * HOUR;
  const firstDay = bkkDayStart(nowMs);
  const gap = slotMs + Math.max(0, opts.bufferMin ?? 0) * MINUTE;
  const takenList = [...taken];
  const days: SlotDay[] = [];
  for (let d = 0; d < BOOKING_HORIZON_DAYS; d++) {
    const dayStart = firstDay + d * DAY;
    const dateKey = bkkDateKey(dayStart);
    if (opts.blockedDates?.has(dateKey)) continue;
    if (opts.dailyCap && takenList.filter((t) => t >= dayStart && t < dayStart + DAY).length >= opts.dailyCap) continue;
    const weekday = bkkParts(dayStart).weekday;
    const starts = new Set<number>();
    for (const r of rules) {
      if (r.weekday !== weekday) continue;
      for (let m = r.startMin; m + SLOT_MINUTES <= r.endMin; m += SLOT_MINUTES) {
        const s = dayStart + m * MINUTE;
        if (s < earliest || taken.has(s)) continue;
        if (takenList.some((t) => Math.abs(t - s) < gap)) continue;
        starts.add(s);
      }
    }
    if (starts.size > 0) days.push({ date: dateKey, slots: [...starts].sort((a, b) => a - b) });
  }
  return days;
}

/** เวลานี้จองได้จริงไหม (ด่านฝั่งเซิร์ฟเวอร์ — ไม่เชื่อเวลาที่ไคลเอนต์ส่งมา) · คืนเหตุผล หรือ null ถ้าจองได้ */
export function slotRejection(
  rules: ScheduleRule[],
  nowMs: number,
  slotStart: number,
  taken: ReadonlySet<number>,
  opts: SlotOptions = {}
): string | null {
  if (!Number.isSafeInteger(slotStart)) return "เวลานัดไม่ถูกต้อง";
  const open = generateSlots(rules, nowMs, new Set(), { blockedDates: opts.blockedDates });
  const day = open.find((d) => d.date === bkkDateKey(slotStart));
  if (!day || !day.slots.includes(slotStart)) return "เวลานี้ไม่อยู่ในตารางรับนัดของแม่หมอแล้ว กรุณาเลือกเวลาใหม่";
  if (taken.has(slotStart)) return "เวลานี้เพิ่งมีคนจองไป กรุณาเลือกเวลาอื่น";
  const free = generateSlots(rules, nowMs, taken, opts).find((d) => d.date === bkkDateKey(slotStart));
  if (!free || !free.slots.includes(slotStart)) return "เวลานี้ไม่ว่างแล้ว (แม่หมอเว้นเวลาพักหรือรับนัดเต็มวัน) กรุณาเลือกเวลาอื่น";
  return null;
}

export type ReminderKind = "24h" | "1h";

/**
 * ถึงเวลาส่งอีเมลเตือนนัดแบบไหน (ตัวจับเวลาอยู่ GitHub Actions ทุก 15 นาที — ดีเลย์ได้ 5–15 นาที หน้าต่างจึงกว้าง)
 * - "24h": เหลือ 12–25 ชม. และจองไว้นานกว่า 6 ชม. แล้ว (เพิ่งจองไม่ต้องเตือนซ้ำกับอีเมลยืนยัน)
 * - "1h" : เหลือไม่เกิน 75 นาทีและยังไม่ถึงเวลานัด
 */
export function reminderDue(slotStart: number, createdAt: number, nowMs: number): ReminderKind | null {
  const left = slotStart - nowMs;
  if (left <= 0) return null;
  if (left <= 75 * MINUTE) return "1h";
  if (left > 12 * HOUR && left <= 25 * HOUR && nowMs - createdAt >= 6 * HOUR) return "24h";
  return null;
}

export type CancelActor = "customer" | "reader";

export interface CancelDecision {
  allowed: boolean;
  /** คืนเงินเต็มจำนวนไหม */
  refund: boolean;
  /** เหตุผลสั้นสำหรับบันทึก/แสดงผล */
  reason: string;
}

/**
 * นโยบายยกเลิก — ใครยกเลิก ตอนไหน ได้เงินคืนไหม
 *
 * | กรณี | ผล |
 * | :-- | :-- |
 * | แม่หมอยกเลิก (ทุกเวลา) | คืนเต็ม |
 * | ยังไม่จ่าย | ยกเลิกได้ ไม่มีอะไรต้องคืน |
 * | คิวสด ระหว่างรอเรียก | คืนเต็ม (ยังไม่ได้รับบริการ) |
 * | นัดล่วงหน้า ก่อนเวลานัด ≥ 24 ชม. | คืนเต็ม |
 * | นัดล่วงหน้า เลยเวลานัด 15 นาทีแล้วแม่หมอยังไม่เริ่ม | คืนเต็ม (แม่หมอไม่มาตามนัด) |
 * | นัดล่วงหน้า น้อยกว่า 24 ชม. | ยกเลิกได้ ไม่คืนเงิน |
 * | แม่หมอเรียกคิว/เริ่มคุยแล้ว | ลูกค้ายกเลิกเองไม่ได้ |
 */
export function decideCancellation(input: {
  actor: CancelActor;
  kind: "walkup" | "booking";
  ticketStatus: string;
  paid: boolean;
  slotStart: number | null;
  nowMs: number;
}): CancelDecision {
  const { actor, kind, ticketStatus, paid, slotStart, nowMs } = input;
  const open = ticketStatus === "pending_payment" || ticketStatus === "waiting" || ticketStatus === "screening";
  if (actor === "reader") {
    if (open || ticketStatus === "ready") return { allowed: true, refund: paid, reason: "reader_cancelled" };
    return { allowed: false, refund: false, reason: "closed" };
  }
  if (!open) return { allowed: false, refund: false, reason: ticketStatus === "ready" ? "in_session" : "closed" };
  if (!paid) return { allowed: true, refund: false, reason: "unpaid" };
  if (kind === "walkup" || slotStart === null) return { allowed: true, refund: true, reason: "walkup_waiting" };
  if (slotStart - nowMs >= FREE_CANCEL_HOURS * HOUR) return { allowed: true, refund: true, reason: "early_cancel" };
  if (nowMs >= slotStart + NO_SHOW_GRACE_MINUTES * MINUTE) return { allowed: true, refund: true, reason: "reader_no_show" };
  return { allowed: true, refund: false, reason: "late_cancel" };
}

/** เลื่อนนัดได้ไหม (นัดที่จ่ายแล้ว · เหลือเวลาก่อนนัด ≥ 24 ชม. · ยังไม่เคยเลื่อนครบโควตา) */
export function canReschedule(input: {
  ticketStatus: string;
  slotStart: number | null;
  rescheduleCount: number;
  nowMs: number;
}): boolean {
  return (
    input.ticketStatus === "waiting" &&
    input.slotStart !== null &&
    input.rescheduleCount < MAX_RESCHEDULES &&
    input.slotStart - input.nowMs >= FREE_CANCEL_HOURS * HOUR
  );
}

/** แม่หมอกด "เริ่มนัด" ได้หรือยัง */
export function canStartBooking(slotStart: number | null, nowMs: number): boolean {
  return slotStart === null || nowMs >= slotStart - EARLY_START_MINUTES * MINUTE;
}

/** แม่หมอแจ้ง "ลูกค้าไม่มาตามนัด" ได้หรือยัง */
export function canMarkNoShow(slotStart: number | null, nowMs: number): boolean {
  return slotStart !== null && nowMs >= slotStart + NO_SHOW_GRACE_MINUTES * MINUTE;
}

/* ── การแสดงผลเวลาไทย (ผลเหมือนกันทั้งเซิร์ฟเวอร์และเบราว์เซอร์) ─────────────── */

const TH_WEEKDAY = ["อาทิตย์", "จันทร์", "อังคาร", "พุธ", "พฤหัสบดี", "ศุกร์", "เสาร์"];
const TH_WEEKDAY_SHORT = ["อา.", "จ.", "อ.", "พ.", "พฤ.", "ศ.", "ส."];
const TH_MONTH_SHORT = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];

export const WEEKDAY_LABELS = TH_WEEKDAY;
export const WEEKDAY_SHORT_LABELS = TH_WEEKDAY_SHORT;

const pad = (n: number) => String(n).padStart(2, "0");

/** "19:00" */
export function formatTime(ms: number): string {
  const p = bkkParts(ms);
  return `${pad(p.hour)}:${pad(p.minute)}`;
}

/** นาทีจากเที่ยงคืน ➔ "19:00" (ใช้ในตารางรับนัด · 1440 ➔ "24:00") */
export function formatMinutes(min: number): string {
  return `${pad(Math.floor(min / 60))}:${pad(min % 60)}`;
}

/** "ศุกร์ 10 ต.ค." */
export function formatDayLabel(ms: number): string {
  const p = bkkParts(ms);
  return `${TH_WEEKDAY[p.weekday]} ${p.day} ${TH_MONTH_SHORT[p.month]}`;
}

/** ป้ายวันแบบชิป: { top: "ศ.", day: "10", bottom: "ต.ค." } */
export function dayChipParts(ms: number): { weekday: string; day: string; month: string } {
  const p = bkkParts(ms);
  return { weekday: TH_WEEKDAY_SHORT[p.weekday], day: String(p.day), month: TH_MONTH_SHORT[p.month] };
}

/** "ศุกร์ 10 ต.ค. 2569 · 19:00–19:30 น." */
export function formatSlotRange(slotStart: number, withYear = false): string {
  const p = bkkParts(slotStart);
  const year = withYear ? ` ${p.year + 543}` : "";
  return `${TH_WEEKDAY[p.weekday]} ${p.day} ${TH_MONTH_SHORT[p.month]}${year} · ${formatTime(slotStart)}–${formatTime(slotStart + slotMs)} น.`;
}

/** "วันนี้" / "พรุ่งนี้" / "ศุกร์ 10 ต.ค." */
export function relativeDayLabel(ms: number, nowMs: number): string {
  const diff = Math.round((bkkDayStart(ms) - bkkDayStart(nowMs)) / DAY);
  if (diff === 0) return "วันนี้";
  if (diff === 1) return "พรุ่งนี้";
  return formatDayLabel(ms);
}

/** "อีก 2 วัน 3 ชม." / "อีก 45 นาที" / "ถึงเวลานัดแล้ว" */
export function formatCountdown(targetMs: number, nowMs: number): string {
  const diff = targetMs - nowMs;
  if (diff <= 0) return "ถึงเวลานัดแล้ว";
  const days = Math.floor(diff / DAY);
  const hours = Math.floor((diff % DAY) / HOUR);
  const minutes = Math.ceil((diff % HOUR) / MINUTE);
  if (days > 0) return `อีก ${days} วัน${hours > 0 ? ` ${hours} ชม.` : ""}`;
  if (hours > 0) return `อีก ${hours} ชม.${minutes > 0 && minutes < 60 ? ` ${minutes} นาที` : ""}`;
  return `อีก ${minutes} นาที`;
}

/** ปฏิทิน: ลิงก์เพิ่มลง Google Calendar */
export function googleCalendarUrl(input: { slotStart: number; title: string; details: string; location: string }): string {
  const fmt = (ms: number) => new Date(ms).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: input.title,
    dates: `${fmt(input.slotStart)}/${fmt(input.slotStart + slotMs)}`,
    details: input.details,
    location: input.location,
    ctz: BOOKING_TIMEZONE,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/** ปฏิทิน: ไฟล์ .ics (Apple Calendar · Outlook) พร้อมเตือนก่อน 30 นาที */
export function buildIcs(input: { uid: string; slotStart: number; title: string; details: string; url: string }): string {
  const fmt = (ms: number) => new Date(ms).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const esc = (s: string) => s.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/[,;]/g, (c) => `\\${c}`);
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//SeerTarot//Booking//TH",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${input.uid}@seertarot.net`,
    `DTSTAMP:${fmt(Date.now())}`,
    `DTSTART:${fmt(input.slotStart)}`,
    `DTEND:${fmt(input.slotStart + slotMs)}`,
    `SUMMARY:${esc(input.title)}`,
    `DESCRIPTION:${esc(input.details)}`,
    `URL:${input.url}`,
    "BEGIN:VALARM",
    "TRIGGER:-PT30M",
    "ACTION:DISPLAY",
    `DESCRIPTION:${esc(input.title)}`,
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}
