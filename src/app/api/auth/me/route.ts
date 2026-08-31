import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyUserSession } from "@/lib/auth/edge-auth";

export const runtime = "nodejs";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("tarot_auth_session")?.value;
    if (!token) {
      return NextResponse.json({ user: null });
    }

    const user = await verifyUserSession(token);
    return NextResponse.json({ user });
  } catch {
    return NextResponse.json({ user: null });
  }
}
