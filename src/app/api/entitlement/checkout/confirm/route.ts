import { NextResponse } from "next/server";
import { getCreditPackageById } from "@/lib/entitlement/packages";
import { grantBonus } from "@/lib/entitlement/entitlement";
import { updatePaymentStatus } from "@/lib/marketplace/payments.repo";
import { getAppDB } from "@/lib/platform/db";
import { getSessionUser } from "@/lib/auth/session";
import { isPrivilegedTestRequest } from "@/lib/security/privileged";
import { resolveAppOrigin } from "@/lib/security/app-origin";

export const runtime = "nodejs";

/**
 * 🔐 ปลายทาง `return_uri` ของเกตเวย์ — **ไม่ใช่หลักฐานการชำระเงิน**
 * ---------------------------------------------------------------------------
 * ผู้ใช้ (หรือใครก็ได้) ยิง URL นี้เองได้ตรง ๆ จึงห้ามแจกโควตาเพียงเพราะถูกเรียก
 * ก่อนแจกต้องผ่านครบ 4 ด่าน:
 *   1. ต้องเป็นเจ้าของบัญชีนั้นจริง (session ตรงกับ `userId` ที่ส่งมา)
 *   2. ต้องมีแถว `payments` ของ `orderId` นั้นอยู่จริง (สร้างตอน /checkout ซึ่งล็อกอินแล้ว)
 *   3. ยอดเงินในแถวต้องตรงกับราคาแพ็กเกจฝั่งเซิร์ฟเวอร์ (กันแก้ราคาฝั่งไคลเอนต์)
 *   4. สถานะต้องเป็น `paid` ซึ่งมีแค่ webhook ที่ผ่านการตรวจลายเซ็นเท่านั้นที่ตั้งได้
 * ตัวจำลอง (`provider = 'simulator'`) ผ่านได้เฉพาะนอก production เท่านั้น
 */

type GrantOutcome =
  | { ok: true; credits: number }
  | { ok: false; status: 400 | 401 | 402 | 404; message: string };

async function processPaymentGrant(
  request: Request,
  orderId: string,
  packageId: string,
  userId: string
): Promise<GrantOutcome> {
  const pkg = getCreditPackageById(packageId);
  if (!pkg || !userId || !orderId) {
    return { ok: false, status: 400, message: "ข้อมูลการชำระเงินไม่ถูกต้อง" };
  }

  // ด่าน 1 — ต้องเป็นเจ้าของบัญชีนั้นเอง
  const sessionUser = await getSessionUser();
  if (!sessionUser || sessionUser.id !== userId) {
    const privileged = await isPrivilegedTestRequest(request);
    if (!privileged || userId !== "usr_privileged_test") {
      return { ok: false, status: 401, message: "กรุณาเข้าสู่ระบบด้วยบัญชีที่สั่งซื้อก่อนยืนยันรายการ" };
    }
  }

  // ด่าน 2 — ต้องมีคำสั่งซื้อจริงที่สร้างจาก /api/entitlement/checkout
  const db = await getAppDB();
  const payRow = await db
    .prepare(
      `SELECT id, amount_satang, currency, status, provider, ticket_id
         FROM payments WHERE booking_id = ? LIMIT 1`
    )
    .bind(orderId)
    .first<{
      id: string;
      amount_satang: number;
      currency: string;
      status: string;
      provider: string;
      ticket_id: string | null;
    }>();

  if (!payRow) {
    return { ok: false, status: 404, message: "ไม่พบรายการสั่งซื้อนี้ในระบบ" };
  }

  // ด่าน 3 — ยอดเงินและสกุลเงินต้องตรงกับราคาแพ็กเกจฝั่งเซิร์ฟเวอร์
  // (`ticket_id` ต้องว่าง เพราะรายการที่ผูก ticket คือค่าปรึกษาแม่หมอ ไม่ใช่การเติมโควตา)
  if (
    payRow.ticket_id ||
    payRow.currency !== "THB" ||
    Number(payRow.amount_satang) !== pkg.amountSatang
  ) {
    return { ok: false, status: 400, message: "ยอดชำระไม่ตรงกับแพ็กเกจที่สั่งซื้อ" };
  }

  // ด่าน 4 — สถานะต้อง `paid` (ตั้งได้จาก webhook ที่ตรวจลายเซ็นแล้วเท่านั้น)
  const isSimulator = payRow.provider === "simulator" && process.env.NODE_ENV !== "production";
  if (payRow.status !== "paid" && !isSimulator) {
    if (payRow.status === "failed") {
      return { ok: false, status: 402, message: "รายการชำระเงินนี้ไม่สำเร็จ กรุณาสั่งซื้อใหม่อีกครั้ง" };
    }
    return {
      ok: false,
      status: 402,
      message: "ระบบยังไม่ได้รับการยืนยันจากผู้ให้บริการชำระเงิน กรุณารอสักครู่แล้วรีเฟรชอีกครั้ง",
    };
  }

  // ผ่านครบทุกด่าน → แจกโควตา (idempotent ด้วย UNIQUE(user_id, reason))
  await grantBonus(userId, pkg.credits, `purchase_${orderId}`);

  if (payRow.status !== "paid") {
    try {
      await updatePaymentStatus(payRow.id, "paid");
    } catch (err) {
      console.warn("[Credit Confirmation Payment Update Warning]:", err);
    }
  }

  return { ok: true, credits: pkg.credits };
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const orderId = url.searchParams.get("order_id");
  const packageId = url.searchParams.get("package_id");
  const userId = url.searchParams.get("user_id");

  // ห้ามประกอบ origin จาก host ของ request ตรง ๆ — เปิดช่อง open redirect ผ่าน header
  const origin = resolveAppOrigin(request);

  if (!orderId || !packageId || !userId) {
    return NextResponse.redirect(`${origin}/?purchase_error=${encodeURIComponent("ข้อมูลการชำระเงินไม่ครบถ้วน")}`);
  }

  try {
    const result = await processPaymentGrant(request, orderId, packageId, userId);
    if (!result.ok) {
      return NextResponse.redirect(`${origin}/?purchase_error=${encodeURIComponent(result.message)}`);
    }
    return NextResponse.redirect(`${origin}/?purchase_success=1&credits=${result.credits}`);
  } catch (error) {
    console.error("[Credit Checkout Confirmation Error]:", error);
    return NextResponse.redirect(
      `${origin}/?purchase_error=${encodeURIComponent("การยืนยันรายการชำระเงินล้มเหลว")}`
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const orderId = typeof body.orderId === "string" ? body.orderId : "";
    const packageId = typeof body.packageId === "string" ? body.packageId : "";
    const userId = typeof body.userId === "string" ? body.userId : "";

    if (!orderId || !packageId || !userId) {
      return NextResponse.json({ error: "ข้อมูลการชำระเงินไม่ครบถ้วน" }, { status: 400 });
    }

    const result = await processPaymentGrant(request, orderId, packageId, userId);
    if (!result.ok) {
      return NextResponse.json({ error: result.message }, { status: result.status });
    }

    return NextResponse.json({
      success: true,
      grantedCredits: result.credits,
      orderId,
    });
  } catch (error) {
    console.error("[Credit Checkout Confirm POST Error]:", error);
    return NextResponse.json({ error: "ไม่สามารถบันทึกโควตาได้" }, { status: 500 });
  }
}
