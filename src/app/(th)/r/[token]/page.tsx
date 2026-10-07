import type { Metadata } from "next";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";

import { CardImage } from "@/components/card/CardImage";
import { ProvablyFairPanel } from "@/components/reading/ProvablyFairPanel";
import { PrintButton, UnlockForm } from "@/components/studio/SharedReadingParts";
import { SITE_ORIGIN, noindexAlternates } from "@/lib/config/site";
import { getReaderById } from "@/lib/marketplace/readers.repo";
import { ensureReadableColor, sanitizeLogoUrl } from "@/lib/studio/brand";
import { isStudioEnabled } from "@/lib/studio/dpa";
import { spreadOfReading } from "@/lib/studio/schemas";
import { hashShareToken, isWellFormedToken, verifyViewCookie, viewCookieName } from "@/lib/studio/share";
import { bumpShareView, getSharedReading, getStudioSettings, type StudioBodyPart } from "@/lib/studio/studio.repo";
import { readingCards } from "@/lib/studio/view";
import { APP_TIME_ZONE } from "@/lib/time/bangkok";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * 🔗 /r/[token] — คำอ่านที่แม่หมอส่งให้ลูกค้า (Reader Studio · REFLECTION_JOURNAL_PLAN 1.13)
 *  • noindex/nofollow · ไม่ส่ง Referer ออกไปไหน (โทเคนอยู่ใน URL) · ตรวจหมดอายุ/เพิกถอนทุกครั้งที่เปิด
 *  • แบรนด์ของหมอ (สีผ่านด่านคอนทราสต์ซ้ำอีกรอบตอนแสดง) + บรรทัดเล็ก "สร้างด้วย SeerTarot"
 *  • ไพ่ผ่าน `<CardImage sizes>` · ไพ่จากสำรับของหมอติดป้าย "ไม่ผ่านการยืนยัน" ตรง ๆ
 *  • บันทึกเป็น PDF = หน้าพิมพ์ของเบราว์เซอร์ (`@media print`)
 */

interface Props {
  params: Promise<{ token: string }>;
}

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "คำอ่านไพ่ทาโรต์ส่วนตัว",
    description: "คำอ่านไพ่ทาโรต์ส่วนตัวที่แม่หมอส่งให้คุณ",
    robots: { index: false, follow: false, nocache: true },
    alternates: noindexAlternates(),
    referrer: "no-referrer",
  };
}

const PRINT_CSS = `
@media print {
  header, footer, nav, .studio-no-print { display: none !important; }
  body { background: #fff !important; }
  .studio-sheet { box-shadow: none !important; border: 0 !important; max-width: none !important; }
  .studio-card-row { break-inside: avoid; page-break-inside: avoid; }
}`;

function partText(body: StudioBodyPart[] | null, key: string): string {
  return body?.find((p) => p.key === key)?.text.trim() ?? "";
}

function Shell({ children, accent }: { children: React.ReactNode; accent: string }) {
  return (
    <main className="min-h-screen px-4 pb-16 pt-6 font-serif-th text-ink-deep sm:px-8 sm:pt-10" style={{ ["--studio-accent" as string]: accent }}>
      <style dangerouslySetInnerHTML={{ __html: PRINT_CSS }} />
      <div className="studio-sheet mx-auto max-w-3xl rounded-[28px] border border-line bg-surface px-5 py-8 shadow-[0_20px_40px_-28px_rgba(46,33,26,0.45)] sm:px-10 sm:py-12">
        {children}
      </div>
      <p className="mx-auto mt-6 max-w-3xl text-center text-[13px] text-muted">
        สร้างด้วย{" "}
        <a href={SITE_ORIGIN} className="font-semibold text-gold-ink underline-offset-2 hover:underline" rel="noreferrer">
          SeerTarot
        </a>
      </p>
    </main>
  );
}

function Gone() {
  return (
    <Shell accent="#8F5C1A">
      <div className="space-y-3 text-center">
        <p className="text-2xl text-gold-ink">✦</p>
        <h1 className="text-xl font-bold">ลิงก์นี้เปิดไม่ได้แล้ว</h1>
        <p className="text-sm leading-relaxed text-muted">ลิงก์อาจหมดอายุหรือถูกยกเลิกโดยแม่หมอ ติดต่อแม่หมอเพื่อขอลิงก์ใหม่ได้เลย</p>
      </div>
    </Shell>
  );
}

export default async function SharedReadingPage({ params }: Props) {
  if (!isStudioEnabled()) notFound();
  const { token } = await params;
  if (!isWellFormedToken(token)) notFound();
  const tokenHash = hashShareToken(token);
  const shared = await getSharedReading(tokenHash);
  if (!shared) return <Gone />;

  const { reading, readerId } = shared;
  const [settings, reader] = await Promise.all([getStudioSettings(readerId), getReaderById(readerId)]);
  const accent = ensureReadableColor(settings.brandColor).color;
  const brand = settings.brandName?.trim() || reader?.displayName || "แม่หมอของคุณ";
  const logo = sanitizeLogoUrl(settings.logoUrl);

  if (shared.passwordHash) {
    const jar = await cookies();
    if (!verifyViewCookie(tokenHash, jar.get(viewCookieName(tokenHash))?.value)) {
      return (
        <Shell accent={accent}>
          <div className="text-center">
            <p className="text-sm font-semibold" style={{ color: accent }}>
              {brand}
            </p>
            <h1 className="mt-2 text-xl font-bold">คำอ่านนี้มีรหัสป้องกัน</h1>
            <p className="mt-2 text-sm text-muted">ใส่รหัสที่แม่หมอให้ไว้เพื่อเปิดอ่าน</p>
          </div>
          <UnlockForm token={token} accent={accent} />
        </Shell>
      );
    }
  }

  const spread = spreadOfReading(reading);
  const { cards, broken } = readingCards(reading);
  if (!spread || broken || !cards.length) {
    // กฎเหล็กข้อ 14 — ข้อมูลไพ่/ผังไม่ครบ ห้ามเดาแทน
    return (
      <Shell accent={accent}>
        <p className="text-center text-sm text-muted">ข้อมูลคำอ่านนี้ไม่สมบูรณ์ กรุณาโหลดใหม่อีกครั้ง หรือติดต่อแม่หมอ</p>
      </Shell>
    );
  }
  void bumpShareView(tokenHash).catch(() => undefined);

  const body = reading.body ?? [];
  const usedAi = body.some((p) => p.origin === "ai" || p.origin === "edited");
  const intro = partText(body, "intro");
  const summary = partText(body, "summary");
  const closing = partText(body, "closing");
  const sentDate = new Date(reading.sentAt ?? reading.updatedAt).toLocaleDateString("th-TH", { year: "numeric", month: "long", day: "numeric", timeZone: APP_TIME_ZONE });

  return (
    <Shell accent={accent}>
      <header className="flex flex-col items-center gap-3 border-b border-line-soft pb-6 text-center">
        {logo ? (
          // eslint-disable-next-line @next/next/no-img-element -- โลโก้ของหมอเป็น URL ภายนอก (https เท่านั้น) ไม่ใช่ภาพไพ่
          <img src={logo} alt={brand} width={64} height={64} referrerPolicy="no-referrer" className="h-16 w-16 rounded-full object-cover" />
        ) : null}
        <p className="text-sm font-bold tracking-wide" style={{ color: accent }}>
          {brand}
        </p>
        <h1 className="text-2xl font-bold leading-snug sm:text-3xl">{reading.title}</h1>
        <p className="text-[13px] text-muted">
          {spread.nameTh} · {sentDate}
        </p>
        {reading.question ? (
          <p className="max-w-xl rounded-2xl bg-inset-warm px-4 py-3 text-sm leading-relaxed text-ink">
            <span className="font-semibold">คำถาม: </span>
            {reading.question}
          </p>
        ) : null}
      </header>

      {intro ? <p className="mt-6 whitespace-pre-line text-[15px] leading-loose text-ink sm:text-base">{intro}</p> : null}

      <ol className="mt-8 space-y-8">
        {cards.map((c) => {
          const pos = spread.positions[c.order];
          const text = partText(body, `card:${c.order}`);
          return (
            <li key={c.order} className="studio-card-row grid gap-4 sm:grid-cols-[120px_minmax(0,1fr)] sm:gap-6">
              <figure className="mx-auto w-[110px] sm:w-[120px]">
                <CardImage
                  cardId={c.id}
                  image={c.image}
                  alt={`${c.nameTh}${c.isReversed ? " (กลับหัว)" : ""}`}
                  sizes="120px"
                  className={`w-full rounded-xl shadow-md ${c.isReversed ? "rotate-180" : ""}`}
                />
              </figure>
              <div className="min-w-0 space-y-2">
                <p className="text-[13px] font-semibold" style={{ color: accent }}>
                  ใบที่ {c.order + 1} · {pos?.nameTh ?? ""}
                </p>
                <h2 className="text-lg font-bold">
                  {c.nameTh}
                  {c.isReversed ? <span className="ml-2 text-sm font-normal text-muted">(กลับหัว)</span> : null}
                </h2>
                {text ? <p className="whitespace-pre-line text-[15px] leading-loose text-ink">{text}</p> : null}
              </div>
            </li>
          );
        })}
      </ol>

      {summary ? (
        <section className="mt-10 rounded-2xl border px-5 py-5" style={{ borderColor: accent }}>
          <h2 className="text-base font-bold" style={{ color: accent }}>
            ภาพรวม
          </h2>
          <p className="mt-2 whitespace-pre-line text-[15px] leading-loose text-ink">{summary}</p>
        </section>
      ) : null}

      {closing ? <p className="mt-8 whitespace-pre-line text-[15px] leading-loose text-ink">{closing}</p> : null}

      <footer className="mt-10 space-y-4 border-t border-line-soft pt-6 text-[13px] leading-relaxed text-muted">
        {reading.cardSource === "manual" ? (
          <p className="rounded-xl bg-inset-warm px-4 py-3">ไพ่จากสำรับของหมอ — ไม่ผ่านการยืนยัน (แม่หมอเปิดไพ่จากสำรับจริงแล้วบันทึกลงระบบ)</p>
        ) : reading.cardSource === "fair" && reading.commitment ? (
          <div className="studio-no-print">
            <ProvablyFairPanel
              commitment={reading.commitment}
              proof={{ commitment: reading.commitment, serverSeed: reading.serverSeed ?? undefined, clientSeed: reading.clientSeed ?? undefined, deckSize: 78 }}
              drawn={reading.cards}
            />
          </div>
        ) : null}
        {reading.showAiDisclosure && usedAi ? <p>เรียบเรียงด้วยความช่วยเหลือของ AI · ตรวจและรับรองโดย {brand}</p> : null}
        {settings.contactLine ? (
          <p>
            ติดต่อ {brand}: {settings.contactLine}
          </p>
        ) : null}
        <p>คำอ่านไพ่เป็นเครื่องมือสะท้อนความคิด ไม่ใช่คำตัดสินอนาคต การตัดสินใจทุกอย่างยังเป็นของคุณ</p>
        <div className="flex justify-center pt-2">
          <PrintButton accent={accent} />
        </div>
      </footer>
    </Shell>
  );
}
