import { StyleSheet, View } from "react-native";

import { colors } from "@/lib/theme";
import { MAP_CARD_ASPECT, boxOf, mapLayout } from "@core/lib/tarot/spread-map-geometry";
import type { Spread } from "@core/data/spreads";

/**
 * แผนที่ตำแหน่งย่อของผัง — ให้ผู้ใช้เห็นหน้าตาผังก่อนเลือก
 * ใช้ `mapLayout` ตัวเดียวกับเว็บ จึงไม่ทับกันและสัดส่วนตรงกับแผนผังตอนเปิดไพ่จริง
 * (ตกแต่งล้วน — ซ่อนจาก VoiceOver เพราะจำนวนใบอ่านจากข้อความข้าง ๆ อยู่แล้ว)
 */
export function SpreadMiniMap({ spread, width = 88 }: { spread: Spread; width?: number }) {
  const layout = mapLayout(spread.positions);
  const height = layout.boxHeight * width;
  const cardW = layout.cardW * width;
  const cardH = cardW * MAP_CARD_ASPECT;

  return (
    <View
      style={[styles.box, { width, height }]}
      importantForAccessibility="no-hide-descendants"
      accessibilityElementsHidden
    >
      {spread.positions.map((pos) => {
        const b = boxOf(pos, layout);
        const cx = ((b.left + b.right) / 2) * width;
        const cy = ((b.top + b.bottom) / 2) * width;
        const rotated = pos.rotate === 90 || pos.rotate === 270;
        return (
          <View
            key={pos.index}
            style={[
              styles.dot,
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
    </View>
  );
}

const styles = StyleSheet.create({
  box: { backgroundColor: colors.insetWarm, borderRadius: 10, overflow: "hidden" },
  dot: {
    position: "absolute",
    borderRadius: 2,
    backgroundColor: colors.goldInk,
    opacity: 0.85,
  },
});
