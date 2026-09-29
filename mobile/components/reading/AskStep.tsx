import { Ionicons } from "@expo/vector-icons";
import { Linking, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import { SpreadMiniMap } from "@/components/SpreadMiniMap";
import { Button, Card, Chip, Eyebrow, H1 } from "@/components/ui";
import { CRISIS_HOTLINE } from "@/lib/config";
import { SUGGESTED_QUESTIONS, TOPIC_LABEL, type Action, type FlowState, type Topic } from "@/lib/reading-flow";
import { colors, GUTTER, space, spreadTitle, topicColor, type } from "@/lib/theme";
import type { Spread } from "@core/data/spreads";

type IconName = React.ComponentProps<typeof Ionicons>["name"];

const TOPICS: { id: Topic; icon: IconName }[] = [
  { id: "general", icon: "compass" },
  { id: "love", icon: "heart" },
  { id: "work", icon: "briefcase" },
  { id: "money", icon: "wallet" },
  { id: "self", icon: "leaf" },
];

/**
 * ขั้น 1 — ถาม: ผังที่เลือก (เปลี่ยนได้) → หัวข้อ → ช่องพิมพ์ → คำถามแนะนำ (แตะเติมให้)
 * ไม่บังคับพิมพ์ · ปุ่มไปต่ออยู่แผงล่างจอเสมอ
 */
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
      <H1>อยากถามเรื่องอะไร</H1>

      {state.blockedMessage ? (
        // กฎเหล็กข้อ 6: สัญญาณทำร้ายตัวเอง → สายด่วน 1323 พร้อมปุ่มโทร อยู่บนสุดของหน้า
        <Card style={styles.crisis}>
          <View style={styles.crisisHead}>
            <Ionicons name="heart-circle" size={26} color={colors.err} />
            <Text style={[type.headline, { color: colors.ink, flex: 1 }]}>คุณไม่ได้อยู่คนเดียว</Text>
          </View>
          <Text style={[type.body, { color: colors.ink }]}>{state.blockedMessage}</Text>
          <Button title={`โทรสายด่วนสุขภาพจิต ${CRISIS_HOTLINE}`} icon="call" onPress={() => void Linking.openURL(`tel:${CRISIS_HOTLINE}`)} />
        </Card>
      ) : null}

      <Card style={styles.spread}>
        <SpreadMiniMap spread={spread} size={56} />
        <View style={{ flex: 1 }}>
          <Text style={[type.caption2, { color: colors.muted }]}>ผังที่เลือก · {spread.positions.length} ใบ</Text>
          <Text style={[type.headline, { color: colors.ink }]} numberOfLines={2}>
            {spreadTitle(spread.nameTh)}
          </Text>
        </View>
        <Button title="เปลี่ยน" variant="plain" size="md" onPress={onChangeSpread} />
      </Card>

      <View style={{ gap: space.sm }}>
        <Eyebrow>หัวข้อ</Eyebrow>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ marginHorizontal: -GUTTER, flexGrow: 0 }}
          contentContainerStyle={{ paddingHorizontal: GUTTER, gap: space.sm }}
          keyboardShouldPersistTaps="handled"
        >
          {TOPICS.map((t) => (
            <Chip
              key={t.id}
              label={TOPIC_LABEL[t.id]}
              icon={t.icon}
              iconColor={topicColor[t.id]}
              selected={state.topic === t.id}
              onPress={() => dispatch({ type: "topic", topic: t.id })}
            />
          ))}
        </ScrollView>
      </View>

      <View style={{ gap: space.sm }}>
        <Eyebrow>คำถามของคุณ</Eyebrow>
        <Card padded={false}>
          <TextInput
            value={state.question}
            onChangeText={(text) => dispatch({ type: "question", text })}
            placeholder="พิมพ์สิ่งที่อยากรู้ หรือแตะตัวอย่างด้านล่าง (ไม่พิมพ์ก็ได้)"
            placeholderTextColor={colors.muted}
            multiline
            maxLength={500}
            style={styles.input}
            accessibilityLabel="คำถามของคุณ"
          />
          <View style={styles.inputFoot}>
            <Ionicons name="lock-closed-outline" size={13} color={colors.muted} />
            <Text style={[type.caption2, { color: colors.muted, flex: 1 }]}>ไม่ต้องใส่ชื่อจริง เบอร์โทร หรือข้อมูลส่วนตัว</Text>
            <Text style={[type.caption2, { color: colors.muted }]}>{state.question.length}/500</Text>
          </View>
        </Card>
      </View>

      <View style={{ gap: space.sm }}>
        <Eyebrow>ลองถามแบบนี้</Eyebrow>
        {SUGGESTED_QUESTIONS[state.topic].map((q) => (
          <Chip
            key={q}
            label={q}
            icon="chatbubble-ellipses-outline"
            multiline
            selected={state.question === q}
            onPress={() => dispatch({ type: "question", text: q })}
          />
        ))}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  crisis: { borderColor: "rgba(166,57,44,0.45)", borderWidth: 1, gap: space.sm + 4 },
  crisisHead: { flexDirection: "row", alignItems: "center", gap: space.sm },
  spread: { flexDirection: "row", alignItems: "center", gap: space.md - 4, padding: space.sm + 4 },
  input: {
    minHeight: 132,
    paddingHorizontal: space.md + 2,
    paddingTop: space.md,
    paddingBottom: space.sm,
    color: colors.ink,
    fontSize: 17,
    lineHeight: 28,
    textAlignVertical: "top",
  },
  inputFoot: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: space.md + 2,
    paddingBottom: space.sm + 2,
    paddingTop: space.xs,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(116,73,15,0.12)",
  },
});
