/**
 * อีเมลเทมเพลตมาตรฐานสไตล์พรีเมียมสีทอง/มูเตลู สำหรับส่งให้ผู้ใช้งาน
 */

function baseLayout(contentHtml: string, title: string, lang: "th" | "en" = "th"): string {
  const isEn = lang === "en";
  return `<!DOCTYPE html>
<html lang="${lang}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #FAF7F2;
      font-family: 'Sarabun', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #2E211A;
    }
    .wrapper {
      max-width: 560px;
      margin: 0 auto;
      padding: 32px 20px;
    }
    .card {
      background: #FFFFFF;
      border: 1px solid #D9C8AC;
      border-radius: 8px;
      padding: 36px 28px;
    }
    .brand {
      text-align: center;
      margin-bottom: 24px;
    }
    .brand-title {
      color: #8F5C1A;
      font-size: 20px;
      font-weight: bold;
      letter-spacing: 1px;
      margin: 0;
    }
    .brand-sub {
      color: #6F5B4A;
      font-size: 13px;
      margin-top: 4px;
    }
    h1 {
      color: #2E211A;
      font-size: 20px;
      font-weight: 600;
      margin-top: 0;
      margin-bottom: 16px;
      text-align: center;
    }
    p {
      color: #2E211A;
      font-size: 15px;
      line-height: 1.6;
      margin-bottom: 20px;
    }
    .btn-container {
      text-align: center;
      margin: 32px 0;
    }
    .btn {
      display: inline-block;
      background: #8F5C1A;
      color: #FFFFFF !important;
      font-weight: bold;
      font-size: 15px;
      text-decoration: none;
      padding: 14px 32px;
      border-radius: 999px;
    }
    .fallback {
      background: #F3EDE2;
      border: 1px solid #D9C8AC;
      border-radius: 8px;
      padding: 12px;
      font-size: 12px;
      color: #6F5B4A;
      word-break: break-all;
      margin-top: 24px;
    }
    .footer {
      text-align: center;
      margin-top: 28px;
      color: #6F5B4A;
      font-size: 12px;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="card">
      <div class="brand">
        <div class="brand-title">SEERTAROT</div>
        <div class="brand-sub">${isEn ? "Online Interactive Tarot Sanctuary" : "วิหารพยากรณ์ไพ่ทาโรต์ออนไลน์"}</div>
      </div>
      ${contentHtml}
    </div>
    <div class="footer">
      ${isEn ? "This is an automated email from SeerTarot. If you did not initiate this request, please disregard this email." : "อีเมลนี้ส่งจากระบบอัตโนมัติของ SeerTarot หากท่านไม่ได้เป็นผู้ทำรายการ กรุณาเพิกเฉยต่ออีเมลนี้"}
    </div>
  </div>
</body>
</html>`;
}

export function verifyEmailHtml(link: string, name?: string, lang: "th" | "en" = "th"): string {
  const isEn = lang === "en";
  const greeting = name ? (isEn ? `Hello ${name}` : `สวัสดีคุณ ${name}`) : (isEn ? "Greetings, Seeker" : "สวัสดีผู้มีญาณหยั่งรู้");
  const content = `
    <h1>${isEn ? "Verify Your Email Address" : "ยืนยันที่อยู่อีเมลของคุณ"}</h1>
    <p>${greeting},</p>
    <p>${isEn ? "Thank you for embarking on this tarot journey with us. To secure your account and access all sanctuary features, please verify your email address by clicking the button below." : "ขอบคุณที่ร่วมเดินทางสู่การพยากรณ์กับเรา เพื่อความปลอดภัยและความสมบูรณ์ของบัญชี กรุณากดปุ่มด้านล่างเพื่อยืนยันที่อยู่อีเมลของคุณ"}</p>
    <div class="btn-container">
      <a href="${link}" class="btn">${isEn ? "Verify Email Now" : "ยืนยันอีเมลทันที"}</a>
    </div>
    <p>${isEn ? "This link will expire in 24 hours." : "ลิงก์นี้มีอายุการใช้งาน 24 ชั่วโมง"}</p>
    <div class="fallback">
      ${isEn ? "If the button above does not work, copy and paste this link into your browser:" : "หากปุ่มด้านบนใช้งานไม่ได้ กรุณาคัดลอกลิงก์นี้ไปเปิดในเบราว์เซอร์:"}<br>
      <a href="${link}" style="color: #8F5C1A;">${link}</a>
    </div>
  `;
  return baseLayout(content, isEn ? "Verify Your Email Address — SeerTarot" : "ยืนยันที่อยู่อีเมลของคุณ — SeerTarot", lang);
}

export function resetPasswordHtml(link: string, name?: string, lang: "th" | "en" = "th"): string {
  const isEn = lang === "en";
  const greeting = name ? (isEn ? `Hello ${name}` : `สวัสดีคุณ ${name}`) : (isEn ? "Greetings, Seeker" : "สวัสดีผู้มีญาณหยั่งรู้");
  const content = `
    <h1>${isEn ? "Reset Your Password" : "คำขอตั้งรหัสผ่านใหม่"}</h1>
    <p>${greeting},</p>
    <p>${isEn ? "We received a password reset request for your SeerTarot account. If you initiated this request, you can set a new password by clicking the button below." : "เราได้รับคำขอรีเซ็ตรหัสผ่านสำหรับบัญชี SeerTarot ของคุณ หากคุณเป็นผู้ส่งคำขอนี้ สามารถตั้งรหัสผ่านใหม่ได้โดยกดปุ่มด้านล่าง"}</p>
    <div class="btn-container">
      <a href="${link}" class="btn">${isEn ? "Reset Password" : "ตั้งรหัสผ่านใหม่"}</a>
    </div>
    <p style="color: #A6392C; font-size: 13px;">${isEn ? "This secure link expires in 15 minutes." : "ลิงก์นี้มีความปลอดภัยระดับสูงและมีอายุการใช้งาน 15 นาที"}</p>
    <div class="fallback">
      ${isEn ? "If the button above does not work, copy and paste this link into your browser:" : "หากปุ่มด้านบนใช้งานไม่ได้ กรุณาคัดลอกลิงก์นี้ไปเปิดในเบราว์เซอร์:"}<br>
      <a href="${link}" style="color: #8F5C1A;">${link}</a>
    </div>
  `;
  return baseLayout(content, isEn ? "Reset Your Password — SeerTarot" : "คำขอตั้งรหัสผ่านใหม่ — SeerTarot", lang);
}

export function accountExistsHtml(name?: string, lang: "th" | "en" = "th"): string {
  const isEn = lang === "en";
  const greeting = name ? (isEn ? `Hello ${name}` : `สวัสดีคุณ ${name}`) : (isEn ? "Greetings, Seeker" : "สวัสดีผู้มีญาณหยั่งรู้");
  const content = `
    <h1>${isEn ? "Account Notification" : "การแจ้งเตือนเกี่ยวกับบัญชีของคุณ"}</h1>
    <p>${greeting},</p>
    <p>${isEn ? "An attempt was made to register with this email on SeerTarot, but an account already exists." : "มีการพยายามสมัครสมาชิกด้วยอีเมลนี้บน SeerTarot แต่ที่อยู่อีเมลนี้มีบัญชีในระบบเรียบร้อยแล้ว"}</p>
    <p>${isEn ? "If you forgot your password, you can request a password reset from the sign-in modal. Or if you use Google / LINE, you can sign in directly." : "หากคุณจำรหัสผ่านไม่ได้ สามารถกดขอรีเซ็ตรหัสผ่านได้จากหน้าเข้าสู่ระบบ หรือหากเข้าใช้งานผ่าน Google / LINE สามารถเข้าสู่ระบบได้ตามปกติ"}</p>
  `;
  return baseLayout(content, isEn ? "Account Notification — SeerTarot" : "การแจ้งเตือนเกี่ยวกับบัญชี — SeerTarot", lang);
}

/* ── เวอร์ชันข้อความล้วน (ส่งควบคู่ HTML เสมอ — ลดโอกาสตกโฟลเดอร์สแปม) ────────── */

function textLayout(bodyLines: string[], lang: "th" | "en" = "th"): string {
  const isEn = lang === "en";
  return [
    isEn ? "SEERTAROT — Online Interactive Tarot Sanctuary" : "SEERTAROT — วิหารพยากรณ์ไพ่ทาโรต์ออนไลน์",
    "",
    ...bodyLines,
    "",
    "—",
    isEn
      ? "This is an automated email from SeerTarot. If you did not initiate this request, please disregard this email."
      : "อีเมลนี้ส่งจากระบบอัตโนมัติของ SeerTarot หากท่านไม่ได้เป็นผู้ทำรายการ กรุณาเพิกเฉยต่ออีเมลนี้",
  ].join("\n");
}

export function verifyEmailText(link: string, name?: string, lang: "th" | "en" = "th"): string {
  const isEn = lang === "en";
  const greeting = name ? (isEn ? `Hello ${name}` : `สวัสดีคุณ ${name}`) : (isEn ? "Greetings, Seeker" : "สวัสดีผู้มีญาณหยั่งรู้");
  return textLayout(
    [
      isEn ? "Verify Your Email Address" : "ยืนยันที่อยู่อีเมลของคุณ",
      "",
      `${greeting},`,
      "",
      isEn
        ? "Thank you for embarking on this tarot journey with us. Please open the link below to verify your email address (expires in 24 hours):"
        : "ขอบคุณที่ร่วมเดินทางสู่การพยากรณ์กับเรา กรุณาเปิดลิงก์ด้านล่างเพื่อยืนยันที่อยู่อีเมลของคุณ (ลิงก์มีอายุ 24 ชั่วโมง):",
      "",
      link,
    ],
    lang
  );
}

export function resetPasswordText(link: string, name?: string, lang: "th" | "en" = "th"): string {
  const isEn = lang === "en";
  const greeting = name ? (isEn ? `Hello ${name}` : `สวัสดีคุณ ${name}`) : (isEn ? "Greetings, Seeker" : "สวัสดีผู้มีญาณหยั่งรู้");
  return textLayout(
    [
      isEn ? "Reset Your Password" : "คำขอตั้งรหัสผ่านใหม่",
      "",
      `${greeting},`,
      "",
      isEn
        ? "We received a password reset request for your SeerTarot account. If you initiated this request, open the link below to set a new password (expires in 15 minutes):"
        : "เราได้รับคำขอรีเซ็ตรหัสผ่านสำหรับบัญชี SeerTarot ของคุณ หากคุณเป็นผู้ส่งคำขอนี้ เปิดลิงก์ด้านล่างเพื่อตั้งรหัสผ่านใหม่ (ลิงก์มีอายุ 15 นาที):",
      "",
      link,
      "",
      isEn
        ? "If you did not request this, please disregard this email. Your current password remains unchanged."
        : "หากคุณไม่ได้ส่งคำขอนี้ กรุณาเพิกเฉยต่ออีเมลนี้ รหัสผ่านเดิมของคุณยังใช้งานได้ตามปกติ",
    ],
    lang
  );
}

export function accountExistsText(name?: string, lang: "th" | "en" = "th"): string {
  const isEn = lang === "en";
  const greeting = name ? (isEn ? `Hello ${name}` : `สวัสดีคุณ ${name}`) : (isEn ? "Greetings, Seeker" : "สวัสดีผู้มีญาณหยั่งรู้");
  return textLayout(
    [
      isEn ? "Account Notification" : "การแจ้งเตือนเกี่ยวกับบัญชีของคุณ",
      "",
      `${greeting},`,
      "",
      isEn
        ? "An attempt was made to register with this email on SeerTarot, but an account already exists."
        : "มีการพยายามสมัครสมาชิกด้วยอีเมลนี้บน SeerTarot แต่ที่อยู่อีเมลนี้มีบัญชีในระบบเรียบร้อยแล้ว",
      "",
      isEn
        ? "If you forgot your password, you can reset it from the sign-in modal. Or if you use Google / LINE, you can sign in directly."
        : "หากคุณจำรหัสผ่านไม่ได้ สามารถกดขอรีเซ็ตรหัสผ่านได้จากหน้าเข้าสู่ระบบ หรือหากเข้าใช้งานผ่าน Google / LINE สามารถเข้าสู่ระบบได้ตามปกติ",
    ],
    lang
  );
}

/**
 * 📬 ดวงประจำวัน (Daily Digest) — ส่งเช้าให้เฉพาะคนที่กดสมัครไว้เอง
 * -------------------------------------------------------------------
 * ⚠️ ไม่มีภาพหน้าไพ่ในอีเมลโดยตั้งใจ — กฎเหล็กข้อ 8 บังคับให้ภาพไพ่ทุกใบผ่าน `<CardImage />`
 * ซึ่งเป็นคอมโพเนนต์ React ใช้ในอีเมลไม่ได้ · การเขียน `<img src="/cards/...">` เองในอีเมล
 * จะละเมิดกฎ B ของด่าน `test-image-paths` ด้วย · จึงพาผู้อ่านไปดูไพ่ที่หน้า `/daily` แทน
 *
 * ⚠️ `proof` (SHA-256 ของวันนั้น) ต้องอยู่ในอีเมลเสมอ — จุดขายของเว็บนี้คือตรวจสอบได้
 * ถ้าอีเมลบอกว่า "ไพ่วันนี้คือ…" โดยไม่มีหลักฐานให้ตรวจ ก็เป็นการกลืนน้ำลายตัวเอง
 */
export function dailyDigestHtml(params: {
  name?: string;
  cardNameTh: string;
  cardNameEn: string;
  keywords: string[];
  message: string;
  proof: string;
  dateLabel: string;
  readUrl: string;
  unsubUrl: string;
}): string {
  const greeting = params.name ? `สวัสดีคุณ ${params.name}` : "สวัสดีผู้มีญาณหยั่งรู้";
  const keywordLine = params.keywords.slice(0, 4).join(" · ");
  const content = `
    <h1>ไพ่นำทางของวันนี้</h1>
    <p>${greeting},</p>
    <p>พลังงานประจำวันที่ ${params.dateLabel} เปิดออกมาเป็นไพ่</p>
    <div style="text-align:center;margin:24px 0;padding:20px;background:#F3EDE2;border:1px solid #D9C8AC;border-radius:8px;">
      <div style="font-size:22px;font-weight:bold;color:#8F5C1A;">${params.cardNameTh}</div>
      <div style="font-size:13px;color:#6F5B4A;margin-top:4px;">${params.cardNameEn}</div>
      <div style="font-size:13px;color:#2E211A;margin-top:12px;">${keywordLine}</div>
    </div>
    <p>${params.message}</p>
    <div class="btn-container">
      <a href="${params.readUrl}" class="btn">เปิดไพ่ของตัวเองวันนี้</a>
    </div>
    <div class="fallback">
      รหัสตรวจสอบความโปร่งใสของไพ่วันนี้ (SHA-256):<br>
      <span style="font-family:monospace;">${params.proof}</span><br>
      ไพ่ใบนี้ถูกกำหนดจากวันที่ล่วงหน้า ไม่มีใครแก้ทีหลังได้ ตรวจสอบเองได้ที่หน้าไพ่ประจำวัน
    </div>
    <p style="font-size:12px;color:#6F5B4A;margin-top:24px;text-align:center;">
      คุณได้รับอีเมลนี้เพราะเคยกดสมัครรับดวงประจำวันไว้เอง<br>
      <a href="${params.unsubUrl}" style="color:#8F5C1A;">ยกเลิกรับดวงประจำวัน</a> — กดครั้งเดียวจบ ไม่ต้องเข้าสู่ระบบ
    </p>
  `;
  return baseLayout(content, `ไพ่นำทางวันนี้ ${params.cardNameTh} — SeerTarot`);
}

export function dailyDigestText(params: {
  name?: string;
  cardNameTh: string;
  cardNameEn: string;
  keywords: string[];
  message: string;
  proof: string;
  dateLabel: string;
  readUrl: string;
  unsubUrl: string;
}): string {
  const greeting = params.name ? `สวัสดีคุณ ${params.name}` : "สวัสดีผู้มีญาณหยั่งรู้";
  return [
    "ไพ่นำทางของวันนี้ — SeerTarot",
    "",
    `${greeting},`,
    `พลังงานประจำวันที่ ${params.dateLabel} เปิดออกมาเป็นไพ่`,
    "",
    `${params.cardNameTh} (${params.cardNameEn})`,
    params.keywords.slice(0, 4).join(" · "),
    "",
    params.message,
    "",
    `เปิดไพ่ของตัวเองวันนี้: ${params.readUrl}`,
    "",
    `รหัสตรวจสอบความโปร่งใส (SHA-256): ${params.proof}`,
    "ไพ่ใบนี้ถูกกำหนดจากวันที่ล่วงหน้า ไม่มีใครแก้ทีหลังได้",
    "",
    "คุณได้รับอีเมลนี้เพราะเคยกดสมัครรับดวงประจำวันไว้เอง",
    `ยกเลิกรับดวงประจำวัน: ${params.unsubUrl}`,
  ].join("\n");
}
