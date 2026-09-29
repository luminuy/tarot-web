import { LinearGradient } from "expo-linear-gradient";
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from "react-native";

import { colors, night, radius } from "@/lib/theme";

/**
 * หลังไพ่ของแอป — ชิ้นเดียวใช้ทุกที่ (สำรับให้เลือก · ไพ่คว่ำบนแผนผัง · ไพ่ประจำวัน · ภาพประกอบหน้าว่าง)
 * ฟ้าค่ำ + กรอบทองสองชั้น + วงแหวนกลางกับ ✦ · ส่ง `label` เพื่อแสดงเลขลำดับแทน ✦ (ไพ่ที่เลือกแล้ว)
 */
export function CardBack({
  width,
  height,
  label,
  selected,
  style,
}: {
  width: number;
  height: number;
  label?: string;
  selected?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const ring = Math.min(width, height) * 0.46;
  return (
    <LinearGradient
      colors={selected ? ["#5A4330", "#2A2026", "#161218"] : [night.top, night.mid, night.base]}
      start={{ x: 0.2, y: 0 }}
      end={{ x: 0.8, y: 1 }}
      style={[styles.back, { width, height, borderColor: selected ? colors.goldOnDark : "rgba(210,163,84,0.7)", borderWidth: selected ? 2 : 1.25 }, style]}
    >
      <View style={styles.inner}>
        <View style={[styles.ring, { width: ring, height: ring, borderRadius: ring / 2 }]}>
          <Text
            style={[styles.glyph, { fontSize: Math.max(11, ring * (label ? 0.42 : 0.5)), lineHeight: Math.max(18, ring * 0.8) }]}
            allowFontScaling={false}
          >
            {label ?? "✦"}
          </Text>
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  back: { borderRadius: radius.sm, padding: 4 },
  inner: {
    flex: 1,
    borderRadius: radius.sm - 4,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(210,163,84,0.55)",
    alignItems: "center",
    justifyContent: "center",
  },
  ring: { borderWidth: 1, borderColor: "rgba(210,163,84,0.45)", alignItems: "center", justifyContent: "center" },
  glyph: { color: colors.goldOnDark, fontWeight: "700", textAlign: "center" },
});
