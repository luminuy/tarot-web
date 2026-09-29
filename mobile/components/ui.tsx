import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { Children, createContext, Fragment, isValidElement, useContext, useState, type ReactNode } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from "react-native";
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  type SharedValue,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Backdrop, GlassSurface, NightSky } from "@/components/glass";
import { friendlyMessage } from "@/lib/errors";
import { colors, GUTTER, night as N, radius, shadow, space, type } from "@/lib/theme";

type IconName = keyof typeof Ionicons.glyphMap;

/** ที่ว่างด้านล่างที่แท็บบาร์ลอยบังอยู่ — แท็บให้ค่านี้ ส่วนหน้าเต็มจอ (พิธีเปิดไพ่) เป็น 0 */
export const BottomSpaceContext = createContext(0);

/** โทนของพื้นที่ตรงนี้ — ตัวอักษร/ปุ่ม/การ์ดเปลี่ยนสีตามเอง (โทนค่ำใช้ในพิธีเปิดไพ่และฮีโร่) */
export type Tone = "day" | "night";
export const ToneContext = createContext<Tone>("day");
export const useTone = () => useContext(ToneContext);

const NAV_H = 52;

// ─────────────────────────────── ตัวอักษร ───────────────────────────────

const ink = (tone: Tone) => (tone === "night" ? N.text : colors.ink);
const soft = (tone: Tone) => (tone === "night" ? N.textSoft : colors.muted);
const accent = (tone: Tone) => (tone === "night" ? N.gold : colors.goldInk);

export function LargeTitle({ children, style }: { children: ReactNode; style?: StyleProp<TextStyle> }) {
  const tone = useTone();
  return (
    <Text style={[type.largeTitle, { color: ink(tone) }, style]} accessibilityRole="header">
      {children}
    </Text>
  );
}

export function H1({ children, center }: { children: ReactNode; center?: boolean }) {
  const tone = useTone();
  return (
    <Text style={[type.title, { color: ink(tone) }, center && styles.center]} accessibilityRole="header">
      {children}
    </Text>
  );
}

export function H2({ children, center }: { children: ReactNode; center?: boolean }) {
  const tone = useTone();
  return (
    <Text style={[type.heading, { color: ink(tone) }, center && styles.center]} accessibilityRole="header">
      {children}
    </Text>
  );
}

export function Body({ children, muted, center, style }: { children: ReactNode; muted?: boolean; center?: boolean; style?: StyleProp<TextStyle> }) {
  const tone = useTone();
  return <Text style={[type.body, { color: muted ? soft(tone) : ink(tone) }, center && styles.center, style]}>{children}</Text>;
}

export function Caption({ children, gold, live, center }: { children: ReactNode; gold?: boolean; live?: boolean; center?: boolean }) {
  const tone = useTone();
  return (
    <Text
      style={[type.footnote, { color: gold ? accent(tone) : soft(tone) }, center && styles.center]}
      accessibilityLiveRegion={live ? "polite" : undefined}
    >
      {children}
    </Text>
  );
}

/** ป้ายหัวเรื่องเล็กตัวหนา สีทอง — บอก "นี่คือส่วนไหน" ก่อนหัวข้อใหญ่ */
export function Eyebrow({ children, center }: { children: ReactNode; center?: boolean }) {
  const tone = useTone();
  return <Text style={[type.eyebrow, { color: accent(tone) }, center && styles.center]}>{children}</Text>;
}

// ─────────────────────────────── โครงหน้าจอ ───────────────────────────────

/**
 * แถบหัวจอแบบ iOS: ปุ่มกระจกลอยซ้าย/ขวาอยู่ตลอด · พื้นกระจกและชื่อหน้าค่อย ๆ ปรากฏเมื่อเลื่อนผ่านหัวข้อใหญ่
 * (ตอนอยู่บนสุด หัวข้อใหญ่ทำหน้าที่แทน — ไม่ซ้ำสองที่)
 */
export function NavBar({
  scrollY,
  title,
  left,
  right,
  alwaysSolid = false,
  revealAt = 48,
}: {
  scrollY?: SharedValue<number>;
  title?: string;
  left?: ReactNode;
  right?: ReactNode;
  alwaysSolid?: boolean;
  /** ระยะเลื่อนที่พื้นกระจกทึบเต็มที่ — หน้าที่มีฮีโร่สูงตั้งค่านี้ให้ตรงกับขอบล่างของฮีโร่ */
  revealAt?: number;
}) {
  const { top } = useSafeAreaInsets();
  const tone = useTone();
  const bg = useAnimatedStyle(() => ({
    opacity: alwaysSolid ? 1 : interpolate(scrollY?.value ?? 0, [revealAt - 40, revealAt], [0, 1], Extrapolation.CLAMP),
  }));
  const t = useAnimatedStyle(() => ({
    opacity: alwaysSolid ? 1 : interpolate(scrollY?.value ?? 0, [revealAt - 12, revealAt + 24], [0, 1], Extrapolation.CLAMP),
  }));

  return (
    <View style={[styles.nav, { paddingTop: top, height: top + NAV_H }]} pointerEvents="box-none">
      <Animated.View style={[StyleSheet.absoluteFill, bg]} pointerEvents="none">
        <BlurView intensity={60} tint={tone === "night" ? "dark" : "light"} style={StyleSheet.absoluteFill} />
        <View style={[StyleSheet.absoluteFill, { backgroundColor: tone === "night" ? "rgba(20,17,22,0.55)" : "rgba(251,246,237,0.86)" }]} />
        <View style={[styles.navLine, { backgroundColor: tone === "night" ? N.line : "rgba(116,73,15,0.12)" }]} />
      </Animated.View>
      <View style={styles.navRow} pointerEvents="box-none">
        <View style={styles.navSide}>{left}</View>
        <Animated.Text style={[type.headline, styles.navTitle, { color: ink(tone) }, t]} numberOfLines={1}>
          {title}
        </Animated.Text>
        <View style={[styles.navSide, { justifyContent: "flex-end" }]}>{right}</View>
      </View>
    </View>
  );
}

/** หัวหน้าจอใหญ่ (Large Title) + ป้ายเล็กด้านบน + ปุ่มเสริมด้านขวา */
export function PageHeader({
  eyebrow,
  title,
  subtitle,
  accessory,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  accessory?: ReactNode;
}) {
  return (
    <View style={styles.pageHeader}>
      <View style={{ flex: 1 }}>
        {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}
        <LargeTitle>{title}</LargeTitle>
        {subtitle ? <Body muted>{subtitle}</Body> : null}
      </View>
      {accessory ? <View style={{ paddingTop: eyebrow ? 22 : 6 }}>{accessory}</View> : null}
    </View>
  );
}

/** ตัวจับการเลื่อนสำหรับแถบหัวจอ — ใช้กับ ScrollView/FlatList ของ Reanimated */
export function useScrollY() {
  const y = useSharedValue(0);
  const onScroll = useAnimatedScrollHandler((e) => {
    y.value = e.contentOffset.y;
  });
  return { y, onScroll };
}

/**
 * หน้าจอมาตรฐาน — พื้นกลางวันอุ่น + หัวข้อใหญ่ + แถบหัวจอกระจกที่ปรากฏเมื่อเลื่อน
 * `hero` = ส่วนหัวเต็มขอบจอ (เช่น ภาพไพ่บนฟ้าค่ำ) แทนหัวข้อใหญ่
 * `footer` = แผงกระจกปุ่มหลักลอยล่างจอ (ใช้มือเดียวถึง) · เนื้อหาเลื่อนผ่านใต้แผงได้
 * ห้ามใส่แถวการ์ดย่อยแบบตัดขอบ (กฎเหล็กข้อ 3 Zero-Clipping)
 */
export function Screen({
  children,
  title,
  eyebrow,
  subtitle,
  accessory,
  hero,
  left,
  right,
  footer,
  keyboard = false,
  night = false,
  gap = space.md,
  navRevealAt,
}: {
  children: ReactNode;
  title?: string;
  eyebrow?: string;
  subtitle?: string;
  accessory?: ReactNode;
  hero?: ReactNode;
  left?: ReactNode;
  right?: ReactNode;
  footer?: ReactNode;
  keyboard?: boolean;
  night?: boolean;
  gap?: number;
  navRevealAt?: number;
}) {
  const { top } = useSafeAreaInsets();
  const bottomSpace = useContext(BottomSpaceContext);
  const { y, onScroll } = useScrollY();
  const [footerH, setFooterH] = useState(0);
  const hasNavButtons = !!(left || right);

  const body = (
    <View style={styles.flex}>
      <Animated.ScrollView
        onScroll={onScroll}
        scrollEventThrottle={16}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        contentContainerStyle={{ paddingBottom: (footer ? footerH : 0) + bottomSpace + space.xl }}
      >
        {hero}
        <View style={[styles.content, { gap, paddingTop: hero ? space.lg : top + (hasNavButtons ? NAV_H : space.sm) }]}>
          {title && !hero ? <PageHeader eyebrow={eyebrow} title={title} subtitle={subtitle} accessory={accessory} /> : null}
          {children}
        </View>
      </Animated.ScrollView>
      <NavBar scrollY={y} title={title} left={left} right={right} revealAt={navRevealAt} />
      {footer ? (
        <View style={styles.footerWrap} onLayout={(e) => setFooterH(e.nativeEvent.layout.height)} pointerEvents="box-none">
          <StickyBar>{footer}</StickyBar>
        </View>
      ) : null}
    </View>
  );

  return (
    <ToneContext.Provider value={night ? "night" : "day"}>
      <View style={styles.screen}>
        <Backdrop night={night} />
        {keyboard ? (
          <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
            {body}
          </KeyboardAvoidingView>
        ) : (
          body
        )}
      </View>
    </ToneContext.Provider>
  );
}

/** แผงกระจกลอยล่างจอสำหรับปุ่มหลัก — เว้นขอบล่างตาม Home Indicator */
export function StickyBar({ children }: { children: ReactNode }) {
  const { bottom } = useSafeAreaInsets();
  const bottomSpace = useContext(BottomSpaceContext);
  const tone = useTone();
  return (
    <View style={{ paddingHorizontal: space.sm + 4, paddingBottom: Math.max(bottom, space.sm + 4) + bottomSpace, paddingTop: space.sm }}>
      <GlassSurface tone={tone === "night" ? "night" : "light"} radius={radius.xl + 4} contentStyle={styles.sticky}>
        {children}
      </GlassSurface>
    </View>
  );
}

// ─────────────────────────────── พื้นผิวเนื้อหา ───────────────────────────────

/**
 * การ์ดเนื้อหา (ชั้นเนื้อหา — ไม่ใช่กระจก): พื้นกระดาษอุ่นเกือบทึบ + ขอบบาง + เงาบาง
 * โทนค่ำเป็นแผ่นโปร่งสีครีมจาง ๆ บนฟ้าค่ำ
 */
export function Card({
  children,
  style,
  onPress,
  accessibilityLabel,
  padded = true,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  accessibilityLabel?: string;
  padded?: boolean;
}) {
  const tone = useTone();
  const surface = [styles.card, tone === "night" ? styles.cardNight : styles.cardDay, padded && styles.cardPad, style];
  if (!onPress) return <View style={surface}>{children}</View>;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => [...surface, pressed && { opacity: 0.86, transform: [{ scale: 0.985 }] }]}
    >
      {children}
    </Pressable>
  );
}

/**
 * แผงฟ้าค่ำ — จุดเน้นของหน้า (ไพ่ประจำวัน · สรุปคำแนะนำ) · เนื้อหาข้างในเป็นโทนค่ำอัตโนมัติ
 * ความต่างสว่าง/มืดกับพื้นครีมคือสิ่งที่ดึงสายตาไปที่จุดเดียวของหน้า
 */
export function NightPanel({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return (
    <ToneContext.Provider value="night">
      <View style={styles.nightShadow}>
        <View style={[styles.nightPanel, style]}>
          <NightSky />
          {children}
        </View>
      </View>
    </ToneContext.Provider>
  );
}

/** หัวข้อส่วน + ลิงก์ "ดูทั้งหมด" ด้านขวา */
export function SectionHeader({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  const tone = useTone();
  return (
    <View style={styles.section}>
      <Text style={[type.heading, { color: ink(tone), flex: 1 }]} accessibilityRole="header">
        {title}
      </Text>
      {action && onAction ? (
        <Pressable onPress={onAction} hitSlop={10} accessibilityRole="button">
          <Text style={[type.subhead, { color: accent(tone), fontWeight: "600" }]}>{action}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

/** กลุ่มรายการแบบ iOS (inset grouped) — ใส่ `ListRow` เป็นลูก เส้นคั่นใส่ให้เอง */
export function ListGroup({ children, header, footer }: { children: ReactNode; header?: string; footer?: string }) {
  const tone = useTone();
  const rows = Children.toArray(children).filter(isValidElement);
  return (
    <View style={{ gap: space.xs + 2 }}>
      {header ? <Text style={[type.footnote, styles.groupHeader, { color: soft(tone) }]}>{header}</Text> : null}
      <View style={[styles.card, tone === "night" ? styles.cardNight : styles.cardDay, { overflow: "hidden" }]}>
        {rows.map((row, i) => (
          <Fragment key={i}>
            {i > 0 ? <View style={[styles.sep, { backgroundColor: tone === "night" ? N.line : "rgba(116,73,15,0.12)" }]} /> : null}
            {row}
          </Fragment>
        ))}
      </View>
      {footer ? <Text style={[type.footnote, styles.groupHeader, { color: soft(tone) }]}>{footer}</Text> : null}
    </View>
  );
}

export function ListRow({
  icon,
  iconColor = colors.goldInk,
  title,
  subtitle,
  value,
  onPress,
  destructive,
  chevron = true,
  external,
}: {
  icon?: IconName;
  iconColor?: string;
  title: string;
  subtitle?: string;
  value?: string;
  onPress?: () => void;
  destructive?: boolean;
  chevron?: boolean;
  external?: boolean;
}) {
  const tone = useTone();
  const color = destructive ? colors.err : ink(tone);
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? "button" : undefined}
      accessibilityLabel={[title, subtitle, value].filter(Boolean).join(" ")}
      style={({ pressed }) => [styles.row, pressed && { backgroundColor: "rgba(143,92,26,0.07)" }]}
    >
      {icon ? (
        <View style={[styles.rowIcon, { backgroundColor: `${destructive ? colors.err : iconColor}1F` }]}>
          <Ionicons name={icon} size={18} color={destructive ? colors.err : iconColor} />
        </View>
      ) : null}
      <View style={{ flex: 1 }}>
        <Text style={[type.callout, { color, fontWeight: "500" }]}>{title}</Text>
        {subtitle ? <Text style={[type.footnote, { color: soft(tone) }]}>{subtitle}</Text> : null}
      </View>
      {value ? <Text style={[type.subhead, { color: soft(tone) }]}>{value}</Text> : null}
      {onPress && chevron ? (
        <Ionicons name={external ? "open-outline" : "chevron-forward"} size={external ? 17 : 18} color={soft(tone)} />
      ) : null}
    </Pressable>
  );
}

// ─────────────────────────────── ปุ่มและชิป ───────────────────────────────

/** ชิปตัวเลือก — ทึบ (ชั้นเนื้อหา) · เลือกแล้วเป็นทองเข้ม บอกสถานะด้วยไอคอนติ๊กด้วย ไม่ใช้สีอย่างเดียว */
export function Chip({
  label,
  selected,
  onPress,
  icon,
  iconColor,
  multiline,
}: {
  label: string;
  selected?: boolean;
  onPress: () => void;
  icon?: IconName;
  iconColor?: string;
  /** ชิปยาว (เช่น คำถามแนะนำ) ให้ขึ้นบรรทัดใหม่ได้ */
  multiline?: boolean;
}) {
  const tone = useTone();
  const on = !!selected;
  const fg = on ? (tone === "night" ? colors.dark : colors.surface) : ink(tone);
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: on }}
      style={({ pressed }) => [
        styles.chip,
        multiline && styles.chipMulti,
        tone === "night" ? styles.chipNight : styles.chipDay,
        on && { backgroundColor: tone === "night" ? N.gold : colors.goldInk, borderColor: "transparent" },
        pressed && { transform: [{ scale: 0.97 }] },
      ]}
    >
      {icon ? <Ionicons name={icon} size={16} color={on ? fg : (iconColor ?? accent(tone))} /> : null}
      <Text style={[type.subhead, { color: fg, fontWeight: on ? "600" : "500" }, multiline && { flex: 1 }]}>{label}</Text>
    </Pressable>
  );
}

export function Button({
  title,
  onPress,
  variant = "primary",
  size = "lg",
  icon,
  iconRight,
  disabled,
  loading,
  flex,
  accessibilityHint,
}: {
  title: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "plain" | "danger" | "ghost";
  size?: "lg" | "md";
  icon?: IconName;
  /** ไอคอนท้ายปุ่ม — ใช้ลูกศรกับปุ่มที่พาไปข้างหน้า (แทนไอคอนประดับ) */
  iconRight?: IconName;
  disabled?: boolean;
  loading?: boolean;
  flex?: boolean;
  accessibilityHint?: string;
}) {
  const tone = useTone();
  const off = disabled || loading;
  const kind = variant === "ghost" ? "secondary" : variant;
  // ปุ่มหลักแบนเรียบทึบ ไม่ไล่เฉด ไม่มีไอคอนประดับ: กลางวัน = แคปซูลหมึกค่ำ ตัวครีม · กลางคืน = แคปซูลงาช้าง ตัวหมึก
  // คอนทราสต์: ครีม #F7EDDC บนหมึก #211B24 ≈ 15:1 · หมึก #171512 บนงาช้าง #F7EEDE ≈ 15.7:1
  const fg =
    kind === "primary"
      ? tone === "night"
        ? colors.dark
        : N.text
      : kind === "danger"
        ? colors.err
        : tone === "night"
          ? N.text
          : colors.goldInk;
  const iconColor = fg;
  const h = size === "lg" ? 56 : 44;

  const label = loading ? (
    <ActivityIndicator color={fg} />
  ) : (
    <View style={styles.btnInner}>
      {icon ? <Ionicons name={icon} size={size === "lg" ? 20 : 18} color={iconColor} /> : null}
      <Text style={[size === "lg" ? type.headline : type.subhead, { color: fg, fontWeight: "600", letterSpacing: 0.2 }]} numberOfLines={1}>
        {title}
      </Text>
      {iconRight ? <Ionicons name={iconRight} size={18} color={iconColor} /> : null}
    </View>
  );

  return (
    <Pressable
      onPress={onPress}
      disabled={off}
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: !!off, busy: !!loading }}
      style={({ pressed }) => [flex && styles.flex, { opacity: off ? 0.42 : 1, transform: [{ scale: pressed ? 0.975 : 1 }] }]}
    >
      {kind === "plain" ? (
        <View style={[styles.btn, { minHeight: h }]}>{label}</View>
      ) : (
        <GlassSurface
          tone={kind === "primary" ? (tone === "night" ? "ivory" : "ink") : tone === "night" ? "night" : "light"}
          radius={radius.pill}
          flat={kind !== "primary"}
          interactive
          style={kind === "primary" ? styles.primaryShadow : undefined}
          contentStyle={[styles.btn, { minHeight: h }]}
        >
          {label}
        </GlassSurface>
      )}
    </Pressable>
  );
}

/** ปุ่มไอคอนกลมกระจก (ย้อนกลับ · ปิด · บัญชี) — เป้าแตะ 44pt */
export function IconButton({
  icon,
  onPress,
  label,
  size = 44,
}: {
  icon: IconName;
  onPress: () => void;
  label: string;
  size?: number;
}) {
  const tone = useTone();
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={label} hitSlop={6}>
      {({ pressed }) => (
        <GlassSurface
          tone={tone === "night" ? "night" : "light"}
          radius={size / 2}
          interactive
          style={{ width: size, height: size, transform: [{ scale: pressed ? 0.94 : 1 }] }}
          contentStyle={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}
        >
          <Ionicons name={icon} size={size * 0.48} color={ink(tone)} />
        </GlassSurface>
      )}
    </Pressable>
  );
}

/** ตัวเลือกแบบแบ่งช่อง (Segmented Control) — 2–3 ตัวเลือกที่สลับมุมมองของเนื้อหาเดียวกัน */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { id: T; label: string }[];
  value: T;
  onChange: (id: T) => void;
}) {
  const tone = useTone();
  return (
    <View style={[styles.segTrack, tone === "night" && { backgroundColor: "rgba(255,244,222,0.1)" }]} accessibilityRole="tablist">
      {options.map((o) => {
        const on = o.id === value;
        return (
          <Pressable
            key={o.id}
            onPress={() => onChange(o.id)}
            accessibilityRole="tab"
            accessibilityState={{ selected: on }}
            style={[styles.segItem, on && (tone === "night" ? styles.segOnNight : styles.segOn)]}
          >
            <Text style={[type.subhead, { color: on ? (tone === "night" ? colors.dark : colors.ink) : soft(tone), fontWeight: on ? "700" : "500" }]}>
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/** ป้ายเล็ก (จำนวนใบ · สถานะ) */
export function Badge({ label, icon, color }: { label: string; icon?: IconName; color?: string }) {
  const tone = useTone();
  const c = color ?? accent(tone);
  return (
    <View style={[styles.badge, { backgroundColor: tone === "night" ? "rgba(210,163,84,0.16)" : `${c}17` }]}>
      {icon ? <Ionicons name={icon} size={12} color={c} /> : null}
      <Text style={[type.caption2, { color: c, fontWeight: "700" }]}>{label}</Text>
    </View>
  );
}

// ─────────────────────────────── สถานะ ───────────────────────────────

/** กล่องข้อผิดพลาด — แปลงข้อความดิบเป็นภาษาคนเสมอ · มีปุ่มลองใหม่ได้ */
export function ErrorNote({ children, onRetry, retryLabel = "โหลดใหม่อีกครั้ง" }: { children: ReactNode; onRetry?: () => void; retryLabel?: string }) {
  const text = typeof children === "string" ? friendlyMessage(children) : children;
  return (
    <View style={styles.error} accessibilityRole="alert">
      <View style={{ flexDirection: "row", gap: space.sm, alignItems: "flex-start" }}>
        <Ionicons name="alert-circle" size={20} color={colors.err} style={{ marginTop: 3 }} />
        <Text style={[type.subhead, { color: colors.err, flex: 1 }]}>{text}</Text>
      </View>
      {onRetry ? (
        <Pressable onPress={onRetry} accessibilityRole="button" hitSlop={8} style={styles.retry}>
          <Ionicons name="refresh" size={16} color={colors.err} />
          <Text style={[type.subhead, { color: colors.err, fontWeight: "700" }]}>{retryLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

/** หน้าว่าง — มีทางไปต่อเสมอ (DESIGN.md ข้อ 7) */
export function EmptyState({
  art,
  title,
  note,
  action,
  onAction,
}: {
  art?: ReactNode;
  title: string;
  note: string;
  action?: string;
  onAction?: () => void;
}) {
  return (
    <Card style={{ alignItems: "center", paddingVertical: space.xl, gap: space.sm }}>
      {art}
      <H2 center>{title}</H2>
      <Body muted center>
        {note}
      </Body>
      {action && onAction ? (
        <View style={{ alignSelf: "stretch", marginTop: space.sm }}>
          <Button title={action} onPress={onAction} />
        </View>
      ) : null}
    </Card>
  );
}

/** เส้นทองบาง ๆ ใช้แบ่งหัวข้อในการ์ด */
export function GoldRule() {
  return (
    <LinearGradient
      colors={["rgba(165,138,92,0)", "rgba(165,138,92,0.55)", "rgba(165,138,92,0)"]}
      start={{ x: 0, y: 0.5 }}
      end={{ x: 1, y: 0.5 }}
      style={{ height: 1, alignSelf: "stretch" }}
    />
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: { textAlign: "center" },
  screen: { flex: 1, backgroundColor: colors.canvas },
  content: { paddingHorizontal: GUTTER },
  pageHeader: { flexDirection: "row", alignItems: "flex-start", gap: space.md, marginBottom: space.xs },
  nav: { position: "absolute", top: 0, left: 0, right: 0, zIndex: 10 },
  navLine: { position: "absolute", left: 0, right: 0, bottom: 0, height: StyleSheet.hairlineWidth },
  navRow: { flex: 1, flexDirection: "row", alignItems: "center", paddingHorizontal: space.md - 4 },
  navSide: { width: 96, flexDirection: "row", gap: space.sm },
  navTitle: { flex: 1, textAlign: "center" },
  footerWrap: { position: "absolute", left: 0, right: 0, bottom: 0 },
  sticky: { padding: space.sm + 4, gap: space.sm },
  card: { borderRadius: radius.lg, borderWidth: StyleSheet.hairlineWidth },
  cardDay: { backgroundColor: "rgba(255,253,249,0.9)", borderColor: "rgba(116,73,15,0.14)", ...shadow.card },
  cardNight: { backgroundColor: "rgba(255,244,222,0.07)", borderColor: N.line },
  nightShadow: { borderRadius: radius.xl, ...shadow.float, shadowOpacity: 0.28 },
  nightPanel: {
    borderRadius: radius.xl,
    overflow: "hidden",
    padding: space.lg,
    gap: space.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: N.line,
  },
  cardPad: { padding: space.md + 2, gap: space.sm },
  section: { flexDirection: "row", alignItems: "center", marginTop: space.sm },
  groupHeader: { paddingHorizontal: space.md, textTransform: "uppercase" },
  sep: { height: StyleSheet.hairlineWidth, marginLeft: 58 },
  row: { flexDirection: "row", alignItems: "center", gap: space.md - 4, paddingHorizontal: space.md, minHeight: 56, paddingVertical: space.sm },
  rowIcon: { width: 30, height: 30, borderRadius: 9, alignItems: "center", justifyContent: "center" },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: space.md - 2,
    minHeight: 40,
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
  },
  chipMulti: { borderRadius: radius.md, paddingVertical: space.sm, minHeight: 48 },
  chipDay: { backgroundColor: "rgba(255,253,249,0.82)", borderColor: "rgba(116,73,15,0.18)" },
  chipNight: { backgroundColor: "rgba(255,244,222,0.08)", borderColor: N.line },
  btn: { borderRadius: radius.pill, paddingHorizontal: space.lg, alignItems: "center", justifyContent: "center" },
  btnInner: { flexDirection: "row", alignItems: "center", gap: space.sm },
  primaryShadow: {
    shadowColor: "#2A1C0A",
    shadowOpacity: 0.28,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 6,
  },
  segTrack: { flexDirection: "row", padding: 3, borderRadius: radius.pill, backgroundColor: "rgba(116,73,15,0.08)" },
  segItem: { flex: 1, minHeight: 38, borderRadius: radius.pill, alignItems: "center", justifyContent: "center" },
  segOn: { backgroundColor: colors.surface, ...shadow.card, shadowOpacity: 0.12 },
  segOnNight: { backgroundColor: N.gold },
  badge: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 1, borderRadius: radius.pill, alignSelf: "flex-start" },
  error: {
    backgroundColor: "rgba(252,238,234,0.95)",
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(166,57,44,0.4)",
    padding: space.md,
    gap: space.sm,
  },
  retry: { flexDirection: "row", alignItems: "center", gap: 6, alignSelf: "flex-start", paddingLeft: 28, minHeight: 32 },
});
