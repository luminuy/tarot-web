import { RouteLink as Link } from "@/components/ui/RouteLink";
import { CardImage } from "@/components/card/CardImage";
import { HomeRailNav } from "@/components/seo/HomeRailNav";

/**
 * ✦ "ดูดวงแบบอื่น" — ประตูจากหน้าแรกไปหน้าที่เคยไม่มีลิงก์เข้าเลย
 * ===========================================================================
 * ก่อนหน้านี้ `/pick-a-card` · `/daily` · `/love/1-card` · `/cards/birth-card` ไม่มีลิงก์จากหน้าแรก
 * หัวเว็บ หรือท้ายเว็บเลยสักจุด (มีแค่ในหน้าบทความ) — บอตเจอยาก ผู้ใช้ก็ไม่รู้ว่ามี
 *
 * เรนเดอร์เป็น HTML ตอนบิลด์เท่านั้น (อยู่ใน `HomeSeoContent` ซึ่งไม่ hydrate) · มือถือเป็นแถวปัด `.home-rail`
 * `data-home-section` ให้ `astro/scripts/home-track.ts` นับว่าคนกดการ์ดไหน (แผนหน้าแรก ข้อ 6)
 */

const WAYS = [
  {
    path: "/pick-a-card",
    image: "major-02.jpg",
    th: {
      tag: "เลือกกองไพ่ · 8 หัวข้อ",
      title: "Pick A Card",
      desc: "เลือกกองที่ใจเรียก แล้วอ่านคำทำนายของกองนั้น มีทั้งเรื่องเขาคิดยังไง การงาน และการเงิน",
    },
    en: {
      tag: "Choose a pile · 8 topics",
      title: "Pick A Card",
      desc: "Choose the pile that calls to you and read its message, from what they think to work and money.",
    },
  },
  {
    path: "/daily",
    image: "major-19.jpg",
    th: {
      tag: "1 ใบ · รายวัน",
      title: "ไพ่ยิปซีรายวัน",
      desc: "เปิดไพ่ 1 ใบดูพลังงานของวันนี้ ทั้งงาน เงิน ความรัก และเรื่องที่ควรระวัง",
    },
    en: {
      tag: "1 card · daily",
      title: "Daily tarot",
      desc: "Draw one card for today's energy across work, money, love, and what to watch out for.",
    },
  },
  {
    path: "/love/1-card",
    image: "cups-02.jpg",
    th: {
      tag: "1 ใบ · ความรัก",
      title: "ดูดวงความรัก 1 ใบ",
      desc: "โสด คุยอยู่ มีคู่ หรือเพิ่งเลิก เปิดไพ่ใบเดียวเพื่อดูเรื่องหัวใจตอนนี้",
    },
    en: {
      tag: "1 card · love",
      title: "One-card love reading",
      desc: "Single, talking, together, or just parted: one card for where your heart stands now.",
    },
  },
  {
    path: "/cards/birth-card",
    image: "major-21.jpg",
    th: {
      tag: "จากวันเกิด",
      title: "ไพ่ประจำวันเกิด",
      desc: "ใส่วันเกิดเพื่อหาไพ่ประจำตัว (Birth Card) พร้อมความหมายด้านนิสัยและเรื่องที่ควรพัฒนา",
    },
    en: {
      tag: "From your birthday",
      title: "Your tarot birth card",
      desc: "Enter your birthday to find your birth card and what it says about who you are.",
    },
  },
] as const;

export function HomeMoreWaysSection({ isEnglish, href }: { isEnglish: boolean; href: (path: string) => string }) {
  return (
    <section
      aria-labelledby="home-more-ways-title"
      data-home-section="more_ways"
      className="home-band max-w-6xl mx-auto px-4 sm:px-6 space-y-6 sm:space-y-8"
    >
      <div className="space-y-2 pb-4 border-b border-line-warm/50">
        <span className="text-gold-ink text-xs font-serif-th tracking-widest uppercase block">MORE WAYS TO READ</span>
        <h2
          id="home-more-ways-title"
          className="text-2xl sm:text-3xl font-serif-th font-bold text-ink [text-wrap:balance]"
        >
          {isEnglish ? "More Ways to Read Your Cards" : "ดูดวงไพ่ยิปซีแบบอื่น ๆ"}
        </h2>
        {/* แต่ละวรรคเป็น inline-block — ภาษาไทยไม่มีช่องว่างคั่นคำ ปล่อยเบราว์เซอร์ตัดเองได้ "เลย" ค้างบรรทัดเดียว */}
        <p className="text-xs sm:text-sm text-muted font-serif-th max-w-2xl">
          {isEnglish ? (
            "Short on time or curious about one thing? Pick the format that fits you today."
          ) : (
            <>
              <span className="inline-block">มีเวลาน้อย หรืออยากรู้แค่เรื่องเดียว</span>{" "}
              <span className="inline-block">เลือกแบบที่เหมาะกับวันนี้ได้เลย</span>
            </>
          )}
        </p>
      </div>

      <div data-rail>
        <div className="home-rail grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" data-rail-track>
          {WAYS.map((way) => {
            const copy = isEnglish ? way.en : way.th;
            return (
              <Link
                key={way.path}
                href={href(way.path)}
                prefetch={false}
                className="altar-card-porcelain p-5 group flex flex-col gap-4"
              >
                <div className="flex items-center gap-4">
                  <div className="glass-tile !rounded-lg w-12 aspect-[2/3] overflow-hidden flex-shrink-0 group-hover:scale-105 transition-transform duration-300">
                    {/* ภาพประกอบล้วน — หัวข้อในลิงก์เดียวกันบอกชื่อแล้ว (INC-0125) */}
                    <CardImage image={way.image} alt="" className="w-full h-full object-cover" sizes="48px" />
                  </div>
                  <div className="min-w-0 space-y-1">
                    <span className="glass-chip inline-block px-2.5 py-0.5 text-[11px] font-serif-th font-semibold text-gold-ink">
                      {copy.tag}
                    </span>
                    <h3 className="font-serif-th font-bold text-base text-ink group-hover:text-gold-ink transition-colors leading-snug">
                      {copy.title}
                    </h3>
                  </div>
                </div>
                <p className="text-xs sm:text-sm font-serif-th text-muted leading-relaxed">{copy.desc}</p>
                <span className="mt-auto text-xs font-serif-th font-bold text-gold-ink inline-flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                  {isEnglish ? "Start →" : "เริ่มเลย →"}
                </span>
              </Link>
            );
          })}
        </div>
        <HomeRailNav isEnglish={isEnglish} />
      </div>
    </section>
  );
}
