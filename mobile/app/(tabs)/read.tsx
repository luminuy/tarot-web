import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";

import { SpreadMiniMap } from "@/components/SpreadMiniMap";
import { Badge, Card, Chip, Screen } from "@/components/ui";
import { SPREADS_BY_CATEGORY, type SpreadCategoryId } from "@core/data/spread-categories";
import { colors, GUTTER, space, spreadTitle, type } from "@/lib/theme";

/** ชิปหมวด — ลำดับและรายชื่อผังมาจากข้อมูลกลางของเว็บ (`spread-categories.ts`) ไม่นับเลขเอง */
const CATEGORIES: { id: SpreadCategoryId; label: string }[] = [
  { id: "popular", label: "ยอดนิยม" },
  { id: "quick", label: "ด่วน" },
  { id: "love", label: "ความรัก" },
  { id: "career", label: "งานและเงิน" },
  { id: "time", label: "ช่วงเวลา" },
  { id: "life", label: "ชีวิต" },
  { id: "all", label: "ทั้งหมด" },
];

/**
 * เลือกผัง (DESIGN.md ข้อ 5) — ภาพย่อผังบนฟ้าค่ำให้เห็นหน้าตาก่อนเลือก · จำนวนใบเป็นป้าย ไม่ปนในชื่อ
 * ชิปหมวดอยู่แถวเดียวเลื่อนแนวนอน (ไม่ตัดบรรทัดจนเหลือชิปโดดเดี่ยว)
 */
export default function ReadScreen() {
  const [category, setCategory] = useState<SpreadCategoryId>("popular");
  const spreads = SPREADS_BY_CATEGORY[category];

  return (
    <Screen title="เปิดไพ่" subtitle="เลือกผังที่ตรงกับเรื่องที่อยากถาม">
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ marginHorizontal: -GUTTER, flexGrow: 0 }}
        contentContainerStyle={{ paddingHorizontal: GUTTER, gap: space.sm }}
      >
        {CATEGORIES.map((c) => (
          <Chip
            key={c.id}
            label={`${c.label} ${SPREADS_BY_CATEGORY[c.id].length}`}
            selected={category === c.id}
            onPress={() => setCategory(c.id)}
          />
        ))}
      </ScrollView>

      <Animated.View key={category} entering={FadeIn.duration(200)} style={{ gap: space.sm + 4 }}>
        {spreads.map((s) => (
          <Card
            key={s.id}
            style={styles.row}
            onPress={() => router.push(`/reading/${s.id}`)}
            accessibilityLabel={`${spreadTitle(s.nameTh)} ${s.positions.length} ใบ ${s.tagline}`}
          >
            <SpreadMiniMap spread={s} size={80} />
            <View style={{ flex: 1, gap: 4 }}>
              <Text style={[type.headline, { color: colors.ink }]}>{spreadTitle(s.nameTh)}</Text>
              <Text style={[type.footnote, { color: colors.muted }]} numberOfLines={2}>
                {s.tagline}
              </Text>
              <Badge label={`${s.positions.length} ใบ`} icon="copy-outline" />
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.muted} />
          </Card>
        ))}
      </Animated.View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", gap: space.md - 2, alignItems: "center", padding: space.sm + 4 },
});
