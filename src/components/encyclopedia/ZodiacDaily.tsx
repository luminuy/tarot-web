"use client";

import { useEffect, useState } from "react";
import { LocaleLink as Link } from "@/components/ui/LocaleLink";
import { CardImage } from "@/components/card/CardImage";
import { useLocale } from "@/lib/i18n";
import { bangkokDayKey } from "@/lib/time/bangkok";
import { formatMonthDay, zodiacSignPath } from "@/lib/tarot/zodiac";
import { currentSign, onSignAnnounced } from "@/lib/zodiac/my-sign";
import type { ZodiacDaily as ZodiacDailyData, ZodiacDayCard } from "@/lib/tarot/zodiac-daily";
import { ThaiPhrases } from "@/components/ui/ThaiPhrases";

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
  /** ราศีที่เลือกดูในหน้ารวม — ค่าเริ่มต้น: ราศีที่บันทึกไว้ ➔ ราศีของฤดูนี้ */
  const [pick, setPick] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (sign) return;
    setPick((p) => p ?? currentSign()?.tropical);
    return onSignAnnounced((s) => setPick(s.tropical));
  }, [sign]);

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

  /* ── หน้ารวม: เลือกราศี ➔ ไพ่วันนี้ใบเดียว + ไพ่ประจำฤดู ──
     (เดิมเป็นไพ่คว่ำ 12 ใบเรียงเป็นกำแพง เจ้าของเห็นแล้วว่าอ่านยาก — เหลือใบเดียวของราศีที่เลือก) */
  const season = data.season;
  const chosen = data.signs.find((c) => c.sign === (pick ?? season.tropical)) ?? data.signs[0];
  const chosenOpen = !!revealed[`day:${chosen.sign}`];
  const seasonOpen = !!revealed.season;
  return (
    <section aria-labelledby="zodiac-daily-title" className="space-y-5">
      <div className="text-center space-y-1">
        <h2 id="zodiac-daily-title" className="text-xl sm:text-2xl font-serif-th font-bold text-ink"><ThaiPhrases>
          {isEnglish ? "Today's card for your sign" : "ดวงรายวัน — ไพ่วันนี้ของราศีคุณ"}
        </ThaiPhrases></h2>
        <p className="text-xs sm:text-sm text-muted font-sans">
          {isEnglish
            ? "Pick a sign. Everyone in the same sign sees the same card today."
            : "เลือกราศี ทุกคนในราศีเดียวกันเห็นไพ่ใบเดียวกันทั้งวัน เปลี่ยนใหม่ทุกเที่ยงคืน"}
        </p>
      </div>

      <div role="radiogroup" aria-label={isEnglish ? "Choose a sign" : "เลือกราศี"} className="grid grid-cols-6 gap-1.5 sm:flex sm:flex-wrap sm:justify-center sm:gap-2">
        {data.signs.map((c) => {
          const active = c.sign === chosen.sign;
          return (
            <button
              key={c.sign}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => setPick(c.sign)}
              className={`tap-overlay-y rounded-full border px-1 sm:px-3 py-1.5 text-xs sm:text-sm font-serif-th font-bold whitespace-nowrap transition-colors cursor-pointer ${
                active
                  ? "bg-gold-ink border-gold-ink text-surface"
                  : "bg-surface border-line-warm text-ink hover:border-gold-ink"
              }`}
            >
              {nameOf(c.sign).replace("ราศี", "")}
            </button>
          );
        })}
      </div>

      {/* สองกล่องกว้างเท่ากัน · ไพ่ขนาดเท่ากัน · โครงเดียวกัน (ไพ่บน ข้อความล่าง) — เจ้าของขอให้สองฝั่งเท่ากัน
          กว้างรวม max-w-2xl เท่ากล่องผลหาราศีและกล่องความเข้ากัน ขอบซ้ายขวาจะได้ตรงกันทั้งหน้า */}
      <div className="grid gap-5 sm:grid-cols-2 max-w-2xl mx-auto">
        {/* ไพ่วันนี้ของราศีที่เลือก */}
        <div className="altar-panel rounded-2xl p-5 sm:p-6 flex flex-col items-center gap-4 text-center">
          <FlipCard
            key={`day:${chosen.sign}`}
            card={chosen}
            revealed={chosenOpen}
            onReveal={() => reveal(`day:${chosen.sign}`)}
            label={isEnglish ? `Today's card for ${nameOf(chosen.sign)}` : `ไพ่วันนี้ของ${nameOf(chosen.sign)}`}
            width="w-[120px] sm:w-[130px] shrink-0"
            sizes="(min-width: 640px) 130px, 120px"
          />
          {/* ตัวหนังสือโครงเดียวกับกล่องขวา: ป้ายทอง ➔ หัวข้อตัวหนา ➔ คำอธิบาย */}
          <div aria-live="polite" className="space-y-2">
            <p className="text-xs font-serif-th font-semibold text-gold-ink">
              {isEnglish ? "Today's card for your sign" : "ไพ่วันนี้ของราศีคุณ"}
            </p>
            <p className="text-base sm:text-lg font-serif-th font-bold text-ink">
              {chosenOpen ? cardName(chosen) : nameOf(chosen.sign)}
            </p>
            {chosenOpen ? (
              <>
                <p className="text-xs font-serif-th font-semibold text-muted">
                  {(isEnglish ? chosen.keywordsEn : chosen.keywords).join(" · ")}
                </p>
                <p className="text-sm text-muted font-sans leading-relaxed">{message(chosen)}</p>
                <Link href={zodiacSignPath(chosen.sign)} className="inline-block text-sm font-serif-th font-bold text-gold-ink hover:underline">
                  {isEnglish ? `More about ${nameOf(chosen.sign)}` : `อ่านเรื่อง${nameOf(chosen.sign)}ต่อ`}
                </Link>
              </>
            ) : (
              <p className="text-sm text-muted font-sans leading-relaxed">
                {isEnglish ? "Tap the card to reveal today's card." : "แตะไพ่เพื่อพลิกดูไพ่ของวันนี้ เปลี่ยนใบใหม่ทุกเที่ยงคืน"}
              </p>
            )}
          </div>
        </div>

        {/* ไพ่ประจำฤดูราศี — ดวงอาทิตย์ย้ายราศีเดือนละครั้ง */}
        <div className="altar-panel rounded-2xl p-5 sm:p-6 flex flex-col items-center gap-4 text-center">
          <FlipCard
            card={season.card}
            revealed={seasonOpen}
            onReveal={() => reveal("season")}
            label={isEnglish ? `Card of the ${nameOf(season.tropical)} season` : `ไพ่ประจำฤดู${nameOf(season.tropical)}`}
            width="w-[120px] sm:w-[130px] shrink-0"
            sizes="(min-width: 640px) 130px, 120px"
          />
          <div className="space-y-2">
            <p className="text-xs font-serif-th font-semibold text-gold-ink">
              {isEnglish ? "This month's season card" : "ไพ่ประจำฤดูราศีเดือนนี้"}
            </p>
            <p className="text-base sm:text-lg font-serif-th font-bold text-ink">
              {seasonOpen
                ? cardName(season.card)
                : isEnglish
                  ? `Sun in ${nameOf(season.tropical)} · ${nameOf(season.thai)} (Thai)`
                  : `ดวงอาทิตย์อยู่${nameOf(season.tropical)} · ${nameOf(season.thai)} (ไทย)`}
            </p>
            <p className="text-sm text-muted font-sans leading-relaxed">
              {seasonOpen
                ? message(season.card)
                : isEnglish
                  ? `Moves to ${nameOf(season.nextTropical.sign)} on ${formatMonthDay(season.nextTropical.start, true)}`
                  : `ย้ายเข้า${nameOf(season.nextTropical.sign)} ${formatMonthDay(season.nextTropical.start, false)} · แตะไพ่เพื่อรับพลังของเดือนนี้`}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
