import { useMemo, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { FlipCard } from "@/components/FlipCard";
import { GlassSurface } from "@/components/glass";
import { splitPositionName } from "@/lib/reading-flow";
import { colors, radius } from "@/lib/theme";
import { MAP_CARD_ASPECT, boxOf, mapLayout } from "@core/lib/tarot/spread-map-geometry";
import type { Spread } from "@core/data/spreads";

/**
 * แผนผังตำแหน่งไพ่จริงของผังนั้น — ใช้เรขาคณิตตัวเดียวกับเว็บ (`spread-map-geometry.ts`)
 * ซึ่งมีด่านตรวจว่า "ไม่มีไพ่ทับกันสักคู่" ทุกผัง (ผัง ≥ 7 ใบ ย่อการ์ดเองอัตโนมัติ — กฎเหล็กข้อ 9)
 *
 * แอปเติมสองอย่างที่เว็บไม่ต้องทำ (จอมือถือแคบกว่า):
 *  1. ตัดที่ว่างบน/ล่างที่ไม่มีไพ่ออก
 *  2. ผังเล็ก (เช่น 3 ใบ) ขยายทั้งกลุ่มให้เต็มความกว้าง — ขยายเท่ากันทุกใบจึงไม่ทับกัน (จำกัดไม่ให้ใหญ่เกิน 30% ของกรอบ)
 *
 * ไพ่ที่ยังคว่ำ: แตะ = พลิก (ผู้ใช้พลิกเองเท่านั้น — กฎเหล็กข้อ 4)
 * ไพ่ที่พลิกแล้ว: แตะ = ดูความหมายของตำแหน่งใต้แผนผัง
 * ไพ่ใบที่ "ไขว้ทับ" ใบก่อนหน้า (เช่น เซลติกครอสใบที่ 2) จะปรากฏเมื่อใบล่างถูกพลิกแล้ว
 * — ไม่งั้นใบบนบังใบล่างจนผู้ใช้ไม่เห็นว่ากำลังพลิกอะไร
 */
export interface BoardCard {
  id: string;
  nameTh: string;
  reversed: boolean;
}

const PAD = 0.03;
const MAX_CARD_W = 0.3;
const SAME_SPOT = 1e-6;

export function SpreadBoard({
  spread,
  cards,
  flipped,
  onFlip,
  width,
}: {
  spread: Spread;
  cards: BoardCard[];
  flipped: number[];
  onFlip: (index: number) => void;
  width: number;
}) {
  const [selected, setSelected] = useState<number | null>(null);

  const geo = useMemo(() => {
    const layout = mapLayout(spread.positions);
    const boxes = spread.positions.map((p) => boxOf(p, layout));
    const minL = Math.min(...boxes.map((b) => b.left));
    const maxR = Math.max(...boxes.map((b) => b.right));
    const minT = Math.min(...boxes.map((b) => b.top));
    const maxB = Math.max(...boxes.map((b) => b.bottom));
    const scale = Math.max(1, Math.min((1 - 2 * PAD) / (maxR - minL), MAX_CARD_W / layout.cardW));
    const cx0 = (minL + maxR) / 2;
    const items = spread.positions.map((pos, i) => {
      const b = boxes[i];
      const under = spread.positions.findIndex(
        (q, j) => j < i && Math.abs(q.x - pos.x) < SAME_SPOT && Math.abs(q.y - pos.y) < SAME_SPOT,
      );
      return {
        pos,
        // จุดศูนย์กลางเทียบกรอบ (หน่วยเทียบความกว้าง) หลังตัดที่ว่างและขยาย
        cx: 0.5 + ((b.left + b.right) / 2 - cx0) * scale,
        cy: PAD + ((b.top + b.bottom) / 2 - minT) * scale,
        under: under >= 0 ? under : null,
      };
    });
    return { cardW: layout.cardW * scale, height: (maxB - minT) * scale + 2 * PAD, items };
  }, [spread]);

  const cardW = geo.cardW * width;
  const cardH = cardW * MAP_CARD_ASPECT;

  return (
    <View style={{ gap: 12 }}>
      <GlassSurface variant="light" radius={radius.xl} style={{ alignSelf: "center", width, height: geo.height * width }} contentStyle={{ width, height: geo.height * width }}>
        {geo.items.map(({ pos, cx, cy, under }, i) => {
          const card = cards[i];
          const rotated = pos.rotate === 90 || pos.rotate === 270;
          const hidden = under !== null && !flipped.includes(under);
          const short = splitPositionName(pos.nameTh).short;
          const style = {
            position: "absolute" as const,
            left: cx * width - cardW / 2,
            top: cy * width - cardH / 2,
            transform: rotated ? [{ rotate: `${pos.rotate}deg` }] : undefined,
            zIndex: selected === i ? 3 : under !== null ? 2 : 1,
          };

          // ใบที่ไขว้ทับ: รอใบล่างพลิกก่อน — แสดงกรอบประไว้ให้รู้ว่ามีตำแหน่งนี้
          if (hidden) {
            return (
              <View key={pos.index} style={[style, styles.placeholder, { width: cardW, height: cardH }]} pointerEvents="none">
                <Text style={styles.placeholderText}>{i + 1}</Text>
              </View>
            );
          }

          return (
            <View key={pos.index} style={style}>
              <FlipCard
                cardId={card?.id}
                reversed={card?.reversed}
                width={cardW}
                aspect={1 / MAP_CARD_ASPECT}
                flipped={flipped.includes(i)}
                onFlip={() => onFlip(i)}
                onPressFlipped={() => setSelected(i)}
                accessibilityName={`ตำแหน่งที่ ${i + 1} ${short}${card ? ` ${card.nameTh}` : ""}`}
              />
              <View style={styles.badge} pointerEvents="none">
                <Text style={styles.badgeText}>{i + 1}</Text>
              </View>
            </View>
          );
        })}
      </GlassSurface>

      {selected !== null && cards[selected] && flipped.includes(selected) ? (
        <GlassSurface variant="strong" radius={radius.lg} contentStyle={styles.detail}>
          <View accessibilityLiveRegion="polite">
          <Text style={styles.detailPos}>
            {selected + 1}. {splitPositionName(spread.positions[selected].nameTh).short}
          </Text>
          <Text style={styles.detailName}>
            {cards[selected].nameTh}
            {cards[selected].reversed ? " (กลับหัว)" : ""}
          </Text>
          <Text style={styles.detailMeaning}>
            {splitPositionName(spread.positions[selected].nameTh).hint ?? spread.positions[selected].meaning}
          </Text>
          </View>
        </GlassSurface>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  placeholder: {
    borderRadius: radius.sm,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: colors.gold,
    alignItems: "center",
    justifyContent: "center",
  },
  placeholderText: { color: colors.goldInk, fontSize: 13, lineHeight: 20 },
  badge: {
    position: "absolute",
    top: -6,
    left: -6,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.goldInk,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  badgeText: { color: colors.surface, fontSize: 11, lineHeight: 16, fontWeight: "700" },
  detail: { padding: 16, gap: 2 },
  detailPos: { color: colors.goldInk, fontSize: 14, lineHeight: 24, fontWeight: "600" },
  detailName: { color: colors.ink, fontSize: 18, lineHeight: 30, fontWeight: "700" },
  detailMeaning: { color: colors.muted, fontSize: 14, lineHeight: 24 },
});
