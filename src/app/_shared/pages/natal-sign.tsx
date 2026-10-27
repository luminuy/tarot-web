import type { Metadata } from "next";
import { SiderealTime, MakeTime, e_tilt } from "astronomy-engine";

import { RitualHero } from "@/components/reading/one-card/RitualHero";
import { Ui2Window } from "@/components/ui2/Ui2Showcase";
import { SeoArticleShell, type SeoFaqItem } from "@/components/seo/SeoArticleShell";
import { CardImage } from "@/components/card/CardImage";
import { LocaleLink as Link } from "@/components/ui/LocaleLink";
import { ThaiPhrases } from "@/components/ui/ThaiPhrases";
import { Ui2NextSteps } from "@/components/ui2/Ui2NextSteps";
import { CARD_SUMMARIES } from "@/data/cards/summary";
import { ZODIAC_ELEMENT_LABEL, ZODIAC_MODALITY_LABEL, ZODIAC_SIGNS, getZodiacSign } from "@/data/zodiac";
import { BODY_TEXT, MOON_SIGN_TEXT, RISING_TEXT, SIGN_TEXT } from "@/data/natal/content";
import { MOON_EXTRA, RISING_EXTRA } from "@/data/natal/sign-pages";
import { TRADITIONAL_RULER, ascAt, norm360 } from "@/lib/astro/natal";
import { clampDescription, pickTitle } from "@/lib/config/meta-length";
import { buildAlternates, localizedUrl } from "@/lib/config/site";
import { buildPageOgImage } from "@/lib/media/og-image";
import { jsonLdScript } from "@/lib/seo/json-ld";
import { localeHref } from "@/lib/i18n/paths";
import type { Locale } from "@/lib/i18n/types";
import { zodiacSignPath } from "@/lib/tarot/zodiac";

import { buildBreadcrumbJsonLd, homeCrumb } from "../seo";

/**
 * 📄 หน้า "ลัคนาราศี…" `/natal-chart/rising/<ราศี>` และ "ดวงจันทร์ราศี…" `/natal-chart/moon/<ราศี>` (12 + 12 · สองภาษา)
 * ---------------------------------------------------------------------------
 * หน้า HTML คงที่ทั้งหมด (ไม่มี island) · ตารางเวลาลัคนาขึ้นคำนวณตอนบิลด์ด้วยสูตรเดียวกับเครื่องคำนวณผัง
 * แผน: docs/plans/NATAL_CHART_PLAN_2026-10-27.md
 */

export type NatalSignKind = "rising" | "moon";

export function natalSignPath(kind: NatalSignKind, signId: string): string {
  return `/natal-chart/${kind}/${signId}`;
}

export function natalSignStaticParams(): { sign: string }[] {
  return ZODIAC_SIGNS.map((s) => ({ sign: s.id }));
}

const cardById = new Map(CARD_SUMMARIES.map((c) => [c.id, c]));

function card(id: string) {
  const c = cardById.get(id);
  // กฎข้อ 14: รหัสไพ่หาไม่เจอ = ข้อมูลเสีย ต้องล้มตอนบิลด์ ห้ามเดาไพ่ใบอื่น
  if (!c) throw new Error(`natal-sign: ไม่พบไพ่ ${id}`);
  return c;
}

function signLabel(i: number, locale: Locale): string {
  return locale === "en" ? ZODIAC_SIGNS[i].nameEn : ZODIAC_SIGNS[i].nameTh;
}

/**
 * ช่วงเวลาที่ลัคนาอยู่ในราศีนี้ สำหรับคนเกิดกรุงเทพฯ วันที่ 15 ของแต่ละเดือน (เวลาไทย)
 * คำนวณตอนบิลด์: สแกนทุก 2 นาทีด้วยสูตรลัคนาเดียวกับเครื่องคำนวณ · ปี ค.ศ. 2000 (ปีอื่นต่างกันไม่กี่นาที)
 */
const risingCache = new Map<number, { month: number; from: string; to: string }[]>();
export function risingWindows(signIndex: number): { month: number; from: string; to: string }[] {
  const hit = risingCache.get(signIndex);
  if (hit) return hit;
  const LAT = 13.7525;
  const LON = 100.4942;
  const out: { month: number; from: string; to: string }[] = [];
  const hhmm = (min: number) =>
    `${String(Math.floor(min / 60) % 24).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`;
  for (let m = 1; m <= 12; m++) {
    // เที่ยงคืนเวลาไทยของวันที่ 15 = 17:00 UTC ของวันที่ 14
    const start = Date.UTC(2000, m - 1, 14, 17, 0);
    const eps = e_tilt(MakeTime(new Date(start))).tobl;
    const inSign: boolean[] = [];
    for (let k = 0; k < 720; k++) {
      const t = MakeTime(new Date(start + k * 120000));
      const ramc = norm360(SiderealTime(t) * 15 + LON);
      inSign.push(Math.floor(ascAt(ramc, LAT, eps) / 30) === signIndex);
    }
    // หาช่วงต่อเนื่อง (ราศีหนึ่งขึ้นครั้งเดียวต่อวัน อาจคร่อมเที่ยงคืน)
    let first = inSign.findIndex((v, k) => v && !inSign[(k + 719) % 720]);
    if (first < 0) first = inSign.indexOf(true);
    if (first < 0) continue;
    let len = 0;
    while (len < 720 && inSign[(first + len) % 720]) len++;
    out.push({ month: m, from: hhmm(first * 2), to: hhmm((first + len) * 2 - 1 < 0 ? 0 : (first + len) * 2 - 1) });
  }
  risingCache.set(signIndex, out);
  return out;
}

const MONTHS_TH = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
const MONTHS_EN = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function natalSignMetadata(kind: NatalSignKind, signId: string, locale: Locale): Metadata {
  const sign = getZodiacSign(signId);
  if (!sign) throw new Error(`natal-sign: ไม่พบราศี ${signId}`);
  const isEnglish = locale === "en";
  const name = isEnglish ? sign.nameEn : sign.nameTh.replace("ราศี", "");
  const title =
    kind === "rising"
      ? isEnglish
        ? pickTitle([`${name} Rising: Personality, Love and Career + Tarot Card`, `${name} Rising Sign Meaning`])
        : pickTitle([`ลัคนาราศี${name} นิสัย ความรัก การงาน และไพ่ทาโรต์ประจำลัคนา`, `ลัคนาราศี${name} หมายถึงอะไร`])
      : isEnglish
        ? pickTitle([`Moon in ${name}: Emotional Needs, Love and Self-Care`, `Moon in ${name} Meaning`])
        : pickTitle([`ดวงจันทร์ราศี${name} อารมณ์ ความรัก และวิธีดูแลใจ`, `ดวงจันทร์ราศี${name} หมายถึงอะไร`]);
  const i = ZODIAC_SIGNS.indexOf(sign);
  const lead = kind === "rising" ? RISING_TEXT[i][isEnglish ? "en" : "th"] : MOON_SIGN_TEXT[i][isEnglish ? "en" : "th"];
  const description = clampDescription(
    isEnglish
      ? `${lead} Find out if you are ${kind === "rising" ? `${name} rising` : `a ${name} Moon`} with our free natal chart calculator.`
      : `${lead} คำนวณ${kind === "rising" ? "ลัคนา" : "ราศีจันทร์"}ของคุณฟรีด้วยเครื่องคำนวณผังดวงกำเนิด`
  );
  const path = natalSignPath(kind, sign.id);
  const ogImages = buildPageOgImage({
    title: isEnglish
      ? kind === "rising"
        ? `${name} Rising`
        : `Moon in ${name}`
      : kind === "rising"
        ? `ลัคนาราศี${name}`
        : `ดวงจันทร์ราศี${name}`,
    eyebrow: isEnglish ? "NATAL CHART" : "ผังดวงกำเนิด",
    cardImage: `${sign.majorCardId}.jpg`,
    alt: isEnglish
      ? `${name} ${kind === "rising" ? "rising" : "Moon"} and its tarot card`
      : `${kind === "rising" ? "ลัคนา" : "ดวงจันทร์"}ราศี${name} และไพ่ทาโรต์ประจำราศี`,
  });
  return {
    title,
    description,
    keywords: isEnglish
      ? [`${name} rising`, `${name} ascendant`, `moon in ${name}`, "rising sign meaning", "natal chart"]
      : kind === "rising"
        ? [`ลัคนาราศี${name}`, `ลัคนา${name}`, "ลัคนาราศีอะไร", "คำนวณลัคนา", "ผังดวงกำเนิด"]
        : [`ดวงจันทร์ราศี${name}`, `ราศีจันทร์${name}`, "ราศีจันทร์คืออะไร", "ผังดวงกำเนิด"],
    alternates: buildAlternates(path, { locale, englishTwin: true }),
    openGraph: {
      title,
      description,
      url: localizedUrl(path, locale),
      siteName: "SeerTarot",
      type: "article",
      locale: isEnglish ? "en_US" : "th_TH",
      images: ogImages,
    },
    twitter: { card: "summary_large_image", title, description, images: [ogImages[0].url] },
  };
}

function JsonLd({ data }: { data: unknown }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(data) }} />;
}

/** ดวงจันทร์ที่เข้ากันง่าย: ธาตุเดียวกัน + ธาตุคู่หนุน (ไฟ-ลม · ดิน-น้ำ) */
function friendlyMoons(i: number): number[] {
  const el = ZODIAC_SIGNS[i].element;
  const pair = { fire: "air", air: "fire", earth: "water", water: "earth" }[el];
  return ZODIAC_SIGNS.map((s, k) => ({ s, k }))
    .filter(({ s, k }) => k !== i && (s.element === el || s.element === pair))
    .map(({ k }) => k);
}

export function NatalSignBody({ kind, signId, locale }: { kind: NatalSignKind; signId: string; locale: Locale }) {
  const sign = getZodiacSign(signId);
  if (!sign) throw new Error(`natal-sign: ไม่พบราศี ${signId}`);
  const isEnglish = locale === "en";
  const lang = isEnglish ? "en" : "th";
  const i = ZODIAC_SIGNS.indexOf(sign);
  const name = isEnglish ? sign.nameEn : sign.nameTh.replace("ราศี", "");
  const path = natalSignPath(kind, sign.id);
  const h = (p: string) => localeHref(p, locale);
  const kindLabel = kind === "rising" ? (isEnglish ? "Rising sign" : "ลัคนา") : isEnglish ? "Moon sign" : "ราศีจันทร์";
  const title =
    kind === "rising"
      ? isEnglish
        ? `${name} Rising`
        : `ลัคนาราศี${name}`
      : isEnglish
        ? `Moon in ${name}`
        : `ดวงจันทร์ราศี${name}`;
  const major = card(sign.majorCardId);
  const decans = sign.decans.map((d) => card(d.cardId));
  const sp = SIGN_TEXT[i];

  const faqs: SeoFaqItem[] =
    kind === "rising"
      ? isEnglish
        ? [
            {
              q: "How do I know if I am " + name + " rising?",
              a: "Your rising sign depends on your exact birth time and place. Enter them in the free natal chart calculator; the table on this page only shows typical times for Bangkok births.",
            },
            {
              q: "Is the rising sign more important than the Sun sign?",
              a: "Neither is more important. The Sun is your core self, the Moon your emotional needs, and the rising sign how you meet the world and how others first see you.",
            },
          ]
        : [
            {
              q: `รู้ได้ยังไงว่าเป็นลัคนาราศี${name}`,
              a: "ลัคนาขึ้นกับเวลาและสถานที่เกิดแบบนาทีต่อนาที ใส่ข้อมูลในเครื่องคำนวณผังดวงกำเนิดเพื่อดูลัคนาที่แม่นยำ ตารางในหน้านี้เป็นเวลาโดยประมาณสำหรับคนเกิดกรุงเทพฯ",
            },
            {
              q: "ลัคนาสำคัญกว่าราศีเกิดไหม?",
              a: "ไม่มีอันไหนสำคัญกว่ากัน ราศีเกิด (ดวงอาทิตย์) คือแก่นตัวตน ดวงจันทร์คือใจ ส่วนลัคนาคือวิธีที่คุณเข้าหาโลกและภาพแรกที่คนเห็น",
            },
            {
              q: "ลัคนาในหน้านี้ตรงกับลัคนาแบบโหราไทยไหม?",
              a: "ไม่ตรงเสมอไป หน้านี้ใช้โหราศาสตร์สากล (Tropical) ส่วนโหราไทยใช้ระบบสุริยยาตร์ที่เลื่อนไปราว 24 องศา ลัคนาจึงอาจต่างกันหนึ่งราศี",
            },
          ]
      : isEnglish
        ? [
            {
              q: `How do I know if my Moon is in ${name}?`,
              a: "The Moon changes sign every two to three days, so you need your birth date (and ideally time). The free natal chart calculator shows your Moon sign and warns you if it changed sign on your birthday.",
            },
            {
              q: "What does the Moon sign mean?",
              a: "The Moon describes your emotional needs, what makes you feel safe and how you comfort yourself. It often explains reactions your Sun sign does not.",
            },
          ]
        : [
            {
              q: `รู้ได้ยังไงว่าดวงจันทร์อยู่ราศี${name}`,
              a: "ดวงจันทร์ย้ายราศีทุก 2 ถึง 3 วัน จึงต้องใช้วันเกิด (และเวลาเกิดถ้ามี) ใส่ในเครื่องคำนวณผังดวงกำเนิดฟรี ระบบจะบอกราศีจันทร์และเตือนถ้าวันเกิดของคุณดวงจันทร์ย้ายราศีพอดี",
            },
            {
              q: "ราศีจันทร์หมายถึงอะไร?",
              a: "ดวงจันทร์บอกความต้องการทางใจ สิ่งที่ทำให้รู้สึกปลอดภัย และวิธีปลอบใจตัวเอง มักอธิบายปฏิกิริยาทางอารมณ์ที่ราศีเกิดอธิบายไม่ได้",
            },
          ];
  const breadcrumbs = isEnglish
    ? [{ label: "Home", href: "/" }, { label: "Natal Chart", href: "/natal-chart" }, { label: title }]
    : [{ label: "หน้าแรก", href: "/" }, { label: "ผังดวงกำเนิด", href: "/natal-chart" }, { label: title }];
  const breadcrumbJsonLd = buildBreadcrumbJsonLd(locale, [
    homeCrumb(locale),
    { name: isEnglish ? "Natal Chart" : "ผังดวงกำเนิด", path: "/natal-chart" },
    { name: title, path },
  ]);
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
  };
  const ruler = TRADITIONAL_RULER[i];
  const rulerCard = BODY_TEXT[ruler].cardId ? card(BODY_TEXT[ruler].cardId!) : null;
  const windows = kind === "rising" ? risingWindows(i) : [];
  const ex = kind === "rising" ? RISING_EXTRA[i] : null;
  const mx = kind === "moon" ? MOON_EXTRA[i] : null;

  const section = (head: string, body: string) => (
    <div className="altar-card-porcelain rounded-xl p-4 space-y-1.5">
      <h3 className="font-serif-th font-bold text-ink">
        <ThaiPhrases>{head}</ThaiPhrases>
      </h3>
      <p className="text-sm text-ink leading-relaxed">{body}</p>
    </div>
  );

  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="min-h-screen text-ink py-6 sm:py-10 px-4 sm:px-6 font-sans relative overflow-x-clip"
    >
      <JsonLd data={breadcrumbJsonLd} />
      <JsonLd data={faqJsonLd} />
      <div className="max-w-4xl mx-auto space-y-10">
        <RitualHero
          tone="star"
          breadcrumbs={breadcrumbs}
          badgeText={isEnglish ? "Natal chart" : "ผังดวงกำเนิด"}
          title={title}
          accent={name}
          tagline={kind === "rising" ? RISING_TEXT[i][lang] : MOON_SIGN_TEXT[i][lang]}
        />

        <Ui2Window n="01" kicker={kindLabel} tone={kind === "rising" ? 7 : 4}>
          <div className="space-y-4">
            <h2 className="text-lg sm:text-xl font-serif-th font-bold text-ink text-center">
              <ThaiPhrases>{isEnglish ? `What ${title} means` : `${title} เป็นคนแบบไหน`}</ThaiPhrases>
            </h2>
            <p className="text-sm text-muted text-center">
              {ZODIAC_ELEMENT_LABEL[sign.element][lang]} · {ZODIAC_MODALITY_LABEL[sign.modality][lang]} ·{" "}
              {sp.keywords[lang]}
            </p>
            <div className="grid gap-3 md:grid-cols-2">
              {ex && (
                <>
                  {section(isEnglish ? "First impression and style" : "ภาพแรกและสไตล์", ex.look[lang])}
                  {section(isEnglish ? "In love" : "ความรัก", ex.love[lang])}
                  {section(isEnglish ? "At work" : "การงาน", ex.work[lang])}
                  {section(isEnglish ? "Advice" : "คำแนะนำ", ex.advice[lang])}
                </>
              )}
              {mx && (
                <>
                  {section(isEnglish ? "In love" : "ความรัก", mx.love[lang])}
                  {section(isEnglish ? "Looking after your heart" : "ดูแลใจตัวเอง", mx.care[lang])}
                </>
              )}
              {section(
                isEnglish ? "Strength" : "จุดแข็ง",
                isEnglish ? `This placement draws on ${sp.gift.en}.` : `ตำแหน่งนี้ได้พลังจาก${sp.gift.th}`
              )}
              {section(
                isEnglish ? "Watch out for" : "สิ่งที่ต้องระวัง",
                isEnglish ? `${sp.watch.en.charAt(0).toUpperCase()}${sp.watch.en.slice(1)}.` : sp.watch.th
              )}
            </div>
            {kind === "rising" && (
              <p className="text-sm text-ink border-l-2 border-gold-ink pl-2">
                {isEnglish
                  ? `Your chart ruler is ${BODY_TEXT[ruler].name.en}. Look at its sign and house in your chart to see where your life energy is directed.`
                  : `เจ้าเรือนลัคนาราศี${name}คือ${BODY_TEXT[ruler].name.th} ดูว่าดาวดวงนี้อยู่ราศีและเรือนไหนในผังของคุณ จะรู้ว่าพลังชีวิตของคุณไหลไปทางไหน`}
              </p>
            )}
          </div>
        </Ui2Window>

        <Ui2Window n="02" kicker={isEnglish ? "Tarot cards" : "ไพ่ทาโรต์ประจำ"} tone={3}>
          <div className="space-y-4">
            <h2 className="text-lg sm:text-xl font-serif-th font-bold text-ink text-center">
              <ThaiPhrases>{isEnglish ? `Tarot cards for ${title}` : `ไพ่ทาโรต์ประจำ${title}`}</ThaiPhrases>
            </h2>
            <p className="text-sm text-muted text-center">
              {isEnglish
                ? "In the Golden Dawn system behind the 1909 deck, each sign has a Major Arcana card and each ten degrees a numbered card."
                : "ระบบ Golden Dawn ที่อยู่เบื้องหลังไพ่ 1909 ผูกไพ่ชุดใหญ่กับแต่ละราศี และไพ่เลข 2 ถึง 10 กับช่วงละ 10 องศา"}
            </p>
            <ul className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { c: major, label: isEnglish ? "Sign card" : "ไพ่ประจำราศี" },
                ...decans.map((c, k) => ({
                  c,
                  label: isEnglish ? `${k * 10} to ${k * 10 + 10} degrees` : `${k * 10} ถึง ${k * 10 + 10} องศา`,
                })),
                ...(kind === "rising" && rulerCard
                  ? [
                      {
                        c: rulerCard,
                        label: isEnglish
                          ? `Ruler: ${BODY_TEXT[ruler].name.en}`
                          : `เจ้าเรือน: ${BODY_TEXT[ruler].name.th}`,
                      },
                    ]
                  : []),
                ...(kind === "moon"
                  ? [{ c: card("major-02"), label: isEnglish ? "The Moon's card" : "ไพ่ประจำดวงจันทร์" }]
                  : []),
              ].map(({ c, label }) => (
                <li key={`${label}-${c.id}`} className="text-center space-y-1">
                  <Link href={h(`/cards/${c.id}`)} className="block">
                    <CardImage
                      cardId={c.id}
                      image={c.image}
                      alt={isEnglish ? c.nameEn : `${c.nameTh} (${c.nameEn})`}
                      sizes="(max-width: 640px) 40vw, 160px"
                      loading="lazy"
                      className="w-full max-w-[140px] mx-auto aspect-[1/1.7] rounded-lg border border-line-warm object-cover"
                    />
                  </Link>
                  <p className="text-xs text-muted">{label}</p>
                  <p className="text-sm font-semibold text-ink">{isEnglish ? c.nameEn : c.nameTh}</p>
                </li>
              ))}
            </ul>
            <p className="text-center text-sm">
              <Link href={h(zodiacSignPath(sign.id))} className="underline text-gold-ink">
                {isEnglish ? `More about ${sign.nameEn} and its cards` : `อ่านเรื่อง${sign.nameTh}และไพ่ประจำราศีต่อ`}
              </Link>
            </p>
          </div>
        </Ui2Window>

        {kind === "rising" && windows.length > 0 && (
          <Ui2Window n="03" kicker={isEnglish ? "Rising times" : "เวลาที่ลัคนานี้ขึ้น"} tone={5}>
            <div className="space-y-3">
              <h2 className="text-lg sm:text-xl font-serif-th font-bold text-ink text-center">
                <ThaiPhrases>
                  {isEnglish
                    ? `When is ${name} rising? (Bangkok births)`
                    : `เกิดเวลาไหนได้ลัคนาราศี${name} (คนเกิดกรุงเทพฯ)`}
                </ThaiPhrases>
              </h2>
              <p className="text-sm text-muted text-center">
                {isEnglish
                  ? "Approximate local time on the 15th of each month. Dates near the start or end of a month shift by about 4 minutes per day, and other places differ, so use the calculator for your exact rising sign."
                  : "เวลาโดยประมาณของวันที่ 15 ในแต่ละเดือน (เวลาไทย) วันอื่นในเดือนเลื่อนไปราววันละ 4 นาที และต่างจังหวัดต่างกันเล็กน้อย หาลัคนาที่แม่นยำด้วยเครื่องคำนวณ"}
              </p>
              <table className="v2-nt-table max-w-md mx-auto">
                <thead>
                  <tr>
                    <th scope="col">{isEnglish ? "Born around" : "เกิดราววันที่"}</th>
                    <th scope="col">{isEnglish ? "Time window" : "ช่วงเวลา"}</th>
                  </tr>
                </thead>
                <tbody>
                  {windows.map((w) => (
                    <tr key={w.month}>
                      <td>{isEnglish ? `15 ${MONTHS_EN[w.month - 1]}` : `15 ${MONTHS_TH[w.month - 1]}`}</td>
                      <td className="tabular-nums">
                        {w.from} {isEnglish ? "to" : "ถึง"} {w.to}
                        {isEnglish ? "" : " น."}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Ui2Window>
        )}

        {kind === "moon" && (
          <Ui2Window n="03" kicker={isEnglish ? "Easy matches" : "ดวงจันทร์ที่เข้ากันง่าย"} tone={5}>
            <div className="space-y-3 text-center">
              <h2 className="text-lg sm:text-xl font-serif-th font-bold text-ink text-center">
                <ThaiPhrases>
                  {isEnglish
                    ? `Moons that get along with the ${name} Moon`
                    : `จันทร์ราศี${name} เข้ากับจันทร์ราศีไหนง่าย`}
                </ThaiPhrases>
              </h2>
              <p className="text-sm text-muted">
                {isEnglish
                  ? "Moons in the same element, or a supportive one (fire with air, earth with water), tend to understand each other's emotional needs easily. Use the synastry tab in the calculator for the full picture."
                  : "ดวงจันทร์ธาตุเดียวกัน หรือธาตุที่เกื้อกูลกัน (ไฟกับลม ดินกับน้ำ) มักเข้าใจความต้องการทางใจของกันได้ง่าย ดูภาพเต็มได้ที่แท็บผังคู่ในเครื่องคำนวณ"}
              </p>
              <ul className="flex flex-wrap justify-center gap-2">
                {friendlyMoons(i).map((k) => (
                  <li key={k}>
                    <Link
                      href={h(natalSignPath("moon", ZODIAC_SIGNS[k].id))}
                      className="inline-block rounded-full border border-line-warm bg-surface px-3 py-1.5 text-sm text-ink hover:border-gold-ink"
                    >
                      {isEnglish ? `Moon in ${ZODIAC_SIGNS[k].nameEn}` : `จันทร์${signLabel(k, locale)}`}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </Ui2Window>
        )}

        <div className="text-center">
          <Link
            href={h("/natal-chart")}
            className="btn-gold-glass inline-block py-3 px-8 text-sm font-serif-th font-bold"
          >
            {isEnglish ? "Calculate your full natal chart" : "คำนวณผังดวงกำเนิดของคุณ"}
          </Link>
        </div>

        <SeoArticleShell
          eyebrow={kindLabel}
          title={
            isEnglish
              ? `All ${kind === "rising" ? "rising signs" : "Moon signs"}`
              : `${kind === "rising" ? "ลัคนา" : "ดวงจันทร์"}ครบ 12 ราศี`
          }
          faqs={faqs}
          links={[
            ...ZODIAC_SIGNS.filter((s) => s.id !== sign.id).map((s) => ({
              label:
                kind === "rising"
                  ? isEnglish
                    ? `${s.nameEn} Rising`
                    : `ลัคนา${s.nameTh}`
                  : isEnglish
                    ? `Moon in ${s.nameEn}`
                    : `จันทร์${s.nameTh}`,
              href: h(natalSignPath(kind, s.id)),
            })),
            {
              label:
                kind === "rising"
                  ? isEnglish
                    ? `Moon in ${sign.nameEn}`
                    : `ดวงจันทร์${sign.nameTh}`
                  : isEnglish
                    ? `${sign.nameEn} Rising`
                    : `ลัคนา${sign.nameTh}`,
              href: h(natalSignPath(kind === "rising" ? "moon" : "rising", sign.id)),
            },
          ]}
        >
          <p className="text-xs sm:text-sm text-muted leading-relaxed">
            {kind === "rising"
              ? isEnglish
                ? "The rising sign (Ascendant) is the zodiac sign on the eastern horizon at the moment you were born. It changes about every two hours, which is why two people born on the same day can have very different first impressions."
                : "ลัคนาคือราศีที่กำลังขึ้นทางขอบฟ้าตะวันออก ณ นาทีที่คุณเกิด เปลี่ยนราศีทุกราว 2 ชั่วโมง คนเกิดวันเดียวกันจึงมีภาพแรกต่างกันได้มาก"
              : isEnglish
                ? "The Moon moves through a whole sign in about two and a half days. Your Moon sign shows the emotional language you speak, which is why people with the same Sun sign can react to life so differently."
                : "ดวงจันทร์เดินผ่านหนึ่งราศีในราว 2 วันครึ่ง ราศีจันทร์บอกภาษาทางใจของคุณ คนราศีเกิดเดียวกันจึงตอบสนองต่อชีวิตต่างกันได้มาก"}
          </p>
        </SeoArticleShell>
      </div>
      <Ui2NextSteps isEn={isEnglish} keys={["spreads", "daily", "journal", "cards"]} />
    </main>
  );
}
