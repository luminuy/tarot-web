import { MetadataRoute } from "next";
import { DECK } from "@/data/cards";
import { ARTICLES } from "@/data/articles";
import { SPREADS } from "@/data/spreads";
import { SITE_ORIGIN } from "@/lib/config/site";

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

  return [...staticRoutes, ...cardRoutes, ...blogRoutes, ...spreadRoutes, ...topicRoutes];
}
