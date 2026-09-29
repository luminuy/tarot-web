import * as Crypto from "expo-crypto";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useMemo, useRef, useState } from "react";
import { Linking, Pressable, StyleSheet, Text, TextInput, View, useWindowDimensions } from "react-native";

import { FlipCard } from "@/components/FlipCard";
import { Body, Button, ErrorNote, H1, Panel, Screen } from "@/components/ui";
import { ApiError, apiJson, streamReading } from "@/lib/api/client";
import type { ReadingProof, ReadingResult, ShuffleResponse, StartBlocked, StartResponse } from "@/lib/api/types";
import { useSession } from "@/lib/auth/session";
import { CRISIS_HOTLINE } from "@/lib/config";
import { verifyReadingLocal } from "@/lib/provably-fair";
import { colors, radius, space } from "@/lib/theme";
import { getSpread } from "@core/data/spreads";
import { PERSONAS } from "@core/data/personas";

type Phase = "setup" | "starting" | "pick" | "shuffling" | "reveal" | "reading" | "done";

const DECK_SIZE = 78;

function newClientSeed(): string {
  return Array.from(Crypto.getRandomBytes(32), (b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * เปิดไพ่ครบวงจร: ตั้งคำถาม → เลือกแม่หมอ → (เซิร์ฟเวอร์ประกาศคำมั่น) → เลือกไพ่เองจากสำรับคว่ำ
 * → พลิกไพ่เอง → คำอ่านสตรีม → ตรวจ Provably Fair ในเครื่อง
 *
 * กฎเหล็กที่ถือ: ข้อ 4 ไพ่คว่ำเสมอ · ข้อ 6 สายด่วน 1323 · ข้อ 14 ห้ามกุไพ่ (ข้อมูลขาด = โหลดใหม่)
 * เซิร์ฟเวอร์เป็นผู้สับเสมอ แอปส่งแค่ clientSeed + pickedIndices เหมือนเว็บ
 */
export default function ReadingScreen() {
  const { spreadId } = useLocalSearchParams<{ spreadId: string }>();
  const spread = getSpread(spreadId);
  const { token } = useSession();
  const { width } = useWindowDimensions();

  const [phase, setPhase] = useState<Phase>("setup");
  const [question, setQuestion] = useState("");
  const [personaId, setPersonaId] = useState("warm");
  const [error, setError] = useState<string | null>(null);
  const [blocked, setBlocked] = useState<string | null>(null);
  const [session, setSession] = useState<StartResponse | null>(null);
  const [picked, setPicked] = useState<number[]>([]);
  const [shuffle, setShuffle] = useState<ShuffleResponse | null>(null);
  const [flippedCount, setFlippedCount] = useState(0);
  const [text, setText] = useState<ReadingResult | null>(null);
  const [partial, setPartial] = useState<{ opening?: string; cards: ReadingResult["cards"]; connections?: string; summary?: string }>({ cards: [] });
  const [verified, setVerified] = useState<"pending" | "ok" | "fail" | null>(null);
  const clientSeed = useRef(newClientSeed());

  const need = spread?.positions.length ?? 0;

  const fail = useCallback((e: unknown) => {
    setError(e instanceof Error ? e.message : "เกิดข้อผิดพลาด โหลดใหม่อีกครั้งนะ");
    if (e instanceof ApiError && e.body.reason && /signin|sign_in|guest/i.test(e.body.reason)) {
      setPhase("setup");
    }
  }, []);

  const start = async () => {
    if (!spread) return;
    setError(null);
    setPhase("starting");
    try {
      const res = await apiJson<StartResponse | StartBlocked>("/api/reading/start", {
        method: "POST",
        body: {
          spreadId: spread.id,
          question,
          personaId,
          lang: "th",
          clientSeed: clientSeed.current,
        },
      });
      if ("blocked" in res && res.blocked) {
        setBlocked(res.message);
        setPhase("setup");
        return;
      }
      setSession(res as StartResponse);
      setPhase("pick");
    } catch (e) {
      fail(e);
      setPhase("setup");
    }
  };

  const togglePick = (index: number) => {
    void Haptics.selectionAsync();
    setPicked((cur) => {
      if (cur.includes(index)) return cur.filter((i) => i !== index);
      return cur.length >= need ? cur : [...cur, index];
    });
  };

  const confirmPick = async () => {
    if (!session) return;
    setError(null);
    setPhase("shuffling");
    try {
      const res = await apiJson<ShuffleResponse>(`/api/reading/${session.id}/shuffle`, {
        method: "POST",
        body: { clientSeed: clientSeed.current, pickedIndices: picked, sessionToken: session.sessionToken },
      });
      // กฎเหล็กข้อ 14: จำนวนไพ่ที่ได้ไม่ครบผัง = ห้ามเดา ให้โหลดใหม่
      if (res.cards.length !== need) throw new Error("ข้อมูลไพ่ไม่ครบ กรุณาโหลดใหม่อีกครั้ง");
      setSession({ ...session, sessionToken: res.sessionToken });
      setShuffle(res);
      setPhase("reveal");
    } catch (e) {
      fail(e);
      setPhase("pick");
    }
  };

  const read = async () => {
    if (!session || !shuffle) return;
    setError(null);
    setPhase("reading");
    setPartial({ cards: [] });
    let proof: ReadingProof | null = null;
    let result: ReadingResult | null = null;
    try {
      for await (const ev of streamReading(session.id, session.sessionToken)) {
        if (ev.type === "reset") setPartial({ cards: [] });
        else if (ev.type === "opening") setPartial((p) => ({ ...p, opening: ev.text }));
        else if (ev.type === "card") setPartial((p) => ({ ...p, cards: [...p.cards, ev] }));
        else if (ev.type === "connections") setPartial((p) => ({ ...p, connections: ev.text }));
        else if (ev.type === "summary") setPartial((p) => ({ ...p, summary: ev.text }));
        else if (ev.type === "error") throw new Error(ev.message);
        else if (ev.type === "done") {
          proof = ev.proof;
          result = ev.reading;
        }
      }
      // สตรีมขาดก่อน `done` = ไม่มีคำอ่านที่สมบูรณ์ ห้ามแสดงครึ่ง ๆ กลาง ๆ เป็นคำทำนาย
      if (!result || !proof) throw new Error("คำอ่านขาดตอน กรุณาโหลดใหม่อีกครั้ง");
      setText(result);
      setPhase("done");
      void verify(proof);
      void saveJournal(result);
    } catch (e) {
      fail(e);
      setPhase("reveal");
    }
  };

  const verify = async (proof: ReadingProof) => {
    if (!shuffle || !proof.clientSeed) return setVerified("fail");
    setVerified("pending");
    try {
      const r = await verifyReadingLocal({
        serverSeed: proof.serverSeed,
        clientSeed: proof.clientSeed,
        commitment: proof.commitment,
        drawn: shuffle.drawn,
        pickedIndices: proof.pickedIndices,
      });
      setVerified(r.commitmentOk && r.drawMatches ? "ok" : "fail");
    } catch {
      setVerified("fail");
    }
  };

  const saveJournal = async (result: ReadingResult) => {
    if (!token || !spread || !shuffle) return;
    const persona = PERSONAS.find((p) => p.id === personaId);
    // บันทึกสมุดเป็นงานเสริม — ล้มเหลวต้องไม่กระทบคำอ่านที่ผู้ใช้เห็นอยู่
    await apiJson("/api/journal", {
      method: "POST",
      body: {
        question: question.trim() || "ไม่ได้ระบุคำถาม",
        spreadId: spread.id,
        spreadName: spread.nameTh,
        category: spread.defaultCategory,
        personaId,
        personaName: persona?.nameTh ?? personaId,
        cards: shuffle.drawn.map((d, i) => ({
          order: d.order,
          positionName: spread.positions[i]?.nameTh ?? `ตำแหน่งที่ ${i + 1}`,
          cardIndex: d.cardIndex,
          cardNameTh: shuffle.cards[i]?.nameTh ?? "",
          cardNameEn: shuffle.cards[i]?.nameEn,
          isReversed: d.isReversed,
          element: shuffle.cards[i]?.element,
        })),
        summary: result.summary,
      },
    }).catch(() => undefined);
  };

  const fanCols = 6;
  const fanW = (width - space.md * 2 - 6 * (fanCols - 1)) / fanCols;
  const revealW = useMemo(() => Math.min(150, (width - space.md * 2 - space.md) / 2), [width]);

  if (!spread) {
    return (
      <Screen>
        <ErrorNote>ไม่พบผังนี้ กรุณากลับไปเลือกผังใหม่อีกครั้ง</ErrorNote>
      </Screen>
    );
  }

  return (
    <Screen>
      <H1>{spread.nameTh}</H1>
      {error ? <ErrorNote>{error}</ErrorNote> : null}

      {blocked ? (
        <Panel>
          <Body>{blocked}</Body>
          <Button title={`โทรสายด่วนสุขภาพจิต ${CRISIS_HOTLINE}`} onPress={() => void Linking.openURL(`tel:${CRISIS_HOTLINE}`)} />
        </Panel>
      ) : null}

      {(phase === "setup" || phase === "starting") && (
        <>
          {!token ? (
            <Panel>
              <Body>เข้าสู่ระบบก่อนเปิดไพ่ แล้วดูดวงได้ฟรีตามโควตาของวัน</Body>
              <Button title="ไปเข้าสู่ระบบ" variant="ghost" onPress={() => router.push("/account")} />
            </Panel>
          ) : null}
          <Body muted>{spread.description}</Body>
          <TextInput
            value={question}
            onChangeText={setQuestion}
            placeholder="ตั้งจิตอธิษฐาน แล้วพิมพ์คำถามของคุณ"
            placeholderTextColor={colors.muted}
            multiline
            maxLength={500}
            style={styles.question}
            accessibilityLabel="คำถาม"
          />
          <Text style={styles.label}>เลือกแม่หมอ</Text>
          {PERSONAS.map((p) => (
            <Pressable
              key={p.id}
              onPress={() => setPersonaId(p.id)}
              accessibilityRole="radio"
              accessibilityState={{ selected: personaId === p.id }}
              style={[styles.persona, personaId === p.id && styles.personaOn]}
            >
              <Text style={styles.personaName}>{p.nameTh}</Text>
              <Text style={styles.personaTag}>{p.tagline}</Text>
            </Pressable>
          ))}
          <Button title="ต่อไป — เลือกไพ่" onPress={() => void start()} loading={phase === "starting"} />
        </>
      )}

      {phase === "pick" && session && (
        <>
          <Panel>
            <Body>
              ตั้งจิตถึงคำถาม แล้วแตะเลือกไพ่ {need} ใบจากสำรับที่คว่ำอยู่ ({picked.length}/{need})
            </Body>
            <Text style={styles.commit}>คำมั่นก่อนสับ (SHA-256): {session.commitment.slice(0, 16)}…</Text>
          </Panel>
          <View style={styles.fan}>
            {Array.from({ length: DECK_SIZE }, (_, i) => {
              const order = picked.indexOf(i);
              return (
                <Pressable
                  key={i}
                  onPress={() => togglePick(i)}
                  accessibilityRole="button"
                  accessibilityLabel={order >= 0 ? `ไพ่ใบที่ ${i + 1} เลือกเป็นลำดับ ${order + 1}` : `ไพ่ใบที่ ${i + 1}`}
                  style={[styles.back, { width: fanW, height: fanW * (12 / 7) }, order >= 0 && styles.backOn]}
                >
                  <Text style={styles.backText}>{order >= 0 ? order + 1 : "✦"}</Text>
                </Pressable>
              );
            })}
          </View>
          <Button title="ยืนยันไพ่ที่เลือก" onPress={() => void confirmPick()} disabled={picked.length !== need} />
        </>
      )}

      {phase === "shuffling" && <Body muted>กำลังสับไพ่ด้วยเมล็ดสุ่มของคุณ…</Body>}

      {(phase === "reveal" || phase === "reading" || phase === "done") && shuffle && (
        <>
          <Body muted>แตะไพ่แต่ละใบเพื่อพลิกเปิดด้วยตัวเอง</Body>
          <View style={styles.reveal}>
            {shuffle.cards.map((c, i) => (
              <FlipCard
                key={`${c.id}-${i}`}
                cardId={c.id}
                reversed={shuffle.drawn[i]?.isReversed}
                width={revealW}
                label={`${spread.positions[i]?.nameTh ?? ""}\n${c.nameTh}${shuffle.drawn[i]?.isReversed ? " (กลับหัว)" : ""}`}
                onFlip={() => setFlippedCount((n) => n + 1)}
              />
            ))}
          </View>
        </>
      )}

      {phase === "reveal" && (
        <Button title="ให้แม่หมออ่านไพ่" onPress={() => void read()} disabled={flippedCount < shuffle!.cards.length} />
      )}

      {(phase === "reading" || phase === "done") && (
        <ReadingView result={text} partial={partial} streaming={phase === "reading"} />
      )}

      {phase === "done" && (
        <Panel>
          <Text style={styles.label}>ตรวจสอบความยุติธรรม (Provably Fair)</Text>
          <Body muted>
            {verified === "ok"
              ? "✦ ผ่าน — คำมั่นก่อนสับตรงกับเมล็ดที่เฉลย และคำนวณไพ่ซ้ำบนเครื่องคุณได้ผลตรงกันทุกใบ"
              : verified === "fail"
                ? "ตรวจไม่ผ่านหรือตรวจไม่ได้ กรุณาเปิดไพ่ใหม่อีกครั้ง"
                : "กำลังตรวจสอบ…"}
          </Body>
          <Button title="เปิดไพ่ใหม่" variant="ghost" onPress={() => router.replace("/read")} />
        </Panel>
      )}
    </Screen>
  );
}

function ReadingView({
  result,
  partial,
  streaming,
}: {
  result: ReadingResult | null;
  partial: { opening?: string; cards: ReadingResult["cards"]; connections?: string; summary?: string };
  streaming: boolean;
}) {
  const src = result ?? partial;
  return (
    <Panel>
      {streaming ? <Text style={styles.commit}>แม่หมอกำลังอ่านไพ่…</Text> : null}
      {src.opening ? <Body>{src.opening}</Body> : null}
      {src.cards.map((c) => (
        <View key={c.position} style={{ gap: 4 }}>
          <Text style={styles.label}>{c.headline}</Text>
          <Body>{c.reading}</Body>
        </View>
      ))}
      {src.connections ? <Body>{src.connections}</Body> : null}
      {src.summary ? (
        <>
          <Text style={styles.label}>สรุป</Text>
          <Body>{src.summary}</Body>
        </>
      ) : null}
    </Panel>
  );
}

const styles = StyleSheet.create({
  question: {
    minHeight: 96,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.lineWarm,
    backgroundColor: colors.surface,
    padding: space.md,
    color: colors.ink,
    fontSize: 16,
    textAlignVertical: "top",
  },
  label: { fontSize: 16, fontWeight: "700", color: colors.goldInk },
  persona: {
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.lineWarm,
    backgroundColor: colors.surfaceWarm,
    padding: space.md,
    gap: 2,
  },
  personaOn: { borderColor: colors.goldInk, backgroundColor: colors.insetWarm },
  personaName: { fontSize: 16, fontWeight: "600", color: colors.ink },
  personaTag: { fontSize: 13, color: colors.muted },
  commit: { fontSize: 12, color: colors.muted },
  fan: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  back: {
    borderRadius: 6,
    backgroundColor: colors.dark,
    borderWidth: 1,
    borderColor: colors.gold,
    alignItems: "center",
    justifyContent: "center",
  },
  backOn: { borderWidth: 3, borderColor: colors.goldOnDark },
  backText: { color: colors.goldOnDark, fontSize: 14, fontWeight: "700" },
  reveal: { flexDirection: "row", flexWrap: "wrap", gap: space.md, justifyContent: "center" },
});
