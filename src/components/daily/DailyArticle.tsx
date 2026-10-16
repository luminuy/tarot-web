/**
 * 📖 บทความ + คำถามที่พบบ่อย + ทางลัด ท้ายหน้า `/daily` · `/en/daily` (UI 2.0 กลางคืน)
 * ===========================================================================
 * HTML ล้วน ไม่ hydrate — เดิมใช้ `SeoArticleShell` ซึ่งเป็น client component ที่หน้านี้ไม่เคย hydrate
 * ปุ่มเปิดคำตอบ FAQ จึงกดไม่ติดมาตลอด ➔ ใช้ `<details>` ของเบราว์เซอร์แทน (ทำงานโดยไม่ต้องมี JS)
 *
 * เลย์เอาต์ "หัวเรื่องซ้าย ข้อมูลขวา" แบบส่วนคลังไพ่ยิปซีของหน้าแรก (เจ้าของชอบ 2026-10-13)
 */
import type { ReactNode } from "react";

import { CardImage } from "@/components/card/CardImage";
import { ThaiPhrases } from "@/components/ui/ThaiPhrases";

export interface DailyTip {
  title: string;
  body: ReactNode;
}

export interface DailyArticleLink {
  href: string;
  label: string;
  note: string;
  card: string;
}

export function DailyArticle({
  isEnglish,
  eyebrow,
  title,
  intro,
  tipsTitle,
  tips,
  trustTitle,
  trust,
  faqs,
  links,
}: {
  isEnglish: boolean;
  eyebrow: string;
  title: string;
  intro: ReactNode;
  tipsTitle: string;
  tips: DailyTip[];
  trustTitle: string;
  trust: ReactNode;
  faqs: Array<{ q: string; a: string }>;
  links: DailyArticleLink[];
}) {
  return (
    <section className="ui2-sec ui2-night ui2-dy-learn" data-ui2-dark="" data-anim-section="" aria-labelledby="daily-learn-title">
      <span className="ui2-stars ui2-loop" aria-hidden="true" />
      <div className="ui2-wrap">
        <div className="ui2-dy-split">
          <div className="ui2-dy-split-head">
            <span className="ui2-sp-badge ui2-sp-badge-gold">
              <span className="ui2-num">01</span>
              <span className="ui2-accent">{isEnglish ? "The practice" : "Daily practice"}</span>
            </span>
            <p className="ui2-dy-eyebrow">{eyebrow}</p>
            <h2 id="daily-learn-title" className="ui2-h2 ui2-dy-h2"><ThaiPhrases>{title}</ThaiPhrases></h2>
          </div>
          <div className="ui2-dy-split-body">
            <div className="ui2-dy-prose">{intro}</div>
            <h3 className="ui2-dy-h3"><ThaiPhrases>{tipsTitle}</ThaiPhrases></h3>
            <ol className="ui2-dy-tips">
              {tips.map((tip, i) => (
                <li key={i} className="ui2-dy-tip">
                  <span className="ui2-dy-tip-n ui2-num" aria-hidden="true">{i + 1}</span>
                  <span>
                    <strong className="ui2-dy-tip-t">{tip.title}</strong>
                    <span className="ui2-dy-tip-b">{tip.body}</span>
                  </span>
                </li>
              ))}
            </ol>
            <div className="ui2-dy-trust">
              <h3 className="ui2-dy-h3"><ThaiPhrases>{trustTitle}</ThaiPhrases></h3>
              <div className="ui2-dy-prose">{trust}</div>
            </div>
          </div>
        </div>

        <span className="ui2-sp-rule" aria-hidden="true" />
        <div className="ui2-dy-split">
          <div className="ui2-dy-split-head">
            <span className="ui2-sp-badge ui2-sp-badge-gold">
              <span className="ui2-num">02</span>
              <span className="ui2-accent">FAQ</span>
            </span>
            <h2 className="ui2-h2 ui2-dy-h2"><ThaiPhrases>
              {isEnglish ? "Frequently asked questions" : "คำถามที่พบบ่อย"}
            </ThaiPhrases></h2>
          </div>
          <div className="ui2-dy-split-body ui2-dy-faq">
            {faqs.map((faq, i) => (
              <details key={i} className="ui2-dy-faq-item">
                <summary>
                  <span>{faq.q}</span>
                  <span className="ui2-dy-faq-icon" aria-hidden="true" />
                </summary>
                <p>{faq.a}</p>
              </details>
            ))}
          </div>
        </div>

        <span className="ui2-sp-rule" aria-hidden="true" />
        <div className="ui2-dy-split-head ui2-dy-more-head">
          <span className="ui2-sp-badge ui2-sp-badge-gold">
            <span className="ui2-num">03</span>
            <span className="ui2-accent">{isEnglish ? "Keep exploring" : "Keep exploring"}</span>
          </span>
          <h2 className="ui2-h2 ui2-dy-h2"><ThaiPhrases>
            {isEnglish ? "More ways to read your cards" : "อ่านไพ่ต่อได้อีกหลายทาง"}
          </ThaiPhrases></h2>
        </div>
        <ul className="ui2-sp-tiles">
          {links.map((item) => (
            <li key={item.href}>
              <a href={item.href} className="ui2-sp-tile">
                <span className="ui2-sp-tile-art" aria-hidden="true">
                  <CardImage cardId={item.card} alt="" thumb sizes="80px" loading="lazy" fetchPriority="low" />
                </span>
                <span className="ui2-sp-tile-name">{item.label}</span>
                <span className="ui2-sp-tile-note">{item.note}</span>
                <span className="ui2-sp-tile-go" aria-hidden="true">
                </span>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
