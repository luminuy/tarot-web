/**
 * 🔮 หน้า Pick A Card รายหัวข้อ — `/pick-a-card/<slug>` และฝาแฝดอังกฤษ
 * ===========================================================================
 * ## ทำไมต้องแตกเป็นหน้าละหัวข้อ
 *
 * เดิม 4 หัวข้อกองรวมอยู่ในหน้าเดียว ทั้งที่แต่ละหัวข้อคือ **คีย์เวิร์ดค้นหาคนละตัว**
 * ("pick a card เขาคิดยังไง" · "pick a card การงาน" · "ข้อความจากจักรวาล")
 * หน้าเดียวจึงต้องแย่งอันดับกับตัวเองและไม่มีหน้าไหนตรงคำค้นจริงสักหน้า
 *
 * โครงใหม่: หน้ารวมยังอยู่ที่ `/pick-a-card` (เลือกหัวข้อไหนก็ได้) ส่วนหน้าหัวข้อ
 * มี URL ของตัวเอง ชื่อเรื่องของตัวเอง และคำอธิบายที่ตรงกับคำค้นนั้นโดยเฉพาะ
 *
 * ## ⚠️ กติกาที่ด่านเฝ้าอยู่
 *
 * - ชื่อเรื่องต้องไม่เกินเพดาน SERP **หลังบวก " · SeerTarot" (12 ตัวอักษร) แล้ว** (ด่าน meta-length)
 * - ฝั่งอังกฤษห้ามมีภาษาไทยหลุดแม้แต่ตัวเดียว (ด่าน en-thai-leak)
 * - ทุกหน้าต้องมีฝาแฝดสองภาษาและ hreflang ชี้กันครบ (ด่าน en-routing)
 * - ทุก URL ที่ประกาศใน sitemap ต้องมีไฟล์ที่เรนเดอร์จริง (ด่าน rendered-coverage)
 */
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { buildAlternates, SITE_ORIGIN } from "@/lib/config/site";
import { SeoArticleShell } from "@/components/seo/SeoArticleShell";
import { buildPageOgImage } from "@/lib/media/og-image";
import { jsonLdScript } from "@/lib/seo/json-ld";
import { PICK_A_CARD_TOPICS, type PickACardTopic } from "@/data/pick-a-card";
import type { Locale } from "@/lib/i18n/types";
import { localeHref } from "@/lib/i18n/paths";

interface TopicCopy {
  metaTitleTh: string;
  metaTitleEn: string;
  metaDescTh: string;
  metaDescEn: string;
  keywordsTh: string[];
  keywordsEn: string[];
  articleTitleTh: string;
  articleTitleEn: string;
  eyebrowTh: string;
  eyebrowEn: string;
  bodyTh: string[];
  bodyEn: string[];
  faqsTh: { q: string; a: string }[];
  faqsEn: { q: string; a: string }[];
}

/** เนื้อหา SEO ประจำหัวข้อ — คีย์ตรงกับ `PickACardTopic.id` */
const TOPIC_COPY: Record<string, TopicCopy> = {
  "love-feelings": {
    metaTitleTh: "Pick A Card เขาคิดยังไงกับเรา ดูฟรี",
    metaTitleEn: "Pick A Card: What Are They Thinking?",
    metaDescTh:
      "Pick A Card เลือกกองไพ่ดูว่าเขาคิดยังไงกับคุณตอนนี้ ความรู้สึกที่ไม่เคยพูด สิ่งที่เขาเก็บซ่อนไว้ และแนวโน้มความสัมพันธ์ ด้วยไพ่ 1909 Rider-Waite ฟรี",
    metaDescEn:
      "Pick 1 of 4 tarot piles to see what they are really thinking about you, the feelings they never say aloud, and where this connection is heading. Free.",
    keywordsTh: [
      "pick a card เขาคิดยังไง",
      "เขาคิดยังไงกับเรา",
      "ดูดวงความรู้สึกเขา",
      "pick a card ความรัก",
      "ไพ่ยิปซีความรัก",
    ],
    keywordsEn: [
      "pick a card what are they thinking",
      "how do they feel about me tarot",
      "pick a card love reading",
      "free love tarot",
    ],
    eyebrowTh: "อ่านใจคนที่คุณคิดถึง",
    eyebrowEn: "Reading The Heart You Wonder About",
    articleTitleTh: "เขาคิดยังไงกับเรา: อ่านความรู้สึกที่เขาไม่เคยพูดออกมา",
    articleTitleEn: "What Are They Thinking: Reading The Words They Never Say",
    bodyTh: [
      "คำถามที่คนไทยค้นหามากที่สุดเรื่องหนึ่งคือ &quot;เขาคิดยังไงกับเรา&quot; โดยเฉพาะในความสัมพันธ์ที่ยังไม่มีคำนิยาม คนคุยที่หายไปเงียบ ๆ แฟนที่เริ่มตอบสั้นลง หรือคนที่เพิ่งเลิกรากันไปแล้วยังมีเยื่อใย การเลือกกองไพ่แบบ Pick A Card ช่วยให้คุณหยุดเดาใจสักครู่ แล้วมองภาพความสัมพันธ์จากมุมที่ไม่ได้ใช้ความคาดหวังของตัวเองเป็นตัวตั้ง",
      "กองไพ่ทั้งสี่ในหน้านี้อ่านความรู้สึกของอีกฝ่ายผ่านสามชั้น ชั้นแรกคือความรู้สึกที่เขามีต่อคุณในตอนนี้ ชั้นที่สองคือสิ่งที่เขาเก็บซ่อนไว้และไม่กล้าพูด และชั้นที่สามคือแนวโน้มของความสัมพันธ์พร้อมคำแนะนำว่าคุณควรวางตัวอย่างไรต่อจากนี้ ทุกใบเป็นไพ่ 1909 Rider-Waite แท้ และคำอ่านของแต่ละใบถูกเขียนไว้คู่กับไพ่ใบนั้นโดยเฉพาะ",
      "วิธีเลือกที่ให้ผลตรงที่สุดคือหลับตา หายใจเข้าลึก ๆ นึกถึงใบหน้าหรือชื่อของเขาให้ชัด แล้วเลือกกองที่สะดุดตาเป็นกองแรกโดยไม่ต้องหาเหตุผล ถ้าอยากได้คำอ่านเจาะลึกเป็นรายกรณี ให้ไปต่อที่การเปิดไพ่เต็มรูปแบบกับแม่หมอ AI ซึ่งจะถามคำถามกลับและอ่านตามสถานการณ์ของคุณโดยตรง",
    ],
    bodyEn: [
      "&quot;What are they thinking about me?&quot; is one of the most searched questions in tarot, and it usually arrives during the undefined stretch of a relationship: the person who went quiet, the partner whose replies got shorter, the ex you have not fully closed the door on. Choosing a pile gives you a pause from guessing and a chance to see the situation without your own hopes narrating it.",
      "The four piles here read the other person across three layers. First, how they feel about you right now. Second, what they are holding back and have not said. Third, where the connection is heading, with advice on how to carry yourself next. Every card is an authentic 1909 Rider-Waite image, and each paragraph is written for that specific card in that specific position.",
      "For the clearest result, close your eyes, breathe slowly, hold their name or face in mind, and choose the pile that pulls at you first without reasoning it out. If you want a reading shaped around your exact situation, continue to a full spread with the AI reader, which asks clarifying questions before interpreting.",
    ],
    faqsTh: [
      {
        q: "Pick A Card เขาคิดยังไงกับเรา แม่นจริงไหม?",
        a: "ไพ่ทำหน้าที่เป็นกระจกสะท้อนพลังงานและมุมมองในช่วงเวลานั้น ไม่ใช่คำพิพากษาตายตัว สิ่งที่ได้จึงควรใช้เป็นแง่มุมเพิ่มเติมในการตัดสินใจ ควบคู่กับสิ่งที่คุณเห็นจากพฤติกรรมจริงของอีกฝ่าย",
      },
      {
        q: "เปิดซ้ำได้ไหมถ้าคำตอบไม่ถูกใจ?",
        a: "เปิดซ้ำได้ ทุกครั้งที่กลับมาเลือกใหม่ระบบจะสับไพ่ใหม่ให้เสมอ แต่แนะนำให้เว้นระยะสักหน่อยและตั้งคำถามให้ชัดขึ้น เพราะการเปิดรัว ๆ ด้วยคำถามเดิมมักทำให้ตีความสับสนมากกว่าเดิม",
      },
      {
        q: "ต่างจากการเปิดไพ่กับแม่หมอ AI อย่างไร?",
        a: "หน้านี้เป็นการเลือกกองสำเร็จรูปที่อ่านได้ทันทีโดยไม่ต้องพิมพ์อะไรเลย ส่วนการเปิดไพ่กับแม่หมอ AI จะถามคำถามกลับ เลือกผังที่เหมาะกับเรื่องของคุณ และอ่านตามบริบทเฉพาะตัวมากกว่า",
      },
    ],
    faqsEn: [
      {
        q: "Is a pick a card reading about their feelings accurate?",
        a: "The cards mirror the energy and perspective of the moment rather than issuing a verdict. Treat the reading as an added angle alongside what their actual behaviour shows you.",
      },
      {
        q: "Can I draw again if I do not like the answer?",
        a: "Yes. Every time you step back and choose again the piles are reshuffled. Still, leave a little space between readings and sharpen the question, because rapid repeats on the same question usually muddy the interpretation.",
      },
      {
        q: "How is this different from a reading with the AI reader?",
        a: "This page is an instant pile reading that needs no typing at all. The AI reader asks clarifying questions, picks a spread suited to your situation, and interprets with your specific context in mind.",
      },
    ],
  },

  "love-future": {
    metaTitleTh: "Pick A Card ทิศทางความรักในอนาคต",
    metaTitleEn: "Pick A Card: Future Of Your Love Life",
    metaDescTh:
      "Pick A Card เลือกกองไพ่ดูทิศทางความรัก และความสัมพันธ์ในอนาคต จุดเปลี่ยนสำคัญ และผลลัพธ์ปลายทาง ด้วยไพ่ 1909 Rider-Waite แท้ ฟรี ไม่ต้องสมัคร",
    metaDescEn:
      "Pick 1 of 4 tarot piles to see where your love life is heading, the turning point ahead, and the outcome waiting at the end. Free 1909 Rider-Waite reading.",
    keywordsTh: [
      "pick a card ความรักอนาคต",
      "ดูดวงความรักอนาคต",
      "ทิศทางความสัมพันธ์",
      "pick a card ความรัก",
      "ไพ่ทาโรต์ความรัก",
    ],
    keywordsEn: [
      "pick a card love future",
      "future of my relationship tarot",
      "love tarot reading free",
      "where is this relationship going",
    ],
    eyebrowTh: "มองทางข้างหน้าของหัวใจ",
    eyebrowEn: "Looking Down The Road Of The Heart",
    articleTitleTh: "ทิศทางความรักในอนาคต: จุดเปลี่ยนที่รออยู่ และปลายทางที่เป็นไปได้",
    articleTitleEn: "The Future Of Your Love Life: The Turning Point And What Waits",
    bodyTh: [
      "คนที่ค้นหาเรื่องทิศทางความรักส่วนใหญ่ไม่ได้อยากรู้แค่ว่า &quot;จะได้แต่งงานไหม&quot; แต่อยากรู้ว่าสิ่งที่กำลังทำอยู่ตอนนี้กำลังพาไปทางไหน ความสัมพันธ์ที่ยื้ออยู่ควรไปต่อหรือพอแค่นี้ และถ้าปล่อยมือแล้วข้างหน้ามีอะไรรออยู่บ้าง กองไพ่ในหน้านี้จึงวางไว้สามจังหวะ คือพลังงานตั้งต้น จุดเปลี่ยนสำคัญ และผลลัพธ์ปลายทาง",
      "สิ่งที่ควรรู้ก่อนอ่านคือ ไพ่ทาโรต์อ่าน &quot;แนวโน้มจากพลังงานปัจจุบัน&quot; ไม่ใช่อนาคตที่ถูกล็อกไว้แล้ว ถ้าคุณเปลี่ยนวิธีวางตัว เปลี่ยนสิ่งที่ยอมรับได้ หรือเปลี่ยนคนที่เลือกคบ ปลายทางก็เปลี่ยนตาม คำอ่านจึงมีประโยชน์ที่สุดเมื่อใช้เป็นแผนที่ ไม่ใช่คำพยากรณ์ที่ต้องรอให้เกิด",
      "หลังอ่านจบ ลองจดหนึ่งประโยคที่สะกิดใจที่สุดเก็บไว้ แล้วกลับมาดูอีกครั้งในอีกสองสัปดาห์ คุณจะเห็นชัดขึ้นว่าอะไรในคำอ่านตรงกับสิ่งที่เกิดขึ้นจริง และถ้าต้องการคำตอบเฉพาะกรณีของคุณจริง ๆ ให้เปิดไพ่เต็มผังกับแม่หมอ AI ต่อได้ทันทีจากปุ่มท้ายคำทำนาย",
    ],
    bodyEn: [
      "Most people asking about the future of their love life are not only asking whether marriage is coming. They want to know where the current situation is actually heading, whether the relationship they are holding on to deserves more time, and what waits if they let go. These piles are laid out in three beats: the seed energy, the turning point, and the outcome.",
      "Worth knowing before you read: tarot describes a trajectory from present energy, not a locked future. Change how you show up, change what you accept, or change who you give time to, and the destination shifts with it. The reading is most useful as a map rather than a prophecy to wait for.",
      "After reading, write down the single line that struck you hardest and revisit it in two weeks. You will see clearly which parts matched what actually happened. If you want an answer shaped entirely around your case, continue into a full spread with the AI reader from the button beneath your reading.",
    ],
    faqsTh: [
      {
        q: "ไพ่บอกอนาคตความรักได้แม่นแค่ไหน?",
        a: "ไพ่อ่านแนวโน้มจากพลังงานในปัจจุบัน ไม่ได้ล็อกอนาคตไว้ตายตัว ถ้าคุณเปลี่ยนการตัดสินใจหรือเปลี่ยนวิธีวางตัว ทิศทางข้างหน้าย่อมเปลี่ยนตามไปด้วย",
      },
      {
        q: "ควรเปิดดูทิศทางความรักบ่อยแค่ไหน?",
        a: "แนะนำให้เว้นอย่างน้อยหนึ่งถึงสองสัปดาห์ต่อหนึ่งคำถาม เพราะพลังงานต้องใช้เวลาขยับ การเปิดทุกวันด้วยคำถามเดิมมักทำให้สับสนมากกว่าจะได้ความชัดเจน",
      },
      {
        q: "ถ้าคำทำนายออกมาไม่ดีควรทำอย่างไร?",
        a: "อ่านส่วน &quot;คำแนะนำ&quot; ให้ละเอียด เพราะไพ่ใบที่สามมักบอกทางออกไว้เสมอ คำอ่านที่ดูหนักมักเป็นสัญญาณให้ปรับบางอย่างก่อนที่เรื่องจะบานปลาย ไม่ใช่คำสาป",
      },
    ],
    faqsEn: [
      {
        q: "How accurate is tarot about the future of love?",
        a: "Tarot reads the trajectory of present energy rather than fixing the future. Change a decision or how you show up and the road ahead changes with it.",
      },
      {
        q: "How often should I check my love direction?",
        a: "Leave at least one to two weeks per question. Energy needs time to move, and asking the same thing daily usually produces confusion rather than clarity.",
      },
      {
        q: "What if the reading looks discouraging?",
        a: "Read the advice card closely — the third position almost always points to a way through. A heavy reading is usually a nudge to adjust something early, not a sentence.",
      },
    ],
  },

  "career-finance": {
    metaTitleTh: "Pick A Card การงานการเงิน ก้าวต่อไป",
    metaTitleEn: "Pick A Card: Your Career & Money Move",
    metaDescTh:
      "Pick A Card เลือกกองไพ่ดูก้าวต่อไปเรื่องงาน และโอกาสการเงินใหม่ ทักษะที่ควรใช้ กระแสโอกาสที่ไหลเข้ามา และผลลัพธ์ ด้วยไพ่ 1909 Rider-Waite ฟรี",
    metaDescEn:
      "Pick 1 of 4 tarot piles for your next career move: the skill to lean on, the opportunity coming in, and the result ahead. Free 1909 Rider-Waite reading.",
    keywordsTh: [
      "pick a card การงาน",
      "ดูดวงการงาน",
      "ดูดวงการเงิน",
      "pick a card เปลี่ยนงาน",
      "ไพ่ยิปซีการงาน",
    ],
    keywordsEn: [
      "pick a card career",
      "career tarot reading",
      "money tarot pick a card",
      "should i change jobs tarot",
    ],
    eyebrowTh: "อ่านจังหวะงานและเงิน",
    eyebrowEn: "Reading The Timing Of Work And Money",
    articleTitleTh: "ก้าวต่อไปเรื่องงานและเงิน: ทักษะที่ควรใช้และโอกาสที่กำลังมา",
    articleTitleEn: "Your Next Step In Work And Money: The Skill And The Opening",
    bodyTh: [
      "คำถามเรื่องงานที่คนถามไพ่บ่อยที่สุดมักไม่ใช่ &quot;จะรวยไหม&quot; แต่เป็นคำถามที่จับต้องได้กว่านั้น เช่น ควรย้ายงานตอนนี้หรือรออีกหน่อย ควรลงทุนกับทักษะไหนก่อน หรือควรรับข้อเสนอที่เพิ่งได้มาหรือไม่ กองไพ่ในหน้านี้จึงอ่านสามมุมคือ ทักษะและการลงมือทำ กระแสโอกาสที่ไหลเข้ามา และผลลัพธ์ที่ปลายทาง",
      "ข้อดีของการดูเรื่องงานด้วยไพ่คือมันบังคับให้คุณมองสถานการณ์เป็นระบบแทนที่จะจมอยู่กับความกังวลรายวัน ไพ่ใบแรกจะบอกว่าจุดแข็งที่ควรใช้ตอนนี้คืออะไร ใบที่สองบอกว่าอะไรกำลังเข้ามาและควรระวังอะไร ส่วนใบที่สามคือปลายทางที่พลังงานชุดนี้กำลังพาไป",
      "ข้อควรระวังคือ ไพ่ไม่ใช่คำแนะนำทางการเงินและไม่ควรใช้แทนการวางแผนจริง ตัวเลข สัญญา และความเสี่ยงต้องตรวจด้วยข้อมูล ส่วนไพ่ช่วยได้ในมุมของจังหวะ ความพร้อมของตัวเอง และสิ่งที่เรามองข้ามไปเพราะอยู่ใกล้ตัวเกินไป",
    ],
    bodyEn: [
      "The career questions people actually bring to tarot are rarely &quot;will I be rich&quot;. They are far more concrete: should I move now or wait, which skill deserves my next six months, should I accept the offer on the table. These piles answer across three angles: the skill to lean on, the opportunity flowing in, and the result at the end of it.",
      "The value of reading work questions this way is that it forces a structured look instead of daily anxiety. The first card names the strength worth using now, the second names what is arriving and what to watch, and the third shows where this set of energy is heading.",
      "One caution: tarot is not financial advice and should never replace real planning. Numbers, contracts, and risk belong to data. What the cards help with is timing, your own readiness, and the thing you have stopped noticing because it sits too close.",
    ],
    faqsTh: [
      {
        q: "ดูไพ่เรื่องงานควรถามอย่างไรให้ได้คำตอบชัด?",
        a: "ถามให้เจาะจงและอยู่ในกรอบเวลา เช่น &quot;ภายในสามเดือนนี้ควรโฟกัสอะไรในงาน&quot; จะได้คำตอบที่นำไปใช้ได้จริงมากกว่าคำถามกว้าง ๆ อย่าง &quot;ดวงงานเป็นอย่างไร&quot;",
      },
      {
        q: "ไพ่บอกได้ไหมว่าควรลาออกหรือไม่?",
        a: "ไพ่ช่วยสะท้อนจังหวะและความพร้อมของคุณ แต่การตัดสินใจลาออกควรพิจารณาร่วมกับข้อมูลจริง เช่น เงินสำรอง ภาระผูกพัน และโอกาสที่มีอยู่ในมือ",
      },
      {
        q: "ใช้ดูเรื่องการลงทุนได้ไหม?",
        a: "ไม่แนะนำให้ใช้แทนการวิเคราะห์การลงทุน ไพ่ไม่ได้ให้คำแนะนำทางการเงิน ใช้ได้ในมุมของสภาวะจิตใจ ความเสี่ยงที่คุณรับไหว และจังหวะการตัดสินใจเท่านั้น",
      },
    ],
    faqsEn: [
      {
        q: "How should I phrase a career question for a clear answer?",
        a: "Ask specifically and inside a timeframe, such as &quot;what should I focus on at work in the next three months&quot;. Broad questions like &quot;how is my career&quot; return broad answers.",
      },
      {
        q: "Can the cards tell me whether to quit?",
        a: "They reflect timing and your own readiness. The decision itself should be weighed with real data: savings, obligations, and the options actually in your hand.",
      },
      {
        q: "Can I use this for investment decisions?",
        a: "No. This is not financial advice and should not replace analysis. Use it for mindset, risk tolerance, and timing only.",
      },
    ],
  },

  "universe-guidance": {
    metaTitleTh: "Pick A Card ข้อความจากจักรวาลถึงคุณ",
    metaTitleEn: "Pick A Card: A Message From The Universe",
    metaDescTh:
      "Pick A Card เลือกกองไพ่รับข้อความเตือนสติจากจักรวาล สภาวะปัจจุบัน บทเรียนที่กำลังตื่นรู้ และพรที่รออยู่ ด้วยไพ่ 1909 Rider-Waite แท้ ฟรี",
    metaDescEn:
      "Pick 1 of 4 tarot piles for the message the universe has for you: where you stand, the lesson waking up, and the blessing ahead. Free 1909 Rider-Waite.",
    keywordsTh: [
      "ข้อความจากจักรวาล",
      "pick a card จักรวาล",
      "ดูดวงจิตวิญญาณ",
      "ข้อคิดเตือนสติ",
      "pick a card ไพ่ทาโรต์",
    ],
    keywordsEn: [
      "message from the universe tarot",
      "pick a card spiritual message",
      "universe message pick a card",
      "spiritual tarot reading free",
    ],
    eyebrowTh: "สารจากจักรวาลถึงคุณ",
    eyebrowEn: "The Message Waiting For You",
    articleTitleTh: "ข้อความเตือนสติจากจักรวาล: สิ่งที่คุณควรได้ยินในช่วงนี้",
    articleTitleEn: "A Message From The Universe: What You Need To Hear Now",
    bodyTh: [
      "บางช่วงของชีวิตเราไม่ได้ต้องการคำทำนายว่าจะเกิดอะไรขึ้น แต่ต้องการใครสักคนพูดสิ่งที่เรารู้อยู่แล้วให้ชัดขึ้น กองไพ่ในหน้านี้ออกแบบมาเพื่อจังหวะแบบนั้น คือช่วงที่รู้สึกติดขัด เหนื่อยแบบบอกไม่ถูก หรือกำลังอยู่ระหว่างการเปลี่ยนแปลงที่ยังมองไม่เห็นปลายทาง",
      "คำอ่านแบ่งเป็นสามชั้น ชั้นแรกคือสภาวะปัจจุบันที่จักรวาลมองเห็นในตัวคุณ ชั้นที่สองคือบทเรียนที่กำลังจะตื่นรู้ และชั้นที่สามคือพรหรือสิ่งดี ๆ ที่รออยู่หากคุณเดินต่อ ทั้งหมดใช้ไพ่ 1909 Rider-Waite แท้ และเขียนด้วยภาษาที่ตรงไปตรงมาโดยไม่ตัดสินคุณ",
      "หากสิ่งที่คุณกำลังเผชิญหนักเกินกว่าคำแนะนำทั่วไป เช่น รู้สึกสิ้นหวังหรือไม่อยากมีชีวิตอยู่ ขอให้พักการดูดวงไว้ก่อนแล้วโทรสายด่วนสุขภาพจิต 1323 เพื่อคุยกับคนจริงที่พร้อมรับฟัง ไพ่ช่วยให้มุมมองได้ แต่ไม่ได้แทนที่การดูแลจากผู้เชี่ยวชาญ",
    ],
    bodyEn: [
      "Some seasons do not call for a forecast of what will happen. They call for someone to say clearly what you already sense. These piles are built for exactly that moment: when things feel stuck, when tiredness has no obvious name, or when you are mid-change with no view of the far side.",
      "The reading runs in three layers. First, the state the universe sees you in. Second, the lesson waking up right now. Third, the blessing waiting if you keep walking. Every card is an authentic 1909 Rider-Waite image, and the language stays direct without judging you.",
      "If what you are carrying is heavier than general guidance — hopelessness, or thoughts of not wanting to be here — please set the cards aside and talk to a real person. In Thailand the mental health hotline is 1323; internationally, contact your local crisis line. Tarot can offer perspective, but it never replaces professional care.",
    ],
    faqsTh: [
      {
        q: "ข้อความจากจักรวาลคืออะไร ต่างจากการดูดวงทั่วไปอย่างไร?",
        a: "เป็นการอ่านเชิงข้อคิดและมุมมองมากกว่าการทำนายเหตุการณ์ เน้นสะท้อนสภาวะปัจจุบัน บทเรียนที่กำลังเกิด และสิ่งที่ควรโฟกัส แทนที่จะบอกว่าจะเกิดอะไรขึ้นเมื่อไร",
      },
      {
        q: "ควรเปิดอ่านตอนไหนถึงจะได้ประโยชน์ที่สุด?",
        a: "ตอนที่รู้สึกติดขัดหรือกำลังลังเลจะได้ประโยชน์มากที่สุด เพราะคำอ่านทำหน้าที่เหมือนกระจกช่วยจัดระเบียบความคิด ไม่ใช่การรอคำตอบจากข้างนอก",
      },
      {
        q: "ถ้ารู้สึกแย่มากจนรับไม่ไหวควรทำอย่างไร?",
        a: "กรุณาพักการดูดวงแล้วโทรสายด่วนสุขภาพจิต 1323 เพื่อคุยกับผู้เชี่ยวชาญที่พร้อมรับฟังทันที การดูไพ่ไม่ได้ออกแบบมาเพื่อรับมือกับภาวะวิกฤตทางใจ",
      },
    ],
    faqsEn: [
      {
        q: "What is a message from the universe reading?",
        a: "It leans towards insight and perspective rather than predicting events. It reflects where you stand, the lesson unfolding, and what deserves your focus.",
      },
      {
        q: "When is the best time to read this?",
        a: "When you feel stuck or hesitant. The reading works as a mirror that organises your own thinking rather than an answer handed down from outside.",
      },
      {
        q: "What if I feel worse than a reading can help with?",
        a: "Please set the cards aside and speak to a professional. In Thailand call the mental health hotline 1323; elsewhere, contact your local crisis line. Tarot is not built for a mental health emergency.",
      },
    ],
  },
  "ex-return": {
    metaTitleTh: "Pick A Card เขาจะกลับมาไหม ดูฟรี",
    metaTitleEn: "Pick A Card: Will They Come Back?",
    metaDescTh:
      "Pick A Card เลือกกองไพ่ดูว่าเขาจะกลับมาไหม ใจเขาตอนนี้เป็นอย่างไร อะไรขวางอยู่ตรงกลาง และโอกาสกลับมาคืนดี ด้วยไพ่ 1909 Rider-Waite แท้ ฟรี",
    metaDescEn:
      "Pick 1 of 4 tarot piles to see whether they will come back: where their heart is now, what stands between you, and the odds of reconciling. Free reading.",
    keywordsTh: [
      "เขาจะกลับมาไหม",
      "pick a card คนเก่า",
      "ดูดวงคนเก่าจะกลับมาไหม",
      "ไพ่ยิปซีคืนดี",
      "pick a card ความรัก",
    ],
    keywordsEn: [
      "will they come back tarot",
      "pick a card ex reading",
      "reconciliation tarot free",
      "will my ex return",
    ],
    eyebrowTh: "อ่านใจคนที่เดินจากไป",
    eyebrowEn: "Reading The Heart That Walked Away",
    articleTitleTh: "เขาจะกลับมาไหม: อ่านใจคนที่จากไป และสิ่งที่ขวางอยู่ตรงกลาง",
    articleTitleEn: "Will They Come Back: Their Heart, And What Stands Between",
    bodyTh: [
      "คำถามว่า &quot;เขาจะกลับมาไหม&quot; มักเกิดในช่วงที่ยากที่สุดของความสัมพันธ์ คือช่วงที่เรื่องจบไปแล้วแต่ใจยังไม่จบตาม บางคนเจอการหายไปเงียบ ๆ โดยไม่มีคำอธิบาย บางคนเลิกกันแบบมีเหตุผลครบแต่ยังรู้สึกว่ามีอะไรค้างอยู่ การเลือกกองไพ่ในหน้านี้ช่วยให้คุณได้พักจากการไล่หาคำตอบด้วยตัวเองทั้งวัน แล้วมองภาพรวมจากระยะที่ไกลขึ้นสักหน่อย",
      "กองไพ่ทั้งสี่อ่านสามชั้นเหมือนกัน ชั้นแรกคือใจเขาในตอนนี้จริง ๆ ไม่ใช่สิ่งที่เขาโพสต์หรือสิ่งที่คนอื่นเล่าให้ฟัง ชั้นที่สองคือสิ่งที่ขวางอยู่ตรงกลาง ซึ่งหลายครั้งไม่ใช่ความรู้สึก แต่เป็นศักดิ์ศรี เงื่อนไขชีวิต หรือคนรอบตัว และชั้นที่สามคือโอกาสกลับมาพร้อมคำแนะนำว่าควรทำอย่างไรต่อจากนี้",
      "สิ่งที่อยากให้จำไว้คือ คำทำนายไม่ได้มีหน้าที่บอกให้คุณรอ ถ้าคำตอบที่ได้ทำให้คุณใช้ชีวิตไม่ได้ นั่นแปลว่าสิ่งที่ควรดูแลก่อนคือใจของคุณเอง ไม่ใช่การกลับมาของใคร และถ้าอยากได้คำอ่านที่เจาะจงกับเรื่องของคุณ ให้เปิดผังคืนดีเต็มรูปแบบกับแม่หมอ AI ต่อได้จากปุ่มท้ายคำทำนาย",
    ],
    bodyEn: [
      "&quot;Will they come back?&quot; usually arrives in the hardest stretch of a relationship — the part where the story ended but your heart has not caught up. Some people are left with silence and no explanation. Others ended with every reason stated and still feel something unfinished. Choosing a pile gives you a break from chasing the answer alone all day and a chance to see the whole shape from further back.",
      "All four piles read the same three layers. First, where their heart actually is now — not what they post, not what someone told you. Second, what stands between you, which is often not feeling at all but pride, circumstances, or the people around them. Third, the odds of a return, with advice on what to do next.",
      "Worth remembering: a reading is not an instruction to wait. If the answer makes it impossible to live your life, the thing that needs care first is your own heart, not their return. For guidance shaped around your specific story, continue into a full reconciliation spread with the AI reader from the button beneath your reading.",
    ],
    faqsTh: [
      {
        q: "ไพ่บอกได้จริงไหมว่าเขาจะกลับมา?",
        a: "ไพ่อ่านแนวโน้มจากพลังงานปัจจุบันของทั้งสองฝ่าย ไม่ได้ล็อกอนาคตไว้ตายตัว การกระทำของคุณและของเขาในระหว่างนี้มีผลต่อผลลัพธ์เสมอ",
      },
      {
        q: "ควรทักไปหาเขาก่อนไหม?",
        a: "ให้อ่านไพ่ใบที่สามซึ่งเป็นคำแนะนำให้ละเอียด บางกองจะชี้ว่าการเริ่มก่อนช่วยได้ บางกองจะบอกให้เว้นระยะ สิ่งสำคัญคือทักเพราะอยากคุย ไม่ใช่ทักเพื่อทดสอบว่าเขาจะตอบไหม",
      },
      {
        q: "ถ้าคำตอบบอกว่าไม่กลับมาควรทำอย่างไร?",
        a: "ให้ถือว่าเป็นการคืนเวลาให้ตัวเอง คำตอบที่ชัดเจนเจ็บกว่าในวันแรก แต่เบากว่าการรอแบบไม่มีกำหนดในระยะยาว และเปิดทางให้คนที่เหมาะกับคุณจริง ๆ เข้ามาได้",
      },
    ],
    faqsEn: [
      {
        q: "Can tarot really say whether they will come back?",
        a: "It reads the trajectory of present energy on both sides rather than fixing the future. What either of you does in the meantime still changes the outcome.",
      },
      {
        q: "Should I message them first?",
        a: "Read the third card closely — some piles say reaching out helps, others advise distance. Either way, message because you want to talk, not to test whether they reply.",
      },
      {
        q: "What if the answer says they will not return?",
        a: "Treat it as time returned to you. A clear answer hurts more on day one and weighs far less than indefinite waiting, and it clears the way for someone who actually fits.",
      },
    ],
  },

  "incoming-person": {
    metaTitleTh: "Pick A Card คนที่กำลังจะเข้ามา",
    metaTitleEn: "Pick A Card: Who Is Coming Next?",
    metaDescTh:
      "Pick A Card เลือกกองไพ่ดูคนที่กำลังจะเข้ามาในชีวิต พลังงานและนิสัยของเขา สัญญาณที่จะได้เจอ และสิ่งที่ต้องเตรียมใจ ด้วยไพ่ 1909 Rider-Waite ฟรี",
    metaDescEn:
      "Pick 1 of 4 tarot piles to meet the energy coming into your life: who they are, the signs of meeting, and what to prepare. Free 1909 Rider-Waite reading.",
    keywordsTh: [
      "คนที่กำลังจะเข้ามา",
      "pick a card คนโสด",
      "ดูดวงเนื้อคู่",
      "ดูดวงความรักคนโสด",
      "pick a card ความรักใหม่",
    ],
    keywordsEn: [
      "who is coming into my life tarot",
      "pick a card new love",
      "future partner tarot reading",
      "soulmate tarot free",
    ],
    eyebrowTh: "ทำความรู้จักคนที่ยังไม่ได้เจอ",
    eyebrowEn: "Meeting Someone You Have Not Met Yet",
    articleTitleTh: "คนที่กำลังจะเข้ามาในชีวิต: พลังงานของเขาและจังหวะที่จะได้เจอ",
    articleTitleEn: "Who Is Coming Into Your Life: Their Energy And The Timing",
    bodyTh: [
      "หน้านี้ทำมาสำหรับคนโสดที่กำลังรอใครสักคน และสำหรับคนที่เพิ่งปิดบทเก่าไปแล้วอยากรู้ว่าบทใหม่จะหน้าตาเป็นอย่างไร สิ่งที่ไพ่อ่านไม่ใช่ชื่อหรือหน้าตาของคนคนนั้น แต่เป็นพลังงานและนิสัยของคนที่กำลังเดินเข้ามาในชีวิตคุณ รวมถึงบรรยากาศของการได้เจอกัน",
      "คำอ่านแบ่งเป็นสามชั้น ชั้นแรกคือพลังงานของคนที่กำลังเข้ามา เขาเป็นคนแบบไหน พูดน้อยหรือพูดเยอะ อบอุ่นหรือจริงจัง ชั้นที่สองคือสัญญาณและจังหวะที่จะได้เจอ ว่าจะมาจากวงสังคม จากที่ทำงาน หรือจากที่ไกลตัว และชั้นที่สามคือสิ่งที่คุณต้องเตรียมใจไว้ก่อน เพื่อไม่ให้ความสัมพันธ์รอบใหม่ต้องเริ่มจากแผลเก่า",
      "ข้อแนะนำจากประสบการณ์คนอ่านไพ่คือ อย่าใช้คำอ่านแบบนี้เป็นเช็กลิสต์ไล่จับผิดคนที่เข้ามา เพราะคนจริงย่อมไม่ตรงทุกข้อ ให้ใช้เป็นเข็มทิศว่าควรเปิดใจกับพลังงานแบบไหน และควรระวังแพตเทิร์นเดิมแบบไหนที่คุณมักเผลอกลับไปเลือกซ้ำ",
    ],
    bodyEn: [
      "This page is for anyone single and waiting, and for anyone who has just closed an old chapter and wonders what the next one looks like. The cards do not read a name or a face. They read the energy and temperament of the person walking towards your life, and the atmosphere of how you meet.",
      "The reading runs in three layers. First, the energy arriving: quiet or talkative, warm or serious. Second, the signs and timing — through your social circle, through work, or from somewhere far away. Third, what you should prepare, so the new connection does not have to start on top of an old wound.",
      "One piece of practical advice: do not use a reading like this as a checklist to audit whoever appears. Real people never match every line. Use it as a compass for which energy to stay open to, and which old pattern you tend to choose again without noticing.",
    ],
    faqsTh: [
      {
        q: "ไพ่บอกได้ไหมว่าจะเจอเขาเมื่อไหร่?",
        a: "ไพ่บอกบรรยากาศและจังหวะได้ชัดกว่าการระบุวันที่ เช่น จะเจอผ่านวงสังคมหรือช่วงที่คุณเริ่มออกไปทำสิ่งใหม่ การยึดวันที่แน่นอนมักทำให้พลาดสัญญาณจริงที่อยู่ตรงหน้า",
      },
      {
        q: "ถ้าคนที่เข้ามาไม่ตรงกับคำทำนายเป๊ะ ๆ ควรทำอย่างไร?",
        a: "คนจริงไม่เคยตรงทุกข้อ ให้ดูที่แก่นของพลังงาน เช่น ความสม่ำเสมอ ความจริงใจ และความรู้สึกปลอดภัยเมื่ออยู่ด้วย มากกว่ารายละเอียดปลีกย่อย",
      },
      {
        q: "เปิดดูซ้ำบ่อย ๆ ได้ไหม?",
        a: "เปิดซ้ำได้และไพ่จะถูกสับใหม่ทุกครั้ง แต่การเปิดทุกวันด้วยคำถามเดิมมักทำให้สับสนมากกว่าชัดเจน แนะนำให้เว้นสักหนึ่งถึงสองสัปดาห์แล้วค่อยกลับมาดู",
      },
    ],
    faqsEn: [
      {
        q: "Can the cards tell me when we will meet?",
        a: "They describe atmosphere and timing better than dates — through your social circle, say, or once you start doing something new. Fixing on a date usually makes you miss the real signal in front of you.",
      },
      {
        q: "What if the person who shows up does not match exactly?",
        a: "Real people never match every line. Look at the core of the energy — consistency, sincerity, and whether you feel safe — rather than the small details.",
      },
      {
        q: "Can I read this repeatedly?",
        a: "Yes, and the piles reshuffle every time. Still, asking the same question daily tends to confuse rather than clarify. Leave one to two weeks between readings.",
      },
    ],
  },
  "money-month": {
    metaTitleTh: "Pick A Card ดวงการเงินเดือนนี้",
    metaTitleEn: "Pick A Card: Money Luck This Month",
    metaDescTh:
      "Pick A Card เลือกกองไพ่ดูดวงการเงินเดือนนี้ กระแสเงินที่กำลังไหล รูรั่วที่มองไม่เห็น และโอกาสรายได้ใหม่ ด้วยไพ่ 1909 Rider-Waite แท้ ฟรี",
    metaDescEn:
      "Pick 1 of 4 tarot piles for this month's money: where cash is flowing, the leak you cannot see, and the income opening ahead. Free 1909 Rider-Waite.",
    keywordsTh: [
      "ดวงการเงินเดือนนี้",
      "pick a card การเงิน",
      "ดูดวงการเงิน",
      "ไพ่ยิปซีการเงิน",
      "ดวงเงินเดือนนี้",
    ],
    keywordsEn: [
      "money tarot this month",
      "pick a card money",
      "finance tarot reading free",
      "money luck tarot",
    ],
    eyebrowTh: "อ่านกระแสเงินของเดือนนี้",
    eyebrowEn: "Reading This Month's Cash Flow",
    articleTitleTh: "ดวงการเงินเดือนนี้: กระแสเงิน รูรั่ว และโอกาสรายได้ที่กำลังมา",
    articleTitleEn: "Money Luck This Month: Flow, Leaks, And The Opening Ahead",
    bodyTh: [
      "คนส่วนใหญ่ที่ดูดวงการเงินไม่ได้อยากรู้ว่าจะถูกหวยไหม แต่อยากรู้ว่าเดือนนี้จะพอใช้หรือเปล่า ควรกล้าใช้เงินก้อนนี้หรือควรเก็บไว้ก่อน และทำไมเงินถึงหายไปทั้งที่รายได้ก็ไม่ได้น้อย กองไพ่ในหน้านี้จึงอ่านสามมุมที่ใช้ตัดสินใจได้จริง คือกระแสเงินตอนนี้ รูรั่วที่มองไม่เห็น และโอกาสรายได้ที่กำลังจะเข้ามา",
      "จุดที่คนมักได้ประโยชน์มากที่สุดคือไพ่ใบที่สอง เพราะเรื่องเงินส่วนใหญ่ไม่ได้พังเพราะรายได้น้อย แต่พังเพราะรูรั่วที่เกิดขึ้นซ้ำ ๆ โดยไม่มีใครนับ ทั้งค่าบริการรายเดือนที่ลืมยกเลิก เงินที่ให้ยืมแล้วไม่ได้ทวง หรือการใช้จ่ายเวลาเครียดที่กลายเป็นนิสัย",
      "ข้อควรรู้ที่สำคัญ ไพ่ทาโรต์ไม่ใช่คำแนะนำทางการเงินและไม่ควรใช้แทนการวางแผนจริง ตัวเลข สัญญา และความเสี่ยงต้องตรวจด้วยข้อมูล ส่วนไพ่มีประโยชน์ในมุมของจังหวะ ความพร้อมทางใจ และสิ่งที่เรามองข้ามเพราะมันอยู่ใกล้ตัวเกินไป",
    ],
    bodyEn: [
      "Most people asking about money are not asking whether they will win the lottery. They want to know if this month covers itself, whether to spend or hold a particular amount, and why money disappears even when income is fine. These piles read three usable angles: the flow right now, the leak you cannot see, and the income opening ahead.",
      "The second card is usually where the value sits. Money problems rarely come from low income — they come from repeated leaks nobody counts: forgotten subscriptions, loans never chased, and stress spending that quietly became a habit.",
      "Important: tarot is not financial advice and should not replace planning. Numbers, contracts, and risk belong to data. The cards help with timing, readiness, and the thing you stopped noticing because it sits too close.",
    ],
    faqsTh: [
      {
        q: "ดูดวงการเงินควรดูบ่อยแค่ไหน?",
        a: "เดือนละครั้งกำลังดี เพราะรอบการเงินของคนส่วนใหญ่เดินเป็นเดือน การเปิดทุกวันด้วยคำถามเดิมมักทำให้ตีความสับสนมากกว่าชัดเจน",
      },
      {
        q: "ไพ่บอกได้ไหมว่าควรลงทุนอะไร?",
        a: "ไม่ควรใช้ไพ่แทนการวิเคราะห์การลงทุน ไพ่ช่วยได้ในมุมความพร้อมทางใจ ความเสี่ยงที่คุณรับไหว และจังหวะการตัดสินใจเท่านั้น",
      },
      {
        q: "ถ้าไพ่ออกมาไม่ดีควรทำอย่างไร?",
        a: "ให้อ่านไพ่ใบที่สองให้ละเอียด เพราะมันชี้รูรั่วที่แก้ได้ทันที คำอ่านที่ดูหนักส่วนใหญ่คือสัญญาณให้ปิดรูรั่วก่อนที่จะบานปลาย",
      },
    ],
    faqsEn: [
      {
        q: "How often should I read about money?",
        a: "Once a month suits most people, since financial cycles run monthly. Daily readings on the same question tend to confuse rather than clarify.",
      },
      {
        q: "Can the cards tell me what to invest in?",
        a: "No. Do not use tarot in place of analysis. It helps with readiness, risk tolerance, and timing only.",
      },
      {
        q: "What if the reading looks bad?",
        a: "Read the second card closely — it names a leak you can close right away. Heavy readings are usually a signal to fix something before it grows.",
      },
    ],
  },

  "others-view": {
    metaTitleTh: "Pick A Card คนรอบตัวคิดยังไงกับคุณ",
    metaTitleEn: "Pick A Card: What People Think Of You",
    metaDescTh:
      "Pick A Card เลือกกองไพ่ดูว่าคนรอบตัวคิดยังไงกับคุณ ภาพที่คนอื่นเห็น สิ่งที่พูดกันลับหลัง และสิ่งที่ควรทำต่อ ด้วยไพ่ 1909 Rider-Waite ฟรี",
    metaDescEn:
      "Pick 1 of 4 tarot piles to see how people really view you, what is said behind your back, and what to do next. Free 1909 Rider-Waite reading.",
    keywordsTh: [
      "คนรอบตัวคิดยังไงกับเรา",
      "pick a card คนอื่นมองเรายังไง",
      "ดูดวงคนรอบข้าง",
      "ดูดวงที่ทำงาน",
      "pick a card เพื่อน",
    ],
    keywordsEn: [
      "what people think of me tarot",
      "how others see me pick a card",
      "workplace tarot reading",
      "free tarot what they say about me",
    ],
    eyebrowTh: "มองตัวเองผ่านสายตาคนอื่น",
    eyebrowEn: "Seeing Yourself Through Their Eyes",
    articleTitleTh: "คนรอบตัวคิดยังไงกับคุณ: ภาพที่เขาเห็นและสิ่งที่พูดกันลับหลัง",
    articleTitleEn: "What People Think Of You: Their View And What Is Said",
    bodyTh: [
      "คำถามว่าคนอื่นมองเราอย่างไรมักโผล่มาในช่วงที่ความสัมพันธ์รอบตัวเริ่มคลุมเครือ เช่น บรรยากาศที่ทำงานเปลี่ยนไปโดยไม่มีใครพูด เพื่อนสนิทเริ่มห่าง หรือคนในครอบครัวปฏิบัติกับเราต่างจากเดิม กองไพ่ในหน้านี้ช่วยจัดระเบียบความคิดให้คุณเห็นภาพรวมแทนการเดาเป็นราย ๆ ไป",
      "คำอ่านแบ่งเป็นสามชั้น ชั้นแรกคือภาพที่คนอื่นเห็นในตัวคุณจริง ๆ ซึ่งหลายครั้งต่างจากภาพที่คุณคิดว่าตัวเองเป็น ชั้นที่สองคือสิ่งที่พูดกันลับหลัง ซึ่งอาจเป็นทั้งคำชมและความเข้าใจผิด และชั้นที่สามคือสิ่งที่ควรทำต่อจากนี้เพื่อให้ความสัมพันธ์เดินต่อได้",
      "อยากให้ใช้หน้านี้เป็นกระจกมากกว่าเป็นศาลตัดสิน ไพ่ไม่ได้มีหน้าที่บอกว่าใครเป็นศัตรูของคุณ แต่ช่วยให้เห็นว่าภาพลักษณ์ของคุณกำลังสื่อสารอะไรออกไป และมีจุดไหนที่การพูดตรง ๆ เพียงครั้งเดียวจะแก้ได้เร็วกว่าการเก็บไว้คิดเอง",
    ],
    bodyEn: [
      "The question of how others see us usually surfaces when the relationships around us turn unclear: the mood at work changes with nobody saying why, a close friend drifts, or family treats you differently. These piles help organise the picture instead of guessing person by person.",
      "The reading runs in three layers. First, how people actually see you, which often differs from your own self-image. Second, what is said when you are not there — both praise and misunderstanding. Third, what to do next so the relationships can keep moving.",
      "Use this page as a mirror rather than a courtroom. The cards are not here to name enemies. They show what your presence is communicating, and where one direct conversation would resolve something faster than months of private theorising.",
    ],
    faqsTh: [
      {
        q: "ไพ่รู้ได้จริงหรือว่าคนอื่นคิดอะไร?",
        a: "ไพ่สะท้อนพลังงานและภาพรวมของความสัมพันธ์ในช่วงเวลานั้น ไม่ใช่การอ่านใจรายบุคคล ให้ใช้เป็นมุมมองเพิ่มเติมควบคู่กับสิ่งที่คุณสังเกตเห็นจริง",
      },
      {
        q: "ถ้าคำอ่านบอกว่ามีคนนินทาควรทำอย่างไร?",
        a: "อย่าเพิ่งเดาว่าเป็นใคร ให้โฟกัสที่คำแนะนำของไพ่ใบที่สาม เพราะการรักษาการกระทำของตัวเองให้สม่ำเสมอมักได้ผลกว่าการไล่หาต้นตอ",
      },
      {
        q: "ใช้ดูเรื่องที่ทำงานได้ไหม?",
        a: "ได้ เหมาะกับการดูบรรยากาศทีม ภาพลักษณ์ในสายตาหัวหน้า และการสื่อสารที่ควรปรับ แต่ไม่ควรใช้ตัดสินใจเรื่องบุคคลแทนการคุยกันตรง ๆ",
      },
    ],
    faqsEn: [
      {
        q: "Can the cards really know what others think?",
        a: "They reflect the energy and overall shape of your relationships at this moment rather than reading individual minds. Use it alongside what you actually observe.",
      },
      {
        q: "What if the reading says people talk behind my back?",
        a: "Do not start guessing names. Focus on the third card's advice — consistency in your own behaviour usually settles things faster than hunting for a source.",
      },
      {
        q: "Can I use this for work situations?",
        a: "Yes, for team atmosphere, how you appear to a manager, and what communication to adjust. It should not replace a direct conversation about a specific person.",
      },
    ],
  },
};

export function pickACardTopicParams(): { slug: string }[] {
  return PICK_A_CARD_TOPICS.map((topic) => ({ slug: topic.slug }));
}

export function pickACardTopicBySlug(slug: string): PickACardTopic | undefined {
  return PICK_A_CARD_TOPICS.find((topic) => topic.slug === slug);
}

function copyOf(topic: PickACardTopic): TopicCopy {
  const copy = TOPIC_COPY[topic.id];
  if (!copy) {
    // ⛔ ห้ามเดาเนื้อหาแทน — หัวข้อใหม่ต้องมีเนื้อหา SEO ของตัวเองเสมอ (ด่านที่ 76 ตรวจข้อนี้)
    throw new Error(`[pick-a-card] ไม่มีเนื้อหา SEO ของหัวข้อ "${topic.id}" — เพิ่มใน TOPIC_COPY ก่อน`);
  }
  return copy;
}

export function pickACardTopicMetadata(topic: PickACardTopic, locale: Locale): Metadata {
  const copy = copyOf(topic);
  const isEnglish = locale === "en";
  const path = `/pick-a-card/${topic.slug}`;
  const title = isEnglish ? copy.metaTitleEn : copy.metaTitleTh;
  const description = isEnglish ? copy.metaDescEn : copy.metaDescTh;

  const images = buildPageOgImage({
    title: isEnglish ? copy.metaTitleEn : copy.metaTitleTh,
    eyebrow: isEnglish ? copy.eyebrowEn : copy.eyebrowTh,
    cardImage: `${topic.coverCardId}.jpg`,
    alt: `${isEnglish ? copy.metaTitleEn : copy.metaTitleTh} · 1909 Rider-Waite`,
  });

  return {
    title,
    description,
    keywords: isEnglish ? copy.keywordsEn : copy.keywordsTh,
    alternates: buildAlternates(path, { locale, englishTwin: true }),
    openGraph: {
      title: `${title} · SeerTarot`,
      description,
      url: `${SITE_ORIGIN}${isEnglish ? "/en" : ""}${path}`,
      siteName: "SeerTarot",
      locale: isEnglish ? "en_US" : "th_TH",
      type: "website",
      images,
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} · SeerTarot`,
      description,
      images: [images[0].url],
    },
  };
}

export function PickACardTopicBody({
  topic,
  locale,
  ritual,
}: {
  topic: PickACardTopic;
  locale: Locale;
  ritual: ReactNode;
}) {
  const copy = copyOf(topic);
  const isEnglish = locale === "en";
  const path = `/pick-a-card/${topic.slug}`;
  const url = `${SITE_ORIGIN}${isEnglish ? "/en" : ""}${path}`;
  const hubUrl = `${SITE_ORIGIN}${isEnglish ? "/en" : ""}/pick-a-card`;
  const faqs = isEnglish ? copy.faqsEn : copy.faqsTh;

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: isEnglish ? "Home" : "หน้าแรก",
        item: `${SITE_ORIGIN}${isEnglish ? "/en" : ""}`,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: isEnglish ? "Pick A Card" : "Pick A Card เลือกกองไพ่",
        item: hubUrl,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: isEnglish ? topic.titleEn : topic.titleTh,
        item: url,
      },
    ],
  };

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.q.replace(/&quot;/g, '"'),
      acceptedAnswer: { "@type": "Answer", text: faq.a.replace(/&quot;/g, '"') },
    })),
  };

  // ⚠️ ทุกลิงก์ต้องผ่าน localeHref (A6-09) — เดิมหน้าอังกฤษ 8 หน้าลิงก์ข้ามไปหน้าไทยทั้งกล่อง
  const links = PICK_A_CARD_TOPICS.filter((other) => other.id !== topic.id)
    .map((other) => ({
      href: localeHref(`/pick-a-card/${other.slug}`, locale),
      label: isEnglish ? other.titleEn : other.titleTh,
    }))
    .concat([
      {
        href: localeHref("/pick-a-card", locale),
        label: isEnglish
          ? `All ${PICK_A_CARD_TOPICS.length} pick a card topics`
          : "รวมทุกหัวข้อ Pick A Card",
      },
    ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdScript(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdScript(faqJsonLd) }}
      />

      <main id="main-content" tabIndex={-1} className="min-h-screen py-6 sm:py-10 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* ห่อ div — <astro-island> เป็น display:contents จึงไม่รับระยะจาก space-y ทำให้กล่องพิธีชิดกล่องบทความ */}
          <div>{ritual}</div>

          <SeoArticleShell
            eyebrow={isEnglish ? copy.eyebrowEn : copy.eyebrowTh}
            title={isEnglish ? copy.articleTitleEn : copy.articleTitleTh}
            faqs={faqs}
            links={links}
          >
            {(isEnglish ? copy.bodyEn : copy.bodyTh).map((paragraph, index) => (
              <p key={index} dangerouslySetInnerHTML={{ __html: paragraph }} />
            ))}
          </SeoArticleShell>
        </div>
      </main>
    </>
  );
}
