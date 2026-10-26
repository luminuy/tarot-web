// ลิงก์ภายในต้องอยู่ในต้นไม้ภาษาเดียวกับหน้าที่ผู้ใช้ยืนอยู่ — ดู src/components/ui/LocaleLink.tsx
import { LocaleLink as Link } from "@/components/ui/LocaleLink";
import type { Spread } from "@/data/spreads-helpers";
import { useLocale } from "@/lib/i18n";
import { ThaiPhrases } from "@/components/ui/ThaiPhrases";
import { SpreadCard, SpreadPopDialog } from "@/components/spread/SpreadCard";

interface TopicSpreadListProps {
  spreads: Spread[];
}

/**
 * 📐 รายการผังในหน้าหมวดเรื่อง `/spreads/topic/*` — **ไม่ต้อง hydrate** (2026-09-18)
 * ---------------------------------------------------------------------------
 * v3 (เจ้าของ 2026-10-26 ตอบคำถามเปิดข้อ 1 ของแผน UI_2_0_SPREADS "ใช้ไพ่ผังแบบเดียวกับ /spreads"):
 * ภาพย่อผังของแต่ละแถวเป็นไพ่ผังงาช้างใบเดียวกับคลังผัง (`SpreadCard`) — แตะแล้วเด้งหน้าต่างผังแบบเดียวกัน
 * (`astro/scripts/spread-pop.ts`) · ไม่มี JS = ไพ่เป็นลิงก์ไปหน้าคู่มือผัง
 * ข้อความในแถว (ชื่อผัง h2 · คำโปรย · คำอธิบาย · ชื่อตำแหน่ง · ปุ่มสองปุ่ม) คงเดิมทั้งหมด — เนื้อหาที่ Google เห็นอยู่
 *
 * v2 (เจ้าของ 2026-10-16 "สร้างใหม่เลย"): แถวเมนูผัง เห็นชื่อตำแหน่งทันที ไม่ต้องกด "ขยาย"
 * ยังเป็น HTML ล้วน ไม่ hydrate (ไม่มี state)
 */
export function TopicSpreadList({ spreads }: TopicSpreadListProps) {
  const { isEnglish } = useLocale();

  return (
    <>
    <ol className="v2-tp-list">
      {spreads.map((spread, i) => {
        const names = spread.positions.map((pos) => (isEnglish ? pos.nameEn || pos.nameTh : pos.nameTh).replace(/^\d+\.\s*/, ""));
        return (
          <li key={spread.id} className="v2-tp-row">
            <span className="v2-tp-rank" aria-hidden="true">
              {String(i + 1).padStart(2, "0")}
            </span>
            {/* ไพ่ผังกลาง (ชื่อผังบนแถบเป็นข้อความธรรมดา — หัวข้อ h2 ของแถวอยู่ข้าง ๆ แล้ว) */}
            <div className="v2-tp-card">
              <SpreadCard spread={spread} isEnglish={isEnglish} surface="topic" band="p" />
            </div>
            <div className="v2-tp-body">
              {/* จำนวนใบ + ฟรี/ผังพิเศษ อยู่บนหัวไพ่ผังแล้ว (เดิมมีแถวป้ายซ้ำ "ผังญาณลึก" ที่เรียกคนละคำกับคลังผัง) */}
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
    <SpreadPopDialog isEnglish={isEnglish} />
    </>
  );
}
