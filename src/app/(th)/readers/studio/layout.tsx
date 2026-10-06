import type { Metadata } from "next";
import { noindexAlternates } from "@/lib/config/site";

/** หน้าสตูดิโอเป็น Client Component — ประกาศ noindex ผ่าน layout (แบบเดียวกับแผงคิว `/readers/console`) */
export const metadata: Metadata = {
  title: "สตูดิโอแม่หมอ",
  robots: { index: false, follow: false },
  alternates: noindexAlternates(),
  referrer: "no-referrer",
};

export default function ReaderStudioLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
