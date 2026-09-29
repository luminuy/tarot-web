import { Tabs } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { GlassTabBar, TAB_BAR_H, tabBarGap } from "@/components/TabBar";
import { BottomSpaceContext } from "@/components/ui";

/**
 * 4 แท็บ (ลดจาก 5): วันนี้ · เปิดไพ่ · สมุด · คลังไพ่
 * "บัญชี" ย้ายไปเป็นปุ่มรูปคนมุมขวาบนของหน้าวันนี้ (แบบแอป App Store) — ใช้ไม่บ่อย ไม่ควรกินที่แท็บ
 * หน้าจอเว้นที่ล่างให้แท็บบาร์ลอยผ่าน BottomSpaceContext
 */
export default function TabsLayout() {
  const { bottom } = useSafeAreaInsets();

  return (
    <BottomSpaceContext.Provider value={TAB_BAR_H + tabBarGap(bottom) + 8}>
      <Tabs tabBar={(props) => <GlassTabBar {...props} />} screenOptions={{ headerShown: false }}>
        <Tabs.Screen name="index" options={{ title: "วันนี้" }} />
        <Tabs.Screen name="read" options={{ title: "เปิดไพ่" }} />
        <Tabs.Screen name="journal" options={{ title: "สมุด" }} />
        <Tabs.Screen name="cards" options={{ title: "คลังไพ่" }} />
      </Tabs>
    </BottomSpaceContext.Provider>
  );
}
