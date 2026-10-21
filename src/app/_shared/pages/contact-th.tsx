import type { Metadata } from "next";
import { RouteLink as Link } from "@/components/ui/RouteLink";

import { BRAND_SOCIAL_LINKS, BRAND_SOCIAL_PROFILES, buildAlternates, DEFAULT_SUPPORT_EMAIL, SITE_ORIGIN } from "@/lib/config/site";
import { buildPageOgImage } from "@/lib/media/og-image";
import { buildBreadcrumbJsonLd, homeCrumb } from "@/app/_shared/seo";
import { jsonLdScript } from "@/lib/seo/json-ld";
import { SOCIAL_BADGE_STYLE, SocialGlyph } from "@/components/ui/SocialIcons";
import { ThaiPhrases } from "@/components/ui/ThaiPhrases";
import { BxBack, BxChips, Ui2Bento } from "@/components/ui2/Ui2Blocks";
import { Ui2DocHead } from "@/components/ui2/Ui2PageHero";

/**
 * ✉️ หน้า "ติดต่อเรา"
 *
 * ⚠️ เหตุผลที่ต้องเป็นหน้าแยก ไม่ใช่แค่ท้ายหน้า "เกี่ยวกับเรา":
 * Google มองหา "ช่องทางติดต่อที่เข้าถึงได้ง่าย" เป็นสัญญาณความน่าเชื่อถือโดยตรง
 * โดยเฉพาะเว็บที่ให้คำแนะนำเกี่ยวกับชีวิต · เว็บที่ติดต่อใครไม่ได้เลย = ความเสี่ยง
 *
 * ⚠️ ห้ามใส่ที่อยู่ เบอร์โทร หรือเลขทะเบียนที่ไม่มีอยู่จริงเด็ดขาด
 * ใส่เฉพาะช่องทางที่ **ใช้งานได้จริงและตรวจสอบแล้ว** เท่านั้น
 * ตอนนี้มี 2 ช่องทาง: อีเมล `support@` (Cloudflare Email Routing ส่งต่อจริง) และ TikTok ทางการ
 */

const contactOgImages = buildPageOgImage({
  title: "ติดต่อ SeerTarot",
  eyebrow: "วิหารพยากรณ์ไพ่ทาโรต์",
  cardImage: "major-08.jpg",
  alt: "ติดต่อทีมงาน SeerTarot",
});

/* ⚠️ ห้ามใส่คำว่า "SeerTarot" ใน TITLE — layout ต่อท้าย " · SeerTarot" ให้เองทุกหน้า */
const TITLE = "ติดต่อเรา — แจ้งปัญหา ติชม หรือสอบถามทีมงาน";
const DESCRIPTION =
  "ช่องทางติดต่อทีมงาน SeerTarot สำหรับแจ้งปัญหาการใช้งาน ติชมคำทำนาย ขอลบข้อมูลส่วนตัว หรือสอบถามเรื่องความร่วมมือ";

const TIKTOK_URL = BRAND_SOCIAL_PROFILES.find((u) => u.includes("tiktok.com"));

const SOCIAL_NOTES: Record<string, string> = {
  LINE: "ทักแชท รับไพ่ประจำวันและข่าวใหม่",
  Facebook: "โพสต์ความหมายไพ่และดวงรายสัปดาห์",
  TikTok: "คลิปสั้นเรื่องความหมายไพ่และวิธีอ่านผัง",
};


export const contactMetadataTh: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: buildAlternates("/contact", { englishTwin: true }),
  openGraph: {
    title: `${TITLE} · SeerTarot`,
    description: DESCRIPTION,
    url: `${SITE_ORIGIN}/contact`,
    siteName: "SeerTarot",
    type: "website",
    locale: "th_TH",
    images: contactOgImages,
  },
  twitter: {
    card: "summary_large_image",
    title: `${TITLE} · SeerTarot`,
    description: DESCRIPTION,
    images: [contactOgImages[0].url],
  },
};

export function ContactBodyTh() {
  const jsonLdBreadcrumbs = buildBreadcrumbJsonLd("th", [
    homeCrumb("th"),
    { name: "ติดต่อเรา", path: "/contact" },
  ]);

  const jsonLdContact = {
    "@context": "https://schema.org",
    "@type": "ContactPage",
    name: TITLE,
    description: DESCRIPTION,
    url: `${SITE_ORIGIN}/contact`,
    inLanguage: "th",
    mainEntity: {
      "@type": "Organization",
      name: "SeerTarot",
      alternateName: ["SeerTarot Sanctuary", "วิหารพยากรณ์ไพ่ทาโรต์"],
      url: SITE_ORIGIN,
      email: DEFAULT_SUPPORT_EMAIL,
      sameAs: [...BRAND_SOCIAL_PROFILES],
      contactPoint: {
        "@type": "ContactPoint",
        contactType: "customer support",
        email: DEFAULT_SUPPORT_EMAIL,
        availableLanguage: ["th", "en"],
      },
    },
  };

  return (
    <main id="main-content" tabIndex={-1} className="min-h-screen text-ink">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(jsonLdContact) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(jsonLdBreadcrumbs) }} />

      <div className="v2-doc">
        <Ui2DocHead
          kind="letter"
          crumbs={[{ label: "หน้าแรก", href: "/" }, { label: "ติดต่อเรา" }]}
          title="ติดต่อเรา"
          kicker="ตอบกลับภายใน 1–3 วันทำการ"
          lede="เราอ่านทุกข้อความที่ส่งเข้ามา"
        />

        <section className="page-band page-band-compact page-band-tint space-y-3">
          <h2 className="text-lg font-bold text-gold-ink font-serif-th"><ThaiPhrases>อีเมล</ThaiPhrases></h2>
          <div className="altar-card-porcelain !rounded-xl p-4 space-y-2">
            <a
              href={`mailto:${DEFAULT_SUPPORT_EMAIL}`}
              className="text-base text-gold-ink underline hover:text-gold-ink-deep font-serif-th break-all"
            >
              {DEFAULT_SUPPORT_EMAIL}
            </a>
            <p className="text-xs text-muted font-serif-th">
              ช่องทางหลัก · ตอบกลับภายใน 1–3 วันทำการ
            </p>
          </div>
        </section>

        {TIKTOK_URL && (
          <section className="page-band page-band-compact space-y-3">
            <h2 className="text-lg font-bold text-gold-ink font-serif-th"><ThaiPhrases>ติดตามเรา</ThaiPhrases></h2>
            <ul className="space-y-3">
              {BRAND_SOCIAL_LINKS.map((social) => (
                <li key={social.name} className="altar-card-porcelain !rounded-xl p-4 flex items-center gap-4">
                  <span
                    aria-hidden="true"
                    className="flex items-center justify-center w-11 h-11 rounded-full shrink-0 overflow-hidden shadow-[0_4px_12px_rgba(40,28,14,0.18)]"
                    style={SOCIAL_BADGE_STYLE[social.name]}
                  >
                    <SocialGlyph name={social.name} />
                  </span>
                  <span className="min-w-0 space-y-1">
                    <a
                      href={social.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block text-base text-gold-ink underline hover:text-gold-ink-deep font-serif-th break-all"
                    >
                      {social.name} · {social.handle}
                    </a>
                    <span className="block text-xs text-muted font-serif-th">{SOCIAL_NOTES[social.name]}</span>
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}

      </div>

      {/* v4 (เจ้าของ 2026-10-17 "นำสองส่วนนี้ของหน้าแรกไปใช้กับหน้าอื่น") — หัวข้อที่เขียนมาได้เป็นกล่องหลายขนาดแบบ "ครบในที่เดียว" */}
      <div className="ui2-bk-wrap">
        <Ui2Bento
          id="contact-topics"
          kicker="เขียนถึงเรา"
          title="เรื่องที่เขียนมาได้"
          tiles={[
            {
              key: "support",
              size: "wide",
              glow: "amber",
              lead: "แจ้ง",
              title: "ปัญหาการใช้งาน",
              desc: "ไพ่ไม่ขึ้น คำทำนายค้าง เข้าสู่ระบบไม่ได้ ฯลฯ ถ้าแนบภาพหน้าจอมาด้วยจะช่วยเราได้มาก",
              visual: <BxChips items={["ไพ่ไม่ขึ้น", "คำทำนายค้าง", "เข้าสู่ระบบไม่ได้"]} on={-1} />,
            },
            {
              key: "feedback",
              size: "tall",
              glow: "teal",
              center: true,
              lead: "ติชม",
              title: "คำทำนาย",
              desc: "ถ้าเจอคำทำนายที่อ่านแล้วรู้สึกไม่เหมาะสม ไม่สุภาพ หรือชี้นำในทางที่ไม่ดี บอกเราได้เลย เราเอาไปปรับจริง",
              visual: <BxBack />,
            },
            {
              key: "privacy",
              lead: "ขอลบ",
              title: "ข้อมูลส่วนตัว",
              desc: "ทำเองได้ทันทีจากหน้านโยบายความเป็นส่วนตัว หรือเขียนมาให้เราจัดการให้",
              go: { href: "/privacy", label: "ไปหน้านโยบายความเป็นส่วนตัว" },
            },
            {
              key: "partner",
              lead: "ร่วมงาน",
              title: "เชิงธุรกิจ",
              desc: "ความร่วมมือและการติดต่อเชิงธุรกิจ รวมถึงแม่หมอที่สนใจเข้าร่วมให้บริการ",
            },
          ]}
        />
      </div>

      {/* บทที่เหลือต่อเลขจากบทด้านบน (อีเมล + ช่องทางโซเชียลถ้ามี) */}
      <div className="v2-doc" style={{ counterReset: `doc-sec ${TIKTOK_URL ? 2 : 1}` }}>

        <section className="page-band page-band-compact space-y-3">
          <h2 className="text-lg font-bold text-gold-ink font-serif-th"><ThaiPhrases>เรื่องที่ตอบให้ไม่ได้</ThaiPhrases></h2>
          <p className="text-sm text-ink leading-relaxed font-serif-th">
            เราไม่รับทำนายดวงทางอีเมล ไม่รับแก้กรรม และไม่ให้คำแนะนำทางการแพทย์ กฎหมาย หรือการเงิน
            ถ้าอยากเปิดไพ่ เชิญที่{" "}
            <Link href="/" prefetch={false} className="text-gold-ink underline hover:text-gold-ink">
              หน้าแรก
            </Link>{" "}
            ได้เลย ฟรีและไม่ต้องรอ
          </p>
          <p className="text-sm text-ink leading-relaxed font-serif-th">
            หากคุณกำลังเผชิญภาวะวิกฤตทางใจ กรุณาโทร <strong>สายด่วนสุขภาพจิต 1323</strong> (ฟรี ตลอด 24 ชั่วโมง)
            ซึ่งมีผู้เชี่ยวชาญจริงรออยู่ปลายสาย — เราไม่สามารถช่วยเรื่องนี้ทางอีเมลได้ทันท่วงที
          </p>
        </section>

        <section className="page-band page-band-compact page-band-tint space-y-3">
          <h2 className="text-lg font-bold text-gold-ink font-serif-th"><ThaiPhrases>อยากรู้จักเราก่อน</ThaiPhrases></h2>
          <p className="text-sm text-ink leading-relaxed font-serif-th">
            อ่านได้ที่หน้า{" "}
            <Link href="/about" prefetch={false} className="text-gold-ink underline hover:text-gold-ink">
              เกี่ยวกับเรา
            </Link>{" "}
            ซึ่งอธิบายว่าคำทำนายสร้างขึ้นอย่างไร และระบบสุ่มไพ่ของเราตรวจสอบได้จริงแบบไหน
          </p>
        </section>
      </div>
    </main>
  );
}
