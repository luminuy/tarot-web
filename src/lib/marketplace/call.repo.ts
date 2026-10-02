import { getAppDB } from "@/lib/platform/db";

/**
 * 📹 ห้องวิดีโอคอลตัวต่อตัว ลูกค้า ↔ แม่หมอ — ชั้นนัดเชื่อมสาย (Signaling) บน D1
 * ---------------------------------------------------------------------------
 * ภาพและเสียงไม่ผ่านเซิร์ฟเวอร์เรา: เบราว์เซอร์สองฝั่งคุยกันผ่าน Cloudflare TURN
 * ตารางนี้มีหน้าที่เดียวคือส่ง "ใบนัด" (SDP) ข้ามฝั่ง แบบไม่ต้องใช้ WebSocket
 *
 *   ลูกค้า  = ฝั่งเสนอ (offer)    — ส่ง offer ทุกครั้งที่ `round` เปลี่ยน
 *   แม่หมอ = ฝั่งตอบ  (answer)   — ตอบ offer ของ `round` ปัจจุบัน
 *   ต่อสายใหม่ = `round + 1` แล้วล้าง offer/answer → ลูกค้าเห็นแล้วส่ง offer ใหม่เอง
 *
 * ใช้ ICE แบบไม่ trickle (รอเก็บ candidate ครบก่อนส่ง) จึงมีการเขียนแค่ 2 ครั้งต่อการต่อสาย
 *
 * 🔒 ซ่อน IP: ไคลเอนต์ทั้งสองฝั่งบังคับ `iceTransportPolicy: "relay"` และเซิร์ฟเวอร์
 *    ล้าง SDP ซ้ำอีกชั้นด้วย `sanitizeRelaySdp` — ไคลเอนต์ที่ถูกดัดแปลงก็ส่ง IP จริงข้ามฝั่งไม่ได้
 */

export type CallRole = "customer" | "reader";

/** ชื่อคอลัมน์ต่อบทบาท — ห้ามประกอบชื่อคอลัมน์จากค่าที่รับเข้ามาตรง ๆ */
const ROLE_COLUMNS = {
  customer: { seen: "customer_seen_at", turnUser: "customer_turn_user" },
  reader: { seen: "reader_seen_at", turnUser: "reader_turn_user" },
} as const;

/** อีกฝ่ายถือว่า "อยู่ในห้อง" ถ้ายังถามสถานะมาภายในช่วงนี้ */
export const CALL_PRESENCE_WINDOW_MS = 15_000;
/** ไม่เขียนเวลาล่าสุดถี่กว่านี้ — ฝั่งเบราว์เซอร์ถามทุก 1.5–4 วินาที */
const PRESENCE_WRITE_EVERY_MS = 8_000;
/** SDP ของเสียง+ภาพหนึ่งชุดราว 3–8 KB — เผื่อไว้แต่ไม่ให้ใช้ D1 เป็นที่ฝากของ */
export const MAX_SDP_LENGTH = 32_000;

interface RawCallRow {
  ticket_id: string;
  round: number;
  offer_sdp: string | null;
  answer_sdp: string | null;
  customer_seen_at: number | null;
  reader_seen_at: number | null;
  customer_turn_user: string | null;
  reader_turn_user: string | null;
  ended_at: number | null;
  ended_by: string | null;
  created_at: number;
  updated_at: number;
}

export interface CallView {
  round: number;
  /** offer ของรอบปัจจุบัน — ส่งให้แม่หมอเท่านั้น */
  offer: string | null;
  /** answer ของรอบปัจจุบัน — ส่งให้ลูกค้าเท่านั้น */
  answer: string | null;
  peerPresent: boolean;
  ended: boolean;
  endedBy: CallRole | null;
}

export type SdpCheck = { ok: true; sdp: string } | { ok: false; reason: "invalid" | "too_large" | "relay_required" };

/**
 * ล้าง SDP ให้เหลือเฉพาะเส้นทางผ่าน TURN
 *   1. ตัดทุก `a=candidate` ที่ไม่ใช่ `typ relay` (host / srflx / prflx = IP จริงของเครื่อง)
 *   2. แทน `raddr`/`rport` ของ candidate แบบ relay เป็น 0.0.0.0/0 — บางเบราว์เซอร์ใส่
 *      IP สาธารณะของผู้ใช้ไว้ในช่องนี้ ทั้งที่ไม่จำเป็นต่อการเชื่อมต่อเลย
 *   3. ต้องเหลือ relay อย่างน้อยหนึ่งเส้น (เราไม่ใช้ trickle — ไม่มี = ต่อไม่ติดแน่นอน)
 */
export function sanitizeRelaySdp(input: unknown): SdpCheck {
  if (typeof input !== "string" || !input.startsWith("v=0")) return { ok: false, reason: "invalid" };
  if (input.length > MAX_SDP_LENGTH) return { ok: false, reason: "too_large" };

  const lines = input.split(/\r?\n/);
  const kept: string[] = [];
  let relayCount = 0;
  for (const line of lines) {
    if (line.startsWith("a=candidate:")) {
      if (!/\styp\srelay(\s|$)/.test(line)) continue;
      relayCount += 1;
      kept.push(line.replace(/\sraddr\s\S+\srport\s\d+/, " raddr 0.0.0.0 rport 0"));
      continue;
    }
    kept.push(line);
  }
  if (relayCount === 0) return { ok: false, reason: "relay_required" };
  // SDP ต้องจบด้วย CRLF ทุกบรรทัด (RFC 4566) — ตัดบรรทัดว่างท้ายแล้วต่อใหม่
  while (kept.length > 0 && kept[kept.length - 1] === "") kept.pop();
  return { ok: true, sdp: `${kept.join("\r\n")}\r\n` };
}

async function readRow(ticketId: string): Promise<RawCallRow | null> {
  const db = await getAppDB();
  return db.prepare("SELECT * FROM call_sessions WHERE ticket_id = ? LIMIT 1").bind(ticketId).first<RawCallRow>();
}

function toView(row: RawCallRow | null, role: CallRole, now: number): CallView {
  if (!row) return { round: 0, offer: null, answer: null, peerPresent: false, ended: false, endedBy: null };
  const peerSeen = role === "customer" ? row.reader_seen_at : row.customer_seen_at;
  return {
    round: row.round,
    offer: role === "reader" ? row.offer_sdp : null,
    answer: role === "customer" ? row.answer_sdp : null,
    peerPresent: !row.ended_at && Boolean(peerSeen && now - peerSeen < CALL_PRESENCE_WINDOW_MS),
    ended: Boolean(row.ended_at),
    endedBy: row.ended_by === "customer" || row.ended_by === "reader" ? row.ended_by : null,
  };
}

/** อ่านสถานะห้องของบทบาทนั้น พร้อมบันทึกว่ายังอยู่ในห้อง (เขียนไม่ถี่กว่า 8 วินาที) */
export async function getCallView(ticketId: string, role: CallRole): Promise<CallView> {
  const now = Date.now();
  const db = await getAppDB();
  const col = ROLE_COLUMNS[role].seen;
  await db
    .prepare(
      `UPDATE call_sessions SET ${col} = ? WHERE ticket_id = ? AND ended_at IS NULL AND (${col} IS NULL OR ${col} < ?)`,
    )
    .bind(now, ticketId, now - PRESENCE_WRITE_EVERY_MS)
    .run();
  return toView(await readRow(ticketId), role, now);
}

/**
 * เข้าห้อง — สร้างห้องถ้ายังไม่มี · ถ้ามีห้องอยู่แล้ว (อีกฝั่งรออยู่ / เราเพิ่งรีเฟรชหน้า /
 * เคยวางสายไปแล้ว) ให้ขึ้นรอบใหม่และล้าง offer/answer เสมอ — เครื่องที่เพิ่งเข้ามา
 * มี RTCPeerConnection ใหม่ ใบนัดชุดเก่าใช้กับมันไม่ได้แล้ว
 * คืนชื่อผู้ใช้ TURN ชุดเก่าของบทบาทนี้ (ถ้ามี) ให้ผู้เรียกสั่งเพิกถอน
 */
export async function joinCall(
  ticketId: string,
  role: CallRole,
  turnUser: string | null,
): Promise<{ view: CallView; previousTurnUser: string | null }> {
  const db = await getAppDB();
  const now = Date.now();
  const cols = ROLE_COLUMNS[role];
  const existing = await readRow(ticketId);

  if (!existing) {
    await db
      .prepare(
        `INSERT INTO call_sessions (ticket_id, round, ${cols.seen}, ${cols.turnUser}, created_at, updated_at)
         VALUES (?, 1, ?, ?, ?, ?)
         ON CONFLICT(ticket_id) DO UPDATE SET ${cols.seen} = excluded.${cols.seen}, ${cols.turnUser} = excluded.${cols.turnUser}, updated_at = excluded.updated_at`,
      )
      .bind(ticketId, now, turnUser, now, now)
      .run();
  } else {
    await db
      .prepare(
        `UPDATE call_sessions
            SET round = round + 1, offer_sdp = NULL, answer_sdp = NULL, ended_at = NULL, ended_by = NULL,
                ${cols.seen} = ?, ${cols.turnUser} = ?, updated_at = ?
          WHERE ticket_id = ?`,
      )
      .bind(now, turnUser, now, ticketId)
      .run();
  }

  const previousTurnUser = existing ? (role === "customer" ? existing.customer_turn_user : existing.reader_turn_user) : null;
  return {
    view: toView(await readRow(ticketId), role, now),
    previousTurnUser: previousTurnUser && previousTurnUser !== turnUser ? previousTurnUser : null,
  };
}

/** ลูกค้าส่ง offer ของรอบนั้น — รอบไม่ตรง (อีกฝั่งเพิ่งกดต่อสายใหม่) = false */
export async function submitOffer(ticketId: string, round: number, sdp: string): Promise<boolean> {
  const db = await getAppDB();
  const res = await db
    .prepare(
      `UPDATE call_sessions SET offer_sdp = ?, answer_sdp = NULL, updated_at = ?
        WHERE ticket_id = ? AND round = ? AND ended_at IS NULL`,
    )
    .bind(sdp, Date.now(), ticketId, round)
    .run();
  return (res.meta?.changes ?? 0) > 0;
}

/** แม่หมอตอบ offer ของรอบนั้น — ต้องมี offer อยู่ก่อน */
export async function submitAnswer(ticketId: string, round: number, sdp: string): Promise<boolean> {
  const db = await getAppDB();
  const res = await db
    .prepare(
      `UPDATE call_sessions SET answer_sdp = ?, updated_at = ?
        WHERE ticket_id = ? AND round = ? AND offer_sdp IS NOT NULL AND ended_at IS NULL`,
    )
    .bind(sdp, Date.now(), ticketId, round)
    .run();
  return (res.meta?.changes ?? 0) > 0;
}

/** ต่อสายใหม่ (สัญญาณหลุด) — ขึ้นรอบใหม่ ลูกค้าจะส่ง offer ใหม่เอง */
export async function restartCall(ticketId: string): Promise<boolean> {
  const db = await getAppDB();
  const res = await db
    .prepare(
      `UPDATE call_sessions SET round = round + 1, offer_sdp = NULL, answer_sdp = NULL, updated_at = ?
        WHERE ticket_id = ? AND ended_at IS NULL`,
    )
    .bind(Date.now(), ticketId)
    .run();
  return (res.meta?.changes ?? 0) > 0;
}

/**
 * วางสาย — ล้าง SDP ทิ้งทันที (ไม่ต้องรอครบ 7 วัน) และคืนชื่อผู้ใช้ TURN ทั้งสองฝั่ง
 * ให้ผู้เรียกสั่งเพิกถอน · `by = null` = ระบบปิดเอง (เช่นแม่หมอปิดคิว)
 */
export async function endCall(ticketId: string, by: CallRole | null): Promise<string[]> {
  const existing = await readRow(ticketId);
  if (!existing || existing.ended_at) return [];
  const db = await getAppDB();
  const now = Date.now();
  await db
    .prepare(
      `UPDATE call_sessions
          SET ended_at = ?, ended_by = ?, offer_sdp = NULL, answer_sdp = NULL,
              customer_turn_user = NULL, reader_turn_user = NULL, updated_at = ?
        WHERE ticket_id = ? AND ended_at IS NULL`,
    )
    .bind(now, by, now, ticketId)
    .run();
  return [existing.customer_turn_user, existing.reader_turn_user].filter((u): u is string => Boolean(u));
}
