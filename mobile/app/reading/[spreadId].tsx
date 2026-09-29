import { router, useLocalSearchParams } from "expo-router";
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from "react-native";
import Animated, { FadeInRight } from "react-native-reanimated";

import { Backdrop } from "@/components/glass";
import { AskStep } from "@/components/reading/AskStep";
import { FlowHeader } from "@/components/reading/FlowHeader";
import { ReaderStep } from "@/components/reading/ReaderStep";
import { RevealStep } from "@/components/reading/RevealStep";
import { ResultStep } from "@/components/reading/ResultStep";
import { RitualStep } from "@/components/reading/RitualStep";
import { Button, Caption, ErrorNote, StickyBar, ToneContext } from "@/components/ui";
import { useSession } from "@/lib/auth/session";
import { allFlipped, canConfirmPick, needsExitConfirm, type Step, type Topic } from "@/lib/reading-flow";
import { useReadingFlow } from "@/lib/useReadingFlow";
import { colors, GUTTER, space, spreadTitle } from "@/lib/theme";
import { getSpread } from "@core/data/spreads";

const TOPICS: Topic[] = ["general", "love", "work", "money", "self"];

/**
 * พิธีเปิดไพ่ 5 ขั้น (ดู mobile/DESIGN.md ข้อ 3) — เป็น Full-screen Modal ไม่มี Tab Bar
 * ตัวขั้นตอนอยู่ที่ `lib/reading-flow.ts` (ทดสอบได้) · เรียกหลังบ้านที่ `lib/useReadingFlow.ts`
 *
 * กฎเหล็กที่ถือ: ข้อ 4 ไพ่คว่ำเสมอ ผู้ใช้พลิกเอง · ข้อ 6 สายด่วน 1323 · ข้อ 14 ห้ามกุไพ่
 */
export default function ReadingScreen() {
  const params = useLocalSearchParams<{ spreadId: string; topic?: string; q?: string }>();
  const spread = getSpread(params.spreadId);
  const { token } = useSession();

  if (!spread) {
    return (
      <View style={styles.center}>
        <ErrorNote>ไม่พบผังนี้ กรุณากลับไปเลือกผังใหม่อีกครั้ง</ErrorNote>
        <Button title="กลับ" variant="ghost" onPress={() => router.back()} />
      </View>
    );
  }

  return (
    <Flow
      key={spread.id}
      spread={spread}
      signedIn={!!token}
      init={{
        topic: TOPICS.includes(params.topic as Topic) ? (params.topic as Topic) : undefined,
        question: typeof params.q === "string" ? params.q : undefined,
      }}
    />
  );
}

function Flow({
  spread,
  signedIn,
  init,
}: {
  spread: NonNullable<ReturnType<typeof getSpread>>;
  signedIn: boolean;
  init: { topic?: Topic; question?: string };
}) {
  const { state, dispatch, busy, needsSignIn, verified, start, confirmPick, read } = useReadingFlow(spread, init);
  const need = spread.positions.length;
  const step: Step = state.streaming ? "result" : state.step;
  // จังหวะพิธี (ตั้งจิต · เลือก · เปิด) เปลี่ยนฉากเป็นโทนค่ำ — ถามและอ่านคำทำนายเป็นโทนกลางวัน อ่านง่ายกว่า
  const night = step === "ritual" || step === "reveal";

  const close = () => {
    if (!needsExitConfirm(state) && !state.streaming) return router.back();
    Alert.alert("ออกจากพิธีเปิดไพ่?", "ออกตอนนี้ไพ่ที่เลือกไว้จะหาย และต้องเริ่มใหม่", [
      { text: "อยู่ต่อ", style: "cancel" },
      { text: "ออก", style: "destructive", onPress: () => router.back() },
    ]);
  };

  const back = (): (() => void) | undefined => {
    if (state.streaming) return undefined;
    if (step === "reader") return () => dispatch({ type: "goto", step: "ask" });
    if (step === "ritual" && state.ritualPhase === "focus") return () => dispatch({ type: "goto", step: "reader" });
    return undefined;
  };

  const footer = (() => {
    switch (step) {
      case "ask":
        return <Button title="ต่อไป: เลือกแม่หมอ" onPress={() => dispatch({ type: "goto", step: "reader" })} />;
      case "reader":
        return (
          <>
            {state.error ? <ErrorNote>{state.error}</ErrorNote> : null}
            {needsSignIn ? <Button title="เข้าสู่ระบบเพื่อเปิดไพ่" onPress={() => router.push("/login")} /> : null}
            {signedIn && needsSignIn ? <Caption>เข้าสู่ระบบแล้ว กดปุ่มด้านล่างเพื่อลองอีกครั้ง</Caption> : null}
            <Button title="ต่อไป: ตั้งจิตและเลือกไพ่" onPress={() => void start()} loading={busy} />
          </>
        );
      case "ritual":
        if (state.ritualPhase === "focus") return null;
        return (
          <>
            {state.error ? <ErrorNote>{state.error}</ErrorNote> : null}
            <Button
              title={canConfirmPick(state, need) ? "ยืนยันไพ่ที่เลือก" : `เลือกอีก ${need - state.picked.length} ใบ`}
              onPress={() => void confirmPick()}
              disabled={!canConfirmPick(state, need)}
              loading={busy}
            />
          </>
        );
      case "reveal":
        return (
          <>
            {state.error ? <ErrorNote>{state.error}</ErrorNote> : null}
            {needsSignIn ? <Button title="เข้าสู่ระบบเพื่ออ่านไพ่" onPress={() => router.push("/login")} /> : null}
            <Button
              title={allFlipped(state) ? "ให้แม่หมออ่านไพ่" : `พลิกไพ่อีก ${(state.shuffle?.cards.length ?? need) - state.flipped.length} ใบ`}
              onPress={() => void read()}
              disabled={!allFlipped(state)}
            />
          </>
        );
      case "result":
        if (state.streaming) return null;
        return (
          <View style={{ flexDirection: "row", gap: space.sm }}>
            <Button title="กลับหน้าแรก" variant="secondary" flex onPress={() => router.dismissAll()} />
            <Button title="เปิดไพ่ใหม่" flex onPress={() => router.replace("/read")} />
          </View>
        );
    }
  })();

  return (
    <ToneContext.Provider value={night ? "night" : "day"}>
      <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <Backdrop night={night} />
        <FlowHeader title={spreadTitle(spread.nameTh)} step={step} onClose={close} onBack={back()} />
        <ScrollView
          key={step + state.ritualPhase}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
        >
          <Animated.View entering={FadeInRight.duration(240)} style={{ gap: space.md + 4 }}>
            {step === "ask" && <AskStep spread={spread} state={state} dispatch={dispatch} onChangeSpread={() => router.replace("/read")} />}
            {step === "reader" && <ReaderStep personaId={state.personaId} dispatch={dispatch} />}
            {step === "ritual" && <RitualStep spread={spread} state={state} dispatch={dispatch} />}
            {step === "reveal" && <RevealStep spread={spread} state={state} dispatch={dispatch} />}
            {step === "result" && <ResultStep spread={spread} state={state} verified={verified} />}
          </Animated.View>
        </ScrollView>
        {footer ? <StickyBar>{footer}</StickyBar> : null}
      </KeyboardAvoidingView>
    </ToneContext.Provider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.canvas },
  content: { paddingHorizontal: GUTTER, paddingTop: space.sm, paddingBottom: space.xl },
  center: { flex: 1, backgroundColor: colors.canvas, padding: space.md, gap: space.md, justifyContent: "center" },
});
