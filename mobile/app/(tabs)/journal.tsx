import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { Text, View } from "react-native";

import { CardImageNative } from "@/components/CardImageNative";
import { Body, Button, Caption, ErrorNote, H1, Panel, Screen } from "@/components/ui";
import { apiJson } from "@/lib/api/client";
import { useSession } from "@/lib/auth/session";
import { colors, space } from "@/lib/theme";
import { ALL_CARDS } from "@core/data/cards";

interface JournalEntry {
  id: string;
  question: string;
  spreadName: string;
  personaName: string;
  summary: string;
  cards: { order: number; cardIndex: number; cardNameTh: string; isReversed: boolean; positionName: string }[];
}

/** สมุดว่าง/ยังไม่ล็อกอิน ต้องมีทางไปต่อเสมอ (DESIGN.md ข้อ 7) */
function Empty({ title, note, action, onAction }: { title: string; note: string; action: string; onAction: () => void }) {
  return (
    <Panel style={{ alignItems: "center", paddingVertical: space.xl }}>
      <Text style={{ fontSize: 40, color: colors.goldInk }}>✦</Text>
      <Text style={{ fontSize: 18, lineHeight: 30, fontWeight: "700", color: colors.ink, textAlign: "center" }}>{title}</Text>
      <Body muted>{note}</Body>
      <Button title={action} onPress={onAction} />
    </Panel>
  );
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

  return (
    <Screen>
      <H1>สมุดบันทึก</H1>
      {!token ? (
        <Empty
          title="เก็บคำทำนายไว้ย้อนดู"
          note="เข้าสู่ระบบเพื่อบันทึกทุกครั้งที่เปิดไพ่ และซิงก์กับเว็บ"
          action="ไปที่หน้าบัญชี"
          onAction={() => router.push("/account")}
        />
      ) : null}
      {error ? <ErrorNote>{error}</ErrorNote> : null}
      {token && items?.length === 0 ? (
        <Empty title="ยังไม่มีคำทำนาย" note="เปิดไพ่ใบแรกแล้วคำอ่านจะถูกเก็บไว้ที่นี่อัตโนมัติ" action="เปิดไพ่ใบแรก" onAction={() => router.push("/read")} />
      ) : null}
      {items?.map((r) => (
        <Panel key={r.id}>
          <Text style={{ fontSize: 17, lineHeight: 29, fontWeight: "700", color: colors.ink }}>{r.question}</Text>
          <Caption gold>
            {r.spreadName} · {r.personaName}
          </Caption>
          <View style={{ flexDirection: "row", gap: 6, flexWrap: "wrap" }}>
            {r.cards.map((c) => (
              <CardImageNative key={c.order} cardId={ALL_CARDS[c.cardIndex]?.id} reversed={c.isReversed} width={44} />
            ))}
          </View>
          {r.summary ? <Body muted>{r.summary}</Body> : null}
        </Panel>
      ))}
    </Screen>
  );
}
