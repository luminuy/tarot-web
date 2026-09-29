import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

import { CardBack } from "@/components/CardBack";
import { CardImageNative } from "@/components/CardImageNative";
import { Card, Caption, EmptyState, ErrorNote, Screen } from "@/components/ui";
import { apiJson } from "@/lib/api/client";
import { useSession } from "@/lib/auth/session";
import { friendlyMessage } from "@/lib/errors";
import { colors, space, spreadTitle, type } from "@/lib/theme";
import { ALL_CARDS } from "@core/data/cards";

interface JournalEntry {
  id: string;
  date?: string;
  question: string;
  spreadName: string;
  personaName: string;
  summary: string;
  corrupted?: boolean;
  cards: { order: number; cardIndex: number; cardNameTh: string; isReversed: boolean; positionName: string }[];
}

const shortDate = (iso?: string) => {
  const d = iso ? new Date(iso) : null;
  return d && !Number.isNaN(d.getTime()) ? d.toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "2-digit" }) : null;
};

/** ภาพประกอบหน้าว่าง: หลังไพ่สามใบกางเป็นพัด */
function FanArt() {
  return (
    <View style={styles.fan} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      {[-14, 0, 14].map((deg, i) => (
        <CardBack
          key={deg}
          width={52}
          height={84}
          style={{ position: "absolute", left: 20 + i * 22, top: i === 1 ? 0 : 8, transform: [{ rotate: `${deg}deg` }] }}
        />
      ))}
    </View>
  );
}

/** สมุดบันทึก — ทุกสถานะมีทางไปต่อ (ยังไม่ล็อกอิน · กำลังโหลด · ว่าง · ผิดพลาด) */
export default function JournalScreen() {
  const { token } = useSession();
  const [items, setItems] = useState<JournalEntry[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    if (!token) return;
    setError(null);
    apiJson<{ readings: JournalEntry[] }>("/api/journal?limit=50")
      .then((r) => setItems(r.readings))
      .catch((e) => setError(friendlyMessage(e, "โหลดสมุดไม่ได้ ลองใหม่อีกครั้งนะ")));
  }, [token]);

  useFocusEffect(load);

  return (
    <Screen title="สมุดบันทึก" subtitle={token && items?.length ? `คำทำนาย ${items.length} ครั้งล่าสุด` : undefined}>
      {!token ? (
        <EmptyState
          art={<FanArt />}
          title="เก็บทุกคำทำนายไว้ย้อนดู"
          note="เข้าสู่ระบบแล้วคำอ่านทุกครั้งจะถูกบันทึกให้อัตโนมัติ และเปิดดูบนเว็บได้ด้วย"
          action="เข้าสู่ระบบ"
          onAction={() => router.push("/login")}
        />
      ) : null}

      {error ? <ErrorNote onRetry={load}>{error}</ErrorNote> : null}

      {token && !items && !error ? (
        <View style={styles.loading}>
          <ActivityIndicator color={colors.goldInk} />
          <Caption>กำลังเปิดสมุด…</Caption>
        </View>
      ) : null}

      {token && items?.length === 0 ? (
        <EmptyState
          art={<FanArt />}
          title="ยังไม่มีคำทำนาย"
          note="เปิดไพ่ครั้งแรกแล้วคำอ่านจะมาอยู่ที่นี่เอง"
          action="เปิดไพ่ใบแรก"
          onAction={() => router.push("/read")}
        />
      ) : null}

      {items?.map((r) => (
        <Card key={r.id}>
          <View style={styles.meta}>
            <Text style={[type.eyebrow, { color: colors.goldInk, flex: 1 }]} numberOfLines={1}>
              {spreadTitle(r.spreadName)}
            </Text>
            {shortDate(r.date) ? <Text style={[type.caption2, { color: colors.muted }]}>{shortDate(r.date)}</Text> : null}
          </View>
          <Text style={[type.headline, { color: colors.ink }]}>{r.question || "คำถามทั่วไป"}</Text>
          {r.corrupted ? (
            // กฎเหล็กข้อ 14: ข้อมูลไพ่เสีย ห้ามแสดงเหมือนไม่มีไพ่
            <ErrorNote>ข้อมูลไพ่ของบันทึกนี้เสียหาย กรุณาโหลดใหม่อีกครั้ง</ErrorNote>
          ) : (
            <View style={styles.thumbs}>
              {r.cards.map((c) => (
                <CardImageNative key={c.order} cardId={ALL_CARDS[c.cardIndex]?.id} reversed={c.isReversed} width={40} />
              ))}
            </View>
          )}
          {r.summary ? (
            <Text style={[type.subhead, { color: colors.muted }]} numberOfLines={3}>
              {r.summary}
            </Text>
          ) : null}
          <Caption>อ่านโดย {r.personaName}</Caption>
        </Card>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  fan: { width: 136, height: 100, marginBottom: space.sm },
  loading: { alignItems: "center", gap: space.sm, paddingVertical: space.xl },
  meta: { flexDirection: "row", alignItems: "center", gap: space.sm },
  thumbs: { flexDirection: "row", gap: 6, flexWrap: "wrap", marginVertical: 2 },
});
