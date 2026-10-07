"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ensureReadableColor, STUDIO_PAPER } from "@/lib/studio/brand";
import { layoutsFor } from "@/lib/tarot/custom-spread";
import { APP_TIME_ZONE } from "@/lib/time/bangkok";
import { ReadingEditor } from "./ReadingEditor";
import {
  downloadWithAuth,
  makeStudioCall,
  type DeckEntryT,
  type ImportableTicketT,
  type ReadingSummaryT,
  type ReadingT,
  type SpreadOptionT,
  type StudioClientT,
  type StudioSettingsT,
  type StudioTemplateT,
} from "./studio-api";

/**
 * 🪶 Reader Studio — พื้นที่ทำคำอ่านให้ลูกค้าของแม่หมอเอง (REFLECTION_JOURNAL_PLAN 1.13)
 * เข้าด้วยลิงก์เดียวกับแผงคิว (`?token=`) · โทเคนส่งต่อเป็น Bearer เท่านั้น
 * ลำดับหน้า: ยังไม่เปิดระบบ ➔ ข้อตกลงดูแลข้อมูล (DPA) ➔ สตูดิโอ 4 แท็บ
 */

interface Boot {
  reader: { id: string; displayName: string };
  dpa: { version: string; accepted: boolean; acceptedVersion: string | null; points: string[] };
  settings?: StudioSettingsT;
  clients?: StudioClientT[];
  readings?: ReadingSummaryT[];
  templates?: StudioTemplateT[];
  quota?: { used: number; limit: number };
  spreads?: SpreadOptionT[];
  deck?: DeckEntryT[];
}

type Tab = "readings" | "clients" | "templates" | "brand";

const fieldCls =
  "w-full rounded-xl border border-line-interactive-warm bg-surface px-3.5 py-2.5 text-[15px] leading-relaxed text-ink-deep outline-none focus-visible:ring-2 focus-visible:ring-gold-ink/40";
const btnPrimary = "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-gold-ink px-5 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-50";
const btnGhost =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-line-interactive-warm bg-surface px-4 text-sm font-semibold text-ink-deep transition-colors hover:bg-inset-warm disabled:opacity-50";
const card = "rounded-[24px] border border-line bg-surface p-5 sm:p-7";

const fmtDate = (ms: number) => new Date(ms).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "2-digit", timeZone: APP_TIME_ZONE });

export function StudioApp({ token }: { token: string | null }) {
  const call = useMemo(() => makeStudioCall(token), [token]);
  const [boot, setBoot] = useState<Boot | null>(null);
  const [fatal, setFatal] = useState<{ text: string; code?: string } | null>(null);
  const [tab, setTab] = useState<Tab>("readings");
  const [openReading, setOpenReading] = useState<ReadingT | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await call<Boot>("");
    if (!res.ok) return setFatal({ text: res.error, code: res.code });
    setFatal(null);
    setBoot(res.data);
  }, [call]);

  useEffect(() => {
    if (!token) {
      setFatal({ text: "เปิดสตูดิโอผ่านลิงก์จากแผงแม่หมอ (ลิงก์เดียวกับที่ใช้เข้าแผงคิว)" });
      return;
    }
    void load();
  }, [token, load]);

  const openById = async (id: string) => {
    const res = await call<{ reading: ReadingT }>(`/readings/${id}`);
    if (res.ok) setOpenReading(res.data.reading);
    else setNotice(res.error);
  };

  if (fatal) {
    return (
      <div className={`${card} mx-auto max-w-lg space-y-3 text-center`}>
        <p className="text-2xl text-gold-ink">✦</p>
        <h1 className="text-xl font-bold text-ink-deep">{fatal.code === "studio_disabled" ? "สตูดิโอแม่หมอยังไม่เปิดให้ใช้งาน" : "เข้าสตูดิโอไม่ได้"}</h1>
        <p className="text-sm leading-relaxed text-muted">{fatal.code === "studio_disabled" ? "เรากำลังเตรียมข้อตกลงการดูแลข้อมูลลูกค้าให้รัดกุมก่อนเปิดใช้ แล้วจะแจ้งให้ทราบ" : fatal.text}</p>
      </div>
    );
  }
  if (!boot) return <p className="py-20 text-center text-sm text-muted">กำลังเปิดสตูดิโอ…</p>;
  if (!boot.dpa.accepted) return <DpaGate boot={boot} call={call} onAccepted={load} />;

  const clients = boot.clients ?? [];
  const deck = boot.deck ?? [];

  if (openReading) {
    return (
      <ReadingEditor
        reading={openReading}
        call={call}
        deck={deck}
        clients={clients}
        quota={boot.quota ?? null}
        onChanged={(r) => setOpenReading(r)}
        onDeleted={() => {
          setOpenReading(null);
          void load();
        }}
        onBack={() => {
          setOpenReading(null);
          void load();
        }}
      />
    );
  }

  const tabs: Array<[Tab, string]> = [
    ["readings", "คำอ่าน"],
    ["clients", "ลูกค้า"],
    ["templates", "แม่แบบ"],
    ["brand", "แบรนด์ของฉัน"],
  ];

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <p className="text-sm font-semibold text-gold-ink">สตูดิโอแม่หมอ</p>
        <h1 className="text-2xl font-bold text-ink-deep sm:text-3xl">สวัสดี {boot.reader.displayName}</h1>
        <p className="text-sm text-muted">ทำคำอ่านให้ลูกค้าของคุณเอง — คุณอ่าน AI ช่วยเกลา แล้วส่งเป็นลิงก์ส่วนตัวในแบรนด์ของคุณ</p>
      </header>
      <nav role="tablist" aria-label="เมนูสตูดิโอ" className="flex flex-wrap gap-2">
        {tabs.map(([id, label]) => (
          <button
            key={id}
            role="tab"
            type="button"
            aria-selected={tab === id}
            onClick={() => setTab(id)}
            className={`min-h-11 rounded-full px-5 text-sm font-semibold transition-colors ${tab === id ? "bg-ink-deep text-white" : "border border-line-warm bg-surface text-ink hover:bg-inset-warm"}`}
          >
            {label}
          </button>
        ))}
      </nav>
      {notice && (
        <p role="status" className="rounded-xl bg-inset-warm px-4 py-3 text-sm text-ink">
          {notice}
        </p>
      )}
      {tab === "readings" && <ReadingsTab boot={boot} call={call} onOpen={openById} onCreated={(r) => setOpenReading(r)} />}
      {tab === "clients" && <ClientsTab token={token} clients={clients} readings={boot.readings ?? []} call={call} onChanged={load} onOpen={openById} />}
      {tab === "templates" && <TemplatesTab templates={boot.templates ?? []} call={call} onChanged={load} />}
      {tab === "brand" && boot.settings && <BrandTab settings={boot.settings} call={call} onSaved={load} />}
    </div>
  );
}

/* ── ข้อตกลงการดูแลข้อมูล ───────────────────────────────────────── */

function DpaGate({ boot, call, onAccepted }: { boot: Boot; call: ReturnType<typeof makeStudioCall>; onAccepted: () => void }) {
  const [agree, setAgree] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const renewed = Boolean(boot.dpa.acceptedVersion) && boot.dpa.acceptedVersion !== boot.dpa.version;
  return (
    <div className={`${card} mx-auto max-w-2xl space-y-5`}>
      <div className="space-y-1">
        <p className="text-sm font-semibold text-gold-ink">ก่อนเริ่มใช้สตูดิโอ</p>
        <h1 className="text-2xl font-bold text-ink-deep">ข้อตกลงการดูแลข้อมูลลูกค้า</h1>
        {renewed && <p className="text-sm text-ink">ข้อตกลงมีฉบับปรับปรุง กรุณาอ่านและยอมรับอีกครั้ง</p>}
      </div>
      <ol className="space-y-3">
        {boot.dpa.points.map((p, i) => (
          <li key={i} className="flex gap-3 text-[15px] leading-relaxed text-ink">
            <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-inset-warm text-[13px] font-bold text-gold-ink">{i + 1}</span>
            <span>{p}</span>
          </li>
        ))}
      </ol>
      <p className="text-[13px] text-muted">ฉบับ {boot.dpa.version}</p>
      <label className="flex min-h-11 items-start gap-3 text-sm text-ink-deep">
        <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} className="mt-0.5 h-5 w-5 shrink-0" />
        ฉันอ่านแล้ว และจะขอความยินยอมจากลูกค้าก่อนบันทึกข้อมูลของเขาในสตูดิโอ
      </label>
      {err && <p className="text-sm text-err">{err}</p>}
      <button
        type="button"
        disabled={!agree || busy}
        className={btnPrimary}
        onClick={async () => {
          setBusy(true);
          const res = await call("/dpa", { method: "POST", body: { version: boot.dpa.version, agree: true } });
          setBusy(false);
          if (res.ok) onAccepted();
          else setErr(res.error);
        }}
      >
        {busy ? "กำลังบันทึก…" : "ยอมรับและเริ่มใช้สตูดิโอ"}
      </button>
    </div>
  );
}

/* ── แท็บคำอ่าน ──────────────────────────────────────────────────── */

function ReadingsTab({ boot, call, onOpen, onCreated }: { boot: Boot; call: ReturnType<typeof makeStudioCall>; onOpen: (id: string) => void; onCreated: (r: ReadingT) => void }) {
  const [creating, setCreating] = useState(false);
  const readings = boot.readings ?? [];
  const clientName = new Map((boot.clients ?? []).map((c) => [c.id, c.displayName]));
  return (
    <div className="space-y-4">
      {creating ? (
        <NewReadingForm boot={boot} call={call} onCancel={() => setCreating(false)} onCreated={onCreated} />
      ) : (
        <button type="button" onClick={() => setCreating(true)} className={btnPrimary}>
          ✦ เริ่มคำอ่านใหม่
        </button>
      )}
      {readings.length === 0 ? (
        <div className={`${card} text-center text-sm text-muted`}>ยังไม่มีคำอ่าน — เริ่มคำอ่านแรกให้ลูกค้าของคุณได้เลย</div>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {readings.map((r) => (
            <li key={r.id}>
              <button type="button" onClick={() => onOpen(r.id)} className="block w-full rounded-2xl border border-line bg-surface p-4 text-left transition-colors hover:bg-inset-warm">
                <span className="flex items-start justify-between gap-2">
                  <span className="text-[15px] font-bold text-ink-deep">{r.title}</span>
                  <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[12px] font-semibold ${r.shareActive ? "bg-ok/10 text-ok" : r.status === "sent" ? "bg-inset-warm text-muted" : "bg-gold-wash text-gold-ink"}`}>
                    {r.shareActive ? `ส่งแล้ว · เปิด ${r.viewCount}` : r.status === "sent" ? "ลิงก์ปิดแล้ว" : "ร่าง"}
                  </span>
                </span>
                {r.fromQueue && <span className="mt-1 inline-block text-[12px] font-semibold text-gold-ink">จากคิวที่จองผ่านเว็บ</span>}
                <span className="mt-1 block text-[13px] text-muted">
                  {[r.clientId ? clientName.get(r.clientId) : null, r.spreadName, r.cardCount ? `${r.cardCount} ใบ` : "ยังไม่เปิดไพ่", fmtDate(r.updatedAt)].filter(Boolean).join(" · ")}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function NewReadingForm({ boot, call, onCancel, onCreated }: { boot: Boot; call: ReturnType<typeof makeStudioCall>; onCancel: () => void; onCreated: (r: ReadingT) => void }) {
  const [title, setTitle] = useState("");
  const [clientId, setClientId] = useState("");
  const [question, setQuestion] = useState("");
  const [spreadId, setSpreadId] = useState(boot.spreads?.[0]?.id ?? "");
  const [templateId, setTemplateId] = useState("");
  const [custom, setCustom] = useState<Array<{ nameTh: string; meaning: string }>>([
    { nameTh: "", meaning: "" },
    { nameTh: "", meaning: "" },
    { nameTh: "", meaning: "" },
  ]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const isCustom = spreadId === "custom";
  // คิว/นัดที่ลูกค้าจองผ่านเว็บ — เลือกแล้วเติมชื่อ/คำถาม/ลูกค้าให้ (ลูกค้าจองซ้ำ = ลูกค้าคนเดิม)
  const [tickets, setTickets] = useState<ImportableTicketT[] | null>(null);
  const [ticketId, setTicketId] = useState("");
  useEffect(() => {
    let alive = true;
    void call<{ tickets: ImportableTicketT[] }>("/tickets").then((res) => alive && setTickets(res.ok ? res.data.tickets.filter((t) => !t.readingId) : []));
    return () => {
      alive = false;
    };
  }, [call]);
  const pickTicket = (id: string) => {
    setTicketId(id);
    const t = tickets?.find((x) => x.ticketId === id);
    if (!t) return;
    if (!title.trim()) setTitle(`คำอ่านให้${t.nickname ? ` ${t.nickname}` : "ลูกค้าจากคิว"}`);
    if (!question.trim() && t.question) setQuestion(t.question);
    setClientId(t.clientId ?? "");
  };
  const pickedTicket = tickets?.find((x) => x.ticketId === ticketId) ?? null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    if (!title.trim()) return setErr("ตั้งชื่อคำอ่านก่อน");
    const customSpread = isCustom
      ? {
          name: title.trim().slice(0, 60),
          layout: layoutsFor(custom.length)[0],
          positions: custom.map((p, i) => ({ nameTh: p.nameTh.trim() || `ใบที่ ${i + 1}`, meaning: p.meaning.trim() || p.nameTh.trim() || `ใบที่ ${i + 1}` })),
        }
      : undefined;
    setBusy(true);
    const res = await call<{ reading: ReadingT }>("/readings", {
      method: "POST",
      body: { title: title.trim(), clientId: clientId || null, question: question.trim() || null, spreadId, customSpread, ...(templateId ? { templateId } : {}), ...(ticketId ? { ticketId } : {}) },
    });
    setBusy(false);
    if (!res.ok || !res.data.reading) return setErr(res.error || "สร้างไม่สำเร็จ");
    onCreated(res.data.reading);
  };

  return (
    <form onSubmit={submit} className={`${card} space-y-4`}>
      <h2 className="text-lg font-bold text-ink-deep">คำอ่านใหม่</h2>
      {tickets && tickets.length > 0 && (
        <label className="block space-y-1 rounded-2xl bg-inset-warm/60 p-4 text-sm text-muted">
          เริ่มจากคิว/นัดที่ลูกค้าจองผ่านเว็บ (ไม่บังคับ)
          <select value={ticketId} onChange={(e) => pickTicket(e.target.value)} className={`${fieldCls} min-h-11`}>
            <option value="">— ไม่ใช้ —</option>
            {tickets.map((t) => (
              <option key={t.ticketId} value={t.ticketId}>
                {t.nickname || "ลูกค้าไม่ระบุชื่อ"} · {t.kind === "booking" ? "นัดล่วงหน้า" : "คิวสด"} · {fmtDate(t.at)}
              </option>
            ))}
          </select>
          {pickedTicket && (
            <span className="block text-[13px] leading-relaxed">
              {pickedTicket.clientId ? "ลูกค้าคนนี้เคยมาแล้ว — ผูกกับรายชื่อเดิมให้" : "จะเพิ่มเป็นลูกค้าใหม่ในสตูดิโอ"} · ขอความยินยอมจากลูกค้าก่อนบันทึกข้อมูลของเขา
            </span>
          )}
        </label>
      )}
      <label className="block space-y-1 text-sm text-muted">
        ชื่อคำอ่าน
        <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} placeholder="เช่น ความรักช่วงปลายปี" className={`${fieldCls} min-h-11`} />
      </label>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="space-y-1 text-sm text-muted">
          ลูกค้า
          <select value={clientId} onChange={(e) => setClientId(e.target.value)} className={`${fieldCls} min-h-11`}>
            <option value="">{pickedTicket ? "— เพิ่มเป็นลูกค้าใหม่จากคิว —" : "— ไม่ระบุ —"}</option>
            {(boot.clients ?? []).map((c) => (
              <option key={c.id} value={c.id}>
                {c.displayName}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-1 text-sm text-muted">
          แม่แบบ
          <select value={templateId} onChange={(e) => setTemplateId(e.target.value)} className={`${fieldCls} min-h-11`}>
            <option value="">— ไม่ใช้ —</option>
            {(boot.templates ?? []).map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </label>
      </div>
      <label className="block space-y-1 text-sm text-muted">
        คำถามของลูกค้า (ไม่บังคับ)
        <textarea value={question} onChange={(e) => setQuestion(e.target.value)} rows={2} maxLength={500} className={fieldCls} />
      </label>
      <label className="block space-y-1 text-sm text-muted">
        ผังไพ่
        <select value={spreadId} onChange={(e) => setSpreadId(e.target.value)} className={`${fieldCls} min-h-11`}>
          {(boot.spreads ?? []).map((s) => (
            <option key={s.id} value={s.id}>
              {s.nameTh} · {s.count} ใบ
            </option>
          ))}
          <option value="custom">ผังของฉันเอง…</option>
        </select>
      </label>
      {isCustom && (
        <div className="space-y-3 rounded-2xl bg-inset-warm/60 p-4">
          <p className="text-[13px] text-muted">ตั้งชื่อแต่ละตำแหน่ง และบอกสั้น ๆ ว่าไพ่ใบนั้นตอบเรื่องอะไร (1–7 ใบ)</p>
          {custom.map((p, i) => (
            <div key={i} className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)_auto]">
              <input aria-label={`ชื่อตำแหน่งที่ ${i + 1}`} value={p.nameTh} maxLength={60} placeholder={`ตำแหน่งที่ ${i + 1}`} onChange={(e) => setCustom((c) => c.map((x, j) => (j === i ? { ...x, nameTh: e.target.value } : x)))} className={`${fieldCls} min-h-11`} />
              <input aria-label={`ความหมายตำแหน่งที่ ${i + 1}`} value={p.meaning} maxLength={200} placeholder="ใบนี้ตอบเรื่องอะไร" onChange={(e) => setCustom((c) => c.map((x, j) => (j === i ? { ...x, meaning: e.target.value } : x)))} className={`${fieldCls} min-h-11`} />
              <button type="button" aria-label={`ลบตำแหน่งที่ ${i + 1}`} disabled={custom.length <= 1} onClick={() => setCustom((c) => c.filter((_, j) => j !== i))} className={btnGhost}>
                ลบ
              </button>
            </div>
          ))}
          {custom.length < 7 && (
            <button type="button" onClick={() => setCustom((c) => [...c, { nameTh: "", meaning: "" }])} className={btnGhost}>
              + เพิ่มตำแหน่ง
            </button>
          )}
        </div>
      )}
      {err && <p className="text-sm text-err">{err}</p>}
      <div className="flex flex-wrap gap-3">
        <button type="submit" disabled={busy} className={btnPrimary}>
          {busy ? "กำลังสร้าง…" : "สร้างแล้วไปเปิดไพ่"}
        </button>
        <button type="button" onClick={onCancel} className={btnGhost}>
          ยกเลิก
        </button>
      </div>
    </form>
  );
}

/* ── แท็บลูกค้า ──────────────────────────────────────────────────── */

function ClientsTab({
  token,
  clients,
  readings,
  call,
  onChanged,
  onOpen,
}: {
  token: string | null;
  clients: StudioClientT[];
  readings: ReadingSummaryT[];
  call: ReturnType<typeof makeStudioCall>;
  onChanged: () => void;
  onOpen: (id: string) => void;
}) {
  const [q, setQ] = useState("");
  const [form, setForm] = useState<{ id?: string; displayName: string; contact: string; note: string } | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const shown = q.trim() ? clients.filter((c) => c.displayName.toLowerCase().includes(q.trim().toLowerCase())) : clients;
  const count = (id: string) => readings.filter((r) => r.clientId === id).length;

  const save = async () => {
    if (!form?.displayName.trim()) return setMsg("ใส่ชื่อลูกค้าก่อน");
    const body = { displayName: form.displayName.trim(), contact: form.contact.trim() || null, note: form.note.trim() || null };
    const res = form.id ? await call(`/clients/${form.id}`, { method: "PUT", body }) : await call("/clients", { method: "POST", body });
    if (!res.ok) return setMsg(res.error);
    setForm(null);
    setMsg("บันทึกแล้ว");
    onChanged();
  };

  const remove = async (c: StudioClientT) => {
    if (!window.confirm(`ลบ "${c.displayName}" ทั้งคน?\nคำอ่าน ${count(c.id)} รายการและลิงก์ทั้งหมดของลูกค้าคนนี้จะถูกลบถาวร`)) return;
    const res = await call<{ readingsDeleted: number }>(`/clients/${c.id}`, { method: "DELETE" });
    setMsg(res.ok ? `ลบแล้ว (รวมคำอ่าน ${res.data.readingsDeleted} รายการ)` : res.error);
    onChanged();
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <input aria-label="ค้นชื่อลูกค้า" value={q} onChange={(e) => setQ(e.target.value)} placeholder="ค้นชื่อลูกค้า" className={`${fieldCls} min-h-11 max-w-xs`} />
        <button type="button" onClick={() => setForm({ displayName: "", contact: "", note: "" })} className={btnPrimary}>
          + เพิ่มลูกค้า
        </button>
      </div>
      {msg && <p className="text-sm text-ink">{msg}</p>}
      {form && (
        <div className={`${card} space-y-3`}>
          <h2 className="text-lg font-bold text-ink-deep">{form.id ? "แก้ข้อมูลลูกค้า" : "ลูกค้าใหม่"}</h2>
          <input aria-label="ชื่อที่ใช้เรียก" value={form.displayName} maxLength={80} placeholder="ชื่อที่ใช้เรียก" onChange={(e) => setForm({ ...form, displayName: e.target.value })} className={`${fieldCls} min-h-11`} />
          <input aria-label="ช่องทางติดต่อ" value={form.contact} maxLength={160} placeholder="ช่องทางติดต่อ (ไม่บังคับ)" onChange={(e) => setForm({ ...form, contact: e.target.value })} className={`${fieldCls} min-h-11`} />
          <textarea aria-label="บันทึกส่วนตัว" value={form.note} maxLength={2000} rows={3} placeholder="บันทึกส่วนตัวของคุณ (ไม่ส่งให้ AI และลูกค้าไม่เห็น)" onChange={(e) => setForm({ ...form, note: e.target.value })} className={fieldCls} />
          <p className="text-[13px] text-muted">ขอความยินยอมจากลูกค้าก่อนบันทึกข้อมูลของเขาทุกครั้ง</p>
          <div className="flex gap-3">
            <button type="button" onClick={save} className={btnPrimary}>
              บันทึก
            </button>
            <button type="button" onClick={() => setForm(null)} className={btnGhost}>
              ยกเลิก
            </button>
          </div>
        </div>
      )}
      {shown.length === 0 ? (
        <div className={`${card} text-center text-sm text-muted`}>{clients.length ? "ไม่พบชื่อนี้" : "ยังไม่มีลูกค้า"}</div>
      ) : (
        <ul className="space-y-3">
          {shown.map((c) => (
            <li key={c.id} className="space-y-3 rounded-2xl border border-line bg-surface p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="text-[15px] font-bold text-ink-deep">{c.displayName}</p>
                  <p className="text-[13px] text-muted">
                    {[c.contact, `${count(c.id)} คำอ่าน`, `อัปเดต ${fmtDate(c.updatedAt)}`].filter(Boolean).join(" · ")}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={() => setForm({ id: c.id, displayName: c.displayName, contact: c.contact ?? "", note: c.note ?? "" })} className={btnGhost}>
                    แก้ไข
                  </button>
                  <button
                    type="button"
                    onClick={async () => setMsg((await downloadWithAuth(token, `/clients/${c.id}`, `client-${c.id.slice(3, 11)}.json`)) ? "ดาวน์โหลดแล้ว" : "ส่งออกไม่สำเร็จ")}
                    className={btnGhost}
                  >
                    ส่งออกข้อมูล
                  </button>
                  <button type="button" onClick={() => remove(c)} className={`${btnGhost} text-err`}>
                    ลบทั้งคน
                  </button>
                </div>
              </div>
              {readings.some((r) => r.clientId === c.id) && (
                <ul className="flex flex-wrap gap-2">
                  {readings
                    .filter((r) => r.clientId === c.id)
                    .slice(0, 6)
                    .map((r) => (
                      <li key={r.id}>
                        <button type="button" onClick={() => onOpen(r.id)} className="min-h-11 rounded-full border border-line-warm bg-inset-warm/60 px-3 text-[13px] text-ink hover:bg-inset-warm">
                          {r.title}
                        </button>
                      </li>
                    ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/* ── แท็บแม่แบบ ──────────────────────────────────────────────────── */

function TemplatesTab({ templates, call, onChanged }: { templates: StudioTemplateT[]; call: ReturnType<typeof makeStudioCall>; onChanged: () => void }) {
  const [name, setName] = useState("");
  const [intro, setIntro] = useState("");
  const [closing, setClosing] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  return (
    <div className="space-y-4">
      <div className={`${card} space-y-3`}>
        <h2 className="text-lg font-bold text-ink-deep">แม่แบบใหม่</h2>
        <p className="text-[13px] text-muted">บทนำและคำลงท้ายที่คุณใช้บ่อย — เลือกตอนเริ่มคำอ่านใหม่ แล้วจะถูกใส่เป็นโน้ตให้อัตโนมัติ</p>
        <input aria-label="ชื่อแม่แบบ" value={name} onChange={(e) => setName(e.target.value)} maxLength={60} placeholder="ชื่อแม่แบบ เช่น ดูดวงความรักแบบละเอียด" className={`${fieldCls} min-h-11`} />
        <textarea aria-label="บทนำ" value={intro} onChange={(e) => setIntro(e.target.value)} rows={3} maxLength={1200} placeholder="บทนำ" className={fieldCls} />
        <textarea aria-label="คำลงท้าย" value={closing} onChange={(e) => setClosing(e.target.value)} rows={3} maxLength={1200} placeholder="คำลงท้าย" className={fieldCls} />
        {msg && <p className="text-sm text-ink">{msg}</p>}
        <button
          type="button"
          className={btnPrimary}
          onClick={async () => {
            const res = await call("/templates", { method: "POST", body: { name, intro: intro || null, closing: closing || null } });
            if (!res.ok) return setMsg(res.error);
            setName("");
            setIntro("");
            setClosing("");
            setMsg("บันทึกแม่แบบแล้ว");
            onChanged();
          }}
        >
          บันทึกแม่แบบ
        </button>
      </div>
      <ul className="space-y-3">
        {templates.map((t) => (
          <li key={t.id} className="flex flex-wrap items-start justify-between gap-3 rounded-2xl border border-line bg-surface p-4">
            <div className="min-w-0 flex-1">
              <p className="text-[15px] font-bold text-ink-deep">{t.name}</p>
              <p className="mt-1 line-clamp-2 text-[13px] text-muted">{[t.intro, t.closing].filter(Boolean).join(" … ")}</p>
            </div>
            <button
              type="button"
              className={`${btnGhost} text-err`}
              onClick={async () => {
                if (!window.confirm(`ลบแม่แบบ "${t.name}"?`)) return;
                const res = await call(`/templates/${t.id}`, { method: "DELETE" });
                if (res.ok) onChanged();
              }}
            >
              ลบ
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ── แท็บแบรนด์ ──────────────────────────────────────────────────── */

function BrandTab({ settings, call, onSaved }: { settings: StudioSettingsT; call: ReturnType<typeof makeStudioCall>; onSaved: () => void }) {
  const [s, setS] = useState(settings);
  const [msg, setMsg] = useState<string | null>(null);
  const preview = ensureReadableColor(s.brandColor);
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className={`${card} space-y-4`}>
        <label className="block space-y-1 text-sm text-muted">
          ชื่อแบรนด์ (แสดงบนหัวคำอ่าน)
          <input value={s.brandName ?? ""} maxLength={60} onChange={(e) => setS({ ...s, brandName: e.target.value })} className={`${fieldCls} min-h-11`} />
        </label>
        <label className="block space-y-1 text-sm text-muted">
          ลิงก์โลโก้ (https:// · ภาพสี่เหลี่ยมจัตุรัส)
          <input value={s.logoUrl ?? ""} maxLength={500} onChange={(e) => setS({ ...s, logoUrl: e.target.value })} className={`${fieldCls} min-h-11`} />
        </label>
        <div className="space-y-1 text-sm text-muted">
          <label htmlFor="studio-color">สีหลัก</label>
          <div className="flex items-center gap-3">
            <input id="studio-color" type="color" value={preview.color} onChange={(e) => setS({ ...s, brandColor: e.target.value })} className="h-11 w-14 cursor-pointer rounded-lg border border-line-interactive-warm bg-surface" />
            <input aria-label="รหัสสี" value={s.brandColor ?? ""} maxLength={9} onChange={(e) => setS({ ...s, brandColor: e.target.value })} className={`${fieldCls} min-h-11 max-w-[140px] font-mono`} />
            <span className="text-[13px]">คอนทราสต์ {preview.ratio}:1</span>
          </div>
          {preview.adjusted && <p className="text-[13px] text-ink">สีนี้อ่านยากบนพื้นสว่าง ระบบจะปรับให้เข้มขึ้นเป็น {preview.color} โดยอัตโนมัติ</p>}
        </div>
        <label className="block space-y-1 text-sm text-muted">
          ช่องทางติดต่อ (แสดงท้ายคำอ่าน)
          <input value={s.contactLine ?? ""} maxLength={120} placeholder="เช่น LINE @yourname" onChange={(e) => setS({ ...s, contactLine: e.target.value })} className={`${fieldCls} min-h-11`} />
        </label>
        <label className="flex min-h-11 items-center gap-3 text-sm text-ink">
          <input type="checkbox" checked={s.showAiDisclosure} onChange={(e) => setS({ ...s, showAiDisclosure: e.target.checked })} className="h-5 w-5" />
          คำอ่านใหม่แสดงบรรทัด &quot;เรียบเรียงด้วยความช่วยเหลือของ AI&quot; เป็นค่าเริ่มต้น
        </label>
        {msg && <p className="text-sm text-ink">{msg}</p>}
        <button
          type="button"
          className={btnPrimary}
          onClick={async () => {
            const res = await call<{ colorAdjusted: boolean; brandColor: string }>("/settings", { method: "PUT", body: s });
            if (!res.ok) return setMsg(res.error);
            setMsg(res.data.colorAdjusted ? `บันทึกแล้ว — ปรับสีเป็น ${res.data.brandColor} ให้อ่านง่ายขึ้น` : "บันทึกแล้ว");
            onSaved();
          }}
        >
          บันทึกแบรนด์
        </button>
      </div>
      <aside aria-label="ตัวอย่างหัวคำอ่าน" className="space-y-3 rounded-[24px] border border-line p-6 text-center" style={{ backgroundColor: STUDIO_PAPER }}>
        <p className="text-[12px] text-muted">ตัวอย่างที่ลูกค้าเห็น</p>
        <p className="text-sm font-bold" style={{ color: preview.color }}>
          {s.brandName?.trim() || "ชื่อแบรนด์ของคุณ"}
        </p>
        <p className="text-lg font-bold text-ink-deep">ความรักช่วงปลายปี</p>
        <p className="rounded-xl border px-3 py-2 text-[13px]" style={{ borderColor: preview.color, color: preview.color }}>
          ภาพรวม
        </p>
        <p className="text-[12px] text-muted">สร้างด้วย SeerTarot</p>
      </aside>
    </div>
  );
}
