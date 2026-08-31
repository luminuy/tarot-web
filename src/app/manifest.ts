import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "วิหารพยากรณ์ไพ่ทาโรต์ (Sacred Oracle Tarot)",
    short_name: "ไพ่ทาโรต์ 1909",
    description: "ดูดวงไพ่ทาโรต์ออนไลน์ 1909 Rider-Waite สับไพ่และเลือกหยิบไพ่ด้วยมือคุณเอง พร้อมแม่หมอ AI และระบบ Provably-Fair",
    start_url: "/",
    display: "standalone",
    background_color: "#05040a",
    theme_color: "#05040a",
    icons: [
      {
        src: "/cards/major-01.webp",
        sizes: "192x192",
        type: "image/webp",
      },
      {
        src: "/cards/major-01.webp",
        sizes: "512x512",
        type: "image/webp",
      },
    ],
  };
}
