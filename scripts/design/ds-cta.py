#!/usr/bin/env python3
"""ปุ่มหลัก (พื้นทองทึบ) = ทรงแคปซูลทั้งเว็บ"""
import os, re, collections

def spans(s):
    for m in re.finditer(r'className=(\{|")', s):
        i = m.end() - 1
        if s[i] == '"':
            j = s.index('"', i + 1); yield i, j + 1
        else:
            d = 0
            for j in range(i, len(s)):
                if s[j] == '{': d += 1
                elif s[j] == '}':
                    d -= 1
                    if d == 0: break
            yield i + 1, j

STR = re.compile(r'"([^"\n]*)"')

def fix(block, stats):
    def r(m):
        v = m.group(1)
        if "bg-[#8F5C1A]" not in v and "bg-[#74490F]" not in v: return m.group(0)
        if not re.search(r'(?<![\w-])rounded-lg(?![\w-])', v): return m.group(0)
        if not re.search(r'(?<![\w-])(px-|py-|p-|w-full|h-1[01])', v): return m.group(0)
        stats["ปุ่มทอง rounded-lg → rounded-full"] += 1
        return '"' + re.sub(r'(?<![\w-])rounded-lg(?![\w-])', 'rounded-full', v) + '"'
    return STR.sub(r, block)

def targets():
    for root, dirs, files in os.walk("src"):
        p = set(root.split(os.sep))
        if p & {"admin","tester"}: continue
        if root.startswith(os.path.join("src","app","readers")): continue
        for f in files:
            if f.endswith(".tsx"): yield os.path.join(root, f)

stats, n = collections.Counter(), 0
for p in targets():
    s = open(p, encoding="utf-8").read()
    out, last = [], 0
    for a, b in spans(s):
        out.append(s[last:a]); out.append(fix(s[a:b], stats)); last = b
    out.append(s[last:])
    o = "".join(out)
    if o != s: open(p, "w", encoding="utf-8").write(o); n += 1
print(f"ไฟล์: {n} · {sum(stats.values())} ปุ่ม")
