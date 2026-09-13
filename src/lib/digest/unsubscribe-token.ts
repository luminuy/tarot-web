import { signPayload, verifyPayload } from "@/lib/auth/edge-auth";

/**
 * โทเคนยกเลิกรับดวงประจำวัน (One-Click Unsubscribe Token)
 * --------------------------------------------------------
 * ทุกฉบับที่ส่งออกต้องมีลิงก์ยกเลิกที่ **กดได้โดยไม่ต้องล็อกอิน** (PDPA)
 * คนที่เปลี่ยนอีเมลไปแล้ว ลืมรหัสผ่าน หรือไม่เคยตั้งรหัสเพราะสมัครผ่าน Google
 * ต้องยกเลิกได้เหมือนกัน ไม่งั้นลิงก์ยกเลิกคือลิงก์หลอก
 *
 * ⚠️ ห้ามใส่อีเมลหรือ user id ดิบใน URL — บทเรียน ISSUE-018 (ข้อมูลตั๋วคิวรั่วผ่าน query string)
 * ที่นี่ใส่ id ไว้ "ข้างใน" payload ที่เซ็น HMAC แล้ว แก้มือไม่ได้
 *
 * ⚠️ **จงใจไม่มีวันหมดอายุ** ต่างจาก ticket อื่นในเรโปนี้ — อีเมลฉบับที่ส่งไปเมื่อ 8 เดือนก่อน
 * ยังต้องกดยกเลิกได้ ถ้าใส่อายุไว้ ลิงก์จะกลายเป็นปุ่มตายที่พาไปหน้า error
 * ความเสี่ยงของโทเคนไม่หมดอายุตรงนี้ต่ำมาก เพราะทำได้อย่างเดียวคือ "ปิดการรับอีเมล"
 * ซึ่งเป็นทิศทางที่ปลอดภัยเสมอ (ปิดให้คนอื่นได้ แต่ **เปิดแทนใครไม่ได้**)
 */
const PURPOSE = "digest-unsub";

interface UnsubPayload extends Record<string, unknown> {
  uid: string;
  purpose: string;
}

export async function signDigestUnsubToken(userId: string): Promise<string> {
  return signPayload({ uid: userId, purpose: PURPOSE } satisfies UnsubPayload);
}

/** คืน userId ถ้าโทเคนถูกต้อง · null ถ้าถูกแก้มือ ผิดวัตถุประสงค์ หรือว่างเปล่า */
export async function verifyDigestUnsubToken(token: string): Promise<string | null> {
  if (!token) return null;
  const t = await verifyPayload<UnsubPayload>(token);
  if (!t || t.purpose !== PURPOSE) return null;
  if (typeof t.uid !== "string" || !t.uid) return null;
  return t.uid;
}
