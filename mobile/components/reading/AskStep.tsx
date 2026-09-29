import { Linking, StyleSheet, Text, TextInput, View } from "react-native";

import { GlassSurface } from "@/components/glass";
import { Body, Button, Caption, Chip, H1, Panel } from "@/components/ui";
import { CRISIS_HOTLINE } from "@/lib/config";
import { SUGGESTED_QUESTIONS, TOPIC_LABEL, type Action, type FlowState, type Topic } from "@/lib/reading-flow";
import { colors, radius, space } from "@/lib/theme";
import type { Spread } from "@core/data/spreads";

const TOPICS: Topic[] = ["general", "love", "work", "money", "self"];

/** ขั้น 1 — ถาม: เลือกหัวข้อ → คำถามแนะนำ (แตะเติมให้) หรือพิมพ์เอง · ไม่บังคับพิมพ์ */
export function AskStep({
  spread,
  state,
  dispatch,
  onChangeSpread,
}: {
  spread: Spread;
  state: FlowState;
  dispatch: (a: Action) => void;
  onChangeSpread: () => void;
}) {
  return (
    <>
      <View style={{ gap: space.xs }}>
        <H1>ตั้งจิต แล้วถามสิ่งที่อยากรู้</H1>
        <Caption>
          ผัง{spread.nameTh} ·{" "}
          <Text onPress={onChangeSpread} style={{ color: colors.goldInk, textDecorationLine: "underline" }} accessibilityRole="link">
            เปลี่ยนผัง
          </Text>
        </Caption>
      </View>

      {state.blockedMessage ? (
        <Panel style={{ borderColor: colors.err }}>
          <Body>{state.blockedMessage}</Body>
          <Button title={`โทรสายด่วนสุขภาพจิต ${CRISIS_HOTLINE}`} onPress={() => void Linking.openURL(`tel:${CRISIS_HOTLINE}`)} />
        </Panel>
      ) : null}

      <View style={{ gap: space.sm }}>
        <Text style={styles.label}>เรื่องที่อยากถาม</Text>
        <View style={styles.wrap}>
          {TOPICS.map((t) => (
            <Chip key={t} label={TOPIC_LABEL[t]} selected={state.topic === t} onPress={() => dispatch({ type: "topic", topic: t })} />
          ))}
        </View>
      </View>

      <View style={{ gap: space.sm }}>
        <Text style={styles.label}>คำถามของคุณ</Text>
        <GlassSurface variant="strong" radius={radius.lg}>
        <TextInput
          value={state.question}
          onChangeText={(text) => dispatch({ type: "question", text })}
          placeholder="พิมพ์คำถาม หรือแตะตัวอย่างด้านล่าง (ไม่พิมพ์ก็ได้)"
          placeholderTextColor={colors.muted}
          multiline
          maxLength={500}
          style={styles.input}
          accessibilityLabel="คำถามของคุณ"
        />
        </GlassSurface>
        <Caption>{state.question.length}/500 · ไม่ต้องใส่ชื่อจริง เบอร์โทร หรือข้อมูลส่วนตัว</Caption>
      </View>

      <View style={{ gap: space.sm }}>
        <Text style={styles.label}>ตัวอย่างคำถาม</Text>
        {SUGGESTED_QUESTIONS[state.topic].map((q) => (
          <Chip key={q} label={q} selected={state.question === q} onPress={() => dispatch({ type: "question", text: q })} />
        ))}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: 16, lineHeight: 26, fontWeight: "700", color: colors.goldInk },
  wrap: { flexDirection: "row", flexWrap: "wrap", gap: space.sm },
  input: {
    minHeight: 120,
    padding: space.md,
    color: colors.ink,
    fontSize: 17,
    lineHeight: 28,
    textAlignVertical: "top",
  },
});
