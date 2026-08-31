import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "แผงแอดมิน",
  robots: { index: false, follow: false, nocache: true },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-[#05040a] text-[#f5deaa] font-sans selection:bg-[#ffd700]/30">
      {children}
    </main>
  );
}
