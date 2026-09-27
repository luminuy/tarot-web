import type { SpreadCategoryId } from "@/data/spread-categories";

/**
 * ไอคอนของชิปหมวดแถวผังหน้าแรก — เป็น data URI ให้ CSS วาดผ่าน `mask` ใน `::before`
 *
 * ⚠️ ทำไมไม่ใช้คอมโพเนนต์ `<…TabIcon />` เหมือนแท็บหน้า `/spreads` (INC-0247 · งบ DOM หน้าแรก ≤ 1,500)
 *    ไอคอน SVG ในชิปกิน `<svg>` + `<path>` 2–4 element ต่อชิป · ชิป 7 อันรวมป้ายตัวเลขเคยกิน 41 element
 *    ทำให้หน้าแรกบน production (ภาพไพ่มี `<source>` AVIF เพิ่มอีกชั้น) ทะลุงบไป 1,529
 *    ตอนนี้ชิปหนึ่งอัน = `<button>` ชิ้นเดียว หน้าตาเท่าเดิม (รูปทรงลอกจาก `TarotArtIcons.tsx`)
 *
 * mask ใช้แค่ความทึบของภาพ สีจริงมาจาก `background-color` ใน `globals.css` (`.spread-chip::before`)
 */
const svg = (body: string, extra = 'fill="none" stroke="black" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"') =>
  `url("data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" ${extra}>${body}</svg>`,
  )}")`;

export const SPREAD_CHIP_ICONS: Record<SpreadCategoryId, string> = {
  popular: svg('<path d="M12 3L13.5 9.5L20 11L13.5 12.5L12 19L10.5 12.5L4 11L10.5 9.5L12 3Z"/>', 'fill="black"'),
  quick: svg('<path d="M13.2 3.5 5.8 13.2h5.6l-1 7.3 7.8-10.1h-5.7z"/>'),
  love: svg(
    '<path d="M12 20.3c-.3 0-.6-.1-.8-.3C7.6 17 4 13.6 4 9.7 4 7 6.1 5 8.7 5c1.4 0 2.7.7 3.3 1.9C12.6 5.7 13.9 5 15.3 5 17.9 5 20 7 20 9.7c0 3.9-3.6 7.3-7.2 10.3-.2.2-.5.3-.8.3Z"/>',
  ),
  career: svg(
    '<circle cx="12" cy="12" r="8.3"/><path d="M12 7 L13.2 10.4 L16.8 10.5 L13.9 12.6 L14.9 16.1 L12 14 L9.1 16.1 L10.1 12.6 L7.2 10.5 L10.8 10.4 Z"/>',
    'fill="none" stroke="black" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"',
  ),
  time: svg(
    '<path d="M6.5 3.8h11M6.5 20.2h11"/><path d="M7.8 3.8c0 4.2 4.2 5.6 4.2 8.2s-4.2 4-4.2 8.2M16.2 3.8c0 4.2-4.2 5.6-4.2 8.2s4.2 4 4.2 8.2"/>',
  ),
  life: svg('<path d="M3.5 12s3.2-5.8 8.5-5.8 8.5 5.8 8.5 5.8-3.2 5.8-8.5 5.8S3.5 12 3.5 12Z"/><circle cx="12" cy="12" r="2.6"/>'),
  all: svg(
    '<rect x="4" y="6" width="7.5" height="11.5" rx="1.4" transform="rotate(-13 7.75 11.75)"/><rect x="8.3" y="4.5" width="7.5" height="11.5" rx="1.4"/><rect x="12.5" y="6" width="7.5" height="11.5" rx="1.4" transform="rotate(13 16.25 11.75)"/>',
    'fill="none" stroke="black" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"',
  ),
};
