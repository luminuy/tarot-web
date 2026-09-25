import { RouteLink as Link } from "@/components/ui/RouteLink";
import { CardImage } from "@/components/card/CardImage";
import { HomeRailNav } from "@/components/seo/HomeRailNav";
import { CARD_SUMMARIES } from "@/data/cards/summary";
import { ZODIAC_SIGNS } from "@/data/zodiac";
import { ZODIAC_INDEX_PATH, zodiacSignPath } from "@/lib/tarot/zodiac";
import { ThaiPhrases } from "@/components/ui/ThaiPhrases";

/**
 * ✦ ไพ่ยิปซี × โหราศาสตร์ — ประตูจากหน้าแรกเข้าชุดหน้าราศี
 * ===========================================================================
 * เรนเดอร์เป็น HTML ตอนบิลด์เท่านั้น (อยู่ใน `HomeSeoContent` ซึ่งไม่ hydrate) — import ข้อมูลราศีได้
 * โดยบันเดิลหน้าแรกไม่โต · ห้ามย้ายไปไว้ใน island (กับดักข้อ "import ข้อมูลใน island" ของแผน Astro)
 *
 * ไม่ใส่ป้าย "ฤดูนี้" ที่นี่ เพราะหน้าแรกบิลด์ครั้งเดียว ป้ายจะค้างผิดเดือนจนกว่าจะ deploy รอบใหม่
 */

const FEATURES = [
  {
    path: ZODIAC_INDEX_PATH,
    hash: "",
    image: "major-17.jpg",
    th: { title: "หาราศีจากวันเกิด", desc: "ใส่วันเกิด รู้ทั้งราศีสากลและราศีไทย พร้อมไพ่ประจำตัว" },
    en: { title: "Find your sign", desc: "Enter your birthday to see your Western and Thai signs with your cards" },
  },
  {
    path: ZODIAC_INDEX_PATH,
    hash: "#zodiac-daily-title",
    image: "major-19.jpg",
    th: { title: "ดวงรายวัน 12 ราศี", desc: "ไพ่วันนี้ของราศีคุณ และไพ่ประจำเดือนตามดวงอาทิตย์ย้ายราศี" },
    en: { title: "Daily card by sign", desc: "Today's card for your sign, plus the card of the current sun season" },
  },
  {
    path: ZODIAC_INDEX_PATH,
    hash: "#zodiac-compat-title",
    image: "major-06.jpg",
    th: { title: "ความเข้ากันสองราศี", desc: "เลือกราศีของคุณกับของเขา ดูว่าเข้ากันแค่ไหนด้วยไพ่คู่" },
    en: { title: "Sign compatibility", desc: "Pick two signs and see how they fit through a pair of cards" },
  },
  {
    path: "/spreads/twelve-houses",
    hash: "",
    image: "major-10.jpg",
    th: { title: "ผัง 12 เรือนชะตา", desc: "เปิดไพ่ 12 ใบ วางตามเรือนชะตาแบบโหราศาสตร์ไทย ตั้งแต่ตนุถึงวินาศ" },
    en: {
      title: "12 Houses spread",
      desc: "Twelve cards laid out on the astrological houses, from self to hidden matters",
    },
  },
] as const;

const SUMMARY_BY_ID = new Map(CARD_SUMMARIES.map((card) => [card.id, card]));

export function HomeZodiacSection({ isEnglish, href }: { isEnglish: boolean; href: (path: string) => string }) {
  return (
    <section
      aria-labelledby="home-zodiac-title"
      data-home-section="zodiac"
      className="home-band home-band-tint max-w-6xl mx-auto px-4 sm:px-6 space-y-6 sm:space-y-8"
    >
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-line-warm/50">
        <div className="space-y-2">
          <span className="text-gold-ink text-xs font-serif-th tracking-widest uppercase block">TAROT × ASTROLOGY</span>
          <h2
            id="home-zodiac-title"
            className="text-2xl sm:text-3xl font-serif-th font-bold text-ink [text-wrap:balance]"
          ><ThaiPhrases>
            {isEnglish ? "Tarot × Astrology: Your Zodiac Cards" : "ไพ่ยิปซี × โหราศาสตร์ — ไพ่ประจำ 12 ราศี"}
          </ThaiPhrases></h2>
          {/* แบ่งบรรทัดเองตามจังหวะประโยค — ปล่อยเบราว์เซอร์ตัดเอง คำว่า "สุริยยาตร์" (ไม่อยู่ในพจนานุกรมตัดคำ)
              ถูกหักกลางคำเป็น "(สุริย / ยาตร์)" เจ้าของเห็นจากภาพหน้าจอ */}
          <p className="text-xs sm:text-sm text-muted font-serif-th max-w-3xl">
            {isEnglish ? (
              "Every sign has its own Major Arcana card. Look up your sign by the Western or the Thai (sidereal) calendar and meet the cards that belong to you."
            ) : (
              <>
                ทุกราศีมีไพ่ชุดใหญ่ประจำตัว ดูได้ทั้งราศีแบบสากลและราศีแบบไทย{" "}
                <span className="whitespace-nowrap">(สุริยยาตร์)</span>
                <br className="hidden sm:inline" /> แตะราศีของคุณเพื่อดูไพ่ประจำราศี ดาวเจ้าเรือน และไพ่ประจำช่วงวันเกิด
              </>
            )}
          </p>
        </div>
      </div>

      {/* กล่องขาวแบบเดียวกับ "ไพ่ชุดใหญ่เมเจอร์ อาร์คานา" ในส่วนถัดไป — เจ้าของขอให้หน้าตาเข้าชุดกัน */}
      <div className="altar-panel p-4 sm:p-8 space-y-5">
        <div className="flex items-center justify-between gap-3 pb-3 border-b border-line-warm/40">
          <h3 className="font-serif-th font-bold text-base text-ink"><ThaiPhrases>
            {isEnglish ? "The 12 Zodiac Cards" : "ไพ่ประจำ 12 ราศี"}
          </ThaiPhrases></h3>
          <Link
            href={href(ZODIAC_INDEX_PATH)}
            prefetch={false}
            className="text-xs font-serif-th font-semibold text-gold-ink hover:underline whitespace-nowrap shrink-0"
          >
            {isEnglish ? "Open the zodiac wheel →" : "เปิดวงล้อจักรราศี →"}
          </Link>
        </div>
        {/* 6 ใบต่อแถวเหมือนกล่องเมเจอร์ อาร์คานา · มือถือเป็นสไลด์ปัด (แบบ apple.com) แทนกริด 4 แถวยาวเหยียด */}
        <div data-rail>
          <ul className="home-rail home-rail-sm grid grid-cols-3 sm:grid-cols-6 gap-2.5 sm:gap-4" data-rail-track>
            {ZODIAC_SIGNS.map((sign) => {
              const card = SUMMARY_BY_ID.get(sign.majorCardId);
              return (
                <li key={sign.id}>
                  <Link
                    href={href(zodiacSignPath(sign.id))}
                    prefetch={false}
                    className="glass-tile group flex flex-col items-center gap-1.5 p-2 sm:p-4 h-full"
                  >
                    <div className="glass-tile !rounded-md w-11 sm:w-14 aspect-[2/3] overflow-hidden group-hover:scale-105 transition-transform duration-200">
                      {/* ภาพประกอบล้วน — ชื่อราศีและชื่อไพ่พิมพ์อยู่ใต้ภาพแล้ว (INC-0125) */}
                      {card && (
                        <CardImage
                          image={card.image}
                          alt=""
                          className="w-full h-full object-cover"
                          sizes="(min-width: 640px) 56px, 44px"
                        />
                      )}
                    </div>
                    <span className="text-xs font-serif-th font-bold text-ink text-center leading-tight">
                      {isEnglish ? sign.nameEn : sign.nameTh}
                    </span>
                    {card && <span className="text-[10px] text-muted text-center leading-tight">{card.nameEn}</span>}
                  </Link>
                </li>
              );
            })}
          </ul>
          <HomeRailNav isEnglish={isEnglish} />
        </div>
      </div>

      <div data-rail>
        <div className="home-rail grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" data-rail-track>
          {FEATURES.map((feature) => {
            const copy = isEnglish ? feature.en : feature.th;
            return (
              <Link
                key={feature.th.title}
                href={`${href(feature.path)}${feature.hash}`}
                prefetch={false}
                className="altar-card-porcelain p-5 group flex items-center gap-4"
              >
                <div className="glass-tile !rounded-lg w-11 aspect-[2/3] overflow-hidden flex-shrink-0">
                  {/* ภาพประกอบล้วน — หัวข้อในลิงก์เดียวกันบอกชื่อแล้ว (INC-0125) */}
                  <CardImage image={feature.image} alt="" className="w-full h-full object-cover" sizes="44px" />
                </div>
                <div className="space-y-1 min-w-0">
                  <h3 className="font-serif-th font-bold text-sm sm:text-base text-ink group-hover:text-gold-ink transition-colors leading-snug"><ThaiPhrases>
                    {copy.title}
                  </ThaiPhrases></h3>
                  <p className="text-xs font-serif-th text-muted leading-relaxed">{copy.desc}</p>
                </div>
              </Link>
            );
          })}
        </div>
        <HomeRailNav isEnglish={isEnglish} />
      </div>
    </section>
  );
}
