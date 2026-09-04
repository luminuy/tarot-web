/**
 * 🌙 Real-Time Cosmic & Moon Phase Grounding Engine
 * --------------------------------------------------
 * คำนวณดิถีพระจันทร์ (Moon Phase) และดาวครองวัน (Planetary Day Ruler)
 * ตามเวลาจริงด้วยสูตรคณิตศาสตร์ดาราศาสตร์ (Zero External API Cost)
 * เพื่อใช้เป็นพลังงานเปิดผังพยากรณ์และสร้างความแม่นยำสอดคล้องกับห้วงเวลาจริง
 */

export interface MoonPhaseInfo {
  nameTh: string;
  nameEn: string;
  phaseCode:
    | "new_moon"
    | "waxing_crescent"
    | "first_quarter"
    | "waxing_gibbous"
    | "full_moon"
    | "waning_gibbous"
    | "last_quarter"
    | "waning_crescent";
  illuminationPercent: number;
  energyTheme: string;
}

export interface DayRulerInfo {
  dayNameTh: string;
  planetTh: string;
  planetEn: string;
  element: "ไฟ" | "น้ำ" | "ลม" | "ดิน";
  energyTheme: string;
}

export interface CosmicContext {
  moon: MoonPhaseInfo;
  day: DayRulerInfo;
  promptAnchor: string;
}

// อ้างอิงจุดจันทร์ดับแม่นยำ (Reference New Moon: 2000-01-06 18:14 UTC)
const SYNODIC_MONTH_DAYS = 29.53058867;
const REF_NEW_MOON_EPOCH_MS = 947182440000;

/**
 * คำนวณดิถีพระจันทร์ตามเวลาจริง
 */
export function calculateMoonPhase(date: Date = new Date()): MoonPhaseInfo {
  const diffMs = date.getTime() - REF_NEW_MOON_EPOCH_MS;
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  const cycleDay = ((diffDays % SYNODIC_MONTH_DAYS) + SYNODIC_MONTH_DAYS) % SYNODIC_MONTH_DAYS;
  const cycleFraction = cycleDay / SYNODIC_MONTH_DAYS;

  // ประมาณการความสว่างของผิวดวงจันทร์ (0% ถึง 100%)
  const illuminationPercent = Math.round((1 - Math.cos(2 * Math.PI * cycleFraction)) * 50);

  if (cycleFraction < 0.03 || cycleFraction >= 0.97) {
    return {
      nameTh: "จันทร์ดับ (New Moon)",
      nameEn: "New Moon",
      phaseCode: "new_moon",
      illuminationPercent,
      energyTheme: "การตั้งจิตอธิษฐาน การเริ่มต้นจากศูนย์ และการชำระล้างพลังงานเก่า",
    };
  }
  if (cycleFraction < 0.22) {
    return {
      nameTh: "จันทร์เสี้ยวข้างขึ้น (Waxing Crescent)",
      nameEn: "Waxing Crescent",
      phaseCode: "waxing_crescent",
      illuminationPercent,
      energyTheme: "การบ่มเพาะความหวัง ก้าวแรกของการลงมือทำ และการปลูกเมล็ดพันธุ์ใหม่",
    };
  }
  if (cycleFraction < 0.28) {
    return {
      nameTh: "จันทร์ครึ่งดวงแรก (First Quarter)",
      nameEn: "First Quarter",
      phaseCode: "first_quarter",
      illuminationPercent,
      energyTheme: "การตัดสินใจอย่างเด็ดขาด การก้าวข้ามบททดสอบ และการยืนหยัดในเป้าหมาย",
    };
  }
  if (cycleFraction < 0.47) {
    return {
      nameTh: "จันทร์นูนข้างขึ้น (Waxing Gibbous)",
      nameEn: "Waxing Gibbous",
      phaseCode: "waxing_gibbous",
      illuminationPercent,
      energyTheme: "การปรับจูนรายละเอียด การอดทนขัดเกลา และเตรียมพร้อมรับผลลัพธ์",
    };
  }
  if (cycleFraction < 0.53) {
    return {
      nameTh: "จันทร์เพ็ญเต็มดวง (Full Moon)",
      nameEn: "Full Moon",
      phaseCode: "full_moon",
      illuminationPercent,
      energyTheme: "พลังการตระหนักรู้สูงสุด การส่องสว่างจุดบอด และการเฉลิมฉลองความจริง",
    };
  }
  if (cycleFraction < 0.72) {
    return {
      nameTh: "จันทร์นูนข้างแรม (Waning Gibbous)",
      nameEn: "Waning Gibbous",
      phaseCode: "waning_gibbous",
      illuminationPercent,
      energyTheme: "การแบ่งปันบทเรียน การซาบซึ้งคุณค่า และการถ่ายทอดปัญญา",
    };
  }
  if (cycleFraction < 0.78) {
    return {
      nameTh: "จันทร์ครึ่งดวงสุดท้าย (Last Quarter)",
      nameEn: "Last Quarter",
      phaseCode: "last_quarter",
      illuminationPercent,
      energyTheme: "การปลดแอก การให้อภัย และการสะสางสิ่งที่หมดความจำเป็น",
    };
  }
  return {
    nameTh: "จันทร์เสี้ยวข้างแรม (Waning Crescent)",
    nameEn: "Waning Crescent",
    phaseCode: "waning_crescent",
    illuminationPercent,
    energyTheme: "ความสงบนิ่ง การฟื้นฟูจิตวิญญาณภายใน และการพักผ่อนเพื่อเตรียมรับรอบใหม่",
  };
}

/**
 * คำนวณดาวครองวันและธาตุประจำวันตามศาสตร์โบราณ
 */
export function calculateDayRuler(date: Date = new Date()): DayRulerInfo {
  // getDay(): 0 = อาทิตย์, 1 = จันทร์, ..., 6 = เสาร์
  const dayIndex = date.getDay();

  switch (dayIndex) {
    case 0:
      return {
        dayNameTh: "วันอาทิตย์",
        planetTh: "พระอาทิตย์ (Sol)",
        planetEn: "Sun",
        element: "ไฟ",
        energyTheme: "พลังแห่งตัวตน เจตจำนงที่มุ่งมั่น ความชัดเจน และเกียรติยศ",
      };
    case 1:
      return {
        dayNameTh: "วันจันทร์",
        planetTh: "พระจันทร์ (Luna)",
        planetEn: "Moon",
        element: "น้ำ",
        energyTheme: "พลังแห่งจิตใต้สำนึก สัญชาตญาณ อารมณ์ความรู้สึก และการเยียวยา",
      };
    case 2:
      return {
        dayNameTh: "วันอังคาร",
        planetTh: "ดาวอังคาร (Mars)",
        planetEn: "Mars",
        element: "ไฟ",
        energyTheme: "พลังแห่งความกล้าหาญ การขับเคลื่อน การปกป้อง และการตัดทอนสิ่งที่ไร้ประโยชน์",
      };
    case 3:
      return {
        dayNameTh: "วันพุธ",
        planetTh: "ดาวพุธ (Mercury)",
        planetEn: "Mercury",
        element: "ลม",
        energyTheme: "พลังแห่งสติปัญญา การสื่อสาร ความคล่องตัว และการเชื่อมโยงข้อมูล",
      };
    case 4:
      return {
        dayNameTh: "วันพฤหัสบดี",
        planetTh: "ดาวพฤหัสบดี (Jupiter)",
        planetEn: "Jupiter",
        element: "ดิน",
        energyTheme: "พลังแห่งการขยายตัว โอกาส ปรัชญาชีวิต โชคลาภ และวิสัยทัศน์กว้างไกล",
      };
    case 5:
      return {
        dayNameTh: "วันศุกร์",
        planetTh: "ดาวศุกร์ (Venus)",
        planetEn: "Venus",
        element: "น้ำ",
        energyTheme: "พลังแห่งความรัก เสน่ห์ ความกลมเกลียว ความอุดมสมบูรณ์ และสุนทรียภาพ",
      };
    case 6:
    default:
      return {
        dayNameTh: "วันเสาร์",
        planetTh: "ดาวเสาร์ (Saturn)",
        planetEn: "Saturn",
        element: "ดิน",
        energyTheme: "พลังแห่งวินัย รากฐานความมั่นคง ความอดทน และบทเรียนแห่งความจริง",
      };
  }
}

/**
 * รวมบริบทจักรวาลสำหรับนำไปฉีดใน Prompt ของ AI
 */
export function getCosmicContext(date: Date = new Date()): CosmicContext {
  const moon = calculateMoonPhase(date);
  const day = calculateDayRuler(date);

  const promptAnchor = `✦ ห้วงเวลาจักรวาลขณะเปิดไพ่: ${day.dayNameTh} ครองโดย${day.planetTh} (ธาตุ${day.element}) | ดิถีพระจันทร์: ${moon.nameTh} สว่าง ${moon.illuminationPercent}%
  คลื่นพลังงานธรรมชาติ: ${day.energyTheme} ผสานกับ ${moon.energyTheme}`;

  return {
    moon,
    day,
    promptAnchor,
  };
}
