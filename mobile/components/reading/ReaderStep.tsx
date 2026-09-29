import * as Haptics from "expo-haptics";
import { FlatList, Pressable, StyleSheet, Text, View, useWindowDimensions } from "react-native";

import { CardImageNative } from "@/components/CardImageNative";
import { GlassSurface } from "@/components/glass";
import { Caption, H1 } from "@/components/ui";
import type { Action } from "@/lib/reading-flow";
import { colors, radius, space } from "@/lib/theme";
import { PERSONAS } from "@core/data/personas";

/** ภาพประจำตัวแม่หมอเก็บเป็นชื่อไฟล์ "major-02.jpg" — แอปใช้ id ไพ่ */
const cardIdOf = (image: string) => image.replace(/\.\w+$/, "");

/** ขั้น 2 — เลือกแม่หมอ: ปัดการ์ดแนวนอน (snap) แตะเลือก · การ์ดใหญ่ อ่านน้ำเสียงได้ครบ */
export function ReaderStep({ personaId, dispatch }: { personaId: string; dispatch: (a: Action) => void }) {
  const { width } = useWindowDimensions();
  const itemW = Math.min(280, width * 0.68);

  return (
    <>
      <View style={{ gap: space.xs }}>
        <H1>เลือกแม่หมอที่ใช่</H1>
        <Caption>ปัดดูได้ทุกท่าน — คำถามเดียวกัน แต่น้ำเสียงต่างกัน</Caption>
      </View>
      <FlatList
        data={PERSONAS}
        horizontal
        keyExtractor={(p) => p.id}
        snapToInterval={itemW + space.md}
        decelerationRate="fast"
        showsHorizontalScrollIndicator={false}
        // ขยายพ้นขอบ padding ของหน้า เพื่อให้การ์ดแรกเริ่มที่ขอบเดียวกับหัวข้อ
        style={{ marginHorizontal: -space.md }}
        contentContainerStyle={{ paddingHorizontal: space.md, gap: space.md, paddingVertical: space.sm }}
        renderItem={({ item }) => {
          const selected = item.id === personaId;
          return (
            <Pressable
              onPress={() => {
                void Haptics.selectionAsync();
                dispatch({ type: "persona", id: item.id });
              }}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              accessibilityLabel={`${item.nameTh} ${item.tagline}`}
              style={({ pressed }) => [{ width: itemW, transform: [{ scale: pressed ? 0.98 : selected ? 1 : 0.96 }] }]}
            >
              <GlassSurface
                variant={selected ? "strong" : "light"}
                radius={radius.xl}
                contentStyle={[styles.card, selected && styles.cardOn]}
              >
                <CardImageNative cardId={cardIdOf(item.cardImage)} width={itemW * 0.5} />
                <Text style={styles.name}>{item.nameTh}</Text>
                <Text style={styles.tag}>{item.tagline}</Text>
                <Text style={[styles.pick, selected && { color: colors.goldInk, fontWeight: "700" }]}>
                  {selected ? "✦ เลือกแล้ว" : "แตะเพื่อเลือก"}
                </Text>
              </GlassSurface>
            </Pressable>
          );
        }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  card: { alignItems: "center", gap: space.sm, padding: space.md, borderRadius: radius.xl },
  cardOn: { borderWidth: 2, borderColor: colors.goldInk },
  name: { fontSize: 19, lineHeight: 32, fontWeight: "700", color: colors.ink, textAlign: "center" },
  tag: { fontSize: 14, lineHeight: 24, color: colors.muted, textAlign: "center", minHeight: 48 },
  pick: { fontSize: 14, lineHeight: 24, color: colors.muted },
});
