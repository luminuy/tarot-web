import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";

import { getSessionUser } from "@/lib/auth/session";
import { noindexAlternates } from "@/lib/config/site";
import { readCustomerRefFromCookie } from "@/lib/marketplace/customer-ref";
import { getInviteByCode, resolveInviteClaim } from "@/lib/marketplace/invites.repo";
import { CONSULTATION_MINUTES, readerPriceThb } from "@/lib/marketplace/offer";
import { getPublicReaderById } from "@/lib/marketplace/readers.repo";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { BookingFlow } from "@/components/marketplace/BookingFlow";
import { hasFreeConsult } from "@/lib/marketplace/free-consult";
import { ThaiPhrases } from "@/components/ui/ThaiPhrases";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ code: string }> };

/**
 * หน้าส่วนตัว (มีรหัสห้องใน URL) — ไม่ติดดัชนี และไม่ส่ง Referer ออกนอกเว็บ (ภาพแม่หมออาจอยู่โดเมนอื่น)
 */
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { code } = await params;
  const invite = await getInviteByCode(code);
  const reader = invite ? await getPublicReaderById(invite.readerId) : null;
  return {
    title: reader ? `ห้องคุยส่วนตัวกับ ${reader.displayName}` : "ห้องคุยส่วนตัวกับแม่หมอ",
    robots: { index: false, follow: false, nocache: true },
    alternates: noindexAlternates(),
    referrer: "no-referrer",
  };
}

/** ลิงก์ใช้ต่อไม่ได้เพราะอะไร — บอกทางไปต่อทุกกรณี ไม่ใช่ทางตัน */
const UNAVAILABLE: Record<string, { title: string; body: string }> = {
  invite_cancelled: {
    title: "แม่หมอยกเลิกลิงก์ห้องนี้แล้ว",
    body: "ทักแม่หมอขอลิงก์ห้องใหม่ได้เลย หรือจองเวลาจากหน้าแม่หมอแทน",
  },
  invite_expired: {
    title: "ลิงก์ห้องนี้หมดอายุแล้ว",
    body: "ลิงก์ห้องใช้ได้ 24 ชั่วโมงหลังแม่หมอสร้าง ทักแม่หมอขอลิงก์ใหม่ได้เลย",
  },
  invite_used: {
    title: "ลิงก์ห้องนี้มีคนใช้ไปแล้ว",
    body: "ถ้าคุณเป็นคนจ่ายเงิน เปิด \"ลิงก์นัดของคุณ\" จากอีเมลยืนยัน หรือเปิดลิงก์นี้ในเบราว์เซอร์เดียวกับที่ใช้จ่ายเงิน",
  },
  invite_busy: {
    title: "มีคนกำลังชำระเงินผ่านลิงก์นี้อยู่",
    body: "ถ้าเป็นคุณเอง เปิดลิงก์นี้ในเบราว์เซอร์เดียวกับที่กดจ่ายไว้ ถ้าไม่ใช่คุณ ทักแม่หมอขอลิงก์ใหม่ได้เลย",
  },
};

/**
 * ✦ ห้องคุยส่วนตัว `/readers/room/<code>` — ลิงก์ที่แม่หมอสร้างในแผงแล้วส่งให้ลูกค้าคนเดียวทาง LINE
 * (migrations/0032 · แผน CONSULT_FLOW_UX_PLAN คลื่น 7 · เจ้าของเคาะ 2026-10-12: จ่ายบนเว็บก่อนเข้าห้อง)
 * ---------------------------------------------------------------------------
 *   แตะลิงก์ ➔ ใส่ชื่อ (แม่หมอเติมให้ได้) ➔ ชำระเงิน ➔ หน้าคิว "รอแม่หมอรับเข้าห้อง" ➔ ห้องวิดีโอคอล
 * - ใช้ฟอร์มจองตัวเดียวกับหน้าจอง (`BookingFlow` โหมด invite) — ข้อความยินยอม/เงื่อนไข/การจ่ายจึงชุดเดียวกัน
 * - ลูกค้าคนเดิมเปิดลิงก์ซ้ำ (จ่ายค้าง/จ่ายแล้ว/คุยเสร็จ) ➔ พาไปหน้าคิวของเขาเลย
 * - ทุกอย่างที่หน้านี้เห็น เซิร์ฟเวอร์ตรวจซ้ำตอนกดจ่าย (`POST /api/marketplace/tickets` + `inviteCode`)
 * ⚠️ ห้ามมี loading.tsx ครอบหน้านี้ — สตรีม 200 ก่อน notFound() (บทเรียน ISSUE-056)
 */
export default async function PrivateRoomPage({ params }: PageProps) {
  const { code } = await params;
  const invite = await getInviteByCode(code);
  if (!invite) notFound();
  const reader = await getPublicReaderById(invite.readerId);
  if (!reader) notFound();

  const [ownerRef, user] = await Promise.all([readCustomerRefFromCookie(), getSessionUser().catch(() => null)]);
  const claim = await resolveInviteClaim(code, invite.readerId, ownerRef, user?.id ?? null);
  if (claim.kind === "own") redirect(`/readers/queue/${encodeURIComponent(claim.ticketId)}`);

  const unavailable = claim.kind === "refused" ? (UNAVAILABLE[claim.code] ?? UNAVAILABLE.invite_expired) : null;
  const free = await hasFreeConsult(user);

  return (
    <>
      <SiteHeader />
      <main id="main-content" tabIndex={-1} className="min-h-screen px-4 pt-3 text-ink-deep font-serif-th sm:px-6 sm:pt-8">
        <div className="mx-auto w-full max-w-xl space-y-3.5">
          {unavailable ? (
            <section className="altar-card-porcelain !rounded-3xl space-y-4 p-5 text-center sm:p-6" aria-labelledby="room-unavailable-heading">
              <div className="mx-auto grid h-16 w-16 place-items-center overflow-hidden rounded-full bg-canvas text-2xl font-bold text-gold-ink ring-4 ring-surface">
                {reader.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={reader.avatarUrl} alt="" /* ชื่อแม่หมออยู่ใต้ภาพแล้ว (INC-0125) */ className="h-full w-full object-cover" />
                ) : (
                  reader.displayName.charAt(0).toUpperCase()
                )}
              </div>
              <p className="text-[13px] text-muted">ห้องคุยส่วนตัวกับ {reader.displayName}</p>
              <h1 id="room-unavailable-heading" className="text-xl font-bold text-ink-deep">
                <ThaiPhrases>{unavailable.title}</ThaiPhrases>
              </h1>
              <p className="text-sm leading-relaxed text-ink">
                <ThaiPhrases>{unavailable.body}</ThaiPhrases>
              </p>
              <div className="flex flex-col gap-2 pt-1 sm:flex-row sm:justify-center">
                <Link
                  href={`/readers/${encodeURIComponent(reader.id)}`}
                  className="btn-gold-glass inline-flex min-h-[48px] items-center justify-center px-6 text-sm font-bold"
                >
                  ไปหน้าแม่หมอ
                </Link>
                <Link
                  href="/readers/bookings"
                  className="inline-flex min-h-[48px] items-center justify-center rounded-full border border-line-interactive-warm bg-surface px-6 text-sm font-semibold text-ink-deep"
                >
                  นัดของฉัน
                </Link>
              </div>
            </section>
          ) : (
            <BookingFlow
              reader={{ id: reader.id, displayName: reader.displayName, avatarUrl: reader.avatarUrl }}
              priceThb={readerPriceThb(reader)}
              // แม่หมอเชิญเอง ➔ คุยได้แม้ปิดคิวสด (เซิร์ฟเวอร์ข้ามสวิตช์คิวสดเฉพาะเมื่อรหัสลิงก์ใช้ได้จริง)
              isLiveOpen
              hasSchedule={false}
              initialMode="now"
              initialSlot={null}
              invite={{ code, customerLabel: invite.label }}
              free={free}
            />
          )}
          <p className="pb-4 text-center text-[12px] leading-relaxed text-muted">
            ตัวต่อตัว {CONSULTATION_MINUTES} นาที · วิดีโอคอลในเว็บ ไม่ต้องลงแอป · ลิงก์นี้สำหรับคุณคนเดียว
          </p>
        </div>
      </main>
      <SiteFooter spacing="tight" />
    </>
  );
}
