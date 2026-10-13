import { Fragment } from "react";

import { CardImage } from "@/components/card/CardImage";
import { GoldMark } from "@/components/ui/GoldMark";
import { RouteLink as Link } from "@/components/ui/RouteLink";
import { ThaiPhrases } from "@/components/ui/ThaiPhrases";
import { getArticleTitle } from "@/data/article-helpers";
import { getFeaturedArticles } from "@/data/articles";
import { reviewedCardAdvice } from "@/data/cards/card-advice";
import { CARD_KEYWORDS_EN } from "@/data/cards/keywords-en";
import { CARD_SUMMARIES } from "@/data/cards/summary";
import { getHomeFaqs, getHomeHowToSteps } from "@/data/home-seo";
import { QUESTIONS } from "@/data/questions";
import { SPREAD_TOPICS, getSpreadsForTopic } from "@/data/spread-topics";
import { PUBLIC_SPREADS, getSpread } from "@/data/spreads";
import { ZODIAC_ELEMENT_LABEL, ZODIAC_SIGNS } from "@/data/zodiac";
import { ZODIAC_INDEX_PATH, zodiacSignPath } from "@/lib/tarot/zodiac";

import { Ui2Clock } from "./Ui2Clock";
import {
  EXPLORE_PRIMARY,
  MAJOR_HIGHLIGHTS,
  MORE_WAYS,
  POPULAR_SEARCHES,
  POPULAR_SPREADS,
  type ExploreLink,
} from "./explore-links";

/**
 * 🎨 UI 2.0 ส่วน 4–8 ของหน้าแรก + แถบปุ่มติดล่างจอ — HTML นิ่ง (อยู่ใน `HomeSeoContent` ไม่ hydrate)
 * ===========================================================================
 * แผน: docs/plans/UI_2_0_PLAN_2026-10-12.md หัวข้อ 2 · 6.4–6.8
 * import ข้อมูลได้เต็มที่ (คำถาม · ผัง · ราศี · FAQ) เพราะไม่มีบันเดิล — ⚠️ ห้ามย้ายเข้า island
 * ⚠️ ห้ามอีโมจิ/✦ ✨ — ของตกแต่งใช้ `<GoldMark />` (กฎเหล็ก 2) · ห้ามสีฮาร์ดโค้ดในไฟล์นี้ (ใช้คลาส ui2-* ใน ui2.css)
 * ⚠️ ห้ามใส่ชื่อ/ราคา/เวลาแม่หมอสมมุติ — กล่อง "คุยกับแม่หมอตัวจริง" เป็นลิงก์ล้วนจนกว่าเจ้าของเคาะว่าจะโชว์ใคร
 *    (คำถามเปิดข้อ 1 ในแผน) · ตัวอย่างคำทำนายต้องบอกผู้อ่านตรง ๆ ว่าเป็นตัวอย่าง
 */

type Href = (path: string) => string;

/* ── ส่วน 4 · เรื่องที่ค้างอยู่ในใจ (กระดาษโน้ตคำถามจริง) ─────────────────────── */

/**
 * ลำดับตามแผนหัวข้อ 6.4 (7 ใบแรกตรงภาพต้นแบบ) + เพิ่มตามที่เจ้าของสั่ง 2026-10-13 "ใส่เยอะกว่าที่ออกแบบได้
 * แต่ต้องเหมาะกับทุกจอ" ➔ คอม 11 ใบ (แถว 4·3·4) · แท็บเล็ต 8 ใบ (3·2·3) · มือถือ 6 ใบ (2 คอลัมน์ × 3)
 * ใบที่เกินจำนวนของจอนั้นซ่อนด้วย CSS (`.ui2-notes > :nth-child(n+…)` ใน ui2.css)
 * ⚠️ เพิ่ม/เปลี่ยนคำถาม ➔ ตัวอักษรลายมือต้องมีใน public/fonts/itim-notes.txt (ด่าน test-ui2-fx บอกตัวที่ขาด)
 */
const NOTE_SLUGS = [
  "does-he-love-me",
  "is-he-thinking-of-me",
  "will-my-ex-come-back",
  "will-i-get-the-job",
  "should-i-change-jobs",
  "will-i-be-debt-free",
  "will-i-pass-the-exam",
  "when-will-i-meet-my-soulmate",
  "is-luck-coming-my-way",
  "will-my-family-get-along",
  "should-i-stay-or-go",
] as const;
/** สีกระดาษ 7 สี (โทเคน --ui2-note-N · หมึกคู่สี --ui2-note-ink-N / --ui2-note-sub-N ใน ui2-base.css) */
const NOTE_COLOR_COUNT = 7;
/** มุมเอียง · ระยะเหลื่อมขึ้นลง · ตำแหน่งหมุด ต่อใบ — ไล่ตามภาพต้นแบบ (ใบ 1–7) แล้ววนต่อ */
const NOTE_LOOKS = [
  { tilt: "-6deg", lift: "14px", pin: "46%" },
  { tilt: "4deg", lift: "-12px", pin: "52%" },
  { tilt: "-3deg", lift: "22px", pin: "44%" },
  { tilt: "7deg", lift: "-8px", pin: "56%" },
  { tilt: "3deg", lift: "-6px", pin: "50%" },
  { tilt: "-5deg", lift: "14px", pin: "48%" },
  { tilt: "5deg", lift: "-10px", pin: "54%" },
  { tilt: "-4deg", lift: "8px", pin: "47%" },
  { tilt: "4.5deg", lift: "-14px", pin: "53%" },
  { tilt: "-6deg", lift: "16px", pin: "45%" },
  { tilt: "3.5deg", lift: "-8px", pin: "51%" },
];

/** ข้อความบนโน้ต = หัวคำถามจนถึงเครื่องหมาย "?" ตัวแรก (ข้อมูลจริงจาก src/data/questions) */
function shortQuestion(text: string): string {
  const i = text.indexOf("?");
  return i > 0 ? text.slice(0, i + 1) : text;
}

/**
 * ตัดคำถามไทยเป็นวลีให้ขึ้นบรรทัดแบบภาพต้นแบบ ("แฟนเก่า / จะกลับมาไหม?") — ตัดก่อนคำเชื่อมตัวแรกที่ไม่ใช่ต้นประโยค
 * ข้อความยังมาจากข้อมูลคำถามจริงทั้งก้อน (แค่แบ่งช่วง) · ภาษาอังกฤษมีช่องว่างอยู่แล้ว ไม่ต้องแบ่ง
 */
const NOTE_BREAK_BEFORE = /(จะ|หรือ|ช่วง)/;
function noteLines(text: string): string[] {
  const m = NOTE_BREAK_BEFORE.exec(text.slice(1));
  if (!m) return [text];
  const at = m.index + 1;
  return [text.slice(0, at), text.slice(at)];
}

/** ป้ายล่างโน้ตแบบภาพต้นแบบ "ดวงความรักสองหัวใจ · 5 ใบ" — ชื่อผังตัดวงเล็บจำนวนใบออก แล้วนับใบจากข้อมูลผังจริง */
function spreadLabel(name: string, count: number, isEnglish: boolean): string {
  const base = name.replace(/\s*\([^)]*\)\s*$/, "");
  // เว้นวรรคไม่ตัดบรรทัด — "5" กับ "ใบ" ต้องไม่แยกกันอยู่คนละบรรทัด
  return `${base}\u00a0·\u00a0${count}\u00a0${isEnglish ? (count === 1 ? "card" : "cards") : "ใบ"}`;
}

export function Ui2NotesSection({ isEnglish, href }: { isEnglish: boolean; href: Href }) {
  const notes = NOTE_SLUGS.flatMap((slug) => {
    const q = QUESTIONS.find((item) => item.slug === slug);
    const spread = q ? getSpread(q.spreadId) : undefined;
    // คำถามหรือผังที่หาไม่เจอถูกตัดออก ไม่แต่งข้อความแทน
    return q && spread ? [{ q, spread }] : [];
  });
  return (
    <section className="ui2-sec ui2-night" data-home-section="notes" data-ui2-dark data-anim-section aria-labelledby="ui2-notes-title">
      <div className="ui2-stars ui2-loop" aria-hidden="true" />
      <div className="ui2-wrap">
        <div className="ui2-notes-head ui2-reveal">
          <h2 id="ui2-notes-title" className="ui2-h2">
            {isEnglish ? (
              <>
                That question <span className="tp ui2-gold-night ui2-loop">on your mind</span>…
              </>
            ) : (
              <>
                <span className="tp">เรื่องที่ค้างอยู่</span>
                <span className="tp ui2-gold-night ui2-loop">ในใจ…</span>
              </>
            )}
          </h2>
          <p className="ui2-lede">
            <ThaiPhrases>
              {isEnglish
                ? "Tap the one that sounds like you. We pick the spread that fits."
                : "แตะเรื่องที่ตรงกับคุณ เราเลือกผังที่เหมาะให้"}
            </ThaiPhrases>
          </p>
        </div>
        <ul className="ui2-notes">
          {notes.map(({ q, spread }, i) => {
            const copy = isEnglish ? q.en : q.th;
            const look = NOTE_LOOKS[i % NOTE_LOOKS.length];
            return (
              <li
                key={q.slug}
                className="ui2-note-slot"
                style={{
                  ["--note" as string]: `var(--ui2-note-${(i % NOTE_COLOR_COUNT) + 1})`,
                  ["--note-ink" as string]: `var(--ui2-note-ink-${(i % NOTE_COLOR_COUNT) + 1})`,
                  ["--note-sub" as string]: `var(--ui2-note-sub-${(i % NOTE_COLOR_COUNT) + 1})`,
                  ["--tilt" as string]: look.tilt,
                  ["--lift" as string]: look.lift,
                  ["--pin-x" as string]: look.pin,
                }}
              >
                <Link href={href(`/questions/${q.slug}`)} prefetch={false} className="ui2-note ui2-loop">
                  <span className="ui2-pin" aria-hidden="true" />
                  <span className="ui2-note-q">
                    {isEnglish
                      ? shortQuestion(copy.question)
                      : noteLines(shortQuestion(copy.question)).map((part, j) => (
                          <Fragment key={j}>
                            {j > 0 && <wbr />}
                            <span className="ui2-note-phrase">{part}</span>
                          </Fragment>
                        ))}
                  </span>
                  <span className="ui2-note-spread">
                    {spreadLabel(isEnglish ? spread.nameEn : spread.nameTh, spread.positions.length, isEnglish)}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
        <p className="ui2-notes-more">
          <Link href={href("/questions")} prefetch={false} className="ui2-btn-ghost">
            {isEnglish ? "See all questions" : "ดูคำถามทั้งหมด"}
            <span className="ui2-btn-arrow" aria-hidden="true" />
          </Link>
        </p>
      </div>
    </section>
  );
}

/* ── ส่วน 5 · เว็บอื่นสุ่มให้ดู / เราให้คุณตรวจได้ (แผ่นขาว) ─────────────────── */

const VERIFY_STEPS = {
  th: [
    ["สับครบ 78 ใบ", "สำรับเต็มทั้งชุด ไม่มีใบไหนถูกคัดออกหรือแอบเพิ่ม"],
    ["ล็อกลำดับ + โชว์รหัส", "ระบบล็อกลำดับไพ่แล้วโชว์รหัสให้คุณเห็นก่อนเลือก"],
    ["คุณแตะไพ่เอง", "ใบที่ได้มาจากตำแหน่งที่คุณแตะ ไม่มีใครเลือกแทน"],
    ["เฉลยลำดับให้เทียบรหัส", "อ่านจบแล้วเฉลยลำดับจริง เอาไปเทียบกับรหัสได้เอง"],
  ],
  en: [
    ["All 78 cards shuffled", "The full deck, with nothing removed or slipped in"],
    ["Order locked, code shown", "The deck order is locked and its code shown before you pick"],
    ["You tap the card", "Your card comes from the spot you touched; nobody picks for you"],
    ["Order revealed to check", "After the reading we reveal the order so you can check the code"],
  ],
} as const;

export function Ui2VerifySection({ isEnglish }: { isEnglish: boolean }) {
  const steps = isEnglish ? VERIFY_STEPS.en : VERIFY_STEPS.th;
  return (
    <section className="ui2-sec ui2-night ui2-verify" data-home-section="verify" data-anim-section aria-labelledby="ui2-verify-title">
      <div className="ui2-wrap ui2-sheet">
        <h2 id="ui2-verify-title" className="ui2-vs ui2-reveal">
          <span className="ui2-vs-a">
            <ThaiPhrases>{isEnglish ? "Other sites shuffle for show." : "เว็บอื่นสุ่มให้ดู"}</ThaiPhrases>
          </span>
          <span className="ui2-vs-b">
            <ThaiPhrases>
              {isEnglish ? (
                <>
                  We let you <span className="tp ui2-gold-day ui2-loop">check</span>.
                </>
              ) : (
                <>
                  เราให้คุณ<span className="tp ui2-gold-day ui2-loop">ตรวจได้</span>
                </>
              )}
            </ThaiPhrases>
          </span>
          <svg className="ui2-underline" viewBox="0 0 260 14" aria-hidden="true" focusable="false">
            <path d="M3 9 C 60 3, 120 3, 170 7 S 240 12, 257 5" />
          </svg>
        </h2>

        <ol className="ui2-steps">
          {steps.map(([title, desc], i) => (
            <li key={title} className="ui2-step ui2-reveal">
              <span className="ui2-step-num ui2-num" aria-hidden="true">
                {i + 1}
              </span>
              <span>
                <span className="ui2-step-title">{title}</span>
                <span className="ui2-step-desc">{desc}</span>
              </span>
            </li>
          ))}
        </ol>

        {/* ตรงกับ FAQ จริง `faq-provably-fair` ใน src/data/home-seo.ts */}
        <p className="ui2-sheet-note">
          {isEnglish
            ? "We show you the lock code before you choose a card. When the reading ends we reveal the real order, so you can check the code yourself and see that nobody changed the cards along the way."
            : "ระบบโชว์รหัสล็อกให้คุณเห็นก่อนเลือกไพ่ พออ่านจบจะเฉลยลำดับจริง คุณเอามาเทียบกับรหัสได้เองว่าไม่มีใครแก้ไพ่ระหว่างทาง"}
        </p>

        <div className="ui2-heritage">
          <p className="ui2-1909 ui2-gold-day ui2-loop" aria-hidden="true">
            1909
          </p>
          <div className="ui2-trio" aria-hidden="true">
            {["major-01", "major-17", "major-21"].map((id) => (
              <span key={id}>
                <CardImage cardId={id} alt="" sizes="76px" />
              </span>
            ))}
          </div>
          <div>
            <h3 className="ui2-heritage-title">
              <ThaiPhrases>
                {isEnglish ? (
                  <>
                    The original 1909 artwork, <b>not AI images</b>
                  </>
                ) : (
                  <>
                    ภาพไพ่ต้นฉบับ <b>ไม่ใช่ภาพ AI</b>
                  </>
                )}
              </ThaiPhrases>
            </h3>
            <p className="ui2-heritage-desc">
              {isEnglish
                ? "The 1909 Rider-Waite deck drawn by Pamela Colman Smith, all 78 cards, never redrawn and never altered."
                : "สำรับ Rider-Waite ปี 1909 วาดโดย Pamela Colman Smith ครบ 78 ใบ ไม่วาดใหม่ ไม่ดัดแปลง"}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── ส่วน 6 · ทุกอย่างที่ต้องใช้ อยู่ในที่เดียว (กล่องหลายขนาด) ──────────────── */

/** ตัวอย่างคำทำนาย (ย้ายมาจาก HomeProofSection เดิม · ข้อความที่เรียบเรียงขึ้น บอกผู้อ่านตรง ๆ) */
const SAMPLE = {
  th: {
    cards: [
      ["pentacles-08", "แปดแห่งเหรียญ"],
      ["wands-12", "อัศวินแห่งไม้เท้า"],
      ["major-17", "ดวงดาว"],
    ],
    quote:
      "คำถาม: เดือนหน้ามีสัมภาษณ์งานใหม่ จะไปได้ดีไหม — แปดแห่งเหรียญในตำแหน่งอดีตบอกว่าคุณสะสมฝีมือมานานแล้ว ตอนนี้อัศวินแห่งไม้เท้าเตือนว่าอย่ารีบจนข้ามการเตรียมตัว และดวงดาวในตำแหน่งอนาคตคือไพ่แห่งความหวัง",
    why: "ทำไมถึงอ่านแบบนี้",
    focusLabel: "ตัวอย่าง · ตำแหน่งปัจจุบัน",
    focusLine: "ทำให้ใจพร้อมพุ่งไปข้างหน้า แต่อย่ารีบจนข้ามการเตรียมตัว",
    note: "ตัวอย่างที่เรียบเรียงขึ้นให้เห็นรูปแบบ ไม่ใช่คำทำนายของผู้ใช้จริง",
  },
  en: {
    cards: [
      ["pentacles-08", "Eight of Pentacles"],
      ["wands-12", "Knight of Wands"],
      ["major-17", "The Star"],
    ],
    quote:
      "Question: I have a job interview next month. Will it go well? The Eight of Pentacles in the past shows skill you have built for a long time. The Knight of Wands warns you not to rush past your preparation, and The Star in the future is a card of hope.",
    why: "Why it reads this way",
    focusLabel: "Sample · the present",
    focusLine: "has your heart ready to charge ahead. Just don't rush past the preparation.",
    note: "An illustrative sample, not a real user's reading.",
  },
} as const;

/** แถบสมุดดวง 7 ช่องตามภาพต้นแบบ — `null` = ช่องว่าง (ช่องสุดท้ายคือวันถัดไป เรืองทอง) */
const JOURNAL_STRIP: (string | null)[] = ["swords-04", "cups-01", null, "wands-12", "pentacles-01", null, null];

export function Ui2BentoSection({ isEnglish, href }: { isEnglish: boolean; href: Href }) {
  const sample = isEnglish ? SAMPLE.en : SAMPLE.th;
  return (
    <section className="ui2-sec ui2-night" data-home-section="features" data-ui2-dark data-anim-section aria-labelledby="ui2-bento-title">
      <div className="ui2-stars ui2-loop" aria-hidden="true" />
      <div className="ui2-wrap">
        <div className="ui2-bento-head ui2-reveal">
          <span className="ui2-kicker">
            <GoldMark className="ui2-mark" />
            {isEnglish ? "Everything in one place" : "ครบในที่เดียว"}
          </span>
          <h2 id="ui2-bento-title" className="ui2-h2">
            <ThaiPhrases>{isEnglish ? "Everything you need, all in one place" : "ทุกอย่างที่ต้องใช้ อยู่ในที่เดียว"}</ThaiPhrases>
          </h2>
        </div>

        <div className="ui2-bento">
          {/* กล่องตามภาพต้นแบบ D+ (DX-Desktop/DX-Mobile) — ไพ่ 3 ใบ ใบกลางเด่น + แผงกระจกคำอ่านของใบกลาง
              ⚠️ เป็นตัวอย่างที่เรียบเรียงขึ้น ต้องบอกผู้อ่านตรง ๆ ("ตัวอย่าง" ในป้าย + figcaption สำหรับโปรแกรมอ่านจอ) */}
          <figure className="ui2-tile ui2-tile-wide ui2-tile-reading ui2-reveal">
            <span className="ui2-tile-aurora ui2-tile-aurora-amber" aria-hidden="true" />
            <h3 className="ui2-tile-title">
              <ThaiPhrases>
              {isEnglish ? (
                <>
                  <b>Read</b> card by card, with reasons
                </>
              ) : (
                <>
                  <b>อ่าน</b>ทีละใบ พร้อมเหตุผล
                </>
              )}
              </ThaiPhrases>
            </h3>
            <div className="ui2-reading-row">
              <div className="ui2-reading-cards" aria-hidden="true">
                {sample.cards.map(([id], i) => (
                  <span key={id} className={i === 1 ? "is-focus" : undefined}>
                    <CardImage cardId={id} alt="" thumb sizes="80px" />
                  </span>
                ))}
              </div>
              <div className="ui2-reading-panel">
                <span className="ui2-reading-label">{sample.focusLabel}</span>
                <p className="ui2-reading-text">
                  <b>{sample.cards[1][1]}</b> {sample.focusLine}
                </p>
                <span className="ui2-why-chip">
                  {sample.why}
                  <span className="ui2-btn-arrow" aria-hidden="true" />
                </span>
              </div>
            </div>
            <figcaption className="sr-only">{sample.note}</figcaption>
          </figure>

          {/* พิธีเช้า — ไพ่คว่ำใบใหญ่กลางกล่อง (หลังไพ่วาดด้วย CSS ไม่ใช่ภาพไพ่ใบใด) · ทั้งกล่องเป็นลิงก์ไปหน้าไพ่วันนี้ */}
          <Link href={href("/daily")} prefetch={false} className="ui2-tile ui2-tile-tall ui2-tile-morning ui2-reveal">
            <span className="ui2-tile-aurora ui2-tile-aurora-teal" aria-hidden="true" />
            <span className="ui2-tile-label">{isEnglish ? "Morning ritual · 2 min" : "พิธีเช้า · 2 นาที"}</span>
            <h3 className="ui2-tile-title">
              {isEnglish ? (
                <>
                  <b className="ui2-title-line">Every morning,</b>
                  <span className="ui2-title-line">a new card</span>
                </>
              ) : (
                <>
                  <b className="tp ui2-title-line">ทุกเช้า</b> <span className="tp ui2-title-line">มีไพ่ใบใหม่</span>
                </>
              )}
            </h3>
            <span className="ui2-morning-card" aria-hidden="true">
              <span className="ui2-morning-burst ui2-loop" />
              <span className="ui2-face-back ui2-morning-back ui2-loop" />
            </span>
            <span className="ui2-tile-hint">{isEnglish ? "Tap to turn over today's card" : "แตะเพื่อพลิกไพ่ของวันนี้"}</span>
            <span className="ui2-chips" aria-hidden="true">
              {(isEnglish ? ["Work", "Heart", "People", "Money", "Self"] : ["งาน", "ใจ", "คน", "เงิน", "ตัวเอง"]).map((c, i) => (
                <span key={c} className={i === 0 ? "is-on" : undefined}>
                  {c}
                </span>
              ))}
            </span>
          </Link>

          {/* สมุดดวง — แถบไพ่ย่อ 7 ช่อง (มีไพ่ · ว่าง · ช่องถัดไปเรืองทอง) ภาพประกอบล้วน */}
          <Link href={href("/journal")} prefetch={false} className="ui2-tile ui2-tile-journal ui2-reveal">
            <h3 className="ui2-tile-title">
              <ThaiPhrases>
              {isEnglish ? (
                <>
                  <b>Keep</b> a tarot journal
                </>
              ) : (
                <>
                  <b>จด</b>ลงสมุดดวง
                </>
              )}
              </ThaiPhrases>
            </h3>
            <span className="ui2-journal-strip" aria-hidden="true">
              {JOURNAL_STRIP.map((id, i) =>
                id ? (
                  <span key={i}>
                    <CardImage cardId={id} alt="" thumb sizes="48px" />
                  </span>
                ) : (
                  <span key={i} className={i === JOURNAL_STRIP.length - 1 ? "is-next" : "is-empty"} />
                ),
              )}
            </span>
            <span className="ui2-tile-hint">
              {isEnglish ? "Topic \u201cNew job\u201d \u00b7 check back in 27 days" : "เรื่อง \u201cงานใหม่\u201d \u00b7 นัดกลับมาเช็กอีก 27 วัน"}
            </span>
          </Link>

          {/*
            คุยกับแม่หมอตัวจริง — แม่หมอจริงที่ว่างเร็วที่สุด 1–2 คน (เจ้าของเคาะ 2026-10-12 · คำถามเปิดข้อ 1)
            HTML นิ่งมาแค่หัวข้อ + ลิงก์ · รายชื่อเติมโดย astro/scripts/ui2-home.ts จาก /api/marketplace/readers/featured
            ตอนเลื่อนมาใกล้ · ไม่มีใครว่าง/อ่านไม่ได้ = เหลือลิงก์ล้วน (ห้ามชื่อหรือราคาสมมุติ)
            ⚠️ กล่องนี้ไม่ใช่ลิงก์ทั้งกล่อง — รายชื่อแต่ละคนเป็นลิงก์ของตัวเอง (ลิงก์ซ้อนลิงก์ผิด HTML)
          */}
          <div className="ui2-tile ui2-tile-wide-md ui2-reveal" data-ui2-readers={isEnglish ? "en" : "th"}>
            <h3 className="ui2-tile-title">
              <ThaiPhrases>
                {isEnglish ? (
                  <>
                    <b>Talk</b> with a real reader
                  </>
                ) : (
                  <>
                    <b>คุย</b>กับแม่หมอตัวจริง
                  </>
                )}
              </ThaiPhrases>
            </h3>
            <p className="ui2-tile-desc">
              {isEnglish
                ? "Book a session with a human reader when you want to talk it through."
                : "อยากคุยกับคนจริง ๆ จองเวลากับแม่หมอที่เปิดรับได้เลย"}
            </p>
            <ul className="ui2-readers" data-ui2-readers-list hidden />
            <Link href={href("/readers")} prefetch={false} className="ui2-tile-go">
              {isEnglish ? "See all readers" : "ดูแม่หมอทั้งหมด"}
              <span className="ui2-btn-arrow" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── ส่วน 6.5 · คลังไพ่ยิปซี (โชว์เคสแบบหัวเรื่องซ้าย ข้อมูลขวา) ─────────────────── */

/**
 * เจ้าของสั่ง 2026-10-13 "ถ้าเราเอาทุกอันละ แต่หัวเรื่องด้านซ้าย ข้อมูลด้านขวา" (ต้นแบบ fastwork.com/selling#profile-showcase)
 * ➔ หัวเรื่อง 6 หัว (แท็บ) ด้านซ้าย · การ์ดข้อมูลใหญ่ด้านขวา · มือถือ/แท็บเล็ต: หัวเรื่องเป็นแถบเลื่อนแนวนอนเหนือการ์ด
 * ทุกแผงอยู่ใน HTML ตั้งแต่เซิร์ฟเวอร์ (บอทเห็นครบ) — แผงที่ไม่ได้เลือกมี `hidden` · สลับด้วย astro/scripts/ui2-home.ts ข้อ 7
 * รวมของเดิม 2 ก้อนเข้ามา: วิธีดูดวง 5 ขั้นตอน (ตรงกับ JSON-LD HowTo ทุกข้อ) + กลุ่มลิงก์ "ค้นตามหัวข้อ" (ลิงก์ครบทุกเส้น)
 * ⚠️ ข้อมูลทุกชิ้นมาจาก src/data (หมวด · ผัง · ไพ่ · ราศี · คำถาม · บทความ) — ห้ามพิมพ์ตัวเลข/ชื่อเองในไฟล์นี้
 * ⚠️ งบ DOM หน้าแรก ≤ 1,500 (test-bundle-budget) — แผงละไม่กี่สิบชิ้น · ไพ่ใบเล็กใช้ `thumb` (img ตัวเดียว)
 */
const SHOW_TABS = [
  { id: "topics", th: "ดูดวงตามเรื่อง", en: "By topic" },
  { id: "spreads", th: "ผังยอดนิยม", en: "Popular spreads" },
  { id: "cards", th: "ไพ่เด่นในสำรับ", en: "Key cards" },
  { id: "zodiac", th: "ไพ่ 12 ราศี", en: "Zodiac cards" },
  { id: "howto", th: "วิธีดูดวง 5 ขั้นตอน", en: "How it works" },
  { id: "more", th: "ทางลัดและบทความ", en: "Shortcuts & articles" },
] as const;

/**
 * ไพ่หน้าปกของแต่ละหมวด — เป็นภาพประกอบตามความหมายดั้งเดิมของไพ่ (ไม่ใช่ผลเปิดไพ่ของใคร · กฎเหล็ก 14 ไม่เกี่ยว)
 * คู่รัก = ความรัก · แปดเหรียญ = ฝีมือ/การงาน · เอซเหรียญ = เงินก้อนใหม่ · พอประมาณ = สมดุลกายใจ ·
 * สิบถ้วย = ครอบครัวอบอุ่น · เพจเหรียญ = ผู้เรียน
 */
const TOPIC_LOOK: Record<string, { cardId: string; th: string }> = {
  love: { cardId: "major-06", th: "ความรัก" },
  career: { cardId: "pentacles-08", th: "การงาน" },
  money: { cardId: "pentacles-01", th: "การเงิน" },
  health: { cardId: "major-14", th: "สุขภาพกายใจ" },
  family: { cardId: "cups-10", th: "ครอบครัว" },
  study: { cardId: "pentacles-11", th: "การเรียน" },
};
/** คำถามตัวอย่างหมวดละข้อ (ข้อแรกของหมวดในคลัง `src/data/questions`) */
const SHOW_QUESTION_TOPICS = ["love", "career", "money", "study", "family"] as const;
/** หน้ารวมไพ่ทีละชุด (astro/pages/cards/<id>.astro) — จำนวนใบนับจากสำรับจริง */
const SHOW_SUITS = [
  { id: "major", th: "ไพ่ชุดใหญ่", en: "Major Arcana" },
  { id: "wands", th: "ชุดไม้เท้า", en: "Wands" },
  { id: "cups", th: "ชุดถ้วย", en: "Cups" },
  { id: "swords", th: "ชุดดาบ", en: "Swords" },
  { id: "pentacles", th: "ชุดเหรียญ", en: "Pentacles" },
] as const;
/** ข้อมูลย่อของไพ่ (ไม่ลากสำรับเต็มที่มีคำทำนายยาว · ด่าน A8-02) — หาไม่เจอ = ตัดออก ไม่แต่งไพ่แทน (กฎเหล็ก 14) */
const cardById = (id: string) => CARD_SUMMARIES.find((card) => card.id === id);
/** เครื่องมือในหน้ารวมราศี (หัวข้อในหน้า /cards/zodiac) — เดิมเป็นการ์ด h3 ในหน้าแรก v1 */
const ZODIAC_TOOLS: ExploreLink[] = [
  { path: ZODIAC_INDEX_PATH, th: "หาราศีจากวันเกิด", en: "Find your sign by birthday" },
  { path: `${ZODIAC_INDEX_PATH}#zodiac-daily-title`, th: "ดวงรายวัน 12 ราศี", en: "Daily card for all 12 signs" },
  { path: `${ZODIAC_INDEX_PATH}#zodiac-compat-title`, th: "ความเข้ากันสองราศี", en: "Two-sign compatibility" },
];
/** ผังที่โชว์เป็นแถว — ลิงก์/ข้อความลิงก์มาจาก POPULAR_SPREADS (ห้ามเปลี่ยนคำค้น) · จำนวนใบ/คำโปรยมาจากผังจริง */
const SHOW_SPREAD_IDS = ["celtic-cross", "three-card", "decision", "daily", "twelve-houses"] as const;

/** กรอบภาพผัง: แปลงพิกัดผังจริง (0–1) ให้เต็มกล่องแสดงผลพอดี ไม่ชิดขอบข้างใดข้างหนึ่ง */
function fitPositions(positions: { x: number; y: number; rotate?: number }[]) {
  const xs = positions.map((p) => p.x);
  const ys = positions.map((p) => p.y);
  const [minX, maxX, minY, maxY] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
  const fit = (v: number, lo: number, hi: number, from: number, to: number) => (hi === lo ? 0.5 : from + ((v - lo) / (hi - lo)) * (to - from));
  return positions.map((p) => ({ x: fit(p.x, minX, maxX, 0.14, 0.86), y: fit(p.y, minY, maxY, 0.13, 0.87), r: p.rotate ?? 0 }));
}

/** "1. แก่นของเรื่อง (หัวใจ…)" ➔ "แก่นของเรื่อง (หัวใจ…)" — เลขแสดงด้วยตัวนับของรายการ */
function positionLabel(name: string): string {
  return name.replace(/^\d+\.\s*/, "");
}

function ShowTop({ title, desc, all }: { title: string; desc: string; all?: { href: string; label: string } }) {
  return (
    <div className="ui2-show-top">
      <div>
        <h3 className="ui2-show-title">
          <ThaiPhrases>{title}</ThaiPhrases>
        </h3>
        <p className="ui2-show-desc">
          <ThaiPhrases>{desc}</ThaiPhrases>
        </p>
      </div>
      {all && (
        <Link href={all.href} prefetch={false} className="ui2-show-all">
          {all.label}
          <span className="ui2-arrow-ne" aria-hidden="true" />
        </Link>
      )}
    </div>
  );
}

function ShowStats({ items }: { items: [string | number, string][] }) {
  return (
    <ul className="ui2-show-stats">
      {items.map(([value, label]) => (
        <li key={label}>
          <strong className="ui2-num">{value}</strong>
          {label}
        </li>
      ))}
    </ul>
  );
}

function ShowChips({ links, href, isEnglish }: { links: ExploreLink[]; href: Href; isEnglish: boolean }) {
  return (
    <div className="ui2-show-chips">
      {links.map((link) => (
        <Link key={`${link.path}-${link.th}`} href={href(link.path)} prefetch={false}>
          {isEnglish ? link.en : link.th}
        </Link>
      ))}
    </div>
  );
}

export function Ui2ShowcaseSection({ isEnglish, href }: { isEnglish: boolean; href: Href }) {
  const t = (th: string, en: string) => (isEnglish ? en : th);
  const topics = Object.values(SPREAD_TOPICS).flatMap((topic) => {
    const look = TOPIC_LOOK[topic.slug];
    return look ? [{ topic, look, count: getSpreadsForTopic(topic).length }] : [];
  });
  const topicSpreadCount = topics.reduce((sum, item) => sum + item.count, 0);
  const sampleQuestions: ExploreLink[] = SHOW_QUESTION_TOPICS.flatMap((topic) => {
    const q = QUESTIONS.find((item) => item.topic === topic);
    return q ? [{ path: `/questions/${q.slug}`, th: shortQuestion(q.th.question), en: shortQuestion(q.en.question) }] : [];
  });
  const spreadRows = SHOW_SPREAD_IDS.flatMap((id) => {
    const spread = getSpread(id);
    const link = POPULAR_SPREADS.find((item) => item.path === `/spreads/${id}`);
    return spread && link ? [{ spread, link }] : [];
  });
  const extraSpreadLinks = POPULAR_SPREADS.filter((link) => !spreadRows.some((row) => row.link === link));
  const featured = spreadRows[0];
  const drawNow = POPULAR_SPREADS.find((link) => link.path === "/read/celtic-cross");
  const sizes = PUBLIC_SPREADS.map((s) => s.positions.length);
  const majorCards = MAJOR_HIGHLIGHTS.flatMap((link) => {
    const card = cardById(link.path.replace("/cards/", ""));
    return card ? [{ link, card }] : [];
  });
  const majorTip = (id: string) => reviewedCardAdvice(id, false, isEnglish ? "en" : "th");
  const cardExtraLinks = MAJOR_HIGHLIGHTS.filter((link) => !majorCards.some((item) => item.link === link));
  const zodiac = ZODIAC_SIGNS.flatMap((sign) => {
    const card = cardById(sign.majorCardId);
    return card ? [{ sign, card }] : [];
  });
  const decanCount = ZODIAC_SIGNS.reduce((sum, sign) => sum + sign.decans.length, 0);
  const howTo = getHomeHowToSteps(isEnglish);
  const articleLinks: ExploreLink[] = getFeaturedArticles(4).map((art) => ({
    path: `/blog/${art.slug}`,
    th: getArticleTitle(art, false),
    en: getArticleTitle(art, true),
  }));

  return (
    <section className="ui2-sec ui2-day" data-home-section="showcase" aria-labelledby="ui2-show-title">
      <div className="ui2-wrap">
        <div className="ui2-show-head">
          <span className="ui2-kicker">
            <GoldMark className="ui2-mark" />
            {t("คลังไพ่ยิปซี", "The tarot library")}
          </span>
          <h2 id="ui2-show-title" className="ui2-h2">
            <ThaiPhrases>{t("อยากรู้เรื่องไหน เลือกดูได้เลย", "Pick what you want to explore")}</ThaiPhrases>
          </h2>
          <p className="ui2-lede">
            <ThaiPhrases>
              {t(
                "รวมทุกเรื่องของไพ่ทาโรต์ไว้ที่เดียว ดูดวงตามเรื่อง ผังยอดนิยม ไพ่เด่นในสำรับ ไพ่ประจำราศี และวิธีเปิดไพ่ครั้งแรก",
                "Everything tarot in one place: readings by topic, popular spreads, key cards, zodiac cards and how your first reading works.",
              )}
            </ThaiPhrases>
          </p>
        </div>
        <div className="ui2-show">
          <div className="ui2-show-tabs" role="tablist" aria-label={t("หัวข้อในคลังไพ่", "Library topics")} aria-orientation="vertical">
            {SHOW_TABS.map((tab, i) => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                id={`ui2-show-tab-${tab.id}`}
                aria-controls={`ui2-show-${tab.id}`}
                aria-selected={i === 0}
                tabIndex={i === 0 ? 0 : -1}
                className="ui2-show-tab"
              >
                {t(tab.th, tab.en)}
              </button>
            ))}
          </div>

          <div className="ui2-show-card">
          {/* 1 · ดูดวงตามเรื่อง */}
          <div role="tabpanel" id="ui2-show-topics" aria-labelledby="ui2-show-tab-topics" className="ui2-show-panel">
            <ShowTop
              title={t("ดูดวงไพ่ยิปซีตามเรื่องที่อยากรู้", "Tarot readings by topic")}
              desc={t(
                "เลือกเรื่องที่ค้างใจ แล้วเราพาไปผังที่ออกแบบมาเพื่อเรื่องนั้นโดยเฉพาะ",
                "Choose what is on your mind and we take you to the spreads built for it.",
              )}
              all={{ href: href("/spreads"), label: t("ผังทั้งหมด", "All spreads") }}
            />
            <ShowStats
              items={[
                [topics.length, t("หมวดเรื่อง", "topics")],
                [topicSpreadCount, t("ผังเฉพาะเรื่อง", "topic spreads")],
                [QUESTIONS.length, t("คำถามพร้อมผัง", "ready questions")],
              ]}
            />
            <div className="ui2-show-topics">
              {topics.map(({ topic, look, count }) => (
                <Link key={topic.slug} href={href(`/spreads/topic/${topic.slug}`)} prefetch={false} className="ui2-show-topic">
                  <CardImage cardId={look.cardId} alt="" thumb sizes="48px" className="ui2-show-thumb" />
                  <span className="ui2-show-topic-text">
                    <span className="ui2-show-topic-name">
                      {isEnglish ? topic.nameEn : look.th}
                      <span className="ui2-show-count ui2-num">
                        {count} {t("ผัง", count === 1 ? "spread" : "spreads")}
                      </span>
                    </span>
                    <small>{isEnglish ? (topic.taglineEn ?? topic.nameEn) : topic.tagline}</small>
                  </span>
                </Link>
              ))}
            </div>
            <p className="ui2-show-label">{t("คำถามที่คนถามบ่อย", "Questions people ask")}</p>
            <ShowChips links={sampleQuestions} href={href} isEnglish={isEnglish} />
          </div>

          {/* 2 · ผังยอดนิยม — ภาพผังจริง (พิกัดจาก src/data/spreads) + แถวผัง */}
          <div role="tabpanel" id="ui2-show-spreads" aria-labelledby="ui2-show-tab-spreads" className="ui2-show-panel" hidden>
            <ShowTop
              title={t("ผังการเปิดไพ่ยอดนิยม", "Popular tarot spreads")}
              desc={t(
                "ตั้งแต่ไพ่ใบเดียวประจำวันจนถึงเซลติกครอส 10 ใบ ทุกผังบอกว่าแต่ละตำแหน่งตอบอะไร",
                "From one daily card to the 10-card Celtic Cross, every spread explains what each position answers.",
              )}
              all={{ href: href("/spreads"), label: t("ผังทั้งหมด", "All spreads") }}
            />
            <ShowStats
              items={[
                [PUBLIC_SPREADS.length, t("ผังให้เลือก", "spreads")],
                [`${Math.min(...sizes)}–${Math.max(...sizes)}`, t("ใบต่อผัง", "cards each")],
                [featured ? featured.spread.positions.length : 0, t("ใบในเซลติกครอส", "in the Celtic Cross")],
              ]}
            />
            <div className="ui2-show-spreads">
              {featured && (
                <figure className="ui2-show-layout">
                  <div className="ui2-show-board" aria-hidden="true">
                    {fitPositions(featured.spread.positions).map((pos, i) => (
                      <span
                        key={i}
                        className="ui2-show-slot ui2-num"
                        style={{ ["--x" as string]: pos.x, ["--y" as string]: pos.y, ["--r" as string]: `${pos.r}deg` }}
                      >
                        {i + 1}
                      </span>
                    ))}
                  </div>
                  {/* ความหมายตำแหน่งจากผังจริง (src/data/spreads) — เลขตรงกับไพ่บนกระดาน */}
                  <ol className="ui2-show-legend">
                    {featured.spread.positions.map((pos) => (
                      <li key={pos.index}>{positionLabel(isEnglish ? (pos.nameEn ?? pos.nameTh) : pos.nameTh)}</li>
                    ))}
                  </ol>
                  {drawNow && (
                    <figcaption>
                      <Link href={href(drawNow.path)} prefetch={false} className="ui2-btn">
                        {isEnglish ? drawNow.en : drawNow.th}
                      </Link>
                    </figcaption>
                  )}
                </figure>
              )}
              <div className="ui2-show-rows">
                {spreadRows.map(({ spread, link }) => (
                  <Link key={spread.id} href={href(link.path)} prefetch={false} className="ui2-show-row">
                    <span>
                      {isEnglish ? link.en : link.th}
                      <small>{isEnglish ? spread.taglineEn : spread.tagline}</small>
                    </span>
                    <span className="ui2-show-count ui2-num">
                      {spread.positions.length} {t("ใบ", spread.positions.length === 1 ? "card" : "cards")}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
            <ShowChips links={extraSpreadLinks.filter((link) => link !== drawNow)} href={href} isEnglish={isEnglish} />
          </div>

          {/* 3 · ไพ่เด่นในสำรับ */}
          <div role="tabpanel" id="ui2-show-cards" aria-labelledby="ui2-show-tab-cards" className="ui2-show-panel" hidden>
            <ShowTop
              title={t("ไพ่ชุดใหญ่ เมเจอร์ อาร์คานา", "Major Arcana highlights")}
              desc={t(
                "ไพ่ 22 ใบที่บอกจุดเปลี่ยนสำคัญของชีวิต ตั้งแต่คนเขลาถึงโลก แตะดูความหมายเต็มได้ทุกใบ",
                "The 22 cards of life's turning points, from The Fool to The World. Tap any card for its full meaning.",
              )}
              all={{ href: href("/cards"), label: t("ความหมาย 78 ใบ", "All 78 meanings") }}
            />
            <ShowStats
              items={[
                [CARD_SUMMARIES.length, t("ใบในสำรับ 1909", "cards in the 1909 deck")],
                [CARD_SUMMARIES.filter((card) => card.arcana === "major").length, t("ไพ่ชุดใหญ่", "Major Arcana")],
                [CARD_SUMMARIES.filter((card) => card.arcana === "minor").length, t("ไพ่ชุดเล็ก", "Minor Arcana")],
              ]}
            />
            <div className="ui2-show-cards">
              {majorCards.map(({ link, card }) => (
                <Link key={card.id} href={href(link.path)} prefetch={false} className="ui2-show-major">
                  <CardImage cardId={card.id} alt="" sizes="(min-width: 640px) 84px, 72px" className="ui2-show-major-img" />
                  <span className="ui2-show-major-body">
                    <span className="ui2-show-major-name">{isEnglish ? card.nameEn : card.nameTh}</span>
                    <small>{isEnglish ? (CARD_KEYWORDS_EN[card.id]?.upright[0] ?? card.nameEn) : card.keywords.upright[0]}</small>
                    {/* คำแนะนำหัวตั้งที่แม่หมอตรวจแล้วเท่านั้น (card-advice.ts) — ยังไม่ตรวจ = ไม่แสดง */}
                    {majorTip(card.id) && <span className="ui2-show-major-tip">{majorTip(card.id)}</span>}
                  </span>
                </Link>
              ))}
            </div>
            <p className="ui2-show-label">{t("ดูไพ่ทีละชุด", "Browse by suit")}</p>
            <div className="ui2-show-suits">
              {SHOW_SUITS.map((suit) => {
                const count = CARD_SUMMARIES.filter((card) => (suit.id === "major" ? card.arcana === "major" : card.suit === suit.id)).length;
                return (
                  <Link key={suit.id} href={href(`/cards/${suit.id}`)} prefetch={false} className="ui2-show-suit">
                    <span>{t(suit.th, suit.en)}</span>
                    <span className="ui2-show-count ui2-num">
                      {count} {t("ใบ", "cards")}
                    </span>
                  </Link>
                );
              })}
            </div>
            <ShowChips links={cardExtraLinks} href={href} isEnglish={isEnglish} />
          </div>

          {/* 4 · ไพ่ 12 ราศี (สีพื้นตามธาตุ) */}
          <div role="tabpanel" id="ui2-show-zodiac" aria-labelledby="ui2-show-tab-zodiac" className="ui2-show-panel" hidden>
            <ShowTop
              title={t("ไพ่ประจำ 12 ราศี", "Tarot cards of the 12 signs")}
              desc={t(
                "ไพ่ยิปซีคู่กับโหราศาสตร์ตามระบบ Golden Dawn ที่ใช้ออกแบบสำรับ 1909 ดูไพ่ของคุณและคนที่คุณสนใจ",
                "Tarot meets astrology through the Golden Dawn system behind the 1909 deck: your card and theirs.",
              )}
              all={{ href: href(ZODIAC_INDEX_PATH), label: t("ไพ่ราศีทั้งหมด", "All zodiac cards") }}
            />
            <ShowStats
              items={[
                [ZODIAC_SIGNS.length, t("ราศี", "signs")],
                [decanCount, t("ไพ่ประจำช่วงราศี", "decan cards")],
                [Object.keys(ZODIAC_ELEMENT_LABEL).length, t("ธาตุ", "elements")],
              ]}
            />
            <div className="ui2-show-zodiac">
              {zodiac.map(({ sign, card }) => (
                <Link key={sign.id} href={href(zodiacSignPath(sign.id))} prefetch={false} className="ui2-show-sign" data-el={sign.element}>
                  <CardImage cardId={card.id} alt="" thumb sizes="44px" className="ui2-show-thumb" />
                  <span>
                    {isEnglish ? sign.nameEn : sign.nameTh}
                    <small>{isEnglish ? card.nameEn : `ไพ่${card.nameTh}`}</small>
                  </span>
                </Link>
              ))}
            </div>
            {/* เครื่องมือในหน้าราศี — ลิงก์เดิมจากหน้าแรก v1 (ห้ามหาย · explore-links.ts) */}
            <ShowChips links={ZODIAC_TOOLS} href={href} isEnglish={isEnglish} />
          </div>

          {/* 5 · วิธีดูดวง 5 ขั้นตอน — ข้อความชุดเดียวกับ JSON-LD HowTo (generateHowToJsonLd) ทุกข้อ */}
          <div role="tabpanel" id="ui2-show-howto" aria-labelledby="ui2-show-tab-howto" className="ui2-show-panel" hidden>
            <ShowTop
              title={t("วิธีดูดวงไพ่ทาโรต์ออนไลน์ 5 ขั้นตอน", "How an online tarot reading works, in 5 steps")}
              desc={t(
                "ตั้งแต่เลือกผังไพ่ยิปซีจนถึงคุยต่อกับแม่หมอ AI ทุกใบคุณสับและหยิบเองกับมือ ลำดับไพ่ถูกล็อกไว้ก่อนเริ่ม ตรวจย้อนหลังได้ทุกครั้ง",
                "From choosing a spread to talking it through with the oracle. You shuffle and pick every card with your own hand, and the deck order is locked before you start.",
              )}
            />
            <ol className="ui2-path">
              {howTo.map((step, i) => (
                <li key={step.name} className="ui2-path-step">
                  <span className="ui2-path-dot ui2-num" aria-hidden="true">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <h4 className="ui2-path-title">
                    <ThaiPhrases>{stepName(step.name)}</ThaiPhrases>
                  </h4>
                  <p className="ui2-path-text">{step.text}</p>
                </li>
              ))}
            </ol>
            <p className="ui2-show-cta">
              <a href="#home-quick" className="ui2-btn" data-home-target="showcase:start">
                {t("เริ่มเปิดไพ่เลย", "Start a reading")}
                <span className="ui2-btn-arrow" aria-hidden="true" />
              </a>
            </p>
          </div>

          {/* 6 · ทางลัดและบทความ — ลิงก์คำค้นจริงชุดเดิมทุกตัว (explore-links.ts) */}
          <div role="tabpanel" id="ui2-show-more" aria-labelledby="ui2-show-tab-more" className="ui2-show-panel" hidden>
            <ShowTop
              title={t("ดูดวงไพ่ยิปซียอดนิยม", "Popular tarot readings")}
              desc={t(
                "คำที่คนค้นบ่อยที่สุด ทั้งดวงรายวัน ความรัก ไพ่ 3 ใบ และใช่หรือไม่",
                "What people search for most: daily, love, 3 cards and yes or no.",
              )}
            />
            <ShowChips links={POPULAR_SEARCHES} href={href} isEnglish={isEnglish} />
            <h4 className="ui2-show-sub">
              <ThaiPhrases>{t("ดูดวงไพ่ยิปซีแบบอื่น ๆ", "Other ways to read")}</ThaiPhrases>
            </h4>
            <ShowChips links={MORE_WAYS} href={href} isEnglish={isEnglish} />
            <h4 className="ui2-show-sub">
              <ThaiPhrases>{t("บทความไพ่ยิปซีน่าอ่าน", "Tarot articles worth reading")}</ThaiPhrases>
            </h4>
            <div className="ui2-show-rows">
              {articleLinks.map((link) => (
                <Link key={link.path} href={href(link.path)} prefetch={false} className="ui2-show-row">
                  <span>{isEnglish ? link.en : link.th}</span>
                  <span className="ui2-arrow-ne" aria-hidden="true" />
                </Link>
              ))}
            </div>
          </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/** "1. เลือกผัง…" ➔ "เลือกผัง…" — ตัวเลขแสดงแยกเป็น 01–05 (ข้อความยังมาจากข้อมูลชุดเดียวกับ JSON-LD HowTo) */
function stepName(name: string): string {
  return name.replace(/^\d+\.\s*/, "");
}

/* ── ส่วน 7 · สำรวจต่อ + คำถามที่พบบ่อย ───────────────────────────────────── */

export function Ui2ExploreSection({ isEnglish, href }: { isEnglish: boolean; href: Href }) {
  const faqs = getHomeFaqs(isEnglish);
  return (
    <section className="ui2-sec ui2-day" data-home-section="explore" aria-labelledby="ui2-explore-title">
      <div className="ui2-wrap ui2-explore">
        <div>
          <span className="ui2-kicker">
            <GoldMark className="ui2-mark" />
            {isEnglish ? "Keep exploring" : "ไปต่อได้ทุกทาง"}
          </span>
          <h2 id="ui2-explore-title" className="ui2-h2">
            <ThaiPhrases>{isEnglish ? "Explore more" : "สำรวจต่อ"}</ThaiPhrases>
          </h2>
          <p className="ui2-lede">
            {isEnglish
              ? "Card meanings, your zodiac card, every spread and the questions people ask most."
              : "ความหมายไพ่ทาโร่ทั้ง 78 ใบ ไพ่ประจำราศี ผังเปิดไพ่ทุกแบบ และคำถามที่คนถามไพ่บ่อยที่สุด"}
          </p>
          <nav className="ui2-explore-list" aria-labelledby="ui2-explore-title">
            {EXPLORE_PRIMARY.map((link) => (
              <Link key={link.path} href={href(link.path)} prefetch={false} className="ui2-explore-link">
                <span>
                  {isEnglish ? link.en : link.th}
                  <small>{isEnglish ? link.noteEn : link.noteTh}</small>
                </span>
                <span className="ui2-arrow-ne" aria-hidden="true" />
              </Link>
            ))}
          </nav>
        </div>

        <div>
          <span className="ui2-kicker">
            <GoldMark className="ui2-mark" />
            FAQ
          </span>
          <h2 id="ui2-faq-title" className="ui2-h2">
            <ThaiPhrases>{isEnglish ? "Frequently asked questions" : "คำถามที่พบบ่อย"}</ThaiPhrases>
          </h2>
          <p className="ui2-lede">
            {isEnglish
              ? "About free readings, how we prove the shuffle is real, and the 1909 deck."
              : "เรื่องดูดวงฟรี วิธีพิสูจน์ว่าไพ่สุ่มจริง และสำรับไพ่ยิปซี 1909 ที่เราใช้"}
          </p>
          {/* ครบทุกข้อใน home-seo.ts — JSON-LD FAQPage ต้องตรงกับที่อยู่ในหน้า · ข้อแรกเปิดไว้ */}
          <div className="ui2-faq-list">
            {faqs.map((faq, i) => (
              <details key={faq.id} id={faq.id} className="ui2-faq" open={i === 0}>
                <summary>
                  <span>{faq.question}</span>
                  <span className="ui2-plus" aria-hidden="true" />
                </summary>
                <p className="ui2-faq-a">{faq.answer}</p>
              </details>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}

/* ── ส่วน 8 · ปิดท้าย ─────────────────────────────────────────────────── */

/** วงแหวนทอง: วงกลม 4 ชั้น · ขีด 72 ขีด (ขีดใหญ่ทุก 6 = 12 ขีด) · ดาวหกแฉก — SVG ชิ้นเดียว หมุนด้วย transform */
function GoldRing() {
  const ticks = Array.from({ length: 72 }, (_, i) => i);
  return (
    <svg className="ui2-ring ui2-loop" viewBox="-100 -100 200 200" aria-hidden="true" focusable="false">
      <g fill="none" stroke="currentColor">
        <circle r="98" strokeWidth="0.6" />
        <circle r="90" strokeWidth="0.4" />
        <circle r="62" strokeWidth="0.4" />
        <circle r="40" strokeWidth="0.3" />
        {ticks.map((i) => (
          <line key={i} x1="0" y1="-98" x2="0" y2={i % 6 === 0 ? -86 : -93} strokeWidth={i % 6 === 0 ? 0.9 : 0.4} transform={`rotate(${i * 5})`} />
        ))}
        <path d="M0 -40 L34.6 20 L-34.6 20 Z M0 40 L-34.6 -20 L34.6 -20 Z" strokeWidth="0.5" />
      </g>
    </svg>
  );
}

export function Ui2ClosingSection({ isEnglish, href }: { isEnglish: boolean; href: Href }) {
  return (
    <section className="ui2-sec ui2-closing" data-home-section="closing" data-anim-section data-ui2-hide-sticky aria-labelledby="ui2-closing-title">
      <div className="ui2-closing-card" data-ui2-dark>
        <div className="ui2-closing-bg" aria-hidden="true" />
        <div className="ui2-stars ui2-loop" aria-hidden="true" />
        <GoldRing />
        <Ui2Clock isEnglish={isEnglish} />
        <h2 id="ui2-closing-title" className="ui2-closing-title">
          <ThaiPhrases>
            {isEnglish ? (
              <>
                Your card for today <span className="tp ui2-gold-night ui2-loop">is still waiting</span>
              </>
            ) : (
              <>
                ไพ่ใบของคุณวันนี้ <span className="tp ui2-gold-night ui2-loop">ยังรออยู่</span>
              </>
            )}
          </ThaiPhrases>
        </h2>
        <div className="ui2-closing-ctas">
          <a href="#home-quick" className="ui2-btn" data-home-target="closing:quick">
            <span className="ui2-btn-ring ui2-loop" aria-hidden="true" />
            {isEnglish ? "Draw 1 card now" : "เปิดไพ่ด่วน 1 ใบ"}
            <span className="ui2-btn-arrow" aria-hidden="true" />
          </a>
          <Link href={href("/account")} prefetch={false} className="ui2-btn-ghost" data-home-target="closing:account">
            {isEnglish ? "Sign in" : "เข้าสู่ระบบ"}
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ── แถบปุ่มติดล่างจอ (มือถือ) — โผล่/ซ่อนโดย astro/scripts/ui2-home.ts ─────────── */
export function Ui2StickyCta({ isEnglish }: { isEnglish: boolean }) {
  return (
    <div className="ui2-sticky" data-ui2-sticky>
      <a href="#home-quick" className="ui2-btn" data-home-target="sticky:quick">
        {isEnglish ? "Draw 1 card now" : "เปิดไพ่ด่วน 1 ใบ"}
        <span className="ui2-btn-arrow" aria-hidden="true" />
      </a>
    </div>
  );
}
