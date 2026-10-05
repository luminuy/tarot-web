/**
 * 🔔 Web Push บน Cloudflare Workers — WebCrypto ล้วน ไม่พึ่งไลบรารี Node (REFLECTION_JOURNAL_PLAN 1.10)
 * ---------------------------------------------------------------------------
 *  • เข้ารหัสเนื้อหาแบบ aes128gcm ตาม RFC 8291 (Message Encryption for Web Push) + RFC 8188
 *  • ยืนยันตัวผู้ส่งด้วย VAPID (RFC 8292) — JWT ES256 ลงนามด้วยกุญแจ P-256 ของเว็บ
 * ด่าน `scripts/qa/test-pwa.ts` ตรวจกับเวกเตอร์ทดสอบใน RFC 8291 ภาคผนวก A ทุกไบต์
 *
 * กุญแจ (ตั้งเป็น secret บน Cloudflare — ดู docs/PENDING_SETUP.md):
 *   VAPID_PUBLIC_KEY  = base64url ของจุด P-256 แบบไม่บีบอัด 65 ไบต์ (ส่งให้เบราว์เซอร์ตอนสมัครรับแจ้งเตือน)
 *   VAPID_PRIVATE_KEY = base64url ของ d 32 ไบต์
 *   VAPID_SUBJECT     = mailto:ผู้ดูแล (ผู้ให้บริการ push ใช้ติดต่อเมื่อมีปัญหา)
 * ⚠️ เนื้อหาแจ้งเตือนห้ามมีคำถาม/บันทึกส่วนตัวของผู้ใช้ (กติกาความเป็นส่วนตัวข้อ 5)
 */

const enc = new TextEncoder();

export function b64urlEncode(bytes: Uint8Array): string {
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function b64urlDecode(s: string): Uint8Array {
  const clean = s.replace(/\s+/g, "").replace(/-/g, "+").replace(/_/g, "/");
  const bin = atob(clean + "=".repeat((4 - (clean.length % 4)) % 4));
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function concat(...parts: Uint8Array[]): Uint8Array {
  const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0));
  let o = 0;
  for (const p of parts) {
    out.set(p, o);
    o += p.length;
  }
  return out;
}

/** แปลงเป็น ArrayBuffer แท้ — WebCrypto บางรุ่นไม่รับ view ที่เลื่อน offset */
function buf(u: Uint8Array): ArrayBuffer {
  return u.buffer.slice(u.byteOffset, u.byteOffset + u.byteLength) as ArrayBuffer;
}

async function hkdf(salt: Uint8Array, ikm: Uint8Array, info: Uint8Array, length: number): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey("raw", buf(ikm), "HKDF", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "HKDF", hash: "SHA-256", salt: buf(salt), info: buf(info) }, key, length * 8);
  return new Uint8Array(bits);
}

/** กุญแจส่วนตัว P-256 จาก d + จุดสาธารณะแบบไม่บีบอัด (65 ไบต์) */
async function importPrivateKey(d: Uint8Array, publicRaw: Uint8Array, usage: "ECDH" | "ECDSA"): Promise<CryptoKey> {
  if (publicRaw.length !== 65 || publicRaw[0] !== 0x04) throw new Error("public key must be 65-byte uncompressed P-256");
  const jwk: JsonWebKey = {
    kty: "EC",
    crv: "P-256",
    d: b64urlEncode(d),
    x: b64urlEncode(publicRaw.slice(1, 33)),
    y: b64urlEncode(publicRaw.slice(33, 65)),
    ext: true,
  };
  return usage === "ECDH"
    ? crypto.subtle.importKey("jwk", jwk, { name: "ECDH", namedCurve: "P-256" }, false, ["deriveBits"])
    : crypto.subtle.importKey("jwk", jwk, { name: "ECDSA", namedCurve: "P-256" }, false, ["sign"]);
}

export interface EncryptOptions {
  /** สำหรับด่านทดสอบเท่านั้น — ใช้งานจริงสุ่มคู่กุญแจชั่วคราวและ salt ใหม่ทุกข้อความ */
  asPrivate?: Uint8Array;
  asPublic?: Uint8Array;
  salt?: Uint8Array;
  recordSize?: number;
}

/**
 * เข้ารหัสเนื้อหาแจ้งเตือนตาม RFC 8291 — คืน body ที่ส่งให้ผู้ให้บริการ push ได้ทันที
 * `uaPublic` = p256dh ของ subscription (65 ไบต์) · `authSecret` = auth (16 ไบต์)
 * ⚠️ importKey("raw") ตรวจว่าจุดอยู่บนเส้นโค้ง P-256 ให้แล้ว (RFC 8291 §7 บังคับ)
 */
export async function encryptPayload(
  plaintext: Uint8Array,
  uaPublic: Uint8Array,
  authSecret: Uint8Array,
  opts: EncryptOptions = {},
): Promise<Uint8Array> {
  const uaKey = await crypto.subtle.importKey("raw", buf(uaPublic), { name: "ECDH", namedCurve: "P-256" }, false, []);

  let asPrivKey: CryptoKey;
  let asPublic: Uint8Array;
  if (opts.asPrivate && opts.asPublic) {
    asPrivKey = await importPrivateKey(opts.asPrivate, opts.asPublic, "ECDH");
    asPublic = opts.asPublic;
  } else {
    const pair = (await crypto.subtle.generateKey({ name: "ECDH", namedCurve: "P-256" }, true, ["deriveBits"])) as CryptoKeyPair;
    asPrivKey = pair.privateKey;
    asPublic = new Uint8Array(await crypto.subtle.exportKey("raw", pair.publicKey));
  }

  const ecdhSecret = new Uint8Array(await crypto.subtle.deriveBits({ name: "ECDH", public: uaKey }, asPrivKey, 256));
  const keyInfo = concat(enc.encode("WebPush: info\0"), uaPublic, asPublic);
  const ikm = await hkdf(authSecret, ecdhSecret, keyInfo, 32);
  const salt = opts.salt ?? crypto.getRandomValues(new Uint8Array(16));
  const cek = await hkdf(salt, ikm, enc.encode("Content-Encoding: aes128gcm\0"), 16);
  const nonce = await hkdf(salt, ikm, enc.encode("Content-Encoding: nonce\0"), 12);

  const recordSize = opts.recordSize ?? 4096;
  // ระเบียนเดียว: เนื้อหา + 0x02 (ตัวคั่นระเบียนสุดท้าย) · ต้องพอดี rs - 16 (แท็ก AES-GCM)
  if (plaintext.length + 1 + 16 > recordSize) throw new Error("payload too large for a single record");
  const padded = concat(plaintext, new Uint8Array([0x02]));
  const aesKey = await crypto.subtle.importKey("raw", buf(cek), { name: "AES-GCM" }, false, ["encrypt"]);
  const ciphertext = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv: buf(nonce), tagLength: 128 }, aesKey, buf(padded)));

  const header = new Uint8Array(16 + 4 + 1 + asPublic.length);
  header.set(salt, 0);
  new DataView(header.buffer).setUint32(16, recordSize, false);
  header[20] = asPublic.length;
  header.set(asPublic, 21);
  return concat(header, ciphertext);
}

/** JWT ของ VAPID (ES256) — `aud` = origin ของ endpoint · อายุ ≤ 24 ชม. ตามข้อกำหนด */
export async function vapidJwt(audience: string, subject: string, privateB64: string, publicB64: string, ttlSec = 12 * 3600): Promise<string> {
  const header = b64urlEncode(enc.encode(JSON.stringify({ typ: "JWT", alg: "ES256" })));
  const payload = b64urlEncode(
    enc.encode(JSON.stringify({ aud: audience, exp: Math.floor(Date.now() / 1000) + Math.min(ttlSec, 24 * 3600), sub: subject })),
  );
  const key = await importPrivateKey(b64urlDecode(privateB64), b64urlDecode(publicB64), "ECDSA");
  // WebCrypto คืนลายเซ็นแบบ r||s (IEEE P1363) ซึ่งตรงกับรูปแบบที่ JWS ES256 ต้องการพอดี
  const sig = new Uint8Array(await crypto.subtle.sign({ name: "ECDSA", hash: "SHA-256" }, key, enc.encode(`${header}.${payload}`)));
  return `${header}.${payload}.${b64urlEncode(sig)}`;
}

export interface PushSubscriptionData {
  endpoint: string;
  p256dh: string;
  auth: string;
}

export interface PushMessage {
  title: string;
  body: string;
  /** ลิงก์ในเว็บเราเท่านั้น (เส้นทางขึ้นต้นด้วย /) */
  url: string;
  tag?: string;
}

export function vapidConfigured(): boolean {
  return Boolean(process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY && process.env.VAPID_SUBJECT);
}

/**
 * ส่งแจ้งเตือน 1 ฉบับ — `gone` = subscription หมดอายุ/ถูกยกเลิก (404/410) ผู้เรียกต้องลบทิ้ง
 * ⚠️ รับเฉพาะ endpoint https ของผู้ให้บริการ push ที่รู้จัก — กันใช้เว็บเรายิงคำขอไปที่อื่น (SSRF)
 */
export async function sendWebPush(
  sub: PushSubscriptionData,
  message: PushMessage,
  opts: { ttl?: number; urgency?: "very-low" | "low" | "normal" | "high" } = {},
): Promise<{ ok: boolean; status: number; gone: boolean }> {
  const pub = process.env.VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT;
  if (!pub || !priv || !subject) return { ok: false, status: 0, gone: false };
  if (!isAllowedPushEndpoint(sub.endpoint)) return { ok: false, status: 0, gone: true };

  const body = await encryptPayload(enc.encode(JSON.stringify(message)), b64urlDecode(sub.p256dh), b64urlDecode(sub.auth));
  const jwt = await vapidJwt(new URL(sub.endpoint).origin, subject, priv, pub);
  const res = await fetch(sub.endpoint, {
    method: "POST",
    headers: {
      "Content-Encoding": "aes128gcm",
      "Content-Type": "application/octet-stream",
      TTL: String(opts.ttl ?? 6 * 3600),
      Urgency: opts.urgency ?? "normal",
      Authorization: `vapid t=${jwt}, k=${pub}`,
      ...(message.tag ? { Topic: message.tag.replace(/[^A-Za-z0-9_-]/g, "").slice(0, 32) } : {}),
    },
    body: buf(body),
  });
  return { ok: res.ok, status: res.status, gone: res.status === 404 || res.status === 410 };
}

/** ผู้ให้บริการ push ของเบราว์เซอร์หลัก — endpoint อื่นถูกปฏิเสธ */
const PUSH_HOST_SUFFIXES = [
  ".googleapis.com", // Chrome / Edge / Android (fcm.googleapis.com)
  ".push.services.mozilla.com", // Firefox
  ".push.apple.com", // Safari / iOS (web.push.apple.com)
  ".notify.windows.com", // Edge รุ่นเก่า (WNS)
];

export function isAllowedPushEndpoint(endpoint: string): boolean {
  try {
    const u = new URL(endpoint);
    if (u.protocol !== "https:") return false;
    const host = `.${u.hostname}`;
    return PUSH_HOST_SUFFIXES.some((s) => host.endsWith(s));
  } catch {
    return false;
  }
}
