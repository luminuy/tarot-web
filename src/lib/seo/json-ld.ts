/**
 * 🧾 ตัวเขียน JSON-LD ที่เดียวของทั้งเว็บ
 * ---------------------------------------------------------------------------
 * บทเรียน (T-17): ทุกบล็อก JSON-LD ในรีโปเขียนด้วย `JSON.stringify(x)` ดิบ ๆ ลง
 * `dangerouslySetInnerHTML` โดยไม่ escape `<` เลยสักไฟล์ (~20 ไฟล์)
 *
 * ทำไมถึงอันตราย: เนื้อหาใน `<script>` ไม่ถูกตีความเป็น HTML entity แต่เบราว์เซอร์
 * **ปิดบล็อกสคริปต์ทันทีที่เจอสตริง `</script`** ไม่ว่าจะอยู่กลาง string literal ก็ตาม
 * ค่าที่ผู้ใช้ควบคุมได้ตัวเดียวที่มีคำนั้นจึงหลุดออกมาเป็น HTML ของหน้าได้
 *
 * วันนี้ค่าที่ไหลเข้ามีแค่ `reader.displayName` ซึ่งเขียนผ่าน API แอดมิน จึงยังไม่ร้ายแรง
 * **แต่จะกลายเป็นเรื่องใหญ่ทันทีที่เปิดให้แม่หมอแก้โปรไฟล์เองหรือมีชื่อจากผู้ใช้ไหลเข้า**
 * ซึ่งเป็นสิ่งที่สเปก Marketplace วางไว้แล้ว
 *
 * WARNING ห้ามเขียน `JSON.stringify` เปล่าใน `dangerouslySetInnerHTML` อีก
 *    ด่าน `scripts/qa/test-json-ld-escape.ts` บล็อกให้แล้ว
 */

/** แปลงอ็อบเจกต์เป็นสตริง JSON ที่ปลอดภัยเมื่อฝังใน `<script type="application/ld+json">` */
export function jsonLdScript(data: unknown): string {
  return JSON.stringify(data)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026")
    // U+2028 / U+2029 เป็นตัวจบบรรทัดใน JavaScript แต่ไม่ใช่ใน JSON
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}
