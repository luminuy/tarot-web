import { useLocalSearchParams } from "expo-router";
import { Text, useWindowDimensions, View } from "react-native";

import { CardImageNative } from "@/components/CardImageNative";
import { Body, ErrorNote, H1, Panel, Screen } from "@/components/ui";
import { cardById } from "@core/data/cards";
import { colors } from "@/lib/theme";

const CATEGORY_LABEL = {
  general: "ภาพรวม",
  love: "ความรัก",
  work: "การงาน",
  money: "การเงิน",
  self: "ตัวเอง",
} as const;

export default function CardDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { width } = useWindowDimensions();
  const card = cardById(id);

  // กฎเหล็กข้อ 14: ไม่พบไพ่ = บอกให้โหลดใหม่ ไม่กุไพ่ใบอื่นมาแทน
  if (!card) {
    return (
      <Screen>
        <ErrorNote>ไม่พบข้อมูลไพ่ใบนี้ กรุณากลับไปโหลดใหม่อีกครั้ง</ErrorNote>
      </Screen>
    );
  }

  return (
    <Screen>
      <View style={{ alignItems: "center", gap: 8 }}>
        <CardImageNative cardId={card.id} width={Math.min(240, width * 0.6)} />
        <H1>{card.nameTh}</H1>
        <Text style={{ color: colors.muted }}>{card.nameEn}</Text>
        <Text style={{ color: colors.goldInk, textAlign: "center" }}>
          ธาตุ{card.element} · {card.astrology}
        </Text>
      </View>

      <Panel>
        <Text style={{ fontWeight: "700", color: colors.ink }}>ไพ่หัวตั้ง</Text>
        <Body muted>{card.keywords.upright.join(" · ")}</Body>
        <Text style={{ fontWeight: "700", color: colors.ink, marginTop: 8 }}>ไพ่หัวกลับ</Text>
        <Body muted>{card.keywords.reversed.join(" · ")}</Body>
      </Panel>

      {(Object.keys(CATEGORY_LABEL) as (keyof typeof CATEGORY_LABEL)[]).map((key) => (
        <Panel key={key}>
          <Text style={{ fontWeight: "700", color: colors.goldInk }}>{CATEGORY_LABEL[key]}</Text>
          <Body>{card.meanings[key].upright}</Body>
          <Text style={{ fontWeight: "600", color: colors.muted, marginTop: 4 }}>เมื่อไพ่กลับหัว</Text>
          <Body muted>{card.meanings[key].reversed}</Body>
        </Panel>
      ))}

      <Panel>
        <Text style={{ fontWeight: "700", color: colors.ink }}>ตัวเลข</Text>
        <Body>{card.numerology}</Body>
      </Panel>
    </Screen>
  );
}
