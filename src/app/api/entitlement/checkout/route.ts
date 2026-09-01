import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { AUTH_COOKIE_NAME, verifyUserSession } from "@/lib/auth/edge-auth";
import { getCreditPackageById } from "@/lib/entitlement/packages";
import { createGatewayCharge } from "@/lib/marketplace/payment-gateway";
import { createPaymentRecord } from "@/lib/marketplace/payments.repo";
import { isPrivilegedTestRequest } from "@/lib/security/privileged";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const isPrivileged = await isPrivilegedTestRequest(request);
    const cookieStore = await cookies();
    const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;

    let userId = "";
    if (token) {
      const user = await verifyUserSession(token);
      if (user) userId = user.id;
    }

    // สำหรับ Privileged Testing อนุญาต mock user id
    if (!userId && isPrivileged) {
      userId = "usr_privileged_test";
    }

    if (!userId) {
      return NextResponse.json(
        { error: "กรุณาเข้าสู่ระบบก่อนทำการซื้อแพ็กเกจเปิดไพ่" },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const { packageId } = body;

    if (!packageId) {
      return NextResponse.json({ error: "ไม่พบรหัสแพ็กเกจที่ต้องการสั่งซื้อ" }, { status: 400 });
    }

    const pkg = getCreditPackageById(packageId);
    if (!pkg) {
      return NextResponse.json({ error: "แพ็กเกจที่เลือกไม่ถูกต้อง" }, { status: 400 });
    }

    const url = new URL(request.url);
    const origin = process.env.APP_ORIGIN || `${url.protocol}//${url.host}`;
    const orderId = `ord_${crypto.randomUUID().replace(/-/g, "").slice(0, 16)}`;

    // สร้างรายการชำระเงินผ่าน Gateway (Omise หรือ Simulator)
    const returnUri = `${origin}/api/entitlement/checkout/confirm?order_id=${orderId}&package_id=${pkg.id}&user_id=${userId}`;
    const charge = await createGatewayCharge({
      amountSatang: pkg.amountSatang,
      currency: "THB",
      description: `เติมโควตาดูดวง: ${pkg.name} (${pkg.credits} ครั้ง)`,
      returnUri,
      metadata: {
        userId,
        packageId: pkg.id,
        orderId,
        credits: String(pkg.credits),
      },
    });

    // บันทึกรายการลงในตาราง payments
    await createPaymentRecord({
      bookingId: orderId,
      ticketId: undefined,
      provider: charge.isTestMode ? "simulator" : "omise",
      providerRef: charge.chargeId,
      amountSatang: pkg.amountSatang,
      currency: "THB",
    });

    return NextResponse.json({
      success: true,
      orderId,
      packageId: pkg.id,
      credits: pkg.credits,
      amountSatang: pkg.amountSatang,
      status: charge.status,
      qrCodeUri: charge.qrCodeUri,
      authorizeUri: charge.authorizeUri,
      isTestMode: charge.isTestMode,
    });
  } catch (error: any) {
    console.error("[Credit Checkout Error]:", error);
    return NextResponse.json(
      { error: error?.message || "ไม่สามารถสร้างรายการสั่งซื้อได้" },
      { status: 500 }
    );
  }
}
