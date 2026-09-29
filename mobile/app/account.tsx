import { router } from "expo-router";
import { useState } from "react";
import { Alert, Linking, StyleSheet, Text, View } from "react-native";

import { LoginForm } from "@/components/LoginForm";
import { Card, ErrorNote, IconButton, ListGroup, ListRow, Screen } from "@/components/ui";
import { apiJson } from "@/lib/api/client";
import { API_BASE_URL, APP_VERSION } from "@/lib/config";
import { clearSession, useSession } from "@/lib/auth/session";
import { friendlyMessage } from "@/lib/errors";
import { colors, night, space, type } from "@/lib/theme";

/**
 * บัญชี — แผ่นเด้งจากปุ่มรูปคนบนหน้าวันนี้ · รายการแบบกลุ่มตามแบบหน้าตั้งค่าของ iOS
 * ข้อ 5.1.1(v) ของ Apple: ต้องลบบัญชีได้ในแอป (แยกอยู่กลุ่มสุดท้าย สีแดง ยืนยันสองชั้น)
 */
export default function AccountScreen() {
  const { token, user } = useSession();
  const [error, setError] = useState<string | null>(null);
  const close = <IconButton icon="close" label="ปิด" onPress={() => router.back()} />;

  const logout = async () => {
    await apiJson("/api/auth/logout", { method: "POST" }).catch(() => undefined);
    await clearSession();
  };

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
            setError(friendlyMessage(e, "ลบบัญชีไม่สำเร็จ ลองใหม่อีกครั้งนะ"));
          }
        },
      },
    ]);

  const initial = (user?.name ?? user?.email ?? "✦").trim().charAt(0).toUpperCase();

  return (
    <Screen title="บัญชี" right={close} keyboard gap={space.lg}>
      {error ? <ErrorNote>{error}</ErrorNote> : null}

      {token ? (
        <Card style={styles.profile}>
          <View style={styles.avatar}>
            <Text style={[type.title2, { color: night.gold }]}>{initial}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[type.headline, { color: colors.ink }]}>{user?.name ?? "สมาชิก"}</Text>
            {user?.email ? <Text style={[type.footnote, { color: colors.muted }]}>{user.email}</Text> : null}
          </View>
        </Card>
      ) : (
        <Card style={{ gap: space.md }}>
          <LoginForm />
        </Card>
      )}

      {token ? (
        <ListGroup header="คำทำนายของฉัน">
          <ListRow icon="book-outline" title="สมุดบันทึก" subtitle="ประวัติคำทำนายทุกครั้ง" onPress={() => router.navigate("/journal")} />
        </ListGroup>
      ) : null}

      <ListGroup header="เกี่ยวกับ" footer="เพื่อความบันเทิงและการทบทวนตนเอง ไม่ใช่คำแนะนำทางการแพทย์ กฎหมาย หรือการเงิน">
        <ListRow icon="shield-checkmark-outline" title="นโยบายความเป็นส่วนตัว" external onPress={() => void Linking.openURL(`${API_BASE_URL}/privacy`)} />
        <ListRow icon="information-circle-outline" title="เวอร์ชันแอป" value={APP_VERSION} chevron={false} />
      </ListGroup>

      {token ? (
        <ListGroup>
          <ListRow icon="log-out-outline" title="ออกจากระบบ" chevron={false} onPress={() => void logout()} />
          <ListRow icon="trash-outline" title="ลบบัญชี" destructive chevron={false} onPress={confirmDelete} />
        </ListGroup>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  profile: { flexDirection: "row", alignItems: "center", gap: space.md },
  avatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: night.mid, alignItems: "center", justifyContent: "center" },
});
