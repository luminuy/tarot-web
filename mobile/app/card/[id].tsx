import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { ScrollView, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { CardImageNative } from "@/components/CardImageNative";
import { NightSky } from "@/components/glass";
import { Badge, Body, Button, Card, Chip, ErrorNote, Eyebrow, IconButton, Screen, Segmented, ToneContext } from "@/components/ui";
import { cardById } from "@core/data/cards";
import type { Category } from "@core/data/cards/types";
import { colors, elementIcon, GUTTER, night, shadow, space, type } from "@/lib/theme";

const CATEGORY_LABEL: Record<Category, string> = {
  general: "ภาพรวม",
  love: "ความรัก",
  work: "การงาน",
  money: "การเงิน",
  self: "ตัวเอง",
};
const CATEGORIES = Object.keys(CATEGORY_LABEL) as Category[];

const SUIT_LABEL = { wands: "ดอกไม้เท้า", cups: "ดอกถ้วย", swords: "ดอกดาบ", pentacles: "ดอกเหรียญ" } as const;

type Orientation = "upright" | "reversed";



/**
 * หน้าความหมายไพ่ — ภาพไพ่ใหญ่บนฟ้าค่ำเต็มขอบ แล้วสลับ "หัวตั้ง/กลับหัว" กับ "หัวข้อ" ในที่เดียว
 * (รอบก่อนเรียง 5 หัวข้อ × 2 ทิศ ยาวสิบกล่อง — ผู้ใช้ส่วนใหญ่อยากรู้แค่ทิศเดียวในเรื่องเดียว)
 */
export default function CardDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { width } = useWindowDimensions();
  const { top } = useSafeAreaInsets();
  const [orientation, setOrientation] = useState<Orientation>("upright");
  const [category, setCategory] = useState<Category>("general");
  const card = cardById(id);
  const back = <IconButton icon="chevron-back" label="ย้อนกลับ" onPress={() => router.back()} />;

  // กฎเหล็กข้อ 14: ไม่พบไพ่ = บอกให้โหลดใหม่ ไม่กุไพ่ใบอื่นมาแทน
  if (!card) {
    return (
      <Screen title="ความหมายไพ่" left={back}>
        <ErrorNote onRetry={() => router.back()} retryLabel="กลับไปเลือกใหม่">
          ไม่พบข้อมูลไพ่ใบนี้ กรุณากลับไปโหลดใหม่อีกครั้ง
        </ErrorNote>
      </Screen>
    );
  }

  const imgW = Math.min(210, width * 0.52);
  const group = card.arcana === "major" ? "ไพ่ชุดใหญ่" : card.suit ? SUIT_LABEL[card.suit] : "ไพ่ชุดเล็ก";

  const hero = (
    <ToneContext.Provider value="night">
      <View style={[styles.hero, { paddingTop: top + 56 }]}>
        <NightSky />
        <View style={styles.glow}>
          <CardImageNative cardId={card.id} width={imgW} />
        </View>
        <View style={{ alignItems: "center", gap: 2, paddingHorizontal: GUTTER }}>
          <Eyebrow center>{group}</Eyebrow>
          <Text style={[type.title, { color: night.text, textAlign: "center" }]} accessibilityRole="header">
            {card.nameTh}
          </Text>
          <Text style={[type.subhead, { color: night.textSoft }]}>{card.nameEn}</Text>
        </View>
        <View style={styles.pills}>
          <Badge label={`ธาตุ${card.element}`} icon={elementIcon[card.element]} />
          <Badge label={card.astrology} icon="planet-outline" />
        </View>
      </View>
    </ToneContext.Provider>
  );

  return (
    <Screen hero={hero} title={card.nameTh} left={back} gap={space.md + 4} navRevealAt={imgW / (7 / 12) + 120}>
      <Segmented
        options={[
          { id: "upright", label: "ไพ่หัวตั้ง" },
          { id: "reversed", label: "ไพ่กลับหัว" },
        ]}
        value={orientation}
        onChange={setOrientation}
      />

      <Card>
        <Eyebrow>คำสำคัญ</Eyebrow>
        <View style={styles.keywords}>
          {card.keywords[orientation].map((k) => (
            <Badge key={k} label={k} />
          ))}
        </View>
      </Card>

      <View style={{ gap: space.sm + 4 }}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ marginHorizontal: -GUTTER, flexGrow: 0 }}
          contentContainerStyle={{ paddingHorizontal: GUTTER, gap: space.sm }}
        >
          {CATEGORIES.map((c) => (
            <Chip key={c} label={CATEGORY_LABEL[c]} selected={category === c} onPress={() => setCategory(c)} />
          ))}
        </ScrollView>
        <Animated.View key={category + orientation} entering={FadeIn.duration(200)}>
          <Card>
            <Eyebrow>
              {CATEGORY_LABEL[category]} · {orientation === "upright" ? "หัวตั้ง" : "กลับหัว"}
            </Eyebrow>
            <Body>{card.meanings[category][orientation]}</Body>
          </Card>
        </Animated.View>
      </View>

      <Card>
        <Eyebrow>เลข {card.number}</Eyebrow>
        <Body>{card.numerology}</Body>
      </Card>

      <Button
        title="ถามไพ่ตอนนี้"
        iconRight="arrow-forward"
        variant="secondary"
        onPress={() => router.push({ pathname: "/reading/[spreadId]", params: { spreadId: "three-card", topic: category } })}
      />
      <Text style={[type.footnote, { color: colors.muted, textAlign: "center" }]}>ภาพไพ่ต้นฉบับ Rider-Waite ปี 1909</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { alignItems: "center", gap: space.md, paddingBottom: space.lg + 4, overflow: "hidden" },
  glow: { ...shadow.glow, borderRadius: 12 },
  pills: { flexDirection: "row", flexWrap: "wrap", gap: 6, justifyContent: "center", paddingHorizontal: GUTTER },
  keywords: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
});
