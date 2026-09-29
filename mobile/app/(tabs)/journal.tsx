import { router } from "expo-router";
import { useCallback, useState } from "react";
import { useFocusEffect } from "expo-router";
import { Text } from "react-native";

import { Body, Button, ErrorNote, H1, Panel, Screen } from "@/components/ui";
import { apiJson } from "@/lib/api/client";
import { useSession } from "@/lib/auth/session";
import { colors } from "@/lib/theme";

interface JournalEntry {
  id: string;
  question: string;
  spreadName: string;
  personaName: string;
  summary: string;
  cards: { order: number; cardNameTh: string; isReversed: boolean; positionName: string }[];
  createdAt?: number | string;
}

export default function JournalScreen() {
  const { token } = useSession();
  const [items, setItems] = useState<JournalEntry[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      if (!token) return;
      setError(null);
      apiJson<{ readings: JournalEntry[] }>("/api/journal?limit=50")
        .then((r) => setItems(r.readings))
        .catch((e) => setError(e instanceof Error ? e.message : "โหลดสมุดไม่ได้ ลองใหม่อีกครั้งนะ"));
    }, [token]),
  );

  if (!token) {
    return (
      <Screen>
        <H1>สมุดบันทึก</H1>
        <Panel>
          <Body>เข้าสู่ระบบเพื่อเก็บคำทำนายไว้ย้อนดู และซิงก์กับเว็บได้</Body>
          <Button title="ไปที่หน้าบัญชี" onPress={() => router.push("/account")} />
        </Panel>
      </Screen>
    );
  }

  return (
    <Screen>
      <H1>สมุดบันทึก</H1>
      {error ? <ErrorNote>{error}</ErrorNote> : null}
      {items?.length === 0 ? <Body muted>ยังไม่มีคำทำนายที่บันทึกไว้ — ลองเปิดไพ่ใบแรกดูนะ</Body> : null}
      {items?.map((r) => (
        <Panel key={r.id}>
          <Text style={{ fontWeight: "700", color: colors.ink }}>{r.question}</Text>
          <Text style={{ color: colors.goldInk }}>
            {r.spreadName} · {r.personaName}
          </Text>
          <Body muted>{r.cards.map((c) => `${c.cardNameTh}${c.isReversed ? " (กลับหัว)" : ""}`).join(" · ")}</Body>
          {r.summary ? <Body>{r.summary}</Body> : null}
        </Panel>
      ))}
    </Screen>
  );
}
