import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useRef, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { CardBack } from "@/components/CardBack";
import { CardImageNative } from "@/components/CardImageNative";
import { NightSky } from "@/components/glass";
import { Button, ToneContext } from "@/components/ui";
import { markOnboardingSeen } from "@/lib/onboarding";
import { GUTTER, night, shadow, space, type } from "@/lib/theme";
import { PERSONAS } from "@core/data/personas";

/**
 * หน้าแนะนำแอป 3 หน้า (เปิดครั้งแรกครั้งเดียว) — แพทเทิร์นจาก Co–Star บน Mobbin:
 * หนึ่งหน้า = หนึ่งประโยคใหญ่ serif + ภาพเดียว · ปุ่มหลักติดล่างจอ · "ข้าม" มุมขวาบนตลอด
 * ทุกประโยคเป็นข้อเท็จจริงของระบบ (ไพ่ 1909 · ล็อกผลสับก่อนเลือก · แม่หมอ 5 ท่าน) ไม่ใช่คำโฆษณาลอย ๆ
 */
const SLIDES = [
  {
    eyebrow: "SeerTarot",
    title: "ไพ่ทาโรต์ 1909\nของแท้ ครบ 78 ใบ",
    body: "ภาพต้นฉบับ Rider-Waite พร้อมความหมาย 5 ด้าน เปิดอ่านได้แม้ไม่มีเน็ต",
    art: "cards" as const,
  },
  {
    eyebrow: "โปร่งใสทุกใบ",
    title: "คุณเลือกเอง\nพลิกเองทุกใบ",
    body: "ระบบล็อกผลสับไว้ก่อนคุณเลือกไพ่ แล้วเครื่องของคุณตรวจซ้ำได้ว่าไม่มีใครแอบเปลี่ยน",
    art: "deck" as const,
  },
  {
    eyebrow: "แม่หมอของคุณ",
    title: `แม่หมอ ${PERSONAS.length} น้ำเสียง\nเลือกคนที่ใจอยากฟัง`,
    body: "อบอุ่น เป็นกันเอง หรือพูดตรงไม่อ้อมค้อม คำถามเดียวกันแต่ได้มุมมองต่างกัน",
    art: "readers" as const,
  },
];

const cardIdOf = (image: string) => image.replace(/\.\w+$/, "");

function Art({ kind }: { kind: (typeof SLIDES)[number]["art"] }) {
  if (kind === "cards") {
    return (
      <View style={styles.art}>
        {[
          { id: "major-02", deg: -14, x: -78, y: 18 },
          { id: "major-19", deg: 14, x: 78, y: 18 },
          { id: "major-17", deg: 0, x: 0, y: 0 },
        ].map((c) => (
          <View key={c.id} style={[styles.artCard, { transform: [{ translateX: c.x }, { translateY: c.y }, { rotate: `${c.deg}deg` }] }]}>
            <CardImageNative cardId={c.id} width={118} />
          </View>
        ))}
      </View>
    );
  }
  if (kind === "deck") {
    return (
      <View style={styles.art}>
        {[-24, -12, 0, 12, 24].map((deg, i) => (
          <View
            key={deg}
            style={[styles.artCard, { zIndex: i === 2 ? 5 : i, transform: [{ translateX: (i - 2) * 34 }, { translateY: i === 2 ? -26 : Math.abs(i - 2) * 8 }, { rotate: `${deg}deg` }] }]}
          >
            <CardBack width={96} height={164} selected={i === 2} label={i === 2 ? "✦" : undefined} />
          </View>
        ))}
        <View style={styles.seal}>
          <Ionicons name="shield-checkmark" size={26} color={night.base} />
        </View>
      </View>
    );
  }
  return (
    <View style={[styles.art, styles.readers]}>
      {PERSONAS.map((p, i) => (
        <View key={p.id} style={[styles.artCard, { position: "relative", transform: [{ translateY: i % 2 ? 14 : -6 }] }]}>
          <CardImageNative cardId={cardIdOf(p.cardImage)} width={60} />
        </View>
      ))}
    </View>
  );
}

export default function Onboarding() {
  const { width } = useWindowDimensions();
  const { top, bottom } = useSafeAreaInsets();
  const [page, setPage] = useState(0);
  const scroller = useRef<ScrollView>(null);
  const last = page === SLIDES.length - 1;

  const finish = async () => {
    await markOnboardingSeen();
    router.back();
  };
  const next = () => {
    if (last) return void finish();
    scroller.current?.scrollTo({ x: width * (page + 1), animated: true });
    setPage(page + 1);
  };

  return (
    <ToneContext.Provider value="night">
      <View style={styles.root}>
        <NightSky />
        <View style={[styles.top, { paddingTop: top + space.sm }]}>
          <Pressable onPress={() => void finish()} hitSlop={12} accessibilityRole="button" accessibilityLabel="ข้ามหน้าแนะนำ">
            <Text style={[type.subhead, { color: night.textSoft, fontWeight: "600" }]}>ข้าม</Text>
          </Pressable>
        </View>

        <ScrollView
          ref={scroller}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={(e) => setPage(Math.round(e.nativeEvent.contentOffset.x / width))}
          style={{ flex: 1 }}
        >
          {SLIDES.map((s, i) => (
            <View key={s.title} style={[styles.slide, { width }]} accessibilityElementsHidden={i !== page}>
              <Art kind={s.art} />
              <Animated.View entering={FadeIn.duration(400)} style={styles.copy}>
                <Text style={[type.eyebrow, { color: night.gold, textAlign: "center" }]}>{s.eyebrow}</Text>
                <Text style={[type.title, styles.title]} accessibilityRole="header">
                  {s.title}
                </Text>
                <Text style={[type.callout, styles.body]}>{s.body}</Text>
              </Animated.View>
            </View>
          ))}
        </ScrollView>

        <View style={[styles.bottom, { paddingBottom: Math.max(bottom, space.md) + space.sm }]}>
          <View style={styles.dots} accessibilityLabel={`หน้า ${page + 1} จาก ${SLIDES.length}`}>
            {SLIDES.map((_, i) => (
              <View key={i} style={[styles.dot, i === page && styles.dotOn]} />
            ))}
          </View>
          <Button title={last ? "เริ่มเปิดไพ่" : "ต่อไป"} icon={last ? "sparkles" : undefined} onPress={next} />
        </View>
      </View>
    </ToneContext.Provider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: night.base },
  top: { flexDirection: "row", justifyContent: "flex-end", paddingHorizontal: GUTTER, zIndex: 2 },
  slide: { flex: 1, justifyContent: "center", paddingHorizontal: GUTTER + 8, gap: space.xl },
  art: { height: 250, alignItems: "center", justifyContent: "center" },
  artCard: { position: "absolute", borderRadius: 10, ...shadow.glow, shadowOpacity: 0.35 },
  readers: { flexDirection: "row", gap: 10 },
  seal: {
    position: "absolute",
    zIndex: 10,
    bottom: 6,
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: night.gold,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: night.base,
  },
  copy: { gap: space.sm, alignItems: "center" },
  title: { color: night.text, textAlign: "center" },
  body: { color: night.textSoft, textAlign: "center" },
  bottom: { paddingHorizontal: GUTTER, gap: space.lg },
  dots: { flexDirection: "row", justifyContent: "center", gap: 8 },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: "rgba(247,237,220,0.28)" },
  dotOn: { width: 24, backgroundColor: night.gold },
});
