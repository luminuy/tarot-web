"use client";

import { useRef, useState } from "react";
import { STUDIO_COLOR_PRESETS, STUDIO_DEFAULT_COLOR, STUDIO_PAPER, ensureReadableColor, normalizeHex } from "@/lib/studio/brand";
import { type StudioCall, type StudioSettingsT, uploadStudioLogo } from "./studio-api";

/**
 * ✦ แท็บ "แบรนด์และการตั้งค่า" ของสตูดิโอแม่หมอ
 * ---------------------------------------------------------------------------
 * หลักที่ใช้ (แบบหน้าตั้งค่าร้านของบริการระดับโลก):
 *  • เห็นผลก่อนกรอก — ตัวอย่างหัวคำอ่านอยู่บนสุดในมือถือ ข้างขวาบนจอใหญ่ เปลี่ยนตามทันทีที่พิมพ์
 *  • ไม่ต้องรู้เรื่องเทคนิค — อัปโหลดโลโก้จากเครื่อง (ย่อให้เอง) · เลือกสีจากชุดที่อ่านง่ายแน่นอน · ไม่มีรหัสสี/คอนทราสต์
 *  • สวิตช์ = มีผลทันที (ตัวช่วย AI) · ช่องกรอก = กดบันทึก (ปุ่มกดได้เมื่อมีอะไรเปลี่ยนเท่านั้น)
 */

const fieldCls =
  "w-full rounded-xl border border-line-interactive-warm bg-surface px-3.5 py-2.5 text-[15px] leading-relaxed text-ink-deep outline-none focus-visible:ring-2 focus-visible:ring-gold-ink/40";
const btnPrimary =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-gold-ink px-5 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-40";
const btnGhost =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-line-interactive-warm bg-surface px-4 text-sm font-semibold text-ink-deep transition-colors hover:bg-inset-warm disabled:opacity-50";
const card = "rounded-[24px] border border-line bg-surface p-5 sm:p-7";
const label = "block text-sm font-semibold text-ink-deep";
const hint = "mt-0.5 block text-[13px] font-normal leading-relaxed text-muted";

const LOGO_SIDE = 256;
const LOGO_MAX_BYTES = 400_000;
const SOURCE_MAX_BYTES = 15_000_000;

/** ย่อรูปให้อยู่ในสี่เหลี่ยมจัตุรัส 256px แบบไม่ตัดขอบ (โลโก้ตัวหนังสือยาว ๆ ไม่ขาด) · พื้นโปร่งใส */
async function squareLogo(file: File): Promise<Blob> {
  const bmp = await createImageBitmap(file);
  const scale = Math.min(LOGO_SIDE / bmp.width, LOGO_SIDE / bmp.height, 1);
  const w = Math.round(bmp.width * scale);
  const h = Math.round(bmp.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = LOGO_SIDE;
  canvas.height = LOGO_SIDE;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("no canvas");
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(bmp, (LOGO_SIDE - w) / 2, (LOGO_SIDE - h) / 2, w, h);
  bmp.close();
  const toBlob = (type: string, q?: number) => new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, q));
  const png = await toBlob("image/png");
  if (png && png.size <= LOGO_MAX_BYTES) return png;
  const webp = await toBlob("image/webp", 0.9);
  if (webp && webp.size <= LOGO_MAX_BYTES) return webp;
  throw new Error("too large");
}

type Brand = Pick<StudioSettingsT, "brandName" | "logoUrl" | "brandColor" | "contactLine">;
const same = (a: Brand, b: Brand) =>
  (a.brandName ?? "").trim() === (b.brandName ?? "").trim() &&
  (a.logoUrl ?? "").trim() === (b.logoUrl ?? "").trim() &&
  (normalizeHex(a.brandColor) ?? STUDIO_DEFAULT_COLOR) === (normalizeHex(b.brandColor) ?? STUDIO_DEFAULT_COLOR) &&
  (a.contactLine ?? "").trim() === (b.contactLine ?? "").trim();

export function BrandSettings({
  settings,
  readerName,
  token,
  call,
  onSaved,
}: {
  settings: StudioSettingsT;
  readerName: string;
  token: string | null;
  call: StudioCall;
  onSaved: () => void;
}) {
  const [saved, setSaved] = useState<StudioSettingsT>(settings);
  const [draft, setDraft] = useState<Brand>(settings);
  const [brandMsg, setBrandMsg] = useState<{ tone: "ok" | "err"; text: string } | null>(null);
  const [aiMsg, setAiMsg] = useState<{ tone: "ok" | "err"; text: string } | null>(null);
  const [busy, setBusy] = useState<"brand" | "logo" | "ai" | null>(null);
  const [showLink, setShowLink] = useState(Boolean(settings.logoUrl && !settings.logoUrl.startsWith("/api/studio/logo/")));
  const fileRef = useRef<HTMLInputElement>(null);

  const color = ensureReadableColor(draft.brandColor);
  const pickedHex = normalizeHex(draft.brandColor) ?? STUDIO_DEFAULT_COLOR;
  const isPreset = STUDIO_COLOR_PRESETS.some((p) => p.hex === pickedHex);
  const dirty = !same(draft, saved);
  const shownName = draft.brandName?.trim() || readerName;
  const logoSrc = draft.logoUrl?.trim() || null;

  const put = (next: StudioSettingsT) =>
    call<{ brandColor: string; colorAdjusted: boolean; logoUrl: string | null }>("/settings", {
      method: "PUT",
      body: {
        brandName: next.brandName,
        logoUrl: next.logoUrl,
        brandColor: next.brandColor,
        contactLine: next.contactLine,
        showAiDisclosure: next.showAiDisclosure,
        aiAssist: next.aiAssist,
      },
    });

  async function saveBrand() {
    setBusy("brand");
    setBrandMsg(null);
    const next = { ...saved, ...draft };
    const res = await put(next);
    setBusy(null);
    if (!res.ok) return setBrandMsg({ tone: "err", text: res.error });
    const stored = { ...next, brandColor: res.data.brandColor, logoUrl: res.data.logoUrl };
    setSaved(stored);
    setDraft(stored);
    setBrandMsg({ tone: "ok", text: res.data.colorAdjusted ? "บันทึกแล้ว — ปรับสีให้เข้มขึ้นนิดหน่อยเพื่อให้ลูกค้าอ่านง่าย" : "บันทึกแล้ว" });
    onSaved();
  }

  async function onPickFile(file: File | undefined) {
    if (!file) return;
    setBrandMsg(null);
    if (!file.type.startsWith("image/") || file.size > SOURCE_MAX_BYTES) {
      return setBrandMsg({ tone: "err", text: "เลือกไฟล์รูป (PNG, JPG หรือ WebP) ขนาดไม่เกิน 15 MB" });
    }
    setBusy("logo");
    let blob: Blob;
    try {
      blob = await squareLogo(file);
    } catch {
      setBusy(null);
      return setBrandMsg({ tone: "err", text: "เปิดรูปนี้ไม่ได้ ลองใช้รูป PNG หรือ JPG" });
    }
    const res = await uploadStudioLogo(token, blob);
    setBusy(null);
    if (!res.ok) {
      if (res.code === "storage_unavailable") setShowLink(true);
      return setBrandMsg({ tone: "err", text: res.error });
    }
    setSaved((s) => ({ ...s, logoUrl: res.logoUrl }));
    setDraft((d) => ({ ...d, logoUrl: res.logoUrl }));
    setShowLink(false);
    setBrandMsg({ tone: "ok", text: "ใส่โลโก้แล้ว" });
    onSaved();
  }

  async function removeLogo() {
    setBusy("logo");
    setBrandMsg(null);
    const res = await call("/logo", { method: "DELETE" });
    setBusy(null);
    if (!res.ok) return setBrandMsg({ tone: "err", text: res.error });
    setSaved((s) => ({ ...s, logoUrl: null }));
    setDraft((d) => ({ ...d, logoUrl: null }));
    setBrandMsg({ tone: "ok", text: "เอาโลโก้ออกแล้ว" });
    onSaved();
  }

  async function saveAi(patch: Partial<Pick<StudioSettingsT, "aiAssist" | "showAiDisclosure">>) {
    setBusy("ai");
    setAiMsg(null);
    const next = { ...saved, ...patch };
    const res = await put(next);
    setBusy(null);
    if (!res.ok) return setAiMsg({ tone: "err", text: res.error });
    setSaved(next);
    setAiMsg({ tone: "ok", text: "aiAssist" in patch ? (patch.aiAssist ? "เปิดตัวช่วย AI แล้ว" : "ปิดตัวช่วย AI แล้ว") : "บันทึกแล้ว" });
    onSaved();
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
      {/* ── ตัวอย่างที่ลูกค้าเห็น (บนสุดในมือถือ) ── */}
      <aside aria-label="ตัวอย่างที่ลูกค้าเห็น" className="lg:sticky lg:top-6 lg:order-2">
        <p className="mb-2 text-[13px] font-semibold text-muted">ตัวอย่างที่ลูกค้าเห็น</p>
        <div className="space-y-3 rounded-[24px] border border-line p-6 text-center shadow-sm" style={{ backgroundColor: STUDIO_PAPER }}>
          {logoSrc && (
            // eslint-disable-next-line @next/next/no-img-element -- โลโก้ของแม่หมอ (ไม่ใช่ภาพไพ่) จาก R2 หรือลิงก์ภายนอก
            <img src={logoSrc} alt="" width={56} height={56} className="mx-auto h-14 w-14 rounded-xl object-contain" />
          )}
          <p className="text-sm font-bold" style={{ color: color.color }}>
            {shownName}
          </p>
          <p className="text-lg font-bold text-ink-deep">ความรักช่วงปลายปี</p>
          <p className="mx-auto w-fit rounded-xl border px-3 py-1.5 text-[13px]" style={{ borderColor: color.color, color: color.color }}>
            ภาพรวม
          </p>
          <p className="text-[13px] leading-relaxed text-muted">ไพ่บอกว่าช่วงนี้ให้ฟังใจตัวเองให้มาก…</p>
          {draft.contactLine?.trim() && (
            <p className="border-t border-line pt-3 text-[13px] text-ink">
              ติดต่อ {shownName}: {draft.contactLine.trim()}
            </p>
          )}
        </div>
      </aside>

      <div className="space-y-6 lg:order-1">
        {/* ── หน้าตาคำอ่าน ── */}
        <section aria-labelledby="brand-h" className={`${card} space-y-5`}>
          <div className="space-y-1">
            <h2 id="brand-h" className="text-lg font-bold text-ink-deep">
              หน้าตาคำอ่านที่ส่งให้ลูกค้า
            </h2>
            <p className="text-[13px] leading-relaxed text-muted">ใส่ชื่อ โลโก้ และสีของคุณ ลูกค้าจะเห็นตามตัวอย่าง ไม่ใส่ก็ได้ ระบบใช้ค่าเริ่มต้นที่ดูดีอยู่แล้ว</p>
          </div>

          <label className={label}>
            ชื่อร้านหรือชื่อที่ลูกค้ารู้จัก
            <span className={hint}>เว้นว่างไว้ = ใช้ชื่อ &quot;{readerName}&quot;</span>
            <input
              value={draft.brandName ?? ""}
              maxLength={60}
              placeholder="เช่น บ้านไพ่แม่จันทร์"
              onChange={(e) => setDraft({ ...draft, brandName: e.target.value })}
              className={`${fieldCls} mt-2 min-h-11 font-normal`}
            />
          </label>

          <div>
            <p className={label}>โลโก้</p>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <div
                className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl border border-dashed border-line-interactive-warm"
                style={{ backgroundColor: STUDIO_PAPER }}
              >
                {logoSrc ? (
                  // eslint-disable-next-line @next/next/no-img-element -- โลโก้ของแม่หมอ (ไม่ใช่ภาพไพ่)
                  <img src={logoSrc} alt="โลโก้ปัจจุบัน" width={64} height={64} className="h-14 w-14 rounded-lg object-contain" />
                ) : (
                  <span className="text-[12px] text-muted">ไม่มี</span>
                )}
              </div>
              <input
                ref={fileRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="sr-only"
                tabIndex={-1}
                aria-hidden="true"
                onChange={(e) => {
                  void onPickFile(e.target.files?.[0]);
                  e.target.value = "";
                }}
              />
              <button type="button" onClick={() => fileRef.current?.click()} disabled={busy !== null} className={btnGhost}>
                {busy === "logo" ? "กำลังอัปโหลด…" : logoSrc ? "เปลี่ยนรูป" : "อัปโหลดรูป"}
              </button>
              {logoSrc && (
                <button type="button" onClick={removeLogo} disabled={busy !== null} className="min-h-11 px-2 text-sm font-semibold text-muted underline-offset-2 hover:text-ink hover:underline">
                  เอาออก
                </button>
              )}
            </div>
            <p className={hint}>รูป PNG, JPG หรือ WebP · ระบบย่อให้พอดีเอง</p>
            {showLink ? (
              <label className="mt-3 block text-[13px] text-muted">
                หรือวางลิงก์รูป (ขึ้นต้นด้วย https://)
                <input
                  value={draft.logoUrl ?? ""}
                  maxLength={500}
                  placeholder="https://..."
                  onChange={(e) => setDraft({ ...draft, logoUrl: e.target.value })}
                  className={`${fieldCls} mt-1 min-h-11`}
                />
              </label>
            ) : (
              <button type="button" onClick={() => setShowLink(true)} className="mt-1 min-h-11 text-[13px] text-muted underline underline-offset-2 hover:text-ink">
                มีรูปอยู่บนเว็บแล้ว? วางลิงก์แทน
              </button>
            )}
          </div>

          <fieldset>
            <legend className={label}>สีประจำร้าน</legend>
            <span className={hint}>ใช้กับชื่อร้านและหัวข้อในคำอ่าน · ทุกสีอ่านง่ายบนพื้นขาว</span>
            <div role="radiogroup" aria-label="สีประจำร้าน" className="mt-3 flex flex-wrap gap-2">
              {STUDIO_COLOR_PRESETS.map((p) => {
                const on = pickedHex === p.hex;
                return (
                  <button
                    key={p.hex}
                    type="button"
                    role="radio"
                    aria-checked={on}
                    aria-label={p.nameTh}
                    title={p.nameTh}
                    onClick={() => setDraft({ ...draft, brandColor: p.hex })}
                    className={`flex h-11 w-11 items-center justify-center rounded-full transition-shadow ${on ? "ring-2 ring-ink-deep ring-offset-2" : "ring-1 ring-line"}`}
                    style={{ backgroundColor: p.hex }}
                  >
                    {on && <span aria-hidden="true" className="h-2.5 w-2.5 rounded-full bg-white" />}
                  </button>
                );
              })}
              <label
                className={`relative flex h-11 min-w-11 cursor-pointer items-center gap-2 rounded-full border px-3 text-[13px] font-semibold text-ink ${!isPreset ? "border-ink-deep" : "border-line-interactive-warm"}`}
              >
                <span aria-hidden="true" className="h-5 w-5 rounded-full border border-line" style={{ backgroundColor: isPreset ? "transparent" : pickedHex }} />
                สีอื่น
                <input type="color" value={pickedHex} onChange={(e) => setDraft({ ...draft, brandColor: e.target.value })} className="absolute inset-0 cursor-pointer opacity-0" />
              </label>
            </div>
            {color.adjusted && <p className="mt-2 text-[13px] text-ink">สีนี้อ่อนไป ระบบจะใช้โทนที่เข้มขึ้นนิดหน่อยให้ลูกค้าอ่านง่าย (ดูในตัวอย่าง)</p>}
          </fieldset>

          <label className={label}>
            ช่องทางให้ลูกค้าติดต่อกลับ
            <span className={hint}>ขึ้นท้ายคำอ่าน · ไม่ใส่ก็ได้</span>
            <input
              value={draft.contactLine ?? ""}
              maxLength={120}
              placeholder="เช่น LINE @yourname"
              onChange={(e) => setDraft({ ...draft, contactLine: e.target.value })}
              className={`${fieldCls} mt-2 min-h-11 font-normal`}
            />
          </label>

          <div className="flex flex-wrap items-center gap-3 border-t border-line pt-4">
            <button type="button" onClick={saveBrand} disabled={!dirty || busy !== null} className={btnPrimary}>
              {busy === "brand" ? "กำลังบันทึก…" : "บันทึก"}
            </button>
            {dirty && busy !== "brand" && (
              <button type="button" onClick={() => setDraft(saved)} className="min-h-11 px-2 text-sm font-semibold text-muted hover:text-ink">
                ยกเลิกการแก้ไข
              </button>
            )}
            <p role="status" className={`text-sm ${brandMsg?.tone === "err" ? "font-semibold text-err" : "text-muted"}`}>
              {brandMsg?.text ?? (dirty ? "มีการแก้ไขที่ยังไม่บันทึก" : "")}
            </p>
          </div>
        </section>

        {/* ── ตัวช่วย AI (สวิตช์ มีผลทันที) ── */}
        <section aria-labelledby="ai-h" className={`${card} space-y-4`}>
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 space-y-1">
              <h2 id="ai-h" className="text-lg font-bold text-ink-deep">
                ตัวช่วย AI <span className="text-sm font-normal text-muted">(ไม่บังคับ)</span>
              </h2>
              <p className="text-[13px] leading-relaxed text-muted">
                {saved.aiAssist
                  ? "เปิดอยู่ — AI ช่วยเกลาจากโน้ตเฉพาะตอนคุณกดปุ่ม ได้รับแค่โน้ตกับคำถาม (ซ่อนเบอร์โทร อีเมล เลขบัตรแล้ว) ไม่ได้รับชื่อลูกค้า คุณตรวจและแก้ก่อนส่งทุกครั้ง"
                  : "ปิดอยู่ — สตูดิโอไม่ส่งข้อมูลใดให้ AI คำอ่านเป็นคำของคุณทั้งหมด ไม่ใช้ AI ก็ทำคำอ่านและส่งให้ลูกค้าได้ครบ"}
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={saved.aiAssist}
              aria-labelledby="ai-h"
              disabled={busy !== null}
              onClick={() => saveAi({ aiAssist: !saved.aiAssist })}
              className="flex min-h-11 shrink-0 items-center gap-2 text-sm font-semibold text-ink"
            >
              <span aria-hidden="true">{saved.aiAssist ? "เปิด" : "ปิด"}</span>
              <span
                className={`relative inline-flex h-7 w-12 items-center rounded-full border transition-colors ${saved.aiAssist ? "border-gold-ink bg-gold-ink" : "border-[#B9B2A8] bg-[#E4DFD8]"}`}
              >
                <span className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${saved.aiAssist ? "translate-x-6" : "translate-x-1"}`} />
              </span>
            </button>
          </div>
          {saved.aiAssist && (
            <label className="flex min-h-11 items-center gap-3 border-t border-line pt-4 text-sm text-ink">
              <input
                type="checkbox"
                checked={saved.showAiDisclosure}
                disabled={busy !== null}
                onChange={(e) => saveAi({ showAiDisclosure: e.target.checked })}
                className="h-5 w-5 shrink-0"
              />
              ถ้าคำอ่านไหนใช้ AI ช่วย ให้บอกลูกค้าตรง ๆ ว่า &quot;เรียบเรียงด้วยความช่วยเหลือของ AI&quot; (แนะนำ)
            </label>
          )}
          {aiMsg && (
            <p role="status" className={`text-sm ${aiMsg.tone === "err" ? "font-semibold text-err" : "text-muted"}`}>
              {aiMsg.text}
            </p>
          )}
        </section>
      </div>
    </div>
  );
}
