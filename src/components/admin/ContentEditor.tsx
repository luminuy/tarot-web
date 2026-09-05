"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { CardImage } from "@/components/card/CardImage";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { Input, Textarea } from "@/components/ui/Input";

type Cat = "general" | "love" | "work" | "money" | "self";
const CATS: { id: Cat; label: string }[] = [
  { id: "general", label: "ทั่วไป" },
  { id: "love", label: "ความรัก" },
  { id: "work", label: "การงาน" },
  { id: "money", label: "การเงิน" },
  { id: "self", label: "ตัวเอง" },
];

interface PersonaDefault {
  id: string;
  nameTh: string;
  tagline: string;
  voice: string;
}
interface CardListItem {
  id: string;
  nameTh: string;
  nameEn: string;
}
interface Doc {
  systemPrompt?: string;
  personas?: Record<string, { voice?: string; tagline?: string; nameTh?: string }>;
  cards?: Record<
    string,
    {
      meanings?: Partial<Record<Cat, { upright?: string; reversed?: string }>>;
      keywords?: { upright?: string[]; reversed?: string[] };
      yesNo?: "yes" | "no" | "maybe";
    }
  >;
}
interface CardDetail {
  id: string;
  nameTh: string;
  defaults: {
    meanings: Record<Cat, { upright: string; reversed: string }>;
    keywords: { upright: string[]; reversed: string[] };
    yesNo: string;
  };
}

type SubTab = "prompt" | "persona" | "card";

export default function ContentEditor() {
  const [sub, setSub] = useState<SubTab>("prompt");
  const [doc, setDoc] = useState<Doc>({});
  const [defaults, setDefaults] = useState<{
    systemCore: string;
    personas: PersonaDefault[];
    cards: CardListItem[];
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    fetch("/api/admin/content")
      .then((r) => r.json())
      .then((d) => {
        setDoc(d.doc ?? {});
        setDefaults(d.defaults);
      })
      .catch(() => setMsg("โหลดเนื้อหาไม่สำเร็จ"))
      .finally(() => setLoading(false));
  }, []);

  const patch = useCallback((fn: (d: Doc) => Doc) => {
    setDoc((prev) => fn(structuredClone(prev)));
    setDirty(true);
    setMsg("");
  }, []);

  const save = useCallback(async () => {
    setSaving(true);
    setMsg("");
    try {
      const res = await fetch("/api/admin/content", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(doc),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMsg(data.error || "บันทึกไม่สำเร็จ");
        return;
      }
      setDirty(false);
      setMsg(`บันทึกแล้ว (${(data.size / 1024).toFixed(1)} KB) — มีผลกับคำอ่านใหม่ภายใน 1 นาที`);
    } catch {
      setMsg("เชื่อมต่อไม่ได้");
    } finally {
      setSaving(false);
    }
  }, [doc]);

  if (loading || !defaults) {
    return <p className="text-sm text-[#635B4E]">กำลังโหลด…</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1.5">
          {(
            [
              ["prompt", "prompt กลาง"],
              ["persona", "บุคลิกแม่หมอ"],
              ["card", "ความหมายไพ่"],
            ] as [SubTab, string][]
          ).map(([id, label]) => (
            <button
              key={id}
              onClick={() => setSub(id)}
              className={`rounded-full border px-3 py-1 text-xs font-semibold transition-colors ${
                sub === id
                  ? "border-[#29261F] bg-[#29261F] text-white shadow-xs"
                  : "border-[#D5CEC2] bg-white text-[#635B4E] hover:bg-[#F2EFE9] hover:text-[#29261F]"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3">
          {msg ? <span className="text-xs text-[#635B4E]">{msg}</span> : null}
          <Button size="sm" onClick={save} isLoading={saving} disabled={!dirty}>
            บันทึกทั้งหมด
          </Button>
        </div>
      </div>

      {sub === "prompt" && (
        <PromptTab
          value={doc.systemPrompt ?? ""}
          fallback={defaults.systemCore}
          onChange={(v) => patch((d) => ({ ...d, systemPrompt: v || undefined }))}
        />
      )}

      {sub === "persona" && (
        <PersonaTab personas={defaults.personas} doc={doc} patch={patch} />
      )}

      {sub === "card" && <CardTab cards={defaults.cards} doc={doc} patch={patch} />}
    </div>
  );
}

function ResetLink({ show, onClick }: { show: boolean; onClick: () => void }) {
  if (!show) return null;
  return (
    <button onClick={onClick} className="text-[13px] text-[#635B4E] underline hover:text-[#29261F]">
      คืนค่าเริ่มต้น
    </button>
  );
}

function PromptTab({
  value,
  fallback,
  onChange,
}: {
  value: string;
  fallback: string;
  onChange: (v: string) => void;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="altar-panel flex flex-col gap-2 rounded-2xl border border-[#D5CEC2] bg-white p-5 shadow-xs">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-[#29261F]">คำสั่งระบบกลาง (system prompt)</h3>
        <ResetLink show={value.length > 0} onClick={() => onChange("")} />
      </div>
      <p className="text-xs text-[#635B4E]">
        ปล่อยว่าง = ใช้ค่าเริ่มต้นในโค้ด · แก้แล้วมีผลกับทุกบุคลิกแม่หมอ
      </p>
      <Textarea
        rows={16}
        value={value}
        placeholder={fallback}
        onChange={(e) => onChange(e.target.value)}
        className="font-mono text-xs leading-relaxed"
      />
      <div className="flex justify-between text-[13px] text-[#635B4E]">
        <button onClick={() => setShow((s) => !s)} className="underline hover:text-[#29261F]">
          {show ? "ซ่อน" : "ดู"}ค่าเริ่มต้น ({fallback.length.toLocaleString()} ตัวอักษร)
        </button>
        <span>{value.length.toLocaleString()} / 24,000</span>
      </div>
      {show ? (
        <pre className="max-h-64 overflow-auto rounded-xl border border-[#D5CEC2] bg-[#F8F6F2] p-3 font-mono text-[13px] leading-relaxed text-[#29261F]">
          {fallback}
        </pre>
      ) : null}
    </div>
  );
}

function PersonaTab({
  personas,
  doc,
  patch,
}: {
  personas: PersonaDefault[];
  doc: Doc;
  patch: (fn: (d: Doc) => Doc) => void;
}) {
  const [sel, setSel] = useState(personas[0].id);
  const p = personas.find((x) => x.id === sel)!;
  const o = doc.personas?.[sel] ?? {};

  const setField = (field: "voice" | "tagline" | "nameTh", v: string) =>
    patch((d) => {
      const personasMap = { ...(d.personas ?? {}) };
      const entry = { ...(personasMap[sel] ?? {}) };
      if (v.trim()) entry[field] = v;
      else delete entry[field];
      if (Object.keys(entry).length) personasMap[sel] = entry;
      else delete personasMap[sel];
      return { ...d, personas: Object.keys(personasMap).length ? personasMap : undefined };
    });

  return (
    <div className="altar-panel flex flex-col gap-4 rounded-2xl border border-[#D5CEC2] bg-white p-5 shadow-xs">
      <div>
        <label className="mb-1 block text-xs font-semibold text-[#635B4E]">เลือกแม่หมอ</label>
        <select
          value={sel}
          onChange={(e) => setSel(e.target.value)}
          className="w-full max-w-xs rounded-xl border border-[#D5CEC2] bg-white px-3 py-2 text-sm text-[#29261F] focus:border-[#29261F] focus:outline-none"
        >
          {personas.map((x) => (
            <option key={x.id} value={x.id}>
              {x.nameTh}
            </option>
          ))}
        </select>
      </div>

      <Field label="ชื่อที่แสดงในคำอ่าน (nameTh)">
        {(id) => (
          <div className="flex items-center gap-2">
            <Input
              id={id}
              value={o.nameTh ?? ""}
              placeholder={p.nameTh}
              onChange={(e) => setField("nameTh", e.target.value)}
            />
            <ResetLink show={!!o.nameTh} onClick={() => setField("nameTh", "")} />
          </div>
        )}
      </Field>

      <Field label="คำโปรย (tagline)">
        {(id) => (
          <div className="flex items-center gap-2">
            <Input
              id={id}
              value={o.tagline ?? ""}
              placeholder={p.tagline}
              onChange={(e) => setField("tagline", e.target.value)}
            />
            <ResetLink show={!!o.tagline} onClick={() => setField("tagline", "")} />
          </div>
        )}
      </Field>

      <Field label="น้ำเสียง / บุคลิก (voice) — ต่อท้าย prompt กลาง">
        {(id) => (
          <>
            <Textarea
              id={id}
              rows={12}
              value={o.voice ?? ""}
              placeholder={p.voice}
              onChange={(e) => setField("voice", e.target.value)}
              className="font-mono text-xs leading-relaxed"
            />
            <div className="mt-1 flex justify-between text-[13px] text-[#635B4E]">
              <ResetLink show={!!o.voice} onClick={() => setField("voice", "")} />
              <span>{(o.voice ?? "").length} / 9,000</span>
            </div>
          </>
        )}
      </Field>
    </div>
  );
}

type SuitFilter = "all" | "major" | "wands" | "cups" | "swords" | "pentacles";

const SUIT_OPTIONS: { id: SuitFilter; label: string }[] = [
  { id: "all", label: "ทั้งหมด" },
  { id: "major", label: "Major (22)" },
  { id: "wands", label: "ไม้เท้า (14)" },
  { id: "cups", label: "ถ้วย (14)" },
  { id: "swords", label: "ดาบ (14)" },
  { id: "pentacles", label: "เหรียญ (14)" },
];

function CardTab({
  cards,
  doc,
  patch,
}: {
  cards: CardListItem[];
  doc: Doc;
  patch: (fn: (d: Doc) => Doc) => void;
}) {
  const [q, setQ] = useState("");
  const [suitFilter, setSuitFilter] = useState<SuitFilter>("all");
  const [selId, setSelId] = useState<string | null>(null);
  const [detail, setDetail] = useState<CardDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const filtered = useMemo(() => {
    let list = cards;
    if (suitFilter === "major") {
      list = list.filter((c) => c.id.startsWith("major-"));
    } else if (suitFilter !== "all") {
      list = list.filter((c) => c.id.startsWith(`${suitFilter}-`));
    }

    const s = q.trim().toLowerCase();
    if (s) {
      list = list.filter(
        (c) =>
          c.nameTh.toLowerCase().includes(s) ||
          c.nameEn.toLowerCase().includes(s) ||
          c.id.includes(s),
      );
    }
    return list;
  }, [q, cards, suitFilter]);

  useEffect(() => {
    if (!selId) return;
    setLoadingDetail(true);
    fetch(`/api/admin/content?card=${selId}`)
      .then((r) => r.json())
      .then((d) => setDetail(d))
      .catch(() => setDetail(null))
      .finally(() => setLoadingDetail(false));
  }, [selId]);

  const o = selId ? (doc.cards?.[selId] ?? {}) : {};

  const setMeaning = (cat: Cat, side: "upright" | "reversed", v: string) =>
    patch((d) => {
      const cardsMap = { ...(d.cards ?? {}) };
      const entry = structuredClone(cardsMap[selId!] ?? {});
      entry.meanings = entry.meanings ?? {};
      entry.meanings[cat] = { ...(entry.meanings[cat] ?? {}) };
      if (v.trim()) entry.meanings[cat]![side] = v;
      else delete entry.meanings[cat]![side];
      if (!Object.keys(entry.meanings[cat]!).length) delete entry.meanings[cat];
      if (entry.meanings && !Object.keys(entry.meanings).length) delete entry.meanings;
      if (Object.keys(entry).length) cardsMap[selId!] = entry;
      else delete cardsMap[selId!];
      return { ...d, cards: Object.keys(cardsMap).length ? cardsMap : undefined };
    });

  const setYesNo = (v: string) =>
    patch((d) => {
      const cardsMap = { ...(d.cards ?? {}) };
      const entry = structuredClone(cardsMap[selId!] ?? {});
      if (v === "default") delete entry.yesNo;
      else entry.yesNo = v as "yes" | "no" | "maybe";
      if (Object.keys(entry).length) cardsMap[selId!] = entry;
      else delete cardsMap[selId!];
      return { ...d, cards: Object.keys(cardsMap).length ? cardsMap : undefined };
    });

  return (
    <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
      <div className="altar-panel flex flex-col gap-3 rounded-2xl border border-[#D5CEC2] bg-white p-3 shadow-xs">
        <Input
          placeholder="ค้นหาไพ่ (ชื่อไทย / อังกฤษ / id)…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="text-xs"
        />

        {/* หมวดหมู่ไพ่ / Suit Filter */}
        <div className="flex flex-wrap gap-1">
          {SUIT_OPTIONS.map((opt) => {
            const active = suitFilter === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => setSuitFilter(opt.id)}
                className={`rounded-lg px-2 py-1 text-[11px] font-medium transition-colors ${
                  active
                    ? "bg-[#29261F] text-white shadow-xs"
                    : "border border-[#D5CEC2] bg-white text-[#635B4E] hover:bg-[#F2EFE9] hover:text-[#29261F]"
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>

        <div className="flex items-center justify-between px-1 text-[11px] text-[#635B4E]">
          <span>รายการไพ่ ({filtered.length} ใบ)</span>
          {suitFilter !== "all" || q ? (
            <button
              type="button"
              onClick={() => {
                setSuitFilter("all");
                setQ("");
              }}
              className="text-[#29261F] font-medium hover:underline"
            >
              ล้างตัวกรอง
            </button>
          ) : null}
        </div>

        <ul className="max-h-[460px] overflow-auto space-y-0.5 text-xs pr-1">
          {filtered.length === 0 ? (
            <li className="py-6 text-center text-xs text-[#635B4E]">
              ไม่พบไพ่ที่ตรงกับคำค้น
            </li>
          ) : (
            filtered.map((c) => {
              const edited = !!doc.cards?.[c.id];
              const isSelected = selId === c.id;
              return (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => setSelId(c.id)}
                    className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left transition-colors ${
                      isSelected
                        ? "border border-[#29261F] bg-[#F2EFE9] font-medium text-[#29261F]"
                        : "text-[#29261F] hover:bg-[#F8F6F2]"
                    }`}
                  >
                    <div className="truncate pr-2">
                      <div className="truncate text-xs">{c.nameTh}</div>
                      <div className="truncate text-[10px] text-[#635B4E]">{c.nameEn}</div>
                    </div>
                    {edited ? (
                      <span className="w-1.5 h-1.5 rounded-full bg-[#A58A5C]" title="มีการแก้ไข" />
                    ) : null}
                  </button>
                </li>
              );
            })
          )}
        </ul>
      </div>

      <div className="altar-panel rounded-2xl border border-[#D5CEC2] bg-white p-5 shadow-xs">
        {!selId ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            
            <p className="text-sm font-medium text-[#29261F]">เลือกไพ่จากรายการทางซ้าย</p>
            <p className="text-xs text-[#635B4E] mt-1 max-w-sm">
              คุณสามารถแก้ไขความหมายเฉพาะของไพ่แต่ละใบ ทั้ง 5 ด้าน และค่าผลทำนาย ใช่/ไม่ใช่
            </p>
          </div>
        ) : loadingDetail || !detail ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#29261F] border-t-transparent mb-2" />
            <p className="text-xs text-[#635B4E]">กำลังโหลดข้อมูลไพ่…</p>
          </div>
        ) : (
          <div className="flex flex-col gap-5">
            {/* Header แสดงรูปและชื่อไพ่ 1909 */}
            <div className="flex items-start gap-4 border-b border-[#D5CEC2] pb-4">
              <div className="relative h-24 w-16 shrink-0 overflow-hidden rounded-lg border border-[#D5CEC2] bg-white shadow-xs">
                <CardImage
                  cardId={detail.id}
                  alt={detail.nameTh}
                  sizes="64px"
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-semibold text-[#29261F]">
                    {detail.nameTh}
                  </h3>
                  <span className="rounded border border-[#D5CEC2] bg-[#F2EFE9] px-1.5 py-0.5 text-[10px] text-[#635B4E] font-mono">
                    {detail.id}
                  </span>
                </div>
                <p className="text-xs text-[#635B4E] mt-1">
                  ปรับแต่งความหมายเฉพาะของไพ่ใบนี้ (จะถูกนำไปแทนที่หรือเสริมความหมายมาตรฐาน)
                </p>

                <div className="mt-3 flex items-center gap-3">
                  <label className="flex items-center gap-2 text-xs text-[#29261F]">
                    คำตอบ Yes/No:
                    <select
                      value={o.yesNo ?? "default"}
                      onChange={(e) => setYesNo(e.target.value)}
                      className="rounded-lg border border-[#D5CEC2] bg-white px-2.5 py-1 text-xs text-[#29261F] focus:outline-none focus:border-[#29261F]"
                    >
                      <option value="default">ค่าเริ่มต้น ({detail.defaults.yesNo})</option>
                      <option value="yes">Yes (ใช่/สำเร็จ)</option>
                      <option value="no">No (ไม่ใช่/ยังไม่ถึงเวลา)</option>
                      <option value="maybe">Maybe (ขึ้นอยู่กับปัจจัยอื่น)</option>
                    </select>
                  </label>
                  {o.yesNo ? (
                    <button
                      type="button"
                      onClick={() => setYesNo("default")}
                      className="text-[11px] text-[#635B4E] hover:text-[#29261F] underline"
                    >
                      คืนค่าเริ่มต้น
                    </button>
                  ) : null}
                </div>
              </div>
            </div>

            {/* หมวดความหมาย 5 ด้าน */}
            <div className="space-y-4">
              {CATS.map((cat) => (
                <div key={cat.id} className="flex flex-col gap-2 rounded-xl bg-[#F8F6F2] p-3.5 border border-[#D5CEC2]">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-[#29261F]">
                      ด้าน{cat.label}
                    </p>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {(["upright", "reversed"] as const).map((side) => {
                      const cur = o.meanings?.[cat.id]?.[side] ?? "";
                      return (
                        <div key={side} className="flex flex-col gap-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[12px] font-medium text-[#635B4E]">
                              {side === "upright" ? "หัวตั้ง (Upright)" : "หัวกลับ (Reversed)"}
                            </span>
                            <ResetLink show={!!cur} onClick={() => setMeaning(cat.id, side, "")} />
                          </div>
                          <Textarea
                            rows={3}
                            value={cur}
                            placeholder={detail.defaults.meanings[cat.id][side]}
                            onChange={(e) => setMeaning(cat.id, side, e.target.value)}
                            className="text-xs leading-relaxed"
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
