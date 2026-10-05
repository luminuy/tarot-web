/**
 * 🧵 ตัวเรียก API เส้นเรื่องฝั่งเบราว์เซอร์ (REFLECTION_JOURNAL_PLAN 1.4) — สมาชิกเท่านั้น
 * ล้มเหลวทุกกรณีคืนค่าที่ปลอดภัย (รายการว่าง / null) — หน้าจอต้องทำงานต่อได้แม้เครือข่ายสะดุด
 */
import type { JournalThread } from "@/lib/journal/threads.repo";
import type { SavedReadingItem } from "@/lib/utils/history";

export type { JournalThread };

export async function fetchThreads(status?: "open" | "closed"): Promise<JournalThread[]> {
  try {
    const res = await fetch(`/api/journal/threads${status ? `?status=${status}` : ""}`, { cache: "no-store" });
    if (!res.ok) return [];
    const data = (await res.json()) as { threads?: JournalThread[] };
    return Array.isArray(data.threads) ? data.threads : [];
  } catch {
    return [];
  }
}

export async function createThreadRemote(title: string): Promise<{ thread?: JournalThread; error?: string }> {
  try {
    const res = await fetch("/api/journal/threads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title }),
    });
    const data = (await res.json().catch(() => ({}))) as { thread?: JournalThread; error?: string };
    return res.ok ? { thread: data.thread } : { error: data.error || "สร้างเรื่องไม่สำเร็จ" };
  } catch {
    return { error: "เชื่อมต่อไม่สำเร็จ ลองใหม่อีกครั้ง" };
  }
}

export async function fetchThreadDetail(id: string): Promise<{ thread: JournalThread; entries: SavedReadingItem[] } | null> {
  try {
    const res = await fetch(`/api/journal/threads/${encodeURIComponent(id)}`, { cache: "no-store" });
    if (!res.ok) return null;
    return (await res.json()) as { thread: JournalThread; entries: SavedReadingItem[] };
  } catch {
    return null;
  }
}

export async function patchThreadRemote(
  id: string,
  patch: { title?: string; status?: "open" | "closed"; closingNote?: string | null },
): Promise<boolean> {
  try {
    const res = await fetch(`/api/journal/threads/${encodeURIComponent(id)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function deleteThreadRemote(id: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/journal/threads/${encodeURIComponent(id)}`, { method: "DELETE" });
    return res.ok;
  } catch {
    return false;
  }
}

/** ตั้งชื่อเรื่องเริ่มต้นจากคำถาม — ตัดให้สั้น ≤ 60 ตัวอักษร ผู้ใช้แก้ได้ก่อนบันทึก */
export function suggestThreadTitle(question: string): string {
  const q = question.replace(/\s+/g, " ").trim().replace(/[?？]+$/, "");
  return q.length <= 40 ? q : `${q.slice(0, 38).trim()}…`;
}

/** เดาระยะนัดเช็กจากกรอบเวลาในคำอ่าน — ผู้ใช้เปลี่ยนได้เสมอ */
export function suggestCheckinDays(timing?: string): 7 | 30 | 90 {
  const t = (timing ?? "").toLowerCase();
  if (/สัปดาห์|อาทิตย์|week|7\s*วัน|ไม่กี่วัน|days?\b/.test(t)) return 7;
  if (/3\s*เดือน|สามเดือน|ไตรมาส|quarter|ครึ่งปี|6\s*เดือน|months/.test(t)) return 90;
  return 30;
}
