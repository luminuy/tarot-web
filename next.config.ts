import type { NextConfig } from "next";

const securityHeaders = [
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      // ⚠️ โฮสต์ของ GA4 กับ Meta Pixel ต้องอยู่ใน allowlist ไม่งั้น CSP บล็อกเงียบ
      // `AnalyticsTracker` โหลด gtag จาก googletagmanager และ fbevents จาก connect.facebook.net
      // ก่อนหน้านี้ทั้งสองตัวถูกบล็อกทั้งหมด = ตั้ง NEXT_PUBLIC_GA_ID ไปก็ไม่มีข้อมูลเข้า GA เลย
      // และไม่มี field data ให้ PageSpeed/CrUX ใช้วัดผลการปรับ SEO ที่ทำไป
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://challenges.cloudflare.com https://www.googletagmanager.com https://connect.facebook.net",
      // next/font โฮสต์ฟอนต์เองในโดเมนเรา จึงไม่เคยเรียก fonts.googleapis.com / fonts.gstatic.com เลย
      "style-src 'self' 'unsafe-inline'",
      "font-src 'self' data:",
      "img-src 'self' data: blob: https:",
      "connect-src 'self' https://generativelanguage.googleapis.com https://challenges.cloudflare.com https://www.google-analytics.com https://region1.google-analytics.com https://www.facebook.com",
      "frame-src 'self' https://challenges.cloudflare.com",
      "base-uri 'none'",
      "frame-ancestors 'none'",
      "object-src 'none'",
    ].join("; "),
  },
  {
    key: "X-Frame-Options",
    value: "DENY",
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=31536000; includeSubDomains; preload",
  },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
  experimental: {
    // การอ่านไพ่เป็น streaming ที่ใช้เวลานาน จึงต้องกันไม่ให้ถูกตัดกลางคัน
    proxyTimeout: 120_000,
    optimizePackageImports: ["motion", "motion/react", "zod"],
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === "production" ? { exclude: ["error", "warn"] } : false,
  },
  async redirects() {
    return [
      {
        source: "/blog/celtic-cross-spread-deep-dive",
        destination: "/blog/celtic-cross-spread-guide",
        permanent: true,
      },
      {
        source: "/blog/jungian-psychology-and-tarot",
        destination: "/blog/tarot-and-carl-jung-psychology",
        permanent: true,
      },
      {
        source: "/tarot-daily",
        destination: "/daily",
        permanent: true,
      },
      {
        source: "/daily-tarot",
        destination: "/daily",
        permanent: true,
      },
      {
        source: "/tarot-love",
        destination: "/love/1-card",
        permanent: true,
      },
      {
        source: "/love",
        destination: "/love/1-card",
        permanent: true,
      },
      {
        source: "/love-tarot",
        destination: "/love/1-card",
        permanent: true,
      },
    ];
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
      {
        source: "/robots.txt",
        headers: [
          {
            key: "Access-Control-Allow-Origin",
            value: "*",
          },
          {
            key: "Access-Control-Allow-Methods",
            value: "GET, HEAD, OPTIONS",
          },
          {
            key: "Cache-Control",
            value: "public, max-age=86400, stale-while-revalidate=43200",
          },
        ],
      },
      {
        source: "/llms.txt",
        headers: [
          {
            key: "Access-Control-Allow-Origin",
            value: "*",
          },
          {
            key: "Access-Control-Allow-Methods",
            value: "GET, HEAD, OPTIONS",
          },
          {
            key: "Content-Type",
            value: "text/plain; charset=utf-8",
          },
          {
            key: "Cache-Control",
            value: "public, max-age=86400, stale-while-revalidate=43200",
          },
        ],
      },
      {
        source: "/sitemap.xml",
        headers: [
          {
            key: "Access-Control-Allow-Origin",
            value: "*",
          },
          {
            key: "Access-Control-Allow-Methods",
            value: "GET, HEAD, OPTIONS",
          },
          {
            key: "Cache-Control",
            value: "public, max-age=86400, stale-while-revalidate=43200",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
