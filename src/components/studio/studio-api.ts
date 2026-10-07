import { readEnvelope } from "@/lib/api/envelope";

/**
 * 🔌 ตัวเรียก API ของสตูดิโอ — โทเคนแม่หมอส่งผ่าน `Authorization: Bearer` เท่านั้น (ไม่ใส่ใน URL ของ API)
 */
export type StudioCall = <T = Record<string, unknown>>(
  path: string,
  init?: { method?: string; body?: unknown },
) => Promise<{ ok: boolean; status: number; error: string; code?: string; data: T }>;

export function makeStudioCall(token: string | null): StudioCall {
  return async (path, init) => {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (token) headers.Authorization = `Bearer ${token}`;
    try {
      const res = await fetch(`/api/marketplace/studio${path}`, {
        method: init?.method ?? "GET",
        headers,
        body: init?.body === undefined ? undefined : JSON.stringify(init.body),
        cache: "no-store",
      });
      const json = await res.json().catch(() => null);
      const env = readEnvelope(json, res.ok);
      const code = json && typeof json === "object" && typeof (json as { code?: unknown }).code === "string" ? (json as { code: string }).code : undefined;
      return { ok: env.ok, status: res.status, error: env.error, code, data: env.data as never };
    } catch {
      return { ok: false, status: 0, error: "เชื่อมต่อไม่สำเร็จ ลองใหม่อีกครั้ง", data: {} as never };
    }
  };
}

/** อัปโหลดโลโก้ (ไฟล์รูปดิบ ไม่ใช่ JSON) */
export async function uploadStudioLogo(
  token: string | null,
  blob: Blob,
): Promise<{ ok: true; logoUrl: string } | { ok: false; error: string; code?: string }> {
  try {
    const res = await fetch("/api/marketplace/studio/logo", {
      method: "POST",
      headers: { "Content-Type": blob.type || "application/octet-stream", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: blob,
      cache: "no-store",
    });
    const json = (await res.json().catch(() => null)) as { ok?: boolean; logoUrl?: string; error?: string; code?: string } | null;
    if (res.ok && json?.logoUrl) return { ok: true, logoUrl: json.logoUrl };
    return { ok: false, error: json?.error || "อัปโหลดรูปไม่สำเร็จ", code: json?.code };
  } catch {
    return { ok: false, error: "เชื่อมต่อไม่สำเร็จ ลองใหม่อีกครั้ง" };
  }
}

/** ดาวน์โหลดไฟล์ส่งออก (ต้องแนบ Bearer จึงใช้ <a href> ตรง ๆ ไม่ได้) */
export async function downloadWithAuth(token: string | null, path: string, filename: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/marketplace/studio${path}`, { headers: token ? { Authorization: `Bearer ${token}` } : {}, cache: "no-store" });
    if (!res.ok) return false;
    const url = URL.createObjectURL(await res.blob());
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
    return true;
  } catch {
    return false;
  }
}

/* ── รูปข้อมูลที่หน้าใช้ (สะท้อนจาก API) ─────────────────────────────── */

export interface StudioClientT {
  id: string;
  displayName: string;
  contact: string | null;
  note: string | null;
  updatedAt: number;
}
export interface StudioTemplateT {
  id: string;
  name: string;
  intro: string | null;
  closing: string | null;
}
export interface ReadingSummaryT {
  id: string;
  clientId: string | null;
  title: string;
  spreadName: string | null;
  cardSource: "fair" | "manual" | null;
  cardCount: number;
  status: "draft" | "sent";
  shareActive: boolean;
  viewCount: number;
  sentAt: number | null;
  fromQueue?: boolean;
  updatedAt: number;
}
export interface ImportableTicketT {
  ticketId: string;
  kind: "walkup" | "booking";
  nickname: string | null;
  question: string | null;
  at: number;
  clientId: string | null;
  readingId: string | null;
  sensitiveConsent: boolean;
}
export interface BodyPartT {
  key: string;
  text: string;
  origin: "reader" | "ai" | "edited";
}
export interface ReadingT {
  id: string;
  clientId: string | null;
  title: string;
  question: string | null;
  spreadId: string;
  cardSource: "fair" | "manual" | null;
  cards: Array<{ order: number; cardIndex: number; isReversed: boolean; id: string; nameTh: string; image: string }>;
  cardsBroken: boolean;
  commitment: string | null;
  serverSeed: string | null;
  clientSeed: string | null;
  notes: Record<string, string>;
  draft: { parts: BodyPartT[] } | null;
  body: BodyPartT[] | null;
  showAiDisclosure: boolean;
  status: "draft" | "sent";
  share: { active: boolean; expiresAt: number | null; hasPassword: boolean; revokedAt: number | null; viewCount: number };
  spread: { nameTh: string; positions: Array<{ nameTh: string; meaning: string }> } | null;
}
export interface StudioSettingsT {
  brandName: string | null;
  logoUrl: string | null;
  brandColor: string | null;
  contactLine: string | null;
  showAiDisclosure: boolean;
  aiAssist: boolean;
}
export interface DeckEntryT {
  index: number;
  id: string;
  nameTh: string;
  nameEn: string;
}
export interface SpreadOptionT {
  id: string;
  nameTh: string;
  count: number;
}
