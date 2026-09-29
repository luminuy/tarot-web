import { BlurView } from "expo-blur";
import { GlassView, isLiquidGlassAvailable } from "expo-glass-effect";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, type ReactNode } from "react";
import { Platform, StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withRepeat, withTiming, Easing } from "react-native-reanimated";

import { radius as R } from "@/lib/theme";

/**
 * ✦ ธีม "กระจกอุ่น" (Warm Liquid Glass) ของแอป iOS
 *
 * ชั้นของกระจกหนึ่งแผ่น (ล่าง → บน):
 *   1. วัสดุกระจก — iOS 26 ใช้ Liquid Glass ของระบบ (`GlassView`) · รุ่นอื่น/เว็บ ใช้ `BlurView` + แผ่นสีขาวโปร่ง
 *   2. ไฮไลต์สะท้อนแสงด้านบน (gradient ขาว → โปร่ง) ให้ความรู้สึกเป็นแผ่นนูน
 *   3. ขอบขาวบางเรืองแสง (specular rim)
 *   4. เนื้อหา
 * เงาอยู่บนกล่องนอก (เพราะกล่องใน `overflow: hidden` ตัดเงา)
 *
 * ⚠️ ข้อห้าม `backdrop-filter` ของเว็บ (INC-0056) เป็นเรื่องประสิทธิภาพเบราว์เซอร์ ไม่เกี่ยวกับ native
 * ⚠️ ตัวอักษรบนกระจกต้องคอนทราสต์ผ่าน AA — แผ่นสีขาวโปร่งมี alpha ≥ 0.4 เสมอ ห้ามลดจนอ่านยาก
 */
export type GlassVariant = "light" | "strong" | "dark";

const nativeGlass = Platform.OS === "ios" && isLiquidGlassAvailable();

const VARIANT = {
  light: { intensity: 38, tint: "light" as const, wash: "rgba(255,255,255,0.46)", rim: "rgba(255,255,255,0.85)", highlight: "rgba(255,255,255,0.75)" },
  strong: { intensity: 60, tint: "light" as const, wash: "rgba(255,252,246,0.72)", rim: "rgba(255,255,255,0.95)", highlight: "rgba(255,255,255,0.85)" },
  dark: { intensity: 50, tint: "dark" as const, wash: "rgba(23,21,18,0.78)", rim: "rgba(210,163,84,0.55)", highlight: "rgba(255,240,210,0.16)" },
};

export function GlassSurface({
  children,
  style,
  contentStyle,
  radius = R.lg,
  variant = "light",
  flat = false,
  wash,
}: {
  children?: ReactNode;
  /** สไตล์กล่องนอก (ขนาด/margin/flex) */
  style?: StyleProp<ViewStyle>;
  /** สไตล์กล่องเนื้อหาด้านใน (padding/gap/align) */
  contentStyle?: StyleProp<ViewStyle>;
  radius?: number;
  variant?: GlassVariant;
  /** ไม่มีเงา — ใช้กับชิ้นเล็กที่วางซ้อนบนกระจกอีกชั้น */
  flat?: boolean;
  /** สีแผ่นโปร่งทับวัสดุกระจก (ค่าเริ่มต้นตาม variant) — แท็บบาร์ใช้ทึบขึ้นเพราะมีเนื้อหาเลื่อนผ่านใต้ */
  wash?: string;
}) {
  const v = VARIANT[variant];

  return (
    <View
      style={[
        { borderRadius: radius },
        !flat && (variant === "dark" ? styles.shadowDark : styles.shadow),
        style,
      ]}
    >
      <View style={{ borderRadius: radius, overflow: "hidden" }}>
        {nativeGlass ? (
          <>
            <GlassView
              style={StyleSheet.absoluteFill}
              glassEffectStyle="regular"
              tintColor={variant === "dark" ? "rgba(23,21,18,0.55)" : "rgba(255,248,236,0.35)"}
            />
            {/* แผ่นสีบาง ๆ ช่วยคอนทราสต์ตัวอักษร ไม่ให้กระจกโปร่งจนอ่านยากบนพื้นหลังที่มีสีสัน */}
            <View style={[StyleSheet.absoluteFill, { backgroundColor: wash ?? (variant === "dark" ? "rgba(23,21,18,0.35)" : "rgba(255,255,255,0.22)") }]} />
          </>
        ) : (
          <>
            <BlurView intensity={v.intensity} tint={v.tint} style={StyleSheet.absoluteFill} />
            <View style={[StyleSheet.absoluteFill, { backgroundColor: wash ?? v.wash }]} />
          </>
        )}
        <LinearGradient
          colors={[v.highlight, "rgba(255,255,255,0)"]}
          start={{ x: 0.2, y: 0 }}
          end={{ x: 0.5, y: 0.55 }}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
        <View
          pointerEvents="none"
          style={[StyleSheet.absoluteFill, { borderRadius: radius, borderWidth: 1, borderColor: v.rim }]}
        />
        <View style={contentStyle}>{children}</View>
      </View>
    </View>
  );
}

/**
 * พื้นหลังออโรราอุ่น — กระจกจะสวยได้ต้องมีสีให้เบลอทับ
 * ฐานครีม + ก้อนสีทอง/กุหลาบ/ฟ้าหม่นลอยช้า ๆ แล้วเบลอรวมกันเป็นแสงนุ่ม
 * เคารพ "ลดการเคลื่อนไหว" (หยุดลอย)
 */
export function AuroraBackground() {
  const reduce = useReducedMotion();
  const drift = useSharedValue(0);

  useEffect(() => {
    if (reduce) return;
    drift.value = withRepeat(withTiming(1, { duration: 14000, easing: Easing.inOut(Easing.sin) }), -1, true);
  }, [reduce, drift]);

  const a = useAnimatedStyle(() => ({ transform: [{ translateX: drift.value * 28 }, { translateY: drift.value * -18 }] }));
  const b = useAnimatedStyle(() => ({ transform: [{ translateX: drift.value * -22 }, { translateY: drift.value * 24 }] }));

  return (
    <View style={[StyleSheet.absoluteFill, { overflow: "hidden" }]} pointerEvents="none">
      <LinearGradient colors={["#FBF3E4", "#F6E6CB", "#F1DDBF"]} style={StyleSheet.absoluteFill} />
      <Animated.View style={[styles.blob, { top: -90, right: -110, width: 340, height: 340, backgroundColor: "#EDB865" }, a]} />
      <Animated.View style={[styles.blob, { top: 300, left: -140, width: 320, height: 320, backgroundColor: "#E9A9A0" }, b]} />
      <View style={[styles.blob, { bottom: -120, right: -60, width: 340, height: 340, backgroundColor: "#A7C6D4" }]} />
      <View style={[styles.blob, { top: 120, left: 60, width: 200, height: 200, backgroundColor: "#F4D9A1", opacity: 0.6 }]} />
      <BlurView intensity={70} tint="light" style={StyleSheet.absoluteFill} />
      <View style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(250,243,230,0.25)" }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  blob: { position: "absolute", borderRadius: 999, opacity: 0.55 },
  shadow: {
    shadowColor: "#6B4A14",
    shadowOpacity: 0.16,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 10 },
    elevation: 4,
  },
  shadowDark: {
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 12 },
    elevation: 6,
  },
});
