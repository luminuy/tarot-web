"use client";

import { useEffect, useRef, useState } from "react";
import { LocaleLink as Link } from "@/components/ui/LocaleLink";
import { getCreditPackages, type CreditPackage } from "@/lib/entitlement/packages";
import { mutateEntitlement, useEntitlement } from "@/lib/entitlement/use-entitlement";
import { startCheckout, type SimulatedCheckout } from "@/lib/entitlement/start-checkout";
import { rememberPendingCheckout } from "@/lib/entitlement/pending-checkout";
import { useSessionUser } from "@/lib/auth/use-session";
import { useLocale } from "@/lib/i18n";
import { CheckMarkIcon } from "@/components/entitlement/EntitlementIcons";
import { PaymentMethodsNote, creditsLabel, packageBadge, perReadingLabel } from "@/components/entitlement/PackageParts";
import { RedeemCodeForm } from "@/components/entitlement/RedeemCodeForm";

export interface PurchasePanelProps {
  /** ผู้ใช้จากหน้าที่ครอบ (ถ้ามี) — ไม่ส่งมาจะอ่านจากแคชเซสชันกลางเอง */
  user?: { id: string } | null;
  /** ยังไม่ล็อกอิน: หน้าที่ครอบเปิดหน้าต่างล็อกอิน (แพ็กที่เลือกถูกจำไว้ให้แล้ว — ดู pending-checkout.ts) */
  onRequireAuth?: () => void;
  /** ตัวจำลองยืนยันสำเร็จ — ให้หน้าที่ครอบปิดหน้าต่าง */
  onDone?: () => void;
}

/**
 * 💳 แผงเลือกแพ็ก + จ่ายเงิน — **ชุดเดียวทั้งเว็บ**
 * ---------------------------------------------------------------------------
 * ใช้ทั้งใน `BuyCreditsModal` และในหน้าต่างสิทธิ์ (`AccessDialog`) ตอนโควตาหมด/ผังใหญ่/แม่หมอพิเศษ
 *
 * 🔴 บทเรียนที่เจ้าของเจอ: เดิมหน้าต่างสิทธิ์ขายของรอบหนึ่ง ("เติมรอบ เปิดต่อได้เลย" + ปุ่ม)
 *    กดแล้วเปิด**หน้าต่างที่สองที่ขายของซ้ำอีกรอบ** = ซ้ำซ้อน ต้องกดสองชั้นกว่าจะถึงหน้าจ่ายเงิน
 *    ตอนนี้หน้าต่างสิทธิ์ฝังแผงนี้เลย ขั้นเดียวถึง Stripe
 *
 * ยังไม่ล็อกอิน ➔ จำแพ็กที่เลือกไว้ใน sessionStorage แล้วค่อยให้ล็อกอิน
 * ล็อกอินเสร็จหน้าโหลดใหม่ ➔ `site-chrome.ts` พาไปหน้าจ่ายเงินต่อเอง (เดิมลืมไปเลยว่าจะซื้ออะไร)
 */
export function PurchasePanel({ user: userProp, onRequireAuth, onDone }: PurchasePanelProps) {
  const { locale, isEnglish } = useLocale();
  const isEn = isEnglish || locale === "en";
  const creditPackages = getCreditPackages(isEn);
  const ent = useEntitlement();
  const { user: sessionUser } = useSessionUser();
  const user = userProp ?? sessionUser;

  const [selectedPkgId, setSelectedPkgId] = useState<CreditPackage["id"]>("pack_10");
  const selectedPkg: CreditPackage = creditPackages.find((p) => p.id === selectedPkgId) || creditPackages[1];

  const [loading, setLoading] = useState(false);
  /* A3-07: ไทม์เมอร์ปิดอัตโนมัติหลังชำระสำเร็จ — ต้องล้างตอน unmount ไม่งั้นไปปิดหน้าต่างที่เพิ่งเปิดใหม่ */
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const clearCloseTimer = () => {
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    closeTimerRef.current = null;
  };
  useEffect(() => {
    return clearCloseTimer;
  }, []);
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

  /** ให้ล็อกอิน — `forPurchase` จำแพ็กไว้พาไปจ่ายต่อหลังล็อกอิน (รหัสแลกสิทธิ์ไม่ต้องจำ) */
  const requireAuth = (forPurchase = true) => {
    if (forPurchase) rememberPendingCheckout(selectedPkg.id);
    if (onRequireAuth) {
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
        onDone?.();
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

  const bonus = ent?.bonusRemaining ?? 0;
  const priceLabel = isEn ? `฿${selectedPkg.priceThb}` : `${selectedPkg.priceThb} บาท`;

  return (
    <div className="space-y-5 text-ink-deep">
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
            <ul className="flex flex-wrap justify-center gap-x-4 gap-y-1.5 font-serif-th text-[13px] text-ink-deep">
              {(isEn
                ? ["Every big 5–12 card spread", "Unlimited follow-up questions", "Never expires"]
                : ["เปิดผังใหญ่ได้ทุกผัง", "ถามแม่หมอต่อได้ไม่จำกัด", "ไม่มีวันหมดอายุ"]
              ).map((t) => (
                <li key={t} className="inline-flex items-center gap-1.5">
                  <CheckMarkIcon className="h-3.5 w-3.5 shrink-0 text-gold-ink" />
                  {t}
                </li>
              ))}
            </ul>

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

            <div className="space-y-2.5">
              <button
                type="button"
                disabled={loading}
                onClick={handleStartCheckout}
                className="btn-gold-glass flex min-h-[52px] w-full items-center justify-center gap-2 px-6 font-serif-th text-base font-bold cursor-pointer active:scale-[0.98] disabled:cursor-wait disabled:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-ink focus-visible:ring-offset-2"
              >
                {loading
                  ? isEn
                    ? "Opening checkout…"
                    : "กำลังเปิดหน้าชำระเงิน…"
                  : !user
                    ? isEn
                      ? "Sign in to continue"
                      : "เข้าสู่ระบบเพื่อซื้อ"
                    : isEn
                      ? `Continue · ${priceLabel}`
                      : `ชำระเงิน ${priceLabel}`}
              </button>
              <PaymentMethodsNote isEn={isEn} />
              {user && bonus > 0 && (
                <p className="text-center font-serif-th text-xs text-muted">
                  {isEn ? `You currently have ${bonus} purchased readings` : `ตอนนี้มีรอบที่เติมไว้ ${bonus} ครั้ง`}
                </p>
              )}
            </div>

            <div className="flex flex-col items-center gap-2 border-t border-line-warm/50 pt-4">
              <details className="group w-full">
                <summary className="tap-overlay-y mx-auto flex w-fit cursor-pointer list-none items-center gap-1 font-serif-th text-sm font-semibold text-ink-deep hover:text-gold-ink">
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
                  <RedeemCodeForm isEn={isEn} signedIn={!!user} onRequireAuth={() => requireAuth(false)} />
                </div>
              </details>
              <Link
                href="/pricing"
                prefetch={false}
                className="tap-overlay-y font-serif-th text-xs text-muted underline underline-offset-4 hover:text-ink-deep"
              >
                {isEn ? "Compare plans and read the payment FAQ" : "เทียบแพ็กและคำถามเรื่องการชำระเงิน"}
              </Link>
            </div>
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
  );
}
