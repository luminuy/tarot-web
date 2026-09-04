import { NextResponse } from "next/server";

import { recordAudit } from "@/lib/admin/audit";
import { requireAdmin } from "@/lib/auth/require-admin";
import { listConsentedUsersWithEmail } from "@/lib/users/users.repo";

export const runtime = "nodejs";

/** YYYY-MM-DD HH:mm ตามเวลาไทย — อ่านง่ายในไฟล์ CSV */
function thTime(ms?: number | null): string {
  if (!ms) return "";
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Asia/Bangkok",
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(ms));
}

/** ครอบค่าที่อาจมี , " \n ให้ปลอดภัยตามสเปก RFC 4180 */
function csvCell(value: string): string {
  return /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

/**
 * GET /api/admin/marketing
 *   - ปกติ: สรุปจำนวน + รายชื่อผู้ที่ยินยอมรับข่าวสาร (marketing_consent = 1)
 *   - ?format=csv: ดาวน์โหลด CSV (email,name,provider,consent_at) ไปใช้กับเครื่องมือส่งเมลภายนอก
 *
 * เหตุผล: ระบบเก็บ marketing consent มาตั้งแต่ต้นแต่ไม่มีทางเอาไปใช้เลย
 * (listConsentedUsersWithEmail ไม่เคยถูกเรียก) — endpoint นี้ทำให้ข้อมูลที่เก็บมามีค่า
 * โดยไม่ผูกกับระบบส่งเมลจำนวนมากที่ยังไม่ผ่าน PDPA sign-off
 */
export async function GET(request: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const url = new URL(request.url);
  const format = url.searchParams.get("format");

  let audience;
  try {
    audience = await listConsentedUsersWithEmail();
  } catch (error) {
    console.error("[admin/marketing] listConsentedUsersWithEmail failed:", error);
    return NextResponse.json({ error: "อ่านรายชื่อผู้รับข่าวสารไม่สำเร็จ" }, { status: 500 });
  }

  const rows = audience
    .filter((u) => !!u.email)
    .map((u) => ({
      email: u.email as string,
      name: u.name || "",
      provider: u.provider,
      consentAt: thTime(u.consentAt),
      joinedAt: thTime(u.createdAt),
    }))
    .sort((a, b) => b.consentAt.localeCompare(a.consentAt));

  if (format === "csv") {
    await recordAudit("marketing_audience_export", `${rows.length} รายชื่อ`);
    const header = "email,name,provider,consent_at,joined_at";
    const body = rows
      .map((r) => [r.email, r.name, r.provider, r.consentAt, r.joinedAt].map(csvCell).join(","))
      .join("\n");
    const stamp = new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Bangkok" }).format(new Date());
    return new NextResponse(`${header}\n${body}\n`, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="marketing-audience-${stamp}.csv"`,
        "Cache-Control": "no-store",
      },
    });
  }

  return NextResponse.json({
    count: rows.length,
    users: rows.slice(0, 200),
    truncated: rows.length > 200,
    generatedAt: Date.now(),
  });
}
