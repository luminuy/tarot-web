import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";

/**
 * Section layout for /en/contact providing SiteHeader and SiteFooter.
 * Exact twin of src/app/(th)/contact/layout.tsx.
 */
export default function EnContactLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteHeader />
      {children}
      <SiteFooter spacing="tight" />
    </>
  );
}
