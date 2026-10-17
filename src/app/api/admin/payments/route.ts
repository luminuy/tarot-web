import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/auth/require-admin";
import { listAdminPayments, PAYMENT_STATUSES, type PaymentStatus } from "@/lib/admin/payments-admin";
import { PRODUCT_NAME, type Product } from "@/lib/admin/executive-report";

export const runtime = "nodejs";

/**
 * GET /api/admin/payments?status=&product=&mode=real|test|all&q=&before=
 * รายการชำระเงินทุกสินค้า เรียงใหม่ไปเก่า หน้าละ 50 · ค่าที่ไม่รู้จักถูกตัดทิ้ง (ไม่ส่งต่อเข้า SQL)
 */
export async function GET(request: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const sp = new URL(request.url).searchParams;
  const status = sp.get("status");
  const product = sp.get("product");
  const mode = sp.get("mode");
  const before = Number(sp.get("before"));

  try {
    const result = await listAdminPayments({
      status: (PAYMENT_STATUSES as readonly string[]).includes(status ?? "") ? (status as PaymentStatus) : undefined,
      product: product && product in PRODUCT_NAME ? (product as Product) : undefined,
      mode: mode === "test" || mode === "all" ? mode : "real",
      q: (sp.get("q") ?? "").slice(0, 120),
      before: Number.isFinite(before) && before > 0 ? before : undefined,
    });
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    console.error("[API Admin Payments GET Error]", err);
    return NextResponse.json({ ok: false, error: "อ่านรายการชำระเงินไม่สำเร็จ" }, { status: 500 });
  }
}
