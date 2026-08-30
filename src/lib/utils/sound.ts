"use client";

/**
 * ระบบเสียงเอฟเฟกต์บรรยากาศด้วย Web Audio API (Zero External Asset Dependency)
 * ---------------------------------------------------------------------------
 * สังเคราะห์คลื่นเสียงฮาร์มอนิกและ White Noise ในหน่วยความจำโดยตรง
 * ทำงานได้รวดเร็ว ไม่ต้องโหลดไฟล์ mp3 ภายนอก และรองรับทุกเบราว์เซอร์
 */

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === "suspended") {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

/** เสียงสับไพ่ (Shuffle Deck Rustle) */
export function playShuffleSound() {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const bufferSize = ctx.sampleRate * 0.4;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);

  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.1));
  }

  const noise = ctx.createBufferSource();
  noise.buffer = buffer;

  const filter = ctx.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.setValueAtTime(800, now);
  filter.Q.setValueAtTime(3, now);

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.2, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

  noise.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);

  noise.start(now);
}

/** เสียงแตะเลือกไพ่จากสำรับ (Card Pick Whoosh) */
export function playPickSound() {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = "sine";
  osc.frequency.setValueAtTime(320, now);
  osc.frequency.exponentialRampToValueAtTime(640, now + 0.12);

  gain.gain.setValueAtTime(0.18, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 0.16);
}

/** เสียงพลิกไพ่ 3D (Card Flip Chime) */
export function playFlipSound() {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const freqs = [528, 792, 1056]; // Solfeggio 528Hz Transformation chime

  freqs.forEach((f, idx) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "triangle";
    osc.frequency.setValueAtTime(f, now + idx * 0.04);

    gain.gain.setValueAtTime(0.12 / (idx + 1), now + idx * 0.04);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6 + idx * 0.05);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now + idx * 0.04);
    osc.stop(now + 0.7);
  });
}

/** เสียงเมื่อเปิดเผยคำทำนายครบถ้วน (Completion Celestial Chime) */
export function playCompletionSound() {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const chord = [440, 554.37, 659.25, 880]; // A Major Celestial chord

  chord.forEach((freq, idx) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, now + idx * 0.06);

    gain.gain.setValueAtTime(0.08, now + idx * 0.06);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.2 + idx * 0.1);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now + idx * 0.06);
    osc.stop(now + 1.4);
  });
}
