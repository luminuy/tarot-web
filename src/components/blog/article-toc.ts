/**
 * สารบัญบทความ ↔ หัวข้อ `##` ในเนื้อหา (A7-07)
 *
 * `toc: [{ id, title }]` ใน `src/data/articles.ts` เขียนแยกจากเนื้อหา markdown — ลิงก์ `#id` ของสารบัญจะเลื่อนได้
 * ก็ต่อเมื่อ `<h2>` ในเนื้อหามี `id` ตรงกัน และบางบทความมีรายการสารบัญที่ไม่มีหัวข้อรองรับในเนื้อหา
 * จึงจับคู่ด้วย "ชื่อหัวข้อ" แล้วส่ง (ก) id ต่อ h2 แต่ละอัน (ข) เฉพาะรายการสารบัญที่มีหัวข้อจริง
 * ➔ ไม่มีลิงก์สารบัญที่กดแล้วไม่ไปไหน
 */
export interface ArticleTocEntry {
  id: string;
  title: string;
}

/** ตัดเลขนำหน้า ("3. ") · ช่องไฟซ้ำ · ตัวพิมพ์ — ให้ชื่อใน `toc` เทียบกับหัวข้อในเนื้อหาได้ */
function normalizeTitle(title: string): string {
  return title.replace(/^\s*\d+[.)]\s*/, "").replace(/\s+/g, " ").trim().toLowerCase();
}

/** ชื่อหัวข้อ `## …` ตามลำดับในเนื้อหา — ใช้ regex ตัวเดียวกับตัวแปลง markdown ของหน้าบทความ */
export function extractH2Titles(content: string): string[] {
  return [...content.matchAll(/## (.*?)\n/g)].map((m) => m[1]);
}

export interface ResolvedArticleToc {
  /** id ของ `<h2>` ลำดับที่ i (ทุกหัวข้อมี id เสมอ) */
  headingIds: string[];
  /** รายการสารบัญที่มีหัวข้อรองรับจริง เรียงตามสารบัญเดิม */
  items: ArticleTocEntry[];
}

export function resolveArticleToc(content: string, toc: readonly ArticleTocEntry[] | undefined): ResolvedArticleToc {
  const titles = extractH2Titles(content);
  const headingIds: (string | null)[] = titles.map(() => null);
  const used = new Set<number>();
  const list = toc ?? [];

  const assign = (match: (headingNorm: string, tocNorm: string) => boolean) => {
    list.forEach((item, tocIdx) => {
      if (used.has(tocIdx)) return;
      const tocNorm = normalizeTitle(item.title);
      const at = titles.findIndex((t, i) => headingIds[i] === null && match(normalizeTitle(t), tocNorm));
      if (at >= 0) {
        headingIds[at] = item.id;
        used.add(tocIdx);
      }
    });
  };
  assign((h, t) => h === t);
  // ชื่อในสารบัญย่อ/ขยายจากชื่อหัวข้อเล็กน้อย (เช่น "The 3 Cosmic Stages…" กับ "3 Cosmic Stages…")
  assign((h, t) => h.length > 8 && t.length > 8 && (h.includes(t) || t.includes(h)));

  // หัวข้อที่ชื่อไม่ตรงเลย (บทความอังกฤษแปลชื่อหัวข้อต่างจากสารบัญ) — ใช้ลำดับเดียวกัน: h2 ลำดับที่ i ↔ สารบัญลำดับที่ i
  headingIds.forEach((id, i) => {
    if (id === null && i < list.length && !used.has(i)) {
      headingIds[i] = list[i].id;
      used.add(i);
    }
  });

  const ids = headingIds.map((id, i) => id ?? `sec-${i + 1}`);
  return { headingIds: ids, items: list.filter((_, i) => used.has(i)) };
}
