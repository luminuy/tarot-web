import { router } from "expo-router";

import { LoginForm } from "@/components/LoginForm";
import { Card, IconButton, Screen } from "@/components/ui";
import { space } from "@/lib/theme";

/**
 * หน้าต่างเข้าสู่ระบบที่เด้งทับพิธีเปิดไพ่ — หน้าพิธีอยู่ข้างใต้ต่อไป
 * คำถามและไพ่ที่เลือกไว้จึงไม่หาย เข้าสู่ระบบเสร็จก็ปิดหน้าต่างนี้แล้วเปิดไพ่ต่อได้เลย
 */
export default function LoginModal() {
  return (
    <Screen
      title="เข้าสู่ระบบ"
      subtitle="ถ้ากำลังเปิดไพ่อยู่ คำถามและไพ่ที่เลือกไว้ยังอยู่ครบ เข้าสู่ระบบแล้วไปต่อได้ทันที"
      right={<IconButton icon="close" label="ปิด" onPress={() => router.back()} />}
      keyboard
    >
      <Card style={{ gap: space.md }}>
        <LoginForm onSuccess={() => router.back()} />
      </Card>
    </Screen>
  );
}
