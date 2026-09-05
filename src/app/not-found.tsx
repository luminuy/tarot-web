import type { Metadata } from "next";
import Link from "next/link";

/**
 * หน้า 404 ของเว็บ
 * ก่อนหน้านี้ไม่มีไฟล์นี้ `notFound()` จาก /cards/[id] และ /blog/[slug] จึงตกไปที่
 * หน้า default ของ Next ซึ่งไม่มีภาษาไทย ไม่มีแบรนด์ และไม่มีทางกลับเข้าเว็บ
 */
export const metadata: Metadata = {
  title: "ไม่พบหน้าที่คุณกำลังตามหา",
  description: "หน้าที่คุณเปิดอาจถูกย้ายหรือไม่มีอยู่แล้ว กลับไปเลือกผังพยากรณ์หรือเปิดคัมภีร์ไพ่ 78 ใบได้ที่นี่",
  robots: { index: false, follow: true },
};

const LINKS = [
  { href: "/", label: "เริ่มดูดวงที่หน้าแรก" },
  { href: "/cards", label: "คัมภีร์ไพ่ 78 ใบ" },
  { href: "/spreads", label: "ผังพยากรณ์ 25 แบบ" },
  { href: "/blog", label: "บทความดูดวง" },
];

export default function NotFound() {
  return (
    <main className="min-h-screen bg-[#F3F0EA] text-[#29261F] flex items-center justify-center px-6 py-20">
      <div className="max-w-lg w-full text-center space-y-8">
        <div className="space-y-4">
          <span aria-hidden="true" className="block text-4xl font-serif-th font-bold text-[#A58A5C]">404</span>
          <h1 className="text-2xl sm:text-3xl font-bold font-serif-th leading-normal pt-1">
            ไม่พบหน้าที่คุณกำลังตามหา
          </h1>
          <p className="text-sm text-[#635B4E] font-serif-th leading-relaxed">
            หน้านี้อาจถูกย้ายหรือไม่เคยมีอยู่ ลองเลือกทางใดทางหนึ่งด้านล่างเพื่อกลับเข้าวิหารอีกครั้ง
          </p>
        </div>

        <nav aria-label="ทางลัดกลับเข้าเว็บ" className="flex flex-col sm:flex-row flex-wrap justify-center gap-3">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="px-5 py-2.5 rounded-full bg-[#FFFFFF] border border-[#D5CEC2] text-sm font-serif-th shadow-xs transition-colors hover:text-[#8F5C1A] hover:border-[#A58A5C]"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <p className="text-xs text-[#635B4E] font-serif-th">
          <span className="text-[#3A7044] font-medium">สายด่วนสุขภาพจิต 1323</span>
        </p>
      </div>
    </main>
  );
}
