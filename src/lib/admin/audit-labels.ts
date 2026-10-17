/**
 * 🗂️ ชื่อไทยและหมวดของทุก action ที่ `recordAudit()` บันทึก — ใช้ร่วมระหว่าง "สถานะระบบวันนี้" และ "บันทึกการทำงานแอดมิน"
 * เพิ่ม action ใหม่ที่ไหน ต้องมาเพิ่มชื่อที่นี่ด้วย ไม่งั้นหน้าจอจะโชว์ชื่อดิบภาษาอังกฤษ
 */

export type AuditGroup = "security" | "money" | "readers" | "customers" | "content" | "system";

export const AUDIT_GROUP_NAME: Record<AuditGroup, string> = {
  security: "การเข้าสู่ระบบ",
  money: "เงินและการคืนเงิน",
  readers: "แม่หมอ",
  customers: "ลูกค้าและสิทธิ์",
  content: "เนื้อหา",
  system: "ระบบ",
};

export const AUDIT_ACTIONS: Record<string, { label: string; group: AuditGroup }> = {
  admin_login_success: { label: "เข้าสู่ระบบแอดมิน", group: "security" },
  admin_login_fail: { label: "ใส่รหัสแอดมินผิด", group: "security" },
  sync_refunds: { label: "ตรวจรายการคืนเงินกับ Stripe", group: "money" },
  retry_refund: { label: "ลองคืนเงินลูกค้าอีกครั้ง", group: "money" },
  studio_pass_default_price: { label: "เปลี่ยนราคาปกติแพ็กเกจ AI ช่วยเขียน", group: "money" },
  studio_pass_reader_price: { label: "ตั้งราคาพิเศษแพ็กเกจ AI ช่วยเขียนรายแม่หมอ", group: "money" },
  create_reader: { label: "เพิ่มแม่หมอพาร์ทเนอร์", group: "readers" },
  update_reader: { label: "แก้ข้อมูลแม่หมอพาร์ทเนอร์", group: "readers" },
  delete_reader: { label: "ลบแม่หมอพาร์ทเนอร์", group: "readers" },
  revoke_reader_links: { label: "ยกเลิกลิงก์แผงแม่หมอทั้งหมด", group: "readers" },
  hide_review: { label: "ซ่อน/แสดงรีวิวแม่หมอ", group: "readers" },
  entitlement_flag: { label: "เปิด/ปิดระบบสิทธิ์", group: "customers" },
  entitlement_announce: { label: "เปิด/ปิดแบนเนอร์ประกาศ", group: "customers" },
  entitlement_init_db: { label: "เตรียมตารางสิทธิ์", group: "system" },
  entitlement_grandfather: { label: "แจกโบนัสผู้ใช้เดิม", group: "customers" },
  redeem_code_create: { label: "สร้างรหัสแลกสิทธิ์", group: "customers" },
  redeem_code_toggle: { label: "เปิด/ปิดรหัสแลกสิทธิ์", group: "customers" },
  redeem_code_update: { label: "แก้รหัสแลกสิทธิ์", group: "customers" },
  marketing_audience_export: { label: "ส่งออกรายชื่อผู้รับข่าวสาร", group: "customers" },
  member_bonus_grant: { label: "ให้สิทธิ์เปิดไพ่เพิ่มแก่สมาชิก", group: "customers" },
  content_update: { label: "แก้เนื้อหา / คำสั่งแม่หมอ", group: "content" },
  search_index_rebuild: { label: "อัปเดตระบบค้นหา", group: "system" },
};

/** ชื่อเดิมตามรูปแบบที่ "สถานะระบบวันนี้" ใช้อยู่ */
export const AUDIT_LABEL: Record<string, string> = Object.fromEntries(
  Object.entries(AUDIT_ACTIONS).map(([k, v]) => [k, v.label]),
);

/** action ที่ควรสะดุดตา (อาจเป็นการพยายามบุกรุก) */
export const AUDIT_ALERT = new Set(["admin_login_fail"]);

export function auditGroupOf(action: string): AuditGroup {
  return AUDIT_ACTIONS[action]?.group ?? "system";
}
