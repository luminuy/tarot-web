import React from "react";

/**
 * 🔗 `next/link` ฉบับ Astro — คืน `<a>` ธรรมดา
 * ===========================================================================
 * คอมโพเนนต์ที่ใช้ร่วมกันทั้งเว็บ (`LocaleLink` · `SiteHeader` · `SiteFooter` ฯลฯ)
 * นำเข้า `next/link` อยู่แล้ว · ไฟล์นี้ถูกเสียบแทนด้วย `vite.resolve.alias`
 * ตอนบิลด์ด้วย Astro เท่านั้น — โค้ดต้นทางจึงไม่ต้องแก้แม้แต่บรรทัดเดียว
 *
 * การนำทางบนหน้าที่เรนเดอร์ด้วย Astro เป็นแบบ MPA (โหลดหน้าใหม่จริง)
 * ความเร็วมาจาก **Speculation Rules** ที่ประกาศไว้ใน <head> ของทุกหน้าอยู่แล้ว
 * (`src/app/_shared/speculation-rules.ts`) ซึ่งอุ่นหน้าปลายทางไว้ล่วงหน้าในเบราว์เซอร์
 * — ไม่ต้องมี router ฝั่งไคลเอนต์ และไม่ต้องดาวน์โหลดเพย์โหลด RSC
 *
 * ⚠️ พร็อพเฉพาะของ Next (`prefetch` · `replace` · `scroll` · `shallow` ฯลฯ)
 *    ถูกตัดทิ้งโดยตั้งใจ ห้ามส่งต่อลง DOM ไม่งั้น React จะเตือน unknown prop
 */
type NextLinkProps = Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & {
  href: string | { pathname?: string };
  prefetch?: boolean | null;
  replace?: boolean;
  scroll?: boolean;
  shallow?: boolean;
  passHref?: boolean;
  legacyBehavior?: boolean;
  locale?: string | false;
};

const NEXT_ONLY_PROPS = [
  "prefetch",
  "replace",
  "scroll",
  "shallow",
  "passHref",
  "legacyBehavior",
  "locale",
] as const;

export default function Link(props: NextLinkProps) {
  const anchorProps: Record<string, unknown> = { ...props };
  for (const key of NEXT_ONLY_PROPS) delete anchorProps[key];

  const { href } = props;
  anchorProps.href = typeof href === "string" ? href : (href?.pathname ?? "#");

  return React.createElement("a", anchorProps);
}

export { Link };
