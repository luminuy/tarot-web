import { StyleSheet, Text, View, useWindowDimensions } from "react-native";

import { SpreadBoard } from "@/components/SpreadBoard";
import { Body, ErrorNote, H1 } from "@/components/ui";
import type { Action, FlowState } from "@/lib/reading-flow";
import { GUTTER, night, space, type } from "@/lib/theme";
import type { Spread } from "@core/data/spreads";

/**
 * ขั้น 4 — เปิดไพ่บนแผนผังจริงของผัง (โทนค่ำ): แตะไพ่ทีละใบเพื่อพลิกด้วยตัวเอง (กฎเหล็กข้อ 4)
 * ไม่มีปุ่ม "พลิกทั้งหมด" — ปุ่มอ่านคำทำนายปลดล็อกเมื่อพลิกครบทุกใบ (ดู `allFlipped`)
 */
export function RevealStep({ spread, state, dispatch }: { spread: Spread; state: FlowState; dispatch: (a: Action) => void }) {
  const { width } = useWindowDimensions();
  const shuffle = state.shuffle;

  // กฎเหล็กข้อ 14: ไม่มีข้อมูลไพ่ = บอกให้โหลดใหม่ ไม่กุไพ่มาแทน
  if (!shuffle) return <ErrorNote>ไม่พบข้อมูลไพ่ กรุณาย้อนกลับแล้วโหลดใหม่อีกครั้ง</ErrorNote>;

  const cards = shuffle.cards.map((c, i) => ({ id: c.id, nameTh: c.nameTh, reversed: shuffle.drawn[i]?.isReversed ?? false }));
  const done = state.flipped.length;

  return (
    <>
      <View style={styles.head}>
        <View style={{ flex: 1, gap: space.xs }}>
          <H1>แตะไพ่เพื่อพลิกเปิด</H1>
          <Body muted>ทีละใบ ตามจังหวะของคุณ แตะใบที่เปิดแล้วเพื่อดูความหมายของตำแหน่ง</Body>
        </View>
        <View style={styles.counter} accessibilityLabel={`เปิดแล้ว ${done} จาก ${cards.length} ใบ`}>
          <Text style={[type.title2, { color: night.gold }]}>{done}</Text>
          <Text style={[type.caption2, { color: night.textSoft }]}>จาก {cards.length}</Text>
        </View>
      </View>
      <SpreadBoard
        spread={spread}
        cards={cards}
        flipped={state.flipped}
        onFlip={(index) => dispatch({ type: "flip", index })}
        width={width - GUTTER * 2}
      />
    </>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: "row", alignItems: "flex-start", gap: space.md },
  counter: {
    minWidth: 64,
    alignItems: "center",
    paddingVertical: space.xs,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: night.line,
    backgroundColor: "rgba(255,244,222,0.06)",
    marginTop: 8,
  },
});
