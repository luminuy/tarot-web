import { hasSessionHint } from "@/lib/auth/session-hint";
import type { NovelParagraph } from "@/lib/novel/render";

/**
 * 📖 โหลดตัวบทนิยายจากเซิร์ฟเวอร์ (ฝั่งเบราว์เซอร์) — ใช้กับ island `NovelReader`
 * ไม่มีคุกกี้ใบ้ = รู้แน่ว่ายังไม่ล็อกอิน ➔ ไม่ยิงอะไรเลย (งบคำขอ: ผู้ชมที่ไม่ล็อกอินต้องไม่ปลุก Worker · ด่าน test-request-budget)
 */
export type NovelChapterLoad =
  | { status: "ok"; paragraphs: NovelParagraph[] }
  | { status: "login" }
  | { status: "error" };

export async function loadNovelChapter(number: number): Promise<NovelChapterLoad> {
  if (!hasSessionHint()) return { status: "login" };
  try {
    const res = await fetch(`/api/novel/${number}`, { credentials: "same-origin", cache: "no-store" });
    if (res.status === 401) return { status: "login" };
    if (!res.ok) return { status: "error" };
    const data = (await res.json()) as { paragraphs?: unknown };
    return Array.isArray(data.paragraphs) ? { status: "ok", paragraphs: data.paragraphs as NovelParagraph[] } : { status: "error" };
  } catch {
    return { status: "error" };
  }
}
