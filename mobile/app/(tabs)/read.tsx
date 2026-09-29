import { router } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { Body, H1, Screen } from "@/components/ui";
import { SPREADS_BY_CATEGORY, type SpreadCategoryId } from "@core/data/spread-categories";
import { colors, radius, space } from "@/lib/theme";

/** ชิปหมวด — ลำดับและรายชื่อผังมาจากข้อมูลกลางของเว็บ (`spread-categories.ts`) ไม่นับเลขเอง */
const CATEGORIES: { id: SpreadCategoryId; label: string }[] = [
  { id: "popular", label: "ยอดนิยม" },
  { id: "quick", label: "ด่วน" },
  { id: "love", label: "ความรัก" },
  { id: "career", label: "การงานการเงิน" },
  { id: "time", label: "ช่วงเวลา" },
  { id: "life", label: "ชีวิต" },
  { id: "all", label: "ทั้งหมด" },
];

export default function ReadScreen() {
  const [category, setCategory] = useState<SpreadCategoryId>("popular");
  const spreads = SPREADS_BY_CATEGORY[category];

  return (
    <Screen>
      <H1>เปิดไพ่</H1>
      <Body muted>เลือกผังที่ตรงกับเรื่องที่อยากถาม</Body>

      <View style={styles.chips}>
        {CATEGORIES.map((c) => (
          <Pressable
            key={c.id}
            onPress={() => setCategory(c.id)}
            accessibilityRole="button"
            accessibilityState={{ selected: category === c.id }}
            style={[styles.chip, category === c.id && styles.chipOn]}
          >
            <Text style={[styles.chipText, category === c.id && { color: colors.surface }]}>
              {c.label} ({SPREADS_BY_CATEGORY[c.id].length})
            </Text>
          </Pressable>
        ))}
      </View>

      {spreads.map((s) => (
        <Pressable
          key={s.id}
          onPress={() => router.push(`/reading/${s.id}`)}
          accessibilityRole="button"
          style={({ pressed }) => [styles.row, pressed && { opacity: 0.8 }]}
        >
          <Text style={styles.rowTitle}>{s.nameTh}</Text>
          <Text style={styles.rowMeta}>{s.positions.length} ใบ</Text>
          <Text style={styles.rowTag}>{s.tagline}</Text>
        </Pressable>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  chips: { flexDirection: "row", flexWrap: "wrap", gap: space.sm },
  chip: {
    paddingHorizontal: space.md,
    minHeight: 40,
    justifyContent: "center",
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.lineWarm,
    backgroundColor: colors.surfaceWarm,
  },
  chipOn: { backgroundColor: colors.goldInk, borderColor: colors.goldInk },
  chipText: { color: colors.ink, fontSize: 14 },
  row: {
    backgroundColor: colors.surfaceWarm,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.lineWarm,
    padding: space.md,
    gap: 4,
  },
  rowTitle: { fontSize: 17, fontWeight: "600", color: colors.ink },
  rowMeta: { fontSize: 13, color: colors.goldInk },
  rowTag: { fontSize: 14, color: colors.muted, lineHeight: 20 },
});
