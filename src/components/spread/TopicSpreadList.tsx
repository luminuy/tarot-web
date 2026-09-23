// ลิงก์ภายในต้องอยู่ในต้นไม้ภาษาเดียวกับหน้าที่ผู้ใช้ยืนอยู่ — ดู src/components/ui/LocaleLink.tsx
import { LocaleLink as Link } from "@/components/ui/LocaleLink";
import type { Spread, SpreadPosition } from "@/data/spreads-helpers";
import { isStandardSpread } from "@/lib/entitlement/limits";
import { SealedLockIcon } from "@/components/entitlement/EntitlementIcons";
import { renderSpreadIllustration } from "@/components/spread/spread-illustrations";
import { useLocale } from "@/lib/i18n";

interface TopicSpreadListProps {
  spreads: Spread[];
}

/**
 * 📐 การ์ดผังพยากรณ์ในหน้าหมวดชีวิต — **ไม่ต้อง hydrate** (2026-09-18)
 * ---------------------------------------------------------------------------
 * ของเดิมมี `useState` ตัวเดียวคือ "การ์ดใบไหนกางแผงตำแหน่งไพ่อยู่" แล้วต้องแลกด้วย
 * การโหลด React ทั้งก้อนลงหน้าหมวดทั้ง 12 หน้า (6 ไทย + 6 อังกฤษ)
 *
 * ตอนนี้ใช้ `<details>` ของเบราว์เซอร์แทน ได้ของเท่าเดิมโดยไม่ใช้ JS สักบรรทัด:
 * เปิด/ปิดด้วยคีย์บอร์ดเอง · ประกาศสถานะให้โปรแกรมอ่านหน้าจอเอง (ไม่ต้องเขียน `aria-expanded`)
 * · และยังกางได้ตั้งแต่เฟรมแรกก่อน JS ใด ๆ จะโหลด (ท่าเดียวกับ `ChangePasswordCard`)
 *
 * ⚠️ พฤติกรรมที่เปลี่ยนโดยตั้งใจ: เดิมกางได้ทีละใบ (กางใบใหม่ = ใบเก่าพับ)
 *    ตอนนี้กางพร้อมกันหลายใบได้ — การ์ดแต่ละใบมีความสูงของตัวเอง ไม่มีใบไหนดันใบอื่น
 *    และไม่มีใครเคยขอให้มันพับกันเอง (ถ้าต้องบังคับทีละใบต้องใช้ `name=` ซึ่ง Safari < 17.2 ไม่รองรับ)
 */
export function TopicSpreadList({ spreads }: TopicSpreadListProps) {
  const { isEnglish } = useLocale();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {spreads.map((spread) => {
        const isStandard = isStandardSpread(spread.id);

        return (
          <div
            key={spread.id}
            className="altar-card-porcelain p-6 flex flex-col justify-between space-y-4 transition duration-300 relative overflow-hidden hover:shadow-md"
          >
            {/* Badges */}
            <div className="flex items-center justify-between z-10">
              <span className="glass-chip text-xs font-mono font-bold text-ink px-3 py-1">
                {spread.positions.length} {isEnglish ? "Cards" : "ใบ"}
              </span>
              {!isStandard ? (
                <span className="glass-chip text-xs text-gold-ink px-2.5 py-0.5 font-serif-th font-semibold flex items-center gap-1">
                  <SealedLockIcon className="w-3 h-3" />
                  <span>{isEnglish ? "Deep Vision" : "ผังญาณลึก"}</span>
                </span>
              ) : (
                <span className="glass-chip text-xs text-[#5E5240] px-2.5 py-0.5 font-serif-th">
                  {isEnglish ? "Free" : "เปิดฟรี"}
                </span>
              )}
            </div>

            {/* Visual Formation */}
            <div className="h-44 flex items-center justify-center my-1 relative select-none rounded-xl bg-[#F7F5F0] border border-line-soft p-2 hover:border-gold/60 transition-colors">
              {renderSpreadIllustration(spread.id)}
            </div>

            {/* Title & Description */}
            <div className="space-y-2 z-10 pt-2 border-t border-line-soft">
              <h2 className="font-serif-th text-lg font-bold text-ink leading-snug">
                {isEnglish ? (spread.nameEn || spread.nameTh) : spread.nameTh}
              </h2>
              <p className="text-xs font-serif-th text-muted leading-relaxed line-clamp-1">
                {isEnglish ? (spread.taglineEn || spread.tagline) : spread.tagline}
              </p>
              <p className="text-xs font-serif-th text-[#4A4338] leading-relaxed line-clamp-3">
                {isEnglish ? (spread.descriptionEn || spread.description) : spread.description}
              </p>
            </div>

            {/* Positional Breakdown Accordion — `<details>` ของเบราว์เซอร์ ไม่ใช้ JS */}
            <details className="group z-10 pt-2 border-t border-line-soft/60 space-y-2">
              <summary className="tap-overlay-y list-none w-full text-left text-xs font-serif-th text-gold-ink hover:text-[#5E390A] flex items-center justify-between py-1 font-semibold cursor-pointer transition-colors [&::-webkit-details-marker]:hidden">
                <span>{isEnglish ? `${spread.positions.length} Card Positions` : `ความหมาย ${spread.positions.length} ตำแหน่งไพ่`}</span>
                <span className="text-[11px]">
                  <span className="group-open:hidden">{isEnglish ? "▼ Details" : "▼ ขยาย"}</span>
                  <span className="hidden group-open:inline">{isEnglish ? "▲ Hide" : "▲ ย่อ"}</span>
                </span>
              </summary>

              <div className="altar-card-porcelain !rounded-lg space-y-1.5 pt-2 pb-1 text-xs text-muted p-3 max-h-48 overflow-y-auto">
                {spread.positions.map((pos: SpreadPosition) => (
                  <div key={pos.index} className="flex items-start gap-2">
                    <span className="font-mono text-gold-ink font-bold shrink-0">
                      {pos.index}.
                    </span>
                    <div>
                      <span className="font-serif-th font-bold text-ink">
                        {isEnglish ? (pos.nameEn || pos.nameTh) : pos.nameTh}
                      </span>
                      <span className="mx-1 text-line">·</span>
                      <span className="font-serif-th text-[11px] text-muted">
                        {isEnglish ? (pos.meaningEn || pos.meaning) : pos.meaning}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </details>

            {/* CTAs */}
            <div className="grid grid-cols-2 gap-2 pt-3 border-t border-line-soft z-10">
              <Link
                href={`/?spread=${spread.id}`}
                className="btn-gold-glass !rounded-lg w-full py-2 px-3 text-xs font-serif-th font-bold text-center hover:bg-[#3D382E]"
              >
                {isEnglish ? "Begin Reading" : "เริ่มเปิดไพ่"}
              </Link>
              <Link
                href={`/spreads/${spread.id}`}
                className="w-full py-2 px-3 text-xs font-serif-th font-semibold text-center rounded-lg border border-line text-[#4A4338] hover:bg-surface-warm transition-colors"
              >
                {isEnglish ? "Spread Details" : "รายละเอียดผัง"}
              </Link>
            </div>
          </div>
        );
      })}
    </div>
  );
}
