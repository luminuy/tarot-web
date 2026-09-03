#!/usr/bin/env python3
"""Design System V2 — เหลือรัศมี 3 ระดับ: rounded (4px) / rounded-lg (8px) / rounded-full"""
import os, re, sys, collections

BIG   = {"3xl", "2xl", "xl", "[1.618rem]", "[1.618em]"}   # → lg (8px)
SMALL = {"md", "sm"}                                       # → 4px (ไม่มี suffix)
SIDES = "|".join(["t","b","l","r","s","e","tl","tr","bl","br","ss","se","es","ee"])
PAT = re.compile(r'(?<![\w-])rounded(?:-(?:' + SIDES + r'))?(?:-(\[[^\]]+\]|[a-z0-9]+))?(?![\w\[-])')

def convert(m, stats):
    whole, size = m.group(0), m.group(1)
    base = whole[:whole.rindex("-" + size)] if size else whole
    if size is None or size == "full" or size == "none":
        return whole
    if size in BIG:
        new = f"{base}-lg"
    elif size in SMALL:
        new = base
    elif size == "lg":
        return whole
    else:
        return whole
    if new != whole: stats[f"{whole} → {new}"] += 1
    return new

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
    n = PAT.sub(lambda m: convert(m, stats), s)
    if n != s:
        touched += 1
        if not dry: open(p, "w", encoding="utf-8").write(n)
print(f"{'[DRY] ' if dry else ''}ไฟล์: {touched} · แทนที่: {sum(stats.values())}")
for k, v in stats.most_common(): print(f"  {v:5d}  {k}")
