"use client";

import React from "react";
import { Modal } from "@/components/ui/Modal";
import { useLocale } from "@/lib/i18n";
import { PurchasePanel } from "@/components/entitlement/PurchasePanel";

interface BuyCreditsModalProps {
  isOpen: boolean;
  onClose: () => void;
  user?: { id: string; name?: string; email?: string } | null;
  onRequireAuth?: () => void;
}

/**
 * 💳 หน้าต่างเติมรอบดูดวง — เปลือกบาง ๆ ครอบ `PurchasePanel` (ตัวเลือกแพ็ก · จ่ายเงิน · รหัสแลกสิทธิ์)
 * จ่ายเสร็จ Stripe ส่งกลับมาที่ /api/entitlement/checkout/confirm ซึ่งตรวจกับ Stripe ก่อนเติมรอบ
 */
export const BuyCreditsModal: React.FC<BuyCreditsModalProps> = ({ isOpen, onClose, user, onRequireAuth }) => {
  const { locale, isEnglish } = useLocale();
  const isEn = isEnglish || locale === "en";

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
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
      <div className="pt-1">
        <PurchasePanel
          user={user}
          onDone={onClose}
          onRequireAuth={
            onRequireAuth
              ? () => {
                  onClose();
                  onRequireAuth();
                }
              : undefined
          }
        />
      </div>
    </Modal>
  );
};
