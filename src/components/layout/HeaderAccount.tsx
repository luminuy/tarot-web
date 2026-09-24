import { LocaleLink as Link } from "@/components/ui/LocaleLink";
import { useLocale } from "@/lib/i18n";

/**
 * 👤 ปุ่มบัญชีบนหัวเว็บของหน้าเนื้อหา — ให้หัวเว็บทุกหน้าหน้าตาเหมือนหน้าแรก (คำสั่งเจ้าของ 2026-09-24)
 * ---------------------------------------------------------------------------
 * หน้าแรกส่ง `UserProfileBadge` เข้า `toolbar` เอง (เปิดหน้าต่างเข้าสู่ระบบผ่านสถานะของ TarotFlow)
 * หน้าอื่นไม่มีใครส่ง หัวเว็บจึงขาดปุ่มนี้ไปหนึ่งปุ่ม
 *
 * ⚠️ ห้ามใช้ `UserProfileBadge` ตรงนี้ — หัวเว็บของหน้า Astro เป็น HTML นิ่ง **ไม่ hydrate**
 *    (ดู `astro/scripts/site-header.ts`) ตัว badge จะค้างสถานะ "กำลังโหลด" (จาง กดไม่ได้) ตลอดไป
 *    จึงเป็นลิงก์ธรรมดาไปหน้า `/account` แล้วให้ `astro/scripts/site-header.ts` เสริม:
 *    · ยังไม่ล็อกอิน ➔ แตะแล้วเด้งหน้าต่างเข้าสู่ระบบในหน้าเดิม (`astro/scripts/header-auth.tsx` โหลดตอนแตะ)
 *    · ล็อกอินอยู่ ➔ ลิงก์ไปหน้าบัญชีตามปกติ + จุดทอง (อ่านจากคุกกี้ใบ้ ไม่ยิง API)
 *    หน้า Next (ไม่มีสคริปต์นั้น) ได้ลิงก์ไปหน้าบัญชีซึ่งมีปุ่มเข้าสู่ระบบอยู่แล้ว
 *    กรอบ/ขนาด/ไอคอนตรงกับ `UserProfileBadge` เป๊ะ หน้าแรกกับหน้าอื่นจึงดูเหมือนกัน
 */
export function HeaderAccount() {
  const { isEnglish } = useLocale();
  const label = isEnglish ? "Account · Sign in" : "บัญชีสมาชิก · เข้าสู่ระบบ";
  return (
    <Link
      href="/account"
      prefetch={false}
      data-header-account=""
      aria-label={label}
      title={label}
      className="tap-overlay relative w-9 h-9 sm:w-10 sm:h-10 rounded-full border border-line bg-surface flex items-center justify-center flex-shrink-0 select-none text-ink hover:text-gold hover:border-gold transition-colors shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gold"
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-4 h-4 sm:w-5 sm:h-5"
        aria-hidden="true"
      >
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
      <span
        data-header-account-dot=""
        hidden
        aria-hidden="true"
        className="absolute bottom-1 right-1 w-2 h-2 rounded-full bg-gold ring-2 ring-surface"
      />
    </Link>
  );
}
