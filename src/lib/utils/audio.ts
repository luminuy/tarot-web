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

  /**
   * 🎴 เสียงหยิบไพ่ / แตะเลือกการ์ด (Luxury Tactile Snap & Celestial Pentatonic Chime)
   * ผสมผสานเสียงสัมผัสเนื้อกระดาษไพ่ 350gsm + กระดิ่งคริสตัลศักดิ์สิทธิ์ Solfeggio Scale
   */
  public playCardSelectSound(stepIndex?: number) {
    if (!this.soundEnabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;

      // 1. Layer สัมผัสเนื้อกระดาษไพ่ (Organic 350gsm Linen Card Snap Transient)
      const noiseBuffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.04), ctx.sampleRate);
      const data = noiseBuffer.getChannelData(0);
      for (let i = 0; i < data.length; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (data.length * 0.25));
      }
      const noiseSrc = ctx.createBufferSource();
      noiseSrc.buffer = noiseBuffer;
      const noiseFilter = ctx.createBiquadFilter();
      noiseFilter.type = "lowpass";
      noiseFilter.frequency.setValueAtTime(520, now);
      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.20, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
      noiseSrc.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(ctx.destination);
      noiseSrc.start(now);
      noiseSrc.stop(now + 0.045);

      // 2. Layer กระดิ่งคริสตัลทองคำ (Celestial Golden Pentatonic Harmonic Cascade)
      // บันไดเสียงศักดิ์สิทธิ์: F#5 (740Hz), G#5 (830Hz), A#5 (932Hz), C#6 (1108Hz), D#6 (1244Hz), F#6 (1480Hz)
      const PENTATONIC_SCALE = [739.99, 830.61, 932.33, 1108.73, 1244.51, 1479.98];
      const noteFreq = PENTATONIC_SCALE[(stepIndex !== undefined ? stepIndex : 0) % PENTATONIC_SCALE.length];

      // Fundamental warm sine tone
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = "sine";
      osc1.frequency.setValueAtTime(noteFreq, now);
      gain1.gain.setValueAtTime(0.12, now);
      gain1.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.36);

      // Crystal shimmer overtone (Triangle wave 2nd harmonic)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = "triangle";
      osc2.frequency.setValueAtTime(noteFreq * 2.004, now); // Slight chorus detune
      gain2.gain.setValueAtTime(0.05, now);
      gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now);
      osc2.stop(now + 0.24);
    } catch {
      // Audio fallback
    }
  }

  /** เสียงแตะสัมผัสเบาๆ สไตล์ Apple Haptic สำหรับเมนูและทริกเกอร์ (15ms Zero-Lag Tap — Non-blocking decoupled) */
  public playMenuTapSound() {
    if (!this.soundEnabled) return;
    // Decouple audio graph initialization to prevent blocking the UI animation frame
    setTimeout(() => {
      try {
        const ctx = this.getContext();
        if (!ctx) return;
        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(620, now);
        osc.frequency.exponentialRampToValueAtTime(320, now + 0.015);
        gain.gain.setValueAtTime(0.06, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.015);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.018);
      } catch {
        // Audio fallback
      }
    }, 0);
  }

  /** 🪄 เสียงพลิกไพ่ 3D (Tactile Linen Flip & Celestial Air Swoosh) */
  public playCardFlipSound() {
    if (!this.soundEnabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const bufferSize = Math.floor(ctx.sampleRate * 0.14);
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.sin((Math.PI * i) / bufferSize);
      }

      const noise = ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = ctx.createBiquadFilter();
      filter.type = "bandpass";
      filter.frequency.setValueAtTime(600, now);
      filter.frequency.exponentialRampToValueAtTime(3200, now + 0.05);
      filter.frequency.exponentialRampToValueAtTime(700, now + 0.13);
      filter.Q.setValueAtTime(1.8, now);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(0.18, now + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      noise.start(now);
      noise.stop(now + 0.14);
    } catch {
      // Audio fallback
    }
  }

  /** 🔔 เสียงระฆังธิเบต/ขันคริสตัลศักดิ์สิทธิ์ (Tibetan Singing Bowl Chime 432Hz & 528Hz Harmonic) */
  public playOracleRevealSound() {
    if (!this.soundEnabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const freqs = [216, 432, 528, 864, 1056];
      const gains = [0.14, 0.18, 0.12, 0.06, 0.03];

      freqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, now);

        gain.gain.setValueAtTime(gains[idx], now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 3.0);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 3.0);
      });
    } catch {
      // Audio fallback
    }
  }

  /** Voice Speech Synthesis (TTS) ปรับจูนเสียงเฉพาะตัวตามบุคลิกแม่หมอ 5 บุคลิก */
  public speakProphecy(text: string, personaId?: string | null, onEnd?: () => void, onError?: () => void): boolean {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return false;
    window.speechSynthesis.cancel();
    const cleanText = text.replace(/[*#_`]/g, "").trim();
    if (!cleanText) return false;

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = "th-TH";

    // ปรับจูน Pitch & Rate ตาม Persona
    let rate = 0.95;
    let pitch = 1.0;

    switch (personaId) {
      case "warm":
        rate = 0.90;
        pitch = 1.02; // อบอุ่น นุ่มนวล
        break;
      case "playful":
        rate = 1.04;
        pitch = 1.15; // สดใส คุยสนุก มีพลัง
        break;
      case "direct":
        rate = 0.98;
        pitch = 0.95; // ตรงไปตรงมา กระชับ มั่นใจ
        break;
      case "master":
        rate = 0.88;
        pitch = 0.82; // ทุ้ม สุขุม ทรงภูมิ
        break;
      case "mystic":
        rate = 0.86;
        pitch = 1.06; // ก้องกังวาน ลึกซึ้ง
        break;
      default:
        rate = 0.92;
        pitch = 1.0;
        break;
    }

    utterance.rate = rate;
    utterance.pitch = pitch;

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
