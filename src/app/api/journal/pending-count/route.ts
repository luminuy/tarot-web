import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { countPendingOlderThan } from "@/lib/journal/journal.repo";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const user = await getSessionUser();
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
