"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { CityHit } from "@/lib/astro/city-search";

/**
 * 🔎 ช่องค้นหาเมืองเกิดทั่วโลก (34,000 เมือง · GeoNames CC BY 4.0)
 * ฐานข้อมูลเมืองโหลดแบบ dynamic import ครั้งแรกที่ผู้ใช้แตะช่องนี้ · ค้นในเครื่อง ไม่ส่งคำค้นออกไป
 * รูปแบบ combobox ตาม WAI-ARIA: ลูกศรขึ้นลงเลือก · Enter ยืนยัน · Escape ปิด
 */
type SearchModule = typeof import("@/lib/astro/city-search");

export interface PickedCity {
  label: string;
  labelEn: string;
  lat: number;
  lon: number;
  zone: string;
}

function regionName(cc: string, lang: "th" | "en"): string {
  try {
    return new Intl.DisplayNames([lang === "th" ? "th" : "en"], { type: "region" }).of(cc) ?? cc;
  } catch {
    // เบราว์เซอร์เก่าที่ไม่มี Intl.DisplayNames: แสดงรหัสประเทศแทน
    return cc;
  }
}

export function cityLabel(c: CityHit, lang: "th" | "en"): string {
  const name = lang === "th" && c.th ? c.th : c.name;
  return [name, c.admin && c.admin !== c.name ? c.admin : "", regionName(c.country, lang)].filter(Boolean).join(", ");
}

export function CitySearch({
  lang,
  value,
  onPick,
  fieldClass,
}: {
  lang: "th" | "en";
  value: PickedCity | null;
  onPick: (c: PickedCity) => void;
  fieldClass: string;
}) {
  const isTh = lang === "th";
  const id = useId();
  const [mod, setMod] = useState<SearchModule | null>(null);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<CityHit[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const loadRef = useRef<Promise<SearchModule> | null>(null);

  function ensure() {
    if (mod || loadRef.current) return;
    setLoading(true);
    loadRef.current = import("@/lib/astro/city-search");
    loadRef.current
      .then((m) => {
        m.cityCount();
        setMod(m);
      })
      .catch(() => setFailed(true))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    if (!mod) return;
    const t = setTimeout(() => {
      setHits(mod.searchCities(q, 12));
      setActive(0);
    }, 120);
    return () => clearTimeout(t);
  }, [q, mod]);

  function pick(c: CityHit) {
    onPick({ label: cityLabel(c, lang), labelEn: cityLabel(c, "en"), lat: c.lat, lon: c.lon, zone: c.zone });
    setQ("");
    setOpen(false);
  }

  const listId = `${id}-list`;
  return (
    <div className="space-y-1.5">
      <div className="relative">
        <input
          type="search"
          role="combobox"
          aria-expanded={open && hits.length > 0}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={open && hits[active] ? `${id}-o${active}` : undefined}
          aria-label={isTh ? "ค้นหาเมืองเกิด" : "Search birth city"}
          placeholder={isTh ? "พิมพ์ชื่อเมือง ไทยหรืออังกฤษ เช่น หาดใหญ่ หรือ London" : "Type a city, e.g. London or Springfield, Illinois"}
          value={q}
          onFocus={() => {
            ensure();
            setOpen(true);
          }}
          onChange={(e) => {
            ensure();
            setQ(e.target.value);
            setOpen(true);
          }}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setActive((a) => Math.min(a + 1, hits.length - 1));
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setActive((a) => Math.max(a - 1, 0));
            } else if (e.key === "Enter" && open && hits[active]) {
              e.preventDefault();
              pick(hits[active]);
            } else if (e.key === "Escape") {
              setOpen(false);
            }
          }}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          className={fieldClass}
          autoComplete="off"
        />
        {open && q.trim() && (
          <ul id={listId} role="listbox" className="v2-nt-listbox absolute z-20 left-0 right-0 mt-1 max-h-72 overflow-y-auto rounded-xl">
            {loading && <li className="px-3 py-2 text-sm text-muted">{isTh ? "กำลังโหลดรายชื่อเมือง..." : "Loading cities..."}</li>}
            {failed && <li className="px-3 py-2 text-sm text-err">{isTh ? "โหลดรายชื่อเมืองไม่สำเร็จ กรุณาโหลดหน้าใหม่อีกครั้ง" : "Could not load cities. Please reload the page."}</li>}
            {mod && hits.length === 0 && <li className="px-3 py-2 text-sm text-muted">{isTh ? "ไม่พบเมืองนี้ ลองพิมพ์ชื่ออังกฤษ หรือใช้ระบุพิกัดเอง" : "No match. Try another spelling or enter coordinates."}</li>}
            {hits.map((c, i) => (
              <li
                key={`${c.name}-${c.lat}-${c.lon}`}
                id={`${id}-o${i}`}
                role="option"
                aria-selected={i === active}
                onMouseDown={(e) => {
                  e.preventDefault();
                  pick(c);
                }}
                className="cursor-pointer px-3 py-2 text-sm min-h-[44px] flex items-center"
              >
                {cityLabel(c, lang)}
              </li>
            ))}
          </ul>
        )}
      </div>
      {value && (
        <p className="text-sm text-ink">
          {isTh ? "เลือกแล้ว: " : "Selected: "}
          <span className="font-semibold">{isTh ? value.label : value.labelEn}</span>{" "}
          <span className="text-xs text-muted tabular-nums">
            ({value.lat.toFixed(2)}, {value.lon.toFixed(2)})
          </span>
        </p>
      )}
      <p className="text-xs text-muted">
        {isTh ? "ข้อมูลเมืองจาก " : "City data from "}
        <a href="https://www.geonames.org/" target="_blank" rel="noopener noreferrer" className="underline">
          GeoNames
        </a>{" "}
        (CC BY 4.0) · {isTh ? "ค้นในเครื่องของคุณ ไม่ส่งชื่อเมืองออกไป" : "searched on your device"}
      </p>
    </div>
  );
}
