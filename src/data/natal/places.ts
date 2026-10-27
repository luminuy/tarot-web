/**
 * 📍 สถานที่เกิดสำหรับผังดวงกำเนิด `/natal-chart`
 * ===========================================================================
 * - จังหวัดไทย 77 จังหวัด: พิกัดตัวเมืองของจังหวัด (ศาลากลาง/ตัวอำเภอเมือง) จาก Wikidata
 *   (ทรัพย์สิน P36 เมืองหลวง ➔ P625 พิกัด · ดึงเมื่อ 2026-10-27) · กรุงเทพฯ ใช้พิกัดเสาชิงช้า
 * - เมืองต่างประเทศ: เมืองใหญ่ที่คนไทยไปเกิด/ย้ายไปอยู่บ่อย พร้อมเขตเวลา IANA
 *   (เวลาออมแสงและเขตเวลาย้อนหลังคำนวณด้วย `Intl` ของเบราว์เซอร์ — ไม่ต้องเก็บตารางเอง)
 *
 * ความแม่นที่ต้องการ: พิกัดคลาด 0.05 องศา (ราว 5 กม.) ทำให้ลัคนาเลื่อนราว 0.1 องศา — เล็กกว่าความคลาดของเวลาเกิดที่คนจำได้มาก
 */

import { APP_TIME_ZONE } from "@/lib/time/bangkok";

export interface BirthPlace {
  id: string;
  th: string;
  en: string;
  lat: number;
  lon: number;
  /** เขตเวลา IANA */
  zone: string;
}

type Row = readonly [th: string, en: string, lat: number, lon: number];

const PROVINCE_ROWS: readonly Row[] = [
  ["กรุงเทพมหานคร", "Bangkok", 13.7525, 100.4942],
  ["กระบี่", "Krabi", 8.0592, 98.9189],
  ["กาญจนบุรี", "Kanchanaburi", 14.0194, 99.5311],
  ["กาฬสินธุ์", "Kalasin", 16.4333, 103.5000],
  ["กำแพงเพชร", "Kamphaeng Phet", 16.4811, 99.5222],
  ["ขอนแก่น", "Khon Kaen", 16.4297, 102.8297],
  ["จันทบุรี", "Chanthaburi", 12.6086, 102.1039],
  ["ฉะเชิงเทรา", "Chachoengsao", 13.6903, 101.0703],
  ["ชลบุรี", "Chon Buri", 13.3611, 100.9850],
  ["ชัยนาท", "Chai Nat", 15.1872, 100.1283],
  ["ชัยภูมิ", "Chaiyaphum", 15.8056, 102.0311],
  ["ชุมพร", "Chumphon", 10.4939, 99.1800],
  ["ตรัง", "Trang", 7.5561, 99.6114],
  ["ตราด", "Trat", 12.2419, 102.5149],
  ["ตาก", "Tak", 16.8711, 99.1250],
  ["นครนายก", "Nakhon Nayok", 14.2031, 101.2150],
  ["นครปฐม", "Nakhon Pathom", 13.8194, 100.0581],
  ["นครพนม", "Nakhon Phanom", 17.4069, 104.7808],
  ["นครราชสีมา", "Nakhon Ratchasima", 14.9736, 102.0831],
  ["นครศรีธรรมราช", "Nakhon Si Thammarat", 8.4363, 99.9630],
  ["นครสวรรค์", "Nakhon Sawan", 15.7133, 100.1353],
  ["นนทบุรี", "Nonthaburi", 13.8667, 100.5167],
  ["นราธิวาส", "Narathiwat", 6.4264, 101.8231],
  ["น่าน", "Nan", 18.7893, 100.7766],
  ["บึงกาฬ", "Bueng Kan", 18.3669, 103.6552],
  ["บุรีรัมย์", "Buriram", 14.9942, 103.1022],
  ["ปทุมธานี", "Pathum Thani", 14.0511, 100.4828],
  ["ประจวบคีรีขันธ์", "Prachuap Khiri Khan", 11.8089, 99.7980],
  ["ปราจีนบุรี", "Prachin Buri", 14.0567, 101.3739],
  ["ปัตตานี", "Pattani", 6.8664, 101.2508],
  ["พระนครศรีอยุธยา", "Ayutthaya", 14.3594, 100.5761],
  ["พะเยา", "Phayao", 19.1652, 99.9036],
  ["พังงา", "Phang Nga", 8.4644, 98.5317],
  ["พัทลุง", "Phatthalung", 7.6178, 100.0778],
  ["พิจิตร", "Phichit", 16.4431, 100.3467],
  ["พิษณุโลก", "Phitsanulok", 16.8158, 100.2636],
  ["ภูเก็ต", "Phuket", 7.8881, 98.3975],
  ["มหาสารคาม", "Maha Sarakham", 16.1772, 103.3008],
  ["มุกดาหาร", "Mukdahan", 16.5431, 104.7228],
  ["ยะลา", "Yala", 6.5397, 101.2811],
  ["ยโสธร", "Yasothon", 15.7972, 104.1431],
  ["ระนอง", "Ranong", 9.9619, 98.6389],
  ["ระยอง", "Rayong", 12.6742, 101.2789],
  ["ราชบุรี", "Ratchaburi", 13.5367, 99.8169],
  ["ร้อยเอ็ด", "Roi Et", 16.0533, 103.6513],
  ["ลพบุรี", "Lopburi", 14.8000, 100.6269],
  ["ลำปาง", "Lampang", 18.3000, 99.5000],
  ["ลำพูน", "Lamphun", 18.5803, 99.0072],
  ["ศรีสะเกษ", "Si Sa Ket", 15.1072, 104.3291],
  ["สกลนคร", "Sakon Nakhon", 17.1564, 104.1456],
  ["สงขลา", "Songkhla", 7.2061, 100.5967],
  ["สตูล", "Satun", 6.6147, 100.0681],
  ["สมุทรปราการ", "Samut Prakan", 13.6004, 100.5964],
  ["สมุทรสงคราม", "Samut Songkhram", 13.4097, 100.0017],
  ["สมุทรสาคร", "Samut Sakhon", 13.5486, 100.2775],
  ["สระบุรี", "Saraburi", 14.5286, 100.9114],
  ["สระแก้ว", "Sa Kaeo", 13.8206, 102.0589],
  ["สิงห์บุรี", "Sing Buri", 14.8911, 100.4031],
  ["สุพรรณบุรี", "Suphan Buri", 14.4675, 100.1169],
  ["สุราษฎร์ธานี", "Surat Thani", 9.1397, 99.3306],
  ["สุรินทร์", "Surin", 14.8864, 103.4932],
  ["สุโขทัย", "Sukhothai", 17.0142, 99.8219],
  ["หนองคาย", "Nong Khai", 17.8842, 102.7467],
  ["หนองบัวลำภู", "Nong Bua Lamphu", 17.2042, 102.4444],
  ["อำนาจเจริญ", "Amnat Charoen", 15.8758, 104.6223],
  ["อุดรธานี", "Udon Thani", 17.4253, 102.7902],
  ["อุตรดิตถ์", "Uttaradit", 17.6256, 100.0942],
  ["อุทัยธานี", "Uthai Thani", 15.3800, 100.0250],
  ["อุบลราชธานี", "Ubon Ratchathani", 15.2281, 104.8594],
  ["อ่างทอง", "Ang Thong", 14.5926, 100.4574],
  ["เชียงราย", "Chiang Rai", 19.9094, 99.8275],
  ["เชียงใหม่", "Chiang Mai", 18.7889, 98.9833],
  ["เพชรบุรี", "Phetchaburi", 13.1119, 99.9458],
  ["เพชรบูรณ์", "Phetchabun", 16.4169, 101.1533],
  ["เลย", "Loei", 17.4853, 101.7307],
  ["แพร่", "Phrae", 18.1456, 100.1414],
  ["แม่ฮ่องสอน", "Mae Hong Son", 19.3011, 97.9700],
];

/** จังหวัดไทย 77 จังหวัด (กรุงเทพฯ ขึ้นก่อน ที่เหลือเรียงตามชื่อไทย) */
export const THAI_PROVINCES: readonly BirthPlace[] = PROVINCE_ROWS.map(([th, en, lat, lon]) => ({
  id: `th-${en.toLowerCase().replace(/[^a-z]+/g, "-")}`,
  th,
  en,
  lat,
  lon,
  zone: APP_TIME_ZONE,
}));

type WorldRow = readonly [th: string, en: string, lat: number, lon: number, zone: string];

const WORLD_ROWS: readonly WorldRow[] = [
  ["เวียงจันทน์ ลาว", "Vientiane, Laos", 17.9757, 102.6331, "Asia/Vientiane"],
  ["พนมเปญ กัมพูชา", "Phnom Penh, Cambodia", 11.5564, 104.9282, "Asia/Phnom_Penh"],
  ["ย่างกุ้ง เมียนมา", "Yangon, Myanmar", 16.8409, 96.1735, "Asia/Yangon"],
  ["กัวลาลัมเปอร์ มาเลเซีย", "Kuala Lumpur, Malaysia", 3.139, 101.6869, "Asia/Kuala_Lumpur"],
  ["สิงคโปร์", "Singapore", 1.3521, 103.8198, "Asia/Singapore"],
  ["จาการ์ตา อินโดนีเซีย", "Jakarta, Indonesia", -6.2088, 106.8456, "Asia/Jakarta"],
  ["มะนิลา ฟิลิปปินส์", "Manila, Philippines", 14.5995, 120.9842, "Asia/Manila"],
  ["ฮานอย เวียดนาม", "Hanoi, Vietnam", 21.0278, 105.8342, APP_TIME_ZONE],
  ["โฮจิมินห์ซิตี เวียดนาม", "Ho Chi Minh City, Vietnam", 10.8231, 106.6297, "Asia/Ho_Chi_Minh"],
  ["ฮ่องกง", "Hong Kong", 22.3193, 114.1694, "Asia/Hong_Kong"],
  ["ไทเป ไต้หวัน", "Taipei, Taiwan", 25.033, 121.5654, "Asia/Taipei"],
  ["ปักกิ่ง จีน", "Beijing, China", 39.9042, 116.4074, "Asia/Shanghai"],
  ["เซี่ยงไฮ้ จีน", "Shanghai, China", 31.2304, 121.4737, "Asia/Shanghai"],
  ["คุนหมิง จีน", "Kunming, China", 25.0389, 102.7183, "Asia/Shanghai"],
  ["โตเกียว ญี่ปุ่น", "Tokyo, Japan", 35.6762, 139.6503, "Asia/Tokyo"],
  ["โอซาก้า ญี่ปุ่น", "Osaka, Japan", 34.6937, 135.5023, "Asia/Tokyo"],
  ["โซล เกาหลีใต้", "Seoul, South Korea", 37.5665, 126.978, "Asia/Seoul"],
  ["นิวเดลี อินเดีย", "New Delhi, India", 28.6139, 77.209, "Asia/Kolkata"],
  ["มุมไบ อินเดีย", "Mumbai, India", 19.076, 72.8777, "Asia/Kolkata"],
  ["กาฐมาณฑุ เนปาล", "Kathmandu, Nepal", 27.7172, 85.324, "Asia/Kathmandu"],
  ["ธากา บังกลาเทศ", "Dhaka, Bangladesh", 23.8103, 90.4125, "Asia/Dhaka"],
  ["โคลัมโบ ศรีลังกา", "Colombo, Sri Lanka", 6.9271, 79.8612, "Asia/Colombo"],
  ["ดูไบ สหรัฐอาหรับเอมิเรตส์", "Dubai, UAE", 25.2048, 55.2708, "Asia/Dubai"],
  ["ริยาด ซาอุดีอาระเบีย", "Riyadh, Saudi Arabia", 24.7136, 46.6753, "Asia/Riyadh"],
  ["เทลอาวีฟ อิสราเอล", "Tel Aviv, Israel", 32.0853, 34.7818, "Asia/Jerusalem"],
  ["อิสตันบูล ตุรกี", "Istanbul, Turkey", 41.0082, 28.9784, "Europe/Istanbul"],
  ["มอสโก รัสเซีย", "Moscow, Russia", 55.7558, 37.6173, "Europe/Moscow"],
  ["ลอนดอน สหราชอาณาจักร", "London, UK", 51.5074, -0.1278, "Europe/London"],
  ["ปารีส ฝรั่งเศส", "Paris, France", 48.8566, 2.3522, "Europe/Paris"],
  ["เบอร์ลิน เยอรมนี", "Berlin, Germany", 52.52, 13.405, "Europe/Berlin"],
  ["มิวนิก เยอรมนี", "Munich, Germany", 48.1351, 11.582, "Europe/Berlin"],
  ["ฟรังก์เฟิร์ต เยอรมนี", "Frankfurt, Germany", 50.1109, 8.6821, "Europe/Berlin"],
  ["อัมสเตอร์ดัม เนเธอร์แลนด์", "Amsterdam, Netherlands", 52.3676, 4.9041, "Europe/Amsterdam"],
  ["บรัสเซลส์ เบลเยียม", "Brussels, Belgium", 50.8503, 4.3517, "Europe/Brussels"],
  ["ซูริก สวิตเซอร์แลนด์", "Zurich, Switzerland", 47.3769, 8.5417, "Europe/Zurich"],
  ["เวียนนา ออสเตรีย", "Vienna, Austria", 48.2082, 16.3738, "Europe/Vienna"],
  ["ปราก เช็กเกีย", "Prague, Czechia", 50.0755, 14.4378, "Europe/Prague"],
  ["โรม อิตาลี", "Rome, Italy", 41.9028, 12.4964, "Europe/Rome"],
  ["มิลาน อิตาลี", "Milan, Italy", 45.4642, 9.19, "Europe/Rome"],
  ["มาดริด สเปน", "Madrid, Spain", 40.4168, -3.7038, "Europe/Madrid"],
  ["บาร์เซโลนา สเปน", "Barcelona, Spain", 41.3874, 2.1686, "Europe/Madrid"],
  ["ลิสบอน โปรตุเกส", "Lisbon, Portugal", 38.7223, -9.1393, "Europe/Lisbon"],
  ["สตอกโฮล์ม สวีเดน", "Stockholm, Sweden", 59.3293, 18.0686, "Europe/Stockholm"],
  ["ออสโล นอร์เวย์", "Oslo, Norway", 59.9139, 10.7522, "Europe/Oslo"],
  ["โคเปนเฮเกน เดนมาร์ก", "Copenhagen, Denmark", 55.6761, 12.5683, "Europe/Copenhagen"],
  ["เฮลซิงกิ ฟินแลนด์", "Helsinki, Finland", 60.1699, 24.9384, "Europe/Helsinki"],
  ["ดับลิน ไอร์แลนด์", "Dublin, Ireland", 53.3498, -6.2603, "Europe/Dublin"],
  ["นิวยอร์ก สหรัฐอเมริกา", "New York, USA", 40.7128, -74.006, "America/New_York"],
  ["บอสตัน สหรัฐอเมริกา", "Boston, USA", 42.3601, -71.0589, "America/New_York"],
  ["วอชิงตัน ดี.ซี. สหรัฐอเมริกา", "Washington, D.C., USA", 38.9072, -77.0369, "America/New_York"],
  ["ไมอามี สหรัฐอเมริกา", "Miami, USA", 25.7617, -80.1918, "America/New_York"],
  ["ชิคาโก สหรัฐอเมริกา", "Chicago, USA", 41.8781, -87.6298, "America/Chicago"],
  ["ฮิวสตัน สหรัฐอเมริกา", "Houston, USA", 29.7604, -95.3698, "America/Chicago"],
  ["เดนเวอร์ สหรัฐอเมริกา", "Denver, USA", 39.7392, -104.9903, "America/Denver"],
  ["ฟีนิกซ์ สหรัฐอเมริกา", "Phoenix, USA", 33.4484, -112.074, "America/Phoenix"],
  ["ลาสเวกัส สหรัฐอเมริกา", "Las Vegas, USA", 36.1699, -115.1398, "America/Los_Angeles"],
  ["ลอสแอนเจลิส สหรัฐอเมริกา", "Los Angeles, USA", 34.0522, -118.2437, "America/Los_Angeles"],
  ["ซานฟรานซิสโก สหรัฐอเมริกา", "San Francisco, USA", 37.7749, -122.4194, "America/Los_Angeles"],
  ["ซีแอตเทิล สหรัฐอเมริกา", "Seattle, USA", 47.6062, -122.3321, "America/Los_Angeles"],
  ["โฮโนลูลู สหรัฐอเมริกา", "Honolulu, USA", 21.3069, -157.8583, "Pacific/Honolulu"],
  ["โทรอนโต แคนาดา", "Toronto, Canada", 43.6532, -79.3832, "America/Toronto"],
  ["แวนคูเวอร์ แคนาดา", "Vancouver, Canada", 49.2827, -123.1207, "America/Vancouver"],
  ["เม็กซิโกซิตี เม็กซิโก", "Mexico City, Mexico", 19.4326, -99.1332, "America/Mexico_City"],
  ["เซาเปาลู บราซิล", "Sao Paulo, Brazil", -23.5505, -46.6333, "America/Sao_Paulo"],
  ["บัวโนสไอเรส อาร์เจนตินา", "Buenos Aires, Argentina", -34.6037, -58.3816, "America/Argentina/Buenos_Aires"],
  ["ซิดนีย์ ออสเตรเลีย", "Sydney, Australia", -33.8688, 151.2093, "Australia/Sydney"],
  ["เมลเบิร์น ออสเตรเลีย", "Melbourne, Australia", -37.8136, 144.9631, "Australia/Melbourne"],
  ["บริสเบน ออสเตรเลีย", "Brisbane, Australia", -27.4698, 153.0251, "Australia/Brisbane"],
  ["เพิร์ท ออสเตรเลีย", "Perth, Australia", -31.9505, 115.8605, "Australia/Perth"],
  ["โอ๊คแลนด์ นิวซีแลนด์", "Auckland, New Zealand", -36.8485, 174.7633, "Pacific/Auckland"],
  ["ไคโร อียิปต์", "Cairo, Egypt", 30.0444, 31.2357, "Africa/Cairo"],
  ["โจฮันเนสเบิร์ก แอฟริกาใต้", "Johannesburg, South Africa", -26.2041, 28.0473, "Africa/Johannesburg"],
  ["ไนโรบี เคนยา", "Nairobi, Kenya", -1.2921, 36.8219, "Africa/Nairobi"],
];

/** เมืองต่างประเทศ (เรียงตามภูมิภาค ใกล้ไทยก่อน) */
export const WORLD_CITIES: readonly BirthPlace[] = WORLD_ROWS.map(([th, en, lat, lon, zone]) => ({
  id: `w-${en.toLowerCase().replace(/[^a-z]+/g, "-").replace(/-+$/, "")}`,
  th,
  en,
  lat,
  lon,
  zone,
}));

export const ALL_BIRTH_PLACES: readonly BirthPlace[] = [...THAI_PROVINCES, ...WORLD_CITIES];

export function getBirthPlace(id: string): BirthPlace | undefined {
  return ALL_BIRTH_PLACES.find((p) => p.id === id);
}
