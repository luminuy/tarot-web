import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
  experimental: {
    // การอ่านไพ่เป็น streaming ที่ใช้เวลานาน จึงต้องกันไม่ให้ถูกตัดกลางคัน
    proxyTimeout: 120_000,
    optimizePackageImports: ["motion", "motion/react", "lucide-react", "zod"],
  },
};

export default nextConfig;
