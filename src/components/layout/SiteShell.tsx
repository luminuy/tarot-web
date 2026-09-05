import type { ReactNode } from "react";
import { SiteHeader, type SiteHeaderProps } from "@/components/layout/SiteHeader";
import { SiteFooter, type SiteFooterProps } from "@/components/layout/SiteFooter";

export interface SiteShellProps {
  children: ReactNode;
  headerProps?: SiteHeaderProps;
  footerProps?: SiteFooterProps;
}

/**
 * 🏛️ SiteShell — โครงครอบมาตรฐานของทั้งวิหารพยากรณ์ (Server Component)
 * ประกอบด้วย <SiteHeader/> + {children} + <SiteFooter/>
 */
export function SiteShell({ children, headerProps, footerProps }: SiteShellProps) {
  return (
    <>
      <SiteHeader {...headerProps} />
      {children}
      <SiteFooter {...footerProps} />
    </>
  );
}
