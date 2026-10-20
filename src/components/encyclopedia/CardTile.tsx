/**
 * 🃏 การ์ดไพ่ในกริด (ไพ่ 78 ใบ · หน้าไพ่ตามชุด) — ดีไซน์ชุดเดียวกับไพ่บนโต๊ะของหน้า /spreads (เจ้าของ 2026-10-17)
 * กรอบกระดาษงาช้าง + ภาพไพ่ 1909 ➔ ชื่อไทยตัวหัวข้อ · ชื่ออังกฤษตัวเอียง · คำสำคัญ 2 คำ
 *
 * ⚠️ ความสูงคงที่ทุกใบ (ภาพ 7:12 + บล็อกชื่อสูงตายตัว 66px) — สูตร `contain-intrinsic-size` ใน
 *    src/styles/v3-card-tile.css คำนวณจากความกว้างกริดจริง (cqi) ไม่ใช่การเดา · ด่าน test-card-tile-height เฝ้าอยู่
 *    แก้ padding กรอบ · สัดส่วนภาพ · ความสูงบล็อกชื่อ ต้องแก้สูตรพร้อมกัน
 * ⚠️ ไพ่ทั้งหมดต้องอยู่ใน HTML (ข้อห้าม SEO) — ใช้ `card-tile-cv` ข้ามการวาดของนอกจอแทนการตัดออก
 */
import { LocaleLink as Link } from "@/components/ui/LocaleLink";
import { CardImage } from "@/components/card/CardImage";
import type { CardSummary } from "@/data/cards/summary";
import { CARD_KEYWORDS_EN } from "@/data/cards/keywords-en";

/** ภาพในกริด: ความกว้างจริงราว 150–220px ตามจำนวนคอลัมน์ */
const TILE_SIZES = "(min-width: 1200px) 200px, (min-width: 768px) 210px, 44vw";

export function CardTile({
  card,
  isEnglish,
  eager = false,
  priority = false,
}: {
  card: CardSummary;
  isEnglish: boolean;
  eager?: boolean;
  priority?: boolean;
}) {
  const kwEn = CARD_KEYWORDS_EN[card.id]?.upright;
  const keywords = (isEnglish && kwEn && kwEn.length > 0 ? kwEn : card.keywords.upright).slice(0, 2);
  return (
    <Link
      href={`/cards/${card.id}`}
      prefetch={false}
      data-suit={card.arcana === "major" ? "major" : (card.suit ?? "major")}
      className="card-tile-cv v3-tile"
      /* `content-visibility: auto` ข้ามการวาดใบที่อยู่นอกจอ — Chrome ตัดข้อความข้างในออกจาก accessibility tree ด้วย
         ลิงก์จึงไม่มีชื่อให้โปรแกรมอ่านจอ (B1 2026-10-20) ➔ ตั้งชื่อตรง ๆ */
      aria-label={isEnglish ? card.nameEn : `${card.nameTh} (${card.nameEn})`}
    >
      <span className="v3-tile-frame">
        <CardImage
          image={card.image}
          cardId={card.id}
          /* ภาพประกอบล้วน — <h2> ในลิงก์เดียวกันพิมพ์ชื่อไพ่อยู่แล้ว (INC-0125) */
          alt=""
          className="v3-tile-img tarot-hd-card-image"
          sizes={TILE_SIZES}
          loading={eager ? "eager" : "lazy"}
          fetchPriority={priority ? "high" : undefined}
        />
        {card.arcana === "major" && <span className="v3-tile-no ui2-num">{card.number}</span>}
      </span>
      <span className="v3-tile-txt">
        {/* ชื่อไพ่คือหัวข้อระดับสองของหน้า (h1 = ชื่อหน้า · h2 ของหน้าต่างหมวดอยู่ระดับเดียวกัน) */}
        <h3 className="v3-tile-name">{isEnglish ? card.nameEn : card.nameTh}</h3>
        {!isEnglish && <span className="v3-tile-en ui2-accent">{card.nameEn}</span>}
        <span className="v3-tile-kw">{keywords.join(" · ")}</span>
      </span>
    </Link>
  );
}
