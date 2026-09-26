import { RouteLink as Link } from "@/components/ui/RouteLink";
import { CardImage } from "@/components/card/CardImage";
import { HomeRailNav } from "@/components/seo/HomeRailNav";
import { ZodiacWheel, type ZodiacWheelSign } from "@/components/encyclopedia/ZodiacWheel";
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

/** ข้อมูลที่วงล้อใช้ — ราศีที่หาไพ่ไม่เจอถูกตัดออก ไม่กุไพ่แทน (กฎเหล็กข้อ 14) */
const WHEEL_SIGNS: ZodiacWheelSign[] = ZODIAC_SIGNS.flatMap((sign) => {
  const card = SUMMARY_BY_ID.get(sign.majorCardId);
  return card
    ? [{ id: sign.id, nameTh: sign.nameTh, nameEn: sign.nameEn, major: { id: card.id, image: card.image, nameEn: card.nameEn } }]
    : [];
});

const MONTHS_TH = ["มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"];
const MONTHS_EN = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

const SELECT_CLASS =
  "glass-field w-full rounded-xl border border-line-interactive-warm px-3 py-2.5 text-sm font-sans text-ink focus:border-gold-ink focus:outline-hidden transition-colors";

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
              "Every sign has its own Major Arcana card. Enter your birthday in the wheel, or tap your sign, to meet the cards that belong to you in both the Western and the Thai (sidereal) calendar."
            ) : (
              <>
                ทุกราศีมีไพ่ชุดใหญ่ประจำตัว ดูได้ทั้งราศีแบบสากลและราศีแบบไทย{" "}
                <span className="whitespace-nowrap">(สุริยยาตร์)</span>
                <br className="hidden sm:inline" /> ใส่วันเกิดกลางวงล้อ หรือแตะราศีของคุณเพื่อดูไพ่ประจำราศี ดาวเจ้าเรือน และไพ่ประจำช่วงวันเกิด
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
            {isEnglish ? "All about zodiac cards →" : "ดูไพ่ประจำราศีแบบละเอียด →"}
          </Link>
        </div>
        {/*
          วงล้อจักรราศีตัวเดียวกับหัวหน้า /cards/zodiac (คำสั่งเจ้าของ 2026-09-26 แทนกริด 12 ช่องเดิม)
          ส่วนนี้เป็น HTML นิ่ง ไม่มี JS — ฟอร์มกลางวงส่งแบบ GET ไปหน้าราศี `?day=&month=`
          แล้ว `ZodiacFinder` ที่นั่นหาให้ทันที (ไม่ลาก island เข้าหน้าแรก บันเดิลไม่โต)
          ไม่มีป้าย "ฤดูนี้" เพราะหน้าแรกบิลด์ครั้งเดียว ป้ายจะค้างผิดเดือน
        */}
        <ZodiacWheel
          signs={WHEEL_SIGNS}
          isEnglish={isEnglish}
          hrefFor={(id) => href(zodiacSignPath(id))}
        >
          <form action={href(ZODIAC_INDEX_PATH)} method="get" className="space-y-3">
            <div className="text-center space-y-0.5">
              <p className="text-base sm:text-lg font-serif-th font-bold text-ink">
                {isEnglish ? "When were you born?" : "คุณเกิดวันไหน?"}
              </p>
              <p className="text-[12px] text-muted font-sans">
                {isEnglish ? "No year needed · western + Thai" : "ไม่ต้องใส่ปี · บอกทั้งราศีสากลและไทย"}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-1">
              <label className="block">
                <span className="sr-only">{isEnglish ? "Day" : "วันที่เกิด"}</span>
                <select name="day" defaultValue="1" className={SELECT_CLASS}>
                  {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                    <option key={d} value={d}>
                      {isEnglish ? `Day ${d}` : `วันที่ ${d}`}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="sr-only">{isEnglish ? "Month" : "เดือนเกิด"}</span>
                <select name="month" defaultValue="1" className={SELECT_CLASS}>
                  {(isEnglish ? MONTHS_EN : MONTHS_TH).map((name, i) => (
                    <option key={name} value={i + 1}>
                      {name}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <button
              type="submit"
              className="btn-gold-glass w-full min-h-[44px] py-2.5 px-4 text-sm font-serif-th font-bold duration-200 cursor-pointer active:scale-95"
            >
              {isEnglish ? "Find my cards" : "ดูไพ่ของฉัน"}
            </button>
          </form>
        </ZodiacWheel>
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
