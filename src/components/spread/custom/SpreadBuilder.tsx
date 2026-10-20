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
  queueCustomLaunch,
  saveLocalSpread,
  saveSpreadRemote,
  shareSpreadRemote,
  type MyCustomSpread,
} from "@/lib/tarot/custom-spread-client";
import { mapLayout, MAP_CARD_ASPECT, MAP_CARD_MIN_PX } from "@/lib/tarot/spread-map-geometry";
import { SpreadLayoutGlyph } from "./SpreadLayoutGlyph";
import { loadMyAndMigrate } from "./load-mine";
import { smoothScrollBehavior } from "@/lib/use-motion-safe";
import { Ui2Crumbs } from "@/components/ui2/Ui2PageHero";

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

  const refreshMine = () => void loadMyAndMigrate(lang).then((r) => (setMine(r.spreads), setMember(r.member)));
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

  /*
   * v2 (เจ้าของ 2026-10-16 "สร้างใหม่เลย") — สตูดิโอช่างผัง 3 โซน
   *   คลังตำแหน่ง (เห็นความหมายทุกอัน ไม่ต้องชี้เมาส์ดู tooltip แบบ v1) · ผ้าปูวางไพ่ (ภาพผังสด) · รายการตำแหน่งในผัง
   * ปุ่ม "ใช้ผังนี้เปิดไพ่" อยู่แถบล่างติดจอเสมอ (v1 อยู่ท้ายฟอร์ม ต้องเลื่อนหา)
   */
  const step = n === 0 ? 1 : check.ok ? 3 : 2;
  const steps = [L("เลือกตำแหน่ง", "Pick positions"), L("จัดวางและตั้งชื่อ", "Arrange & name"), L("เปิดไพ่", "Read")];

  return (
    <div className="v2-sb">
      <header className="v2-sb-head">
        <div>
          <Ui2Crumbs
            crumbs={[{ label: L("หน้าแรก", "Home"), href: "/" }, { label: L("ผังพยากรณ์", "Spreads"), href: "/spreads" }, { label: L("ห้องออกแบบผัง", "Spread studio") }]}
          />
          <h1 className="v2-sb-title">
            {isEnglish ? (
              <>
                Design a spread that asks <span className="ui2-gold-night">what you mean</span>
              </>
            ) : (
              <>
                <span className="tp">ออกแบบผังไพ่</span> <span className="tp ui2-gold-night">ที่ถามตรงใจคุณ</span>
              </>
            )}
          </h1>
          <p className="v2-sb-lede">
            {L(
              `หยิบตำแหน่ง 1–${CUSTOM_MAX_CARDS} ใบจากคลังที่แม่หมอเขียนไว้ หรือเขียนเอง แม่หมอจะอ่านไพ่ทุกใบผ่านคำถามของคุณตรง ๆ`,
              `Pick 1–${CUSTOM_MAX_CARDS} positions from our readers' library or write your own. Every card is read through your exact question.`,
            )}
          </p>
        </div>
        <ol className="v2-sb-steps" aria-label={L("ขั้นตอน", "Steps")}>
          {steps.map((s, i) => (
            <li key={s} className={i + 1 < step ? "is-done" : i + 1 === step ? "is-here" : undefined} aria-current={i + 1 === step ? "step" : undefined}>
              <span aria-hidden="true">{i + 1}</span>
              {s}
            </li>
          ))}
        </ol>
      </header>

      {sharedFrom && (
        <p className="v2-sb-banner">{L("ผังนี้มีคนแบ่งปันมา แก้ได้ตามใจ แล้วบันทึกเป็นของคุณเอง", "Someone shared this spread with you. Edit freely, then save it as your own.")}</p>
      )}

      <div className="v2-sb-studio">
        {/* ── โซน 1: คลังตำแหน่ง ── */}
        <section className="v2-sb-zone v2-sb-lib" aria-labelledby="sb-lib-h">
          <div className="v2-sb-zone-h">
            <h2 id="sb-lib-h">{L("คลังตำแหน่ง", "Position library")}</h2>
            <span className="v2-sb-meter">
              {n}/{CUSTOM_MAX_CARDS}
            </span>
          </div>
          <div role="tablist" aria-label={L("หมวดตำแหน่ง", "Position groups")} className="v2-sb-groups">
            {GROUPS.map((g) => (
              <button key={g} type="button" role="tab" aria-selected={group === g} onClick={() => setGroup(g)} className="v2-sb-group">
                {L(POSITION_GROUP_LABEL[g].th, POSITION_GROUP_LABEL[g].en)}
              </button>
            ))}
          </div>
          <ul role="tabpanel" className="v2-sb-pos-list">
            {POSITION_LIBRARY.filter((p) => p.group === group).map((p) => {
              const used = draft.positions.some((q) => q.nameTh === p.nameTh);
              const full = n >= CUSTOM_MAX_CARDS;
              return (
                <li key={p.id}>
                  <button type="button" disabled={used || full} onClick={() => addPosition(fromLibrary(p))} className="v2-sb-pos">
                    <span className="v2-sb-pos-name">{isEnglish ? p.nameEn : p.nameTh}</span>
                    <span className="v2-sb-pos-mean">{isEnglish ? p.meaningEn : p.meaning}</span>
                    <span className="v2-sb-pos-add" aria-hidden="true">{used ? L("ใส่แล้ว", "Added") : L("เพิ่ม", "Add")}</span>
                  </button>
                </li>
              );
            })}
          </ul>
          <button type="button" onClick={() => addPosition({ nameTh: "", meaning: "" })} disabled={n >= CUSTOM_MAX_CARDS} className="ui2-btn-ghost v2-sb-own">
            {L("เขียนตำแหน่งเอง", "Write my own position")}
          </button>
        </section>

        {/* ── โซน 2: ผ้าปูวางไพ่ ── */}
        <section className="v2-sb-zone v2-sb-matzone" aria-label={L("ภาพผัง", "Spread preview")}>
          <div className="v2-sb-mat">
            {built && map ? (
              <div className="v2-sb-mat-area" style={{ paddingBottom: `${(map.boxHeight * 100).toFixed(2)}%` }}>
                {built.positions.map(({ x, y }, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setActive(i)}
                    aria-label={`${L("ตำแหน่งที่", "Position")} ${i + 1}: ${posName(draft.positions[i]) || L("ยังไม่มีชื่อ", "unnamed")}`}
                    aria-pressed={active === i}
                    className="v2-sb-slot card-back-pattern"
                    style={{
                      left: `${x * 100}%`,
                      top: `${(((y * map.yScale + map.offsetY) / map.boxHeight) * 100).toFixed(3)}%`,
                      width: `${(map.cardW * 100).toFixed(2)}%`,
                      minWidth: MAP_CARD_MIN_PX,
                      aspectRatio: `1 / ${MAP_CARD_ASPECT}`,
                    }}
                  >
                    <span>{i + 1}</span>
                  </button>
                ))}
              </div>
            ) : (
              /* ผ้าปูว่าง = แม่แบบตั้งต้นวางรอบนผ้า (v1 อยู่แยกกล่องเหนือฟอร์ม) */
              <div className="v2-sb-starters">
                <p className="v2-sb-starters-k">{L("เริ่มเร็วจากแม่แบบ", "Quick start from a template")}</p>
                <ul>
                  {STARTERS.map((s) => (
                    <li key={s.id}>
                      <button type="button" onClick={() => loadStarter(s)} className="v2-sb-starter">
                        <SpreadLayoutGlyph layout={s.layout} count={s.ids.length} size={72} className="v2-sb-glyph" />
                        <b>{L(s.th, s.en)}</b>
                        <small>
                          {s.ids
                            .map((id) => libById(id))
                            .map((p) => (p ? (isEnglish ? p.nameEn : p.nameTh) : ""))
                            .join(" · ")}
                        </small>
                      </button>
                    </li>
                  ))}
                </ul>
                <p className="v2-sb-starters-or">{L("หรือหยิบตำแหน่งจากคลังมาวางทีละใบ", "or place positions from the library one by one")}</p>
              </div>
            )}
          </div>

          {active !== null && draft.positions[active] && (
            <p className="v2-sb-caption" aria-live="polite">
              <b>
                {active + 1}. {posName(draft.positions[active]) || L("ยังไม่มีชื่อ", "Unnamed")}
              </b>
              {posMeaning(draft.positions[active]) ? <span> {posMeaning(draft.positions[active])}</span> : null}
            </p>
          )}

          {n > 0 && (
            <fieldset className="v2-sb-layouts">
              <legend>{L("รูปแบบการวาง", "Layout")}</legend>
              <div>
                {layoutsFor(n).map((id) => (
                  <button key={id} type="button" aria-pressed={draft.layout === id} onClick={() => update({ layout: id })} className="v2-sb-layout">
                    <SpreadLayoutGlyph layout={id} count={n} size={34} className="v2-sb-glyph" />
                    {L(LAYOUT_LABEL[id].th, LAYOUT_LABEL[id].en)}
                  </button>
                ))}
              </div>
            </fieldset>
          )}

          {isGrand && (
            <p className="v2-sb-fine">
              {L(
                `ผัง ${CUSTOM_STANDARD_MAX_CARDS + 1}–${CUSTOM_MAX_CARDS} ใบใช้สิทธิ์เดียวกับผังใหญ่ (ผู้ถือรอบที่เติมไว้ หรือสิทธิ์ลองผังใหญ่ฟรี 1 ครั้ง) · 1–${CUSTOM_STANDARD_MAX_CARDS} ใบเปิดด้วยสิทธิ์รายวันได้เลย`,
                `Spreads of ${CUSTOM_STANDARD_MAX_CARDS + 1}–${CUSTOM_MAX_CARDS} cards use the same access as our larger spreads (credits, or your one free trial) · 1–${CUSTOM_STANDARD_MAX_CARDS} cards use your daily readings.`,
              )}
            </p>
          )}
        </section>

        {/* ── โซน 3: ตำแหน่งในผัง ── */}
        <section className="v2-sb-zone v2-sb-edit" aria-labelledby="sb-edit-h">
          <div className="v2-sb-zone-h">
            <h2 id="sb-edit-h">{L("ผังของคุณ", "Your spread")}</h2>
          </div>
          <label className="v2-sb-field">
            <span>{L("ชื่อผัง", "Spread name")}</span>
            <input
              value={draft.name}
              maxLength={CUSTOM_NAME_MAX}
              onChange={(e) => update({ name: e.target.value })}
              placeholder={L("เช่น ย้ายงานดีไหม", "e.g. Should I change jobs?")}
            />
          </label>

          {n === 0 ? (
            <p className="v2-sb-empty">{L("ยังไม่มีตำแหน่ง เลือกแม่แบบบนผ้าปู หรือกดเพิ่มจากคลัง", "No positions yet. Pick a template on the mat or add from the library.")}</p>
          ) : (
            <ol className="v2-sb-rows">
              {draft.positions.map((p, i) => (
                <li key={i} className={`v2-sb-row${active === i ? " is-active" : ""}`} onFocus={() => setActive(i)}>
                  <div className="v2-sb-row-top">
                    <span className="v2-sb-num" aria-hidden="true">
                      {i + 1}
                    </span>
                    <input
                      value={posName(p)}
                      maxLength={CUSTOM_POS_NAME_MAX}
                      onChange={(e) => editPosition(i, "name", e.target.value)}
                      aria-label={`${L("ชื่อตำแหน่งที่", "Name of position")} ${i + 1}`}
                      placeholder={L("ชื่อตำแหน่ง", "Position name")}
                    />
                    <div className="v2-sb-row-tools">
                      <button type="button" onClick={() => move(i, -1)} disabled={i === 0} aria-label={L("เลื่อนขึ้น", "Move up")} className="v2-sb-tool is-up" />
                      <button type="button" onClick={() => move(i, 1)} disabled={i === n - 1} aria-label={L("เลื่อนลง", "Move down")} className="v2-sb-tool is-down" />
                      <button type="button" onClick={() => remove(i)} aria-label={L("ลบตำแหน่งนี้", "Remove this position")} className="v2-sb-tool is-del" />
                    </div>
                  </div>
                  <textarea
                    value={posMeaning(p)}
                    maxLength={CUSTOM_POS_MEANING_MAX}
                    onChange={(e) => editPosition(i, "meaning", e.target.value)}
                    rows={2}
                    aria-label={`${L("ตำแหน่งที่", "Position")} ${i + 1} ${L("ถามอะไร", "asks")}`}
                    placeholder={L("ตำแหน่งนี้ถามอะไร เช่น สิ่งที่ฉันยังมองไม่เห็นในเรื่องนี้", "What does this position ask? e.g. What am I not seeing here?")}
                  />
                </li>
              ))}
            </ol>
          )}

          {touched && (check.errors.length > 0 || check.warnings.length > 0) && (
            <div aria-live="polite" className="v2-sb-checks">
              {check.errors.map((e) => (
                <p key={e} className="is-err">
                  {e}
                </p>
              ))}
              {check.warnings.map((w) => (
                <p key={w}>{w}</p>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* แถบคำสั่งติดล่างจอ — เห็นตลอด ไม่ต้องเลื่อนหา */}
      <div className="v2-sb-bar">
        <div className="v2-sb-bar-in">
          <p className="v2-sb-bar-info" aria-live="polite">
            {notice ? (
              <span className={notice.kind === "error" ? "is-err" : "is-ok"}>{notice.text}</span>
            ) : n === 0 ? (
              L("ยังไม่มีไพ่บนผ้าปู", "The mat is empty")
            ) : (
              <>
                <b>{draft.name || L("ผังไม่มีชื่อ", "Untitled spread")}</b> · {L(`${n} ใบ`, `${n} cards`)}
              </>
            )}
          </p>
          <div className="v2-sb-bar-actions">
            {(n > 0 || editingId) && (
              <button type="button" onClick={startOver} className="v2-sb-reset">
                {L("เริ่มใหม่", "Start over")}
              </button>
            )}
            <button type="button" onClick={() => void save()} disabled={n === 0 || busy} className="ui2-btn-ghost v2-sb-save">
              {editingId ? L("บันทึกการแก้ไข", "Save changes") : L("บันทึกผัง", "Save")}
            </button>
            <button type="button" onClick={useNow} disabled={n === 0} className="ui2-btn v2-sb-go">
              {L("ใช้ผังนี้เปิดไพ่", "Read with this spread")}
            </button>
          </div>
        </div>
      </div>

      {mine && mine.length > 0 && (
        <section className="v2-sb-shelf" aria-labelledby="sb-mine-h">
          <h2 id="sb-mine-h">
            {L("ผังของฉัน", "My spreads")}
            <span>{member ? L("ในบัญชี", "in your account") : L("ในเครื่องนี้", "on this device")}</span>
          </h2>
          <ul>
            {mine.map((s) => (
              <li key={s.id} className={`v2-sb-saved${editingId === s.id ? " is-editing" : ""}`}>
                <SpreadLayoutGlyph layout={s.layout} count={s.positions.length} size={64} className="v2-sb-glyph" />
                <div>
                  <p className="v2-sb-saved-name">{s.name}</p>
                  <p className="v2-sb-saved-meta">
                    {L(`${s.positions.length} ใบ`, `${s.positions.length} cards`)}
                    {s.useCount ? ` · ${L(`ใช้แล้ว ${s.useCount} ครั้ง`, `used ${s.useCount}×`)}` : ""}
                    {s.shareSlug ? ` · ${L("เปิดลิงก์แบ่งปันอยู่", "shared by link")}` : ""}
                  </p>
                  <div className="v2-sb-saved-acts">
                    <button type="button" onClick={() => loadMine(s)}>
                      {L("แก้ไข", "Edit")}
                    </button>
                    {!s.local && (
                      <button type="button" onClick={() => void toggleShare(s)}>
                        {s.shareSlug ? L("ปิดลิงก์", "Stop sharing") : L("แบ่งปันลิงก์", "Share link")}
                      </button>
                    )}
                    <button type="button" onClick={() => void removeMine(s)} className="is-quiet">
                      {L("ลบ", "Delete")}
                    </button>
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
