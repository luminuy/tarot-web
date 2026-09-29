import { useState } from "react";
import { Alert, Linking, Text } from "react-native";

import { LoginForm } from "@/components/LoginForm";
import { Body, Button, Caption, ErrorNote, H1, Panel, Screen } from "@/components/ui";
import { apiJson } from "@/lib/api/client";
import { API_BASE_URL, APP_VERSION } from "@/lib/config";
import { clearSession, useSession } from "@/lib/auth/session";
import { colors } from "@/lib/theme";

export default function AccountScreen() {
  const { token, user } = useSession();
  const [error, setError] = useState<string | null>(null);

  const logout = async () => {
    await apiJson("/api/auth/logout", { method: "POST" }).catch(() => undefined);
    await clearSession();
  };

  // ข้อ 5.1.1(v) ของ Apple: ต้องลบบัญชีได้ในแอป
  const confirmDelete = () =>
    Alert.alert("ลบบัญชีถาวร?", "ประวัติคำทำนายทั้งหมดของคุณจะถูกลบและกู้คืนไม่ได้", [
      { text: "ยกเลิก", style: "cancel" },
      {
        text: "ลบบัญชี",
        style: "destructive",
        onPress: async () => {
          try {
            await apiJson("/api/account", { method: "DELETE" });
            await clearSession();
          } catch (e) {
            setError(e instanceof Error ? e.message : "ลบบัญชีไม่สำเร็จ ลองใหม่อีกครั้งนะ");
          }
        },
      },
    ]);

  return (
    <Screen>
      <H1>บัญชี</H1>

      {error ? <ErrorNote>{error}</ErrorNote> : null}

      <Panel>
        {token ? (
          <>
            <Text style={{ fontSize: 18, lineHeight: 30, fontWeight: "700", color: colors.ink }}>{user?.name ?? "สมาชิก"}</Text>
            {user?.email ? <Body muted>{user.email}</Body> : null}
            <Button title="ออกจากระบบ" variant="ghost" onPress={() => void logout()} />
            <Button title="ลบบัญชี" variant="danger" onPress={confirmDelete} />
          </>
        ) : (
          <LoginForm />
        )}
      </Panel>

      <Panel>
        <Body muted>เพื่อความบันเทิงและการทบทวนตนเอง ไม่ใช่คำแนะนำทางการแพทย์ กฎหมาย หรือการเงิน</Body>
        <Button title="นโยบายความเป็นส่วนตัว" variant="ghost" onPress={() => void Linking.openURL(`${API_BASE_URL}/privacy`)} />
        <Caption>SeerTarot เวอร์ชัน {APP_VERSION}</Caption>
      </Panel>
    </Screen>
  );
}
