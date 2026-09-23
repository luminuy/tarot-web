import React from "react";
import { LocaleLink as Link } from "@/components/ui/LocaleLink";
import type { TarotCard } from "@/data/cards/types";
import { buildYesNoAnswer, YES_NO_TONE } from "@/data/cards/yes-no";

interface CardYesNoAnswerProps {
  card: TarotCard;
  isEnglish: boolean;
}

export const CardYesNoAnswer: React.FC<CardYesNoAnswerProps> = ({ card, isEnglish }) => {
  const uprightAnswer = buildYesNoAnswer(card, true, isEnglish);
  const reversedAnswer = buildYesNoAnswer(card, false, isEnglish);
  const tone = YES_NO_TONE[card.yesNo];

  const answers = [
    { key: "upright" as const, data: uprightAnswer },
    { key: "reversed" as const, data: reversedAnswer },
  ];

  return (
    <section aria-labelledby="yes-no-heading" className="space-y-3.5 pt-2">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h2 id="yes-no-heading" className="font-serif-th text-base font-bold text-ink flex items-center gap-2">
          {isEnglish ? `Is ${card.nameEn} a Yes or No Card?` : `ไพ่ ${card.nameTh} ใช่หรือไม่ (Yes / No)`}
        </h2>
        <span className={`px-3 py-1 rounded-full border text-xs font-bold ${tone.badgeClass}`}>
          {uprightAnswer.verdictLabel}
        </span>
      </div>

      {answers.map(({ key, data }) => (
        <div
          key={key}
          data-when={key}
          className="altar-card-porcelain p-4 sm:p-5 space-y-3"
        >
          <div className="space-y-1.5">
            <h3 className="font-serif-th text-xs sm:text-sm font-bold text-ink">
              {data.headline}
            </h3>
            <p className="font-serif-th text-xs sm:text-sm text-ink leading-relaxed pl-4 border-l-2 border-line group-hover:border-gold transition-colors [text-wrap:pretty]">
              {data.body}
            </p>
          </div>

          {data.condition && (
            <div className="pt-2 border-t border-line/50 text-[13px] text-muted font-serif-th leading-relaxed">
              <span className="font-bold text-ink-soft">
                {isEnglish ? "Context & Caution: " : "เงื่อนไขและบริบทประกอบ: "}
              </span>
              {data.condition}
            </div>
          )}

          <p className="text-[12px] text-muted font-serif-th italic pt-1">
            {isEnglish
              ? "Reflects archetypal tendencies from the 1909 Rider-Waite-Smith system rather than a definitive absolute — consult the cards in a reading to explore your specific context."
              : "เป็นแนวโน้มของไพ่ใบนี้ตามตำรา 1909 ไม่ใช่คำตอบสำเร็จรูปของคำถามคุณ — เปิดไพ่จริงเพื่อดูบริบทของคุณเอง"}
          </p>

          <div className="pt-2 flex items-center gap-4 flex-wrap text-xs font-serif-th">
            <Link
              href="/spreads/yes-no"
              className="text-gold-ink hover:underline font-bold transition flex items-center gap-1"
            >
              {isEnglish ? "Try Free 3-Card Yes/No Spread →" : "เปิดไพ่ ใช่หรือไม่ 3 ใบ ฟรี →"}
            </Link>
            <Link
              href="/read/yes-no"
              className="text-muted hover:text-ink transition underline underline-offset-4"
            >
              {isEnglish ? "Consult AI Tarot with your question →" : "ถามแม่หมอ AI ด้วยคำถามของคุณเอง →"}
            </Link>
          </div>
        </div>
      ))}
    </section>
  );
};
