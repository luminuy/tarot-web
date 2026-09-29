import { useMemo, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { FlipCard } from "@/components/FlipCard";
import { Card, Eyebrow } from "@/components/ui";
import { splitPositionName } from "@/lib/reading-flow";
import { colors, night, radius, type } from "@/lib/theme";
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
      <View style={[styles.board, { width, height: geo.height * width }]}>
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
      </View>

      {selected !== null && cards[selected] && flipped.includes(selected) ? (
        <Card>
          <View accessibilityLiveRegion="polite" style={{ gap: 2 }}>
            <Eyebrow>
              ตำแหน่งที่ {selected + 1} · {splitPositionName(spread.positions[selected].nameTh).short}
            </Eyebrow>
            <Text style={[type.title2, { color: night.text }]}>
              {cards[selected].nameTh}
              {cards[selected].reversed ? " (กลับหัว)" : ""}
            </Text>
            <Text style={[type.subhead, { color: night.textSoft }]}>
              {splitPositionName(spread.positions[selected].nameTh).hint ?? spread.positions[selected].meaning}
            </Text>
          </View>
        </Card>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  // พื้นแท่นวางไพ่บนฟ้าค่ำ (ขั้นเปิดไพ่อยู่ในโทนค่ำเสมอ)
  board: {
    alignSelf: "center",
    borderRadius: radius.xl,
    backgroundColor: "rgba(255,244,222,0.05)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: night.line,
  },
  placeholder: {
    borderRadius: radius.sm,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "rgba(210,163,84,0.6)",
    alignItems: "center",
    justifyContent: "center",
  },
  placeholderText: { ...type.caption2, color: night.gold },
  badge: {
    position: "absolute",
    top: -7,
    left: -7,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: night.gold,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 5,
    borderWidth: 1.5,
    borderColor: night.base,
  },
  badgeText: { color: colors.dark, fontSize: 11, lineHeight: 18, fontWeight: "800" },
});
