#!/usr/bin/env python3
"""เก็บกวาดช่องว่างส่วนเกินในชุดคลาส (ปลอดภัย: ตัดเฉพาะเมื่อ interpolation ไม่ได้ต่อกับคลาสถัดไปทันที)"""
import os, re, sys, collections

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

STR = re.compile(r'"([^"\n]*)"')

def clean(block, stats):
    def r(m):
        v = m.group(1)
        if not v or '"' in v: return m.group(0)
        # แตะเฉพาะสิ่งที่ดูเป็นชุดคลาส Tailwind
        if not re.fullmatch(r'[\w\s:\[\]\(\)#/.,%_-]*', v): return m.group(0)
        n = re.sub(r'\s{2,}', ' ', v).strip()
        if n != v: stats["ช่องว่างส่วนเกิน"] += 1
        return f'"{n}"'
    return STR.sub(r, block)

def targets():
    for root, dirs, files in os.walk("src"):
        p = set(root.split(os.sep))
        if p & {"admin", "tester"}: continue
        if root.startswith(os.path.join("src","app","readers")): continue
        for f in files:
            if f.endswith(".tsx"): yield os.path.join(root, f)

dry = "--dry" in sys.argv
stats, touched = collections.Counter(), 0
for p in targets():
    s = open(p, encoding="utf-8").read()
    # กันเคสเสี่ยง: interpolation ที่ต่อกับตัวอักษรทันที เช่น ${x ? "a " : "b"}extra
    risky = re.search(r'\}\w', s) is not None
    out, last = [], 0
    for a, b in classname_spans(s):
        blk = s[a:b]
        out.append(s[last:a])
        out.append(blk if (risky and re.search(r'\}\w', blk)) else clean(blk, stats))
        last = b
    out.append(s[last:])
    n = "".join(out)
    if n != s:
        touched += 1
        if not dry: open(p, "w", encoding="utf-8").write(n)
print(f"{'[DRY] ' if dry else ''}ไฟล์: {touched} · เก็บกวาด: {sum(stats.values())}")
