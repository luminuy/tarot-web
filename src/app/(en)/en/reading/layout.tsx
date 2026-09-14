import type { Metadata } from "next";

/**
 * The /reading chamber holds private, session-specific tarot dialogue.
 * It restores state from sessionStorage; direct entry without an active session is empty.
 * Marked as noindex to prevent indexing private sessions.
 */
export const metadata: Metadata = {
  title: "Chat with Tarot Oracle",
  robots: { index: false, follow: true },
};

export default function EnglishReadingLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
