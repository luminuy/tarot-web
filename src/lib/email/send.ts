/**
 * ระบบส่งอีเมลธุรกรรมผ่าน Resend API พร้อม fallback แสดงผลในคอนโซลสำหรับ Local Development & Test
 */

import { DEFAULT_EMAIL_FROM } from "@/lib/config/site";

export async function sendEmail(
  to: string,
  subject: string,
  html: string
): Promise<{ success: boolean; messageId?: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM || DEFAULT_EMAIL_FROM;

  if (!apiKey) {
    console.log(`\n📧 [Email Dev Log]\n  To: ${to}\n  From: ${from}\n  Subject: ${subject}\n  Length: ${html.length} chars\n`);
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
        subject,
        html,
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
