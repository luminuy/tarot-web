import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useContext, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, useWindowDimensions, View } from "react-native";
import Animated from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { CardImageNative } from "@/components/CardImageNative";
import { Backdrop } from "@/components/glass";
import { BottomSpaceContext, Chip, NavBar, PageHeader, useScrollY } from "@/components/ui";
import { ALL_CARDS } from "@core/data/cards";
import type { Suit } from "@core/data/cards/types";
import { colors, GUTTER, radius, space, type } from "@/lib/theme";

const COLUMNS = 3;
const GAP = space.sm + 4;

type Filter = "all" | "major" | Suit;
const FILTERS: { id: Filter; label: string }[] = [
  { id: "all", label: "ทั้งหมด" },
  { id: "major", label: "ไพ่ชุดใหญ่" },
  { id: "wands", label: "ไม้เท้า" },
  { id: "cups", label: "ถ้วย" },
  { id: "swords", label: "ดาบ" },
  { id: "pentacles", label: "เหรียญ" },
];

/**
 * คลังไพ่ 78 ใบ — ข้อมูลอยู่ในแอป ใช้ได้ออฟไลน์ (แผน IOS_APP_PLAN 3.3)
 * ช่องค้นหา + ชิปกรองชุดไพ่ เลื่อนไปกับหัวข้อ · แถบหัวจอกระจกโผล่เมื่อเลื่อนลง
 */
export default function CardsScreen() {
  const { width } = useWindowDimensions();
  const { top } = useSafeAreaInsets();
  const bottomSpace = useContext(BottomSpaceContext);
  const { y, onScroll } = useScrollY();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const cardWidth = Math.floor((width - GUTTER * 2 - GAP * (COLUMNS - 1)) / COLUMNS);

  const cards = useMemo(() => {
    const q = query.trim().toLowerCase();
    return ALL_CARDS.filter((c) => {
      if (filter === "major" && c.arcana !== "major") return false;
      if (filter !== "all" && filter !== "major" && c.suit !== filter) return false;
      if (!q) return true;
      return c.nameTh.includes(q) || c.nameEn.toLowerCase().includes(q) || c.keywords.upright.some((k) => k.includes(q));
    });
  }, [query, filter]);

  const header = (
    <View style={{ gap: space.md, paddingTop: top + space.sm, marginBottom: space.md }}>
      <PageHeader title="คลังไพ่" subtitle={`ความหมายไพ่ทาโรต์ครบ ${ALL_CARDS.length} ใบ ใช้ได้แม้ไม่มีเน็ต`} />
      <View style={styles.search}>
        <Ionicons name="search" size={18} color={colors.muted} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="ค้นหาชื่อไพ่หรือคำสำคัญ"
          placeholderTextColor={colors.muted}
          style={styles.searchInput}
          accessibilityLabel="ค้นหาไพ่"
          returnKeyType="search"
          clearButtonMode="while-editing"
        />
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ marginHorizontal: -GUTTER, flexGrow: 0 }}
        contentContainerStyle={{ paddingHorizontal: GUTTER, gap: space.sm }}
        keyboardShouldPersistTaps="handled"
      >
        {FILTERS.map((f) => (
          <Chip key={f.id} label={f.label} selected={filter === f.id} onPress={() => setFilter(f.id)} />
        ))}
      </ScrollView>
    </View>
  );

  return (
    <View style={styles.screen}>
      <Backdrop />
      <Animated.FlatList
        data={cards}
        keyExtractor={(c) => c.id}
        numColumns={COLUMNS}
        onScroll={onScroll}
        scrollEventThrottle={16}
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={header}
        columnWrapperStyle={{ gap: GAP }}
        contentContainerStyle={{ paddingHorizontal: GUTTER, gap: space.md, paddingBottom: space.xl + bottomSpace }}
        initialNumToRender={15}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => router.push(`/card/${item.id}`)}
            accessibilityRole="button"
            accessibilityLabel={item.nameTh}
            style={({ pressed }) => [{ width: cardWidth, gap: 6 }, pressed && { opacity: 0.8, transform: [{ scale: 0.97 }] }]}
          >
            <View style={styles.cardShadow}>
              <CardImageNative cardId={item.id} width={cardWidth} />
            </View>
            <Text style={[type.caption2, styles.name]} numberOfLines={2}>
              {item.nameTh}
            </Text>
          </Pressable>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="search-outline" size={28} color={colors.muted} />
            <Text style={[type.subhead, { color: colors.muted, textAlign: "center" }]}>ไม่พบไพ่ที่ตรงกับคำค้น ลองคำอื่นหรือเลือก "ทั้งหมด"</Text>
          </View>
        }
      />
      <NavBar scrollY={y} title="คลังไพ่" />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.canvas },
  search: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.sm,
    minHeight: 46,
    paddingHorizontal: space.md - 2,
    borderRadius: radius.md,
    backgroundColor: "rgba(116,73,15,0.08)",
  },
  searchInput: { flex: 1, minHeight: 46, color: colors.ink, fontSize: 17 },
  cardShadow: {
    borderRadius: radius.sm,
    shadowColor: "#3B2708",
    shadowOpacity: 0.18,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  name: { color: colors.ink, textAlign: "center" },
  empty: { alignItems: "center", gap: space.sm, paddingVertical: space.xl },
});
