import { signPayload, verifyPayload } from "@/lib/auth/edge-auth";
import { SITE_ORIGIN } from "@/lib/config/site";
import { sendEmail } from "@/lib/email/send";
import { baseLayout, escapeHtml } from "@/lib/email/templates";
import {
  FREE_CANCEL_HOURS,
  formatSlotRange,
  googleCalendarUrl,
  MAX_RESCHEDULES,
  type ReminderKind,
} from "@/lib/marketplace/booking-policy";
import { CONSULTATION_MINUTES } from "@/lib/marketplace/offer";
import { recordCaughtError } from "@/lib/observability/caught";
import { getAppDB } from "@/lib/platform/db";

/**
 * 💌 อีเมลของระบบจอง — ยืนยันนัด · เตือนนัด · ยกเลิก/คืนเงิน · เลื่อนนัด · แจ้งแม่หมอ · แจ้งเวลาว่าง
 * ===========================================================================
 * หลักการ
 * 1. **อีเมลพังต้องไม่ทำให้การจองพัง** — ทุกฟังก์ชันที่ส่งออกไป `never throw` (จับแล้วรายงานเข้าท่อสถิติ)
 * 2. **ส่งครั้งเดียว** — อีเมลที่ส่งจากหลายเส้น (webhook + กลับจาก Stripe + cron ยิงซ้ำ) จองสิทธิ์ก่อนด้วย
 *    `UPDATE ... SET x_at = ? WHERE x_at IS NULL` คำขอที่สองได้ changes = 0 แล้วไม่ส่ง
 * 3. **ลิงก์ในอีเมลพาเข้าคิวได้ทุกเครื่อง** — `bookingAccessUrl` เซ็นเลขตั๋ว + ตัวตนลูกค้า หมดอายุ 7 วันหลังนัด
 *    (เดิมคิวเปิดได้เฉพาะเบราว์เซอร์ที่ใช้จอง เปลี่ยนเครื่อง = หานัดไม่เจอทั้งที่จ่ายแล้ว)
 * 4. **ข้อความจากผู้ใช้ทุกตัวผ่าน `escapeHtml`** (ชื่อเล่น · ชื่อแม่หมอ) — A2-17
 * 5. ลิงก์ทุกอันชี้ `SITE_ORIGIN` เสมอ ไม่เอา host จากคำขอ (cron ยิงผ่าน *.workers.dev)
 */

const LINK_PURPOSE = "booking_access";
const RETENTION_MS = 7 * 24 * 60 * 60 * 1000;

/* ── ลิงก์เข้าคิวจากอีเมล ─────────────────────────────────────────────────── */

interface AccessPayload {
  p: string;
  t: string;
  /** ตัวตนลูกค้า — ใช้คีย์ `c` ไม่ใช่ `ref` โดยตั้งใจ: โทเคนนี้ต้องเอาไปใช้แทนคุกกี้ `customerRef` ตรง ๆ ไม่ได้ */
  c: string;
  e: number;
}

export async function signBookingAccess(ticketId: string, customerRef: string, expiresAtMs: number): Promise<string> {
  return signPayload({ p: LINK_PURPOSE, t: ticketId, c: customerRef, e: expiresAtMs } satisfies AccessPayload);
}

/** ตรวจลิงก์จากอีเมล — คืน `customerRef` เมื่อโทเคนเป็นของตั๋วนี้และยังไม่หมดอายุ */
export async function verifyBookingAccess(token: string, ticketId: string, nowMs = Date.now()): Promise<string | null> {
  const payload = await verifyPayload<Partial<AccessPayload>>(token);
  if (!payload || payload.p !== LINK_PURPOSE || payload.t !== ticketId) return null;
  if (typeof payload.e !== "number" || payload.e < nowMs) return null;
  return typeof payload.c === "string" && payload.c.length >= 6 ? payload.c : null;
}

export async function bookingAccessUrl(ticketId: string, customerRef: string, slotStart: number | null): Promise<string> {
  const expires = Math.max(Date.now(), slotStart ?? 0) + RETENTION_MS;
  const token = await signBookingAccess(ticketId, customerRef, expires);
  return `${SITE_ORIGIN}/api/marketplace/tickets/${encodeURIComponent(ticketId)}/access?k=${encodeURIComponent(token)}`;
}

/* ── ข้อมูลที่อีเมลทุกฉบับต้องใช้ ─────────────────────────────────────────── */

interface MailContext {
  ticketId: string;
  customerRef: string;
  nickname: string;
  kind: "walkup" | "booking";
  readerId: string;
  readerName: string;
  readerEmail: string | null;
  bookingId: string;
  slotStart: number | null;
  contactEmail: string | null;
  amountThb: number | null;
}

async function loadContext(ticketId: string): Promise<MailContext | null> {
  const db = await getAppDB();
  const row = await db
    .prepare(
      `SELECT t.id AS ticket_id, t.customer_ref, t.nickname, t.kind, t.reader_id,
              r.display_name, r.notify_email,
              b.id AS booking_id, b.kind AS booking_kind, b.slot_start, b.contact_email,
              (SELECT amount_satang FROM payments p WHERE p.ticket_id = t.id AND p.status IN ('paid', 'refunded')
                ORDER BY p.created_at DESC LIMIT 1) AS amount_satang
         FROM queue_tickets t
         JOIN readers r ON r.id = t.reader_id
         JOIN bookings b ON b.ticket_id = t.id
        WHERE t.id = ?
        ORDER BY b.created_at DESC LIMIT 1`
    )
    .bind(ticketId)
    .first<{
      ticket_id: string;
      customer_ref: string;
      nickname: string | null;
      kind: string;
      reader_id: string;
      display_name: string;
      notify_email: string | null;
      booking_id: string;
      booking_kind: string | null;
      slot_start: number;
      contact_email: string | null;
      amount_satang: number | null;
    }>();
  if (!row) return null;
  return {
    ticketId: row.ticket_id,
    customerRef: row.customer_ref,
    nickname: row.nickname || "ลูกดวง",
    kind: row.kind === "booking" ? "booking" : "walkup",
    readerId: row.reader_id,
    readerName: row.display_name,
    readerEmail: row.notify_email,
    bookingId: row.booking_id,
    slotStart: row.booking_kind === "walkup" ? null : Number(row.slot_start),
    contactEmail: row.contact_email,
    amountThb: row.amount_satang ? Number(row.amount_satang) / 100 : null,
  };
}

function whenText(ctx: MailContext): string {
  return ctx.slotStart ? formatSlotRange(ctx.slotStart, true) : "คิวสด · คุยทันทีที่ถึงคิว";
}

function detailBox(rows: [string, string][]): string {
  return `<table role="presentation" style="width:100%;border-collapse:collapse;margin:20px 0;background:#F3EDE2;border:1px solid #D9C8AC;border-radius:8px;">
    ${rows
      .map(
        ([k, v]) =>
          `<tr><td style="padding:10px 14px;color:#6F5B4A;font-size:13px;white-space:nowrap;vertical-align:top;">${escapeHtml(k)}</td><td style="padding:10px 14px;color:#2E211A;font-size:14px;font-weight:bold;">${escapeHtml(v)}</td></tr>`
      )
      .join("")}
  </table>`;
}

function button(href: string, label: string): string {
  return `<div class="btn-container"><a href="${escapeHtml(href)}" class="btn">${escapeHtml(label)}</a></div>`;
}

async function safeSend(scope: string, to: string | null, subject: string, html: string, text: string): Promise<boolean> {
  if (!to) return false;
  try {
    await sendEmail(to, subject, html, text);
    return true;
  } catch (err) {
    recordCaughtError(`booking-mail:${scope}`, err);
    return false;
  }
}

/** จองสิทธิ์ส่งอีเมลหนึ่งชนิดของใบจองนี้ — true = ได้สิทธิ์ (ยังไม่เคยส่ง) */
async function claim(bookingId: string, column: "confirm_email_at" | "reminder_24h_at" | "reminder_1h_at"): Promise<boolean> {
  const db = await getAppDB();
  const res = await db
    .prepare(`UPDATE bookings SET ${column} = ? WHERE id = ? AND ${column} IS NULL`)
    .bind(Date.now(), bookingId)
    .run();
  return (res.meta?.changes ?? 0) > 0;
}

/* ── อีเมลแต่ละชนิด ───────────────────────────────────────────────────────── */

/** ยืนยันนัด/คิว (ลูกค้า) + แจ้งนัดใหม่ (แม่หมอ) — เรียกทันทีหลังเงินเข้า */
export async function sendBookingConfirmed(ticketId: string): Promise<void> {
  try {
    const ctx = await loadContext(ticketId);
    if (!ctx || !(await claim(ctx.bookingId, "confirm_email_at"))) return;
    const link = await bookingAccessUrl(ctx.ticketId, ctx.customerRef, ctx.slotStart);
    const scheduled = Boolean(ctx.slotStart);
    const title = scheduled ? "นัดของคุณยืนยันแล้ว" : "คุณอยู่ในคิวแล้ว";
    const rows: [string, string][] = [
      ["แม่หมอ", ctx.readerName],
      [scheduled ? "เวลานัด" : "รูปแบบ", whenText(ctx)],
      ["ระยะเวลา", `ตัวต่อตัว ${CONSULTATION_MINUTES} นาที · วิดีโอคอลในเว็บ หรือ LINE`],
      ...(ctx.amountThb ? ([["ชำระแล้ว", `${ctx.amountThb.toLocaleString("th-TH")} บาท`]] as [string, string][]) : []),
    ];
    const calendar = ctx.slotStart
      ? `<p style="text-align:center;font-size:13px;"><a href="${escapeHtml(
          googleCalendarUrl({
            slotStart: ctx.slotStart,
            title: `ปรึกษาดวงกับ ${ctx.readerName} · SeerTarot`,
            details: `เปิดลิงก์นี้ตอนถึงเวลานัด: ${link}`,
            location: link,
          })
        )}" style="color:#8F5C1A;">+ เพิ่มลง Google Calendar</a></p>`
      : "";
    const policy = scheduled
      ? `ยกเลิกหรือเลื่อนนัดได้ฟรีก่อนเวลานัด ${FREE_CANCEL_HOURS} ชม. (เลื่อนได้ ${MAX_RESCHEDULES} ครั้ง) คืนเงินเต็มจำนวน · น้อยกว่า ${FREE_CANCEL_HOURS} ชม. ไม่คืนเงิน · แม่หมอยกเลิกหรือไม่มาตามนัด คืนเงินเต็มอัตโนมัติ`
      : "ยกเลิกได้ตลอดระหว่างรอคิว คืนเงินเต็มจำนวน · แม่หมอปิดคิวก่อนถึงตาคุณ คืนเงินเต็มอัตโนมัติ";
    const html = baseLayout(
      `<h1>${title}</h1>
       <p>สวัสดีคุณ${escapeHtml(ctx.nickname)}</p>
       <p>${scheduled ? "ถึงเวลานัด กดปุ่มด้านล่างแล้วรอแม่หมอเริ่มคุย ปุ่มเข้าห้องวิดีโอคอลจะขึ้นเอง" : "เปิดหน้าคิวทิ้งไว้ได้เลย ถึงตาคุณแล้วปุ่มเข้าห้องวิดีโอคอลจะขึ้นเอง"}</p>
       ${detailBox(rows)}
       ${button(link, scheduled ? "ดูนัดของฉัน" : "เปิดหน้าคิว")}
       ${calendar}
       <div class="fallback">${escapeHtml(policy)}<br><br>ลิงก์นี้เปิดนัดของคุณได้ทุกเครื่อง เก็บอีเมลนี้ไว้ และอย่าส่งต่อให้ผู้อื่น</div>`,
      `${title} — SeerTarot`
    );
    const text = [
      `${title} — SeerTarot`,
      "",
      `สวัสดีคุณ${ctx.nickname}`,
      ...rows.map(([k, v]) => `${k}: ${v}`),
      "",
      `เปิดนัดของคุณ: ${link}`,
      "",
      policy,
    ].join("\n");
    await safeSend("confirm", ctx.contactEmail, `${title} · ${ctx.readerName} · ${whenText(ctx)}`, html, text);
    await notifyReader(ctx, "new");
  } catch (err) {
    recordCaughtError("booking-mail:confirm", err);
  }
}

/** เตือนนัด (ลูกค้า) — เรียกจาก cron · ส่งครั้งเดียวต่อชนิด */
export async function sendBookingReminder(ticketId: string, kind: ReminderKind): Promise<boolean> {
  try {
    const ctx = await loadContext(ticketId);
    if (!ctx || !ctx.slotStart || !ctx.contactEmail) return false;
    if (!(await claim(ctx.bookingId, kind === "24h" ? "reminder_24h_at" : "reminder_1h_at"))) return false;
    const link = await bookingAccessUrl(ctx.ticketId, ctx.customerRef, ctx.slotStart);
    const title = kind === "24h" ? "พรุ่งนี้มีนัดปรึกษาแม่หมอ" : "อีกไม่ถึงชั่วโมงถึงเวลานัด";
    const tip =
      kind === "24h"
        ? `ถ้าไม่สะดวก ยังเลื่อนหรือยกเลิกได้ฟรีจนถึง ${FREE_CANCEL_HOURS} ชม. ก่อนนัด`
        : "เตรียมที่เงียบ ๆ เปิดกล้องและไมค์ แล้วกดปุ่มด้านล่างรอไว้ได้เลย";
    const html = baseLayout(
      `<h1>${title}</h1>
       <p>สวัสดีคุณ${escapeHtml(ctx.nickname)}</p>
       ${detailBox([
         ["แม่หมอ", ctx.readerName],
         ["เวลานัด", whenText(ctx)],
       ])}
       <p>${escapeHtml(tip)}</p>
       ${button(link, "เปิดหน้านัดของฉัน")}`,
      `${title} — SeerTarot`
    );
    const text = [`${title} — SeerTarot`, "", `แม่หมอ: ${ctx.readerName}`, `เวลานัด: ${whenText(ctx)}`, "", tip, "", link].join("\n");
    return await safeSend(`reminder_${kind}`, ctx.contactEmail, `${title} · ${whenText(ctx)}`, html, text);
  } catch (err) {
    recordCaughtError("booking-mail:reminder", err);
    return false;
  }
}

/** ยกเลิก (ลูกค้า + แม่หมอ) — บอกผลเรื่องเงินชัด ๆ */
export async function sendBookingCancelled(
  ticketId: string,
  by: "customer" | "reader" | "system",
  refundStatus: "refunded" | "none" | "failed" | null
): Promise<void> {
  try {
    const ctx = await loadContext(ticketId);
    if (!ctx) return;
    const money =
      refundStatus === "refunded"
        ? "คืนเงินเต็มจำนวนแล้ว เงินจะกลับเข้าช่องทางที่ชำระภายใน 5–10 วันทำการ (ขึ้นกับธนาคาร)"
        : refundStatus === "failed"
          ? "ระบบคืนเงินขัดข้องชั่วคราว ทีมงานจะคืนเงินให้ภายใน 3 วันทำการ"
          : refundStatus === "none"
            ? `ยกเลิกน้อยกว่า ${FREE_CANCEL_HOURS} ชม. ก่อนนัด จึงไม่มีการคืนเงินตามเงื่อนไข`
            : "ไม่มีการตัดเงิน";
    const title = by === "reader" ? "แม่หมอยกเลิกนัดของคุณ" : "ยกเลิกนัดเรียบร้อย";
    const rebook = `${SITE_ORIGIN}/readers/${encodeURIComponent(ctx.readerId)}`;
    const html = baseLayout(
      `<h1>${title}</h1>
       <p>สวัสดีคุณ${escapeHtml(ctx.nickname)}</p>
       ${detailBox([
         ["แม่หมอ", ctx.readerName],
         [ctx.slotStart ? "เวลานัด" : "รูปแบบ", whenText(ctx)],
         ["การเงิน", money],
       ])}
       ${button(rebook, "จองเวลาใหม่")}`,
      `${title} — SeerTarot`
    );
    const text = [`${title} — SeerTarot`, "", `แม่หมอ: ${ctx.readerName}`, whenText(ctx), money, "", `จองใหม่: ${rebook}`].join("\n");
    await safeSend("cancel", ctx.contactEmail, `${title} · ${whenText(ctx)}`, html, text);
    if (by !== "reader") await notifyReader(ctx, "cancelled");
  } catch (err) {
    recordCaughtError("booking-mail:cancel", err);
  }
}

/** เลื่อนนัด (ลูกค้า + แม่หมอ) */
export async function sendBookingRescheduled(ticketId: string, previousSlot: number): Promise<void> {
  try {
    const ctx = await loadContext(ticketId);
    if (!ctx || !ctx.slotStart) return;
    const link = await bookingAccessUrl(ctx.ticketId, ctx.customerRef, ctx.slotStart);
    const html = baseLayout(
      `<h1>เลื่อนนัดเรียบร้อย</h1>
       <p>สวัสดีคุณ${escapeHtml(ctx.nickname)}</p>
       ${detailBox([
         ["แม่หมอ", ctx.readerName],
         ["เวลาใหม่", whenText(ctx)],
         ["เวลาเดิม", formatSlotRange(previousSlot, true)],
       ])}
       ${button(link, "ดูนัดของฉัน")}`,
      "เลื่อนนัดเรียบร้อย — SeerTarot"
    );
    const text = ["เลื่อนนัดเรียบร้อย — SeerTarot", "", `เวลาใหม่: ${whenText(ctx)}`, `เวลาเดิม: ${formatSlotRange(previousSlot, true)}`, "", link].join("\n");
    await safeSend("reschedule", ctx.contactEmail, `เลื่อนนัดเป็น ${whenText(ctx)}`, html, text);
    await notifyReader(ctx, "rescheduled", previousSlot);
  } catch (err) {
    recordCaughtError("booking-mail:reschedule", err);
  }
}

/** แจ้งแม่หมอ — ไม่มีคำถามของลูกค้าในอีเมล (PDPA: อ่านในแผงแม่หมอที่ล็อกอินแล้วเท่านั้น) */
async function notifyReader(ctx: MailContext, event: "new" | "cancelled" | "rescheduled", previousSlot?: number): Promise<void> {
  if (!ctx.readerEmail) return;
  const consoleUrl = `${SITE_ORIGIN}/readers/console`;
  const title =
    event === "new"
      ? ctx.slotStart
        ? "มีนัดใหม่ (ชำระเงินแล้ว)"
        : "มีลูกค้าเข้าคิวสด (ชำระเงินแล้ว)"
      : event === "cancelled"
        ? "ลูกค้ายกเลิกนัด"
        : "ลูกค้าเลื่อนนัด";
  const rows: [string, string][] = [
    ["ลูกค้า", `คุณ${ctx.nickname}`],
    [ctx.slotStart ? "เวลานัด" : "รูปแบบ", whenText(ctx)],
    ...(previousSlot ? ([["เวลาเดิม", formatSlotRange(previousSlot, true)]] as [string, string][]) : []),
  ];
  const html = baseLayout(
    `<h1>${title}</h1>
     ${detailBox(rows)}
     <p>สรุปคำถามของลูกค้าโดย AI อยู่ในแผงแม่หมอ (เปิดด้วยลิงก์ส่วนตัวที่ได้รับจากทีมงาน)</p>
     <p style="font-size:12px;color:#6F5B4A;">${escapeHtml(consoleUrl)}</p>`,
    `${title} — SeerTarot`
  );
  const text = [`${title} — SeerTarot`, "", ...rows.map(([k, v]) => `${k}: ${v}`), "", "ดูรายละเอียดในแผงแม่หมอ"].join("\n");
  await safeSend(`reader_${event}`, ctx.readerEmail, `${title} · ${whenText(ctx)}`, html, text);
}

/** แจ้งคนที่ลงชื่อรอว่า "แม่หมอมีเวลาว่างแล้ว" — ส่งครั้งเดียวแล้วลบรายชื่อทิ้ง (PDPA) */
export async function sendWaitlistOpening(email: string, readerId: string, readerName: string, nextSlot: number): Promise<boolean> {
  const url = `${SITE_ORIGIN}/readers/${encodeURIComponent(readerId)}`;
  const html = baseLayout(
    `<h1>${escapeHtml(readerName)} มีเวลาว่างแล้ว</h1>
     <p>คุณลงชื่อไว้ให้แจ้งเมื่อแม่หมอท่านนี้มีเวลาว่าง ตอนนี้มีเวลาว่างใกล้สุด</p>
     ${detailBox([["เวลาว่างใกล้สุด", formatSlotRange(nextSlot, true)]])}
     ${button(url, "เลือกเวลาและจอง")}
     <p style="font-size:12px;color:#6F5B4A;text-align:center;">เวลาว่างจองได้ตามลำดับก่อนหลัง · อีเมลนี้ส่งครั้งเดียว ชื่อของคุณถูกลบออกจากรายการรอแล้ว</p>`,
    "แม่หมอมีเวลาว่างแล้ว — SeerTarot"
  );
  const text = [`${readerName} มีเวลาว่างแล้ว — SeerTarot`, "", `เวลาว่างใกล้สุด: ${formatSlotRange(nextSlot, true)}`, url].join("\n");
  return safeSend("waitlist", email, `${readerName} มีเวลาว่างแล้ว`, html, text);
}
