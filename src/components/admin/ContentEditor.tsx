"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

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
      setMsg(`บันทึกแล้ว ✨ (${(data.size / 1024).toFixed(1)} KB) — มีผลกับคำอ่านใหม่ภายใน 1 นาที`);
    } catch {
      setMsg("เชื่อมต่อไม่ได้");
    } finally {
      setSaving(false);
    }
  }, [doc]);

  if (loading || !defaults) {
    return <p className="text-sm text-[#9c93b8]">กำลังโหลด…</p>;
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
              className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                sub === id
                  ? "border-[#ffd700]/70 bg-[#e5c07b]/15 text-[#f5deaa]"
                  : "border-[#e5c07b]/25 text-[#9c93b8] hover:text-[#e5c07b]"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3">
          {msg ? <span className="text-xs text-[#9c93b8]">{msg}</span> : null}
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
    <button onClick={onClick} className="text-[10px] text-[#9c93b8] underline hover:text-[#e5c07b]">
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
    <div className="altar-panel flex flex-col gap-2 rounded-2xl p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-[#e5c07b]">คำสั่งระบบกลาง (system prompt)</h3>
        <ResetLink show={value.length > 0} onClick={() => onChange("")} />
      </div>
      <p className="text-xs text-[#9c93b8]">
        ปล่อยว่าง = ใช้ค่าเริ่มต้นในโค้ด · แก้แล้วมีผลกับทุกบุคลิกแม่หมอ
      </p>
      <Textarea
        rows={16}
        value={value}
        placeholder={fallback}
        onChange={(e) => onChange(e.target.value)}
        className="font-mono text-xs leading-relaxed"
      />
      <div className="flex justify-between text-[10px] text-[#9c93b8]">
        <button onClick={() => setShow((s) => !s)} className="underline hover:text-[#e5c07b]">
          {show ? "ซ่อน" : "ดู"}ค่าเริ่มต้น ({fallback.length.toLocaleString()} ตัวอักษร)
        </button>
        <span>{value.length.toLocaleString()} / 24,000</span>
      </div>
      {show ? (
        <pre className="max-h-64 overflow-auto rounded-xl bg-[#0c0818] p-3 text-[10px] leading-relaxed text-[#9c93b8]">
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
    <div className="altar-panel flex flex-col gap-4 rounded-2xl p-4">
      <select
        value={sel}
        onChange={(e) => setSel(e.target.value)}
        className="w-full max-w-xs rounded-xl border border-[#e5c07b]/25 bg-[#0c0818] px-3 py-2 text-sm text-[#f5deaa]"
      >
        {personas.map((x) => (
          <option key={x.id} value={x.id}>
            {x.nameTh}
          </option>
        ))}
      </select>

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
            <div className="mt-1 flex justify-between text-[10px] text-[#9c93b8]">
              <ResetLink show={!!o.voice} onClick={() => setField("voice", "")} />
              <span>{(o.voice ?? "").length} / 9,000</span>
            </div>
          </>
        )}
      </Field>
    </div>
  );
}

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
  const [selId, setSelId] = useState<string | null>(null);
  const [detail, setDetail] = useState<CardDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    const list = s
      ? cards.filter(
          (c) => c.nameTh.toLowerCase().includes(s) || c.nameEn.toLowerCase().includes(s) || c.id.includes(s),
        )
      : cards;
    return list.slice(0, 60);
  }, [q, cards]);

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
    <div className="grid gap-4 lg:grid-cols-[220px_1fr]">
      <div className="altar-panel flex flex-col gap-2 rounded-2xl p-3">
        <Input placeholder="ค้นหาไพ่…" value={q} onChange={(e) => setQ(e.target.value)} />
        <ul className="max-h-[420px] overflow-auto text-xs">
          {filtered.map((c) => {
            const edited = !!doc.cards?.[c.id];
            return (
              <li key={c.id}>
                <button
                  onClick={() => setSelId(c.id)}
                  className={`flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-left ${
                    selId === c.id ? "bg-[#e5c07b]/15 text-[#f5deaa]" : "text-[#e2d9f3] hover:bg-[#191230]/60"
                  }`}
                >
                  <span className="truncate">{c.nameTh}</span>
                  {edited ? <span className="text-[#ffd700]">✦</span> : null}
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="altar-panel rounded-2xl p-4">
        {!selId ? (
          <p className="text-sm text-[#9c93b8]">เลือกไพ่จากรายการทางซ้าย</p>
        ) : loadingDetail || !detail ? (
          <p className="text-sm text-[#9c93b8]">กำลังโหลด…</p>
        ) : (
          <div className="flex flex-col gap-4">
            <h3 className="text-sm font-semibold text-[#e5c07b]">
              {detail.nameTh} <span className="text-[#9c93b8]">({detail.id})</span>
            </h3>

            <label className="flex items-center gap-2 text-xs text-[#e2d9f3]">
              คำตอบ Yes/No:
              <select
                value={o.yesNo ?? "default"}
                onChange={(e) => setYesNo(e.target.value)}
                className="rounded-lg border border-[#e5c07b]/25 bg-[#0c0818] px-2 py-1 text-xs"
              >
                <option value="default">ค่าเริ่มต้น ({detail.defaults.yesNo})</option>
                <option value="yes">yes</option>
                <option value="no">no</option>
                <option value="maybe">maybe</option>
              </select>
            </label>

            {CATS.map((cat) => (
              <div key={cat.id} className="flex flex-col gap-2 border-t border-[#e5c07b]/15 pt-3">
                <p className="text-xs font-semibold text-[#e5c07b]">{cat.label}</p>
                {(["upright", "reversed"] as const).map((side) => {
                  const cur = o.meanings?.[cat.id]?.[side] ?? "";
                  return (
                    <div key={side}>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-[#9c93b8]">
                          {side === "upright" ? "หัวตั้ง" : "หัวกลับ"}
                        </span>
                        <ResetLink show={!!cur} onClick={() => setMeaning(cat.id, side, "")} />
                      </div>
                      <Textarea
                        rows={2}
                        value={cur}
                        placeholder={detail.defaults.meanings[cat.id][side]}
                        onChange={(e) => setMeaning(cat.id, side, e.target.value)}
                        className="text-xs"
                      />
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
