import * as Haptics from "expo-haptics";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, { interpolate, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";

import { CardImageNative } from "@/components/CardImageNative";
import { CARD_ASPECT, colors, radius } from "@/lib/theme";

/**
 * ไพ่พลิก 3D — กฎเหล็กข้อ 4: เริ่มต้นคว่ำหน้าเสมอ ผู้ใช้แตะพลิกเอง (ห้ามพลิกให้อัตโนมัติ)
 * สั่นเบา ๆ ตอนพลิก (haptics — จุดขายที่เว็บทำไม่ได้)
 */
export function FlipCard({
  cardId,
  reversed,
  width,
  label,
  onFlip,
}: {
  cardId: string | undefined;
  reversed?: boolean;
  width: number;
  label?: string;
  onFlip?: () => void;
}) {
  const [flipped, setFlipped] = useState(false);
  const progress = useSharedValue(0);
  const height = width / CARD_ASPECT;

  const front = useAnimatedStyle(() => ({
    transform: [{ perspective: 900 }, { rotateY: `${interpolate(progress.value, [0, 1], [180, 360])}deg` }],
    opacity: progress.value > 0.5 ? 1 : 0,
  }));
  const back = useAnimatedStyle(() => ({
    transform: [{ perspective: 900 }, { rotateY: `${interpolate(progress.value, [0, 1], [0, 180])}deg` }],
    opacity: progress.value > 0.5 ? 0 : 1,
  }));

  const flip = () => {
    if (flipped) return;
    setFlipped(true);
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    progress.value = withTiming(1, { duration: 520 });
    onFlip?.();
  };

  return (
    <View style={{ alignItems: "center", width }}>
      <Pressable
        onPress={flip}
        accessibilityRole="button"
        accessibilityLabel={flipped ? (label ?? "ไพ่ที่เปิดแล้ว") : "แตะเพื่อพลิกไพ่"}
        style={{ width, height }}
      >
        <Animated.View style={[styles.face, { width, height }, back]}>
          <View style={styles.backInner}>
            <Text style={styles.backGlyph}>✦</Text>
          </View>
        </Animated.View>
        <Animated.View style={[styles.face, { width, height }, front]}>
          <CardImageNative cardId={cardId} reversed={reversed} width={width} />
        </Animated.View>
      </Pressable>
      {label ? <Text style={styles.label}>{label}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  face: { position: "absolute", backfaceVisibility: "hidden" },
  backInner: {
    flex: 1,
    borderRadius: radius.sm,
    backgroundColor: colors.dark,
    borderWidth: 2,
    borderColor: colors.gold,
    alignItems: "center",
    justifyContent: "center",
  },
  backGlyph: { color: colors.goldOnDark, fontSize: 28 },
  label: { marginTop: 8, color: colors.ink, fontSize: 13, textAlign: "center" },
});
