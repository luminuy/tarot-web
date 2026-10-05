/**
 * ✦ คำถามสะท้อนตัวเองประจำไพ่ (REFLECTION_JOURNAL_PLAN 1.9 — พิธีเช้า)
 * ---------------------------------------------------------------------------
 * ไพ่ละ 1 คำถามต่อทิศ (หัวตั้ง/กลับหัว) สองภาษา — ใช้ในพิธีเช้าหน้า /daily ไม่เรียก AI
 * จึงเปิดได้ทันที ต้นทุน 0 และใช้แบบออฟไลน์ได้ (PWA)
 *
 * หลักการเขียน:
 *  • เป็น "คำถามชวนคิด" ไม่ใช่คำทำนาย — ห้าม "จะเกิด · แน่นอน · ดวงกำหนด"
 *  • ถามถึงสิ่งที่ผู้ใช้ทำ/สังเกตได้ "วันนี้" — ตอบได้ในบรรทัดเดียว
 *  • ภาษาไทยธรรมชาติ อบอุ่น ไม่สั่งสอน (กฎเหล็กข้อ 10)
 *
 * ⚠️ สถานะ: ร่างโดยทีมพัฒนาจากความหมายในสารานุกรมของบ้าน — ควรให้แม่หมอใน Marketplace ตรวจถ้อยคำ
 * ⚠️ ไฟล์นี้โหลดแบบ dynamic import ตอนพลิกไพ่เท่านั้น — ห้าม import ตรงในเปลือกหน้า
 * รูปแบบ: [หัวตั้งไทย, หัวตั้งอังกฤษ, กลับหัวไทย, กลับหัวอังกฤษ]
 */

type Prompts = readonly [string, string, string, string];

export const REFLECTION_PROMPTS: Readonly<Record<string, Prompts>> = {
  // ── Major Arcana ──
  "major-00": [
    "วันนี้มีเรื่องเล็ก ๆ อะไรที่อยากลองทำ ถ้าไม่ต้องกลัวว่าจะทำได้ไม่ดี",
    "What small thing would you try today if you weren't afraid of doing it badly?",
    "ความกล้าหรือความประมาทกันแน่ ที่กำลังพาคุณเดินในเรื่องที่ค้างอยู่",
    "Is it courage or carelessness that's moving you in the matter on your mind?",
  ],
  "major-01": [
    "คุณมีอะไรอยู่ในมือแล้วบ้าง ที่ยังไม่ได้หยิบมาใช้กับเรื่องที่อยากให้เกิด",
    "What do you already have in hand that you haven't used yet for what you want?",
    "ตรงไหนที่คุณกำลังพูดมากกว่าลงมือ หรือใช้ความเก่งไปในทางที่ไม่ใช่ตัวเอง",
    "Where are you talking more than doing, or using your skill in a way that isn't you?",
  ],
  "major-02": [
    "ถ้าเงียบลงสักห้านาที เสียงข้างในกำลังบอกอะไรที่คุณยังไม่ได้ฟัง",
    "If you went quiet for five minutes, what would your inner voice be saying?",
    "มีความรู้สึกไหนที่คุณรู้อยู่แล้ว แต่ยังพยายามไม่ยอมรับ",
    "Which feeling do you already know is true but keep refusing to admit?",
  ],
  "major-03": [
    "วันนี้คุณจะดูแลอะไรสักอย่างให้เติบโต — งาน คน หรือตัวเอง",
    "What will you nurture today so it can grow — work, a person, or yourself?",
    "คุณให้คนอื่นมากจนลืมเติมให้ตัวเองหรือเปล่า",
    "Have you been giving so much that you forgot to refill yourself?",
  ],
  "major-04": [
    "เรื่องไหนที่ต้องการกรอบหรือแผนที่ชัดขึ้น เพื่อให้คุณสบายใจ",
    "Which part of your life needs a clearer plan or structure to feel steady?",
    "คุณกำลังพยายามควบคุมอะไรที่ควรปล่อยให้ยืดหยุ่นขึ้นบ้าง",
    "What are you trying to control that could use a little more flexibility?",
  ],
  "major-05": [
    "มีใครหรือคำสอนไหนที่คุณอยากกลับไปขอคำแนะนำในเรื่องนี้",
    "Is there a mentor or teaching you'd like to turn to on this matter?",
    "กฎข้อไหนในชีวิตที่คุณทำตามเพราะเคยชิน ไม่ใช่เพราะเชื่อ",
    "Which rule do you follow out of habit rather than belief?",
  ],
  "major-06": [
    "การเลือกครั้งนี้ ตรงกับสิ่งที่คุณให้คุณค่าจริง ๆ หรือเปล่า",
    "Does the choice in front of you match what you truly value?",
    "ตรงไหนที่ใจกับการกระทำของคุณยังไม่ไปทางเดียวกัน",
    "Where are your heart and your actions pulling in different directions?",
  ],
  "major-07": [
    "วันนี้อยากพาเรื่องไหนไปข้างหน้า และก้าวแรกเล็กที่สุดคืออะไร",
    "What do you want to move forward today, and what's the smallest first step?",
    "คุณกำลังฝืนวิ่งไปหลายทางพร้อมกันจนไม่ถึงไหนหรือเปล่า",
    "Are you pushing in several directions at once and getting nowhere?",
  ],
  "major-08": [
    "ความอ่อนโยนต่อตัวเองแบบไหน ที่จะทำให้วันนี้ผ่านไปได้ง่ายขึ้น",
    "What kind of gentleness toward yourself would make today easier?",
    "ความสงสัยในตัวเองเรื่องไหนที่ดังกว่าความจริง",
    "Which self-doubt is speaking louder than the facts?",
  ],
  "major-09": [
    "ถ้ามีเวลาอยู่กับตัวเองหนึ่งชั่วโมง คุณอยากคิดเรื่องอะไรให้จบ",
    "If you had an hour alone, what would you want to think through?",
    "การอยู่คนเดียวช่วงนี้ เป็นการพักใจ หรือเป็นการหลบหน้า",
    "Is your time alone lately rest — or hiding?",
  ],
  "major-10": [
    "อะไรกำลังเปลี่ยนรอบตัวคุณ ที่คุณเลือกจะรับมือได้ด้วยท่าทีไหน",
    "What is shifting around you, and how do you choose to meet it?",
    "เรื่องที่วนซ้ำในชีวิต บอกอะไรที่คุณยังไม่ได้เรียนรู้",
    "What lesson might a repeating pattern in your life be asking you to learn?",
  ],
  "major-11": [
    "ถ้ามองเรื่องนี้อย่างยุติธรรมกับทุกฝ่าย รวมถึงตัวคุณเอง ภาพเป็นอย่างไร",
    "If you looked at this fairly — to everyone, including you — what would you see?",
    "มีความจริงข้อไหนที่คุณยังไม่อยากยอมรับในเรื่องนี้",
    "Which truth about this situation are you not ready to accept yet?",
  ],
  "major-12": [
    "ถ้าลองมองเรื่องที่ติดอยู่จากอีกมุมหนึ่ง คุณเห็นอะไรใหม่",
    "If you looked at what feels stuck from another angle, what new thing appears?",
    "คุณกำลังรอโดยไม่จำเป็น หรือเสียสละโดยไม่มีใครขอหรือเปล่า",
    "Are you waiting without need, or sacrificing without being asked?",
  ],
  "major-13": [
    "อะไรในชีวิตที่หมดหน้าที่แล้ว และพร้อมจะให้มันจบอย่างสวยงาม",
    "What in your life has finished its purpose and is ready to end gracefully?",
    "คุณกำลังกอดอะไรไว้แน่น ทั้งที่รู้ว่ามันควรจะไปแล้ว",
    "What are you holding on to even though you know it's time to let go?",
  ],
  "major-14": [
    "วันนี้ส่วนไหนในชีวิตที่ต้องการความพอดีมากที่สุด",
    "Which part of your life needs a little more balance today?",
    "ตรงไหนที่คุณทำมากหรือน้อยเกินไปจนเริ่มเหนื่อย",
    "Where are you doing too much — or too little — and getting tired?",
  ],
  "major-15": [
    "มีนิสัยหรือความคิดไหนที่ดึงพลังคุณไป โดยที่คุณยังยอมให้มันอยู่",
    "Which habit or thought drains you, yet you still let it stay?",
    "ถ้าวันนี้ปลดเชือกได้หนึ่งเส้น คุณอยากปลดเรื่องไหน",
    "If you could loosen one chain today, which would it be?",
  ],
  "major-16": [
    "สิ่งที่ไม่เป็นอย่างที่คิด กำลังเปิดทางให้อะไรที่จริงกว่า",
    "What has gone unlike you planned, and what truer thing might it be clearing space for?",
    "คุณกำลังกลัวการเปลี่ยนแปลงที่จริง ๆ แล้วอาจจำเป็นหรือเปล่า",
    "Are you fearing a change that might actually be necessary?",
  ],
  "major-17": [
    "วันนี้มีอะไรเล็ก ๆ ที่ทำให้คุณรู้สึกมีหวังบ้าง",
    "What small thing gives you a sense of hope today?",
    "ช่วงนี้คุณเลิกเชื่อในอะไรไป และอยากให้โอกาสมันอีกครั้งไหม",
    "What have you stopped believing in lately — and would you give it another chance?",
  ],
  "major-18": [
    "เรื่องที่ทำให้คุณกังวล ส่วนไหนคือข้อเท็จจริง และส่วนไหนคือจินตนาการ",
    "In what worries you, which part is fact and which is imagination?",
    "ความกลัวเรื่องไหนที่เริ่มคลายลงแล้ว เมื่อคุณมองมันชัดขึ้น",
    "Which fear is starting to fade now that you see it more clearly?",
  ],
  "major-19": [
    "อะไรที่ทำให้คุณยิ้มได้จริง ๆ และวันนี้จะเพิ่มมันได้อย่างไร",
    "What genuinely makes you smile, and how can you add more of it today?",
    "มีเรื่องดีไหนที่คุณยังไม่ยอมให้ตัวเองดีใจกับมันเต็มที่",
    "Is there something good you haven't let yourself fully enjoy?",
  ],
  "major-20": [
    "ถ้าวันนี้เป็นจุดเริ่มต้นใหม่ คุณอยากเรียกตัวเองแบบไหนกลับมา",
    "If today were a fresh start, which version of yourself would you call back?",
    "คุณกำลังตัดสินตัวเองหนักเกินไปในเรื่องไหน",
    "Where are you judging yourself too harshly?",
  ],
  "major-21": [
    "เรื่องไหนที่คุณทำสำเร็จมาแล้ว แต่ยังไม่เคยฉลองให้ตัวเอง",
    "What have you completed that you've never celebrated?",
    "อะไรที่ยังค้างอยู่อีกนิดเดียว และต้องการให้คุณปิดจบ",
    "What is almost finished and needs you to close it out?",
  ],
  // ── Wands (ไฟ) ──
  "wands-01": [
    "วันนี้มีไอเดียไหนที่ทำให้ใจคุณเต้นแรง และลงมือได้ภายในวันนี้",
    "Which idea makes your heart race, and could you start it today?",
    "แรงบันดาลใจหายไปไหน และอะไรที่เคยจุดไฟให้คุณได้",
    "Where did your spark go, and what used to light it?",
  ],
  "wands-02": [
    "ถ้ามองไกลไปอีกหนึ่งปี คุณอยากเห็นตัวเองยืนอยู่ตรงไหน",
    "Looking a year ahead, where would you like to be standing?",
    "ความกลัวสิ่งที่ไม่รู้กำลังทำให้คุณไม่กล้าออกจากที่เดิมหรือเปล่า",
    "Is fear of the unknown keeping you where you are?",
  ],
  "wands-03": [
    "สิ่งที่คุณลงแรงไว้ กำลังเริ่มให้ผลตรงไหนบ้าง",
    "Where is the effort you've put in starting to show results?",
    "อะไรที่ล่าช้ากว่าที่คิด และคุณจะปรับความคาดหวังอย่างไร",
    "What's taking longer than expected, and how will you adjust?",
  ],
  "wands-04": [
    "วันนี้มีใครหรืออะไรที่ทำให้คุณรู้สึกเหมือนได้กลับบ้าน",
    "Who or what makes you feel at home today?",
    "ความไม่ลงรอยในบ้านหรือทีมเรื่องไหน ที่ควรได้พูดกันตรง ๆ",
    "Which tension at home or in your team needs an honest talk?",
  ],
  "wands-05": [
    "การแข่งขันหรือความเห็นต่างวันนี้ ช่วยให้คุณเก่งขึ้นตรงไหน",
    "How might today's competition or disagreement help you grow?",
    "การทะเลาะเรื่องไหนที่คุณเลือกวางลงได้ เพื่อความสงบของตัวเอง",
    "Which argument could you set down for your own peace?",
  ],
  "wands-06": [
    "คุณภูมิใจในตัวเองเรื่องอะไรที่สุดในช่วงนี้",
    "What are you proudest of lately?",
    "คุณกำลังรอให้คนอื่นยอมรับ ก่อนจะยอมรับตัวเองหรือเปล่า",
    "Are you waiting for others' approval before you approve of yourself?",
  ],
  "wands-07": [
    "เรื่องไหนที่คุณควรยืนหยัดไว้ แม้จะมีคนไม่เห็นด้วย",
    "What is worth standing your ground on, even if some disagree?",
    "คุณกำลังป้องกันตัวเองจนเหนื่อยในเรื่องที่ไม่จำเป็นหรือเปล่า",
    "Are you exhausting yourself defending something that doesn't need it?",
  ],
  "wands-08": [
    "เรื่องที่กำลังเคลื่อนเร็ว คุณอยากให้มันไปทางไหน",
    "With things moving fast, which direction do you want them to go?",
    "อะไรที่ทำให้คุณรู้สึกว่าทุกอย่างช้าหรือสะดุด และคุณควบคุมส่วนไหนได้",
    "What feels delayed or stuck, and which part of it can you influence?",
  ],
  "wands-09": [
    "คุณยังมีแรงเหลือสำหรับเรื่องไหน และควรพักเรื่องไหนก่อน",
    "What do you still have energy for, and what should you rest from first?",
    "แผลเก่าเรื่องไหนที่ทำให้คุณระแวงเกินกว่าเหตุการณ์ตรงหน้า",
    "Which old wound makes you more guarded than this moment needs?",
  ],
  "wands-10": [
    "ภาระไหนที่คุณแบกอยู่คนเดียว ทั้งที่ขอให้คนอื่นช่วยได้",
    "Which load are you carrying alone that someone could help with?",
    "ถ้าวางลงได้หนึ่งอย่างวันนี้ คุณจะวางอะไร",
    "If you could put down one thing today, what would it be?",
  ],
  "wands-11": [
    "มีเรื่องไหนที่คุณอยากรู้อยากลอง แม้จะยังเป็นมือใหม่",
    "What are you curious to try, even as a beginner?",
    "ความกระตือรือร้นเรื่องไหนที่หายเร็วเกินไป และทำไม",
    "Which enthusiasm faded too quickly, and why?",
  ],
  "wands-12": [
    "พลังไฟในตัวคุณวันนี้ อยากพุ่งไปที่เรื่องไหน",
    "Where does your fire want to go today?",
    "ความใจร้อนเรื่องไหนที่ควรช้าลงอีกนิด",
    "Where could a little less haste serve you better?",
  ],
  "wands-13": [
    "คุณจะใช้ความมั่นใจของตัวเองให้คนรอบตัวกล้าขึ้นได้อย่างไร",
    "How could your confidence encourage the people around you?",
    "ความไม่มั่นคงเรื่องไหนที่ทำให้คุณเปรียบเทียบตัวเองกับคนอื่น",
    "Which insecurity makes you compare yourself with others?",
  ],
  "wands-14": [
    "ภาพใหญ่ที่คุณอยากนำทางไปให้ถึงคืออะไร และวันนี้ขยับได้ตรงไหน",
    "What big vision do you want to lead toward, and how can you move it today?",
    "คุณกำลังคาดหวังจากคนอื่นมากกว่าที่สื่อสารออกไปหรือเปล่า",
    "Are you expecting more from others than you've actually communicated?",
  ],
  // ── Cups (น้ำ) ──
  "cups-01": [
    "วันนี้หัวใจคุณพร้อมเปิดรับอะไรใหม่",
    "What is your heart ready to receive today?",
    "ความรู้สึกไหนที่คุณเก็บไว้ข้างในนานเกินไป",
    "Which feeling have you kept inside for too long?",
  ],
  "cups-02": [
    "ความสัมพันธ์ไหนที่ทำให้คุณรู้สึกว่าได้เป็นตัวเอง และวันนี้จะดูแลมันอย่างไร",
    "Which relationship lets you be yourself, and how will you tend it today?",
    "ตรงไหนที่การให้และการรับในความสัมพันธ์ยังไม่สมดุล",
    "Where is the give-and-take in a relationship out of balance?",
  ],
  "cups-03": [
    "วันนี้อยากแบ่งปันความสุขเล็ก ๆ กับใคร",
    "Who would you like to share a small joy with today?",
    "มีคนรอบตัวไหนที่ทำให้คุณเหนื่อยมากกว่าเติมพลัง",
    "Is there someone around you who drains more than they refill you?",
  ],
  "cups-04": [
    "มีโอกาสอะไรยื่นมาตรงหน้าที่คุณยังไม่ได้หันไปมอง",
    "Is there an offer in front of you that you haven't really looked at?",
    "ถ้าออกจากความเฉื่อยได้หนึ่งก้าว ก้าวนั้นคืออะไร",
    "If you stepped out of the slump by one step, what would it be?",
  ],
  "cups-05": [
    "ท่ามกลางสิ่งที่เสียไป ยังมีอะไรที่คุณยังมีอยู่และมีค่า",
    "Amid what's been lost, what valuable thing do you still have?",
    "คุณพร้อมจะให้อภัยตัวเองในเรื่องไหนแล้วบ้าง",
    "What are you ready to forgive yourself for?",
  ],
  "cups-06": [
    "ความทรงจำดี ๆ เรื่องไหนที่ยังให้กำลังใจคุณได้วันนี้",
    "Which good memory still gives you strength today?",
    "คุณกำลังเปรียบเทียบตอนนี้กับอดีตจนมองข้ามสิ่งดีที่มีหรือเปล่า",
    "Are you comparing now to the past so much that you miss what's good?",
  ],
  "cups-07": [
    "ในตัวเลือกทั้งหมด อันไหนที่ใจคุณกลับไปหาบ่อยที่สุด",
    "Of all your options, which one does your heart keep returning to?",
    "ความฝันเรื่องไหนที่ต้องลงรายละเอียดให้เป็นจริงได้",
    "Which dream needs real details to become possible?",
  ],
  "cups-08": [
    "มีอะไรที่ไม่เติมเต็มใจคุณแล้ว และคุณพร้อมเดินออกมา",
    "What no longer fulfils you that you're ready to walk away from?",
    "คุณกำลังลังเลจะไปหรือจะอยู่ เพราะเหตุผลหรือเพราะความกลัว",
    "Are you torn between leaving and staying because of reason — or fear?",
  ],
  "cups-09": [
    "วันนี้คุณจะขอบคุณตัวเองเรื่องอะไรได้บ้าง",
    "What can you thank yourself for today?",
    "สิ่งที่ได้มาแล้ว ทำไมยังรู้สึกไม่พอ",
    "Why might what you've gained still feel like not enough?",
  ],
  "cups-10": [
    "ความสุขในครอบครัวหรือคนใกล้ชิดแบบไหนที่คุณอยากสร้างเพิ่ม",
    "What kind of closeness with family or loved ones would you like to grow?",
    "ภาพครอบครัวในอุดมคติ กำลังทำให้คุณมองข้ามความสุขที่มีจริงหรือเปล่า",
    "Is an ideal picture of family making you overlook the real happiness you have?",
  ],
  "cups-11": [
    "วันนี้มีความรู้สึกใหม่หรือข่าวดีทางใจอะไรเข้ามาบ้าง",
    "What new feeling or tender news has come your way today?",
    "อารมณ์ไหนที่คุณตอบสนองเร็วไป ก่อนจะเข้าใจมันจริง ๆ",
    "Which emotion did you react to before really understanding it?",
  ],
  "cups-12": [
    "คุณอยากเข้าหาใครหรืออะไรด้วยหัวใจที่เปิดกว้างวันนี้",
    "Who or what would you like to approach with an open heart today?",
    "ความโรแมนติกเรื่องไหนที่อาจสวยกว่าความจริง",
    "Which romance might be lovelier in your head than in reality?",
  ],
  "cups-13": [
    "คุณจะดูแลใจตัวเองด้วยความเข้าใจแบบเดียวกับที่ให้คนอื่นได้อย่างไร",
    "How can you give yourself the same understanding you give others?",
    "ตรงไหนที่คุณรับความรู้สึกของคนอื่นมาแบกจนเกินตัว",
    "Where are you carrying other people's feelings beyond your own capacity?",
  ],
  "cups-14": [
    "วันนี้คุณจะรักษาความสงบในใจได้อย่างไร แม้รอบตัวจะวุ่นวาย",
    "How will you keep calm inside today, even if things around you are busy?",
    "อารมณ์ไหนที่คุณกดไว้ เพื่อให้ดูเหมือนควบคุมได้",
    "Which emotion are you suppressing to look in control?",
  ],
  // ── Swords (ลม) ──
  "swords-01": [
    "ถ้าต้องพูดความจริงหนึ่งประโยควันนี้ ประโยคนั้นคืออะไร",
    "If you had to speak one honest sentence today, what would it be?",
    "ความคิดไหนที่สับสนอยู่ และต้องการเวลาเรียบเรียงก่อนตัดสิน",
    "Which thought is muddled and needs time before you decide?",
  ],
  "swords-02": [
    "การตัดสินใจที่ค้างอยู่ ข้อมูลอะไรที่คุณยังขาด",
    "For the decision you're stuck on, what information is still missing?",
    "คุณกำลังหลีกเลี่ยงการเลือก เพราะกลัวจะเสียอีกทางหรือเปล่า",
    "Are you avoiding a choice because you fear losing the other option?",
  ],
  "swords-03": [
    "ความเจ็บไหนที่ต้องการให้คุณยอมรับว่ามันเจ็บจริง ๆ",
    "Which hurt needs you to admit that it really hurts?",
    "แผลใจเรื่องไหนที่เริ่มสมานแล้ว และคุณอยากดูแลมันต่ออย่างไร",
    "Which heartache is starting to heal, and how will you keep caring for it?",
  ],
  "swords-04": [
    "วันนี้คุณจะพักแบบไหน ให้ใจและหัวได้หยุดจริง ๆ",
    "How will you rest today so your mind can truly stop?",
    "คุณพักนานพอแล้วหรือยัง และพร้อมกลับมาเรื่องไหน",
    "Have you rested enough, and what are you ready to return to?",
  ],
  "swords-05": [
    "ชัยชนะแบบไหนที่คุ้มกับสิ่งที่ต้องเสีย และแบบไหนที่ไม่คุ้ม",
    "Which wins are worth what they cost, and which aren't?",
    "มีความขัดแย้งไหนที่คุณพร้อมจะยื่นมือไปคืนดีก่อน",
    "Is there a conflict where you're ready to reach out first?",
  ],
  "swords-06": [
    "คุณกำลังพาตัวเองออกจากเรื่องหนักไปสู่อะไรที่สงบกว่า — ก้าวต่อไปคืออะไร",
    "As you move away from something heavy, what is your next calm step?",
    "อะไรที่คุณยังแบกติดตัวมาจากเรื่องเก่า ทั้งที่ไม่จำเป็นแล้ว",
    "What are you still carrying from the past that you no longer need?",
  ],
  "swords-07": [
    "มีเรื่องไหนที่ต้องการกลยุทธ์มากกว่าแรง",
    "Which situation needs strategy rather than force?",
    "มีความจริงไหนที่ควรพูดออกมา เพื่อให้ใจเบาลง",
    "Is there a truth that, once spoken, would lighten your heart?",
  ],
  "swords-08": [
    "ข้อจำกัดไหนที่อยู่ในความคิด มากกว่าในความเป็นจริง",
    "Which limit lives more in your mind than in reality?",
    "ถ้าวันนี้คลายปมได้หนึ่งปม คุณจะเริ่มจากตรงไหน",
    "If you could undo one knot today, where would you start?",
  ],
  "swords-09": [
    "ความกังวลที่วนในหัว ถ้าเขียนลงกระดาษแล้ว มันใหญ่เท่าที่คิดไหม",
    "If you wrote your worry on paper, is it as big as it feels?",
    "ใครที่คุณอยากเล่าเรื่องที่กังวลให้ฟัง เพื่อไม่ต้องแบกคนเดียว",
    "Who could you tell about your worry so you don't carry it alone?",
  ],
  "swords-10": [
    "ถ้าตอนนี้คือจุดต่ำสุด อะไรคือสิ่งแรกที่ช่วยให้คุณลุกขึ้น",
    "If this is the lowest point, what is the first thing that helps you get up?",
    "คุณพร้อมจะปล่อยวางเรื่องที่จบไปแล้วจริง ๆ หรือยัง",
    "Are you ready to truly let go of what has already ended?",
  ],
  "swords-11": [
    "วันนี้มีเรื่องอะไรที่คุณอยากถามให้ชัด แทนที่จะเดาเอา",
    "What would you like to ask about plainly today instead of guessing?",
    "คำพูดหรือข่าวลือไหนที่คุณควรตรวจสอบก่อนเชื่อ",
    "Which words or rumours should you check before believing?",
  ],
  "swords-12": [
    "ความตั้งใจไหนที่ควรพุ่งไปข้างหน้าอย่างชัดเจนวันนี้",
    "Which intention deserves clear, decisive action today?",
    "คุณกำลังรีบตัดสินจนข้ามรายละเอียดสำคัญหรือเปล่า",
    "Are you rushing to judgement and skipping important details?",
  ],
  "swords-13": [
    "ขอบเขตแบบไหนที่คุณต้องพูดให้ชัด เพื่อดูแลตัวเอง",
    "Which boundary do you need to state clearly to look after yourself?",
    "ความตรงไปตรงมาของคุณวันนี้ ทำร้ายใครโดยไม่ตั้งใจหรือเปล่า",
    "Might your directness today hurt someone without meaning to?",
  ],
  "swords-14": [
    "ถ้าตัดสินเรื่องนี้ด้วยเหตุผลล้วน ๆ คำตอบคืออะไร",
    "If you decided this purely on reason, what would the answer be?",
    "ตรงไหนที่เหตุผลของคุณเริ่มแข็งจนไม่ฟังความรู้สึก",
    "Where has your logic become so rigid it stops hearing feelings?",
  ],
  // ── Pentacles (ดิน) ──
  "pentacles-01": [
    "โอกาสที่จับต้องได้ไหนที่คุณอยากเริ่มปลูกวันนี้",
    "Which tangible opportunity would you like to plant today?",
    "มีโอกาสไหนที่หลุดมือไป และคุณเรียนรู้อะไรจากมัน",
    "Which opportunity slipped away, and what did it teach you?",
  ],
  "pentacles-02": [
    "วันนี้คุณต้องบาลานซ์อะไรบ้าง และอะไรควรมาก่อน",
    "What are you juggling today, and what should come first?",
    "คุณรับเรื่องมากจนเริ่มทำอะไรได้ไม่ดีสักอย่างหรือเปล่า",
    "Have you taken on so much that nothing is getting done well?",
  ],
  "pentacles-03": [
    "งานไหนที่จะดีขึ้นถ้าได้ร่วมมือกับคนอื่น",
    "Which work would improve if you collaborated with someone?",
    "ตรงไหนที่ทีมยังไม่เข้าใจตรงกัน และควรคุยให้ชัด",
    "Where is your team not on the same page, needing a clear talk?",
  ],
  "pentacles-04": [
    "ความมั่นคงที่คุณสร้างไว้ ทำให้คุณสบายใจหรือทำให้คุณกลัวจะเสีย",
    "Does the security you've built bring you ease — or fear of losing it?",
    "มีอะไรที่คุณพร้อมจะผ่อนมือ และแบ่งปันออกไปบ้าง",
    "What are you ready to loosen your grip on and share?",
  ],
  "pentacles-05": [
    "ในช่วงที่ขาด ใครหรืออะไรที่คุณยังขอความช่วยเหลือได้",
    "In a time of lack, who or what can you still ask for help?",
    "สัญญาณดีเล็ก ๆ อะไรบ้างที่บอกว่าช่วงยากกำลังผ่อนลง",
    "Which small signs show that the hard stretch is easing?",
  ],
  "pentacles-06": [
    "วันนี้คุณอยากให้หรือรับอะไร อย่างพอดีและเต็มใจ",
    "What would you like to give or receive today, freely and in balance?",
    "การช่วยเหลือแบบไหนที่มีเงื่อนไขแอบแฝงอยู่ ทั้งฝั่งให้และฝั่งรับ",
    "Where does help come with hidden strings — given or received?",
  ],
  "pentacles-07": [
    "สิ่งที่ลงแรงไว้ คุณอยากประเมินมันตรงไหนก่อนลงแรงต่อ",
    "What would you like to assess before investing more effort?",
    "ความใจร้อนอยากเห็นผลเรื่องไหน ที่ควรให้เวลามันอีกหน่อย",
    "Which result are you impatient for that needs a bit more time?",
  ],
  "pentacles-08": [
    "ทักษะไหนที่คุณอยากฝึกให้ดีขึ้นอีกนิดวันนี้",
    "Which skill would you like to practise a little more today?",
    "คุณกำลังทำงานซ้ำ ๆ จนลืมว่าทำไปเพื่ออะไรหรือเปล่า",
    "Have you been repeating work so long you forgot why you do it?",
  ],
  "pentacles-09": [
    "อะไรที่คุณสร้างมาเองแล้วภูมิใจ และวันนี้จะดื่มด่ำกับมันอย่างไร",
    "What have you built yourself that you're proud of, and how will you enjoy it today?",
    "ความสบายที่มี กำลังทำให้คุณห่างจากคนอื่นหรือเปล่า",
    "Is your comfort making you distant from others?",
  ],
  "pentacles-10": [
    "สิ่งที่คุณอยากส่งต่อให้คนรุ่นหลังหรือคนที่รักคืออะไร",
    "What would you like to pass on to loved ones or those who come after?",
    "เรื่องเงินหรือมรดกไหนที่ควรคุยกันให้ชัดในครอบครัว",
    "Which money or family matter needs a clear conversation?",
  ],
  "pentacles-11": [
    "วันนี้คุณอยากเรียนรู้อะไรใหม่สักอย่าง เพื่ออนาคตที่มั่นคงขึ้น",
    "What would you like to learn today for a steadier future?",
    "แผนไหนที่คุณวางไว้ แต่ยังไม่ได้เริ่มลงมือจริง",
    "Which plan have you made but not yet started?",
  ],
  "pentacles-12": [
    "ความสม่ำเสมอเล็ก ๆ แบบไหนที่จะพาคุณไปถึงเป้าหมาย",
    "What small, steady habit would carry you to your goal?",
    "ตรงไหนที่ความระมัดระวังกลายเป็นการไม่กล้าขยับ",
    "Where has caution turned into not daring to move?",
  ],
  "pentacles-13": [
    "วันนี้คุณจะดูแลร่างกายและบ้านของตัวเองให้รู้สึกอบอุ่นได้อย่างไร",
    "How will you care for your body and home so they feel warm today?",
    "คุณดูแลคนอื่นจนลืมดูแลตัวเองเรื่องไหน",
    "Where have you cared for others so much that you neglected yourself?",
  ],
  "pentacles-14": [
    "ความสำเร็จแบบไหนที่คุณอยากสร้างให้มั่นคงและยั่งยืน",
    "What kind of success do you want to make steady and lasting?",
    "ความต้องการมีมากขึ้นเรื่องไหน ที่ทำให้คุณลืมสิ่งที่สำคัญกว่า",
    "Where is wanting more making you forget what matters most?",
  ],
};

/** คำถามของไพ่ใบนี้ตามทิศและภาษา — ไม่มีในคลัง = undefined (ไม่เดาแทน) */
export function reflectionPromptFor(cardId: string, isReversed: boolean, isEnglish: boolean): string | undefined {
  const p = REFLECTION_PROMPTS[cardId];
  if (!p) return undefined;
  return p[(isReversed ? 2 : 0) + (isEnglish ? 1 : 0)];
}
