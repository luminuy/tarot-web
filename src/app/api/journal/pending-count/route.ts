import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyUserSession } from "@/lib/auth/edge-auth";
import { countPendingOlderThan } from "@/lib/journal/journal.repo";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("tarot_auth_session")?.value;
    if (!token) {
      return NextResponse.json({ count: 0 });
    }

    const user = await verifyUserSession(token);
    if (!user) {
      return NextResponse.json({ count: 0 });
    }

    const url = new URL(request.url);
    const days = Number(url.searchParams.get("days")) || 7;

    const count = await countPendingOlderThan(user.id, days);
    return NextResponse.json({ count });
  } catch (error) {
    console.error("[Pending Count API Error]:", error);
    return NextResponse.json({ count: 0 });
  }
}
