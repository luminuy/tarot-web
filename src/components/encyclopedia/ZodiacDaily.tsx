"use client";

import { useEffect, useState } from "react";
import { LocaleLink as Link } from "@/components/ui/LocaleLink";
import { CardImage } from "@/components/card/CardImage";
import { useLocale } from "@/lib/i18n";
import { bangkokDayKey } from "@/lib/time/bangkok";
import { formatMonthDay, zodiacSignPath } from "@/lib/tarot/zodiac";
import type { ZodiacDaily as ZodiacDailyData, ZodiacDayCard } from "@/lib/tarot/zodiac-daily";

/**
 * ✦ ดวงรายวัน 12 ราศี + ไพ่ประจำฤดูราศี — ข้อมูลจาก `/api/daily-card/zodiac`
 *
 * - `sign` ไม่ส่ง = หน้ารวม (ฤดูราศี + ไพ่ 12 ราศี) · ส่ง = หน้ารายราศี (ไพ่วันนี้ของราศีนั้น)
 * - ไพ่เริ่มคว่ำเสมอ ผู้ใช้แตะพลิกเอง (กฎเหล็กข้อ 4) — ใช้คลาสพลิก 3D ชุดเดียวกับ `TarotCard`
 *   โดยไม่ลาก `TarotCard` (และสารบบไพ่ 78 ใบ) เข้าบันเดิลของหน้านี้
 * - ⚠️ ข้อมูลต้องเป็นของ "วันนี้" จริง — แคชระหว่างทางอาจคืนของเมื่อวานข้ามเที่ยงคืน
 *   (บทเรียน A2-06 เดียวกับ `DailyCardStrip`) ไม่ตรงเมื่อไหร่ยิงใหม่แบบข้ามแคช
 * - ดึงไม่ได้ = ซ่อนทั้งกล่อง ห้ามโชว์ไพ่เดาเอง (กฎข้อ 14)
 */

export interface ZodiacDailySignName {
  id: string;
  nameTh: string;
  nameEn: string;
}

function FlipCard({
  card,
  revealed,
  onReveal,
  label,
  width,
  sizes,
}: {
  card: ZodiacDayCard;
  revealed: boolean;
  onReveal: () => void;
  label: string;
  width: string;
  sizes: string;
}) {
  const { isEnglish } = useLocale();
  return (
    <button
      type="button"
      onClick={onReveal}
      disabled={revealed}
      aria-label={revealed ? `${label}: ${isEnglish ? card.nameEn : card.nameTh}` : label}
      className={`card-scene ${width} aspect-[1/1.7] rounded-lg cursor-pointer disabled:cursor-default focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold`}
    >
      <span className="card-inner card-flip relative block w-full h-full rounded-lg" data-revealed={revealed ? "true" : "false"}>
        <span className="card-face absolute inset-0 rounded-lg card-back-pattern border-2 border-line-warm/60 shadow-xs flex items-center justify-center">
          <span className="rounded-full bg-surface border border-line-warm px-2 py-0.5 text-[11px] sm:text-[12px] font-serif-th font-bold text-ink">
            {isEnglish ? "Tap" : "แตะเปิด"}
          </span>
        </span>
        <span className="card-face card-face--back absolute inset-0 rounded-lg overflow-hidden border-2 border-line-warm shadow-xs bg-inset-warm">
          {revealed && (
            <CardImage
              image={card.image}
              cardId={card.cardId}
              alt={isEnglish ? card.nameEn : `${card.nameTh} (${card.nameEn})`}
              sizes={sizes}
              className="w-full h-full object-cover"
            />
          )}
        </span>
      </span>
    </button>
  );
}

export function ZodiacDaily({ signs, sign }: { signs: ZodiacDailySignName[]; sign?: string }) {
  const { isEnglish } = useLocale();
  const [data, setData] = useState<ZodiacDailyData | null>(null);
  const [failed, setFailed] = useState(false);
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});
  const [focus, setFocus] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    const today = bangkokDayKey();
    const load = (bypass: boolean): Promise<ZodiacDailyData> =>
      fetch(bypass ? `/api/daily-card/zodiac?d=${today}` : "/api/daily-card/zodiac", {
        credentials: "same-origin",
        ...(bypass ? { cache: "no-store" as const } : {}),
      }).then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))));
    load(false)
      .then((d) => (d.dateKey === today ? d : load(true)))
      .then((d) => {
        if (alive && Array.isArray(d.signs) && d.signs.length === 12 && d.season) setData(d);
        else if (alive) setFailed(true);
      })
      .catch(() => {
        if (alive) setFailed(true);
      });
    return () => {
      alive = false;
    };
  }, []);

  if (failed) return null;
  const nameOf = (id: string) => {
    const s = signs.find((x) => x.id === id);
    return s ? (isEnglish ? s.nameEn : s.nameTh) : id;
  };
  const reveal = (key: string) => {
    setRevealed((r) => ({ ...r, [key]: true }));
    setFocus(key);
  };
  const message = (c: ZodiacDayCard) => (isEnglish ? c.messageEn || c.message : c.message);
  const cardName = (c: ZodiacDayCard) => (isEnglish ? c.nameEn : `${c.nameTh} (${c.nameEn})`);

  if (!data) {
    return <div className="altar-panel rounded-2xl min-h-[280px] animate-pulse" aria-hidden="true" />;
  }

  /* ── หน้ารายราศี: ไพ่วันนี้ของราศีเดียว ── */
  if (sign) {
    const card = data.signs.find((c) => c.sign === sign);
    if (!card) return null;
    const open = !!revealed[card.sign];
    return (
      <div className="flex flex-col sm:flex-row items-center gap-5">
        <FlipCard
          card={card}
          revealed={open}
          onReveal={() => reveal(card.sign)}
          label={isEnglish ? `Today's card for ${nameOf(sign)}` : `ไพ่วันนี้ของ${nameOf(sign)}`}
          width="w-[130px] sm:w-[150px] shrink-0"
          sizes="(min-width: 640px) 150px, 130px"
        />
        <div aria-live="polite" className="space-y-2 text-center sm:text-left">
          {open ? (
            <>
              <p className="text-base font-serif-th font-bold text-ink">{cardName(card)}</p>
              <p className="text-xs font-serif-th font-semibold text-gold-ink">
                {(isEnglish ? card.keywordsEn : card.keywords).join(" · ")}
              </p>
              <p className="text-sm text-muted font-sans leading-relaxed">{message(card)}</p>
              <Link href="/" className="inline-block text-sm font-serif-th font-bold text-gold-ink hover:underline">
                {isEnglish ? "Ask the oracle about your day" : "ถามแม่หมอต่อเรื่องของวันนี้"}
              </Link>
            </>
          ) : (
            <p className="text-sm text-muted font-sans">
              {isEnglish ? "Tap the card to reveal today's energy for your sign." : "แตะไพ่เพื่อเปิดดูพลังงานวันนี้ของราศีคุณ"}
            </p>
          )}
        </div>
      </div>
    );
  }

  /* ── หน้ารวม: ฤดูราศี + ไพ่วันนี้ 12 ราศี ── */
  const season = data.season;
  const focused = focus === "season" ? season.card : data.signs.find((c) => c.sign === focus);
  return (
    <section aria-labelledby="zodiac-daily-title" className="altar-panel rounded-2xl p-5 sm:p-8 space-y-6">
      <div className="text-center space-y-1.5">
        <h2 id="zodiac-daily-title" className="text-lg sm:text-xl font-serif-th font-bold text-ink">
          {isEnglish ? "Today's tarot for all 12 signs" : "ดวงรายวัน 12 ราศี — ไพ่ประจำวันนี้"}
        </h2>
        <p className="text-xs sm:text-sm text-muted font-sans">
          {isEnglish
            ? "One card per sign, the same for everyone today. Tap your sign's card."
            : "ราศีละหนึ่งใบ ทุกคนในราศีเดียวกันเห็นใบเดียวกันทั้งวัน แตะไพ่ของราศีคุณเพื่อเปิด"}
        </p>
      </div>

      {/* ฤดูราศี — ดวงอาทิตย์ย้ายราศีเดือนละครั้ง */}
      <div className="rounded-xl border border-line-warm bg-surface-warm p-4 flex flex-col sm:flex-row items-center gap-4">
        <FlipCard
          card={season.card}
          revealed={!!revealed.season}
          onReveal={() => reveal("season")}
          label={isEnglish ? `Card of the ${nameOf(season.tropical)} season` : `ไพ่ประจำฤดู${nameOf(season.tropical)}`}
          width="w-[92px] shrink-0"
          sizes="92px"
        />
        <div className="space-y-1 text-center sm:text-left">
          <p className="text-sm font-serif-th font-bold text-ink">
            {isEnglish
              ? `The sun is in ${nameOf(season.tropical)} (western) · ${nameOf(season.thai)} (Thai)`
              : `ตอนนี้ดวงอาทิตย์อยู่${nameOf(season.tropical)} (สากล) · ${nameOf(season.thai)} (ไทย)`}
          </p>
          <p className="text-[13px] text-muted font-sans leading-relaxed">
            {isEnglish
              ? `Next move: ${nameOf(season.nextTropical.sign)} on ${formatMonthDay(season.nextTropical.start, true)} (western) · ${nameOf(season.nextThai.sign)} on ${formatMonthDay(season.nextThai.start, true)} (Thai). The season card stays the same until the sun moves.`
              : `ย้ายเข้า${nameOf(season.nextTropical.sign)} ${formatMonthDay(season.nextTropical.start, false)} (สากล) · ${nameOf(season.nextThai.sign)} ${formatMonthDay(season.nextThai.start, false)} (ไทย) ไพ่ประจำฤดูจะอยู่กับเราจนกว่าดวงอาทิตย์ย้ายราศี แตะเปิดเพื่อรับพลังของเดือนนี้`}
          </p>
        </div>
      </div>

      <ul className="grid grid-cols-4 sm:grid-cols-6 gap-3 sm:gap-4">
        {data.signs.map((c) => (
          <li key={c.sign} className="flex flex-col items-center gap-1.5">
            <FlipCard
              card={c}
              revealed={!!revealed[c.sign]}
              onReveal={() => reveal(c.sign)}
              label={isEnglish ? `Today's card for ${nameOf(c.sign)}` : `ไพ่วันนี้ของ${nameOf(c.sign)}`}
              width="w-full max-w-[84px]"
              sizes="84px"
            />
            <Link
              href={zodiacSignPath(c.sign)}
              className="tap-overlay-y text-[12px] sm:text-[13px] font-serif-th font-semibold text-ink hover:text-gold-ink text-center leading-tight"
            >
              {nameOf(c.sign).replace("ราศี", "")}
            </Link>
          </li>
        ))}
      </ul>

      <div aria-live="polite">
        {focused && revealed[focus!] && (
          <div key={focus} className="altar-card-porcelain rounded-xl p-4 sm:p-5 space-y-1.5 anim-swap-rise">
            <p className="text-xs font-serif-th font-semibold text-gold-ink">
              {focus === "season"
                ? isEnglish
                  ? `Card of the ${nameOf(season.tropical)} season`
                  : `ไพ่ประจำฤดู${nameOf(season.tropical)}`
                : isEnglish
                  ? `${nameOf(focus!)} · today`
                  : `${nameOf(focus!)} · วันนี้`}
            </p>
            <p className="text-base font-serif-th font-bold text-ink">{cardName(focused)}</p>
            <p className="text-sm text-muted font-sans leading-relaxed">{message(focused)}</p>
          </div>
        )}
      </div>
    </section>
  );
}
