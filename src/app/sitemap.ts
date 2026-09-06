import { MetadataRoute } from "next";
import { DECK } from "@/data/cards";
import { ARTICLES } from "@/data/articles";
import { SPREADS } from "@/data/spreads";
import { localizedUrl, SITE_ORIGIN } from "@/lib/config/site";
import { hasEnglishTwin } from "@/lib/i18n/paths";

/**
 * วันแก้ไขล่าสุดของหน้าที่เนื้อหาไม่ได้เปลี่ยนตามการ deploy
 * ⚠️ ห้ามใช้ `new Date()` — ทุกครั้งที่ deploy จะประทับ "แก้ไขเมื่อกี้" ลง 100+ URL
 * ที่ไม่ได้เปลี่ยนอะไรเลย Google จึงเรียนรู้ว่าสัญญาณ lastModified ของเว็บนี้เชื่อถือไม่ได้
 * แล้วเลิกใช้ไปเลย · อัปเดตค่านี้ด้วยมือเมื่อแก้เนื้อหาโครงสร้างจริง ๆ
 */
const STRUCTURAL_CONTENT_UPDATED_AT = new Date("2026-09-05T00:00:00+07:00");

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
    lastModified: new Date(article.updatedAt),
    changeFrequency: "monthly",
    priority: 0.8,
  }));

  // All 25 Spread Guide Pages
  const spreadRoutes: MetadataRoute.Sitemap = SPREADS.map((spread) => ({
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

  const thaiRoutes = [...staticRoutes, ...cardRoutes, ...blogRoutes, ...spreadRoutes, ...topicRoutes];

  return withEnglishTwins(thaiRoutes);
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
