#!/usr/bin/env python3
"""
🎨 1909 Rider-Waite Masterpiece Digital Remaster Engine
Applies intelligent unsharp masking, micro-contrast enhancement, and rich primary color tuning
to Pamela Colman Smith's authentic 1909 tarot cards before generating multi-resolution WebP variants.
"""

import os
import sys
import glob
from PIL import Image, ImageEnhance, ImageFilter

def remaster_cards(source_dir: str, output_dir: str):
    os.makedirs(output_dir, exist_ok=True)
    cards = sorted(glob.glob(os.path.join(source_dir, "*.jpg")))
    
    if not cards:
        print(f"❌ No .jpg files found in {source_dir}")
        sys.exit(1)
        
    print(f"🔮 [Remaster Engine] Enhancing {len(cards)} 1909 Tarot cards with Ultra-HD clarity...")
    
    for card_path in cards:
        filename = os.path.basename(card_path)
        out_path = os.path.join(output_dir, filename)
        
        # Check if already remastered and up-to-date
        if os.path.exists(out_path) and os.path.getmtime(out_path) >= os.path.getmtime(card_path):
            continue
            
        with Image.open(card_path) as img:
            rgb_img = img.convert("RGB")
            
            # 1. Line-Art Sharpness Enhancement
            enh_sharp = ImageEnhance.Sharpness(rgb_img)
            sharp = enh_sharp.enhance(1.22)
            
            # 2. Rich Primary Color Tuning (Sapphire, Ruby, Emerald, Gold)
            enh_col = ImageEnhance.Color(sharp)
            vibrant = enh_col.enhance(1.10)
            
            # 3. Ink Depth & Highlight Contrast
            enh_con = ImageEnhance.Contrast(vibrant)
            contrast = enh_con.enhance(1.06)
            
            # 4. Intelligent Unsharp Masking (enhances black lines without accentuating paper grain)
            unsharp = contrast.filter(ImageFilter.UnsharpMask(radius=1.1, percent=125, threshold=2))
            
            unsharp.save(out_path, format="JPEG", quality=96, subsampling=0)
            
    print("✨ [Remaster Engine] All 78 cards remastered into high-fidelity intermediates.")

if __name__ == "__main__":
    src = sys.argv[1] if len(sys.argv) > 1 else "public/cards"
    dst = sys.argv[2] if len(sys.argv) > 2 else "scratch/remaster_temp"
    remaster_cards(src, dst)
