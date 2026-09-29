import Constants from "expo-constants";

/** ที่อยู่หลังบ้านเดิมของเว็บ — แอปไม่มีหลังบ้านของตัวเอง (แผน IOS_APP_PLAN หลักการใหญ่) */
export const API_BASE_URL: string =
  (Constants.expoConfig?.extra as { apiBaseUrl?: string } | undefined)?.apiBaseUrl ?? "https://seertarot.net";

export const APP_VERSION: string = Constants.expoConfig?.version ?? "1.0.0";

/** สายด่วนสุขภาพจิต — กฎเหล็กข้อ 6 */
export const CRISIS_HOTLINE = "1323";
