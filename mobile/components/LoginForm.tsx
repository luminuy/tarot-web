import { useState } from "react";
import { StyleSheet, TextInput } from "react-native";

import { Body, Button, ErrorNote } from "@/components/ui";
import { apiJson } from "@/lib/api/client";
import { saveSession, type AppUser } from "@/lib/auth/session";
import { colors, radius, space } from "@/lib/theme";

interface LoginResponse {
  ok: boolean;
  user: AppUser;
  sessionToken?: string;
}

/** ฟอร์มเข้าสู่ระบบด้วยอีเมล — ใช้ทั้งแท็บบัญชีและหน้าต่างล็อกอินกลางพิธีเปิดไพ่ (ไม่ทำให้คำถามหาย) */
export function LoginForm({ onSuccess }: { onSuccess?: () => void }) {
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
      onSuccess?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : "เข้าสู่ระบบไม่สำเร็จ ลองใหม่อีกครั้งนะ");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      {error ? <ErrorNote>{error}</ErrorNote> : null}
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
    </>
  );
}

const styles = StyleSheet.create({
  input: {
    minHeight: 52,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.85)",
    backgroundColor: "rgba(255,255,255,0.7)",
    paddingHorizontal: space.md,
    color: colors.ink,
    fontSize: 17,
  },
});
