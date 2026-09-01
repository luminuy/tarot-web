import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import { TESTER_COOKIE_NAME, isTesterConfigured, verifyTesterSession } from "@/lib/auth/tester-auth";

export const runtime = "nodejs";

export async function GET() {
  let tester = false;
  try {
    const token = (await cookies()).get(TESTER_COOKIE_NAME)?.value;
    tester = !!token && verifyTesterSession(token);
  } catch {
    tester = false;
  }
  return NextResponse.json({ configured: isTesterConfigured(), tester });
}
