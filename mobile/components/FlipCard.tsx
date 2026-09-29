import * as Haptics from "expo-haptics";
import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, { interpolate, useAnimatedStyle, useReducedMotion, useSharedValue, withTiming } from "react-native-reanimated";

import { CardBack } from "@/components/CardBack";
import { CardImageNative } from "@/components/CardImageNative";
import { CARD_ASPECT, colors, type } from "@/lib/theme";

/**
 * ไพ่พลิก 3D — กฎเหล็กข้อ 4: เริ่มต้นคว่ำหน้าเสมอ ผู้ใช้แตะพลิกเอง (ห้ามพลิกให้อัตโนมัติ)
 * สั่นเบา ๆ ตอนพลิก · เคารพ "ลดการเคลื่อนไหว" ของระบบ (ตัดเหลือเฟดสั้น ๆ)
 *
 * สองโหมด:
 *  - ไม่ส่ง `flipped` = ควบคุมตัวเอง (หน้า "วันนี้") พลิกแล้วพลิกกลับไม่ได้
 *  - ส่ง `flipped` = ผู้เรียกควบคุม (แผนผังพิธีเปิดไพ่) — การพลิกต้องมาจากการแตะของผู้ใช้ผ่าน `onFlip` เท่านั้น
 */
export function FlipCard({
  cardId,
  reversed,
  width,
  aspect = CARD_ASPECT,
  label,
  flipped: controlled,
  onFlip,
  onPressFlipped,
  accessibilityName,
}: {
  cardId: string | undefined;
  reversed?: boolean;
  width: number;
  /** กว้าง/สูง — แผนผังใช้ 2:3 ตามเรขาคณิตของเว็บ */
  aspect?: number;
  label?: string;
  flipped?: boolean;
  onFlip?: () => void;
  /** แตะไพ่ที่พลิกแล้ว (เช่น เลือกดูรายละเอียด) */
  onPressFlipped?: () => void;
  accessibilityName?: string;
}) {
  const [own, setOwn] = useState(false);
  const flipped = controlled ?? own;
  const reduce = useReducedMotion();
  const progress = useSharedValue(flipped ? 1 : 0);
  const height = width / aspect;

  useEffect(() => {
    progress.value = withTiming(flipped ? 1 : 0, { duration: reduce ? 120 : 520 });
  }, [flipped, reduce, progress]);

  const front = useAnimatedStyle(() => ({
    transform: [{ perspective: 900 }, { rotateY: `${interpolate(progress.value, [0, 1], [180, 360])}deg` }],
    opacity: progress.value > 0.5 ? 1 : 0,
  }));
  const back = useAnimatedStyle(() => ({
    transform: [{ perspective: 900 }, { rotateY: `${interpolate(progress.value, [0, 1], [0, 180])}deg` }],
    opacity: progress.value > 0.5 ? 0 : 1,
  }));

  const press = () => {
    if (flipped) {
      onPressFlipped?.();
      return;
    }
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (controlled === undefined) setOwn(true);
    onFlip?.();
  };

  return (
    <View style={{ alignItems: "center", width }}>
      <Pressable
        onPress={press}
        accessibilityRole="button"
        accessibilityLabel={flipped ? (accessibilityName ?? label ?? "ไพ่ที่เปิดแล้ว") : `แตะเพื่อพลิกไพ่${accessibilityName ? ` ${accessibilityName}` : ""}`}
        style={{ width, height }}
      >
        <Animated.View style={[styles.face, { width, height }, back]}>
          <CardBack width={width} height={height} />
        </Animated.View>
        <Animated.View style={[styles.face, { width, height }, front]}>
          <CardImageNative cardId={cardId} reversed={reversed} width={width} aspect={aspect} />
        </Animated.View>
      </Pressable>
      {label ? <Text style={styles.label}>{label}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  face: { position: "absolute", backfaceVisibility: "hidden" },
  label: { ...type.subhead, marginTop: 8, color: colors.ink, textAlign: "center" },
});
