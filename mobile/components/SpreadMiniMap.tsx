import { LinearGradient } from "expo-linear-gradient";
import { StyleSheet, View } from "react-native";

import { night, radius } from "@/lib/theme";
import { MAP_CARD_ASPECT, boxOf, mapLayout } from "@core/lib/tarot/spread-map-geometry";
import type { Spread } from "@core/data/spreads";

/**
 * ภาพย่อหน้าตาผัง — แผ่นฟ้าค่ำสี่เหลี่ยมจัตุรัส + ไพ่ทองวางตามพิกัดจริง ให้ผู้ใช้เห็นหน้าตาผังก่อนเลือก
 * ใช้ `mapLayout` ตัวเดียวกับเว็บ จึงไม่ทับกันและสัดส่วนตรงกับแผนผังตอนเปิดไพ่จริง
 * (ตกแต่งล้วน — ซ่อนจาก VoiceOver เพราะจำนวนใบอ่านจากข้อความข้าง ๆ อยู่แล้ว)
 */
export function SpreadMiniMap({ spread, size = 76 }: { spread: Spread; size?: number }) {
  const layout = mapLayout(spread.positions);
  const boxes = spread.positions.map((p) => boxOf(p, layout));
  // ตัดที่ว่างรอบกลุ่มไพ่ออก แล้วขยายทั้งกลุ่มเท่ากันให้เต็มกรอบ (ขยายเท่ากันทุกใบ จึงไม่ทับกัน)
  // จำกัดไม่ให้ไพ่ใบเดียวใหญ่เกิน 20% ของกรอบ — ผัง 1 ใบจะได้ไม่กลายเป็นแท่งทองก้อนโต
  const minL = Math.min(...boxes.map((b) => b.left));
  const maxR = Math.max(...boxes.map((b) => b.right));
  const minT = Math.min(...boxes.map((b) => b.top));
  const maxB = Math.max(...boxes.map((b) => b.bottom));
  const inner = size * 0.74;
  const scale = Math.min(inner / (maxR - minL), inner / (maxB - minT), (size * 0.2) / layout.cardW);
  const cardW = layout.cardW * scale;
  const cardH = cardW * MAP_CARD_ASPECT;
  const ox = (size - (maxR - minL) * scale) / 2;
  const oy = (size - (maxB - minT) * scale) / 2;

  return (
    <LinearGradient
      colors={[night.top, night.base]}
      start={{ x: 0.1, y: 0 }}
      end={{ x: 0.9, y: 1 }}
      style={[styles.tile, { width: size, height: size }]}
      importantForAccessibility="no-hide-descendants"
      accessibilityElementsHidden
    >
      {spread.positions.map((pos, i) => {
        const b = boxes[i];
        const cx = ox + ((b.left + b.right) / 2 - minL) * scale;
        const cy = oy + ((b.top + b.bottom) / 2 - minT) * scale;
        const rotated = pos.rotate === 90 || pos.rotate === 270;
        return (
          <View
            key={pos.index}
            style={[
              styles.card,
              {
                width: cardW,
                height: cardH,
                left: cx - cardW / 2,
                top: cy - cardH / 2,
                transform: rotated ? [{ rotate: `${pos.rotate}deg` }] : undefined,
              },
            ]}
          />
        );
      })}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  tile: {
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: night.line,
  },
  card: {
    position: "absolute",
    borderRadius: 2,
    backgroundColor: night.gold,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,236,200,0.8)",
  },
});
