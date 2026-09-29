import { router } from "expo-router";
import { useMemo, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, TextInput, useWindowDimensions, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { CardImageNative } from "@/components/CardImageNative";
import { H1 } from "@/components/ui";
import { ALL_CARDS } from "@core/data/cards";
import { colors, radius, space } from "@/lib/theme";

const COLUMNS = 3;

/** สารานุกรมไพ่ 78 ใบ — ข้อมูลอยู่ในแอป ใช้ได้ออฟไลน์ (แผน IOS_APP_PLAN 3.3) */
export default function CardsScreen() {
  const { width } = useWindowDimensions();
  const [query, setQuery] = useState("");
  const cardWidth = (width - space.md * 2 - space.sm * (COLUMNS - 1)) / COLUMNS;

  const cards = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return ALL_CARDS;
    return ALL_CARDS.filter(
      (c) =>
        c.nameTh.includes(q) ||
        c.nameEn.toLowerCase().includes(q) ||
        c.keywords.upright.some((k) => k.includes(q)),
    );
  }, [query]);

  return (
    <SafeAreaView style={styles.screen} edges={["top", "left", "right"]}>
      <View style={styles.header}>
        <H1>สารานุกรมไพ่ {ALL_CARDS.length} ใบ</H1>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="ค้นหาชื่อไพ่หรือคำสำคัญ"
          placeholderTextColor={colors.muted}
          style={styles.search}
          accessibilityLabel="ค้นหาไพ่"
          returnKeyType="search"
        />
      </View>
      <FlatList
        data={cards}
        keyExtractor={(c) => c.id}
        numColumns={COLUMNS}
        columnWrapperStyle={{ gap: space.sm }}
        contentContainerStyle={{ padding: space.md, gap: space.sm }}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => router.push(`/card/${item.id}`)}
            accessibilityRole="button"
            accessibilityLabel={item.nameTh}
            style={{ width: cardWidth }}
          >
            <CardImageNative cardId={item.id} width={cardWidth} />
            <Text style={styles.name} numberOfLines={2}>
              {item.nameTh}
            </Text>
          </Pressable>
        )}
        ListEmptyComponent={<Text style={styles.empty}>ไม่พบไพ่ที่ตรงกับคำค้น</Text>}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.canvas },
  header: { paddingHorizontal: space.md, paddingTop: space.md, gap: space.sm },
  search: {
    minHeight: 44,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.lineWarm,
    backgroundColor: colors.surfaceWarm,
    paddingHorizontal: space.md,
    color: colors.ink,
    fontSize: 16,
  },
  name: { marginTop: 4, fontSize: 12, color: colors.ink, textAlign: "center" },
  empty: { textAlign: "center", color: colors.muted, marginTop: space.lg },
});
