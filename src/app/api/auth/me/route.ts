import { NextResponse } from "next/server";

import { applySessionCookies, resolveSession } from "@/lib/auth/resolve-session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** ห้าม CDN/เบราว์เซอร์แคชสถานะล็อกอิน — ไม่งั้นคนถัดไปบนเครื่องเดียวกันเห็นบัญชีคนก่อน */
const NO_STORE = { "Cache-Control": "no-store, no-cache, must-revalidate, private" };

export async function GET() {
  const { user, action } = await resolveSession();
  return applySessionCookies(NextResponse.json({ user }, { headers: NO_STORE }), action);
}
