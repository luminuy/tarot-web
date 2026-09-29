import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { GlassSurface } from "@/components/glass";
import { STEPS, STEP_LABEL, type Step } from "@/lib/reading-flow";
import { colors, space } from "@/lib/theme";

/** หัวจอพิธีเปิดไพ่: ปุ่มปิด + ชื่อผัง + แถบขั้นตอน 5 ขั้น (รู้ตำแหน่งตัวเองตลอด) */
export function FlowHeader({
  title,
  step,
  onClose,
  onBack,
}: {
  title: string;
  step: Step;
  onClose: () => void;
  /** ย้อนกลับ 1 ขั้น (ไม่ส่ง = ไม่มีปุ่มย้อน) */
  onBack?: () => void;
}) {
  const { top } = useSafeAreaInsets();
  const index = STEPS.indexOf(step);

  return (
    <View style={[styles.wrap, { paddingTop: top + space.sm }]}>
      <View style={styles.row}>
        <Pressable
          onPress={onBack ?? onClose}
          accessibilityRole="button"
          accessibilityLabel={onBack ? "ย้อนกลับ" : "ปิด"}
          hitSlop={8}
          style={styles.iconBtn}
        >
          <GlassSurface radius={22} flat variant="strong" style={styles.round} contentStyle={styles.roundIn}>
            <Ionicons name={onBack ? "chevron-back" : "close"} size={22} color={colors.ink} />
          </GlassSurface>
        </Pressable>
        <View style={{ flex: 1, alignItems: "center" }}>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          <Text style={styles.stepLabel} accessibilityLiveRegion="polite">
            ขั้น {index + 1}/{STEPS.length} · {STEP_LABEL[step]}
          </Text>
        </View>
        {onBack ? (
          <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel="ปิดพิธีเปิดไพ่" hitSlop={8} style={styles.iconBtn}>
            <GlassSurface radius={22} flat variant="strong" style={styles.round} contentStyle={styles.roundIn}>
              <Ionicons name="close" size={22} color={colors.ink} />
            </GlassSurface>
          </Pressable>
        ) : (
          <View style={styles.iconBtn} />
        )}
      </View>
      <View style={styles.bar} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        {STEPS.map((s, i) => (
          <View key={s} style={[styles.seg, i <= index && styles.segOn]} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: space.md,
    paddingBottom: space.sm,
    gap: space.sm,
  },
  row: { flexDirection: "row", alignItems: "center" },
  iconBtn: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  round: { width: 44, height: 44 },
  roundIn: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 17, lineHeight: 28, fontWeight: "700", color: colors.ink },
  stepLabel: { fontSize: 13, lineHeight: 22, color: colors.goldInk },
  bar: { flexDirection: "row", gap: 4 },
  seg: { flex: 1, height: 4, borderRadius: 2, backgroundColor: "rgba(255,255,255,0.7)" },
  segOn: { backgroundColor: colors.goldInk },
});
