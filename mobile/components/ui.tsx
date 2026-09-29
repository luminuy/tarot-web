import type { ReactNode } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View, type StyleProp, type ViewStyle } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { colors, radius, space } from "@/lib/theme";

/** หน้าจอมาตรฐาน — พื้นครีม เลื่อนได้ · ห้ามใส่แถวการ์ดย่อยแบบตัดขอบ (กฎเหล็กข้อ 3 Zero-Clipping) */
export function Screen({ children, scroll = true }: { children: ReactNode; scroll?: boolean }) {
  return (
    <SafeAreaView style={styles.screen} edges={["top", "left", "right"]}>
      {scroll ? (
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {children}
        </ScrollView>
      ) : (
        <View style={styles.content}>{children}</View>
      )}
    </SafeAreaView>
  );
}

export function H1({ children }: { children: ReactNode }) {
  return <Text style={styles.h1} accessibilityRole="header">{children}</Text>;
}

export function Body({ children, muted }: { children: ReactNode; muted?: boolean }) {
  return <Text style={[styles.body, muted && { color: colors.muted }]}>{children}</Text>;
}

export function Panel({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.panel, style]}>{children}</View>;
}

export function Button({
  title,
  onPress,
  variant = "primary",
  disabled,
  loading,
}: {
  title: string;
  onPress: () => void;
  variant?: "primary" | "ghost" | "danger";
  disabled?: boolean;
  loading?: boolean;
}) {
  const off = disabled || loading;
  return (
    <Pressable
      onPress={onPress}
      disabled={off}
      accessibilityRole="button"
      accessibilityState={{ disabled: !!off }}
      style={({ pressed }) => [
        styles.btn,
        variant === "primary" && styles.btnPrimary,
        variant === "ghost" && styles.btnGhost,
        variant === "danger" && styles.btnDanger,
        off && { opacity: 0.5 },
        pressed && { opacity: 0.8 },
      ]}
    >
      {loading ? (
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
  content: { padding: space.md, gap: space.md, paddingBottom: space.xl * 2 },
  h1: { fontSize: 26, fontWeight: "700", color: colors.ink },
  body: { fontSize: 16, lineHeight: 26, color: colors.ink },
  panel: {
    backgroundColor: colors.surfaceWarm,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.lineWarm,
    padding: space.md,
    gap: space.sm,
  },
  btn: {
    minHeight: 48,
    borderRadius: radius.pill,
    paddingHorizontal: space.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  btnPrimary: { backgroundColor: colors.goldInk },
  btnGhost: { borderWidth: 1, borderColor: colors.goldInk, backgroundColor: "transparent" },
  btnDanger: { borderWidth: 1, borderColor: colors.err, backgroundColor: colors.errWash },
  btnText: { fontSize: 16, fontWeight: "600", color: colors.goldInk },
  error: { backgroundColor: colors.errWash, borderRadius: radius.sm, padding: space.md },
  errorText: { color: colors.err, fontSize: 15, lineHeight: 22 },
});
