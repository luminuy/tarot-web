import * as Speech from "expo-speech";
import { useEffect, useState } from "react";
import { ActivityIndicator, Share, StyleSheet, Text, View } from "react-native";

import { CardImageNative } from "@/components/CardImageNative";
import { Body, Button, Caption, H1, H2, Panel } from "@/components/ui";
import type { ReadingResult } from "@/lib/api/types";
import { splitPositionName, type PartialReading, type FlowState } from "@/lib/reading-flow";
import type { Verification } from "@/lib/useReadingFlow";
import { colors, space } from "@/lib/theme";
import type { Spread } from "@core/data/spreads";

/** รวมคำอ่านเป็นข้อความเดียว — ใช้กับปุ่มฟังเสียง/แชร์ */
function toPlainText(spread: Spread, r: ReadingResult): string {
  return [r.opening, ...r.cards.map((c) => `${c.headline}\n${c.reading}`), r.connections, `สรุป: ${r.summary}`]
    .filter(Boolean)
    .join("\n\n");
}

/**
 * ขั้น 5 — คำอ่าน: ไหลเป็นส่วน ๆ ขณะสตรีม (มีตัวบอกว่าแม่หมอกำลังอ่าน) แล้วสรุปเป็นผลลัพธ์
 * สตรีมที่ขาดก่อน `done` ไม่เคยมาถึงหน้านี้ในฐานะผลลัพธ์ (ดู reducer `readFailed`)
 */
export function ResultStep({
  spread,
  state,
  verified,
}: {
  spread: Spread;
  state: FlowState;
  verified: Verification;
}) {
  const [speaking, setSpeaking] = useState(false);
  const src: PartialReading = state.result ?? state.partial;
  const streaming = state.streaming;

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
    Speech.speak(toPlainText(spread, state.result), {
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

  return (
    <>
      <View style={{ gap: space.xs }}>
        <H1>{streaming ? "แม่หมอกำลังอ่านไพ่…" : "คำอ่านของคุณ"}</H1>
        {streaming ? (
          <View style={styles.typing} accessibilityLiveRegion="polite">
            <ActivityIndicator color={colors.goldInk} />
            <Caption>รอสักครู่ คำอ่านจะทยอยปรากฏ</Caption>
          </View>
        ) : null}
      </View>

      {src.opening ? (
        <Panel>
          <Body>{src.opening}</Body>
        </Panel>
      ) : null}

      {src.cards.map((c) => {
        const card = state.shuffle?.cards[c.position];
        const reversed = state.shuffle?.drawn[c.position]?.isReversed;
        return (
          <Panel key={c.position}>
            <View style={styles.cardRow}>
              <CardImageNative cardId={card?.id} reversed={reversed} width={64} />
              <View style={{ flex: 1, gap: 2 }}>
                <Caption gold>
                  {c.position + 1}. {splitPositionName(spread.positions[c.position]?.nameTh ?? "").short}
                </Caption>
                <H2>{card?.nameTh ?? "—"}</H2>
                {reversed ? <Caption>ไพ่กลับหัว</Caption> : null}
              </View>
            </View>
            <Text style={styles.headline}>{c.headline}</Text>
            <Body>{c.reading}</Body>
          </Panel>
        );
      })}

      {src.connections ? (
        <Panel>
          <H2>ภาพรวมที่เชื่อมกัน</H2>
          <Body>{src.connections}</Body>
        </Panel>
      ) : null}

      {src.summary ? (
        <Panel variant="dark">
          <Text style={styles.summaryTitle}>✦ สรุปและคำแนะนำ</Text>
          <Text style={styles.summaryText}>{src.summary}</Text>
        </Panel>
      ) : null}

      {state.result ? (
        <>
          <View style={styles.actions}>
            <Button title={speaking ? "หยุดเสียง" : "ฟังคำอ่าน"} variant="ghost" onPress={toggleSpeak} flex />
            <Button title="แชร์สรุป" variant="ghost" onPress={share} flex />
          </View>

          <Panel>
            <H2>ตรวจสอบความยุติธรรม</H2>
            <Body muted>
              {verified === "ok"
                ? "✦ ผ่าน — คำมั่นก่อนสับตรงกับเมล็ดที่เฉลย และคำนวณไพ่ซ้ำบนเครื่องคุณได้ผลตรงกันทุกใบ"
                : verified === "fail"
                  ? "ตรวจไม่ผ่านหรือตรวจไม่ได้ กรุณาเปิดไพ่ใหม่อีกครั้ง"
                  : "กำลังตรวจสอบบนเครื่องของคุณ…"}
            </Body>
          </Panel>

          <Caption>เพื่อความบันเทิงและการทบทวนตนเอง ไม่ใช่คำแนะนำทางการแพทย์ กฎหมาย หรือการเงิน</Caption>
        </>
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  typing: { flexDirection: "row", alignItems: "center", gap: space.sm },
  cardRow: { flexDirection: "row", gap: space.md, alignItems: "center" },
  headline: { fontSize: 18, lineHeight: 30, fontWeight: "700", color: colors.goldInkDeep },
  summaryTitle: { color: colors.goldOnDark, fontSize: 17, lineHeight: 28, fontWeight: "700" },
  summaryText: { color: colors.surface, fontSize: 17, lineHeight: 30 },
  actions: { flexDirection: "row", gap: space.sm },
});
