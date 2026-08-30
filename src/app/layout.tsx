import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "วิหารพยากรณ์ไพ่ทาโรต์ กับแม่หมอ AI",
    template: "%s · วิหารพยากรณ์ไพ่ทาโรต์",
  },
  description:
    "ดูดวงไพ่ทาโรต์ออนไลน์ สับไพ่และเลือกหยิบไพ่ด้วยมือคุณเอง แล้วให้แม่หมอ AI อ่านให้ฟังทีละใบ พร้อมหลักฐานความสุ่มโปร่งใสที่ตรวจสอบได้",
  keywords: ["ไพ่ทาโรต์", "ดูดวงออนไลน์", "เปิดไพ่", "ทาโรต์ฟรี", "แม่หมอ AI", "ดูดวงความรัก"],
  openGraph: { type: "website", locale: "th_TH", siteName: "วิหารพยากรณ์ไพ่ทาโรต์" },
};

export const viewport: Viewport = {
  themeColor: "#0a0812",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Serif+Thai:wght@400;600;700&family=Sarabun:wght@300;400;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="starfield min-h-dvh">{children}</body>
    </html>
  );
}
