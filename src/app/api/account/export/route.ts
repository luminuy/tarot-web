import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { getUserById } from "@/lib/users/users.repo";
import { listJournal } from "@/lib/journal/journal.repo";
import { SITE_DOMAIN, SITE_NAME_TH } from "@/lib/config/site";

export const runtime = "nodejs";

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่" }, { status: 401 });
    }

    const dbUser = await getUserById(user.id);
    const journal = await listJournal(user.id, { limit: 200 });

    const exportData = {
      exportedAt: new Date().toISOString(),
      platform: `${SITE_NAME_TH} (${SITE_DOMAIN})`,
      user: {
        id: user.id,
        provider: user.provider,
        email: user.email || null,
        name: user.name,
        locale: dbUser?.locale || "th",
        marketingConsent: dbUser?.marketingConsent || false,
        consentAt: dbUser?.consentAt ? new Date(dbUser.consentAt).toISOString() : null,
        createdAt: dbUser?.createdAt ? new Date(dbUser.createdAt).toISOString() : user.createdAt,
        lastSeenAt: dbUser?.lastSeenAt ? new Date(dbUser.lastSeenAt).toISOString() : null,
      },
      readingJournalCount: journal.length,
      readingJournal: journal,
    };

    const fileName = `tarot-data-export-${user.id}-${Date.now()}.json`;

    return new NextResponse(JSON.stringify(exportData, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="${fileName}"`,
      },
    });
  } catch (error) {
    console.error("[Account Export Error]:", error);
    return NextResponse.json({ error: "ไม่สามารถส่งออกข้อมูลบัญชีได้" }, { status: 500 });
  }
}
