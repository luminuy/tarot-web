"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";

import { getCreditPackages, type CreditPackage } from "@/lib/entitlement/packages";
import { DAILY_LIMIT } from "@/lib/entitlement/limits";
import { startCheckout } from "@/lib/entitlement/start-checkout";
import { rememberPendingCheckout, takePendingCheckout } from "@/lib/entitlement/pending-checkout";
import { useEntitlement } from "@/lib/entitlement/use-entitlement";
import { useSessionUser } from "@/lib/auth/use-session";
import { useLocale } from "@/lib/i18n";
import { CheckMarkIcon } from "@/components/entitlement/EntitlementIcons";
import { PaymentMethodsNote, creditsLabel, packageBadge, perReadingLabel } from "@/components/entitlement/PackageParts";
import { RedeemCodeForm } from "@/components/entitlement/RedeemCodeForm";
import { ThaiPhrases } from "@/components/ui/ThaiPhrases";

const AuthModal = dynamic(() => import("@/components/auth/AuthModal").then((m) => m.AuthModal), { ssr: false });
const BuyCreditsModal = dynamic(
  () => import("@/components/entitlement/BuyCreditsModal").then((m) => m.BuyCreditsModal),
  { ssr: false },
);

/** แพ็กจ่ายเงินต่างกันแค่จำนวนรอบ — พูดสิ่งที่ได้เพิ่มจากแพ็กฟรีชุดเดียวกันทุกใบ */
const PAID_EXTRAS_TH = ["เปิดผังใหญ่ 5–12 ใบได้ทุกผัง", "ถามแม่หมอต่อได้ไม่จำกัด", "ปรึกษาแม่หมอพิเศษ 2 ท่าน", "รอบไม่มีวันหมดอายุ"];
const PAID_EXTRAS_EN = ["Every big 5–12 card spread", "Unlimited follow-up questions", "Both master readers", "Readings never expire"];
const FREE_TH = ["ผังมาตรฐาน 1–4 ใบ", "ถามแม่หมอต่อ 2 คำถามต่อรอบ", "เก็บประวัติคำทำนายข้ามเครื่อง"];
const FREE_EN = ["Standard 1–4 card spreads", "2 follow-up questions per reading", "Reading history on every device"];

/**
 * 🛒 แถวแพ็กบนหน้า /pricing — island เดียวของหน้า
 * ---------------------------------------------------------------------------
 * โครงแบบหน้าราคามาตรฐานสากล: แพ็กฟรีอยู่แถวเดียวกับแพ็กจ่ายเงิน · การ์ดสูงเท่ากัน
 * ชื่อ ➔ ราคา ➔ ปุ่ม ➔ รายการสิ่งที่ได้ (ปุ่มอยู่ระดับเดียวกันทุกใบ ตาไม่ต้องไล่หา)
 *
 * ทุกการ์ดมีปุ่มของตัวเอง ➔ ไปหน้าจ่ายเงิน Stripe ทันที
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
  const [auth, setAuth] = useState<"signin" | "signup" | null>(null);
  const [simulatorOpen, setSimulatorOpen] = useState(false);
  const [cancelled, setCancelled] = useState(false);
  const [resuming, setResuming] = useState(false);

  /*
   * ▶️ เพิ่งล็อกอินเสร็จ และมีแพ็กที่กดซื้อค้างไว้ ➔ ไปหน้าจ่ายเงินต่อทันที (INC-0249)
   * `AuthModal` พากลับมาหน้านี้เมื่อมีแพ็กค้าง (ล็อกอินอีเมลและ Google/LINE พามาพร้อม `auth_success=1`)
   */
  useEffect(() => {
    const url = new URL(window.location.href);
    if (url.searchParams.get("auth_success") !== "1") return;
    url.searchParams.delete("auth_success");
    url.searchParams.delete("new_user");
    window.history.replaceState({}, "", url.pathname + url.search + url.hash);
    const packageId = takePendingCheckout();
    if (!packageId) return;
    setBusyId(packageId as CreditPackage["id"]);
    setResuming(true);
    void startCheckout(packageId, isEn).then((result) => {
      if (result.kind === "redirect") return;
      setBusyId(null);
      setResuming(false);
      if (result.kind === "error") setError(result.message);
      else if (result.kind === "simulator") setSimulatorOpen(true);
    });
    // ทำครั้งเดียวตอนเปิดหน้า
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      rememberPendingCheckout(pkg.id); // ล็อกอินเสร็จพาไปจ่ายต่อเอง (site-chrome.ts)
      setAuth("signin");
      return;
    }
    setBusyId(pkg.id);
    const result = await startCheckout(pkg.id, isEn);
    if (result.kind === "redirect") return;
    setBusyId(null);
    if (result.kind === "auth_required") {
      rememberPendingCheckout(pkg.id);
      setAuth("signin");
    }
    else if (result.kind === "error") setError(result.message);
    else setSimulatorOpen(true);
  };

  const bonus = ent?.bonusRemaining ?? 0;
  const cardBase = "relative flex flex-col p-6";
  const btnBase =
    "flex min-h-[48px] w-full items-center justify-center px-5 font-serif-th text-base font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-ink focus-visible:ring-offset-2";
  const btnPress = "cursor-pointer active:scale-[0.98] disabled:cursor-wait disabled:opacity-80";

  return (
    <div className="space-y-6">
      {resuming && (
        <p role="status" className="glass-tile mx-auto max-w-xl px-4 py-2.5 text-center font-serif-th text-sm font-semibold text-ink-deep">
          {isEn ? "Signed in — taking you to checkout…" : "เข้าสู่ระบบแล้ว กำลังพาไปหน้าชำระเงิน…"}
        </p>
      )}
      {cancelled && (
        <p role="status" className="glass-tile mx-auto max-w-xl px-4 py-2.5 text-center font-serif-th text-sm text-ink-deep">
          {isEn ? "Payment cancelled — you have not been charged." : "ยกเลิกการชำระเงินแล้ว ยังไม่มีการตัดเงิน"}
        </p>
      )}
      {error && (
        <p role="alert" className="mx-auto max-w-xl rounded-xl bg-err-wash px-4 py-3 text-center font-serif-th text-sm text-err">
          {error}
        </p>
      )}

      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* ── แพ็กฟรี ── */}
        <li className={`${cardBase} altar-panel`}>
          <h3 className="font-serif-th text-base font-bold text-ink-deep">
            <ThaiPhrases>{isEn ? "Free member" : "สมาชิกฟรี"}</ThaiPhrases>
          </h3>
          <p className="mt-4 font-serif-th text-4xl font-bold text-ink-deep">฿0</p>
          <p className="mt-1 font-serif-th text-sm text-muted">
            {isEn ? `${DAILY_LIMIT} free reading every day` : `เปิดไพ่ฟรีวันละ ${DAILY_LIMIT} ครั้ง`}
          </p>
          {user ? (
            <p className={`${btnBase} mt-6 rounded-2xl border border-line-warm text-muted`}>
              {isEn ? "Your current plan" : "แผนที่ใช้อยู่"}
            </p>
          ) : (
            <button type="button" onClick={() => setAuth("signup")} className={`${btnBase} ${btnPress} btn-glass-ghost mt-6 text-ink-deep`}>
              {isEn ? "Sign up free" : "สมัครฟรี"}
            </button>
          )}
          <ul className="mt-6 space-y-2.5 border-t border-line-warm/60 pt-5">
            {(isEn ? FREE_EN : FREE_TH).map((t) => (
              <li key={t} className="flex items-start gap-2 font-serif-th text-sm text-ink-deep">
                <CheckMarkIcon className="mt-0.5 h-4 w-4 shrink-0 text-gold-ink" />
                {t}
              </li>
            ))}
          </ul>
        </li>

        {/* ── แพ็กเติมรอบ ── */}
        {packages.map((pkg) => {
          const badge = packageBadge(pkg, packages, isEn);
          const busy = busyId === pkg.id;
          return (
            <li key={pkg.id} className={`${cardBase} ${pkg.isPopular ? "altar-panel-active" : "altar-panel"}`}>
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-serif-th text-base font-bold text-ink-deep">
                  <ThaiPhrases>{creditsLabel(pkg.credits, isEn)}</ThaiPhrases>
                </h3>
                {badge && (
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-0.5 font-serif-th text-xs font-bold ${
                      pkg.isPopular ? "bg-gold-ink text-surface" : "bg-ok/10 text-ok"
                    }`}
                  >
                    {badge}
                  </span>
                )}
              </div>
              <p className="mt-4 font-serif-th text-4xl font-bold text-ink-deep">฿{pkg.priceThb}</p>
              <p className="mt-1 font-serif-th text-sm text-muted">{perReadingLabel(pkg, isEn)}</p>

              <button
                type="button"
                onClick={() => buy(pkg)}
                disabled={busyId !== null}
                aria-label={
                  isEn
                    ? `Buy ${creditsLabel(pkg.credits, isEn)} for ฿${pkg.priceThb}`
                    : `ซื้อ ${creditsLabel(pkg.credits, isEn)} ราคา ${pkg.priceThb} บาท`
                }
                className={`${btnBase} ${btnPress} mt-6 ${pkg.isPopular ? "btn-gold-glass" : "btn-glass-ghost text-ink-deep"}`}
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
                      ? "Buy now"
                      : "ซื้อแพ็กนี้"}
              </button>

              <ul className="mt-6 space-y-2.5 border-t border-line-warm/60 pt-5">
                <li className="font-serif-th text-xs font-semibold text-muted">
                  {isEn ? "Everything in Free, plus:" : "ทุกอย่างในแพ็กฟรี และ"}
                </li>
                {(isEn ? PAID_EXTRAS_EN : PAID_EXTRAS_TH).map((t) => (
                  <li key={t} className="flex items-start gap-2 font-serif-th text-sm text-ink-deep">
                    <CheckMarkIcon className="mt-0.5 h-4 w-4 shrink-0 text-gold-ink" />
                    {t}
                  </li>
                ))}
              </ul>
            </li>
          );
        })}
      </ul>

      <div className="flex flex-col items-center gap-3">
        <PaymentMethodsNote isEn={isEn} />
        {user && bonus > 0 && (
          <p className="font-serif-th text-xs text-muted">
            {isEn ? `You currently have ${bonus} purchased readings` : `ตอนนี้มีรอบที่เติมไว้ ${bonus} ครั้ง`}
          </p>
        )}
        <details className="group w-full max-w-md">
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
          <div className="altar-panel mt-3 p-4">
            <RedeemCodeForm isEn={isEn} signedIn={!!user} onRequireAuth={() => setAuth("signin")} />
          </div>
        </details>
      </div>

      {auth && <AuthModal isOpen onClose={() => setAuth(null)} initialMode={auth} />}
      {simulatorOpen && (
        <BuyCreditsModal
          isOpen={simulatorOpen}
          onClose={() => setSimulatorOpen(false)}
          user={user}
          onRequireAuth={() => setAuth("signin")}
        />
      )}
    </div>
  );
}
