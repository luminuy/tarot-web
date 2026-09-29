import { Image } from "expo-image";
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from "react-native";

import { CARD_IMAGES } from "@/lib/cardImages";
import { CARD_ASPECT, colors, radius } from "@/lib/theme";

/**
 * คอมโพเนนต์ภาพไพ่จุดเดียวของแอป (เทียบกฎเหล็กข้อ 8 ของเว็บ `<CardImage />`)
 * ห้ามเรียก `require("…/public/cards/…")` หรือ `<Image>` กับไพ่จากที่อื่น
 *
 * กฎเหล็กข้อ 14: ไม่พบภาพของ id นี้ = แสดงกรอบว่างพร้อมข้อความ "โหลดใหม่อีกครั้ง"
 * ห้ามหยิบภาพไพ่ใบอื่นมาแทนเด็ดขาด
 */
export function CardImageNative({
  cardId,
  reversed = false,
  width,
  aspect = CARD_ASPECT,
  style,
}: {
  cardId: string | undefined;
  reversed?: boolean;
  width: number;
  /** กว้าง/สูง — ค่าเริ่มต้น 7:12 ของภาพต้นฉบับ · แผนผังใช้ 2:3 (ภาพถูกครอบเล็กน้อยด้วย cover) */
  aspect?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const source = cardId ? CARD_IMAGES[cardId] : undefined;
  const box = { width, height: width / aspect };

  if (!source) {
    return (
      <View style={[styles.frame, styles.missing, box, style]}>
        <Text style={styles.missingText}>โหลดใหม่อีกครั้ง</Text>
      </View>
    );
  }

  return (
    <View style={[styles.frame, box, style]}>
      <Image
        source={source}
        style={[StyleSheet.absoluteFill, reversed && styles.reversed]}
        contentFit="cover"
        transition={120}
        accessibilityIgnoresInvertColors
      />
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    borderRadius: radius.sm,
    overflow: "hidden",
    backgroundColor: colors.inset,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.6)",
  },
  reversed: { transform: [{ rotate: "180deg" }] },
  missing: { alignItems: "center", justifyContent: "center" },
  missingText: { color: colors.muted, fontSize: 12, textAlign: "center" },
});
