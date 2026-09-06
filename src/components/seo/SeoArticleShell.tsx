"use client";

import React, { useState } from "react";
import Link from "next/link";

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
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  const toggleFaq = (idx: number) => {
    setOpenFaqIndex((prev) => (prev === idx ? null : idx));
  };

  return (
    <section
      className={`altar-panel rounded-2xl p-5 sm:p-8 space-y-6 ${className}`}
    >
      {/* Header */}
      <div className="space-y-2 border-b border-[#D5CEC2] pb-4">
        <span className="text-xs font-serif-th font-semibold text-[#8F5C1A]">
          {eyebrow}
        </span>
        <h2 className="text-xl sm:text-2xl font-serif-th font-bold text-[#29261F] tracking-tight [text-wrap:balance]">
          {title}
        </h2>
      </div>

      {/* Main Editorial Content (Sarabun font for legibility) */}
      <div className="text-sm text-[#29261F] leading-relaxed space-y-4 font-sans">
        {children}
      </div>

      {/* FAQ Accordion Section if provided */}
      {faqs && faqs.length > 0 && (
        <div className="pt-6 border-t border-[#D5CEC2] space-y-4">
          <h3 className="text-base sm:text-lg font-serif-th font-bold text-[#29261F]">
            คำถามที่พบบ่อย (FAQ)
          </h3>
          <div className="divide-y divide-[#D5CEC2] rounded-xl border border-[#D5CEC2] bg-[#FAF7F2] overflow-hidden">
            {faqs.map((faq, idx) => {
              const isOpen = openFaqIndex === idx;
              return (
                <div key={idx} className="transition-colors">
                  <button
                    type="button"
                    onClick={() => toggleFaq(idx)}
                    className="w-full text-left px-4 py-3.5 flex items-center justify-between gap-3 cursor-pointer hover:bg-[#F3F0EA] transition-colors"
                    aria-expanded={isOpen}
                  >
                    <span className="text-xs sm:text-sm font-serif-th font-semibold text-[#29261F]">
                      {faq.q}
                    </span>
                    <span
                      className={`text-xs text-[#8F5C1A] transition-transform duration-200 ${
                        isOpen ? "rotate-180" : ""
                      }`}
                      aria-hidden="true"
                    >
                      ▾
                    </span>
                  </button>
                  {isOpen && (
                    <div className="px-4 pb-4 pt-1 text-xs sm:text-sm text-[#635B4E] leading-relaxed font-sans border-t border-[#D5CEC2]/40 bg-[#FFFFFF]">
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
        <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 text-xs font-serif-th text-[#635B4E] pt-4 border-t border-[#D5CEC2]">
          {links.map((link, idx) => (
            <React.Fragment key={idx}>
              {idx > 0 && (
                <span className="text-[#D5CEC2]" aria-hidden="true">
                  ·
                </span>
              )}
              <Link
                href={link.href}
                className="hover:text-[#29261F] underline underline-offset-4 transition-colors"
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
