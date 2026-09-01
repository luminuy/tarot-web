"use client";

import React, { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { CREDIT_PACKAGES, type CreditPackage } from "@/lib/entitlement/packages";
import { mutateEntitlement } from "@/lib/entitlement/use-entitlement";

interface BuyCreditsModalProps {
  isOpen: boolean;
  onClose: () => void;
  user?: { id: string; name?: string; email?: string } | null;
  onRequireAuth?: () => void;
}

export const BuyCreditsModal: React.FC<BuyCreditsModalProps> = ({
  isOpen,
  onClose,
  user,
  onRequireAuth,
}) => {
  const [selectedPkg, setSelectedPkg] = useState<CreditPackage>(CREDIT_PACKAGES[1]); // Default: 10 times
  const [loading, setLoading] = useState(false);
  const [checkoutData, setCheckoutData] = useState<{
    orderId: string;
    packageId: string;
    credits: number;
    amountSatang: number;
    qrCodeUri?: string;
    authorizeUri?: string;
    isTestMode: boolean;
  } | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleStartCheckout = async () => {
    if (!user) {
      onClose();
      onRequireAuth?.();
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch("/api/entitlement/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packageId: selectedPkg.id }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "ไม่สามารถเริ่มการชำระเงินได้");
      }

      setCheckoutData(data);
    } catch (err: any) {
      setErrorMsg(err.message || "เกิดข้อผิดพลาดในการเชื่อมต่อระบบชำระเงิน");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmPayment = async () => {
    if (!checkoutData || !user) return;
    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch("/api/entitlement/checkout/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: checkoutData.orderId,
          packageId: checkoutData.packageId,
          userId: user.id,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "ไม่สามารถยืนยันการชำระเงินได้");
      }

      mutateEntitlement();
      setSuccessMsg(`เติมโควตาสำเร็จ +${data.grantedCredits} ครั้งเรียบร้อยแล้ว! ✨`);
      setTimeout(() => {
        setCheckoutData(null);
        setSuccessMsg(null);
        onClose();
      }, 2000);
    } catch (err: any) {
      setErrorMsg(err.message || "เกิดข้อผิดพลาดในการยืนยันรายการ");
    } finally {
      setLoading(false);
    }
  };

  const resetModalState = () => {
    setCheckoutData(null);
    setSuccessMsg(null);
    setErrorMsg(null);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={resetModalState} title="✦ เติมโควตาเปิดไพ่ทาโรต์ (AI Credits)">
      <div className="space-y-6 pt-1 text-[#e2d9f3]">
        {errorMsg && (
          <div className="p-3.5 rounded-xl bg-rose-950/80 border border-rose-600/50 text-rose-200 text-xs font-serif-th text-center">
            {errorMsg}
          </div>
        )}

        {successMsg && (
          <div className="p-4 rounded-xl bg-emerald-950/80 border border-emerald-500/60 text-emerald-200 text-sm font-serif-th text-center font-bold shadow-[0_0_20px_rgba(16,185,129,0.3)]">
            {successMsg}
          </div>
        )}

        {!checkoutData ? (
          <>
            <div className="text-center space-y-1">
              <p className="text-xs text-[#9c93b8] font-serif-th">
                เลือกแพ็กเกจที่ต้องการเพื่อเปิดไพ่และสนทนาถามลึกกับแม่หมอได้ทันที ไม่มีวันหมดอายุ
              </p>
            </div>

            {/* Package Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {CREDIT_PACKAGES.map((pkg) => {
                const isSelected = selectedPkg.id === pkg.id;
                return (
                  <div
                    key={pkg.id}
                    onClick={() => setSelectedPkg(pkg)}
                    className={`rounded-2xl p-4 border transition-all duration-200 cursor-pointer flex flex-col justify-between relative select-none ${
                      isSelected
                        ? "bg-[#140b28] border-[#ffd700] ring-2 ring-[#ffd700]/70 shadow-[0_0_25px_rgba(229,192,123,0.3)] scale-[1.02]"
                        : "bg-[#0a0714] border-[#e5c07b]/20 hover:border-[#e5c07b]/50 hover:bg-[#100a20]"
                    }`}
                  >
                    {pkg.badge && (
                      <span className="absolute -top-2.5 right-3 text-[9px] font-bold px-2 py-0.5 rounded-full bg-gradient-to-r from-[#d4af37] via-[#f7e7b4] to-[#c59b27] text-[#0a0715] shadow">
                        {pkg.badge}
                      </span>
                    )}

                    <div>
                      <h4 className="font-serif-th text-sm font-bold text-[#f5deaa] leading-snug">
                        {pkg.name}
                      </h4>
                      <p className="text-[11px] text-[#9c93b8] mt-1 leading-tight font-serif-th">
                        {pkg.tagline}
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-[#e5c07b]/15 flex items-baseline justify-between">
                      <span className="text-lg font-bold font-mono text-[#ffd700]">
                        ฿{pkg.priceThb}
                      </span>
                      <span className="text-[10px] text-[#e5c07b] font-serif-th font-semibold">
                        {pkg.credits} ครั้ง
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* CTA Button */}
            <button
              type="button"
              disabled={loading}
              onClick={handleStartCheckout}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#d4af37] via-[#f7e7b4] to-[#c59b27] text-[#0a0715] font-bold font-serif-th text-sm shadow-[0_0_25px_rgba(229,192,123,0.4)] hover:opacity-95 active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              {loading ? (
                <span>กำลังเตรียมรายการ...</span>
              ) : (
                <>
                  <span>ชำระเงิน {selectedPkg.priceThb} บาท (PromptPay QR)</span>
                  <span>→</span>
                </>
              )}
            </button>
          </>
        ) : (
          /* Payment Screen */
          <div className="text-center space-y-4">
            <div className="p-4 rounded-2xl bg-[#0a0714] border border-[#e5c07b]/30 space-y-3">
              <div className="flex items-center justify-between text-xs text-[#9c93b8] font-serif-th border-b border-[#e5c07b]/15 pb-2">
                <span>รายการ</span>
                <span className="font-bold text-[#f5deaa]">
                  {selectedPkg.name} ({selectedPkg.credits} ครั้ง)
                </span>
              </div>
              <div className="flex items-center justify-between text-xs text-[#9c93b8] font-serif-th">
                <span>ยอดชำระ</span>
                <span className="text-base font-bold font-mono text-[#ffd700]">
                  ฿{selectedPkg.priceThb} บาท
                </span>
              </div>
            </div>

            {checkoutData.qrCodeUri ? (
              <div className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-white text-black max-w-[240px] mx-auto shadow-2xl">
                <img
                  src={checkoutData.qrCodeUri}
                  alt="PromptPay QR Code"
                  className="w-48 h-48 object-contain"
                />
                <span className="text-[11px] text-gray-600 font-serif-th">
                  สแกนด้วยแอปพลิเคชันธนาคารทุกแห่ง
                </span>
              </div>
            ) : (
              <div className="p-5 rounded-2xl bg-[#140b28] border border-[#ffd700]/40 text-center space-y-2">
                <div className="text-2xl text-[#ffd700]">✦</div>
                <h4 className="font-serif-th text-sm font-bold text-[#f5deaa]">
                  ระบบจำลองการชำระเงิน (Test Gateway Simulator)
                </h4>
                <p className="text-xs text-[#9c93b8] font-serif-th">
                  ระบบพร้อมผูกกับ Omise PromptPay QR เมื่อตั้งค่า Secret บน Cloudflare Workers
                </p>
              </div>
            )}

            <div className="pt-2 flex flex-col gap-2">
              <button
                type="button"
                disabled={loading}
                onClick={handleConfirmPayment}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#10b981] via-[#34d399] to-[#059669] text-white font-bold font-serif-th text-sm shadow-[0_0_20px_rgba(16,185,129,0.4)] hover:opacity-95 active:scale-[0.98] transition-all cursor-pointer"
              >
                {loading ? "กำลังตรวจสอบรายการ..." : "✦ ยืนยันการชำระเงินแล้ว"}
              </button>

              <button
                type="button"
                onClick={() => setCheckoutData(null)}
                className="text-xs text-[#9c93b8] hover:text-[#f5deaa] py-1 cursor-pointer font-serif-th"
              >
                ← เปลี่ยนแพ็กเกจ
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
