"use client";

import React, { useEffect, useState } from "react";
import { soundManager } from "@/lib/utils/audio";
import { trackEvent } from "@/lib/analytics";

import { SpeakerTabIcon } from "@/components/ui/TarotArtIcons";
import { useLocale } from "@/lib/i18n";
interface TTSReaderButtonProps {
  textToRead: string;
  personaId?: string;
  className?: string;
}

export const TTSReaderButton: React.FC<TTSReaderButtonProps> = ({ textToRead, personaId = "warm", className = "" }) => {
  const { isEnglish } = useLocale();
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      setIsSupported(true);
    }
    return () => {
      soundManager.stopSpeaking();
    };
  }, []);

  if (!isSupported || !textToRead) return null;

  const handleToggle = () => {
    if (isSpeaking) {
      soundManager.stopSpeaking();
      setIsSpeaking(false);
      trackEvent("tts_stop", { persona_id: personaId });
    } else {
      const ok = soundManager.speakProphecy(
        textToRead,
        personaId,
        () => setIsSpeaking(false),
        () => setIsSpeaking(false)
      );
      if (ok) {
        setIsSpeaking(true);
        trackEvent("tts_play", { persona_id: personaId });
      }
    }
  };

  return (
    <button
      type="button"
      onClick={handleToggle}
      aria-label={
        isSpeaking
          ? isEnglish ? "Stop reading" : "หยุดเสียงอ่านคำทำนาย"
          : isEnglish ? "Listen to reading" : "ฟังเสียงอ่านคำทำนาย"
      }
      className={`tap-overlay-y inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border text-xs font-serif-th font-semibold transition duration-300 cursor-pointer select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-ink ${
        isSpeaking
          ? "bg-gold-ink border-line-warm text-surface"
          : "bg-surface border-line-warm text-ink-deep hover:border-gold-ink hover:bg-surface-warm"
      } ${className}`}
    >
      {isSpeaking ? (
        <>
          {/* Animated sound wave bars */}
          <div className="flex items-center gap-0.5 h-3">
            <span className="w-0.5 bg-surface rounded-full animate-[pulse_0.6s_ease-in-out_infinite] h-3" />
            <span className="w-0.5 bg-surface rounded-full animate-[pulse_0.4s_ease-in-out_infinite_0.2s] h-2" />
            <span className="w-0.5 bg-surface rounded-full animate-[pulse_0.7s_ease-in-out_infinite_0.4s] h-3.5" />
            <span className="w-0.5 bg-surface rounded-full animate-[pulse_0.5s_ease-in-out_infinite_0.1s] h-2" />
          </div>
          <span>{isEnglish ? "Reading... (click to stop)" : "กำลังอ่าน... (กดเพื่อหยุด)"}</span>
        </>
      ) : (
        <>
          <SpeakerTabIcon className="w-4 h-4 text-gold-ink" />
          <span>{isEnglish ? "Listen to reading" : "ฟังเสียงอ่านคำทำนาย"}</span>
        </>
      )}
    </button>
  );
};
