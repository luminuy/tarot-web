/**
 * 🛡️ Cloudflare Turnstile — ด่านกันบอทหน้าเข้าสู่ระบบ / สมัคร / ลืมรหัสผ่าน
 * ---------------------------------------------------------------------------
 * ทำไม: หน้า email signup/login/forgot เป็นช่องให้บอทฟาร์มบัญชีเพื่อกินสิทธิ์
 * เปิดไพ่ฟรี และยิงอีเมล spam (ผูกกับ docs/specs/ENTITLEMENT_ABUSE_MODEL.md)
 *
 * ⚙️ การตั้งค่า (ไม่บังคับ — ไม่ตั้ง = ด่านนี้ "ผ่านตลอด" ไม่บล็อกใคร):
 *   NEXT_PUBLIC_TURNSTILE_SITE_KEY = <site key> (ฝั่ง client · public โดยธรรมชาติ)
 *   TURNSTILE_SECRET_KEY           = <secret>   (ฝั่ง server · npx wrangler secret put)
 *
 * ทั้งสองค่าต้องมีคู่กันด่านถึงจะทำงาน — ตั้งมาแค่ตัวเดียวถือว่ายังไม่เปิด
 *
 * ⚠️ ใช้ฝั่งเซิร์ฟเวอร์เท่านั้น — ห้าม import จาก client component
 *    (ไม่ใส่ `import "server-only"` ให้เข้ากับไฟล์ security อื่นที่ทดสอบผ่าน tsx)
 */

const SITEVERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

/**
 * เปิดใช้ Turnstile อยู่หรือไม่ — ต้องมี **ทั้งคู่** (site + secret)
 * ตั้งมาแค่ตัวเดียว = ยังไม่เปิด (กันเคสฝั่ง server บังคับ แต่ client ไม่มี widget → ล็อกผู้ใช้)
 */
export function isTurnstileConfigured(): boolean {
  return Boolean(
    process.env.TURNSTILE_SECRET_KEY?.trim() && process.env.TURNSTILE_SITE_KEY?.trim(),
  );
}

/** site key สำหรับ widget ฝั่ง client — คืน null ถ้ายังไม่ได้ตั้งครบคู่ */
export function getTurnstileSiteKey(): string | null {
  if (!isTurnstileConfigured()) return null;
  return process.env.TURNSTILE_SITE_KEY!.trim();
}

export interface TurnstileResult {
  ok: boolean;
  /** เหตุผลเมื่อ ok=false — ใช้ log ไม่ควรโชว์ผู้ใช้ตรง ๆ */
  reason?: string;
}

/**
 * ตรวจ token ที่ widget ฝั่ง client ส่งมา กับ siteverify ของ Cloudflare
 * - ยังไม่เปิดใช้ (ไม่มี secret) → { ok: true } เสมอ (ระบบเดิมทำงานต่อได้)
 * - เปิดใช้แต่ไม่มี token / token ผิด / หมดอายุ → { ok: false }
 *
 * fail-safe: ถ้า siteverify เองล่ม/timeout → ปล่อยผ่าน ({ ok: true }) + log
 * เหตุผล: การล็อกไม่ให้ผู้ใช้จริงสมัคร/ล็อกอินเพราะ Cloudflare สะดุด แย่กว่าปล่อยบอตหลุดชั่วคราว
 * (ชั้น rate-limit เดิมยังทำงานอยู่)
 */
export async function verifyTurnstile(
  token: string | undefined | null,
  remoteIp?: string | null,
): Promise<TurnstileResult> {
  const secret = process.env.TURNSTILE_SECRET_KEY?.trim();
  if (!secret || !isTurnstileConfigured()) return { ok: true };

  if (!token || typeof token !== "string") {
    return { ok: false, reason: "missing-token" };
  }

  const form = new URLSearchParams();
  form.set("secret", secret);
  form.set("response", token);
  if (remoteIp) form.set("remoteip", remoteIp);

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(SITEVERIFY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: form,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      console.warn(`[turnstile] siteverify HTTP ${res.status} — ปล่อยผ่าน (fail-safe)`);
      return { ok: true };
    }

    const data = (await res.json().catch(() => null)) as
      | { success?: boolean; "error-codes"?: string[] }
      | null;

    if (data?.success) return { ok: true };

    return {
      ok: false,
      reason: data?.["error-codes"]?.join(",") || "verification-failed",
    };
  } catch (err) {
    console.warn("[turnstile] siteverify error — ปล่อยผ่าน (fail-safe):", err);
    return { ok: true };
  }
}

/** ดึง IP ผู้เรียกจาก header ของ Cloudflare (ใช้ส่งให้ siteverify) */
export function getRequestIp(request: Request): string | undefined {
  return (
    request.headers.get("cf-connecting-ip") ||
    request.headers.get("x-real-ip") ||
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    undefined
  );
}
