import { CAREER_QUESTIONS } from "./career";
import { LIFE_QUESTIONS } from "./life";
import { LOVE_QUESTIONS } from "./love";
import type { QuestionPage, QuestionTopic } from "./types";

export type { QuestionCopy, QuestionPage, QuestionTopic } from "./types";
export { TOPIC_PARENT } from "./types";

/** ✦ หน้าคำถาม 20 หน้า (แทร็ก Q) — เรียงตามหมวด · ลำดับนี้คือลำดับในหน้ารวม `/questions` */
export const QUESTIONS: readonly QuestionPage[] = [...LOVE_QUESTIONS, ...CAREER_QUESTIONS, ...LIFE_QUESTIONS];

const BY_SLUG = new Map(QUESTIONS.map((q) => [q.slug, q]));

export function getQuestion(slug: string): QuestionPage | undefined {
  return BY_SLUG.get(slug);
}

export function questionStaticParams(): Array<{ slug: string }> {
  return QUESTIONS.map((q) => ({ slug: q.slug }));
}

/** คำถามอื่นในหมวดเดียวกัน (ลิงก์ข้างเคียง) — เติมจากหมวดอื่นให้ครบ `limit` */
export function relatedQuestions(slug: string, limit = 4): QuestionPage[] {
  const me = BY_SLUG.get(slug);
  if (!me) return [];
  const same = QUESTIONS.filter((q) => q.slug !== slug && q.topic === me.topic);
  const others = QUESTIONS.filter((q) => q.slug !== slug && q.topic !== me.topic);
  return [...same, ...others].slice(0, limit);
}

export const QUESTION_TOPIC_ORDER: readonly QuestionTopic[] = ["love", "career", "study", "money", "family", "general"];
