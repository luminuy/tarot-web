import { router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Text, useWindowDimensions } from "react-native";

import { FlipCard } from "@/components/FlipCard";
import { Body, Button, ErrorNote, H1, Panel, Screen } from "@/components/ui";
import { apiJson } from "@/lib/api/client";
import { colors } from "@/lib/theme";

interface DailyCard {
  dateKey: string;
  cardId: string;
  nameTh: string;
  keywords: string[];
  element: string;
  message: string;
}

export default function TodayScreen() {
  const { width } = useWindowDimensions();
  const [daily, setDaily] = useState<DailyCard | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    try {
      setDaily(await apiJson<DailyCard>("/api/daily-card"));
    } catch (e) {
      // กฎเหล็กข้อ 14: โหลดไพ่ไม่ได้ = บอกให้โหลดใหม่ ห้ามหยิบไพ่ใบไหนมาแทน
      setDaily(null);
      setError(e instanceof Error ? e.message : "โหลดไพ่ประจำวันไม่ได้ ลองใหม่อีกครั้งนะ");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <Screen>
      <H1>ไพ่ประจำวัน</H1>
      <Body muted>แตะไพ่เพื่อเปิดดูพลังงานของวันนี้ — ไพ่ใบเดียวกันสำหรับทุกคน</Body>

      {error ? (
        <>
          <ErrorNote>{error}</ErrorNote>
          <Button title="โหลดใหม่อีกครั้ง" onPress={() => void load()} variant="ghost" />
        </>
      ) : null}

      {daily ? (
        <>
          <FlipCard
            cardId={daily.cardId}
            width={Math.min(220, width * 0.55)}
            label={revealed ? daily.nameTh : undefined}
            onFlip={() => setRevealed(true)}
          />
          {revealed ? (
            <Panel>
              <Text style={{ color: colors.goldInk, fontWeight: "600" }}>{daily.keywords.join(" · ")}</Text>
              <Body>{daily.message}</Body>
              <Button title="ดูความหมายไพ่ใบนี้" variant="ghost" onPress={() => router.push(`/card/${daily.cardId}`)} />
            </Panel>
          ) : null}
        </>
      ) : null}

      <Panel>
        <Body>อยากถามเรื่องเฉพาะตัว? เปิดไพ่กับแม่หมอได้ทันที</Body>
        <Button title="เปิดไพ่ด่วน 1 ใบ" onPress={() => router.push("/reading/quick")} />
      </Panel>
    </Screen>
  );
}
