#!/usr/bin/env python3
"""Design System V2 — เงา 2 ระดับ: ไม่มีเงา (ใช้เส้น 1px) / --shadow-overlay สำหรับของที่ลอยจริง"""
import os, re, sys, collections

OVERLAY = "shadow-[var(--shadow-overlay)]"
RAISED  = "shadow-[var(--shadow-raised)]"
KEEP    = {"shadow-none", "shadow-inner", RAISED, OVERLAY}

VAR = r'(?:(?:hover|focus|focus-visible|group-hover|active|sm|md|lg|xl):)*'
ARB = re.compile(r'(?<![\w-])(' + VAR + r')shadow-(\[[^\]]*\])')
NAMED = re.compile(r'(?<![\w-])(' + VAR + r')(shadow|drop-shadow)-(2xl|xl|lg|md|sm|xs)(?![\w-])')

def blur_of(v):
    ns = [int(x) for x in re.findall(r'(\d+)px', v)]
    return max(ns) if ns else 0

def arb_decision(val, stats):
    v = val.strip("[]")
    if val in KEEP or "var(--shadow" in v:
        return None                                   # ปล่อยไว้
    body = re.sub(r'^0_0_', "GLOW_", v)
    if body.startswith("GLOW_"):
        stats["ลบเงาเรืองแสง (0 0 blur)"] += 1; return ""
    if re.search(r'rgba\(0\s*,\s*0\s*,\s*0', v):
        stats["ลบเงาดำตกค้างจากธีมมืด"] += 1; return ""
    if blur_of(v) >= 20:
        stats["→ shadow-overlay"] += 1; return OVERLAY
    stats["ลบเงาระดับตื้น"] += 1; return ""

def transform(s, stats):
    def a(m):
        variants, val = m.group(1), m.group(2)
        d = arb_decision(val, stats)
        if d is None: return m.group(0)
        return f"{variants}{d}" if d else ""
    s = ARB.sub(a, s)
    def n(m):
        variants, kind, size = m.group(1), m.group(2), m.group(3)
        if kind == "drop-shadow":
            stats["ลบ drop-shadow"] += 1; return ""
        if size in ("2xl", "xl", "lg"):
            stats["→ shadow-overlay"] += 1; return f"{variants}{OVERLAY}"
        stats[f"ลบ shadow-{size}"] += 1
        return ""
    s = NAMED.sub(n, s)
    return s

def classname_spans(s):
    for m in re.finditer(r'className=(\{|")', s):
        i = m.end() - 1
        if s[i] == '"':
            j = s.index('"', i + 1); yield i + 1, j
        else:
            d = 0
            for j in range(i, len(s)):
                if s[j] == '{': d += 1
                elif s[j] == '}':
                    d -= 1
                    if d == 0: break
            yield i + 1, j

def tidy(cn):
    cn = re.sub(r'[ \t]{2,}', " ", cn)
    cn = re.sub(r'"\s+([^"]*?)\s+"', lambda m: f'"{m.group(1)}"', cn)
    return cn

def targets():
    for root, dirs, files in os.walk("src"):
        parts = set(root.split(os.sep))
        if parts & {"admin", "tester"}: continue
        if root.startswith(os.path.join("src","app","readers")): continue
        for f in files:
            if f.endswith(".tsx"): yield os.path.join(root, f)

dry = "--dry" in sys.argv
stats, touched = collections.Counter(), 0
for p in targets():
    s = open(p, encoding="utf-8").read()
    out, last = [], 0
    for a, b in classname_spans(s):
        out.append(s[last:a]); out.append(tidy(transform(s[a:b], stats))); last = b
    out.append(s[last:])
    n = "".join(out)
    if n != s:
        touched += 1
        if not dry: open(p, "w", encoding="utf-8").write(n)
print(f"{'[DRY] ' if dry else ''}ไฟล์: {touched} · เปลี่ยน: {sum(stats.values())}")
for k, v in stats.most_common(): print(f"  {v:5d}  {k}")
