/**
 * ตัวอ่าน JSON ที่ยังมาไม่ครบ
 * -------------------------------------------------
 * โมเดลส่งคำตอบเป็น JSON แบบ stream ทีละตัวอักษร แต่ UI อยากโชว์คำอ่าน
 * ของไพ่แต่ละใบทันทีที่ใบนั้นอ่านจบ ไม่ใช่รอทั้งก้อน
 * ไฟล์นี้จึงคอยแกะเฉพาะส่วนที่ "ปิดวงเล็บครบแล้ว" ออกมาก่อน
 *
 * ตั้งใจให้ทนต่อข้อมูลที่ยังไม่สมบูรณ์ — แกะไม่ได้ก็แค่คืนค่าว่าง ไม่โยน error
 * ความถูกต้องขั้นสุดท้ายไปตรวจอีกทีด้วย zod ตอนสตรีมจบ
 */

export interface PartialReading {
  opening?: string;
  cards: Array<{ position: number; headline: string; reading: string }>;
  connections?: string;
  summary?: string;
}

/** หาค่าของคีย์ที่เป็นสตริงและ "ปิดเครื่องหมายคำพูดแล้ว" เท่านั้น */
function readCompletedString(buffer: string, key: string): string | undefined {
  const marker = `"${key}"`;
  const keyAt = buffer.indexOf(marker);
  if (keyAt === -1) return undefined;

  let i = buffer.indexOf(":", keyAt + marker.length);
  if (i === -1) return undefined;
  i++;
  while (i < buffer.length && /\s/.test(buffer[i])) i++;
  if (buffer[i] !== '"') return undefined;

  const start = i;
  i++;
  while (i < buffer.length) {
    if (buffer[i] === "\\") {
      i += 2;
      continue;
    }
    if (buffer[i] === '"') {
      try {
        return JSON.parse(buffer.slice(start, i + 1)) as string;
      } catch {
        return undefined;
      }
    }
    i++;
  }
  return undefined; // ยังปิดคำพูดไม่ครบ แปลว่ายังพิมพ์ไม่จบ
}

/** แกะเฉพาะ object ในอาร์เรย์ cards ที่ปิดปีกกาครบแล้ว */
function readCompletedCards(buffer: string): PartialReading["cards"] {
  const keyAt = buffer.indexOf('"cards"');
  if (keyAt === -1) return [];
  const arrayAt = buffer.indexOf("[", keyAt);
  if (arrayAt === -1) return [];

  const out: PartialReading["cards"] = [];
  let depth = 0;
  let objectStart = -1;
  let inString = false;

  for (let i = arrayAt + 1; i < buffer.length; i++) {
    const ch = buffer[i];

    if (inString) {
      if (ch === "\\") i++;
      else if (ch === '"') inString = false;
      continue;
    }

    if (ch === '"') {
      inString = true;
    } else if (ch === "{") {
      if (depth === 0) objectStart = i;
      depth++;
    } else if (ch === "}") {
      depth--;
      if (depth === 0 && objectStart !== -1) {
        try {
          const parsed = JSON.parse(buffer.slice(objectStart, i + 1));
          if (
            typeof parsed?.position === "number" &&
            typeof parsed?.headline === "string" &&
            typeof parsed?.reading === "string"
          ) {
            out.push(parsed);
          }
        } catch {
          // object ยังไม่สมบูรณ์จริง ๆ — ข้ามไป
        }
        objectStart = -1;
      }
    } else if (ch === "]" && depth === 0) {
      break;
    }
  }

  return out;
}

export function parsePartialReading(buffer: string): PartialReading {
  return {
    opening: readCompletedString(buffer, "opening"),
    cards: readCompletedCards(buffer),
    connections: readCompletedString(buffer, "connections"),
    summary: readCompletedString(buffer, "summary"),
  };
}
