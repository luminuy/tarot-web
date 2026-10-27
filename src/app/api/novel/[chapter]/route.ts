import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { getNovelChapter } from "@/data/novel";
import { renderNovelBody } from "@/lib/novel/render";

export const runtime = "nodejs";

/**
 * 📖 ตัวบทนิยายรายบท — อ่านได้เฉพาะสมาชิกที่เข้าสู่ระบบ (เจ้าของสั่ง 2026-10-27 "ต้องล็อกอิน")
 * ---------------------------------------------------------------------------
 * หน้า `/novel/<เลขบท>` เป็น HTML static ที่ไม่มีตัวบท · island `NovelReader` ยิงเส้นนี้หลังรู้ว่ามีคุกกี้ใบ้
 * ตรวจคุกกี้เซสชันตัวจริงที่นี่ (คุกกี้ใบ้แก้เองได้ จึงห้ามใช้ตัดสินสิทธิ์) · แปลงตัวบทเป็น HTML ที่หนีอักขระแล้วฝั่งเซิร์ฟเวอร์
 * `private, no-store` — คำตอบผูกกับผู้ใช้ ห้ามแคชที่ขอบหรือในเบราว์เซอร์ที่ใช้ร่วมกัน
 */
const NO_STORE = { "Cache-Control": "private, no-store" };

export async function GET(_request: Request, { params }: { params: Promise<{ chapter: string }> }) {
  const { chapter } = await params;
  const found = /^\d{1,3}$/.test(chapter) ? getNovelChapter(Number(chapter)) : undefined;
  if (!found) return NextResponse.json({ error: "not_found" }, { status: 404, headers: NO_STORE });

  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "login_required" }, { status: 401, headers: NO_STORE });

  return NextResponse.json({ number: found.number, paragraphs: renderNovelBody(found.body) }, { headers: NO_STORE });
}
