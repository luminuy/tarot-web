import type { Metadata } from "next";
import { RouteLink as Link } from "@/components/ui/RouteLink";

import { buildAlternates, DEFAULT_SUPPORT_EMAIL, SITE_ORIGIN } from "@/lib/config/site";
import { buildPageOgImage } from "@/lib/media/og-image";
import { buildBreadcrumbJsonLd, homeCrumb } from "@/app/_shared/seo";
import { jsonLdScript } from "@/lib/seo/json-ld";
import { ThaiPhrases } from "@/components/ui/ThaiPhrases";
import { BxBack, BxChips, FrBig, FrFan, FrList, FrMock, FrPanel, Ui2Bento, Ui2FeatureRows } from "@/components/ui2/Ui2Blocks";
import { Ui2DocHead } from "@/components/ui2/Ui2PageHero";

/**
 * 🏛️ หน้า "เกี่ยวกับเรา"
 *
 * ⚠️ หน้านี้มีไว้เพื่อ **ความน่าเชื่อถือ** โดยเฉพาะ ไม่ใช่หน้าการตลาด
 *
 * ที่มา: รอบตรวจ SEO 2026-09-11 พบจาก Search Console ว่า **127 จาก 151 หน้าไทย
 * ติดสถานะ "พบแล้ว — ยังไม่ได้จัดทำดัชนี" และ Google ไม่เคยคลานเลยสักครั้ง**
 * เว็บที่ให้คำแนะนำเกี่ยวกับชีวิต (ใกล้โซน YMYL) แต่ไม่มีหน้าไหนบอกว่าใครรับผิดชอบ
 * ไม่มีช่องทางติดต่อ และผู้เขียนเป็นเพียงชื่อสมมติ = สัญญาณความเสี่ยงตรง ๆ
 *
 * ⚠️ กติกาของหน้านี้ — ห้ามละเมิดเด็ดขาด:
 * 1. **ห้ามกุคุณวุฒิ ใบรับรอง ประสบการณ์ หรือตัวตนของคนที่ไม่มีอยู่จริง**
 *    การสร้าง E-E-A-T ปลอมคือการหลอกทั้งผู้ใช้และ Google และย้อนกลับมาทำลายเว็บเอง
 * 2. **ต้องบอกตรง ๆ ว่าคำทำนายสร้างด้วย AI** — นี่ไม่ใช่จุดอ่อนที่ต้องซ่อน
 *    แต่เป็นจุดต่างที่คู่แข่งรายใหญ่ไม่มี เพราะของเรา "ตรวจสอบได้"
 * 3. ทุกข้อความบนหน้านี้ต้องเป็นความจริงที่พิสูจน์ได้จากตัวระบบเอง
 */

const aboutOgImages = buildPageOgImage({
  title: "เกี่ยวกับ SeerTarot",
  eyebrow: "วิหารพยากรณ์ไพ่ทาโรต์",
  cardImage: "major-02.jpg",
  alt: "เกี่ยวกับ SeerTarot วิหารพยากรณ์ไพ่ทาโรต์ออนไลน์",
});

/* ⚠️ ห้ามใส่คำว่า "SeerTarot" ใน TITLE — layout ต่อท้าย " · SeerTarot" ให้เองทุกหน้า
   ใส่เองจะกลายเป็นชื่อแบรนด์ซ้ำสองรอบ และด่านที่ 41 จะตกทันที
   เพดาน: ส่วนที่หน้าเขียนเองต้อง ≤ 60 ตัวอักษร (ดู `lib/config/meta-length.ts`) */
const TITLE = "เกี่ยวกับเรา — ใครอยู่เบื้องหลังและคำทำนายมาจากไหน";
const DESCRIPTION =
  "SeerTarot คือใคร คำทำนายสร้างขึ้นอย่างไร ระบบสุ่มไพ่ตรวจสอบได้จริงแบบไหน และเรารับผิดชอบอะไรบ้าง — เปิดเผยทุกขั้นตอนอย่างตรงไปตรงมา";

export const aboutMetadataTh: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: buildAlternates("/about"),
  openGraph: {
    title: `${TITLE} · SeerTarot`,
    description: DESCRIPTION,
    url: `${SITE_ORIGIN}/about`,
    siteName: "SeerTarot",
    type: "website",
    locale: "th_TH",
    images: aboutOgImages,
  },
  twitter: {
    card: "summary_large_image",
    title: `${TITLE} · SeerTarot`,
    description: DESCRIPTION,
    images: [aboutOgImages[0].url],
  },
};

export function AboutBodyTh() {
  const jsonLdBreadcrumbs = buildBreadcrumbJsonLd("th", [
    homeCrumb("th"),
    { name: "เกี่ยวกับเรา", path: "/about" },
  ]);

  /* AboutPage schema — บอก Google ตรง ๆ ว่าหน้านี้อธิบาย "ตัวตนขององค์กร"
     ซึ่งเป็นสิ่งที่ Quality Rater Guidelines มองหาเป็นอันดับแรกในเว็บให้คำแนะนำ */
  const jsonLdAbout = {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    name: TITLE,
    description: DESCRIPTION,
    url: `${SITE_ORIGIN}/about`,
    inLanguage: "th",
    mainEntity: {
      "@type": "Organization",
      name: "SeerTarot Sanctuary",
      alternateName: "วิหารพยากรณ์ไพ่ทาโรต์",
      url: SITE_ORIGIN,
      email: DEFAULT_SUPPORT_EMAIL,
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
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(jsonLdAbout) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(jsonLdBreadcrumbs) }} />

      <div className="v2-doc">
        <Ui2DocHead
          kind="seal"
          crumbs={[{ label: "หน้าแรก", href: "/" }, { label: "เกี่ยวกับเรา" }]}
          title="เกี่ยวกับ SeerTarot"
          lede="ใครอยู่เบื้องหลัง และคำทำนายมาจากไหน"
        />

        <section className="page-band page-band-compact page-band-tint space-y-3">
          <p className="text-sm text-ink leading-relaxed font-serif-th">
            SeerTarot คือเว็บดูดวงไพ่ยิปซีและไพ่ทาโรต์ออนไลน์ ที่สร้างขึ้นด้วยความตั้งใจเดียว —
            ทำให้การเปิดไพ่บนอินเทอร์เน็ต <strong>ตรวจสอบได้จริง</strong> ไม่ใช่แค่สุ่มภาพขึ้นมาแล้วบอกว่านี่คือดวงของคุณ
          </p>
          <p className="text-sm text-ink leading-relaxed font-serif-th">
            เราเป็นทีมเล็ก ๆ ที่ดูแลเว็บนี้ด้วยตัวเอง ไม่ได้อยู่ในเครือสำนักข่าวหรือบริษัทดูดวงใด
            สิ่งที่เราทำได้และทำมาตลอดคือ เปิดเผยกลไกทุกอย่างให้คุณตรวจสอบเองได้
          </p>
        </section>

      </div>

      {/* v4 (เจ้าของ 2026-10-17 "นำสองส่วนนี้ของหน้าแรกไปใช้กับหน้าอื่น"):
          สามเรื่องหลักเป็นแถวสลับซ้ายขวาแบบคำถามที่พบบ่อยหน้าแรก · ขอบเขตงานเป็นกล่องหลายขนาดแบบ "ครบในที่เดียว"
          ข้อความทุกย่อหน้าเดิมทุกตัวอักษร (หน้านี้มีไว้เพื่อความน่าเชื่อถือ — ดูกติกาหัวไฟล์) */}
      <div className="ui2-bk-wrap">
        <Ui2FeatureRows
          id="about-behind"
          kicker="เบื้องหลังทุกคำทำนาย"
          title="สามเรื่องที่เราเปิดเผยทั้งหมด"
          rows={[
            {
              id: "about-source",
              title: "คำทำนายมาจากไหน",
              mock: (
                <FrMock>
                  <FrFan cards={["major-01", "major-02", "major-09"]} />
                  <FrPanel label="AI อ่านจาก 3 อย่าง">
                    <FrList items={["ความหมายดั้งเดิมของไพ่ตามตำรา 1909", "ตำแหน่งที่ไพ่ตกในผัง", "คำถามที่คุณถาม"]} />
                  </FrPanel>
                </FrMock>
              ),
              body: (
                <>
                  <p>
                    <strong>คำทำนายบนเว็บนี้เขียนโดยปัญญาประดิษฐ์ (AI) ที่เราออกแบบและปรับแต่งเอง</strong> ไม่ใช่หมอดูมนุษย์
                    เราบอกเรื่องนี้ตรง ๆ ตั้งแต่ต้น เพราะคิดว่าคุณควรรู้ว่ากำลังอ่านอะไรอยู่
                  </p>
                  <p>
                    AI ของเราไม่ได้เดาคำตอบลอย ๆ แต่อ่านจากความหมายดั้งเดิมของไพ่แต่ละใบตามตำรา 1909 Rider-Waite-Smith
                    ประกอบกับตำแหน่งที่ไพ่ใบนั้นตกในผัง และคำถามที่คุณถาม แล้วเรียบเรียงออกมาเป็นภาษาที่อ่านเข้าใจ
                  </p>
                  <p>
                    ถ้าคุณอยากคุยกับคนจริง ๆ เรามีหน้า{" "}
                    <Link href="/readers" prefetch={false}>
                      แม่หมอตัวจริง
                    </Link>{" "}
                    แยกไว้ต่างหาก และจะบอกเสมอว่าอันไหนคือ AI อันไหนคือคน
                  </p>
                </>
              ),
            },
            {
              id: "about-fair",
              title: "ไพ่ถูกสุ่มจริงไหม — พิสูจน์ได้",
              mock: (
                <FrMock tint="teal">
                  <FrPanel label="ทุกครั้งที่เปิดไพ่">
                    <FrList boxed items={["ล็อกลำดับไพ่ทั้งสำรับไว้ก่อน", "โชว์รหัสล็อกให้คุณเห็น", "คุณเลือกไพ่เอง", "เปิดลำดับจริงให้เทียบ"]} />
                    <small>Provably Fair</small>
                  </FrPanel>
                </FrMock>
              ),
              body: (
                <>
                  <p>
                    นี่คือเรื่องที่เราให้ความสำคัญที่สุด เว็บดูดวงทั่วไปไม่มีทางให้คุณรู้เลยว่าไพ่ถูกสุ่มจริง
                    หรือถูกเลือกมาให้ทีหลังเพื่อให้เข้ากับคำทำนาย
                  </p>
                  <p>
                    ก่อนคุณจะเลือกไพ่ ระบบจะ <strong>ล็อกลำดับไพ่ทั้งสำรับไว้ก่อนแล้ว</strong> และโชว์ &quot;รหัสล็อก&quot;
                    ของลำดับนั้นให้คุณเห็น (เหมือนปิดผนึกซองไว้ต่อหน้าคุณ) เมื่อเปิดไพ่เสร็จ ระบบจะเปิดลำดับจริงให้ดู
                    คุณเอาไปเทียบได้เองว่าตรงกับรหัสล็อกเดิมไหม (หลักการนี้เรียกว่า Provably Fair)
                  </p>
                  <p>
                    แปลว่า <strong>เราไม่สามารถเปลี่ยนไพ่ของคุณหลังจากคุณเลือกแล้วได้เลย</strong> แม้จะอยากทำก็ทำไม่ได้
                    เพราะรหัสล็อกจะไม่ตรงทันที และคุณตรวจเองได้ทุกครั้ง
                  </p>
                </>
              ),
            },
            {
              id: "about-deck",
              title: "สำรับไพ่ที่เราใช้",
              mock: (
                <FrMock tint="violet">
                  <FrFan cards={["major-00", "major-10", "major-21"]} />
                  <FrPanel label="1909 Rider-Waite-Smith">
                    <FrBig>78</FrBig>
                    <small>ใบ ครบทั้งสำรับ · ไม่มีไพ่ที่สร้างขึ้นเอง</small>
                  </FrPanel>
                </FrMock>
              ),
              body: (
                <>
                  <p>
                    เราใช้ภาพไพ่จากสำรับ <strong>1909 Rider-Waite-Smith</strong> ต้นฉบับ ครบทั้ง 78 ใบ
                    ซึ่งเป็นสำรับที่เป็นรากของการอ่านไพ่ทาโรต์สมัยใหม่แทบทั้งหมด
                  </p>
                  <p>
                    เรามีกฎภายในข้อหนึ่งที่เข้มมาก คือ <strong>ห้ามสร้างไพ่ปลอมขึ้นมาเองเด็ดขาด</strong> ถ้าข้อมูลไพ่ใบไหน
                    มีปัญหา ระบบจะแจ้งให้คุณโหลดใหม่ แทนที่จะแอบใส่ไพ่ใบอื่นแทนให้เนียน ๆ
                  </p>
                </>
              ),
            },
          ]}
        />

        <Ui2Bento
          id="about-not"
          kicker="ขอบเขตที่ชัดเจน"
          title="สิ่งที่เราไม่ใช่ และไม่รับทำ"
          tiles={[
            {
              key: "advice",
              size: "wide",
              glow: "amber",
              lead: "ไม่ใช่",
              title: "คำแนะนำทางการแพทย์ กฎหมาย หรือการเงิน",
              desc: "คำทำนายมีไว้เพื่อทบทวนความคิดและให้กำลังใจ ถ้าคุณมีเรื่องสุขภาพ คดีความ หรือการลงทุน โปรดปรึกษาผู้เชี่ยวชาญตัวจริง",
              visual: <BxChips items={["สุขภาพ", "คดีความ", "การลงทุน"]} on={-1} />,
            },
            {
              key: "fate",
              size: "tall",
              glow: "teal",
              center: true,
              lead: "ไม่",
              title: "ฟันธงชะตา",
              desc: "ไม่ทำนายเรื่องความเป็นความตาย โรคร้าย หรือชี้ชะตาแบบฟันธง",
              visual: <BxBack />,
            },
            {
              key: "charms",
              lead: "ไม่ขาย",
              title: "เครื่องราง ไม่รับแก้กรรม",
              desc: "ไม่มีการเรียกเก็บเงินเพื่อสะเดาะเคราะห์",
            },
            {
              key: "train",
              lead: "ไม่เอา",
              title: "คำถามของคุณไปเทรน AI",
              desc: "ไม่เอาคำถามหรือบันทึกของคุณไปเทรนโมเดล AI",
              go: { href: "/privacy", label: "อ่านนโยบายความเป็นส่วนตัว" },
            },
          ]}
        />
      </div>

      {/* บทที่เหลือต่อเลข 02 03 จากบทแนะนำด้านบน */}
      <div className="v2-doc" style={{ counterReset: "doc-sec 1" }}>
        <section className="page-band page-band-compact space-y-3">
          <h2 className="text-lg font-bold text-gold-ink font-serif-th"><ThaiPhrases>ถ้าคุณกำลังรู้สึกแย่มาก</ThaiPhrases></h2>
          <p className="text-sm text-ink leading-relaxed font-serif-th">
            ถ้าระบบตรวจพบว่าคำถามของคุณมีสัญญาณของการทำร้ายตัวเอง เราจะหยุดการทำนายทันที
            และแสดงช่องทางขอความช่วยเหลือแทน เพราะเรื่องแบบนี้ไม่ควรฝากไว้กับไพ่
          </p>
          <div className="altar-card-porcelain p-4 space-y-1">
            <p className="text-sm text-ink font-serif-th">
              <strong>สายด่วนสุขภาพจิต กรมสุขภาพจิต — โทร 1323</strong> (ฟรี ตลอด 24 ชั่วโมง)
            </p>
            <p className="text-xs text-muted font-serif-th">
              ถ้าอยู่ต่างประเทศ ใช้สายด่วนในพื้นที่ของคุณ เช่น 988 ในสหรัฐอเมริกา
            </p>
          </div>
        </section>

        <section className="page-band page-band-compact page-band-tint space-y-3">
          <h2 className="text-lg font-bold text-gold-ink font-serif-th"><ThaiPhrases>ติดต่อเรา</ThaiPhrases></h2>
          <p className="text-sm text-ink leading-relaxed font-serif-th">
            มีอะไรอยากบอก อยากติ อยากแจ้งปัญหา หรือเจอคำทำนายที่ไม่เหมาะสม เขียนมาได้เลยที่{" "}
            <a
              href={`mailto:${DEFAULT_SUPPORT_EMAIL}`}
              className="text-gold-ink underline hover:text-gold-ink break-all"
            >
              {DEFAULT_SUPPORT_EMAIL}
            </a>{" "}
            เราอ่านทุกฉบับ · ดูช่องทางทั้งหมดได้ที่หน้า{" "}
            <Link href="/contact" prefetch={false} className="text-gold-ink underline hover:text-gold-ink">
              ติดต่อเรา
            </Link>
          </p>
        </section>
      </div>
    </main>
  );
}
