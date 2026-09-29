import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { loadSession, useSession } from "@/lib/auth/session";
import { colors } from "@/lib/theme";

export default function RootLayout() {
  const { ready } = useSession();

  useEffect(() => {
    void loadSession();
  }, []);

  // รออ่านโทเคนจาก Keychain ก่อนเรนเดอร์ — กันหน้าจอกระพริบจาก "ยังไม่ล็อกอิน" เป็น "ล็อกอินแล้ว"
  if (!ready) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <Stack screenOptions={{ contentStyle: { backgroundColor: colors.canvas }, headerTintColor: colors.ink }}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="reading/[spreadId]" options={{ title: "เปิดไพ่", headerBackTitle: "กลับ" }} />
          <Stack.Screen name="card/[id]" options={{ title: "ความหมายไพ่", headerBackTitle: "กลับ" }} />
        </Stack>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
