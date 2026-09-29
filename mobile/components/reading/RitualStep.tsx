import * as Haptics from "expo-haptics";
import { useEffect, useRef, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withTiming } from "react-native-reanimated";

import { LinearGradient } from "expo-linear-gradient";

import { GlassSurface } from "@/components/glass";
import { Body, Caption, H1 } from "@/components/ui";
import { splitPositionName, type Action, type FlowState } from "@/lib/reading-flow";
import { colors, radius, space } from "@/lib/theme";
import type { Spread } from "@core/data/spreads";

const DECK_SIZE = 78;
const HOLD_MS = 3000;

/**
 * ขั้น 3 — ตั้งจิต → เลือกไพ่
 * จังหวะ A: กดค้างวงกลม 3 วินาที (สั่นเป็นจังหวะ) เป็นพิธีตั้งสมาธิ — ไม่มีผลต่อการสุ่ม
 * จังหวะ B: เลื่อนสำรับคว่ำแนวนอน แตะเลือก N ใบ · ช่องตำแหน่งด้านบนเติมทีละช่อง
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
    <FocusRing onDone={() => dispatch({ type: "focusDone" })} />
  ) : (
    <DeckPicker spread={spread} state={state} dispatch={dispatch} />
  );
}

function FocusRing({ onDone }: { onDone: () => void }) {
  const scale = useSharedValue(1);
  const fill = useSharedValue(0);
  const reduce = useReducedMotion();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pulse = useRef<ReturnType<typeof setInterval> | null>(null);
  const [holding, setHolding] = useState(false);

  const stop = () => {
    if (timer.current) clearTimeout(timer.current);
    if (pulse.current) clearInterval(pulse.current);
    timer.current = null;
    pulse.current = null;
  };
  useEffect(() => stop, []);

  const begin = () => {
    setHolding(true);
    scale.value = withTiming(reduce ? 1 : 1.12, { duration: HOLD_MS });
    fill.value = withTiming(1, { duration: HOLD_MS });
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
    scale.value = withTiming(1, { duration: 200 });
    fill.value = withTiming(0, { duration: 200 });
  };

  const ring = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const glow = useAnimatedStyle(() => ({ opacity: 0.15 + fill.value * 0.85 }));

  return (
    <View style={styles.focusWrap}>
      <H1>หลับตา หายใจลึก ๆ</H1>
      <Body muted>นึกถึงคำถามของคุณ แล้วกดวงกลมค้างไว้ 3 วินาที</Body>
      <Pressable
        onPressIn={begin}
        onPressOut={cancel}
        accessibilityRole="button"
        accessibilityLabel="กดค้างไว้ 3 วินาทีเพื่อตั้งจิต"
        accessibilityHint="กดค้างจนรู้สึกสั่นครบ แล้วระบบจะพาไปเลือกไพ่"
        style={styles.focusPress}
      >
        <Animated.View style={[styles.ring, ring]}>
          <Animated.View style={[styles.ringGlow, glow]} />
          <Text style={styles.ringGlyph}>✦</Text>
        </Animated.View>
      </Pressable>
      <Caption>{holding ? "ค้างไว้ … ใกล้แล้ว" : "กดค้างเพื่อเริ่ม"}</Caption>
    </View>
  );
}

function DeckPicker({ spread, state, dispatch }: { spread: Spread; state: FlowState; dispatch: (a: Action) => void }) {
  const need = spread.positions.length;
  const cardW = 104;
  const cardH = cardW * (12 / 7);
  const remaining = need - state.picked.length;

  return (
    <>
      <View style={{ gap: space.xs }}>
        <H1>เลือกไพ่ {need} ใบ</H1>
        <Caption live>
          {remaining > 0 ? `ให้ใจพาไป — แตะเลือกอีก ${remaining} ใบ` : "ครบแล้ว กดยืนยันด้านล่างได้เลย"}
        </Caption>
      </View>

      {/* ช่องตำแหน่ง: เติมทีละช่องตามลำดับที่เลือก */}
      <View style={styles.slots}>
        {spread.positions.map((pos, i) => {
          const filled = i < state.picked.length;
          return (
            <GlassSurface
              key={pos.index}
              radius={radius.md}
              flat
              variant={filled ? "dark" : "light"}
              contentStyle={styles.slot}
            >
              <Text style={[styles.slotNum, filled && { color: colors.goldOnDark }]}>{filled ? "✦" : i + 1}</Text>
              <Text style={[styles.slotName, filled && { color: colors.surface }]} numberOfLines={1}>
                {splitPositionName(pos.nameTh).short}
              </Text>
            </GlassSurface>
          );
        })}
      </View>

      <FlatList
        data={Array.from({ length: DECK_SIZE }, (_, i) => i)}
        horizontal
        keyExtractor={(i) => String(i)}
        showsHorizontalScrollIndicator
        style={{ marginHorizontal: -space.md }}
        contentContainerStyle={{ paddingHorizontal: space.md, gap: 10, paddingVertical: space.md }}
        getItemLayout={(_, index) => ({ length: cardW + 10, offset: (cardW + 10) * index, index })}
        initialNumToRender={8}
        windowSize={7}
        renderItem={({ item: index }) => {
          const order = state.picked.indexOf(index);
          const on = order >= 0;
          return (
            <Pressable
              onPress={() => {
                void Haptics.selectionAsync();
                dispatch({ type: "togglePick", index, need });
              }}
              accessibilityRole="button"
              accessibilityState={{ selected: on }}
              accessibilityLabel={on ? `ไพ่ใบที่ ${index + 1} เลือกเป็นลำดับ ${order + 1} แตะเพื่อยกเลิก` : `ไพ่ใบที่ ${index + 1}`}
              style={[styles.backShadow, { width: cardW, height: cardH }, on && { transform: [{ translateY: -16 }] }]}
            >
              <LinearGradient colors={["#2B261E", "#141210"]} style={[styles.back, on && { borderColor: colors.goldOnDark, borderWidth: 3 }]}>
                <View style={styles.backRing}>
                  <Text style={styles.backGlyph}>{on ? order + 1 : "✦"}</Text>
                </View>
              </LinearGradient>
            </Pressable>
          );
        }}
      />
      <Caption>เลื่อนซ้าย–ขวาเพื่อดูสำรับทั้ง 78 ใบ · คำมั่นก่อนสับ (SHA-256): {state.session?.commitment.slice(0, 16)}…</Caption>
    </>
  );
}

const styles = StyleSheet.create({
  focusWrap: { alignItems: "center", gap: space.md, paddingTop: space.lg },
  focusPress: { padding: space.lg },
  ring: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: colors.dark,
    borderWidth: 3,
    borderColor: colors.gold,
    shadowColor: colors.goldInk,
    shadowOpacity: 0.5,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: 10 },
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  ringGlow: { ...StyleSheet.absoluteFillObject, backgroundColor: colors.goldInk, borderRadius: 95 },
  ringGlyph: { fontSize: 64, lineHeight: 80, color: colors.goldOnDark },
  slots: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  slot: { minWidth: 76, paddingHorizontal: 12, paddingVertical: 8, alignItems: "center" },
  slotNum: { fontSize: 16, lineHeight: 24, fontWeight: "700", color: colors.goldInk },
  slotName: { fontSize: 12, lineHeight: 20, color: colors.muted, maxWidth: 96 },
  backShadow: {
    borderRadius: radius.sm,
    shadowColor: "#000",
    shadowOpacity: 0.28,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  back: {
    flex: 1,
    borderRadius: radius.sm,
    borderWidth: 2,
    borderColor: colors.gold,
    padding: 5,
  },
  backRing: {
    flex: 1,
    borderRadius: radius.sm - 4,
    borderWidth: 1,
    borderColor: colors.goldOnDark,
    alignItems: "center",
    justifyContent: "center",
  },
  backGlyph: { color: colors.goldOnDark, fontSize: 26, lineHeight: 36, fontWeight: "700" },
});
