"use client";

import React from "react";

import { CardImage } from "@/components/card/CardImage";

// ============================================================================
// 1. ORACLE GUIDES (3 PERSONAS - 1909 RIDER-WAITE)
// ============================================================================

export const HighPriestessIllustration: React.FC<{ className?: string }> = ({ className = "w-20 h-32 mx-auto" }) => (
  <div className={`relative rounded-lg overflow-hidden border-2 border-line-warm ${className}`}>
    <CardImage
      image="major-02.jpg"
      alt="The High Priestess"
      className="w-full h-full object-cover object-center tarot-hd-card-image"
      sizes="80px"
    />
  </div>
);

export const JusticeIllustration: React.FC<{ className?: string }> = ({ className = "w-20 h-32 mx-auto" }) => (
  <div className={`relative rounded-lg overflow-hidden border-2 border-line-warm ${className}`}>
    <CardImage
      image="major-11.jpg"
      alt="Justice"
      className="w-full h-full object-cover object-center tarot-hd-card-image"
      sizes="80px"
    />
  </div>
);

export const HermitIllustration: React.FC<{ className?: string }> = ({ className = "w-20 h-32 mx-auto" }) => (
  <div className={`relative rounded-lg overflow-hidden border-2 border-line-warm ${className}`}>
    <CardImage
      image="major-09.jpg"
      alt="The Hermit"
      className="w-full h-full object-cover object-center tarot-hd-card-image"
      sizes="80px"
    />
  </div>
);

export const TheStarIllustration: React.FC<{ className?: string }> = ({ className = "w-20 h-32 mx-auto" }) => (
  <div className={`relative rounded-lg overflow-hidden border-2 border-line-warm ${className}`}>
    <CardImage
      image="major-17.jpg"
      alt="The Star"
      className="w-full h-full object-cover object-center tarot-hd-card-image"
      sizes="80px"
    />
  </div>
);

export const MagicianIllustration: React.FC<{ className?: string }> = ({ className = "w-20 h-32 mx-auto" }) => (
  <div className={`relative rounded-lg overflow-hidden border-2 border-line-warm ${className}`}>
    <CardImage
      image="major-01.jpg"
      alt="The Magician"
      className="w-full h-full object-cover object-center tarot-hd-card-image"
      sizes="80px"
    />
  </div>
);

// ============================================================================
// 2. CATEGORY TAB ICONS (Minimal Line-Art)
// ============================================================================

interface IconProps {
  className?: string;
}

/**
 * ไอคอน "ไพ่ทั้งหมด / ชุดไพ่" — ไพ่ 4 ใบเรียงเป็นตาราง
 * ⚠️ ชื่อยังเป็น SparkleTabIcon ให้ผู้เรียกเดิมไม่พัง แต่ **ห้ามกลับไปวาดเป็นรูปประกาย** —
 *    รูปดาวสี่แฉกคือ ✦ ในรูปเวกเตอร์ ผิดกฎห้ามสัญลักษณ์ตกแต่ง (เจ้าของ 2026-10-16 "อีโมจิทุกรูปแบบบนหน้าเว็บห้ามใช้")
 */
export const SparkleTabIcon: React.FC<IconProps> = ({ className = "w-4 h-4" }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinejoin="round" className={className} aria-hidden="true">
    <rect x="4" y="3.5" width="6.5" height="8" rx="1.2" />
    <rect x="13.5" y="3.5" width="6.5" height="8" rx="1.2" />
    <rect x="4" y="13.5" width="6.5" height="8" rx="1.2" />
    <rect x="13.5" y="13.5" width="6.5" height="8" rx="1.2" />
  </svg>
);

export const PentacleTabIcon: React.FC<IconProps> = ({ className = "w-4 h-4" }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.4}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    <circle cx="12" cy="12" r="8.3" />
    <path d="M12 7 L13.2 10.4 L16.8 10.5 L13.9 12.6 L14.9 16.1 L12 14 L9.1 16.1 L10.1 12.6 L7.2 10.5 L10.8 10.4 Z" />
  </svg>
);

// ── ไอคอนเส้นชุดเสริม (แทนอิโมจิการ์ตูน — กฎเหล็กข้อ 2) ─────────────────────

const line = (className: string) => ({
  viewBox: "0 0 24 24",
  fill: "none" as const,
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  className,
  "aria-hidden": true as const,
});

export const SpeakerTabIcon: React.FC<IconProps> = ({ className = "w-4 h-4" }) => (
  <svg {...line(className)}>
    <path d="M4 9.5h3.2L12 5.6v12.8L7.2 14.5H4z" />
    <path d="M15.4 9.6a3.6 3.6 0 0 1 0 4.8" />
    <path d="M17.8 7.2a7 7 0 0 1 0 9.6" />
  </svg>
);

export const CrownTabIcon: React.FC<IconProps> = ({ className = "w-4 h-4" }) => (
  <svg {...line(className)}>
    <path d="M4 17.5h16" />
    <path d="M4.5 8 8 11.5 12 5.5l4 6L19.5 8l-1.4 8H5.9z" />
  </svg>
);

export const FireElementIcon: React.FC<IconProps> = ({ className = "w-4 h-4" }) => (
  <svg {...line(className)}>
    <path d="M12 3.5c2.6 3 4 5.2 4 7a4 4 0 0 1-8 0c0-1 .4-2 1.2-3.1.5 1.3 1.3 2 2.1 2 0-2 .2-3.9.7-5.9Z" />
    <path d="M8 14.5a4 4 0 0 0 8 0" />
  </svg>
);

export const WaterElementIcon: React.FC<IconProps> = ({ className = "w-4 h-4" }) => (
  <svg {...line(className)}>
    <path d="M12 3.6c3.2 4 5 6.6 5 8.9a5 5 0 0 1-10 0c0-2.3 1.8-4.9 5-8.9Z" />
  </svg>
);

export const AirElementIcon: React.FC<IconProps> = ({ className = "w-4 h-4" }) => (
  <svg {...line(className)}>
    <path d="M3.5 8.5h11a2.6 2.6 0 1 0-2.6-2.6" />
    <path d="M3.5 12.5h14a2.6 2.6 0 1 1-2.6 2.6" />
    <path d="M3.5 16.5h7" />
  </svg>
);

export const ExpandTabIcon: React.FC<IconProps> = ({ className = "w-4 h-4" }) => (
  <svg {...line(className)}>
    <path d="M9 4.5H4.5V9M15 4.5h4.5V9M9 19.5H4.5V15M15 19.5h4.5V15" />
  </svg>
);
