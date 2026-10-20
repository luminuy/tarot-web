"use client";

/**
 * ✦ ฟิลเตอร์หน้าสวยของแม่หมอในห้องวิดีโอ (เจ้าของสั่ง 2026-10-12: "ใส่แล้วหน้าจะได้สวย ๆ มีผิวด้วย")
 * ---------------------------------------------------------------------------
 * ทำในเบราว์เซอร์ของแม่หมอเองทั้งหมดด้วย WebGL — **ไม่ส่งภาพไปประมวลผลที่ไหน**
 * ลูกค้าเห็นภาพที่แต่งแล้วผ่านสายวิดีโอเดิม (แทนแทร็กด้วย `replaceTrack` ไม่ต้องต่อสายใหม่)
 *
 * หลักการแบบแอปกล้องทั่วไป:
 *   1. หาบริเวณที่เป็น "สีผิว" (ช่วงสี YCbCr แบบนุ่ม ๆ) — ฉากหลังและไพ่ส่วนใหญ่ไม่ใช่สีผิว จึงไม่ถูกแตะ
 *      (ขอบล่างของ Cr ตั้งไว้ 0.53 โดยตั้งใจ — สีครีมของพื้นไพ่ Rider-Waite อยู่ที่ราว 0.529 ต้องไม่ถูกนับเป็นผิว)
 *   2. เกลี่ยผิวให้เนียนแบบ **รักษาขอบ** (bilateral) — จุด/รอยบนผิวจางลง แต่ตา คิ้ว ปาก
 *      และเส้นบนหน้าไพ่ยังคม (สีต่างกันมาก = น้ำหนักเกือบศูนย์)
 *   3. ยกความสว่างนิด ๆ อุ่นสีเล็กน้อย (หนักที่ผิว เบาที่ฉากหลัง) และเติมเลือดฝาดบนผิว
 *
 * ⚠️ ห้ามเปลี่ยนเป็นเบลอธรรมดาทั้งภาพ — แม่หมอต้องโชว์ไพ่ให้ลูกค้าอ่านได้ชัด
 * ⚠️ ขนาดภาพไม่เกิน 1280×720 เท่ากล้อง (เพดานโควตา TURN · ดู VideoCallRoom)
 * ⚠️ แท็บถูกซ่อน = requestAnimationFrame หยุด ภาพที่ส่งจะค้าง — ผู้เรียกต้องสลับกลับไปส่งภาพกล้องตรง ๆ
 *    ระหว่างซ่อน (`pause()` / `resume()`) · VideoCallRoom ทำให้แล้ว
 */

export type BeautyLevel = "off" | "natural" | "smooth" | "glow";

const BEAUTY_LEVELS: readonly BeautyLevel[] = ["off", "natural", "smooth", "glow"];

export function isBeautyLevel(value: unknown): value is BeautyLevel {
  return typeof value === "string" && (BEAUTY_LEVELS as readonly string[]).includes(value);
}

interface BeautyParams {
  /** แรงเกลี่ยผิว 0–1 (คูณกับหน้ากากสีผิว) */
  smooth: number;
  /** ยกความสว่าง 0–0.15 */
  brighten: number;
  /** อุ่นสีทั้งภาพ 0–0.04 */
  warm: number;
  /** เลือดฝาดบนผิว 0–1 */
  rosy: number;
}

/** ค่าที่ใช้จริงของแต่ละระดับ — ปรับให้ "ยังดูเป็นคนจริง" แม้ระดับสูงสุด */
const BEAUTY_PRESETS: Record<Exclude<BeautyLevel, "off">, BeautyParams> = {
  natural: { smooth: 0.55, brighten: 0.035, warm: 0.008, rosy: 0.35 },
  smooth: { smooth: 0.85, brighten: 0.06, warm: 0.014, rosy: 0.55 },
  glow: { smooth: 1, brighten: 0.1, warm: 0.02, rosy: 0.75 },
};

const MAX_W = 1280;
const MAX_H = 720;
const CAPTURE_FPS = 30;

const VERTEX_SHADER = `
attribute vec2 a_pos;
varying vec2 v_uv;
void main() {
  v_uv = (a_pos + 1.0) * 0.5;
  gl_Position = vec4(a_pos, 0.0, 1.0);
}`;

/*
 * GLSL ES 1.0 (WebGL1) — ใช้ได้ทั้ง Safari บน iPhone และ Chrome บน Android/คอม
 * วงรอบมีจำนวนรอบคงที่ตามข้อกำหนดของ WebGL1 · 17 จุดต่อพิกเซล (กลาง + 2 วง × 8 ทิศ)
 */
const FRAGMENT_SHADER = `
precision mediump float;
uniform sampler2D u_tex;
uniform vec2 u_texel;
uniform float u_smooth;
uniform float u_brighten;
uniform float u_warm;
uniform float u_rosy;
varying vec2 v_uv;

float skinMask(vec3 c) {
  float y = dot(c, vec3(0.299, 0.587, 0.114));
  float cb = 0.5 + dot(c, vec3(-0.168736, -0.331264, 0.5));
  float cr = 0.5 + dot(c, vec3(0.5, -0.418688, -0.081312));
  float mcb = smoothstep(0.27, 0.31, cb) * (1.0 - smoothstep(0.50, 0.54, cb));
  float mcr = smoothstep(0.53, 0.57, cr) * (1.0 - smoothstep(0.68, 0.72, cr));
  float my = smoothstep(0.10, 0.20, y);
  return mcb * mcr * my;
}

void main() {
  vec3 center = texture2D(u_tex, v_uv).rgb;
  vec3 sum = center;
  float wsum = 1.0;
  for (int ring = 1; ring <= 2; ring++) {
    float radius = float(ring) * 3.0;
    float ringWeight = ring == 1 ? 1.0 : 0.75;
    for (int i = 0; i < 8; i++) {
      float a = float(i) * 0.785398 + float(ring) * 0.392699;
      vec2 off = vec2(cos(a), sin(a)) * radius * u_texel;
      vec3 s = texture2D(u_tex, v_uv + off).rgb;
      vec3 d = s - center;
      float w = exp(-dot(d, d) * 50.0) * ringWeight;
      sum += s * w;
      wsum += w;
    }
  }
  vec3 smoothed = sum / wsum;
  float m = skinMask(center);
  vec3 col = mix(center, smoothed, m * u_smooth);
  col += u_brighten * (1.0 - col) * (0.55 + 0.45 * m);
  float warmth = u_warm * (0.35 + 0.65 * m);
  col.r += warmth;
  col.b -= warmth * 0.6;
  col = mix(col, col * vec3(1.035, 0.99, 0.995), m * u_rosy);
  gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}`;

let supportCache: boolean | null = null;

/** เบราว์เซอร์นี้ทำฟิลเตอร์ได้ไหม (WebGL + จับภาพจาก canvas เป็นสตรีม) — ไม่ได้ = ซ่อนปุ่มฟิลเตอร์ */
export function isBeautyFilterSupported(): boolean {
  if (supportCache !== null) return supportCache;
  if (typeof document === "undefined") return false;
  try {
    const canvas = document.createElement("canvas");
    const canCapture = typeof (canvas as HTMLCanvasElement & { captureStream?: unknown }).captureStream === "function";
    const gl = canCapture ? canvas.getContext("webgl") : null;
    supportCache = Boolean(gl);
    gl?.getExtension("WEBGL_lose_context")?.loseContext();
  } catch {
    supportCache = false;
  }
  return supportCache;
}

function compile(gl: WebGLRenderingContext, type: number, source: string): WebGLShader | null {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.warn("[BeautyFilter] shader compile failed", gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

/** ความสว่างเฉลี่ย (0–255) ของภาพจากวิดีโอ — ใช้ตรวจว่าภาพที่ส่งออกไม่ดำทั้งจอ */
function meanLuma(source: HTMLVideoElement): number | null {
  if (source.readyState < 2 || !source.videoWidth) return null;
  const probe = document.createElement("canvas");
  probe.width = 32;
  probe.height = 18;
  const ctx = probe.getContext("2d", { willReadFrequently: true });
  if (!ctx) return null;
  ctx.drawImage(source, 0, 0, probe.width, probe.height);
  const { data } = ctx.getImageData(0, 0, probe.width, probe.height);
  let sum = 0;
  for (let i = 0; i < data.length; i += 4) sum += 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
  return sum / (data.length / 4);
}

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

export class BeautyFilter {
  private readonly video: HTMLVideoElement;
  private readonly canvas: HTMLCanvasElement;
  private readonly gl: WebGLRenderingContext;
  private readonly tex: WebGLTexture;
  private readonly u: Record<"texel" | "smooth" | "brighten" | "warm" | "rosy", WebGLUniformLocation | null>;
  private readonly output: MediaStreamTrack;
  private params: BeautyParams;
  private frame = 0;
  private running = false;
  private stopped = false;

  private constructor(
    video: HTMLVideoElement,
    canvas: HTMLCanvasElement,
    gl: WebGLRenderingContext,
    program: WebGLProgram,
    tex: WebGLTexture,
    output: MediaStreamTrack,
    level: Exclude<BeautyLevel, "off">,
  ) {
    this.video = video;
    this.canvas = canvas;
    this.gl = gl;
    this.tex = tex;
    this.output = output;
    this.params = BEAUTY_PRESETS[level];
    this.u = {
      texel: gl.getUniformLocation(program, "u_texel"),
      smooth: gl.getUniformLocation(program, "u_smooth"),
      brighten: gl.getUniformLocation(program, "u_brighten"),
      warm: gl.getUniformLocation(program, "u_warm"),
      rosy: gl.getUniformLocation(program, "u_rosy"),
    };
  }

  /**
   * สร้างฟิลเตอร์จากแทร็กกล้อง — คืน null ถ้าเครื่องนี้ทำไม่ได้ (ผู้เรียกใช้ภาพกล้องตรง ๆ ต่อ)
   * แทร็กกล้องเดิมไม่ถูกหยุด — ผู้เรียกยังเป็นเจ้าของและต้องเก็บไว้สลับกลับ
   */
  static async create(source: MediaStreamTrack, level: Exclude<BeautyLevel, "off">): Promise<BeautyFilter | null> {
    if (!isBeautyFilterSupported()) return null;
    try {
      const canvas = document.createElement("canvas");
      const settings = source.getSettings();
      canvas.width = Math.min(settings.width || 1280, MAX_W);
      canvas.height = Math.min(settings.height || 720, MAX_H);
      // preserveDrawingBuffer: บางเบราว์เซอร์ (Safari) จับภาพจาก WebGL canvas ได้ภาพดำถ้าบัฟเฟอร์ถูกล้างหลังวาด
      const gl = canvas.getContext("webgl", { preserveDrawingBuffer: true, alpha: false, antialias: false });
      if (!gl) return null;
      const vs = compile(gl, gl.VERTEX_SHADER, VERTEX_SHADER);
      const fs = compile(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER);
      const program = gl.createProgram();
      if (!vs || !fs || !program) return null;
      gl.attachShader(program, vs);
      gl.attachShader(program, fs);
      gl.linkProgram(program);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.warn("[BeautyFilter] link failed", gl.getProgramInfoLog(program));
        return null;
      }
      gl.useProgram(program);

      const buf = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
      const pos = gl.getAttribLocation(program, "a_pos");
      gl.enableVertexAttribArray(pos);
      gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0);

      const tex = gl.createTexture();
      if (!tex) return null;
      gl.bindTexture(gl.TEXTURE_2D, tex);
      // ภาพกล้องขนาดไม่ใช่เลขยกกำลังสอง — WebGL1 ต้อง CLAMP_TO_EDGE และไม่มี mipmap
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);

      const video = document.createElement("video");
      video.muted = true;
      video.playsInline = true;
      video.autoplay = true;
      video.srcObject = new MediaStream([source]);
      await video.play().catch(() => undefined);

      const output = canvas.captureStream(CAPTURE_FPS).getVideoTracks()[0];
      if (!output) return null;
      const filter = new BeautyFilter(video, canvas, gl, program, tex, output, level);
      filter.resume();
      return filter;
    } catch (err) {
      console.warn("[BeautyFilter] init failed", err);
      return null;
    }
  }

  /** แทร็กภาพที่แต่งแล้ว — ส่งให้ลูกค้าแทนแทร็กกล้อง */
  get track(): MediaStreamTrack {
    return this.output;
  }

  setLevel(level: Exclude<BeautyLevel, "off">): void {
    this.params = BEAUTY_PRESETS[level];
  }

  /** สลับกล้องกลางสาย — แทร็กที่ส่งออกยังเป็นตัวเดิม ไม่ต้อง replaceTrack */
  async setSource(track: MediaStreamTrack): Promise<void> {
    this.video.srcObject = new MediaStream([track]);
    await this.video.play().catch(() => undefined);
  }

  pause(): void {
    this.running = false;
    if (this.frame) cancelAnimationFrame(this.frame);
    this.frame = 0;
  }

  resume(): void {
    if (this.stopped || this.running) return;
    this.running = true;
    this.frame = requestAnimationFrame(this.loop);
  }

  /**
   * ตรวจว่าภาพที่ส่งออกไม่ดำทั้งจอ (บางเครื่องวาด WebGL ได้แต่จับภาพเป็นสตรีมไม่ได้)
   * กล้องเองก็มืดอยู่ (ปิดเลนส์/ห้องมืด) = บอกไม่ได้ ➔ ถือว่าผ่าน ไม่ปิดฟิลเตอร์ทิ้งเพราะความมืด
   */
  async verify(timeoutMs = 3000): Promise<boolean> {
    const probeTrack = this.output.clone();
    const probe = document.createElement("video");
    probe.muted = true;
    probe.playsInline = true;
    probe.srcObject = new MediaStream([probeTrack]);
    try {
      await probe.play().catch(() => undefined);
      const deadline = Date.now() + timeoutMs;
      while (Date.now() < deadline) {
        await wait(250);
        if (this.stopped) return true;
        const raw = meanLuma(this.video);
        const out = meanLuma(probe);
        if (raw === null) continue;
        if (raw < 12) return true;
        if (out !== null && out >= 6) return true;
      }
      return meanLuma(this.video) === null;
    } finally {
      probeTrack.stop();
      probe.srcObject = null;
    }
  }

  stop(): void {
    this.stopped = true;
    this.pause();
    this.output.stop();
    this.video.srcObject = null;
    this.gl.getExtension("WEBGL_lose_context")?.loseContext();
  }

  private loop = () => {
    if (!this.running) return;
    this.draw();
    this.frame = requestAnimationFrame(this.loop);
  };

  private draw(): void {
    const v = this.video;
    if (v.readyState < 2 || !v.videoWidth || !v.videoHeight) return;
    const gl = this.gl;
    const scale = Math.min(1, MAX_W / v.videoWidth, MAX_H / v.videoHeight);
    const w = Math.round(v.videoWidth * scale);
    const h = Math.round(v.videoHeight * scale);
    if (this.canvas.width !== w || this.canvas.height !== h) {
      this.canvas.width = w;
      this.canvas.height = h;
    }
    gl.viewport(0, 0, w, h);
    gl.bindTexture(gl.TEXTURE_2D, this.tex);
    try {
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, v);
    } catch {
      return; // เฟรมยังไม่พร้อม (สลับกล้องอยู่) — รอบหน้าค่อยวาด
    }
    const p = this.params;
    gl.uniform2f(this.u.texel, 1 / v.videoWidth, 1 / v.videoHeight);
    gl.uniform1f(this.u.smooth, p.smooth);
    gl.uniform1f(this.u.brighten, p.brighten);
    gl.uniform1f(this.u.warm, p.warm);
    gl.uniform1f(this.u.rosy, p.rosy);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }
}
