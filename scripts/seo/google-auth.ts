/**
 * scripts/seo/google-auth.ts
 *
 * ขอ access token จาก Google ด้วยกุญแจ Service Account (JWT bearer) — ใช้ร่วมกันระหว่าง
 * `gsc.ts` (Search Console) และ `ga4.ts` (Analytics Data API)
 * ไม่พึ่งไลบรารี googleapis เพื่อไม่ให้สคริปต์ SEO ลาก dependency ก้อนใหญ่เข้ารีโป
 */

import { createSign } from "node:crypto";

const TIMEOUT_MS = 30_000;

export interface ServiceAccount {
  client_email: string;
  private_key: string;
}

/**
 * อ่านกุญแจจาก env ตัวแรกที่มีค่าในรายการ (วางทั้งก้อน JSON หรือ base64 ก็ได้)
 * ไม่พบ ➔ บอกวิธีตั้งแล้วออกด้วย exit 1
 */
export function loadServiceAccount(envNames: string[]): ServiceAccount {
  const name = envNames.find((n) => process.env[n]?.trim());
  const raw = name ? process.env[name]!.trim() : "";
  if (!raw) {
    console.error(
      `❌ ไม่พบ env ${envNames.join(" หรือ ")}\n` +
        "   ใส่เนื้อหาไฟล์กุญแจ JSON ของ Service Account ลงใน secret ของ environment แล้วรันใหม่\n" +
        "   (ขั้นตอนเต็มอยู่ใน docs/SEO_INDEXING_LOG.md หัวข้อ \"ดึงข้อมูลผ่าน API\")",
    );
    process.exit(1);
  }
  const text = raw.startsWith("{") ? raw : Buffer.from(raw, "base64").toString("utf8");
  const sa = JSON.parse(text) as ServiceAccount;
  if (!sa.client_email || !sa.private_key) {
    console.error(`❌ ${name} ไม่มี client_email หรือ private_key`);
    process.exit(1);
  }
  return sa;
}

const b64url = (s: string | Buffer) => Buffer.from(s).toString("base64url");

export async function getAccessToken(sa: ServiceAccount, scope: string): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = b64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claims = b64url(
    JSON.stringify({
      iss: sa.client_email,
      scope,
      aud: "https://oauth2.googleapis.com/token",
      iat: now,
      exp: now + 3600,
    }),
  );
  const signer = createSign("RSA-SHA256");
  signer.update(`${header}.${claims}`);
  const jwt = `${header}.${claims}.${b64url(signer.sign(sa.private_key))}`;

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  const body = (await res.json()) as { access_token?: string; error_description?: string };
  if (!res.ok || !body.access_token) {
    throw new Error(`ขอ token ไม่สำเร็จ (${res.status}): ${body.error_description ?? JSON.stringify(body)}`);
  }
  return body.access_token;
}
