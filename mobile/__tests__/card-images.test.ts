/**
 * ด่าน "ภาพไพ่ในแอปครบ 78 ใบและตรงกับสำรับของเว็บ" (แผน IOS_APP_PLAN ข้อ 8 ด่านที่ 3)
 * อ่านซอร์ส `lib/cardImages.ts` ตรง ๆ (ไม่ผ่านตัวแปลงไฟล์ภาพของ jest) แล้วเทียบกับ `DECK`
 */
import fs from "node:fs";
import path from "node:path";

import { DECK } from "../../src/data/cards";

const source = fs.readFileSync(path.join(__dirname, "../lib/cardImages.ts"), "utf8");
const entries = [...source.matchAll(/"([a-z]+-\d\d)": require\("([^"]+)"\)/g)].map((m) => ({ id: m[1], file: m[2] }));

describe("ภาพไพ่ของแอป", () => {
  it("มีครบทุก id ของสำรับ 78 ใบ ไม่เกิน ไม่ซ้ำ", () => {
    expect(entries.map((e) => e.id).sort()).toEqual(DECK.map((c) => c.id).sort());
    expect(entries).toHaveLength(78);
  });

  it("ทุก require ชี้ไปไฟล์ w512b ของใบเดียวกันและไฟล์มีอยู่จริง", () => {
    for (const { id, file } of entries) {
      expect(file).toBe(`../../public/cards/w512b/${id}.webp`);
      expect(fs.existsSync(path.join(__dirname, "../lib", file))).toBe(true);
    }
  });
});
