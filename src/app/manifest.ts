import { MetadataRoute } from "next";

/**
 * 📱 Web App Manifest — ใช้เหมือนแอปจริง (REFLECTION_JOURNAL_PLAN 1.10)
 * ทางลัด 3 ปุ่มบนไอคอนหน้าจอโฮม (กดค้างที่ไอคอน) — ไอคอนเป็นภาพไพ่ 1909 จริง ไม่ใช่อิโมจิ (กฎเหล็กข้อ 2)
 * สร้างไอคอนใหม่ด้วย `npx tsx scripts/gen-shortcut-icons.ts`
 * ⚠️ `id` ห้ามเปลี่ยนหลังเปิดใช้ — เบราว์เซอร์ใช้เป็นตัวตนของแอปที่ติดตั้งไว้ เปลี่ยน = กลายเป็นแอปใหม่
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "SeerTarot · ดูดวงไพ่ทาโรต์ออนไลน์ 1909 Rider-Waite",
    short_name: "SeerTarot",
    description:
      "ดูดวงไพ่ทาโรต์ออนไลน์ 1909 Rider-Waite สับไพ่และเลือกหยิบไพ่ด้วยมือคุณเอง พร้อมแม่หมอ AI และระบบความโปร่งใส Provably-Fair",
    start_url: "/?utm_source=pwa",
    scope: "/",
    display: "standalone",
    display_override: ["standalone", "minimal-ui"],
    orientation: "portrait",
    background_color: "#FAF7F2",
    theme_color: "#FAF7F2",
    lang: "th",
    categories: ["lifestyle", "entertainment"],
    icons: [
      {
        src: "/icons/icon-192x192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icons/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
    shortcuts: [
      {
        name: "ไพ่ประจำวัน",
        short_name: "ไพ่วันนี้",
        description: "พิธีเช้า 2 นาที — เปิดไพ่ประจำวันและถามตัวเองสักข้อ",
        url: "/daily?utm_source=pwa_shortcut",
        icons: [{ src: "/icons/shortcut-daily.png", sizes: "96x96", type: "image/png" }],
      },
      {
        name: "สมุดดวงของฉัน",
        short_name: "สมุดดวง",
        description: "คำอ่านทั้งหมด · ปฏิทิน · เรื่องที่ติดตาม",
        url: "/journal?utm_source=pwa_shortcut",
        icons: [{ src: "/icons/shortcut-journal.png", sizes: "96x96", type: "image/png" }],
      },
      {
        name: "ไพ่ 78 ใบ",
        short_name: "ไพ่ 78 ใบ",
        description: "สารานุกรมไพ่ทาโรต์ 1909 ครบทุกใบ (เปิดได้แม้ออฟไลน์เมื่อติดตั้งแอป)",
        url: "/cards?utm_source=pwa_shortcut",
        icons: [{ src: "/icons/shortcut-cards.png", sizes: "96x96", type: "image/png" }],
      },
    ],
  };
}
