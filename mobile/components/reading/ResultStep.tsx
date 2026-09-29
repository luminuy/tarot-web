import { Ionicons } from "@expo/vector-icons";
import * as Speech from "expo-speech";
import { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, Share, StyleSheet, Text, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";

import { CardImageNative } from "@/components/CardImageNative";
import { Badge, Body, Button, Card, Caption, Eyebrow, GoldRule, H1, NightPanel } from "@/components/ui";
import type { ReadingResult } from "@/lib/api/types";
import { splitPositionName, type FlowState, type PartialReading } from "@/lib/reading-flow";
import type { Verification } from "@/lib/useReadingFlow";
import { colors, GUTTER, night, space, type } from "@/lib/theme";
import { PERSONAS } from "@core/data/personas";
import type { Spread } from "@core/data/spreads";

/** รวมคำอ่านเป็นข้อความเดียว — ใช้กับปุ่มฟังเสียง/แชร์ */
function toPlainText(r: ReadingResult): string {
  return [r.opening, ...r.cards.map((c) => `${c.headline}\n${c.reading}`), r.connections, `สรุป: ${r.summary}`]
    .filter(Boolean)
    .join("\n\n");
}

const FAIR: Record<Exclude<Verification, null>, { icon: React.ComponentProps<typeof Ionicons>["name"]; color: string; title: string; note: string }> = {
  ok: {
    icon: "shield-checkmark",
    color: colors.ok,
    title: "ผ่านการตรวจความยุติธรรม",
    note: "คำมั่นก่อนสับตรงกับเมล็ดที่เฉลย และเครื่องของคุณคำนวณไพ่ซ้ำได้ตรงกันทุกใบ",
  },
  fail: {
    icon: "alert-circle",
    color: colors.err,
    title: "ตรวจไม่ผ่านหรือตรวจไม่ได้",
    note: "กรุณาเปิดไพ่ใหม่อีกครั้ง",
  },
  pending: {
    icon: "hourglass-outline",
    color: colors.goldInk,
    title: "กำลังตรวจสอบบนเครื่องของคุณ…",
    note: "คำนวณผลสับซ้ำจากเมล็ดที่เซิร์ฟเวอร์เฉลย",
  },
};

/**
 * ขั้น 5 — คำอ่าน (กลับเป็นโทนกลางวัน: อ่านตัวหนังสือยาว ๆ บนพื้นสว่างสบายตากว่า)
 * ไหลเป็นส่วน ๆ ขณะสตรีม มีการ์ดโครงรอใบถัดไป แล้วสรุปเป็นผลลัพธ์
 * สตรีมที่ขาดก่อน `done` ไม่เคยมาถึงหน้านี้ในฐานะผลลัพธ์ (ดู reducer `readFailed`)
 */
export function ResultStep({ spread, state, verified }: { spread: Spread; state: FlowState; verified: Verification }) {
  const [speaking, setSpeaking] = useState(false);
  const src: PartialReading = state.result ?? state.partial;
  const streaming = state.streaming;
  const persona = PERSONAS.find((p) => p.id === state.personaId);
  const pendingLabel = !src.opening
    ? "กำลังตั้งจิตอ่านภาพรวม…"
    : src.cards.length < spread.positions.length
      ? `กำลังอ่านใบที่ ${src.cards.length + 1}…`
      : "กำลังสรุปคำแนะนำ…";

  // ออกจากหน้านี้ต้องหยุดเสียงที่ค้างอยู่
  useEffect(() => () => void Speech.stop(), []);

  const toggleSpeak = () => {
    if (speaking) {
      void Speech.stop();
      setSpeaking(false);
      return;
    }
    if (!state.result) return;
    setSpeaking(true);
    Speech.speak(toPlainText(state.result), {
      language: "th-TH",
      onDone: () => setSpeaking(false),
      onStopped: () => setSpeaking(false),
      onError: () => setSpeaking(false),
    });
  };

  const share = () => {
    if (!state.result) return;
    void Share.share({ message: `${spread.nameTh} — SeerTarot\n\n${state.result.summary}\n\nseertarot.net` });
  };

  const fair = verified ? FAIR[verified] : null;

  return (
    <>
      <View style={{ gap: space.xs }}>
        <Eyebrow>{persona ? `คำอ่านจาก${persona.nameTh}` : "คำอ่าน"}</Eyebrow>
        <H1>{streaming ? "กำลังอ่านไพ่ของคุณ…" : "คำอ่านของคุณ"}</H1>
        {state.question ? <Text style={[type.quote, styles.question]}>“{state.question}”</Text> : null}
      </View>

      {/* แถบไพ่ที่เปิดได้ — ภาพรวมก่อนอ่านทีละใบ */}
      {state.shuffle ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ marginHorizontal: -GUTTER, flexGrow: 0 }}
          contentContainerStyle={{ paddingHorizontal: GUTTER, gap: space.sm + 4 }}
        >
          {state.shuffle.cards.map((c, i) => (
            <View key={i} style={styles.stripItem}>
              <CardImageNative cardId={c.id} reversed={state.shuffle?.drawn[i]?.isReversed} width={58} />
              <Text style={[type.caption2, { color: colors.muted, textAlign: "center" }]} numberOfLines={2}>
                {splitPositionName(spread.positions[i]?.nameTh ?? "").short}
              </Text>
            </View>
          ))}
        </ScrollView>
      ) : null}

      {src.opening ? (
        <Animated.View entering={FadeInDown.duration(320)}>
          <Card>
            <Body>{src.opening}</Body>
          </Card>
        </Animated.View>
      ) : null}

      {src.cards.map((c) => {
        const card = state.shuffle?.cards[c.position];
        const reversed = state.shuffle?.drawn[c.position]?.isReversed;
        return (
          <Animated.View key={c.position} entering={FadeInDown.duration(320)}>
            <Card style={{ gap: space.sm + 4 }}>
              <View style={styles.cardRow}>
                <CardImageNative cardId={card?.id} reversed={reversed} width={62} />
                <View style={{ flex: 1, gap: 2 }}>
                  <Eyebrow>
                    {c.position + 1} · {splitPositionName(spread.positions[c.position]?.nameTh ?? "").short}
                  </Eyebrow>
                  <Text style={[type.heading, { color: colors.ink }]}>{card?.nameTh ?? "โหลดใหม่อีกครั้ง"}</Text>
                  {reversed ? <Badge label="ไพ่กลับหัว" icon="swap-vertical" /> : null}
                </View>
              </View>
              <GoldRule />
              <Text style={[type.headline, { color: colors.goldInkDeep }]}>{c.headline}</Text>
              <Body>{c.reading}</Body>
            </Card>
          </Animated.View>
        );
      })}

      {streaming ? (
        <Card style={styles.pending}>
          <ActivityIndicator color={colors.goldInk} />
          <View style={{ flex: 1 }} accessibilityLiveRegion="polite">
            <Text style={[type.headline, { color: colors.ink }]}>
              {pendingLabel}
            </Text>
            <Caption>คำอ่านจะทยอยปรากฏ ไม่ต้องปิดหน้านี้</Caption>
          </View>
        </Card>
      ) : null}

      {src.connections ? (
        <Card>
          <Eyebrow>ภาพรวมที่เชื่อมกัน</Eyebrow>
          <Body>{src.connections}</Body>
        </Card>
      ) : null}

      {src.summary ? (
        <NightPanel>
          <Eyebrow>✦ สรุปและคำแนะนำ</Eyebrow>
          <Text style={[type.body, { color: night.text }]}>{src.summary}</Text>
        </NightPanel>
      ) : null}

      {state.result ? (
        <>
          <View style={styles.actions}>
            <Button title={speaking ? "หยุดเสียง" : "ฟังคำอ่าน"} icon={speaking ? "stop-circle-outline" : "volume-high-outline"} variant="secondary" size="md" onPress={toggleSpeak} flex />
            <Button title="แชร์สรุป" icon="share-outline" variant="secondary" size="md" onPress={share} flex />
          </View>

          {fair ? (
            <Card style={styles.fair}>
              <Ionicons name={fair.icon} size={26} color={fair.color} />
              <View style={{ flex: 1 }} accessibilityLiveRegion="polite">
                <Text style={[type.headline, { color: colors.ink }]}>{fair.title}</Text>
                <Text style={[type.footnote, { color: colors.muted }]}>{fair.note}</Text>
              </View>
            </Card>
          ) : null}

          <Caption center>เพื่อความบันเทิงและการทบทวนตนเอง ไม่ใช่คำแนะนำทางการแพทย์ กฎหมาย หรือการเงิน</Caption>
        </>
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  question: { color: colors.inkSoft },
  stripItem: { width: 70, alignItems: "center", gap: 4 },
  cardRow: { flexDirection: "row", gap: space.md, alignItems: "center" },
  pending: { flexDirection: "row", alignItems: "center", gap: space.md, borderStyle: "dashed" },
  actions: { flexDirection: "row", gap: space.sm },
  fair: { flexDirection: "row", alignItems: "center", gap: space.md - 2 },
});
