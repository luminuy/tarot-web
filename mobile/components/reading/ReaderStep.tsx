import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { CardImageNative } from "@/components/CardImageNative";
import { Body, H1 } from "@/components/ui";
import type { Action } from "@/lib/reading-flow";
import { colors, radius, shadow, space, type } from "@/lib/theme";
import { PERSONAS } from "@core/data/personas";

/** ภาพประจำตัวแม่หมอเก็บเป็นชื่อไฟล์ "major-02.jpg" — แอปใช้ id ไพ่ */
const cardIdOf = (image: string) => image.replace(/\.\w+$/, "");

/**
 * ขั้น 2 — เลือกแม่หมอ: รายการแนวตั้งแบบปุ่มเลือกเดียว (radio)
 * เปลี่ยนจากการ์ดปัดแนวนอนของรอบก่อน — ตัวเลือกมี 5 ท่าน เห็นครบในจอเดียวดีกว่าต้องปัดหาทีละใบ
 */
export function ReaderStep({ personaId, dispatch }: { personaId: string; dispatch: (a: Action) => void }) {
  return (
    <>
      <View style={{ gap: space.xs }}>
        <H1>ให้ใครอ่านไพ่ให้ดี</H1>
        <Body muted>คำถามเดียวกัน แต่น้ำเสียงต่างกัน เลือกแบบที่ใจอยากฟัง</Body>
      </View>
      <View style={{ gap: space.sm + 2 }} accessibilityRole="radiogroup">
        {PERSONAS.map((p) => {
          const selected = p.id === personaId;
          return (
            <Pressable
              key={p.id}
              onPress={() => {
                void Haptics.selectionAsync();
                dispatch({ type: "persona", id: p.id });
              }}
              accessibilityRole="radio"
              accessibilityState={{ checked: selected }}
              accessibilityLabel={`${p.nameTh} ${p.tagline}`}
              style={({ pressed }) => [styles.row, selected && styles.rowOn, pressed && { transform: [{ scale: 0.985 }] }]}
            >
              <CardImageNative cardId={cardIdOf(p.cardImage)} width={46} />
              <View style={{ flex: 1 }}>
                <Text style={[type.headline, { color: colors.ink }]}>{p.nameTh}</Text>
                <Text style={[type.footnote, { color: colors.muted }]}>{p.tagline}</Text>
              </View>
              <Ionicons
                name={selected ? "checkmark-circle" : "ellipse-outline"}
                size={26}
                color={selected ? colors.goldInk : "rgba(116,73,15,0.3)"}
              />
            </Pressable>
          );
        })}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.md - 2,
    padding: space.sm + 4,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: "rgba(116,73,15,0.12)",
    backgroundColor: "rgba(255,253,249,0.88)",
    ...shadow.card,
  },
  // ขอบหนาขึ้น 1px จึงลด padding 1px ให้แถวไม่ขยับตอนเลือก
  rowOn: { borderColor: colors.goldInk, borderWidth: 2, padding: space.sm + 3, backgroundColor: "#FFF8EC" },
});
