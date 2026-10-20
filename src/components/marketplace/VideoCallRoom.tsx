"use client";

import { useCallback, useEffect, useId, useRef, useState, type ReactNode } from "react";

import { Button } from "@/components/ui/Button";
import { ThaiPhrases } from "@/components/ui/ThaiPhrases";
import { BeautyFilter, isBeautyFilterSupported, isBeautyLevel, type BeautyLevel } from "@/lib/marketplace/beauty-filter";
import {
  CALL_QUALITY_LABEL,
  classifyCallQuality,
  decideRecovery,
  lossRatio,
  type CallQuality,
  type PacketCounters,
} from "@/lib/marketplace/call-recovery";
import type { CallReport } from "@/lib/marketplace/call-metrics";
import type { CallRole, CallView } from "@/lib/marketplace/call.repo";
import type { IceServerConfig } from "@/lib/marketplace/turn";
import { STORAGE_KEYS } from "@/lib/storage/keys";

/**
 * 📹 ห้องวิดีโอคอลตัวต่อตัว ลูกค้า ↔ แม่หมอ (ใช้ร่วมกันทั้งสองฝั่ง)
 * ---------------------------------------------------------------------------
 * - **บังคับผ่าน TURN** (`iceTransportPolicy: "relay"`) — สองฝั่งไม่เห็น IP ของกันและกัน
 *   เซิร์ฟเวอร์ล้าง SDP ซ้ำอีกชั้น (`sanitizeRelaySdp`) เผื่อไคลเอนต์ถูกดัดแปลง
 * - **ล็อกภาพไว้ที่ 720p** + เพดานบิตเรต 1.5 Mbps — คุมให้อยู่ในโควตาฟรีของ Cloudflare
 *   (ราว 1.35 GB/ชม. ทั้งสองฝั่งรวมกัน) — ห้ามปลดเพดานโดยไม่คำนวณโควตาใหม่
 * - นัดเชื่อมสายผ่าน `/api/marketplace/calls/[ticketId]` แบบถามสถานะเป็นระยะ (ไม่ใช้ WebSocket)
 * - **ต่อสายใหม่อัตโนมัติ** เมื่อเน็ตสะดุด — ฝั่งลูกค้าเป็นคนสั่งฝั่งเดียว (กติกาเต็มใน `call-recovery.ts`)
 *   ปุ่ม "ต่อสายใหม่" ยังอยู่เป็นทางสำรอง · บอกคุณภาพสาย ดี/พอใช้/อ่อน จาก `getStats()` ในเครื่อง
 * - ออกจากห้อง ➔ ส่ง "สรุปสาย" ครั้งเดียว (ตัวเลขล้วน ไม่มีข้อมูลส่วนตัว) ลง Analytics Engine (`call-metrics.ts`)
 *   ลูกค้า = ฝั่งเสนอ (offer) · แม่หมอ = ฝั่งตอบ (answer) · `round` เปลี่ยน = เริ่มต่อสายใหม่
 * - ไม่บันทึกภาพ เสียง หรือบทสนทนาใด ๆ
 */

/** ขนาดภาพที่ล็อกไว้ (720p) — ใช้ซ้ำตอนสลับกล้อง ห้ามปลดเพดานโดยไม่คำนวณโควตา TURN ใหม่ */
const VIDEO_SIZE: MediaTrackConstraints = {
  width: { ideal: 1280, max: 1280 },
  height: { ideal: 720, max: 720 },
  frameRate: { ideal: 24, max: 30 },
};
const VIDEO_CONSTRAINTS: MediaTrackConstraints = { ...VIDEO_SIZE, facingMode: "user" };
const AUDIO_CONSTRAINTS: MediaTrackConstraints = {
  echoCancellation: true,
  noiseSuppression: true,
  autoGainControl: true,
};
const MAX_VIDEO_BITRATE = 1_500_000;
const MAX_AUDIO_BITRATE = 64_000;

const POLL_NEGOTIATING_MS = 1500;
const POLL_CONNECTED_MS = 4000;
const ICE_GATHER_TIMEOUT_MS = 6000;

type LinkState = "negotiating" | "connected" | "reconnecting" | "failed";

/** ระดับฟิลเตอร์หน้าสวย — ป้ายสั้นพอวางสี่ปุ่มในแถวเดียวบนจอ 360px */
const BEAUTY_OPTIONS: { value: BeautyLevel; label: string }[] = [
  { value: "off", label: "ปิด" },
  { value: "natural", label: "ธรรมชาติ" },
  { value: "smooth", label: "เนียน" },
  { value: "glow", label: "เนียนใส" },
];
/** จัดจอ: สองฝั่งเท่ากัน · อีกฝั่งใหญ่ · ภาพของฉันใหญ่ */
type CallLayout = "split" | "peer" | "self";
type Phase = "idle" | "starting" | "live" | "ended" | "error";

interface EngineOptions {
  endpoint: string;
  role: CallRole;
  headers: HeadersInit;
  iceServers: IceServerConfig[];
  stream: MediaStream;
  onRemoteStream: (stream: MediaStream) => void;
  onLink: (state: LinkState) => void;
  onPeerPresence: (present: boolean) => void;
  onEnded: (endedBy: CallRole | null) => void;
  onError: (message: string) => void;
  onQuality: (quality: CallQuality | null) => void;
}

function waitForIceGathering(pc: RTCPeerConnection): Promise<void> {
  if (pc.iceGatheringState === "complete") return Promise.resolve();
  return new Promise((resolve) => {
    const done = () => {
      clearTimeout(timer);
      pc.removeEventListener("icegatheringstatechange", onChange);
      resolve();
    };
    const onChange = () => {
      if (pc.iceGatheringState === "complete") done();
    };
    const timer = setTimeout(done, ICE_GATHER_TIMEOUT_MS);
    pc.addEventListener("icegatheringstatechange", onChange);
  });
}

/**
 * เน็ตช้าแล้วจะยอมเสียอะไรก่อน — ฝั่งแม่หมอส่งภาพไพ่ ต้องคมไว้ก่อน (ยอมให้เฟรมกระตุก)
 * ฝั่งลูกค้าส่งภาพหน้า ต้องขยับลื่นไว้ก่อน (ยอมให้ภาพเบลอ)
 */
function videoHintFor(role: CallRole): "detail" | "motion" {
  return role === "reader" ? "detail" : "motion";
}

function applyVideoHint(track: MediaStreamTrack, role: CallRole): void {
  if (track.kind === "video" && "contentHint" in track) track.contentHint = videoHintFor(role);
}

/** เพดานบิตเรตต่อแทร็ก — ภาพ 1.5 Mbps · เสียง 64 kbps (เบราว์เซอร์ที่ไม่รองรับก็แค่ข้าม) */
async function capBitrate(pc: RTCPeerConnection, role: CallRole): Promise<void> {
  for (const sender of pc.getSenders()) {
    if (!sender.track) continue;
    try {
      const params = sender.getParameters() as RTCRtpSendParameters & { degradationPreference?: string };
      if (!params.encodings || params.encodings.length === 0) params.encodings = [{}];
      params.encodings[0].maxBitrate = sender.track.kind === "video" ? MAX_VIDEO_BITRATE : MAX_AUDIO_BITRATE;
      if (sender.track.kind === "video") {
        params.degradationPreference = role === "reader" ? "maintain-resolution" : "maintain-framerate";
      }
      await sender.setParameters(params);
    } catch {
      // Firefox รุ่นเก่าไม่ให้ตั้ง encodings ก่อนเจรจาเสร็จ — ภาพยังถูกล็อก 720p จาก getUserMedia อยู่ดี
    }
  }
}

/** ตัวคุมสายหนึ่งสาย — แยกจาก React เพื่อไม่ให้ effect ที่รันซ้ำสร้างการเชื่อมต่อซ้อน */
class CallEngine {
  private pc: RTCPeerConnection | null = null;
  private round = 0;
  private offeredRound = 0;
  private appliedAnswerRound = 0;
  private answeredRound = 0;
  private connected = false;
  private busy = false;
  private stopped = false;
  private timer: ReturnType<typeof setTimeout> | null = null;
  // ── ต่อสายใหม่อัตโนมัติ (ใช้จริงเฉพาะฝั่งลูกค้า — ดู call-recovery.ts) ──
  private peerPresent = false;
  private roundStartedAt = Date.now();
  private lostAt: number | null = null;
  private failed = false;
  private lastRestartAt: number | null = null;
  private attempts = 0;
  private gaveUp = false;
  private restarting = false;
  private networkReturned = false;
  // ── คุณภาพสาย ──
  private lastPackets: PacketCounters | null = null;
  // ── สรุปสาย (ส่งครั้งเดียวตอนออกจากห้อง) ──
  private readonly joinedAt = Date.now();
  private connectedSince: number | null = null;
  private hadLoss = false;
  private reported = false;
  private readonly report: CallReport = {
    firstConnectMs: -1,
    connectedMs: 0,
    autoRestarts: 0,
    manualRestarts: 0,
    recoveries: 0,
    gaveUps: 0,
    drops: 0,
    qualityGood: 0,
    qualityFair: 0,
    qualityWeak: 0,
    peerSeen: false,
  };

  constructor(private readonly o: EngineOptions) {}

  start(initial: CallView): void {
    window.addEventListener("online", this.onOnline);
    window.addEventListener("pagehide", this.sendReport);
    void this.handle(initial).finally(() => this.schedule());
  }

  /** เน็ตกลับมา ➔ ถามสถานะทันที · ฝั่งลูกค้าต่อสายใหม่เลยถ้ายังไม่ติด (นับรอบใหม่) */
  private onOnline = (): void => {
    if (this.stopped) return;
    this.networkReturned = true;
    this.attempts = 0;
    this.gaveUp = false;
    if (this.timer) clearTimeout(this.timer);
    void this.tick();
  };

  /** ปุ่ม "ต่อสายใหม่" — สั่งรอบใหม่ทันทีและนับจำนวนครั้งอัตโนมัติใหม่ */
  async manualRestart(): Promise<void> {
    this.report.manualRestarts += 1;
    this.attempts = 0;
    this.gaveUp = false;
    this.lastRestartAt = Date.now();
    this.o.onLink("negotiating");
    const res = await this.post({ action: "restart" });
    if (!res.ok) throw new Error(`restart failed: ${res.status}`);
  }

  /**
   * สลับกล้องกลางสาย — แทนแทร็กภาพบนสายเดิม ไม่ต้องเจรจาใหม่ (replaceTrack)
   * สายรอบถัดไป (ต่อสายใหม่) หยิบแทร็กจาก `o.stream` ซึ่งผู้เรียกเปลี่ยนแทร็กในนั้นแล้ว
   */
  async replaceVideoTrack(track: MediaStreamTrack): Promise<void> {
    applyVideoHint(track, this.o.role);
    const sender = this.pc?.getSenders().find((s) => s.track?.kind === "video");
    if (sender) await sender.replaceTrack(track);
  }

  stop(): void {
    this.sendReport();
    this.stopped = true;
    window.removeEventListener("online", this.onOnline);
    window.removeEventListener("pagehide", this.sendReport);
    if (this.timer) clearTimeout(this.timer);
    this.timer = null;
    this.closePc();
  }

  /** ส่งสรุปสายครั้งเดียว — keepalive ให้ไปถึงแม้หน้ากำลังปิด · พลาดก็ไม่เป็นไร */
  private sendReport = (): void => {
    if (this.reported) return;
    this.reported = true;
    this.markDisconnected();
    void fetch(this.o.endpoint, {
      method: "POST",
      keepalive: true,
      headers: { ...this.o.headers, "Content-Type": "application/json" },
      body: JSON.stringify({ as: this.o.role, action: "report", ...this.report }),
    }).catch(() => undefined);
  };

  /** ปิดช่วง "ติดอยู่" — รวมเวลาที่ติดเข้าสรุป */
  private markDisconnected(): void {
    if (this.connectedSince === null) return;
    this.report.connectedMs += Date.now() - this.connectedSince;
    this.connectedSince = null;
    this.hadLoss = true;
  }

  async post(body: Record<string, unknown>): Promise<Response> {
    return fetch(this.o.endpoint, {
      method: "POST",
      headers: { ...this.o.headers, "Content-Type": "application/json" },
      body: JSON.stringify({ as: this.o.role, ...body }),
    });
  }

  private schedule(): void {
    if (this.stopped) return;
    this.timer = setTimeout(() => void this.tick(), this.connected ? POLL_CONNECTED_MS : POLL_NEGOTIATING_MS);
  }

  private async tick(): Promise<void> {
    try {
      const res = await fetch(`${this.o.endpoint}?as=${this.o.role}`, { headers: this.o.headers, cache: "no-store" });
      if (res.ok) {
        const json = (await res.json()) as { call: CallView };
        await this.handle(json.call);
        await this.maybeRecover();
        await this.sampleQuality();
      } else if (res.status === 404) {
        this.o.onEnded(null);
        this.stop();
      }
    } catch {
      // เน็ตสะดุดชั่วคราว — ถามใหม่รอบหน้า
    } finally {
      this.schedule();
    }
  }

  private async handle(call: CallView): Promise<void> {
    if (this.stopped) return;
    if (call.ended) {
      this.o.onEnded(call.endedBy);
      this.stop();
      return;
    }
    this.peerPresent = call.peerPresent;
    if (call.peerPresent) this.report.peerSeen = true;
    this.o.onPeerPresence(call.peerPresent);
    if (this.busy) return;
    this.busy = true;
    try {
      if (call.round !== this.round) {
        this.round = call.round;
        // อีกฝั่งสั่งต่อสายใหม่ขณะเรายังติดอยู่ = นับเป็นการหลุดหนึ่งครั้ง
        if (this.connected) this.report.drops += 1;
        this.markDisconnected();
        this.closePc();
        this.connected = false;
        this.roundStartedAt = Date.now();
        this.lostAt = null;
        this.failed = false;
        this.o.onLink(this.attempts > 0 ? "reconnecting" : "negotiating");
      }
      if (this.o.role === "customer") {
        if (this.offeredRound !== this.round) {
          await this.sendOffer();
        } else if (
          call.answer &&
          this.appliedAnswerRound !== this.round &&
          this.pc?.signalingState === "have-local-offer"
        ) {
          await this.pc.setRemoteDescription({ type: "answer", sdp: call.answer });
          this.appliedAnswerRound = this.round;
        }
      } else if (call.offer && this.answeredRound !== this.round) {
        await this.sendAnswer(call.offer);
      }
    } catch (err) {
      console.warn("[VideoCall] negotiation error", err);
      this.failed = true;
      this.reportLost();
    } finally {
      this.busy = false;
    }
  }

  /** สายหลุด — ฝั่งลูกค้าที่ยังต่อใหม่เองได้บอก "กำลังเชื่อมต่อใหม่" · หมดทางแล้ว/ฝั่งแม่หมอบอก "หลุด" */
  private reportLost(): void {
    const autoRecovering = this.o.role === "customer" && !this.gaveUp;
    this.o.onLink(this.failed && !autoRecovering ? "failed" : "reconnecting");
  }

  /** ฝั่งลูกค้าเท่านั้น — ตัดสินว่าถึงเวลาต่อสายใหม่เองหรือยัง */
  private async maybeRecover(): Promise<void> {
    if (this.o.role !== "customer" || this.stopped || this.restarting || this.gaveUp) return;
    const decision = decideRecovery({
      now: Date.now(),
      connected: this.connected,
      roundStartedAt: this.roundStartedAt,
      lostAt: this.lostAt,
      failed: this.failed,
      lastRestartAt: this.lastRestartAt,
      attempts: this.attempts,
      peerPresent: this.peerPresent,
      online: navigator.onLine !== false,
      networkReturned: this.networkReturned,
    });
    if (decision === "give-up") {
      this.report.gaveUps += 1;
      this.gaveUp = true;
      this.failed = true;
      this.o.onLink("failed");
      return;
    }
    if (decision !== "restart") return;
    this.restarting = true;
    this.networkReturned = false;
    this.attempts += 1;
    this.report.autoRestarts += 1;
    this.lastRestartAt = Date.now();
    this.o.onLink("reconnecting");
    try {
      await this.post({ action: "restart" });
    } catch {
      // เน็ตยังไม่กลับ — รอบหน้าลองใหม่ตามระยะเว้น
    } finally {
      this.restarting = false;
    }
  }

  /** วัดคุณภาพสายจาก getStats() ในเครื่อง (ไม่ยิงอะไรออกเน็ต) — ทุกรอบถามสถานะตอนสายติด */
  private async sampleQuality(): Promise<void> {
    const pc = this.pc;
    if (!pc || !this.connected) {
      this.lastPackets = null;
      this.o.onQuality(null);
      return;
    }
    try {
      const report = await pc.getStats();
      let rtt: number | null = null;
      const cur: PacketCounters = { received: 0, lost: 0 };
      report.forEach((s: Record<string, unknown>) => {
        if (s.type === "candidate-pair" && s.state === "succeeded" && s.nominated && typeof s.currentRoundTripTime === "number") {
          rtt = s.currentRoundTripTime;
        } else if (s.type === "inbound-rtp") {
          cur.received += typeof s.packetsReceived === "number" ? s.packetsReceived : 0;
          cur.lost += typeof s.packetsLost === "number" ? s.packetsLost : 0;
        }
      });
      const loss = lossRatio(this.lastPackets, cur);
      this.lastPackets = cur;
      if (this.pc !== pc) return;
      const quality = classifyCallQuality(rtt, loss);
      if (quality === "good") this.report.qualityGood += 1;
      else if (quality === "fair") this.report.qualityFair += 1;
      else this.report.qualityWeak += 1;
      this.o.onQuality(quality);
    } catch {
      // เบราว์เซอร์ไม่ให้สถิติ — ไม่โชว์ป้ายคุณภาพ ไม่กระทบสาย
    }
  }

  private createPc(): RTCPeerConnection {
    this.closePc();
    const pc = new RTCPeerConnection({
      iceServers: this.o.iceServers,
      // 🔒 หัวใจของการซ่อน IP — ห้ามเปลี่ยนเป็น "all"
      iceTransportPolicy: "relay",
      bundlePolicy: "max-bundle",
    });
    for (const track of this.o.stream.getTracks()) {
      applyVideoHint(track, this.o.role);
      pc.addTrack(track, this.o.stream);
    }
    pc.ontrack = (e) => {
      if (this.pc === pc) this.o.onRemoteStream(e.streams[0] ?? new MediaStream([e.track]));
    };
    pc.onconnectionstatechange = () => {
      if (this.pc !== pc) return;
      if (pc.connectionState === "connected") {
        const now = Date.now();
        if (this.report.firstConnectMs < 0) this.report.firstConnectMs = now - this.joinedAt;
        if (this.hadLoss) this.report.recoveries += 1;
        this.hadLoss = false;
        if (this.connectedSince === null) this.connectedSince = now;
        this.connected = true;
        this.lostAt = null;
        this.failed = false;
        this.attempts = 0;
        this.lastRestartAt = null;
        this.gaveUp = false;
        this.networkReturned = false;
        this.o.onLink("connected");
      } else if (pc.connectionState === "disconnected") {
        // ถามสถานะถี่ขึ้นระหว่างกู้สาย · จดเวลาที่เริ่มหลุดไว้ให้ตัวตัดสินต่อใหม่
        if (this.connected) {
          this.lostAt = Date.now();
          this.report.drops += 1;
        }
        this.markDisconnected();
        this.connected = false;
        this.reportLost();
      } else if (pc.connectionState === "failed") {
        if (this.connected) {
          this.lostAt = Date.now();
          this.report.drops += 1;
        }
        this.markDisconnected();
        this.connected = false;
        this.failed = true;
        this.reportLost();
      }
    };
    this.pc = pc;
    return pc;
  }

  private closePc(): void {
    if (!this.pc) return;
    const pc = this.pc;
    this.pc = null;
    this.lastPackets = null;
    pc.ontrack = null;
    pc.onconnectionstatechange = null;
    pc.close();
  }

  private async sendOffer(): Promise<void> {
    const round = this.round;
    const pc = this.createPc();
    await pc.setLocalDescription(await pc.createOffer());
    await waitForIceGathering(pc);
    await capBitrate(pc, this.o.role);
    if (this.stopped || round !== this.round || this.pc !== pc) return;
    await this.sendSdp("offer", round, pc);
    this.offeredRound = round;
  }

  private async sendAnswer(offerSdp: string): Promise<void> {
    const round = this.round;
    const pc = this.createPc();
    await pc.setRemoteDescription({ type: "offer", sdp: offerSdp });
    await pc.setLocalDescription(await pc.createAnswer());
    await waitForIceGathering(pc);
    await capBitrate(pc, this.o.role);
    if (this.stopped || round !== this.round || this.pc !== pc) return;
    await this.sendSdp("answer", round, pc);
    this.answeredRound = round;
  }

  private async sendSdp(action: "offer" | "answer", round: number, pc: RTCPeerConnection): Promise<void> {
    const sdp = pc.localDescription?.sdp ?? "";
    if (!/\styp\srelay(\s|$)/m.test(sdp)) {
      this.o.onError("เชื่อมต่อเซิร์ฟเวอร์วิดีโอไม่สำเร็จ ลองเปลี่ยนเครือข่าย (เช่นสลับ Wi-Fi/เน็ตมือถือ) แล้วต่อสายใหม่");
      throw new Error("no relay candidate");
    }
    const res = await this.post({ action, round, sdp });
    // 409 = รอบเปลี่ยนแล้ว (อีกฝั่งเพิ่งต่อสายใหม่) — รอบหน้าจะเห็นรอบใหม่เอง ไม่ต้องทำอะไร
    if (!res.ok && res.status !== 409) throw new Error(`signal ${action} failed: ${res.status}`);
  }
}

function mediaErrorMessage(err: unknown): string {
  const name = err instanceof DOMException ? err.name : "";
  if (name === "NotAllowedError" || name === "SecurityError") {
    return "ยังไม่ได้อนุญาตให้ใช้กล้องและไมโครโฟน กรุณากดอนุญาตในเบราว์เซอร์ แล้วลองใหม่อีกครั้ง";
  }
  if (name === "NotFoundError" || name === "OverconstrainedError") {
    return "ไม่พบกล้องหรือไมโครโฟนในเครื่องนี้";
  }
  if (name === "NotReadableError") {
    return "กล้องหรือไมโครโฟนกำลังถูกแอปอื่นใช้อยู่ กรุณาปิดแอปนั้นแล้วลองใหม่";
  }
  return "เปิดกล้องไม่สำเร็จ กรุณาลองใหม่อีกครั้ง";
}

export interface VideoCallRoomProps {
  ticketId: string;
  role: CallRole;
  /** ชื่ออีกฝั่ง (ชื่อแม่หมอ หรือชื่อเล่นลูกค้า) */
  peerName: string;
  /** โทเคนแม่หมอ (หน้าแผงแม่หมอส่งเป็น Bearer) — ฝั่งลูกค้าใช้คุกกี้ ไม่ต้องส่ง */
  authToken?: string | null;
  onClose?: () => void;
  /** วางอยู่ในการ์ดของหน้าอยู่แล้ว — ไม่ต้องมีกรอบการ์ดซ้อนอีกชั้น และไม่ต้องมีหัวข้อซ้ำ */
  embedded?: boolean;
  /** รูปของอีกฝั่ง (ถ้ามี) — แสดงบนเวทีก่อนเข้าห้อง */
  peerAvatarUrl?: string | null;
  /**
   * ทางแก้ที่แสดงใต้ข้อความผิดพลาดเมื่อเปิดกล้องไม่สำเร็จ — หน้าคิวส่งปุ่ม "เปิดใน Safari/Chrome"
   * มาให้ตอนลูกค้าเปิดอยู่ในเบราว์เซอร์ของแอป (LINE · Facebook · IG · TikTok ขอกล้องไม่ได้ในบางเครื่อง)
   */
  mediaHelp?: ReactNode;
}

export function VideoCallRoom({
  ticketId,
  role,
  peerName,
  authToken,
  onClose,
  embedded = false,
  peerAvatarUrl = null,
  mediaHelp = null,
}: VideoCallRoomProps) {
  const shell = embedded ? "" : "altar-card-porcelain p-5";
  const endpoint = `/api/marketplace/calls/${encodeURIComponent(ticketId)}`;
  const headers: HeadersInit = authToken ? { Authorization: `Bearer ${authToken}` } : {};

  const [phase, setPhase] = useState<Phase>("idle");
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [link, setLink] = useState<LinkState>("negotiating");
  const [peerPresent, setPeerPresent] = useState(false);
  const [endedBy, setEndedBy] = useState<CallRole | null>(null);
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [quality, setQuality] = useState<CallQuality | null>(null);
  /*
   * 🎴 จัดจอ (เจ้าของสั่ง 2026-10-11: "แม่หมอเวลาเปิดไพ่ต้องเห็นไพ่ตัวเองในกล้อง แต่ภาพตัวเองอันเล็ก")
   * แม่หมอเริ่มที่ "สองฝั่งเท่ากัน" — เห็นภาพตัวเองใหญ่พอจัดไพ่ให้อยู่ในกรอบ · ลูกค้าเริ่มที่ "แม่หมอใหญ่"
   */
  const [layout, setLayout] = useState<CallLayout>(role === "reader" ? "split" : "peer");
  /*
   * ภาพกระจก (กลับซ้าย-ขวา) เฉพาะ "ภาพของฉัน" บนจอเราเอง — อีกฝั่งได้ภาพจริงเสมอ
   * แม่หมอเริ่มแบบไม่กลับด้าน = เห็นตัวหนังสือบนไพ่แบบเดียวกับที่ลูกค้าเห็น · ลูกค้าเริ่มแบบกระจก (คุ้นเหมือนกล้องหน้า)
   */
  const [mirrorPref, setMirrorPref] = useState(role !== "reader");
  const [videoInputs, setVideoInputs] = useState<MediaDeviceInfo[]>([]);
  const [switching, setSwitching] = useState(false);
  /** ทิศของกล้องจริง (ไม่ใช่ภาพที่แต่งแล้ว) — กล้องหลังไม่ต้องกลับด้าน */
  const [rawFacing, setRawFacing] = useState<string | undefined>(undefined);
  /*
   * ✦ ฟิลเตอร์หน้าสวย (เจ้าของสั่ง 2026-10-12: "ใส่แล้วหน้าจะได้สวย ๆ มีผิวด้วย") — เฉพาะแม่หมอ
   * แต่งภาพในเครื่องแม่หมอเอง (`beauty-filter.ts`) แล้วส่งภาพที่แต่งแล้วให้ลูกค้า
   * ภาพ "คุณ" บนจอแม่หมอคือภาพเดียวกับที่ลูกค้าเห็น · จำระดับที่เลือกไว้ต่อเครื่อง
   */
  const canBeautify = role === "reader";
  const [beautySupported, setBeautySupported] = useState(false);
  const [beauty, setBeauty] = useState<BeautyLevel>("off");
  const [beautyNote, setBeautyNote] = useState<string | null>(null);
  const beautyLabelId = useId();

  const engineRef = useRef<CallEngine | null>(null);
  /** แทร็กจากกล้อง/ไมค์จริง — เจ้าของแทร็ก (หยุดตอนวางสาย · สลับกล้อง) */
  const streamRef = useRef<MediaStream | null>(null);
  /** สิ่งที่ส่งให้อีกฝั่ง: เสียงจริง + ภาพจากกล้องตรง ๆ หรือภาพที่แต่งแล้ว — สายรอบใหม่หยิบแทร็กจากตัวนี้ */
  const sendStreamRef = useRef<MediaStream | null>(null);
  const filterRef = useRef<BeautyFilter | null>(null);
  /** คิวเปลี่ยนระดับฟิลเตอร์ — กดรัว ๆ ต้องไม่สร้างฟิลเตอร์ซ้อนกัน */
  const beautyChainRef = useRef<Promise<void>>(Promise.resolve());
  const camOnRef = useRef(true);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  /*
   * รุ่นของ "การถือกล้อง" — เพิ่มทุกครั้งที่ปล่อยกล้อง (วางสาย · สายจบ · ออกจากหน้า)
   * งานที่รอ await อยู่ (ขออนุญาตกล้อง · เข้าห้อง · สลับกล้อง) เทียบรุ่นก่อนใช้ผล
   * ไม่งั้นกล้องที่เพิ่งได้มาหลังวางสาย/ออกจากหน้าแล้ว จะเปิดค้างโดยไม่มีใครปิด (ไฟกล้องไม่ดับ)
   */
  const mediaGenRef = useRef(0);

  const releaseMedia = useCallback(() => {
    mediaGenRef.current += 1;
    engineRef.current?.stop();
    engineRef.current = null;
    filterRef.current?.stop();
    filterRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    sendStreamRef.current = null;
    setLocalStream(null);
    setRemoteStream(null);
    setQuality(null);
  }, []);

  useEffect(() => {
    if (!canBeautify) return;
    setBeautySupported(isBeautyFilterSupported());
    try {
      const saved = window.localStorage.getItem(STORAGE_KEYS.readerBeautyLevel);
      if (isBeautyLevel(saved)) setBeauty(saved);
    } catch {
      // โหมดส่วนตัว/บล็อกที่เก็บข้อมูล — เริ่มที่ปิดฟิลเตอร์
    }
  }, [canBeautify]);

  /** เปลี่ยนภาพที่ส่งให้อีกฝั่ง (กล้องตรง ↔ ภาพที่แต่งแล้ว) บนสายเดิม + ภาพตัวอย่างบนจอเรา */
  const setOutgoingVideo = useCallback(async (track: MediaStreamTrack) => {
    const send = sendStreamRef.current;
    if (!send) return;
    const old = send.getVideoTracks()[0];
    if (old !== track) {
      if (old) send.removeTrack(old);
      send.addTrack(track);
      track.enabled = camOnRef.current;
      await engineRef.current?.replaceVideoTrack(track).catch(() => undefined);
    }
    // อ็อบเจกต์ใหม่ทุกครั้ง — วิดีโอบนจอถึงจะรับแทร็กใหม่แน่นอน
    setLocalStream(new MediaStream(send.getTracks()));
  }, []);

  /**
   * เปิด/เปลี่ยน/ปิดฟิลเตอร์จริง (เรียกผ่านคิว `beautyChainRef` เท่านั้น)
   * เครื่องที่ทำไม่ได้ หรือทำแล้วภาพที่ส่งออกดำ ➔ กลับไปส่งภาพกล้องตรง ๆ ทันที ลูกค้าไม่เห็นจอดำ
   */
  const applyBeauty = useCallback(
    async (level: BeautyLevel) => {
      const raw = streamRef.current?.getVideoTracks()[0];
      if (level === "off") {
        const filter = filterRef.current;
        filterRef.current = null;
        if (raw) await setOutgoingVideo(raw);
        filter?.stop();
        return;
      }
      if (filterRef.current) {
        filterRef.current.setLevel(level);
        return;
      }
      if (!raw) return; // ยังไม่เข้าห้อง — จำไว้ เปิดให้ตอนเข้าห้อง
      const filter = await BeautyFilter.create(raw, level);
      if (!filter) {
        setBeauty("off");
        setBeautyNote("เครื่องนี้ใช้ฟิลเตอร์ไม่ได้ — ลูกค้าเห็นภาพจากกล้องตามปกติ");
        return;
      }
      if (!streamRef.current) {
        filter.stop(); // วางสายไประหว่างเตรียมฟิลเตอร์
        return;
      }
      filterRef.current = filter;
      await setOutgoingVideo(filter.track);
      void filter.verify().then(async (ok) => {
        if (ok || filterRef.current !== filter) return;
        filterRef.current = null;
        const camera = streamRef.current?.getVideoTracks()[0];
        if (camera) await setOutgoingVideo(camera);
        filter.stop();
        setBeauty("off");
        setBeautyNote("ฟิลเตอร์ทำให้ภาพดำบนเครื่องนี้ — ปิดให้แล้ว ลูกค้าเห็นภาพจากกล้องตามปกติ");
      });
    },
    [setOutgoingVideo],
  );

  const queueBeauty = useCallback(
    (level: BeautyLevel) => {
      const next = beautyChainRef.current.then(() => applyBeauty(level)).catch(() => undefined);
      beautyChainRef.current = next;
      return next;
    },
    [applyBeauty],
  );

  const chooseBeauty = (level: BeautyLevel) => {
    setBeauty(level);
    setBeautyNote(null);
    try {
      window.localStorage.setItem(STORAGE_KEYS.readerBeautyLevel, level);
    } catch {
      // จำไม่ได้ก็ไม่เป็นไร — ใช้ได้ในสายนี้
    }
    void queueBeauty(level);
  };

  /*
   * แท็บถูกซ่อน (สลับไปแท็บอื่นบนคอม) = ฟิลเตอร์หยุดวาด ภาพที่ลูกค้าเห็นจะค้าง
   * ➔ ระหว่างซ่อนส่งภาพกล้องตรง ๆ แทน กลับมาที่แท็บแล้วแต่งต่อ
   */
  useEffect(() => {
    if (phase !== "live") return;
    const onVisibility = () => {
      const filter = filterRef.current;
      const camera = streamRef.current?.getVideoTracks()[0];
      if (!filter || !camera) return;
      if (document.visibilityState === "hidden") {
        filter.pause();
        void setOutgoingVideo(camera);
      } else {
        filter.resume();
        void setOutgoingVideo(filter.track);
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [phase, setOutgoingVideo]);

  // ออกจากหน้า = ปล่อยกล้อง/ไมค์และหยุดถามสถานะ (ไฟกล้องต้องดับทันที)
  useEffect(() => releaseMedia, [releaseMedia]);

  useEffect(() => {
    if (localVideoRef.current) localVideoRef.current.srcObject = localStream;
  }, [localStream]);

  useEffect(() => {
    const el = remoteVideoRef.current;
    if (!el) return;
    el.srcObject = remoteStream;
    if (remoteStream) void el.play().catch(() => undefined);
  }, [remoteStream]);

  const start = async () => {
    setError(null);
    setEndedBy(null);
    setPhase("starting");
    const gen = mediaGenRef.current;
    if (typeof RTCPeerConnection === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setError("เบราว์เซอร์นี้ไม่รองรับวิดีโอคอล กรุณาเปิดด้วย Chrome, Safari หรือ Firefox รุ่นล่าสุด");
      setPhase("error");
      return;
    }

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ video: VIDEO_CONSTRAINTS, audio: AUDIO_CONSTRAINTS });
    } catch (err) {
      if (gen !== mediaGenRef.current) return;
      setError(mediaErrorMessage(err));
      setPhase("error");
      return;
    }
    // ออกจากหน้า/ยกเลิกระหว่างรอผู้ใช้กดอนุญาตกล้อง ➔ ปิดกล้องที่เพิ่งได้มาทันที
    if (gen !== mediaGenRef.current) {
      stream.getTracks().forEach((t) => t.stop());
      return;
    }
    streamRef.current = stream;
    const send = new MediaStream(stream.getTracks());
    sendStreamRef.current = send;
    setLocalStream(send);
    setRawFacing(stream.getVideoTracks()[0]?.getSettings().facingMode);
    setMicOn(true);
    setCamOn(true);
    camOnRef.current = true;
    // ✦ ฟิลเตอร์ที่เลือกไว้ — เปิดก่อนเริ่มสาย ภาพแรกที่ลูกค้าเห็นจึงแต่งแล้ว
    if (canBeautify && beauty !== "off" && isBeautyFilterSupported()) await queueBeauty(beauty);
    // รายชื่อกล้อง (ได้ชื่อครบหลังอนุญาตแล้วเท่านั้น) — มีมากกว่าหนึ่งตัวถึงจะโชว์ปุ่ม "สลับกล้อง"
    void navigator.mediaDevices
      .enumerateDevices?.()
      .then((list) => setVideoInputs(list.filter((d) => d.kind === "videoinput")))
      .catch(() => undefined);

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({ as: role, action: "join" }),
      });
      const json = (await res.json().catch(() => ({}))) as {
        iceServers?: IceServerConfig[];
        call?: CallView;
        error?: string;
      };
      if (gen !== mediaGenRef.current) return; // ปล่อยกล้องไปแล้วระหว่างรอเข้าห้อง — ห้ามเริ่มสายที่ไม่มีใครถือ
      if (!res.ok || !json.iceServers || !json.call) {
        throw new Error(json.error || "เข้าห้องไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
      }

      const engine = new CallEngine({
        endpoint,
        role,
        headers,
        iceServers: json.iceServers,
        stream: send,
        onRemoteStream: setRemoteStream,
        onLink: setLink,
        onPeerPresence: setPeerPresent,
        onEnded: (by) => {
          setEndedBy(by);
          releaseMedia();
          setPhase("ended");
        },
        onError: setError,
        onQuality: setQuality,
      });
      engineRef.current = engine;
      setLink("negotiating");
      setPhase("live");
      engine.start(json.call);
    } catch (err) {
      if (gen !== mediaGenRef.current) return;
      releaseMedia();
      setError(err instanceof Error ? err.message : "เข้าห้องไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
      setPhase("error");
    }
  };

  const hangUp = async () => {
    const engine = engineRef.current;
    releaseMedia();
    setEndedBy(role);
    setPhase("ended");
    try {
      if (engine) await engine.post({ action: "end" });
    } catch {
      // ไม่เป็นไร — อีกฝั่งจะเห็นว่าเราออกจากห้องเองภายใน 15 วินาที และ TURN หมดอายุเองตาม TTL
    }
  };

  const reconnect = async () => {
    setError(null);
    try {
      await engineRef.current?.manualRestart();
    } catch {
      setError("ต่อสายใหม่ไม่สำเร็จ กรุณาตรวจสอบอินเทอร์เน็ต");
    }
  };

  const toggleMic = () => {
    const next = !micOn;
    streamRef.current?.getAudioTracks().forEach((t) => (t.enabled = next));
    setMicOn(next);
  };

  const toggleCam = () => {
    const next = !camOn;
    camOnRef.current = next;
    streamRef.current?.getVideoTracks().forEach((t) => (t.enabled = next));
    // ภาพที่แต่งแล้วเป็นอีกแทร็กหนึ่ง — ต้องปิดด้วย ไม่งั้นลูกค้ายังเห็นเฟรมสุดท้าย
    sendStreamRef.current?.getVideoTracks().forEach((t) => (t.enabled = next));
    setCamOn(next);
  };

  /**
   * 📷 สลับกล้อง (หน้า ↔ หลัง บนมือถือ · กล้องตัวอื่นบนคอม เช่นกล้องที่ตั้งส่องโต๊ะไพ่)
   * - แทนแทร็กบนสายเดิม ไม่ต้องวางสายหรือเจรจาใหม่
   * - ปล่อยกล้องเดิมก่อนเปิดตัวใหม่ (มือถือหลายรุ่นเปิดสองกล้องพร้อมกันไม่ได้) — เปิดไม่ได้ ➔ คืนกล้องเดิม
   */
  const switchCamera = async () => {
    const stream = streamRef.current;
    if (!stream || switching || videoInputs.length < 2) return;
    setSwitching(true);
    setError(null);
    const gen = mediaGenRef.current;
    const current = stream.getVideoTracks()[0] ?? null;
    const currentId = current?.getSettings().deviceId;
    const at = videoInputs.findIndex((d) => d.deviceId === currentId);
    const next = videoInputs[(at + 1) % videoInputs.length];
    const acquire = async (deviceId: string | undefined) => {
      const fresh = await navigator.mediaDevices.getUserMedia({
        video: deviceId ? { ...VIDEO_SIZE, deviceId: { exact: deviceId } } : VIDEO_CONSTRAINTS,
        audio: false,
      });
      return fresh.getVideoTracks()[0];
    };
    current?.stop();
    let track: MediaStreamTrack | undefined;
    let fellBack = false;
    try {
      track = await acquire(next.deviceId);
    } catch {
      fellBack = true;
      track = await acquire(currentId).catch(() => undefined);
    }
    // วางสาย/ออกจากหน้าระหว่างรอกล้องตัวใหม่ ➔ ปิดทิ้งทันที ห้ามเปิดค้างหลังจบสาย
    if (gen !== mediaGenRef.current) {
      track?.stop();
      setSwitching(false); // ไม่งั้นเข้าห้องรอบหน้าแล้วปุ่มสลับกล้องกดไม่ได้อีกเลย
      return;
    }
    if (fellBack) {
      setError(track ? "สลับกล้องไม่สำเร็จ ใช้กล้องเดิมต่อ" : "เปิดกล้องไม่สำเร็จ กดสลับกล้องอีกครั้ง หรือปิดแอปอื่นที่ใช้กล้องอยู่");
    }
    if (track) {
      track.enabled = camOn;
      if (current) stream.removeTrack(current);
      stream.addTrack(track);
      setRawFacing(track.getSettings().facingMode);
      // เปิดฟิลเตอร์อยู่ = ภาพที่ส่งยังเป็นแทร็กเดิมของฟิลเตอร์ แค่เปลี่ยนกล้องที่ป้อนเข้า
      if (filterRef.current) await filterRef.current.setSource(track);
      else await setOutgoingVideo(track);
    }
    setSwitching(false);
  };

  // ── ก่อนเข้าห้อง: ขอความยินยอม (ลูกค้า) / ปุ่มเข้าห้อง (แม่หมอ) ─────────────────────
  if (phase === "idle" || phase === "error" || phase === "ended") {
    const isCustomer = role === "customer";
    return (
      <section aria-label="วิดีโอคอล" className={`${shell} space-y-4 text-left font-serif-th`}>
        {/* ห้องรอก่อนเข้า (แบบ Meet/FaceTime) — เห็นว่ากำลังจะคุยกับใคร ก่อนเปิดกล้องจริง */}
        {phase === "idle" && (
          <div aria-hidden="true" className="consult-stage relative aspect-[16/10] rounded-2xl grid place-items-center overflow-hidden">
            <div className="relative grid place-items-center">
              <span className="absolute h-28 w-28 rounded-full border border-gold-on-dark/40 animate-ping [animation-duration:2.6s]" />
              <div className="h-24 w-24 rounded-full ring-2 ring-gold-on-dark/60 bg-gold-on-dark/15 overflow-hidden grid place-items-center text-4xl font-bold text-surface">
                {peerAvatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={peerAvatarUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  peerName.replace(/^คุณ/, "").charAt(0).toUpperCase()
                )}
              </div>
            </div>
            <p className="absolute bottom-4 inset-x-4 text-center text-sm text-surface">
              {peerName}
            </p>
          </div>
        )}
        {phase === "ended" ? (
          <p className="text-sm font-semibold text-ink">
            {endedBy === role ? "คุณวางสายแล้ว" : endedBy ? `${peerName} วางสายแล้ว` : "สายนี้จบแล้ว"}
          </p>
        ) : (
          !embedded && <h3 className="font-bold text-base text-ink">วิดีโอคอลกับ{peerName}</h3>
        )}

        {error && (
          <p role="alert" className="text-sm text-err">
            {error}
          </p>
        )}
        {phase === "error" && mediaHelp}

        {!isCustomer && phase === "idle" && (
          <p className="rounded-xl bg-inset-warm/70 p-3.5 text-[13px] leading-relaxed text-ink">
            ก่อนเข้าห้อง: ตั้งกล้องให้เห็นโต๊ะไพ่ทั้งหมด · ในห้องกด &quot;ภาพฉันใหญ่&quot; เพื่อเช็กว่าไพ่อยู่ในกรอบ
            และกด &quot;สลับกล้อง&quot; ได้ถ้ามีกล้องหลังหรือกล้องอีกตัว
            {beautySupported && " · เลือก \"ฟิลเตอร์หน้าสวย\" ได้ในห้อง (ระบบจำไว้ให้ครั้งหน้า)"}
          </p>
        )}

        {isCustomer && phase === "idle" && (
          <div className="space-y-3 text-[13px] leading-relaxed">
            <label className="flex items-start gap-3 rounded-xl border border-line bg-surface p-3.5 text-sm text-ink cursor-pointer">
              <input
                type="checkbox"
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
                className="mt-0.5 h-5 w-5 shrink-0 accent-gold-ink"
              />
              <span><ThaiPhrases>ฉันยินยอมให้เปิดกล้องและไมโครโฟน เพื่อคุยกับแม่หมอผ่านวิดีโอคอล</ThaiPhrases></span>
            </label>
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          <Button
            variant="gold"
            size="lg"
            className="flex-1"
            disabled={isCustomer && phase === "idle" && !consent}
            onClick={() => void start()}
          >
            {phase === "idle" ? "เปิดกล้องและเข้าห้อง" : "เข้าห้องอีกครั้ง"}
          </Button>
          {onClose && (
            <Button variant="ghost" onClick={onClose}>
              ปิด
            </Button>
          )}
        </div>
      </section>
    );
  }

  // ── ในห้อง ────────────────────────────────────────────────────────────────
  const connected = link === "connected";
  const status =
    phase === "starting"
      ? "กำลังเปิดกล้อง…"
      : link === "failed"
        ? role === "customer"
          ? "ต่อสายใหม่อัตโนมัติไม่สำเร็จ ลองสลับ Wi-Fi/เน็ตมือถือ แล้วกด “ต่อสายใหม่”"
          : "สัญญาณหลุด กำลังรอลูกค้าต่อสายใหม่ หรือกด “ต่อสายใหม่”"
        : link === "reconnecting"
          ? "สัญญาณหลุด กำลังต่อสายใหม่ให้อัตโนมัติ…"
          : !connected && !peerPresent
            ? `รอ${peerName}เข้าห้อง…`
            : !connected
              ? "กำลังเชื่อมต่อ…"
              : null;

  // กล้องหลัง (ส่องโต๊ะ) ไม่ต้องกลับด้านเลย · กล้องหน้าตามที่ผู้ใช้เลือก (ดูจากกล้องจริง ไม่ใช่ภาพที่แต่งแล้ว)
  const facing = rawFacing;
  const mirrorOn = facing === "environment" ? false : mirrorPref;
  const peerShort = role === "reader" ? "ลูกค้า" : "แม่หมอ";

  /*
   * 🎴 เวทีวิดีโอ — วิดีโอสองตัว "อยู่ที่เดิมเสมอ" เปลี่ยนแค่ตำแหน่ง/ขนาดด้วยคลาส (ไม่ถอดใส่ใหม่ ภาพไม่ดับตอนจัดจอ)
   * ⚠️ object-contain ทั้งสองภาพ: เห็นทั้งเฟรมที่กล้องส่งจริง — เดิม object-cover ตัดขอบภาพแนวนอน
   *    ไพ่ที่วางริมโต๊ะจึงหลุดกรอบทั้งบนจอแม่หมอและจอลูกค้า (เจ้าของสั่งปรับมุมกล้อง 2026-10-11)
   */
  const BIG = "inset-0 h-full w-full";
  const PIP = "bottom-3 right-3 z-10 h-auto w-32 aspect-video rounded-xl border border-white/40 shadow-lg sm:w-48";
  const SPLIT_A = "left-0 top-0 h-1/2 w-full sm:h-full sm:w-1/2";
  const SPLIT_B = "bottom-0 left-0 h-1/2 w-full sm:left-1/2 sm:h-full sm:w-1/2";
  const peerPos = layout === "split" ? SPLIT_A : layout === "peer" ? BIG : PIP;
  const selfPos = layout === "split" ? SPLIT_B : layout === "self" ? BIG : PIP;
  const tileLabel = "pointer-events-none absolute left-2 top-2 z-20 rounded-full bg-black/55 px-2 py-0.5 text-[12px] text-white";

  // ป้ายสั้นพอไม่หักกลางคำบนจอ 360px (ปุ่มละ ~100px) · บรรทัดรองบอกว่าใช้ตอนไหน
  const layoutOptions: { value: CallLayout; label: string; hint?: string }[] = [
    { value: "split", label: "เห็นเท่ากัน" },
    { value: "self", label: "ภาพฉันใหญ่", hint: role === "reader" ? "ตอนเปิดไพ่" : undefined },
    { value: "peer", label: `${peerShort}ใหญ่` },
  ];

  return (
    <section
      aria-label={`วิดีโอคอลกับ${peerName}`}
      className={`${embedded ? "" : "altar-card-porcelain p-2 sm:p-4"} w-full max-w-4xl mx-auto space-y-3 font-serif-th`}
    >
      {/* สูงไม่เกิน 70% ของจอ — จอกว้างแบบเดสก์ท็อปไม่ให้ภาพดันปุ่มวางสายตกขอบล่าง */}
      <div className="keep-dark relative w-full aspect-[3/4] sm:aspect-video max-h-[70svh] rounded-2xl bg-ink-deep overflow-hidden">
        <div className={`absolute bg-black ${peerPos} ${layout === "self" ? "overflow-hidden" : ""}`}>
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            aria-label={`ภาพจาก${peerName}`}
            className={`h-full w-full object-contain ${connected ? "" : "opacity-0"}`}
          />
          {status && (
            <p
              role="status"
              className={`absolute inset-0 flex items-center justify-center text-center text-white ${
                layout === "self" ? "p-2 text-[12px] leading-snug" : "p-4 text-sm"
              }`}
            >
              {status}
            </p>
          )}
          {/* กรอบเล็กมุมจอ + มีข้อความสถานะ (ซึ่งมีชื่ออีกฝั่งอยู่แล้ว) ➔ ไม่ต้องมีป้ายชื่อซ้อน — เดิมสองข้อความทับกัน */}
          {!(status && layout === "self") && <span className={tileLabel}>{peerName}</span>}
          {connected && quality && layout !== "self" && (
            <span
              className={`pointer-events-none absolute right-2 top-2 z-20 rounded-full px-2 py-0.5 text-[12px] ${
                quality === "weak" ? "bg-err text-surface" : "bg-black/55 text-white"
              }`}
            >
              {CALL_QUALITY_LABEL[quality]}
            </span>
          )}
        </div>
        <div className={`absolute bg-black ${selfPos} ${layout === "peer" ? "overflow-hidden" : ""}`}>
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            aria-label="ภาพจากกล้องของคุณ"
            className={`h-full w-full object-contain ${mirrorOn ? "-scale-x-100" : ""} ${camOn ? "" : "opacity-30"}`}
          />
          <span className={tileLabel}>คุณ{camOn ? "" : " · ปิดกล้อง"}</span>
        </div>
      </div>

      {error && (
        <p role="alert" className="text-sm text-err">
          {error}
        </p>
      )}

      {/* จัดจอ — แม่หมอเลือก "ภาพของฉันใหญ่" ตอนเปิดไพ่ จะเห็นไพ่ในกล้องเต็มตาเหมือนที่ลูกค้าเห็น */}
      <div role="radiogroup" aria-label="จัดจอวิดีโอ" className="grid grid-cols-3 gap-1.5 rounded-2xl bg-inset-warm/70 p-1.5">
        {layoutOptions.map((opt) => {
          const active = layout === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => setLayout(opt.value)}
              className={`flex min-h-[44px] flex-col items-center justify-center rounded-xl px-1.5 py-1 text-[13px] font-semibold leading-tight transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-ink ${
                active ? "bg-surface text-ink-deep shadow-sm ring-1 ring-gold-ink" : "text-muted hover:text-ink-deep"
              }`}
            >
              <span>{opt.label}</span>
              {opt.hint && <span className="text-[11px] font-normal">{opt.hint}</span>}
            </button>
          );
        })}
      </div>

      {/* ✦ ฟิลเตอร์หน้าสวย (แม่หมอ) — ภาพ "คุณ" บนจอคือภาพที่ลูกค้าเห็นจริง เลือกแล้วดูผลได้ทันที */}
      {canBeautify && beautySupported && (
        <div className="space-y-1.5">
          <p id={beautyLabelId} className="px-1 text-[12px] font-semibold text-ink">
            ฟิลเตอร์หน้าสวย <span className="font-normal text-muted">· ลูกค้าเห็นภาพที่แต่งแล้ว</span>
          </p>
          <div role="radiogroup" aria-labelledby={beautyLabelId} className="grid grid-cols-4 gap-1.5 rounded-2xl bg-inset-warm/70 p-1.5">
            {BEAUTY_OPTIONS.map((opt) => {
              const active = beauty === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => chooseBeauty(opt.value)}
                  className={`flex min-h-[44px] items-center justify-center rounded-xl px-1 text-[13px] font-semibold leading-tight transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-ink ${
                    active ? "bg-surface text-ink-deep shadow-sm ring-1 ring-gold-ink" : "text-muted hover:text-ink-deep"
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>
      )}
      {beautyNote && (
        <p role="status" className="text-[12px] text-err">
          {beautyNote}
        </p>
      )}

      {/* มือถือ: ไมค์/กล้องแถวบน · วางสายเต็มแถวล่าง — ห้ามให้คำว่า "วางสาย" ถูกตัดกลางคำ */}
      <div className="grid grid-cols-2 gap-2 whitespace-nowrap sm:flex">
        <Button variant="outline" aria-pressed={!micOn} onClick={toggleMic}>
          {micOn ? "ปิดไมค์" : "เปิดไมค์"}
        </Button>
        <Button variant="outline" aria-pressed={!camOn} onClick={toggleCam}>
          {camOn ? "ปิดกล้อง" : "เปิดกล้อง"}
        </Button>
        {videoInputs.length >= 2 && (
          <Button variant="outline" onClick={() => void switchCamera()} disabled={switching}>
            {switching ? "กำลังสลับ…" : "สลับกล้อง"}
          </Button>
        )}
        {facing !== "environment" && (
          <Button variant="outline" aria-pressed={mirrorOn} onClick={() => setMirrorPref((v) => !v)}>
            {mirrorOn ? "ภาพกระจก: เปิด" : "ภาพกระจก: ปิด"}
          </Button>
        )}
        {(link === "failed" || link === "reconnecting") && (
          <Button variant="outline" className="col-span-2" onClick={() => void reconnect()}>
            ต่อสายใหม่
          </Button>
        )}
        <Button variant="gold" className="col-span-2 sm:flex-1 !bg-err !text-surface" onClick={() => void hangUp()}>
          วางสาย
        </Button>
      </div>
      <p className="text-[12px] leading-relaxed text-muted">
        {role === "reader"
          ? 'ตอนเปิดไพ่ กด "ภาพฉันใหญ่" แล้วจัดไพ่ให้อยู่ในกรอบ — ภาพบนจอคือภาพเต็มที่ลูกค้าเห็น · ภาพกระจกปิด = ตัวหนังสือบนไพ่ไม่กลับด้าน · มีกล้องหลายตัว (เช่นกล้องหลังมือถือส่องโต๊ะ) กด "สลับกล้อง" · ฟิลเตอร์เกลี่ยเฉพาะผิว เส้นบนไพ่ยังคม'
          : "ภาพกระจกมีผลแค่จอของคุณ แม่หมอเห็นภาพจริงเสมอ"}
      </p>
    </section>
  );
}
