import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "SeerTarot ✦ ดูดวงไพ่ทาโรต์ออนไลน์ 1909 Rider-Waite",
    short_name: "SeerTarot",
    description:
      "ดูดวงไพ่ทาโรต์ออนไลน์ 1909 Rider-Waite สับไพ่และเลือกหยิบไพ่ด้วยมือคุณเอง พร้อมแม่หมอ AI และระบบความโปร่งใส Provably-Fair",
    start_url: "/",
    display: "standalone",
    background_color: "#FAF7F2",
    theme_color: "#FAF7F2",
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
