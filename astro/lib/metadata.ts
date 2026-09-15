import type { Metadata } from "next";

/**
 * 🏷️ ตัวแปลง `Metadata` ของ Next ➔ แท็กใน <head> ของ Astro
 * ===========================================================================
 *
 * ทำไมต้องแปลง ไม่เขียนแท็กใหม่
 * ----------------------------
 * ตรรกะ SEO ทั้งเว็บ (title/description ที่รัดความยาว · canonical · hreflang ·
 * ภาพแชร์ Cloudinary) อยู่ใน `src/app/_shared/pages/*.tsx` และ `src/lib/config/site.ts`
 * ซึ่งคืนค่าเป็นอ็อบเจกต์ `Metadata` ของ Next
 *
 * ถ้าหน้าที่ย้ายมา Astro เขียนแท็กเองใหม่ = มีแหล่งความจริงสองที่ทันที
 * แล้ววันหนึ่งจะต่างกันโดยไม่มีใครรู้ (ด่าน `test-meta-length` ตรวจได้แค่ความยาว
 * ไม่ได้ตรวจว่าสองฝั่ง "พูดตรงกัน")
 *
 * ไฟล์นี้จึงรับอ็อบเจกต์เดิมตัวเดียวกันมาแปลงเป็นแท็ก — ตรรกะ SEO ยังมีที่เดียว
 *
 * ⚠️ กฎเหล็ก: เจอฟิลด์ที่ยังไม่รองรับ ให้ **โยน error ทันที** ห้ามข้ามเงียบ ๆ
 *    การลืมแท็ก SEO คือความล้มเหลวที่ไม่มีใครเห็นจนกว่าอันดับจะตก
 */

const ESCAPES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
};

function esc(value: string): string {
  return value.replace(/[&<>"]/g, (c) => ESCAPES[c]);
}

function meta(name: string, content: string | undefined | null): string[] {
  if (content === undefined || content === null || content === "") return [];
  return [`<meta name="${esc(name)}" content="${esc(content)}"/>`];
}

function prop(property: string, content: string | undefined | null): string[] {
  if (content === undefined || content === null || content === "") return [];
  return [`<meta property="${esc(property)}" content="${esc(content)}"/>`];
}

/** ตรวจว่าอ็อบเจกต์มีแต่คีย์ที่ตัวแปลงนี้รู้จัก — กันแท็กหายเงียบเมื่อมีคนเพิ่มฟิลด์ใหม่ */
function assertKnownKeys(obj: object, known: readonly string[], where: string): void {
  const unknown = Object.keys(obj).filter((k) => !known.includes(k));
  if (unknown.length > 0) {
    throw new Error(
      `[astro/metadata] ไม่รู้จักฟิลด์ ${unknown.map((k) => `"${k}"`).join(", ")} ใน ${where} — ` +
        `เติมการรองรับใน astro/lib/metadata.ts ก่อน ไม่งั้นแท็ก SEO จะหายไปเงียบ ๆ`,
    );
  }
}

type OgImage = { url: string; width?: number; height?: number; alt?: string };

function normalizeImages(images: unknown): OgImage[] {
  if (!images) return [];
  const list = Array.isArray(images) ? images : [images];
  return list.map((img) => {
    if (typeof img === "string") return { url: img };
    const o = img as Record<string, unknown>;
    assertKnownKeys(o, ["url", "width", "height", "alt", "secureUrl", "type"], "openGraph.images[]");
    return {
      url: String(o.url),
      width: o.width as number | undefined,
      height: o.height as number | undefined,
      alt: o.alt as string | undefined,
    };
  });
}

/** สร้างแท็ก robots ให้เหมือนที่ Next เขียนออกมาเป๊ะ (`index, follow, max-image-preview:large`) */
function robotsTags(robots: NonNullable<Metadata["robots"]>): string[] {
  if (typeof robots === "string") return meta("robots", robots);
  assertKnownKeys(robots, ["index", "follow", "nocache", "googleBot"], "robots");

  const base: string[] = [];
  if (robots.index !== undefined) base.push(robots.index ? "index" : "noindex");
  if (robots.follow !== undefined) base.push(robots.follow ? "follow" : "nofollow");
  if (robots.nocache) base.push("noarchive");

  const tags = base.length > 0 ? meta("robots", base.join(", ")) : [];

  const bot = robots.googleBot;
  if (bot && typeof bot === "object") {
    assertKnownKeys(
      bot,
      ["index", "follow", "max-video-preview", "max-image-preview", "max-snippet"],
      "robots.googleBot",
    );
    const parts: string[] = [];
    if (bot.index !== undefined) parts.push(bot.index ? "index" : "noindex");
    if (bot.follow !== undefined) parts.push(bot.follow ? "follow" : "nofollow");
    if (bot["max-video-preview"] !== undefined) parts.push(`max-video-preview:${bot["max-video-preview"]}`);
    if (bot["max-image-preview"] !== undefined) parts.push(`max-image-preview:${bot["max-image-preview"]}`);
    if (bot["max-snippet"] !== undefined) parts.push(`max-snippet:${bot["max-snippet"]}`);
    if (parts.length > 0) tags.push(...meta("googlebot", parts.join(", ")));
  } else if (typeof bot === "string") {
    tags.push(...meta("googlebot", bot));
  }

  return tags;
}

export interface RenderMetadataOptions {
  /** แม่แบบ title ของ root layout — `"%s · SeerTarot"` */
  titleTemplate: string;
}

/**
 * แปลง `Metadata` ของหน้าหนึ่ง ➔ รายการแท็ก HTML สำหรับ <head>
 *
 * รองรับเฉพาะฟิลด์ที่หน้าในเว็บนี้ใช้จริง — ฟิลด์ที่ root layout ประกาศไว้ทั้งเว็บ
 * (icons · manifest · verification · authors) ถูกเขียนตรง ๆ ใน `BaseLayout.astro`
 * เหมือนที่ Next เขียนจาก root layout
 */
export function renderMetadata(metadata: Metadata, options: RenderMetadataOptions): string[] {
  assertKnownKeys(
    metadata,
    [
      "title",
      "description",
      "keywords",
      "alternates",
      "openGraph",
      "twitter",
      "robots",
      "authors",
      "creator",
      "publisher",
      "category",
    ],
    "metadata",
  );

  const tags: string[] = [];

  // ── title ────────────────────────────────────────────────────────────────
  if (metadata.title !== undefined && metadata.title !== null) {
    if (typeof metadata.title !== "string") {
      throw new Error("[astro/metadata] title ของหน้าย่อยต้องเป็นสตริงเท่านั้น");
    }
    tags.push(`<title>${esc(options.titleTemplate.replace("%s", metadata.title))}</title>`);
  }

  tags.push(...meta("description", metadata.description));

  if (metadata.keywords) {
    const kw = Array.isArray(metadata.keywords) ? metadata.keywords.join(",") : metadata.keywords;
    tags.push(...meta("keywords", kw));
  }

  if (metadata.authors) {
    const authors = Array.isArray(metadata.authors) ? metadata.authors : [metadata.authors];
    for (const a of authors) {
      if (typeof a === "string") tags.push(...meta("author", a));
      else if (a?.name) tags.push(...meta("author", a.name));
    }
  }

  tags.push(...meta("creator", metadata.creator));
  tags.push(...meta("publisher", metadata.publisher));

  if (metadata.robots) tags.push(...robotsTags(metadata.robots));

  // ── canonical + hreflang ─────────────────────────────────────────────────
  if (metadata.alternates) {
    assertKnownKeys(metadata.alternates, ["canonical", "languages", "media", "types"], "alternates");
    const canonical = metadata.alternates.canonical;
    if (canonical) {
      const href = typeof canonical === "string" ? canonical : String((canonical as { url: string }).url);
      tags.push(`<link rel="canonical" href="${esc(href)}"/>`);
    }
    const languages = metadata.alternates.languages;
    if (languages) {
      for (const [hrefLang, value] of Object.entries(languages)) {
        if (!value) continue;
        const href = typeof value === "string" ? value : String((value as unknown as { url: string }).url);
        tags.push(`<link rel="alternate" hrefLang="${esc(hrefLang)}" href="${esc(href)}"/>`);
      }
    }
  }

  // ── Open Graph ───────────────────────────────────────────────────────────
  const og = metadata.openGraph as Record<string, unknown> | undefined;
  if (og) {
    assertKnownKeys(
      og,
      ["type", "locale", "siteName", "title", "description", "url", "images", "publishedTime", "modifiedTime", "authors", "section", "tags"],
      "openGraph",
    );
    tags.push(...prop("og:title", og.title as string));
    tags.push(...prop("og:description", og.description as string));
    tags.push(...prop("og:url", og.url as string));
    tags.push(...prop("og:site_name", og.siteName as string));
    tags.push(...prop("og:locale", og.locale as string));
    for (const img of normalizeImages(og.images)) {
      tags.push(...prop("og:image", img.url));
      if (img.width !== undefined) tags.push(...prop("og:image:width", String(img.width)));
      if (img.height !== undefined) tags.push(...prop("og:image:height", String(img.height)));
      if (img.alt !== undefined) tags.push(...prop("og:image:alt", img.alt));
    }
    tags.push(...prop("og:type", og.type as string));
    tags.push(...prop("article:published_time", og.publishedTime as string));
    tags.push(...prop("article:modified_time", og.modifiedTime as string));
    if (og.section) tags.push(...prop("article:section", og.section as string));
    const ogAuthors = og.authors;
    if (ogAuthors) {
      for (const a of Array.isArray(ogAuthors) ? ogAuthors : [ogAuthors]) {
        tags.push(...prop("article:author", String(a)));
      }
    }
    if (og.tags) {
      for (const t of Array.isArray(og.tags) ? og.tags : [og.tags]) {
        tags.push(...prop("article:tag", String(t)));
      }
    }
  }

  // ── Twitter ──────────────────────────────────────────────────────────────
  const tw = metadata.twitter as Record<string, unknown> | undefined;
  if (tw) {
    assertKnownKeys(tw, ["card", "title", "description", "images", "site", "creator"], "twitter");
    tags.push(...meta("twitter:card", tw.card as string));
    tags.push(...meta("twitter:site", tw.site as string));
    tags.push(...meta("twitter:creator", tw.creator as string));
    tags.push(...meta("twitter:title", tw.title as string));
    tags.push(...meta("twitter:description", tw.description as string));
    for (const img of normalizeImages(tw.images)) {
      tags.push(...meta("twitter:image", img.url));
      if (img.alt !== undefined) tags.push(...meta("twitter:image:alt", img.alt));
    }
  }

  if (metadata.category) tags.push(...meta("category", metadata.category));

  return tags;
}
