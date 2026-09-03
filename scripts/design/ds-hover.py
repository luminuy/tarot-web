#!/usr/bin/env python3
"""ซ่อม hover ที่กลายเป็น no-op หลังบีบพาเลตต์ (hover:X-[C] ซ้ำกับ X-[C] ในชุดคลาสเดียวกัน)"""
import os, re, sys, collections

# ctx -> (สีฐาน -> สี hover ที่ควรเป็น)
HOVER = {
  "bg":     {"#8F5C1A": "#74490F", "#FFFFFF": "#F6F1E9", "#F0E8DB": "#FFFFFF",
             "#F6F1E9": "#F0E8DB", "#2E211A": "#6F5B4A"},
  "text":   {"#8F5C1A": "#74490F", "#6F5B4A": "#2E211A", "#2E211A": "#8F5C1A",
             "#FFFFFF": "#F0E8DB"},
  "border": {"#E4D8C4": "#8F5C1A", "#8F5C1A": "#74490F", "#F0E8DB": "#E4D8C4"},
  "ring":   {"#8F5C1A": "#74490F"},
}
CTX = {"bg":"bg","text":"text","border":"border","ring":"ring",
       "border-t":"border","border-b":"border","border-l":"border","border-r":"border"}

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

TOK = re.compile(r'(?<![\w-])(hover|focus|group-hover|active):([a-z-]+)-\[(#[0-9A-Fa-f]{6})\]')

def fix_block(cn, stats):
    def repl(m):
        variant, util, hexv = m.groups()
        ctx = CTX.get(util)
        if not ctx: return m.group(0)
        base = re.search(r'(?<![\w:-])' + re.escape(util) + r'-\[' + re.escape(hexv) + r'\]', cn)
        if not base: return m.group(0)                       # hover ยังต่างจากฐาน — ปล่อยไว้
        new = HOVER.get(ctx, {}).get(hexv.upper())
        if not new: return m.group(0)
        stats[f"{variant}:{util}-[{hexv}] → [{new}]"] += 1
        return f"{variant}:{util}-[{new}]"
    return TOK.sub(repl, cn)

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
        out.append(s[last:a]); out.append(fix_block(s[a:b], stats)); last = b
    out.append(s[last:])
    n = "".join(out)
    if n != s:
        touched += 1
        if not dry: open(p, "w", encoding="utf-8").write(n)
print(f"{'[DRY] ' if dry else ''}ไฟล์: {touched} · ซ่อม: {sum(stats.values())}")
for k, v in stats.most_common(20): print(f"  {v:5d}  {k}")
