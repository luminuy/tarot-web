#!/usr/bin/env python3
"""
🖼️  สร้างภาพพรีวิวตอนแชร์ลิงก์ (Open Graph / Twitter Card) ขนาด 1200×630

ปัญหาที่แก้: เดิม metadata ชี้ภาพพรีวิวไปที่ `/cards/major-01.jpg` ซึ่งเป็นภาพไพ่
แนวตั้ง 825×1429 (อัตราส่วน 0.58:1) แต่ Facebook / LINE / X ต้องการ ~1.91:1
ทุกครั้งที่มีคนแชร์ลิงก์เว็บ ภาพจึงถูกครอบตัดกลางจนอ่านอะไรไม่ออก

⚠️ ห้ามแก้ไขไฟล์ต้นฉบับใน `public/cards/` (กฎเหล็กข้อ 5 — 1909 Rider-Waite Only)
   สคริปต์นี้แค่ "อ่าน" ภาพไพ่ The Sun มาประกอบเท่านั้น

วิธีใช้: npm run og:image   (ต้องมี Pillow: python3 -m pip install pillow)
ผลลัพธ์: public/og/default.png
"""
from PIL import Image, ImageDraw, ImageFont
import os
import sys

W, H = 1200, 630
BG = (250, 247, 242)
INK = (41, 38, 31)
GOLD = (165, 138, 92)
AMBER = (143, 92, 26)
MUTED = (99, 91, 78)
LEFT = 86

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CARD = os.path.join(ROOT, "public", "cards", "major-19.jpg")
OUT_DIR = os.path.join(ROOT, "public", "og")
OUT = os.path.join(OUT_DIR, "default.png")


def thai_font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont:
    """ฟอนต์ที่มีสระ/วรรณยุกต์ไทยครบ — ฟอนต์ละตินล้วนจะเรนเดอร์เป็นกล่องว่าง"""
    for path, idx in (
        ("/System/Library/Fonts/Supplemental/SukhumvitSet.ttc", 5 if bold else 2),
        ("/System/Library/Fonts/Thonburi.ttc", 1 if bold else 0),
    ):
        try:
            return ImageFont.truetype(path, size, index=idx)
        except Exception:
            continue
    raise SystemExit("ไม่พบฟอนต์ไทยในเครื่อง — ติดตั้ง SukhumvitSet หรือ Thonburi ก่อน")


def draw_sparkle(d: ImageDraw.ImageDraw, cx: float, cy: float, r: float, fill) -> None:
    """✦ วาดเป็นรูปทรงเอง ไม่ใช้ตัวอักษร เพราะฟอนต์ไทยของระบบไม่มี glyph U+2726"""
    waist = r * 0.26
    d.polygon(
        [(cx, cy - r), (cx + waist, cy - waist), (cx + r, cy),
         (cx + waist, cy + waist), (cx, cy + r), (cx - waist, cy + waist),
         (cx - r, cy), (cx - waist, cy - waist)],
        fill=fill,
    )


def main() -> None:
    img = Image.new("RGB", (W, H), BG)
    d = ImageDraw.Draw(img)
    d.rectangle([28, 28, W - 29, H - 29], outline=(217, 200, 172), width=2)

    card = Image.open(CARD).convert("RGB")
    ch = 430
    cw = int(card.width * ch / card.height)
    card = card.resize((cw, ch), Image.LANCZOS)
    cx, cy = W - 96 - cw, (H - ch) // 2
    img.paste(Image.new("RGB", (cw + 16, ch + 16), (232, 225, 213)), (cx - 8, cy - 4))
    img.paste(card, (cx, cy))

    f_kicker, f_title = thai_font(28), thai_font(70, bold=True)
    f_sub, f_foot = thai_font(34), thai_font(26)

    draw_sparkle(d, LEFT + 9, 154, 11, AMBER)
    d.text((LEFT + 32, 140), "วิหารพยากรณ์ไพ่ทาโรต์ออนไลน์", font=f_kicker, fill=AMBER)
    d.text((LEFT, 192), "SeerTarot", font=f_title, fill=INK)
    d.text((LEFT, 290), "ดูดวงไพ่ทาโรต์ 1909 Rider-Waite", font=f_sub, fill=INK)
    d.text((LEFT, 338), "สับไพ่ · จับไพ่เอง · แม่หมอ AI ทำนาย", font=f_sub, fill=MUTED)
    d.line([(LEFT, 410), (LEFT + 300, 410)], fill=GOLD, width=2)
    d.text((LEFT, 438), "โปร่งใสตรวจสอบได้ Provably-Fair SHA-256", font=f_foot, fill=MUTED)
    d.text((LEFT, 478), "seertarot.net", font=f_foot, fill=AMBER)

    os.makedirs(OUT_DIR, exist_ok=True)
    # ลดขนาดไฟล์ด้วยพาเลตต์ 256 สี — ภาพแบนราบแบบนี้แทบไม่ต่างจากต้นฉบับ
    img.convert("P", palette=Image.ADAPTIVE, colors=256).save(OUT, "PNG", optimize=True)
    print(f"✅ {OUT} · {os.path.getsize(OUT) / 1024:.0f} KB")


if __name__ == "__main__":
    sys.exit(main())
