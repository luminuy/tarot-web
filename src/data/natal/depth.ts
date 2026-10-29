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
 * กติกาการเขียน: ภาษาคน ประโยคสั้น · ไม่ฟันธง (ใช้ "มัก" "อาจ") · ไม่โทษผู้อ่าน · ด้านเงามาคู่ทางออกเสมอ
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
  /** ด้านเงาเมื่อพลังนี้เสียสมดุล (ขึ้นต้นด้วย "ถ้า…") */
  shadow: T;
  /** ใช้ให้ดีอย่างไร (ประโยคเดียว ทำได้จริง) */
  key: T;
}

export const PLANET_DEPTH: Record<PlanetId, PlanetDepth> = {
  sun: {
    loud: { th: "คุณมีแกนในตัวชัด อยากรู้ว่าตัวเองเกิดมาเพื่ออะไร และรู้สึกมีชีวิตชีวาที่สุดเมื่อได้ทำสิ่งที่เป็นตัวเองจริง", en: "You have a strong core. You want to know what you are here for, and you feel most alive doing something that is truly yours." },
    shadow: { th: "ถ้าเอาคุณค่าในตัวเองไปผูกกับคำชมหรือผลงานทั้งหมด ใจจะขึ้นลงตามสิ่งที่คนอื่นพูด", en: "If your self-worth rides entirely on praise or results, your mood will rise and fall with what others say." },
    key: { th: "เลือกเป้าหมายที่มาจากใจตัวเอง แล้วให้เวลากับมันสม่ำเสมอ แม้วันละนิดก็พอ", en: "Choose a goal that comes from you, and give it steady time, even a little each day." },
  },
  moon: {
    loud: { th: "คุณใช้ความรู้สึกนำทาง อ่านบรรยากาศและใจคนได้เร็ว และต้องรู้สึกปลอดภัยก่อนถึงจะเปิดใจเต็มที่", en: "You are led by feeling. You read moods and people quickly, and you need to feel safe before you fully open up." },
    shadow: { th: "ถ้าไม่ได้ดูแลใจตัวเอง อารมณ์จะเป็นคนตัดสินใจแทนคุณ หรือคุณจะดูแลคนอื่นจนลืมตัวเอง", en: "If you neglect your own needs, your moods start making decisions for you, or you care for everyone except yourself." },
    key: { th: "สังเกตว่าอะไรทำให้ใจคุณสงบ แล้วทำสิ่งนั้นให้เป็นกิจวัตร", en: "Notice what calms you, and turn it into a routine." },
  },
  mercury: {
    loud: { th: "คุณคิดเร็ว ช่างสังเกต และใช้คำพูดเป็นเครื่องมือหลัก ทั้งในการทำงานและการผูกมิตร", en: "You think fast, notice details and use words as your main tool, at work and in friendship." },
    shadow: { th: "ถ้าใจไม่นิ่ง ความคิดจะวนไม่หยุดจนนอนไม่หลับ หรือพูดเร็วกว่าที่ใจพร้อม", en: "When you are restless, your mind loops endlessly, or your words run ahead of your heart." },
    key: { th: "เขียนสิ่งที่คิดออกมา ความคิดที่อยู่บนกระดาษจัดการง่ายกว่าความคิดที่วนอยู่ในหัว", en: "Write your thoughts down. Ideas on paper are easier to handle than ideas looping in your head." },
  },
  venus: {
    loud: { th: "คุณมีเสน่ห์แบบเป็นธรรมชาติ ให้ความสำคัญกับความสัมพันธ์ ความงาม และบรรยากาศดี ๆ ระหว่างคน", en: "You have natural charm and care deeply about relationships, beauty and good feeling between people." },
    shadow: { th: "ถ้ากลัวความขัดแย้งมากเกินไป คุณอาจยอมคนอื่นจนลืมว่าตัวเองต้องการอะไร", en: "If you fear conflict too much, you may keep the peace at the cost of what you want." },
    key: { th: "ถามตัวเองบ่อย ๆ ว่าชอบสิ่งนี้จริง หรือแค่อยากให้ทุกคนพอใจ", en: "Ask yourself often whether you truly like something, or just want everyone to be pleased." },
  },
  mars: {
    loud: { th: "คุณเป็นคนลงมือ มีพลังมาก กล้าเริ่ม และรู้สึกมีชีวิตชีวาเมื่อมีเป้าหมายให้ไล่ตาม", en: "You are a doer with plenty of energy. You start boldly and feel most alive with a goal to chase." },
    shadow: { th: "ถ้าพลังนี้ไม่มีที่ไป จะกลายเป็นความหงุดหงิด ใจร้อน หรือการปะทะกับคนใกล้ตัว", en: "When this energy has nowhere to go, it turns into irritation, impatience or clashes with people close to you." },
    key: { th: "ให้พลังมีทางออกทุกวัน เช่น ออกกำลังกาย หรืองานที่เห็นผลชัด", en: "Give the energy a daily outlet, such as exercise or work with visible results." },
  },
  jupiter: {
    loud: { th: "คุณมองโลกกว้าง มีความหวัง และมักได้โอกาสจากความใจกว้างของตัวเอง คนรอบตัวรู้สึกว่าคุณให้กำลังใจเก่ง", en: "You see the big picture, stay hopeful and often find opportunity through your own generosity. People feel encouraged around you." },
    shadow: { th: "ถ้ามองโลกดีเกินจริง คุณอาจรับปากเกินตัว หรือมองข้ามรายละเอียดที่สำคัญ", en: "Too much optimism can lead you to overpromise or skip important details." },
    key: { th: "ฝันให้ใหญ่ได้ แต่แตกความฝันออกเป็นขั้นเล็ก ๆ ที่ทำได้จริง", en: "Dream big, then break the dream into small steps you can actually take." },
  },
  saturn: {
    loud: { th: "คุณเป็นคนจริงจัง อดทน และพึ่งพาได้ ยอมเหนื่อยวันนี้เพื่อสิ่งที่มั่นคงในวันหน้า และมักเก่งขึ้นตามอายุ", en: "You are serious, patient and reliable. You will work hard today for something solid tomorrow, and you tend to get better with age." },
    shadow: { th: "ถ้าเข้มงวดกับตัวเองเกินไป คุณจะแบกทุกอย่างไว้คนเดียว และรู้สึกว่าทำเท่าไรก็ยังไม่พอ", en: "If you are too hard on yourself, you carry everything alone and feel that nothing is ever enough." },
    key: { th: "ชื่นชมความคืบหน้าของตัวเองเป็นระยะ และยอมให้คนอื่นช่วยแบกบ้าง", en: "Acknowledge your progress along the way, and let others help carry the load." },
  },
  uranus: {
    loud: { th: "คุณไม่ชอบเดินตามกรอบ คิดต่าง มองเห็นทางใหม่ก่อนคนอื่น และชีวิตมักเปลี่ยนทิศแบบไม่ทันตั้งตัว", en: "You resist fixed rules, think differently and see new ways before others do, and your life often changes course suddenly." },
    shadow: { th: "ถ้าแหกกรอบเพื่อหนีความผูกมัด คุณอาจตัดสายสัมพันธ์หรือโอกาสดีทิ้งเร็วเกินไป", en: "If you rebel just to avoid commitment, you may cut off good bonds or chances too quickly." },
    key: { th: "เก็บพื้นที่อิสระไว้ในชีวิตเสมอ แล้วคุณจะไม่ต้องระเบิดออกมาเป็นครั้งคราว", en: "Keep some free space in your life at all times, so you never need to break out all at once." },
  },
  neptune: {
    loud: { th: "คุณมีจินตนาการสูง รับรู้ความรู้สึกที่ไม่ได้พูดออกมาได้ไว และมีใจเมตตาหรือมีหัวทางศิลปะ", en: "You have a rich imagination, sense what goes unspoken and carry a compassionate or artistic streak." },
    shadow: { th: "ถ้าไม่มีขอบเขตชัด คุณอาจมองคนหรือสถานการณ์ดีกว่าความจริง หรือหาทางหนีเมื่อชีวิตหนักเกินไป", en: "Without clear boundaries, you may see people or situations as better than they are, or look for an escape when life feels heavy." },
    key: { th: "ให้ความฝันมีที่ลงจริง เช่น ศิลปะ งานช่วยเหลือ หรือการภาวนา และตรวจข้อเท็จจริงก่อนตัดสินใจเรื่องใหญ่", en: "Give your dreams a real outlet such as art, service or meditation, and check the facts before big decisions." },
  },
  pluto: {
    loud: { th: "คุณเป็นคนเข้มข้น มองทะลุผิวเผินไปถึงแก่นของเรื่อง และผ่านการเปลี่ยนแปลงครั้งใหญ่จนเหมือนเกิดใหม่ได้หลายครั้ง", en: "You are intense, see past the surface to the heart of things, and can come through major changes as a new person more than once." },
    shadow: { th: "ถ้ากลัวการสูญเสียการควบคุม คุณอาจยึดคน ยึดเรื่องเก่า หรือเก็บความรู้สึกไว้จนหนักเกินไป", en: "If you fear losing control, you may hold on too tightly to people, the past or your feelings." },
    key: { th: "ยอมปล่อยสิ่งที่หมดหน้าที่แล้ว พื้นที่ว่างนั้นคือที่ที่ของใหม่จะเกิด", en: "Let go of what has served its purpose. That empty space is where the new can grow." },
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
    why: { th: "ชีวิตชวนให้คุณสร้างตัวตนที่ชัดและยืนได้ด้วยตัวเอง คนจะจดจำคุณจากสิ่งที่คุณเป็นมากกว่าตำแหน่งที่คุณมี", en: "Life asks you to build a clear identity that stands on its own. People remember you for who you are more than for any title." },
    shadow: { th: "ถ้าโฟกัสที่ตัวเองมากเกินไป อาจลืมฟังว่าคนรอบตัวต้องการอะไร", en: "Too much focus on yourself can make you forget what the people around you need." },
    key: { th: "เริ่มสิ่งที่อยากทำได้เลย ไม่ต้องรอให้ใครอนุญาต แล้วชวนคนอื่นมาร่วมทาง", en: "Start what you want without waiting for permission, then invite others along." },
  },
  {
    topic: { th: "เงินและคุณค่าในตัวเอง", en: "money and self-worth" },
    why: { th: "ความมั่นคงทางการเงินกับความรู้สึกว่าตัวเองมีค่าผูกกันแน่นในใจคุณ คุณอยากสร้างสิ่งที่เป็นของตัวเองด้วยฝีมือตัวเอง", en: "Financial security and self-worth are tightly linked for you. You want to build something truly your own, with your own hands." },
    shadow: { th: "ถ้าวัดคุณค่าตัวเองจากเงินหรือสิ่งของ ใจจะไม่มั่นคงแม้มีมากแล้วก็ตาม", en: "If you measure your worth by money or possessions, you will never feel secure, however much you have." },
    key: { th: "แยกให้ออกว่าอะไรในตัวคุณที่เงินซื้อไม่ได้ แล้วสร้างรายได้จากสิ่งนั้น", en: "Name the qualities in you that money cannot buy, then build your income from them." },
  },
  {
    topic: { th: "การสื่อสารและการเรียนรู้", en: "communication and learning" },
    why: { th: "คุณเรียนรู้ผ่านการพูดคุย การอ่าน และการเชื่อมโยงข้อมูล ความคิดของคุณมีพลังที่สุดเมื่อได้ส่งต่อให้คนอื่น", en: "You learn by talking, reading and connecting ideas, and your thinking is strongest when you pass it on." },
    shadow: { th: "ถ้ารับข้อมูลมากเกินไป ความคิดจะกระจายจนไม่ได้ลงลึกเรื่องใดเลย", en: "Taking in too much information scatters your mind so nothing goes deep." },
    key: { th: "เลือกเรื่องที่อยากรู้จริงสักเรื่องแล้วลงลึก จากนั้นเล่าหรือเขียนให้คนอื่นรู้ด้วย", en: "Pick one subject you truly care about, go deep, then share it by talking or writing." },
  },
  {
    topic: { th: "บ้านและครอบครัว", en: "home and family" },
    why: { th: "รากเหง้าและบ้านเป็นฐานที่ทุกอย่างในชีวิตคุณตั้งอยู่ เรื่องที่ค้างในครอบครัวมักส่งผลกับใจคุณลึกกว่าที่คิด", en: "Your roots and home are the foundation everything else stands on. Unfinished family matters affect you more deeply than you may realise." },
    shadow: { th: "ถ้าติดอยู่กับความปลอดภัยแบบเดิม อาจไม่กล้าออกไปสร้างชีวิตในแบบของตัวเอง", en: "Clinging to familiar safety can stop you from building a life of your own." },
    key: { th: "สร้างที่ที่ใจได้พักจริง จะเป็นบ้านหรือคนที่ไว้ใจก็ได้ แล้วคุณจะออกไปสู้โลกได้เต็มที่", en: "Create somewhere your heart can rest, a place or people you trust, and you can face the world at full strength." },
  },
  {
    topic: { th: "ความรักและการสร้างสรรค์", en: "romance and creativity" },
    why: { th: "คุณต้องการพื้นที่ที่ได้แสดงออก สนุก และสร้างสรรค์โดยไม่ต้องมีเหตุผล หัวใจคุณเติบโตผ่านความรัก งานสร้างสรรค์ และความสุขเรียบง่ายแบบเด็ก", en: "You need space to express yourself, play and create for no reason at all. Your heart grows through love, creative work and simple, childlike joy." },
    shadow: { th: "ถ้าอยากเป็นจุดสนใจหรือรอคำชมมากเกินไป ความสุขจะขึ้นอยู่กับปฏิกิริยาของคนอื่น", en: "If you need attention or applause too much, your joy comes to depend on other people's reactions." },
    key: { th: "ทำสิ่งที่สนุกเพื่อตัวเองอย่างน้อยสัปดาห์ละครั้ง โดยไม่ต้องเก่งหรือมีใครเห็น", en: "Do something fun just for yourself at least once a week, without needing to be good at it or seen." },
  },
  {
    topic: { th: "งานประจำวันและสุขภาพ", en: "daily work and health" },
    why: { th: "คุณรู้สึกมีคุณค่าเมื่อได้ทำงานให้ดีและเป็นประโยชน์กับคนอื่น ชีวิตประจำวันที่เป็นระเบียบคือสิ่งที่ทำให้ใจคุณนิ่ง", en: "You feel worthwhile when you do good, useful work. An orderly daily life is what keeps you steady." },
    shadow: { th: "ถ้าทำงานหนักจนลืมพัก ร่างกายมักเป็นคนเตือนก่อนใจ", en: "If you work without rest, your body usually warns you before your mind does." },
    key: { th: "ดูแลเรื่องนอน กิน และขยับร่างกายให้เท่ากับที่ดูแลงาน", en: "Look after your sleep, food and movement as carefully as you look after your work." },
  },
  {
    topic: { th: "คู่ครองและหุ้นส่วน", en: "partnership" },
    why: { th: "คุณเรียนรู้ตัวเองผ่านคนที่อยู่ตรงข้าม ทั้งคู่ชีวิต หุ้นส่วน และคนที่ร่วมงานใกล้ชิด ความสัมพันธ์คือกระจกที่ชัดที่สุดของคุณ", en: "You come to know yourself through the people opposite you: partners, business partners and close collaborators. Relationships are your clearest mirror." },
    shadow: { th: "ถ้าพึ่งอีกฝ่ายมากเกินไป อาจรู้สึกว่าตัวเองไม่ครบเมื่ออยู่คนเดียว", en: "Leaning on a partner too much can make you feel incomplete on your own." },
    key: { th: "ในความสัมพันธ์ ให้พูดสิ่งที่ต้องการตรง ๆ และเคารพความต้องการของอีกฝ่ายเท่ากัน", en: "In relationships, say plainly what you need, and respect the other person's needs equally." },
  },
  {
    topic: { th: "ความผูกพันลึกและการเปลี่ยนแปลง", en: "intimacy and transformation" },
    why: { th: "คุณไม่พอใจกับความสัมพันธ์แบบผิวเผิน อยากรู้ความจริงที่ลึกที่สุดของคนและของชีวิต และมักเติบโตผ่านช่วงวิกฤตที่เปลี่ยนคุณไปทั้งคน", en: "Surface-level bonds do not satisfy you. You want the deepest truth about people and life, and you tend to grow through crises that change you completely." },
    shadow: { th: "ถ้ากลัวการถูกทำร้าย คุณอาจคุมทุกอย่างไว้แน่น หรือไม่ยอมเปิดใจให้ใครเลย", en: "If you fear being hurt, you may hold everything tightly or let no one in." },
    key: { th: "เลือกคนที่ไว้ใจได้สักคนแล้วค่อย ๆ เปิดใจ และตกลงเรื่องเงินที่ใช้ร่วมกับคนอื่นให้ชัด", en: "Choose one trustworthy person and open up gradually, and keep shared money matters clear." },
  },
  {
    topic: { th: "ความเชื่อและโลกกว้าง", en: "beliefs and the wider world" },
    why: { th: "คุณอยากเข้าใจว่าชีวิตมีความหมายอะไร จึงถูกดึงไปหาการเรียน การเดินทาง ปรัชญา หรือศาสนา โลกกว้างคือที่ที่คุณเติบโตที่สุด", en: "You want to understand what life means, so you are drawn to study, travel, philosophy or faith. The wider world is where you grow the most." },
    shadow: { th: "ถ้ายึดความเชื่อตัวเองแน่นเกินไป อาจกลายเป็นสอนคนอื่นมากกว่าฟัง", en: "Holding your beliefs too tightly can turn you into a preacher rather than a listener." },
    key: { th: "ออกไปเจอสิ่งที่ไม่คุ้นเป็นประจำ ทั้งที่ใหม่ คนใหม่ และความคิดใหม่ แล้วจดสิ่งที่ได้เรียนรู้", en: "Seek out the unfamiliar regularly, new places, people and ideas, and write down what you learn." },
  },
  {
    topic: { th: "งานและชื่อเสียง", en: "career and reputation" },
    why: { th: "คุณอยากสร้างสิ่งที่คนจดจำ และอยากรู้ว่าชีวิตตัวเองมีความหมายต่อโลก งานจึงไม่ใช่แค่ที่หาเงิน แต่เป็นที่ที่คุณใช้ทั้งตัวตน", en: "You want to build something people remember and to know your life matters to the world. Work is not just income for you; it is where you put your whole self." },
    shadow: { th: "ถ้าคุณค่าในตัวเองผูกกับตำแหน่งหรือคำชมทั้งหมด วันที่งานสะดุด ใจจะสะดุดตามไปด้วย", en: "If your self-worth rests entirely on status or praise, your heart stumbles whenever your career does." },
    key: { th: "แยกให้ออกว่าอะไรคือสิ่งที่คุณอยากสร้างจริง และอะไรคือสิ่งที่ทำเพื่อให้คนอื่นยอมรับ", en: "Separate what you truly want to build from what you do only to win approval." },
  },
  {
    topic: { th: "เพื่อนและความฝัน", en: "friends and future hopes" },
    why: { th: "คุณมีพลังที่สุดเมื่ออยู่กับกลุ่มคนที่เชื่อในสิ่งเดียวกัน และอยากมีส่วนสร้างอนาคตที่ดีกว่าให้คนหมู่มาก", en: "You are strongest among people who share your ideals, and you want a hand in building a better future for many." },
    shadow: { th: "ถ้าทุ่มให้กลุ่มหรืออุดมการณ์มากเกินไป อาจห่างจากความรู้สึกของตัวเองและคนใกล้ชิด", en: "Giving too much to a group or a cause can distance you from your own feelings and the people closest to you." },
    key: { th: "เลือกอยู่กับคนที่ทำให้คุณเติบโต และเปลี่ยนความฝันระยะยาวให้เป็นแผนที่ทำได้ในปีนี้", en: "Choose people who help you grow, and turn your long-term hopes into a plan you can act on this year." },
  },
  {
    topic: { th: "โลกภายในและเรื่องเบื้องหลัง", en: "your inner world" },
    why: { th: "พลังของคุณทำงานได้ดีที่สุดเบื้องหลังหรือในความเงียบ คุณรับรู้ความรู้สึกของคนและบรรยากาศได้มากกว่าที่แสดงออก และต้องมีเวลาอยู่กับตัวเอง", en: "Your energy works best behind the scenes or in quiet. You sense far more of people and atmospheres than you show, and you need time alone." },
    shadow: { th: "ถ้าไม่ได้พักใจ คุณจะรับความรู้สึกคนอื่นมาจนเหนื่อยโดยไม่รู้ตัว หรือเก็บความสามารถไว้จนไม่มีใครเห็น", en: "Without rest, you absorb other people's feelings until you are drained, or hide your gifts so no one sees them." },
    key: { th: "กันเวลาเงียบให้ตัวเองทุกวัน และกล้าเอางานที่ทำเบื้องหลังออกมาให้คนเห็นบ้าง", en: "Set aside quiet time every day, and dare to bring your behind-the-scenes work into the light." },
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
    why: { th: "กลางฟ้าคือจุดสูงสุดของผัง ดาวที่อยู่ตรงนี้จึงเป็นสิ่งที่คนเห็นผ่านงานและบทบาทในสังคม และมักชี้ทางอาชีพ", en: "The Midheaven is the highest point of the chart, so a planet here is what people see in your work and public role, and it often points to your career." },
    many: { th: "งานและภาพในสังคมคือเวทีหลักของชีวิตคุณ", en: "Work and public life are the main stage of your life" },
    arena: { th: "งานและภาพในสังคม", en: "work and public life" },
  },
  dsc: {
    why: { th: "จุดตกคือฝั่งของคนอื่น ดาวที่อยู่ตรงนี้มักเห็นชัดผ่านคู่ครอง หุ้นส่วน และคนที่คุณดึงดูดเข้ามา บางครั้งคุณเห็นด้านนี้ในตัวอีกฝ่ายก่อนจะเห็นในตัวเอง", en: "The Descendant is the side of other people. A planet here shows most clearly through partners and the people you attract, and you may see it in them before you see it in yourself." },
    many: { th: "ความสัมพันธ์คือเวทีหลักของชีวิตคุณ", en: "Relationships are the main stage of your life" },
    arena: { th: "คู่และคนใกล้ชิด", en: "partners and close bonds" },
  },
  ic: {
    why: { th: "ก้นฟ้าคือรากของผัง ดาวที่อยู่ตรงนี้ทำงานลึกอยู่ในบ้าน ครอบครัว และโลกส่วนตัว คนภายนอกอาจไม่เห็น แต่มันคือแรงที่หล่อเลี้ยงทุกอย่าง", en: "The IC is the root of the chart. A planet here works deep inside your home, family and private world. Outsiders may not see it, but it feeds everything else." },
    many: { th: "บ้านและโลกส่วนตัวคือฐานพลังของคุณ", en: "Home and your private world are your power base" },
    arena: { th: "บ้านและโลกส่วนตัว", en: "home and private life" },
  },
};

export const ELEMENT_DEPTH: Record<Element, { head: T; strong: T; key: T; missHead: T; miss: T; missKey: T; gift: T }> = {
  fire: {
    head: { th: "คุณขับเคลื่อนด้วยไฟในใจ", en: "You run on inner fire" },
    strong: { th: "คุณมีพลัง กล้าเริ่ม และมักเป็นคนจุดประกายให้คนรอบตัว ความกระตือรือร้นคือเชื้อเพลิงของคุณ แต่ถ้าเร่งตลอดเวลาจะหมดไฟเร็ว หรือเบื่อก่อนงานเสร็จ", en: "You are energetic, bold and often the one who sparks others into action. Enthusiasm is your fuel, but constant pushing burns you out or bores you before the work is done." },
    key: { th: "เลือกทุ่มไฟให้เรื่องที่สำคัญจริงทีละเรื่อง และพักก่อนจะหมดแรง", en: "Pour your fire into one thing that truly matters at a time, and rest before you run dry." },
    missHead: { th: "แรงบันดาลใจคือสิ่งที่คุณต้องตั้งใจจุด", en: "Inspiration is something you have to kindle on purpose" },
    miss: { th: "ไม่มีดาวในธาตุไฟเลย คุณอาจไม่ใช่คนที่ลุกขึ้นมาเริ่มเองได้ทันที และต้องหาแรงบันดาลใจจากภายนอก", en: "With no planets in fire, you may not leap into action on your own, and you may need inspiration from outside." },
    missKey: { th: "ตั้งเป้าเล็ก ๆ ที่ทำสำเร็จได้ไว และขยับร่างกายทุกวัน ไฟจะค่อย ๆ ติดเอง", en: "Set small goals you can win quickly and move your body every day; the fire will catch." },
    gift: { th: "ความกล้าและแรงบันดาลใจ", en: "courage and inspiration" },
  },
  earth: {
    head: { th: "คุณเชื่อในสิ่งที่จับต้องได้", en: "You trust what is tangible" },
    strong: { th: "คุณมองโลกตามความเป็นจริง เชื่อในสิ่งที่เห็นผลได้ และค่อย ๆ สร้างความมั่นคงทีละขั้น คนรอบตัวพึ่งพาคุณได้เพราะคุณทำอย่างที่พูด แต่ถ้ายึดสิ่งที่คุ้นเคยมากเกินไป อาจพลาดโอกาสที่ยังมองไม่เห็นผลทันที", en: "You see the world as it is, trust what produces results and build security step by step. People rely on you because you do what you say, but clinging to the familiar can make you miss chances whose payoff is not yet visible." },
    key: { th: "ลองเปิดรับความคิดใหม่สักเรื่องทุกเดือน แม้ยังไม่เห็นผลทันที", en: "Try one new idea each month, even if the payoff is not yet clear." },
    missHead: { th: "การทำความคิดให้เป็นรูปธรรมคือสิ่งที่ต้องฝึก", en: "Turning ideas into reality takes practice" },
    miss: { th: "ไม่มีดาวในธาตุดินเลย คุณอาจมีความคิดดีมากมาย แต่การลงมือให้เป็นรูปธรรมหรือดูแลเรื่องเงินและร่างกายต้องใช้ความตั้งใจมากกว่าคนอื่น", en: "With no planets in earth, you may have plenty of good ideas, but making them real or looking after money and your body takes more deliberate effort." },
    missKey: { th: "ใช้ตารางเวลา งบประมาณ และรายการสิ่งที่ต้องทำ เป็นตัวช่วยให้ความคิดลงดิน", en: "Use schedules, budgets and to-do lists to bring your ideas down to earth." },
    gift: { th: "การสร้างสิ่งที่จับต้องได้", en: "building tangible things" },
  },
  air: {
    head: { th: "คุณใช้ความคิดนำทาง", en: "You are led by ideas" },
    strong: { th: "คุณคิดเร็ว สื่อสารเก่ง และมองเห็นความเชื่อมโยงที่คนอื่นมองข้าม คุณเข้าใจโลกผ่านการพูดคุยและการแลกเปลี่ยน แต่ถ้าคิดมากเกินไป อาจวิเคราะห์จนไม่ได้ลงมือ หรือห่างจากความรู้สึกของตัวเอง", en: "You think quickly, communicate well and see connections others miss. You understand the world through conversation, but overthinking can stop you from acting or distance you from your own feelings." },
    key: { th: "ทุกความคิดที่ดี ให้ตั้งขั้นแรกที่ทำได้ภายในสัปดาห์นี้", en: "For every good idea, set a first step you can take this week." },
    missHead: { th: "การถอยออกมามองภาพรวมคือสิ่งที่ต้องฝึก", en: "Stepping back to see the whole picture takes practice" },
    miss: { th: "ไม่มีดาวในธาตุลมเลย คุณมักรู้สึกหรือลงมือก่อนแล้วค่อยหาคำอธิบาย และอาจไม่ถนัดถอยออกมามองเรื่องของตัวเองแบบคนนอก", en: "With no planets in air, you tend to feel or act first and find the words later, and stepping back to see your own situation objectively may not come easily." },
    missKey: { th: "เขียนหรือคุยกับคนที่ไว้ใจก่อนตัดสินใจเรื่องใหญ่ จะช่วยให้มองเห็นภาพชัดขึ้น", en: "Write things down or talk them through with someone you trust before big decisions." },
    gift: { th: "ความคิดและการสื่อสาร", en: "ideas and communication" },
  },
  water: {
    head: { th: "คุณใช้ความรู้สึกนำทาง", en: "You are led by feeling" },
    strong: { th: "คุณอ่อนไหว เข้าใจคน และมีสัญชาตญาณสูง มักรู้ว่าอะไรผิดปกติก่อนที่ใครจะพูด และผูกพันกับคนอย่างลึกซึ้ง แต่ถ้าไม่มีขอบเขต คุณจะรับอารมณ์ของคนอื่นมาเป็นของตัวเองจนเหนื่อย", en: "You are sensitive, empathic and intuitive. You often sense something is wrong before anyone says it, and you bond deeply, but without boundaries you absorb other people's moods until you are drained." },
    key: { th: "แยกให้ออกว่าความรู้สึกไหนเป็นของคุณ และความรู้สึกไหนรับมาจากคนอื่น", en: "Learn to tell which feelings are yours and which you have picked up from others." },
    missHead: { th: "การเปิดใจเรื่องความรู้สึกคือสิ่งที่ต้องฝึก", en: "Opening up about feelings takes practice" },
    miss: { th: "ไม่มีดาวในธาตุน้ำเลย คุณอาจไม่ถนัดพูดเรื่องความรู้สึก หรือใช้เหตุผลจัดการเรื่องที่จริง ๆ แล้วต้องการความเข้าใจ", en: "With no planets in water, talking about feelings may not come naturally, and you may reach for logic where understanding is what is needed." },
    missKey: { th: "เปิดใจกับคนใกล้ชิดทีละนิด และถามความรู้สึกของเขาก่อนเสนอทางแก้", en: "Open up to the people close to you a little at a time, and ask how they feel before offering solutions." },
    gift: { th: "ความเข้าใจคนและสัญชาตญาณ", en: "empathy and intuition" },
  },
};

/** ศักดิ์ดาว: หัวข้อแบบภาษาคน (ต่อท้ายคำของดาว) + คำอธิบายศัพท์ + ใช้ให้ดี */
export const DIGNITY_DEPTH: Record<Dignity, { head: T; term: T; flow: T; key: T }> = {
  domicile: {
    head: { th: "อยู่ในที่ที่ถนัดที่สุด", en: "is right at home" },
    term: { th: "ราศีบ้านของดาว", en: "the planet's home sign" },
    flow: { th: "ดาวนี้ครองราศีนี้เอง พลังจึงไหลเป็นธรรมชาติ และเป็นทรัพยากรที่คุณพึ่งได้เสมอ", en: "This planet rules the sign, so its energy flows naturally and is a resource you can always rely on." },
    key: { th: "ใช้ด้านนี้เป็นหลักยึดเวลาเรื่องอื่นในชีวิตไม่แน่นอน", en: "Lean on this side of you when other parts of life feel uncertain." },
  },
  exaltation: {
    head: { th: "โดดเด่นเป็นพิเศษ", en: "shines especially bright" },
    term: { th: "ราศีที่ดาวมีกำลังสูง", en: "the sign where the planet is strongest" },
    flow: { th: "ราศีนี้ยกพลังของดาวนี้ให้สูงขึ้น ด้านนี้จึงมักโดดเด่นจนคนอื่นสังเกตเห็นและชื่นชม", en: "This sign lifts the planet's power, so this side of you often stands out and draws admiration." },
    key: { th: "ใช้ด้านนี้เปิดประตู แต่อย่าให้คำชมเป็นเหตุผลเดียวที่ทำให้คุณทำต่อ", en: "Use this gift to open doors, but do not let praise become your only reason to keep going." },
  },
  detriment: {
    head: { th: "ต้องใช้ในแบบที่ไม่คุ้นเคย", en: "works in an unfamiliar way" },
    term: { th: "ราศีตรงข้ามบ้านของดาว", en: "opposite the planet's home" },
    flow: { th: "คุณจึงอาจใช้ด้านนี้ต่างจากคนส่วนใหญ่ และบางครั้งรู้สึกว่ามันไม่ลงตัว แต่สิ่งที่ต้องปรับตัวมากมักสอนคุณได้มากที่สุด", en: "So you may use this side of you differently from most people and sometimes feel it does not fit, but what demands the most adjustment often teaches you the most." },
    key: { th: "หาวิธีใช้ด้านนี้ในแบบของคุณเอง ไม่ต้องเลียนแบบวิธีที่ได้ผลกับคนอื่น", en: "Find your own way of using this side of you rather than copying what works for others." },
  },
  fall: {
    head: { th: "คือเรื่องที่ต้องฝึกมากกว่าคนอื่น", en: "takes more practice than most" },
    term: { th: "ราศีที่ดาวอ่อนกำลัง", en: "the sign where the planet is weakest" },
    flow: { th: "คุณจึงอาจไม่มั่นใจในด้านนี้ หรือต้องพยายามมากกว่าคนอื่นกว่าจะใช้ได้คล่อง ข่าวดีคือสิ่งที่ฝึกจนเป็นมักกลายเป็นจุดแข็งที่ลึกกว่าของที่ได้มาง่าย", en: "So you may feel unsure here, or need more effort than others to use it well. The good news is that what you master through practice often becomes a deeper strength than what comes easily." },
    key: { th: "ให้เวลากับด้านนี้ และอย่าเทียบตัวเองกับคนที่ทำได้ง่ายกว่า", en: "Give this side of you time, and do not compare yourself with people for whom it comes easily." },
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
      core: { th: "คุณคิดเร็ว พูดตรง และตัดสินใจไว ชอบถกเพื่อหาคำตอบมากกว่าเพื่อเอาชนะ และมักเป็นคนแรกที่กล้าพูดสิ่งที่คนอื่นคิดอยู่ในใจ", en: "You think fast, speak directly and decide quickly. You debate to find answers rather than to win, and you are often the first to say what others are only thinking." },
      edge: { th: "ถ้าใจร้อน คำพูดจะแรงกว่าที่ตั้งใจ ลองหายใจสักครั้งก่อนตอบเรื่องที่สำคัญ", en: "When impatient, your words land harder than you meant. Take a breath before answering anything important." },
    },
    {
      head: { th: "คิดช้าแต่ลึก พูดน้อยแต่หนักแน่น", en: "Slow, deep thinking; few but weighty words" },
      core: { th: "คุณคิดช้าแต่ลึกและแม่น เชื่อในสิ่งที่พิสูจน์ได้ เมื่อเข้าใจอะไรแล้วจะจำได้นาน และพูดน้อยแต่มีน้ำหนัก", en: "You think slowly but deeply and accurately. You trust what can be proven, remember what you learn for a long time, and speak little but with weight." },
      edge: { th: "ถ้ายึดความคิดเดิมแน่นเกินไป อาจปิดรับข้อมูลใหม่ที่ช่วยคุณได้", en: "Holding too tightly to your views can shut out new information that would help you." },
    },
    {
      head: { th: "สมองไว อยากรู้ไปหมด คุยได้กับทุกคน", en: "A quick, curious mind that talks with anyone" },
      core: { th: "สมองคุณไวและอยากรู้ไปหมด เชื่อมเรื่องที่ดูไม่เกี่ยวกันได้เก่ง คุยได้กับทุกคน และเรียนรู้เร็วที่สุดเมื่อได้แลกเปลี่ยน", en: "Your mind is quick and curious about everything. You connect unrelated ideas, can talk with anyone and learn fastest through conversation." },
      edge: { th: "ถ้าสนใจหลายเรื่องพร้อมกัน อาจรู้กว้างแต่ไม่ลึก เลือกบางเรื่องให้ลงลึกจริง", en: "Chasing many interests at once can leave you broad but shallow. Choose a few things to go deep in." },
    },
    {
      head: { th: "คิดด้วยใจ จำทุกอย่างผ่านความรู้สึก", en: "Thinks with the heart, remembers through feelings" },
      core: { th: "คุณคิดด้วยใจ จำเรื่องราวผ่านความรู้สึก และอ่านอารมณ์ที่ซ่อนอยู่หลังคำพูดได้แม่น คำพูดของคุณอบอุ่นและทำให้คนรู้สึกปลอดภัย", en: "You think with your heart, remember things through feelings and read the emotion behind words accurately. Your words are warm and make people feel safe." },
      edge: { th: "ถ้าเก็บคำพูดของคนอื่นมาคิดเป็นเรื่องส่วนตัวทุกครั้ง ใจจะเหนื่อย ลองแยกข้อเท็จจริงออกจากความรู้สึก", en: "Taking every comment personally wears you out. Try separating the facts from the feelings." },
    },
    {
      head: { th: "พูดอย่างมั่นใจ เล่าเรื่องเก่ง", en: "Speaks with confidence, a natural storyteller" },
      core: { th: "คุณพูดอย่างมั่นใจ มีสีสัน และเล่าเรื่องเก่ง ความคิดของคุณมีพลังที่สุดเมื่อได้แสดงต่อหน้าคน และคุณอยากให้ความคิดของตัวเองได้รับการยอมรับ", en: "You speak with confidence and colour and tell stories well. Your ideas come alive in front of people, and you want them to be recognised." },
      edge: { th: "ถ้ายึดความคิดตัวเองเป็นศักดิ์ศรี จะฟังคำแย้งยาก ลองมองว่าการเปลี่ยนใจคือความกล้าอีกแบบ", en: "If your ideas become a matter of pride, criticism is hard to hear. Changing your mind can be its own kind of courage." },
    },
    {
      head: { th: "คิดเป็นระบบ ละเอียด เห็นจุดที่คนอื่นพลาด", en: "Systematic and precise, spots what others miss" },
      core: { th: "คุณคิดเป็นระบบ ละเอียด และเห็นจุดที่คนอื่นมองข้าม ถนัดแยกแยะ วิเคราะห์ และทำเรื่องยุ่งยากให้ใช้งานได้จริง", en: "You think systematically, notice what others miss, and are skilled at sorting, analysing and making complicated things workable." },
      edge: { th: "ถ้าจับผิดตัวเองหรือคนอื่นมากเกินไป จะกังวลไม่จบ บางงานแค่ดีพอก็พอแล้ว", en: "Too much fault-finding, in yourself or others, keeps you worrying. Some work only needs to be good enough." },
    },
    {
      head: { th: "มองทุกด้าน พูดนุ่มนวล เจรจาเก่ง", en: "Sees every side, speaks gracefully, negotiates well" },
      core: { th: "คุณคิดแบบมองทุกด้าน ฟังเหตุผลของทุกฝ่าย และพูดอย่างนุ่มนวลจนคนยอมรับได้ง่าย เป็นคนไกล่เกลี่ยและเจรจาโดยธรรมชาติ", en: "You see every side, listen to everyone's reasons and speak so gracefully that people accept your view easily. You are a natural mediator and negotiator." },
      edge: { th: "ถ้าชั่งน้ำหนักนานเกินไป จะตัดสินใจไม่ได้ ลองตั้งเส้นตายให้ตัวเอง", en: "Weighing things too long leaves you unable to decide. Give yourself deadlines." },
    },
    {
      head: { th: "คิดลึก มองทะลุสิ่งที่คนซ่อนไว้", en: "A deep thinker who sees what people hide" },
      core: { th: "คุณคิดลึกและมองทะลุสิ่งที่คนพูดไปถึงสิ่งที่เขาซ่อน ชอบค้นหาความจริง และเก็บความลับได้ดีเยี่ยม", en: "You think deeply and see past what people say to what they hide. You love uncovering the truth and keep secrets extremely well." },
      edge: { th: "ถ้าระแวงจนไม่เชื่อใครเลย จะเหนื่อยกับการอ่านใจคนตลอดเวลา บางครั้งถามตรง ๆ ง่ายกว่า", en: "If suspicion stops you trusting anyone, constantly reading minds becomes exhausting. Sometimes asking directly is easier." },
    },
    {
      head: { th: "คิดภาพใหญ่ พูดตรงแบบมีอารมณ์ขัน", en: "Big-picture thinker, frank and funny" },
      core: { th: "คุณคิดภาพใหญ่ สนใจความหมายและปรัชญามากกว่ารายละเอียด พูดตรงไปตรงมาแบบมีอารมณ์ขัน และสอนคนได้เก่ง", en: "You think in big pictures and care more about meaning than detail. You speak frankly with humour and make a good teacher." },
      edge: { th: "ถ้ามองแต่ภาพใหญ่ อาจพูดเกินจริงหรือพลาดรายละเอียดสำคัญ ตรวจข้อเท็จจริงก่อนสรุป", en: "Seeing only the big picture can lead you to exaggerate or miss key details. Check the facts before concluding." },
    },
    {
      head: { th: "คิดอย่างมีแผน ใช้เหตุผล มองระยะยาว", en: "Planned, logical, long-term thinking" },
      core: { th: "คุณคิดอย่างมีแผน ใช้เหตุผล และมองผลระยะยาว พูดน้อยแต่ชัด และเชื่อในความรู้ที่ใช้ได้จริงมากกว่าทฤษฎี", en: "You think in plans, use logic and look at long-term consequences. You speak little but clearly and value practical knowledge over theory." },
      edge: { th: "ถ้ามองทุกอย่างจริงจังเกินไป อาจมองโลกในแง่ร้ายหรือเครียดก่อนเรื่องจะเกิด", en: "Taking everything too seriously can make you pessimistic or anxious before anything has happened." },
    },
    {
      head: { th: "คิดล้ำ เป็นอิสระ เห็นทางใหม่ก่อนใคร", en: "Original and independent, sees new ways first" },
      core: { th: "คุณคิดล้ำ เป็นอิสระ และมองเห็นวิธีใหม่ที่คนอื่นยังนึกไม่ถึง ชอบแลกเปลี่ยนความคิดกับคนหลากหลาย และใช้เหตุผลนำอารมณ์", en: "You think ahead, independently, and see new methods before others imagine them. You enjoy swapping ideas with all kinds of people and lead with reason over emotion." },
      edge: { th: "ถ้ามั่นใจในความคิดตัวเองเกินไป อาจกลายเป็นดื้อเงียบ ลองฟังคนที่เห็นต่างให้จบก่อนตอบ", en: "Too much certainty can turn into quiet stubbornness. Hear people who disagree all the way through before replying." },
    },
    {
      head: { th: "คิดเป็นภาพ จินตนาการสูง เข้าใจสิ่งที่ไม่ได้พูด", en: "Thinks in images, imaginative, hears the unsaid" },
      core: { th: "คุณคิดเป็นภาพและความรู้สึก มีจินตนาการสูง เข้าใจสิ่งที่ไม่ได้พูดออกมา และสื่อสารผ่านศิลปะ ดนตรี หรือเรื่องเล่าได้ดี", en: "You think in images and feelings, with a vivid imagination. You understand what goes unsaid and communicate well through art, music or story." },
      edge: { th: "ถ้าความคิดลอยเกินไป รายละเอียดและกำหนดเวลาจะหลุดมือ จดเรื่องสำคัญไว้เสมอ", en: "When your mind drifts, details and deadlines slip away. Always write the important things down." },
    },
  ],
  venus: [
    {
      head: { th: "รักตรงไปตรงมาและร้อนแรง", en: "Loves directly and passionately" },
      core: { th: "คุณรักแบบตรงไปตรงมาและร้อนแรง ถ้าชอบใครจะแสดงออกก่อน ชอบความตื่นเต้นของการไล่ตาม และต้องการคู่ที่มีชีวิตชีวาพอกับคุณ", en: "You love directly and passionately. If you like someone, you make the first move. You enjoy the thrill of the chase and need a partner as lively as you." },
      edge: { th: "ความรักที่เริ่มเร็วอาจหมดไฟเร็ว เมื่อความตื่นเต้นแรกผ่านไป ลองหาความท้าทายใหม่ร่วมกันแทนการมองหาคนใหม่", en: "Love that starts fast can burn out fast. When the first thrill fades, look for new challenges together instead of someone new." },
    },
    {
      head: { th: "รักมั่นคง แสดงออกผ่านการดูแลและสัมผัส", en: "Loves steadily, through care and touch" },
      core: { th: "คุณรักอย่างมั่นคง ซื่อสัตย์ และแสดงความรักผ่านการดูแล อาหาร สัมผัส และของที่จับต้องได้ คุณให้คุณค่ากับความสบายและความสวยงามที่ยั่งยืน", en: "You love steadily and loyally, showing it through care, food, touch and tangible gifts. You value lasting comfort and beauty." },
      edge: { th: "ถ้ากลัวการเปลี่ยนแปลง อาจยึดคนหรือของไว้นานเกินกว่าที่ดีต่อตัวเอง", en: "Fear of change can make you hold on to people or things for longer than is good for you." },
    },
    {
      head: { th: "ตกหลุมรักทางความคิดก่อน รักแบบขี้เล่น", en: "Falls for the mind first, loves playfully" },
      core: { th: "คุณตกหลุมรักทางความคิดก่อน คนที่คุยสนุก ทำให้หัวเราะ และมีเรื่องใหม่มาคุยเสมอจะชนะใจคุณ ความรักของคุณเบาสบาย ขี้เล่น และต้องการพื้นที่หายใจ", en: "You fall in love through the mind first. Someone who is fun to talk to, makes you laugh and always has something new to say wins your heart. Your love is light, playful and needs room to breathe." },
      edge: { th: "ถ้าคุณถอยออกมาทุกครั้งที่ความสัมพันธ์เริ่มลึก ลองถามตัวเองว่ากลัวความจำเจ หรือกลัวความใกล้ชิด", en: "If you pull back whenever things deepen, ask yourself whether you fear boredom or closeness." },
    },
    {
      head: { th: "รักแบบดูแลและปกป้อง อยากมีบ้านร่วมกัน", en: "Loves by caring and protecting" },
      core: { th: "คุณรักแบบดูแลและปกป้อง อยากสร้างบ้านและความรู้สึกปลอดภัยร่วมกัน และจำรายละเอียดเล็ก ๆ ของคนที่รักได้เสมอ", en: "You love by caring and protecting. You want to build a home and a feeling of safety together, and you always remember the little things about the people you love." },
      edge: { th: "ถ้ากลัวถูกทิ้ง อาจเก็บความน้อยใจไว้แทนการพูดตรง ๆ ความต้องการที่พูดออกมาได้รับการตอบสนองง่ายกว่า", en: "Fear of being left can make you sulk instead of speaking up. Needs that are said out loud are far easier to meet." },
    },
    {
      head: { th: "รักเต็มหัวใจ ใจกว้าง อยากให้ความรักพิเศษ", en: "Loves wholeheartedly and generously" },
      core: { th: "คุณรักอย่างเต็มหัวใจ ใจกว้าง และอยากให้ความรักเป็นเรื่องพิเศษ ชอบทำให้คนรักรู้สึกเป็นคนสำคัญที่สุด และอยากได้รับการชื่นชมแบบเดียวกัน", en: "You love wholeheartedly and generously, and want love to feel special. You make your partner feel like the most important person, and want to be admired the same way." },
      edge: { th: "ถ้าอีกฝ่ายไม่แสดงออกเท่าคุณ อาจรู้สึกว่าไม่มีค่า ลองดูความรักในแบบที่เขาถนัดด้วย", en: "If your partner is less expressive, you may feel unvalued. Learn to see love in the way they naturally show it." },
    },
    {
      head: { th: "แสดงความรักผ่านการกระทำและการใส่ใจ", en: "Shows love through acts of care" },
      core: { th: "คุณแสดงความรักผ่านการกระทำ ช่วยเหลือ ใส่ใจรายละเอียด และทำให้ชีวิตของคนที่รักง่ายขึ้น ความรักของคุณเงียบแต่จริงใจและพึ่งพาได้", en: "You show love through action: helping, noticing details and making life easier for the people you love. Your love is quiet but sincere and dependable." },
      edge: { th: "ถ้ามาตรฐานสูงเกินไป อาจติจนอีกฝ่ายรู้สึกว่าไม่ดีพอ หรือคุณเองรู้สึกว่าไม่คู่ควร", en: "Standards that are too high can make you critical until your partner feels not good enough, or you feel unworthy yourself." },
    },
    {
      head: { th: "รักความสมดุลและความสัมพันธ์ที่เท่าเทียม", en: "Loves balance and true partnership" },
      core: { th: "คุณรักความสวยงาม ความสมดุล และความสัมพันธ์ที่เป็นหุ้นส่วนกันจริง มีเสน่ห์ เข้าสังคมเก่ง และใส่ใจความรู้สึกของอีกฝ่ายเป็นพิเศษ", en: "You love beauty, balance and true partnership. You are charming, sociable and especially attentive to your partner's feelings." },
      edge: { th: "ถ้าเลี่ยงความขัดแย้งทุกครั้ง ความต้องการของคุณจะค่อย ๆ หายไป ความสัมพันธ์ที่ดีทนการพูดตรงได้", en: "Avoiding every conflict slowly erases your own needs. A good relationship can handle honesty." },
    },
    {
      head: { th: "รักลึก เข้มข้น และทุ่มทั้งหัวใจ", en: "Loves deeply, intensely, all in" },
      core: { th: "คุณรักลึก เข้มข้น และทุ่มทั้งหัวใจ ไม่สนความสัมพันธ์ผิวเผิน ต้องการความไว้ใจและความจริงใจเต็มร้อย และเมื่อรักแล้วซื่อสัตย์มาก", en: "You love deeply, intensely and with your whole heart. Shallow relationships do not interest you; you need total trust and honesty, and once committed you are deeply loyal." },
      edge: { th: "ถ้ากลัวการถูกหักหลัง อาจหึงหวงหรือปิดใจจนอีกฝ่ายเข้าไม่ถึง", en: "Fear of betrayal can make you jealous or so guarded that your partner cannot reach you." },
    },
    {
      head: { th: "รักอิสระ อยากเติบโตและผจญภัยไปด้วยกัน", en: "Loves freedom and shared adventure" },
      core: { th: "คุณรักอิสระและการผจญภัย ความรักที่ดีสำหรับคุณคือการได้เติบโต เดินทาง และเรียนรู้โลกไปด้วยกัน คุณรักแบบเปิดเผย ร่าเริง และจริงใจ", en: "You love freedom and adventure. Good love, for you, means growing, travelling and learning about the world together. You love openly, cheerfully and honestly." },
      edge: { th: "ถ้ารู้สึกว่าถูกผูกมัด อาจถอยออกมาก่อน ลองมองหาคนที่ให้ทั้งความมั่นคงและพื้นที่ไปพร้อมกัน", en: "Feeling tied down can make you back away. Look for someone who offers both stability and room to roam." },
    },
    {
      head: { th: "รักจริงจัง มองระยะยาว แสดงด้วยความรับผิดชอบ", en: "Loves seriously and for the long term" },
      core: { th: "คุณรักอย่างจริงจังและมองระยะยาว แสดงความรักผ่านความรับผิดชอบและการสร้างอนาคตร่วมกันมากกว่าคำหวาน และให้คุณค่ากับความมั่นคงที่พิสูจน์ได้ด้วยเวลา", en: "You love seriously and for the long term. You show love through commitment and building a future together more than sweet words, and you value stability that is proven over time." },
      edge: { th: "ถ้าระวังตัวมากเกินไป คนอื่นอาจไม่รู้ว่าคุณรู้สึกอย่างไร ลองแสดงความอ่อนโยนให้เห็นบ้าง", en: "Being too guarded can leave people unsure how you feel. Let your tenderness show now and then." },
    },
    {
      head: { th: "รักแบบเพื่อนที่เข้าใจกัน ต้องการพื้นที่ส่วนตัว", en: "Loves like a best friend, needs space" },
      core: { th: "คุณรักแบบเพื่อนที่เข้าใจกัน ต้องการคู่ที่เคารพความเป็นตัวของตัวเอง คุยกันได้ทุกเรื่อง และไม่พยายามเปลี่ยนคุณ ความรักของคุณไม่เหมือนใครและไม่ชอบกรอบ", en: "You love like a best friend. You need a partner who respects your individuality, can talk about anything and does not try to change you. Your way of loving is unconventional and dislikes rules." },
      edge: { th: "ถ้ารักษาระยะห่างทางใจมากเกินไป อีกฝ่ายอาจรู้สึกว่าเข้าไม่ถึง ความใกล้ชิดไม่ได้แปลว่าต้องเสียอิสระ", en: "Keeping too much emotional distance can leave your partner feeling shut out. Closeness does not have to cost you your freedom." },
    },
    {
      head: { th: "รักโรแมนติก อ่อนโยน และพร้อมเสียสละ", en: "Loves romantically, tenderly, selflessly" },
      core: { th: "คุณรักแบบโรแมนติก อ่อนโยน และพร้อมเสียสละ มองเห็นด้านดีในตัวคนที่รักเสมอ และรักได้โดยไม่มีเงื่อนไข", en: "You love romantically, tenderly and selflessly. You always see the best in the people you love and love without conditions." },
      edge: { th: "ถ้ามองคนรักดีกว่าความจริง อาจให้มากเกินไปจนลืมดูแลตัวเอง ความรักที่ดีต้องมีขอบเขตด้วย", en: "Seeing a partner as better than they are can lead you to give too much and forget yourself. Healthy love needs boundaries too." },
    },
  ],
  mars: [
    {
      head: { th: "ลงมือเร็ว กล้าเริ่มก่อนใคร", en: "Acts fast, dares to go first" },
      core: { th: "คุณมีพลังมาก ตัดสินใจเร็ว และชอบเป็นคนเริ่ม เจออุปสรรคแล้วยิ่งฮึด เหมาะกับงานที่ต้องใช้ความกล้าและความเร็ว", en: "You have abundant energy, decide fast and love to be the one who starts. Obstacles fire you up, and you suit work that needs courage and speed." },
      edge: { th: "ไฟที่แรงอาจมอดเร็วหรือปะทุเป็นความโกรธ ฝึกทำต่อให้จบหลังความตื่นเต้นแรกผ่านไป", en: "A strong flame can burn out fast or flare into anger. Practise finishing what you start once the first rush fades." },
    },
    {
      head: { th: "ลงมือช้าแต่หนักแน่น ไม่ยอมแพ้", en: "Slow to start, hard to stop" },
      core: { th: "คุณลงมือช้าแต่หนักแน่นและไม่ยอมแพ้ เมื่อตั้งใจแล้วจะทำไปเรื่อย ๆ จนสำเร็จ และอดทนได้มากกว่าคนส่วนใหญ่", en: "You start slowly but firmly and do not give up. Once decided, you keep going until it is done, with more stamina than most." },
      edge: { th: "ถ้าถูกบังคับให้เร่ง คุณจะยิ่งดื้อ และเมื่อโกรธจริงจะหายช้า", en: "Being pushed to hurry makes you dig in, and when you finally get angry, it lasts." },
    },
    {
      head: { th: "ลงมือด้วยไหวพริบและคำพูด", en: "Acts through wit and words" },
      core: { th: "คุณลงมือด้วยความคิดและคำพูด ทำหลายอย่างพร้อมกันได้ ไหวพริบดี และใช้การเจรจาแก้ปัญหาแทนการปะทะ", en: "You act through ideas and words, handle many things at once, think on your feet and solve problems by talking rather than fighting." },
      edge: { th: "ถ้ากระจายพลังไปหลายเรื่อง อาจเริ่มเยอะแต่จบน้อย เลือกเรื่องสำคัญให้ทำจนเสร็จก่อน", en: "Spreading your energy thin can mean starting a lot and finishing little. Complete the important things first." },
    },
    {
      head: { th: "สู้สุดตัวเพื่อปกป้องคนที่รัก", en: "Fights hardest for the people you love" },
      core: { th: "คุณลงมือเพราะใจ และสู้สุดตัวเมื่อต้องปกป้องคนที่รักหรือบ้าน แรงขับของคุณขึ้นลงตามอารมณ์และความรู้สึกปลอดภัย", en: "You act from the heart and fight hardest to protect the people you love or your home. Your drive rises and falls with your mood and sense of safety." },
      edge: { th: "ถ้าเก็บความโกรธไว้ อาจออกมาเป็นการประชดหรือเงียบใส่ ลองบอกตรง ๆ ว่าอะไรทำให้ไม่พอใจ", en: "Bottled-up anger may come out as sarcasm or silence. Say plainly what upset you." },
    },
    {
      head: { th: "ลงมืออย่างมั่นใจแบบผู้นำ", en: "Acts with a leader's confidence" },
      core: { th: "คุณลงมืออย่างมั่นใจ มีพลังแบบผู้นำ และทำงานได้ดีที่สุดเมื่อได้แสดงฝีมือและได้รับการยอมรับ ความกล้าและความใจกว้างทำให้คนอยากตาม", en: "You act with confidence and a leader's energy, and work best when you can show your skill and be recognised. Your courage and generosity make people want to follow." },
      edge: { th: "ถ้าศักดิ์ศรีถูกแตะ อาจสู้เพื่อชนะมากกว่าสู้เพื่อสิ่งที่ถูก", en: "When your pride is hurt, you may fight to win rather than for what is right." },
    },
    {
      head: { th: "ลงมืออย่างแม่นยำและมีแผน", en: "Acts precisely, with a plan" },
      core: { th: "คุณลงมืออย่างแม่นยำ มีแผน และใส่ใจทุกรายละเอียด ทำงานหนักได้นาน และมีพลังที่สุดเมื่อได้แก้ปัญหาที่จับต้องได้", en: "You act precisely, with a plan and attention to every detail. You can work hard for a long time, and your energy is at its best solving practical problems." },
      edge: { th: "ถ้ากังวลว่าจะไม่สมบูรณ์แบบ อาจไม่เริ่มสักที หรือหงุดหงิดกับความผิดพลาดเล็กน้อยของคนอื่น", en: "Worrying about perfection can stop you from starting, or make you irritated by other people's small mistakes." },
    },
    {
      head: { th: "ทำได้ดีที่สุดเมื่อมีทีมหรือคู่", en: "At your best working with others" },
      core: { th: "คุณลงมือได้ดีที่สุดเมื่อมีคู่หรือทีม ชอบความยุติธรรม สู้เพื่อคนอื่นได้ดีกว่าสู้เพื่อตัวเอง และเลือกเจรจามากกว่าปะทะ", en: "You act best with a partner or team. You care about fairness, fight better for others than for yourself, and prefer negotiation to confrontation." },
      edge: { th: "ถ้าลังเลเพราะกลัวคนไม่พอใจ ความโกรธจะสะสมเงียบ ๆ ยอมขัดแย้งบ้างเพื่อสิ่งที่คุณต้องการ", en: "Hesitating so no one is upset lets anger build quietly. Accept some conflict for what you want." },
    },
    {
      head: { th: "มุ่งมั่น เข้มข้น และไม่ยอมแพ้", en: "Intense, focused, unyielding" },
      core: { th: "คุณมีพลังเข้มข้น มุ่งมั่น และไม่ยอมแพ้ ทำทีละเรื่องแต่ทำถึงที่สุด และมีพลังที่สุดในยามวิกฤต", en: "Your energy is intense, focused and unyielding. You work on one thing at a time, all the way, and you are at your most powerful in a crisis." },
      edge: { th: "ถ้าเก็บความโกรธหรือความแค้นไว้ จะกัดกินใจตัวเอง การปล่อยวางคือพลังอีกแบบ", en: "Holding on to anger or grudges eats away at you. Letting go is another kind of strength." },
    },
    {
      head: { th: "ลงมือด้วยไฟและความเชื่อ", en: "Acts with fire and conviction" },
      core: { th: "คุณลงมือด้วยความกระตือรือร้นและความเชื่อ พลังดีที่สุดเมื่อมีเป้าหมายที่มีความหมาย และชอบการผจญภัย การเดินทาง และการเรียนรู้สิ่งใหม่", en: "You act with enthusiasm and conviction, and your energy peaks with a meaningful goal. You love adventure, travel and learning new things." },
      edge: { th: "ถ้าเบื่อเร็ว อาจทิ้งงานไว้กลางทาง หรือรับปากเกินแรงที่มี", en: "Getting bored quickly can leave work half done, or lead you to promise more than you can deliver." },
    },
    {
      head: { th: "มีวินัย ไต่ขึ้นทีละขั้นจนถึงยอด", en: "Disciplined, climbs step by step" },
      core: { th: "คุณลงมืออย่างมีวินัย มีแผน และมองเป้าหมายระยะยาว ทำงานหนักได้ คุมพลังตัวเองได้ดี และไต่ขึ้นทีละขั้นจนถึงจุดสูงสุด", en: "You act with discipline, planning and long-term goals. You work hard, control your energy well and climb step by step to the top." },
      edge: { th: "ถ้าวัดตัวเองจากผลงานอย่างเดียว อาจทำงานจนลืมพักหรือลืมความสุขระหว่างทาง", en: "If you measure yourself only by results, you may work without rest and forget to enjoy the journey." },
    },
    {
      head: { th: "ลงมือในแบบของตัวเอง ไม่ชอบถูกสั่ง", en: "Acts your own way, dislikes orders" },
      core: { th: "คุณลงมือในแบบของตัวเอง ไม่ชอบถูกสั่ง และมีพลังที่สุดเมื่อได้ทำเพื่อแนวคิดหรือกลุ่มคนที่เชื่อในสิ่งเดียวกัน ถนัดหาวิธีใหม่ที่ยังไม่มีใครลอง", en: "You act in your own way, dislike being told what to do and are most energised working for an idea or a group that shares your values. You find new methods nobody has tried." },
      edge: { th: "ถ้าต่อต้านกฎทุกข้อ อาจเสียแรงสู้ในเรื่องที่ไม่จำเป็น เลือกสู้เฉพาะเรื่องที่สำคัญจริง", en: "Rebelling against every rule wastes energy on needless fights. Pick only the battles that truly matter." },
    },
    {
      head: { th: "ลงมือตามแรงบันดาลใจและความรู้สึก", en: "Acts on inspiration and feeling" },
      core: { th: "คุณลงมือตามความรู้สึกและแรงบันดาลใจ มีพลังมากเมื่อได้ช่วยคนอื่นหรือทำงานสร้างสรรค์ และมักไปถึงเป้าหมายด้วยการไหลตามจังหวะมากกว่าการบุกตรง", en: "You act on feeling and inspiration, with the most energy when helping others or creating. You often reach your goals by going with the flow rather than charging ahead." },
      edge: { th: "ถ้าเลี่ยงการเผชิญหน้า ความโกรธอาจกลายเป็นความเหนื่อยที่ไม่รู้สาเหตุ เป้าหมายที่ชัดช่วยให้พลังไม่กระจาย", en: "Avoiding confrontation can turn anger into unexplained tiredness. Clear goals keep your energy from scattering." },
    },
  ],
  jupiter: [
    {
      head: { th: "โอกาสมาจากความกล้าเริ่มก่อน", en: "Luck comes from going first" },
      core: { th: "โอกาสของคุณมาจากความกล้าเริ่มก่อน คุณเติบโตเมื่อได้บุกเบิก ลองสิ่งใหม่ และเชื่อมั่นในตัวเอง", en: "Your opportunities come from daring to go first. You grow by pioneering, trying new things and believing in yourself." },
      edge: { th: "ระวังความมั่นใจกลายเป็นความประมาท หรือรีบคว้าทุกโอกาสโดยไม่อ่านรายละเอียด", en: "Beware of confidence turning into recklessness, or grabbing every chance without reading the details." },
    },
    {
      head: { th: "โอกาสงอกงามช้าแต่มั่นคง", en: "Growth that is slow but solid" },
      core: { th: "โอกาสของคุณงอกงามช้าแต่มั่นคง คุณเติบโตผ่านการสะสมทั้งเงิน ทักษะ และความสัมพันธ์ที่ยืนยาว และมักมีโชคกับทรัพย์สินที่จับต้องได้", en: "Your opportunities grow slowly but surely. You prosper by accumulating money, skills and lasting relationships, and often have luck with tangible assets." },
      edge: { th: "ระวังสบายจนไม่อยากขยับ หรือใช้จ่ายเพื่อความสุขเกินตัว", en: "Beware of getting so comfortable you stop moving, or overspending on pleasure." },
    },
    {
      head: { th: "โอกาสมาจากการพูดคุยและเครือข่าย", en: "Luck through conversation and networks" },
      core: { th: "โอกาสของคุณมาจากการพูดคุย การเรียนรู้ และเครือข่าย ยิ่งรู้จักคนมากและรู้หลายเรื่อง ประตูใหม่ก็ยิ่งเปิด", en: "Your opportunities come through conversation, learning and networks. The more people you know and the more you learn, the more doors open." },
      edge: { th: "ระวังรู้กว้างจนไม่ได้ลงลึก หรือรับข้อมูลมากจนตัดสินใจไม่ได้", en: "Beware of knowing a little about everything and nothing in depth, or drowning decisions in information." },
    },
    {
      head: { th: "โอกาสมาจากความอบอุ่นและครอบครัว", en: "Luck through warmth and family" },
      core: { th: "โอกาสของคุณมาจากความอบอุ่นและการดูแลคน คุณเติบโตผ่านครอบครัว บ้าน และคนที่ไว้ใจ และมักได้รับความช่วยเหลือเมื่อคุณช่วยคนอื่นก่อน", en: "Your opportunities come from warmth and caring for others. You grow through family, home and trusted people, and help tends to come when you help first." },
      edge: { th: "ระวังปกป้องคนที่รักมากเกินไป หรือติดอยู่กับความปลอดภัยแบบเดิม", en: "Beware of over-protecting the people you love, or staying stuck in familiar safety." },
    },
    {
      head: { th: "โอกาสมาเมื่อกล้าแสดงตัว", en: "Luck comes when you dare to be seen" },
      core: { th: "โอกาสของคุณมาเมื่อคุณกล้าแสดงตัว ความใจกว้างและความคิดสร้างสรรค์ทำให้คนอยากสนับสนุน และคุณเติบโตเมื่อได้นำหรือได้อยู่บนเวที", en: "Your opportunities arrive when you dare to be seen. Your generosity and creativity make people want to back you, and you grow by leading or being on stage." },
      edge: { th: "ระวังอยากได้การยอมรับจนทำเกินตัว หรือใจกว้างเกินกำลัง", en: "Beware of overreaching for applause, or being generous beyond your means." },
    },
    {
      head: { th: "โอกาสมาจากฝีมือและความใส่ใจ", en: "Luck through skill and care" },
      core: { th: "โอกาสของคุณมาจากฝีมือและความใส่ใจในรายละเอียด คุณเติบโตผ่านงานที่ทำได้ดีขึ้นทุกวัน และการช่วยแก้ปัญหาให้คนอื่น", en: "Your opportunities come from skill and attention to detail. You grow through work you keep improving and by solving problems for others." },
      edge: { th: "ระวังมองแต่จุดเล็กจนพลาดภาพใหญ่ หรือรู้สึกว่าตัวเองยังไม่พร้อมเสียที", en: "Beware of focusing on small things and missing the big picture, or never feeling ready." },
    },
    {
      head: { th: "โอกาสมาผ่านคู่และหุ้นส่วน", en: "Luck through partners" },
      core: { th: "โอกาสของคุณมาผ่านคนอื่น ทั้งคู่ หุ้นส่วน และเครือข่าย คุณเติบโตเมื่อร่วมมือ และมีโชคเรื่องการเจรจาและความสัมพันธ์", en: "Your opportunities come through other people: partners, collaborators and networks. You grow through cooperation and are lucky in negotiation and relationships." },
      edge: { th: "ระวังพึ่งคนอื่นมากจนไม่กล้าตัดสินใจเอง", en: "Beware of relying on others so much that you stop deciding for yourself." },
    },
    {
      head: { th: "โอกาสซ่อนอยู่ในเรื่องที่คนอื่นไม่กล้าแตะ", en: "Luck where others fear to look" },
      core: { th: "โอกาสของคุณซ่อนอยู่ในเรื่องที่คนอื่นไม่กล้าแตะ คุณเติบโตผ่านการลงลึก การเปลี่ยนแปลงครั้งใหญ่ และทรัพยากรที่ใช้ร่วมกับคนอื่น", en: "Your opportunities hide in places others are afraid to look. You grow by going deep, through major transformations and through resources shared with others." },
      edge: { th: "ระวังอยากคุมผลลัพธ์ทั้งหมด หรือเสี่ยงหนักเกินไปเพราะมั่นใจ", en: "Beware of needing to control every outcome, or taking big risks out of overconfidence." },
    },
    {
      head: { th: "มีโชคและความหวังเป็นทุนเดิม", en: "Luck and hope come naturally" },
      core: { th: "คุณมีโชคและความหวังเป็นทุนเดิม เติบโตผ่านการเดินทาง การเรียน และการแสวงหาความหมายของชีวิต และโอกาสมักมาหาเมื่อคุณเปิดใจ", en: "Luck and hope come naturally to you. You grow through travel, study and the search for meaning, and opportunities appear when you stay open." },
      edge: { th: "ระวังมองโลกดีจนประมาท หรือรับปากหลายเรื่องเกินกว่าที่จะทำได้", en: "Beware of optimism turning careless, or promising more than you can do." },
    },
    {
      head: { th: "โอกาสมาช้าแต่มั่นคงตามประสบการณ์", en: "Luck that grows with experience" },
      core: { th: "โอกาสของคุณมาช้าแต่มั่นคง คุณเติบโตผ่านความรับผิดชอบ การทำงานหนัก และการสร้างชื่อเสียงทีละขั้น ความสำเร็จมักมาพร้อมประสบการณ์", en: "Your opportunities come slowly but solidly. You grow through responsibility, hard work and building a reputation step by step, and success often comes with experience." },
      edge: { th: "ระวังรอบคอบจนปล่อยโอกาสดีหลุดมือ", en: "Beware of being so cautious that good chances slip away." },
    },
    {
      head: { th: "โอกาสมาจากความคิดใหม่และกลุ่มคน", en: "Luck through new ideas and groups" },
      core: { th: "โอกาสของคุณมาจากความคิดใหม่ เพื่อน และกลุ่มคน คุณเติบโตเมื่อกล้าแตกต่าง และมีโชคกับงานที่ช่วยคนหมู่มากหรือใช้เทคโนโลยี", en: "Your opportunities come from new ideas, friends and communities. You grow by daring to be different and are lucky with work that serves many people or uses technology." },
      edge: { th: "ระวังยึดอุดมการณ์จนมองข้ามความต้องการของคนใกล้ตัว", en: "Beware of holding ideals so tightly that you overlook the needs of people close to you." },
    },
    {
      head: { th: "โอกาสมาจากความเมตตาและสัญชาตญาณ", en: "Luck through compassion and intuition" },
      core: { th: "โอกาสของคุณมาจากความเมตตาและสัญชาตญาณ คุณเติบโตผ่านศิลปะ จิตวิญญาณ และการช่วยเหลือคน และมักได้รับความช่วยเหลือในจังหวะที่ไม่คาดคิด", en: "Your opportunities come from compassion and intuition. You grow through art, spirituality and helping others, and help often arrives at unexpected moments." },
      edge: { th: "ระวังใจดีจนถูกเอาเปรียบ หรือหวังโดยไม่ลงมือ", en: "Beware of your kindness being exploited, or hoping without acting." },
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
      core: { th: "บทเรียนของคุณเกี่ยวกับความมั่นคงและคุณค่าในตัวเอง คุณอาจกังวลเรื่องเงินหรือกลัวว่าจะไม่พอ จึงตั้งใจสร้างฐานให้มั่นคงด้วยความอดทน", en: "Your lesson concerns security and self-worth. You may worry about money or never having enough, so you patiently build a firm foundation." },
      edge: { th: "เมื่อผ่านบทเรียนนี้ คุณจะรู้ว่าความมั่นคงที่แท้อยู่ในตัวเอง ไม่ใช่ในบัญชีธนาคาร", en: "Once you pass this lesson, you learn that true security lives inside you, not in a bank account." },
    },
    {
      head: { th: "บทเรียนเรื่องการคิดและการสื่อสาร", en: "Lesson: thinking and speaking" },
      core: { th: "บทเรียนของคุณเกี่ยวกับการคิดและการสื่อสาร คุณอาจเคยรู้สึกว่าพูดไม่เก่งหรือไม่ฉลาดพอ จึงตั้งใจเรียนรู้อย่างจริงจังและคิดอย่างเป็นระบบ", en: "Your lesson concerns thinking and communication. You may once have felt you were not articulate or clever enough, so you learn seriously and think systematically." },
      edge: { th: "เมื่อฝึกได้ คำพูดของคุณจะมีน้ำหนักและน่าเชื่อถือกว่าคนที่พูดเก่งโดยธรรมชาติ", en: "With practice, your words carry more weight and trust than those of natural talkers." },
    },
    {
      head: { th: "บทเรียนเรื่องอารมณ์และครอบครัว", en: "Lesson: emotions and family" },
      core: { th: "บทเรียนของคุณเกี่ยวกับอารมณ์และครอบครัว คุณอาจต้องโตเร็วหรือแบกความรับผิดชอบในบ้าน จึงเรียนรู้ที่จะดูแลคนอื่นก่อนดูแลใจตัวเอง", en: "Your lesson concerns emotions and family. You may have had to grow up early or carry responsibility at home, learning to care for others before yourself." },
      edge: { th: "บทเรียนนี้ชวนให้คุณยอมอ่อนแอให้คนที่ไว้ใจเห็นบ้าง และสร้างความอบอุ่นที่คุณต้องการขึ้นมาเอง", en: "This lesson invites you to let trusted people see your soft side, and to build the warmth you need." },
    },
    {
      head: { th: "บทเรียนเรื่องความมั่นใจในตัวเอง", en: "Lesson: confidence and self-expression" },
      core: { th: "บทเรียนของคุณเกี่ยวกับการแสดงตัวตนและความมั่นใจ คุณอยากเป็นที่ยอมรับ แต่ลึก ๆ อาจกลัวว่าไม่เก่งพอ จึงทำงานหนักเพื่อพิสูจน์ตัวเอง", en: "Your lesson concerns self-expression and confidence. You want recognition, but deep down may fear you are not good enough, so you work hard to prove yourself." },
      edge: { th: "เมื่อผ่านบทเรียนนี้ คุณจะเปล่งประกายได้โดยไม่ต้องรอให้ใครอนุญาต", en: "Once you pass it, you can shine without waiting for anyone's permission." },
    },
    {
      head: { th: "บทเรียนเรื่องงานและความสมบูรณ์แบบ", en: "Lesson: work and perfectionism" },
      core: { th: "บทเรียนของคุณเกี่ยวกับงาน สุขภาพ และความสมบูรณ์แบบ คุณรับผิดชอบสูง ละเอียด และพึ่งพาได้ แต่มักกดดันตัวเองว่าห้ามผิดพลาด", en: "Your lesson concerns work, health and perfection. You are responsible, precise and reliable, but you pressure yourself never to make mistakes." },
      edge: { th: "บทเรียนนี้ชวนให้คุณรู้ว่าดีพอก็มีค่า และการดูแลร่างกายคือส่วนหนึ่งของงาน", en: "This lesson teaches that good enough has value, and that caring for your body is part of the work." },
    },
    {
      head: { th: "บทเรียนเรื่องความสัมพันธ์และคำสัญญา", en: "Lesson: relationships and promises" },
      core: { th: "บทเรียนของคุณเกี่ยวกับความสัมพันธ์และความยุติธรรม คุณจริงจังกับคำสัญญา ให้คุณค่ากับความเท่าเทียม และสร้างความสัมพันธ์ที่ยืนยาวได้เก่ง", en: "Your lesson concerns relationships and fairness. You take promises seriously, value equality and are good at building lasting bonds." },
      edge: { th: "ระวังเลือกคู่หรือหุ้นส่วนด้วยหน้าที่มากกว่าหัวใจ หรือกลัวความผูกมัดเพราะรู้ว่ามันหนัก", en: "Beware of choosing partners out of duty rather than heart, or fearing commitment because you know its weight." },
    },
    {
      head: { th: "บทเรียนเรื่องความไว้ใจและการควบคุม", en: "Lesson: trust and control" },
      core: { th: "บทเรียนของคุณเกี่ยวกับความไว้ใจและการควบคุม คุณระวังตัวสูงและไม่เปิดใจง่าย แต่เมื่อไว้ใจแล้วจะผูกพันลึกและยาวนาน", en: "Your lesson concerns trust and control. You are guarded and slow to open up, but once you trust, the bond is deep and lasting." },
      edge: { th: "บทเรียนนี้ชวนให้คุณปล่อยสิ่งที่ควบคุมไม่ได้ และรู้ว่าการเปิดใจไม่ใช่ความอ่อนแอ", en: "This lesson invites you to release what you cannot control, and to see that openness is not weakness." },
    },
    {
      head: { th: "บทเรียนเรื่องความเชื่อและความหมาย", en: "Lesson: belief and meaning" },
      core: { th: "บทเรียนของคุณเกี่ยวกับความเชื่อและความหมายของชีวิต คุณจริงจังกับการเรียนรู้และหลักการ และค่อย ๆ สร้างปรัชญาชีวิตของตัวเองจากประสบการณ์จริง", en: "Your lesson concerns belief and life's meaning. You take learning and principles seriously and gradually build your own philosophy from real experience." },
      edge: { th: "ระวังยึดความเชื่อแบบตายตัว หรือสงสัยจนไม่กล้าเชื่ออะไรเลย", en: "Beware of rigid beliefs, or doubting so much that you dare not believe anything." },
    },
    {
      head: { th: "มีวินัยและรับผิดชอบเป็นธรรมชาติ", en: "Natural discipline and responsibility" },
      core: { th: "คุณมีวินัย อดทน และรับผิดชอบเป็นธรรมชาติ รู้ว่าสิ่งที่มีค่าต้องใช้เวลา และสร้างผลงานที่ยืนได้นานจากความพยายาม", en: "You are disciplined, patient and responsible by nature. You know that what is valuable takes time, and you build lasting work through effort." },
      edge: { th: "ระวังแบกทุกอย่างไว้คนเดียวจนลืมว่าชีวิตไม่ได้มีแค่หน้าที่", en: "Beware of carrying everything alone until you forget life is more than duty." },
    },
    {
      head: { th: "สร้างระบบใหม่ที่ใช้ได้จริง", en: "Builds new systems that work" },
      core: { th: "คุณใช้วินัยกับความคิดใหม่ได้ดี สร้างระบบที่ทั้งล้ำและใช้ได้จริง และรับผิดชอบต่อกลุ่มหรือส่วนรวมอย่างจริงจัง", en: "You apply discipline to new ideas well, building systems that are both innovative and practical, and you take responsibility for groups and the common good seriously." },
      edge: { th: "ระวังยึดหลักการตัวเองจนแข็งตัว หรือรู้สึกโดดเดี่ยวเพราะคิดต่างจากคนส่วนใหญ่", en: "Beware of hardening around your principles, or feeling isolated for thinking differently." },
    },
    {
      head: { th: "บทเรียนเรื่องเส้นแบ่งระหว่างฝันกับจริง", en: "Lesson: the line between dream and reality" },
      core: { th: "บทเรียนของคุณเกี่ยวกับเส้นแบ่งระหว่างความฝันกับความจริง คุณมีใจเมตตาและอ่อนไหว และค่อย ๆ เรียนรู้ที่จะให้ความฝันมีโครงสร้างพอจะเป็นจริงได้", en: "Your lesson concerns the line between dreams and reality. You are compassionate and sensitive, and you gradually learn to give your dreams enough structure to come true." },
      edge: { th: "ระวังรับความทุกข์ของคนอื่นมาแบกเอง หรือหนีความรับผิดชอบเมื่อรู้สึกหนักเกินไป", en: "Beware of carrying other people's pain, or escaping responsibility when it feels too heavy." },
    },
  ],
};

/** งานที่ใช่ตามราศีของกลางฟ้า (เรียง เมษ ➔ มีน) — ต่อหลัง "งานที่ใช่คือ" ได้ · ตัวอย่างอาชีพเป็นแนวทาง ไม่ใช่คำสั่ง */
export const MC_CAREER: readonly T[] = [
  { th: "งานที่ได้นำ ริเริ่ม และแข่งขัน เช่น ธุรกิจของตัวเอง กีฬา การเปิดตลาดใหม่ หรืองานที่ต้องตัดสินใจเร็ว", en: "work where you lead, start things and compete, such as your own business, sport, opening new markets or roles that need fast decisions" },
  { th: "งานที่สร้างคุณค่าระยะยาวและเห็นผลจับต้องได้ เช่น การเงิน อสังหาริมทรัพย์ อาหาร ความงาม ศิลปะ หรืองานออกแบบ", en: "work that builds lasting value with tangible results, such as finance, property, food, beauty, art or design" },
  { th: "งานที่ได้สื่อสาร เรียนรู้ และเชื่อมคน เช่น การเขียน สื่อ การสอน การขาย การตลาด หรืองานที่มีเรื่องใหม่ทุกวัน", en: "work that lets you communicate, learn and connect people, such as writing, media, teaching, sales, marketing or anything with something new every day" },
  { th: "งานที่ได้ดูแลคนและสร้างความรู้สึกปลอดภัย เช่น งานดูแลสุขภาพ การศึกษาเด็ก อาหาร ที่อยู่อาศัย หรือธุรกิจครอบครัว", en: "work that cares for people and creates safety, such as healthcare, early education, food, housing or family business" },
  { th: "งานที่ได้แสดงตัวและสร้างสรรค์ เช่น งานบันเทิง การสร้างแบรนด์ การนำทีม งานสร้างสรรค์ หรืองานที่ได้อยู่ต่อหน้าผู้คน", en: "work where you are seen and creative, such as entertainment, branding, leading a team, creative work or anything in front of people" },
  { th: "งานที่ใช้ความละเอียดและช่วยแก้ปัญหา เช่น สุขภาพ การวิเคราะห์ข้อมูล บัญชี การตรวจคุณภาพ งานบริการ หรืองานที่ต้องแม่นยำ", en: "work that uses precision and solves problems, such as health, data analysis, accounting, quality control, service or anything that demands accuracy" },
  { th: "งานที่ใช้ความงาม ความยุติธรรม และการประสานคน เช่น กฎหมาย การเจรจา งานออกแบบ แฟชั่น ศิลปะ หรืองานที่ปรึกษา", en: "work involving beauty, fairness and bringing people together, such as law, negotiation, design, fashion, art or consulting" },
  { th: "งานที่ต้องลงลึกและรับมือเรื่องสำคัญ เช่น การวิจัย จิตวิทยา การแพทย์ การลงทุน การสืบสวน หรืองานรับมือวิกฤต", en: "work that goes deep and handles high stakes, such as research, psychology, medicine, investment, investigation or crisis work" },
  { th: "งานที่เปิดโลกและส่งต่อความรู้ เช่น การสอน การท่องเที่ยว งานต่างประเทศ งานสิ่งพิมพ์ หรือกฎหมาย", en: "work that opens horizons and shares knowledge, such as teaching, travel, international work, publishing or law" },
  { th: "งานที่มีโครงสร้างชัด ได้รับผิดชอบสูง และเติบโตเป็นขั้น เช่น การบริหาร การเงิน วิศวกรรม งานราชการ หรือการสร้างองค์กรของตัวเอง", en: "work with clear structure, real responsibility and step-by-step growth, such as management, finance, engineering, public service or building your own organisation" },
  { th: "งานที่ใช้ความคิดใหม่และทำเพื่อคนหมู่มาก เช่น เทคโนโลยี นวัตกรรม งานสังคม องค์กรเพื่อส่วนรวม หรืองานที่ยังไม่มีชื่อเรียก", en: "work that uses new ideas and serves many people, such as technology, innovation, social work, non-profits or jobs that do not have a name yet" },
  { th: "งานที่ใช้จินตนาการและความเมตตา เช่น ศิลปะ ดนตรี ภาพยนตร์ การเยียวยา งานช่วยเหลือผู้คน หรืองานด้านจิตวิญญาณ", en: "work that uses imagination and compassion, such as art, music, film, healing, the helping professions or spiritual work" },
];

/** เรื่องที่แผลใจ (ไครอน) มักเกี่ยวข้องตามราศี — ต่อหลัง "มักเกี่ยวกับ" ได้ */
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
  conjunction: { th: "รู้ทันว่าตอนนี้ด้านไหนกำลังนำ แล้วให้อีกด้านช่วยพยุง แทนที่จะปล่อยให้ล้มไปพร้อมกัน", en: "Notice which side is leading, and let the other side support it instead of letting both fall together." },
  trine: { th: "ตั้งใจฝึกด้านนี้ให้เป็นฝีมือจริง ของที่ได้มาง่ายจะมีค่าเมื่อคุณเอามาใช้", en: "Train this gift into real skill. What comes easily is only valuable once you put it to use." },
  sextile: { th: "เมื่อเห็นโอกาสที่เกี่ยวกับสองเรื่องนี้ ให้ลงมือทันที ไม่ต้องรอให้พร้อมทุกอย่าง", en: "When an opportunity touches these two areas, act on it straight away rather than waiting until everything is ready." },
  square: { th: "อย่าพยายามกำจัดด้านใดด้านหนึ่ง หาวิธีให้ทั้งสองความต้องการได้ที่ยืน แม้ต้องสลับกันก็ตาม", en: "Do not try to get rid of either side. Find a way for both needs to have their place, even if they take turns." },
  opposition: { th: "หาจุดกลางที่ใช้ได้ทั้งสองด้าน และสังเกตว่าคนรอบตัวกำลังสะท้อนอะไรในตัวคุณ", en: "Find a middle path that uses both sides, and notice what the people around you are mirroring back." },
};

/**
 * ดาวจรที่เดินช้า (อยู่นานเป็นสัปดาห์ถึงปี): ใช้ช่วงนี้ให้ดีอย่างไร — `flow` = มุมไหลลื่น · `push` = มุมตึงหรือกุม
 * ดาวเร็ว (อาทิตย์ จันทร์ พุธ ศุกร์ อังคาร) ไม่มี เพราะผ่านไปในไม่กี่วัน
 */
export const TRANSIT_KEY: Record<"jupiter" | "saturn" | "uranus" | "neptune" | "pluto" | "chiron" | "node", { flow: T; push: T }> = {
  jupiter: {
    flow: { th: "เปิดรับโอกาสและลองขยายสิ่งที่ทำอยู่ ช่วงนี้คนและจังหวะเป็นใจกว่าปกติ", en: "Say yes to openings and try to grow what you already do; people and timing are on your side more than usual." },
    push: { th: "โอกาสมาพร้อมความเสี่ยงที่จะทำเกินตัว ขยายได้ แต่ตรวจตัวเลขและกำลังของตัวเองก่อน", en: "Opportunity comes with a risk of overdoing it. Expand, but check the numbers and your own capacity first." },
  },
  saturn: {
    flow: { th: "เหมาะกับการวางรากฐาน ทำแผนระยะยาว หรือรับผิดชอบเรื่องใหญ่ ความพยายามช่วงนี้จะอยู่ได้นาน", en: "A good time to lay foundations, make long-term plans or take on real responsibility; effort now lasts." },
    push: { th: "อย่าฝืนเร่ง ทำสิ่งที่ต้องทำทีละขั้นและยอมรับข้อจำกัดที่มีอยู่จริง สิ่งที่ผ่านด่านนี้ได้จะแข็งแรงขึ้น", en: "Do not force the pace. Do what needs doing step by step and accept real limits; whatever survives this test comes out stronger." },
  },
  uranus: {
    flow: { th: "ลองสิ่งใหม่ที่อยากทำมานาน การเปลี่ยนแปลงช่วงนี้มักเปิดทางมากกว่าทำให้สะดุด", en: "Try the new thing you have long wanted to try; change now tends to open doors rather than trip you up." },
    push: { th: "เผื่อพื้นที่ให้เรื่องไม่คาดฝัน และอย่าตัดสินใจเรื่องใหญ่เพียงเพราะอยากหนีความอึดอัด ให้ถามว่าอะไรต้องการอิสระจริง", en: "Leave room for surprises, and avoid big decisions made only to escape discomfort; ask what truly needs more freedom." },
  },
  neptune: {
    flow: { th: "ใช้ช่วงนี้กับงานสร้างสรรค์ การภาวนา หรือการช่วยเหลือคน แรงบันดาลใจมาง่ายกว่าปกติ", en: "Use this time for creative work, meditation or helping others; inspiration comes more easily than usual." },
    push: { th: "ภาพอาจไม่ชัด ตรวจข้อเท็จจริงก่อนเชื่อหรือเซ็นอะไร และดูแลขอบเขตของตัวเองให้ดี", en: "Things may look blurry. Check the facts before trusting or signing anything, and keep your boundaries clear." },
  },
  pluto: {
    flow: { th: "เป็นจังหวะที่ลงลึกได้ดี ทั้งการรื้อนิสัยเก่า การดูแลใจอย่างจริงจัง หรือการเปลี่ยนแปลงที่ตั้งใจมานาน", en: "A strong time to go deep: break old habits, do real inner work or make a change you have long intended." },
    push: { th: "สิ่งที่หมดหน้าที่อาจถูกรื้อออก ยิ่งยึดไว้ยิ่งเจ็บ ให้ถามว่าคุณพร้อมปล่อยอะไร เพื่อให้มีที่ว่างสำหรับสิ่งใหม่", en: "What has served its purpose may be torn down, and holding on hurts more. Ask what you are ready to release to make room for the new." },
  },
  chiron: {
    flow: { th: "เป็นช่วงที่เยียวยาแผลเก่าได้ดี การคุยกับคนที่เข้าใจหรือการช่วยคนอื่นจะช่วยตัวคุณด้วย", en: "A good time to heal old wounds; talking with someone who understands, or helping others, helps you too." },
    push: { th: "แผลเก่าอาจถูกแตะ อ่อนโยนกับตัวเองให้มาก และมองว่าความเจ็บครั้งนี้กำลังชี้จุดที่พร้อมจะหาย", en: "An old wound may be touched. Be gentle with yourself, and treat the pain as a pointer to what is ready to heal." },
  },
  node: {
    flow: { th: "คนหรือโอกาสที่เข้ามาช่วงนี้อาจพาคุณไปทางที่ควรไป ลองเปิดใจรับ", en: "People or chances that arrive now may lead you where you are meant to go; stay open." },
    push: { th: "ชีวิตกำลังชวนให้ออกจากนิสัยเดิม ความอึดอัดช่วงนี้คือสัญญาณว่าถึงเวลาเปลี่ยนทิศ", en: "Life is nudging you out of old habits; the discomfort is a sign it is time to change direction." },
  },
};

/**
 * เกิดกลางวัน/กลางคืน (sect): ดวงสว่างที่นำผัง — กลางวันคือดวงอาทิตย์ กลางคืนคือดวงจันทร์ (หลักโหราดั้งเดิม)
 * เขียนเป็นภาษาคน: คุณรู้จักตัวเองผ่านอะไรเป็นหลัก
 */
export const SECT_TEXT: Record<"day" | "night", T> = {
  day: { th: "ดวงอาทิตย์นำผัง คุณมักรู้จักตัวเองผ่านสิ่งที่ลงมือทำ เป้าหมาย และสิ่งที่สร้างให้โลกเห็น", en: "The Sun leads your chart: you tend to know yourself through what you do, your goals and what you build for the world to see." },
  night: { th: "ดวงจันทร์นำผัง คุณมักรู้จักตัวเองผ่านความรู้สึก ความสัมพันธ์ใกล้ชิด และโลกภายใน", en: "The Moon leads your chart: you tend to know yourself through feelings, close bonds and your inner world." },
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
    strong: { th: "จรราศีมากเกินครึ่ง: คุณถนัดเริ่มและผลักให้เกิดสิ่งใหม่ แต่ระวังเริ่มหลายอย่างจนจบไม่ครบ", en: "Over half cardinal: you are a natural starter, but watch out for starting more than you finish." },
    weak: { th: "จรราศีน้อย: การเริ่มเรื่องใหม่อาจต้องใช้แรงมากกว่าคนอื่น ตั้งวันเริ่มให้ชัดช่วยได้", en: "Little cardinal: starting something new may take extra effort; setting a clear start date helps." },
  },
  fixed: {
    strong: { th: "สถิรราศีมากเกินครึ่ง: คุณหนักแน่นและทำต่อเนื่องได้นานกว่าคนส่วนใหญ่ แต่ระวังดื้อหรือปรับตัวช้าเมื่อสถานการณ์เปลี่ยน", en: "Over half fixed: you are steadier and more persistent than most, but watch out for stubbornness or adapting slowly when things change." },
    weak: { th: "สถิรราศีน้อย: การทำเรื่องเดิมต่อเนื่องนาน ๆ อาจไม่ใช่ธรรมชาติ ใช้กิจวัตรหรือคนช่วยเตือนเป็นตัวช่วย", en: "Little fixed: sticking with one thing for a long time may not come naturally; routines or a reminder buddy help." },
  },
  mutable: {
    strong: { th: "อุภยราศีมากเกินครึ่ง: คุณปรับตัวเก่งมาก แต่ระวังลังเลหรือเปลี่ยนใจบ่อยจนไม่ได้ลงหลัก", en: "Over half mutable: you adapt brilliantly, but watch out for indecision or changing course so often you never settle." },
    weak: { th: "อุภยราศีน้อย: การเปลี่ยนแผนกะทันหันอาจทำให้อึดอัด เผื่อแผนสำรองไว้เสมอ", en: "Little mutable: sudden changes of plan may feel uncomfortable; always keep a plan B." },
  },
};

/** เรือนที่มีแต่จุดคำนวณ (ไม่มีดาวเคราะห์): บอกว่าจุดนั้นทำอะไรในเรือนนี้ */
export const POINT_HOUSE_LINE: Partial<Record<BodyId, T>> = {
  node: { th: "ทิศทางที่ชีวิตชวนให้คุณเติบโต", en: "Where life invites you to grow" },
  chiron: { th: "แผลใจเรื่องนี้กลายเป็นพลังเยียวยาได้", en: "An old wound here can become a gift for healing" },
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
  { th: "คนที่ดึงดูดคุณมักกล้า ตรง และมีพลัง คนแบบนี้ช่วยให้คุณกล้าบอกสิ่งที่ต้องการมากขึ้น", en: "You are drawn to bold, direct, energetic people, who help you ask for what you want." },
  { th: "คนที่ดึงดูดคุณมักนิ่ง มั่นคง และไว้ใจได้ ความรักที่ยืนยาวสำหรับคุณคือความรักที่ค่อย ๆ โต", en: "You are drawn to calm, steady, reliable people. Lasting love, for you, is love that grows slowly." },
  { th: "คนที่ดึงดูดคุณมักคุยสนุก ฉลาด และคล่องตัว ถ้าคุยกันได้ไม่รู้จบ ความสัมพันธ์จะไปได้ไกล", en: "You are drawn to witty, clever, lively people. If the conversation never runs dry, the relationship goes far." },
  { th: "คนที่ดึงดูดคุณมักอบอุ่น ขี้ห่วง และให้ความรู้สึกเหมือนบ้าน คุณต้องการคู่ที่ดูแลใจกันได้", en: "You are drawn to warm, caring people who feel like home. You need a partner who looks after your heart." },
  { th: "คนที่ดึงดูดคุณมักมั่นใจ มีเสน่ห์ และใจกว้าง คนแบบนี้ชวนให้คุณกล้าเฉิดฉายไปด้วยกัน", en: "You are drawn to confident, charismatic, generous people who invite you to shine as well." },
  { th: "คนที่ดึงดูดคุณมักละเอียด ช่างดูแล และพึ่งพาได้ ความรักของคุณเห็นได้จากการช่วยกันในเรื่องเล็ก ๆ ทุกวัน", en: "You are drawn to thoughtful, helpful, dependable people. Your love shows in small, everyday help." },
  { th: "คนที่ดึงดูดคุณมักสุภาพ มีรสนิยม และยุติธรรม คุณต้องการความสัมพันธ์ที่เท่าเทียมและให้เกียรติกัน", en: "You are drawn to gracious, tasteful, fair people. You need a relationship of equals built on respect." },
  { th: "คนที่ดึงดูดคุณมักลึก เข้มข้น และมีอะไรให้ค้นหา คุณต้องการความรักที่จริงจังและซื่อสัตย์ทั้งใจ", en: "You are drawn to deep, intense people with something to discover. You want love that is serious and wholeheartedly loyal." },
  { th: "คนที่ดึงดูดคุณมักร่าเริง รักอิสระ และเปิดโลก คนแบบนี้พาคุณไปเจอสิ่งใหม่และทำให้หัวเราะได้บ่อย", en: "You are drawn to cheerful, free-spirited people who open up the world and make you laugh." },
  { th: "คนที่ดึงดูดคุณมักเป็นผู้ใหญ่ มีวินัย และมีเป้าหมาย คุณอยากได้คู่ที่สร้างอนาคตไปด้วยกันได้จริง", en: "You are drawn to mature, disciplined, goal-driven people. You want a partner to build a real future with." },
  { th: "คนที่ดึงดูดคุณมักคิดไม่เหมือนใครและรักอิสระ ความสัมพันธ์ที่ไปได้ไกลของคุณต้องเป็นเพื่อนกันก่อน", en: "You are drawn to original, independent people. Your relationships that last start as friendship." },
  { th: "คนที่ดึงดูดคุณมักอ่อนโยน ช่างฝัน และเข้าใจกันได้โดยไม่ต้องพูด คุณต้องการรักที่ทั้งอ่อนหวานและจริงใจ", en: "You are drawn to gentle, dreamy people who understand without words. You want love that is both tender and honest." },
];

/** วิธีทำงานและสิ่งที่ทำให้มีไฟ ตามราศีของดาวอังคาร */
export const WORK_STYLE: readonly T[] = [
  { th: "คุณทำงานได้ดีที่สุดเมื่อได้เริ่มเองและเห็นผลเร็ว เป็นคนจุดไฟให้ทีม แต่เบื่อง่ายถ้างานยืดเยื้อ", en: "You work best when you can start things yourself and see results fast. You light the fire for a team, but tire of work that drags on." },
  { th: "คุณทำงานช้าแต่ไม่พลาด อึดกว่าใคร ยิ่งงานต้องต่อเนื่องยิ่งเก่ง แต่ไม่ชอบถูกเร่งหรือเปลี่ยนแผนกะทันหัน", en: "You work slowly but surely and outlast everyone; the more a job needs persistence, the better you are. You dislike being rushed or sudden changes of plan." },
  { th: "คุณทำได้หลายงานพร้อมกัน คิดเร็ว พูดเก่ง เหมาะกับงานที่มีเรื่องใหม่ตลอด แต่ระวังเริ่มหลายเรื่องแล้วไม่จบ", en: "You juggle several tasks, think fast and talk well, which suits work full of new things. Watch out for starting many things and finishing few." },
  { th: "คุณทำงานเต็มที่เมื่อรู้สึกว่าทีมเหมือนครอบครัวและได้ทำเพื่อคนที่ห่วง แต่บรรยากาศตึงเครียดทำให้พลังตกเร็ว", en: "You give your all when the team feels like family and you are working for people you care about. Tense atmospheres drain you fast." },
  { th: "คุณทำงานเต็มที่เมื่อมีเวทีและได้รับการยอมรับ เป็นผู้นำที่ให้กำลังใจเก่ง แต่ถ้าไม่มีใครเห็นค่า แรงใจจะหายเร็ว", en: "You go all out when there is a stage and recognition. You lead by encouragement, but your drive fades if nobody notices the effort." },
  { th: "คุณทำงานละเอียด เป็นระบบ และเก็บงานได้เนี้ยบ เป็นคนที่ทีมขาดไม่ได้ แต่ระวังแก้งานไม่จบเพราะอยากให้สมบูรณ์", en: "You work precisely and systematically and finish to a high standard, the person a team cannot do without. Watch out for endless polishing in pursuit of perfect." },
  { th: "คุณทำงานได้ดีเมื่อมีคู่คิดหรือทีม เก่งเจรจาและหาทางที่ทุกฝ่ายรับได้ แต่ลังเลเมื่อต้องตัดสินใจคนเดียว", en: "You work best with a partner or a team and are skilled at finding outcomes everyone accepts, but you hesitate when you must decide alone." },
  { th: "คุณทุ่มกับงานแบบสุดตัวและเงียบ ๆ เจาะเรื่องยากที่คนอื่นถอย แต่ถ้าไม่ไว้ใจคนรอบตัวจะแบกทุกอย่างไว้คนเดียว", en: "You commit fully and quietly, digging into hard problems others avoid, but when you do not trust the people around you, you carry everything alone." },
  { th: "คุณทำงานได้ดีเมื่อเห็นภาพใหญ่และมีอิสระ เหมาะกับงานที่ได้เรียนรู้หรือเดินทาง แต่ไม่ชอบงานซ้ำซากและกฎที่ไม่มีเหตุผล", en: "You work well with a big picture and freedom, which suits work that involves learning or travel. You dislike repetitive tasks and rules without reasons." },
  { th: "คุณทำงานแบบมีแผน มีวินัย และไต่ทีละขั้นจนถึงเป้า เป็นคนที่องค์กรไว้ใจ แต่ระวังทำงานหนักจนลืมพัก", en: "You work to a plan, with discipline, climbing step by step to the goal, and organisations trust you. Watch out for working so hard you forget to rest." },
  { th: "คุณทำงานได้ดีที่สุดเมื่อได้คิดวิธีใหม่และไม่มีใครคุมใกล้ชิด เก่งเรื่องระบบและเทคโนโลยี แต่ต่อต้านคำสั่งที่ไม่มีเหตุผล", en: "You work best when you can invent new methods without close supervision. You are good with systems and technology, but resist orders that make no sense." },
  { th: "คุณทำงานได้ดีเมื่องานมีความหมายและได้ใช้จินตนาการ อ่านคนและบรรยากาศเก่ง แต่ต้องมีกำหนดส่งช่วยดึงให้งานเสร็จ", en: "You work well when the work means something and uses your imagination. You read people and moods well, but deadlines help you finish." },
];

/** วิธีหาเงินและใช้เงิน ตามราศีของจุดเริ่มเรือน 2 */
export const MONEY_SIGN: readonly T[] = [
  { th: "คุณหาเงินเก่งเมื่อได้ริเริ่มและลงมือเอง เงินมาเร็วไปเร็ว และมักซื้อตามใจในพริบตา ควรมีบัญชีสำรองที่ตั้งกติกาว่าห้ามแตะ", en: "You earn best when you start things and act yourself. Money comes fast and goes fast, and you tend to buy on impulse, so keep a reserve account with a strict no-touch rule." },
  { th: "คุณสร้างเงินแบบค่อยเป็นค่อยไปและเก็บเก่ง ชอบของดีที่ใช้ได้นาน เงินที่มั่นคงทำให้ใจสงบ ระวังแค่ไม่กล้าเอาเงินไปลงกับโอกาสใหม่", en: "You build money gradually and save well, and you like quality that lasts. Financial security calms you; just watch that it does not stop you backing new opportunities." },
  { th: "เงินของคุณมาได้หลายทาง ทั้งงานหลัก งานเสริม และการซื้อมาขายไป ความรู้และการสื่อสารคือทุนสำคัญ ระวังรายจ่ายเล็ก ๆ ที่กระจายจนตามไม่ทัน", en: "Your money can come from several streams: a main job, side work, buying and selling. Knowledge and communication are your capital. Watch the small expenses scattered everywhere." },
  { th: "คุณมองเงินเป็นความปลอดภัยของคนที่รัก เก็บออมเก่งเมื่อมีเป้าหมายเพื่อครอบครัว ระวังใช้เงินตามอารมณ์ในวันที่ใจไม่ดี", en: "To you, money means safety for the people you love, and you save well with a family goal in mind. Watch emotional spending on bad days." },
  { th: "คุณหาเงินได้ดีเมื่อได้ใช้ความสามารถเฉพาะตัวและมีคนเห็นฝีมือ ใจกว้าง ชอบให้ และชอบของที่สะท้อนตัวตน ระวังจ่ายเพื่อภาพลักษณ์เกินกำลัง", en: "You earn well when your own talent is on show and recognised. You are generous and love things that reflect who you are; watch spending on image beyond your means." },
  { th: "คุณดูแลเงินละเอียด จดรายรับรายจ่ายได้ และหาเงินจากฝีมือ ทักษะ และงานบริการ ระวังกังวลเรื่องเงินจนไม่กล้าใช้กับสิ่งที่ทำให้ชีวิตดีขึ้น", en: "You manage money carefully, track every expense and earn through skill, craft and service. Watch money worries stopping you from spending on what would truly improve your life." },
  { th: "เงินของคุณมักมาผ่านคนอื่น ทั้งหุ้นส่วน ลูกค้า และความสัมพันธ์ที่ดี ชอบใช้เงินกับความสวยงามและความสุขที่แบ่งกันได้ ระวังตัดสินใจเรื่องเงินตามใจคนอื่น", en: "Your money often comes through other people: partners, clients and good relationships. You like spending on beauty and pleasures you can share; watch letting others make your money decisions." },
  { th: "คุณเก็บเรื่องเงินเงียบและคิดเรื่องเงินลึก เก่งเรื่องลงทุนและพลิกสิ่งที่คนอื่นมองข้ามให้มีค่า ระวังทุ่มหมดหน้าตักหรือใช้เงินเป็นเครื่องมือควบคุม", en: "You keep money matters private and think about them deeply, with a gift for investing and turning overlooked things into value. Watch all-or-nothing bets and using money as control." },
  { th: "คุณมองเงินเป็นเครื่องมือของอิสระและประสบการณ์ เงินมักมาจากการสอน การเดินทาง งานต่างประเทศ หรือการขายความคิด ระวังมองโลกดีจนใช้เกินกว่าที่หาได้", en: "Money, to you, is a tool for freedom and experience. It often comes through teaching, travel, foreign work or selling ideas. Watch optimism leading you to spend more than you earn." },
  { th: "คุณสร้างฐานะแบบมีแผน เก็บเงินเป็น และยิ่งอายุมากยิ่งมั่นคง ชอบสิ่งที่มีมูลค่าระยะยาว ระวังเข้มงวดกับตัวเองจนไม่เคยให้รางวัลชีวิต", en: "You build wealth by plan, save well and grow more secure with age. You value long-term worth; watch being so strict that you never reward yourself." },
  { th: "เงินของคุณมักมาจากทางที่ไม่เหมือนใคร เช่น เทคโนโลยี งานออนไลน์ หรือกลุ่มคน คุณอยากมีเงินเพื่ออิสระมากกว่าหน้าตา ระวังรายได้ขึ้นลงเพราะเปลี่ยนแผนบ่อย", en: "Your money often comes in unusual ways, such as technology, online work or groups. You want money for freedom rather than status; watch income swinging because plans change often." },
  { th: "คุณไม่ค่อยยึดติดเงิน ใจดี ให้ง่าย และหาเงินได้จากศิลปะ การเยียวยา หรือการช่วยคน ระวังเงินรั่วไหลเพราะไม่ตั้งขอบเขตหรือเชื่อคนง่ายเกินไป", en: "You are not attached to money, give easily and can earn through art, healing or helping people. Watch money slipping away through loose boundaries or trusting too easily." },
];

/**
 * เงินมาจากไหน: เรือนที่เจ้าเรือน 2 (ดาวเจ้าราศีของจุดเริ่มเรือน 2 แบบโบราณ) ไปอยู่ — หลักอ่านเงินพื้นฐานของโหราสากล
 * เรียงเรือน 1 ➔ 12 · ต่อหลัง "แปลว่า" ได้
 */
export const MONEY_FROM_HOUSE: readonly T[] = [
  { th: "เงินมาจากตัวคุณเอง ทั้งฝีมือ ภาพลักษณ์ และการลงมือทำด้วยตัวเอง", en: "money comes through you: your skills, your image and what you do yourself" },
  { th: "เงินต่อเงิน คุณเก่งเรื่องเก็บ สะสม และทำให้ทรัพย์งอกเงย", en: "money makes money; you are good at saving, accumulating and growing what you have" },
  { th: "เงินมาจากการพูด การเขียน การขาย การสอน และคนรอบตัว", en: "money comes through speaking, writing, selling, teaching and the people around you" },
  { th: "เงินผูกกับบ้าน ที่ดิน ครอบครัว หรือธุรกิจที่ทำจากบ้าน", en: "money is tied to home, property, family or a business run from home" },
  { th: "เงินมาจากความคิดสร้างสรรค์ งานที่สนุก งานเกี่ยวกับเด็ก หรือการเสี่ยงที่คิดมาดีแล้ว", en: "money comes through creativity, work you enjoy, work with children or well-judged risks" },
  { th: "เงินมาจากงานประจำ ทักษะเฉพาะ และงานบริการที่ทำได้ดีทุกวัน", en: "money comes through steady work, specialist skills and service done well every day" },
  { th: "เงินมาผ่านคู่ หุ้นส่วน และลูกค้า งานที่ทำร่วมกับคนอื่นให้ผลดีกว่าทำคนเดียว", en: "money comes through partners and clients; working with others pays better than working alone" },
  { th: "เงินผูกกับทรัพย์ร่วม การลงทุน มรดก หรือเงินของคนอื่นที่คุณดูแล", en: "money is tied to shared resources, investment, inheritance or other people's money you manage" },
  { th: "เงินมาจากความรู้ การสอน ต่างประเทศ การเดินทาง หรืองานสิ่งพิมพ์", en: "money comes through knowledge, teaching, foreign links, travel or publishing" },
  { th: "เงินมาจากอาชีพ ตำแหน่ง และชื่อเสียง ยิ่งงานเติบโต เงินยิ่งตามมา", en: "money comes through your career, position and reputation; as your work grows, so does your income" },
  { th: "เงินมาจากเครือข่าย เพื่อน กลุ่มลูกค้า และงานออนไลน์", en: "money comes through networks, friends, communities of customers and online work" },
  { th: "เงินมาจากงานเบื้องหลัง งานที่ทำเงียบ ๆ องค์กรใหญ่ หรืองานช่วยเหลือผู้คน", en: "money comes through behind-the-scenes work, quiet work, large institutions or helping people" },
];
