/**
 * ✦ ผังที่สร้างเอง ฝั่งเบราว์เซอร์ (REFLECTION_JOURNAL_PLAN 1.8)
 *  • สมาชิก: เก็บในบัญชีผ่าน `/api/spreads/custom` (ข้ามเครื่องได้ · แบ่งปันลิงก์ได้)
 *  • ผู้เยี่ยมชม: เก็บในเครื่องนี้ (localStorage) สูงสุด 10 ผัง — เซิร์ฟเวอร์ตรวจซ้ำตอนเปิดไพ่อยู่แล้ว
 *  • "ใช้ผังนี้": ส่งต่อให้พิธีเปิดไพ่ผ่าน sessionStorage ครั้งเดียว (`queueCustomLaunch` ➔ `takeCustomLaunch`)
 * ล้มเหลวทุกกรณีคืนค่าที่ปลอดภัย — หน้าจอต้องทำงานต่อได้แม้เครือข่ายสะดุด
 * ⚠️ ไฟล์นี้ใช้ใน island — ห้าม import สำรับ/สารานุกรม
 */
import { STORAGE_KEYS } from "@/lib/storage/keys";
import type { CustomSpreadInput } from "@/lib/tarot/custom-spread";

export interface CustomSpreadDef extends CustomSpreadInput {
  /** รหัสผังในบัญชี (`cs_…`) — ผังในเครื่องของผู้เยี่ยมชมไม่มีค่านี้ */
  savedId?: string;
}

export interface MyCustomSpread extends CustomSpreadInput {
  /** `cs_…` = อยู่ในบัญชี · `local_…` = อยู่ในเครื่องนี้ */
  id: string;
  shareSlug?: string | null;
  useCount?: number;
  updatedAt: number;
  local: boolean;
}

export const LOCAL_CUSTOM_SPREADS_MAX = 10;

function pick(input: CustomSpreadInput): CustomSpreadInput {
  return { name: input.name, layout: input.layout, positions: input.positions };
}

/* ── ส่งต่อให้พิธีเปิดไพ่ ─────────────────────────────────────────── */

export function queueCustomLaunch(def: CustomSpreadDef): boolean {
  try {
    sessionStorage.setItem(STORAGE_KEYS.customSpreadLaunch, JSON.stringify({ ...pick(def), savedId: def.savedId }));
    return true;
  } catch {
    return false;
  }
}

/** อ่านแล้วลบทันที — กดย้อนกลับมาหน้าแรกอีกรอบจะไม่ถูกพาเข้าผังเดิมซ้ำ */
export function takeCustomLaunch(): CustomSpreadDef | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEYS.customSpreadLaunch);
    if (!raw) return null;
    sessionStorage.removeItem(STORAGE_KEYS.customSpreadLaunch);
    const v = JSON.parse(raw) as CustomSpreadDef;
    return v && typeof v.name === "string" && Array.isArray(v.positions) ? v : null;
  } catch {
    return null;
  }
}

/* ── ผู้เยี่ยมชม: เก็บในเครื่อง ─────────────────────────────────────── */

function readLocal(): MyCustomSpread[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.customSpreadsLocal);
    const v = raw ? (JSON.parse(raw) as MyCustomSpread[]) : [];
    return Array.isArray(v) ? v.filter((s) => s && typeof s.id === "string" && Array.isArray(s.positions)) : [];
  } catch {
    return [];
  }
}

function writeLocal(list: MyCustomSpread[]): boolean {
  try {
    localStorage.setItem(STORAGE_KEYS.customSpreadsLocal, JSON.stringify(list.slice(0, LOCAL_CUSTOM_SPREADS_MAX)));
    return true;
  } catch {
    return false;
  }
}

export function listLocalSpreads(): MyCustomSpread[] {
  return readLocal().sort((a, b) => b.updatedAt - a.updatedAt);
}

export function saveLocalSpread(input: CustomSpreadInput, id?: string): MyCustomSpread | null {
  const list = readLocal();
  const now = Date.now();
  if (id) {
    const i = list.findIndex((s) => s.id === id);
    if (i >= 0) {
      list[i] = { ...list[i], ...pick(input), updatedAt: now };
      return writeLocal(list) ? list[i] : null;
    }
  }
  if (list.length >= LOCAL_CUSTOM_SPREADS_MAX) return null;
  const item: MyCustomSpread = { ...pick(input), id: `local_${now.toString(36)}`, updatedAt: now, local: true };
  return writeLocal([item, ...list]) ? item : null;
}

export function deleteLocalSpread(id: string): void {
  writeLocal(readLocal().filter((s) => s.id !== id));
}

/* ── สมาชิก: เก็บในบัญชี ──────────────────────────────────────────── */

type Remote = CustomSpreadInput & { id: string; shareSlug: string | null; useCount: number; updatedAt: number };

const toMine = (s: Remote): MyCustomSpread => ({ ...s, local: false });

/** `null` = ยังไม่ได้ล็อกอิน (ให้ใช้ผังในเครื่องแทน) */
export async function fetchMySpreads(): Promise<MyCustomSpread[] | null> {
  try {
    const res = await fetch("/api/spreads/custom", { cache: "no-store" });
    if (res.status === 401) return null;
    if (!res.ok) return [];
    const data = (await res.json()) as { spreads?: Remote[] };
    return Array.isArray(data.spreads) ? data.spreads.map(toMine) : [];
  } catch {
    return [];
  }
}

export async function saveSpreadRemote(
  input: CustomSpreadInput,
  lang: "th" | "en",
  id?: string,
): Promise<{ spread?: MyCustomSpread; error?: string; unauthorized?: boolean }> {
  try {
    const res = await fetch(id ? `/api/spreads/custom/${encodeURIComponent(id)}` : "/api/spreads/custom", {
      method: id ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ spread: pick(input), lang }),
    });
    const data = (await res.json().catch(() => ({}))) as { spread?: Remote; error?: string };
    if (res.status === 401) return { unauthorized: true, error: data.error };
    return res.ok && data.spread ? { spread: toMine(data.spread) } : { error: data.error || (lang === "en" ? "Could not save." : "บันทึกไม่สำเร็จ") };
  } catch {
    return { error: lang === "en" ? "Connection failed — try again." : "เชื่อมต่อไม่สำเร็จ ลองใหม่อีกครั้ง" };
  }
}

export async function deleteSpreadRemote(id: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/spreads/custom/${encodeURIComponent(id)}`, { method: "DELETE" });
    return res.ok;
  } catch {
    return false;
  }
}

/** คืน slug ใหม่ (เปิด) · `null` (ปิดแล้ว) · `undefined` (ล้มเหลว) */
export async function shareSpreadRemote(id: string, share: boolean): Promise<string | null | undefined> {
  try {
    const res = await fetch(`/api/spreads/custom/${encodeURIComponent(id)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ share }),
    });
    if (!res.ok) return undefined;
    const data = (await res.json()) as { shareSlug?: string | null };
    return data.shareSlug ?? null;
  } catch {
    return undefined;
  }
}

export async function fetchSharedSpread(slug: string): Promise<CustomSpreadInput | null> {
  try {
    const res = await fetch(`/api/spreads/shared/${encodeURIComponent(slug)}`);
    if (!res.ok) return null;
    const data = (await res.json()) as { spread?: CustomSpreadInput };
    return data.spread ?? null;
  } catch {
    return null;
  }
}

/** ผังทั้งหมดของฉัน: สมาชิก = ในบัญชี · ผู้เยี่ยมชม = ในเครื่อง */
export async function loadMySpreads(): Promise<{ spreads: MyCustomSpread[]; member: boolean }> {
  const remote = await fetchMySpreads();
  if (remote === null) return { spreads: listLocalSpreads(), member: false };
  return { spreads: remote, member: true };
}
