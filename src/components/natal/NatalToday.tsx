"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ThaiPhrases } from "@/components/ui/ThaiPhrases";
import { ASPECT_TEXT, DAY_TONE_TEXT, MOON_PHASE_DAY_TEXT, MOON_PHASE_TEXT, type Lang } from "@/data/natal/content";
import { buildChart } from "@/lib/astro/chart-spec";
import { bodyName, cardsFor, describeTimedAspect, describeTransitHouse, signName } from "@/lib/astro/natal-text";
import type { SavedChart } from "@/lib/astro/saved-charts";
import { dailyOverview, type TransitAspect } from "@/lib/astro/techniques";
import { smoothScrollBehavior } from "@/lib/use-motion-safe";
import { FlipCard } from "./NatalFlipCard";
import type { NatalCardItem } from "./NatalChartApp";

/**
 * ☀️ ดวงวันนี้จากผังที่บันทึกไว้ในเครื่อง (แสดงเหนือฟอร์มเมื่อมีผังบันทึกไว้)
 * - โหลดแบบ lazy จาก `NatalChartApp` เท่านั้น · คำนวณในเครื่อง ไม่ยิง API ไม่ใช้ AI
 * - ไพ่ประจำดวงจันทร์วันนี้มาจากตาราง Golden Dawn (ตำแหน่งจริงของดวงจันทร์) ไม่ใช่การสุ่ม · คว่ำไว้ให้ผู้ใช้แตะเปิดเอง
 */
export default function NatalToday({
  charts,
  cards,
  lang,
  onOpen,
}: {
  charts: readonly SavedChart[];
  cards: readonly NatalCardItem[];
  lang: Lang;
  onOpen: (c: SavedChart) => void;
}) {
  const isTh = lang === "th";
  const [pickedId, setPickedId] = useState<string | null>(null);
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});
  const picked = charts.find((c) => c.id === pickedId) ?? charts[0];
  // เวลาที่เปิดหน้า: คอมโพเนนต์นี้แสดงหลัง hydrate เท่านั้น จึงไม่ชนกับ HTML จากเซิร์ฟเวอร์
  const [now] = useState(() => Date.now());

  const ref = useRef<HTMLElement>(null);
  // มาจากลิงก์ `#today` (หน้าไพ่รายวัน): ส่วนนี้โผล่หลังโหลดแบบ lazy เบราว์เซอร์จึงเลื่อนหาเองไม่ทัน
  useEffect(() => {
    if (window.location.hash === "#today")
      ref.current?.scrollIntoView({ behavior: smoothScrollBehavior(), block: "start" });
  }, []);

  const day = useMemo(() => {
    try {
      return dailyOverview(buildChart(picked), now);
    } catch {
      return null;
    }
  }, [picked, now]);

  if (!picked) return null;
  const who = picked.name || (isTh ? "คุณ" : "you");
  const dateText = new Intl.DateTimeFormat(isTh ? "th-TH" : "en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(now);

  if (!day) {
    return (
      <p role="alert" className="text-sm text-err">
        {isTh
          ? "คำนวณดวงวันนี้ไม่สำเร็จ กรุณาโหลดหน้าใหม่อีกครั้ง"
          : "Could not calculate today's outlook. Please reload the page."}
      </p>
    );
  }

  const tone = DAY_TONE_TEXT[day.tone];
  const moonCard = cards.find((c) => c.id === cardsFor(day.moon).decan);
  const cardKey = `${picked.id}:${new Date(now).toDateString()}`;

  return (
    <section
      ref={ref}
      id="today"
      aria-labelledby="nt-today-title"
      className="altar-card-porcelain rounded-2xl p-4 sm:p-6 space-y-4 scroll-mt-24"
    >
      {charts.length > 1 && (
        <div
          className="flex flex-wrap gap-2"
          role="group"
          aria-label={isTh ? "เลือกผังที่จะดูดวงวันนี้" : "Choose whose day to show"}
        >
          {charts.map((c) => (
            <button
              key={c.id}
              type="button"
              aria-pressed={c.id === picked.id}
              onClick={() => setPickedId(c.id)}
              className={`tap-target rounded-full border px-3 py-1.5 text-sm ${c.id === picked.id ? "border-gold-ink bg-surface text-ink font-semibold" : "border-line-warm text-muted"}`}
            >
              {c.name || (isTh ? "ไม่มีชื่อ" : "Unnamed")}
            </button>
          ))}
        </div>
      )}

      <div className="space-y-1">
        <p className="text-xs text-muted">{dateText}</p>
        <h2 id="nt-today-title" className="text-lg sm:text-xl font-serif-th font-bold text-ink">
          <ThaiPhrases>
            {isTh ? `ดวงวันนี้ของ${/^[\u0E00-\u0E7F]/.test(who) ? "" : " "}${who}` : `Today for ${who}`}
          </ThaiPhrases>
        </h2>
      </div>

      <div className="border-l-2 border-gold-ink pl-3 space-y-1">
        <p className="font-semibold text-ink">{tone.title[lang]}</p>
        <p className="text-sm text-ink leading-relaxed">{tone.text[lang]}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-start">
        <div className="space-y-3 text-sm text-ink leading-relaxed">
          <p>
            <span className="font-semibold">
              {isTh
                ? `ดวงจันทร์วันนี้อยู่${signName(day.moon.sign, lang)}`
                : `The Moon is in ${signName(day.moon.sign, lang)} today`}
              {day.moon.house
                ? isTh
                  ? ` เรือน ${day.moon.house} ของคุณ`
                  : `, in your house ${day.moon.house}.`
                : isTh
                  ? ""
                  : "."}
            </span>{" "}
            {day.moon.house ? describeTransitHouse("moon", day.moon.house, lang) : ""}
          </p>
          <p>
            <span className="font-semibold">
              {isTh
                ? `วันนี้${MOON_PHASE_TEXT[day.moonPhase].name.th}`
                : `Today is a ${MOON_PHASE_TEXT[day.moonPhase].name.en} day:`}
            </span>{" "}
            {MOON_PHASE_DAY_TEXT[day.moonPhase][lang]}
          </p>
        </div>
        {moonCard && (
          <div className="flex flex-col items-center gap-1">
            <FlipCard
              card={moonCard}
              revealed={!!revealed[cardKey]}
              onReveal={() => setRevealed((r) => ({ ...r, [cardKey]: true }))}
              label={isTh ? "ไพ่ประจำตำแหน่งดวงจันทร์วันนี้" : "Card for today's Moon position"}
              lang={lang}
            />
            <p className="text-xs text-muted text-center max-w-[140px]">
              {revealed[cardKey]
                ? isTh
                  ? moonCard.nameTh
                  : moonCard.nameEn
                : isTh
                  ? "ไพ่ของดวงจันทร์วันนี้"
                  : "Today's Moon card"}
            </p>
          </div>
        )}
      </div>

      {day.fast.length > 0 && (
        <div className="space-y-2">
          <h3 className="font-serif-th font-bold text-ink">
            {isTh ? "ดาวที่แตะผังของคุณวันนี้" : "Planets touching your chart today"}
          </h3>
          <ul className="space-y-2">
            {day.fast.map((a) => (
              <TodayItem key={`${a.t}-${a.n}`} a={a} lang={lang} />
            ))}
          </ul>
        </div>
      )}
      {day.slow.length > 0 && (
        <div className="space-y-2">
          <h3 className="font-serif-th font-bold text-ink">
            {isTh ? "พื้นหลังของช่วงนี้" : "The backdrop of this period"}
          </h3>
          <ul className="space-y-2">
            {day.slow.map((a) => (
              <TodayItem key={`${a.t}-${a.n}`} a={a} lang={lang} />
            ))}
          </ul>
        </div>
      )}

      <p className="text-xs text-muted">
        {isTh
          ? "คำนวณจากผังที่บันทึกไว้ในเครื่องนี้ ข้อมูลเกิดไม่ถูกส่งออกไปไหน"
          : "Calculated from the chart saved on this device. Your birth data never leaves it."}
      </p>
      <button
        type="button"
        onClick={() => onOpen(picked)}
        className="rounded-full border border-line-warm bg-surface px-4 py-2 text-sm text-ink min-h-[44px]"
      >
        {isTh ? "เปิดผังเต็มและดาวจรละเอียด" : "Open the full chart and transits"}
      </button>
    </section>
  );
}

function TodayItem({ a, lang }: { a: TransitAspect; lang: Lang }) {
  const isTh = lang === "th";
  return (
    <li className="border-l-2 border-line-warm pl-2 space-y-0.5">
      <p className="text-sm font-semibold text-ink">
        {bodyName(a.t, lang)}
        {isTh ? "จร" : " (transit)"} {ASPECT_TEXT[a.type].name[lang]} {bodyName(a.n, lang)}
        {isTh ? "เกิด" : " (natal)"}
      </p>
      <p className="text-sm text-ink">{describeTimedAspect(a.t, a.n, a.type, lang)}</p>
    </li>
  );
}
