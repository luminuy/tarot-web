/**
 * 🔭 เนื้อหาชั้นลึกของผังดวง (ไทย + อังกฤษ) — เขียนเอง ประกอบด้วยโค้ด ไม่ใช้ AI
 * ===========================================================================
 * เจ้าของสั่ง 2026-10-28 "อยากปรับปรุงเนื้อหา เข้าใจง่ายแต่ลึกซึ้ง · อัปเกรดทั้งหน้า"
 * ➔ คำอธิบายเดิมประกอบจาก "คำกริยาของดาว + ท่าทีของราศี" ชุดเดียวกันทุกดาว ทำให้ดาวที่อยู่ราศีเดียวกัน
 *    พูดประโยคเดียวกัน (เช่น "ได้พลังจากความอดทน แต่ต้องระวังความเครียด" ซ้ำ 4 ดวง) และบางคู่อ่านไม่เป็นภาษา
 *    ("แหกกรอบอย่างฉับพลันอย่างอิสระ")
 *
 * ไฟล์นี้เพิ่ม 3 ชั้นที่ทำให้อ่านแล้ว "เข้าใจทันทีและได้อะไรกลับไป":
 * 1. เสียงของดาวทุกดวง (`BODY_VOICE`): คำสั้นสำหรับหัวข้อ + สิ่งที่ดาวนั้น "ต้องการ" ➔ ประโยคมุมสัมพันธ์เป็นภาษาคน
 * 2. ความลึกของดาว/เรือน/ธาตุ/ศักดิ์ (`PLANET_DEPTH` ฯลฯ): ทำไมเรื่องนี้สำคัญ · ด้านเงาเมื่อเสียสมดุล · ใช้ให้ดีอย่างไร
 * 3. ดาวส่วนตัวในราศี (`PLANET_SIGN_TEXT`): พุธ ศุกร์ อังคาร พฤหัส เสาร์ ราศีละย่อหน้า (60 ย่อหน้า) แทนประโยคประกอบ
 *
 * กติกาการเขียน (เจ้าของสั่ง 2026-11-02 "เน้นความตรงแม่นยำ ไม่เอาตอบกลาง ๆ เซฟ ตอบชัดจัดเต็ม" และ
 * "อ่านแล้วต้องเข้าใจง่าย ตรงประเด็น ไม่กำกวม" ➔ ยกเลิกกติกาเดิม "ไม่ฟันธง"):
 * - พูดตรงเป็นข้อเท็จจริงของผังนี้ ("คุณ…" "เมื่อ… คุณจะ…") ห้ามคำกั๊ก เช่น บางที · ก็ได้ · ค่อนข้าง · ขึ้นอยู่กับ ·
 *   "มัก" ที่ใช้เลี่ยง · อังกฤษห้าม may · might · perhaps · tend to · can ที่ใช้เลี่ยง
 * - เลือกความหมายเดียวที่ตรงตำแหน่ง ห้ามไล่รายการ "ก หรือ ข หรือ ค" ให้ครอบทุกทาง
 * - ด้านเงาเขียนเป็นเหตุ ➔ ผล ("เมื่อ X คุณจะ Y") แล้วตามด้วยทางแก้ที่ทำได้จริง
 * - คำแนะนำ = การกระทำเดียวที่ชัด ทำได้ภายในสัปดาห์นี้ ไม่ใช่ "ลอง…"
 * - ภาษาคน ประโยคสั้น · ไม่โทษผู้อ่าน · ห้ามวลีหุ่นยนต์และวลีครอบจักรวาล ("ทุกอย่างจะดีขึ้นเอง")
 * - ข้อยกเว้นความปลอดภัย (ห้ามฟันธงเด็ดขาด): ความตาย อุบัติเหตุ ความเจ็บป่วย การตั้งครรภ์ ผลคดี ผลการลงทุน · ห้ามขู่
 * ⚠️ ห้ามอิโมจิ/สัญลักษณ์ (กฎเหล็ก 2) · ไม้ยมกเว้นวรรคหน้าหลัง · ⏸️ รอแม่หมอตรวจเนื้อหา (NATAL_CHART_PLAN หัวข้อ 4)
 */
import type { BodyId, Dignity, Element, PlanetId } from "@/lib/astro/natal";
import type { T } from "./content";

export interface BodyVoice {
  /** คำนามสั้นมาก ใช้ในหัวข้อ ("ตัวตนกับความรักของคุณ…") */
  word: T;
  /** สิ่งที่ดาวนี้ต้องการ เป็นวลีกริยาที่ต่อหลัง "ต้องการ" / "ความต้องการที่จะ" ได้ · อังกฤษขึ้นต้นด้วย "to" */
  want: T;
}

export const BODY_VOICE: Record<BodyId, BodyVoice> = {
  sun: { word: { th: "ตัวตน", en: "sense of self" }, want: { th: "ได้เป็นตัวของตัวเอง", en: "to be yourself" } },
  moon: { word: { th: "อารมณ์", en: "emotional world" }, want: { th: "รู้สึกปลอดภัย", en: "to feel safe" } },
  mercury: { word: { th: "ความคิด", en: "mind" }, want: { th: "ได้เข้าใจและได้พูด", en: "to understand and be heard" } },
  venus: { word: { th: "ความรัก", en: "heart" }, want: { th: "ได้รักและถูกรัก", en: "to love and be loved" } },
  mars: { word: { th: "แรงขับ", en: "drive" }, want: { th: "ได้ลงมือและได้ชนะ", en: "to act and to win" } },
  jupiter: { word: { th: "การเติบโต", en: "growth" }, want: { th: "ได้เติบโตและเห็นความหมาย", en: "to grow and find meaning" } },
  saturn: { word: { th: "ความรับผิดชอบ", en: "sense of duty" }, want: { th: "มีความมั่นคงและได้รับความเคารพ", en: "to have security and respect" } },
  uranus: { word: { th: "ความเป็นอิสระ", en: "independence" }, want: { th: "เป็นอิสระและได้ลองสิ่งใหม่", en: "to be free and try new things" } },
  neptune: { word: { th: "ความฝัน", en: "imagination" }, want: { th: "ได้เชื่อมกับสิ่งที่ลึกกว่าเรื่องวัตถุ", en: "to connect with something beyond the material" } },
  pluto: { word: { th: "พลังเปลี่ยนแปลง", en: "power to transform" }, want: { th: "รู้ความจริงที่ลึกที่สุด", en: "to know the deepest truth" } },
  chiron: { word: { th: "แผลใจ", en: "old wound" }, want: { th: "เยียวยาแผลเก่า", en: "to heal old wounds" } },
  node: { word: { th: "ทิศทางการเติบโต", en: "path of growth" }, want: { th: "ก้าวไปทางใหม่", en: "to step onto a new path" } },
  southNode: { word: { th: "นิสัยเดิม", en: "comfort zone" }, want: { th: "อยู่ในที่ที่คุ้นเคย", en: "to stay where it is familiar" } },
  lilith: { word: { th: "ด้านดิบ", en: "untamed side" }, want: { th: "เป็นอิสระจากการควบคุม", en: "to be free of control" } },
  fortune: { word: { th: "โชค", en: "fortune" }, want: { th: "ใช้ชีวิตอย่างลื่นไหล", en: "to live with ease" } },
  vertex: { word: { th: "พรหมลิขิต", en: "sense of destiny" }, want: { th: "พบคนที่ชะตาส่งมา", en: "to meet the people fate sends" } },
  ceres: { word: { th: "การดูแล", en: "nurturing" }, want: { th: "ดูแลและได้รับการดูแล", en: "to nurture and be nurtured" } },
  pallas: { word: { th: "ปัญญา", en: "strategic mind" }, want: { th: "แก้ปัญหาอย่างชาญฉลาด", en: "to solve problems wisely" } },
  juno: { word: { th: "ความผูกมัด", en: "commitment" }, want: { th: "มีคู่ที่ซื่อสัตย์และเท่าเทียม", en: "to have a loyal, equal partner" } },
  vesta: { word: { th: "ความทุ่มเท", en: "devotion" }, want: { th: "ทุ่มเทให้สิ่งที่มีความหมาย", en: "to devote yourself to what matters" } },
  asc: { word: { th: "ภาพลักษณ์", en: "first impression" }, want: { th: "ได้แสดงตัวตนให้โลกเห็น", en: "to show yourself to the world" } },
  mc: { word: { th: "เป้าหมายชีวิต", en: "life direction" }, want: { th: "ประสบความสำเร็จในสายตาสังคม", en: "to succeed in the world's eyes" } },
  dsc: { word: { th: "คู่และหุ้นส่วน", en: "partnership style" }, want: { th: "มีคู่ที่เติมเต็ม", en: "to have a partner who completes you" } },
  ic: { word: { th: "รากและบ้าน", en: "sense of home" }, want: { th: "มีบ้านที่ใจได้พัก", en: "to have a home where your heart can rest" } },
};

export interface PlanetDepth {
  /** ดาวนี้เด่นในผัง (ชิดแกน · ดาวเด่น · กลุ่มดาว) คนแบบไหน */
  loud: T;
  /** ด้านเงาเมื่อพลังนี้เสียสมดุล เขียนเป็นเหตุ ➔ ผล ("เมื่อ… คุณจะ…") */
  shadow: T;
  /** ใช้ให้ดีอย่างไร (การกระทำเดียว ทำได้จริงในสัปดาห์นี้) */
  key: T;
}

export const PLANET_DEPTH: Record<PlanetId, PlanetDepth> = {
  sun: {
    loud: { th: "คุณมีแกนในตัวชัด อยากรู้ว่าตัวเองเกิดมาเพื่ออะไร และรู้สึกมีชีวิตชีวาที่สุดเมื่อได้ทำสิ่งที่เป็นตัวเองจริง", en: "You have a strong core. You want to know what you are here for, and you feel most alive doing something that is truly yours." },
    shadow: { th: "เมื่อคุณเอาคุณค่าในตัวเองไปผูกกับคำชม ใจคุณจะขึ้นลงตามสิ่งที่คนอื่นพูด", en: "When your self-worth rides on praise, your mood rises and falls with what others say." },
    key: { th: "เลือกเป้าหมายหนึ่งข้อที่มาจากใจคุณเอง แล้วกันเวลาให้มันวันละ 20 นาที", en: "Pick one goal that comes from you, and block 20 minutes a day for it." },
  },
  moon: {
    loud: { th: "คุณใช้ความรู้สึกนำทาง อ่านบรรยากาศและใจคนได้เร็ว และต้องรู้สึกปลอดภัยก่อนถึงจะเปิดใจเต็มที่", en: "You are led by feeling. You read moods and people quickly, and you need to feel safe before you fully open up." },
    shadow: { th: "เมื่อคุณดูแลคนอื่นจนลืมดูแลใจตัวเอง อารมณ์จะเป็นคนตัดสินใจแทนคุณ", en: "When you care for everyone except yourself, your moods start making decisions for you." },
    key: { th: "จดว่าอะไรทำให้ใจคุณสงบ แล้วทำสิ่งนั้นทุกเย็น", en: "Write down what calms you, and do it every evening." },
  },
  mercury: {
    loud: { th: "คุณคิดเร็ว ช่างสังเกต และใช้คำพูดเป็นเครื่องมือหลัก ทั้งในการทำงานและการผูกมิตร", en: "You think fast, notice details and use words as your main tool, at work and in friendship." },
    shadow: { th: "เมื่อใจไม่นิ่ง ความคิดของคุณจะวนซ้ำจนตัดสินใจอะไรไม่ได้", en: "When you are restless, your thoughts loop until you cannot decide anything." },
    key: { th: "ทุกคืนเขียนเรื่องที่ค้างในหัวลงกระดาษ ความคิดบนกระดาษจัดการง่ายกว่าความคิดที่วนอยู่ในหัว", en: "Each night, write down what is on your mind; ideas on paper are easier to handle than ideas in your head." },
  },
  venus: {
    loud: { th: "คุณมีเสน่ห์แบบเป็นธรรมชาติ ให้ความสำคัญกับความสัมพันธ์ ความงาม และบรรยากาศดี ๆ ระหว่างคน", en: "You have natural charm and care deeply about relationships, beauty and good feeling between people." },
    shadow: { th: "เมื่อคุณกลัวความขัดแย้ง คุณจะยอมคนอื่นจนลืมว่าตัวเองต้องการอะไร", en: "When you fear conflict, you give in until you forget what you want." },
    key: { th: "ก่อนตอบตกลง ถามตัวเองว่าชอบจริง หรือแค่อยากให้ทุกคนพอใจ", en: "Before your next yes, ask yourself whether you truly want it, or just want everyone pleased." },
  },
  mars: {
    loud: { th: "คุณเป็นคนลงมือ มีพลังมาก กล้าเริ่ม และรู้สึกมีชีวิตชีวาเมื่อมีเป้าหมายให้ไล่ตาม", en: "You are a doer with plenty of energy. You start boldly and feel most alive with a goal to chase." },
    shadow: { th: "เมื่อพลังนี้ไม่มีที่ไป คุณจะหงุดหงิดและไปปะทะกับคนใกล้ตัว", en: "When this energy has nowhere to go, you get irritable and clash with the people closest to you." },
    key: { th: "ออกกำลังกายให้เหนื่อยจริงวันละ 20 นาที ให้พลังมีที่ไปทุกวัน", en: "Exercise hard for 20 minutes a day so the energy has somewhere to go." },
  },
  jupiter: {
    loud: { th: "คุณมองโลกกว้าง มีความหวัง และได้โอกาสมาจากความใจกว้างของตัวเอง คนรอบตัวรู้สึกว่าคุณให้กำลังใจเก่ง", en: "You see the big picture, stay hopeful and win opportunities through your own generosity. People feel encouraged around you." },
    shadow: { th: "เมื่อคุณมองโลกดีเกินจริง คุณจะรับปากเกินกำลังที่มี", en: "When your optimism outruns the facts, you promise more than you can deliver." },
    key: { th: "ก่อนรับปากเรื่องใหม่ทุกครั้ง เปิดดูตารางเวลาและงบของตัวเองก่อนตอบ", en: "Before you agree to anything new, check your calendar and budget first." },
  },
  saturn: {
    loud: { th: "คุณเป็นคนจริงจัง อดทน และพึ่งพาได้ ยอมเหนื่อยวันนี้เพื่อสิ่งที่มั่นคงในวันหน้า และยิ่งอายุมากยิ่งเก่ง", en: "You are serious, patient and reliable. You will work hard today for something solid tomorrow, and you get better with age." },
    shadow: { th: "เมื่อคุณเข้มงวดกับตัวเองเกินไป คุณจะแบกทุกอย่างไว้คนเดียว และรู้สึกว่าทำเท่าไรก็ยังไม่พอ", en: "When you are too hard on yourself, you carry everything alone and feel that nothing is ever enough." },
    key: { th: "สัปดาห์นี้ขอให้คนอื่นช่วยงานหนึ่งชิ้นที่คุณแบกอยู่คนเดียว", en: "This week, ask someone to take over one task you carry alone." },
  },
  uranus: {
    loud: { th: "คุณไม่ชอบเดินตามกรอบ คิดต่าง มองเห็นทางใหม่ก่อนคนอื่น และชีวิตคุณเปลี่ยนทิศกะทันหันบ่อยกว่าคนทั่วไป", en: "You resist fixed rules, think differently and see new ways before others do, and your life changes course suddenly more often than most." },
    shadow: { th: "เมื่อคุณแหกกรอบเพื่อหนีความผูกมัด คุณจะตัดความสัมพันธ์ดี ๆ ทิ้งเร็วเกินไป", en: "When you rebel just to dodge commitment, you cut off good relationships too soon." },
    key: { th: "กันเวลาครึ่งวันทุกสัปดาห์ไว้ทำตามใจโดยไม่มีแผน แล้วคุณจะไม่ต้องระเบิดออกมา", en: "Block half a day each week to do as you please, with no plan, so you never need to break out." },
  },
  neptune: {
    loud: { th: "คุณมีจินตนาการสูง รับรู้ความรู้สึกที่ไม่ได้พูดออกมาได้ไว และมีทั้งหัวศิลปะและใจเมตตา", en: "You have a rich imagination, sense what goes unspoken and carry both an artistic eye and a compassionate heart." },
    shadow: { th: "เมื่อคุณไม่ตั้งขอบเขตให้ชัด คุณจะมองคนดีกว่าที่เขาเป็นจริง", en: "When your boundaries are loose, you see people as better than they really are." },
    key: { th: "ก่อนตัดสินใจเรื่องใหญ่หรือไว้ใจใครเรื่องเงิน ตรวจข้อเท็จจริงจากสองแหล่งเสมอ", en: "Before a big decision, or trusting anyone with money, check the facts from two sources." },
  },
  pluto: {
    loud: { th: "คุณเป็นคนเข้มข้น มองทะลุผิวเผินไปถึงแก่นของเรื่อง และผ่านการเปลี่ยนแปลงครั้งใหญ่จนเหมือนเกิดใหม่มากกว่าหนึ่งครั้ง", en: "You are intense, see past the surface to the heart of things, and come through major changes as a new person more than once." },
    shadow: { th: "เมื่อคุณกลัวเสียการควบคุม คุณจะยึดเรื่องเก่าไว้แน่นจนใจหนักเกินแบก", en: "When you fear losing control, you grip the past so tightly that it weighs you down." },
    key: { th: "สัปดาห์นี้ยุติสิ่งหนึ่งที่หมดหน้าที่แล้ว พื้นที่ว่างนั้นคือที่ที่ของใหม่จะเกิด", en: "This week, end one thing that has served its purpose; that empty space is where the new grows." },
  },
};

export interface HouseDepth {
  /** หัวเรื่องสั้นของเรือน ใช้ในหัวข้อ ("ชีวิตคุณทุ่มพลังไปที่เรื่อง…") */
  topic: T;
  /** ทำไมเรื่องของเรือนนี้ดึงพลังคุณ (ความต้องการลึก) */
  why: T;
  shadow: T;
  key: T;
}

/** เรือน 1–12 (index 0 = เรือน 1) */
export const HOUSE_DEPTH: readonly HouseDepth[] = [
  {
    topic: { th: "ตัวตนและการเริ่มต้นสิ่งใหม่", en: "self and new beginnings" },
    why: { th: "งานหลักของชีวิตคุณคือสร้างตัวตนที่ชัดและยืนได้ด้วยตัวเอง คนจดจำคุณจากสิ่งที่คุณเป็น ไม่ใช่จากตำแหน่งที่คุณมี", en: "Your life's main task is to build a clear identity that stands on its own. People remember you for who you are, not for any title." },
    shadow: { th: "เมื่อคุณโฟกัสที่ตัวเองมากเกินไป คุณจะลืมฟังว่าคนรอบตัวต้องการอะไร", en: "When you focus too much on yourself, you stop hearing what the people around you need." },
    key: { th: "เริ่มสิ่งที่อยากทำภายในสัปดาห์นี้โดยไม่รอใครอนุญาต แล้วชวนคนหนึ่งคนมาร่วม", en: "Start what you want this week without waiting for permission, then invite one person along." },
  },
  {
    topic: { th: "เงินและคุณค่าในตัวเอง", en: "money and self-worth" },
    why: { th: "ความมั่นคงทางการเงินกับความรู้สึกว่าตัวเองมีค่าผูกกันแน่นในใจคุณ คุณอยากสร้างสิ่งที่เป็นของตัวเองด้วยฝีมือตัวเอง", en: "Financial security and self-worth are tightly linked for you. You want to build something truly your own, with your own hands." },
    shadow: { th: "เมื่อคุณวัดคุณค่าตัวเองจากเงิน ใจคุณจะไม่มั่นคงแม้มีมากแล้วก็ตาม", en: "When you measure your worth by money, you never feel secure, however much you have." },
    key: { th: "เขียนทักษะสามอย่างที่คนยอมจ่ายเงินให้คุณ แล้วตั้งราคาให้หนึ่งอย่างภายในสัปดาห์นี้", en: "List three skills people would pay you for, and put a price on one of them this week." },
  },
  {
    topic: { th: "การสื่อสารและการเรียนรู้", en: "communication and learning" },
    why: { th: "คุณเรียนรู้ผ่านการพูดคุย การอ่าน และการเชื่อมโยงข้อมูล ความคิดของคุณมีพลังที่สุดเมื่อได้ส่งต่อให้คนอื่น", en: "You learn by talking, reading and connecting ideas, and your thinking is strongest when you pass it on." },
    shadow: { th: "เมื่อคุณรับข้อมูลมากเกินไป ความคิดจะกระจายจนไม่ได้ลงลึกเรื่องใดเลย", en: "When you take in too much information, your mind scatters and nothing goes deep." },
    key: { th: "เลือกเรื่องที่อยากรู้จริงหนึ่งเรื่อง ศึกษาให้ลึก แล้วเขียนสรุปให้คนอื่นอ่าน", en: "Pick one subject you truly care about, study it deeply, then write it up for others." },
  },
  {
    topic: { th: "บ้านและครอบครัว", en: "home and family" },
    why: { th: "รากเหง้าและบ้านเป็นฐานที่ทุกอย่างในชีวิตคุณตั้งอยู่ เรื่องที่ค้างในครอบครัวส่งผลกับใจคุณลึกกว่าที่คุณคิด", en: "Your roots and home are the foundation everything else stands on. Unfinished family matters affect you more deeply than you realise." },
    shadow: { th: "เมื่อคุณติดอยู่กับความปลอดภัยแบบเดิม คุณจะไม่กล้าออกไปสร้างชีวิตในแบบของตัวเอง", en: "When you cling to familiar safety, you hold back from building a life of your own." },
    key: { th: "จัดมุมหนึ่งในบ้านให้เป็นที่พักใจของคุณจริง ๆ แล้วคุณจะออกไปสู้โลกได้เต็มที่", en: "Make one corner of your home a true place of rest, and you can face the world at full strength." },
  },
  {
    topic: { th: "ความรักและการสร้างสรรค์", en: "romance and creativity" },
    why: { th: "คุณต้องการพื้นที่ที่ได้แสดงออก สนุก และสร้างสรรค์โดยไม่ต้องมีเหตุผล หัวใจคุณเติบโตผ่านความรัก งานสร้างสรรค์ และความสุขเรียบง่ายแบบเด็ก", en: "You need space to express yourself, play and create for no reason at all. Your heart grows through love, creative work and simple, childlike joy." },
    shadow: { th: "เมื่อคุณรอคำชมมากเกินไป ความสุขของคุณจะไปผูกอยู่กับปฏิกิริยาของคนอื่น", en: "When you wait too much for applause, your joy gets tied to other people's reactions." },
    key: { th: "สัปดาห์นี้ทำสิ่งที่สนุกเพื่อตัวเองหนึ่งอย่าง โดยไม่ต้องเก่งและไม่ต้องมีใครเห็น", en: "This week, do one fun thing just for yourself, without needing to be good at it or seen." },
  },
  {
    topic: { th: "งานประจำวันและสุขภาพ", en: "daily work and health" },
    why: { th: "คุณรู้สึกมีคุณค่าเมื่อได้ทำงานให้ดีและเป็นประโยชน์กับคนอื่น ชีวิตประจำวันที่เป็นระเบียบคือสิ่งที่ทำให้ใจคุณนิ่ง", en: "You feel worthwhile when you do good, useful work. An orderly daily life is what keeps you steady." },
    shadow: { th: "เมื่อคุณทำงานหนักจนลืมพัก ร่างกายจะเตือนคุณก่อนใจ", en: "When you work without rest, your body warns you before your mind does." },
    key: { th: "ตั้งเวลาเข้านอนให้ตรงทุกคืน เหมือนที่คุณตั้งเวลาส่งงาน", en: "Keep a fixed bedtime every night, the way you keep work deadlines." },
  },
  {
    topic: { th: "คู่ครองและหุ้นส่วน", en: "partnership" },
    why: { th: "คุณเรียนรู้ตัวเองผ่านคนที่อยู่ตรงข้าม ทั้งคู่ชีวิต หุ้นส่วน และคนที่ร่วมงานใกล้ชิด ความสัมพันธ์คือกระจกที่ชัดที่สุดของคุณ", en: "You come to know yourself through the people opposite you: partners, business partners and close collaborators. Relationships are your clearest mirror." },
    shadow: { th: "เมื่อคุณพึ่งอีกฝ่ายมากเกินไป คุณจะรู้สึกว่าตัวเองไม่ครบเมื่ออยู่คนเดียว", en: "When you lean on a partner too much, you feel incomplete on your own." },
    key: { th: "บอกคนใกล้ชิดตรง ๆ หนึ่งเรื่องที่คุณต้องการ แล้วถามกลับว่าเขาต้องการอะไร", en: "Tell someone close to you one thing you need, plainly, then ask what they need." },
  },
  {
    topic: { th: "ความผูกพันลึกและการเปลี่ยนแปลง", en: "intimacy and transformation" },
    why: { th: "คุณไม่พอใจกับความสัมพันธ์แบบผิวเผิน อยากรู้ความจริงที่ลึกที่สุดของคนและของชีวิต และคุณเติบโตผ่านช่วงวิกฤตที่เปลี่ยนคุณไปทั้งคน", en: "Surface-level bonds do not satisfy you. You want the deepest truth about people and life, and you grow through crises that change you completely." },
    shadow: { th: "เมื่อคุณกลัวถูกทำร้าย คุณจะปิดใจไม่ให้ใครเข้าถึงเลย", en: "When you fear being hurt, you shut everyone out." },
    key: { th: "เลือกคนที่ไว้ใจได้หนึ่งคน แล้วเล่าเรื่องที่คุณไม่เคยเล่าให้เขาฟังหนึ่งเรื่อง", en: "Choose one person you trust and tell them one thing you have never shared." },
  },
  {
    topic: { th: "ความเชื่อและโลกกว้าง", en: "beliefs and the wider world" },
    why: { th: "คุณอยากเข้าใจว่าชีวิตมีความหมายอะไร จึงถูกดึงไปหาการเรียนและการเดินทาง โลกกว้างคือที่ที่คุณเติบโตที่สุด", en: "You want to understand what life means, so you are drawn to study and travel. The wider world is where you grow the most." },
    shadow: { th: "เมื่อคุณยึดความเชื่อตัวเองแน่นเกินไป คุณจะสอนคนอื่นมากกว่าฟัง", en: "When you hold your beliefs too tightly, you preach more than you listen." },
    key: { th: "สัปดาห์นี้ไปที่ที่ไม่เคยไปหนึ่งแห่ง แล้วจดสิ่งที่ได้เรียนรู้", en: "This week, go somewhere you have never been, and write down what you learn." },
  },
  {
    topic: { th: "งานและชื่อเสียง", en: "career and reputation" },
    why: { th: "คุณอยากสร้างสิ่งที่คนจดจำ และอยากรู้ว่าชีวิตตัวเองมีความหมายต่อโลก งานจึงไม่ใช่แค่ที่หาเงิน แต่เป็นที่ที่คุณใช้ทั้งตัวตน", en: "You want to build something people remember and to know your life matters to the world. Work is not just income for you; it is where you put your whole self." },
    shadow: { th: "เมื่อคุณผูกคุณค่าในตัวเองไว้กับตำแหน่ง วันที่งานสะดุด ใจคุณจะสะดุดตามทันที", en: "When your self-worth rests on your title, your heart stumbles the moment your career does." },
    key: { th: "เขียนงานที่ทำอยู่ทั้งหมด แล้วตัดออกหนึ่งอย่างที่คุณทำแค่เพื่อให้คนอื่นยอมรับ", en: "List everything on your plate, and drop one thing you do only to win approval." },
  },
  {
    topic: { th: "เพื่อนและความฝัน", en: "friends and future hopes" },
    why: { th: "คุณมีพลังที่สุดเมื่ออยู่กับกลุ่มคนที่เชื่อในสิ่งเดียวกัน และอยากมีส่วนสร้างอนาคตที่ดีกว่าให้คนหมู่มาก", en: "You are strongest among people who share your ideals, and you want a hand in building a better future for many." },
    shadow: { th: "เมื่อคุณทุ่มให้กลุ่มมากเกินไป คุณจะห่างจากคนใกล้ชิดโดยไม่รู้ตัว", en: "When you give too much to a group, you drift away from the people closest to you without noticing." },
    key: { th: "นัดเจอเพื่อนกลุ่มที่ทำให้คุณเติบโตภายในเดือนนี้ และเล่าความฝันระยะยาวให้พวกเขาฟัง", en: "Meet the friends who help you grow this month, and tell them your long-term hope." },
  },
  {
    topic: { th: "โลกภายในและเรื่องเบื้องหลัง", en: "your inner world" },
    why: { th: "พลังของคุณทำงานได้ดีที่สุดเบื้องหลังหรือในความเงียบ คุณรับรู้ความรู้สึกของคนและบรรยากาศได้มากกว่าที่แสดงออก และต้องมีเวลาอยู่กับตัวเอง", en: "Your energy works best behind the scenes or in quiet. You sense far more of people and atmospheres than you show, and you need time alone." },
    shadow: { th: "เมื่อคุณไม่ได้พักใจ คุณจะรับความรู้สึกของคนอื่นมาแบกจนเหนื่อยโดยไม่รู้ตัว", en: "Without quiet rest, you absorb other people's feelings until you are drained without knowing why." },
    key: { th: "อยู่คนเดียวเงียบ ๆ วันละ 15 นาที ปิดโทรศัพท์และไม่คุยกับใคร", en: "Spend 15 minutes alone in silence every day, phone off, talking to no one." },
  },
];

/** แกนผัง 4 จุด: ทำไมดาวที่ชิดจุดนี้จึงดัง + หัวข้อเมื่อมีหลายดวง */
export const ANGLE_DEPTH: Record<"asc" | "mc" | "dsc" | "ic", { why: T; many: T; arena: T }> = {
  asc: {
    why: { th: "ลัคนาคือหน้าต่างที่โลกมองเข้ามา ดาวที่อยู่ตรงนี้จึงเป็นสิ่งที่คนสัมผัสได้ทันที และหล่อหลอมวิธีที่คุณเริ่มต้นทุกอย่าง", en: "The Ascendant is the window the world looks through, so a planet here is felt immediately and shapes how you begin everything." },
    many: { th: "คนเห็นพลังของคุณชัดตั้งแต่แรกพบ", en: "People sense your energy the moment they meet you" },
    arena: { th: "ตัวตนที่คนเห็น", en: "the self people see" },
  },
  mc: {
    why: { th: "กลางฟ้าคือจุดสูงสุดของผัง ดาวที่อยู่ตรงนี้จึงเป็นสิ่งที่คนเห็นผ่านงานและบทบาทในสังคม และชี้ทางอาชีพของคุณ", en: "The Midheaven is the highest point of the chart, so a planet here is what people see in your work and public role, and it points to your career." },
    many: { th: "งานและภาพในสังคมคือเวทีหลักของชีวิตคุณ", en: "Work and public life are the main stage of your life" },
    arena: { th: "งานและภาพในสังคม", en: "work and public life" },
  },
  dsc: {
    why: { th: "จุดตกคือฝั่งของคนอื่น ดาวที่อยู่ตรงนี้แสดงออกผ่านคู่ครอง หุ้นส่วน และคนที่คุณดึงดูดเข้ามา คุณจะเห็นด้านนี้ในตัวอีกฝ่ายก่อนเห็นในตัวเอง", en: "The Descendant is the side of other people. A planet here shows through partners and the people you attract, and you see it in them before you see it in yourself." },
    many: { th: "ความสัมพันธ์คือเวทีหลักของชีวิตคุณ", en: "Relationships are the main stage of your life" },
    arena: { th: "คู่และคนใกล้ชิด", en: "partners and close bonds" },
  },
  ic: {
    why: { th: "ก้นฟ้าคือรากของผัง ดาวที่อยู่ตรงนี้ทำงานลึกอยู่ในบ้าน ครอบครัว และโลกส่วนตัว คนภายนอกมองไม่เห็น แต่มันคือแรงที่หล่อเลี้ยงทุกอย่าง", en: "The IC is the root of the chart. A planet here works deep inside your home, family and private world. Outsiders do not see it, but it feeds everything else." },
    many: { th: "บ้านและโลกส่วนตัวคือฐานพลังของคุณ", en: "Home and your private world are your power base" },
    arena: { th: "บ้านและโลกส่วนตัว", en: "home and private life" },
  },
};

export const ELEMENT_DEPTH: Record<Element, { head: T; strong: T; key: T; missHead: T; miss: T; missKey: T; gift: T }> = {
  fire: {
    head: { th: "คุณขับเคลื่อนด้วยไฟในใจ", en: "You run on inner fire" },
    strong: { th: "คุณมีพลัง กล้าเริ่ม และเป็นคนจุดประกายให้คนรอบตัว ความกระตือรือร้นคือเชื้อเพลิงของคุณ แต่เมื่อเร่งตลอดเวลา คุณจะหมดไฟก่อนงานเสร็จ", en: "You are energetic, bold and the one who sparks others into action. Enthusiasm is your fuel, but when you push nonstop, you burn out before the work is done." },
    key: { th: "เลือกเรื่องสำคัญที่สุดเรื่องเดียวของสัปดาห์นี้ แล้วทุ่มไฟให้จนเสร็จ", en: "Pick the single most important task this week and pour your fire into it until it is done." },
    missHead: { th: "แรงบันดาลใจคือสิ่งที่คุณต้องตั้งใจจุด", en: "Inspiration is something you have to kindle on purpose" },
    miss: { th: "ไม่มีดาวในธาตุไฟเลย คุณไม่ใช่คนที่ลุกขึ้นมาเริ่มเองได้ทันที คุณต้องได้แรงบันดาลใจจากภายนอกก่อน", en: "With no planets in fire, you do not leap into action on your own; you need a spark from outside first." },
    missKey: { th: "ตั้งเป้าเล็กหนึ่งข้อที่ทำเสร็จได้ภายในวันนี้ ความสำเร็จเล็ก ๆ จะจุดไฟให้คุณ", en: "Set one small goal you can finish today; a small win lights your fire." },
    gift: { th: "ความกล้าและแรงบันดาลใจ", en: "courage and inspiration" },
  },
  earth: {
    head: { th: "คุณเชื่อในสิ่งที่จับต้องได้", en: "You trust what is tangible" },
    strong: { th: "คุณมองโลกตามความเป็นจริง เชื่อในสิ่งที่เห็นผลได้ และค่อย ๆ สร้างความมั่นคงทีละขั้น คนรอบตัวพึ่งพาคุณได้เพราะคุณทำอย่างที่พูด แต่เมื่อคุณยึดสิ่งที่คุ้นเคยมากเกินไป คุณจะพลาดโอกาสที่ยังไม่เห็นผลทันที", en: "You see the world as it is, trust what produces results and build security step by step. People rely on you because you do what you say, but when you cling to the familiar, you miss chances whose payoff is not yet visible." },
    key: { th: "ให้เวลาความคิดใหม่หนึ่งเรื่องครบสี่สัปดาห์ก่อนตัดสิน", en: "Give one new idea four full weeks before you judge it." },
    missHead: { th: "การทำความคิดให้เป็นรูปธรรมคือสิ่งที่ต้องฝึก", en: "Turning ideas into reality takes practice" },
    miss: { th: "ไม่มีดาวในธาตุดินเลย คุณมีความคิดดีมากมาย แต่การทำให้เป็นรูปธรรมคือเรื่องที่คุณต้องใช้ความตั้งใจมากกว่าคนอื่น", en: "With no planets in earth, you have plenty of good ideas, but making them real takes you more deliberate effort than most." },
    missKey: { th: "เขียนรายการสิ่งที่ต้องทำพรุ่งนี้ทุกคืนก่อนนอน ความคิดจะลงดินทีละข้อ", en: "Write tomorrow's to-do list every night to bring your ideas down to earth." },
    gift: { th: "การสร้างสิ่งที่จับต้องได้", en: "building tangible things" },
  },
  air: {
    head: { th: "คุณใช้ความคิดนำทาง", en: "You are led by ideas" },
    strong: { th: "คุณคิดเร็ว สื่อสารเก่ง และมองเห็นความเชื่อมโยงที่คนอื่นมองข้าม คุณเข้าใจโลกผ่านการพูดคุยและการแลกเปลี่ยน แต่เมื่อคุณคิดมากเกินไป คุณจะวิเคราะห์จนไม่ได้ลงมือ", en: "You think quickly, communicate well and see connections others miss. You understand the world through conversation, but when you overthink, you analyse until you never act." },
    key: { th: "ทุกความคิดที่ดี ให้ตั้งขั้นแรกที่ทำได้ภายในสัปดาห์นี้", en: "For every good idea, set a first step you can take this week." },
    missHead: { th: "การถอยออกมามองภาพรวมคือสิ่งที่ต้องฝึก", en: "Stepping back to see the whole picture takes practice" },
    miss: { th: "ไม่มีดาวในธาตุลมเลย คุณรู้สึกและลงมือก่อนแล้วค่อยหาคำอธิบาย และไม่ถนัดถอยออกมามองเรื่องของตัวเองแบบคนนอก", en: "With no planets in air, you feel and act first and find the words later, and stepping back to see your own situation objectively does not come easily." },
    missKey: { th: "ก่อนตัดสินใจเรื่องใหญ่ เล่าเรื่องนั้นให้คนที่ไว้ใจฟังหนึ่งคนเสมอ", en: "Before any big decision, talk it through with one person you trust." },
    gift: { th: "ความคิดและการสื่อสาร", en: "ideas and communication" },
  },
  water: {
    head: { th: "คุณใช้ความรู้สึกนำทาง", en: "You are led by feeling" },
    strong: { th: "คุณอ่อนไหว เข้าใจคน และมีสัญชาตญาณสูง คุณรู้ว่าอะไรผิดปกติก่อนที่ใครจะพูด และผูกพันกับคนอย่างลึกซึ้ง แต่เมื่อไม่มีขอบเขต คุณจะรับอารมณ์ของคนอื่นมาเป็นของตัวเองจนเหนื่อย", en: "You are sensitive, empathic and intuitive. You sense something is wrong before anyone says it, and you bond deeply, but without boundaries you absorb other people's moods until you are drained." },
    key: { th: "ทุกครั้งที่ใจหนัก ถามตัวเองว่าความรู้สึกนี้เป็นของคุณ หรือรับมาจากคนอื่น", en: "Whenever you feel heavy, ask whether the feeling is yours or picked up from someone else." },
    missHead: { th: "การเปิดใจเรื่องความรู้สึกคือสิ่งที่ต้องฝึก", en: "Opening up about feelings takes practice" },
    miss: { th: "ไม่มีดาวในธาตุน้ำเลย คุณไม่ถนัดพูดเรื่องความรู้สึก และหยิบเหตุผลมาใช้ในเรื่องที่อีกฝ่ายต้องการแค่ความเข้าใจ", en: "With no planets in water, talking about feelings does not come naturally, and you reach for logic when the other person needs understanding." },
    missKey: { th: "ครั้งหน้าที่คนใกล้ตัวเล่าปัญหา ถามว่าเขารู้สึกอย่างไรก่อนเสนอทางแก้", en: "Next time someone close shares a problem, ask how they feel before offering solutions." },
    gift: { th: "ความเข้าใจคนและสัญชาตญาณ", en: "empathy and intuition" },
  },
};

/** ศักดิ์ดาว: หัวข้อแบบภาษาคน (ต่อท้ายคำของดาว) + คำอธิบายศัพท์ + ใช้ให้ดี */
export const DIGNITY_DEPTH: Record<Dignity, { head: T; term: T; flow: T; key: T }> = {
  domicile: {
    head: { th: "อยู่ในที่ที่ถนัดที่สุด", en: "is right at home" },
    term: { th: "ราศีบ้านของดาว", en: "the planet's home sign" },
    flow: { th: "ดาวนี้ครองราศีนี้เอง พลังจึงไหลเป็นธรรมชาติ และเป็นทรัพยากรที่คุณพึ่งได้เสมอ", en: "This planet rules the sign, so its energy flows naturally and is a resource you can always rely on." },
    key: { th: "เมื่อเรื่องอื่นสั่นคลอน ให้ใช้ด้านนี้เป็นหลักยึด", en: "When other parts of life shake, lean on this side of you first." },
  },
  exaltation: {
    head: { th: "โดดเด่นเป็นพิเศษ", en: "shines especially bright" },
    term: { th: "ราศีที่ดาวมีกำลังสูง", en: "the sign where the planet is strongest" },
    flow: { th: "ราศีนี้ยกพลังของดาวนี้ให้สูงขึ้น ด้านนี้จึงโดดเด่นจนคนอื่นสังเกตเห็นและชื่นชม", en: "This sign lifts the planet's power, so this side of you stands out and draws admiration." },
    key: { th: "ใช้ด้านนี้ขอโอกาสที่คุณอยากได้หนึ่งอย่างภายในสัปดาห์นี้", en: "Use this gift to ask for one opportunity you want, this week." },
  },
  detriment: {
    head: { th: "ต้องใช้ในแบบที่ไม่คุ้นเคย", en: "works in an unfamiliar way" },
    term: { th: "ราศีตรงข้ามบ้านของดาว", en: "opposite the planet's home" },
    flow: { th: "คุณจึงใช้ด้านนี้ต่างจากคนส่วนใหญ่ และรู้สึกไม่ลงตัวเมื่อทำตามแบบคนอื่น แต่เรื่องที่ต้องปรับตัวมากที่สุดคือเรื่องที่สอนคุณได้มากที่สุด", en: "So you use this side of you differently from most people, and it feels off when you copy others, but what demands the most adjustment teaches you the most." },
    key: { th: "เลิกเลียนแบบวิธีของคนอื่นในเรื่องนี้ แล้วจดว่าวิธีไหนได้ผลกับตัวคุณจริง", en: "Stop copying other people's methods here, and note which approach actually works for you." },
  },
  fall: {
    head: { th: "คือเรื่องที่ต้องฝึกมากกว่าคนอื่น", en: "takes more practice than most" },
    term: { th: "ราศีที่ดาวอ่อนกำลัง", en: "the sign where the planet is weakest" },
    flow: { th: "คุณจึงต้องพยายามมากกว่าคนอื่นกว่าจะใช้ด้านนี้ได้คล่อง และสิ่งที่คุณฝึกจนเป็นจะกลายเป็นจุดแข็งที่ลึกกว่าของที่ได้มาง่าย", en: "So you need more effort than others to use this side of you well, and what you master through practice becomes a deeper strength than what comes easily." },
    key: { th: "ฝึกด้านนี้วันละ 10 นาที และเลิกเทียบตัวเองกับคนที่ทำได้ง่ายกว่า", en: "Practise this for 10 minutes a day, and stop comparing yourself with people who find it easy." },
  },
};

export interface PlanetSignText {
  /** หัวข้อสั้นในแถวดาวที่ยังไม่เปิด (ไม่เกินราว 40 ตัวอักษร) */
  head: T;
  /** ดาวนี้ในราศีนี้แสดงออกอย่างไร (1–2 ประโยค) */
  core: T;
  /** ด้านเงาและทางเติบโต (1 ประโยค) */
  edge: T;
}

/** ดาวส่วนตัวและดาวสังคมในราศีทั้ง 12 (เรียง เมษ ➔ มีน) — ดวงอาทิตย์/จันทร์/ลัคนามีชุดของตัวเองอยู่แล้ว */
export const PLANET_SIGN_TEXT: Record<"mercury" | "venus" | "mars" | "jupiter" | "saturn", readonly PlanetSignText[]> = {
  mercury: [
    {
      head: { th: "คิดเร็ว พูดตรง ตัดสินใจไว", en: "Quick thinking, direct speech, fast decisions" },
      core: { th: "คุณคิดเร็ว พูดตรง และตัดสินใจไว ชอบถกเพื่อหาคำตอบมากกว่าเพื่อเอาชนะ และเป็นคนแรกที่กล้าพูดสิ่งที่คนอื่นคิดอยู่ในใจ", en: "You think fast, speak directly and decide quickly. You debate to find answers rather than to win, and you are the first to say what others are only thinking." },
      edge: { th: "เมื่อคุณใจร้อน คำพูดจะแรงกว่าที่ตั้งใจ นับหนึ่งถึงสามก่อนตอบเรื่องสำคัญทุกครั้ง", en: "When you are impatient, your words land harder than you meant. Count to three before answering anything important." },
    },
    {
      head: { th: "คิดช้าแต่ลึก พูดน้อยแต่หนักแน่น", en: "Slow, deep thinking; few but weighty words" },
      core: { th: "คุณคิดช้าแต่ลึกและแม่น เชื่อในสิ่งที่พิสูจน์ได้ เมื่อเข้าใจอะไรแล้วจะจำได้นาน และพูดน้อยแต่มีน้ำหนัก", en: "You think slowly but deeply and accurately. You trust what can be proven, remember what you learn for a long time, and speak little but with weight." },
      edge: { th: "เมื่อคุณยึดความคิดเดิมแน่นเกินไป คุณจะปิดรับข้อมูลใหม่ที่ช่วยคุณได้", en: "When you cling to your views, you shut out new information that would help you." },
    },
    {
      head: { th: "สมองไว อยากรู้ไปหมด คุยได้กับทุกคน", en: "A quick, curious mind that talks with anyone" },
      core: { th: "สมองคุณไวและอยากรู้ไปหมด เชื่อมเรื่องที่ดูไม่เกี่ยวกันได้เก่ง คุยได้กับทุกคน และเรียนรู้เร็วที่สุดเมื่อได้แลกเปลี่ยน", en: "Your mind is quick and curious about everything. You connect unrelated ideas, can talk with anyone and learn fastest through conversation." },
      edge: { th: "เมื่อคุณสนใจหลายเรื่องพร้อมกัน คุณจะรู้กว้างแต่ไม่ลึก เลือกสองเรื่องที่จะลงลึกจริง", en: "When you chase many interests at once, you end up broad but shallow. Choose two subjects to go deep in." },
    },
    {
      head: { th: "คิดด้วยใจ จำทุกอย่างผ่านความรู้สึก", en: "Thinks with the heart, remembers through feelings" },
      core: { th: "คุณคิดด้วยใจ จำเรื่องราวผ่านความรู้สึก และอ่านอารมณ์ที่ซ่อนอยู่หลังคำพูดได้แม่น คำพูดของคุณอบอุ่นและทำให้คนรู้สึกปลอดภัย", en: "You think with your heart, remember things through feelings and read the emotion behind words accurately. Your words are warm and make people feel safe." },
      edge: { th: "เมื่อคุณเก็บคำพูดของคนอื่นมาคิดเป็นเรื่องส่วนตัว ใจจะเหนื่อย เขียนแยกว่าเขาพูดอะไรจริง และคุณรู้สึกอย่างไร", en: "Taking every comment personally wears you out. Write down what was actually said, apart from how you felt." },
    },
    {
      head: { th: "พูดอย่างมั่นใจ เล่าเรื่องเก่ง", en: "Speaks with confidence, a natural storyteller" },
      core: { th: "คุณพูดอย่างมั่นใจ มีสีสัน และเล่าเรื่องเก่ง ความคิดของคุณมีพลังที่สุดเมื่อได้แสดงต่อหน้าคน และคุณอยากให้ความคิดของตัวเองได้รับการยอมรับ", en: "You speak with confidence and colour and tell stories well. Your ideas come alive in front of people, and you want them to be recognised." },
      edge: { th: "เมื่อคุณผูกความคิดไว้กับศักดิ์ศรี คุณจะฟังคำแย้งไม่เข้าหู การเปลี่ยนใจคือความกล้าอีกแบบ", en: "When your ideas become a matter of pride, you cannot hear criticism. Changing your mind is its own kind of courage." },
    },
    {
      head: { th: "คิดเป็นระบบ ละเอียด เห็นจุดที่คนอื่นพลาด", en: "Systematic and precise, spots what others miss" },
      core: { th: "คุณคิดเป็นระบบ ละเอียด และเห็นจุดที่คนอื่นมองข้าม ถนัดแยกแยะ วิเคราะห์ และทำเรื่องยุ่งยากให้ใช้งานได้จริง", en: "You think systematically, notice what others miss, and are skilled at sorting, analysing and making complicated things workable." },
      edge: { th: "เมื่อคุณจับผิดตัวเองมากเกินไป คุณจะกังวลไม่จบ ตั้งเกณฑ์ดีพอแล้วหยุดตรงนั้น", en: "Finding fault with yourself keeps the worry going. Decide what good enough looks like, then stop there." },
    },
    {
      head: { th: "มองทุกด้าน พูดนุ่มนวล เจรจาเก่ง", en: "Sees every side, speaks gracefully, negotiates well" },
      core: { th: "คุณคิดแบบมองทุกด้าน ฟังเหตุผลของทุกฝ่าย และพูดอย่างนุ่มนวลจนคนยอมรับได้ง่าย เป็นคนไกล่เกลี่ยและเจรจาโดยธรรมชาติ", en: "You see every side, listen to everyone's reasons and speak so gracefully that people accept your view easily. You are a natural mediator and negotiator." },
      edge: { th: "เมื่อชั่งน้ำหนักนานเกินไป คุณจะตัดสินใจไม่ได้ ตั้งเส้นตายทุกครั้ง", en: "When you weigh things too long, you cannot decide. Set a deadline for every decision." },
    },
    {
      head: { th: "คิดลึก มองทะลุสิ่งที่คนซ่อนไว้", en: "A deep thinker who sees what people hide" },
      core: { th: "คุณคิดลึกและมองทะลุสิ่งที่คนพูดไปถึงสิ่งที่เขาซ่อน ชอบค้นหาความจริง และเก็บความลับได้ดีเยี่ยม", en: "You think deeply and see past what people say to what they hide. You love uncovering the truth and keep secrets extremely well." },
      edge: { th: "เมื่อคุณระแวงจนไม่เชื่อใคร คุณจะเหนื่อยกับการอ่านใจคนตลอดเวลา ถามตรง ๆ ง่ายกว่า", en: "When suspicion stops you trusting anyone, reading minds all day wears you out. Asking directly is easier." },
    },
    {
      head: { th: "คิดภาพใหญ่ พูดตรงแบบมีอารมณ์ขัน", en: "Big-picture thinker, frank and funny" },
      core: { th: "คุณคิดภาพใหญ่ สนใจความหมายและปรัชญามากกว่ารายละเอียด พูดตรงไปตรงมาแบบมีอารมณ์ขัน และสอนคนได้เก่ง", en: "You think in big pictures and care more about meaning than detail. You speak frankly with humour and make a good teacher." },
      edge: { th: "เมื่อคุณมองแต่ภาพใหญ่ คุณจะพลาดรายละเอียดสำคัญ ตรวจข้อเท็จจริงก่อนสรุปทุกครั้ง", en: "When you see only the big picture, you miss key details. Check the facts before every conclusion." },
    },
    {
      head: { th: "คิดอย่างมีแผน ใช้เหตุผล มองระยะยาว", en: "Planned, logical, long-term thinking" },
      core: { th: "คุณคิดอย่างมีแผน ใช้เหตุผล และมองผลระยะยาว พูดน้อยแต่ชัด และเชื่อในความรู้ที่ใช้ได้จริงมากกว่าทฤษฎี", en: "You think in plans, use logic and look at long-term consequences. You speak little but clearly and value practical knowledge over theory." },
      edge: { th: "เมื่อคุณมองทุกอย่างจริงจังเกินไป คุณจะเครียดล่วงหน้ากับเรื่องที่ยังไม่เกิด", en: "When you take everything too seriously, you stress over things that have not happened yet." },
    },
    {
      head: { th: "คิดล้ำ เป็นอิสระ เห็นทางใหม่ก่อนใคร", en: "Original and independent, sees new ways first" },
      core: { th: "คุณคิดล้ำ เป็นอิสระ และมองเห็นวิธีใหม่ที่คนอื่นยังนึกไม่ถึง ชอบแลกเปลี่ยนความคิดกับคนหลากหลาย และใช้เหตุผลนำอารมณ์", en: "You think ahead, independently, and see new methods before others imagine them. You enjoy swapping ideas with all kinds of people and lead with reason over emotion." },
      edge: { th: "เมื่อคุณมั่นใจในความคิดตัวเองเกินไป คุณจะดื้อเงียบ ฟังคนที่เห็นต่างให้จบก่อนตอบ", en: "When you are too sure of your ideas, you turn quietly stubborn. Hear people who disagree all the way through before replying." },
    },
    {
      head: { th: "คิดเป็นภาพ จินตนาการสูง เข้าใจสิ่งที่ไม่ได้พูด", en: "Thinks in images, imaginative, hears the unsaid" },
      core: { th: "คุณคิดเป็นภาพและความรู้สึก มีจินตนาการสูง เข้าใจสิ่งที่ไม่ได้พูดออกมา และสื่อสารผ่านเรื่องเล่าและภาพได้ดีกว่าคำอธิบายตรง ๆ", en: "You think in images and feelings, with a vivid imagination. You understand what goes unsaid and communicate better through story and image than plain explanation." },
      edge: { th: "เมื่อความคิดลอย รายละเอียดและกำหนดส่งจะหลุดมือ จดเรื่องสำคัญลงโทรศัพท์ทันทีที่ได้ยิน", en: "When your mind drifts, details and deadlines slip away. Note key things in your phone at once." },
    },
  ],
  venus: [
    {
      head: { th: "รักตรงไปตรงมาและร้อนแรง", en: "Loves directly and passionately" },
      core: { th: "คุณรักแบบตรงไปตรงมาและร้อนแรง ถ้าชอบใครจะแสดงออกก่อน ชอบความตื่นเต้นของการไล่ตาม และต้องการคู่ที่มีชีวิตชีวาพอกับคุณ", en: "You love directly and passionately. If you like someone, you make the first move. You enjoy the thrill of the chase and need a partner as lively as you." },
      edge: { th: "ความรักที่เริ่มเร็วของคุณหมดไฟเร็วด้วย เมื่อความตื่นเต้นแรกผ่านไป ให้หากิจกรรมใหม่ทำด้วยกันแทนการมองหาคนใหม่", en: "Your fast-starting love burns out fast too. When the first thrill fades, find something new to do together instead of someone new." },
    },
    {
      head: { th: "รักมั่นคง แสดงออกผ่านการดูแลและสัมผัส", en: "Loves steadily, through care and touch" },
      core: { th: "คุณรักอย่างมั่นคง ซื่อสัตย์ และแสดงความรักผ่านการดูแล อาหาร สัมผัส และของที่จับต้องได้ คุณให้คุณค่ากับความสบายและความสวยงามที่ยั่งยืน", en: "You love steadily and loyally, showing it through care, food, touch and tangible gifts. You value lasting comfort and beauty." },
      edge: { th: "เมื่อคุณกลัวการเปลี่ยนแปลง คุณจะยึดความสัมพันธ์ไว้นานเกินกว่าที่ดีต่อตัวเอง", en: "When you fear change, you hold on to a relationship longer than is good for you." },
    },
    {
      head: { th: "ตกหลุมรักทางความคิดก่อน รักแบบขี้เล่น", en: "Falls for the mind first, loves playfully" },
      core: { th: "คุณตกหลุมรักทางความคิดก่อน คนที่คุยสนุก ทำให้หัวเราะ และมีเรื่องใหม่มาคุยเสมอจะชนะใจคุณ ความรักของคุณเบาสบาย ขี้เล่น และต้องการพื้นที่หายใจ", en: "You fall in love through the mind first. Someone who is fun to talk to, makes you laugh and always has something new to say wins your heart. Your love is light, playful and needs room to breathe." },
      edge: { th: "เมื่อความสัมพันธ์เริ่มลึก คุณจะถอยออกมาเพราะกลัวความจำเจ บอกอีกฝ่ายตรง ๆ ว่าคุณต้องการเรื่องใหม่ทำด้วยกัน", en: "When things deepen, you pull back for fear of boredom. Tell your partner you need new things to do together." },
    },
    {
      head: { th: "รักแบบดูแลและปกป้อง อยากมีบ้านร่วมกัน", en: "Loves by caring and protecting" },
      core: { th: "คุณรักแบบดูแลและปกป้อง อยากสร้างบ้านและความรู้สึกปลอดภัยร่วมกัน และจำรายละเอียดเล็ก ๆ ของคนที่รักได้เสมอ", en: "You love by caring and protecting. You want to build a home and a feeling of safety together, and you always remember the little things about the people you love." },
      edge: { th: "เมื่อคุณกลัวถูกทิ้ง คุณจะเก็บความน้อยใจไว้แทนการพูดตรง ๆ บอกสิ่งที่ต้องการออกมาเป็นคำพูด อีกฝ่ายจึงตอบสนองได้", en: "When you fear being left, you sulk instead of speaking up. Put what you need into words so your partner can meet it." },
    },
    {
      head: { th: "รักเต็มหัวใจ ใจกว้าง อยากให้ความรักพิเศษ", en: "Loves wholeheartedly and generously" },
      core: { th: "คุณรักอย่างเต็มหัวใจ ใจกว้าง และอยากให้ความรักเป็นเรื่องพิเศษ ชอบทำให้คนรักรู้สึกเป็นคนสำคัญที่สุด และอยากได้รับการชื่นชมแบบเดียวกัน", en: "You love wholeheartedly and generously, and want love to feel special. You make your partner feel like the most important person, and want to be admired the same way." },
      edge: { th: "เมื่ออีกฝ่ายแสดงออกน้อยกว่าคุณ คุณจะรู้สึกว่าไม่มีค่า ถามเขาตรง ๆ ว่าเขาแสดงความรักด้วยวิธีไหน", en: "When your partner shows less than you do, you feel unvalued. Ask them directly how they show love." },
    },
    {
      head: { th: "แสดงความรักผ่านการกระทำและการใส่ใจ", en: "Shows love through acts of care" },
      core: { th: "คุณแสดงความรักผ่านการกระทำ ช่วยเหลือ ใส่ใจรายละเอียด และทำให้ชีวิตของคนที่รักง่ายขึ้น ความรักของคุณเงียบแต่จริงใจและพึ่งพาได้", en: "You show love through action: helping, noticing details and making life easier for the people you love. Your love is quiet but sincere and dependable." },
      edge: { th: "เมื่อคุณตั้งมาตรฐานสูงเกินไป คุณจะติจนอีกฝ่ายรู้สึกว่าไม่ดีพอ ชมเขาหนึ่งเรื่องทุกวัน", en: "When your standards run too high, you criticise until your partner feels not good enough. Praise them for one thing every day." },
    },
    {
      head: { th: "รักความสมดุลและความสัมพันธ์ที่เท่าเทียม", en: "Loves balance and true partnership" },
      core: { th: "คุณรักความสวยงาม ความสมดุล และความสัมพันธ์ที่เป็นหุ้นส่วนกันจริง มีเสน่ห์ เข้าสังคมเก่ง และใส่ใจความรู้สึกของอีกฝ่ายเป็นพิเศษ", en: "You love beauty, balance and true partnership. You are charming, sociable and especially attentive to your partner's feelings." },
      edge: { th: "เมื่อคุณเลี่ยงความขัดแย้งทุกครั้ง ความต้องการของคุณจะค่อย ๆ หายไป ความสัมพันธ์ที่ดีทนการพูดตรงได้", en: "When you avoid every conflict, your own needs slowly disappear. A good relationship can handle honesty." },
    },
    {
      head: { th: "รักลึก เข้มข้น และทุ่มทั้งหัวใจ", en: "Loves deeply, intensely, all in" },
      core: { th: "คุณรักลึก เข้มข้น และทุ่มทั้งหัวใจ ไม่สนความสัมพันธ์ผิวเผิน ต้องการความไว้ใจและความจริงใจเต็มร้อย และเมื่อรักแล้วซื่อสัตย์มาก", en: "You love deeply, intensely and with your whole heart. Shallow relationships do not interest you; you need total trust and honesty, and once committed you are deeply loyal." },
      edge: { th: "เมื่อคุณกลัวถูกหักหลัง คุณจะหึงหวงจนอีกฝ่ายอึดอัด", en: "When you fear betrayal, you turn jealous until your partner feels smothered." },
    },
    {
      head: { th: "รักอิสระ อยากเติบโตและผจญภัยไปด้วยกัน", en: "Loves freedom and shared adventure" },
      core: { th: "คุณรักอิสระและการผจญภัย ความรักที่ดีสำหรับคุณคือการได้เติบโต เดินทาง และเรียนรู้โลกไปด้วยกัน คุณรักแบบเปิดเผย ร่าเริง และจริงใจ", en: "You love freedom and adventure. Good love, for you, means growing, travelling and learning about the world together. You love openly, cheerfully and honestly." },
      edge: { th: "เมื่อรู้สึกว่าถูกผูกมัด คุณจะถอยออกมาก่อน เลือกคนที่ให้ทั้งความมั่นคงและพื้นที่ไปพร้อมกัน", en: "When you feel tied down, you back away first. Choose someone who offers both stability and room to roam." },
    },
    {
      head: { th: "รักจริงจัง มองระยะยาว แสดงด้วยความรับผิดชอบ", en: "Loves seriously and for the long term" },
      core: { th: "คุณรักอย่างจริงจังและมองระยะยาว แสดงความรักผ่านความรับผิดชอบและการสร้างอนาคตร่วมกันมากกว่าคำหวาน และให้คุณค่ากับความมั่นคงที่พิสูจน์ได้ด้วยเวลา", en: "You love seriously and for the long term. You show love through commitment and building a future together more than sweet words, and you value stability that is proven over time." },
      edge: { th: "เมื่อคุณระวังตัวมากเกินไป คนรักจะไม่รู้ว่าคุณรู้สึกอย่างไร บอกรักเป็นคำพูดสัปดาห์ละครั้ง", en: "When you stay too guarded, your partner cannot tell how you feel. Say you love them out loud once a week." },
    },
    {
      head: { th: "รักแบบเพื่อนที่เข้าใจกัน ต้องการพื้นที่ส่วนตัว", en: "Loves like a best friend, needs space" },
      core: { th: "คุณรักแบบเพื่อนที่เข้าใจกัน ต้องการคู่ที่เคารพความเป็นตัวของตัวเอง คุยกันได้ทุกเรื่อง และไม่พยายามเปลี่ยนคุณ ความรักของคุณไม่เหมือนใครและไม่ชอบกรอบ", en: "You love like a best friend. You need a partner who respects your individuality, can talk about anything and does not try to change you. Your way of loving is unconventional and dislikes rules." },
      edge: { th: "เมื่อคุณรักษาระยะห่างทางใจมากเกินไป อีกฝ่ายจะรู้สึกว่าเข้าไม่ถึง ความใกล้ชิดไม่ได้แปลว่าต้องเสียอิสระ", en: "When you keep too much emotional distance, your partner feels shut out. Closeness does not cost you your freedom." },
    },
    {
      head: { th: "รักโรแมนติก อ่อนโยน และพร้อมเสียสละ", en: "Loves romantically, tenderly, selflessly" },
      core: { th: "คุณรักแบบโรแมนติก อ่อนโยน และพร้อมเสียสละ มองเห็นด้านดีในตัวคนที่รักเสมอ และรักได้โดยไม่มีเงื่อนไข", en: "You love romantically, tenderly and selflessly. You always see the best in the people you love and love without conditions." },
      edge: { th: "เมื่อคุณมองคนรักดีกว่าความจริง คุณจะให้มากเกินไปจนลืมดูแลตัวเอง ความรักที่ดีต้องมีขอบเขตด้วย", en: "When you see a partner as better than they are, you give too much and forget yourself. Healthy love needs boundaries too." },
    },
  ],
  mars: [
    {
      head: { th: "ลงมือเร็ว กล้าเริ่มก่อนใคร", en: "Acts fast, dares to go first" },
      core: { th: "คุณมีพลังมาก ตัดสินใจเร็ว และชอบเป็นคนเริ่ม เจออุปสรรคแล้วยิ่งฮึด เหมาะกับงานที่ต้องใช้ความกล้าและความเร็ว", en: "You have abundant energy, decide fast and love to be the one who starts. Obstacles fire you up, and you suit work that needs courage and speed." },
      edge: { th: "ไฟที่แรงของคุณมอดเร็ว เมื่อความตื่นเต้นแรกผ่านไป ให้ตั้งเส้นชัยที่ชัดแล้วทำให้ถึง", en: "Your strong flame burns out fast. When the first rush fades, set a clear finish line and reach it." },
    },
    {
      head: { th: "ลงมือช้าแต่หนักแน่น ไม่ยอมแพ้", en: "Slow to start, hard to stop" },
      core: { th: "คุณลงมือช้าแต่หนักแน่นและไม่ยอมแพ้ เมื่อตั้งใจแล้วจะทำไปเรื่อย ๆ จนสำเร็จ และอดทนได้มากกว่าคนส่วนใหญ่", en: "You start slowly but firmly and do not give up. Once decided, you keep going until it is done, with more stamina than most." },
      edge: { th: "เมื่อถูกบังคับให้เร่ง คุณจะยิ่งดื้อ และเมื่อโกรธจริงจะหายช้า", en: "Being pushed to hurry makes you dig in, and when you finally get angry, it lasts." },
    },
    {
      head: { th: "ลงมือด้วยไหวพริบและคำพูด", en: "Acts through wit and words" },
      core: { th: "คุณลงมือด้วยความคิดและคำพูด ทำหลายอย่างพร้อมกันได้ ไหวพริบดี และใช้การเจรจาแก้ปัญหาแทนการปะทะ", en: "You act through ideas and words, handle many things at once, think on your feet and solve problems by talking rather than fighting." },
      edge: { th: "เมื่อกระจายพลังไปหลายเรื่อง คุณจะเริ่มเยอะแต่จบน้อย ทำเรื่องสำคัญให้เสร็จก่อนเริ่มเรื่องใหม่", en: "When you spread your energy thin, you start a lot and finish little. Finish the most important thing before starting another." },
    },
    {
      head: { th: "สู้สุดตัวเพื่อปกป้องคนที่รัก", en: "Fights hardest for the people you love" },
      core: { th: "คุณลงมือเพราะใจ และสู้สุดตัวเมื่อต้องปกป้องคนที่รักหรือบ้าน แรงขับของคุณขึ้นลงตามอารมณ์และความรู้สึกปลอดภัย", en: "You act from the heart and fight hardest to protect the people you love or your home. Your drive rises and falls with your mood and sense of safety." },
      edge: { th: "เมื่อคุณเก็บความโกรธไว้ มันจะออกมาเป็นการเงียบใส่ บอกตรง ๆ ว่าอะไรทำให้ไม่พอใจ", en: "Bottled-up anger comes out as cold silence. Say plainly what upset you." },
    },
    {
      head: { th: "ลงมืออย่างมั่นใจแบบผู้นำ", en: "Acts with a leader's confidence" },
      core: { th: "คุณลงมืออย่างมั่นใจ มีพลังแบบผู้นำ และทำงานได้ดีที่สุดเมื่อได้แสดงฝีมือและได้รับการยอมรับ ความกล้าและความใจกว้างทำให้คนอยากตาม", en: "You act with confidence and a leader's energy, and work best when you can show your skill and be recognised. Your courage and generosity make people want to follow." },
      edge: { th: "เมื่อศักดิ์ศรีถูกแตะ คุณจะสู้เพื่อชนะมากกว่าสู้เพื่อสิ่งที่ถูก", en: "When your pride is hurt, you fight to win rather than for what is right." },
    },
    {
      head: { th: "ลงมืออย่างแม่นยำและมีแผน", en: "Acts precisely, with a plan" },
      core: { th: "คุณลงมืออย่างแม่นยำ มีแผน และใส่ใจทุกรายละเอียด ทำงานหนักได้นาน และมีพลังที่สุดเมื่อได้แก้ปัญหาที่จับต้องได้", en: "You act precisely, with a plan and attention to every detail. You can work hard for a long time, and your energy is at its best solving practical problems." },
      edge: { th: "เมื่อคุณกังวลว่างานจะไม่สมบูรณ์แบบ คุณจะไม่ได้เริ่มสักที เริ่มจากร่างแรกที่ไม่ต้องดี", en: "When you worry about perfection, you never start. Begin with a rough first draft that does not need to be good." },
    },
    {
      head: { th: "ทำได้ดีที่สุดเมื่อมีทีมหรือคู่", en: "At your best working with others" },
      core: { th: "คุณลงมือได้ดีที่สุดเมื่อมีคู่หรือทีม ชอบความยุติธรรม สู้เพื่อคนอื่นได้ดีกว่าสู้เพื่อตัวเอง และเลือกเจรจามากกว่าปะทะ", en: "You act best with a partner or team. You care about fairness, fight better for others than for yourself, and prefer negotiation to confrontation." },
      edge: { th: "เมื่อคุณลังเลเพราะกลัวคนไม่พอใจ ความโกรธจะสะสมเงียบ ๆ ยอมขัดแย้งเพื่อสิ่งที่คุณต้องการ", en: "When you hesitate so no one is upset, anger builds quietly. Accept conflict for what you want." },
    },
    {
      head: { th: "มุ่งมั่น เข้มข้น และไม่ยอมแพ้", en: "Intense, focused, unyielding" },
      core: { th: "คุณมีพลังเข้มข้น มุ่งมั่น และไม่ยอมแพ้ ทำทีละเรื่องแต่ทำถึงที่สุด และมีพลังที่สุดในยามวิกฤต", en: "Your energy is intense, focused and unyielding. You work on one thing at a time, all the way, and you are at your most powerful in a crisis." },
      edge: { th: "เมื่อคุณเก็บความแค้นไว้ มันจะกัดกินใจคุณเอง การปล่อยวางคือพลังอีกแบบ", en: "Holding a grudge eats away at you. Letting go is another kind of strength." },
    },
    {
      head: { th: "ลงมือด้วยไฟและความเชื่อ", en: "Acts with fire and conviction" },
      core: { th: "คุณลงมือด้วยความกระตือรือร้นและความเชื่อ พลังดีที่สุดเมื่อมีเป้าหมายที่มีความหมาย และชอบการผจญภัย การเดินทาง และการเรียนรู้สิ่งใหม่", en: "You act with enthusiasm and conviction, and your energy peaks with a meaningful goal. You love adventure, travel and learning new things." },
      edge: { th: "เมื่อคุณเบื่อ คุณจะทิ้งงานไว้กลางทาง ทำงานเดิมให้จบก่อนรับงานใหม่", en: "When you get bored, you leave work half done. Finish the current job before taking a new one." },
    },
    {
      head: { th: "มีวินัย ไต่ขึ้นทีละขั้นจนถึงยอด", en: "Disciplined, climbs step by step" },
      core: { th: "คุณลงมืออย่างมีวินัย มีแผน และมองเป้าหมายระยะยาว ทำงานหนักได้ คุมพลังตัวเองได้ดี และไต่ขึ้นทีละขั้นจนถึงจุดสูงสุด", en: "You act with discipline, planning and long-term goals. You work hard, control your energy well and climb step by step to the top." },
      edge: { th: "เมื่อคุณวัดตัวเองจากผลงานอย่างเดียว คุณจะทำงานจนลืมพักและลืมความสุขระหว่างทาง", en: "When you measure yourself only by results, you work without rest and forget to enjoy the journey." },
    },
    {
      head: { th: "ลงมือในแบบของตัวเอง ไม่ชอบถูกสั่ง", en: "Acts your own way, dislikes orders" },
      core: { th: "คุณลงมือในแบบของตัวเอง ไม่ชอบถูกสั่ง และมีพลังที่สุดเมื่อได้ทำเพื่อแนวคิดหรือกลุ่มคนที่เชื่อในสิ่งเดียวกัน ถนัดหาวิธีใหม่ที่ยังไม่มีใครลอง", en: "You act in your own way, dislike being told what to do and are most energised working for an idea or a group that shares your values. You find new methods nobody has tried." },
      edge: { th: "เมื่อคุณต่อต้านกฎทุกข้อ คุณจะเสียแรงสู้ในเรื่องที่ไม่จำเป็น เลือกสู้เฉพาะเรื่องที่สำคัญจริง", en: "When you rebel against every rule, you waste energy on needless fights. Pick only the battles that truly matter." },
    },
    {
      head: { th: "ลงมือตามแรงบันดาลใจและความรู้สึก", en: "Acts on inspiration and feeling" },
      core: { th: "คุณลงมือตามความรู้สึกและแรงบันดาลใจ มีพลังมากเมื่อได้ช่วยคนอื่นหรือทำงานสร้างสรรค์ และไปถึงเป้าหมายด้วยการไหลตามจังหวะ ไม่ใช่การบุกตรง", en: "You act on feeling and inspiration, with the most energy when helping others or creating. You reach your goals by going with the flow, not by charging ahead." },
      edge: { th: "เมื่อคุณเลี่ยงการเผชิญหน้า ความโกรธจะกลายเป็นความเหนื่อยที่ไม่รู้สาเหตุ เขียนเป้าหมายของสัปดาห์ให้ชัดหนึ่งข้อ", en: "When you avoid confrontation, anger turns into tiredness you cannot explain. Write down one clear goal for the week." },
    },
  ],
  jupiter: [
    {
      head: { th: "โอกาสมาจากความกล้าเริ่มก่อน", en: "Luck comes from going first" },
      core: { th: "โอกาสของคุณมาจากความกล้าเริ่มก่อน คุณเติบโตเมื่อได้บุกเบิก ลองสิ่งใหม่ และเชื่อมั่นในตัวเอง", en: "Your opportunities come from daring to go first. You grow by pioneering, trying new things and believing in yourself." },
      edge: { th: "เมื่อมั่นใจเกินไป คุณจะคว้าโอกาสโดยไม่อ่านรายละเอียด อ่านเงื่อนไขให้ครบก่อนตอบรับ", en: "When overconfident, you grab chances without reading the details. Read the terms in full before saying yes." },
    },
    {
      head: { th: "โอกาสงอกงามช้าแต่มั่นคง", en: "Growth that is slow but solid" },
      core: { th: "โอกาสของคุณงอกงามช้าแต่มั่นคง คุณเติบโตผ่านการสะสมทั้งเงิน ทักษะ และความสัมพันธ์ที่ยืนยาว และเห็นค่าของทรัพย์สินที่จับต้องได้ก่อนคนอื่น", en: "Your opportunities grow slowly but surely. You prosper by accumulating money, skills and lasting relationships, and you see the value in tangible assets before others do." },
      edge: { th: "เมื่อชีวิตสบาย คุณจะหยุดขยับ ตั้งเป้าใหม่หนึ่งข้อทุกต้นเดือน", en: "When life gets comfortable, you stop moving. Set one new goal at the start of every month." },
    },
    {
      head: { th: "โอกาสมาจากการพูดคุยและเครือข่าย", en: "Luck through conversation and networks" },
      core: { th: "โอกาสของคุณมาจากการพูดคุย การเรียนรู้ และเครือข่าย ยิ่งรู้จักคนมากและรู้หลายเรื่อง ประตูใหม่ก็ยิ่งเปิด", en: "Your opportunities come through conversation, learning and networks. The more people you know and the more you learn, the more doors open." },
      edge: { th: "เมื่อรับข้อมูลมากเกินไป คุณจะตัดสินใจไม่ได้ ตัดให้เหลือสามทางแล้วเลือก", en: "When you take in too much information, you cannot decide. Narrow it to three options, then choose." },
    },
    {
      head: { th: "โอกาสมาจากความอบอุ่นและครอบครัว", en: "Luck through warmth and family" },
      core: { th: "โอกาสของคุณมาจากความอบอุ่นและการดูแลคน คุณเติบโตผ่านครอบครัว บ้าน และคนที่ไว้ใจ และความช่วยเหลือจะมาหาคุณหลังจากคุณช่วยคนอื่นก่อน", en: "Your opportunities come from warmth and caring for others. You grow through family, home and trusted people, and help comes to you after you help others first." },
      edge: { th: "เมื่อคุณปกป้องคนที่รักมากเกินไป เขาจะไม่ได้เติบโต ให้เขาตัดสินใจเอง", en: "When you over-protect the people you love, they do not grow. Let them decide for themselves." },
    },
    {
      head: { th: "โอกาสมาเมื่อกล้าแสดงตัว", en: "Luck comes when you dare to be seen" },
      core: { th: "โอกาสของคุณมาเมื่อคุณกล้าแสดงตัว ความใจกว้างและความคิดสร้างสรรค์ทำให้คนอยากสนับสนุน และคุณเติบโตเมื่อได้นำหรือได้อยู่บนเวที", en: "Your opportunities arrive when you dare to be seen. Your generosity and creativity make people want to back you, and you grow by leading or being on stage." },
      edge: { th: "เมื่ออยากได้คำชม คุณจะใจกว้างเกินกำลัง ตั้งงบการให้ไว้ทุกเดือน", en: "When you want applause, you give beyond your means. Set a monthly budget for giving." },
    },
    {
      head: { th: "โอกาสมาจากฝีมือและความใส่ใจ", en: "Luck through skill and care" },
      core: { th: "โอกาสของคุณมาจากฝีมือและความใส่ใจในรายละเอียด คุณเติบโตผ่านงานที่ทำได้ดีขึ้นทุกวัน และการช่วยแก้ปัญหาให้คนอื่น", en: "Your opportunities come from skill and attention to detail. You grow through work you keep improving and by solving problems for others." },
      edge: { th: "เมื่อรอให้พร้อมทุกอย่าง โอกาสจะผ่านไปก่อน ตอบรับเมื่อพร้อมเจ็ดสิบเปอร์เซ็นต์", en: "When you wait to feel fully ready, the chance passes. Say yes at seventy percent ready." },
    },
    {
      head: { th: "โอกาสมาผ่านคู่และหุ้นส่วน", en: "Luck through partners" },
      core: { th: "โอกาสของคุณมาผ่านคนอื่น ทั้งคู่ หุ้นส่วน และเครือข่าย คุณเติบโตเมื่อร่วมมือ และมีโชคเรื่องการเจรจาและความสัมพันธ์", en: "Your opportunities come through other people: partners, collaborators and networks. You grow through cooperation and are lucky in negotiation and relationships." },
      edge: { th: "เมื่อพึ่งคนอื่นมากเกินไป คุณจะไม่กล้าตัดสินใจเอง", en: "When you rely on others too much, you stop deciding for yourself." },
    },
    {
      head: { th: "โอกาสซ่อนอยู่ในเรื่องที่คนอื่นไม่กล้าแตะ", en: "Luck where others fear to look" },
      core: { th: "โอกาสของคุณซ่อนอยู่ในเรื่องที่คนอื่นไม่กล้าแตะ คุณเติบโตผ่านการลงลึก การเปลี่ยนแปลงครั้งใหญ่ และทรัพยากรที่ใช้ร่วมกับคนอื่น", en: "Your opportunities hide in places others are afraid to look. You grow by going deep, through major transformations and through resources shared with others." },
      edge: { th: "เมื่ออยากคุมทุกอย่าง คุณจะเหนื่อยเปล่า ปล่อยบางเรื่องให้คนอื่นตัดสิน", en: "When you need to control every outcome, you wear yourself out. Hand some decisions to others." },
    },
    {
      head: { th: "มีโชคและความหวังเป็นทุนเดิม", en: "Luck and hope come naturally" },
      core: { th: "คุณมีโชคและความหวังเป็นทุนเดิม เติบโตผ่านการเดินทาง การเรียน และการแสวงหาความหมายของชีวิต และโอกาสมาหาคุณทุกครั้งที่คุณเปิดใจ", en: "Luck and hope come naturally to you. You grow through travel, study and the search for meaning, and opportunities appear whenever you stay open." },
      edge: { th: "เมื่อมองโลกดีเกินไป คุณจะรับปากเกินกำลัง จดทุกคำสัญญาไว้ที่เดียว", en: "When optimism takes over, you overpromise. Keep every promise written in one place." },
    },
    {
      head: { th: "โอกาสมาช้าแต่มั่นคงตามประสบการณ์", en: "Luck that grows with experience" },
      core: { th: "โอกาสของคุณมาช้าแต่มั่นคง คุณเติบโตผ่านความรับผิดชอบ การทำงานหนัก และการสร้างชื่อเสียงทีละขั้น และความสำเร็จของคุณมาพร้อมประสบการณ์", en: "Your opportunities come slowly but solidly. You grow through responsibility, hard work and building a reputation step by step, and your success arrives with experience." },
      edge: { th: "เมื่อคุณรอบคอบเกินไป โอกาสดีจะหลุดมือ", en: "When you are too cautious, good chances slip away." },
    },
    {
      head: { th: "โอกาสมาจากความคิดใหม่และกลุ่มคน", en: "Luck through new ideas and groups" },
      core: { th: "โอกาสของคุณมาจากความคิดใหม่ เพื่อน และกลุ่มคน คุณเติบโตเมื่อกล้าแตกต่าง และมีโชคกับงานที่ใช้เทคโนโลยีเพื่อคนหมู่มาก", en: "Your opportunities come from new ideas, friends and communities. You grow by daring to be different and are lucky with work that uses technology to serve many people." },
      edge: { th: "เมื่อยึดอุดมการณ์จนลืมตัว คุณจะมองข้ามคนใกล้ตัว", en: "When ideals take over, you overlook the people close to you." },
    },
    {
      head: { th: "โอกาสมาจากความเมตตาและสัญชาตญาณ", en: "Luck through compassion and intuition" },
      core: { th: "โอกาสของคุณมาจากความเมตตาและสัญชาตญาณ คุณเติบโตผ่านศิลปะ จิตวิญญาณ และการช่วยเหลือคน และความช่วยเหลือมาหาคุณในจังหวะที่ไม่คาดคิด", en: "Your opportunities come from compassion and intuition. You grow through art, spirituality and helping others, and help arrives at unexpected moments." },
      edge: { th: "เมื่อคุณใจดีโดยไม่มีขอบเขต คนจะเอาเปรียบคุณ", en: "When your kindness has no limits, people take advantage." },
    },
  ],
  saturn: [
    {
      head: { th: "บทเรียนเรื่องความอดทนและการรอจังหวะ", en: "Lesson: patience and timing" },
      core: { th: "บทเรียนของคุณคือความอดทน คุณอยากได้ผลเร็วและอยากเป็นตัวของตัวเอง แต่ชีวิตสอนให้รอจังหวะ คิดก่อนทำ และยืนด้วยตัวเองอย่างมีวินัย", en: "Your lesson is patience. You want quick results and independence, but life teaches you to wait for the right moment, think before acting and stand on your own with discipline." },
      edge: { th: "เมื่อผ่านบทเรียนนี้ คุณจะเป็นผู้นำที่ทั้งกล้าและรอบคอบ", en: "Once learned, it makes you a leader who is both brave and careful." },
    },
    {
      head: { th: "บทเรียนเรื่องความมั่นคงและคุณค่าในตัวเอง", en: "Lesson: security and self-worth" },
      core: { th: "บทเรียนของคุณเกี่ยวกับความมั่นคงและคุณค่าในตัวเอง คุณกังวลว่าเงินจะไม่พอ จึงตั้งใจสร้างฐานให้มั่นคงด้วยความอดทน", en: "Your lesson concerns security and self-worth. You worry that money will not be enough, so you patiently build a firm foundation." },
      edge: { th: "เมื่อผ่านบทเรียนนี้ คุณจะรู้ว่าความมั่นคงที่แท้อยู่ในตัวเอง ไม่ใช่ในบัญชีธนาคาร", en: "Once you pass this lesson, you learn that true security lives inside you, not in a bank account." },
    },
    {
      head: { th: "บทเรียนเรื่องการคิดและการสื่อสาร", en: "Lesson: thinking and speaking" },
      core: { th: "บทเรียนของคุณเกี่ยวกับการคิดและการสื่อสาร คุณเคยรู้สึกว่าตัวเองพูดไม่เก่ง จึงตั้งใจเรียนรู้อย่างจริงจังและคิดอย่างเป็นระบบ", en: "Your lesson concerns thinking and communication. You once felt you were not articulate enough, so you learn seriously and think systematically." },
      edge: { th: "เมื่อฝึกได้ คำพูดของคุณจะมีน้ำหนักและน่าเชื่อถือกว่าคนที่พูดเก่งโดยธรรมชาติ", en: "With practice, your words carry more weight and trust than those of natural talkers." },
    },
    {
      head: { th: "บทเรียนเรื่องอารมณ์และครอบครัว", en: "Lesson: emotions and family" },
      core: { th: "บทเรียนของคุณเกี่ยวกับอารมณ์และครอบครัว คุณต้องโตเร็วกว่าวัยในเรื่องบ้าน จึงเรียนรู้ที่จะดูแลคนอื่นก่อนดูแลใจตัวเอง", en: "Your lesson concerns emotions and family. You had to grow up early at home, so you learned to care for others before yourself." },
      edge: { th: "ทางผ่านบทเรียนนี้คือให้คนที่ไว้ใจเห็นด้านอ่อนแอของคุณ และสร้างความอบอุ่นที่คุณต้องการขึ้นมาเอง", en: "The way through is to let trusted people see your soft side, and to build the warmth you need yourself." },
    },
    {
      head: { th: "บทเรียนเรื่องความมั่นใจในตัวเอง", en: "Lesson: confidence and self-expression" },
      core: { th: "บทเรียนของคุณเกี่ยวกับการแสดงตัวตนและความมั่นใจ คุณอยากเป็นที่ยอมรับ แต่ลึก ๆ กลัวว่าตัวเองไม่เก่งพอ จึงทำงานหนักเพื่อพิสูจน์ตัวเอง", en: "Your lesson concerns self-expression and confidence. You want recognition, but deep down you fear you are not good enough, so you work hard to prove yourself." },
      edge: { th: "เมื่อผ่านบทเรียนนี้ คุณจะเปล่งประกายได้โดยไม่ต้องรอให้ใครอนุญาต", en: "Once you pass it, you can shine without waiting for anyone's permission." },
    },
    {
      head: { th: "บทเรียนเรื่องงานและความสมบูรณ์แบบ", en: "Lesson: work and perfectionism" },
      core: { th: "บทเรียนของคุณเกี่ยวกับงาน สุขภาพ และความสมบูรณ์แบบ คุณรับผิดชอบสูง ละเอียด และพึ่งพาได้ แต่กดดันตัวเองว่าห้ามผิดพลาด", en: "Your lesson concerns work, health and perfection. You are responsible, precise and reliable, but you pressure yourself never to make mistakes." },
      edge: { th: "บทเรียนนี้สอนว่างานที่ดีพอก็มีค่า และการพักคือส่วนหนึ่งของงาน", en: "This lesson teaches that good enough has value, and that rest is part of the work." },
    },
    {
      head: { th: "บทเรียนเรื่องความสัมพันธ์และคำสัญญา", en: "Lesson: relationships and promises" },
      core: { th: "บทเรียนของคุณเกี่ยวกับความสัมพันธ์และความยุติธรรม คุณจริงจังกับคำสัญญา ให้คุณค่ากับความเท่าเทียม และสร้างความสัมพันธ์ที่ยืนยาวได้เก่ง", en: "Your lesson concerns relationships and fairness. You take promises seriously, value equality and are good at building lasting bonds." },
      edge: { th: "เมื่อคุณเลือกคู่ด้วยหน้าที่มากกว่าหัวใจ ความสัมพันธ์จะหนักเกินแบก ถามใจตัวเองก่อนให้คำสัญญา", en: "When you choose a partner out of duty rather than heart, the bond turns heavy. Ask your heart before you promise." },
    },
    {
      head: { th: "บทเรียนเรื่องความไว้ใจและการควบคุม", en: "Lesson: trust and control" },
      core: { th: "บทเรียนของคุณเกี่ยวกับความไว้ใจและการควบคุม คุณระวังตัวสูงและไม่เปิดใจง่าย แต่เมื่อไว้ใจแล้วจะผูกพันลึกและยาวนาน", en: "Your lesson concerns trust and control. You are guarded and slow to open up, but once you trust, the bond is deep and lasting." },
      edge: { th: "บทเรียนนี้สอนให้คุณปล่อยสิ่งที่ควบคุมไม่ได้ และรู้ว่าการเปิดใจไม่ใช่ความอ่อนแอ", en: "This lesson teaches you to release what you cannot control, and that openness is not weakness." },
    },
    {
      head: { th: "บทเรียนเรื่องความเชื่อและความหมาย", en: "Lesson: belief and meaning" },
      core: { th: "บทเรียนของคุณเกี่ยวกับความเชื่อและความหมายของชีวิต คุณจริงจังกับการเรียนรู้และหลักการ และค่อย ๆ สร้างปรัชญาชีวิตของตัวเองจากประสบการณ์จริง", en: "Your lesson concerns belief and life's meaning. You take learning and principles seriously and gradually build your own philosophy from real experience." },
      edge: { th: "เมื่อยึดความเชื่อแบบตายตัว คุณจะปิดรับประสบการณ์ใหม่", en: "When your beliefs set rigid, you shut out new experience." },
    },
    {
      head: { th: "มีวินัยและรับผิดชอบเป็นธรรมชาติ", en: "Natural discipline and responsibility" },
      core: { th: "คุณมีวินัย อดทน และรับผิดชอบเป็นธรรมชาติ รู้ว่าสิ่งที่มีค่าต้องใช้เวลา และสร้างผลงานที่ยืนได้นานจากความพยายาม", en: "You are disciplined, patient and responsible by nature. You know that what is valuable takes time, and you build lasting work through effort." },
      edge: { th: "เมื่อคุณแบกทุกอย่างไว้คนเดียว คุณจะลืมว่าชีวิตไม่ได้มีแค่หน้าที่", en: "When you carry everything alone, you forget life is more than duty." },
    },
    {
      head: { th: "สร้างระบบใหม่ที่ใช้ได้จริง", en: "Builds new systems that work" },
      core: { th: "คุณใช้วินัยกับความคิดใหม่ได้ดี สร้างระบบที่ทั้งล้ำและใช้ได้จริง และรับผิดชอบต่อกลุ่มหรือส่วนรวมอย่างจริงจัง", en: "You apply discipline to new ideas well, building systems that are both innovative and practical, and you take responsibility for groups and the common good seriously." },
      edge: { th: "เมื่อคุณคิดต่างจากคนส่วนใหญ่ คุณจะรู้สึกโดดเดี่ยว หากลุ่มคนที่คิดแบบเดียวกันหนึ่งกลุ่ม", en: "Thinking differently from most leaves you feeling isolated. Find one group that thinks like you." },
    },
    {
      head: { th: "บทเรียนเรื่องเส้นแบ่งระหว่างฝันกับจริง", en: "Lesson: the line between dream and reality" },
      core: { th: "บทเรียนของคุณเกี่ยวกับเส้นแบ่งระหว่างความฝันกับความจริง คุณมีใจเมตตาและอ่อนไหว และค่อย ๆ เรียนรู้ที่จะให้ความฝันมีโครงสร้างพอจะเป็นจริงได้", en: "Your lesson concerns the line between dreams and reality. You are compassionate and sensitive, and you gradually learn to give your dreams enough structure to come true." },
      edge: { th: "เมื่อคุณรับความทุกข์ของคนอื่นมาแบก คุณจะหมดแรงเร็ว ช่วยคนอื่นเท่าที่แรงคุณมี", en: "When you carry other people's pain, you run out of strength fast. Help only as far as your energy allows." },
    },
  ],
};

/** งานที่ใช่ตามราศีของกลางฟ้า (เรียง เมษ ➔ มีน) — ต่อหลัง "งานที่ใช่คือ" ได้ · ตัวอย่างอาชีพเป็นแนวทาง ไม่ใช่คำสั่ง */
export const MC_CAREER: readonly T[] = [
  { th: "งานที่ได้นำ ริเริ่ม และแข่งขัน เช่น ธุรกิจของตัวเอง กีฬา การเปิดตลาดใหม่ งานขาย และตำแหน่งที่ต้องตัดสินใจเร็ว", en: "work where you lead, start things and compete, such as your own business, sport, opening new markets, sales and roles that need fast decisions" },
  { th: "งานที่สร้างคุณค่าระยะยาวและเห็นผลจับต้องได้ เช่น การเงิน อสังหาริมทรัพย์ อาหาร ความงาม ศิลปะ และงานออกแบบ", en: "work that builds lasting value with tangible results, such as finance, property, food, beauty, art and design" },
  { th: "งานที่ได้สื่อสาร เรียนรู้ และเชื่อมคน เช่น การเขียน สื่อ การสอน การขาย การตลาด และงานคอนเทนต์", en: "work that lets you communicate, learn and connect people, such as writing, media, teaching, sales, marketing and content work" },
  { th: "งานที่ได้ดูแลคนและสร้างความรู้สึกปลอดภัย เช่น งานดูแลสุขภาพ การศึกษาเด็ก อาหาร ที่อยู่อาศัย และธุรกิจครอบครัว", en: "work that cares for people and creates safety, such as healthcare, early education, food, housing and family business" },
  { th: "งานที่ได้แสดงตัวและสร้างสรรค์ เช่น งานบันเทิง การสร้างแบรนด์ การนำทีม งานสร้างสรรค์ และงานที่ต้องพูดต่อหน้าคน", en: "work where you are seen and creative, such as entertainment, branding, leading a team, creative work and public speaking" },
  { th: "งานที่ใช้ความละเอียดและช่วยแก้ปัญหา เช่น การวิเคราะห์ข้อมูล บัญชี การตรวจคุณภาพ งานบริการสุขภาพ และงานบริการลูกค้า", en: "work that uses precision and solves problems, such as data analysis, accounting, quality control, health services and customer service" },
  { th: "งานที่ใช้ความงาม ความยุติธรรม และการประสานคน เช่น กฎหมาย การเจรจา งานออกแบบ แฟชั่น ศิลปะ และงานที่ปรึกษา", en: "work involving beauty, fairness and bringing people together, such as law, negotiation, design, fashion, art and consulting" },
  { th: "งานที่ต้องลงลึกและรับมือเรื่องสำคัญ เช่น การวิจัย จิตวิทยา การแพทย์ การสืบสวน การบริหารความเสี่ยง และงานรับมือวิกฤต", en: "work that goes deep and handles high stakes, such as research, psychology, medicine, investigation, risk management and crisis work" },
  { th: "งานที่เปิดโลกและส่งต่อความรู้ เช่น การสอน การท่องเที่ยว งานต่างประเทศ งานสิ่งพิมพ์ และกฎหมาย", en: "work that opens horizons and shares knowledge, such as teaching, travel, international work, publishing and law" },
  { th: "งานที่มีโครงสร้างชัด ได้รับผิดชอบสูง และเติบโตเป็นขั้น เช่น การบริหาร การเงิน วิศวกรรม งานราชการ และการสร้างองค์กรของตัวเอง", en: "work with clear structure, real responsibility and step-by-step growth, such as management, finance, engineering, public service and building your own organization" },
  { th: "งานที่ใช้ความคิดใหม่และทำเพื่อคนหมู่มาก เช่น เทคโนโลยี นวัตกรรม สตาร์ทอัพ งานสังคม และองค์กรเพื่อส่วนรวม", en: "work that uses new ideas and serves many people, such as technology, innovation, startups, social work and non-profits" },
  { th: "งานที่ใช้จินตนาการและความเมตตา เช่น ศิลปะ ดนตรี ภาพยนตร์ การเยียวยา งานช่วยเหลือผู้คน และงานด้านจิตวิญญาณ", en: "work that uses imagination and compassion, such as art, music, film, healing, the helping professions and spiritual work" },
];

/** เรื่องที่แผลใจ (ไครอน) เกี่ยวข้องตามราศี — ต่อหลัง "มักเกี่ยวกับ" ได้ */
export const CHIRON_SIGN: readonly T[] = [
  { th: "การกล้าเป็นตัวของตัวเองและยืนหยัดเพื่อตัวเอง", en: "daring to be yourself and stand up for yourself" },
  { th: "คุณค่าในตัวเอง ความมั่นคง และร่างกาย", en: "self-worth, security and your body" },
  { th: "การพูด การเรียนรู้ และความรู้สึกว่าตัวเองฉลาดพอ", en: "speaking, learning and feeling clever enough" },
  { th: "ครอบครัว บ้าน และความรู้สึกว่ามีที่ให้กลับไป", en: "family, home and having somewhere to belong" },
  { th: "การได้รับการมองเห็นและการกล้าแสดงออก", en: "being seen and daring to express yourself" },
  { th: "ความสมบูรณ์แบบ สุขภาพ และความรู้สึกว่าตัวเองมีประโยชน์", en: "perfection, health and feeling useful" },
  { th: "ความสัมพันธ์ ความยุติธรรม และความรู้สึกว่าตัวเองดีพอสำหรับคนอื่น", en: "relationships, fairness and feeling good enough for others" },
  { th: "ความไว้ใจ ความใกล้ชิด และการสูญเสีย", en: "trust, intimacy and loss" },
  { th: "ความเชื่อ ความหมายของชีวิต และอิสรภาพ", en: "belief, life's meaning and freedom" },
  { th: "ความสำเร็จ อำนาจ และความคาดหวังจากคนอื่น", en: "achievement, authority and other people's expectations" },
  { th: "การเข้ากลุ่ม ความรู้สึกแปลกแยก และการเป็นตัวเองท่ามกลางคนอื่น", en: "belonging, feeling different and being yourself among others" },
  { th: "ขอบเขตของตัวเอง ศรัทธา และความรู้สึกว่าโลกหนักเกินไป", en: "boundaries, faith and a world that feels like too much" },
];

/** ใช้ให้ดีตามชนิดมุมหลัก (หัวข้อเรื่องเด่น) */
export const ASPECT_KEY: Record<"conjunction" | "trine" | "sextile" | "square" | "opposition", T> = {
  conjunction: { th: "เมื่อด้านหนึ่งสะดุด ให้ใช้อีกด้านพยุงทันที อย่าปล่อยให้ล้มไปพร้อมกันทั้งสองด้าน", en: "When one side stumbles, use the other to hold you up at once instead of letting both fall together." },
  trine: { th: "เอาพรสวรรค์ข้อนี้ไปใช้กับงานจริงหนึ่งชิ้นในสัปดาห์นี้ ของที่ได้มาง่ายมีค่าเมื่อถูกใช้", en: "Put this gift to work on one real task this week. What comes easily only counts once you use it." },
  sextile: { th: "เมื่อเห็นโอกาสที่เกี่ยวกับสองเรื่องนี้ ให้ลงมือทันที ไม่ต้องรอให้พร้อมทุกอย่าง", en: "When an opportunity touches these two areas, act on it straight away rather than waiting until everything is ready." },
  square: { th: "แบ่งเวลาให้ทั้งสองความต้องการอย่างชัดเจน เช่น วันธรรมดาให้ด้านหนึ่ง วันหยุดให้อีกด้าน", en: "Give each need its own fixed time, such as weekdays for one and weekends for the other." },
  opposition: { th: "เมื่อใครทำให้คุณหงุดหงิด ถามตัวเองว่าเขาทำสิ่งที่คุณไม่ยอมทำเองหรือเปล่า", en: "Next time someone irritates you, ask whether they are doing something you will not let yourself do." },
};

/**
 * ดาวจรที่เดินช้า (อยู่นานเป็นสัปดาห์ถึงปี): ใช้ช่วงนี้ให้ดีอย่างไร — `flow` = มุมไหลลื่น · `push` = มุมตึงหรือกุม
 * ดาวเร็ว (อาทิตย์ จันทร์ พุธ ศุกร์ อังคาร) ไม่มี เพราะผ่านไปในไม่กี่วัน
 */
export const TRANSIT_KEY: Record<"jupiter" | "saturn" | "uranus" | "neptune" | "pluto" | "chiron" | "node", { flow: T; push: T }> = {
  jupiter: {
    flow: { th: "ช่วงนี้คนและจังหวะเป็นใจกว่าปกติ ตอบรับโอกาสที่เข้ามาและขยายงานที่ทำอยู่", en: "People and timing are on your side now. Say yes to openings and grow what you already do." },
    push: { th: "โอกาสช่วงนี้มาพร้อมแรงล่อให้ทำเกินตัว ขยายได้ แต่คำนวณเงินและเวลาของคุณก่อนตอบรับ", en: "Opportunity now comes with a pull to overdo it. Expand, but work out your money and time before saying yes." },
  },
  saturn: {
    flow: { th: "ช่วงนี้คือเวลาวางรากฐาน เขียนแผนระยะยาวหนึ่งแผนแล้วเริ่มขั้นแรก ความพยายามตอนนี้อยู่ได้นาน", en: "This is the time to lay foundations: write one long-term plan and take the first step. Effort now lasts." },
    push: { th: "อย่าฝืนเร่ง ทำสิ่งที่ต้องทำทีละขั้นและยอมรับข้อจำกัดที่มีอยู่จริง สิ่งที่ผ่านด่านนี้ได้จะแข็งแรงขึ้น", en: "Do not force the pace. Do what needs doing step by step and accept real limits; whatever survives this test comes out stronger." },
  },
  uranus: {
    flow: { th: "เริ่มสิ่งใหม่ที่อยากทำมานาน การเปลี่ยนแปลงช่วงนี้เปิดทางให้คุณ ไม่ได้ทำให้สะดุด", en: "Start the new thing you have long wanted to try; change now opens doors for you rather than tripping you up." },
    push: { th: "ช่วงนี้มีเรื่องไม่คาดฝันเข้ามา อย่าตัดสินใจเรื่องใหญ่เพียงเพราะอยากหนีความอึดอัด รอให้ใจนิ่งสองสัปดาห์ก่อน", en: "Surprises are arriving now. Do not make big decisions just to escape discomfort; wait two weeks until you are calm." },
  },
  neptune: {
    flow: { th: "แรงบันดาลใจช่วงนี้มาง่ายกว่าปกติ กันเวลาสัปดาห์ละสองชั่วโมงให้งานสร้างสรรค์", en: "Inspiration comes more easily than usual now. Set aside two hours a week for creative work." },
    push: { th: "ช่วงนี้คุณมองคนและสถานการณ์ไม่ชัด อ่านเอกสารให้ครบและตรวจข้อเท็จจริงก่อนเซ็นทุกครั้ง", en: "You are not seeing people or situations clearly now. Read every document in full and check the facts before signing." },
  },
  pluto: {
    flow: { th: "ช่วงนี้คือจังหวะรื้อนิสัยเก่า เลือกนิสัยหนึ่งข้อที่อยากเลิกมานาน แล้วเลิกให้ได้", en: "This is the time to break old habits: pick one you have long wanted to drop, and drop it." },
    push: { th: "สิ่งที่หมดหน้าที่ในชีวิตคุณกำลังถูกรื้อออก ยิ่งยึดไว้ยิ่งเจ็บ เลือกปล่อยหนึ่งเรื่องเองก่อน เพื่อให้มีที่ว่างสำหรับสิ่งใหม่", en: "What has served its purpose is being torn down, and holding on hurts more. Release one thing yourself first to make room for the new." },
  },
  chiron: {
    flow: { th: "ช่วงนี้คือเวลาเยียวยาแผลเก่า นัดคุยกับคนที่เข้าใจคุณหนึ่งคนภายในสัปดาห์นี้", en: "This is the time to heal old wounds. Arrange a talk with one person who understands you this week." },
    push: { th: "ช่วงนี้แผลเก่าถูกแตะ อ่อนโยนกับตัวเองให้มาก ความเจ็บครั้งนี้ชี้จุดที่พร้อมจะหาย", en: "An old wound is being touched now. Be gentle with yourself; this pain points to what is ready to heal." },
  },
  node: {
    flow: { th: "คนที่เข้ามาช่วงนี้พาคุณไปทางที่ควรไป ตอบรับคำชวนที่ปกติจะปฏิเสธ", en: "People arriving now lead where you are meant to go. Accept an invite you would normally decline." },
    push: { th: "ความอึดอัดช่วงนี้คือสัญญาณว่าถึงเวลาเปลี่ยนทิศ เลิกนิสัยเดิมหนึ่งอย่างที่พาคุณวนที่เดิม", en: "The discomfort now is a sign it is time to change direction. Drop one old habit that keeps you going in circles." },
  },
};

/**
 * เกิดกลางวัน/กลางคืน (sect): ดวงสว่างที่นำผัง — กลางวันคือดวงอาทิตย์ กลางคืนคือดวงจันทร์ (หลักโหราดั้งเดิม)
 * เขียนเป็นภาษาคน: คุณรู้จักตัวเองผ่านอะไรเป็นหลัก
 */
export const SECT_TEXT: Record<"day" | "night", T> = {
  day: { th: "ดวงอาทิตย์นำผัง คุณรู้จักตัวเองผ่านสิ่งที่ลงมือทำ เป้าหมาย และสิ่งที่สร้างให้โลกเห็น", en: "The Sun leads your chart: you know yourself through what you do, your goals and what you build for the world to see." },
  night: { th: "ดวงจันทร์นำผัง คุณรู้จักตัวเองผ่านความรู้สึก ความสัมพันธ์ใกล้ชิด และโลกภายใน", en: "The Moon leads your chart: you know yourself through feelings, close bonds and your inner world." },
};

/** ดวงจันทร์ 12 ราศี: หัวข้อสั้นในแถวดาว (สรุปจาก `MOON_SIGN_TEXT` ของ content.ts) */
export const MOON_HEAD: readonly T[] = [
  { th: "ใจร้อนเร็วหายเร็ว ต้องได้ลงมือเอง", en: "A quick-burning heart that needs to act for itself" },
  { th: "ใจสงบเมื่อชีวิตมั่นคงและสบาย", en: "A heart at peace when life is stable and comfortable" },
  { th: "ใจต้องการได้คุยและมีเรื่องใหม่ให้คิด", en: "A heart that needs conversation and new things to think about" },
  { th: "ใจลึก อ่อนโยน ผูกพันกับคนใกล้ชิด", en: "A deep, tender heart, close to family" },
  { th: "ใจต้องการการยอมรับและความอบอุ่นที่แสดงออก", en: "A heart that needs warmth and recognition shown openly" },
  { th: "ใจสงบเมื่อทุกอย่างเป็นระเบียบ", en: "A heart at peace when things are in order" },
  { th: "ใจต้องการความสงบและความสัมพันธ์ที่ราบรื่น", en: "A heart that needs peace and smooth relationships" },
  { th: "ใจลึก เข้มข้น และไว้ใจคนยาก", en: "A deep, intense heart that trusts slowly" },
  { th: "ใจต้องการอิสระและเรื่องที่ให้ความหวัง", en: "A heart that needs freedom and hope" },
  { th: "ใจแข็งแรงและพึ่งตัวเองได้", en: "A strong, self-reliant heart" },
  { th: "ใจต้องการพื้นที่ส่วนตัวและเพื่อนที่เข้าใจ", en: "A heart that needs space and friends who get you" },
  { th: "ใจอ่อนไหว รับรู้ความรู้สึกคนรอบตัวได้ไว", en: "A sensitive heart that feels what others feel" },
];

/**
 * ลักษณะราศี (จร · สถิร · อุภย) ที่มากหรือน้อยเกินไป — `strong` เมื่อแบบหนึ่งเกินครึ่งของผัง · `weak` เมื่อเหลือไม่ถึง 15%
 * (สมดุลพลังเดิมมีแค่เปอร์เซ็นต์ ผู้ใช้ที่มีสถิรราศี 78% ไม่รู้ว่าแปลว่าอะไร)
 */
export const MODALITY_DEPTH: Record<"cardinal" | "fixed" | "mutable", { strong: T; weak: T }> = {
  cardinal: {
    strong: { th: "จรราศีมากเกินครึ่ง: คุณถนัดเริ่มและผลักให้เกิดสิ่งใหม่ แต่เมื่อเริ่มหลายอย่างพร้อมกัน คุณจะจบไม่ครบ", en: "Over half cardinal: you are a natural starter, but when you start many things at once, you do not finish them all." },
    weak: { th: "จรราศีน้อย: การเริ่มเรื่องใหม่ใช้แรงคุณมากกว่าคนอื่น ตั้งวันเริ่มให้ชัดทุกครั้ง", en: "Little cardinal: starting something new takes you more effort than others; always set a clear start date." },
  },
  fixed: {
    strong: { th: "สถิรราศีมากเกินครึ่ง: คุณหนักแน่นและทำต่อเนื่องได้นานกว่าคนส่วนใหญ่ แต่เมื่อสถานการณ์เปลี่ยน คุณจะปรับตัวช้ากว่าคนอื่น", en: "Over half fixed: you are steadier and more persistent than most, but when things change, you adapt more slowly than others." },
    weak: { th: "สถิรราศีน้อย: การทำเรื่องเดิมต่อเนื่องนาน ๆ ไม่ใช่ธรรมชาติของคุณ ผูกเรื่องสำคัญไว้กับกิจวัตรประจำวัน", en: "Little fixed: sticking with one thing for a long time is not your nature; tie what matters to a daily routine." },
  },
  mutable: {
    strong: { th: "อุภยราศีมากเกินครึ่ง: คุณปรับตัวเก่งมาก แต่เมื่อเปลี่ยนใจบ่อย คุณจะไม่ได้ลงหลักที่ไหนเลย", en: "Over half mutable: you adapt brilliantly, but when you change course often, you never settle anywhere." },
    weak: { th: "อุภยราศีน้อย: การเปลี่ยนแผนกะทันหันทำให้คุณอึดอัด เตรียมแผนสำรองไว้ทุกครั้ง", en: "Little mutable: sudden changes of plan unsettle you; always keep a plan B." },
  },
};

/** เรือนที่มีแต่จุดคำนวณ (ไม่มีดาวเคราะห์): บอกว่าจุดนั้นทำอะไรในเรือนนี้ */
export const POINT_HOUSE_LINE: Partial<Record<BodyId, T>> = {
  node: { th: "ทิศทางที่ชีวิตต้องการให้คุณเติบโต", en: "Where life wants you to grow" },
  chiron: { th: "แผลใจเรื่องนี้คือพลังเยียวยาของคุณ", en: "Your old wound here is your gift for healing" },
  lilith: { th: "เรื่องที่คุณไม่ยอมให้ใครควบคุม", en: "An area where you refuse to be controlled" },
  ceres: { th: "ที่ที่คุณดูแลและอยากได้รับการดูแล", en: "Where you nurture and want to be nurtured" },
  pallas: { th: "ที่ที่ปัญญาและกลยุทธ์ของคุณทำงาน", en: "Where your strategic mind works" },
  juno: { th: "เรื่องที่ผูกกับความผูกมัดระยะยาว", en: "An area tied to long-term commitment" },
  vesta: { th: "เรื่องที่คุณทุ่มเทอย่างตั้งใจ", en: "Something you devote yourself to" },
};

/**
 * กล่องความรัก · การงาน · การเงินในสรุปผัง (เจ้าของ 2026-10-29 "ส่วนนี้จะเป็นส่วนที่ทำเงิน ขอให้ทำให้ดีที่สุด")
 * เดิมต่อคำคุณศัพท์กลางของราศี ("คุณจัดการเงินอย่างอบอุ่น เปิดเผย และอยากให้คนเห็นคุณค่า") ซึ่งอ่านแปลกและซ้ำกับกล่องงาน
 * ชุดนี้เขียนเฉพาะเรื่อง ทุกข้อมีด้านเด่นและสิ่งที่ควรระวังในประโยคเดียวกัน (เรียง เมษ ➔ มีน)
 */

/** คนที่ดึงดูดคุณ ตามราศีของจุดตก (DSC · จุดเริ่มเรือน 7) */
export const PARTNER_SIGN: readonly T[] = [
  { th: "คนที่ดึงดูดคุณคือคนกล้า ตรง และมีพลัง คนแบบนี้ทำให้คุณกล้าบอกสิ่งที่ต้องการ", en: "You are drawn to bold, direct, energetic people, who make you brave enough to ask for what you want." },
  { th: "คนที่ดึงดูดคุณคือคนนิ่ง มั่นคง และไว้ใจได้ ความรักที่ยืนยาวสำหรับคุณคือความรักที่ค่อย ๆ โต", en: "You are drawn to calm, steady, reliable people. Lasting love, for you, is love that grows slowly." },
  { th: "คนที่ดึงดูดคุณคือคนคุยสนุก ฉลาด และคล่องตัว ถ้าคุยกันได้ไม่รู้จบ ความสัมพันธ์จะไปได้ไกล", en: "You are drawn to witty, clever, lively people. If the conversation never runs dry, the relationship goes far." },
  { th: "คนที่ดึงดูดคุณคือคนอบอุ่น ขี้ห่วง และให้ความรู้สึกเหมือนบ้าน คุณต้องการคู่ที่ดูแลใจกันได้", en: "You are drawn to warm, caring people who feel like home. You need a partner who looks after your heart." },
  { th: "คนที่ดึงดูดคุณคือคนมั่นใจ มีเสน่ห์ และใจกว้าง คนแบบนี้ชวนให้คุณกล้าเฉิดฉายไปด้วยกัน", en: "You are drawn to confident, charismatic, generous people who invite you to shine as well." },
  { th: "คนที่ดึงดูดคุณคือคนละเอียด ช่างดูแล และพึ่งพาได้ ความรักของคุณเห็นได้จากการช่วยกันในเรื่องเล็ก ๆ ทุกวัน", en: "You are drawn to thoughtful, helpful, dependable people. Your love shows in small, everyday help." },
  { th: "คนที่ดึงดูดคุณคือคนสุภาพ มีรสนิยม และยุติธรรม คุณต้องการความสัมพันธ์ที่เท่าเทียมและให้เกียรติกัน", en: "You are drawn to gracious, tasteful, fair people. You need a relationship of equals built on respect." },
  { th: "คนที่ดึงดูดคุณคือคนลึก เข้มข้น และมีอะไรให้ค้นหา คุณต้องการความรักที่จริงจังและซื่อสัตย์ทั้งใจ", en: "You are drawn to deep, intense people with something to discover. You want love that is serious and wholeheartedly loyal." },
  { th: "คนที่ดึงดูดคุณคือคนร่าเริง รักอิสระ และเปิดโลก คนแบบนี้พาคุณไปเจอสิ่งใหม่และทำให้คุณหัวเราะบ่อย", en: "You are drawn to cheerful, free-spirited people who open up the world and make you laugh." },
  { th: "คนที่ดึงดูดคุณคือคนที่เป็นผู้ใหญ่ มีวินัย และมีเป้าหมาย คุณอยากได้คู่ที่สร้างอนาคตไปด้วยกันได้จริง", en: "You are drawn to mature, disciplined, goal-driven people. You want a partner to build a real future with." },
  { th: "คนที่ดึงดูดคุณคือคนที่คิดไม่เหมือนใครและรักอิสระ ความสัมพันธ์ที่ไปได้ไกลของคุณต้องเป็นเพื่อนกันก่อน", en: "You are drawn to original, independent people. Your relationships that last start as friendship." },
  { th: "คนที่ดึงดูดคุณคือคนอ่อนโยน ช่างฝัน และเข้าใจกันได้โดยไม่ต้องพูด คุณต้องการรักที่ทั้งอ่อนหวานและจริงใจ", en: "You are drawn to gentle, dreamy people who understand without words. You want love that is both tender and honest." },
];

/** วิธีทำงานและสิ่งที่ทำให้มีไฟ ตามราศีของดาวอังคาร */
export const WORK_STYLE: readonly T[] = [
  { th: "คุณทำงานได้ดีที่สุดเมื่อได้เริ่มเองและเห็นผลเร็ว เป็นคนจุดไฟให้ทีม แต่เมื่องานยืดเยื้อ คุณจะเบื่อเร็ว", en: "You work best when you can start things yourself and see results fast. You light the fire for a team, but when work drags on, you get bored fast." },
  { th: "คุณทำงานช้าแต่ไม่พลาด อึดกว่าใคร ยิ่งงานต้องต่อเนื่องยิ่งเก่ง แต่ไม่ชอบถูกเร่งหรือเปลี่ยนแผนกะทันหัน", en: "You work slowly but surely and outlast everyone; the more a job needs persistence, the better you are. You dislike being rushed or sudden changes of plan." },
  { th: "คุณทำได้หลายงานพร้อมกัน คิดเร็ว พูดเก่ง เหมาะกับงานที่มีเรื่องใหม่ตลอด แต่งานที่เริ่มพร้อมกันหลายชิ้นจะค้างอยู่ครึ่งทาง", en: "You juggle several tasks, think fast and talk well, which suits work full of new things, but jobs started in parallel get left half done." },
  { th: "คุณทำงานเต็มที่เมื่อรู้สึกว่าทีมเหมือนครอบครัวและได้ทำเพื่อคนที่ห่วง แต่บรรยากาศตึงเครียดทำให้พลังตกเร็ว", en: "You give your all when the team feels like family and you are working for people you care about. Tense atmospheres drain you fast." },
  { th: "คุณทำงานเต็มที่เมื่อมีเวทีและได้รับการยอมรับ เป็นผู้นำที่ให้กำลังใจเก่ง แต่ถ้าไม่มีใครเห็นค่า แรงใจจะหายเร็ว", en: "You go all out when there is a stage and recognition. You lead by encouragement, but your drive fades if nobody notices the effort." },
  { th: "คุณทำงานละเอียด เป็นระบบ และเก็บงานได้เนี้ยบ เป็นคนที่ทีมขาดไม่ได้ แต่เมื่ออยากให้สมบูรณ์ คุณจะแก้งานไม่จบ", en: "You work precisely and systematically and finish to a high standard, the person a team cannot do without, but chasing perfect keeps you polishing forever." },
  { th: "คุณทำงานได้ดีเมื่อมีคู่คิดหรือทีม เก่งเจรจาและหาทางที่ทุกฝ่ายรับได้ แต่ลังเลเมื่อต้องตัดสินใจคนเดียว", en: "You work best with a partner or a team and are skilled at finding outcomes everyone accepts, but you hesitate when you must decide alone." },
  { th: "คุณทุ่มกับงานแบบสุดตัวและเงียบ ๆ เจาะเรื่องยากที่คนอื่นถอย แต่ถ้าไม่ไว้ใจคนรอบตัวจะแบกทุกอย่างไว้คนเดียว", en: "You commit fully and quietly, digging into hard problems others avoid, but when you do not trust the people around you, you carry everything alone." },
  { th: "คุณทำงานได้ดีเมื่อเห็นภาพใหญ่และมีอิสระ เหมาะกับงานที่ได้เรียนรู้หรือเดินทาง แต่ไม่ชอบงานซ้ำซากและกฎที่ไม่มีเหตุผล", en: "You work well with a big picture and freedom, which suits work that involves learning or travel. You dislike repetitive tasks and rules without reasons." },
  { th: "คุณทำงานแบบมีแผน มีวินัย และไต่ทีละขั้นจนถึงเป้า เป็นคนที่องค์กรไว้ใจ แต่คุณทำงานหนักจนลืมพักเป็นประจำ", en: "You work to a plan, with discipline, climbing step by step to the goal, and organisations trust you, but you regularly work so hard you forget to rest." },
  { th: "คุณทำงานได้ดีที่สุดเมื่อได้คิดวิธีใหม่และไม่มีใครคุมใกล้ชิด เก่งเรื่องระบบและเทคโนโลยี แต่ต่อต้านคำสั่งที่ไม่มีเหตุผล", en: "You work best when you can invent new methods without close supervision. You are good with systems and technology, but resist orders that make no sense." },
  { th: "คุณทำงานได้ดีเมื่องานมีความหมายและได้ใช้จินตนาการ อ่านคนและบรรยากาศเก่ง แต่ต้องมีกำหนดส่งช่วยดึงให้งานเสร็จ", en: "You work well when the work means something and uses your imagination. You read people and moods well, but deadlines help you finish." },
];

/** วิธีหาเงินและใช้เงิน ตามราศีของจุดเริ่มเรือน 2 */
export const MONEY_SIGN: readonly T[] = [
  { th: "คุณหาเงินเก่งเมื่อได้ริเริ่มและลงมือเอง เงินมาเร็วไปเร็ว และคุณซื้อตามใจในพริบตา เปิดบัญชีสำรองที่ตั้งกติกาว่าห้ามแตะ", en: "You earn best when you start things and act yourself. Money comes fast and goes fast, and you buy on impulse, so open a reserve account with a strict no-touch rule." },
  { th: "คุณสร้างเงินแบบค่อยเป็นค่อยไปและเก็บเก่ง ชอบของดีที่ใช้ได้นาน เงินที่มั่นคงทำให้ใจสงบ แต่ความกลัวเสียเงินทำให้คุณไม่กล้าคว้าโอกาสใหม่", en: "You build money gradually and save well, and you like quality that lasts. Financial security calms you, but fear of losing money holds you back from new opportunities." },
  { th: "เงินของคุณมาจากหลายทาง ทั้งงานหลัก งานเสริม และการซื้อมาขายไป ความรู้และการสื่อสารคือทุนสำคัญ รายจ่ายเล็ก ๆ ที่กระจายหลายที่คือจุดที่เงินรั่ว", en: "Your money comes from several streams: a main job, side work, buying and selling. Knowledge and communication are your capital. Small expenses scattered everywhere are where it leaks." },
  { th: "คุณมองเงินเป็นความปลอดภัยของคนที่รัก เก็บออมเก่งเมื่อมีเป้าหมายเพื่อครอบครัว และวันที่ใจไม่ดีคือวันที่คุณใช้เงินตามอารมณ์", en: "To you, money means safety for the people you love, and you save well with a family goal in mind. Bad days are when you spend on emotion." },
  { th: "คุณหาเงินได้ดีเมื่อได้ใช้ความสามารถเฉพาะตัวและมีคนเห็นฝีมือ ใจกว้าง ชอบให้ และชอบของที่สะท้อนตัวตน เงินของคุณหมดไปกับการจ่ายเพื่อภาพลักษณ์เกินกำลัง", en: "You earn well when your own talent is on show and recognised. You are generous and love things that reflect who you are, and your money drains away on image beyond your means." },
  { th: "คุณดูแลเงินละเอียด จดรายรับรายจ่ายได้ และหาเงินจากฝีมือ ทักษะ และงานบริการ แต่ความกังวลเรื่องเงินทำให้คุณไม่กล้าใช้กับสิ่งที่ทำให้ชีวิตดีขึ้นจริง", en: "You manage money carefully, track every expense and earn through skill, craft and service, but money worries stop you spending on what would truly improve your life." },
  { th: "เงินของคุณมาผ่านคนอื่น ทั้งหุ้นส่วน ลูกค้า และความสัมพันธ์ที่ดี ชอบใช้เงินกับความสวยงามและความสุขที่แบ่งกันได้ ตัดสินใจเรื่องเงินด้วยตัวเองเสมอ ไม่ใช่ตามใจคนอื่น", en: "Your money comes through other people: partners, clients and good relationships. You like spending on beauty and shared pleasures; always make your own money decisions." },
  { th: "คุณเก็บเรื่องเงินเงียบและคิดเรื่องเงินลึก เก่งพลิกสิ่งที่คนอื่นมองข้ามให้มีค่า แต่เมื่อมั่นใจเกินไป คุณจะทุ่มหมดหน้าตัก", en: "You keep money matters private and think about them deeply, with a gift for turning overlooked things into value, but when overconfident, you bet everything at once." },
  { th: "คุณมองเงินเป็นเครื่องมือของอิสระและประสบการณ์ เงินมาจากการสอน การเดินทาง และการขายความคิด แต่ความมองโลกดีทำให้คุณใช้เกินกว่าที่หาได้", en: "Money, to you, is a tool for freedom and experience. It comes through teaching, travel and selling ideas, but optimism leads you to spend more than you earn." },
  { th: "คุณสร้างฐานะแบบมีแผน เก็บเงินเป็น และยิ่งอายุมากยิ่งมั่นคง ชอบสิ่งที่มีมูลค่าระยะยาว แต่คุณเข้มงวดกับตัวเองจนไม่เคยให้รางวัลชีวิต ตั้งงบรางวัลไว้ทุกเดือน", en: "You build wealth by plan, save well and grow more secure with age. You value long-term worth, but you are so strict that you never reward yourself; set a monthly treat budget." },
  { th: "เงินของคุณมาจากทางที่ไม่เหมือนใคร เช่น เทคโนโลยี งานออนไลน์ และกลุ่มคน คุณอยากมีเงินเพื่ออิสระมากกว่าหน้าตา และรายได้ของคุณขึ้นลงทุกครั้งที่คุณเปลี่ยนแผน", en: "Your money comes in unusual ways, such as technology, online work and groups. You want money for freedom rather than status, and your income swings every time your plans change." },
  { th: "คุณไม่ยึดติดเงิน ใจดี ให้ง่าย และหาเงินได้จากศิลปะและการช่วยคน แต่เงินของคุณรั่วไหลเพราะเชื่อคนง่ายเกินไป", en: "You are not attached to money, give easily and earn through art and helping people, but money slips away because you trust too easily." },
];

/**
 * เงินมาจากไหน: เรือนที่เจ้าเรือน 2 (ดาวเจ้าราศีของจุดเริ่มเรือน 2 แบบโบราณ) ไปอยู่ — หลักอ่านเงินพื้นฐานของโหราสากล
 * เรียงเรือน 1 ➔ 12 · ต่อหลัง "แปลว่า" ได้
 */
export const MONEY_FROM_HOUSE: readonly T[] = [
  { th: "เงินมาจากตัวคุณเอง ทั้งฝีมือ ภาพลักษณ์ และการลงมือทำด้วยตัวเอง", en: "money comes through you: your skills, your image and what you do yourself" },
  { th: "เงินต่อเงิน คุณเก่งเรื่องเก็บ สะสม และทำให้ทรัพย์งอกเงย", en: "money makes money; you are good at saving, accumulating and growing what you have" },
  { th: "เงินมาจากการพูด การเขียน การขาย การสอน และคนรอบตัว", en: "money comes through speaking, writing, selling, teaching and the people around you" },
  { th: "เงินผูกกับบ้าน ที่ดิน และครอบครัว", en: "money is tied to home, property and family" },
  { th: "เงินมาจากความคิดสร้างสรรค์และงานที่คุณสนุกกับมัน", en: "money comes through creativity and work you enjoy" },
  { th: "เงินมาจากงานประจำ ทักษะเฉพาะ และงานบริการที่ทำได้ดีทุกวัน", en: "money comes through steady work, specialist skills and service done well every day" },
  { th: "เงินมาผ่านคู่ หุ้นส่วน และลูกค้า งานที่ทำร่วมกับคนอื่นให้ผลดีกว่าทำคนเดียว", en: "money comes through partners and clients; working with others pays better than working alone" },
  { th: "เงินผูกกับทรัพย์ที่ใช้ร่วมกับคนอื่น และเงินของคนอื่นที่คุณดูแล", en: "money is tied to shared resources and other people's money you manage" },
  { th: "เงินมาจากความรู้ การสอน และงานที่เชื่อมกับต่างประเทศ", en: "money comes through knowledge, teaching and work with foreign links" },
  { th: "เงินมาจากอาชีพ ตำแหน่ง และชื่อเสียง ยิ่งงานเติบโต เงินยิ่งตามมา", en: "money comes through your career, position and reputation; as your work grows, so does your income" },
  { th: "เงินมาจากเครือข่าย เพื่อน กลุ่มลูกค้า และงานออนไลน์", en: "money comes through networks, friends, communities of customers and online work" },
  { th: "เงินมาจากงานเบื้องหลังที่ทำเงียบ ๆ ในองค์กรใหญ่", en: "money comes through quiet, behind-the-scenes work in large institutions" },
];
