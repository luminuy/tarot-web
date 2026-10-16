// ลิงก์ภายในต้องอยู่ในต้นไม้ภาษาเดียวกับหน้าที่ผู้ใช้ยืนอยู่ — ดู src/components/ui/LocaleLink.tsx
import { LocaleLink as Link } from "@/components/ui/LocaleLink";
import type { Spread } from "@/data/spreads-helpers";
import { isStandardSpread } from "@/lib/entitlement/limits";
import { mapLayout, MAP_CARD_ASPECT } from "@/lib/tarot/spread-map-geometry";
import { useLocale } from "@/lib/i18n";
import { ThaiPhrases } from "@/components/ui/ThaiPhrases";

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

  /*
   * v2 (เจ้าของ 2026-10-16 "สร้างใหม่เลย") — แถวเมนูผัง: ภาพย่อผังจริง · ชื่อ + คำโปรย · ชื่อตำแหน่งเป็นชิป · ปุ่มสองปุ่ม
   * v1: การ์ดสูงสามคอลัมน์ ภาพประกอบเล็ก ต้องกด "ขยาย" ถึงจะรู้ว่าผังถามอะไรบ้าง ➔ v2 เห็นชื่อตำแหน่งทันที
   * ยังเป็น HTML ล้วน ไม่ hydrate (ไม่มี state)
   */
  return (
    <ol className="v2-tp-list">
      {spreads.map((spread, i) => {
        const isStandard = isStandardSpread(spread.id);
        const map = mapLayout(spread.positions);
        const names = spread.positions.map((pos) => (isEnglish ? pos.nameEn || pos.nameTh : pos.nameTh).replace(/^\d+\.\s*/, ""));
        return (
          <li key={spread.id} className="v2-tp-row">
            <span className="v2-tp-rank" aria-hidden="true">
              {String(i + 1).padStart(2, "0")}
            </span>
            <span className="v2-tp-map" aria-hidden="true">
              <span className="v2-tp-map-area" style={{ paddingBottom: `${(map.boxHeight * 100).toFixed(2)}%` }}>
                {spread.positions.map((pos, j) => (
                  <span
                    key={j}
                    style={{
                      left: `${pos.x * 100}%`,
                      top: `${(((pos.y * map.yScale + map.offsetY) / map.boxHeight) * 100).toFixed(3)}%`,
                      width: `${(map.cardW * 100).toFixed(2)}%`,
                      aspectRatio: `1 / ${MAP_CARD_ASPECT}`,
                      transform: `translate(-50%, -50%) rotate(${pos.rotate ?? 0}deg)`,
                    }}
                  />
                ))}
              </span>
            </span>
            <div className="v2-tp-body">
              <p className="v2-tp-meta">
                <span>
                  {spread.positions.length} {isEnglish ? "cards" : "ใบ"}
                </span>
                <span className={isStandard ? "is-free" : "is-grand"}>
                  {isStandard ? (isEnglish ? "Free" : "เปิดฟรี") : isEnglish ? "Deep Vision" : "ผังญาณลึก"}
                </span>
              </p>
              <h2 className="v2-tp-name">
                <ThaiPhrases>{isEnglish ? spread.nameEn || spread.nameTh : spread.nameTh}</ThaiPhrases>
              </h2>
              <p className="v2-tp-tag">{isEnglish ? spread.taglineEn || spread.tagline : spread.tagline}</p>
              <p className="v2-tp-desc">{isEnglish ? spread.descriptionEn || spread.description : spread.description}</p>
              <ul className="v2-tp-pos" aria-label={isEnglish ? `${names.length} card positions` : `ความหมาย ${names.length} ตำแหน่งไพ่`}>
                {names.map((n, j) => (
                  <li key={j}>
                    <b>{j + 1}</b>
                    {n}
                  </li>
                ))}
              </ul>
            </div>
            <div className="v2-tp-acts">
              <Link href={`/read/${spread.id}`} className="ui2-btn v2-tp-go">
                {isEnglish ? "Begin Reading" : "เริ่มเปิดไพ่"}
              </Link>
              <Link href={`/spreads/${spread.id}`} className="ui2-btn-ghost">
                {isEnglish ? "Spread Details" : "รายละเอียดผัง"}
              </Link>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
