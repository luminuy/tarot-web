/**
 * ระบบแฮชและตรวจสอบรหัสผ่านด้วย Web Crypto API (PBKDF2-HMAC-SHA256 + Server-side Pepper)
 * ออกแบบมาเพื่อทำงานบน Cloudflare Workers / Node.js runtime โดยไม่มี external dependencies
 */

const ITERATIONS = 150_000;
const KEYLEN = 32; // 256 bits

/**
 * แปลง Uint8Array เป็น Base64URL string
 */
export function b64u(buffer: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < buffer.byteLength; i++) {
    binary += String.fromCharCode(buffer[i]);
  }
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

/**
 * แปลง Base64URL string กลับเป็น Uint8Array
 */
export function unb64u(base64url: string): Uint8Array {
  let base64 = base64url.replace(/-/g, "+").replace(/_/g, "/");
  while (base64.length % 4) {
    base64 += "=";
  }
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * เปรียบเทียบ Byte Array แบบ Constant-Time เพื่อป้องกัน Timing Attacks
 */
export function timingSafeEqualBytes(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) {
    return false;
  }
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a[i] ^ b[i];
  }
  return diff === 0;
}

/**
 * นำรหัสผ่านไปทำ HMAC-SHA256 กับ Server-side Pepper ก่อนส่งเข้า PBKDF2
 */
async function pepper(pw: string): Promise<ArrayBuffer> {
  const secret = process.env.PASSWORD_PEPPER;
  if (!secret || secret.length < 24) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("[Security] PASSWORD_PEPPER (≥24 ตัวอักษร) ต้องถูกกำหนดใน Environment ของ Production");
    }
  }
  const pepperKey = secret || "dev-pepper-default-secret-string-at-least-24-chars";
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(pepperKey),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  return crypto.subtle.sign("HMAC", key, new TextEncoder().encode(pw));
}

/**
 * แฮชรหัสผ่านด้วย PBKDF2-HMAC-SHA256
 * @returns PHC string format: `pbkdf2$sha256$<iterations>$<saltB64url>$<hashB64url>`
 */
export async function hashPassword(pw: string): Promise<string> {
  if (!pw || typeof pw !== "string") {
    throw new Error("รหัสผ่านไม่ถูกต้อง");
  }
  const peppered = await pepper(pw);
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const keyMat = await crypto.subtle.importKey("raw", peppered, "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt: salt as unknown as BufferSource, iterations: ITERATIONS, hash: "SHA-256" },
    keyMat,
    KEYLEN * 8
  );
  return `pbkdf2$sha256$${ITERATIONS}$${b64u(salt)}$${b64u(new Uint8Array(bits))}`;
}

/**
 * ตรวจสอบรหัสผ่านที่ส่งมาเทียบกับ PHC string ที่บันทึกไว้ในฐานข้อมูล
 */
export async function verifyPassword(pw: string, stored: string): Promise<boolean> {
  if (!pw || !stored || typeof pw !== "string" || typeof stored !== "string") {
    return false;
  }
  const parts = stored.split("$");
  if (parts.length !== 5 || parts[0] !== "pbkdf2" || parts[1] !== "sha256") {
    return false;
  }
  const [, , iterStr, saltB64, hashB64] = parts;
  const iterations = Number(iterStr);
  if (!iterations || iterations <= 0) {
    return false;
  }

  try {
    const salt = unb64u(saltB64);
    const expectedHash = unb64u(hashB64);
    const peppered = await pepper(pw);
    const keyMat = await crypto.subtle.importKey("raw", peppered, "PBKDF2", false, ["deriveBits"]);
    const derivedBits = new Uint8Array(
      await crypto.subtle.deriveBits(
        { name: "PBKDF2", salt: salt as unknown as BufferSource, iterations, hash: "SHA-256" },
        keyMat,
        expectedHash.length * 8
      )
    );

    return timingSafeEqualBytes(derivedBits, expectedHash);
  } catch (err) {
    console.error("[verifyPassword Error]", err);
    return false;
  }
}
