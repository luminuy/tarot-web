import { AskNowBox } from "@/components/questions/AskNowBox";

/**
 * ✦ กล่อง "ถามเลยตอนนี้" ของหน้าคำถาม — island เดียวของหน้า (REFLECTION_JOURNAL_PLAN 1.11)
 * ⚠️ `client:visible` — โหลดเมื่อเลื่อนถึงเท่านั้น (หน้า SEO ต้องไม่จ่าย JS ก่อนผู้ใช้สนใจ)
 */
export function AskNowRoot(props: React.ComponentProps<typeof AskNowBox>) {
  return <AskNowBox {...props} />;
}
