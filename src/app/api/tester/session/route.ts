import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import { TESTER_COOKIE_NAME, isTesterConfigured, verifyTesterSessionLive } from "@/lib/auth/tester-auth";

export const runtime = "nodejs";

export async function GET() {
  let tester = false;
  try {
    const token = (await cookies()).get(TESTER_COOKIE_NAME)?.value;
    tester = !!token && (await verifyTesterSessionLive(token));
  } catch {
    tester = false;
  }
  return NextResponse.json({ configured: isTesterConfigured(), tester });
}
