/**
 * 📄 เนื้อหาหน้า SEO "ลัคนาราศี…" และ "ดวงจันทร์ราศี…" (12 + 12 หน้า × 2 ภาษา)
 * ===========================================================================
 * เสริมย่อหน้าหลักใน `content.ts` (RISING_TEXT · MOON_SIGN_TEXT) ด้วยมุมที่คนค้นหาจริง:
 * ลัคนา ➔ รูปลักษณ์/สไตล์ · ความรัก · การงาน · คำแนะนำ · ดวงจันทร์ ➔ ความรัก · ดูแลใจตัวเอง · ดวงจันทร์ที่เข้ากัน
 * เขียนเอง ไม่ใช้ AI · ไม่ฟันธง (กฎเหล็ก 10) · ห้ามอิโมจิ/สัญลักษณ์บนหน้าเว็บ (กฎเหล็ก 2)
 * ⏸️ รอแม่หมอตรวจเนื้อหา เช่นเดียวกับ content.ts
 */
import type { T } from "./content";

export interface RisingExtra {
  look: T;
  love: T;
  work: T;
  advice: T;
}

export interface MoonExtra {
  love: T;
  care: T;
}

/** เรียง เมษ ➔ มีน */
export const RISING_EXTRA: readonly RisingExtra[] = [
  {
    look: { th: "ท่าทางกระฉับกระเฉง เดินเร็ว สายตามุ่งมั่น ชอบเสื้อผ้าที่เคลื่อนไหวสะดวกและสีสด", en: "Quick, energetic movements and a direct gaze; you suit practical clothes and bold colours." },
    love: { th: "เป็นฝ่ายเริ่มก่อน ชอบความตื่นเต้นช่วงแรก ความสัมพันธ์ไปได้ดีกับคนที่ให้พื้นที่และไม่เล่นเกม", en: "You make the first move and love the early spark; you thrive with partners who give you space and play straight." },
    work: { th: "เหมาะกับงานที่ต้องตัดสินใจเร็ว เปิดตลาดใหม่ หรือนำทีม เบื่อง่ายถ้างานซ้ำเดิม", en: "Best in roles that need fast decisions, new ventures or leadership; repetition bores you." },
    advice: { th: "หยุดหายใจสักครู่ก่อนตอบโต้ ความกล้าของคุณมีพลังที่สุดเมื่อมีจังหวะ", en: "Pause for a breath before reacting; your courage is strongest with timing." },
  },
  {
    look: { th: "ดูสงบ มั่นคง น้ำเสียงนุ่ม ชอบเสื้อผ้าเนื้อดีที่ใส่สบายมากกว่าตามกระแส", en: "Calm and grounded with a pleasant voice; you prefer quality, comfortable fabrics over trends." },
    love: { th: "รักช้าแต่รักนาน แสดงความรักผ่านการดูแลจับต้องได้ อาหาร สัมผัส และความสม่ำเสมอ", en: "Slow to fall, loyal once you do; you show love through touch, food and consistency." },
    work: { th: "เก่งงานที่ต้องอดทนและสร้างผลลัพธ์จับต้องได้ การเงิน ศิลปะ งานฝีมือ หรือธุรกิจที่โตช้าแต่มั่นคง", en: "Good at patient work with tangible results: finance, craft, art or businesses that grow steadily." },
    advice: { th: "ความมั่นคงไม่ได้แปลว่าห้ามเปลี่ยน ลองก้าวออกจากความคุ้นเคยทีละนิด", en: "Stability does not mean never changing; step out of your comfort zone a little at a time." },
  },
  {
    look: { th: "ดูอ่อนกว่าวัย หน้าตามีชีวิตชีวา มือไม้ไม่อยู่นิ่ง แต่งตัวหลากหลายตามอารมณ์", en: "You look younger than your age, expressive and restless, with a varied, mood-led style." },
    love: { th: "ต้องการคนที่คุยสนุกและให้อิสระ ความรักเริ่มจากความสนใจในความคิดของอีกฝ่าย", en: "You need someone fun to talk to who gives you freedom; attraction starts in the mind." },
    work: { th: "เหมาะกับงานสื่อสาร การเขียน การสอน การขาย หรืองานที่ได้ทำหลายอย่างพร้อมกัน", en: "Suited to communication, writing, teaching, sales or work that juggles many tasks." },
    advice: { th: "เลือกสักเรื่องที่สำคัญที่สุดแล้วทำให้ลึก ความรู้กว้างจะมีค่ามากขึ้นเมื่อมีแกน", en: "Choose one thing that matters most and go deep; breadth is worth more with a core." },
  },
  {
    look: { th: "ใบหน้าอ่อนโยน ดูเข้าถึงง่าย อารมณ์เปลี่ยนสะท้อนบนหน้าชัด ชอบเสื้อผ้านุ่มสบาย", en: "A soft, approachable face that shows your moods; you prefer soft, cosy clothing." },
    love: { th: "ต้องการความปลอดภัยทางใจก่อนเปิดใจ เมื่อรักแล้วดูแลอีกฝ่ายเหมือนครอบครัว", en: "You need emotional safety before opening up; once in love you care for a partner like family." },
    work: { th: "เก่งงานดูแลคน งานบริการ อาหาร การศึกษา หรือธุรกิจครอบครัว", en: "Good at caring work, hospitality, food, education or family businesses." },
    advice: { th: "บอกความต้องการของตัวเองตรง ๆ แทนการหวังให้คนอื่นเดาใจ", en: "Say what you need directly instead of hoping others will guess." },
  },
  {
    look: { th: "มีออร่า เดินเข้าห้องแล้วคนหันมอง ใส่ใจผม ทรงผม และการแต่งตัวที่มีเอกลักษณ์", en: "A natural presence that turns heads; you care about your hair and a signature look." },
    love: { th: "รักแบบเปิดเผยและใจกว้าง ต้องการคนที่ชื่นชมและภูมิใจในตัวคุณ", en: "You love openly and generously and need a partner who admires you and is proud of you." },
    work: { th: "เหมาะกับงานที่ได้อยู่ต่อหน้าคน ผู้นำ ศิลปะการแสดง การตลาด หรืองานสร้างสรรค์", en: "Made for visible roles: leadership, performance, marketing or creative work." },
    advice: { th: "ความมั่นใจที่แท้ไม่ต้องรอเสียงปรบมือ ลองชื่นชมตัวเองในวันที่ไม่มีใครเห็น", en: "Real confidence does not need applause; appreciate yourself on the days no one is watching." },
  },
  {
    look: { th: "ดูเรียบร้อย สะอาดตา ใส่ใจรายละเอียด แต่งตัวเรียบแต่ลงตัว", en: "Neat and well-kept with an eye for detail; your style is simple but precise." },
    love: { th: "แสดงความรักด้วยการช่วยเหลือและใส่ใจเรื่องเล็ก ๆ ต้องการคนที่จริงใจและสม่ำเสมอ", en: "You show love through help and attention to small things and want a sincere, steady partner." },
    work: { th: "เก่งงานวิเคราะห์ งานที่ต้องแม่นยำ สุขภาพ การจัดการระบบ หรืองานบริการที่ต้องใช้ฝีมือ", en: "Strong in analysis, precision work, health, systems or skilled service." },
    advice: { th: "ดีพอแล้วก็คือดี ไม่ต้องรอให้สมบูรณ์แบบก่อนเริ่ม", en: "Good enough is good; you do not need perfection before you start." },
  },
  {
    look: { th: "มีเสน่ห์ สุภาพ ยิ้มง่าย มีรสนิยมเรื่องความงามและการแต่งตัวที่กลมกลืน", en: "Charming, polite and quick to smile, with a refined sense of style and harmony." },
    love: { th: "ความรักเป็นเรื่องสำคัญของชีวิต ต้องการคู่ที่เท่าเทียม สุภาพ และคุยกันด้วยเหตุผล", en: "Relationships are central for you; you want an equal, courteous partner who talks things through." },
    work: { th: "เหมาะกับงานที่ใช้ทักษะคน การเจรจา กฎหมาย การออกแบบ หรือความงาม", en: "Suited to people skills: negotiation, law, design or beauty." },
    advice: { th: "การไม่เห็นด้วยไม่ได้ทำลายความสัมพันธ์ ลองพูดความต้องการของตัวเองก่อนเอาใจคนอื่น", en: "Disagreement does not destroy relationships; voice your own needs before pleasing others." },
  },
  {
    look: { th: "สายตาคม ดูลึกลับ มีพลังดึงดูด ชอบโทนสีเข้มและสไตล์ที่ไม่เปิดเผยเกินไป", en: "An intense gaze and magnetic air; you favour dark tones and a style that reveals little." },
    love: { th: "รักลึกและทุ่มเท ต้องการความไว้ใจทั้งหมด ไม่ชอบความสัมพันธ์ผิวเผิน", en: "You love deeply and completely and need total trust; shallow connections do not interest you." },
    work: { th: "เก่งงานสืบค้น วิจัย จิตวิทยา การเงินเชิงลึก หรืองานที่ต้องรับมือวิกฤต", en: "Good at research, investigation, psychology, finance or crisis work." },
    advice: { th: "ปล่อยให้คนที่ไว้ใจได้เห็นด้านอ่อนโยนของคุณบ้าง ความเปราะบางคือความกล้าแบบหนึ่ง", en: "Let trusted people see your softer side; vulnerability is a form of courage." },
  },
  {
    look: { th: "ดูเป็นมิตร ร่าเริง ท่าทางเปิดกว้าง ชอบเสื้อผ้าสบาย ๆ ที่พร้อมออกเดินทาง", en: "Friendly, cheerful and open, dressed casually and ready to travel." },
    love: { th: "ต้องการคู่ที่เป็นเพื่อนร่วมผจญภัย ให้อิสระ และคุยเรื่องความหมายของชีวิตได้", en: "You want a partner who is a fellow adventurer, gives you freedom and talks about life's meaning." },
    work: { th: "เหมาะกับการสอน การเดินทาง ต่างประเทศ ปรัชญา กฎหมาย หรือสื่อสิ่งพิมพ์", en: "Suited to teaching, travel, international work, philosophy, law or publishing." },
    advice: { th: "ความหวังพาไปไกล แต่ความสม่ำเสมอพาไปถึง ทำตามสัญญาเล็ก ๆ ให้ครบ", en: "Hope takes you far, consistency gets you there; keep your small promises." },
  },
  {
    look: { th: "ดูเป็นผู้ใหญ่ น่าเชื่อถือ ท่าทางสำรวม ชอบสไตล์คลาสสิกที่ดูดีได้นาน", en: "Mature and trustworthy with a reserved manner; you prefer classic, timeless style." },
    love: { th: "รักแบบจริงจังและมั่นคง ค่อย ๆ เปิดใจ แสดงความรักผ่านความรับผิดชอบ", en: "Serious and steady in love; you open up slowly and show love through responsibility." },
    work: { th: "เก่งการบริหาร วางแผนระยะยาว สร้างองค์กร หรืองานที่ต้องมีวินัยสูง", en: "Strong in management, long-term planning, building organisations or disciplined work." },
    advice: { th: "ความสำเร็จสำคัญ แต่การพักและสนุกก็เป็นส่วนหนึ่งของความสำเร็จ", en: "Success matters, but rest and fun are part of success too." },
  },
  {
    look: { th: "มีเอกลักษณ์ ดูเป็นมิตรแต่มีระยะห่าง ชอบสไตล์แปลกใหม่ไม่เหมือนใคร", en: "Distinctive, friendly yet a little detached, with an original, unusual style." },
    love: { th: "ต้องการคู่ที่เป็นเพื่อนสนิทด้วย ให้อิสระ และเคารพความคิดของกันและกัน", en: "You want a partner who is also a best friend, gives freedom and respects your ideas." },
    work: { th: "เหมาะกับเทคโนโลยี นวัตกรรม งานเพื่อสังคม หรืองานที่ได้คิดนอกกรอบ", en: "Suited to technology, innovation, social causes or work that rewards original thinking." },
    advice: { th: "อุดมการณ์ของคุณสวยงาม อย่าลืมดูแลความรู้สึกของคนใกล้ตัวไปพร้อมกัน", en: "Your ideals are beautiful; remember to tend the feelings of those close to you too." },
  },
  {
    look: { th: "ดวงตาอ่อนโยน ดูฝันละมุน ท่าทางนุ่มนวล ชอบเสื้อผ้าพลิ้วและโทนสีอ่อน", en: "Gentle, dreamy eyes and a soft manner; you favour flowing clothes and soft colours." },
    love: { th: "รักแบบโรแมนติกและเสียสละ ต้องการคนที่เข้าใจโลกภายในของคุณ ระวังมองอีกฝ่ายดีเกินจริง", en: "Romantic and self-giving; you want someone who understands your inner world. Watch for idealising partners." },
    work: { th: "เหมาะกับศิลปะ ดนตรี การเยียวยา งานช่วยเหลือผู้คน หรืองานที่ใช้จินตนาการ", en: "Suited to art, music, healing, helping professions or imaginative work." },
    advice: { th: "ตั้งขอบเขตให้ชัดคือการดูแลตัวเอง ไม่ใช่การใจร้าย", en: "Clear boundaries are self-care, not unkindness." },
  },
];

/** ดวงจันทร์ในราศี (เรียง เมษ ➔ มีน) — ความรัก + ดูแลใจตัวเอง */
export const MOON_EXTRA: readonly MoonExtra[] = [
  { love: { th: "ต้องการความรักที่ตื่นเต้นและตรงไปตรงมา ทะเลาะแล้วหายเร็ว ไม่ชอบเก็บความเงียบไว้นาน", en: "You need direct, lively love; you fight and forgive quickly and dislike long silences." }, care: { th: "ออกกำลังกายหรือขยับร่างกายเมื่อเครียด ให้เวลาตัวเองได้ตัดสินใจคนเดียวบ้าง", en: "Move your body when stressed and give yourself room to decide alone." } },
  { love: { th: "ต้องการความรักที่มั่นคงและสัมผัสได้ กอด อาหารอร่อย และการอยู่ด้วยกันเงียบ ๆ", en: "You need steady, physical love: hugs, good food and quiet time together." }, care: { th: "จัดมุมพักที่สบายตัว ทำอาหาร ทำสวน หรือฟังเพลงช้า ๆ", en: "Create a comfortable nest; cook, garden or listen to slow music." } },
  { love: { th: "ต้องการคู่ที่คุยกันได้ทุกเรื่อง ความรักเติบโตจากบทสนทนา", en: "You need a partner you can talk to about anything; love grows through conversation." }, care: { th: "เขียนบันทึก คุยกับเพื่อน หรืออ่านหนังสือเพื่อเรียบเรียงความรู้สึก", en: "Journal, talk to a friend or read to sort out your feelings." } },
  { love: { th: "ต้องการความรักที่ให้ความรู้สึกเหมือนบ้าน ความภักดี และการดูแลกันในวันที่อ่อนแอ", en: "You need love that feels like home: loyalty and care on your weakest days." }, care: { th: "กลับไปหาคนหรือที่ที่ทำให้รู้สึกปลอดภัย อาหารที่คุ้นเคยช่วยปลอบใจได้มาก", en: "Return to people and places that feel safe; familiar food comforts you." } },
  { love: { th: "ต้องการให้คนรักเห็นคุณค่าและแสดงความรักออกมาชัด ๆ", en: "You need your partner to value you and show love openly." }, care: { th: "ทำงานสร้างสรรค์ แต่งตัวให้ตัวเองรู้สึกดี หรือใช้เวลากับคนที่ชื่นชมคุณจริง", en: "Create something, dress up for yourself or spend time with people who truly appreciate you." } },
  { love: { th: "แสดงความรักด้วยการช่วยเหลือ ต้องการคู่ที่สังเกตความพยายามเล็ก ๆ ของคุณ", en: "You show love by helping and need a partner who notices your small efforts." }, care: { th: "จัดของ ทำกิจวัตรสม่ำเสมอ และฝึกพูดกับตัวเองอย่างใจดี", en: "Tidy up, keep a routine and practise speaking kindly to yourself." } },
  { love: { th: "ต้องการความสัมพันธ์ที่ราบรื่น สุภาพ และมีความเป็นคู่เท่าเทียม", en: "You need a harmonious, courteous and equal partnership." }, care: { th: "อยู่กับสิ่งสวยงาม ดนตรี ศิลปะ และให้เวลาตัวเองถามว่าต้องการอะไรจริง ๆ", en: "Surround yourself with beauty and art, and ask yourself what you really want." } },
  { love: { th: "ต้องการความใกล้ชิดลึกซึ้งและความซื่อสัตย์ทั้งหมด", en: "You need deep intimacy and complete honesty." }, care: { th: "หาที่ระบายความรู้สึกเข้มข้นอย่างปลอดภัย เช่น เขียน ดนตรี หรือคุยกับนักบำบัด", en: "Find safe outlets for strong feelings: writing, music or a therapist." } },
  { love: { th: "ต้องการความรักที่ให้อิสระและพาเติบโต มีเรื่องใหม่ ๆ ให้ทำด้วยกัน", en: "You need love that gives freedom and growth, with new adventures together." }, care: { th: "ออกไปข้างนอก เดินทาง เรียนสิ่งใหม่ หรือหัวเราะกับเพื่อน", en: "Get outside, travel, learn something new or laugh with friends." } },
  { love: { th: "แสดงความรักผ่านความรับผิดชอบ ต้องการคู่ที่เชื่อถือได้และไม่เร่งรัด", en: "You show love through commitment and need a reliable partner who does not rush you." }, care: { th: "อนุญาตให้ตัวเองพักโดยไม่รู้สึกผิด และแบ่งเรื่องที่แบกให้คนอื่นช่วยบ้าง", en: "Allow yourself rest without guilt and let others share the load." } },
  { love: { th: "ต้องการคู่ที่เป็นเพื่อนและเคารพพื้นที่ส่วนตัว", en: "You need a partner who is a friend and respects your space." }, care: { th: "ใช้เวลากับกลุ่มเพื่อนที่เข้าใจ หรืออยู่คนเดียวเพื่อชาร์จพลัง", en: "Spend time with like-minded friends or alone to recharge." } },
  { love: { th: "ต้องการความรักที่อ่อนโยนและเข้าใจโดยไม่ต้องอธิบาย", en: "You need gentle love that understands without explanation." }, care: { th: "นอนพักให้พอ อยู่ใกล้น้ำ ทำสมาธิ และตั้งขอบเขตกับคนที่ดูดพลัง", en: "Rest well, be near water, meditate and set limits with draining people." } },
];
