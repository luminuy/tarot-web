import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "SeerTarot ✦ ดูดวงไพ่ทาโรต์ออนไลน์ 1909 Rider-Waite",
    short_name: "SeerTarot",
    description:
      "ดูดวงไพ่ทาโรต์ออนไลน์ 1909 Rider-Waite สับไพ่และเลือกหยิบไพ่ด้วยมือคุณเอง พร้อมแม่หมอ AI และระบบความโปร่งใส Provably-Fair",
    start_url: "/",
    display: "standalone",
    background_color: "#05040a",
    theme_color: "#05040a",
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
  };
}
