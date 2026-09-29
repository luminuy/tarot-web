import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

/**
 * จำว่าเคยดูหน้าแนะนำแอปแล้วหรือยัง (แสดงครั้งเดียวตอนเปิดแอปครั้งแรก)
 * iOS เก็บใน Keychain ผ่าน expo-secure-store (แอปไม่มี AsyncStorage ตามแผนข้อ 6) · เว็บบิลด์ใช้ localStorage
 * อ่านไม่ได้ = ถือว่าเคยดูแล้ว — ไม่ยัดหน้าแนะนำซ้ำให้คนที่ใช้แอปอยู่
 */
const KEY = "seertarot.onboarded";

export async function hasSeenOnboarding(): Promise<boolean> {
  try {
    if (Platform.OS === "web") return globalThis.localStorage?.getItem(KEY) === "1";
    return (await SecureStore.getItemAsync(KEY)) === "1";
  } catch {
    return true;
  }
}

export async function markOnboardingSeen(): Promise<void> {
  try {
    if (Platform.OS === "web") globalThis.localStorage?.setItem(KEY, "1");
    else await SecureStore.setItemAsync(KEY, "1");
  } catch {
    // จดไม่ได้ก็แค่เห็นหน้าแนะนำอีกครั้งรอบหน้า ไม่กระทบการใช้งาน
  }
}
