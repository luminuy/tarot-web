import { Ionicons } from "@expo/vector-icons";
import { useRef, useState } from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";

import { Button, ErrorNote } from "@/components/ui";
import { apiJson } from "@/lib/api/client";
import { saveSession, type AppUser } from "@/lib/auth/session";
import { friendlyMessage } from "@/lib/errors";
import { colors, radius, space, type } from "@/lib/theme";

interface LoginResponse {
  ok: boolean;
  user: AppUser;
  sessionToken?: string;
}

type IconName = keyof typeof Ionicons.glyphMap;

function Field({
  icon,
  label,
  inputRef,
  ...props
}: React.ComponentProps<typeof TextInput> & { icon: IconName; label: string; inputRef?: React.Ref<TextInput> }) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={{ gap: 6 }}>
      <Text style={[type.footnote, { color: colors.muted, fontWeight: "600" }]}>{label}</Text>
      <View style={[styles.field, focused && styles.fieldOn]}>
        <Ionicons name={icon} size={18} color={focused ? colors.goldInk : colors.muted} />
        <TextInput
          ref={inputRef}
          {...props}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholderTextColor={colors.muted}
          style={styles.input}
          accessibilityLabel={label}
        />
      </View>
    </View>
  );
}

/** ฟอร์มเข้าสู่ระบบด้วยอีเมล — ใช้ทั้งหน้าบัญชีและหน้าต่างล็อกอินกลางพิธีเปิดไพ่ (ไม่ทำให้คำถามหาย) */
export function LoginForm({ onSuccess }: { onSuccess?: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const passwordRef = useRef<TextInput>(null);

  const login = async () => {
    if (!email || !password) return;
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
      setError(friendlyMessage(e, "เข้าสู่ระบบไม่สำเร็จ ลองใหม่อีกครั้งนะ"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Text style={[type.subhead, { color: colors.muted }]}>ใช้อีเมลและรหัสผ่านเดียวกับที่สมัครไว้บน seertarot.net</Text>
      {error ? <ErrorNote>{error}</ErrorNote> : null}
      <Field
        icon="mail-outline"
        label="อีเมล"
        value={email}
        onChangeText={setEmail}
        placeholder="you@example.com"
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
        textContentType="username"
        returnKeyType="next"
        onSubmitEditing={() => passwordRef.current?.focus()}
      />
      <Field
        inputRef={passwordRef}
        icon="lock-closed-outline"
        label="รหัสผ่าน"
        value={password}
        onChangeText={setPassword}
        placeholder="รหัสผ่านของคุณ"
        secureTextEntry
        autoComplete="password"
        textContentType="password"
        returnKeyType="go"
        onSubmitEditing={() => void login()}
      />
      <Button title="เข้าสู่ระบบ" onPress={() => void login()} loading={busy} disabled={!email || !password} />
      <Text style={[type.footnote, { color: colors.muted, textAlign: "center" }]}>
        ยังไม่มีบัญชี? สมัครได้ที่ seertarot.net แล้วกลับมาเข้าสู่ระบบในแอป
      </Text>
    </>
  );
}

const styles = StyleSheet.create({
  field: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.sm,
    minHeight: 52,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: "rgba(116,73,15,0.16)",
    backgroundColor: "rgba(255,255,255,0.8)",
    paddingHorizontal: space.md - 2,
  },
  fieldOn: { borderColor: colors.goldInk, backgroundColor: colors.surface },
  input: { flex: 1, minHeight: 50, color: colors.ink, fontSize: 17 },
});
