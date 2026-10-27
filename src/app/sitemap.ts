import { MetadataRoute } from "next";
import { DECK } from "@/data/cards";
import { ARTICLES } from "@/data/articles";
import { PUBLIC_SPREADS } from "@/data/spreads";
import { PICK_A_CARD_TOPICS } from "@/data/pick-a-card";
import { ZODIAC_SIGNS } from "@/data/zodiac";
import { QUESTIONS } from "@/data/questions";
import { NOVEL, NOVEL_CHAPTERS, NOVEL_PATH, novelChapterPath } from "@/data/novel";
import { localizedUrl, SITE_ORIGIN } from "@/lib/config/site";
import { hasEnglishTwin } from "@/lib/i18n/paths";
import { articleModifiedAt, questionModifiedAt, SITE_TEMPLATE_UPDATED_AT } from "@/lib/seo/lastmod";

/**
 * วันแก้ไขล่าสุดของหน้าที่เนื้อหาไม่ได้เปลี่ยนตามการ deploy — แม่แบบทั้งเว็บ (UI 2.0 ลงทุกหน้า 2026-10-17)
 * ⚠️ ห้ามใช้ `new Date()` — ทุกครั้งที่ deploy จะประทับ "แก้ไขเมื่อกี้" ลง 100+ URL
 * ที่ไม่ได้เปลี่ยนอะไรเลย Google จึงเรียนรู้ว่าสัญญาณ lastModified ของเว็บนี้เชื่อถือไม่ได้
 * แล้วเลิกใช้ไปเลย · ค่ากลางอยู่ที่ `src/lib/seo/lastmod.ts` (แหล่งเดียวกับ JSON-LD และวันที่บนหน้า · B3-02/04)
 */
const STRUCTURAL_CONTENT_UPDATED_AT = new Date(SITE_TEMPLATE_UPDATED_AT);

/**
 * หน้าที่ "เนื้อหาที่มองเห็น" เปลี่ยนจริงหลังแม่แบบ — ให้ lastModified บอก Google ว่าควรกลับมาอ่าน
 * ⚠️ ใส่เฉพาะหน้าที่ข้อความ/ลิงก์บนหน้าเปลี่ยนจริง ห้ามใส่หน้าที่แก้แค่ meta (เหตุผลเดียวกับข้างบน)
 * ⚠️ ใส่เฉพาะ path ไทย — ฝาแฝด `/en` ได้ค่าเดียวกันอัตโนมัติ (B3-03: เดิมยกเฉพาะฝั่งไทย 17 คู่ไม่เท่ากัน)
 * ค่าที่เก่ากว่าค่าของเส้นทางเอง (เช่น `updatedAt` ของบทความ) ไม่ทับ — ใช้ค่าที่ใหม่กว่าเสมอ
 */
const CONTENT_UPDATED_AT: Record<string, Date> = Object.fromEntries([
  // 2026-10-20: ป้ายชุดไพ่บนหัวหน้าไพ่รายใบเป็นภาษาคน ("ชุดถ้วย" แทน "cups Suit" · B1-02)
  ...DECK.map((card) => [`/cards/${card.id}`, new Date("2026-10-20T17:00:00+07:00")] as const),
  // 2026-10-26: หน้าคู่มือผัง + หน้าหมวดเรื่องใช้ไพ่ผังกลาง (SpreadCard) — ภาพผัง · การ์ด "ผังอื่นที่น่าสนใจ" · ลิงก์ /read/<id> ในไพ่เด้งเปลี่ยนจริง
  ...PUBLIC_SPREADS.map((spread) => [`/spreads/${spread.id}`, new Date("2026-10-26T17:00:00+07:00")] as const),
  ...["love", "career", "money", "health", "family", "study"].map(
    (slug) => [`/spreads/topic/${slug}`, new Date("2026-10-26T17:00:00+07:00")] as const
  ),
]);

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = SITE_ORIGIN;
  const now = STRUCTURAL_CONTENT_UPDATED_AT;

  // Core Static Pages
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: now,
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${baseUrl}/daily`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.95,
    },
    {
      url: `${baseUrl}/love/1-card`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.95,
    },
    {
      url: `${baseUrl}/pick-a-card`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.95,
    },
    {
      url: `${baseUrl}/spreads`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/cards`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/cards/major`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/cards/minor`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/cards/wands`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/cards/cups`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/cards/swords`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/cards/pentacles`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/cards/all`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/cards/birth-card`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.85,
    },
    {
      url: `${baseUrl}/blog`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      // /readers ถูกลิงก์จากเมนูหลักทุกหน้าและไม่ได้ถูก robots กัน แต่เคยตกหล่นจาก sitemap
      url: `${baseUrl}/readers`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      /* หน้าความน่าเชื่อถือ — Google มองหา "ใครรับผิดชอบเว็บนี้" เป็นสัญญาณหลัก
         ในเว็บที่ให้คำแนะนำเกี่ยวกับชีวิต จึงให้ priority สูงกว่าหน้านโยบาย */
      url: `${baseUrl}/about`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      /* หน้าราคา — คนค้น "ดูดวงไพ่ทาโรต์ ราคา / ฟรีไหม" ต้องเจอคำตอบได้โดยไม่ต้องกดเข้าหน้าแรก */
      url: `${baseUrl}/pricing`,
      lastModified: new Date("2026-10-02T12:00:00+07:00"),
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.3,
    },
  ];

  // All 78 Tarot Cards Encyclopedia Pages
  const cardRoutes: MetadataRoute.Sitemap = DECK.map((card) => ({
    url: `${baseUrl}/cards/${card.id}`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.8,
  }));

  // บทความ SEO ทั้งหมด (ใช้ updatedAt ของแต่ละบทความจริง ๆ)
  const blogRoutes: MetadataRoute.Sitemap = ARTICLES.map((article) => ({
    url: `${baseUrl}/blog/${article.slug}`,
    // ตัวเดียวกับ JSON-LD dateModified และวันที่ "อัปเดต" ที่มองเห็นบนหน้า (B3-04)
    lastModified: new Date(articleModifiedAt(article)),
    changeFrequency: "monthly",
    priority: 0.8,
  }));

  // All 26 Spread Guide Pages
  const spreadRoutes: MetadataRoute.Sitemap = PUBLIC_SPREADS.map((spread) => ({
    url: `${baseUrl}/spreads/${spread.id}`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.8,
  }));

  // All 6 Topic Spreads Landing Pages
  const topicRoutes: MetadataRoute.Sitemap = [
    "love",
    "career",
    "money",
    "health",
    "family",
    "study",
  ].map((slug) => ({
    url: `${baseUrl}/spreads/topic/${slug}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.85,
  }));

  /** หน้า Pick A Card รายหัวข้อ — หัวข้อละ URL เพราะเป็นคีย์เวิร์ดค้นหาคนละตัว */
  const pickACardTopicRoutes: MetadataRoute.Sitemap = PICK_A_CARD_TOPICS.map((topic) => ({
    url: `${baseUrl}/pick-a-card/${topic.slug}`,
    lastModified: now,
    changeFrequency: "daily" as const,
    priority: 0.9,
  }));

  /** ✦ ไพ่ประจำราศี — หน้ารวม + 12 หน้ารายราศี (คีย์เวิร์ด "ไพ่ประจำราศี<ชื่อราศี>" คนละตัว) */
  const zodiacRoutes: MetadataRoute.Sitemap = [
    { url: `${baseUrl}/cards/zodiac`, lastModified: now, changeFrequency: "monthly", priority: 0.85 },
    ...ZODIAC_SIGNS.map((sign) => ({
      url: `${baseUrl}/cards/zodiac/${sign.id}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
  ];

  /** ❓ หน้าคำถาม 20 หน้า + หน้ารวม (แทร็ก Q) — lastModified ตามวันที่แก้เนื้อหาจริงของแต่ละหน้า */
  const questionRoutes: MetadataRoute.Sitemap = [
    { url: `${baseUrl}/questions`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    ...QUESTIONS.map((q) => ({
      url: `${baseUrl}/questions/${q.slug}`,
      lastModified: new Date(questionModifiedAt(q)), // ตัวเดียวกับ JSON-LD (B3-05)
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
  ];

  /** 📖 นิยาย — หน้ารวม + รายบท (ภาษาไทยอย่างเดียว ไม่มีฝาแฝด) · lastModified ตามวันที่แก้ตัวบทจริง */
  const novelUpdated = new Date(NOVEL.updatedAt);
  const novelRoutes: MetadataRoute.Sitemap = [
    { url: `${baseUrl}${NOVEL_PATH}`, lastModified: novelUpdated, changeFrequency: "weekly", priority: 0.7 },
    ...NOVEL_CHAPTERS.map((c) => ({
      url: `${baseUrl}${novelChapterPath(c.number)}`,
      lastModified: novelUpdated,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
  ];

  const thaiRoutes = [
    ...staticRoutes,
    ...questionRoutes,
    ...novelRoutes,
    ...zodiacRoutes,
    ...cardRoutes,
    ...blogRoutes,
    ...spreadRoutes,
    ...topicRoutes,
    ...pickACardTopicRoutes,
  ];

  // ใส่ค่าที่ใหม่กว่าก่อนเติมฝาแฝด — คู่ไทย/อังกฤษจึงได้ค่าเดียวกันเสมอ (B3-03)
  const withUpdates = thaiRoutes.map((route) => {
    const updated = CONTENT_UPDATED_AT[route.url.replace(SITE_ORIGIN, "") || "/"];
    const own = route.lastModified ? new Date(route.lastModified) : now;
    const base = own.getTime() < now.getTime() ? now : own; // ไม่มีหน้าไหนเก่ากว่าแม่แบบทั้งเว็บ
    return { ...route, lastModified: updated && updated.getTime() > base.getTime() ? updated : base };
  });
  return withEnglishTwins(withUpdates);
}

/**
 * 🌐 เติมฝาแฝดภาษาอังกฤษและคู่ `alternates.languages` ให้ทุกรายการที่มีฝาแฝดจริง
 * ---------------------------------------------------------------------------
 * กฎของ Google: คำประกาศ hreflang ต้องชี้กันไป-กลับครบทั้งสองทาง ขาดข้างเดียว
 * Google จะทิ้งทั้งคู่ · ที่นี่จึงสร้างจากแหล่งความจริงเดียว (`hasEnglishTwin`)
 * ซึ่งเป็นตัวเดียวกับที่ `LocaleLink` และ `buildAlternates` ใช้ — เพิ่มหน้าอังกฤษใหม่
 * ที่เดียวแล้วได้ครบทั้ง sitemap, hreflang และลิงก์ภายใน
 *
 * หน้าที่ไม่มีฝาแฝด (เช่น `/blog/*`) จะไม่ถูกแตะเลย และไม่มี `alternates` ติดไปด้วย
 */
function withEnglishTwins(routes: MetadataRoute.Sitemap): MetadataRoute.Sitemap {
  const output: MetadataRoute.Sitemap = [];

  for (const route of routes) {
    const path = route.url.replace(SITE_ORIGIN, "") || "/";

    if (!hasEnglishTwin(path)) {
      output.push(route);
      continue;
    }

    const thaiUrl = localizedUrl(path, "th");
    const englishUrl = localizedUrl(path, "en");
    const languages = { "th-TH": thaiUrl, "en-US": englishUrl, "x-default": thaiUrl };

    output.push({ ...route, url: thaiUrl, alternates: { languages } });
    output.push({ ...route, url: englishUrl, alternates: { languages } });
  }

  return output;
}
