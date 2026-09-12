"use client";

import { usePathname, useRouter } from "next/navigation";

import { useLocale } from "@/lib/i18n";
import { hasEnglishTwin, stripLocalePrefix } from "@/lib/i18n/paths";
import { soundManager } from "@/lib/utils/audio";

interface LanguageSwitcherProps {
  className?: string;
}

/**
 * 🌐 ปุ่มสลับภาษา — ต้อง "พาไปยัง URL ฝาแฝด" ไม่ใช่แค่สลับ state ในหน่วยความจำ
 * ---------------------------------------------------------------------------
 * ตั้งแต่แยกเส้นทางเป็น `/` (ไทย) และ `/en/...` (อังกฤษ) การเปลี่ยนแค่ state
 * จะทำให้เนื้อหาไม่ตรงกับ URL ที่ผู้ใช้ยืนอยู่ · canonical ของหน้าจะขัดกับสิ่งที่เห็น
 * และปุ่มย้อนกลับของเบราว์เซอร์จะพาไปผิดที่
 *
 * หน้าที่ยังไม่มีฝาแฝด (เช่น `/blog`) จะกลับไปใช้กลไกเดิม (สลับด้วย cookie ฝั่ง client)
 * ซึ่งดีกว่าพาผู้ใช้ไปชน 404
 */
export function LanguageSwitcher({ className = "" }: LanguageSwitcherProps) {
  const { locale, setLocale, pendingLocale, isSwitchingLocale } = useLocale();
  const router = useRouter();
  const pathname = usePathname() || "/";

  // ภาษาที่ควรแสดงว่า "เลือกอยู่" — ใช้ค่าที่ผู้ใช้เพิ่งกดถ้ามี (ISSUE-025)
  const shownLocale = pendingLocale ?? locale;

  const handleSelect = (nextLocale: "th" | "en") => {
    if (nextLocale === shownLocale) return;
    try {
      soundManager.playMenuTapSound();
    } catch {
      // Audio optional
    }
    // เขียน cookie เสมอ เพื่อให้หน้าที่ไม่มีฝาแฝดจำภาษาที่เลือกไว้ได้
    setLocale(nextLocale);

    const basePath = stripLocalePrefix(pathname);
    if (!hasEnglishTwin(basePath)) return;

    const target =
      nextLocale === "en" ? (basePath === "/" ? "/en" : `/en${basePath}`) : basePath;
    if (target !== pathname) router.push(target);
  };

  return (
    <div
      role="group"
      aria-label="Language selector / สลับภาษา"
      aria-busy={isSwitchingLocale}
      className={`inline-flex items-center rounded-full bg-[#F3F0EA] border border-[#D5CEC2] p-0.5 select-none shadow-xs transition-opacity duration-150 ${
        isSwitchingLocale ? "opacity-70" : ""
      } ${className}`}
    >
      <button
        type="button"
        onClick={() => handleSelect("th")}
        aria-pressed={shownLocale === "th"}
        aria-label="เปลี่ยนเป็นภาษาไทย"
        className={`tap-overlay-y px-2 py-1 rounded-full text-xs font-serif-th font-bold transition duration-200 cursor-pointer ${
          shownLocale === "th"
            ? "bg-[#FFFFFF] text-[#29261F] shadow-[0_1px_3px_rgba(42,38,31,0.1)] border border-[#D5CEC2]"
            : "text-[#635B4E] hover:text-[#29261F] border border-transparent"
        }`}
      >
        TH
      </button>

      <button
        type="button"
        onClick={() => handleSelect("en")}
        aria-pressed={shownLocale === "en"}
        aria-label="Switch to American English"
        className={`tap-overlay-y px-2 py-1 rounded-full text-xs font-mono font-bold transition duration-200 cursor-pointer ${
          shownLocale === "en"
            ? "bg-[#FFFFFF] text-[#29261F] shadow-[0_1px_3px_rgba(42,38,31,0.1)] border border-[#D5CEC2]"
            : "text-[#635B4E] hover:text-[#29261F] border border-transparent"
        }`}
      >
        EN
      </button>
    </div>
  );
}
