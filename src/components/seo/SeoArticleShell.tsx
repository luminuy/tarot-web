"use client";

import React from "react";
import { RouteLink as Link } from "@/components/ui/RouteLink";
import { useLocale } from "@/lib/i18n";
import { ThaiPhrases } from "@/components/ui/ThaiPhrases";

export interface SeoFaqItem {
  q: string;
  a: string;
}

export interface SeoArticleLink {
  href: string;
  label: string;
}

export interface SeoArticleShellProps {
  eyebrow: string;
  title: string;
  children: React.ReactNode;
  faqs?: SeoFaqItem[];
  links?: SeoArticleLink[];
  className?: string;
  /**
   * สีแถบแบ่งส่วน (`page-band` แบบหน้าแรก) — ค่าเริ่มต้นแถบอ่อน (`tint`) เพราะบทความนี้มักเป็นส่วนสุดท้ายต่อจากส่วนพื้นใส
   * หน้าไหนส่วนก่อนหน้าเป็นแถบอ่อนอยู่แล้ว ส่ง `"plain"` เพื่อให้สลับสีต่อกันถูก
   */
  band?: "tint" | "plain";
}

export function SeoArticleShell({
  eyebrow,
  title,
  children,
  faqs,
  links,
  className = "",
  band = "tint",
}: SeoArticleShellProps) {
  const { isEnglish } = useLocale();
  return (
    <section
      className={`page-band${band === "tint" ? " page-band-tint" : ""} space-y-6 ${className}`}
      style={{ "--cat": "var(--ui2-note-4)", "--cat-ink": "var(--ui2-note-ink-4)" } as React.CSSProperties}
    >
      {/* แถบบนแบบหน้าต่าง /spreads (เจ้าของ 2026-10-17 "ทำแบบหน้าแรกกับหน้าผัง") — สไตล์ ui2-showcase.css · .v3-sa-bar ใน ui2-page.css */}
      {band === "tint" && (
        <div className="ui2-sx-bar v3-sa-bar" aria-hidden="true">
          <span className="ui2-sx-name">
            <span className="ui2-sx-n ui2-num">{isEnglish ? "Read" : "อ่าน"}</span>
            <span className="ui2-accent">Guide</span>
          </span>
        </div>
      )}
      {/* Header */}
      <div className="space-y-2 border-b border-line pb-4">
        <span className="text-xs font-serif-th font-semibold text-gold-ink">
          {eyebrow}
        </span>
        <h2 className="text-xl sm:text-2xl font-serif-th font-bold text-ink tracking-tight [text-wrap:balance]"><ThaiPhrases>
          {title}
        </ThaiPhrases></h2>
      </div>

      {/* Main Editorial Content (Sarabun font for legibility) */}
      <div className="text-sm text-ink leading-relaxed space-y-4 font-sans">
        {children}
      </div>

      {/* FAQ Accordion Section if provided */}
      {faqs && faqs.length > 0 && (
        <div className="pt-6 border-t border-line space-y-4">
          {/*
            ⚠️ หัวข้อนี้เคยฮาร์ดโค้ดภาษาไทยไว้ ทำให้หน้า /en/daily และ /en/love/1-card
            มีคำว่า "คำถามที่พบบ่อย (FAQ)" โผล่กลางหน้าอังกฤษ (UX-17)
            ด่านกันไทยรั่วสองตัวที่มีอยู่จับไม่ได้ เพราะตัวหนึ่งใช้เกณฑ์ "สัดส่วนเกิน 1.5%
            ของหน้า" ซึ่งหัวข้อบรรทัดเดียวคิดเป็น ~0.1% และอีกตัวตรวจเฉพาะคอมโพเนนต์ในลิสต์
          */}
          <h3 className="text-base sm:text-lg font-serif-th font-bold text-ink"><ThaiPhrases>
            {isEnglish ? "Frequently Asked Questions (FAQ)" : "คำถามที่พบบ่อย (FAQ)"}
          </ThaiPhrases></h3>
          {/* แผงพับแบบ "คำถามอื่น ๆ" ของหน้าแรก (ui2-blocks.css · เจ้าของ 2026-10-17) — <details> ล้วน:
              คำตอบอยู่ใน HTML ครบ (ตรงกับ JSON-LD) และเปิดได้แม้หน้าไม่ได้ hydrate (เดิม useState = หน้า Astro เปิดไม่ได้) */}
          <div className="ui2-fr-list">
            {faqs.map((faq) => (
              <details key={faq.q} className="ui2-fr-faq">
                <summary>
                  <span>{faq.q}</span>
                  <span className="ui2-fr-plus" aria-hidden="true" />
                </summary>
                <div className="ui2-fr-faq-a">{faq.a}</div>
              </details>
            ))}
          </div>
        </div>
      )}

      {/* Internal Navigation Links */}
      {links && links.length > 0 && (
        <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 text-xs font-serif-th text-muted pt-4 border-t border-line">
          {links.map((link, idx) => (
            <React.Fragment key={idx}>
              {idx > 0 && (
                <span className="text-line" aria-hidden="true">
                  ·
                </span>
              )}
              <Link
                href={link.href}
                className="hover:text-ink underline underline-offset-4 transition-colors"
              >
                {link.label}
              </Link>
            </React.Fragment>
          ))}
        </div>
      )}
    </section>
  );
}
