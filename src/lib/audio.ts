"use client";

/**
 * Web Audio Synthesizer Engine สำหรับสร้างเสียงประกอบ (SFX) ศักดิ์สิทธิ์แบบ Zero-Dependency
 * ทำงานได้รวดเร็ว ลื่นไหล ไม่ต้องโหลดไฟล์ .mp3 ภายนอก
 */

class MysticAudioEngine {
  private ctx: AudioContext | null = null;
  private soundEnabled = true;

  constructor() {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("tarot_sound_enabled");
      if (saved !== null) {
        this.soundEnabled = saved === "true";
      }
    }
  }

  private getContext(): AudioContext | null {
    if (typeof window === "undefined") return null;
    if (!this.ctx) {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtxClass) {
        this.ctx = new AudioCtxClass();
      }
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public isEnabled(): boolean {
    return this.soundEnabled;
  }

  public toggleSound(): boolean {
    this.soundEnabled = !this.soundEnabled;
    if (typeof window !== "undefined") {
      localStorage.setItem("tarot_sound_enabled", this.soundEnabled ? "true" : "false");
    }
    if (this.soundEnabled) {
      this.playCardSelectSound();
    }
    return this.soundEnabled;
  }

  /** เสียงกรีดไพ่ตอนสับ (Shuffle Flutter) */
  public playShuffleSound() {
    if (!this.soundEnabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      for (let i = 0; i < 7; i++) {
        const time = now + i * 0.045;
        const bufferSize = ctx.sampleRate * 0.03;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let j = 0; j < bufferSize; j++) {
          data[j] = (Math.random() * 2 - 1) * Math.exp(-j / (bufferSize * 0.4));
        }

        const noise = ctx.createBufferSource();
        noise.buffer = buffer;

        const filter = ctx.createBiquadFilter();
        filter.type = "bandpass";
        filter.frequency.value = 1200 + Math.random() * 600;
        filter.Q.value = 3;

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.18, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.03);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);

        noise.start(time);
        noise.stop(time + 0.035);
      }
    } catch {
      // Audio fallback ignored
    }
  }

  /** เสียงหยิบไพ่ / แตะเลือกการ์ด (Card Tap & Select Chime) */
  public playCardSelectSound() {
    if (!this.soundEnabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(587.33, now); // D5
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.08); // A5

      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.25);
    } catch {
      // Audio fallback
    }
  }

  /** เสียงพลิกไพ่ 3D (3D Flip Swoosh) */
  public playCardFlipSound() {
    if (!this.soundEnabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const bufferSize = ctx.sampleRate * 0.12;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      const noise = ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = ctx.createBiquadFilter();
      filter.type = "bandpass";
      filter.frequency.setValueAtTime(400, now);
      filter.frequency.exponentialRampToValueAtTime(2400, now + 0.06);
      filter.frequency.exponentialRampToValueAtTime(600, now + 0.12);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(0.15, now + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      noise.start(now);
      noise.stop(now + 0.12);
    } catch {
      // Audio fallback
    }
  }

  /** เสียงระฆังธิเบต/ขันคริสตัลศักดิ์สิทธิ์ (Tibetan Singing Bowl Chime 432Hz Harmonic) */
  public playOracleRevealSound() {
    if (!this.soundEnabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const freqs = [216, 432, 864, 1296];
      const gains = [0.15, 0.22, 0.08, 0.03];

      freqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, now);

        gain.gain.setValueAtTime(gains[idx], now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 2.5);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 2.5);
      });
    } catch {
      // Audio fallback
    }
  }

  /** Voice Speech Synthesis (TTS) สำหรับให้แม่หมออ่านคำทำนายให้ฟัง */
  public speakProphecy(text: string, onEnd?: () => void, onError?: () => void): boolean {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return false;
    window.speechSynthesis.cancel();
    const cleanText = text.replace(/[*#_`]/g, "").trim();
    if (!cleanText) return false;

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = "th-TH";
    utterance.rate = 0.95;
    utterance.pitch = 1.05;

    const voices = window.speechSynthesis.getVoices();
    const thaiVoice = voices.find((v) => v.lang === "th-TH" || v.lang.startsWith("th"));
    if (thaiVoice) {
      utterance.voice = thaiVoice;
    }

    if (onEnd) utterance.onend = onEnd;
    if (onError) utterance.onerror = onError;

    window.speechSynthesis.speak(utterance);
    return true;
  }

  public stopSpeaking() {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
  }

  public isSpeaking(): boolean {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      return window.speechSynthesis.speaking;
    }
    return false;
  }
}

export const soundManager = new MysticAudioEngine();
