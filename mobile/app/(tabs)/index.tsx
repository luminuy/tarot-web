import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { LinearGradient } from "expo-linear-gradient";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import Animated, {
  Easing,
  FadeIn,
  FadeInDown,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

import { FlipCard } from "@/components/FlipCard";
import { SpreadMiniMap } from "@/components/SpreadMiniMap";
import { Badge, Body, Button, Card, Caption, Eyebrow, IconButton, NightPanel, Screen, SectionHeader } from "@/components/ui";
import { apiJson } from "@/lib/api/client";
import { useSession } from "@/lib/auth/session";
import { friendlyMessage } from "@/lib/errors";
import { TOPIC_LABEL, TOPIC_SPREAD, type Topic } from "@/lib/reading-flow";
import { colors, GUTTER, night, radius, shadow, space, spreadTitle, topicColor, type } from "@/lib/theme";
import { SPREADS_BY_CATEGORY } from "@core/data/spread-categories";

interface DailyCard {
  dateKey: string;
  cardId: string;
  nameTh: string;
  keywords: string[];
  element: string;
  message: string;
}

type IconName = keyof typeof Ionicons.glyphMap;

const TILES: { topic: Topic; blurb: string; icon: IconName }[] = [
  { topic: "love", blurb: "หัวใจและความสัมพันธ์", icon: "heart" },
  { topic: "work", blurb: "งานและเส้นทางอาชีพ", icon: "briefcase" },
  { topic: "money", blurb: "เงินและโอกาส", icon: "wallet" },
  { topic: "self", blurb: "ใจของเราเอง", icon: "leaf" },
];

/** คำทักตามช่วงเวลา (เวลาในเครื่องผู้ใช้) */
function greeting(now = new Date()): string {
  const h = now.getHours();
  if (h < 5) return "ดึกแล้ว พักใจนะ";
  if (h < 12) return "อรุณสวัสดิ์";
  if (h < 17) return "สวัสดียามบ่าย";
  if (h < 21) return "สวัสดียามเย็น";
  return "ราตรีสวัสดิ์";
}

const thaiDate = (now = new Date()) => now.toLocaleDateString("th-TH", { weekday: "long", day: "numeric", month: "long" });

/**
 * หน้าแรก "ประตูเดียว" (DESIGN.md ข้อ 4)
 * ลำดับสายตา: ไพ่ประจำวันบนฟ้าค่ำ (จุดเน้นเดียวของหน้า) → ปุ่มถามไพ่ → หัวข้อ → ผังยอดนิยม → ทำนายด่วน
 */
export default function TodayScreen() {
  const { token, user } = useSession();

  return (
    <Screen
      eyebrow={thaiDate()}
      title={greeting()}
      subtitle="ไพ่พร้อมแล้ว เมื่อใจคุณพร้อม"
      accessory={
        <IconButton
          icon={token ? "person" : "person-outline"}
          label={token ? `บัญชีของ ${user?.name ?? "คุณ"}` : "บัญชีและเข้าสู่ระบบ"}
          onPress={() => router.push("/account")}
        />
      }
    >
      <DailyHero />

      <View style={{ gap: space.xs }}>
        <Button title="ถามไพ่ตอนนี้" icon="sparkles" onPress={() => router.push(`/reading/${TOPIC_SPREAD.general}`)} />
        <Caption center>ผังอดีต · ปัจจุบัน · อนาคต (3 ใบ) — เปลี่ยนผังได้ในขั้นถัดไป</Caption>
      </View>

      <SectionHeader title="อยากรู้เรื่องไหน" />
      <View style={styles.tiles}>
        {TILES.map((t) => (
          <Card
            key={t.topic}
            style={styles.tile}
            onPress={() => router.push({ pathname: "/reading/[spreadId]", params: { spreadId: TOPIC_SPREAD[t.topic], topic: t.topic } })}
            accessibilityLabel={`ถามเรื่อง${TOPIC_LABEL[t.topic]} ${t.blurb}`}
          >
            {/* แสงสีประจำหัวข้อจาง ๆ มุมบน + ไอคอนลายน้ำมุมล่าง — ให้แต่ละช่องมีบุคลิก ไม่ใช่กล่องขาวเหมือนกันหมด */}
            <LinearGradient
              colors={[`${topicColor[t.topic]}22`, `${topicColor[t.topic]}00`]}
              start={{ x: 0, y: 0 }}
              end={{ x: 0.9, y: 0.9 }}
              style={[StyleSheet.absoluteFill, { borderRadius: radius.lg }]}
              pointerEvents="none"
            />
            <Ionicons name={t.icon} size={72} color={topicColor[t.topic]} style={styles.watermark} />
            <View style={[styles.tileIcon, { backgroundColor: `${topicColor[t.topic]}1F` }]}>
              <Ionicons name={t.icon} size={20} color={topicColor[t.topic]} />
            </View>
            <View>
              <Text style={[type.headline, { color: colors.ink }]}>{TOPIC_LABEL[t.topic]}</Text>
              <Text style={[type.footnote, { color: colors.muted }]}>{t.blurb}</Text>
            </View>
          </Card>
        ))}
      </View>

      <SectionHeader title="ผังยอดนิยม" action="ดูทั้งหมด" onAction={() => router.push("/read")} />
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ marginHorizontal: -GUTTER, flexGrow: 0 }}
        contentContainerStyle={{ paddingHorizontal: GUTTER, gap: space.sm + 4, paddingBottom: space.sm }}
      >
        {SPREADS_BY_CATEGORY.popular.map((s) => (
          <Card
            key={s.id}
            style={styles.spread}
            onPress={() => router.push(`/reading/${s.id}`)}
            accessibilityLabel={`${spreadTitle(s.nameTh)} ${s.positions.length} ใบ`}
          >
            <SpreadMiniMap spread={s} size={116} />
            <Text style={[type.subhead, { color: colors.ink, fontWeight: "600" }]} numberOfLines={2}>
              {spreadTitle(s.nameTh)}
            </Text>
            <Badge label={`${s.positions.length} ใบ`} />
          </Card>
        ))}
      </ScrollView>

      <Card onPress={() => router.push("/reading/quick")} style={styles.quick} accessibilityLabel="ทำนายด่วน 1 ใบ">
        <View style={[styles.tileIcon, { backgroundColor: `${colors.goldInk}1A` }]}>
          <Ionicons name="flash" size={20} color={colors.goldInk} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[type.headline, { color: colors.ink }]}>ทำนายด่วน 1 ใบ</Text>
          <Text style={[type.footnote, { color: colors.muted }]}>มีเวลาน้อย? ได้คำตอบสั้น ๆ ในไม่กี่นาที</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={colors.muted} />
      </Card>
    </Screen>
  );
}

/** ไพ่ประจำวัน — แตะพลิกเอง (กฎเหล็กข้อ 4) · โหลดไม่ได้ = บอกให้โหลดใหม่ ห้ามหยิบไพ่ใบอื่นมาแทน (ข้อ 14) */
/** ไพ่ลอยขึ้นลงช้า ๆ ระหว่างรอผู้ใช้แตะ (หยุดเมื่อเปิดลดการเคลื่อนไหว หรือเมื่อพลิกแล้ว) */
function Floating({ children, still }: { children: React.ReactNode; still: boolean }) {
  const reduce = useReducedMotion();
  const y = useSharedValue(0);
  useEffect(() => {
    if (reduce || still) {
      y.value = withTiming(0, { duration: 300 });
      return;
    }
    y.value = withRepeat(withTiming(-6, { duration: 2600, easing: Easing.inOut(Easing.sin) }), -1, true);
  }, [reduce, still, y]);
  const style = useAnimatedStyle(() => ({ transform: [{ translateY: y.value }] }));
  return <Animated.View style={style}>{children}</Animated.View>;
}

function DailyHero() {
  const [daily, setDaily] = useState<DailyCard | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    try {
      setDaily(await apiJson<DailyCard>("/api/daily-card"));
    } catch (e) {
      setDaily(null);
      setError(friendlyMessage(e, "โหลดไพ่ประจำวันไม่ได้ ลองใหม่อีกครั้งนะ"));
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <NightPanel style={styles.hero}>
      <Eyebrow center>ไพ่ประจำวัน</Eyebrow>
      {error ? (
        <View style={styles.heroState}>
          <Ionicons name="cloud-offline-outline" size={34} color={night.gold} />
          <Body center muted>
            {error}
          </Body>
          <Button title="โหลดใหม่อีกครั้ง" icon="refresh" variant="secondary" size="md" onPress={() => void load()} />
        </View>
      ) : daily ? (
        <>
          <Floating still={revealed}>
            <View style={styles.cardGlow}>
              <FlipCard cardId={daily.cardId} width={136} accessibilityName={daily.nameTh} onFlip={() => setRevealed(true)} />
            </View>
          </Floating>
          {revealed ? (
            <Animated.View entering={FadeInDown.duration(360)} style={styles.reveal}>
              <Text style={[type.title2, styles.cardName]}>{daily.nameTh}</Text>
              <View style={styles.pills}>
                {daily.keywords.slice(0, 4).map((k) => (
                  <Badge key={k} label={k} />
                ))}
              </View>
              <Body center muted>
                {daily.message}
              </Body>
              <Button title="อ่านความหมายเต็ม" variant="plain" size="md" icon="book-outline" onPress={() => router.push(`/card/${daily.cardId}`)} />
            </Animated.View>
          ) : (
            <Animated.View entering={FadeIn} style={{ gap: 2 }}>
              <Text style={[type.headline, styles.cardName]}>แตะไพ่เพื่อเปิดพลังงานวันนี้</Text>
              <Caption center>ไพ่ใบเดียวกันสำหรับทุกคนในวันนี้</Caption>
            </Animated.View>
          )}
        </>
      ) : (
        <View style={[styles.heroState, { minHeight: 280, justifyContent: "center" }]}>
          <ActivityIndicator color={night.gold} />
          <Caption center>กำลังสับไพ่ประจำวัน…</Caption>
        </View>
      )}
    </NightPanel>
  );
}

const styles = StyleSheet.create({
  hero: { alignItems: "center", paddingVertical: space.lg + 4 },
  heroState: { alignItems: "center", gap: space.md, paddingVertical: space.md },
  cardGlow: { ...shadow.glow, borderRadius: 12 },
  reveal: { alignItems: "center", gap: space.sm, alignSelf: "stretch" },
  cardName: { color: night.text, textAlign: "center" },
  pills: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: 6 },
  tiles: { flexDirection: "row", flexWrap: "wrap", gap: space.sm + 4 },
  tile: { flexBasis: "46%", flexGrow: 1, minHeight: 124, justifyContent: "space-between" },
  watermark: { position: "absolute", right: 10, bottom: 8, opacity: 0.08 },
  tileIcon: { width: 38, height: 38, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  spread: { width: 146, gap: space.sm, padding: space.md - 2 },
  quick: { flexDirection: "row", alignItems: "center", gap: space.md - 2 },
});
