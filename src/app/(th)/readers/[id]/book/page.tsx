import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { getPublicReaderById } from "@/lib/marketplace/readers.repo";
import { getReaderLiveAvailability } from "@/lib/marketplace/queue.repo";
import { getNextAvailableSlot } from "@/lib/marketplace/booking.repo";
import { readerPriceThb } from "@/lib/marketplace/offer";
import { noindexAlternates } from "@/lib/config/site";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { BookingFlow, type ConsultMode } from "@/components/marketplace/BookingFlow";

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

  const [isLiveOpen, nextSlot] = await Promise.all([
    getReaderLiveAvailability(id),
    getNextAvailableSlot(id, Date.now()),
  ]);

  return (
    <>
      <SiteHeader />
      <main id="main-content" tabIndex={-1} className="min-h-screen px-4 pt-3 text-ink-deep font-serif-th sm:px-6 sm:pt-8">
        <div className="mx-auto w-full max-w-xl space-y-3.5">
          <Link
            href={`/readers/${encodeURIComponent(reader.id)}`}
            className="tap-overlay-y inline-flex items-center gap-1.5 text-sm text-gold-ink transition-colors hover:text-gold-ink-deep"
          >
            <span aria-hidden="true">←</span> กลับไปหน้าแม่หมอ
          </Link>
          <BookingFlow
            reader={{ id: reader.id, displayName: reader.displayName, avatarUrl: reader.avatarUrl }}
            priceThb={readerPriceThb(reader)}
            isLiveOpen={isLiveOpen}
            hasSchedule={nextSlot !== null}
            initialMode={initialMode}
            initialSlot={initialSlot}
          />
        </div>
      </main>
      <SiteFooter spacing="tight" />
    </>
  );
}
