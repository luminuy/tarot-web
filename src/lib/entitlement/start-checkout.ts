/**
 * 🛒 เริ่มซื้อแพ็กเติมรอบ — ใช้ร่วมกันระหว่างหน้าต่างเติมรอบกับหน้า /pricing
 * ===========================================================================
 * เซิร์ฟเวอร์สร้างรายการ (Stripe Checkout Session) แล้วตอบลิงก์หน้าจ่ายเงินกลับมา
 * - `stripe`    ➔ ย้ายหน้าไปจ่ายที่ checkout.stripe.com ทันที (ผู้เรียกไม่ต้องทำอะไรต่อ)
 * - `simulator` ➔ เครื่องพัฒนา/ยังไม่ใส่คีย์ — ผู้เรียกโชว์หน้าจำลองแล้วยืนยันเอง
 * ราคา/จำนวนรอบตัดสินที่เซิร์ฟเวอร์จาก `packageId` เท่านั้น (ไม่ส่งยอดเงินจากหน้าเว็บ)
 */

export interface SimulatedCheckout {
  orderId: string;
  packageId: string;
  credits: number;
  amountSatang: number;
  provider: "simulator";
  authorizeUri?: string;
  isTestMode: boolean;
}

export type CheckoutStart =
  | { kind: "redirect" }
  | { kind: "simulator"; data: SimulatedCheckout }
  | { kind: "auth_required" }
  | { kind: "error"; message: string };

export async function startCheckout(packageId: string, isEn: boolean): Promise<CheckoutStart> {
  try {
    const res = await fetch("/api/entitlement/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ packageId, lang: isEn ? "en" : "th" }),
    });
    const data = await res.json().catch(() => ({}));
    if (res.status === 401) return { kind: "auth_required" };
    if (!res.ok || !data.success) {
      return {
        kind: "error",
        message: data.error || (isEn ? "Unable to start the payment. Please try again." : "เริ่มการชำระเงินไม่สำเร็จ กรุณาลองใหม่อีกครั้ง"),
      };
    }
    if (data.provider === "stripe" && typeof data.authorizeUri === "string") {
      window.location.assign(data.authorizeUri);
      return { kind: "redirect" };
    }
    return { kind: "simulator", data: data as SimulatedCheckout };
  } catch {
    return {
      kind: "error",
      message: isEn
        ? "Could not reach the payment system. Check your connection and try again."
        : "เชื่อมต่อระบบชำระเงินไม่ได้ กรุณาตรวจอินเทอร์เน็ตแล้วลองใหม่",
    };
  }
}
