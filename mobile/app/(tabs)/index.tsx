import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from "react-native";

import { FlipCard } from "@/components/FlipCard";
import { GlassSurface } from "@/components/glass";
import { Body, Button, Caption, ErrorNote, H1, H2, Panel, Screen } from "@/components/ui";
import { apiJson } from "@/lib/api/client";
import { TOPIC_LABEL, TOPIC_SPREAD, type Topic } from "@/lib/reading-flow";
import { colors, space } from "@/lib/theme";

interface DailyCard {
  dateKey: string;
  cardId: string;
  nameTh: string;
  keywords: string[];
  element: string;
  message: string;
}

const TILES: { topic: Topic; blurb: string }[] = [
  { topic: "love", blurb: "หัวใจและความสัมพันธ์" },
  { topic: "work", blurb: "งานและเส้นทางอาชีพ" },
  { topic: "money", blurb: "เงินและโอกาส" },
  { topic: "self", blurb: "ใจของเราเอง" },
];

/** คำทักตามช่วงเวลา (เวลาในเครื่องผู้ใช้) */
function greeting(now = new Date()): string {
  const h = now.getHours();
  if (h < 5) return "ดึกแล้ว ใจเย็น ๆ นะ";
  if (h < 12) return "อรุณสวัสดิ์";
  if (h < 17) return "สวัสดียามบ่าย";
  if (h < 21) return "สวัสดียามเย็น";
  return "ราตรีสวัสดิ์";
}

const thaiDate = (now = new Date()) =>
  now.toLocaleDateString("th-TH", { weekday: "long", day: "numeric", month: "long" });

/** หน้าแรก "ประตูเดียว": ไพ่ประจำวัน → ถามไพ่ → ทางลัดหัวข้อ (ดู mobile/DESIGN.md ข้อ 4) */
export default function TodayScreen() {
  const { width } = useWindowDimensions();
  const [daily, setDaily] = useState<DailyCard | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    try {
      setDaily(await apiJson<DailyCard>("/api/daily-card"));
    } catch (e) {
      // กฎเหล็กข้อ 14: โหลดไพ่ไม่ได้ = บอกให้โหลดใหม่ ห้ามหยิบไพ่ใบไหนมาแทน
      setDaily(null);
      setError(e instanceof Error ? e.message : "โหลดไพ่ประจำวันไม่ได้ ลองใหม่อีกครั้งนะ");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <Screen>
      <View>
        <Caption gold>{thaiDate()}</Caption>
        <H1>{greeting()}</H1>
      </View>

      <Panel style={styles.hero}>
        <Text style={styles.heroTitle}>ไพ่ประจำวัน</Text>
        {error ? (
          <>
            <ErrorNote>{error}</ErrorNote>
            <Button title="โหลดใหม่อีกครั้ง" onPress={() => void load()} variant="ghost" />
          </>
        ) : daily ? (
          <>
            <FlipCard
              cardId={daily.cardId}
              width={Math.min(160, width * 0.42)}
              accessibilityName={daily.nameTh}
              onFlip={() => setRevealed(true)}
            />
            {revealed ? (
              <View style={{ gap: space.sm, alignItems: "center" }}>
                <Text style={styles.cardName}>{daily.nameTh}</Text>
                <Text style={styles.keywords}>{daily.keywords.join(" · ")}</Text>
                <Text style={styles.message}>{daily.message}</Text>
                <Button title="ดูความหมายไพ่ใบนี้" variant="ghost" onPress={() => router.push(`/card/${daily.cardId}`)} />
              </View>
            ) : (
              <Text style={styles.hint}>แตะไพ่เพื่อเปิดดูพลังงานของวันนี้ — ไพ่ใบเดียวกันสำหรับทุกคน</Text>
            )}
          </>
        ) : (
          <Body muted>กำลังโหลดไพ่ประจำวัน…</Body>
        )}
      </Panel>

      <Button title="ถามไพ่ตอนนี้" onPress={() => router.push(`/reading/${TOPIC_SPREAD.general}`)} />

      <H2>หรือเลือกเรื่องที่อยากรู้</H2>
      <View style={styles.tiles}>
        {TILES.map((t) => (
          <Pressable
            key={t.topic}
            onPress={() => router.push({ pathname: "/reading/[spreadId]", params: { spreadId: TOPIC_SPREAD[t.topic], topic: t.topic } })}
            accessibilityRole="button"
            accessibilityLabel={`ถามเรื่อง${TOPIC_LABEL[t.topic]}`}
            style={({ pressed }) => [styles.tileWrap, { transform: [{ scale: pressed ? 0.97 : 1 }] }]}
          >
            <GlassSurface contentStyle={styles.tile}>
              <Text style={styles.tileGlyph}>✦</Text>
              <Text style={styles.tileTitle}>{TOPIC_LABEL[t.topic]}</Text>
              <Text style={styles.tileBlurb}>{t.blurb}</Text>
            </GlassSurface>
          </Pressable>
        ))}
      </View>

      <Pressable
        onPress={() => router.push("/reading/quick")}
        accessibilityRole="button"
        style={({ pressed }) => [{ transform: [{ scale: pressed ? 0.98 : 1 }] }]}
      >
        <GlassSurface variant="strong" contentStyle={styles.quick}>
          <View style={{ flex: 1 }}>
            <Text style={styles.tileTitle}>ทำนายด่วน 1 ใบ</Text>
            <Text style={styles.tileBlurb}>ไม่มีเวลามาก? ได้คำตอบสั้น ๆ ในไม่กี่นาที</Text>
          </View>
          <Ionicons name="chevron-forward" size={22} color={colors.goldInk} />
        </GlassSurface>
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { alignItems: "center", gap: space.md, paddingVertical: space.lg },
  heroTitle: { fontSize: 15, lineHeight: 26, fontWeight: "700", color: colors.goldInk, letterSpacing: 1 },
  cardName: { fontSize: 22, lineHeight: 36, fontWeight: "700", color: colors.ink, textAlign: "center" },
  keywords: { fontSize: 15, lineHeight: 26, color: colors.goldInk, textAlign: "center" },
  message: { fontSize: 17, lineHeight: 30, color: colors.ink, textAlign: "center" },
  hint: { fontSize: 15, lineHeight: 26, color: colors.muted, textAlign: "center" },
  tiles: { flexDirection: "row", flexWrap: "wrap", gap: space.sm },
  tileWrap: { flexBasis: "48%", flexGrow: 1 },
  tile: { minHeight: 112, padding: space.md, gap: 2 },
  tileGlyph: { color: colors.goldInk, fontSize: 20, lineHeight: 30 },
  tileTitle: { fontSize: 18, lineHeight: 30, fontWeight: "700", color: colors.ink },
  tileBlurb: { fontSize: 14, lineHeight: 24, color: colors.muted },
  quick: { flexDirection: "row", alignItems: "center", padding: space.md },
});
