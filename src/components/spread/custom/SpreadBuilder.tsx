"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useLocale } from "@/lib/i18n";
import { useSessionUser } from "@/lib/auth/use-session";
import {
  POSITION_GROUP_LABEL,
  POSITION_LIBRARY,
  type LibraryPosition,
  type PositionGroup,
} from "@/data/spread-position-library";
import {
  CUSTOM_MAX_CARDS,
  CUSTOM_NAME_MAX,
  CUSTOM_POS_MEANING_MAX,
  CUSTOM_POS_NAME_MAX,
  CUSTOM_STANDARD_MAX_CARDS,
  buildCustomSpread,
  LAYOUT_LABEL,
  layoutPoints,
  layoutsFor,
  validateCustomSpread,
  type CustomPositionInput,
  type CustomSpreadInput,
  type LayoutId,
} from "@/lib/tarot/custom-spread";
import {
  deleteLocalSpread,
  deleteSpreadRemote,
  fetchSharedSpread,
  loadMySpreads,
  queueCustomLaunch,
  saveLocalSpread,
  saveSpreadRemote,
  shareSpreadRemote,
  type MyCustomSpread,
} from "@/lib/tarot/custom-spread-client";
import { mapLayout, MAP_CARD_ASPECT, MAP_CARD_MIN_PX } from "@/lib/tarot/spread-map-geometry";
import { SpreadLayoutGlyph } from "./SpreadLayoutGlyph";
import { smoothScrollBehavior } from "@/lib/use-motion-safe";
import { ThaiPhrases } from "@/components/ui/ThaiPhrases";

/**
 * ✦ ห้องออกแบบผัง `/spreads/create` (REFLECTION_JOURNAL_PLAN 1.8 · คลื่น 5)
 * ---------------------------------------------------------------------------
 *  • เริ่มจากแม่แบบตั้งต้น 3 แบบ หรือหยิบตำแหน่งจากคลังที่เขียนดีแล้ว (แก้ต่อได้) หรือเขียนเองทั้งหมด
 *  • เลย์เอาต์จากแม่แบบเรขาคณิตที่ทดสอบแล้วเท่านั้น — ไม่มีลากวางอิสระ (ไพ่ล้นจอมือถือ · กฎเหล็กข้อ 3 · 9)
 *  • ตรวจผังสด ๆ ด้วยกติกาเดียวกับเซิร์ฟเวอร์ (`validateCustomSpread`) + คำแนะนำที่ไม่บล็อก
 *  • "ใช้ผังนี้เปิดไพ่" ส่งต่อให้พิธีเปิดไพ่หน้าแรก (เซิร์ฟเวอร์ตรวจซ้ำแล้วตรึงลงเซสชันอีกชั้น)
 *  • บอกตรง ๆ ว่า 4–7 ใบนับเป็นผังใหญ่ (สิทธิ์เดียวกับผังใหญ่ในบ้าน)
 *  • `?s=<slug>` = เปิดผังที่มีคนแบ่งปันมาเป็นจุดเริ่ม (ได้แค่โครงผัง ไม่มีข้อมูลของเจ้าของ)
 * ⚠️ island นี้ห้าม import สำรับ/สารานุกรมไพ่ — ไม่มีภาพหน้าไพ่ในหน้านี้เลย (ใช้หลังไพ่ `card-back-pattern`)
 */

type Draft = CustomSpreadInput;

const STARTERS: Array<{ id: string; th: string; en: string; layout: LayoutId; ids: string[] }> = [
  { id: "choice", th: "ตัดสินใจระหว่างสองทาง", en: "Choosing between two paths", layout: "arc", ids: ["option-a", "now", "option-b"] },
  { id: "them", th: "เขาคิดยังไงกับเรา", en: "Where do we stand?", layout: "diamond", ids: ["me-feel", "other-feel", "bond", "next-step"] },
  { id: "fresh", th: "เริ่มต้นใหม่อย่างมั่นใจ", en: "A fresh start", layout: "cross", ids: ["now", "let-go", "me-strength", "opportunity", "next-step"] },
];

const GROUPS = Object.keys(POSITION_GROUP_LABEL) as PositionGroup[];

function fromLibrary(p: LibraryPosition): CustomPositionInput {
  return { nameTh: p.nameTh, nameEn: p.nameEn, meaning: p.meaning, meaningEn: p.meaningEn };
}

function libById(id: string): LibraryPosition | undefined {
  return POSITION_LIBRARY.find((p) => p.id === id);
}

/** แม่แบบที่เข้ากับจำนวนใบใหม่ — คงแบบเดิมถ้ายังใช้ได้ */
function fitLayout(current: LayoutId, count: number): LayoutId {
  if (count === 0) return current;
  if (layoutPoints(current, count)) return current;
  return layoutsFor(count)[0] ?? "row";
}

export const SpreadBuilder: React.FC = () => {
  const { isEnglish } = useLocale();
  const lang: "th" | "en" = isEnglish ? "en" : "th";
  const L = (th: string, en: string) => (isEnglish ? en : th);
  const { user } = useSessionUser();

  const [draft, setDraft] = useState<Draft>({ name: "", layout: "row", positions: [] });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [active, setActive] = useState<number | null>(null);
  const [group, setGroup] = useState<PositionGroup>("me");
  const [mine, setMine] = useState<MyCustomSpread[] | null>(null);
  const [member, setMember] = useState(false);
  const [notice, setNotice] = useState<{ kind: "ok" | "error"; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [sharedFrom, setSharedFrom] = useState(false);
  const [touched, setTouched] = useState(false);

  const n = draft.positions.length;
  const check = useMemo(() => validateCustomSpread(draft, lang), [draft, lang]);
  const isGrand = n > CUSTOM_STANDARD_MAX_CARDS;

  const refreshMine = () => void loadMySpreads().then((r) => (setMine(r.spreads), setMember(r.member)));
  useEffect(refreshMine, [user?.id]);

  // ผังที่มีคนแบ่งปันมา (?s=<slug>) — ใช้เป็นจุดเริ่ม ไม่ผูกกับผังของเจ้าของเดิม
  useEffect(() => {
    const slug = new URLSearchParams(window.location.search).get("s");
    if (!slug || !/^[0-9a-f]{12}$/.test(slug)) return;
    void fetchSharedSpread(slug).then((s) => {
      if (!s) {
        setNotice({ kind: "error", text: L("ลิงก์นี้ถูกปิดแล้วหรือไม่มีอยู่", "This link has been turned off or doesn't exist.") });
        return;
      }
      setDraft({ name: s.name, layout: s.layout, positions: s.positions });
      setSharedFrom(true);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const update = (next: Partial<Draft>) => {
    setTouched(true);
    setNotice(null);
    setDraft((d) => {
      const merged = { ...d, ...next };
      return { ...merged, layout: fitLayout(merged.layout, merged.positions.length) };
    });
  };

  const addPosition = (p: CustomPositionInput) => {
    if (n >= CUSTOM_MAX_CARDS) return;
    update({ positions: [...draft.positions, p] });
    setActive(n);
  };

  const editPosition = (i: number, field: "name" | "meaning", value: string) => {
    const ps = draft.positions.map((p, j) => {
      if (j !== i) return p;
      // ภาษาอังกฤษ: เขียนลงทั้งสองช่อง · ภาษาไทย: แก้ชื่อไทยแล้วทิ้งคำแปลเดิมที่ไม่ตรงอีกต่อไป
      if (field === "name") return isEnglish ? { ...p, nameTh: value, nameEn: value } : { ...p, nameTh: value, nameEn: undefined };
      return isEnglish ? { ...p, meaning: value, meaningEn: value } : { ...p, meaning: value, meaningEn: undefined };
    });
    update({ positions: ps });
  };

  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= n) return;
    const ps = [...draft.positions];
    [ps[i], ps[j]] = [ps[j], ps[i]];
    update({ positions: ps });
    setActive(j);
  };

  const remove = (i: number) => {
    update({ positions: draft.positions.filter((_, j) => j !== i) });
    setActive(null);
  };

  const loadStarter = (s: (typeof STARTERS)[number]) => {
    const positions = s.ids.map(libById).filter(Boolean).map((p) => fromLibrary(p!));
    setEditingId(null);
    setSharedFrom(false);
    update({ name: L(s.th, s.en), layout: s.layout, positions });
    setActive(null);
  };

  const loadMine = (s: MyCustomSpread) => {
    setEditingId(s.id);
    setSharedFrom(false);
    update({ name: s.name, layout: s.layout, positions: s.positions });
    setActive(null);
    window.scrollTo({ top: 0, behavior: smoothScrollBehavior() });
  };

  const startOver = () => {
    setEditingId(null);
    setSharedFrom(false);
    setTouched(false);
    setDraft({ name: "", layout: "row", positions: [] });
    setActive(null);
  };

  const save = async (): Promise<string | undefined> => {
    setTouched(true);
    if (!check.ok) return undefined;
    setBusy(true);
    try {
      if (member) {
        const r = await saveSpreadRemote(draft, lang, editingId && !editingId.startsWith("local_") ? editingId : undefined);
        if (r.spread) {
          setEditingId(r.spread.id);
          setNotice({ kind: "ok", text: L("บันทึกผังไว้ในบัญชีแล้ว", "Saved to your account.") });
          refreshMine();
          return r.spread.id;
        }
        setNotice({ kind: "error", text: r.error ?? L("บันทึกไม่สำเร็จ", "Could not save.") });
        return undefined;
      }
      const local = saveLocalSpread(draft, editingId?.startsWith("local_") ? editingId : undefined);
      if (!local) {
        setNotice({ kind: "error", text: L("เก็บในเครื่องได้สูงสุด 10 ผัง — ลบผังเก่าก่อน หรือเข้าสู่ระบบเพื่อเก็บในบัญชี", "This device holds up to 10 spreads — delete one, or sign in to keep them in your account.") });
        return undefined;
      }
      setEditingId(local.id);
      setNotice({ kind: "ok", text: L("เก็บผังไว้ในเครื่องนี้แล้ว (เข้าสู่ระบบเพื่อใช้ข้ามเครื่อง)", "Saved on this device (sign in to use it everywhere).") });
      refreshMine();
      return local.id;
    } finally {
      setBusy(false);
    }
  };

  const useNow = () => {
    setTouched(true);
    if (!check.ok) return;
    const savedId = editingId && editingId.startsWith("cs_") ? editingId : undefined;
    if (!queueCustomLaunch({ ...draft, savedId })) {
      setNotice({ kind: "error", text: L("เบราว์เซอร์นี้ไม่ให้ส่งผังต่อ ลองปิดโหมดส่วนตัวแล้วลองใหม่", "Your browser blocked handing the spread over — try outside private mode.") });
      return;
    }
    window.location.href = isEnglish ? "/en" : "/";
  };

  const removeMine = async (s: MyCustomSpread) => {
    if (!window.confirm(L(`ลบผัง "${s.name}" ใช่ไหม`, `Delete "${s.name}"?`))) return;
    if (s.local) deleteLocalSpread(s.id);
    else if (!(await deleteSpreadRemote(s.id))) {
      setNotice({ kind: "error", text: L("ลบไม่สำเร็จ ลองใหม่อีกครั้ง", "Could not delete — try again.") });
      return;
    }
    if (editingId === s.id) setEditingId(null);
    refreshMine();
  };

  const toggleShare = async (s: MyCustomSpread) => {
    const slug = await shareSpreadRemote(s.id, !s.shareSlug);
    if (slug === undefined) {
      setNotice({ kind: "error", text: L("เปลี่ยนการแบ่งปันไม่สำเร็จ", "Could not change sharing.") });
      return;
    }
    if (slug) {
      const url = `${window.location.origin}${isEnglish ? "/en" : ""}/spreads/create?s=${slug}`;
      try {
        await navigator.clipboard.writeText(url);
        setNotice({ kind: "ok", text: L("คัดลอกลิงก์แล้ว — คนที่ได้ลิงก์เห็นแค่โครงผัง ไม่เห็นคำถามหรือไพ่ของคุณ", "Link copied — people see only the spread's structure, never your questions or cards.") });
      } catch {
        setNotice({ kind: "ok", text: url });
      }
    } else {
      setNotice({ kind: "ok", text: L("ปิดลิงก์แล้ว ลิงก์เดิมใช้ไม่ได้อีก", "Link turned off — the old link no longer works.") });
    }
    refreshMine();
  };

  const posName = (p: CustomPositionInput) => (isEnglish ? p.nameEn || p.nameTh : p.nameTh);
  const posMeaning = (p: CustomPositionInput) => (isEnglish ? p.meaningEn || p.meaning : p.meaning);
  // เรขาคณิตชุดเดียวกับแผนผังของผังในบ้าน (`spread-map-geometry` · ด่าน test-spreads/test-custom-spreads ตรวจไม่ทับกัน)
  const built = n > 0 && layoutPoints(draft.layout, n) ? buildCustomSpread(draft) : null;
  const map = built ? mapLayout(built.positions) : null;

  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 pt-6 sm:pt-10 pb-20 space-y-8">
      <header className="text-center space-y-2">
        <p className="text-[11px] sm:text-xs tracking-[0.2em] uppercase text-gold-ink font-serif-th">✦ {L("ห้องออกแบบผัง", "Spread workshop")}</p>
        <h1 className="font-serif-th text-2xl sm:text-4xl font-bold text-ink-deep [text-wrap:balance]">
          <ThaiPhrases>{L("ผังที่ถามตรงกับใจคุณ", "A spread that asks what you mean")}</ThaiPhrases>
        </h1>
        <p className="text-xs sm:text-sm text-muted font-serif-th max-w-xl mx-auto leading-relaxed [text-wrap:balance]">
          {L(
            "เลือกตำแหน่ง 1–7 ใบจากคลังที่แม่หมอเขียนไว้ หรือเขียนเอง แล้วแม่หมอจะอ่านไพ่แต่ละใบผ่านคำถามของคุณตรง ๆ",
            "Pick 1–7 positions from our readers' library or write your own — the reader will read every card through your exact question.",
          )}
        </p>
      </header>

      {sharedFrom && (
        <p className="glass-tile !rounded-xl p-3 text-center text-xs sm:text-sm font-serif-th text-ink-deep">
          {L("ผังนี้มีคนแบ่งปันมา — แก้ได้ตามใจ แล้วบันทึกเป็นของคุณเอง", "Someone shared this spread with you — change anything, then save it as your own.")}
        </p>
      )}

      {n === 0 && (
        <section aria-label={L("แม่แบบตั้งต้น", "Starting points")} className="space-y-3">
          <h2 className="font-serif-th text-base sm:text-lg text-ink-deep text-center"><ThaiPhrases>{L("เริ่มจากแม่แบบ หรือหยิบตำแหน่งด้านล่าง", "Start from a template, or pick positions below")}</ThaiPhrases></h2>
          <div className="grid gap-3 sm:grid-cols-3">
            {STARTERS.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => loadStarter(s)}
                className="tap-overlay-y glass-tile !rounded-2xl p-4 text-left space-y-2 min-h-[44px] hover:-translate-y-0.5 transition-transform"
              >
                <SpreadLayoutGlyph layout={s.layout} count={s.ids.length} size={64} className="text-ink-deep" />
                <span className="block font-serif-th font-semibold text-ink-deep">{L(s.th, s.en)}</span>
                <span className="block text-[11px] text-muted font-serif-th">
                  {s.ids.map((id) => libById(id)).map((p) => (p ? (isEnglish ? p.nameEn : p.nameTh) : "")).join(" · ")}
                </span>
              </button>
            ))}
          </div>
        </section>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] items-start">
        {/* ── ภาพผังสด ── */}
        <section aria-label={L("ภาพผัง", "Spread preview")} className="lg:sticky lg:top-24 space-y-3">
          <div className="altar-card-porcelain !rounded-2xl p-4 sm:p-6">
            <div className="relative w-full" style={{ paddingBottom: `${((map?.boxHeight ?? 0.6) * 100).toFixed(2)}%` }}>
              {built && map ? (
                built.positions.map(({ x, y }, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setActive(i)}
                    aria-label={`${L("ตำแหน่งที่", "Position")} ${i + 1}: ${posName(draft.positions[i]) || L("ยังไม่มีชื่อ", "unnamed")}`}
                    aria-pressed={active === i}
                    className={`absolute rounded-md card-back-pattern border-2 shadow-overlay flex items-center justify-center transition-[border-color,box-shadow] duration-200 ${
                      active === i ? "border-gold-ink ring-2 ring-gold-ink/50" : "border-line-warm/60"
                    }`}
                    style={{
                      left: `${x * 100}%`,
                      top: `${(((y * map.yScale + map.offsetY) / map.boxHeight) * 100).toFixed(3)}%`,
                      width: `${(map.cardW * 100).toFixed(2)}%`,
                      minWidth: MAP_CARD_MIN_PX,
                      aspectRatio: `1 / ${MAP_CARD_ASPECT}`,
                      transform: "translate(-50%, -50%)",
                    }}
                  >
                    <span className="font-serif-th text-sm sm:text-base font-bold text-gold-on-dark">{i + 1}</span>
                  </button>
                ))
              ) : (
                <p className="absolute inset-0 flex items-center justify-center text-center text-sm text-muted font-serif-th px-6">
                  {L("ผังของคุณจะปรากฏตรงนี้", "Your spread will appear here")}
                </p>
              )}
            </div>
            {active !== null && draft.positions[active] && (
              <p className="mt-3 text-center text-xs sm:text-sm font-serif-th text-ink-deep">
                <span className="text-gold-ink font-semibold">{active + 1}. {posName(draft.positions[active]) || L("ยังไม่มีชื่อ", "Unnamed")}</span>
                {posMeaning(draft.positions[active]) ? <span className="text-muted"> — {posMeaning(draft.positions[active])}</span> : null}
              </p>
            )}
          </div>

          {n > 0 && (
            <fieldset className="space-y-2">
              <legend className="text-xs font-serif-th text-muted mb-1">{L("รูปแบบการวาง", "Layout")}</legend>
              <div className="flex flex-wrap gap-2">
                {layoutsFor(n).map((id) => (
                  <button
                    key={id}
                    type="button"
                    aria-pressed={draft.layout === id}
                    onClick={() => update({ layout: id })}
                    className={`tap-overlay-y min-h-[44px] inline-flex items-center gap-2 pl-2 pr-4 rounded-full text-sm font-serif-th text-ink-deep ${
                      draft.layout === id ? "btn-gold-glass font-bold" : "glass-chip"
                    }`}
                  >
                    <SpreadLayoutGlyph layout={id} count={n} size={30} className="text-ink-deep" />
                    {L(LAYOUT_LABEL[id].th, LAYOUT_LABEL[id].en)}
                  </button>
                ))}
              </div>
            </fieldset>
          )}

          {isGrand && (
            <p className="text-[11px] sm:text-xs text-muted font-serif-th leading-relaxed">
              {L(
                `ผัง ${CUSTOM_STANDARD_MAX_CARDS + 1}–${CUSTOM_MAX_CARDS} ใบใช้สิทธิ์เดียวกับผังใหญ่ (ผู้ถือรอบที่เติมไว้ หรือสิทธิ์ลองผังใหญ่ฟรี 1 ครั้ง) · 1–${CUSTOM_STANDARD_MAX_CARDS} ใบเปิดด้วยสิทธิ์รายวันได้เลย`,
                `Spreads of ${CUSTOM_STANDARD_MAX_CARDS + 1}–${CUSTOM_MAX_CARDS} cards use the same access as our larger spreads (credits, or your one free trial) · 1–${CUSTOM_STANDARD_MAX_CARDS} cards use your daily readings.`,
              )}
            </p>
          )}
        </section>

        {/* ── ตัวแก้ผัง ── */}
        <section aria-label={L("ตัวแก้ผัง", "Spread editor")} className="space-y-5">
          <label className="block space-y-1.5">
            <span className="text-xs font-serif-th text-muted">{L("ชื่อผัง", "Spread name")}</span>
            <input
              value={draft.name}
              maxLength={CUSTOM_NAME_MAX}
              onChange={(e) => update({ name: e.target.value })}
              placeholder={L("เช่น ย้ายงานดีไหม", "e.g. Should I change jobs?")}
              className="w-full min-h-[44px] rounded-full border border-line-interactive-warm bg-surface/80 px-4 text-sm font-serif-th text-ink-deep placeholder:text-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-ink"
            />
          </label>

          <ol className="space-y-3">
            {draft.positions.map((p, i) => (
              <li
                key={i}
                className={`glass-tile !rounded-xl p-3 sm:p-4 space-y-2 ${active === i ? "ring-2 ring-gold-ink/60" : ""}`}
                onFocus={() => setActive(i)}
              >
                <div className="flex items-center gap-2">
                  <span className="shrink-0 w-7 h-7 rounded-full card-back-pattern flex items-center justify-center text-xs font-bold text-gold-on-dark">{i + 1}</span>
                  <input
                    value={posName(p)}
                    maxLength={CUSTOM_POS_NAME_MAX}
                    onChange={(e) => editPosition(i, "name", e.target.value)}
                    aria-label={`${L("ชื่อตำแหน่งที่", "Name of position")} ${i + 1}`}
                    placeholder={L("ชื่อตำแหน่ง", "Position name")}
                    className="flex-1 min-w-0 min-h-[44px] rounded-full border border-line-interactive-warm bg-surface/80 px-3 text-sm font-serif-th text-ink-deep placeholder:text-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-ink"
                  />
                  <div className="flex shrink-0">
                    <button type="button" onClick={() => move(i, -1)} disabled={i === 0} aria-label={L("เลื่อนขึ้น", "Move up")} className="tap-overlay-y min-h-[44px] min-w-[36px] text-gold-ink disabled:opacity-30">↑</button>
                    <button type="button" onClick={() => move(i, 1)} disabled={i === n - 1} aria-label={L("เลื่อนลง", "Move down")} className="tap-overlay-y min-h-[44px] min-w-[36px] text-gold-ink disabled:opacity-30">↓</button>
                    <button type="button" onClick={() => remove(i)} aria-label={L("ลบตำแหน่งนี้", "Remove this position")} className="tap-overlay-y min-h-[44px] min-w-[36px] text-muted hover:text-ink-deep">×</button>
                  </div>
                </div>
                <textarea
                  value={posMeaning(p)}
                  maxLength={CUSTOM_POS_MEANING_MAX}
                  onChange={(e) => editPosition(i, "meaning", e.target.value)}
                  rows={2}
                  aria-label={`${L("ตำแหน่งที่", "Position")} ${i + 1} ${L("ถามอะไร", "asks")}`}
                  placeholder={L("ตำแหน่งนี้ถามอะไร เช่น สิ่งที่ฉันยังมองไม่เห็นในเรื่องนี้", "What this position asks, e.g. what I'm not seeing yet")}
                  className="w-full rounded-xl border border-line-interactive-warm bg-surface/80 px-3 py-2 text-sm font-serif-th text-ink-deep placeholder:text-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-ink"
                />
              </li>
            ))}
          </ol>

          {n < CUSTOM_MAX_CARDS && (
            <div className="glass-tile !rounded-xl p-3 sm:p-4 space-y-3">
              <div className="flex items-baseline justify-between gap-2">
                <h2 className="font-serif-th text-sm sm:text-base text-ink-deep">
                  {L(`เพิ่มตำแหน่ง (${n}/${CUSTOM_MAX_CARDS})`, `Add a position (${n}/${CUSTOM_MAX_CARDS})`)}
                </h2>
                <button
                  type="button"
                  onClick={() => addPosition({ nameTh: "", meaning: "" })}
                  className="tap-overlay-y min-h-[44px] text-xs sm:text-sm font-serif-th text-gold-ink font-semibold underline underline-offset-2"
                >
                  {L("เขียนเอง", "Write my own")}
                </button>
              </div>
              <div role="tablist" aria-label={L("หมวดตำแหน่ง", "Position groups")} className="flex flex-wrap gap-1.5">
                {GROUPS.map((g) => (
                  <button
                    key={g}
                    type="button"
                    role="tab"
                    aria-selected={group === g}
                    onClick={() => setGroup(g)}
                    className={`tap-overlay-y min-h-[36px] px-3 rounded-full text-xs font-serif-th ${group === g ? "btn-gold-glass font-bold" : "glass-chip text-ink-deep"}`}
                  >
                    {L(POSITION_GROUP_LABEL[g].th, POSITION_GROUP_LABEL[g].en)}
                  </button>
                ))}
              </div>
              <div role="tabpanel" className="flex flex-wrap gap-2">
                {POSITION_LIBRARY.filter((p) => p.group === group).map((p) => {
                  const used = draft.positions.some((q) => q.nameTh === p.nameTh);
                  return (
                    <button
                      key={p.id}
                      type="button"
                      disabled={used}
                      onClick={() => addPosition(fromLibrary(p))}
                      title={isEnglish ? p.meaningEn : p.meaning}
                      className="tap-overlay-y min-h-[44px] px-3.5 rounded-full glass-chip text-sm font-serif-th text-ink-deep disabled:opacity-40"
                    >
                      + {isEnglish ? p.nameEn : p.nameTh}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {touched && (check.errors.length > 0 || check.warnings.length > 0) && (
            <div aria-live="polite" className="space-y-1.5 text-xs sm:text-sm font-serif-th">
              {check.errors.map((e) => (
                <p key={e} className="text-err">✦ {e}</p>
              ))}
              {check.warnings.map((w) => (
                <p key={w} className="text-muted">✦ {w}</p>
              ))}
            </div>
          )}

          {notice && (
            <p aria-live="polite" className={`text-xs sm:text-sm font-serif-th break-words ${notice.kind === "error" ? "text-err" : "text-gold-ink"}`}>
              {notice.text}
            </p>
          )}

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={useNow}
              disabled={n === 0}
              className="tap-overlay-y min-h-[44px] inline-flex items-center px-6 rounded-full btn-gold-glass text-sm font-serif-th font-bold disabled:opacity-50"
            >
              {L("ใช้ผังนี้เปิดไพ่", "Read with this spread")}
            </button>
            <button
              type="button"
              onClick={() => void save()}
              disabled={n === 0 || busy}
              className="tap-overlay-y min-h-[44px] inline-flex items-center px-5 rounded-full glass-chip text-sm font-serif-th text-ink-deep disabled:opacity-50"
            >
              {editingId ? L("บันทึกการแก้ไข", "Save changes") : L("บันทึกผัง", "Save spread")}
            </button>
            {(n > 0 || editingId) && (
              <button type="button" onClick={startOver} className="tap-overlay-y min-h-[44px] px-3 text-sm font-serif-th text-muted underline underline-offset-2">
                {L("เริ่มใหม่", "Start over")}
              </button>
            )}
          </div>
        </section>
      </div>

      {mine && mine.length > 0 && (
        <section aria-label={L("ผังของฉัน", "My spreads")} className="space-y-3">
          <h2 className="font-serif-th text-base sm:text-lg text-ink-deep">
            {L("ผังของฉัน", "My spreads")}
            <span className="ml-2 text-xs text-muted">{member ? L("(ในบัญชี)", "(in your account)") : L("(ในเครื่องนี้)", "(on this device)")}</span>
          </h2>
          <ul className="grid gap-3 sm:grid-cols-2">
            {mine.map((s) => (
              <li key={s.id} className={`glass-tile !rounded-xl p-3 sm:p-4 flex gap-3 ${editingId === s.id ? "ring-2 ring-gold-ink/60" : ""}`}>
                <SpreadLayoutGlyph layout={s.layout} count={s.positions.length} size={56} className="text-ink-deep shrink-0" />
                <div className="min-w-0 flex-1 space-y-1">
                  <p className="font-serif-th font-semibold text-ink-deep break-words">{s.name}</p>
                  <p className="text-[11px] text-muted font-serif-th">
                    {L(`${s.positions.length} ใบ`, `${s.positions.length} cards`)}
                    {s.useCount ? ` · ${L(`ใช้แล้ว ${s.useCount} ครั้ง`, `used ${s.useCount}×`)}` : ""}
                    {s.shareSlug ? ` · ${L("เปิดลิงก์แบ่งปันอยู่", "shared by link")}` : ""}
                  </p>
                  <div className="flex flex-wrap gap-x-3 text-xs font-serif-th">
                    <button type="button" onClick={() => loadMine(s)} className="tap-overlay-y min-h-[44px] text-gold-ink font-semibold">{L("แก้ไข", "Edit")}</button>
                    {!s.local && (
                      <button type="button" onClick={() => void toggleShare(s)} className="tap-overlay-y min-h-[44px] text-gold-ink">
                        {s.shareSlug ? L("ปิดลิงก์", "Stop sharing") : L("แบ่งปันลิงก์", "Share link")}
                      </button>
                    )}
                    <button type="button" onClick={() => void removeMine(s)} className="tap-overlay-y min-h-[44px] text-muted">{L("ลบ", "Delete")}</button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
};
