"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";

import { getCreditPackages, type CreditPackage } from "@/lib/entitlement/packages";
import { startCheckout } from "@/lib/entitlement/start-checkout";
import { useEntitlement } from "@/lib/entitlement/use-entitlement";
import { useSessionUser } from "@/lib/auth/use-session";
import { useLocale } from "@/lib/i18n";
import { CheckMarkIcon } from "@/components/entitlement/EntitlementIcons";
import { PaymentTrustRow, creditsLabel, packageBadge, perReadingLabel } from "@/components/entitlement/PackageParts";
import { RedeemCodeForm } from "@/components/entitlement/RedeemCodeForm";
import { ThaiPhrases } from "@/components/ui/ThaiPhrases";

const AuthModal = dynamic(() => import("@/components/auth/AuthModal").then((m) => m.AuthModal), { ssr: false });
const BuyCreditsModal = dynamic(
  () => import("@/components/entitlement/BuyCreditsModal").then((m) => m.BuyCreditsModal),
  { ssr: false },
);

/** สิ่งที่ได้จากทุกแพ็ก — แพ็กต่างกันแค่จำนวนรอบ จึงพูดชุดเดียวกันทุกการ์ด */
const INCLUDED_TH = ["เปิดผังใหญ่ 5–12 ใบได้ทุกผัง", "ถามแม่หมอต่อได้ไม่จำกัด", "ปรึกษาแม่หมอพิเศษ 2 ท่าน", "ไม่มีวันหมดอายุ"];
const INCLUDED_EN = ["Every big 5–12 card spread", "Unlimited follow-up questions", "Both master readers", "Never expires"];

/**
 * 🛒 การ์ดแพ็กเติมรอบบนหน้า /pricing — island เดียวของหน้า
 * ---------------------------------------------------------------------------
 * ทุกการ์ดมีปุ่มซื้อของตัวเอง (ไม่ต้องเลือกก่อนแล้วค่อยกดอีกปุ่ม) ➔ ไปหน้าจ่ายเงิน Stripe ทันที
 * ยังไม่ล็อกอิน ➔ เปิดหน้าต่างเข้าสู่ระบบ (ล็อกอินอีเมลเสร็จพากลับมาหน้านี้ — ดู `afterEmailAuthUrl`)
 * ตัวจำลอง (ยังไม่ใส่คีย์ Stripe) ➔ เปิดหน้าต่างเติมรอบที่มีหน้ายืนยันของตัวจำลองอยู่แล้ว
 */
export function PricingPlans() {
  const { locale, isEnglish } = useLocale();
  const isEn = isEnglish || locale === "en";
  const packages = getCreditPackages(isEn);
  const { user } = useSessionUser();
  const ent = useEntitlement();

  const [busyId, setBusyId] = useState<CreditPackage["id"] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [simulatorOpen, setSimulatorOpen] = useState(false);
  const [cancelled, setCancelled] = useState(false);

  /* กลับมาจากปุ่ม "ยกเลิก" ในหน้า Stripe — บอกให้สบายใจว่ายังไม่ตัดเงิน แล้วล้างพารามิเตอร์ทิ้ง */
  useEffect(() => {
    const url = new URL(window.location.href);
    if (url.searchParams.get("checkout") !== "cancelled") return;
    setCancelled(true);
    url.searchParams.delete("checkout");
    window.history.replaceState({}, "", url.pathname + url.search + url.hash);
  }, []);

  /* กด "ย้อนกลับ" จากหน้า Stripe — หน้านี้กลับมาจาก bfcache พร้อมปุ่มที่ยังหมุนอยู่ */
  useEffect(() => {
    const onPageShow = (e: PageTransitionEvent) => {
      if (e.persisted) setBusyId(null);
    };
    window.addEventListener("pageshow", onPageShow);
    return () => window.removeEventListener("pageshow", onPageShow);
  }, []);

  const buy = async (pkg: CreditPackage) => {
    setError(null);
    if (!user) {
      setAuthOpen(true);
      return;
    }
    setBusyId(pkg.id);
    const result = await startCheckout(pkg.id, isEn);
    if (result.kind === "redirect") return;
    setBusyId(null);
    if (result.kind === "auth_required") setAuthOpen(true);
    else if (result.kind === "error") setError(result.message);
    else setSimulatorOpen(true);
  };

  const bonus = ent?.bonusRemaining ?? 0;

  return (
    <div className="space-y-6">
      {user && (
        <p className="glass-chip mx-auto flex w-fit items-center gap-1.5 px-4 py-1.5 font-serif-th text-sm text-ink-deep">
          {isEn ? (
            <>Purchased readings in your account: <strong className="text-gold-ink">{bonus}</strong></>
          ) : (
            <>รอบที่เติมไว้ในบัญชีของคุณ <strong className="text-gold-ink">{bonus}</strong> ครั้ง</>
          )}
        </p>
      )}

      {cancelled && (
        <p role="status" className="glass-tile mx-auto max-w-xl px-4 py-2.5 text-center font-serif-th text-sm text-ink-deep">
          {isEn
            ? "Payment cancelled — you have not been charged. Pick a package whenever you are ready."
            : "ยกเลิกการชำระเงินแล้ว ยังไม่มีการตัดเงิน เลือกแพ็กใหม่ได้ทุกเมื่อ"}
        </p>
      )}

      {error && (
        <p role="alert" className="mx-auto max-w-xl rounded-xl bg-err-wash px-4 py-3 text-center font-serif-th text-sm text-err">
          {error}
        </p>
      )}

      <ul className="grid gap-4 md:grid-cols-3 md:items-stretch">
        {packages.map((pkg) => {
          const badge = packageBadge(pkg, packages, isEn);
          const busy = busyId === pkg.id;
          return (
            <li
              key={pkg.id}
              className={`relative flex flex-col p-5 sm:p-6 ${
                pkg.isPopular ? "altar-panel-active md:-translate-y-2" : "altar-panel"
              }`}
            >
              {badge && (
                <span
                  className={`absolute -top-3 left-5 rounded-full px-3 py-0.5 font-serif-th text-xs font-bold ${
                    pkg.isPopular ? "bg-gold-ink text-surface" : "bg-ok text-surface"
                  }`}
                >
                  {badge}
                </span>
              )}

              <h3 className="font-serif-th text-sm font-semibold text-muted"><ThaiPhrases>{pkg.name}</ThaiPhrases></h3>
              <p className="mt-2 flex items-baseline gap-2">
                <span className="font-serif-th text-4xl font-bold text-ink-deep">฿{pkg.priceThb}</span>
                <span className="font-serif-th text-base font-semibold text-ink-deep">
                  / {creditsLabel(pkg.credits, isEn)}
                </span>
              </p>
              <p className="mt-1 font-serif-th text-sm text-gold-ink">{perReadingLabel(pkg, isEn)}</p>

              <ul className="mt-5 flex-1 space-y-2 border-t border-line-warm/60 pt-4">
                {(isEn ? INCLUDED_EN : INCLUDED_TH).map((t) => (
                  <li key={t} className="flex items-start gap-2 font-serif-th text-sm text-ink-deep">
                    <CheckMarkIcon className="mt-0.5 h-4 w-4 shrink-0 text-gold-ink" />
                    {t}
                  </li>
                ))}
              </ul>

              <button
                type="button"
                onClick={() => buy(pkg)}
                disabled={busyId !== null}
                aria-label={isEn ? `Buy ${creditsLabel(pkg.credits, isEn)} for ฿${pkg.priceThb}` : `ซื้อ ${creditsLabel(pkg.credits, isEn)} ราคา ${pkg.priceThb} บาท`}
                className={`mt-6 flex min-h-[48px] w-full items-center justify-center px-5 font-serif-th text-base font-bold cursor-pointer active:scale-[0.98] disabled:cursor-wait disabled:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-ink focus-visible:ring-offset-2 ${
                  pkg.isPopular ? "btn-gold-glass" : "btn-glass-ghost text-ink-deep"
                }`}
              >
                {busy
                  ? isEn
                    ? "Opening checkout…"
                    : "กำลังเปิดหน้าชำระเงิน…"
                  : !user
                    ? isEn
                      ? "Sign in to buy"
                      : "เข้าสู่ระบบเพื่อซื้อ"
                    : isEn
                      ? `Buy ${creditsLabel(pkg.credits, isEn)}`
                      : `ซื้อ ${creditsLabel(pkg.credits, isEn)}`}
              </button>
            </li>
          );
        })}
      </ul>

      <PaymentTrustRow isEn={isEn} />

      <div className="altar-panel mx-auto max-w-xl p-5">
        <h3 className="mb-1 font-serif-th text-base font-bold text-ink-deep">
          <ThaiPhrases>{isEn ? "Got a redeem code?" : "มีรหัสแลกสิทธิ์?"}</ThaiPhrases>
        </h3>
        <p className="mb-3 font-serif-th text-[13px] text-muted">
          {isEn ? "Enter it here and the readings go straight into your account." : "ใส่รหัสตรงนี้ รอบจะเข้าบัญชีของคุณทันที"}
        </p>
        <RedeemCodeForm isEn={isEn} signedIn={!!user} onRequireAuth={() => setAuthOpen(true)} />
      </div>

      {authOpen && <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} initialMode="signin" />}
      {simulatorOpen && (
        <BuyCreditsModal
          isOpen={simulatorOpen}
          onClose={() => setSimulatorOpen(false)}
          user={user}
          onRequireAuth={() => setAuthOpen(true)}
        />
      )}
    </div>
  );
}
