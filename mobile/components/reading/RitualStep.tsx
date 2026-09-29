import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useRef, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";

import { CardBack } from "@/components/CardBack";
import { Body, Caption, H1 } from "@/components/ui";
import { splitPositionName, type Action, type FlowState } from "@/lib/reading-flow";
import { GUTTER, night, radius, space, type } from "@/lib/theme";
import type { Spread } from "@core/data/spreads";

const DECK_SIZE = 78;
const HOLD_MS = 3000;

/**
 * ขั้น 3 — ตั้งจิต → เลือกไพ่ (โทนค่ำ: ฉากเปลี่ยนเป็นแท่นยามค่ำให้รู้สึกว่าเข้าพิธี)
 * จังหวะ A: กดค้างดวงแก้ว 3 วินาที (สั่นเป็นจังหวะ) เป็นพิธีตั้งสมาธิ — ไม่มีผลต่อการสุ่ม
 * จังหวะ B: สำรับคว่ำกางเป็นพัด เลื่อนแนวนอน แตะเลือก N ใบ · ช่องตำแหน่งด้านบนเติมทีละช่อง
 */
export function RitualStep({
  spread,
  state,
  dispatch,
}: {
  spread: Spread;
  state: FlowState;
  dispatch: (a: Action) => void;
}) {
  return state.ritualPhase === "focus" ? (
    <FocusOrb question={state.question} onDone={() => dispatch({ type: "focusDone" })} />
  ) : (
    <DeckPicker spread={spread} state={state} dispatch={dispatch} />
  );
}

const ORB = 184;

function FocusOrb({ question, onDone }: { question: string; onDone: () => void }) {
  const reduce = useReducedMotion();
  const breath = useSharedValue(1);
  const fill = useSharedValue(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pulse = useRef<ReturnType<typeof setInterval> | null>(null);
  const [holding, setHolding] = useState(false);

  // ดวงแก้ว "หายใจ" ช้า ๆ ระหว่างรอ (หยุดเมื่อเปิดลดการเคลื่อนไหว)
  useEffect(() => {
    if (reduce) return;
    breath.value = withRepeat(
      withSequence(withTiming(1.05, { duration: 2200, easing: Easing.inOut(Easing.sin) }), withTiming(1, { duration: 2200, easing: Easing.inOut(Easing.sin) })),
      -1,
    );
  }, [reduce, breath]);

  const stop = () => {
    if (timer.current) clearTimeout(timer.current);
    if (pulse.current) clearInterval(pulse.current);
    timer.current = null;
    pulse.current = null;
  };
  useEffect(() => stop, []);

  const begin = () => {
    setHolding(true);
    fill.value = withTiming(1, { duration: HOLD_MS, easing: Easing.linear });
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    pulse.current = setInterval(() => void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light), 600);
    timer.current = setTimeout(() => {
      stop();
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onDone();
    }, HOLD_MS);
  };

  const cancel = () => {
    if (!holding) return;
    stop();
    setHolding(false);
    fill.value = withTiming(0, { duration: 240 });
  };

  const orb = useAnimatedStyle(() => ({ transform: [{ scale: breath.value * (1 + fill.value * 0.08) }] }));
  const core = useAnimatedStyle(() => ({ opacity: 0.25 + fill.value * 0.75, transform: [{ scale: 0.35 + fill.value * 0.65 }] }));
  const halo = useAnimatedStyle(() => ({ opacity: 0.25 + fill.value * 0.6, transform: [{ scale: 1 + fill.value * 0.18 }] }));

  return (
    <View style={styles.focusWrap}>
      <H1 center>หลับตา หายใจลึก ๆ</H1>
      <Body muted center>
        นึกถึงคำถามของคุณ แล้วแตะดวงแก้วค้างไว้จนรู้สึกสั่นครบ 3 วินาที
      </Body>
      {question ? (
        <Text style={[type.quote, styles.quote]} numberOfLines={3}>
          “{question}”
        </Text>
      ) : null}

      <Pressable
        onPressIn={begin}
        onPressOut={cancel}
        accessibilityRole="button"
        accessibilityLabel="กดค้างไว้ 3 วินาทีเพื่อตั้งจิต"
        accessibilityHint="กดค้างจนรู้สึกสั่นครบ แล้วระบบจะพาไปเลือกไพ่"
        style={styles.focusPress}
      >
        <Animated.View style={[styles.halo, halo]} />
        <Animated.View style={[styles.orb, orb]}>
          <LinearGradient colors={["#4A3A52", "#241D29", "#141116"]} start={{ x: 0.3, y: 0 }} end={{ x: 0.7, y: 1 }} style={StyleSheet.absoluteFill} />
          <Animated.View style={[styles.core, core]}>
            <LinearGradient colors={["#F5D796", "#D2A354", "#8F5C1A"]} style={StyleSheet.absoluteFill} />
          </Animated.View>
          <View style={styles.ringInner} />
          <Text style={styles.orbGlyph} allowFontScaling={false}>
            ✦
          </Text>
        </Animated.View>
      </Pressable>
      <Caption center live>
        {holding ? "ค้างไว้… ปล่อยใจให้นิ่ง" : "แตะค้างที่ดวงแก้วเพื่อเริ่ม"}
      </Caption>
    </View>
  );
}

const CARD_W = 92;
const CARD_H = Math.round(CARD_W * (12 / 7));
const STEP = 44;

function DeckPicker({ spread, state, dispatch }: { spread: Spread; state: FlowState; dispatch: (a: Action) => void }) {
  const need = spread.positions.length;
  const remaining = need - state.picked.length;
  const slotW = need > 6 ? 38 : 48;

  return (
    <>
      <View style={{ gap: space.xs }}>
        <H1>เลือกไพ่ {need} ใบ</H1>
        <Caption live>{remaining > 0 ? `ให้ใจพาไป แตะเลือกอีก ${remaining} ใบ` : "ครบแล้ว กดยืนยันด้านล่างได้เลย"}</Caption>
      </View>

      {/* ช่องตำแหน่ง: เติมทีละช่องตามลำดับที่เลือก */}
      <View style={styles.slots}>
        {spread.positions.map((pos, i) => {
          const filled = i < state.picked.length;
          return (
            <View key={pos.index} style={{ width: slotW + 22, alignItems: "center", gap: 4 }}>
              {filled ? (
                <CardBack width={slotW} height={slotW * 1.55} label={String(i + 1)} selected />
              ) : (
                <View style={[styles.slotEmpty, { width: slotW, height: slotW * 1.55 }]}>
                  <Text style={[type.caption2, { color: night.gold }]}>{i + 1}</Text>
                </View>
              )}
              <Text style={[type.caption2, { color: filled ? night.text : night.textSoft, textAlign: "center" }]} numberOfLines={2}>
                {splitPositionName(pos.nameTh).short}
              </Text>
            </View>
          );
        })}
      </View>

      {/* สำรับกางเป็นพัด: ไพ่ซ้อนกันเหลือขอบกว้าง 44pt (เท่าเป้าแตะขั้นต่ำ) ใบขวาทับใบซ้ายเหมือนสำรับจริง */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ marginHorizontal: -GUTTER, flexGrow: 0 }}
        contentContainerStyle={{ paddingLeft: GUTTER, paddingRight: GUTTER + CARD_W - STEP, paddingTop: 30, paddingBottom: space.sm }}
      >
        {Array.from({ length: DECK_SIZE }, (_, index) => {
          const order = state.picked.indexOf(index);
          const on = order >= 0;
          return (
            <Pressable
              key={index}
              onPress={() => {
                void Haptics.selectionAsync();
                dispatch({ type: "togglePick", index, need });
              }}
              accessibilityRole="button"
              accessibilityState={{ selected: on }}
              accessibilityLabel={on ? `ไพ่ใบที่ ${index + 1} เลือกเป็นลำดับ ${order + 1} แตะเพื่อยกเลิก` : `ไพ่ใบที่ ${index + 1}`}
              style={{ width: STEP, height: CARD_H }}
            >
              <View style={[styles.deckCard, on && styles.deckCardOn]}>
                <CardBack width={CARD_W} height={CARD_H} label={on ? String(order + 1) : undefined} selected={on} />
              </View>
            </Pressable>
          );
        })}
      </ScrollView>

      <View style={styles.hintRow}>
        <Ionicons name="swap-horizontal" size={16} color={night.textSoft} />
        <Caption>ปัดสำรับซ้าย–ขวาดูครบ 78 ใบ · แตะซ้ำเพื่อยกเลิก</Caption>
      </View>
      <View style={styles.commit}>
        <Ionicons name="shield-checkmark-outline" size={16} color={night.gold} />
        <Text style={[type.caption2, { color: night.textSoft, flex: 1 }]} numberOfLines={1}>
          ล็อกผลสับไว้ก่อนคุณเลือก · คำมั่น {state.session?.commitment.slice(0, 12)}…
        </Text>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  focusWrap: { alignItems: "center", gap: space.md, paddingTop: space.md },
  quote: { color: night.text, textAlign: "center", paddingHorizontal: space.md },
  focusPress: { width: ORB + 80, height: ORB + 80, alignItems: "center", justifyContent: "center", marginVertical: space.sm },
  halo: {
    position: "absolute",
    width: ORB + 56,
    height: ORB + 56,
    borderRadius: (ORB + 56) / 2,
    borderWidth: 1,
    borderColor: night.gold,
    shadowColor: night.gold,
    shadowOpacity: 0.8,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: 0 },
  },
  orb: {
    width: ORB,
    height: ORB,
    borderRadius: ORB / 2,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "rgba(210,163,84,0.8)",
  },
  core: { position: "absolute", width: ORB, height: ORB, borderRadius: ORB / 2, overflow: "hidden" },
  ringInner: { position: "absolute", width: ORB - 28, height: ORB - 28, borderRadius: (ORB - 28) / 2, borderWidth: 1, borderColor: "rgba(255,236,200,0.35)" },
  orbGlyph: { fontSize: 56, lineHeight: 72, color: "#FFF3DA", textShadowColor: "rgba(0,0,0,0.35)", textShadowRadius: 8 },
  slots: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center", rowGap: space.sm, columnGap: 2 },
  slotEmpty: {
    borderRadius: radius.xs,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "rgba(210,163,84,0.6)",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,244,222,0.04)",
  },
  deckCard: {
    position: "absolute",
    left: 0,
    top: 0,
    borderRadius: radius.sm,
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 6,
    shadowOffset: { width: -3, height: 4 },
  },
  deckCardOn: { transform: [{ translateY: -24 }], shadowColor: night.gold, shadowOpacity: 0.6, shadowRadius: 16, shadowOffset: { width: 0, height: 0 } },
  hintRow: { flexDirection: "row", alignItems: "center", gap: 6, justifyContent: "center" },
  commit: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: space.md - 4,
    paddingVertical: space.sm,
    borderRadius: radius.pill,
    backgroundColor: "rgba(255,244,222,0.07)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: night.line,
  },
});
