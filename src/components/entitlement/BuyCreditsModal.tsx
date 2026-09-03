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
    // เติมรอบต้องผูกกับบัญชี — ถ้ายังไม่ได้เข้าสู่ระบบ ให้บอกตรง ๆ ตรงนี้
    // (ของเดิมปิดหน้าต่างทิ้งเงียบ ๆ เมื่อไม่มี onRequireAuth ผู้ใช้กดแล้วไม่มีอะไรเกิดขึ้น)
    if (!user) {
      if (onRequireAuth) {
        onClose();
        onRequireAuth();
      } else {
        setErrorMsg("ต้องเข้าสู่ระบบก่อนจึงจะเติมรอบเปิดไพ่ได้ — รอบที่เติมจะผูกกับบัญชีของคุณ");
      }
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
    <Modal isOpen={isOpen} onClose={resetModalState} title="✦ ปลดล็อกญาณพยากรณ์พิเศษ (Mystic Oracle Pass)">
      <div className="space-y-6 pt-1 text-[#e2d9f3]">
        {errorMsg && (
          <div className="p-3.5 rounded-xl bg-rose-950/80 border border-rose-600/50 text-rose-200 text-xs font-serif-th text-center">
            {errorMsg}
          </div>
        )}

        {successMsg && (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-serif-th text-center font-bold shadow-xs">
            {successMsg}
          </div>
        )}

        {!checkoutData ? (
          <>
            <div className="text-center space-y-1">
              <p className="text-xs text-[#8C735D] font-serif-th">
                ปลดล็อกผังใหญ่ 10–12 ใบและคุยถามเจาะลึกได้ไม่จำกัด · จ่ายครั้งเดียว ไม่ใช่รายเดือน · ไม่มีวันหมดอายุ
              </p>
            </div>

            {/* Package Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {CREDIT_PACKAGES.map((pkg) => {
                const isSelected = selectedPkg.id === pkg.id;
                return (
                  <button
                    key={pkg.id}
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() => setSelectedPkg(pkg)}
                    className={`rounded-2xl p-4 border transition-all duration-200 cursor-pointer flex flex-col justify-between text-left relative select-none shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#CD9F5B] ${
                      isSelected
                        ? "bg-[#FFFFFF] border-[#CD9F5B] ring-2 ring-[#CD9F5B]/70 shadow-md scale-[1.02]"
                        : "bg-[#FFFFFF] border-[#D6B48D] hover:border-[#CD9F5B] hover:bg-[#FCF0E6]"
                    }`}
                  >
                    {pkg.badge && (
                      <span className="absolute -top-2.5 right-3 text-[9px] font-bold px-2 py-0.5 rounded-full bg-[#CD9F5B] text-[#FDF7F0] shadow-xs">
                        {pkg.badge}
                      </span>
                    )}

                    <div>
                      <h4 className="font-serif-th text-sm font-bold text-[#5A432F] leading-snug">
                        {pkg.name}
                      </h4>
                      <p className="text-[11px] text-[#8C735D] mt-1 leading-tight font-serif-th">
                        {pkg.tagline}
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-[#D6B48D]/30 flex items-baseline justify-between">
                      <span className="text-lg font-bold font-mono text-[#CD9F5B]">
                        ฿{pkg.priceThb}
                      </span>
                      <span className="text-[10px] text-[#5A432F] font-serif-th font-semibold">
                        {pkg.credits} ครั้ง
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* CTA Button */}
            <button
              type="button"
              disabled={loading}
              onClick={handleStartCheckout}
              className="w-full py-3.5 rounded-xl bg-[#CD9F5B] hover:bg-[#B8853E] text-[#FDF7F0] font-bold font-serif-th text-sm shadow-xs active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2"
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
            <div className="p-4 rounded-2xl bg-[#FFFFFF] border border-[#D6B48D] space-y-3 shadow-xs">
              <div className="flex items-center justify-between text-xs text-[#8C735D] font-serif-th border-b border-[#D6B48D]/30 pb-2">
                <span>รายการ</span>
                <span className="font-bold text-[#5A432F]">
                  {selectedPkg.name} ({selectedPkg.credits} ครั้ง)
                </span>
              </div>
              <div className="flex items-center justify-between text-xs text-[#8C735D] font-serif-th">
                <span>ยอดชำระ</span>
                <span className="text-base font-bold font-mono text-[#CD9F5B]">
                  ฿{selectedPkg.priceThb} บาท
                </span>
              </div>
            </div>

            {checkoutData.qrCodeUri ? (
              <div className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-white text-[#5A432F] max-w-[240px] mx-auto shadow-md border border-[#D6B48D]">
                <img
                  src={checkoutData.qrCodeUri}
                  alt="PromptPay QR Code"
                  className="w-48 h-48 object-contain"
                />
                <span className="text-[11px] text-[#8C735D] font-serif-th">
                  สแกนด้วยแอปพลิเคชันธนาคารทุกแห่ง
                </span>
              </div>
            ) : (
              <div className="p-5 rounded-2xl bg-[#FCF0E6] border border-[#D6B48D] text-center space-y-2 shadow-xs">
                <div className="text-2xl text-[#CD9F5B]">✦</div>
                <h4 className="font-serif-th text-sm font-bold text-[#5A432F]">
                  ระบบจำลองการชำระเงิน (Test Gateway Simulator)
                </h4>
                <p className="text-xs text-[#8C735D] font-serif-th">
                  ระบบพร้อมผูกกับ Omise PromptPay QR เมื่อตั้งค่า Secret บน Cloudflare Workers
                </p>
              </div>
            )}

            <div className="pt-2 flex flex-col gap-2">
              <button
                type="button"
                disabled={loading}
                onClick={handleConfirmPayment}
                className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold font-serif-th text-sm shadow-xs active:scale-[0.98] transition-all cursor-pointer"
              >
                {loading ? "กำลังตรวจสอบรายการ..." : "✦ ยืนยันการชำระเงินแล้ว"}
              </button>

              <button
                type="button"
                onClick={() => setCheckoutData(null)}
                className="text-xs text-[#8C735D] hover:text-[#5A432F] py-1 cursor-pointer font-serif-th"
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
