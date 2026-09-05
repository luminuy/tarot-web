"use client";

import { useLocale } from "@/lib/i18n";
import { soundManager } from "@/lib/utils/audio";

interface LanguageSwitcherProps {
  className?: string;
}

export function LanguageSwitcher({ className = "" }: LanguageSwitcherProps) {
  const { locale, setLocale } = useLocale();

  const handleSelect = (nextLocale: "th" | "en") => {
    if (nextLocale === locale) return;
    try {
      soundManager.playMenuTapSound();
    } catch {
      // Audio optional
    }
    setLocale(nextLocale);
  };

  return (
    <div
      role="group"
      aria-label="Language selector / สลับภาษา"
      className={`inline-flex items-center rounded-full bg-[#F3F0EA] border border-[#D5CEC2] p-0.5 select-none shadow-xs ${className}`}
    >
      <button
        type="button"
        onClick={() => handleSelect("th")}
        aria-pressed={locale === "th"}
        aria-label="เปลี่ยนเป็นภาษาไทย"
        className={`px-2 py-1 rounded-full text-xs font-serif-th font-bold transition-all duration-200 cursor-pointer ${
          locale === "th"
            ? "bg-[#FFFFFF] text-[#29261F] shadow-[0_1px_3px_rgba(42,38,31,0.1)] border border-[#D5CEC2]"
            : "text-[#635B4E] hover:text-[#29261F] border border-transparent"
        }`}
      >
        TH
      </button>

      <button
        type="button"
        onClick={() => handleSelect("en")}
        aria-pressed={locale === "en"}
        aria-label="Switch to American English"
        className={`px-2 py-1 rounded-full text-xs font-mono font-bold transition-all duration-200 cursor-pointer ${
          locale === "en"
            ? "bg-[#FFFFFF] text-[#29261F] shadow-[0_1px_3px_rgba(42,38,31,0.1)] border border-[#D5CEC2]"
            : "text-[#635B4E] hover:text-[#29261F] border border-transparent"
        }`}
      >
        EN
      </button>
    </div>
  );
}
