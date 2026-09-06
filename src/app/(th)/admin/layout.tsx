import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "แผงแอดมิน",
  robots: { index: false, follow: false, nocache: true },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-[#F8F6F2] text-[#29261F] font-sans selection:bg-[#A58A5C]/25 antialiased">
      {children}
    </main>
  );
}
