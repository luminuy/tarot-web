/**
 * 📖 แปลงตัวบทนิยาย (`src/data/novel-chapters.ts`) เป็นย่อหน้า HTML — ไม่มีไลบรารี Markdown
 * ===========================================================================
 * ต้นฉบับใช้ Markdown แค่ 2 อย่าง: `**ตัวหนา**` (เสียงประกอบ · ชื่อตัวละคร · คำเน้น) และ `*ตัวเอียง*` (ความคิดในใจ)
 * จึงเขียนเองสั้น ๆ: หนี HTML ทุกตัวก่อน แล้วค่อยแปลงเครื่องหมายเน้น — ข้อความใด ๆ ในตัวบทกลายเป็นแท็กไม่ได้
 *
 * ย่อหน้าที่เป็นตัวหนา/ตัวเอียงทั้งก้อน (เสียงระเบิด · ความคิดบรรทัดเดียว) ได้ชนิด `beat` ให้จัดกึ่งกลางแยกจังหวะ
 */

export interface NovelParagraph {
  kind: "text" | "beat";
  html: string;
}

const escapeHtml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");

function inline(text: string): string {
  return escapeHtml(text)
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/\*/g, ""); // เครื่องหมายเดี่ยวที่ไม่มีคู่ — ไม่ปล่อยดาวโผล่บนหน้า
}

export function renderNovelBody(body: string): NovelParagraph[] {
  return body
    .split(/\n{2,}/)
    .map((p) => p.replace(/\n/g, " ").trim())
    .filter(Boolean)
    .map((p) => ({
      kind: /^\*{1,2}[^*]+\*{1,2}$/.test(p) && p.length <= 80 ? "beat" : "text",
      html: inline(p),
    }));
}
