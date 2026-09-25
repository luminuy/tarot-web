import { CardImage } from "@/components/card/CardImage";
import { CARD_SUMMARIES } from "@/data/cards/summary";
import { ThaiPhrases } from "@/components/ui/ThaiPhrases";

/**
 * ✦ "คำทำนายหน้าตาเป็นแบบนี้" + ตัวนับคำทำนายจริง (แผนหน้าแรก ข้อ 3)
 * ===========================================================================
 * ตอนนี้ต้องสมัครก่อนเปิดไพ่ (`GUEST_LIMIT = 0`) คนที่ยังไม่สมัครจึงไม่เคยเห็นว่าคำทำนายละเอียดแค่ไหน
 * ส่วนนี้ให้ดูตัวอย่างก่อนตัดสินใจ
 *
 * ⚠️ ตัวอย่างเป็นข้อความที่เรียบเรียงขึ้น (ไม่ใช่คำทำนายของผู้ใช้จริง) และบอกผู้อ่านตรง ๆ ใต้กล่อง
 *    ความหมายไพ่ทั้งสามใบตรงกับสารานุกรมของเว็บ · ถ้าจะเปลี่ยนเป็นคำทำนายจริง ต้องได้รับอนุญาตและตัดข้อมูลส่วนตัวออกก่อน
 *
 * 🔢 ตัวนับ: HTML นิ่งซ่อนไว้ก่อน (`hidden`) แล้ว `astro/scripts/home-track.ts` ยิง `/api/stats/public`
 *    (แคชที่ขอบ) ตอนเลื่อนมาใกล้ส่วนนี้ ยอดต่ำกว่า `data-min` หรืออ่านไม่ได้ = ซ่อนต่อไป ไม่มีเลขปลอม
 */

/** ยอดขั้นต่ำก่อนโชว์ตัวนับ — ตัวเลขน้อยเกินไปทำให้เว็บดูเงียบมากกว่าน่าเชื่อ */
export const PUBLIC_COUNTER_MIN = 1000;

const SUMMARY_BY_ID = new Map(CARD_SUMMARIES.map((card) => [card.id, card]));

const SAMPLE_CARDS = [
  { id: "pentacles-08", th: "อดีต", en: "Past" },
  { id: "wands-12", th: "ปัจจุบัน", en: "Present" },
  { id: "major-17", th: "อนาคต", en: "Future" },
] as const;

const SAMPLE = {
  th: {
    question: ["เดือนหน้ามีสัมภาษณ์งานใหม่", "จะไปได้ดีไหม"],
    spread: "ผัง 3 ใบ · อดีต ปัจจุบัน อนาคต",
    reading: [
      "แปดแห่งเหรียญในตำแหน่งอดีตบอกว่าคุณสะสมฝีมือมานานแล้ว ภาพช่างที่ก้มหน้าตอกเหรียญทีละเหรียญคือช่วงที่คุณฝึกฝนเงียบ ๆ โดยไม่มีใครเห็น",
      "ตอนนี้อัศวินไม้เท้ามาอยู่ตำแหน่งปัจจุบัน ใจคุณพร้อมพุ่งไปข้างหน้าแล้ว แต่ม้าที่ยกขาหน้าก็เตือนว่าอย่ารีบจนข้ามการเตรียมตัว",
      "ดวงดาวในตำแหน่งอนาคตคือไพ่แห่งความหวัง ผลสัมภาษณ์มีแนวโน้มออกมาดี และถึงรอบนี้ไม่ได้ ก็จะพาไปเจอโอกาสที่เหมาะกับคุณกว่า",
    ],
    advice: "ทำได้เลยวันนี้: เตรียมเล่าผลงาน 2–3 ชิ้นที่คุณภูมิใจที่สุดให้กระชับ",
  },
  en: {
    question: ["I have a job interview next month.", "Will it go well?"],
    spread: "3-card spread · Past, Present, Future",
    reading: [
      "The Eight of Pentacles in the past shows skill you have built for a long time. The craftsman tapping out coin after coin is the quiet practice nobody saw.",
      "The Knight of Wands sits in the present. You are ready to charge ahead, but the rearing horse warns you not to rush past your preparation.",
      "The Star in the future is a card of hope. The interview leans toward a good result, and even if this one passes you by, it points you to a better fit.",
    ],
    advice: "Do this today: prepare a short story about the two or three pieces of work you are proudest of.",
  },
} as const;

export function HomeProofSection({ isEnglish }: { isEnglish: boolean }) {
  const copy = isEnglish ? SAMPLE.en : SAMPLE.th;

  return (
    <section
      aria-labelledby="home-proof-title"
      data-home-section="proof"
      className="home-band max-w-6xl mx-auto px-4 sm:px-6 space-y-6 sm:space-y-8"
    >
      <div className="text-center space-y-2.5 sm:space-y-3">
        <span className="text-gold-ink text-xs font-serif-th tracking-widest uppercase block">SAMPLE READING</span>
        <h2
          id="home-proof-title"
          className="text-2xl sm:text-3xl font-serif-th font-bold text-ink [text-wrap:balance]"
        ><ThaiPhrases>
          {isEnglish ? "See What a Reading Looks Like" : "คำทำนายของแม่หมอ AI หน้าตาเป็นแบบนี้"}
        </ThaiPhrases></h2>
        <p className="text-xs sm:text-sm text-muted font-serif-th max-w-2xl mx-auto [text-wrap:balance]">
          {isEnglish ? (
            "Every card is read in its position and tied back to your question, then you get one thing you can do today."
          ) : (
            <>
              <span className="inline-block">แม่หมออ่านไพ่ทีละใบตามตำแหน่ง</span>{" "}
              <span className="inline-block">ผูกกลับมาที่คำถามของคุณ</span>{" "}
              <span className="inline-block">แล้วปิดท้ายด้วยสิ่งที่ลงมือทำได้เลย</span>
            </>
          )}
        </p>
        {/* ตัวนับ — ซ่อนจนกว่าสคริปต์จะได้ยอดจริงที่ถึงเกณฑ์ (ดูคอมเมนต์หัวไฟล์) */}
        <p
          data-reading-counter
          data-min={PUBLIC_COUNTER_MIN}
          hidden
          className="font-serif-th text-sm text-ink pt-1"
        >
          {isEnglish ? (
            <>
              <strong data-reading-counter-value className="text-gold-ink" /> readings completed on SeerTarot so far
            </>
          ) : (
            <>
              อ่านคำทำนายจบไปแล้ว <strong data-reading-counter-value className="text-gold-ink" /> ครั้งบน SeerTarot
            </>
          )}
        </p>
      </div>

      <figure className="altar-panel max-w-3xl mx-auto p-5 sm:p-8 space-y-5">
        <div className="space-y-1.5 pb-4 border-b border-line-warm/40">
          <span className="glass-chip inline-block px-2.5 py-0.5 text-[11px] font-serif-th font-semibold text-gold-ink">
            {copy.spread}
          </span>
          <p className="font-serif-th text-base sm:text-lg font-bold text-ink">
            {isEnglish ? "Question: " : "คำถาม: "}
            {/* วรรคละ inline-block กันตัดกลางวรรค (ภาษาไทยไม่มีช่องว่างคั่นคำ) */}
            {copy.question.map((phrase) => (
              <span key={phrase}>
                <span className="inline-block">{phrase}</span>{" "}
              </span>
            ))}
          </p>
        </div>

        <ul className="grid grid-cols-3 gap-3 sm:gap-6 max-w-md mx-auto">
          {SAMPLE_CARDS.map((slot) => {
            const card = SUMMARY_BY_ID.get(slot.id);
            if (!card) return null;
            return (
              <li key={slot.id} className="flex flex-col items-center gap-1.5 text-center">
                <span className="text-[11px] font-serif-th font-semibold text-gold-ink">{isEnglish ? slot.en : slot.th}</span>
                <div className="glass-tile !rounded-md w-16 sm:w-20 aspect-[2/3] overflow-hidden">
                  {/* ภาพประกอบล้วน — ชื่อไพ่พิมพ์อยู่ใต้ภาพแล้ว (INC-0125) */}
                  <CardImage image={card.image} alt="" className="w-full h-full object-cover" sizes="(min-width: 640px) 80px, 64px" />
                </div>
                <span className="text-xs font-serif-th font-bold text-ink leading-tight">
                  {isEnglish ? card.nameEn : card.nameTh}
                </span>
              </li>
            );
          })}
        </ul>

        <blockquote className="space-y-3 font-serif-th text-sm sm:text-base text-ink leading-relaxed">
          {copy.reading.map((line) => (
            <p key={line}>{line}</p>
          ))}
        </blockquote>

        <p className="rounded-xl border border-line-warm bg-inset-warm px-4 py-3 font-serif-th text-sm font-semibold text-ink">
          {copy.advice}
        </p>

        <figcaption className="text-[11px] font-serif-th text-muted leading-relaxed">
          {isEnglish
            ? "This is an illustrative sample, not a real user's reading. Your reading comes from the cards you draw yourself and your own question."
            : "ตัวอย่างนี้เรียบเรียงขึ้นให้เห็นรูปแบบ ไม่ใช่คำทำนายของผู้ใช้จริง คำทำนายของคุณจะอ่านจากไพ่ที่คุณเปิดเองและคำถามของคุณ"}
        </figcaption>
      </figure>

      <div className="text-center">
        <a
          href="#home-quick"
          className="btn-gold-glass inline-flex items-center gap-1.5 px-5 py-2.5 font-serif-th text-sm font-bold"
        >
          {isEnglish ? "Draw your own cards" : "ลองเปิดไพ่ของคุณเอง"}
        </a>
      </div>
    </section>
  );
}
