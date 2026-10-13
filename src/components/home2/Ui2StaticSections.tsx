import { Fragment } from "react";

import { CardImage } from "@/components/card/CardImage";
import { GoldMark } from "@/components/ui/GoldMark";
import { RouteLink as Link } from "@/components/ui/RouteLink";
import { ThaiPhrases } from "@/components/ui/ThaiPhrases";
import { getArticleTitle } from "@/data/article-helpers";
import { getFeaturedArticles } from "@/data/articles";
import { getHomeFaqs, getHomeHowToSteps } from "@/data/home-seo";
import { QUESTIONS } from "@/data/questions";
import { getSpread } from "@/data/spreads";
import { ZODIAC_SIGNS } from "@/data/zodiac";
import { zodiacSignPath } from "@/lib/tarot/zodiac";

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
    note: "An illustrative sample, not a real user's reading.",
  },
} as const;

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
          <figure className="ui2-tile ui2-tile-wide ui2-reveal">
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
            <div className="ui2-tile-cards" aria-hidden="true">
              {sample.cards.map(([id]) => (
                <span key={id}>
                  <CardImage cardId={id} alt="" thumb sizes="54px" />
                </span>
              ))}
            </div>
            <blockquote className="ui2-tile-quote">{sample.quote}</blockquote>
            <span className="ui2-chip ui2-why">
              <span className="ui2-dot" aria-hidden="true" />
              {sample.why}
            </span>
            <figcaption className="ui2-tile-desc">{sample.note}</figcaption>
          </figure>

          <Link href={href("/daily")} prefetch={false} className="ui2-tile ui2-tile-tall ui2-reveal">
            <span className="ui2-morning-glow" aria-hidden="true" />
            <span className="ui2-tile-back ui2-face-back ui2-loop" aria-hidden="true" />
            <h3 className="ui2-tile-title">
              <ThaiPhrases>
              {isEnglish ? (
                <>
                  <b>Every morning</b>, a new card
                </>
              ) : (
                <>
                  <b className="tp">ทุกเช้า</b> <span className="tp">มีไพ่ใบใหม่</span>
                </>
              )}
              </ThaiPhrases>
            </h3>
            <p className="ui2-tile-desc">
              {isEnglish
                ? "A short morning ritual: one card for the day, and a check-in at night."
                : "พิธีเช้าสั้น ๆ เปิดไพ่หนึ่งใบสำหรับวันนี้ แล้วกลับมาทบทวนตอนเย็น"}
            </p>
            <span className="ui2-chips" aria-hidden="true">
              {(isEnglish ? ["Work", "Heart", "People", "Money", "Self"] : ["งาน", "ใจ", "คน", "เงิน", "ตัวเอง"]).map((c) => (
                <span key={c}>{c}</span>
              ))}
            </span>
            <span className="ui2-tile-go">
              {isEnglish ? "Today's card" : "ไพ่ของวันนี้"}
              <span className="ui2-btn-arrow" aria-hidden="true" />
            </span>
          </Link>

          <Link href={href("/journal")} prefetch={false} className="ui2-tile ui2-reveal">
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
            <span className="ui2-journal-art" aria-hidden="true">
              <i />
              <i />
              <i />
              <i />
            </span>
            <span className="ui2-tile-go">
              {isEnglish ? "Open the journal" : "เปิดสมุดดวง"}
              <span className="ui2-btn-arrow" aria-hidden="true" />
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

/* ── ส่วน 7 · สำรวจต่อ + คำถามที่พบบ่อย ───────────────────────────────────── */

function LinkGroup({ title, links, href, isEnglish }: { title: string; links: ExploreLink[]; href: Href; isEnglish: boolean }) {
  return (
    <details className="ui2-more">
      <summary>
        {title}
        <span className="ui2-plus" aria-hidden="true" />
      </summary>
      <div className="ui2-more-links">
        {links.map((link) => (
          <Link key={`${link.path}-${link.th}`} href={href(link.path)} prefetch={false}>
            {isEnglish ? link.en : link.th}
          </Link>
        ))}
      </div>
    </details>
  );
}

export function Ui2ExploreSection({ isEnglish, href }: { isEnglish: boolean; href: Href }) {
  const faqs = getHomeFaqs(isEnglish);
  const howTo = getHomeHowToSteps(isEnglish);
  const zodiacLinks: ExploreLink[] = ZODIAC_SIGNS.map((sign) => ({ path: zodiacSignPath(sign.id), th: sign.nameTh, en: sign.nameEn }));
  const articleLinks: ExploreLink[] = getFeaturedArticles(4).map((art) => ({
    path: `/blog/${art.slug}`,
    th: getArticleTitle(art, false),
    en: getArticleTitle(art, true),
  }));
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
          <div className="ui2-more-groups">
            <LinkGroup title={isEnglish ? "Popular searches" : "คนค้นหาบ่อย"} links={POPULAR_SEARCHES} href={href} isEnglish={isEnglish} />
            <LinkGroup title={isEnglish ? "Other ways to read" : "ดูดวงแบบอื่น"} links={MORE_WAYS} href={href} isEnglish={isEnglish} />
            <LinkGroup title={isEnglish ? "Cards by zodiac sign" : "ไพ่ประจำราศี"} links={zodiacLinks} href={href} isEnglish={isEnglish} />
            <LinkGroup title={isEnglish ? "Popular spreads" : "ผังยอดนิยม"} links={POPULAR_SPREADS} href={href} isEnglish={isEnglish} />
            <LinkGroup title={isEnglish ? "Major Arcana highlights" : "ไพ่เมเจอร์เด่น"} links={MAJOR_HIGHLIGHTS} href={href} isEnglish={isEnglish} />
            <LinkGroup title={isEnglish ? "Latest articles" : "บทความล่าสุด"} links={articleLinks} href={href} isEnglish={isEnglish} />
            {/* ขั้นตอนเต็มพิธี — ตรงกับ JSON-LD HowTo ของหน้าแรก (generateHowToJsonLd) ให้ข้อมูลโครงสร้างตรงกับที่อยู่ในหน้า */}
            <details className="ui2-more">
              <summary>
                {isEnglish ? "How a full reading works" : "ขั้นตอนเปิดไพ่เต็มพิธี"}
                <span className="ui2-plus" aria-hidden="true" />
              </summary>
              <ol className="ui2-howto">
                {howTo.map((step) => (
                  <li key={step.name}>
                    <strong>{step.name}</strong> {step.text}
                  </li>
                ))}
              </ol>
            </details>
          </div>
        </div>

        <div>
          <span className="ui2-kicker">
            <GoldMark className="ui2-mark" />
            FAQ
          </span>
          <h2 id="ui2-faq-title" className="ui2-h2">
            <ThaiPhrases>{isEnglish ? "Frequently asked questions" : "คำถามที่พบบ่อย"}</ThaiPhrases>
          </h2>
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
        <Ui2Clock isEnglish={isEnglish} variant="cells" />
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
