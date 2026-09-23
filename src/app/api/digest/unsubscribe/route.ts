import { setDigestEmail } from "@/lib/digest/digest.repo";
import { verifyDigestUnsubToken } from "@/lib/digest/unsubscribe-token";
import { SITE_ORIGIN } from "@/lib/config/site";
import { recordEvent } from "@/lib/stats/record";

export const runtime = "nodejs";

/**
 * ยกเลิกรับดวงประจำวัน — **ไม่ต้องล็อกอิน** โดยตั้งใจ (PDPA)
 * --------------------------------------------------------------------------
 * คนที่เปลี่ยนอีเมล ลืมรหัสผ่าน หรือสมัครผ่าน Google ต้องกดยกเลิกได้เหมือนกัน
 * ลิงก์ยกเลิกที่บังคับให้ล็อกอินก่อนคือลิงก์หลอก
 *
 *   GET  ?t=<token>  ➔ หน้ายืนยัน มีปุ่มเดียว (ฟอร์ม POST)
 *   POST ?t=<token>  ➔ ยกเลิกจริง — รับทั้งปุ่มในหน้ายืนยัน และ one-click ของ Gmail/Yahoo
 *                      (RFC 8058: `List-Unsubscribe-Post: List-Unsubscribe=One-Click`)
 *
 * ⚠️ ห้ามกลับไปยกเลิกด้วย GET (A2-11) — ตัวสแกนลิงก์ขององค์กร (Outlook Safe Links · Proofpoint ·
 *    Mimecast) เปิดทุกลิงก์ในอีเมลล่วงหน้า ผู้ใช้อีเมลองค์กรถูกยกเลิกตั้งแต่ฉบับแรกโดยไม่รู้ตัว
 *    ส่วนการกดยกเลิกในแอปอีเมลใช้หัว `List-Unsubscribe` ซึ่งเป็น POST อยู่แล้ว
 *
 * ห้ามใส่อีเมลหรือ user id ดิบใน URL — id ถูกเซ็น HMAC อยู่ข้างในโทเคน (บทเรียน ISSUE-018)
 */

function page(title: string, body: string, status: number): Response {
  const html = `<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="robots" content="noindex">
  <title>${title} — SeerTarot</title>
  <style>
    body { margin:0; background:#FAF7F2; color:#2E211A;
           font-family:'Sarabun',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; }
    .wrap { max-width:520px; margin:0 auto; padding:48px 20px; }
    .card { background:#FFFFFF; border:1px solid #D9C8AC; border-radius:8px; padding:32px 26px; text-align:center; }
    h1 { font-size:20px; margin:0 0 16px; }
    p { font-size:15px; line-height:1.6; color:#2E211A; }
    a { color:#8F5C1A; }
  </style>
</head>
<body>
  <div class="wrap"><div class="card">${body}</div></div>
</body>
</html>`;
  return new Response(html, {
    status,
    headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" },
  });
}

function invalidLink(): Response {
  return page(
    "ลิงก์ไม่ถูกต้อง",
    `<h1>ลิงก์ยกเลิกนี้ใช้ไม่ได้</h1>
     <p>ลิงก์อาจถูกตัดขาดตอนคัดลอก หรือถูกแก้ไขระหว่างทาง</p>
     <p>ยกเลิกได้เองที่หน้าบัญชี: <a href="${SITE_ORIGIN}/account">${SITE_ORIGIN}/account</a></p>`,
    400,
  );
}

/** หน้ายืนยัน — ไม่เปลี่ยนสถานะอะไรเลย ตัวสแกนลิงก์เปิดกี่ครั้งก็ไม่มีผล */
export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get("t") || "";
  if (!(await verifyDigestUnsubToken(token))) return invalidLink();

  // โทเคนเป็น base64url + ลายเซ็น — escape ไว้ก่อนวางลง attribute อยู่ดี
  const safeToken = token.replace(/[^A-Za-z0-9._~-]/g, "");
  return page(
    "ยืนยันการยกเลิก",
    `<h1>ยกเลิกรับดวงประจำวันทางอีเมล?</h1>
     <p>กดปุ่มด้านล่างครั้งเดียว เราจะหยุดส่งอีเมลดวงประจำวันหาคุณทันที</p>
     <form method="POST" action="/api/digest/unsubscribe?t=${safeToken}">
       <button type="submit" style="margin-top:12px;padding:12px 24px;border-radius:8px;border:1px solid #8F5C1A;background:#8F5C1A;color:#FFFFFF;font-size:15px;cursor:pointer;">ยืนยันยกเลิกรับ</button>
     </form>
     <p style="margin-top:20px;"><a href="${SITE_ORIGIN}/">ไม่ยกเลิก กลับไปเปิดไพ่</a></p>`,
    200,
  );
}

export async function POST(request: Request) {
  const token = new URL(request.url).searchParams.get("t") || "";
  const userId = await verifyDigestUnsubToken(token);

  if (!userId) return invalidLink();
  try {
    await setDigestEmail(userId, false);
  } catch (err) {
    console.error("[Digest Unsubscribe] บันทึกไม่สำเร็จ:", err);
    return page(
      "ระบบขัดข้อง",
      `<h1>ยกเลิกไม่สำเร็จในตอนนี้</h1>
       <p>ระบบขัดข้องชั่วคราว รบกวนลองกดลิงก์เดิมอีกครั้ง หรือปิดเองที่หน้าบัญชี</p>
       <p><a href="${SITE_ORIGIN}/account">ไปที่หน้าบัญชี</a></p>`,
      500,
    );
  }

  recordEvent("digest_unsubscribed");

  return page(
    "ยกเลิกเรียบร้อย",
    `<h1>ยกเลิกรับดวงประจำวันแล้ว</h1>
     <p>เราจะไม่ส่งอีเมลดวงประจำวันหาคุณอีก ขอบคุณที่เคยให้เราได้ทักทายทุกเช้า</p>
     <p>เปลี่ยนใจเมื่อไรเปิดกลับได้เองที่ <a href="${SITE_ORIGIN}/account">หน้าบัญชี</a></p>
     <p><a href="${SITE_ORIGIN}/">กลับไปเปิดไพ่</a></p>`,
    200,
  );
}
