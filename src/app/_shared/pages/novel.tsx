import type { Metadata } from "next";
import type { ReactNode } from "react";

import { CardImage } from "@/components/card/CardImage";
import { LocaleLink as Link } from "@/components/ui/LocaleLink";
import { ThaiPhrases } from "@/components/ui/ThaiPhrases";
import { Ui2NextSteps } from "@/components/ui2/Ui2NextSteps";
import { Ui2Crumbs, Ui2PageHero } from "@/components/ui2/Ui2PageHero";
import { cardById } from "@/data/cards";
import {
  NOVEL,
  NOVEL_CHAPTERS,
  NOVEL_CONTENT_NOTE,
  NOVEL_PARTS,
  NOVEL_PATH,
  getNovelChapter,
  isNovelPartFinale,
  novelPartChapters,
  novelPartLabel,
  novelPartOf,
  novelChapterLead,
  novelChapterPath,
  type NovelChapter,
} from "@/data/novel";
import { clampDescription, pickTitle } from "@/lib/config/meta-length";
import { buildAlternates, localizedUrl, noindexAlternates, SITE_ORIGIN } from "@/lib/config/site";
import { buildPageOgImage } from "@/lib/media/og-image";
import { jsonLdScript } from "@/lib/seo/json-ld";
import { buildBreadcrumbJsonLd, homeCrumb } from "../seo";

/**
 * 📖 นิยายของ SeerTarot — หน้ารวม `/novel` + หน้ารายบท `/novel/<เลขบท>` (ภาษาไทยอย่างเดียว · ไม่มีฝาแฝด /en)
 * ===========================================================================
 * ข้อมูลเรื่องอยู่ที่ `src/data/novel.ts` · ตัวบท `src/data/novel-chapters.ts` · สไตล์ `src/styles/v2-novel.css`
 * ทั้งหน้าเป็น HTML ล้วน ไม่มี island — ตัวบทไม่ถูกส่งไปเป็น JS (กติกา island ข้อ "import ข้อมูลใน island = บันเดิลพุ่ง")
 * คำเตือนเนื้อหา + สายด่วน 1323 (กฎเหล็ก 6): ทั้งเรื่องที่หน้ารวม · รายบทตาม `CHAPTER_CONTENT_NOTES`
 */

const locale = "th" as const;
const HUB_CARDS = ["major-00", "major-01", "major-02", "major-03", "major-05", "swords-14"] as const;
/** ตัวละครหลัก (ไพ่) เรียงตามลำดับที่ปรากฏในเรื่อง — ลิงก์ไปหน้าความหมายไพ่ */
const CAST = [
  "major-00",
  "major-01",
  "major-05",
  "cups-12",
  "major-03",
  "swords-11",
  "wands-12",
  "major-07",
  "pentacles-13",
  "major-02",
  "swords-14",
] as const;

const cardName = (id: string) => cardById(id)?.nameEn ?? id;
const hubTitle = () =>
  pickTitle([`${NOVEL.title} นิยายแฟนตาซีไพ่ทาโรต์ สมาชิกอ่านฟรี`, `${NOVEL.title} สมาชิกอ่านฟรี`, NOVEL.title]);

function Hotline() {
  return (
    <>
      ถ้าเนื้อหาทำให้รู้สึกไม่ไหว โทรคุยได้ที่สายด่วนสุขภาพจิต{" "}
      <a href="tel:1323" className="v2-nv-tel">
        1323
      </a>{" "}
      ฟรีตลอด 24 ชั่วโมง
    </>
  );
}

/* ── metadata ─────────────────────────────────────────────────────────── */

export function novelHubMetadata(): Metadata {
  const title = hubTitle();
  const description = clampDescription(NOVEL.tagline, NOVEL.synopsis[0]);
  const images = buildPageOgImage({ title: NOVEL.title, eyebrow: "นิยาย SeerTarot", cardImage: cardById("major-00")?.image, alt: title });
  return {
    title,
    description,
    alternates: buildAlternates(NOVEL_PATH, { locale }),
    openGraph: { title, description, url: localizedUrl(NOVEL_PATH, locale), siteName: "SeerTarot", type: "website", locale: "th_TH", images },
    twitter: { card: "summary_large_image", title, description, images: [images[0].url] },
  };
}

export function novelChapterMetadata(number: number): Metadata {
  const chapter = getNovelChapter(number);
  if (!chapter) return { title: "ไม่พบบทนี้", robots: { index: false, follow: true }, alternates: noindexAlternates() };
  const path = novelChapterPath(chapter.number);
  const title = pickTitle([
    `บทที่ ${chapter.number} ${chapter.title} | ${NOVEL.title}`,
    `บทที่ ${chapter.number} ${chapter.title}`,
  ]);
  const description = clampDescription(novelChapterLead(chapter));
  const images = buildPageOgImage({
    title: `บทที่ ${chapter.number} ${chapter.title}`,
    eyebrow: NOVEL.title,
    cardImage: cardById(chapter.cards[0])?.image,
    alt: title,
  });
  return {
    title,
    description,
    // ตัวบทอ่านได้เฉพาะสมาชิก — หน้ารายบทมีแค่ย่อหน้าตัวอย่าง จึงไม่ให้ค้นหาเก็บ (หน้ารวม /novel ยังเก็บตามปกติ)
    robots: { index: false, follow: true },
    alternates: buildAlternates(path, { locale }),
    openGraph: { title, description, url: localizedUrl(path, locale), siteName: "SeerTarot", type: "article", locale: "th_TH", images },
    twitter: { card: "summary_large_image", title, description, images: [images[0].url] },
  };
}

export function novelChapterStaticParams() {
  return NOVEL_CHAPTERS.map((c) => ({ chapter: String(c.number) }));
}

/* ── JSON-LD ──────────────────────────────────────────────────────────── */

const publisher = {
  "@type": "Organization",
  name: "SeerTarot",
  url: SITE_ORIGIN,
  logo: { "@type": "ImageObject", url: `${SITE_ORIGIN}/icons/icon-512x512.png` },
};

function bookJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Book",
    name: NOVEL.title,
    description: NOVEL.synopsis.join(" "),
    url: localizedUrl(NOVEL_PATH, locale),
    inLanguage: "th",
    genre: "แฟนตาซี",
    isAccessibleForFree: true,
    datePublished: NOVEL.publishedAt,
    dateModified: NOVEL.updatedAt,
    author: { "@type": "Organization", name: NOVEL.author, url: SITE_ORIGIN },
    publisher,
    hasPart: NOVEL_CHAPTERS.map((c) => ({
      "@type": "Chapter",
      position: c.number,
      name: `บทที่ ${c.number} ${c.title}`,
      url: localizedUrl(novelChapterPath(c.number), locale),
    })),
  };
}

/* ── หน้ารวม ──────────────────────────────────────────────────────────── */

export function NovelHubContent() {
  const breadcrumb = buildBreadcrumbJsonLd(locale, [homeCrumb(locale), { name: NOVEL.title, path: NOVEL_PATH }]);
  return (
    <main id="main-content" tabIndex={-1} className="min-h-screen text-ink relative overflow-x-clip">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(bookJsonLd()) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(breadcrumb) }} />

      <Ui2PageHero
        crumbs={[{ label: "หน้าแรก", href: "/" }, { label: "นิยาย" }]}
        title={NOVEL.title}
        accent="Arcana"
        lede={<ThaiPhrases>{NOVEL.tagline}</ThaiPhrases>}
        actions={
          <Link href={novelChapterPath(1)} className="ui2-btn ui2-btn-gold">
            เริ่มอ่านบทที่ 1
          </Link>
        }
        note={`${NOVEL_CHAPTERS.length} บท${NOVEL_PARTS.some((p) => p.complete) ? ` · จบภาคที่ ${NOVEL_PARTS.filter((p) => p.complete).length} แล้ว` : ""} · อ่านฟรีทุกบทสำหรับสมาชิก`}
        cards={HUB_CARDS}
      />

      <div className="v2-nv-wrap">
        <section className="v2-nv-intro" aria-labelledby="v2-nv-story">
          <h2 id="v2-nv-story" className="v2-nv-h2">
            เรื่องย่อ
          </h2>
          {NOVEL.synopsis.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
          <aside className="v2-nv-note" aria-label="คำเตือนเนื้อหา">
            <p>{NOVEL_CONTENT_NOTE}</p>
            <p>
              <Hotline />
            </p>
          </aside>
        </section>

        <section aria-labelledby="v2-nv-toc-h">
          <h2 id="v2-nv-toc-h" className="v2-nv-h2">
            สารบัญ
          </h2>
          {NOVEL_PARTS.map((part) => {
            const chapters = novelPartChapters(part);
            const minutes = chapters.reduce((sum, c) => sum + c.readingMinutes, 0);
            return (
              <div key={part.number} className="v2-nv-part">
                <p className="v2-nv-part-k">ภาคที่ {part.number}</p>
                <h3 className="v2-nv-part-t">{part.title || <ThaiPhrases>{novelPartLabel(part)}</ThaiPhrases>}</h3>
                <p className="v2-nv-part-s">
                  {part.complete ? "จบแล้ว" : "กำลังเขียน"} · {chapters.length} บท · อ่านรวมราว {minutes} นาที
                </p>
                <ol className="v2-nv-grid">
                  {chapters.map((c) => (
                    <li key={c.number}>
                      <Link href={novelChapterPath(c.number)} className="v2-nv-ch">
                        <span className="v2-nv-ch-n" aria-hidden="true">
                          {String(c.number).padStart(2, "0")}
                        </span>
                        <span className="v2-nv-ch-body">
                          <span className="sr-only">บทที่ {c.number} </span>
                          <span className="v2-nv-ch-k">อ่านราว {c.readingMinutes} นาที</span>
                          <span className="v2-nv-ch-t">
                            <ThaiPhrases>{c.title}</ThaiPhrases>
                          </span>
                        </span>
                        <span className="v2-nv-ch-fan" aria-hidden="true">
                          {c.cards.slice(0, 3).map((id) => (
                            <CardImage key={id} cardId={id} image={cardById(id)?.image} alt="" thumb sizes="40px" loading="lazy" className="v2-nv-ch-card" />
                          ))}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ol>
              </div>
            );
          })}
        </section>

        <section aria-labelledby="v2-nv-cast-h">
          <h2 id="v2-nv-cast-h" className="v2-nv-h2">
            ตัวละครจากไพ่ทาโรต์
          </h2>
          <p className="v2-nv-sub">ตัวละครทุกตัวในเรื่องคือไพ่ในสำรับ Rider-Waite แตะที่ไพ่เพื่ออ่านความหมายจริงของใบนั้น</p>
          <ul className="v2-nv-cast">
            {CAST.map((id) => (
              <li key={id}>
                <Link href={`/cards/${id}`} className="v2-nv-cast-a">
                  <CardImage cardId={id} image={cardById(id)?.image} alt="" sizes="72px" loading="lazy" className="v2-nv-cast-card" />
                  <span>{cardName(id)}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <Ui2NextSteps isEn={false} keys={["cards", "spreads", "daily", "journal"]} />
    </main>
  );
}

/* ── หน้ารายบท ────────────────────────────────────────────────────────── */

/** `reader` = island `NovelReaderRoot` (ตัวบทสำหรับสมาชิก) ที่หน้า Astro ส่งเข้ามาทาง slot — ตัวบทไม่อยู่ใน HTML static */
export function NovelChapterContent({ chapter, reader }: { chapter: NovelChapter; reader: ReactNode }) {
  const path = novelChapterPath(chapter.number);
  const prev = getNovelChapter(chapter.number - 1);
  const next = getNovelChapter(chapter.number + 1);
  const chapterName = `บทที่ ${chapter.number} ${chapter.title}`;

  const chapterJsonLd = {
    "@context": "https://schema.org",
    "@type": "Chapter",
    name: chapterName,
    position: chapter.number,
    url: localizedUrl(path, locale),
    inLanguage: "th",
    isAccessibleForFree: true,
    author: { "@type": "Organization", name: NOVEL.author, url: SITE_ORIGIN },
    publisher,
    isPartOf: { "@type": "Book", name: NOVEL.title, url: localizedUrl(NOVEL_PATH, locale) },
  };
  const breadcrumb = buildBreadcrumbJsonLd(locale, [
    homeCrumb(locale),
    { name: NOVEL.title, path: NOVEL_PATH },
    { name: `บทที่ ${chapter.number}`, path },
  ]);

  return (
    <main id="main-content" tabIndex={-1} className="min-h-screen text-ink px-4 sm:px-8 relative overflow-x-clip">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(chapterJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(breadcrumb) }} />

      <article className="v2-nv-chapter">
        <header className="v2-ar-head">
          <Ui2Crumbs
            crumbs={[
              { label: "หน้าแรก", href: "/" },
              { label: NOVEL.title, href: NOVEL_PATH },
              { label: `บทที่ ${chapter.number}` },
            ]}
          />
          <p className="v2-ar-kicker">
            <span>ภาคที่ {novelPartOf(chapter.number).number}</span>
            <span aria-hidden="true" className="v2-ar-sep" />
            <span>
              บทที่ {chapter.number} จาก {NOVEL_CHAPTERS.length}
            </span>
            <span aria-hidden="true" className="v2-ar-sep" />
            <span>อ่านราว {chapter.readingMinutes} นาที</span>
          </p>
          <h1 className="v2-ar-title">
            <ThaiPhrases>{chapter.title}</ThaiPhrases>
          </h1>
          <p className="v2-ar-stand">
            <Link href={NOVEL_PATH} className="v2-nv-book">
              {NOVEL.title}
            </Link>
          </p>
          <ul className="v2-nv-chcast" aria-label="ไพ่ของตัวละครในบทนี้">
            {chapter.cards.map((id) => (
              <li key={id}>
                <Link href={`/cards/${id}`} className="v2-nv-chcast-a">
                  <CardImage cardId={id} image={cardById(id)?.image} alt="" thumb sizes="40px" className="v2-nv-chcast-card" />
                  <span>{cardName(id)}</span>
                </Link>
              </li>
            ))}
          </ul>
        </header>

        {chapter.contentNote && (
          <aside className="v2-nv-note" aria-label="คำเตือนเนื้อหา">
            <p>{chapter.contentNote}</p>
            <p>
              <Hotline />
            </p>
          </aside>
        )}

        {reader}

        {isNovelPartFinale(chapter) ? (
          <p className="v2-nv-end">
            จบ{novelPartLabel(novelPartOf(chapter.number))}
            {!next && <span className="v2-nv-end-s">ภาคต่อไปกำลังมา ติดตามได้ที่หน้านี้</span>}
          </p>
        ) : (
          !next && <p className="v2-nv-end">บทต่อไปกำลังมา ติดตามได้ที่หน้านี้</p>
        )}

        <nav className="v2-nv-pager" aria-label="ไปบทอื่น">
          {prev ? (
            <Link href={novelChapterPath(prev.number)} className="v2-nv-pager-a" rel="prev">
              <span className="v2-nv-pager-k">บทก่อนหน้า</span>
              <span>
                บทที่ {prev.number} {prev.title}
              </span>
            </Link>
          ) : (
            <span />
          )}
          <Link href={NOVEL_PATH} className="v2-nv-pager-toc">
            สารบัญ
          </Link>
          {next ? (
            <Link href={novelChapterPath(next.number)} className="v2-nv-pager-a v2-nv-pager-next" rel="next">
              <span className="v2-nv-pager-k">บทถัดไป</span>
              <span>
                บทที่ {next.number} {next.title}
              </span>
            </Link>
          ) : (
            <span />
          )}
        </nav>
      </article>

      <Ui2NextSteps isEn={false} keys={["cards", "spreads", "daily", "journal"]} />
    </main>
  );
}
