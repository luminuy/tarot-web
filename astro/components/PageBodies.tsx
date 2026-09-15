import type { ReactNode } from "react";

import { AboutBodyTh } from "@/app/_shared/pages/about-th";
import { DailyBodyEn } from "@/app/_shared/pages/daily-en";
import { DailyBodyTh } from "@/app/_shared/pages/daily-th";
import { LoveOneCardBodyEn } from "@/app/_shared/pages/love-one-card-en";
import { LoveOneCardBodyTh } from "@/app/_shared/pages/love-one-card-th";
import { ContactBodyEn } from "@/app/_shared/pages/contact-en";
import { ContactBodyTh } from "@/app/_shared/pages/contact-th";
import { PrivacyBodyEn } from "@/app/_shared/pages/privacy-en";
import { PrivacyBodyTh } from "@/app/_shared/pages/privacy-th";
import { BlogDetailContent } from "@/app/_shared/pages/blog-detail";
import { BlogIndexBody } from "@/app/_shared/pages/blog-index";
import { SpreadDetailContent } from "@/app/_shared/pages/spread-detail";
import { SpreadTopicContent } from "@/app/_shared/pages/spread-topic";
import { SpreadsIndexBody } from "@/app/_shared/pages/spreads-index";
import type { Article } from "@/data/articles";
import type { SpreadTopic } from "@/data/spread-topics";
import type { Spread } from "@/data/spreads-helpers";
import { BirthCardBodyEn } from "@/app/_shared/pages/birth-card-en";
import { BirthCardBodyTh } from "@/app/_shared/pages/birth-card-th";
import { CardsAllBody } from "@/app/_shared/pages/cards-all";
import { CardsIndexBody } from "@/app/_shared/pages/cards-index";
import { CardGroupBody } from "@/app/_shared/pages/card-group";
import type { CardGroupInfo } from "@/data/cards/group-seo";
import { LocaleProvider } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n/types";

/**
 * 📄 เปลือกบาง ๆ ของ "เนื้อหาหน้า" ที่ Astro เรนเดอร์เป็น HTML **โดยไม่ hydrate**
 * ===========================================================================
 * ทุกตัวในไฟล์นี้ใช้คอมโพเนนต์ตัวเดียวกับที่ Next เรนเดอร์ หน้าที่มีอย่างเดียวคือ
 * ครอบ `LocaleProvider` ให้ (คอมโพเนนต์ลูกหลายตัวเรียก `useLocale()`)
 *
 * ⚠️ ห้ามใส่คอมโพเนนต์ที่ต้อง hydrate ลงในไฟล์นี้เด็ดขาด — ไฟล์ที่มี island อยู่
 *    จะถูกมัดรวมลงบันเดิลฝั่งไคลเอนต์ทั้งไฟล์ (บทเรียน 928 KB ใน `CardDetailRelated.tsx`)
 *    ส่วนที่ต้องโต้ตอบให้ส่งเข้ามาทาง slot จากหน้า `.astro` แทน
 */
export function CardsIndexBodyRoot({ locale, explorer }: { locale: Locale; explorer: ReactNode }) {
  return (
    <LocaleProvider forcedLocale={locale}>
      <CardsIndexBody locale={locale} explorer={explorer} />
    </LocaleProvider>
  );
}

export function CardsAllBodyRoot({ locale, table }: { locale: Locale; table: ReactNode }) {
  return (
    <LocaleProvider forcedLocale={locale}>
      <CardsAllBody locale={locale} table={table} />
    </LocaleProvider>
  );
}

/** 6 หน้าหมวดหมู่ไพ่ — ไม่มีสถานะสักตัว จึงไม่ต้องใช้ JS เลยแม้แต่ไบต์เดียว */
export function CardGroupBodyRoot({
  groupId,
  locale,
}: {
  groupId: CardGroupInfo["id"];
  locale: Locale;
}) {
  return (
    <LocaleProvider forcedLocale={locale}>
      <CardGroupBody groupId={groupId} locale={locale} />
    </LocaleProvider>
  );
}

export function BirthCardBodyThRoot({ calculator }: { calculator: ReactNode }) {
  return (
    <LocaleProvider forcedLocale="th">
      <BirthCardBodyTh calculator={calculator} />
    </LocaleProvider>
  );
}

export function BirthCardBodyEnRoot({ calculator }: { calculator: ReactNode }) {
  return (
    <LocaleProvider forcedLocale="en">
      <BirthCardBodyEn calculator={calculator} />
    </LocaleProvider>
  );
}

/* ── กลุ่มหน้าบทความ ─────────────────────────────────────────────────────── */

export function BlogIndexBodyRoot({ locale, list }: { locale: Locale; list: ReactNode }) {
  return (
    <LocaleProvider forcedLocale={locale}>
      <BlogIndexBody locale={locale} list={list} />
    </LocaleProvider>
  );
}

export function BlogDetailContentRoot({
  article,
  locale,
  reader,
}: {
  article: Article;
  locale: Locale;
  reader: ReactNode;
}) {
  return (
    <LocaleProvider forcedLocale={locale}>
      <BlogDetailContent article={article} locale={locale} reader={reader} />
    </LocaleProvider>
  );
}

/* ── กลุ่มหน้าผังพยากรณ์ ─────────────────────────────────────────────────── */

export function SpreadsIndexBodyRoot({ locale, library }: { locale: Locale; library: ReactNode }) {
  return (
    <LocaleProvider forcedLocale={locale}>
      <SpreadsIndexBody locale={locale} library={library} />
    </LocaleProvider>
  );
}

export function SpreadDetailContentRoot({
  spread,
  locale,
  detail,
}: {
  spread: Spread;
  locale: Locale;
  detail: ReactNode;
}) {
  return (
    <LocaleProvider forcedLocale={locale}>
      <SpreadDetailContent spread={spread} locale={locale} detail={detail} />
    </LocaleProvider>
  );
}

export function SpreadTopicContentRoot({
  topic,
  locale,
  list,
}: {
  topic: SpreadTopic;
  locale: Locale;
  list: ReactNode;
}) {
  return (
    <LocaleProvider forcedLocale={locale}>
      <SpreadTopicContent topic={topic} locale={locale} list={list} />
    </LocaleProvider>
  );
}

/* ── หน้าข้อมูลคงที่ (เกี่ยวกับเรา · ความเป็นส่วนตัว · ติดต่อ) ─────────────── */

export function AboutBodyThRoot() {
  return (
    <LocaleProvider forcedLocale="th">
      <AboutBodyTh />
    </LocaleProvider>
  );
}

export function PrivacyBodyThRoot({ deleteButton }: { deleteButton: ReactNode }) {
  return (
    <LocaleProvider forcedLocale="th">
      <PrivacyBodyTh deleteButton={deleteButton} />
    </LocaleProvider>
  );
}

export function PrivacyBodyEnRoot({ deleteButton }: { deleteButton: ReactNode }) {
  return (
    <LocaleProvider forcedLocale="en">
      <PrivacyBodyEn deleteButton={deleteButton} />
    </LocaleProvider>
  );
}

export function ContactBodyThRoot() {
  return (
    <LocaleProvider forcedLocale="th">
      <ContactBodyTh />
    </LocaleProvider>
  );
}

export function ContactBodyEnRoot() {
  return (
    <LocaleProvider forcedLocale="en">
      <ContactBodyEn />
    </LocaleProvider>
  );
}

/* ── หน้าแอปสาธารณะ (ไพ่ประจำวัน · ไพ่ความรักใบเดียว) ────────────────────── */

export function DailyBodyThRoot({ ritual }: { ritual: ReactNode }) {
  return (
    <LocaleProvider forcedLocale="th">
      <DailyBodyTh ritual={ritual} />
    </LocaleProvider>
  );
}

export function DailyBodyEnRoot({ ritual }: { ritual: ReactNode }) {
  return (
    <LocaleProvider forcedLocale="en">
      <DailyBodyEn ritual={ritual} />
    </LocaleProvider>
  );
}

export function LoveOneCardBodyThRoot({ ritual }: { ritual: ReactNode }) {
  return (
    <LocaleProvider forcedLocale="th">
      <LoveOneCardBodyTh ritual={ritual} />
    </LocaleProvider>
  );
}

export function LoveOneCardBodyEnRoot({ ritual }: { ritual: ReactNode }) {
  return (
    <LocaleProvider forcedLocale="en">
      <LoveOneCardBodyEn ritual={ritual} />
    </LocaleProvider>
  );
}
