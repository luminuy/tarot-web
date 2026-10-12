import { CardImage } from "@/components/card/CardImage";
import { GoldMark } from "@/components/ui/GoldMark";

/**
 * 🎨 UI 2.0 ส่วน 2 · ริบบิ้นไขว้ — รอยต่อจากกลางวันเข้ากลางคืน (แผน UI_2_0 หัวข้อ 2 · 3.4)
 * ===========================================================================
 * ภาพประกอบล้วน (`aria-hidden`) · lite = เส้นภาพไพ่เส้นเดียว · full = เพิ่มเส้นตัวหนังสือเลื่อนสวน
 * ภาพไพ่ w128 (`thumb`) แบบ lazy · ชุดภาพซ้ำสองรอบเพื่อให้ `ui2-marquee` (-50%) ต่อกันไม่มีรอย
 * ⚠️ ความกว้างล้นจอถูกตัดด้วย `overflow-x: clip` ที่ตัวส่วน — ห้าม overflow-x: hidden ที่ body (INC-0067)
 * ⚠️ งบ DOM หน้าแรก ≤ 1,500 (INC-0247) — ไพ่ 10 ใบ × 2 = ภาพ 20 ชิ้น (`thumb` = <img> ชิ้นเดียว ไม่มี <picture>)
 */
const RIBBON_CARDS = [
  "major-19",
  "cups-02",
  "major-01",
  "wands-03",
  "major-14",
  "pentacles-10",
  "major-09",
  "swords-06",
  "major-12",
  "cups-10",
] as const;

const WORDS_TH = ["ความรัก", "การงาน", "การเงิน", "ใจตัวเอง", "คนรอบตัว", "การเรียน", "ครอบครัว"];
const WORDS_EN = ["Love", "Work", "Money", "Yourself", "People", "Study", "Family"];

export function Ui2Ribbon({ isEnglish }: { isEnglish: boolean }) {
  const words = isEnglish ? WORDS_EN : WORDS_TH;
  return (
    <div className="ui2-sec ui2-ribbon" data-anim-section aria-hidden="true">
      <div className="ui2-strip ui2-strip-cards">
        <div className="ui2-track ui2-loop">
          {[0, 1].map((round) =>
            RIBBON_CARDS.map((id) => (
              <span key={`${round}-${id}`} className="ui2-track-card">
                <CardImage cardId={id} alt="" thumb sizes="74px" loading="lazy" />
              </span>
            )),
          )}
        </div>
      </div>
      <div className="ui2-strip ui2-strip-text">
        <div className="ui2-track ui2-loop">
          {[0, 1].map((round) =>
            words.map((word) => (
              <span key={`${round}-${word}`} className="ui2-track-word">
                {word}
                <GoldMark size="md" className="ui2-mark" />
              </span>
            )),
          )}
        </div>
      </div>
    </div>
  );
}
