/**
 * 🧭 "ไปต่อจากตรงนี้" — กล่องหลายขนาดแบบหน้าแรก (ส่วน "ทุกอย่างที่ต้องใช้ อยู่ในที่เดียว") ท้ายหน้าอื่น
 * ===========================================================================
 * เจ้าของ 2026-10-17: "นำสองส่วนนี้ไปใช้กับหน้าอื่น … ไม่จำเป็นต้องตรงหมวดก็ได้"
 * ➔ ทางเข้าเครื่องมือหลัก 4 กล่อง (ตำแหน่ง 1 = กว้าง · 2 = สูง · 3–4 = ช่องเดียว) แต่ละหน้าเลือกชุดที่ไม่ซ้ำกับตัวเอง
 *
 * ⚠️ HTML นิ่งล้วน (ไม่มี hook) — วางในส่วนที่เรนเดอร์ฝั่งเซิร์ฟเวอร์เท่านั้น ห้ามวางใน island (บันเดิลจะลากภาพไพ่/ข้อความมาด้วย)
 * ⚠️ ไม่มีตัวเลขสมมุติ — ตัวเลขเดียวคือ 78 (จำนวนไพ่ในสำรับ) · ไพ่ในภาพประกอบเลือกตามความหมายดั้งเดิม ไม่ใช่ผลเปิดไพ่ของใคร
 */
import type { ReactNode } from "react";

import { BxBack, BxChips, BxFan, BxStat, BxStrip, Ui2Bento, type Ui2BentoTile } from "@/components/ui2/Ui2Blocks";

export type Ui2NextKey = "spreads" | "daily" | "journal" | "questions" | "cards" | "birth" | "natal" | "pick" | "readers";

type Size = NonNullable<Ui2BentoTile["size"]>;

const SIZES: readonly Size[] = ["wide", "tall", "sm", "sm"];

function tile(key: Ui2NextKey, isEn: boolean, size: Size): Ui2BentoTile {
  const p = (path: string) => (isEn ? (path === "/" ? "/en" : `/en${path}`) : path);
  const tall = size === "tall";
  const t = (th: string, en: string) => (isEn ? en : th);
  const back = (hint: string, chips?: readonly string[]): ReactNode => (
    <>
      <BxBack />
      {chips ? <BxChips items={chips} /> : null}
      <span className="ui2-bx-hint">{hint}</span>
    </>
  );
  switch (key) {
    case "spreads":
      return {
        key,
        size,
        glow: "amber",
        lead: t("เลือก", "Choose"),
        title: t("ผังที่ใช่กับคำถาม", "the spread that fits your question"),
        href: p("/spreads"),
        visual: (
          <BxFan
            cards={[
              ["pentacles-08", "Eight of Pentacles"],
              ["major-17", "The Star"],
              ["cups-02", "Two of Cups"],
            ]}
            label={t("ผังพยากรณ์ 6 หมวด", "Spreads in 6 groups")}
            text={t("ความรัก การงาน การเงิน ตัดสินใจ ตัวเอง และผังใหญ่ แตะดูตำแหน่งไพ่ได้ก่อนเริ่ม", "Love, work, money, decisions, self and the grand spreads. Preview every position first.")}
            chip={t("ดูผังทั้งหมด", "See all spreads")}
          />
        ),
      };
    case "daily":
      return {
        key,
        size,
        glow: "teal",
        center: tall,
        label: t("พิธีเช้า · 2 นาที", "Morning ritual · 2 min"),
        lead: t("ทุกเช้า", "Every morning,"),
        title: t("มีไพ่ใบใหม่", "a new card"),
        href: p("/daily"),
        visual: back(
          t("แตะเพื่อพลิกไพ่ของวันนี้", "Tap to turn over today's card"),
          tall ? (isEn ? ["Work", "Heart", "People", "Money", "Self"] : ["งาน", "ใจ", "คน", "เงิน", "ตัวเอง"]) : undefined,
        ),
      };
    case "journal":
      return {
        key,
        size,
        lead: t("จด", "Keep"),
        title: t("ลงสมุดดวง", "a tarot journal"),
        href: p("/journal"),
        visual: (
          <>
            <BxStrip ids={["swords-04", "cups-01", null, "wands-12", "pentacles-01", null, null]} />
            <span className="ui2-bx-hint">{t("เก็บทุกคำอ่านไว้ แล้วนัดกลับมาเช็กว่าเป็นจริงไหม", "Save every reading, then check back on how it turned out.")}</span>
          </>
        ),
      };
    case "questions":
      return {
        key,
        size,
        lead: t("ถาม", "Ask"),
        title: t("ให้ไพ่ตอบได้ชัด", "so the cards can answer clearly"),
        href: p("/questions"),
        desc: t("รวมคำถามที่คนถามไพ่บ่อย พร้อมวิธีตั้งคำถามให้ได้คำตอบที่ใช้ได้จริง", "Common questions people bring to the cards, and how to phrase them for a useful answer."),
        visual: <BxChips items={isEn ? ["Love", "Work", "Money", "Choices"] : ["ความรัก", "การงาน", "การเงิน", "ทางเลือก"]} />,
      };
    case "cards":
      return {
        key,
        size,
        glow: tall ? "amber" : undefined,
        lead: t("คลัง", "The"),
        title: t("ความหมายไพ่ครบสำรับ", "full deck of meanings"),
        href: p("/cards"),
        visual: (
          <>
            <BxStat value="78" unit={t("ใบ · สำรับ 1909 ต้นฉบับ", "cards · the original 1909 deck")} />
            <span className="ui2-bx-hint">{t("หัวตั้ง กลับหัว ความรัก การงาน การเงิน ในหน้าเดียว", "Upright, reversed, love, work and money on one page.")}</span>
          </>
        ),
      };
    case "birth":
      return {
        key,
        size,
        glow: "amber",
        center: tall,
        label: t("จากวันเกิด", "From your birthday"),
        lead: t("ไพ่", "Your"),
        title: t("ประจำตัวของคุณ", "birth card"),
        href: p("/cards/birth-card"),
        visual: back(t("ใส่วันเกิด แล้วรู้ทันทีว่าไพ่ใบไหนเป็นของคุณ", "Enter your birthday to find the card that is yours.")),
      };
    case "natal":
      return {
        key,
        size,
        glow: "teal",
        center: tall,
        label: t("จากวัน เวลา และที่เกิด", "From your birth time"),
        lead: t("ผัง", "Your"),
        title: t("ดวงกำเนิดของคุณ", "natal chart"),
        href: p("/natal-chart"),
        visual: back(t("รู้ลัคนา ดาวทุกดวง และไพ่ทาโรต์ประจำแต่ละตำแหน่ง", "See your rising sign, every planet and the tarot card behind each one.")),
      };
    case "pick":
      return {
        key,
        size,
        glow: "teal",
        center: tall,
        label: t("เลือกกองไพ่", "Pick a pile"),
        lead: t("เลือก", "Pick"),
        title: t("ไพ่หนึ่งกอง", "a card"),
        href: p("/pick-a-card"),
        visual: back(t("ตั้งใจถาม แล้วเลือกกองที่ดึงดูดคุณ", "Hold your question and choose the pile that calls to you.")),
      };
    case "readers":
      return {
        key,
        size,
        lead: t("คุย", "Talk"),
        title: t("กับแม่หมอตัวจริง", "with a real reader"),
        /* /readers มีแต่ภาษาไทย (หน้า Next) — หน้าอังกฤษก็ลิงก์ไปที่เดียวกัน */
        desc: t("อยากคุยกับคนจริง ๆ จองเวลากับแม่หมอที่เปิดรับได้เลย", "Book a session with a human reader when you want to talk it through."),
        go: { href: "/readers", label: t("ดูแม่หมอทั้งหมด", "See all readers") },
      };
  }
}

export function Ui2NextSteps({
  isEn,
  keys,
  id = "ui2-next",
  title,
}: {
  isEn: boolean;
  /** 4 กล่อง เรียงตามตำแหน่ง: กว้าง · สูง · ช่องเดียว · ช่องเดียว */
  keys: readonly [Ui2NextKey, Ui2NextKey, Ui2NextKey, Ui2NextKey];
  id?: string;
  title?: string;
}) {
  return (
    <div className="ui2-next-wrap">
      <Ui2Bento
        id={id}
        className="ui2-next"
        kicker={isEn ? "Everything in one place" : "ครบในที่เดียว"}
        title={title ?? (isEn ? "Where to go from here" : "ไปต่อจากตรงนี้")}
        tiles={keys.map((k, i) => tile(k, isEn, SIZES[i]))}
      />
    </div>
  );
}
