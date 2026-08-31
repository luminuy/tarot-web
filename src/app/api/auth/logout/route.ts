import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export const runtime = "nodejs";

export async function POST() {
  try {
    const cookieStore = await cookies();
    cookieStore.delete("tarot_auth_session");
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
