import { useState } from "react";
import { Alert, Linking, StyleSheet, Text, TextInput } from "react-native";

import { Body, Button, ErrorNote, H1, Panel, Screen } from "@/components/ui";
import { apiJson } from "@/lib/api/client";
import { API_BASE_URL, APP_VERSION } from "@/lib/config";
import { clearSession, saveSession, useSession, type AppUser } from "@/lib/auth/session";
import { colors, radius, space } from "@/lib/theme";

interface LoginResponse {
  ok: boolean;
  user: AppUser;
  sessionToken?: string;
}

export default function AccountScreen() {
  const { token, user } = useSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const login = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await apiJson<LoginResponse>("/api/auth/email/login", {
        method: "POST",
        body: { email, password },
      });
      // ช่องทางแอป (`X-Client: ios`) คืนโทเคนใน body — ไม่มีโทเคน = หลังบ้านยังไม่รองรับแอป ห้ามแกล้งล็อกอินสำเร็จ
      if (!res.sessionToken) throw new Error("เข้าสู่ระบบไม่สำเร็จ กรุณาอัปเดตแอปแล้วลองใหม่");
      await saveSession(res.sessionToken, res.user);
      setPassword("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "เข้าสู่ระบบไม่สำเร็จ ลองใหม่อีกครั้งนะ");
    } finally {
      setBusy(false);
    }
  };

  const logout = async () => {
    await apiJson("/api/auth/logout", { method: "POST" }).catch(() => undefined);
    await clearSession();
  };

  // ข้อ 5.1.1(v) ของ Apple: ต้องลบบัญชีได้ในแอป
  const confirmDelete = () =>
    Alert.alert(
      "ลบบัญชีถาวร?",
      "ประวัติคำทำนายทั้งหมดของคุณจะถูกลบและกู้คืนไม่ได้",
      [
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
      ],
    );

  return (
    <Screen>
      <H1>บัญชี</H1>

      {error ? <ErrorNote>{error}</ErrorNote> : null}

      {token ? (
        <Panel>
          <Text style={{ fontWeight: "700", color: colors.ink }}>{user?.name ?? "สมาชิก"}</Text>
          {user?.email ? <Body muted>{user.email}</Body> : null}
          <Button title="ออกจากระบบ" variant="ghost" onPress={() => void logout()} />
          <Button title="ลบบัญชี" variant="danger" onPress={confirmDelete} />
        </Panel>
      ) : (
        <Panel>
          <Body>เข้าสู่ระบบด้วยอีเมลที่เคยสมัครไว้บน seertarot.net</Body>
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="อีเมล"
            placeholderTextColor={colors.muted}
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            textContentType="username"
            style={styles.input}
            accessibilityLabel="อีเมล"
          />
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="รหัสผ่าน"
            placeholderTextColor={colors.muted}
            secureTextEntry
            autoComplete="password"
            textContentType="password"
            style={styles.input}
            accessibilityLabel="รหัสผ่าน"
          />
          <Button title="เข้าสู่ระบบ" onPress={() => void login()} loading={busy} disabled={!email || !password} />
          <Body muted>ยังไม่มีบัญชี? สมัครได้ที่ seertarot.net แล้วกลับมาเข้าสู่ระบบในแอป</Body>
        </Panel>
      )}

      <Panel>
        <Body muted>เพื่อความบันเทิงและการทบทวนตนเอง ไม่ใช่คำแนะนำทางการแพทย์ กฎหมาย หรือการเงิน</Body>
        <Button title="นโยบายความเป็นส่วนตัว" variant="ghost" onPress={() => void Linking.openURL(`${API_BASE_URL}/privacy`)} />
        <Text style={{ color: colors.muted, fontSize: 12 }}>SeerTarot เวอร์ชัน {APP_VERSION}</Text>
      </Panel>
    </Screen>
  );
}

const styles = StyleSheet.create({
  input: {
    minHeight: 48,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.lineWarm,
    backgroundColor: colors.surface,
    paddingHorizontal: space.md,
    color: colors.ink,
    fontSize: 16,
  },
});
