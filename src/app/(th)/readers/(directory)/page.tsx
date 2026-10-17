import { listPublicApprovedReaders, type PublicReaderProfile } from "@/lib/marketplace/readers.repo";
import { listLiveReaderIds } from "@/lib/marketplace/queue.repo";
import { CONSULTATION_MINUTES } from "@/lib/marketplace/offer";
import { getAllReaderRatings } from "@/lib/marketplace/reviews.repo";
import { ReadersDirectory } from "@/components/readers/ReadersDirectory";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { buildAlternates, SITE_ORIGIN } from "@/lib/config/site";
import { buildPageOgImage } from "@/lib/media/og-image";
import type { Metadata } from "next";
import { jsonLdScript } from "@/lib/seo/json-ld";
import { ThaiPhrases } from "@/components/ui/ThaiPhrases";
import { ConsultHeroStage } from "@/components/marketplace/ConsultStage";
import { Ui2PageHero } from "@/components/ui2/Ui2PageHero";
import { Ui2Window } from "@/components/ui2/Ui2Showcase";
import { BxBack, BxChips, FrInput, FrList, FrMock, FrPanel, FrPills, Ui2Bento, Ui2FeatureRows } from "@/components/ui2/Ui2Blocks";
import { Ui2NextSteps } from "@/components/ui2/Ui2NextSteps";
import "@/styles/ui2-page.css";
import "@/styles/ui2-page-fx.css";
import "@/styles/ui2-showcase.css";
import "@/styles/v3-readers.css";

export const dynamic = "force-dynamic";

const readersOgImages = buildPageOgImage({
  title: "ปรึกษาแม่หมอตัวจริง",
  eyebrow: "สารบบแม่หมอไพ่ยิปซี",
  cardImage: "major-02.jpg",
  alt: "ปรึกษาแม่หมอตัวจริงและเปิดไพ่พยากรณ์สด 1909 Rider-Waite",
});

export const metadata: Metadata = {
  title: "หมอดูไพ่ยิปซี ปรึกษาแม่หมอตัวจริงและเปิดไพ่พยากรณ์สด",
  description:
    "รวมหมอดูไพ่ยิปซีและแม่หมอผู้เชี่ยวชาญศาสตร์ไพ่ทาโรต์ 1909 ปรึกษาดูดวงความรัก การงาน การเงิน พร้อมระบบดูดวงไพ่ยิปซีฟรีด้วยแม่หมอ AI ตรวจสอบได้จริง",
  alternates: buildAlternates("/readers"),
  openGraph: {
    title: "หมอดูไพ่ยิปซี ปรึกษาแม่หมอตัวจริง · SeerTarot",
    description: "รวมหมอดูไพ่ยิปซีและแม่หมอผู้เชี่ยวชาญศาสตร์ไพ่ทาโรต์ 1909 ปรึกษาดูดวงความรัก การงาน การเงิน",
    url: `${SITE_ORIGIN}/readers`,
    siteName: "SeerTarot",
    type: "website",
    images: readersOgImages,
  },
  twitter: {
    card: "summary_large_image",
    title: "หมอดูไพ่ยิปซี ปรึกษาแม่หมอตัวจริง · SeerTarot",
    description: "รวมหมอดูไพ่ยิปซีและแม่หมอผู้เชี่ยวชาญศาสตร์ไพ่ทาโรต์ 1909 ปรึกษาดูดวงความรัก การงาน การเงิน",
    images: [readersOgImages[0].url],
  },
};

export default async function ReadersPage() {
  let readers: PublicReaderProfile[] = [];
  let liveReaderIds: string[] = [];
  let ratings: Record<string, { count: number; average: number }> = {};
  try {
    const [list, live, ratingMap] = await Promise.all([
      listPublicApprovedReaders(),
      listLiveReaderIds(),
      getAllReaderRatings().catch(() => new Map<string, { count: number; average: number }>()),
    ]);
    readers = list;
    liveReaderIds = [...live];
    ratings = Object.fromEntries(ratingMap);
  } catch (err) {
    console.error("[ReadersPage] Failed to fetch readers:", err);
  }

  const breadcrumbsJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "หน้าแรก",
        item: SITE_ORIGIN,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "ปรึกษาแม่หมอตัวจริง",
        item: `${SITE_ORIGIN}/readers`,
      },
    ],
  };

  const faqs = [
    {
      q: "ต้องลงแอปหรือสมัครอะไรไหม",
      a: "ไม่ต้อง ใช้เบราว์เซอร์ Chrome หรือ Safari บนมือถือหรือคอมได้เลย ถึงคิวแล้วกดเข้าห้องวิดีโอคอลจากหน้าคิวของคุณ",
    },
    {
      q: "แม่หมอเห็นข้อมูลอะไรของฉันบ้าง",
      a: "ชื่อเล่น เรื่องที่คุณถาม สรุปจาก AI และภาพกับเสียงระหว่างคุยเท่านั้น แม่หมอไม่เห็นเบอร์โทร อีเมล หรือหมายเลข IP ของคุณ",
    },
    {
      q: "มีการบันทึกวิดีโอไหม",
      a: "ไม่มี ภาพและเสียงส่งตรงถึงแม่หมอโดยไม่ผ่านการบันทึก ข้อมูลการเชื่อมต่อถูกลบทันทีที่วางสาย",
    },
    {
      q: "ถ้าภาพหรือเสียงมีปัญหาทำอย่างไร",
      a: "กดปุ่ม \"ต่อสายใหม่\" ในห้อง หรือเลือกคุยกับแม่หมอทาง LINE แทนได้จากหน้าคิวเดียวกัน",
    },
  ];

  return (
    <>
      <SiteHeader />
      {/*
        v3 UI 2.0 (เจ้าของ 2026-10-17 "ทำได้เลย แต่อย่าเพิ่งเอาขึ้น รอสั่ง"): ภาษาภาพเดียวกับทั้งเว็บ
        หัวหน้าแถบครีม (Ui2PageHero + ui2-dawn.css) ➔ รายชื่อแม่หมอในหน้าต่างเลขกำกับ ➔ ขั้นตอนเป็นแถวสลับซ้ายขวา
        ➔ เหตุผลที่ไว้ใจได้เป็นกล่องหลายขนาด ➔ คำถามที่พบบ่อยแผงพับ ➔ ไปต่อจากตรงนี้
        ⚠️ ห้ามชื่อ/รีวิว/ราคาสมมุติในภาพประกอบ — ข้อมูลแม่หมอมาจาก ReadersDirectory (ฐานข้อมูลจริง) เท่านั้น
      */}
      <div className="ui2-pg" data-ui2-page-dark="">
      <main id="main-content" tabIndex={-1} className="min-h-screen text-ink px-4 pb-16 sm:px-6 font-sans relative overflow-x-clip">
        {/* Schema.org Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLdScript(breadcrumbsJsonLd) }}
        />

        <div className="max-w-[1200px] mx-auto relative z-10">
          <Ui2PageHero
            crumbs={[{ label: "หน้าแรก", href: "/" }, { label: "ปรึกษาแม่หมอตัวจริง" }]}
            title="ปรึกษาแม่หมอ ตัวต่อตัว ผ่านวิดีโอคอล"
            accent="ผ่านวิดีโอคอล"
            lede={
              <ThaiPhrases>
                เลือกแม่หมอที่ถนัดเรื่องของคุณ พิมพ์สิ่งที่อยากถาม แล้วคุยกันสด ๆ ในเว็บนี้ ไม่ต้องลงแอป ไม่ต้องแอด LINE
              </ThaiPhrases>
            }
            actions={
              <>
                <a href="#readers" className="ui2-btn ui2-btn-gold">
                  เลือกแม่หมอ
                </a>
                <a href="#how-it-works" className="ui2-btn-ghost">
                  ใช้งานอย่างไร
                </a>
              </>
            }
            trust={[`ตัวต่อตัว ${CONSULTATION_MINUTES} นาที`, "รู้ราคาก่อนจอง", "ไม่บันทึกภาพและเสียง"]}
            cards={["major-02", "major-05", "major-09", "major-17", "cups-02", "major-21"]}
          />

          {/* ── รายชื่อแม่หมอ (ข้อมูลจริง) ── */}
          <div id="readers" className="scroll-mt-24">
            <Ui2Window n="01" kicker="Readers" note={`ตัวต่อตัว ${CONSULTATION_MINUTES} นาที`} tone={4}>
              <ReadersDirectory initialReaders={readers} liveReaderIds={liveReaderIds} ratings={ratings} />
            </Ui2Window>
          </div>

          {/* ── ขั้นตอน — แถวสลับซ้ายขวาแบบคำถามที่พบบ่อยหน้าแรก ── */}
          <div id="how-it-works" className="ui2-next scroll-mt-24">
            <Ui2FeatureRows
              id="readers-how-it-works"
              kicker="ใช้งานอย่างไร"
              title="สามขั้น จากคำถาม ถึงคำตอบ"
              rows={[
                {
                  kicker: "ขั้นที่ 1",
                  title: "เลือกแม่หมอ",
                  body: <p>ดูความถนัด แล้วพิมพ์สิ่งที่อยากถามสั้น ๆ</p>,
                  mock: (
                    <FrMock>
                      <FrInput title="อยากถามแม่หมอเรื่องอะไร" text="งานใหม่ที่กำลังจะย้ายไปจะดีไหม" />
                      <FrPanel label="เลือกแม่หมอตามความถนัด">
                        <FrPills items={["ความรัก", "การงาน", "การเงิน"]} />
                      </FrPanel>
                    </FrMock>
                  ),
                },
                {
                  kicker: "ขั้นที่ 2",
                  title: "รอคิวสบาย ๆ",
                  body: <p>AI สรุปคำถามให้แม่หมออ่านก่อน คุณเปิดหน้าคิวทิ้งไว้ได้เลย</p>,
                  mock: (
                    <FrMock tint="teal">
                      <FrPanel label="ก่อนถึงคิว">
                        <FrList boxed items={["AI สรุปคำถามให้แม่หมออ่านก่อน", "ไม่ต้องเล่าใหม่ตั้งแต่ต้น", "เปิดหน้าคิวทิ้งไว้ได้"]} />
                      </FrPanel>
                    </FrMock>
                  ),
                },
                {
                  kicker: "ขั้นที่ 3",
                  title: "คุยผ่านวิดีโอคอล",
                  body: <p>ถึงคิวแล้วกดเข้าห้อง คุยตัวต่อตัวกับแม่หมอในเว็บนี้</p>,
                  mock: (
                    <FrMock tint="violet">
                      <div className="v3-rd-stage">
                        <ConsultHeroStage />
                      </div>
                    </FrMock>
                  ),
                },
              ]}
            />
          </div>

          {/* ── เหตุผลที่ไว้ใจได้ — กล่องหลายขนาดแบบหน้าแรก ── */}
          <div className="ui2-next">
            <Ui2Bento
              id="readers-why"
              kicker="ทำไมต้องปรึกษาที่นี่"
              title="สบายใจ ตั้งแต่ก่อนเริ่มคุย"
              tiles={[
                {
                  key: "video",
                  size: "wide",
                  glow: "amber",
                  lead: "วิดีโอคอล",
                  title: "ในเว็บ",
                  desc: "กดเข้าห้องได้จากมือถือหรือคอม ไม่ต้องลงแอป ไม่ต้องแอด LINE",
                  visual: <BxChips items={["มือถือ", "คอม", "ไม่ต้องลงแอป"]} on={-1} />,
                },
                {
                  key: "privacy",
                  size: "tall",
                  glow: "teal",
                  center: true,
                  lead: "ความเป็นส่วนตัว",
                  title: "มาก่อน",
                  desc: "แม่หมอไม่เห็นเบอร์โทรและ IP ของคุณ เว็บไม่บันทึกภาพและเสียง",
                  visual: <BxBack />,
                },
                {
                  key: "brief",
                  lead: "แม่หมอ",
                  title: "รู้เรื่องก่อนคุย",
                  desc: "AI สรุปคำถามให้แม่หมออ่านก่อน ไม่ต้องเล่าใหม่ตั้งแต่ต้น",
                },
                {
                  key: "time",
                  lead: `${CONSULTATION_MINUTES} นาที`,
                  title: "เต็ม",
                  desc: "รู้ราคาก่อนจอง จ่ายครั้งเดียว ยกเลิกก่อนนัด 24 ชม. คืนเงินเต็ม",
                },
              ]}
            />
          </div>

          {/* ── คำถามที่พบบ่อย — แผงพับแบบหน้าแรก (คำตอบอยู่ใน HTML ครบ) ── */}
          <div className="ui2-next">
            <Ui2FeatureRows id="readers-faq" kicker="FAQ" title="คำถามที่พบบ่อย" rows={[]} rest={faqs} />
          </div>

          <Ui2NextSteps isEn={false} keys={["spreads", "daily", "journal", "cards"]} />
        </div>
      </main>
      </div>
      <SiteFooter />
    </>
  );
}
