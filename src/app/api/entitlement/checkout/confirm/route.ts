import { NextResponse } from "next/server";
import { getCreditPackageById } from "@/lib/entitlement/packages";
import { grantBonus } from "@/lib/entitlement/entitlement";
import { updatePaymentStatus } from "@/lib/marketplace/payments.repo";
import { getAppDB } from "@/lib/platform/db";

export const runtime = "nodejs";

async function processPaymentGrant(orderId: string, packageId: string, userId: string): Promise<{ success: boolean; credits: number }> {
  const pkg = getCreditPackageById(packageId);
  if (!pkg || !userId || !orderId) {
    throw new Error("ข้อมูลการชำระเงินไม่ถูกต้อง");
  }

  // 1. เพิ่มโควตาการเปิดไพ่เข้า user_bonus ด้วยเหตุผล purchase_<orderId> (idempotent)
  await grantBonus(userId, pkg.credits, `purchase_${orderId}`);

  // 2. อัปเดตสถานะการชำระเงินใน payments table
  try {
    const db = await getAppDB();
    const payRow = await db
      .prepare(`SELECT id FROM payments WHERE booking_id = ? LIMIT 1`)
      .bind(orderId)
      .first<{ id: string }>();

    if (payRow?.id) {
      await updatePaymentStatus(payRow.id, "paid");
    }
  } catch (err) {
    console.warn("[Credit Confirmation Payment Update Warning]:", err);
  }

  return { success: true, credits: pkg.credits };
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const orderId = url.searchParams.get("order_id");
  const packageId = url.searchParams.get("package_id");
  const userId = url.searchParams.get("user_id");

  const origin = process.env.APP_ORIGIN || `${url.protocol}//${url.host}`;

  if (!orderId || !packageId || !userId) {
    return NextResponse.redirect(`${origin}/?purchase_error=${encodeURIComponent("ข้อมูลการชำระเงินไม่ครบถ้วน")}`);
  }

  try {
    const result = await processPaymentGrant(orderId, packageId, userId);
    return NextResponse.redirect(`${origin}/?purchase_success=1&credits=${result.credits}`);
  } catch (error: any) {
    console.error("[Credit Checkout Confirmation Error]:", error);
    return NextResponse.redirect(`${origin}/?purchase_error=${encodeURIComponent(error?.message || "การยืนยันรายการชำระเงินล้มเหลว")}`);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { orderId, packageId, userId } = body;

    if (!orderId || !packageId || !userId) {
      return NextResponse.json({ error: "ข้อมูลการชำระเงินไม่ครบถ้วน" }, { status: 400 });
    }

    const result = await processPaymentGrant(orderId, packageId, userId);
    return NextResponse.json({
      success: true,
      grantedCredits: result.credits,
      orderId,
    });
  } catch (error: any) {
    console.error("[Credit Checkout Confirm POST Error]:", error);
    return NextResponse.json(
      { error: error?.message || "ไม่สามารถบันทึกโควตาได้" },
      { status: 500 }
    );
  }
}
