"use client";

import React from "react";
import { splitTocNumber } from "@/lib/text/toc-label";
import { LocaleLink as Link } from "@/components/ui/LocaleLink";
import type { Article } from "@/data/articles";
import {
  getArticleTitle,
  getArticleDescription,
  getArticleCategory,
  getArticleAuthor,
} from "@/data/article-helpers";
import { COUNTS } from "@/components/layout/nav-links";
import { useLocale } from "@/lib/i18n";
import { ThaiPhrases, thaiPhrasesHtml } from "@/components/ui/ThaiPhrases";
import { Ui2Crumbs } from "@/components/ui2/Ui2PageHero";
import { CardImage } from "@/components/card/CardImage";
import { getArticleCardArt } from "@/data/article-art";
import { resolveArticleToc } from "./article-toc";

interface Props {
  article: Article;
  relatedArticles: Article[];
}

export const ArticleReadingClient: React.FC<Props> = ({ article, relatedArticles }) => {
  const { isEnglish, locale } = useLocale();

  /*
   * 🔇 หน้าบทความ "ไม่ hydrate" แล้ว — ทั้งหน้ามีของที่ต้องใช้ JS อยู่ชิ้นเดียวคือปุ่มคัดลอกลิงก์
   * (กับสถิติ `blog_read` หนึ่งครั้ง) ไม่คุ้มกับการโหลด React 184 KB ทุกบทความ
   * ทั้งสองอย่างย้ายไปอยู่ที่ `astro/scripts/article-share.ts` ซึ่งไม่ถึง 1 KB
   *
   * ⚠️ ห้ามใส่ `useState` กลับเข้ามาเพื่อสถานะ "คัดลอกแล้ว" — สคริปต์สลับข้อความให้เองแล้ว
   */

  const articleTitle = getArticleTitle(article, locale);
  const articleDesc = getArticleDescription(article, locale);
  const articleCat = getArticleCategory(article, locale);
  const articleAuthor = getArticleAuthor(article, locale);
  const readTimeFormatted = isEnglish
    ? article.readTime.replace("นาที", "min read")
    : article.readTime;

  const effectiveContent = isEnglish && article.contentEn ? article.contentEn : article.content;
  const effectiveToc = isEnglish && article.tocEn && article.tocEn.length > 0 ? article.tocEn : article.toc;
  const effectiveFaqs = isEnglish && article.faqsEn && article.faqsEn.length > 0 ? article.faqsEn : article.faqs;

  /* A7-07: สารบัญลิงก์ `#id` ได้ก็ต่อเมื่อ `<h2>` ในเนื้อหามี id ตรงกัน — จับคู่ด้วยชื่อหัวข้อ · โชว์เฉพาะรายการที่มีหัวข้อจริง */
  const resolvedToc = resolveArticleToc(effectiveContent, effectiveToc);
  const tocList = resolvedToc.items.length > 0 && (
    <ol className="v2-ar-toc-list">
      {resolvedToc.items.map((item, idx) => {
        /* 🔢 เลขข้อต้องมีชั้นเดียว (INC-0214) — ชื่อหัวข้อบางบทความมีเลขนำหน้าอยู่แล้ว */
        const { marker, label } = splitTocNumber(item.title, idx + 1);
        return (
          <li key={item.id}>
            <span className="v2-ar-toc-n shrink-0">{marker}.</span>
            <a href={`#${item.id}`}>{label}</a>
          </li>
        );
      })}
    </ol>
  );

  let h2Index = 0;

  /*
   * v2 (เจ้าของ 2026-10-16 "สร้างใหม่เลย") — ห้องอ่านหนังสือ
   * หัวบทความแบบหน้าแรกของบทในนิตยสาร (หมวด · เวลาอ่าน · ผู้เขียน · ชื่อใหญ่ · คำโปรย)
   * คอม: สารบัญติดจอซ้าย + คอลัมน์อ่านกว้างพอดีตา 17px (v1 ตัวหนังสือ 13–14px เต็มความกว้าง)
   * มือถือ: สารบัญพับได้ใต้หัวบทความ
   * ⚠️ หน้านี้ไม่ hydrate — ปุ่มคัดลอกลิงก์ใช้ `astro/scripts/article-share.ts` (คงตะขอ data-article-share / data-copy-link)
   */
  return (
    <div className="v2-ar">
      {/* v3 (เจ้าของ 2026-10-17 "ทำแบบหน้าแรกกับหน้าผัง"): ไพ่จริงลอยข้างหัวบทความ — ใบแรกคือไพ่ประจำบทความ (ตกแต่ง · ไม่ใช่ผลสุ่ม) */}
      <div className="v3-ar-hero" data-anim-section="">
      <span className="ui2-ph-deco" aria-hidden="true">
        {[getArticleCardArt(article).image, "major-17", "major-21", "major-10"].map((img, i) => (
          <span key={`${img}-${i}`} className={`ui2-ph-card ui2-loop ui2-ph-card-${[1, 3, 2, 4][i]}`}>
            <CardImage image={i === 0 ? img : undefined} cardId={i === 0 ? undefined : img} alt="" thumb sizes="(min-width: 768px) 128px, 44px" loading={i < 2 ? "eager" : "lazy"} fetchPriority="low" />
          </span>
        ))}
      </span>
      <header className="v2-ar-head">
        <Ui2Crumbs
          crumbs={[
            { label: isEnglish ? "Home" : "หน้าแรก", href: "/" },
            { label: isEnglish ? "Wisdom Codex" : "คัมภีร์บทความ", href: "/blog" },
            { label: articleCat },
          ]}
        />
        <p className="v2-ar-kicker">
          <span>{articleCat}</span>
          <span aria-hidden="true" className="v2-ar-dot" />
          <span>{isEnglish ? readTimeFormatted : `เวลาอ่าน ${article.readTime}`}</span>
          <span aria-hidden="true" className="v2-ar-dot" />
          <span>{isEnglish ? `By ${articleAuthor}` : `โดย ${article.author}`}</span>
        </p>
        <h1 className="v2-ar-title">
          <ThaiPhrases>{articleTitle}</ThaiPhrases>
        </h1>
        <p className="v2-ar-stand">
          <ThaiPhrases>{articleDesc}</ThaiPhrases>
        </p>
      </header>
      </div>

      <div className="v2-ar-layout">
        <aside className="v2-ar-aside">
          {tocList && (
            <details className="v2-ar-toc" open>
              <summary>{isEnglish ? "Table of Contents" : "สารบัญ"}</summary>
              {tocList}
            </details>
          )}
          {article.targetCardId && article.cardNameTh && (
            <Link href={`/cards/${article.targetCardId}`} className="v2-ar-cardlink">
              <span className="v2-ar-cardlink-k">
                {isEnglish ? "Explore this card in the 78-Card Encyclopedia" : "สำรวจไพ่ใบนี้ในสารานุกรม 78 ใบ"}
              </span>
              <b>
                {isEnglish
                  ? `${article.targetCardId.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())} (1909 Rider-Waite)`
                  : `ไพ่ ${article.cardNameTh} (1909 Rider-Waite)`}
              </b>
              <small>
                {isEnglish
                  ? "Full 1909 artwork, 5-dimensional meanings and spread positions."
                  : "ดูภาพขยาย 1909 ความหมายลึกซึ้ง 5 ด้าน และตำแหน่งในผังพยากรณ์"}
              </small>
            </Link>
          )}
        </aside>

        <div className="v2-ar-main">
          <article className="v2-ar-body">
            <div
              dangerouslySetInnerHTML={{
                __html: effectiveContent
                  // หัวข้อในเนื้อบทความห่อวลีด้วย `.tp` — ไม่งั้นหัวข้อหักกลางคำ
                  .replace(/## (.*?)\n/g, (_m, t: string) => `<h2 id="${resolvedToc.headingIds[h2Index++]}">${thaiPhrasesHtml(t)}</h2>`)
                  .replace(/### (.*?)\n/g, (_m, t: string) => `<h3>${thaiPhrasesHtml(t)}</h3>`)
                  .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
                  .replace(/\*(.*?)\*/g, "<em>$1</em>")
                  .replace(/- (.*?)\n/g, "<li>$1</li>")
                  .replace(/\n\n/g, '<p class="v2-ar-gap"></p>')
                  .replace(/---/g, "<hr />"),
              }}
            />
          </article>

          {effectiveFaqs && effectiveFaqs.length > 0 && (
            <section className="v2-ar-faq" aria-labelledby="ar-faq-h">
              <h2 id="ar-faq-h">{isEnglish ? "Frequently Asked Questions (FAQ)" : "คำถามที่พบบ่อย (FAQ)"}</h2>
              {/* <details> ของเบราว์เซอร์ — คำตอบอยู่ใน HTML ตั้งแต่ฝั่งเซิร์ฟเวอร์ (ตรงกับ FAQPage JSON-LD) */}
              {effectiveFaqs.map((faq, idx) => (
                <details key={idx}>
                  <summary>{faq.question}</summary>
                  <p>{faq.answer}</p>
                </details>
              ))}
            </section>
          )}

          <div
            className="v2-ar-share"
            data-article-share=""
            data-article-slug={article.slug}
            /* ⚠️ ต้องเป็นภาษาของหน้าเสมอ — กันอักษรไทยหลุดเข้า HTML หน้าอังกฤษ */
            data-article-title={articleTitle}
            data-article-category={articleCat}
          >
            <span>{isEnglish ? "Share this codex:" : "แชร์คัมภีร์นี้:"}</span>
            <button
              type="button"
              data-copy-link=""
              data-label-copied={isEnglish ? "Link Copied!" : "คัดลอกลิงก์สำเร็จ!"}
              data-label-failed={isEnglish ? "Can't copy — press and hold the address bar instead" : "คัดลอกไม่ได้ ลองกดค้างที่แถบที่อยู่แทน"}
              className="v2-ar-copy"
            >
              <span data-copy-label="" aria-live="polite">
                {isEnglish ? "Copy Link" : "คัดลอกลิงก์"}
              </span>
            </button>
            <Link href="/blog" className="v2-ar-back">
              {isEnglish ? `Back to Wisdom Codex (${COUNTS.articles} articles)` : `กลับสู่คัมภีร์ทั้งหมด (${COUNTS.articles} บทความ)`}
            </Link>
          </div>
        </div>
      </div>

      {/* ชวนเปิดไพ่ */}
      <section className="v2-ar-cta">
        <p className="v2-ar-cta-k">{isEnglish ? "Draw your own cards · verifiable shuffle" : "เปิดไพ่ด้วยมือคุณเอง · สุ่มจริง ตรวจสอบได้"}</p>
        <h2>
          <ThaiPhrases>{isEnglish ? "Ready to Reveal the Hidden Wisdom of Your Path?" : "พร้อมเปิดไพ่ รับคำตอบสำหรับชีวิตคุณหรือยัง?"}</ThaiPhrases>
        </h2>
        <Link href="/" className="ui2-btn v2-ar-go">
          {isEnglish ? "Begin Free Tarot Reading Now" : "เปิดไพ่ทำนายดวงชะตาฟรีทันที"}
        </Link>
      </section>

      {relatedArticles.length > 0 && (
        <section className="v2-ar-related" aria-labelledby="ar-rel-h">
          <h2 id="ar-rel-h">
            <ThaiPhrases>{isEnglish ? "Resonant & Related Articles" : "คัมภีร์บทความที่เกี่ยวข้อง"}</ThaiPhrases>
          </h2>
          <ul>
            {relatedArticles.map((rel) => (
              <li key={rel.slug}>
                <Link href={`/blog/${rel.slug}`}>
                  <small>{getArticleCategory(rel, locale)}</small>
                  <b>
                    <ThaiPhrases>{getArticleTitle(rel, locale)}</ThaiPhrases>
                  </b>
                  <span>{isEnglish ? rel.readTime.replace("นาที", "min read") : rel.readTime}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
};
