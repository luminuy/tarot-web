"use client";

import { useEffect, useMemo, useState } from "react";
import { CardImage } from "@/components/card/CardImage";
import { copyToClipboard } from "@/lib/utils/clipboard";
import type { BodyPartT, DeckEntryT, ReadingT, StudioCall, StudioClientT } from "./studio-api";

/**
 * ✍️ ตัวแก้คำอ่านของสตูดิโอ — 4 ขั้น: ไพ่ ➔ โน้ตของหมอ ➔ เกลาด้วย AI (แยกสี) ➔ ส่งลิงก์
 * สีของแต่ละส่วนบอกที่มา: คำของหมอ (ไม่มีแถบ) · ร่างจาก AI (แถบม่วง) · แก้จากร่าง AI (แถบทอง)
 * แถบสีเห็นเฉพาะในสตูดิโอ ลูกค้าไม่เห็น
 */

const ORIGIN_STYLE: Record<BodyPartT["origin"], { bar: string; label: string }> = {
  reader: { bar: "border-l-line", label: "คำของคุณ" },
  ai: { bar: "border-l-amethyst bg-amethyst/5", label: "ร่างจาก AI — ตรวจก่อนส่ง" },
  edited: { bar: "border-l-gold bg-gold-wash/40", label: "แก้จากร่าง AI" },
};

const SUIT_GROUPS: Array<{ label: string; from: number; to: number }> = [
  { label: "ไพ่ชุดใหญ่ (Major Arcana)", from: 0, to: 21 },
  { label: "ชุดไม้เท้า (Wands)", from: 22, to: 35 },
  { label: "ชุดถ้วย (Cups)", from: 36, to: 49 },
  { label: "ชุดดาบ (Swords)", from: 50, to: 63 },
  { label: "ชุดเหรียญ (Pentacles)", from: 64, to: 77 },
];

function randomHex(bytes = 16): string {
  const a = new Uint8Array(bytes);
  crypto.getRandomValues(a);
  return Array.from(a, (b) => b.toString(16).padStart(2, "0")).join("");
}

function partKeys(r: ReadingT, notes: Record<string, string>, body: BodyPartT[]): string[] {
  const has = (k: string) => Boolean(notes[k]?.trim()) || body.some((p) => p.key === k);
  return [...(has("intro") ? ["intro"] : []), ...r.cards.map((c) => `card:${c.order}`), "summary", ...(has("closing") ? ["closing"] : [])];
}

function keyLabel(r: ReadingT, key: string): string {
  if (key === "intro") return "บทนำ";
  if (key === "summary") return "ภาพรวม";
  if (key === "closing") return "คำลงท้าย";
  const order = Number(key.slice(5));
  const c = r.cards.find((x) => x.order === order);
  const pos = r.spread?.positions[order]?.nameTh ?? `ใบที่ ${order + 1}`;
  return `${pos} — ${c ? `${c.nameTh}${c.isReversed ? " (กลับหัว)" : ""}` : ""}`;
}

const fieldCls =
  "w-full rounded-xl border border-line-interactive-warm bg-surface px-3.5 py-2.5 text-[15px] leading-relaxed text-ink-deep outline-none focus-visible:ring-2 focus-visible:ring-gold-ink/40";
const btnPrimary = "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-gold-ink px-5 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-50";
const btnGhost =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-line-interactive-warm bg-surface px-4 text-sm font-semibold text-ink-deep transition-colors hover:bg-inset-warm disabled:opacity-50";

export function ReadingEditor({
  reading: initial,
  call,
  deck,
  clients,
  quota,
  aiAssist,
  onChanged,
  onDeleted,
  onBack,
}: {
  reading: ReadingT;
  call: StudioCall;
  deck: DeckEntryT[];
  clients: StudioClientT[];
  quota: { used: number; limit: number } | null;
  /** แม่หมอเปิดตัวช่วย AI ไว้ไหม — ปิด = ปุ่มจัดโน้ตเป็นคำอ่านเฉย ๆ ไม่มีอะไรเกี่ยวกับ AI บนจอ */
  aiAssist: boolean;
  onChanged: (r: ReadingT) => void;
  onDeleted: () => void;
  onBack: () => void;
}) {
  const [r, setR] = useState(initial);
  const [notes, setNotes] = useState<Record<string, string>>(initial.notes);
  const [body, setBody] = useState<BodyPartT[]>(initial.body ?? []);
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ tone: "ok" | "err" | "info"; text: string } | null>(null);
  const [notesDirty, setNotesDirty] = useState(false);
  const [bodyDirty, setBodyDirty] = useState(false);
  const [fromKeywords, setFromKeywords] = useState<string[]>([]);

  // จั่วไพ่
  const [phrase, setPhrase] = useState("");
  const count = r.spread?.positions.length ?? 0;
  const [manual, setManual] = useState<Array<{ cardIndex: number | ""; isReversed: boolean }>>(() => Array.from({ length: count }, () => ({ cardIndex: "", isReversed: false })));
  const [drawMode, setDrawMode] = useState<"fair" | "manual">("fair");

  // ส่งลิงก์
  const [expiresDays, setExpiresDays] = useState(30);
  const [password, setPassword] = useState("");
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setR(initial);
    setNotes(initial.notes);
    setBody(initial.body ?? []);
  }, [initial]);

  const apply = (next: ReadingT | null | undefined) => {
    if (!next) return;
    setR(next);
    setNotes(next.notes);
    setBody(next.body ?? []);
    onChanged(next);
  };

  const keys = useMemo(() => partKeys(r, notes, body), [r, notes, body]);
  // มีส่วนไหนมาจาก AI จริงไหม (เผื่อแม่หมอเคยเปิดแล้วปิดทีหลัง) — ไม่มี = ไม่โชว์อะไรเกี่ยวกับ AI
  const bodyHasAi = body.some((p) => p.origin === "ai" || p.origin === "edited");
  const showAiBits = aiAssist || bodyHasAi;
  const draftByKey = useMemo(() => new Map((r.draft?.parts ?? []).map((p) => [p.key, p])), [r.draft]);
  const hasCards = r.cards.length > 0;
  const hasBody = body.some((p) => p.text.trim());

  async function save(patch: Record<string, unknown>, label: string) {
    setBusy(label);
    const res = await call<{ reading: ReadingT }>(`/readings/${r.id}`, { method: "PATCH", body: patch });
    setBusy(null);
    if (!res.ok) {
      setMsg({ tone: "err", text: res.error });
      return false;
    }
    apply(res.data.reading);
    return true;
  }

  async function draw() {
    setMsg(null);
    if (drawMode === "manual") {
      if (manual.some((m) => m.cardIndex === "")) return setMsg({ tone: "err", text: `เลือกไพ่ให้ครบ ${count} ใบก่อน` });
      const idx = manual.map((m) => m.cardIndex as number);
      if (new Set(idx).size !== idx.length) return setMsg({ tone: "err", text: "มีไพ่ซ้ำกัน" });
    }
    setBusy("draw");
    const payload =
      drawMode === "fair"
        ? { mode: "fair", clientSeed: `${phrase.trim()}|${randomHex()}|${Date.now()}` }
        : { mode: "manual", cards: manual.map((m) => ({ cardIndex: m.cardIndex as number, isReversed: m.isReversed })) };
    const res = await call<{ reading: ReadingT }>(`/readings/${r.id}/draw`, { method: "POST", body: payload });
    setBusy(null);
    if (!res.ok) return setMsg({ tone: "err", text: res.error });
    apply(res.data.reading);
    setMsg({ tone: "ok", text: drawMode === "fair" ? "เปิดไพ่แล้ว — ลูกค้าตรวจการสุ่มย้อนหลังได้จากหน้าคำอ่าน" : "บันทึกไพ่จากสำรับของคุณแล้ว" });
  }

  async function saveNotes() {
    if (await save({ notes }, "notes")) {
      setNotesDirty(false);
      setMsg({ tone: "ok", text: "บันทึกโน้ตแล้ว" });
    }
  }

  async function makeDraft() {
    if (notesDirty && !(await save({ notes }, "notes"))) return;
    setNotesDirty(false);
    setBusy("draft");
    setMsg(null);
    const res = await call<{ mode: "ai" | "offline" | "crisis"; reason?: string; message?: string; fromKeywords?: string[]; reading: ReadingT }>(`/readings/${r.id}/draft`, { method: "POST", body: {} });
    setBusy(null);
    if (!res.ok) return setMsg({ tone: "err", text: res.error });
    if (res.data.mode === "crisis") {
      return setMsg({ tone: "info", text: `${res.data.message ?? ""} — ระบบไม่ส่งเรื่องนี้ให้ AI ลองแนะนำสายด่วนสุขภาพจิต 1323 ให้ลูกค้า` });
    }
    setFromKeywords(res.data.fromKeywords ?? []);
    const hadBody = hasBody;
    apply(res.data.reading);
    setBodyDirty(false);
    if (res.data.reason === "ai_off") {
      setMsg({ tone: "ok", text: hadBody ? "จัดโน้ตใหม่แล้ว — กด \"ใช้ข้อความนี้แทน\" ทีละส่วนที่ต้องการ (งานที่คุณแก้ไว้ไม่ถูกทับ)" : "จัดโน้ตเป็นคำอ่านแล้ว — แก้ต่อด้านล่างได้เลย" });
    } else if (res.data.mode === "ai") {
      setMsg({ tone: "ok", text: hadBody ? "ได้ร่างใหม่แล้ว — กด \"ใช้ร่างนี้\" ทีละส่วนที่ต้องการ (งานที่คุณแก้ไว้ไม่ถูกทับ)" : "ได้ร่างแล้ว ส่วนแถบม่วงคือร่างจาก AI ตรวจและแก้ก่อนส่ง" });
    } else {
      const why =
        res.data.reason === "quota"
          ? "ใช้โควตาร่างของวันนี้ครบแล้ว"
          : res.data.reason === "ai_tier_unconfirmed"
            ? "การเกลาด้วย AI ยังปิดอยู่ (รอยืนยันว่าบริการ AI ไม่นำข้อมูลไปฝึกโมเดล)"
            : "ตอนนี้ AI ไม่พร้อม";
      setMsg({ tone: "info", text: `${why} — ประกอบร่างจากโน้ตของคุณให้แทน` });
    }
  }

  function editPart(key: string, text: string) {
    setBodyDirty(true);
    setBody((prev) => {
      const i = prev.findIndex((p) => p.key === key);
      if (i < 0) return [...prev, { key, text, origin: "reader" }];
      const old = prev[i];
      const next = [...prev];
      next[i] = { key, text, origin: old.origin === "ai" || old.origin === "edited" ? "edited" : "reader" };
      return next;
    });
  }

  function takeDraftPart(key: string) {
    const d = draftByKey.get(key);
    if (!d) return;
    setBodyDirty(true);
    setBody((prev) => {
      const rest = prev.filter((p) => p.key !== key);
      return [...rest, { key, text: d.text, origin: d.origin }];
    });
  }

  async function saveBody() {
    const ordered = keys.map((k) => body.find((p) => p.key === k)).filter((p): p is BodyPartT => Boolean(p));
    if (await save({ body: ordered }, "body")) {
      setBodyDirty(false);
      setMsg({ tone: "ok", text: "บันทึกคำอ่านฉบับส่งจริงแล้ว" });
    }
  }

  async function share() {
    if (bodyDirty) await saveBody();
    setBusy("share");
    setMsg(null);
    const res = await call<{ url: string; reading: ReadingT }>(`/readings/${r.id}/share`, { method: "POST", body: { expiresDays, password: password.trim() || null } });
    setBusy(null);
    if (!res.ok) return setMsg({ tone: "err", text: res.error });
    setShareUrl(res.data.url);
    setCopied(false);
    apply(res.data.reading);
  }

  async function revoke() {
    if (!window.confirm("ยกเลิกลิงก์นี้? ลูกค้าจะเปิดลิงก์เดิมไม่ได้ทันที")) return;
    setBusy("revoke");
    const res = await call<{ reading: ReadingT }>(`/readings/${r.id}/share`, { method: "DELETE" });
    setBusy(null);
    if (!res.ok) return setMsg({ tone: "err", text: res.error });
    setShareUrl(null);
    apply(res.data.reading);
    setMsg({ tone: "ok", text: "ยกเลิกลิงก์แล้ว" });
  }

  async function remove() {
    if (!window.confirm("ลบคำอ่านนี้ถาวร? ลิงก์ที่ส่งไปแล้วจะเปิดไม่ได้")) return;
    setBusy("delete");
    const res = await call(`/readings/${r.id}`, { method: "DELETE" });
    setBusy(null);
    if (!res.ok) return setMsg({ tone: "err", text: res.error });
    onDeleted();
  }

  const step = (n: number, title: string, done: boolean) => (
    <div className="flex items-center gap-3">
      <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-sm font-bold ${done ? "bg-gold-ink text-white" : "border border-line-warm bg-surface text-muted"}`}>{n}</span>
      <h3 className="text-lg font-bold text-ink-deep">{title}</h3>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button type="button" onClick={onBack} className="min-h-11 text-sm font-semibold text-gold-ink hover:underline">
          ← คำอ่านทั้งหมด
        </button>
        <button type="button" onClick={remove} disabled={busy === "delete"} className="min-h-11 text-sm text-err hover:underline">
          ลบคำอ่านนี้
        </button>
      </div>

      <section className="space-y-3 rounded-[24px] border border-line bg-surface p-5 sm:p-7">
        <input aria-label="ชื่อคำอ่าน" defaultValue={r.title} onBlur={(e) => e.target.value.trim() && e.target.value !== r.title && save({ title: e.target.value.trim() }, "title")} className={`${fieldCls} text-xl font-bold`} />
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="space-y-1 text-sm text-muted">
            ลูกค้า
            <select value={r.clientId ?? ""} onChange={(e) => save({ clientId: e.target.value || null }, "client")} className={`${fieldCls} min-h-11`}>
              <option value="">— ไม่ระบุ —</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.displayName}
                </option>
              ))}
            </select>
          </label>
          <div className="space-y-1 text-sm text-muted">
            ผัง
            <p className="flex min-h-11 items-center rounded-xl bg-inset-warm px-3.5 text-[15px] text-ink-deep">
              {r.spread?.nameTh ?? "—"} · {count} ใบ
            </p>
          </div>
        </div>
        <label className="block space-y-1 text-sm text-muted">
          คำถามของลูกค้า
          <textarea defaultValue={r.question ?? ""} rows={2} maxLength={500} onBlur={(e) => e.target.value !== (r.question ?? "") && save({ question: e.target.value }, "question")} className={fieldCls} />
        </label>
      </section>

      {msg && (
        <p role="status" className={`rounded-xl px-4 py-3 text-sm ${msg.tone === "err" ? "bg-err-wash text-err" : msg.tone === "ok" ? "bg-ok/10 text-ok" : "bg-inset-warm text-ink"}`}>
          {msg.text}
        </p>
      )}

      {/* ── 1. ไพ่ ── */}
      <section className="space-y-4 rounded-[24px] border border-line bg-surface p-5 sm:p-7">
        {step(1, "ไพ่", hasCards)}
        {r.cardsBroken && <p className="text-sm text-err">ข้อมูลไพ่บางใบเสียหาย กรุณาโหลดใหม่อีกครั้ง</p>}
        {hasCards ? (
          <>
            <ol className="grid grid-cols-3 gap-3 sm:grid-cols-5">
              {r.cards.map((c) => (
                <li key={c.order} className="space-y-1.5 text-center">
                  <CardImage cardId={c.id} image={c.image} alt={c.nameTh} sizes="96px" thumb className={`mx-auto w-full max-w-[96px] rounded-lg shadow ${c.isReversed ? "rotate-180" : ""}`} />
                  <p className="text-[13px] leading-snug text-muted">{r.spread?.positions[c.order]?.nameTh}</p>
                  <p className="text-[13px] font-semibold leading-snug text-ink-deep">
                    {c.nameTh}
                    {c.isReversed ? " (กลับหัว)" : ""}
                  </p>
                </li>
              ))}
            </ol>
            <p className="rounded-xl bg-inset-warm px-4 py-3 text-[13px] leading-relaxed text-ink">
              {r.cardSource === "fair"
                ? "สุ่มแบบตรวจสอบได้ — ลูกค้าเห็นหลักฐานการสุ่มและตรวจย้อนหลังได้จากหน้าคำอ่าน"
                : "ไพ่จากสำรับของคุณ — หน้าลูกค้าจะติดป้าย \"ไพ่จากสำรับของหมอ — ไม่ผ่านการยืนยัน\""}
            </p>
          </>
        ) : (
          <div className="space-y-4">
            <div role="radiogroup" aria-label="ที่มาของไพ่" className="grid gap-3 sm:grid-cols-2">
              {(
                [
                  ["fair", "สุ่มแบบตรวจสอบได้", "ระบบตรึงคำมั่นไว้แล้วก่อนคุณเห็นไพ่ ลูกค้าตรวจได้ว่าไม่มีใครเลือกไพ่ให้"],
                  ["manual", "กรอกจากสำรับของฉัน", "เปิดไพ่จากสำรับจริงแล้วบันทึก ระบบติดป้ายว่าไม่ผ่านการยืนยันให้ตรง ๆ"],
                ] as const
              ).map(([mode, title, desc]) => (
                <button
                  key={mode}
                  type="button"
                  role="radio"
                  aria-checked={drawMode === mode}
                  onClick={() => setDrawMode(mode)}
                  className={`rounded-2xl border p-4 text-left transition-colors ${drawMode === mode ? "border-gold-ink bg-gold-wash/40" : "border-line-warm bg-surface hover:bg-inset-warm"}`}
                >
                  <span className="block text-[15px] font-bold text-ink-deep">{title}</span>
                  <span className="mt-1 block text-[13px] leading-relaxed text-muted">{desc}</span>
                </button>
              ))}
            </div>
            {drawMode === "fair" ? (
              <div className="space-y-3">
                {r.commitment && (
                  <p className="break-all rounded-xl bg-inset-warm px-4 py-3 font-mono text-[12px] text-muted">
                    คำมั่น (ตรึงแล้ว): {r.commitment}
                  </p>
                )}
                <label className="block space-y-1 text-sm text-muted">
                  คำจากลูกค้า (ไม่บังคับ) — เช่น ให้ลูกค้าพิมพ์คำหรือวันเกิด ใช้ร่วมสุ่ม
                  <input value={phrase} onChange={(e) => setPhrase(e.target.value)} maxLength={120} className={`${fieldCls} min-h-11`} />
                </label>
                <button type="button" onClick={draw} disabled={busy === "draw" || !count} className={btnPrimary}>
                  {busy === "draw" ? "กำลังเปิดไพ่…" : `เปิดไพ่ ${count} ใบ`}
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {Array.from({ length: count }, (_, i) => (
                  <div key={i} className="grid gap-2 rounded-xl border border-line-soft p-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
                    <label className="space-y-1 text-[13px] text-muted">
                      ใบที่ {i + 1} · {r.spread?.positions[i]?.nameTh}
                      <select
                        value={manual[i]?.cardIndex ?? ""}
                        onChange={(e) => setManual((m) => m.map((x, j) => (j === i ? { ...x, cardIndex: e.target.value === "" ? "" : Number(e.target.value) } : x)))}
                        className={`${fieldCls} min-h-11`}
                      >
                        <option value="">— เลือกไพ่ —</option>
                        {SUIT_GROUPS.map((g) => (
                          <optgroup key={g.label} label={g.label}>
                            {deck.slice(g.from, g.to + 1).map((d) => (
                              <option key={d.index} value={d.index}>
                                {d.nameTh} · {d.nameEn}
                              </option>
                            ))}
                          </optgroup>
                        ))}
                      </select>
                    </label>
                    <label className="flex min-h-11 items-center gap-2 text-sm text-ink">
                      <input type="checkbox" checked={manual[i]?.isReversed ?? false} onChange={(e) => setManual((m) => m.map((x, j) => (j === i ? { ...x, isReversed: e.target.checked } : x)))} className="h-5 w-5" />
                      กลับหัว
                    </label>
                  </div>
                ))}
                <button type="button" onClick={draw} disabled={busy === "draw"} className={btnPrimary}>
                  {busy === "draw" ? "กำลังบันทึก…" : "บันทึกไพ่"}
                </button>
              </div>
            )}
            <p className="text-[13px] text-muted">บันทึกไพ่ได้ครั้งเดียว — ถ้าต้องการเปิดใหม่ให้สร้างคำอ่านใหม่</p>
          </div>
        )}
      </section>

      {/* ── 2. โน้ตของหมอ ── */}
      {hasCards && (
        <section className="space-y-4 rounded-[24px] border border-line bg-surface p-5 sm:p-7">
          {step(2, "โน้ตของคุณ", Object.values(notes).some((v) => v.trim()))}
          <p className="text-[13px] leading-relaxed text-muted">
            {aiAssist
              ? "เขียนสั้น ๆ แบบที่คุณอ่านจริง AI จะเกลาจากโน้ตนี้เป็นหลัก ไม่อ่านไพ่แทนคุณ · ตำแหน่งที่เว้นว่างจะได้แค่คำสำคัญของไพ่"
              : "เขียนแบบที่คุณอ่านจริง แล้วกด \"จัดโน้ตเป็นคำอ่าน\" ระบบจะเรียงให้เป็นฉบับส่งลูกค้า · ตำแหน่งที่เว้นว่างจะได้คำสำคัญของไพ่ไว้เริ่มต้น"}
          </p>
          {[{ k: "intro", label: "บทนำ (ไม่บังคับ)" }, ...r.cards.map((c) => ({ k: String(c.order), label: keyLabel(r, `card:${c.order}`) })), { k: "summary", label: "ภาพรวม" }, { k: "closing", label: "คำลงท้าย (ไม่บังคับ)" }].map(({ k, label }) => (
            <label key={k} className="block space-y-1 text-sm font-semibold text-ink-deep">
              {label}
              <textarea
                value={notes[k] ?? ""}
                onChange={(e) => {
                  setNotesDirty(true);
                  setNotes((n) => ({ ...n, [k]: e.target.value }));
                }}
                rows={k === "intro" || k === "closing" ? 2 : 3}
                maxLength={1200}
                className={`${fieldCls} font-normal`}
              />
            </label>
          ))}
          <div className="flex flex-wrap gap-3">
            <button type="button" onClick={saveNotes} disabled={!notesDirty || busy === "notes"} className={btnGhost}>
              {busy === "notes" ? "กำลังบันทึก…" : "บันทึกโน้ต"}
            </button>
            <button type="button" onClick={makeDraft} disabled={busy === "draft"} className={btnPrimary}>
              {busy === "draft" ? (aiAssist ? "กำลังเกลา…" : "กำลังจัด…") : aiAssist ? "ให้ AI ช่วยเกลาจากโน้ต" : "จัดโน้ตเป็นคำอ่าน"}
            </button>
            {aiAssist && quota && (
              <span className="self-center text-[13px] text-muted">
                วันนี้ใช้ไป {quota.used}/{quota.limit} ครั้ง
              </span>
            )}
          </div>
        </section>
      )}

      {/* ── 3. คำอ่านฉบับส่งจริง ── */}
      {hasCards && (
        <section className="space-y-4 rounded-[24px] border border-line bg-surface p-5 sm:p-7">
          {step(3, "คำอ่านฉบับส่งจริง", hasBody)}
          {showAiBits && (
          <ul className="flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-muted" aria-label="ความหมายของแถบสี">
            <li className="flex items-center gap-1.5"><span className="h-3 w-1 rounded bg-line" /> คำของคุณ</li>
            <li className="flex items-center gap-1.5"><span className="h-3 w-1 rounded bg-amethyst" /> ร่างจาก AI</li>
            <li className="flex items-center gap-1.5"><span className="h-3 w-1 rounded bg-gold" /> แก้จากร่าง AI</li>
            <li>แถบสีเห็นเฉพาะคุณ ลูกค้าไม่เห็น</li>
          </ul>
          )}
          {keys.map((k) => {
            const part = body.find((p) => p.key === k);
            const origin = part?.origin ?? "reader";
            const d = draftByKey.get(k);
            const canUseDraft = d && d.text !== part?.text;
            return (
              <div key={k} className={`space-y-2 rounded-r-xl border-l-4 py-2 pl-4 pr-2 ${ORIGIN_STYLE[origin].bar}`}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-bold text-ink-deep">{keyLabel(r, k)}</p>
                  <span className="text-[12px] text-muted">{part ? ORIGIN_STYLE[origin].label : "ยังว่าง"}</span>
                </div>
                {fromKeywords.includes(k) && <p className="text-[12px] text-muted">ตรงนี้คุณไม่มีโน้ต — ข้อความมาจากคำสำคัญของไพ่ ยังไม่ใช่คำของคุณ</p>}
                <textarea value={part?.text ?? ""} onChange={(e) => editPart(k, e.target.value)} rows={k.startsWith("card:") ? 5 : 3} maxLength={2400} className={fieldCls} />
                {canUseDraft && (
                  <button type="button" onClick={() => takeDraftPart(k)} className="min-h-11 text-[13px] font-semibold text-amethyst hover:underline">
                    {aiAssist ? "ใช้ร่างนี้แทน" : "ใช้ข้อความนี้แทน"}: “{d.text.slice(0, 60)}{d.text.length > 60 ? "…" : ""}”
                  </button>
                )}
              </div>
            );
          })}
          {bodyHasAi && (
            <label className="flex min-h-11 items-center gap-3 text-sm text-ink">
              <input type="checkbox" checked={r.showAiDisclosure} onChange={(e) => save({ showAiDisclosure: e.target.checked }, "disclosure")} className="h-5 w-5" />
              แสดงบรรทัด &quot;เรียบเรียงด้วยความช่วยเหลือของ AI&quot; ให้ลูกค้าเห็น (แนะนำ — ปิดได้เมื่อคุณตรวจทานคำอ่านแล้วเท่านั้น การปิดถือว่าคุณรับถ้อยคำเป็นของคุณเอง ตามข้อตกลงข้อ 7.7)
            </label>
          )}
          <button type="button" onClick={saveBody} disabled={!bodyDirty || busy === "body"} className={btnPrimary}>
            {busy === "body" ? "กำลังบันทึก…" : "บันทึกคำอ่าน"}
          </button>
        </section>
      )}

      {/* ── 4. ส่งให้ลูกค้า ── */}
      {hasCards && (
        <section className="space-y-4 rounded-[24px] border border-line bg-surface p-5 sm:p-7">
          {step(4, "ส่งให้ลูกค้า", r.share.active)}
          {r.share.active && (
            <p className="rounded-xl bg-ok/10 px-4 py-3 text-sm text-ok">
              ลิงก์เปิดอยู่ · เปิดดูแล้ว {r.share.viewCount} ครั้ง
              {r.share.expiresAt ? ` · หมดอายุ ${new Date(r.share.expiresAt).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" })}` : ""}
              {r.share.hasPassword ? " · มีรหัส" : ""}
            </p>
          )}
          {shareUrl && (
            <div className="space-y-2 rounded-xl border border-gold-ink/40 bg-gold-wash/30 p-4">
              <p className="text-[13px] text-muted">ลิงก์นี้แสดงครั้งเดียว — คัดลอกส่งให้ลูกค้าตอนนี้ (ระบบเก็บไว้แค่รูปแฮช)</p>
              <p className="break-all font-mono text-sm text-ink-deep">{shareUrl}</p>
              <button
                type="button"
                onClick={async () => setCopied(await copyToClipboard(shareUrl))}
                className={btnGhost}
              >
                {copied ? "คัดลอกแล้ว" : "คัดลอกลิงก์"}
              </button>
            </div>
          )}
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="space-y-1 text-sm text-muted">
              อายุลิงก์
              <select value={expiresDays} onChange={(e) => setExpiresDays(Number(e.target.value))} className={`${fieldCls} min-h-11`}>
                <option value={7}>7 วัน</option>
                <option value={30}>30 วัน</option>
                <option value={90}>90 วัน</option>
              </select>
            </label>
            <label className="space-y-1 text-sm text-muted">
              รหัสเปิดอ่าน (ไม่บังคับ · 4 ตัวขึ้นไป)
              <input type="text" autoComplete="off" value={password} onChange={(e) => setPassword(e.target.value)} maxLength={64} className={`${fieldCls} min-h-11`} />
            </label>
          </div>
          <div className="flex flex-wrap gap-3">
            <button type="button" onClick={share} disabled={busy === "share" || !hasBody || (password.length > 0 && password.trim().length < 4)} className={btnPrimary}>
              {busy === "share" ? "กำลังสร้างลิงก์…" : r.share.active ? "สร้างลิงก์ใหม่ (ลิงก์เดิมใช้ไม่ได้)" : "สร้างลิงก์ส่วนตัว"}
            </button>
            {r.share.active && (
              <button type="button" onClick={revoke} disabled={busy === "revoke"} className={btnGhost}>
                ยกเลิกลิงก์
              </button>
            )}
          </div>
          {!hasBody && <p className="text-[13px] text-muted">เขียนหรือบันทึกคำอ่านฉบับส่งจริงก่อน แล้วค่อยสร้างลิงก์</p>}
          <p className="text-[13px] leading-relaxed text-muted">ลิงก์เดาไม่ได้ ไม่ขึ้น Google และลูกค้าบันทึกเป็น PDF ได้จากหน้าคำอ่าน</p>
        </section>
      )}
    </div>
  );
}
