import { ReadingChatBodyEn } from "@/app/_shared/pages/reading-chat-en";
import { ReadingChatBodyTh } from "@/app/_shared/pages/reading-chat-th";
import { LocaleProvider } from "@/lib/i18n";

/**
 * 💬 ห้องสนทนากับแม่หมอ — ทั้งหน้าเป็น island เพราะทุกอย่างในนั้นเป็นสถานะฝั่งไคลเอนต์
 * (อ่านรอบดูดวงจาก sessionStorage · สตรีมคำตอบจาก `/api/chat`)
 *
 * ⚠️ ต้อง `client:load` ไม่ใช่ `client:idle` — ผู้ใช้กดเข้ามาเพื่อ "พิมพ์คุย" ทันที
 *    ถ้ารอจังหวะว่างก่อน ช่องพิมพ์จะกดไม่ติดในวินาทีแรกซึ่งเป็นวินาทีที่สำคัญที่สุดของหน้านี้
 */
export function ReadingChatRootTh() {
  return (
    <LocaleProvider forcedLocale="th">
      <ReadingChatBodyTh />
    </LocaleProvider>
  );
}

export function ReadingChatRootEn() {
  return (
    <LocaleProvider forcedLocale="en">
      <ReadingChatBodyEn />
    </LocaleProvider>
  );
}
