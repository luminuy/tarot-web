#!/usr/bin/env python3
"""Design System V2 — บีบพาเลตต์สาธารณะให้เหลือ 8 tokens (context-aware)"""
import os, re, sys, collections

TOK = {
  "canvas": "#F6F1E9", "surface": "#FFFFFF", "inset": "#F0E8DB", "line": "#E4D8C4",
  "ink": "#2E211A", "muted": "#6F5B4A", "gold": "#8F5C1A", "goldDeep": "#74490F",
  "ok": "#3A7044", "err": "#A6392C",
}
G, L, I, M, S, N, C = (TOK["gold"], TOK["line"], TOK["ink"], TOK["muted"],
                        TOK["surface"], TOK["inset"], TOK["canvas"])

# family -> {fg, bg, line, ring}
FAM = {
  # ทองกลาง–เข้ม (ตัวอักษรทอง ไอคอน ปุ่ม)
  "gold_mid": dict(fg=G, bg=G, line=L, ring=G),
  # ทองซีดมาก (เคยใช้เป็นพื้นอ่อน)
  "gold_pale": dict(fg=G, bg=N, line=L, ring=G),
  # แทนสีเส้นน้ำตาลอ่อน
  "tan": dict(fg=M, bg=N, line=L, ring=G),
  # ตัวอักษรหลัก
  "ink": dict(fg=I, bg=I, line=L, ring=I),
  # ตัวอักษรรอง
  "muted": dict(fg=M, bg=N, line=L, ring=M),
  # พื้นผิวขาว
  "white": dict(fg=S, bg=S, line=L, ring=S),
  # พื้นผิวจม
  "inset": dict(fg=S, bg=N, line=L, ring=N),
  # สถานะ
  "ok": dict(fg=TOK["ok"], bg="#EBF3ED", line=TOK["ok"], ring=TOK["ok"]),
  "err": dict(fg=TOK["err"], bg="#FCEEEA", line=TOK["err"], ring=TOK["err"]),
  # สีสุ่มที่หลงเหลือ (ม่วง/ฟ้า/ชมพู/ส้ม) — กลืนเข้าโทนอุ่น
  "stray_light": dict(fg=M, bg=N, line=L, ring=M),
  "stray_dark": dict(fg=I, bg=I, line=L, ring=I),
}

COLOR_FAMILY = {}
def reg(fam, *hexes):
    for h in hexes: COLOR_FAMILY[h.upper()] = fam

reg("gold_mid", "#CD9F5B","#B8853E","#C5A059","#C59B27","#D4A72C","#A27B14",
                "#D4AF37","#FFD700","#E5C07B","#E5B83D","#D4A574","#EAB308",
                "#F59E0B","#FFE34D","#F97316","#F09433")
reg("gold_pale","#F5DEAA","#F7E7B4","#F3E8D2","#F3E5AB")
reg("tan",      "#D6B48D","#E4C09F")
reg("ink",      "#5A432F","#231812")
reg("muted",    "#8C735D","#7C6553")
reg("white",    "#FDF7F0","#FAF8F5","#FFF8F8","#FFFDF9")
reg("inset",    "#FCF0E6","#F5EFEB")
reg("ok",       "#10B981","#2D5A27","#1E7E34","#34D399","#86EFAC","#05B34C")
reg("err",      "#EF4444","#F43F5E","#FDA4AF","#F0A0A0","#8C3B2D","#A04515","#F472B6")
reg("stray_light","#9C93B8","#CFC8E2","#E2D9F3","#E5E0F8","#C4BCD8","#C3BDD8","#C5BED8",
                  "#8C82A8","#685E82","#8B6F9E","#B4A0C8","#8CB4C8","#6B8FA8","#8CAE88",
                  "#EC4899","#A855F7","#C084FC","#38BDF8","#06B6D4","#6366F1","#1B5E80")
reg("stray_dark","#18122B","#190E38","#0B0714","#0D071D","#05030A","#090614","#07040F",
                 "#100A1C","#181028","#2D1F4D","#4A3B82","#4A0E4E")

# ห้ามแตะ: token ปัจจุบัน + สีแบรนด์โซเชียล + งานศิลป์หลังไพ่ + สแตกไพ่ 3D
KEEP = {v.upper() for v in TOK.values()} | {
  "#1877F2","#06C755","#4285F4","#34A853","#FBBC05","#EA4335",  # social brand
  "#DC2743","#BC1888","#000000","#FFFFFF",                       # IG / X / ขาว
  "#EBF3ED","#FCEEEA","#F0FFF4",                                 # พื้นสถานะอ่อน
  "#5A3E26","#4A3320","#382518",                                 # สแตกไพ่ 3D + หลังไพ่
}

FG   = {"text","fill","stroke","decoration","caret","accent","placeholder","from","via","to",
        "shadow","stopColor","color","selection"}
BG   = {"bg","backgroundColor","background"}
LINE = {"border","divide","borderColor","borderTopColor","borderBottomColor"}
RING = {"ring","outline","outlineColor"}

def ctx_of(prefix: str) -> str:
    p = prefix.split(":")[-1].lstrip("!")           # ตัด variant เช่น hover: / dark:
    head = p.split("-")[0]
    if p.startswith("ring-offset"): return "bg"
    if head in BG or p in BG: return "bg"
    if head in LINE or p in LINE: return "line"
    if head in RING or p in RING: return "ring"
    if head in FG or p in FG: return "fg"
    return "fg"

def resolve(hexv: str, ctx: str):
    u = hexv.upper()
    if u in KEEP: return None
    fam = COLOR_FAMILY.get(u)
    if not fam: return None
    return FAM[fam][ctx]

UTIL = re.compile(r'(?<![\w-])([a-zA-Z][\w:-]*)-\[(#[0-9a-fA-F]{6})((?:[^\]\s]*))\]')
ATTR = re.compile(r'\b(fill|stroke|stopColor|color|backgroundColor|borderColor|background)(\s*[=:]\s*)"(#[0-9a-fA-F]{6})"')

def transform(src: str, stats: collections.Counter):
    def u(m):
        prefix, hexv, rest = m.group(1), m.group(2), m.group(3)
        new = resolve(hexv, ctx_of(prefix))
        if not new or new.upper() == hexv.upper(): return m.group(0)
        stats[f"{hexv.upper()}→{new}"] += 1
        return f"{prefix}-[{new}{rest}]"
    src = UTIL.sub(u, src)
    def a(m):
        attr, sep, hexv = m.group(1), m.group(2), m.group(3)
        ctx = "line" if attr in LINE else "bg" if attr in BG else "fg"
        new = resolve(hexv, ctx)
        if not new or new.upper() == hexv.upper(): return m.group(0)
        stats[f"{hexv.upper()}→{new}"] += 1
        return f'{attr}{sep}"{new}"'
    return ATTR.sub(a, src)

def targets():
    for root, dirs, files in os.walk("src"):
        parts = set(root.split(os.sep))
        if parts & {"admin", "tester"}: continue
        if root.startswith(os.path.join("src","app","readers")): continue
        for f in files:
            if f.endswith((".tsx", ".ts")):
                yield os.path.join(root, f)

def main():
    dry = "--dry" in sys.argv
    stats, touched = collections.Counter(), []
    for p in targets():
        s = open(p, encoding="utf-8").read()
        n = transform(s, stats)
        if n != s:
            touched.append(p)
            if not dry: open(p, "w", encoding="utf-8").write(n)
    print(f"{'[DRY] ' if dry else ''}ไฟล์ที่แตะ: {len(touched)} · การแทนที่: {sum(stats.values())}")
    for k, v in stats.most_common(40): print(f"  {v:5d}  {k}")

main()
