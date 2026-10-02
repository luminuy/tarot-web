"use client";

import React, { useEffect, useRef, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { LocaleLink as Link } from "@/components/ui/LocaleLink";
import { getCreditPackages, type CreditPackage } from "@/lib/entitlement/packages";
import { mutateEntitlement, useEntitlement } from "@/lib/entitlement/use-entitlement";
import { startCheckout, type SimulatedCheckout } from "@/lib/entitlement/start-checkout";
import { useLocale } from "@/lib/i18n";
import { CheckMarkIcon } from "@/components/entitlement/EntitlementIcons";
import { PaymentTrustRow, creditsLabel, packageBadge, perReadingLabel } from "@/components/entitlement/PackageParts";
import { RedeemCodeForm } from "@/components/entitlement/RedeemCodeForm";

interface BuyCreditsModalProps {
  isOpen: boolean;
  onClose: () => void;
  user?: { id: string; name?: string; email?: string } | null;
  onRequireAuth?: () => void;
}

/**
 * 💳 หน้าต่างเติมรอบดูดวง
 * ---------------------------------------------------------------------------
 * เลือกแพ็ก (กลุ่มปุ่มเลือกแบบ radio) ➔ ปุ่มเดียว "ชำระเงิน ฿xxx" ➔ ไปหน้าจ่ายเงินของ Stripe
 * จ่ายเสร็จ Stripe ส่งกลับมาที่ /api/entitlement/checkout/confirm ซึ่งตรวจกับ Stripe ก่อนเติมรอบ
 *
 * ตัวจำลอง (ยังไม่ใส่คีย์ Stripe / เครื่องพัฒนา) ยังมีหน้ายืนยันของตัวเองเหมือนเดิม
 */
export const BuyCreditsModal: React.FC<BuyCreditsModalProps> = ({ isOpen, onClose, user, onRequireAuth }) => {
  const { locale, isEnglish } = useLocale();
  const isEn = isEnglish || locale === "en";
  const creditPackages = getCreditPackages(isEn);
  const ent = useEntitlement();

  const [selectedPkgId, setSelectedPkgId] = useState<CreditPackage["id"]>("pack_10");
  const selectedPkg: CreditPackage = creditPackages.find((p) => p.id === selectedPkgId) || creditPackages[1];

  const [loading, setLoading] = useState(false);
  /* A3-07: ไทม์เมอร์ปิดอัตโนมัติหลังชำระสำเร็จ — ต้องล้างเมื่อปิดเอง/unmount ไม่งั้นไปปิดโมดัลที่เพิ่งเปิดใหม่ */
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const clearCloseTimer = () => {
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    closeTimerRef.current = null;
  };
  useEffect(() => {
    if (!isOpen) clearCloseTimer();
    return clearCloseTimer;
  }, [isOpen]);
  /* กด "ย้อนกลับ" จากหน้าจ่ายเงิน Stripe — เบราว์เซอร์คืนหน้านี้จาก bfcache พร้อมปุ่มที่ยังหมุนอยู่ */
  useEffect(() => {
    const onPageShow = (e: PageTransitionEvent) => {
      if (e.persisted) setLoading(false);
    };
    window.addEventListener("pageshow", onPageShow);
    return () => window.removeEventListener("pageshow", onPageShow);
  }, []);

  const [simulated, setSimulated] = useState<SimulatedCheckout | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const requireAuth = () => {
    if (onRequireAuth) {
      onClose();
      onRequireAuth();
    } else {
      setErrorMsg(
        isEn
          ? "Please sign in first — your readings will be saved to your account."
          : "กรุณาเข้าสู่ระบบก่อน — รอบที่เติมจะผูกกับบัญชีของคุณ",
      );
    }
  };

  const handleStartCheckout = async () => {
    // เติมรอบต้องผูกกับบัญชี — ถ้ายังไม่ได้เข้าสู่ระบบ ให้บอกตรง ๆ ตรงนี้
    if (!user) {
      requireAuth();
      return;
    }
    setLoading(true);
    setErrorMsg(null);
    const result = await startCheckout(selectedPkg.id, isEn);
    // `redirect` = กำลังย้ายไปหน้า Stripe · ปล่อยปุ่มหมุนค้างไว้ระหว่างเปลี่ยนหน้า
    if (result.kind === "redirect") return;
    setLoading(false);
    if (result.kind === "auth_required") requireAuth();
    else if (result.kind === "error") setErrorMsg(result.message);
    else setSimulated(result.data);
  };

  const handleConfirmSimulated = async () => {
    if (!simulated || !user) return;
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch("/api/entitlement/checkout/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: simulated.orderId, packageId: simulated.packageId, userId: user.id }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        throw new Error(data.error || (isEn ? "Unable to confirm payment." : "ยืนยันการชำระเงินไม่สำเร็จ"));
      }
      mutateEntitlement();
      setSuccessMsg(
        isEn ? `Added ${data.grantedCredits} readings to your account.` : `เติมรอบสำเร็จ +${data.grantedCredits} ครั้ง`,
      );
      clearCloseTimer();
      closeTimerRef.current = setTimeout(() => {
        closeTimerRef.current = null;
        setSimulated(null);
        setSuccessMsg(null);
        onClose();
      }, 2000);
    } catch (err) {
      setErrorMsg(
        err instanceof Error && err.message
          ? err.message
          : isEn
            ? "Something went wrong while confirming."
            : "เกิดข้อผิดพลาดระหว่างยืนยันรายการ",
      );
    } finally {
      setLoading(false);
    }
  };

  const resetModalState = () => {
    clearCloseTimer();
    setSimulated(null);
    setSuccessMsg(null);
    setErrorMsg(null);
    onClose();
  };

  const bonus = ent?.bonusRemaining ?? 0;
  const priceLabel = isEn ? `฿${selectedPkg.priceThb}` : `${selectedPkg.priceThb} บาท`;

  return (
    <Modal
      isOpen={isOpen}
      onClose={resetModalState}
      maxWidth="lg"
      title={isEn ? "Top up your readings" : "เติมรอบดูดวง"}
      description={
        <span className="font-serif-th leading-relaxed">
          {isEn
            ? "Pay once, no subscription · Readings you buy never expire"
            : "จ่ายครั้งเดียว ไม่มีรายเดือน · รอบที่เติมไม่มีวันหมดอายุ"}
        </span>
      }
    >
      <div className="space-y-5 pt-1 text-ink-deep">
        {/* ♿ R-21: ข้อความผิดพลาดในกล่องซื้อสิทธิ์ต้องถูกประกาศทันที */}
        {errorMsg && (
          <p role="alert" className="rounded-xl bg-err-wash px-4 py-3 text-center font-serif-th text-sm text-err">
            {errorMsg}
          </p>
        )}
        {successMsg && (
          <p role="status" className="rounded-xl bg-ok/10 px-4 py-3 text-center font-serif-th text-sm font-bold text-ok">
            {successMsg}
          </p>
        )}

        {!simulated ? (
          <>
            {user && bonus > 0 && (
              <p className="glass-chip mx-auto flex w-fit items-center gap-1.5 px-3 py-1 font-serif-th text-xs font-semibold text-ink-deep">
                {isEn ? (
                  <>You have <strong className="text-gold-ink">{bonus}</strong> purchased readings left</>
                ) : (
                  <>ตอนนี้มีรอบที่เติมไว้ <strong className="text-gold-ink">{bonus}</strong> ครั้ง</>
                )}
              </p>
            )}

            <fieldset className="space-y-2.5">
              <legend className="sr-only">{isEn ? "Choose a package" : "เลือกแพ็กเกจ"}</legend>
              {creditPackages.map((pkg) => {
                const isSelected = selectedPkg.id === pkg.id;
                const badge = packageBadge(pkg, creditPackages, isEn);
                return (
                  <label
                    key={pkg.id}
                    className={`relative flex cursor-pointer items-center gap-3 rounded-2xl border px-4 py-3.5 transition-[border-color,background-color,box-shadow] duration-150 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-gold-ink ${
                      isSelected
                        ? "border-gold-ink bg-surface shadow-[0_0_0_1px_var(--color-gold-ink)]"
                        : "border-line-warm bg-surface-warm hover:border-line-interactive-warm"
                    }`}
                  >
                    <input
                      type="radio"
                      name="credit-package"
                      value={pkg.id}
                      checked={isSelected}
                      onChange={() => setSelectedPkgId(pkg.id)}
                      className="sr-only"
                    />
                    <span
                      aria-hidden="true"
                      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
                        isSelected ? "border-gold-ink" : "border-line-interactive"
                      }`}
                    >
                      {isSelected && <span className="h-2.5 w-2.5 rounded-full bg-gold-ink" />}
                    </span>

                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <span className="font-serif-th text-base font-bold text-ink-deep">
                          {creditsLabel(pkg.credits, isEn)}
                        </span>
                        {badge && (
                          <span
                            className={`rounded-full px-2 py-0.5 font-serif-th text-[12px] font-bold ${
                              pkg.isPopular ? "bg-gold-ink text-surface" : "bg-ok/10 text-ok"
                            }`}
                          >
                            {badge}
                          </span>
                        )}
                      </span>
                      <span className="mt-0.5 hidden font-serif-th text-[13px] leading-snug text-muted sm:block">{pkg.name}</span>
                    </span>

                    <span className="shrink-0 text-right">
                      <span className="block font-serif-th text-lg font-bold text-ink-deep">฿{pkg.priceThb}</span>
                      <span className="block font-serif-th text-[12px] text-muted">{perReadingLabel(pkg, isEn)}</span>
                    </span>
                  </label>
                );
              })}
            </fieldset>

            <ul className="grid gap-1.5 rounded-2xl bg-inset-warm px-4 py-3 font-serif-th text-[13px] text-ink-deep sm:grid-cols-3 sm:gap-3">
              {(isEn
                ? ["Every big 5–12 card spread", "Unlimited follow-up questions", "Ready right after payment"]
                : ["เปิดผังใหญ่ 5–12 ใบได้ทุกผัง", "ถามแม่หมอต่อได้ไม่จำกัด", "จ่ายแล้วใช้ได้ทันที"]
              ).map((t) => (
                <li key={t} className="flex items-center gap-1.5">
                  <CheckMarkIcon className="h-3.5 w-3.5 shrink-0 text-gold-ink" />
                  {t}
                </li>
              ))}
            </ul>

            <div className="space-y-3">
              <button
                type="button"
                disabled={loading}
                onClick={handleStartCheckout}
                className="btn-gold-glass flex min-h-[52px] w-full items-center justify-center gap-2 px-6 font-serif-th text-base font-bold cursor-pointer active:scale-[0.98] disabled:cursor-wait disabled:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-ink focus-visible:ring-offset-2"
              >
                {loading
                  ? isEn
                    ? "Opening secure checkout…"
                    : "กำลังเปิดหน้าชำระเงิน…"
                  : !user
                    ? isEn
                      ? "Sign in to continue"
                      : "เข้าสู่ระบบเพื่อซื้อ"
                    : isEn
                      ? `Pay ${priceLabel}`
                      : `ชำระเงิน ${priceLabel}`}
              </button>
              <PaymentTrustRow isEn={isEn} />
            </div>

            <details className="group rounded-2xl border border-line-warm bg-surface-warm px-4 py-3">
              <summary className="tap-overlay-y flex cursor-pointer list-none items-center justify-between font-serif-th text-sm font-semibold text-ink-deep">
                {isEn ? "Have a redeem code?" : "มีรหัสแลกสิทธิ์?"}
                <svg
                  viewBox="0 0 20 20"
                  aria-hidden="true"
                  className="h-4 w-4 fill-none stroke-current text-muted transition-transform duration-150 group-open:rotate-180"
                  strokeWidth={2}
                >
                  <path d="M5 7.5l5 5 5-5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </summary>
              <div className="pt-3">
                <RedeemCodeForm isEn={isEn} signedIn={!!user} onRequireAuth={requireAuth} />
              </div>
            </details>

            <p className="text-center">
              <Link
                href="/pricing"
                prefetch={false}
                className="font-serif-th text-xs font-semibold text-gold-ink underline underline-offset-4 hover:text-gold-ink-deep"
              >
                {isEn ? "Compare packages & payment FAQ" : "ดูรายละเอียดแพ็กเกจและคำถามที่พบบ่อย"}
              </Link>
            </p>
          </>
        ) : (
          /* หน้าจำลอง — เครื่องพัฒนา / ยังไม่ใส่คีย์ Stripe (production ปฏิเสธรายการจำลองที่ด่านยืนยัน) */
          <div className="space-y-4 text-center">
            <div className="altar-card-porcelain !rounded-2xl space-y-2 p-4 font-serif-th text-sm">
              <div className="flex items-center justify-between text-muted">
                <span>{isEn ? "Package" : "แพ็กเกจ"}</span>
                <span className="font-bold text-ink-deep">{creditsLabel(selectedPkg.credits, isEn)}</span>
              </div>
              <div className="flex items-center justify-between text-muted">
                <span>{isEn ? "Total" : "ยอดชำระ"}</span>
                <span className="text-base font-bold text-ink-deep">฿{selectedPkg.priceThb}</span>
              </div>
            </div>
            <div className="glass-tile !rounded-2xl space-y-1 p-4">
              <h4 className="font-serif-th text-sm font-bold text-ink-deep">
                {isEn ? "Test payment simulator" : "ระบบจำลองการชำระเงิน"}
              </h4>
              <p className="font-serif-th text-xs text-muted">
                {isEn
                  ? "Stripe Checkout opens here once the Stripe secret key is set."
                  : "หน้าจ่ายเงิน Stripe จะเปิดแทนส่วนนี้เมื่อตั้งคีย์ Stripe แล้ว"}
              </p>
            </div>
            <button
              type="button"
              disabled={loading}
              onClick={handleConfirmSimulated}
              className="btn-gold-glass min-h-[48px] w-full px-6 font-serif-th text-sm font-bold cursor-pointer active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-ink"
            >
              {loading ? (isEn ? "Verifying…" : "กำลังตรวจสอบ…") : isEn ? "Confirm test payment" : "ยืนยันการชำระเงินทดสอบ"}
            </button>
            <button
              type="button"
              onClick={() => setSimulated(null)}
              className="tap-overlay-y font-serif-th text-xs text-muted hover:text-ink-deep cursor-pointer"
            >
              {isEn ? "← Choose another package" : "← เปลี่ยนแพ็กเกจ"}
            </button>
          </div>
        )}
      </div>
    </Modal>
  );
};
