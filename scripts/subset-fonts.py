#!/usr/bin/env python3
"""
✂️ ตัดฟอนต์ไทยให้เหลือเฉพาะอักขระที่เว็บนี้ใช้จริง (Font Subsetting)

ปัญหาที่แก้
===========
`next/font/google` ดึงชุดย่อยสำเร็จรูปของ Google มาให้ ซึ่งครอบคลุมเกินที่เว็บนี้ใช้
และเป็นฟอนต์แบบ variable ที่แบกตารางค่าความแปรผัน (`gvar`) ของทุกน้ำหนักตั้งแต่ 100–900
ทั้งที่เราประกาศใช้แค่สองน้ำหนักต่อหนึ่งตระกูล

วัดจริง 2026-09-14 (ไบต์ของไฟล์ .woff2 ที่เบราว์เซอร์ต้องโหลดจริง):

    | ตระกูล            | ของ Google                       | หลังตัดเอง        | ลดลง    |
    | Sarabun 400+600  | 42,640 B (thai+latin × 2 น้ำหนัก) | 32,960 B         | −9,680  |
    | Noto Serif Thai  | 68,824 B (variable ครอบ 400,700) | 33,944 B         | −34,880 |
    | **รวม**          | **111,464 B**                    | **66,904 B**     | **−40%** |

ทำไม Noto Serif Thai ถึงลดได้เยอะ
=================================
ต้นฉบับเป็น variable font สองแกน (`wdth` + `wght`) ตาราง `gvar` กินที่ราวครึ่งไฟล์
เว็บนี้ใช้แค่ `wght` 400 กับ 700 และไม่เคยแตะแกน `wdth` เลย การอบเป็นสองไฟล์สแตติก
จึงตัด `gvar` ทิ้งได้ทั้งก้อน · ลองทั้งสามทางแล้วเทียบไบต์จริงก่อนเลือก:

    เก็บ variable ทั้งสองแกน  101,016 B  ← แย่กว่าของ Google เสียอีก
    ตรึง wdth เหลือแกน wght    57,024 B
    **สแตติก 400 + 700**       **33,944 B**  ← ที่เลือกใช้

⚠️ ข้อควรระวังที่สำคัญที่สุด
==========================
**บล็อกอักขระไทยต้องเก็บ "ทั้งบล็อก" U+0E00–U+0E7F เสมอ ห้ามตัดเหลือเฉพาะตัวที่เจอในโค้ด**
เพราะคำทำนายและบทสนทนาถูกสร้างสดโดยโมเดลภาษา ตัวอักษรไทยตัวไหนก็โผล่ได้ทั้งนั้น
การไล่ดูว่า "ในรีโปใช้ตัวไหนบ้าง" ใช้ตัดสินได้เฉพาะฝั่งอักขระละติน/เครื่องหมายเท่านั้น

⚠️ ต้องส่ง `--layout-features=*` เสมอ
ภาษาไทยวางสระบนล่างและวรรณยุกต์ด้วยตาราง GSUB/GPOS ถ้าตัดฟีเจอร์ทิ้งตามค่าเริ่มต้น
ของ `pyftsubset` สระกับวรรณยุกต์จะลอยผิดตำแหน่ง ซึ่งเป็นบั๊กที่มองผ่านได้ง่ายมาก

📜 สัญญาอนุญาต
=============
ทั้ง Sarabun และ Noto Serif Thai อยู่ภายใต้ SIL Open Font License 1.1 และ
**ทั้งคู่ไม่ได้ประกาศ Reserved Font Name** (ตรวจจาก OFL.txt ต้นทางแล้ว)
การตัดและแจกจ่ายต่อในชื่อเดิมจึงทำได้ โดยต้องคงประกาศลิขสิทธิ์ไว้ —
สคริปต์นี้จึงเก็บ name ID 0 (copyright) · 13 (license) · 14 (license URL) ไว้เสมอ
และดาวน์โหลด `OFL.txt` ของแต่ละตระกูลมาวางคู่กับไฟล์ฟอนต์

วิธีใช้
======
    npm run fonts:subset

ต้องมี `fonttools` กับ `brotli`:  python3 -m pip install fonttools brotli

⚠️ ผลลัพธ์ถูก commit ลงรีโป — สายพานบิลด์ไม่ได้รันสคริปต์นี้
   ถ้าแก้ชุดอักขระหรือเปลี่ยนน้ำหนักฟอนต์ ต้องรันใหม่แล้ว commit ไฟล์ที่ได้ด้วยเสมอ
"""

from __future__ import annotations

import os
import subprocess
import sys
import urllib.parse
import urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT_DIR = os.path.join(ROOT, "src", "app", "_shared", "fonts")
CACHE_DIR = os.path.join(ROOT, "scratch", "font_sources")

GF_RAW = "https://raw.githubusercontent.com/google/fonts/main/ofl"

# ── ชุดอักขระที่เก็บไว้ ────────────────────────────────────────────────────────
# ไทยทั้งบล็อก (ห้ามลด — เหตุผลอยู่ในหัวไฟล์)
THAI = "U+0E00-0E7F"
# ละตินพื้นฐานที่พิมพ์ได้ทั้งหมด — ชื่อไพ่ภาษาอังกฤษ ตัวเลข และเครื่องหมายทั่วไป
ASCII = "U+0020-007E"
# เครื่องหมายที่ใช้จริงในหน้าเว็บ (กวาดจาก src/ แล้วคัดเฉพาะที่ฟอนต์ตระกูลนี้มีให้)
#   U+00A0 เว้นวรรคไม่ตัดบรรทัด · U+00A7 § · U+00A9 © · U+00B0 ° · U+00B7 · · U+00D7 ×
#   U+2013 – · U+2014 — · U+2018 ‘ · U+2019 ’ · U+201C “ · U+201D ” · U+2022 • · U+2026 … · U+203A ›
PUNCT = (
    "U+00A0,U+00A7,U+00A9,U+00B0,U+00B7,U+00D7,"
    "U+2013,U+2014,U+2018,U+2019,U+201C,U+201D,U+2022,U+2026,U+203A"
)
UNICODES = f"{THAI},{ASCII},{PUNCT}"

# 💡 ถ้าวันหนึ่งมีคนพิมพ์ชื่อที่มีสระละติน (José, Müller) แล้วอยากให้ตัวอักษรนั้น
#    ใช้ฟอนต์เดียวกับที่เหลือ ให้เติม "U+00C0-00FF" เข้าไปข้างบนแล้วรันใหม่
#    ต้นทุนที่วัดไว้คือราว +6 KB รวมทุกไฟล์ · ตอนนี้ปล่อยให้ถอยไปใช้ฟอนต์ระบบ
#    ซึ่งเห็นเป็นตัวอักษรหน้าตาต่างไปเล็กน้อยเฉพาะตัวนั้น ไม่ได้พังอะไร


class FontJob:
    def __init__(self, folder: str, source: str, outputs: list[tuple[str, int]]):
        self.folder = folder          # โฟลเดอร์ใน google/fonts/ofl
        self.source = source          # ชื่อไฟล์ต้นฉบับในโฟลเดอร์นั้น
        self.outputs = outputs        # [(ชื่อไฟล์ผลลัพธ์, น้ำหนัก)]


JOBS = [
    FontJob(
        "sarabun",
        "Sarabun-Regular.ttf",
        [("sarabun-400.woff2", 400)],
    ),
    FontJob(
        "sarabun",
        "Sarabun-SemiBold.ttf",
        [("sarabun-600.woff2", 600)],
    ),
    # ต้นฉบับเป็น variable สองแกน — อบเป็นสแตติกทีละน้ำหนัก (ดูตารางเทียบไบต์ในหัวไฟล์)
    FontJob(
        "notoserifthai",
        "NotoSerifThai[wdth,wght].ttf",
        [("noto-serif-thai-400.woff2", 400), ("noto-serif-thai-700.woff2", 700)],
    ),
]


def fetch(folder: str, filename: str) -> str:
    os.makedirs(CACHE_DIR, exist_ok=True)
    local = os.path.join(CACHE_DIR, filename)
    if os.path.exists(local):
        return local
    url = f"{GF_RAW}/{folder}/{urllib.parse.quote(filename)}"
    print(f"  ⬇️  ดาวน์โหลด {filename}")
    with urllib.request.urlopen(url, timeout=120) as res, open(local, "wb") as out:
        out.write(res.read())
    return local


def fetch_license(folder: str) -> None:
    target = os.path.join(OUT_DIR, f"OFL-{folder}.txt")
    url = f"{GF_RAW}/{folder}/OFL.txt"
    with urllib.request.urlopen(url, timeout=120) as res:
        body = res.read()
    with open(target, "wb") as out:
        out.write(body)
    print(f"  📜 {os.path.basename(target)}")


def run(cmd: list[str]) -> None:
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        print("\n❌ คำสั่งล้มเหลว:", " ".join(cmd[:3]), "...")
        print(result.stderr[-2000:])
        sys.exit(1)


def main() -> None:
    try:
        import fontTools  # noqa: F401
        import brotli  # noqa: F401
    except ImportError:
        print("\n❌ ไม่พบ fonttools หรือ brotli")
        print("   ติดตั้งด้วย: python3 -m pip install fonttools brotli\n")
        sys.exit(1)

    os.makedirs(OUT_DIR, exist_ok=True)
    print("✂️  ตัดฟอนต์ให้เหลือเฉพาะอักขระที่ใช้จริง")
    print(f"   ชุดอักขระ: ไทยทั้งบล็อก + ASCII + เครื่องหมาย {len(PUNCT.split(','))} ตัว\n")

    total = 0
    for job in JOBS:
        src = fetch(job.folder, job.source)
        for out_name, weight in job.outputs:
            out_path = os.path.join(OUT_DIR, out_name)
            staged = src
            # ฟอนต์ variable ต้องอบเป็นสแตติกก่อน ไม่งั้นตาราง gvar จะติดไปด้วยทั้งก้อน
            if "[" in job.source:
                staged = os.path.join(CACHE_DIR, f"_static_{weight}_{job.source}")
                run([
                    "fonttools", "varLib.instancer", src,
                    "wdth=100", f"wght={weight}",
                    "-o", staged,
                ])
            run([
                "pyftsubset", staged,
                f"--output-file={out_path}",
                f"--unicodes={UNICODES}",
                # ⚠️ ห้ามตัด — ภาษาไทยวางสระ/วรรณยุกต์ด้วยตารางเหล่านี้
                "--layout-features=*",
                # เก็บประกาศลิขสิทธิ์และสัญญาอนุญาตไว้ตามข้อกำหนดของ OFL
                "--name-IDs=0,1,2,3,4,5,6,13,14",
                "--flavor=woff2",
                "--notdef-outline",
            ])
            size = os.path.getsize(out_path)
            total += size
            print(f"  ✅ {out_name:<28} {size:>7,} B  (น้ำหนัก {weight})")

    for folder in sorted({job.folder for job in JOBS}):
        fetch_license(folder)

    print(f"\n✨ รวมทั้งหมด {total:,} B")
    print("   อ้างอิงของเดิมที่ next/font/google ส่งมา: 111,464 B")
    print(f"   ลดลง {111_464 - total:,} B ({(111_464 - total) / 111_464:.0%})\n")
    print("⚠️  อย่าลืม commit ไฟล์ใน src/app/_shared/fonts/ ด้วย — สายพานบิลด์ไม่ได้รันสคริปต์นี้")


if __name__ == "__main__":
    main()
