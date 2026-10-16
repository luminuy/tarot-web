"use client";

import { useRef, useState } from "react";

import { CardImage } from "@/components/card/CardImage";
import { QUICK_TOPICS, type QuickTopic } from "@/components/reading/quick-topics";
import { ThaiPhrases } from "@/components/ui/ThaiPhrases";
import { PUBLIC_COUNTER_MIN } from "@/components/home2/constants";

/**
 * 🎨 UI 2.0 ส่วน 3 · ใจคุณเลือกเอง — เลือกเรื่อง แล้วแตะไพ่คว่ำ 1 ใน 5 ใบ (แผน UI_2_0 หัวข้อ 6.3)
 * ===========================================================================
 * 🚨 กฎเหล็ก 14 (ห้ามกุไพ่) — ภาพต้นแบบผูกไพ่ตายตัวกับหัวข้อเพื่อสาธิตเท่านั้น ของจริง:
 *    1. แตะเรื่อง ➔ ด่านสิทธิ์เดิม (`canDraw`) ทำงานก่อน — คนที่ยังไม่สมัคร/โควตาหมด = หน้าต่างสิทธิ์ ห้ามเปิดไพ่
 *    2. ไพ่คว่ำ 5 ใบ = **ตำแหน่งในสำรับ** ที่จะถูกสับและล็อกบนเซิร์ฟเวอร์ (ยุติธรรมเพราะลำดับไพ่ผูกพันก่อนเฉลย)
 *    3. แตะใบหนึ่ง ➔ `onDraw` = `/api/reading/start` (ได้ commitment) ➔ `/shuffle` พร้อม `pickedIndices: [ตำแหน่งนั้น]`
 *       ➔ ไพ่ที่ได้คือ `drawn[0]` จากเซิร์ฟเวอร์เท่านั้น (ตรรกะอยู่ที่ `drawQuickCard` ใน TarotFlow)
 *    4. ระหว่างรอ ไพ่ยกขึ้น + วงแสงทองเต้น · **พลิกเมื่อได้ข้อมูลจริงแล้วเท่านั้น** · พลาด = "โหลดใหม่อีกครั้ง" ไม่มีไพ่สำรอง
 *    5. หลังพลิก ➔ ชื่อไพ่จริง + คำแนะนำที่แม่หมอตรวจแล้ว (`card-advice.ts` โหลดตอนพลิก) + ให้แม่หมอ AI อ่านต่อ / สับใหม่
 *    6. ชิปล็อก = commitment จริงของเซสชัน (ตัดหัวท้าย) — ก่อนมีเซสชันแสดง "สุ่มจริง ตรวจสอบได้" ห้ามรหัสปลอม
 * ⚠️ `/start` แค่ตรวจโควตา (หักจริงตอน `/read` จบ) จึงเรียกได้ตอนแตะไพ่ · แต่ยังเรียกตอน "แตะไพ่" ไม่ใช่ตอนเลือกเรื่อง
 *    ตามแผน — คนที่แค่เลือกเรื่องไม่ทำให้เกิดเซสชันเปล่า
 * ⚠️ `card-advice.ts` (~48 KB) ห้าม import ตรง ๆ — island หน้าแรกจะบวม (กติกา island) · โหลดแบบ dynamic ตอนพลิก
 */

export interface Ui2Draw {
  cardId: string;
  image: string;
  nameTh: string;
  nameEn: string;
  isReversed: boolean;
  commitment: string | null;
}

type CardState = "idle" | "lifted" | "revealed" | "dim";

/** ตำแหน่งตั้งต้นกระจายทั่วสำรับ 78 ใบ (0-based) — สับใหม่ = สุ่มชุดใหม่ฝั่งเบราว์เซอร์ (ยุติธรรมเพราะลำดับไพ่ล็อกบนเซิร์ฟเวอร์) */
const DEFAULT_POSITIONS = [7, 22, 38, 53, 69];
const DECK = 78;

function randomPositions(): number[] {
  const picked = new Set<number>();
  const buf = new Uint32Array(1);
  while (picked.size < 5) {
    crypto.getRandomValues(buf);
    picked.add(buf[0] % DECK);
  }
  return [...picked].sort((a, b) => a - b);
}

function shortCommitment(c: string): string {
  return c.length > 10 ? `${c.slice(0, 4)}…${c.slice(-4)}` : c;
}

export function Ui2PickSection({
  isEnglish,
  spreadCount,
  canDraw,
  onDraw,
  onReadWithAI,
  onReset,
  children,
}: {
  isEnglish: boolean;
  /** จำนวนผังสาธารณะจริง (`PUBLIC_SPREADS.length`) — ห้ามพิมพ์เลขเอง */
  spreadCount: number;
  /** ด่านสิทธิ์เดิม — คืน false = เปิดหน้าต่างสิทธิ์ให้แล้ว ห้ามเดินต่อ */
  canDraw: () => boolean;
  /** เปิดเซสชัน + สับ + จั่วตำแหน่งที่แตะบนเซิร์ฟเวอร์ · null = ถูกด่านสิทธิ์/ความปลอดภัยกั้น (มีหน้าต่างของมันเองแล้ว) */
  onDraw: (topic: QuickTopic, deckPosition: number) => Promise<Ui2Draw | null>;
  /** ส่งไพ่ที่เพิ่งพลิกเข้าท่อคำทำนายด่วนเดิม (`QuickChatResult`) */
  onReadWithAI: () => void;
  /** ทิ้งไพ่ที่จั่วค้างไว้ (ยังไม่อ่าน = ยังไม่หักโควตา) */
  onReset: () => void;
  /** ของต่อท้ายในส่วนเดียวกัน (ผังของฉัน) — วางในพื้นมืดของส่วนนี้ ไม่ให้เกิดแถบสีพื้นเดิมคั่นระหว่างส่วน */
  children?: React.ReactNode;
}) {
  const [topic, setTopic] = useState<QuickTopic>(QUICK_TOPICS[0]);
  const [positions, setPositions] = useState<number[]>(DEFAULT_POSITIONS);
  const [active, setActive] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [draw, setDraw] = useState<Ui2Draw | null>(null);
  const [advice, setAdvice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const busy = useRef(false);

  const reset = (shuffle: boolean) => {
    busy.current = false;
    setActive(null);
    setRevealed(false);
    setDraw(null);
    setAdvice(null);
    setError(null);
    if (shuffle) setPositions(randomPositions());
    onReset();
  };

  const pickTopic = (next: QuickTopic) => {
    if (busy.current || draw) return;
    if (!canDraw()) return;
    setTopic(next);
  };

  const pickCard = async (slot: number) => {
    if (busy.current || draw) return;
    if (!canDraw()) return;
    busy.current = true;
    setError(null);
    setActive(slot);
    try {
      const result = await onDraw(topic, positions[slot]);
      if (!result) {
        // ด่านสิทธิ์/ความปลอดภัยกั้น — หน้าต่างของมันขึ้นแล้ว · วางไพ่กลับคว่ำตามเดิม
        busy.current = false;
        setActive(null);
        return;
      }
      setDraw(result);
      setRevealed(true);
      import("@/data/cards/card-advice")
        .then((m) => setAdvice(m.reviewedCardAdvice(result.cardId, result.isReversed, isEnglish ? "en" : "th")))
        .catch(() => setAdvice(null));
    } catch (err) {
      busy.current = false;
      setActive(null);
      setError(
        err instanceof Error && err.message
          ? err.message
          : isEnglish
            ? "Card draw data missing. Please reload and try again."
            : "ไม่พบข้อมูลไพ่ที่เปิด กรุณากดโหลดใหม่อีกครั้ง",
      );
    }
  };

  const stateOf = (slot: number): CardState => {
    if (active === null) return "idle";
    if (slot !== active) return "dim";
    return revealed ? "revealed" : "lifted";
  };

  const topicName = (t: QuickTopic) => (isEnglish ? (t.titleEn ?? t.title) : t.title);
  const shortName: Record<QuickTopic["id"], [string, string]> = {
    love: ["ความรัก", "Love"],
    work: ["การงาน", "Work"],
    money: ["การเงิน", "Money"],
    general: ["ภาพรวม", "Overall"],
  };
  const href = (path: string) => (isEnglish ? `/en${path}` : path);

  return (
    <section
      id="home-quick"
      className="ui2-sec ui2-night ui2-pick scroll-mt-16"
      data-home-section="quick"
      data-ui2-dark
      data-anim-section
      data-ui2-hide-sticky
      aria-labelledby="ui2-pick-title"
    >
      <div className="ui2-stars ui2-loop" aria-hidden="true" />
      <div className="ui2-stars ui2-stars-2 ui2-loop" aria-hidden="true" />

      <div className="ui2-wrap">
        <div className="ui2-pick-head">
          <span className="ui2-kicker">{isEnglish ? "Quick reading · 1 card" : "เปิดไพ่ด่วน 1 ใบ"}</span>
          <h2 id="ui2-pick-title" className="ui2-h2">
            <ThaiPhrases>
              {isEnglish ? (
                <>
                  Your heart <span className="tp ui2-gold-night ui2-loop">chooses</span>
                </>
              ) : (
                <>
                  ใจคุณ<span className="tp ui2-gold-night ui2-loop">เลือกเอง</span>
                </>
              )}
            </ThaiPhrases>
          </h2>
          <p className="ui2-lede">
            {isEnglish
              ? "Pick a topic, then tap one of the five face-down cards. The deck is shuffled and locked on our server before you touch it."
              : "เลือกเรื่องที่อยากรู้ แล้วแตะไพ่คว่ำ 1 ใน 5 ใบ ลำดับไพ่ถูกสับและล็อกไว้บนเซิร์ฟเวอร์ก่อนคุณแตะ"}
          </p>
        </div>

        <div className="ui2-window">
          {/* แถบหัวหน้าต่าง (ต้นแบบ D+): เรื่องที่เลือก ซ้าย · ชิปล็อกลำดับไพ่ ขวา */}
          <div className="ui2-pick-bar">
            <span className="ui2-pick-bar-title">
              {isEnglish ? `1-card reading · ${shortName[topic.id][1]}` : `ไพ่ด่วน 1 ใบ · เรื่อง${shortName[topic.id][0]}`}
            </span>
            <span className="ui2-chip ui2-lock">
              <span className="ui2-dot" aria-hidden="true" />
              {draw?.commitment ? (
                <>
                  {isEnglish ? "Deck order locked · " : "ลำดับไพ่ถูกล็อกแล้ว · "}
                  <code title={draw.commitment}>{shortCommitment(draw.commitment)}</code>
                </>
              ) : isEnglish ? (
                "Truly random, verifiable"
              ) : (
                "สุ่มจริง ตรวจสอบได้"
              )}
            </span>
          </div>
          <div className="ui2-pick-grid">
            <div className="ui2-topics" role="group" aria-label={isEnglish ? "Choose a topic" : "เลือกเรื่องที่อยากรู้"}>
              {QUICK_TOPICS.map((t, i) => (
                <button
                  key={t.id}
                  type="button"
                  className="ui2-topic"
                  aria-pressed={t.id === topic.id}
                  disabled={Boolean(draw) || active !== null}
                  onClick={() => pickTopic(t)}
                  data-home-target={`quick:${t.id}`}
                >
                  <span className="ui2-topic-num ui2-num" aria-hidden="true">{`0${i + 1}`}</span>
                  <span className="ui2-topic-text">
                    <span>{shortName[t.id][isEnglish ? 1 : 0]}</span>
                    {/* คำโปรยของหัวข้อ (quick-topics.ts) — คอมโชว์ใต้หัวข้อที่เลือก · มือถือซ่อน */}
                    <small className="ui2-topic-tag">{isEnglish ? (t.taglineEn ?? t.tagline) : t.tagline}</small>
                  </span>
                </button>
              ))}
            </div>

            <div>
              <div className="ui2-cloth">
                {/* แท่นทอง: วงรีเรืองแสงใต้พัดไพ่ (ตกแต่งล้วน) */}
                <span className="ui2-altar" aria-hidden="true" />
                {positions.map((pos, slot) => {
                  const state = stateOf(slot);
                  const shown = state === "revealed" && draw;
                  // พัดไพ่: ใบกลาง = 0 · ซ้าย/ขวาเอียงออกและต่ำลงตามระยะจากกลาง (โค้งแบบต้นแบบ D+)
                  const offset = slot - (positions.length - 1) / 2;
                  return (
                    <button
                      key={`${pos}-${slot}`}
                      type="button"
                      className="ui2-pick-card"
                      style={{ ["--o" as string]: offset, ["--drop" as string]: `${offset * offset * 7}px` }}
                      data-state={state}
                      disabled={active !== null && slot !== active}
                      onClick={() => void pickCard(slot)}
                      aria-label={
                        shown
                          ? isEnglish
                            ? `Your card: ${draw.nameEn}${draw.isReversed ? " (reversed)" : ""}`
                            : `ไพ่ของคุณ: ${draw.nameTh}${draw.isReversed ? " (กลับหัว)" : ""}`
                          : isEnglish
                            ? `Face-down card ${slot + 1} of 5 for ${topicName(topic)}`
                            : `ไพ่คว่ำใบที่ ${slot + 1} จาก 5 · เรื่อง${topicName(topic)}`
                      }
                      data-home-target="quick:card"
                    >
                      <span className="ui2-pulse ui2-loop" aria-hidden="true" />
                      <span className="ui2-flip" aria-hidden="true">
                        <span className="ui2-face ui2-face-back" />
                        <span className={`ui2-face ui2-face-front${shown && draw.isReversed ? " is-reversed" : ""}`}>
                          {shown && <CardImage image={draw.image} alt="" sizes="(min-width: 768px) 92px, 64px" loading="eager" />}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>

            </div>

            {/* แผงขวา (ต้นแบบ D+): ก่อนแตะ = วิธีเล่น · ระหว่างรอ = สถานะ · หลังพลิก = ผลไพ่ + ปุ่มอ่านต่อ */}
            <div className="ui2-pick-side">
              {!draw && !error && (
                <div className="ui2-pick-guide">
                  <h3 className="ui2-pick-guide-title">
                    <ThaiPhrases>{isEnglish ? "Tap the one card your heart picks" : "แตะไพ่ 1 ใบ ที่ใจเลือก"}</ThaiPhrases>
                  </h3>
                  <p>
                    {isEnglish
                      ? "All 78 cards are shuffled and their order is locked first. The card you tap is the card you get."
                      : "ไพ่ 78 ใบถูกสับและล็อกลำดับไว้แล้ว ใบที่คุณแตะคือใบที่ได้จริง"}
                  </p>
                </div>
              )}
              <p className="ui2-pick-hint" aria-live="polite">
                {error
                  ? ""
                  : draw
                    ? ""
                    : active !== null
                      ? isEnglish
                        ? "Shuffling and locking the deck…"
                        : "กำลังสับและล็อกลำดับไพ่…"
                      : isEnglish
                        ? `Topic: ${topicName(topic)} · tap the card your heart picks`
                        : `เรื่อง${topicName(topic)} · แตะใบที่ใจเลือก`}
              </p>

              {error && (
                <div role="alert" className="ui2-error">
                  <p>{error}</p>
                  <button type="button" className="ui2-btn-ghost mt-3" onClick={() => reset(true)}>
                    {isEnglish ? "Reload Reading" : "โหลดใหม่อีกครั้ง"}
                  </button>
                </div>
              )}

              {draw && revealed && (
                <div className="ui2-result" aria-live="polite">
                  <p className="ui2-result-sub">{isEnglish ? "Your card" : "ไพ่ของคุณ"}</p>
                  <p className="ui2-result-name">
                    {isEnglish ? draw.nameEn : draw.nameTh}
                    {draw.isReversed && <span className="ui2-result-sub">{isEnglish ? " · reversed" : " · กลับหัว"}</span>}
                  </p>
                  {!isEnglish && <p className="ui2-result-sub">{draw.nameEn}</p>}
                  {advice && <p className="ui2-result-advice">{advice}</p>}
                  <div className="ui2-result-actions">
                    <button type="button" className="ui2-btn" onClick={onReadWithAI} data-home-target="quick:read">
                      {isEnglish ? "Let the AI oracle read on" : "ให้แม่หมอ AI อ่านต่อ"}
                    </button>
                    <button type="button" className="ui2-btn-ghost" onClick={() => reset(true)} data-home-target="quick:reshuffle">
                      {isEnglish ? "Shuffle again" : "สับใหม่"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="ui2-under">
          {/* ตัวนับคำทำนายจริง — ซ่อนจนกว่า astro/scripts/home-track.ts ได้ยอดถึงเกณฑ์ (ไม่มีเลขปลอม) */}
          <p data-reading-counter data-min={PUBLIC_COUNTER_MIN} hidden suppressHydrationWarning className="ui2-chip">
            {isEnglish ? (
              <>
                <strong data-reading-counter-value className="ui2-num" suppressHydrationWarning /> readings so far
              </>
            ) : (
              <>
                อ่านไพ่ไปแล้ว <strong data-reading-counter-value className="ui2-num" suppressHydrationWarning /> ครั้ง
              </>
            )}
          </p>
          <nav className="ui2-deeper" aria-label={isEnglish ? "More detailed spreads" : "ผังที่ละเอียดกว่า"}>
            <span>{isEnglish ? "Want more detail?" : "อยากละเอียดกว่านี้"}</span>
            <a href={href("/read/three-card")}>{isEnglish ? "Past · Present · Future" : "อดีต-ปัจจุบัน-อนาคต"}</a>
            <a href={href("/read/yes-no")}>{isEnglish ? "Yes or No" : "ใช่หรือไม่"}</a>
            <a href={href("/read/love")}>{isEnglish ? "Two Hearts" : "ความรักสองหัวใจ"}</a>
            <a href={href("/spreads")}>
              {isEnglish ? `All ${spreadCount} spreads` : `ดูผังทั้งหมด ${spreadCount} แบบ`}
            </a>
          </nav>
          {children}
        </div>
      </div>
    </section>
  );
}
