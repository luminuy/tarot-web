import { Children, cloneElement, isValidElement, type ReactElement, type ReactNode } from "react";

/**
 * ✂️ หัวข้อภาษาไทยต้องขึ้นบรรทัดใหม่ "ตรงช่องว่าง" เท่านั้น — ห้ามหักกลางวลี
 * ===========================================================================
 * ภาษาไทยไม่มีช่องว่างคั่นคำ เบราว์เซอร์จึงเดาจุดตัดจากพจนานุกรมของตัวเอง และมักหักคำที่ไม่อยู่ในพจนานุกรม
 * หรือคำประสมกลางคำ เช่น "ทา / โรต์" · "การ / งาน" · "ประจำ / วัน" (เจ้าของเห็นจากภาพหน้าจอทั้งเว็บ
 * สแกนจริงเจอหัวข้อตัดกลางวลี 269 แบบ) · CSS `word-break: keep-all` ไม่มีผลกับอักษรไทยใน Chromium (ทดสอบแล้ว)
 *
 * วิธีแก้: แยกข้อความตามช่องว่าง (ซึ่งคือจุดคั่นวลีของภาษาไทย) แล้วห่อแต่ละวลีด้วย `.tp` (inline-block)
 * เบราว์เซอร์จึงตัดบรรทัดได้แค่ระหว่างวลี · วลีที่ยาวเกินบรรทัดเอง ยังตัดข้างในได้ตามปกติ (ไม่ล้นจอ)
 *
 *   • ตัวเลขผูกกับคำถัดไปเสมอ — "78 ใบ" ห้ามแยกบรรทัด (เจ้าของเคยทักเรื่องนี้ที่หน้าแรก)
 *     ตัวเลขปิดท้ายผูกกับคำก่อนหน้าแทน — "ทาโรต์ 1909" ไม่ทิ้ง "1909" ไว้บรรทัดเดียว
 *   • "ๆ" และเครื่องหมายปิด ) : ? ! ผูกกับคำก่อนหน้า — ห้ามขึ้นต้นบรรทัด
 *   • ข้อความที่ไม่มีอักษรไทยปล่อยไว้ตามเดิม (อังกฤษตัดตรงช่องว่างอยู่แล้ว)
 *
 * ⚠️ ห้ามใช้กับหัวข้อที่ `truncate` (บรรทัดเดียว) — `line-clamp` ใช้ได้ (ทดสอบแล้ว จุดไข่ปลายังขึ้น)
 * ⚠️ ด่าน `scripts/qa/test-thai-heading-phrases.ts` สแกน HTML ใน dist/ ว่าหัวข้อไทยที่มีหลายวลีห่อ `.tp` ครบ
 */

const THAI = /[฀-๿]/;
const NUMBER = /^[\d,.]+$/;
const ATTACH_TO_PREVIOUS = /^(ๆ|[)\]}:;?!.,…])/;

/** จัดกลุ่มคำตามช่องว่าง โดยผูกตัวเลขกับคำถัดไป และผูก "ๆ"/เครื่องหมายปิดกับคำก่อนหน้า */
export function groupThaiPhrases(text: string): string[] {
  const tokens = text.split(/\s+/).filter(Boolean);
  const groups: string[] = [];
  let pendingNumber = "";
  for (const token of tokens) {
    if (groups.length > 0 && !pendingNumber && ATTACH_TO_PREVIOUS.test(token)) {
      groups[groups.length - 1] += ` ${token}`;
      continue;
    }
    const word = pendingNumber ? `${pendingNumber} ${token}` : token;
    pendingNumber = "";
    if (NUMBER.test(token)) {
      pendingNumber = word;
      continue;
    }
    groups.push(word);
  }
  // ตัวเลขปิดท้ายประโยค ("ทาโรต์ 1909") ผูกกับคำก่อนหน้า — ไม่งั้นตัวเลขตกไปอยู่บรรทัดเดียวโดด ๆ
  if (pendingNumber) {
    if (groups.length > 0) groups[groups.length - 1] += `\u00a0${pendingNumber}`;
    else groups.push(pendingNumber);
  }
  return groups;
}

function splitString(text: string, keyPrefix: string): ReactNode {
  if (!THAI.test(text)) return text;
  const groups = groupThaiPhrases(text);
  if (groups.length < 2) return text;
  const lead = /^\s/.test(text) ? " " : "";
  const trail = /\s$/.test(text) ? " " : "";
  const out: ReactNode[] = [];
  if (lead) out.push(lead);
  groups.forEach((group, i) => {
    if (i > 0) out.push(" ");
    out.push(
      THAI.test(group) ? (
        <span key={`${keyPrefix}-${i}`} className="tp">
          {group}
        </span>
      ) : (
        group
      ),
    );
  });
  if (trail) out.push(trail);
  return out;
}

function transform(node: ReactNode, keyPrefix: string): ReactNode {
  if (typeof node === "string") return splitString(node, keyPrefix);
  if (isValidElement(node)) {
    const el = node as ReactElement<{ children?: ReactNode; className?: string }>;
    const { children, className } = el.props;
    // วลีที่ผู้เขียนจัดเองแล้ว (inline-block / nowrap) และกล่อง flex/grid (span ทุกตัวจะกลายเป็น flex item แยกกัน) — ไม่ยุ่ง
    if (children === undefined || /\b(tp|inline-block|whitespace-nowrap|truncate|flex|inline-flex|grid)\b/.test(className ?? "")) return node;
    return cloneElement(el, undefined, walk(children, `${keyPrefix}-c`));
  }
  return node;
}

function walk(children: ReactNode, keyPrefix: string): ReactNode {
  const mapped = Children.map(children, (child, i) => transform(child, `${keyPrefix}${i}`));
  return mapped && mapped.length === 1 ? mapped[0] : mapped;
}

/** ห่อเนื้อหาหัวข้อ: `<h2><ThaiPhrases>…</ThaiPhrases></h2>` — ใช้ได้ทั้งคอมโพเนนต์ฝั่งเซิร์ฟเวอร์และ island */
export function ThaiPhrases({ children }: { children?: ReactNode }) {
  return <>{walk(children, "tp")}</>;
}

/** รุ่นสตริง HTML สำหรับข้อความที่เรนเดอร์ผ่าน `dangerouslySetInnerHTML` (เช่น หัวข้อในเนื้อบทความ) — ข้อความต้องปลอดภัยอยู่แล้ว */
export function thaiPhrasesHtml(html: string): string {
  if (!THAI.test(html) || /</.test(html)) return html;
  const groups = groupThaiPhrases(html);
  if (groups.length < 2) return html;
  return groups.map((g) => (THAI.test(g) ? `<span class="tp">${g}</span>` : g)).join(" ");
}
