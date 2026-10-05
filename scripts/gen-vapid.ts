/**
 * 🔑 สร้างคู่กุญแจ VAPID สำหรับ Web Push (REFLECTION_JOURNAL_PLAN 1.10)
 * รัน: npx tsx scripts/gen-vapid.ts  แล้วนำค่าไปตั้งเป็น secret บน Cloudflare (ดู docs/PENDING_SETUP.md)
 * ⚠️ ห้าม commit ค่าที่ได้ลงรีโป · เปลี่ยนกุญแจ = ผู้ใช้ทุกคนต้องกดเปิดแจ้งเตือนใหม่
 */
import { b64urlEncode } from "../src/lib/push/webpush";

void (async () => {
  const pair = (await crypto.subtle.generateKey({ name: "ECDSA", namedCurve: "P-256" }, true, ["sign", "verify"])) as CryptoKeyPair;
  const pub = new Uint8Array(await crypto.subtle.exportKey("raw", pair.publicKey));
  const jwk = await crypto.subtle.exportKey("jwk", pair.privateKey);
  console.log("VAPID_PUBLIC_KEY =", b64urlEncode(pub));
  console.log("VAPID_PRIVATE_KEY =", jwk.d);
  console.log('VAPID_SUBJECT = "mailto:<อีเมลผู้ดูแล>"');
})();
