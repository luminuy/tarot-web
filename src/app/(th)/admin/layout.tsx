import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "แผงแอดมิน",
  robots: { index: false, follow: false, nocache: true },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <main id="main-content" tabIndex={-1} className="min-h-screen bg-surface-pale text-ink font-sans selection:bg-gold/25 antialiased">
      {children}
    </main>
  );
}
