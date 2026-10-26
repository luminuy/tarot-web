import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { getPublicReaderById } from "@/lib/marketplace/readers.repo";
import { getReaderLiveAvailability } from "@/lib/marketplace/queue.repo";
import { getNextAvailableSlot } from "@/lib/marketplace/booking.repo";
import { CONSULTATION_MINUTES, readerPriceThb } from "@/lib/marketplace/offer";
import { hasFreeConsult } from "@/lib/marketplace/free-consult";
import { getSessionUser } from "@/lib/auth/session";
import { noindexAlternates } from "@/lib/config/site";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { BookingFlow, type ConsultMode } from "@/components/marketplace/BookingFlow";
import { ConsultHero, ConsultWindow } from "@/components/marketplace/ConsultUi2";
import { ThaiPhrases } from "@/components/ui/ThaiPhrases";
import { FREE_CANCEL_HOURS } from "@/lib/marketplace/booking-policy";
import "@/styles/ui2-page.css";
import "@/styles/v3-consult.css";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

/**
 * หน้าจองเป็นหน้าทำรายการ (มีสถานะคิวสด ณ ตอนเปิด) — ไม่ให้ติดดัชนีค้นหา
 * หน้าโปรไฟล์ `/readers/<id>` คือหน้าที่ควรติดอันดับแทน
 */
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const reader = await getPublicReaderById(id);
  return {
    title: reader ? `จองเวลาปรึกษา ${reader.displayName}` : "จองเวลาปรึกษาแม่หมอ",
    robots: { index: false, follow: false },
    // A6-01: หน้า noindex ห้ามสืบทอด canonical/hreflang ของหน้าแรก (สัญญาณขัดกัน)
    alternates: noindexAlternates(),
  };
}

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

/**
 * ✦ หน้าจองปรึกษาแม่หมอแบบเต็มจอ `/readers/<id>/book` (CONSULT_FLOW_UX_PLAN ข้อ 1.3)
 * ---------------------------------------------------------------------------
 * - `?mode=now` — กดมาจากปุ่ม "คุยตอนนี้" ➔ ข้ามไปกรอกชื่อเลย
 * - `?mode=schedule` — กดมาจาก "นัดเวลาอื่น"
 * - `?slot=<ms>` — กดมาจาก "เวลาว่างเร็วที่สุด" ➔ ข้ามไปกรอกชื่อพร้อมเวลานั้น
 * ทุกค่าเป็นแค่ทางลัดของหน้าจอ — เซิร์ฟเวอร์ตรวจเวลา/สถานะคิวสด/ราคาเองตอนจองเสมอ
 * แม่หมอส่งลิงก์หน้านี้ให้ลูกค้าตรง ๆ ได้ (แผงแม่หมอ "ส่งลิงก์ให้ลูกค้า")
 */
export default async function ReaderBookPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const reader = await getPublicReaderById(id);
  if (!reader) notFound();

  const query = await searchParams;
  const rawMode = first(query.mode);
  const initialMode: ConsultMode | null = rawMode === "now" || rawMode === "schedule" ? rawMode : null;
  const rawSlot = Number(first(query.slot));
  const initialSlot = Number.isSafeInteger(rawSlot) && rawSlot > 0 ? rawSlot : null;

  const [isLiveOpen, nextSlot, free] = await Promise.all([
    getReaderLiveAvailability(id),
    getNextAvailableSlot(id, Date.now()),
    getSessionUser()
      .catch(() => null)
      .then((user) => hasFreeConsult(user)),
  ]);

  return (
    <>
      <SiteHeader />
      {/*
        v3 UI 2.0 (เจ้าของ 2026-10-26): หัวหน้าแถบครีมเตี้ย ➔ ฟอร์มจองในหน้าต่างครีมบนท้องฟ้ากลางคืน
        h1 อยู่ใน BookingFlow (เปลี่ยนตามขั้น) ➔ หัวข้อของหัวหน้าเป็น <p>
      */}
      <div className="ui2-pg" data-ui2-page-dark="">
        <main id="main-content" tabIndex={-1} className="v3-cs is-narrow font-sans">
          <ConsultHero
            compact
            titleAs="p"
            kicker="จองเวลาปรึกษา"
            title={<ThaiPhrases>{`คุยกับ ${reader.displayName}`}</ThaiPhrases>}
            lede={
              <ThaiPhrases>{`ตัวต่อตัว ${CONSULTATION_MINUTES} นาที ยกเลิกก่อนนัด ${FREE_CANCEL_HOURS} ชม. คืนเงินเต็ม`}</ThaiPhrases>
            }
          >
            <Link href={`/readers/${encodeURIComponent(reader.id)}`} className="v3-cs-back">
              กลับไปหน้าแม่หมอ
            </Link>
          </ConsultHero>
          <ConsultWindow narrow label="ขั้นตอนจองเวลาปรึกษา">
            <div className="space-y-3.5">
              <BookingFlow
                reader={{ id: reader.id, displayName: reader.displayName, avatarUrl: reader.avatarUrl }}
                priceThb={readerPriceThb(reader)}
                isLiveOpen={isLiveOpen}
                hasSchedule={nextSlot !== null}
                initialMode={initialMode}
                initialSlot={initialSlot}
                free={free}
              />
            </div>
          </ConsultWindow>
        </main>
      </div>
      <SiteFooter spacing="tight" />
    </>
  );
}
