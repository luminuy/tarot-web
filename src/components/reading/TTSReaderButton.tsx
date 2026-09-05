"use client";

import React, { useEffect, useState } from "react";
import { soundManager } from "@/lib/utils/audio";
import { trackEvent } from "@/lib/analytics";

import { SpeakerTabIcon } from "@/components/ui/TarotArtIcons";
interface TTSReaderButtonProps {
  textToRead: string;
  personaId?: string;
  className?: string;
}

export const TTSReaderButton: React.FC<TTSReaderButtonProps> = ({ textToRead, personaId = "warm", className = "" }) => {
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
      aria-label={isSpeaking ? "หยุดเสียงอ่านคำทำนาย" : "ฟังเสียงอ่านคำทำนาย"}
      className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border text-xs font-serif-th font-semibold transition-all duration-300 cursor-pointer select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8F5C1A] ${
        isSpeaking
          ? "bg-[#8F5C1A] border-[#D9C8AC] text-[#FFFFFF]"
          : "bg-[#FFFFFF] border-[#D9C8AC] text-[#2E211A] hover:border-[#8F5C1A] hover:bg-[#FAF7F2]"
      } ${className}`}
    >
      {isSpeaking ? (
        <>
          {/* Animated sound wave bars */}
          <div className="flex items-center gap-0.5 h-3">
            <span className="w-0.5 bg-[#FFFFFF] rounded-full animate-[pulse_0.6s_ease-in-out_infinite] h-3" />
            <span className="w-0.5 bg-[#FFFFFF] rounded-full animate-[pulse_0.4s_ease-in-out_infinite_0.2s] h-2" />
            <span className="w-0.5 bg-[#FFFFFF] rounded-full animate-[pulse_0.7s_ease-in-out_infinite_0.4s] h-3.5" />
            <span className="w-0.5 bg-[#FFFFFF] rounded-full animate-[pulse_0.5s_ease-in-out_infinite_0.1s] h-2" />
          </div>
          <span>กำลังอ่าน... (กดเพื่อหยุด)</span>
        </>
      ) : (
        <>
          <SpeakerTabIcon className="w-4 h-4 text-[#8F5C1A]" />
          <span>✦ ฟังเสียงอ่านคำทำนาย</span>
        </>
      )}
    </button>
  );
};
