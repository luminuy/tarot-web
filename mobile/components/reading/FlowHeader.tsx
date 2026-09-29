import { StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { IconButton, useTone } from "@/components/ui";
import { STEPS, STEP_LABEL, type Step } from "@/lib/reading-flow";
import { colors, GUTTER, night, space, type } from "@/lib/theme";

/**
 * หัวจอพิธีเปิดไพ่: ปุ่มย้อน/ปิดกระจกลอย + ชื่อผัง + แถบขั้นตอน 5 ช่อง (รู้ตำแหน่งตัวเองตลอด)
 * ช่องของขั้นปัจจุบันยาวกว่าช่องอื่น — บอกตำแหน่งด้วยรูปทรง ไม่ใช่สีอย่างเดียว
 */
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
  const tone = useTone();
  const index = STEPS.indexOf(step);
  const ink = tone === "night" ? night.text : colors.ink;
  const accent = tone === "night" ? night.gold : colors.goldInk;
  const track = tone === "night" ? "rgba(255,244,222,0.16)" : "rgba(116,73,15,0.14)";

  return (
    <View style={[styles.wrap, { paddingTop: top + space.xs }]}>
      <View style={styles.row}>
        {onBack ? <IconButton icon="chevron-back" label="ย้อนกลับ" onPress={onBack} /> : <IconButton icon="close" label="ปิดพิธีเปิดไพ่" onPress={onClose} />}
        <View style={styles.center}>
          <Text style={[type.headline, { color: ink }]} numberOfLines={1}>
            {title}
          </Text>
          <Text style={[type.caption2, { color: accent }]} accessibilityLiveRegion="polite">
            ขั้น {index + 1} จาก {STEPS.length} · {STEP_LABEL[step]}
          </Text>
        </View>
        {onBack ? <IconButton icon="close" label="ปิดพิธีเปิดไพ่" onPress={onClose} /> : <View style={styles.spacer} />}
      </View>
      <View style={styles.bar} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        {STEPS.map((s, i) => (
          <View key={s} style={[styles.seg, { backgroundColor: i <= index ? accent : track }, i === index && styles.segNow]} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: GUTTER - 4, paddingBottom: space.sm, gap: space.sm + 2 },
  row: { flexDirection: "row", alignItems: "center", gap: space.sm },
  center: { flex: 1, alignItems: "center" },
  spacer: { width: 44, height: 44 },
  bar: { flexDirection: "row", gap: 5, paddingHorizontal: 4 },
  seg: { flex: 1, height: 4, borderRadius: 2 },
  segNow: { flex: 2.2 },
});
