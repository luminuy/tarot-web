import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import { ADMIN_COOKIE_NAME } from "@/lib/auth/admin-auth";

export const runtime = "nodejs";

export async function POST() {
  (await cookies()).delete(ADMIN_COOKIE_NAME);
  return NextResponse.json({ ok: true });
}
