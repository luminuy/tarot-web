"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useLocale } from "@/lib/i18n";

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
}

export function SeoArticleShell({
  eyebrow,
  title,
  children,
  faqs,
  links,
  className = "",
}: SeoArticleShellProps) {
  const { isEnglish } = useLocale();
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  const toggleFaq = (idx: number) => {
    setOpenFaqIndex((prev) => (prev === idx ? null : idx));
  };

  return (
    <section
      className={`altar-panel rounded-2xl p-5 sm:p-8 space-y-6 ${className}`}
    >
      {/* Header */}
      <div className="space-y-2 border-b border-line pb-4">
        <span className="text-xs font-serif-th font-semibold text-gold-ink">
          {eyebrow}
        </span>
        <h2 className="text-xl sm:text-2xl font-serif-th font-bold text-ink tracking-tight [text-wrap:balance]">
          {title}
        </h2>
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
          <h3 className="text-base sm:text-lg font-serif-th font-bold text-ink">
            {isEnglish ? "Frequently Asked Questions (FAQ)" : "คำถามที่พบบ่อย (FAQ)"}
          </h3>
          <div className="divide-y divide-line rounded-xl border border-line bg-surface-warm overflow-hidden">
            {faqs.map((faq, idx) => {
              const isOpen = openFaqIndex === idx;
              return (
                <div key={idx} className="transition-colors">
                  <button
                    type="button"
                    onClick={() => toggleFaq(idx)}
                    className="w-full text-left px-4 py-3.5 flex items-center justify-between gap-3 cursor-pointer hover:bg-canvas transition-colors"
                    aria-expanded={isOpen}
                  >
                    <span className="text-xs sm:text-sm font-serif-th font-semibold text-ink">
                      {faq.q}
                    </span>
                    <span
                      className={`text-xs text-gold-ink transition-transform duration-200 ${
                        isOpen ? "rotate-180" : ""
                      }`}
                      aria-hidden="true"
                    >
                      ▾
                    </span>
                  </button>
                  {isOpen && (
                    <div className="px-4 pb-4 pt-1 text-xs sm:text-sm text-muted leading-relaxed font-sans border-t border-line/40 bg-surface">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
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
