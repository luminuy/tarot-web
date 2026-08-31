"use client";

import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { soundManager } from "@/lib/utils/audio";

export interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const handleLoginGoogle = () => {
    soundManager.playCardSelectSound();
    window.location.href = "/api/auth/google";
  };

  const handleLoginLine = () => {
    soundManager.playCardSelectSound();
    window.location.href = "/api/auth/line";
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-xl">
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 20 }}
          className="w-full max-w-md rounded-3xl bg-[#0e081e]/98 border-2 border-[#e5c07b]/50 p-6 sm:p-8 shadow-[0_0_80px_rgba(0,0,0,0.95)] flex flex-col items-center text-center space-y-6 relative overflow-hidden"
        >
          {/* Close Button */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-[#1b1230] border border-[#e5c07b]/30 text-[#e5c07b] hover:bg-[#e5c07b] hover:text-[#05040a] text-sm flex items-center justify-center transition-all cursor-pointer"
          >
            ✕
          </button>

          {/* Icon / Brand Aura */}
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#2a1b4e] to-[#120a24] border border-[#e5c07b]/60 flex items-center justify-center text-3xl shadow-[0_0_30px_rgba(229,192,123,0.3)]">
            ✦
          </div>

          <div className="space-y-1.5">
            <h3 className="text-xl sm:text-2xl font-serif-th font-bold font-mystic-gold">
              เข้าสู่วิหารศักดิ์สิทธิ์
            </h3>
            <p className="text-xs text-[#cfc8e2] font-serif-th max-w-xs mx-auto leading-relaxed">
              ผูกบัญชีเพื่อบันทึกประวัติการดูดวง ซิงก์ข้ามอุปกรณ์ และติดตามผลลัพธ์ในชีวิต
            </p>
          </div>

          {/* Social Login Buttons */}
          <div className="w-full space-y-3 pt-2">
            {/* Google Login Button */}
            <button
              type="button"
              onClick={handleLoginGoogle}
              className="w-full py-3 px-4 rounded-2xl bg-white hover:bg-gray-100 text-gray-900 font-semibold text-xs sm:text-sm shadow-lg hover:shadow-xl transition-all cursor-pointer flex items-center justify-center gap-3 border border-gray-200 active:scale-95"
            >
              <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>ดำเนินการต่อด้วย Google</span>
            </button>

            {/* LINE Login Button */}
            <button
              type="button"
              onClick={handleLoginLine}
              className="w-full py-3 px-4 rounded-2xl bg-[#06C755] hover:bg-[#05b34c] text-white font-semibold text-xs sm:text-sm shadow-lg hover:shadow-xl transition-all cursor-pointer flex items-center justify-center gap-3 border border-[#06C755] active:scale-95"
            >
              <svg className="w-5 h-5 flex-shrink-0 fill-current" viewBox="0 0 24 24">
                <path d="M24 10.3c0-4.8-5.4-8.8-12-8.8S0 5.5 0 10.3c0 4.3 3.8 7.9 9 8.6.4.1.9.3 1 .6.1.4 0 1.2-.1 1.7-.1.4-.4 1.7-.6 2.1-.2.5-.9 2 .8 1.1 1.8-.9 4.8-2.9 6.5-4.9 4.6-1.5 7.4-4.8 7.4-8.6zm-14.7 2.7H6.5c-.3 0-.5-.2-.5-.5V7.5c0-.3.2-.5.5-.5s.5.2.5.5v4.5h2.3c.3 0 .5.2.5.5s-.2.5-.5.5zm2.6-.5c0 .3-.2.5-.5.5s-.5-.2-.5-.5V7.5c0-.3.2-.5.5-.5s.5.2.5.5v5zm4.8 0c0 .3-.2.5-.5.5-.2 0-.4-.1-.5-.3L13.8 9v3.5c0 .3-.2.5-.5.5s-.5-.2-.5-.5V7.5c0-.3.2-.5.5-.5.2 0 .4.1.5.3l2.4 3.7V7.5c0-.3.2-.5.5-.5s.5.2.5.5v5zm3.7-3.2h-2.3v1.4h2.3c.3 0 .5.2.5.5s-.2.5-.5.5h-2.8c-.3 0-.5-.2-.5-.5V7.5c0-.3.2-.5.5-.5h2.8c.3 0 .5.2.5.5s-.2.5-.5.5h-2.3v1.3h2.3c.3 0 .5.2.5.5s-.2.5-.5.5z" />
              </svg>
              <span>ดำเนินการต่อด้วย LINE</span>
            </button>
          </div>

          {/* Privacy Footnote */}
          <div className="pt-2 border-t border-[#e5c07b]/15 text-[10px] text-[#9c93b8] font-serif-th leading-relaxed">
            🛡️ ข้อมูลของคุณได้รับการปกป้องตามมาตรฐานความเป็นส่วนตัวระดับสากล ไม่มีการนำไปเผยแพร่หรือแชร์ต่อบุคคลภายนอก
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
