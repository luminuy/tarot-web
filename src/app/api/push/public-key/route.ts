import { NextResponse } from "next/server";

export const runtime = "nodejs";

/** 🔔 กุญแจสาธารณะ VAPID ให้เบราว์เซอร์ใช้ตอนสมัครรับแจ้งเตือน — ยังไม่ตั้ง = ปิดฟีเจอร์ (หน้าเว็บซ่อนปุ่ม) */
export async function GET() {
  const key = process.env.VAPID_PUBLIC_KEY;
  if (!key || !process.env.VAPID_PRIVATE_KEY || !process.env.VAPID_SUBJECT) {
    return NextResponse.json({ enabled: false }, { headers: { "Cache-Control": "public, max-age=300" } });
  }
  return NextResponse.json({ enabled: true, publicKey: key }, { headers: { "Cache-Control": "public, max-age=3600" } });
}
