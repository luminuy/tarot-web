import { router } from "expo-router";

import { LoginForm } from "@/components/LoginForm";
import { H1, Panel, Screen } from "@/components/ui";

/**
 * หน้าต่างเข้าสู่ระบบที่เด้งทับพิธีเปิดไพ่ — หน้าพิธีอยู่ข้างใต้ต่อไป
 * คำถามและไพ่ที่เลือกไว้จึงไม่หาย เข้าสู่ระบบเสร็จก็ปิดหน้าต่างนี้แล้วเปิดไพ่ต่อได้เลย
 */
export default function LoginModal() {
  return (
    <Screen edges={["left", "right"]}>
      <H1>เข้าสู่ระบบเพื่อเปิดไพ่</H1>
      <Panel>
        <LoginForm onSuccess={() => router.back()} />
      </Panel>
    </Screen>
  );
}
