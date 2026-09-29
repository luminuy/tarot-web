import { NotoSerifThai_400Regular } from "@expo-google-fonts/noto-serif-thai/400Regular";
import { NotoSerifThai_600SemiBold } from "@expo-google-fonts/noto-serif-thai/600SemiBold";
import { NotoSerifThai_700Bold } from "@expo-google-fonts/noto-serif-thai/700Bold";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { loadSession, useSession } from "@/lib/auth/session";
import { colors } from "@/lib/theme";

export default function RootLayout() {
  const { ready } = useSession();
  // ฟอนต์หัวเรื่องแบรนด์ (ฝังในแอป ไม่โหลดจากเน็ต) — โหลดไม่ขึ้นก็ไปต่อด้วยฟอนต์ระบบ ไม่ค้างหน้าขาว
  const [fontsLoaded, fontError] = useFonts({ NotoSerifThai_400Regular, NotoSerifThai_600SemiBold, NotoSerifThai_700Bold });

  useEffect(() => {
    void loadSession();
  }, []);

  // รออ่านโทเคนจาก Keychain ก่อนเรนเดอร์ — กันหน้าจอกระพริบจาก "ยังไม่ล็อกอิน" เป็น "ล็อกอินแล้ว"
  if (!ready || (!fontsLoaded && !fontError)) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <Stack screenOptions={{ contentStyle: { backgroundColor: colors.canvas }, headerTintColor: colors.ink }}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          {/* พิธีเปิดไพ่: เต็มจอ ไม่มี Tab Bar · ปิดด้วยปุ่ม ✕ ของตัวเอง (ปัดลงปิดไม่ได้ กันเสียไพ่ที่เลือกไว้) */}
          <Stack.Screen
            name="reading/[spreadId]"
            options={{ headerShown: false, presentation: "fullScreenModal", gestureEnabled: false }}
          />
          {/* บัญชีและเข้าสู่ระบบเป็นแผ่นเด้งจากล่าง (sheet) — ปิดด้วยการปัดลงหรือปุ่ม ✕ */}
          <Stack.Screen name="account" options={{ headerShown: false, presentation: "modal" }} />
          {/* หน้าแนะนำแอป: เปิดครั้งแรกครั้งเดียว (หน้าวันนี้เป็นคนเรียก) */}
          <Stack.Screen name="onboarding" options={{ headerShown: false, presentation: "fullScreenModal", gestureEnabled: false }} />
          <Stack.Screen name="login" options={{ headerShown: false, presentation: "modal" }} />
          {/* หน้าไพ่: หัวจอเป็นภาพไพ่บนฟ้าค่ำเต็มขอบ พร้อมปุ่มย้อนกระจกลอย (ปัดขอบซ้ายย้อนกลับได้ตามปกติ) */}
          <Stack.Screen name="card/[id]" options={{ headerShown: false }} />
        </Stack>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
