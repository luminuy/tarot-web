import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/require-admin";
import { calculateReaderEarnings } from "@/lib/marketplace/payments.repo";
import { listReaders } from "@/lib/marketplace/readers.repo";

export const runtime = "nodejs";

/**
 * GET /api/admin/payouts - ดูสรุปรายได้และส่วนแบ่งคอมมิชชั่นของแม่หมอทั้งหมด
 */
export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;

  try {
    const readers = await listReaders({ status: "approved" });
    const summaries = await Promise.all(
      readers.map(async (r) => {
        const earnings = await calculateReaderEarnings(r.id);
        return {
          displayName: r.displayName,
          commissionPct: r.commissionPct,
          ...earnings,
        };
      })
    );

    const totalGross = summaries.reduce((acc, curr) => acc + curr.grossSatang, 0);
    const totalCommission = summaries.reduce((acc, curr) => acc + curr.commissionSatang, 0);
    const totalNetPayout = summaries.reduce((acc, curr) => acc + curr.netSatang, 0);

    return NextResponse.json({
      period: new Date().toISOString().slice(0, 7),
      summary: {
        totalGrossThb: totalGross / 100,
        totalCommissionThb: totalCommission / 100,
        totalNetPayoutThb: totalNetPayout / 100,
        readerCount: readers.length,
      },
      readers: summaries,
    });
  } catch (err) {
    console.error("[API Admin Payouts GET Error]", err);
    return NextResponse.json({ error: "ไม่สามารถดึงข้อมูลสรุปรายได้ได้" }, { status: 500 });
  }
}
