"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";

import { Button } from "@/components/ui/Button";
import { ThaiPhrases } from "@/components/ui/ThaiPhrases";
import type { CallRole, CallView } from "@/lib/marketplace/call.repo";
import type { IceServerConfig } from "@/lib/marketplace/turn";

/**
 * 📹 ห้องวิดีโอคอลตัวต่อตัว ลูกค้า ↔ แม่หมอ (ใช้ร่วมกันทั้งสองฝั่ง)
 * ---------------------------------------------------------------------------
 * - **บังคับผ่าน TURN** (`iceTransportPolicy: "relay"`) — สองฝั่งไม่เห็น IP ของกันและกัน
 *   เซิร์ฟเวอร์ล้าง SDP ซ้ำอีกชั้น (`sanitizeRelaySdp`) เผื่อไคลเอนต์ถูกดัดแปลง
 * - **ล็อกภาพไว้ที่ 720p** + เพดานบิตเรต 1.5 Mbps — คุมให้อยู่ในโควตาฟรีของ Cloudflare
 *   (ราว 1.35 GB/ชม. ทั้งสองฝั่งรวมกัน) — ห้ามปลดเพดานโดยไม่คำนวณโควตาใหม่
 * - นัดเชื่อมสายผ่าน `/api/marketplace/calls/[ticketId]` แบบถามสถานะเป็นระยะ (ไม่ใช้ WebSocket)
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

/** เพดานบิตเรตต่อแทร็ก — ภาพ 1.5 Mbps · เสียง 64 kbps (เบราว์เซอร์ที่ไม่รองรับก็แค่ข้าม) */
async function capBitrate(pc: RTCPeerConnection): Promise<void> {
  for (const sender of pc.getSenders()) {
    if (!sender.track) continue;
    try {
      const params = sender.getParameters();
      if (!params.encodings || params.encodings.length === 0) params.encodings = [{}];
      params.encodings[0].maxBitrate = sender.track.kind === "video" ? MAX_VIDEO_BITRATE : MAX_AUDIO_BITRATE;
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

  constructor(private readonly o: EngineOptions) {}

  start(initial: CallView): void {
    void this.handle(initial).finally(() => this.schedule());
  }

  /**
   * สลับกล้องกลางสาย — แทนแทร็กภาพบนสายเดิม ไม่ต้องเจรจาใหม่ (replaceTrack)
   * สายรอบถัดไป (ต่อสายใหม่) หยิบแทร็กจาก `o.stream` ซึ่งผู้เรียกเปลี่ยนแทร็กในนั้นแล้ว
   */
  async replaceVideoTrack(track: MediaStreamTrack): Promise<void> {
    const sender = this.pc?.getSenders().find((s) => s.track?.kind === "video");
    if (sender) await sender.replaceTrack(track);
  }

  stop(): void {
    this.stopped = true;
    if (this.timer) clearTimeout(this.timer);
    this.timer = null;
    this.closePc();
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
    this.o.onPeerPresence(call.peerPresent);
    if (this.busy) return;
    this.busy = true;
    try {
      if (call.round !== this.round) {
        this.round = call.round;
        this.closePc();
        this.connected = false;
        this.o.onLink("negotiating");
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
      this.o.onLink("failed");
    } finally {
      this.busy = false;
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
    for (const track of this.o.stream.getTracks()) pc.addTrack(track, this.o.stream);
    pc.ontrack = (e) => {
      if (this.pc === pc) this.o.onRemoteStream(e.streams[0] ?? new MediaStream([e.track]));
    };
    pc.onconnectionstatechange = () => {
      if (this.pc !== pc) return;
      if (pc.connectionState === "connected") {
        this.connected = true;
        this.o.onLink("connected");
      } else if (pc.connectionState === "disconnected") {
        this.o.onLink("reconnecting");
      } else if (pc.connectionState === "failed") {
        this.connected = false;
        this.o.onLink("failed");
      }
    };
    this.pc = pc;
    return pc;
  }

  private closePc(): void {
    if (!this.pc) return;
    const pc = this.pc;
    this.pc = null;
    pc.ontrack = null;
    pc.onconnectionstatechange = null;
    pc.close();
  }

  private async sendOffer(): Promise<void> {
    const round = this.round;
    const pc = this.createPc();
    await pc.setLocalDescription(await pc.createOffer());
    await waitForIceGathering(pc);
    await capBitrate(pc);
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
    await capBitrate(pc);
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

  const engineRef = useRef<CallEngine | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  const releaseMedia = useCallback(() => {
    engineRef.current?.stop();
    engineRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setLocalStream(null);
    setRemoteStream(null);
  }, []);

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
    if (typeof RTCPeerConnection === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setError("เบราว์เซอร์นี้ไม่รองรับวิดีโอคอล กรุณาเปิดด้วย Chrome, Safari หรือ Firefox รุ่นล่าสุด");
      setPhase("error");
      return;
    }

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ video: VIDEO_CONSTRAINTS, audio: AUDIO_CONSTRAINTS });
    } catch (err) {
      setError(mediaErrorMessage(err));
      setPhase("error");
      return;
    }
    streamRef.current = stream;
    setLocalStream(stream);
    setMicOn(true);
    setCamOn(true);
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
      if (!res.ok || !json.iceServers || !json.call) {
        throw new Error(json.error || "เข้าห้องไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
      }

      const engine = new CallEngine({
        endpoint,
        role,
        headers,
        iceServers: json.iceServers,
        stream,
        onRemoteStream: setRemoteStream,
        onLink: setLink,
        onPeerPresence: setPeerPresent,
        onEnded: (by) => {
          setEndedBy(by);
          releaseMedia();
          setPhase("ended");
        },
        onError: setError,
      });
      engineRef.current = engine;
      setLink("negotiating");
      setPhase("live");
      engine.start(json.call);
    } catch (err) {
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
    setLink("negotiating");
    try {
      await engineRef.current?.post({ action: "restart" });
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
    streamRef.current?.getVideoTracks().forEach((t) => (t.enabled = next));
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
    try {
      track = await acquire(next.deviceId);
    } catch {
      setError("สลับกล้องไม่สำเร็จ ใช้กล้องเดิมต่อ");
      track = await acquire(currentId).catch(() => undefined);
    }
    if (track) {
      track.enabled = camOn;
      if (current) stream.removeTrack(current);
      stream.addTrack(track);
      await engineRef.current?.replaceVideoTrack(track).catch(() => undefined);
      // ภาพตัวอย่างต้องเป็นอ็อบเจกต์ใหม่ วิดีโอบนจอถึงจะรับแทร็กใหม่แน่นอน
      setLocalStream(new MediaStream(stream.getTracks()));
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
        ? "สัญญาณหลุด กด “ต่อสายใหม่” เพื่อเชื่อมต่ออีกครั้ง"
        : link === "reconnecting"
          ? "สัญญาณไม่เสถียร กำลังเชื่อมต่อใหม่…"
          : !connected && !peerPresent
            ? `รอ${peerName}เข้าห้อง…`
            : !connected
              ? "กำลังเชื่อมต่อ…"
              : null;

  // กล้องหลัง (ส่องโต๊ะ) ไม่ต้องกลับด้านเลย · กล้องหน้าตามที่ผู้ใช้เลือก
  const facing = localStream?.getVideoTracks()[0]?.getSettings().facingMode;
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
      <div className="relative w-full aspect-[3/4] sm:aspect-video max-h-[70svh] rounded-2xl bg-ink-deep overflow-hidden">
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
        <Button variant="gold" className="col-span-2 sm:flex-1 !bg-err !text-white" onClick={() => void hangUp()}>
          วางสาย
        </Button>
      </div>
      <p className="text-[12px] leading-relaxed text-muted">
        {role === "reader"
          ? 'ตอนเปิดไพ่ กด "ภาพฉันใหญ่" แล้วจัดไพ่ให้อยู่ในกรอบ — ภาพบนจอคือภาพเต็มที่ลูกค้าเห็น · ภาพกระจกปิด = ตัวหนังสือบนไพ่ไม่กลับด้าน · มีกล้องหลายตัว (เช่นกล้องหลังมือถือส่องโต๊ะ) กด "สลับกล้อง"'
          : "ภาพกระจกมีผลแค่จอของคุณ แม่หมอเห็นภาพจริงเสมอ"}
      </p>
    </section>
  );
}
