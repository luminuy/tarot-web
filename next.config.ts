import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  experimental: {
    // การอ่านไพ่เป็น streaming ที่ใช้เวลานาน จึงต้องกันไม่ให้ถูกตัดกลางคัน
    proxyTimeout: 120_000,
  },
};

export default nextConfig;
