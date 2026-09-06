#!/usr/bin/env python3
"""
🖼️  สร้างภาพพื้นหลังการ์ดแชร์ผลดวง (Open Graph Share Base) ขนาด 1200×630

ไฟล์นี้สร้างภาพพื้นหลังผืนผ้าใบเปล่าที่ไม่มีข้อความหัวข้อซ้อนทับ เพื่อให้ Cloudinary
สามารถดึงไปปั๊มข้อความชื่อผังพยากรณ์และคำถามอธิษฐานของผู้ใช้ได้อย่างคมชัด สวยงาม
ไร้ปัญหาตัวหนังสือซ้อนทับ (แก้ปัญหา M-01 ใน HANDOFF_MEDIA_FIX_2026-09-06.md)

วิธีใช้: python3 scripts/generate-share-base.py
ผลลัพธ์: public/og/share-base.png
"""
from PIL import Image, ImageDraw, ImageFont
import os
import sys

W, H = 1200, 630
BG = (250, 247, 242)
GOLD = (165, 138, 92)
AMBER = (143, 92, 26)
MUTED = (99, 91, 78)
BORDER = (217, 200, 172)
LEFT = 86

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CARD = os.path.join(ROOT, "public", "cards", "major-19.jpg")
OUT_DIR = os.path.join(ROOT, "public", "og")
OUT = os.path.join(OUT_DIR, "share-base.png")


def thai_font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont:
    """ฟอนต์ที่มีสระ/วรรณยุกต์ไทยครบ"""
    for path, idx in (
        ("/System/Library/Fonts/Supplemental/SukhumvitSet.ttc", 5 if bold else 2),
        ("/System/Library/Fonts/Thonburi.ttc", 1 if bold else 0),
    ):
        try:
            return ImageFont.truetype(path, size, index=idx)
        except Exception:
            continue
    raise SystemExit("ไม่พบฟอนต์ไทยในเครื่อง — ติดตั้ง SukhumvitSet หรือ Thonburi ก่อน")


def main() -> None:
    img = Image.new("RGB", (W, H), BG)
    d = ImageDraw.Draw(img)
    d.rectangle([28, 28, W - 29, H - 29], outline=BORDER, width=2)

    # 1. ไพ่ 1909 Rider-Waite ฝั่งขวา
    if os.path.exists(CARD):
        card = Image.open(CARD).convert("RGB")
        ch = 430
        cw = int(card.width * ch / card.height)
        card = card.resize((cw, ch), Image.LANCZOS)
        cx, cy = W - 96 - cw, (H - ch) // 2
        img.paste(Image.new("RGB", (cw + 16, ch + 16), (232, 225, 213)), (cx - 8, cy - 4))
        img.paste(card, (cx, cy))

    # 2. หัวแบรนด์และเส้นทอง (ไม่มีสัญลักษณ์ดาวหรืออิโมจิตามกฎข้อ 2)
    f_brand = thai_font(28, bold=True)
    f_foot = thai_font(20)

    d.text((LEFT, 75), "SEERTAROT · SANCTUARY", font=f_brand, fill=AMBER)
    d.line([(LEFT, 118), (LEFT + 280, 118)], fill=GOLD, width=2)

    # 3. ลายน้ำด้านล่าง
    d.text((LEFT, 525), "PROVABLY-FAIR SHA-256 · SEERTAROT.NET", font=f_foot, fill=MUTED)

    os.makedirs(OUT_DIR, exist_ok=True)
    img.convert("P", palette=Image.ADAPTIVE, colors=256).save(OUT, "PNG", optimize=True)
    print(f"✅ {OUT} · {os.path.getsize(OUT) / 1024:.0f} KB")


if __name__ == "__main__":
    sys.exit(main())
