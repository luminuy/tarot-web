import { CardImage } from "@/components/card/CardImage";

/**
 * 🎨 UI 2.0 ส่วน 2 · ริบบิ้นไขว้ — รอยต่อจากกลางวันเข้ากลางคืน (แผน UI_2_0 หัวข้อ 2 · 3.4)
 * ===========================================================================
 * ภาพประกอบล้วน (`aria-hidden`) · ตามภาพต้นแบบ D+ ทุกจอ (เจ้าของสั่ง 2026-10-13): ริบบิ้นทองตัวหนังสือด้านบน
 * เอียงขึ้น + ริบบิ้นมืดภาพไพ่ด้านล่างเอียงลง เลื่อนสวนกัน · เลื่อนแค่ transform (lite ได้) หยุดเมื่อพ้นจอ
 * ภาพไพ่ w128 (`thumb`) แบบ lazy · ชุดภาพซ้ำสองรอบเพื่อให้ `ui2-marquee` (-50%) ต่อกันไม่มีรอย
 * ⚠️ ความกว้างล้นจอถูกตัดด้วย `overflow-x: clip` ที่ตัวส่วน — ห้าม overflow-x: hidden ที่ body (INC-0067)
 * ⚠️ งบ DOM หน้าแรก ≤ 1,500 (INC-0247) — ไพ่ 20 ใบ × 4 รอบ = ภาพ 80 ชิ้น (`thumb` = <img> ชิ้นเดียว ไม่มี <picture> · ไฟล์ซ้ำกันแคชเดียว)
 *    ครึ่งแถบต้องยาวกว่าแถบที่เห็น (110vw) ไม่งั้น `ui2-marquee` (-50%) เลื่อนจนเห็นช่องว่างท้ายแถบ
 *    — 4 รอบ ≈ 6,470px ครึ่งละ 3,235px พอถึงจอ 2,900px (2 รอบเคยขาดที่จอ 1920)
 */
const RIBBON_CARDS = [
  "major-10",
  "major-06",
  "major-21",
  "major-02",
  "major-18",
  "major-19",
  "major-01",
  "major-00",
  "major-03",
  "cups-02",
  "cups-01",
  "pentacles-01",
  "pentacles-08",
  "wands-11",
  "swords-04",
  "major-17",
  "major-14",
  "wands-03",
  "pentacles-10",
  "major-09",
] as const;

/**
 * ข้อความบนริบบิ้นทองตามภาพต้นแบบ D+ — คำอังกฤษตัวเอียง (`--ui2-font-accent`) + คำไทย (Anuphan)
 * ⚠️ ตัวเลขห้ามตัวเอียง (เจ้าของสั่ง 2026-10-12) — "1909" แยกเป็น `.ui2-num` ตัวตรง ไม่อยู่ในช่องตัวเอียง
 */
const WORDS: { accent: string; num?: string; th: string; en: string }[] = [
  { accent: "Rider–Waite", num: "1909", th: "ไพ่แท้ 78 ใบ", en: "78 original cards" },
  { accent: "truly random", th: "สุ่มจริง", en: "shuffled on our server" },
  { accent: "verifiable", th: "ตรวจสอบได้", en: "check the lock code" },
  { accent: "your hand", th: "หยิบด้วยมือคุณเอง", en: "you pick the card" },
];

export function Ui2Ribbon({ isEnglish }: { isEnglish: boolean }) {
  return (
    <div className="ui2-sec ui2-ribbon" data-anim-section aria-hidden="true">
      <div className="ui2-strip ui2-strip-text">
        <div className="ui2-track ui2-loop">
          {[0, 1, 2, 3].map((round) =>
            WORDS.map((w) => (
              <span key={`${round}-${w.accent}`} className="ui2-track-word">
                {(isEnglish || w.num) && <span className="ui2-accent">{w.accent}</span>}
                {w.num && <span className="ui2-num">{w.num}</span>}
                <span className="ui2-track-th">{isEnglish ? w.en : w.th}</span>
                <span className="ui2-diamond" />
              </span>
            )),
          )}
        </div>
      </div>
      <div className="ui2-strip ui2-strip-cards">
        <div className="ui2-track ui2-loop">
          {[0, 1, 2, 3].map((round) =>
            RIBBON_CARDS.map((id) => (
              <span key={`${round}-${id}`} className="ui2-track-card">
                <CardImage cardId={id} alt="" thumb sizes="(min-width: 768px) 68px, 50px" loading="lazy" />
              </span>
            )),
          )}
        </div>
      </div>
    </div>
  );
}
