/**
 * คัดลอกข้อความไปยังคลิปบอร์ดอย่างปลอดภัย รองรับทุกเบราว์เซอร์
 * ทั้ง secure context (navigator.clipboard) และ fallback สำหรับ in-app webview / HTTP (execCommand)
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  if (typeof window === "undefined" || !text) return false;

  // 1. ลองใช้ Modern Clipboard API ก่อน (ถ้ามีและอยู่ใน Secure Context)
  if (typeof navigator !== "undefined" && navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // โดนบล็อกสิทธิ์ หรือเป็น In-App Webview -> Fallback ไปวิธีถัดไป
    }
  }

  // 2. Fallback: ใช้ textarea ชั่วคราว + document.execCommand('copy')
  try {
    if (typeof document === "undefined") return false;
    const textArea = document.createElement("textarea");
    textArea.value = text;
    // ป้องกันการ scroll ของหน้าจอ และซ่อน element
    textArea.style.position = "fixed";
    textArea.style.left = "-999999px";
    textArea.style.top = "-999999px";
    textArea.setAttribute("readonly", "");
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    const successful = document.execCommand("copy");
    document.body.removeChild(textArea);
    return successful;
  } catch {
    return false;
  }
}
