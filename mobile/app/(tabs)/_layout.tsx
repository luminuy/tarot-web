import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { GlassSurface } from "@/components/glass";
import { BottomSpaceContext } from "@/components/ui";
import { colors, radius } from "@/lib/theme";

const BAR_H = 68;

type IconName = keyof typeof Ionicons.glyphMap;
/** ไอคอนเส้น (ไม่ใช่อิโมจิ — กฎเหล็กข้อ 2) · เลือกแล้วเป็นแบบทึบ */
const icon = (on: IconName, off: IconName) =>
  function TabIcon({ color, focused }: { color: string; focused: boolean }) {
    return <Ionicons name={focused ? on : off} size={24} color={color} />;
  };

/** แท็บบาร์กระจกลอย (ตามภาษาดีไซน์ iOS 26) — หน้าจอเว้นที่ล่างให้ผ่าน BottomSpaceContext */
export default function TabsLayout() {
  const { bottom } = useSafeAreaInsets();
  const gap = Math.max(bottom - 6, 14);

  return (
    <BottomSpaceContext.Provider value={BAR_H + gap + 16}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: colors.goldInk,
          tabBarInactiveTintColor: colors.muted,
          tabBarLabelStyle: { fontSize: 11, lineHeight: 16, fontWeight: "600" },
          tabBarItemStyle: { paddingTop: 8, paddingBottom: 6 },
          tabBarStyle: {
            position: "absolute",
            zIndex: 20,
            left: 16,
            right: 16,
            bottom: gap,
            height: BAR_H,
            borderRadius: radius.xl,
            borderTopWidth: 0,
            backgroundColor: "transparent",
            elevation: 0,
            paddingBottom: 0,
          },
          tabBarBackground: () => (
            <View style={{ flex: 1 }}>
              <GlassSurface variant="strong" wash="rgba(255,252,246,0.88)" radius={radius.xl} style={{ flex: 1 }} contentStyle={{ flex: 1 }} />
            </View>
          ),
        }}
      >
        <Tabs.Screen name="index" options={{ title: "วันนี้", tabBarIcon: icon("sunny", "sunny-outline") }} />
        <Tabs.Screen name="read" options={{ title: "เปิดไพ่", tabBarIcon: icon("sparkles", "sparkles-outline") }} />
        <Tabs.Screen name="journal" options={{ title: "สมุด", tabBarIcon: icon("book", "book-outline") }} />
        <Tabs.Screen name="cards" options={{ title: "สารานุกรม", tabBarIcon: icon("albums", "albums-outline") }} />
        <Tabs.Screen name="account" options={{ title: "บัญชี", tabBarIcon: icon("person-circle", "person-circle-outline") }} />
      </Tabs>
    </BottomSpaceContext.Provider>
  );
}
