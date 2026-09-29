import { BlurView } from "expo-blur";
import { GlassView, isLiquidGlassAvailable } from "expo-glass-effect";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Platform, StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

import { motion, night as N, radius as R, shadow } from "@/lib/theme";

/**
 * ✦ วัสดุ "กระจกอุ่น" (Warm Liquid Glass) ของแอป iOS — รอบ 3
 *
 * หลักที่เปลี่ยนจากรอบก่อน (ตาม Apple HIG ของ Liquid Glass):
 *   กระจกเป็นของ "ชั้นนำทาง" ที่ลอยเหนือเนื้อหาเท่านั้น — แท็บบาร์ · แถบหัวจอ · ปุ่มลอย · แผงปุ่มล่าง · ชิป
 *   ส่วนเนื้อหา (การ์ด รายการ คำอ่าน) ใช้ `Card` พื้นทึบใน ui.tsx — กระจกซ้อนกระจกทุกใบทำให้อ่านยากและกินเครื่อง
 *
 * ชั้นของกระจกหนึ่งแผ่น (ล่าง → บน):
 *   1. วัสดุ — iOS 26 ใช้ Liquid Glass ของระบบ (`GlassView`) · รุ่นอื่น/เว็บ ใช้ `BlurView` + แผ่นสีโปร่ง
 *   2. ไฮไลต์สะท้อนแสงด้านบน (gradient) ให้ความรู้สึกเป็นแผ่นนูน
 *   3. ขอบบางเรืองแสง (specular rim)
 *   4. เนื้อหา
 * เงาอยู่บนกล่องนอก (เพราะกล่องใน `overflow: hidden` ตัดเงา)
 *
 * ⚠️ ข้อห้าม `backdrop-filter` ของเว็บ (INC-0056) เป็นเรื่องประสิทธิภาพเบราว์เซอร์ ไม่เกี่ยวกับ native
 * ⚠️ ตัวอักษรบนกระจกต้องคอนทราสต์ผ่าน AA — แผ่นสีโปร่ง (wash) มี alpha ≥ 0.55 เสมอ ห้ามลดจนอ่านยาก
 */
export type GlassTone = "light" | "night" | "gold" | "ink";

export const nativeGlass = Platform.OS === "ios" && isLiquidGlassAvailable();

const TONE = {
  light: {
    intensity: 55,
    tint: "light" as const,
    wash: "rgba(255,251,244,0.62)",
    nativeTint: "rgba(255,248,236,0.30)",
    nativeWash: "rgba(255,252,246,0.28)",
    rim: "rgba(255,255,255,0.9)",
    highlight: "rgba(255,255,255,0.7)",
  },
  night: {
    intensity: 45,
    tint: "dark" as const,
    wash: "rgba(33,27,36,0.62)",
    nativeTint: "rgba(20,17,22,0.45)",
    nativeWash: "rgba(20,17,22,0.25)",
    rim: "rgba(210,163,84,0.38)",
    highlight: "rgba(255,236,200,0.14)",
  },
  ink: {
    intensity: 30,
    tint: "dark" as const,
    wash: "rgba(33,27,36,0.96)",
    nativeTint: "rgba(33,27,36,0.92)",
    nativeWash: "rgba(33,27,36,0.4)",
    rim: "rgba(210,163,84,0.5)",
    highlight: "rgba(255,240,215,0.16)",
  },
  gold: {
    intensity: 30,
    tint: "light" as const,
    wash: "rgba(143,92,26,0.94)",
    nativeTint: "rgba(143,92,26,0.92)",
    nativeWash: "rgba(143,92,26,0.35)",
    rim: "rgba(255,226,170,0.55)",
    highlight: "rgba(255,255,255,0.32)",
  },
};

export function GlassSurface({
  children,
  style,
  contentStyle,
  radius = R.lg,
  tone = "light",
  flat = false,
  wash,
  interactive = false,
}: {
  children?: ReactNode;
  /** สไตล์กล่องนอก (ขนาด/margin/flex) */
  style?: StyleProp<ViewStyle>;
  /** สไตล์กล่องเนื้อหาด้านใน (padding/gap/align) */
  contentStyle?: StyleProp<ViewStyle>;
  radius?: number;
  tone?: GlassTone;
  /** ไม่มีเงา — ใช้กับชิ้นเล็กที่วางบนพื้นเรียบ */
  flat?: boolean;
  /** สีแผ่นโปร่งทับวัสดุกระจก (ค่าเริ่มต้นตามโทน) */
  wash?: string;
  /** ให้กระจกของระบบ iOS 26 ตอบสนองการแตะ (เรืองแสงตามนิ้ว) — ใช้กับปุ่ม */
  interactive?: boolean;
}) {
  const t = TONE[tone];

  return (
    <View style={[{ borderRadius: radius }, !flat && (tone === "light" ? shadow.float : styles.shadowDeep), style]}>
      <View style={[styles.clip, { borderRadius: radius }]}>
        {nativeGlass ? (
          <>
            <GlassView
              style={StyleSheet.absoluteFill}
              glassEffectStyle="regular"
              tintColor={t.nativeTint}
              isInteractive={interactive}
              colorScheme={tone === "night" || tone === "ink" ? "dark" : "light"}
            />
            {/* แผ่นสีบาง ๆ ช่วยคอนทราสต์ตัวอักษร ไม่ให้กระจกโปร่งจนอ่านยากบนพื้นหลังที่มีสีสัน */}
            <View style={[StyleSheet.absoluteFill, { backgroundColor: wash ?? t.nativeWash }]} />
          </>
        ) : (
          <>
            <BlurView intensity={t.intensity} tint={t.tint} style={StyleSheet.absoluteFill} />
            <View style={[StyleSheet.absoluteFill, { backgroundColor: wash ?? t.wash }]} />
          </>
        )}
        <LinearGradient
          colors={[t.highlight, "rgba(255,255,255,0)"]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 0.6 }}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
        <View pointerEvents="none" style={[StyleSheet.absoluteFill, { borderRadius: radius, borderWidth: 1, borderColor: t.rim }]} />
        <View style={contentStyle}>{children}</View>
      </View>
    </View>
  );
}

/** ดาวในโทนค่ำ — ตำแหน่งสุ่มแบบกำหนดเมล็ด (เรนเดอร์ซ้ำได้หน้าตาเดิม ไม่กระพริบ) */
function useStars(count: number) {
  return useMemo(() => {
    let seed = 1909;
    const rnd = () => {
      seed = (seed * 16807) % 2147483647;
      return seed / 2147483647;
    };
    return Array.from({ length: count }, () => ({
      left: `${rnd() * 100}%` as const,
      top: `${rnd() * 70}%` as const,
      size: rnd() < 0.15 ? 2.5 : rnd() < 0.5 ? 1.6 : 1,
      opacity: 0.35 + rnd() * 0.5,
    }));
  }, [count]);
}

/** ท้องฟ้ายามค่ำ: ไล่เฉดม่วงหม่น → ดำอุ่น + ดาว + แสงทองจาง ๆ ด้านบน */
export function NightSky({ style }: { style?: StyleProp<ViewStyle> }) {
  const stars = useStars(46);
  return (
    <View style={[StyleSheet.absoluteFill, { overflow: "hidden" }, style]} pointerEvents="none">
      <LinearGradient colors={[N.top, N.mid, N.base]} locations={[0, 0.45, 1]} style={StyleSheet.absoluteFill} />
      <View style={[styles.haze, { top: -160, alignSelf: "center", width: 420, height: 320, backgroundColor: "#D2A354", opacity: 0.16 }]} />
      <View style={[styles.haze, { bottom: -160, left: -120, width: 360, height: 360, backgroundColor: "#6B4F8A", opacity: 0.22 }]} />
      {/* เบลอก้อนแสงให้ขอบนุ่ม แล้ววางดาวทับทีหลัง (ดาวต้องคม) */}
      <BlurView intensity={60} tint="dark" style={StyleSheet.absoluteFill} />
      {stars.map((s, i) => (
        <View
          key={i}
          style={{
            position: "absolute",
            left: s.left,
            top: s.top,
            width: s.size,
            height: s.size,
            borderRadius: s.size,
            backgroundColor: "#FFF3DA",
            opacity: s.opacity,
          }}
        />
      ))}
    </View>
  );
}

/** กลางวันอุ่น: ฐานครีม + แสงทอง/กุหลาบ/ฟ้าหม่นลอยช้า ๆ เบลอรวมเป็นแสงนุ่ม — กระจกจะสวยได้ต้องมีสีให้เบลอทับ */
function DaySky() {
  const reduce = useReducedMotion();
  const drift = useSharedValue(0);

  useEffect(() => {
    if (reduce) return;
    drift.value = withRepeat(withTiming(1, { duration: 16000, easing: Easing.inOut(Easing.sin) }), -1, true);
  }, [reduce, drift]);

  const a = useAnimatedStyle(() => ({ transform: [{ translateX: drift.value * 26 }, { translateY: drift.value * -16 }] }));
  const b = useAnimatedStyle(() => ({ transform: [{ translateX: drift.value * -20 }, { translateY: drift.value * 22 }] }));

  return (
    <View style={[StyleSheet.absoluteFill, { overflow: "hidden" }]} pointerEvents="none">
      <LinearGradient colors={["#FBF4E7", "#F7EBD6", "#F3E3C9"]} style={StyleSheet.absoluteFill} />
      <Animated.View style={[styles.blob, { top: -110, right: -120, width: 360, height: 360, backgroundColor: "#EFC27A" }, a]} />
      <Animated.View style={[styles.blob, { top: 340, left: -170, width: 330, height: 330, backgroundColor: "#EDB4AA", opacity: 0.4 }, b]} />
      <View style={[styles.blob, { bottom: -140, right: -80, width: 360, height: 360, backgroundColor: "#B7CFD9", opacity: 0.4 }]} />
      <BlurView intensity={80} tint="light" style={StyleSheet.absoluteFill} />
      <View style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(251,245,234,0.35)" }]} />
    </View>
  );
}

/**
 * พื้นหลังของทุกหน้าจอ — `night` สลับเป็นท้องฟ้ายามค่ำแบบเฟดนุ่ม (ใช้ตอนเข้าจังหวะพิธี)
 * ท้องฟ้าค่ำเมานต์เมื่อถูกใช้ครั้งแรกเท่านั้น หน้าที่ไม่เคยเข้าโทนค่ำจึงไม่เสียแรงวาด
 */
export function Backdrop({ night = false }: { night?: boolean }) {
  const reduce = useReducedMotion();
  const [mounted, setMounted] = useState(night);
  const o = useSharedValue(night ? 1 : 0);

  useEffect(() => {
    if (night) setMounted(true);
    o.value = withTiming(night ? 1 : 0, { duration: reduce ? motion.fast : motion.slow + 180 });
  }, [night, reduce, o]);

  const nightStyle = useAnimatedStyle(() => ({ opacity: o.value }));

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <DaySky />
      {mounted ? (
        <Animated.View style={[StyleSheet.absoluteFill, nightStyle]}>
          <NightSky />
        </Animated.View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  clip: { overflow: "hidden" },
  blob: { position: "absolute", borderRadius: 999, opacity: 0.5 },
  haze: { position: "absolute", borderRadius: 999 },
  shadowDeep: {
    shadowColor: "#000",
    shadowOpacity: 0.35,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 8,
  },
});
