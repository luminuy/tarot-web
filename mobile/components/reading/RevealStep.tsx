import { View, useWindowDimensions } from "react-native";

import { SpreadBoard } from "@/components/SpreadBoard";
import { Body, Caption, ErrorNote, H1 } from "@/components/ui";
import type { Action, FlowState } from "@/lib/reading-flow";
import { space } from "@/lib/theme";
import type { Spread } from "@core/data/spreads";

/**
 * ขั้น 4 — เปิดไพ่บนแผนผังจริงของผัง: แตะไพ่ทีละใบเพื่อพลิกด้วยตัวเอง (กฎเหล็กข้อ 4)
 * ไม่มีปุ่ม "พลิกทั้งหมด" — ปุ่มอ่านคำทำนายปลดล็อกเมื่อพลิกครบทุกใบ (ดู `allFlipped`)
 */
export function RevealStep({ spread, state, dispatch }: { spread: Spread; state: FlowState; dispatch: (a: Action) => void }) {
  const { width } = useWindowDimensions();
  const shuffle = state.shuffle;

  // กฎเหล็กข้อ 14: ไม่มีข้อมูลไพ่ = บอกให้โหลดใหม่ ไม่กุไพ่มาแทน
  if (!shuffle) return <ErrorNote>ไม่พบข้อมูลไพ่ กรุณาย้อนกลับแล้วโหลดใหม่อีกครั้ง</ErrorNote>;

  const cards = shuffle.cards.map((c, i) => ({ id: c.id, nameTh: c.nameTh, reversed: shuffle.drawn[i]?.isReversed ?? false }));

  return (
    <>
      <View style={{ gap: space.xs }}>
        <H1>แตะไพ่เพื่อพลิกเปิด</H1>
        <Body muted>ทีละใบ ตามจังหวะของคุณ</Body>
      </View>
      <SpreadBoard
        spread={spread}
        cards={cards}
        flipped={state.flipped}
        onFlip={(index) => dispatch({ type: "flip", index })}
        width={width - space.md * 2}
      />
      <Caption>
        เปิดแล้ว {state.flipped.length}/{cards.length} ใบ · แตะไพ่ที่เปิดแล้วเพื่อดูความหมายของตำแหน่ง
      </Caption>
    </>
  );
}
