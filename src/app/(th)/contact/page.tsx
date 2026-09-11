import type { Metadata } from "next";
import Link from "next/link";

import { BRAND_SOCIAL_PROFILES, buildAlternates, DEFAULT_SUPPORT_EMAIL, SITE_ORIGIN } from "@/lib/config/site";
import { buildPageOgImage } from "@/lib/media/og-image";
import { buildBreadcrumbJsonLd, homeCrumb } from "@/app/_shared/seo";

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

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: buildAlternates("/contact"),
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

export default function ContactPage() {
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
      name: "SeerTarot Sanctuary",
      alternateName: "วิหารพยากรณ์ไพ่ทาโรต์",
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
    <main className="min-h-screen bg-[#F3F0EA] text-[#29261F]">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdContact) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdBreadcrumbs) }} />

      <div className="max-w-3xl mx-auto px-6 py-16 space-y-10">
        <div className="text-center space-y-3 pb-6 border-b border-[#D5CEC2]/40">
          <h1 className="text-2xl sm:text-3xl font-bold text-[#29261F] font-serif-th">ติดต่อเรา</h1>
          <p className="text-xs text-[#635B4E]">เราอ่านทุกข้อความที่ส่งเข้ามา</p>
        </div>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-[#A58A5C] font-serif-th">อีเมล</h2>
          <div className="rounded-xl border border-[#D5CEC2] bg-[#FFFFFF] p-4 space-y-2">
            <a
              href={`mailto:${DEFAULT_SUPPORT_EMAIL}`}
              className="text-base text-[#8F5C1A] underline hover:text-[#A58A5C] font-serif-th break-all"
            >
              {DEFAULT_SUPPORT_EMAIL}
            </a>
            <p className="text-xs text-[#635B4E] font-serif-th">
              ช่องทางหลัก · ตอบกลับภายใน 1–3 วันทำการ
            </p>
          </div>
        </section>

        {TIKTOK_URL && (
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-[#A58A5C] font-serif-th">ติดตามเรา</h2>
            <div className="rounded-xl border border-[#D5CEC2] bg-[#FFFFFF] p-4 space-y-2">
              <a
                href={TIKTOK_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-base text-[#8F5C1A] underline hover:text-[#A58A5C] font-serif-th break-all"
              >
                TikTok · @seerada.tarot
              </a>
              <p className="text-xs text-[#635B4E] font-serif-th">คลิปสั้นเรื่องความหมายไพ่และวิธีอ่านผัง</p>
            </div>
          </section>
        )}

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-[#A58A5C] font-serif-th">เรื่องที่เขียนมาได้</h2>
          <ul className="space-y-2 text-sm text-[#29261F] list-disc list-inside leading-relaxed font-serif-th">
            <li>
              <strong>แจ้งปัญหาการใช้งาน</strong> — ไพ่ไม่ขึ้น คำทำนายค้าง เข้าสู่ระบบไม่ได้ ฯลฯ
              ถ้าแนบภาพหน้าจอมาด้วยจะช่วยเราได้มาก
            </li>
            <li>
              <strong>ติชมคำทำนาย</strong> — ถ้าเจอคำทำนายที่อ่านแล้วรู้สึกไม่เหมาะสม ไม่สุภาพ
              หรือชี้นำในทางที่ไม่ดี บอกเราได้เลย เราเอาไปปรับจริง
            </li>
            <li>
              <strong>ขอลบข้อมูลส่วนตัว</strong> — ทำเองได้ทันทีจากหน้า{" "}
              <Link href="/privacy" prefetch={false} className="text-[#8F5C1A] underline hover:text-[#A58A5C]">
                นโยบายความเป็นส่วนตัว
              </Link>{" "}
              หรือเขียนมาให้เราจัดการให้
            </li>
            <li>
              <strong>ความร่วมมือและการติดต่อเชิงธุรกิจ</strong> — รวมถึงแม่หมอที่สนใจเข้าร่วมให้บริการ
            </li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-[#A58A5C] font-serif-th">เรื่องที่ตอบให้ไม่ได้</h2>
          <p className="text-sm text-[#29261F] leading-relaxed font-serif-th">
            เราไม่รับทำนายดวงทางอีเมล ไม่รับแก้กรรม และไม่ให้คำแนะนำทางการแพทย์ กฎหมาย หรือการเงิน
            ถ้าอยากเปิดไพ่ เชิญที่{" "}
            <Link href="/" prefetch={false} className="text-[#8F5C1A] underline hover:text-[#A58A5C]">
              หน้าแรก
            </Link>{" "}
            ได้เลย ฟรีและไม่ต้องรอ
          </p>
          <p className="text-sm text-[#29261F] leading-relaxed font-serif-th">
            หากคุณกำลังเผชิญภาวะวิกฤตทางใจ กรุณาโทร <strong>สายด่วนสุขภาพจิต 1323</strong> (ฟรี ตลอด 24 ชั่วโมง)
            ซึ่งมีผู้เชี่ยวชาญจริงรออยู่ปลายสาย — เราไม่สามารถช่วยเรื่องนี้ทางอีเมลได้ทันท่วงที
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-[#A58A5C] font-serif-th">อยากรู้จักเราก่อน</h2>
          <p className="text-sm text-[#29261F] leading-relaxed font-serif-th">
            อ่านได้ที่หน้า{" "}
            <Link href="/about" prefetch={false} className="text-[#8F5C1A] underline hover:text-[#A58A5C]">
              เกี่ยวกับเรา
            </Link>{" "}
            ซึ่งอธิบายว่าคำทำนายสร้างขึ้นอย่างไร และระบบสุ่มไพ่ของเราตรวจสอบได้จริงแบบไหน
          </p>
        </section>
      </div>
    </main>
  );
}
