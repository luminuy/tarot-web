/**
 * อีเมลเทมเพลตมาตรฐานสไตล์พรีเมียมสีทอง/มูเตลู สำหรับส่งให้ผู้ใช้งาน
 */

function baseLayout(contentHtml: string, title: string): string {
  return `<!DOCTYPE html>
<html lang="th">
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
        <div class="brand-title">✦ SEERTAROT ✦</div>
        <div class="brand-sub">วิหารพยากรณ์ไพ่ทาโรต์ออนไลน์</div>
      </div>
      ${contentHtml}
    </div>
    <div class="footer">
      อีเมลนี้ส่งจากระบบอัตโนมัติของ SeerTarot หากท่านไม่ได้เป็นผู้ทำรายการ กรุณาเพิกเฉยต่ออีเมลนี้
    </div>
  </div>
</body>
</html>`;
}

export function verifyEmailHtml(link: string, name?: string): string {
  const greeting = name ? `สวัสดีคุณ ${name}` : "สวัสดีผู้มีญาณหยั่งรู้";
  const content = `
    <h1>ยืนยันที่อยู่อีเมลของคุณ</h1>
    <p>${greeting},</p>
    <p>ขอบคุณที่ร่วมเดินทางสู่การพยากรณ์กับเรา เพื่อความปลอดภัยและความสมบูรณ์ของบัญชี กรุณากดปุ่มด้านล่างเพื่อยืนยันที่อยู่อีเมลของคุณ</p>
    <div class="btn-container">
      <a href="${link}" class="btn">✦ ยืนยันอีเมลทันที</a>
    </div>
    <p>ลิงก์นี้มีอายุการใช้งาน 24 ชั่วโมง</p>
    <div class="fallback">
      หากปุ่มด้านบนใช้งานไม่ได้ กรุณาคัดลอกลิงก์นี้ไปเปิดในเบราว์เซอร์:<br>
      <a href="${link}" style="color: #8F5C1A;">${link}</a>
    </div>
  `;
  return baseLayout(content, "ยืนยันที่อยู่อีเมลของคุณ — SeerTarot");
}

export function resetPasswordHtml(link: string, name?: string): string {
  const greeting = name ? `สวัสดีคุณ ${name}` : "สวัสดีผู้มีญาณหยั่งรู้";
  const content = `
    <h1>คำขอตั้งรหัสผ่านใหม่</h1>
    <p>${greeting},</p>
    <p>เราได้รับคำขอรีเซ็ตรหัสผ่านสำหรับบัญชี SeerTarot ของคุณ หากคุณเป็นผู้ส่งคำขอนี้ สามารถตั้งรหัสผ่านใหม่ได้โดยกดปุ่มด้านล่าง</p>
    <div class="btn-container">
      <a href="${link}" class="btn">✦ ตั้งรหัสผ่านใหม่</a>
    </div>
    <p style="color: #A6392C; font-size: 13px;">✦ ลิงก์นี้มีความปลอดภัยระดับสูงและมีอายุการใช้งาน 15 นาที</p>
    <div class="fallback">
      หากปุ่มด้านบนใช้งานไม่ได้ กรุณาคัดลอกลิงก์นี้ไปเปิดในเบราว์เซอร์:<br>
      <a href="${link}" style="color: #8F5C1A;">${link}</a>
    </div>
  `;
  return baseLayout(content, "คำขอตั้งรหัสผ่านใหม่ — SeerTarot");
}

export function accountExistsHtml(name?: string): string {
  const greeting = name ? `สวัสดีคุณ ${name}` : "สวัสดีผู้มีญาณหยั่งรู้";
  const content = `
    <h1>การแจ้งเตือนเกี่ยวกับบัญชีของคุณ</h1>
    <p>${greeting},</p>
    <p>มีการพยายามสมัครสมาชิกด้วยอีเมลนี้บน SeerTarot แต่ที่อยู่อีเมลนี้มีบัญชีในระบบเรียบร้อยแล้ว</p>
    <p>หากคุณจำรหัสผ่านไม่ได้ สามารถกดขอรีเซ็ตรหัสผ่านได้จากหน้าเข้าสู่ระบบ หรือหากเข้าใช้งานผ่าน Google / LINE สามารถเข้าสู่ระบบได้ตามปกติ</p>
  `;
  return baseLayout(content, "การแจ้งเตือนเกี่ยวกับบัญชี — SeerTarot");
}
