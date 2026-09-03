/**
 * ระบบส่งอีเมลธุรกรรมผ่าน Resend API พร้อม fallback แสดงผลในคอนโซลสำหรับ Local Development & Test
 */

import { DEFAULT_EMAIL_FROM, DEFAULT_SUPPORT_EMAIL } from "@/lib/config/site";

/**
 * ถอด HTML เป็นข้อความล้วนแบบหยาบ ๆ ใช้เป็น fallback เมื่อผู้เรียกไม่ส่ง `text` มาเอง
 * (เทมเพลตหลักควรส่งเวอร์ชัน text ที่เขียนมือมาด้วย — อ่านลื่นกว่า)
 */
function htmlToText(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<head[\s\S]*?<\/head>/gi, "")
    .replace(/<br\s*\/?>(?=\s*)/gi, "\n")
    .replace(/<\/(p|div|h1|h2|h3|li|tr)>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export async function sendEmail(
  to: string,
  subject: string,
  html: string,
  text?: string
): Promise<{ success: boolean; messageId?: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM || DEFAULT_EMAIL_FROM;
  const replyTo = process.env.SUPPORT_EMAIL || DEFAULT_SUPPORT_EMAIL;
  const plainText = text || htmlToText(html);

  if (!apiKey) {
    console.log(`\n📧 [Email Dev Log]\n  To: ${to}\n  From: ${from}\n  Reply-To: ${replyTo}\n  Subject: ${subject}\n  Length: ${html.length} chars\n  --- text ---\n${plainText}\n`);
    return { success: true, messageId: `dev_mock_${Date.now()}` };
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [to],
        reply_to: replyTo,
        subject,
        html,
        text: plainText,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error(`[Resend Error ${res.status}]`, errText);
      throw new Error(`ไม่สามารถส่งอีเมลได้ (${res.status}): ${errText}`);
    }

    const data = (await res.json()) as { id?: string };
    return { success: true, messageId: data.id };
  } catch (err) {
    console.error("[sendEmail Error]", err);
    throw err;
  }
}
