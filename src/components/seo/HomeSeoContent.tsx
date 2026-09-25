import { RouteLink as Link } from "@/components/ui/RouteLink";
import { localeHref } from "@/lib/i18n/paths";
import { CardImage } from "@/components/card/CardImage";
import { getHomeFaqs } from "@/data/home-seo";
import { getFeaturedArticles } from "@/data/articles";
import { getArticleCategory, getArticleDescription, getArticleTitle } from "@/data/article-helpers";
import { getArticleCardArt } from "@/data/article-art";
import { COUNTS } from "@/components/layout/nav-links";
import { HomeZodiacSection } from "@/components/seo/HomeZodiacSection";
import { HomeMoreWaysSection } from "@/components/seo/HomeMoreWaysSection";
import { HomeProofSection } from "@/components/seo/HomeProofSection";
import { HomeRailNav } from "@/components/seo/HomeRailNav";
import { ThaiPhrases } from "@/components/ui/ThaiPhrases";

/**
 * 5 ขั้นตอนพิธีกรรมพยากรณ์ศักดิ์สิทธิ์ (Thai)
 */
const RITUAL_STEPS_TH = [
  {
    stepNum: "๑",
    phase: "ปฐมบท",
    title: "เลือกผังพยากรณ์",
    subtitle: "26 รูปแบบการจัดวางไพ่",
    cardImage: "major-00.jpg",
    cardName: "The Fool · ๐",
    desc: "เลือกรูปแบบการวางไพ่จาก 26 ผังที่ตรงกับคำถาม เช่น ผัง 1 ใบรายวัน, ผัง 3 ใบอดีต-ปัจจุบัน-อนาคต หรือผังเซลติกครอส 10 ใบ",
  },
  {
    stepNum: "๒",
    phase: "สงบจิต",
    title: "ตั้งสมาธิและเจตจำนง",
    subtitle: "เปิดรับสุ้มเสียงภายใน",
    cardImage: "major-02.jpg",
    cardName: "The High Priestess · ๒",
    desc: "สูดลมหายใจลึก ๆ สื่อสารคำถามสั้น ๆ อย่างจริงใจ และเลือกแม่หมอ AI ที่มีแนวทางการตีความตรงกับความต้องการของคุณ",
  },
  {
    stepNum: "๓",
    phase: "สับไพ่",
    title: "สับไพ่ด้วยตนเอง",
    subtitle: "Provably Fair SHA-256",
    cardImage: "major-10.jpg",
    cardName: "Wheel of Fortune · ๑๐",
    desc: "สับสำรับไพ่ 78 ใบด้วยมือคุณเองผ่าน Web Crypto API พร้อมระบบ SHA-256 Commit-Reveal การันตีไร้การแทรกแซง 100%",
  },
  {
    stepNum: "๔",
    phase: "เลือกไพ่",
    title: "สัมผัสและหยิบไพ่",
    subtitle: "เลือกจากสำรับ 78 ใบจริง",
    cardImage: "major-01.jpg",
    cardName: "The Magician · ๑",
    desc: "สำรับไพ่ 78 ใบจะแผ่ออกเป็นพัด ใช้ปลายนิ้วสัมผัสและเลือกหยิบไพ่ทีละใบตามจำนวนที่ผังกำหนดอย่างตั้งใจด้วยพลังงานของคุณ",
  },
  {
    stepNum: "๕",
    phase: "เปิดเผย",
    title: "รับคำพยากรณ์เชิงลึก",
    subtitle: "สนทนาต่อเนื่องกับแม่หมอ AI",
    cardImage: "major-17.jpg",
    cardName: "The Star · ๑๗",
    desc: "แตะพลิกหน้าไพ่ด้วยตนเอง รับฟังคำพยากรณ์สดอย่างลึกซึ้งตามสัญลักษณ์ 1909 Rider-Waite พร้อมพิมพ์แชทถามเจาะลึกได้ทันที",
  },
];

/**
 * 5 Sacred Ritual Steps (Authentic American English)
 */
const RITUAL_STEPS_EN = [
  {
    stepNum: "1",
    phase: "Prelude",
    title: "Choose Your Spread",
    subtitle: "20 Archetypal Spreads",
    cardImage: "major-00.jpg",
    cardName: "The Fool · 0",
    desc: "Select from 20 time-tested layouts tailored to your question—from a 1-card daily compass to the 10-card Celtic Cross.",
  },
  {
    stepNum: "2",
    phase: "Stillness",
    title: "Set Your Intention",
    subtitle: "Hear the Inner Voice",
    cardImage: "major-02.jpg",
    cardName: "The High Priestess · II",
    desc: "Take a deep breath, frame your question sincerely, and choose the AI oracle archetype whose interpretative lineage resonates with you.",
  },
  {
    stepNum: "3",
    phase: "Shuffle",
    title: "Shuffle the Deck",
    subtitle: "Provably Fair SHA-256",
    cardImage: "major-10.jpg",
    cardName: "Wheel of Fortune · X",
    desc: "Shuffle the complete 78-card deck with your own touch via Web Crypto API, secured by SHA-256 Commit-Reveal proofs.",
  },
  {
    stepNum: "4",
    phase: "Drawing",
    title: "Draw Your Cards",
    subtitle: "Drawn from 78 Physical Cards",
    cardImage: "major-01.jpg",
    cardName: "The Magician · I",
    desc: "The 78-card deck spreads out in an illuminated fan. Select each card with mindful intent, channeling your energy into every draw.",
  },
  {
    stepNum: "5",
    phase: "Revelation",
    title: "Unveil Deep Insights",
    subtitle: "Dialogue with Your Oracle",
    cardImage: "major-17.jpg",
    cardName: "The Star · XVII",
    desc: "Turn over your cards one by one. Read live streaming interpretations rooted in 1909 Rider-Waite iconography, and chat freely.",
  },
];

/**
 * 6 Major Arcana Highlights
 */
const MAJOR_HIGHLIGHTS = [
  { id: "major-00", nameTh: "เดอะฟูล", nameEn: "The Fool", num: "0", img: "major-00.jpg" },
  { id: "major-01", nameTh: "เดอะเมจิเชียน", nameEn: "The Magician", num: "1", img: "major-01.jpg" },
  { id: "major-02", nameTh: "เดอะไฮพรีสเตส", nameEn: "The High Priestess", num: "2", img: "major-02.jpg" },
  { id: "major-06", nameTh: "เดอะเลิฟเวอร์ส", nameEn: "The Lovers", num: "6", img: "major-06.jpg" },
  { id: "major-19", nameTh: "เดอะซัน", nameEn: "The Sun", num: "19", img: "major-19.jpg" },
  { id: "major-21", nameTh: "เดอะเวิลด์", nameEn: "The World", num: "21", img: "major-21.jpg" },
];

export function HomeSeoContent({ isEnglish = false }: { isEnglish?: boolean }) {
  // Server Component — ใช้ `LocaleLink` (client) ไม่ได้ จึงแปลงลิงก์เองด้วย `localeHref`
  const href = (path: string) => localeHref(path, isEnglish ? "en" : "th");
  const ritualSteps = isEnglish ? RITUAL_STEPS_EN : RITUAL_STEPS_TH;
  const featuredArticles = getFeaturedArticles(4);
  const homeFaqs = getHomeFaqs(isEnglish);

  return (
    <div className="w-full text-ink">
      {/* ═══════════════════════════════════════════════════════════════
          SECTION 0: ไพ่ยิปซี × โหราศาสตร์ (คำสั่งเจ้าของ 2026-09-24 — ให้อยู่หน้าแรก)
          ═══════════════════════════════════════════════════════════════ */}
      {/* ═══════════════════════════════════════════════════════════════
          ลำดับแถบ (สีสลับ ไม่ tint ↔ tint ต่อจากแถบ "เลือกผัง" ที่ tint):
            ดูดวงแบบอื่น · ราศี (tint) · ตัวอย่างคำทำนาย · 5 ขั้นตอน (tint) · 3 เสาหลัก ·
            ผังและไพ่ (tint) · บทความ · FAQ (tint) — เพิ่ม/ย้ายส่วนต้องเลื่อน tint ตามให้สลับกันเสมอ
          ═══════════════════════════════════════════════════════════════ */}
      <HomeMoreWaysSection isEnglish={isEnglish} href={href} />

      <HomeZodiacSection isEnglish={isEnglish} href={href} />

      <HomeProofSection isEnglish={isEnglish} />


      {/* ═══════════════════════════════════════════════════════════════
          SECTION 1: วิธีดูดวงไพ่ทาโรต์ 5 ขั้นตอนศักดิ์สิทธิ์ (Ritual Stations)
          ═══════════════════════════════════════════════════════════════ */}
      <section
        aria-labelledby="how-it-works-title"
        data-home-section="how_it_works"
        className="home-band home-band-tint max-w-6xl mx-auto px-4 sm:px-6 space-y-8 sm:space-y-10"
      >
        {/* Section Header */}
        <div className="text-center space-y-2.5 sm:space-y-3">
          <div className="flex items-center justify-center gap-3">
            <span className="w-10 sm:w-16 h-[1px] bg-gradient-to-r from-transparent to-gold/60" />
            <span className={`font-serif-th text-xs text-gold-ink font-bold ${isEnglish ? "uppercase tracking-[0.25em]" : ""}`}>
              {isEnglish ? "THE SACRED ORACLE RITUAL" : "ขั้นตอนพิธีกรรมพยากรณ์"}
            </span>
            <span className="w-10 sm:w-16 h-[1px] bg-gradient-to-l from-transparent to-gold/60" />
          </div>
          <h2
            id="how-it-works-title"
            className="text-2xl sm:text-3xl lg:text-4xl font-serif-th font-bold text-ink tracking-wide [text-wrap:balance]"
          ><ThaiPhrases>
            {isEnglish
              ? "How It Works: 5 Sacred Steps to Online Tarot Divination"
              : "วิธีดูดวงไพ่ทาโรต์ออนไลน์ 5 ขั้นตอนศักดิ์สิทธิ์"}
          </ThaiPhrases></h2>
          <p className="text-sm sm:text-base text-muted max-w-3xl mx-auto font-serif-th leading-relaxed [text-wrap:balance]">
            {isEnglish ? (
              <>
                Connect directly with your subconscious mind. Shuffle, cut, and draw cards with your own hands under cryptographic transparency—
                <br className="hidden sm:inline" />
                guided by 1909 Rider-Waite symbolism and Carl Jung&apos;s depth psychology.
              </>
            ) : (
              <>
                สัมผัสประสบการณ์เชื่อมโยงจิตใต้สำนึก สับและเลือกหยิบไพ่ด้วยตัวคุณเองอย่างโปร่งใส
                <br className="hidden sm:inline" />
                พร้อมรับคำทำนายที่โอบอุ้มจิตใจตามหลักสัญลักษณ์วิทยา 1909 Rider-Waite และจิตวิทยา Carl Jung
              </>
            )}
          </p>
        </div>

        {/* 5 Sacred Ritual Altar Cards — Spacious, Beautifully Balanced */}
        <div data-rail>
          <div className="home-rail grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5 lg:gap-4 xl:gap-5" data-rail-track>
            {ritualSteps.map((step) => (
              <div
                key={step.stepNum}
                className="altar-card-porcelain p-5 lg:p-4 xl:p-5 group flex flex-col justify-between relative overflow-hidden select-none"
              >
                <div className="space-y-3.5">
                  {/* Step Header */}
                  <div className="flex items-center justify-between pb-2.5 border-b border-line-warm/40">
                    <span className="text-xs font-serif-th font-bold tracking-wider text-gold-ink uppercase flex items-center gap-1.5">
                      {isEnglish ? `Step ${step.stepNum}` : `ขั้นที่ ${step.stepNum}`}
                    </span>
                    <span className="glass-chip text-[11px] font-serif-th font-medium text-muted px-2.5 py-0.5">
                      {step.phase}
                    </span>
                  </div>
  
                  {/* 1909 Rider-Waite Card Art */}
                  <div className="py-1 flex flex-col items-center">
                    <div className="glass-tile !rounded-lg w-16 h-24 sm:w-18 sm:h-27 overflow-hidden group-hover:scale-105 transition duration-300">
                      <CardImage
                        image={step.cardImage}
                        /* ภาพประกอบล้วน — ข้อความข้าง ๆ บอกชื่อเดียวกันอยู่แล้ว (INC-0125) — span ใต้ภาพพิมพ์ step.cardName อยู่แล้ว */
                        alt=""
                        className="w-full h-full object-cover"
                        sizes="72px"
                      />
                    </div>
                    <span className="text-[11px] font-mono text-gold-ink font-semibold mt-2.5 text-center">
                      {step.cardName}
                    </span>
                  </div>
  
                  {/* Step Title & Subtitle */}
                  <div className="text-center space-y-1">
                    <h3 className="font-serif-th font-bold text-base text-ink group-hover:text-gold-ink transition-colors leading-snug"><ThaiPhrases>
                      {step.title}
                    </ThaiPhrases></h3>
                    <p className="text-xs font-serif-th text-gold-ink font-medium">
                      {step.subtitle}
                    </p>
                  </div>
  
                  {/* Step Description */}
                  <p className="font-serif-th text-xs text-muted leading-relaxed text-center pt-2.5 border-t border-line-warm/30">
                    {step.desc}
                  </p>
                </div>
  
                {/* Delicate Gold Corner Accents on Hover */}
                <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                  
                  
                  
                  
                </div>
              </div>
            ))}
          </div>
          <HomeRailNav isEnglish={isEnglish} />
        </div>
      </section>


      {/* ═══════════════════════════════════════════════════════════════
          SECTION 2: ศาสตร์ 1909 RWS & PROVABLY FAIR (Sacred Triptych)
          ═══════════════════════════════════════════════════════════════ */}
      <section
        aria-labelledby="heritage-title"
        data-home-section="heritage"
        className="home-band max-w-6xl mx-auto px-4 sm:px-6 space-y-8 sm:space-y-10"
      >
        {/* Section Header */}
        <div className="text-center space-y-2.5 sm:space-y-3">
          <div className="flex items-center justify-center gap-3">
            <span className="w-10 sm:w-16 h-[1px] bg-gradient-to-r from-transparent to-gold/60" />
            <span className="font-serif-th text-xs uppercase tracking-[0.25em] text-gold-ink font-bold">
              HERITAGE &amp; INTEGRITY
            </span>
            <span className="w-10 sm:w-16 h-[1px] bg-gradient-to-l from-transparent to-gold/60" />
          </div>
          <h2 id="heritage-title" className="text-2xl sm:text-3xl lg:text-4xl font-serif-th font-bold text-ink tracking-wide [text-wrap:balance]"><ThaiPhrases>
            {isEnglish
              ? "The Heritage of 1909 Rider-Waite & Uncompromising Integrity"
              : "มนต์เสน่ห์ไพ่ 1909 Rider-Waite & ความโปร่งใสระดับสากล"}
          </ThaiPhrases></h2>
          <p className="text-sm sm:text-base text-muted font-serif-th max-w-3xl mx-auto leading-relaxed [text-wrap:balance]">
            {isEnglish ? (
              <>
                Blending over 110 years of sacred esoteric art with Provably Fair cryptographic randomness
                <br className="hidden sm:inline" />
                and Jungian archetypal psychology—a sanctuary devoted to holding and uplifting the human spirit.
              </>
            ) : (
              <>
                ผสานคุณค่าทางประวัติศาสตร์และศิลปะกว่า 110 ปี เข้ากับระบบสุ่มโปร่งใส Provably Fair
                <br className="hidden sm:inline" />
                และหลักจิตวิทยาเชิงลึก เพื่อเป็นวิหารพยากรณ์ที่โอบอุ้มจิตใจอย่างแท้จริง
              </>
            )}
          </p>
        </div>

        {/* 3 Pillars of Wisdom */}
        <div data-rail>
          <div className="home-rail grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8" data-rail-track>
            {/* Pillar 1: 1909 Historic Heritage */}
            <div className="altar-card-porcelain p-7 sm:p-8 flex flex-col justify-between space-y-6 group">
              <div className="space-y-4">
                <div className="flex items-center justify-center gap-3 py-2">
                  <div className="glass-tile !rounded-lg w-14 h-21 overflow-hidden -rotate-6 group-hover:-rotate-3 group-hover:scale-105 transition duration-300">
                    <CardImage image="major-01.jpg" alt="The Magician" className="w-full h-full object-cover" sizes="56px" />
                  </div>
                  <div className="glass-tile !rounded-lg w-14 h-21 overflow-hidden rotate-6 group-hover:rotate-3 group-hover:scale-105 transition duration-300">
                    <CardImage image="major-21.jpg" alt="The World" className="w-full h-full object-cover" sizes="56px" />
                  </div>
                </div>
  
                <div className="text-center space-y-1">
                  <span className="text-xs font-serif-th font-bold text-gold-ink tracking-wider uppercase block">
                    {isEnglish ? "Pillar I" : "เสาเอกที่ ๑"}
                  </span>
                  <h3 className="text-lg font-serif-th font-bold text-ink group-hover:text-gold-ink transition-colors"><ThaiPhrases>
                    {isEnglish ? "Original 1909 Classic Deck" : "สำรับคลาสสิก 1909 ดั้งเดิม"}
                  </ThaiPhrases></h3>
                </div>
  
                <p className="text-xs sm:text-sm text-muted font-serif-th leading-relaxed text-left">
                  {isEnglish
                    ? "The 1909 Rider-Waite-Smith deck, illustrated by Pamela Colman Smith, is a monumental work encoded with esoteric symbols, four elemental energies (Fire, Water, Air, Earth), and expressive body language designed to converse with your subconscious naturally and accurately."
                    : "ไพ่ทาโรต์ชุด 1909 Rider-Waite-Smith รังสรรค์ภาพโดย Pamela Colman Smith เป็นสำรับอันทรงคุณค่าที่บรรจุรหัสสัญลักษณ์ อัญเชิญพลังแห่งธาตุทั้งสี่ (ไฟ น้ำ ลม ดิน) และสะท้อนภาษากาย ทิศทางสายตา เพื่อสื่อสารกับจิตใต้สำนึกได้อย่างแม่นยำและเป็นธรรมชาติที่สุด"}
                </p>
              </div>
  
              <div className="pt-4 border-t border-line-warm/40 text-center">
                <span className="text-xs font-serif-th text-gold-ink font-semibold">
                  {isEnglish ? "Authentic, Unaltered 1909 Artworks" : "ศิลปะต้นฉบับคมชัดไร้การดัดแปลง"}
                </span>
              </div>
            </div>
  
            {/* Pillar 2: Provably Fair Cryptographic Randomness */}
            <div className="altar-card-porcelain p-7 sm:p-8 flex flex-col justify-between space-y-6 group">
              <div className="space-y-4">
                <div className="flex items-center justify-center gap-3 py-2">
                  <div className="glass-tile !rounded-lg w-14 h-21 overflow-hidden -rotate-6 group-hover:-rotate-3 group-hover:scale-105 transition duration-300">
                    <CardImage image="major-10.jpg" alt="Wheel of Fortune" className="w-full h-full object-cover" sizes="56px" />
                  </div>
                  <div className="glass-tile !rounded-lg w-14 h-21 overflow-hidden rotate-6 group-hover:rotate-3 group-hover:scale-105 transition duration-300">
                    <CardImage image="major-11.jpg" alt="Justice" className="w-full h-full object-cover" sizes="56px" />
                  </div>
                </div>
  
                <div className="text-center space-y-1">
                  <span className="text-xs font-serif-th font-bold text-gold-ink tracking-wider uppercase block">
                    {isEnglish ? "Pillar II" : "เสาเอกที่ ๒"}
                  </span>
                  <h3 className="text-lg font-serif-th font-bold text-ink group-hover:text-gold-ink transition-colors"><ThaiPhrases>
                    {isEnglish ? "Provably Fair Cryptographic Randomness" : "ระบบสุ่มโปร่งใส Provably Fair"}
                  </ThaiPhrases></h3>
                </div>
  
                <p className="text-xs sm:text-sm text-muted font-serif-th leading-relaxed text-left">
                  {isEnglish
                    ? "Unlike conventional computerized tarot simulators, SeerTarot harnesses SHA-256 cryptographic commitments before any cards are drawn (Commit-Reveal) via Web Crypto API. We guarantee 100% zero outcome manipulation—every card drawn comes purely from your own shuffle and touch."
                    : "แตกต่างจากระบบสุ่มทาโรต์ทั่วไป SeerTarot ผสานเทคโนโลยีเข้ารหัส SHA-256 ล็อกลำดับสำรับไพ่ล่วงหน้าก่อนเปิด (Commit-Reveal) ผ่าน Web Crypto API การันตี 100% ว่าไม่มีการแทรกแซง ไม่มีการล็อกผล ทุกใบที่ได้มาจากการสับไพ่และเลือกด้วยมือคุณเองอย่างแท้จริง"}
                </p>
              </div>
  
              <div className="pt-4 border-t border-line-warm/40 text-center">
                <span className="text-xs font-serif-th text-gold-ink font-semibold">
                  {isEnglish ? "Independently Verifiable Audit Hashes" : "ตรวจสอบลำดับแฮชย้อนหลังได้ทุกครั้ง"}
                </span>
              </div>
            </div>
  
            {/* Pillar 3: Jungian Psychology & Empathetic AI */}
            <div className="altar-card-porcelain p-7 sm:p-8 flex flex-col justify-between space-y-6 group">
              <div className="space-y-4">
                <div className="flex items-center justify-center gap-3 py-2">
                  <div className="glass-tile !rounded-lg w-14 h-21 overflow-hidden -rotate-6 group-hover:-rotate-3 group-hover:scale-105 transition duration-300">
                    <CardImage image="major-02.jpg" alt="The High Priestess" className="w-full h-full object-cover" sizes="56px" />
                  </div>
                  <div className="glass-tile !rounded-lg w-14 h-21 overflow-hidden rotate-6 group-hover:rotate-3 group-hover:scale-105 transition duration-300">
                    <CardImage image="major-17.jpg" alt="The Star" className="w-full h-full object-cover" sizes="56px" />
                  </div>
                </div>
  
                <div className="text-center space-y-1">
                  <span className="text-xs font-serif-th font-bold text-gold-ink tracking-wider uppercase block">
                    {isEnglish ? "Pillar III" : "เสาเอกที่ ๓"}
                  </span>
                  <h3 className="text-lg font-serif-th font-bold text-ink group-hover:text-gold-ink transition-colors"><ThaiPhrases>
                    {isEnglish ? "Jungian Psychology & Empathetic AI" : "จิตวิทยาและการพยากรณ์ AI"}
                  </ThaiPhrases></h3>
                </div>
  
                <p className="text-xs sm:text-sm text-muted font-serif-th leading-relaxed text-left">
                  {isEnglish
                    ? "Our AI oracles are grounded in Carl Jung's analytical psychology (Archetypes & Synchronicity) and Golden Dawn elemental dignities. We illuminate the energies beneath your query to provide compassionate, empowering counsel that honors your agency."
                    : "แม่หมอ AI ของเราได้รับการฝึกฝนบนหลักจิตวิเคราะห์เชิงลึกของ Carl Jung (Archetypes & Synchronicity) และคัมภีร์ Golden Dawn เคมีคู่ธาตุ วิเคราะห์พลังงานใต้คำถามเพื่อให้คำปรึกษาที่โอบอุ้มจิตใจ สร้างมุมมองใหม่ และเสริมพลังเจตจำนงให้คุณก้าวต่อไปได้อย่างมั่นใจ"}
                </p>
              </div>
  
              <div className="pt-4 border-t border-line-warm/40 text-center">
                <span className="text-xs font-serif-th text-gold-ink font-semibold">
                  {isEnglish ? "Empowering Insights & Sovereign Agency" : "คำปรึกษาเชิงบวก เสริมพลังเจตจำนง"}
                </span>
              </div>
            </div>
          </div>
          <HomeRailNav isEnglish={isEnglish} />
        </div>
      </section>


      {/* ═══════════════════════════════════════════════════════════════
          SECTION 3: ผังพยากรณ์และสารานุกรม 78 ใบ (Explore Spreads & Cards)
          ═══════════════════════════════════════════════════════════════ */}
      <section
        aria-labelledby="spreads-and-cards-title"
        data-home-section="spreads_cards"
        className="home-band home-band-tint max-w-6xl mx-auto px-4 sm:px-6 space-y-8 sm:space-y-10"
      >
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-line-warm/50">
          <div className="space-y-2">
            <span className="text-gold-ink text-xs font-serif-th tracking-widest uppercase block">
              SPREADS &amp; CARDS
            </span>
            <h2 id="spreads-and-cards-title" className="text-2xl sm:text-3xl font-serif-th font-bold text-ink [text-wrap:balance]"><ThaiPhrases>
              {isEnglish ? "Featured Tarot Spreads & Classic 78-Card Deck" : "ผังการเปิดไพ่พยากรณ์และสำรับไพ่ 78 ใบยอดนิยม"}
            </ThaiPhrases></h2>
            <p className="text-xs sm:text-sm text-muted font-serif-th max-w-2xl">
              {isEnglish
                ? "Explore archetypal layouts designed for every life question, and discover the comprehensive meanings of all 78 Rider-Waite cards."
                : "เลือกผังพยากรณ์ที่ตอบโจทย์ชีวิตของคุณ พร้อมเรียนรู้ความหมายไพ่ทาโรต์ 1909 ครบทั้ง 78 ใบ"}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href={href("/spreads")}
              prefetch={false}
              className="text-xs font-serif-th font-semibold text-gold-ink hover:text-[#5E390A] transition-colors inline-flex items-center gap-1 group"
            >
              {isEnglish ? "Explore All Spreads (26) " : "ดูผังทั้งหมด (26 ผัง) "}
              <span className="group-hover:translate-x-0.5 transition-transform">→</span>
            </Link>
            <span className="text-line">|</span>
            <Link
              href={href("/cards")}
              prefetch={false}
              className="text-xs font-serif-th font-semibold text-gold-ink hover:text-[#5E390A] transition-colors inline-flex items-center gap-1 group"
            >
              {isEnglish ? "Card Codex (78 Cards) " : "คลังไพ่ 78 ใบ "}
              <span className="group-hover:translate-x-0.5 transition-transform">→</span>
            </Link>
          </div>
        </div>

        {/* Featured Spreads Cards */}
        <div data-rail>
          <div className="home-rail grid grid-cols-1 sm:grid-cols-3 gap-6" data-rail-track>
            <Link
              href={href("/spreads/celtic-cross")}
              prefetch={false}
              className="altar-card-porcelain p-6 group block space-y-4"
            >
              <div className="flex items-center gap-4">
                <div className="glass-tile !rounded-lg w-12 h-17 overflow-hidden flex-shrink-0 transition-colors">
                  {/* ภาพประกอบล้วน — ข้อความข้าง ๆ บอกชื่อเดียวกันอยู่แล้ว (INC-0125) — <h3> ในลิงก์เดียวกันบอกชื่อผังอยู่แล้ว */}
                  <CardImage image="major-10.jpg" alt="" className="w-full h-full object-cover" sizes="48px" />
                </div>
                <div>
                  <span className="text-[11px] font-mono uppercase tracking-wider text-gold-ink font-bold block">
                    {isEnglish ? "10 CARDS · GRAND SPREAD" : "10 CARDS · ผังใหญ่"}
                  </span>
                  <h3 className="font-serif-th font-bold text-base text-ink group-hover:text-gold-ink transition-colors leading-snug"><ThaiPhrases>
                    {isEnglish ? "Celtic Cross Spread" : "ผังเซลติกครอส (Celtic Cross)"}
                  </ThaiPhrases></h3>
                </div>
              </div>
              <p className="text-xs sm:text-sm font-serif-th text-muted leading-relaxed">
                {isEnglish
                  ? "The crown jewel of tarot spreads. Delve into 10 dimensions of your situation—from subconscious roots and past influences to obstacles and ultimate resolution."
                  : "ราชาแห่งผังพยากรณ์ ส่องชะตาชีวิตเจาะลึก 10 มิติ ทั้งจิตใต้สำนึก อดีต อุปสรรค และผลลัพธ์สูงสุด"}
              </p>
            </Link>
  
            <Link
              href={href("/spreads/three-card")}
              prefetch={false}
              className="altar-card-porcelain p-6 group block space-y-4"
            >
              <div className="flex items-center gap-4">
                <div className="glass-tile !rounded-lg w-12 h-17 overflow-hidden flex-shrink-0 transition-colors">
                  {/* ภาพประกอบล้วน — ข้อความข้าง ๆ บอกชื่อเดียวกันอยู่แล้ว (INC-0125) — <h3> ในลิงก์เดียวกันบอกชื่อผังอยู่แล้ว */}
                  <CardImage image="major-17.jpg" alt="" className="w-full h-full object-cover" sizes="48px" />
                </div>
                <div>
                  <span className="text-[11px] font-mono uppercase tracking-wider text-gold-ink font-bold block">
                    {isEnglish ? "3 CARDS · POPULAR" : "3 CARDS · ยอดนิยม"}
                  </span>
                  <h3 className="font-serif-th font-bold text-base text-ink group-hover:text-gold-ink transition-colors leading-snug"><ThaiPhrases>
                    {isEnglish ? "3-Card: Past, Present, Future" : "ผัง 3 ใบ: อดีต-ปัจจุบัน-อนาคต"}
                  </ThaiPhrases></h3>
                </div>
              </div>
              <p className="text-xs sm:text-sm font-serif-th text-muted leading-relaxed">
                {isEnglish
                  ? "The quintessential spread for clarity. Map out your life path, evolving transitions, and emerging trajectories with profound simplicity."
                  : "ผังพยากรณ์สุดคลาสสิก เห็นภาพรวมเส้นทางชีวิต การเปลี่ยนแปลง และแนวโน้มข้างหน้าอย่างชัดเจน"}
              </p>
            </Link>
  
            <Link
              href={href("/spreads/decision")}
              prefetch={false}
              className="altar-card-porcelain p-6 group block space-y-4"
            >
              <div className="flex items-center gap-4">
                <div className="glass-tile !rounded-lg w-12 h-17 overflow-hidden flex-shrink-0 transition-colors">
                  {/* ภาพประกอบล้วน — ข้อความข้าง ๆ บอกชื่อเดียวกันอยู่แล้ว (INC-0125) — <h3> ในลิงก์เดียวกันบอกชื่อผังอยู่แล้ว */}
                  <CardImage image="major-07.jpg" alt="" className="w-full h-full object-cover" sizes="48px" />
                </div>
                <div>
                  <span className="text-[11px] font-mono uppercase tracking-wider text-gold-ink font-bold block">
                    {isEnglish ? "5 CARDS · CROSSROADS" : "5 CARDS · ทางแยกชีวิต"}
                  </span>
                  <h3 className="font-serif-th font-bold text-base text-ink group-hover:text-gold-ink transition-colors leading-snug"><ThaiPhrases>
                    {isEnglish ? "Two-Path Decision Spread" : "ผังทางแยกการตัดสินใจ"}
                  </ThaiPhrases></h3>
                </div>
              </div>
              <p className="text-xs sm:text-sm font-serif-th text-muted leading-relaxed">
                {isEnglish
                  ? "Weigh outcomes between two critical paths with balanced clarity, illuminating unseen consequences to empower decisive action."
                  : "เปรียบเทียบผลลัพธ์ของ 2 ทางเลือกอย่างเป็นกลาง ช่วยให้ตัดสินใจเรื่องสำคัญได้อย่างกระจ่างแจ้ง"}
              </p>
            </Link>
          </div>
          <HomeRailNav isEnglish={isEnglish} />
        </div>

        {/* Featured Major Arcana Cards Grid */}
        <div className="altar-panel p-6 sm:p-8 space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-line-warm/40">
            <h3 className="font-serif-th font-bold text-base text-ink flex items-center gap-2">
              
              {isEnglish ? "Major Arcana Highlights" : "ไพ่ชุดใหญ่เมเจอร์ อาร์คานา (Major Arcana Highlights)"}
            </h3>
            <Link
              href={href("/cards")}
              prefetch={false}
              className="text-xs font-serif-th font-semibold text-gold-ink hover:underline"
            >
              {isEnglish ? "View All 78 Cards →" : "ดูทั้งหมด 78 ใบ →"}
            </Link>
          </div>
          <div data-rail>
            <div className="home-rail home-rail-sm grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5 sm:gap-4" data-rail-track>
              {MAJOR_HIGHLIGHTS.map((card) => (
                <Link
                  key={card.id}
                  href={href(`/cards/${card.id}`)}
                  prefetch={false}
                  className="glass-tile group flex flex-col items-center p-3 sm:p-4"
                >
                  <div className="glass-tile !rounded-md w-14 h-21 overflow-hidden mb-2.5 group-hover:scale-105 transition-transform duration-200">
                    {/* ภาพประกอบล้วน — ข้อความข้าง ๆ บอกชื่อเดียวกันอยู่แล้ว (INC-0125) — <span> ใต้ภาพพิมพ์ชื่อไพ่อยู่แล้วทั้งสองภาษา */}
                    <CardImage image={card.img} alt="" className="w-full h-full object-cover" sizes="56px" />
                  </div>
                  <span className="text-xs font-serif-th font-bold text-ink text-center line-clamp-1">
                    {isEnglish ? card.nameEn : card.nameTh}
                  </span>
                  <span className="text-[10px] text-muted font-mono text-center line-clamp-1">
                    {isEnglish ? `Major #${card.num}` : card.nameEn}
                  </span>
                </Link>
              ))}
            </div>
            <HomeRailNav isEnglish={isEnglish} />
          </div>
        </div>
      </section>


      {/* ═══════════════════════════════════════════════════════════════
          SECTION 4: บทความและสาระน่ารู้ (Featured Articles with Card Companion)
          ═══════════════════════════════════════════════════════════════ */}
      <section
        aria-labelledby="articles-title"
        data-home-section="articles"
        className="home-band max-w-6xl mx-auto px-4 sm:px-6 space-y-8 sm:space-y-10"
      >
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-line-warm/50">
          <div className="space-y-2">
            <span className="text-gold-ink text-xs font-serif-th tracking-widest uppercase block">
              WISDOM &amp; ARTICLES
            </span>
            <h2 id="articles-title" className="text-2xl sm:text-3xl font-serif-th font-bold text-ink [text-wrap:balance]"><ThaiPhrases>
              {isEnglish ? "Wisdom Codex & Esoteric Articles" : "คัมภีร์บทความ และสาระน่ารู้เกี่ยวกับไพ่ทาโรต์"}
            </ThaiPhrases></h2>
            <p className="text-xs sm:text-sm text-muted font-serif-th max-w-2xl [text-wrap:balance]">
              {isEnglish
                ? "Deep dives into divination techniques, ancient iconography, and the psychology of archetypal tarot."
                : "เจาะลึกเทคนิคการเปิดไพ่ ความหมายสัญลักษณ์โบราณ และศาสตร์จิตวิทยาไพ่ทาโรต์"}
            </p>
          </div>
          <Link
            href={href("/blog")}
            prefetch={false}
            className="text-xs font-serif-th font-semibold text-gold-ink hover:text-[#5E390A] transition-colors inline-flex items-center gap-1 group"
          >
            {isEnglish ? `Read All Articles (${COUNTS.articles}) ` : `อ่านบทความทั้งหมด (${COUNTS.articles} เรื่อง) `}
            <span className="group-hover:translate-x-0.5 transition-transform">→</span>
          </Link>
        </div>

        {/* 4 Article Cards with Tarot Artwork Companion */}
        <div data-rail>
          <div className="home-rail grid grid-cols-1 md:grid-cols-2 gap-6" data-rail-track>
            {featuredArticles.map((art) => (
              <Link
                key={art.slug}
                href={href(`/blog/${art.slug}`)}
                prefetch={false}
                className="altar-card-porcelain p-6 group flex items-start gap-4 sm:gap-5"
              >
                <div className="glass-tile !rounded-lg w-14 h-21 sm:w-16 sm:h-24 overflow-hidden flex-shrink-0 transition-colors group-hover:scale-105 duration-300">
                  {/* ภาพประกอบล้วน — ป้ายหมวดหมู่และ <h3> ในลิงก์เดียวกันบอกเรื่องบทความอยู่แล้ว (INC-0125) */}
                  <CardImage image={getArticleCardArt(art).image} alt="" className="w-full h-full object-cover" sizes="64px" />
                </div>
  
                <div className="space-y-2 min-w-0 flex-1">
                  <span className="glass-chip text-[11px] font-serif-th font-semibold text-gold-ink px-3 py-0.5 inline-block">
                    {getArticleCategory(art, isEnglish)}
                  </span>
                  <h3 className="font-serif-th font-bold text-base sm:text-lg text-ink group-hover:text-gold-ink transition-colors line-clamp-2 leading-[1.6]"><ThaiPhrases>
                    {/* leading 1.6 (ไม่ใช่ snug) — สระบน/วรรณยุกต์ของบรรทัดที่ 3 ที่ถูก clamp ทิ้งจะไม่โผล่ขึ้นมาใต้บรรทัดที่ 2 */}
                    {/* ชื่อสั้นแบบ <title> — พาดหัวเต็มของบทความใหม่ยาวเกินสองบรรทัด โดนตัดจนเหลือเศษสระล่างโผล่ */}
                    {isEnglish ? (art.seoTitleEn ?? getArticleTitle(art, true)) : art.seoTitle}
                  </ThaiPhrases></h3>
                  <p className="font-serif-th text-xs sm:text-sm text-muted line-clamp-2 leading-relaxed">
                    {getArticleDescription(art, isEnglish)}
                  </p>
                  <span className="text-xs font-serif-th font-bold text-gold-ink inline-flex items-center gap-1 pt-1 group-hover:translate-x-0.5 transition-transform">
                    {isEnglish ? "Read Full Article →" : "อ่านบทความฉบับเต็ม →"}
                  </span>
                </div>
              </Link>
            ))}
          </div>
          <HomeRailNav isEnglish={isEnglish} />
        </div>
      </section>


      {/* ═══════════════════════════════════════════════════════════════
          SECTION 5: คำถามที่พบบ่อย (FAQ Accordion)
          ═══════════════════════════════════════════════════════════════ */}
      <section
        aria-labelledby="faq-title"
        data-home-section="faq"
        className="home-band home-band-tint max-w-4xl mx-auto px-4 sm:px-6 space-y-8 sm:space-y-10"
      >
        <div className="text-center space-y-2.5 sm:space-y-3">
          <div className="flex items-center justify-center gap-3">
            <span className="w-10 sm:w-16 h-[1px] bg-gradient-to-r from-transparent to-gold/60" />
            <span className="font-serif-th text-xs uppercase tracking-[0.25em] text-gold-ink font-bold">
              FREQUENTLY ASKED QUESTIONS
            </span>
            <span className="w-10 sm:w-16 h-[1px] bg-gradient-to-l from-transparent to-gold/60" />
          </div>
          <h2 id="faq-title" className="text-2xl sm:text-3xl lg:text-4xl font-serif-th font-bold text-ink tracking-wide [text-wrap:balance]"><ThaiPhrases>
            {isEnglish ? "Frequently Asked Questions (FAQ)" : "คำถามที่พบบ่อย เกี่ยวกับการดูดวงไพ่ทาโรต์ (FAQ)"}
          </ThaiPhrases></h2>
          <p className="text-sm sm:text-base text-muted font-serif-th max-w-2xl mx-auto leading-relaxed [text-wrap:balance]">
            {isEnglish
              ? "Clarifying questions about our online divination sanctuary, cryptographic accuracy, and AI methodology."
              : "ไขข้อข้องใจเกี่ยวกับระบบดูดวงออนไลน์ ความแม่นยำ และหลักการทำงานของ SeerTarot"}
          </p>
        </div>

        <div className="space-y-3 sm:space-y-3.5">
          {homeFaqs.map((faq) => (
            <details
              key={faq.id}
              className="altar-card-porcelain group overflow-hidden open:border-[color:var(--glass-edge-on)]"
            >
              <summary className="w-full p-5 sm:p-6 flex items-center justify-between gap-4 text-left font-serif-th font-bold text-base text-ink hover:text-gold-ink transition-colors cursor-pointer list-none [&::-webkit-details-marker]:hidden">
                <span className="flex items-center gap-3 sm:gap-3.5">
                  
                  <span className="leading-snug">{faq.question}</span>
                </span>
                <span
                  aria-hidden="true"
                  className="glass-chip text-xs text-gold-ink font-mono transition-transform duration-300 flex-shrink-0 w-7 h-7 flex items-center justify-center group-open:rotate-180 group-open:bg-gold-ink group-open:text-surface"
                >
                  ▼
                </span>
              </summary>
              <div className="px-6 pb-6 pt-2 text-xs sm:text-sm font-serif-th text-muted leading-relaxed border-t border-line-warm/30">
                {faq.answer}
              </div>
            </details>
          ))}
        </div>
      </section>
    </div>
  );
}
