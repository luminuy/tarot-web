#!/usr/bin/env python3
"""กวาดสี Tailwind ตั้งชื่อ (rose/emerald/amber/sky/gray…) เข้า 8 tokens"""
import os, re, collections

FAM = {
  "err":  ("#A6392C", "#FCEEEA"),
  "ok":   ("#3A7044", "#EBF3ED"),
  "gold": ("#8F5C1A", "#F0E8DB"),
  "warm": ("#6F5B4A", "#F0E8DB"),   # ฟ้า/ม่วง/ชมพู — กลืนเข้าโทนอุ่น
  "gray": (None, "#F0E8DB"),         # จัดการตามเฉดด้านล่าง
}
OF = {}
for f, names in {
  "err":  ["red","rose","pink","fuchsia"],
  "ok":   ["green","emerald","teal","lime"],
  "gold": ["amber","yellow","orange"],
  "warm": ["sky","blue","cyan","indigo","violet","purple"],
  "gray": ["slate","gray","zinc","neutral","stone"],
}.items():
    for n in names: OF[n] = f

LINE, INK, MUTED, INSET = "#E4D8C4", "#2E211A", "#6F5B4A", "#F0E8DB"
BG   = {"bg"}
EDGE = {"border", "divide", "outline", "ring"}

PAL = "|".join(OF)
PAT = re.compile(
  r'(?<![\w-])((?:[a-z-]+:)*)(bg|text|border|ring|from|via|to|fill|stroke|divide|outline|placeholder|decoration|accent)'
  r'(-[trblxyse]{1,2})?-(' + PAL + r')-(\d{2,3})(/\d+)?(?![\w-])')

def resolve(util, fam, shade):
    strong, light = FAM[fam]
    if fam == "gray":
        if util in BG:   return INSET
        if util in EDGE: return LINE
        return MUTED if shade <= 400 else INK
    if util in BG:   return light if shade <= 200 else strong
    if util in EDGE: return LINE if shade <= 300 else strong
    return strong

def transform(s, stats):
    def r(m):
        variants, util, side, name, shade, alpha = m.groups()
        new = resolve(util, OF[name], int(shade))
        stats[f"{util}-{name}-{shade} → {new}"] += 1
        return f"{variants}{util}{side or ''}-[{new}]{alpha or ''}"
    return PAT.sub(r, s)

def targets():
    for root, dirs, files in os.walk("src"):
        p = set(root.split(os.sep))
        if p & {"admin", "tester"}: continue
        if root.startswith(os.path.join("src","app","readers")): continue
        for f in files:
            if f.endswith(".tsx"): yield os.path.join(root, f)

import sys
dry = "--dry" in sys.argv
stats, n = collections.Counter(), 0
for p in targets():
    s = open(p, encoding="utf-8").read()
    o = transform(s, stats)
    if o != s:
        n += 1
        if not dry: open(p, "w", encoding="utf-8").write(o)
print(f"{'[DRY] ' if dry else ''}ไฟล์: {n} · แทนที่: {sum(stats.values())}")
for k, v in stats.most_common(12): print(f"  {v:4d}  {k}")
