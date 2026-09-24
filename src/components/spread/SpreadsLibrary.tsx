/**
 * 📐 คลังผังพยากรณ์ 26 แบบ — **เรนเดอร์เป็น HTML ล้วน ไม่มี hydration** (R-02)
 * ===========================================================================
 *
 * ## ทำไมไฟล์นี้ถึงไม่มี `useState` และไม่มี `onClick` แม้แต่ตัวเดียว
 *
 * ของเดิมเป็น island ที่ `client:idle` ทั้งก้อน — ซึ่งแปลว่าเบราว์เซอร์ต้องโหลด
 * React runtime + **ข้อมูลผังทั้ง 25 แบบ (17.2 KB gzip)** มาเพื่อความสามารถแค่สองอย่าง:
 * สลับแท็บหมวด กับ กดขยายดูตำแหน่งไพ่
 *
 * วัดจากบิลด์จริง (2026-09-17): เอา hydration ออก ➔ JS ของหน้านี้ **124.4 ➔ 99.4 KB gzip**
 * และงานก้อนยาวที่สุดตอนโหลด (687 ms บน Lighthouse mobile) หายไปทั้งก้อน
 *
 * ## แล้วแท็บกับปุ่มขยายทำงานยังไงถ้าไม่มี React
 *
 * - **ขยายดูตำแหน่งไพ่** ➔ `<details>`/`<summary>` ของเบราว์เซอร์เอง · ไม่ใช้ JS เลยสักบรรทัด
 * - **สลับแท็บหมวด** ➔ การ์ดทั้ง 25 ใบถูกเรนเดอร์ไว้ใน HTML ตั้งแต่ตอนบิลด์
 *   พร้อมแอตทริบิวต์ `data-cats` บอกว่าใบนี้อยู่หมวดไหนบ้าง
 *   สคริปต์เล็ก ๆ ที่ `astro/scripts/spreads-tabs.ts` (≈1 KB) แค่สลับแอตทริบิวต์ `hidden`
 *
 * ## ผลพลอยได้ที่สำคัญกว่าความเร็ว
 *
 * เดิม HTML ที่เซิร์ฟเวอร์ส่งออกไปมีผังแค่ 6 ใบของแท็บ "ยอดนิยมแนะนำ" อีก 19 ใบโผล่
 * ต่อเมื่อผู้ใช้กดแท็บ (นี่คือเหตุผลที่ต้องมีสารบัญฝั่งเซิร์ฟเวอร์เพิ่มใน `spreads-index.tsx`)
 * ตอนนี้ **เนื้อหาของทั้ง 26 ผังอยู่ใน HTML ดิบครบทุกใบ** ตั้งแต่ไบต์แรกที่บอตและผู้ใช้ได้รับ
 *
 * ⚠️ **ห้ามใส่ `client:*` กลับเข้าไปที่ `<SpreadsLibraryRoot>`** — จะได้ทั้งสองต้นทุนพร้อมกัน
 * (HTML ที่โตขึ้นจากการเรนเดอร์ครบ 25 ใบ + JS ที่ตั้งใจตัดทิ้ง) ด่านงบบันเดิลเฝ้าอยู่
 */

import React from "react";
// ลิงก์ภายในต้องอยู่ในต้นไม้ภาษาเดียวกับหน้าที่ผู้ใช้ยืนอยู่ — ดู src/components/ui/LocaleLink.tsx
import { LocaleLink as Link } from "@/components/ui/LocaleLink";
import {
  type Spread,
  getSpreadName,
  getSpreadTagline,
  getSpreadDescription,
  getPositionName,
  getPositionMeaning,
} from "@/data/spreads-helpers";
import { renderSpreadIllustration } from "@/components/spread/spread-illustrations";
import {
  SparkleTabIcon,
  HeartTabIcon,
  PentacleTabIcon,
  CrystalBallTabIcon,
  AllSpreadsTabIcon,
} from "@/components/ui/TarotArtIcons";
import { SealedLockIcon } from "@/components/entitlement/EntitlementIcons";
import { isStandardSpread } from "@/lib/entitlement/limits";
import { useLocale } from "@/lib/i18n";

interface SpreadsLibraryProps {
  spreads: Spread[];
}

const CATEGORY_MAP_TH: Record<string, string> = {
  general: "ทั่วไป",
  love: "ความรัก",
  career: "การงาน",
  work: "การงาน",
  money: "การเงิน",
  finance: "การเงิน",
  spiritual: "จิตวิญญาณ",
  decision: "การตัดสินใจ",
  all: "ทั้งหมด",
  recommended: "แนะนำ",
  master: "ผังใหญ่",
};

const CATEGORY_MAP_EN: Record<string, string> = {
  general: "General",
  love: "Love & Romance",
  career: "Career & Work",
  work: "Career & Work",
  money: "Finances & Abundance",
  finance: "Finances & Abundance",
  spiritual: "Spiritual Growth",
  decision: "Decision & Dilemmas",
  all: "All",
  recommended: "Recommended",
  master: "Grand Spread",
};

/**
 * สมาชิกของแต่ละแท็บ — **แหล่งความจริงเดียว** ทั้งของ HTML และของสคริปต์สลับแท็บ
 * (สคริปต์อ่านจาก `data-cats` ที่สร้างจากตารางนี้ จึงไม่มีทางหลุดจากกัน)
 */
const TAB_MEMBERS: Record<string, string[]> = {
  recommended: ["daily", "quick", "yes-no", "three-card", "situation-solution", "celtic-cross"],
  love: ["love", "how-they-feel", "ex-reconciliation", "soulmate", "three-card"],
  career: ["career", "money", "career-switch", "decision", "inner-potential"],
  master: ["celtic-cross", "year-ahead", "twelve-houses", "weekly", "chakra", "monthly"],
};

/** แท็บที่เปิดมาเป็นค่าเริ่มต้น — ต้องตรงกับค่าเริ่มต้นในสคริปต์สลับแท็บ */
const DEFAULT_TAB = "recommended";

const catsOf = (id: string): string =>
  ["all", ...Object.keys(TAB_MEMBERS).filter((tab) => TAB_MEMBERS[tab].includes(id))].join(" ");

export const SpreadsLibrary: React.FC<SpreadsLibraryProps> = ({ spreads }) => {
  const { isEnglish } = useLocale();

  const categories = [
    { id: "recommended", label: isEnglish ? "Recommended" : "ยอดนิยมแนะนำ", count: 6, Icon: SparkleTabIcon },
    { id: "love", label: isEnglish ? "Love & Romance" : "ความรัก & คนในใจ", count: 5, Icon: HeartTabIcon },
    { id: "career", label: isEnglish ? "Career & Finances" : "การงาน & การเงิน", count: 5, Icon: PentacleTabIcon },
    { id: "master", label: isEnglish ? "Grand Spreads" : "ผังใหญ่เจาะลึก", count: 5, Icon: CrystalBallTabIcon },
    { id: "all", label: isEnglish ? "All Spreads" : "ผังทั้งหมด", count: spreads.length, Icon: AllSpreadsTabIcon },
  ];

  return (
    <div className="space-y-6">
      {/* Dynamic Bilingual Hero Header */}
      <div className="text-center space-y-4 sm:space-y-5 py-6 sm:py-8">
        <div>
          <span className="glass-chip inline-flex items-center gap-2 px-4 py-1.5 text-xs text-gold-ink font-serif-th font-bold">
            {isEnglish
              ? `${spreads.length} CLASSIC DIVINATION SPREADS`
              : `${spreads.length} ผังการเปิดไพ่มาตรฐานสากล`}
          </span>
        </div>
        <h1 className="font-serif-th text-3xl sm:text-5xl font-bold text-ink tracking-wide leading-normal sm:leading-tight pt-1 [text-wrap:balance]">
          {isEnglish
            ? `${spreads.length} Sacred Tarot Spreads & Layouts`
            : `ผังการเปิดไพ่ทาโรต์ ${spreads.length} รูปแบบ`}
        </h1>
        <p className="text-xs sm:text-sm text-muted max-w-2xl mx-auto leading-relaxed font-serif-th [text-wrap:balance]">
          {isEnglish
            ? "Select a sacred spread attuned to your inquiry. Explore positional dynamics, archetypal geometry, and card interpretations."
            : "เลือกผังที่ตรงกับเรื่องที่คุณอยากรู้ พร้อมดูตัวอย่างการจัดวางและความหมายของแต่ละตำแหน่ง"}
        </p>
      </div>

      {/* Category Tabs with Editorial Styling */}
      <div
        role="tablist"
        data-spreads-tablist
        aria-label={isEnglish ? "Spread library categories" : "หมวดหมู่คลังผังพยากรณ์"}
        className="flex items-center justify-start gap-2 overflow-x-auto pb-3 px-1 no-scrollbar select-none border-b border-line/40"
      >
        {categories.map((cat) => {
          const isActive = cat.id === DEFAULT_TAB;
          const Icon = cat.Icon;

          return (
            <button
              key={cat.id}
              role="tab"
              id={`library-tab-${cat.id}`}
              data-spread-tab={cat.id}
              aria-controls="library-panel"
              aria-selected={isActive}
              tabIndex={isActive ? 0 : -1}
              type="button"
              /* แท็บที่เลือกอยู่ใช้ผิวทองกระจกชุดเดียวกับปุ่มหลักทั้งเว็บ (เดิมเป็นก้อนดำ `bg-ink`)
                 ส่วนแท็บที่ยังไม่เลือกเป็นชิปกระจก จึงเข้าชุดกับการ์ดผังที่อยู่ใต้มัน */
              className={`tap-overlay-y px-4 py-2 rounded-full text-xs font-serif-th font-bold transition duration-200 cursor-pointer flex items-center gap-2 whitespace-nowrap relative focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gold ${
                isActive ? "btn-gold-glass" : "glass-chip text-ink hover:text-gold-ink"
              }`}
            >
              <Icon className={`w-3.5 h-3.5 flex-shrink-0 ${isActive ? "text-white" : "text-muted"}`} />
              <span>{cat.label}</span>
              <span
                className={`text-[12px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                  isActive ? "bg-white/20 text-white" : "bg-black/5 text-muted"
                }`}
              >
                {cat.count}
              </span>
            </button>
          );
        })}
      </div>

      {/*
        26 Spreads Grid — เรนเดอร์ครบทุกใบตั้งแต่ตอนบิลด์
        ใบที่ไม่ได้อยู่ในแท็บที่เปิดอยู่ถูกซ่อนด้วยแอตทริบิวต์ `hidden`
        (ซ่อนจากทั้งสายตาและโปรแกรมอ่านหน้าจอ — ไม่ใช่แค่ `opacity: 0`)
        ⚠️ ห้ามใส่ `anim-swap-rise-sm` ที่นี่ (INC-0244) — คลาสจะติดไปกับ HTML ตอนบิลด์
        กริดทั้งหน้าจึงจางหายแล้วค่อยโผล่ทุกครั้งที่เปิดหน้า · `astro/scripts/spreads-tabs.ts`
        ใส่คลาสให้เองตอนผู้ใช้สลับแท็บแล้ว
      */}
      <div
        role="tabpanel"
        id="library-panel"
        data-spreads-panel
        aria-labelledby={`library-tab-${DEFAULT_TAB}`}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6"
      >
        {spreads.map((spread) => {
          const cats = catsOf(spread.id);

          return (
            <div
              key={spread.id}
              data-spread-card
              data-cats={cats}
              hidden={!cats.split(" ").includes(DEFAULT_TAB)}
              className="altar-card-porcelain p-5 sm:p-6 flex flex-col justify-between space-y-4 relative overflow-hidden group"
            >
              {/* Header Tag */}
              <div className="flex items-center justify-between z-10">
                <div className="flex items-center gap-1.5">
                  <span className="glass-chip text-[13px] font-mono font-bold text-ink px-2.5 py-0.5">
                    {spread.positions.length} {isEnglish ? "Cards" : "ใบ"}
                  </span>
                  {!isStandardSpread(spread.id) && (
                    <span className="glass-chip text-[12px] text-gold-ink px-2 py-0.5 font-serif-th font-bold flex items-center gap-1">
                      <SealedLockIcon className="w-3 h-3" />
                      <span>{isEnglish ? "Grand Spread" : "ญาณพิเศษ"}</span>
                    </span>
                  )}
                </div>
                <span className="text-[13px] text-muted font-serif-th">
                  {isEnglish
                    ? `Category: ${CATEGORY_MAP_EN[spread.defaultCategory] || spread.defaultCategory}`
                    : `หมวด: ${CATEGORY_MAP_TH[spread.defaultCategory] || spread.defaultCategory}`}
                </span>
              </div>

              {/* Interactive Spread Visual Diagram on Illuminated Pedestal */}
              <div className="glass-tile h-44 flex items-center justify-center my-1 relative select-none p-2">
                {renderSpreadIllustration(spread.id)}
              </div>

              {/* Titles & Tagline */}
              <div className="space-y-1.5 z-10 pt-3 border-t border-line/40">
                {/* ชื่อผังแต่ละแบบคือหัวข้อระดับที่สองของหน้า /spreads (h1 = ชื่อหน้า) */}
                <h2 className="font-serif-th text-base sm:text-lg font-bold text-ink leading-snug py-0.5 [text-wrap:balance]">
                  {getSpreadName(spread, isEnglish)}
                </h2>
                <p className="text-xs text-muted leading-relaxed font-serif-th">{getSpreadTagline(spread, isEnglish)}</p>
              </div>

              <p className="text-[13px] text-ink leading-relaxed line-clamp-2 z-10 font-serif-th [text-wrap:pretty]">
                {getSpreadDescription(spread, isEnglish)}
              </p>

              {/*
                ย่อ/ขยายด้วย <details> ของเบราว์เซอร์ — ไม่ใช้ JS เลยสักบรรทัด
                (ของเดิมเป็น state ใน React ซึ่งเป็นเหตุผลหนึ่งที่ทั้งคลังต้อง hydrate)
              */}
              <details className="z-10 space-y-2 group/details">
                <summary className="tap-overlay-y w-full text-left text-[13px] font-serif-th text-gold-ink hover:text-ink flex items-center justify-between py-1.5 border-t border-line/40 cursor-pointer transition-colors font-bold list-none [&::-webkit-details-marker]:hidden">
                  <span className="flex items-center gap-1.5">
                    {isEnglish
                      ? `View ${spread.positions.length} card positions`
                      : `ดูรายละเอียด ${spread.positions.length} ตำแหน่งไพ่`}
                  </span>
                  <span className="text-[13px]">
                    <span className="group-open/details:hidden">{isEnglish ? "▼ Expand" : "▼ ขยาย"}</span>
                    <span className="hidden group-open/details:inline">{isEnglish ? "▲ Collapse" : "▲ ย่อ"}</span>
                  </span>
                </summary>

                <div className="space-y-1.5 pt-1">
                  {spread.positions.map((pos, idx) => (
                    <div
                      key={idx}
                      className="glass-tile text-[13px] p-2 flex items-start gap-2"
                    >
                      <span className="text-gold-ink font-mono font-bold flex-shrink-0 text-[13px]">#{idx + 1}</span>
                      <div>
                        <strong className="text-ink font-serif-th">{getPositionName(pos, isEnglish)}:</strong>{" "}
                        <span className="text-muted leading-relaxed font-serif-th">
                          {getPositionMeaning(pos, isEnglish)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </details>

              {/* Primary Action Button: Link directly to Altar */}
              <Link
                href={`/read/${spread.id}`}
                prefetch={false}
                className="btn-gold-glass w-full py-3 font-serif-th font-bold text-xs sm:text-sm text-center active:scale-[0.98] cursor-pointer flex items-center justify-center gap-1.5 z-10"
              >
                <span>
                  {isEnglish
                    ? isStandardSpread(spread.id)
                      ? "Begin Reading with Spread"
                      : "Unlock Grand Spread"
                    : isStandardSpread(spread.id)
                      ? "เริ่มดูดวงด้วยผังนี้"
                      : "เปิดผังพยากรณ์พิเศษนี้"}
                </span>
              </Link>
              <Link
                href={`/spreads/${spread.id}`}
                prefetch={false}
                className="z-10 -mt-1 text-center text-[13px] font-serif-th text-gold-ink hover:text-ink transition-colors"
              >
                {isEnglish ? "Read Spread Guide →" : "อ่านคู่มือผังนี้ →"}
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
};
