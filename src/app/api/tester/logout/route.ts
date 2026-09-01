import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import { TESTER_COOKIE_NAME } from "@/lib/auth/tester-auth";

export const runtime = "nodejs";

export async function POST() {
  (await cookies()).delete(TESTER_COOKIE_NAME);
  return NextResponse.json({ ok: true });
}
