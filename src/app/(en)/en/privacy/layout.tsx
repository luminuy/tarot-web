import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";

/**
 * Section layout for /en/privacy providing SiteHeader and SiteFooter.
 * Exact twin of src/app/(th)/privacy/layout.tsx.
 */
export default function EnPrivacyLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteHeader />
      {children}
      <SiteFooter spacing="tight" />
    </>
  );
}
