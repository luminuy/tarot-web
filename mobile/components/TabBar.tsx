import { Ionicons } from "@expo/vector-icons";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import * as Haptics from "expo-haptics";
import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withSpring, withTiming } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { GlassSurface } from "@/components/glass";
import { colors, GUTTER, radius } from "@/lib/theme";

type IconName = keyof typeof Ionicons.glyphMap;

export const TAB_BAR_H = 64;

/** ไอคอนเส้น (ไม่ใช่อิโมจิ — กฎเหล็กข้อ 2) · แท็บที่เลือกเป็นแบบทึบ */
export const TAB_ICONS: Record<string, [IconName, IconName]> = {
  index: ["sunny", "sunny-outline"],
  read: ["copy", "copy-outline"],
  journal: ["book", "book-outline"],
  cards: ["grid", "grid-outline"],
};

/** ระยะจากขอบล่างจอถึงแท็บบาร์ — หน้าจอใช้คำนวณที่ว่างด้านล่าง */
export const tabBarGap = (bottomInset: number) => Math.max(bottomInset - 8, 14);

/**
 * แท็บบาร์กระจกลอยแบบ iOS 26: แคปซูลกระจกลอยเหนือเนื้อหา + "เลนส์" ทองใส ๆ เลื่อนตามแท็บที่เลือก
 * สถานะเลือกบอกด้วย 3 ทาง (ไอคอนทึบ · สีทอง · เลนส์) ไม่ใช้สีอย่างเดียว
 */
export function GlassTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const { bottom } = useSafeAreaInsets();
  const reduce = useReducedMotion();
  const [w, setW] = useState(0);
  const count = state.routes.length;
  const itemW = w / Math.max(count, 1);
  const x = useSharedValue(0);

  useEffect(() => {
    const to = state.index * itemW;
    x.value = reduce ? withTiming(to, { duration: 0 }) : withSpring(to, { damping: 18, stiffness: 180, mass: 0.8 });
  }, [state.index, itemW, reduce, x]);

  const lens = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }] }));

  return (
    <View style={[styles.wrap, { bottom: tabBarGap(bottom) }]} pointerEvents="box-none">
      <GlassSurface radius={radius.pill} wash="rgba(255,251,244,0.8)" contentStyle={styles.bar}>
        <View style={styles.row} onLayout={(e) => setW(e.nativeEvent.layout.width)}>
          {w > 0 ? <Animated.View style={[styles.lens, { width: itemW - 8 }, lens]} pointerEvents="none" /> : null}
          {state.routes.map((route, i) => {
            const focused = state.index === i;
            const { options } = descriptors[route.key];
            const label = typeof options.title === "string" ? options.title : route.name;
            const [on, off] = TAB_ICONS[route.name] ?? ["ellipse", "ellipse-outline"];
            const color = focused ? colors.goldInk : colors.muted;

            const onPress = () => {
              const event = navigation.emit({ type: "tabPress", target: route.key, canPreventDefault: true });
              if (!focused && !event.defaultPrevented) {
                void Haptics.selectionAsync();
                navigation.navigate(route.name, route.params);
              }
            };

            return (
              <Pressable
                key={route.key}
                onPress={onPress}
                onLongPress={() => navigation.emit({ type: "tabLongPress", target: route.key })}
                accessibilityRole="tab"
                accessibilityState={{ selected: focused }}
                accessibilityLabel={label}
                style={styles.item}
              >
                <Ionicons name={focused ? on : off} size={23} color={color} />
                <Text style={[styles.label, { color, fontWeight: focused ? "700" : "500" }]} numberOfLines={1}>
                  {label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </GlassSurface>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: "absolute", left: GUTTER, right: GUTTER },
  bar: { height: TAB_BAR_H, paddingHorizontal: 4, justifyContent: "center" },
  row: { flexDirection: "row", alignItems: "center", height: TAB_BAR_H - 8 },
  lens: {
    position: "absolute",
    left: 4,
    top: 0,
    bottom: 0,
    borderRadius: radius.pill,
    backgroundColor: "rgba(143,92,26,0.12)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(143,92,26,0.22)",
  },
  item: { flex: 1, alignItems: "center", justifyContent: "center", height: "100%", gap: 0 },
  label: { fontSize: 11, lineHeight: 18 },
});
