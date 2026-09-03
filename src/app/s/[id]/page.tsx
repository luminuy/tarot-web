import type { Metadata } from "next";
import Link from "next/link";

import { SITE_ORIGIN } from "@/lib/config/site";
import { getShareBucket } from "@/lib/platform/cf";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ID_RE = /^[a-f0-9]{20,40}$/;

interface Props {
  params: Promise<{ id: string }>;
}

async function readMeta(id: string): Promise<{ title: string; spread: string } | null> {
  if (!ID_RE.test(id)) return null;
  try {
    const bucket = await getShareBucket();
    const obj = await bucket?.get(`${id}.json`);
    if (!obj) return null;
    const raw = await obj.arrayBuffer();
    return JSON.parse(new TextDecoder().decode(raw));
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const meta = await readMeta(id);
  const imageUrl = ID_RE.test(id) ? `${SITE_ORIGIN}/api/share/image/${id}` : `${SITE_ORIGIN}/cards/major-01.jpg`;

  const title = meta?.title || "คำทำนายไพ่ทาโรต์ 1909 Rider-Waite จาก SeerTarot";
  const description = meta?.spread
    ? `ผัง ${meta.spread} · เปิดไพ่และรับคำทำนายของคุณเองที่ SeerTarot`
    : "เปิดไพ่ทาโรต์ 1909 Rider-Waite ด้วยตัวคุณเอง พร้อมคำทำนายจากแม่หมอ AI และระบบสับไพ่โปร่งใส Provably-Fair";

  return {
    title,
    description,
    alternates: { canonical: "/" },
    robots: { index: false, follow: true },
    openGraph: {
      type: "article",
      title,
      description,
      url: `${SITE_ORIGIN}/`,
      images: [{ url: imageUrl, width: 1080, height: 1350, alt: title }],
    },
    twitter: { card: "summary_large_image", title, description, images: [imageUrl] },
  };
}

/**
 * /s/<id> — หน้าเปล่าสำหรับลิงก์แชร์การ์ดคำทำนาย
 * crawler อ่าน OG จาก <head> · คนถูก redirect ไปหน้าแรกทันที
 */
export default async function SharePage({ params }: Props) {
  const { id } = await params;
  const valid = ID_RE.test(id);

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-5 bg-[#F3F0EA] px-6 text-center text-[#29261F]">
      <meta httpEquiv="refresh" content="1; url=/" />
      {valid && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={`/api/share/image/${id}`}
          alt="การ์ดคำทำนายไพ่ทาโรต์"
          className="max-h-[60vh] w-auto rounded-xl border border-[#D5CEC2] shadow-[var(--shadow-raised)]"
        />
      )}
      <p className="font-serif-th text-sm text-[#635B4E]">กำลังพาไปเปิดไพ่ของคุณเอง…</p>
      <Link
        href="/"
        className="rounded-full bg-[#29261F] px-6 py-2.5 font-serif-th text-sm font-bold text-[#F3F0EA] hover:bg-[#A58A5C]"
      >
        ✦ เปิดไพ่ที่ SeerTarot
      </Link>
    </main>
  );
}
