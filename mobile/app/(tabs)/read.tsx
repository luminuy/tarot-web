import { router } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { GlassSurface } from "@/components/glass";
import { SpreadMiniMap } from "@/components/SpreadMiniMap";
import { Body, Chip, H1, Screen } from "@/components/ui";
import { SPREADS_BY_CATEGORY, type SpreadCategoryId } from "@core/data/spread-categories";
import { colors, space } from "@/lib/theme";

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

/** เลือกผัง — การ์ดผังโชว์แผนที่ตำแหน่งย่อ ให้เห็นหน้าตาก่อนเลือก (DESIGN.md ข้อ 5) */
export default function ReadScreen() {
  const [category, setCategory] = useState<SpreadCategoryId>("popular");
  const spreads = SPREADS_BY_CATEGORY[category];

  return (
    <Screen>
      <H1>เลือกผังไพ่</H1>
      <Body muted>แตะผังที่ตรงกับเรื่องที่อยากถาม</Body>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ marginHorizontal: -space.md, flexGrow: 0 }}
        contentContainerStyle={{ paddingHorizontal: space.md, gap: space.sm }}
      >
        {CATEGORIES.map((c) => (
          <Chip key={c.id} label={`${c.label} (${SPREADS_BY_CATEGORY[c.id].length})`} selected={category === c.id} onPress={() => setCategory(c.id)} />
        ))}
      </ScrollView>

      {spreads.map((s) => (
        <Pressable
          key={s.id}
          onPress={() => router.push(`/reading/${s.id}`)}
          accessibilityRole="button"
          accessibilityLabel={`${s.nameTh} ${s.positions.length} ใบ ${s.tagline}`}
          style={({ pressed }) => [{ transform: [{ scale: pressed ? 0.98 : 1 }] }]}
        >
          <GlassSurface contentStyle={styles.row}>
            <SpreadMiniMap spread={s} />
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={styles.title}>{s.nameTh}</Text>
              <Text style={styles.tag}>{s.tagline}</Text>
            </View>
          </GlassSurface>
        </Pressable>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", gap: space.md, alignItems: "center", padding: space.md },
  title: { fontSize: 18, lineHeight: 30, fontWeight: "700", color: colors.ink },
  tag: { fontSize: 14, lineHeight: 24, color: colors.muted },
});
