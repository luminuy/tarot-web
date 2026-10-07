"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { trackReflectionEvent } from "@/lib/stats/reflection-events";
import { useLocale } from "@/lib/i18n";
import { useSessionUser } from "@/lib/auth/use-session";
import { STORAGE_KEYS } from "@/lib/storage/keys";
import {
  deleteReading,
  fetchServerReadings,
  flushPendingJournalPatches,
  getReadings,
  searchServerReadings,
  updateReadingMeta,
  type ReadingMetaPatch,
  type ReadingOutcome,
  type SavedReadingItem,
} from "@/lib/utils/history";
import { JournalEntryCard } from "./JournalEntryCard";
import { JournalCalendar } from "./JournalCalendar";
import { JournalOverview } from "./JournalOverview";
import { JournalThreads } from "./JournalThreads";
import { ReflectionPanel } from "./ReflectionPanel";
import { InstallPrompt } from "@/components/pwa/InstallPrompt";
import { AppSettingsCard } from "@/components/pwa/AppSettingsCard";
import { CATEGORY_LABEL, OUTCOME_LABEL, dayKeyOf, formatDate } from "./journal-format";
import { smoothScrollBehavior } from "@/lib/use-motion-safe";
import { ThaiPhrases } from "@/components/ui/ThaiPhrases";

/**
 * ✦ สมุดดวงของฉัน — หน้าเต็ม `/journal` (REFLECTION_JOURNAL_PLAN 1.3 · คลื่น 2)
 * ---------------------------------------------------------------------------
 * 3 มุมมอง: รายการ · ปฏิทิน · ภาพรวม (จำแท็บที่เปิดค้างไว้ในเครื่อง)
 * สมาชิก ➔ ดึงจากเซิร์ฟเวอร์ (ซิงก์ข้ามเครื่อง) · ผู้เยี่ยมชม ➔ ของในเครื่องเท่านั้น พร้อมชวนเข้าสู่ระบบ
 * ทุกการแก้ไขเขียนในเครื่องทันทีแล้วส่งขึ้นเซิร์ฟเวอร์แบบไม่รอ (`updateReadingMeta`)
 * ⚠️ island นี้ห้าม import สารานุกรมไพ่ — ใช้ `deck-index-meta.ts` (เบา) เท่านั้น
 */

type View = "list" | "calendar" | "overview" | "stories";
type Range = "all" | "7" | "30" | "90";

function readView(): View {
  try {
    const v = window.localStorage.getItem(STORAGE_KEYS.journalView);
    return v === "calendar" || v === "overview" || v === "stories" ? v : "list";
  } catch {
    return "list";
  }
}

export function JournalApp() {
  const { isEnglish } = useLocale();
  const L = (o: { th: string; en: string }) => (isEnglish ? o.en : o.th);
  const { user, loading: sessionLoading } = useSessionUser();
  const isMember = Boolean(user);

  const [items, setItems] = useState<SavedReadingItem[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [view, setView] = useState<View>("list");
  const [query, setQuery] = useState("");
  const [serverHits, setServerHits] = useState<SavedReadingItem[] | null>(null);
  const [tagFilter, setTagFilter] = useState<string | null>(null);
  const [category, setCategory] = useState<string>("all");
  const [outcome, setOutcome] = useState<"ALL" | ReadingOutcome>("ALL");
  const [pinnedOnly, setPinnedOnly] = useState(false);
  const [range, setRange] = useState<Range>("all");
  const [day, setDay] = useState<string | null>(null);
  /** ลิงก์จากอีเมลนัดเช็ก `?entry=` / ท้ายคำอ่าน `?thread=` — เปิดตรงไปยังรายการ/เรื่องนั้น */
  const [focusEntry, setFocusEntry] = useState<string | null>(null);
  const [initialThread, setInitialThread] = useState<string | null>(null);
  const editVersion = useRef(0);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const entry = params.get("entry");
    const thread = params.get("thread");
    if (thread && /^th_[0-9a-f-]{36}$/.test(thread)) {
      setInitialThread(thread);
      setView("stories");
    } else if (entry && /^[\w-]{1,80}$/.test(entry)) {
      setFocusEntry(entry);
      setView("list");
    } else {
      setView(readView());
    }
  }, []);

  // ✦ สมุดออฟไลน์: แก้ขณะไม่มีเน็ตเก็บในเครื่องก่อน แล้วส่งขึ้นเมื่อกลับมาออนไลน์
  useEffect(() => {
    if (!isMember) return;
    void flushPendingJournalPatches();
    const onOnline = () => void flushPendingJournalPatches();
    window.addEventListener("online", onOnline);
    return () => window.removeEventListener("online", onOnline);
  }, [isMember]);

  useEffect(() => {
    if (sessionLoading) return;
    let alive = true;
    setItems(getReadings());
    const startVersion = editVersion.current;
    fetchServerReadings({ shouldCommit: () => editVersion.current === startVersion }).then((list) => {
      if (!alive) return;
      if (editVersion.current === startVersion) setItems(list);
      setLoaded(true);
    });
    return () => {
      alive = false;
    };
  }, [sessionLoading, isMember]);

  const chooseView = (v: View) => {
    if (v !== view) trackReflectionEvent(`journal_view:${v}`);
    setView(v);
    try {
      window.localStorage.setItem(STORAGE_KEYS.journalView, v);
    } catch {
      /* โหมดส่วนตัว — จำไม่ได้ก็ไม่เป็นไร */
    }
  };

  const onPatch = useCallback((id: string, patch: ReadingMetaPatch) => {
    editVersion.current++;
    const next = updateReadingMeta(id, patch);
    setItems((list) => list.map((r) => (r.id === id ? (next ?? { ...r }) : r)));
    setServerHits((hits) => (hits ? hits.map((r) => (r.id === id && next ? next : r)) : hits));
  }, []);

  const onDelete = useCallback((id: string) => {
    editVersion.current++;
    deleteReading(id);
    setItems((list) => list.filter((r) => r.id !== id));
    setServerHits((hits) => (hits ? hits.filter((r) => r.id !== id) : hits));
  }, []);

  // ค้นฝั่งเซิร์ฟเวอร์เมื่อสมุดยาวเกินที่โหลดไว้ (สมาชิก · หน่วง 400 ms ไม่ยิงทุกตัวอักษร)
  useEffect(() => {
    setServerHits(null);
    const q = query.trim();
    if (!isMember || q.length < 2 || items.length < 50) return;
    const t = window.setTimeout(() => {
      void searchServerReadings(q).then((hits) => setServerHits(hits));
    }, 400);
    return () => window.clearTimeout(t);
  }, [query, isMember, items.length]);

  const knownTags = useMemo(() => {
    const counts = new Map<string, number>();
    for (const r of items) for (const t of r.tags ?? []) counts.set(t, (counts.get(t) ?? 0) + 1);
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([t]) => t);
  }, [items]);

  const filtered = useMemo(() => {
    const base = serverHits
      ? [...serverHits, ...items.filter((r) => !serverHits.some((h) => h.id === r.id))]
      : items;
    const q = query.trim().toLowerCase();
    const since = range === "all" ? 0 : Date.now() - Number(range) * 86_400_000;
    return base
      .filter((r) => {
        if (pinnedOnly && !r.pinned) return false;
        if (tagFilter && !(r.tags ?? []).includes(tagFilter)) return false;
        if (category !== "all" && r.category !== category) return false;
        if (outcome !== "ALL" && (r.outcome ?? "PENDING") !== outcome) return false;
        if (since && new Date(r.date).getTime() < since) return false;
        if (day && dayKeyOf(r.date) !== day) return false;
        if (focusEntry && r.id !== focusEntry) return false;
        if (!q) return true;
        if (serverHits?.some((h) => h.id === r.id)) return true;
        return (
          r.question.toLowerCase().includes(q) ||
          r.spreadName.toLowerCase().includes(q) ||
          (r.userNote ?? "").toLowerCase().includes(q) ||
          (r.tags ?? []).some((t) => t.toLowerCase().includes(q)) ||
          r.cards.some((c) => c.cardNameTh.toLowerCase().includes(q) || (c.cardNameEn ?? "").toLowerCase().includes(q))
        );
      })
      .sort((a, b) => Number(!!b.pinned) - Number(!!a.pinned) || new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [items, serverHits, query, range, pinnedOnly, tagFilter, category, outcome, day, focusEntry]);

  const activeFilters = Boolean(tagFilter || category !== "all" || outcome !== "ALL" || pinnedOnly || range !== "all" || day || query || focusEntry);
  const clearFilters = () => {
    setTagFilter(null);
    setCategory("all");
    setOutcome("ALL");
    setPinnedOnly(false);
    setRange("all");
    setDay(null);
    setQuery("");
    setFocusEntry(null);
  };

  const tabs: Array<{ id: View; label: string }> = [
    { id: "list", label: L({ th: "รายการ", en: "Entries" }) },
    { id: "calendar", label: L({ th: "ปฏิทิน", en: "Calendar" }) },
    { id: "overview", label: L({ th: "ภาพรวม", en: "Overview" }) },
    { id: "stories", label: L({ th: "เรื่องที่ติดตาม", en: "Stories" }) },
  ];

  return (
    <main id="main-content" className="w-full max-w-4xl mx-auto px-4 sm:px-6 pt-6 sm:pt-10 pb-16 space-y-6">
      <header className="text-center space-y-2">
        <p className="text-[11px] sm:text-xs tracking-[0.2em] uppercase text-gold-ink font-serif-th">✦ {L({ th: "สมุดดวงของฉัน", en: "My reading journal" })} ✦</p>
        <h1 className="font-serif-th text-2xl sm:text-4xl font-bold text-ink-deep [text-wrap:balance]">
          <ThaiPhrases>{L({ th: "ทุกคำอ่าน คือบทหนึ่งของเรื่องคุณ", en: "Every reading is a chapter of your story" })}</ThaiPhrases>
        </h1>
        <p className="text-xs sm:text-sm text-muted font-serif-th max-w-xl mx-auto leading-relaxed [text-wrap:balance]">
          {L({
            th: "กลับมาเขียนว่าเกิดอะไรขึ้นจริง ดูว่าใจเปลี่ยนไปอย่างไร และเห็นไพ่ที่วนมาหาคุณแบบไม่หลอกตัวเอง",
            en: "Come back to write what really happened, see how your heart shifted, and notice which cards keep returning — honestly.",
          })}
        </p>
      </header>

      <InstallPrompt isEnglish={isEnglish} />

      {!sessionLoading && !isMember && (
        <div className="glass-tile !rounded-xl p-4 text-xs sm:text-sm font-serif-th text-ink-deep text-center">
          {L({
            th: "ตอนนี้สมุดอยู่ในเครื่องนี้เท่านั้น (สูงสุด 50 รายการ) — เข้าสู่ระบบเพื่อเก็บถาวรและเปิดได้ทุกเครื่อง",
            en: "Your journal lives on this device only (up to 50 entries). Sign in to keep it safely across devices.",
          })}{" "}
          <a href={isEnglish ? "/en/account" : "/account"} className="text-gold-ink font-semibold underline underline-offset-2">
            {L({ th: "เข้าสู่ระบบ", en: "Sign in" })}
          </a>
        </div>
      )}

      <div role="tablist" aria-label={L({ th: "มุมมองสมุดดวง", en: "Journal views" })} className="flex flex-wrap justify-center gap-1.5 sm:gap-2">
        {tabs.map((t) => (
          <button
            key={t.id}
            role="tab"
            id={`journal-tab-${t.id}`}
            aria-selected={view === t.id}
            aria-controls={`journal-panel-${t.id}`}
            onClick={() => chooseView(t.id)}
            className={`tap-overlay-y min-h-[44px] px-4 sm:px-6 rounded-full text-xs sm:text-sm font-serif-th font-semibold cursor-pointer transition-colors ${
              view === t.id ? "btn-gold-glass" : "glass-chip text-ink-deep hover:text-gold-ink"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {!loaded && items.length === 0 ? (
        <p className="text-center text-sm text-muted font-serif-th italic" role="status">
          {L({ th: "กำลังเปิดสมุด…", en: "Opening your journal…" })}
        </p>
      ) : items.length === 0 ? (
        <div className="altar-card-porcelain !rounded-2xl p-6 sm:p-10 text-center space-y-3">
          <p className="font-serif-th text-base sm:text-lg text-ink-deep">
            {L({ th: "สมุดยังว่างอยู่ — หน้าแรกรอคำถามแรกของคุณ", en: "Your journal is empty — the first page is waiting for your first question." })}
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            <a href={isEnglish ? "/en" : "/"} className="tap-overlay-y min-h-[44px] inline-flex items-center px-5 rounded-full btn-gold-glass text-sm font-serif-th font-bold">
              {L({ th: "เปิดไพ่เรื่องแรก", en: "Do your first reading" })}
            </a>
            <a href={isEnglish ? "/en/daily" : "/daily"} className="tap-overlay-y min-h-[44px] inline-flex items-center px-5 rounded-full glass-chip text-sm font-serif-th text-ink-deep">
              {L({ th: "เริ่มพิธีเช้า 2 นาที", en: "Start the 2-minute morning ritual" })}
            </a>
          </div>
        </div>
      ) : (
        <>
          <div id="journal-panel-list" role="tabpanel" aria-labelledby="journal-tab-list" hidden={view !== "list"} className="space-y-4">
            {/* ตัวกรอง */}
            <div className="glass-tile !rounded-xl p-3 sm:p-4 space-y-3">
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={L({ th: "ค้นคำถาม ชื่อไพ่ บันทึก หรือแท็ก…", en: "Search questions, cards, notes or tags…" })}
                aria-label={L({ th: "ค้นหาในสมุด", en: "Search the journal" })}
                className="w-full min-h-[44px] rounded-full border border-line-interactive-warm bg-surface/80 px-4 text-sm font-serif-th text-ink-deep placeholder:text-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-ink"
              />
              <div className="flex flex-wrap gap-1.5 text-xs font-serif-th">
                <Chip on={pinnedOnly} onClick={() => setPinnedOnly((v) => !v)}>
                  ✦ {L({ th: "ปักหมุด", en: "Pinned" })}
                </Chip>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  aria-label={L({ th: "หมวด", en: "Category" })}
                  className="min-h-[44px] rounded-full border border-line-interactive-warm bg-surface/80 px-3 text-ink-deep"
                >
                  <option value="all">{L({ th: "ทุกหมวด", en: "All topics" })}</option>
                  {Object.entries(CATEGORY_LABEL).map(([k, v]) => (
                    <option key={k} value={k}>
                      {L(v)}
                    </option>
                  ))}
                </select>
                <select
                  value={outcome}
                  onChange={(e) => setOutcome(e.target.value as "ALL" | ReadingOutcome)}
                  aria-label={L({ th: "ผลจริง", en: "Outcome" })}
                  className="min-h-[44px] rounded-full border border-line-interactive-warm bg-surface/80 px-3 text-ink-deep"
                >
                  <option value="ALL">{L({ th: "ทุกผล", en: "Any outcome" })}</option>
                  {(Object.keys(OUTCOME_LABEL) as ReadingOutcome[]).map((o) => (
                    <option key={o} value={o}>
                      {L(OUTCOME_LABEL[o])}
                    </option>
                  ))}
                </select>
                <select
                  value={range}
                  onChange={(e) => setRange(e.target.value as Range)}
                  aria-label={L({ th: "ช่วงเวลา", en: "Time range" })}
                  className="min-h-[44px] rounded-full border border-line-interactive-warm bg-surface/80 px-3 text-ink-deep"
                >
                  <option value="all">{L({ th: "ทั้งหมด", en: "All time" })}</option>
                  <option value="7">{L({ th: "7 วัน", en: "7 days" })}</option>
                  <option value="30">{L({ th: "30 วัน", en: "30 days" })}</option>
                  <option value="90">{L({ th: "90 วัน", en: "90 days" })}</option>
                </select>
              </div>
              {knownTags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 text-xs font-serif-th">
                  {knownTags.slice(0, 12).map((t) => (
                    <Chip key={t} on={tagFilter === t} onClick={() => setTagFilter((cur) => (cur === t ? null : t))}>
                      #{t}
                    </Chip>
                  ))}
                </div>
              )}
              {activeFilters && (
                <div className="flex items-center justify-between gap-2 text-xs font-serif-th">
                  <span className="text-muted" role="status">
                    {day && `${formatDate(`${day}T12:00:00+07:00`, isEnglish)} · `}
                    {L({ th: `พบ ${filtered.length} รายการ`, en: `${filtered.length} found` })}
                  </span>
                  <button type="button" onClick={clearFilters} className="tap-overlay-y min-h-[44px] px-2 text-gold-ink font-semibold cursor-pointer">
                    {L({ th: "ล้างตัวกรอง", en: "Clear filters" })}
                  </button>
                </div>
              )}
            </div>

            <div className="space-y-3">
              {filtered.map((r) => (
                <JournalEntryCard
                  key={r.id}
                  item={r}
                  isEnglish={isEnglish}
                  isMember={isMember}
                  knownTags={knownTags}
                  onPatch={onPatch}
                  onDelete={onDelete}
                  onTagClick={(t) => setTagFilter(t)}
                  defaultOpen={focusEntry === r.id}
                />
              ))}
              {filtered.length === 0 && (
                <p className="text-center text-sm text-muted font-serif-th py-6">{L({ th: "ไม่พบบันทึกที่ตรงกับตัวกรอง", en: "No entries match these filters." })}</p>
              )}
            </div>
          </div>

          <div id="journal-panel-calendar" role="tabpanel" aria-labelledby="journal-tab-calendar" hidden={view !== "calendar"}>
            {view === "calendar" && (
              <JournalCalendar
                items={items}
                isEnglish={isEnglish}
                onPickDay={(k) => {
                  clearFilters();
                  setDay(k);
                  chooseView("list");
                }}
              />
            )}
          </div>

          <div id="journal-panel-stories" role="tabpanel" aria-labelledby="journal-tab-stories" hidden={view !== "stories"}>
            {view === "stories" && (
              <JournalThreads
                isEnglish={isEnglish}
                isMember={isMember}
                initialThreadId={initialThread}
                knownTags={knownTags}
                onPatch={onPatch}
                onDelete={onDelete}
                renderReflection={(threadId) => (
                  <ReflectionPanel
                    scope={{ threadId }}
                    isEnglish={isEnglish}
                    onOpenEntry={(id) => document.getElementById(`entry-${id}`)?.scrollIntoView({ behavior: smoothScrollBehavior(), block: "start" })}
                  />
                )}
              />
            )}
          </div>

          <div id="journal-panel-overview" role="tabpanel" aria-labelledby="journal-tab-overview" hidden={view !== "overview"}>
            {view === "overview" && (
              <div className="space-y-5">
                {isMember && (
                  <ReflectionPanel
                    scope={{ days: 90 }}
                    isEnglish={isEnglish}
                    onOpenEntry={(id) => {
                      clearFilters();
                      setFocusEntry(id);
                      chooseView("list");
                    }}
                  />
                )}
                <JournalOverview items={items} isEnglish={isEnglish} isMember={isMember} />
                <AppSettingsCard isEnglish={isEnglish} isMember={isMember} />
              </div>
            )}
          </div>
        </>
      )}
    </main>
  );
}

const Chip: React.FC<{ on: boolean; onClick: () => void; children: React.ReactNode }> = ({ on, onClick, children }) => (
  <button
    type="button"
    aria-pressed={on}
    onClick={onClick}
    className={`tap-overlay-y min-h-[44px] px-3.5 rounded-full border cursor-pointer transition-colors ${
      on ? "bg-surface border-gold-ink text-ink-deep font-semibold" : "glass-chip border-line-warm text-ink-deep hover:border-gold-ink"
    }`}
  >
    {children}
  </button>
);
