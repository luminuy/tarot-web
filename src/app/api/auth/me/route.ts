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
    if (user) {
      try {
        const { getUserById } = await import("@/lib/users/users.repo");
        const dbUser = await getUserById(user.id);
        return NextResponse.json({
          user: {
            ...user,
            marketingConsent: dbUser?.marketingConsent ?? false,
          },
        });
      } catch {
        return NextResponse.json({ user });
      }
    }
    return NextResponse.json({ user: null });
  } catch {
    return NextResponse.json({ user: null });
  }
}
