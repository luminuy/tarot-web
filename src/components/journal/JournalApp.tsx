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
import { deckMeta } from "@/data/cards/deck-index-meta";
import { JournalEntryCard } from "./JournalEntryCard";
import { JournalCalendar } from "./JournalCalendar";
import { JournalOverview } from "./JournalOverview";
import { JournalThreads } from "./JournalThreads";
import { ReflectionPanel } from "./ReflectionPanel";
import { JournalCrisisListener } from "./JournalCrisisListener";
import { InstallPrompt } from "@/components/pwa/InstallPrompt";
import { AppSettingsCard } from "@/components/pwa/AppSettingsCard";
import { CATEGORY_LABEL, OUTCOME_LABEL, dayKeyOf, formatDate, formatMonth } from "./journal-format";
import { APP_TIME_ZONE } from "@/lib/time/bangkok";
import { smoothScrollBehavior } from "@/lib/use-motion-safe";
import { Ui2Crumbs } from "@/components/ui2/Ui2PageHero";

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
          // เทียบทั้งชื่อที่บันทึกไว้ตอนเปิดไพ่และชื่อปัจจุบันในสำรับ — รายการก่อน 2026-10-11 เก็บชื่อไทยแบบเก่าของไพ่ชุดเล็กไว้
          r.cards.some((c) =>
            [c.cardNameTh, c.cardNameEn, deckMeta(c.cardIndex)?.nameTh, deckMeta(c.cardIndex)?.nameEn].some((n) => (n ?? "").toLowerCase().includes(q)),
          )
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

  /*
   * v2 (เจ้าของ 2026-10-16 "สร้างใหม่เลย") — สมุดหนังเล่มจริง: สันสมุดซ้าย (ริบบิ้นคั่นหน้า · ค้นหา · ตัวกรองพับเก็บ)
   * หน้ากระดาษขวาเป็นไดอารี่ไล่ตามเดือน มีตราวันที่ข้างทุกบันทึก
   * v1: ตัวกรอง 4 ตัว + แท็ก 12 อันกางค้างทุกครั้ง ➔ v2: ค้นหาอย่างเดียวก่อน ตัวกรองอยู่ในปุ่ม "ตัวกรอง" (นับจำนวนที่เปิดอยู่)
   */
  const monthKeyNow = dayKeyOf(Date.now()).slice(0, 7);
  const stats = [
    { n: items.length, label: L({ th: "บันทึกทั้งหมด", en: "entries" }) },
    { n: items.filter((r) => dayKeyOf(r.date).startsWith(monthKeyNow)).length, label: L({ th: "เดือนนี้", en: "this month" }) },
    { n: items.filter((r) => r.outcome && r.outcome !== "PENDING").length, label: L({ th: "จดผลจริงแล้ว", en: "outcomes noted" }) },
  ];
  const filterCount = [tagFilter, category !== "all", outcome !== "ALL", pinnedOnly, range !== "all"].filter(Boolean).length;
  const pinned = filtered.filter((r) => r.pinned);
  const months: Array<{ key: string; label: string; rows: SavedReadingItem[] }> = [];
  for (const r of filtered) {
    if (r.pinned) continue;
    const key = dayKeyOf(r.date).slice(0, 7);
    let group = months.find((m) => m.key === key);
    if (!group) {
      group = { key, label: formatMonth(Number(key.slice(0, 4)), Number(key.slice(5, 7)) - 1, isEnglish), rows: [] };
      months.push(group);
    }
    group.rows.push(r);
  }
  const weekday = (iso: string) =>
    new Intl.DateTimeFormat(isEnglish ? "en-GB" : "th-TH", { weekday: "short", timeZone: APP_TIME_ZONE }).format(new Date(iso));
  const renderEntry = (r: SavedReadingItem) => (
    <li key={r.id} className="v2-jr-entry">
      <span className="v2-jr-stamp" aria-hidden="true">
        <b>{Number(dayKeyOf(r.date).slice(8, 10))}</b>
        <small>{weekday(r.date)}</small>
      </span>
      <div className="v2-jr-entry-body">
        <JournalEntryCard
          item={r}
          isEnglish={isEnglish}
          isMember={isMember}
          knownTags={knownTags}
          onPatch={onPatch}
          onDelete={onDelete}
          onTagClick={(t) => setTagFilter(t)}
          defaultOpen={focusEntry === r.id}
        />
      </div>
    </li>
  );

  return (
    <main id="main-content" className="v2-jr">
      {/* บันทึกที่มีสัญญาณวิกฤต ➔ หน้าต่างสายด่วน 1323 (กฎเหล็กข้อ 6 · A3-07) */}
      <JournalCrisisListener />
      {/* ปกสมุด — ชื่อเล่ม + ตัวเลขสั้น ๆ ที่ชวนกลับมาเขียน */}
      <header className="v2-jr-cover">
        <div className="v2-jr-cover-text">
          <Ui2Crumbs crumbs={[{ label: L({ th: "หน้าแรก", en: "Home" }), href: "/" }, { label: L({ th: "สมุดดวงของฉัน", en: "My reading journal" }) }]} />
          <h1 className="v2-jr-title">
            {isEnglish ? (
              <>
                My <span className="ui2-gold-night">reading journal</span>
              </>
            ) : (
              <>
                <span className="tp">สมุดดวง</span>
                <span className="tp ui2-gold-night">ของฉัน</span>
              </>
            )}
          </h1>
          <p className="v2-jr-lede">
            {L({
              th: "ทุกคำอ่านคือหนึ่งบทของเรื่องคุณ กลับมาจดว่าเกิดอะไรขึ้นจริง แล้วดูว่าไพ่ใบไหนวนกลับมาหา",
              en: "Every reading is a chapter of your story. Come back to note what really happened and see which cards keep returning.",
            })}
          </p>
        </div>
        {items.length > 0 && (
          <ul className="v2-jr-stats">
            {stats.map((s) => (
              <li key={s.label}>
                <b>{s.n}</b>
                <span>{s.label}</span>
              </li>
            ))}
          </ul>
        )}
      </header>

      <InstallPrompt isEnglish={isEnglish} />

      <div className="v2-jr-book">
        {/* สันสมุด */}
        <aside className="v2-jr-spine">
          <div role="tablist" aria-label={L({ th: "มุมมองสมุดดวง", en: "Journal views" })} className="v2-jr-tabs">
            {tabs.map((t) => (
              <button
                key={t.id}
                type="button"
                role="tab"
                id={`journal-tab-${t.id}`}
                aria-selected={view === t.id}
                aria-controls={`journal-panel-${t.id}`}
                onClick={() => chooseView(t.id)}
                className="v2-jr-tab"
              >
                {t.label}
              </button>
            ))}
          </div>

          {view === "list" && items.length > 0 && (
            <div className="v2-jr-find">
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={L({ th: "ค้นคำถาม ชื่อไพ่ บันทึก…", en: "Search questions, cards, notes…" })}
                aria-label={L({ th: "ค้นหาในสมุด", en: "Search the journal" })}
                className="v2-jr-search"
              />
              <details className="v2-jr-filters" open={filterCount > 0 ? true : undefined}>
                <summary>
                  {L({ th: "ตัวกรอง", en: "Filters" })}
                  {filterCount > 0 && <span className="v2-jr-count">{filterCount}</span>}
                </summary>
                <div className="v2-jr-filter-body">
                  <Chip on={pinnedOnly} onClick={() => setPinnedOnly((v) => !v)}>
                    {L({ th: "เฉพาะที่ปักหมุด", en: "Pinned only" })}
                  </Chip>
                  <label className="v2-jr-sel">
                    <span>{L({ th: "หมวด", en: "Topic" })}</span>
                    <select value={category} onChange={(e) => setCategory(e.target.value)}>
                      <option value="all">{L({ th: "ทุกหมวด", en: "All topics" })}</option>
                      {Object.entries(CATEGORY_LABEL).map(([k, v]) => (
                        <option key={k} value={k}>
                          {L(v)}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="v2-jr-sel">
                    <span>{L({ th: "ผลจริง", en: "Outcome" })}</span>
                    <select value={outcome} onChange={(e) => setOutcome(e.target.value as "ALL" | ReadingOutcome)}>
                      <option value="ALL">{L({ th: "ทุกผล", en: "Any outcome" })}</option>
                      {(Object.keys(OUTCOME_LABEL) as ReadingOutcome[]).map((o) => (
                        <option key={o} value={o}>
                          {L(OUTCOME_LABEL[o])}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="v2-jr-sel">
                    <span>{L({ th: "ช่วงเวลา", en: "Time range" })}</span>
                    <select value={range} onChange={(e) => setRange(e.target.value as Range)}>
                      <option value="all">{L({ th: "ทั้งหมด", en: "All time" })}</option>
                      <option value="7">{L({ th: "7 วัน", en: "7 days" })}</option>
                      <option value="30">{L({ th: "30 วัน", en: "30 days" })}</option>
                      <option value="90">{L({ th: "90 วัน", en: "90 days" })}</option>
                    </select>
                  </label>
                  {knownTags.length > 0 && (
                    <div className="v2-jr-tags">
                      {knownTags.slice(0, 12).map((t) => (
                        <Chip key={t} on={tagFilter === t} onClick={() => setTagFilter((cur) => (cur === t ? null : t))}>
                          #{t}
                        </Chip>
                      ))}
                    </div>
                  )}
                </div>
              </details>
              {activeFilters && (
                <p className="v2-jr-found" role="status">
                  <span>
                    {day && `${formatDate(`${day}T12:00:00+07:00`, isEnglish)} · `}
                    {L({ th: `พบ ${filtered.length} รายการ`, en: `${filtered.length} found` })}
                  </span>
                  <button type="button" onClick={clearFilters}>
                    {L({ th: "ล้าง", en: "Clear" })}
                  </button>
                </p>
              )}
            </div>
          )}

          <a href={isEnglish ? "/en" : "/"} className="ui2-btn v2-jr-new">
            {L({ th: "เปิดไพ่เรื่องใหม่", en: "New reading" })}
          </a>

          {!sessionLoading && !isMember && (
            <p className="v2-jr-guest">
              {L({
                th: "สมุดเล่มนี้อยู่ในเครื่องนี้เท่านั้น (สูงสุด 50 รายการ) เข้าสู่ระบบเพื่อเก็บไว้ทุกเครื่อง",
                en: "This journal lives on this device only (up to 50 entries). Sign in to keep it across devices.",
              })}{" "}
              <a href="/account">{L({ th: "เข้าสู่ระบบ", en: "Sign in" })}</a>
            </p>
          )}
        </aside>

        {/* หน้ากระดาษ */}
        <div className="v2-jr-pages">
          {!loaded && items.length === 0 ? (
            <p className="v2-jr-opening" role="status">
              {L({ th: "กำลังเปิดสมุด…", en: "Opening your journal…" })}
            </p>
          ) : items.length === 0 ? (
            <div className="v2-jr-blank">
              <p className="v2-jr-blank-k">{L({ th: "หน้าแรก", en: "Page one" })}</p>
              <h2 className="tp">{L({ th: "สมุดยังว่างอยู่ รอคำถามแรกของคุณ", en: "Your journal is empty, waiting for your first question" })}</h2>
              <p>
                {L({
                  th: "เปิดไพ่เรื่องไหนก็ได้ คำอ่านจะถูกเก็บไว้ที่นี่ให้กลับมาจดผลจริงทีหลัง",
                  en: "Do any reading and it lands here, ready for you to note what really happened later.",
                })}
              </p>
              <div className="v2-jr-blank-cta">
                <a href={isEnglish ? "/en" : "/"} className="ui2-btn">
                  {L({ th: "เปิดไพ่เรื่องแรก", en: "Do your first reading" })}
                </a>
                <a href={isEnglish ? "/en/daily" : "/daily"} className="ui2-btn-ghost">
                  {L({ th: "เริ่มพิธีเช้า 2 นาที", en: "Start the 2-minute morning ritual" })}
                </a>
              </div>
            </div>
          ) : (
            <>
              <div id="journal-panel-list" role="tabpanel" aria-labelledby="journal-tab-list" hidden={view !== "list"}>
                {pinned.length > 0 && (
                  <section className="v2-jr-month" aria-label={L({ th: "ปักหมุดไว้", en: "Pinned" })}>
                    <h2 className="v2-jr-month-h">{L({ th: "ปักหมุดไว้", en: "Pinned" })}</h2>
                    <ol className="v2-jr-list">{pinned.map(renderEntry)}</ol>
                  </section>
                )}
                {months.map((m) => (
                  <section key={m.key} className="v2-jr-month" aria-label={m.label}>
                    <h2 className="v2-jr-month-h">
                      {m.label}
                      <span>{L({ th: `${m.rows.length} บันทึก`, en: `${m.rows.length} entries` })}</span>
                    </h2>
                    <ol className="v2-jr-list">{m.rows.map(renderEntry)}</ol>
                  </section>
                ))}
                {filtered.length === 0 && (
                  <p className="v2-jr-opening">{L({ th: "ไม่พบบันทึกที่ตรงกับตัวกรอง", en: "No entries match these filters." })}</p>
                )}
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
        </div>
      </div>
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
