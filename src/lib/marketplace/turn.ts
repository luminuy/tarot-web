/**
 * 📡 ตัวออกรหัสผ่าน TURN ชั่วคราวจาก Cloudflare Realtime (วิดีโอคอลตัวต่อตัว)
 * ---------------------------------------------------------------------------
 * ทุกสายถูกบังคับให้วิ่งผ่าน TURN (`iceTransportPolicy: "relay"`) — ลูกค้ากับแม่หมอ
 * จึงไม่เห็น IP ของกันและกัน (เจ้าของเคาะ 2026-10-02) · ภาพ 720p ตัวต่อตัว
 * ใช้ราว 1.35 GB/ชม. ทั้งสองฝั่งรวมกัน ซึ่งอยู่ในโควตาฟรี 1,000 GB/เดือนของ Cloudflare
 *
 * ⚠️ คีย์ API ต้องอยู่ฝั่งเซิร์ฟเวอร์เท่านั้น — เบราว์เซอร์ได้แค่ username/credential
 *    ที่มีอายุสั้น และถูกเพิกถอนทันทีเมื่อวางสาย
 *
 * ตั้งค่า (ดู docs/PENDING_SETUP.md):
 *   CLOUDFLARE_TURN_KEY_ID         — Turn Token ID จาก Dashboard › Realtime › TURN Server
 *   CLOUDFLARE_TURN_KEY_API_TOKEN  — API Token ของคีย์เดียวกัน
 * ไม่ได้ตั้ง = ปุ่มวิดีโอคอลไม่โผล่ (ลูกค้ายังคุยผ่าน LINE ได้ตามเดิม)
 */

const TURN_API = "https://rtc.live.cloudflare.com/v1/turn/keys";

/** อายุรหัสผ่าน TURN — ยาวกว่าสายที่นานที่สุด (1.30 ชม.) พอสมควร แต่ไม่ค้างทั้งวัน */
export const TURN_CREDENTIAL_TTL_SEC = 3 * 60 * 60;

export interface IceServerConfig {
  urls: string[];
  username?: string;
  credential?: string;
}

interface TurnKeys {
  keyId: string;
  apiToken: string;
}

function readTurnKeys(): TurnKeys | null {
  const keyId = process.env.CLOUDFLARE_TURN_KEY_ID?.trim();
  const apiToken = process.env.CLOUDFLARE_TURN_KEY_API_TOKEN?.trim();
  if (!keyId || !apiToken) return null;
  return { keyId, apiToken };
}

export function isTurnConfigured(): boolean {
  return readTurnKeys() !== null;
}

/**
 * คัดเฉพาะ URL ของ TURN ที่ใช้ได้จริงในโหมด relay
 *   • ตัด `stun:` — โหมด relay ไม่ใช้ และ STUN คือสิ่งที่เผย IP สาธารณะ
 *   • ตัดพอร์ต 53 — Cloudflare เตือนว่าเบราว์เซอร์บล็อก จะรอจนหมดเวลาเปล่า ๆ
 */
export function filterRelayIceServers(servers: IceServerConfig[]): IceServerConfig[] {
  const out: IceServerConfig[] = [];
  for (const s of servers) {
    if (!s.username || !s.credential) continue;
    const urls = (Array.isArray(s.urls) ? s.urls : [s.urls]).filter(
      (u) => typeof u === "string" && /^turns?:/.test(u) && !/:53(\?|$)/.test(u),
    );
    if (urls.length > 0) out.push({ urls, username: s.username, credential: s.credential });
  }
  return out;
}

/** ขอรหัสผ่าน TURN ชุดใหม่ — คืน null เมื่อยังไม่ได้ตั้งค่า หรือ Cloudflare ตอบผิดพลาด */
export async function generateTurnIceServers(): Promise<IceServerConfig[] | null> {
  const keys = readTurnKeys();
  if (!keys) return null;
  try {
    const res = await fetch(`${TURN_API}/${encodeURIComponent(keys.keyId)}/credentials/generate-ice-servers`, {
      method: "POST",
      headers: { Authorization: `Bearer ${keys.apiToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({ ttl: TURN_CREDENTIAL_TTL_SEC }),
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) {
      console.error("[TURN] generate-ice-servers failed", res.status);
      return null;
    }
    const json = (await res.json()) as { iceServers?: IceServerConfig[] | IceServerConfig };
    const raw = Array.isArray(json.iceServers) ? json.iceServers : json.iceServers ? [json.iceServers] : [];
    const servers = filterRelayIceServers(raw);
    return servers.length > 0 ? servers : null;
  } catch (err) {
    console.error("[TURN] generate-ice-servers error", err);
    return null;
  }
}

/** เพิกถอนรหัสผ่าน TURN ทันที (วางสาย) — ล้มเหลวก็ไม่เป็นไร เพราะหมดอายุเองตาม TTL */
export async function revokeTurnCredential(username: string | null | undefined): Promise<void> {
  const keys = readTurnKeys();
  if (!keys || !username) return;
  try {
    await fetch(
      `${TURN_API}/${encodeURIComponent(keys.keyId)}/credentials/${encodeURIComponent(username)}/revoke`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${keys.apiToken}`, "Content-Type": "application/json" },
        signal: AbortSignal.timeout(5000),
      },
    );
  } catch (err) {
    console.warn("[TURN] revoke failed (จะหมดอายุเองตาม TTL)", err);
  }
}
