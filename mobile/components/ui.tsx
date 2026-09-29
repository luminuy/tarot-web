import { LinearGradient } from "expo-linear-gradient";
import { createContext, useContext, type ReactNode } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View, type StyleProp, type ViewStyle } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import { AuroraBackground, GlassSurface, type GlassVariant } from "@/components/glass";
import { colors, radius, space, type } from "@/lib/theme";

/** ที่ว่างด้านล่างที่แท็บบาร์ลอยบังอยู่ — แท็บให้ค่านี้ ส่วนหน้าเต็มจอ (พิธีเปิดไพ่) เป็น 0 */
export const BottomSpaceContext = createContext(0);

/**
 * หน้าจอมาตรฐาน — พื้นออโรราอุ่น + เนื้อหาเลื่อนได้ · `footer` = แผงกระจกปุ่มหลักลอยล่างจอ (ใช้มือเดียวถึง)
 * ห้ามใส่แถวการ์ดย่อยแบบตัดขอบ (กฎเหล็กข้อ 3 Zero-Clipping)
 */
export function Screen({
  children,
  scroll = true,
  footer,
  edges = ["top", "left", "right"],
}: {
  children: ReactNode;
  scroll?: boolean;
  footer?: ReactNode;
  edges?: ("top" | "bottom" | "left" | "right")[];
}) {
  const bottomSpace = useContext(BottomSpaceContext);
  return (
    <View style={styles.screen}>
      <AuroraBackground />
      <SafeAreaView style={{ flex: 1 }} edges={edges}>
        {scroll ? (
          <ScrollView
            contentContainerStyle={[styles.content, { paddingBottom: footer ? space.lg : space.xl + bottomSpace }]}
            keyboardShouldPersistTaps="handled"
          >
            {children}
          </ScrollView>
        ) : (
          <View style={[styles.content, { flex: 1 }]}>{children}</View>
        )}
        {footer ? <StickyBar>{footer}</StickyBar> : null}
      </SafeAreaView>
    </View>
  );
}

/** แผงกระจกลอยล่างจอสำหรับปุ่มหลัก — เว้นขอบล่างตาม Home Indicator */
export function StickyBar({ children }: { children: ReactNode }) {
  const { bottom } = useSafeAreaInsets();
  const bottomSpace = useContext(BottomSpaceContext);
  return (
    <View style={{ paddingHorizontal: space.sm + 4, paddingBottom: Math.max(bottom, space.sm + 4) + bottomSpace, paddingTop: space.sm }}>
      <GlassSurface variant="strong" radius={radius.xl} contentStyle={{ padding: space.md, gap: space.sm }}>
        {children}
      </GlassSurface>
    </View>
  );
}

export function H1({ children }: { children: ReactNode }) {
  return (
    <Text style={styles.h1} accessibilityRole="header">
      {children}
    </Text>
  );
}

export function H2({ children, light }: { children: ReactNode; light?: boolean }) {
  return (
    <Text style={[styles.h2, light && { color: colors.surface }]} accessibilityRole="header">
      {children}
    </Text>
  );
}

export function Body({ children, muted }: { children: ReactNode; muted?: boolean }) {
  return <Text style={[styles.body, muted && { color: colors.muted }]}>{children}</Text>;
}

export function Caption({ children, gold, live }: { children: ReactNode; gold?: boolean; live?: boolean }) {
  return (
    <Text style={[styles.caption, gold && { color: colors.goldInk }]} accessibilityLiveRegion={live ? "polite" : undefined}>
      {children}
    </Text>
  );
}

/** การ์ดกระจก — ใช้แทนกล่องเนื้อหาทุกใบ */
export function Panel({
  children,
  style,
  variant = "light",
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  variant?: GlassVariant;
}) {
  return (
    <GlassSurface variant={variant} contentStyle={[styles.panelContent, style]}>
      {children}
    </GlassSurface>
  );
}

/** ชิปกระจก — เลือกแล้วเป็นทองไล่เฉด */
export function Chip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: !!selected }}
      style={({ pressed }) => [{ transform: [{ scale: pressed ? 0.97 : 1 }] }]}
    >
      {selected ? (
        <LinearGradient colors={GOLD} style={styles.chip}>
          <Text style={[styles.chipText, { color: colors.surface, fontWeight: "600" }]}>{label}</Text>
        </LinearGradient>
      ) : (
        <GlassSurface radius={radius.pill} flat contentStyle={styles.chip}>
          <Text style={styles.chipText}>{label}</Text>
        </GlassSurface>
      )}
    </Pressable>
  );
}

const GOLD = ["#B67A22", "#8F5C1A", "#74490F"] as const;

export function Button({
  title,
  onPress,
  variant = "primary",
  disabled,
  loading,
  flex,
}: {
  title: string;
  onPress: () => void;
  variant?: "primary" | "ghost" | "danger";
  disabled?: boolean;
  loading?: boolean;
  flex?: boolean;
}) {
  const off = disabled || loading;
  const label = loading ? (
    <ActivityIndicator color={variant === "primary" ? colors.surface : colors.ink} />
  ) : (
    <Text
      style={[
        styles.btnText,
        variant === "primary" && { color: colors.surface },
        variant === "danger" && { color: colors.err },
      ]}
    >
      {title}
    </Text>
  );

  return (
    <Pressable
      onPress={onPress}
      disabled={off}
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ disabled: !!off, busy: !!loading }}
      style={({ pressed }) => [flex && { flex: 1 }, { opacity: off ? 0.45 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] }]}
    >
      {variant === "primary" ? (
        <View style={styles.primaryShadow}>
          <LinearGradient colors={GOLD} style={styles.btn}>
            {/* ไฮไลต์บนปุ่มทอง — ให้ดูเป็นวัสดุนูน */}
            <LinearGradient
              colors={["rgba(255,255,255,0.32)", "rgba(255,255,255,0)"]}
              style={[StyleSheet.absoluteFill, { borderRadius: radius.pill }]}
              pointerEvents="none"
            />
            {label}
          </LinearGradient>
        </View>
      ) : (
        <GlassSurface
          radius={radius.pill}
          flat
          variant={variant === "danger" ? "strong" : "light"}
          contentStyle={[styles.btn, variant === "danger" && { backgroundColor: "rgba(252,238,234,0.7)" }]}
        >
          {label}
        </GlassSurface>
      )}
    </Pressable>
  );
}

export function ErrorNote({ children }: { children: ReactNode }) {
  return (
    <View style={styles.error} accessibilityRole="alert">
      <Text style={styles.errorText}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.canvas },
  content: { padding: space.md, gap: space.md },
  h1: { ...type.title, color: colors.ink, letterSpacing: -0.3 },
  h2: { ...type.heading, color: colors.ink },
  body: { ...type.body, color: colors.ink },
  caption: { ...type.caption, color: colors.muted },
  panelContent: { padding: space.md, gap: space.sm },
  chip: {
    paddingHorizontal: space.md,
    minHeight: 44,
    justifyContent: "center",
    borderRadius: radius.pill,
  },
  chipText: { fontSize: 15, lineHeight: 24, color: colors.ink },
  btn: {
    minHeight: 54,
    borderRadius: radius.pill,
    paddingHorizontal: space.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryShadow: {
    borderRadius: radius.pill,
    shadowColor: "#8F5C1A",
    shadowOpacity: 0.35,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 5,
  },
  btnText: { fontSize: 17, lineHeight: 28, fontWeight: "600", color: colors.goldInk },
  error: {
    backgroundColor: "rgba(252,238,234,0.85)",
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: "rgba(166,57,44,0.35)",
    padding: space.md,
  },
  errorText: { color: colors.err, fontSize: 15, lineHeight: 24 },
});
