/**
 * src/lib/audio/tts.ts
 * ระบบเสียงอ่านคำทำนายด้วย Web Speech API (Browser Native Text-to-Speech)
 * รองรับภาษาไทย (th-TH) นุ่มนวล สมจริง ไม่มีค่าใช้จ่ายคลาวด์
 */

export interface TTSState {
  isSupported: boolean;
  isSpeaking: boolean;
  isPaused: boolean;
}

export class TextToSpeechManager {
  private static instance: TextToSpeechManager;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private listeners: Set<(state: TTSState) => void> = new Set();
  private state: TTSState = {
    isSupported: typeof window !== "undefined" && "speechSynthesis" in window,
    isSpeaking: false,
    isPaused: false,
  };

  private constructor() {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.onvoiceschanged = () => {
        // Pre-warm voices list
        window.speechSynthesis.getVoices();
      };
    }
  }

  public static getInstance(): TextToSpeechManager {
    if (!TextToSpeechManager.instance) {
      TextToSpeechManager.instance = new TextToSpeechManager();
    }
    return TextToSpeechManager.instance;
  }

  public subscribe(listener: (state: TTSState) => void): () => void {
    this.listeners.add(listener);
    listener({ ...this.state });
    return () => this.listeners.delete(listener);
  }

  private notify() {
    const s = { ...this.state };
    for (const l of this.listeners) {
      l(s);
    }
  }

  /**
   * ทำความสะอาดข้อความ Markdown และสัญลักษณ์พิเศษก่อนส่งให้ TTS อ่าน
   */
  public cleanTextForSpeech(raw: string): string {
    return raw
      .replace(/[#*`_~\u2726\u2728]/g, "") // เอาเครื่องหมาย Markdown และทองคำเปลวออก
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1") // เอา Markdown Link ออก
      .replace(/https?:\/\/\S+/g, "") // เอา URL ออก
      .replace(/\n{2,}/g, " ") // แปลง newline ซ้ำเป็นช่องว่าง
      .trim();
  }

  public speak(rawText: string, onEnd?: () => void) {
    if (!this.state.isSupported) return;

    this.stop();

    const cleanText = this.cleanTextForSpeech(rawText);
    if (!cleanText) return;

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = "th-TH";
    utterance.rate = 0.95; // จังหวะนุ่มนวลกำลังดี
    utterance.pitch = 1.0;

    // หาเสียงภาษาไทยที่ดีที่สุดในเครื่อง
    const voices = window.speechSynthesis.getVoices();
    const thaiVoice = voices.find(
      (v) => v.lang.startsWith("th") || v.name.includes("Thai") || v.name.includes("Kanya") || v.name.includes("Narisa")
    );
    if (thaiVoice) {
      utterance.voice = thaiVoice;
    }

    utterance.onstart = () => {
      this.state.isSpeaking = true;
      this.state.isPaused = false;
      this.notify();
    };

    utterance.onend = () => {
      this.state.isSpeaking = false;
      this.state.isPaused = false;
      this.currentUtterance = null;
      this.notify();
      onEnd?.();
    };

    utterance.onerror = (e) => {
      console.warn("[TTS Error]:", e);
      this.state.isSpeaking = false;
      this.state.isPaused = false;
      this.currentUtterance = null;
      this.notify();
    };

    utterance.onpause = () => {
      this.state.isPaused = true;
      this.notify();
    };

    utterance.onresume = () => {
      this.state.isPaused = false;
      this.notify();
    };

    this.currentUtterance = utterance;
    window.speechSynthesis.speak(utterance);
  }

  /**
   * ⚠️ ต้องเช็ก `currentUtterance` ด้วย ไม่ใช่เชื่อ `state.isSpeaking` อย่างเดียว
   * บางเบราว์เซอร์จบเสียงโดยไม่ยิง onend ทำให้ state ค้างเป็น "กำลังพูด" ทั้งที่เงียบไปแล้ว
   * แล้วสั่ง pause() ใส่คิวว่าง ๆ จนกดเล่นต่อไม่ขึ้นอีกเลย
   * (ก่อนหน้านี้ฟิลด์นี้ถูกเขียนอย่างเดียว ไม่เคยถูกอ่าน จึงไม่ได้ช่วยอะไรเลย)
   */
  public pause() {
    if (this.state.isSupported && this.currentUtterance && this.state.isSpeaking && !this.state.isPaused) {
      window.speechSynthesis.pause();
    }
  }

  public resume() {
    if (this.state.isSupported && this.currentUtterance && this.state.isPaused) {
      window.speechSynthesis.resume();
    }
  }

  public stop() {
    if (this.state.isSupported) {
      window.speechSynthesis.cancel();
      this.currentUtterance = null;
      this.state.isSpeaking = false;
      this.state.isPaused = false;
      this.notify();
    }
  }

  public toggle(rawText: string) {
    if (this.state.isSpeaking) {
      if (this.state.isPaused) {
        this.resume();
      } else {
        this.stop();
      }
    } else {
      this.speak(rawText);
    }
  }
}
