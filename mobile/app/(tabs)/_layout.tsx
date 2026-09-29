import { Tabs } from "expo-router";
import { Text } from "react-native";

import { colors } from "@/lib/theme";

/** ไอคอนแท็บใช้ ✦ ตัวเดียว — กฎเหล็กข้อ 2 ห้ามอิโมจิการ์ตูน */
const glyph = ({ color }: { color: string }) => <Text style={{ color, fontSize: 18 }}>✦</Text>;

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.goldInk,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: { backgroundColor: colors.surfaceWarm, borderTopColor: colors.lineWarm },
      }}
    >
      <Tabs.Screen name="index" options={{ title: "วันนี้", tabBarIcon: glyph }} />
      <Tabs.Screen name="read" options={{ title: "เปิดไพ่", tabBarIcon: glyph }} />
      <Tabs.Screen name="journal" options={{ title: "สมุด", tabBarIcon: glyph }} />
      <Tabs.Screen name="cards" options={{ title: "สารานุกรม", tabBarIcon: glyph }} />
      <Tabs.Screen name="account" options={{ title: "บัญชี", tabBarIcon: glyph }} />
    </Tabs>
  );
}
