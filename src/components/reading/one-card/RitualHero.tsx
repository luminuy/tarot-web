"use client";

import React from "react";
import Link from "next/link";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface RitualHeroProps {
  breadcrumbs: BreadcrumbItem[];
  badgeText: string;
  title: string;
  tagline: string;
}

export function RitualHero({
  breadcrumbs,
  badgeText,
  title,
  tagline,
}: RitualHeroProps) {
  return (
    <div className="space-y-4">
      {/* Breadcrumb Navigation */}
      <nav aria-label="Breadcrumb" className="text-xs font-serif-th text-[#635B4E]">
        <ol className="flex items-center gap-2 flex-wrap">
          {breadcrumbs.map((crumb, idx) => {
            const isLast = idx === breadcrumbs.length - 1;
            return (
              <React.Fragment key={idx}>
                {idx > 0 && (
                  <li aria-hidden="true" className="text-[#D5CEC2]">
                    /
                  </li>
                )}
                <li
                  className={isLast ? "font-semibold text-[#29261F]" : ""}
                  aria-current={isLast ? "page" : undefined}
                >
                  {crumb.href && !isLast ? (
                    <Link
                      href={crumb.href}
                      className="hover:text-[#29261F] transition-colors"
                    >
                      {crumb.label}
                    </Link>
                  ) : (
                    <span>{crumb.label}</span>
                  )}
                </li>
              </React.Fragment>
            );
          })}
        </ol>
      </nav>

      {/* Hero Header */}
      <header className="text-center space-y-3 pt-2 max-w-2xl mx-auto">
        {/* Sacred Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-[#D5CEC2] bg-[#FFFFFF] shadow-raised">
          <span className="text-xs font-serif-th font-semibold text-[#8F5C1A]">
            {badgeText}
          </span>
        </div>

        {/* H1 Title */}
        <h1 className="text-2xl sm:text-4xl font-serif-th font-bold text-[#29261F] tracking-tight leading-tight [text-wrap:balance]">
          {title}
        </h1>

        {/* Tagline */}
        <p className="text-xs sm:text-sm text-[#635B4E] max-w-xl mx-auto leading-relaxed [text-wrap:balance]">
          {tagline}
        </p>
      </header>
    </div>
  );
}
