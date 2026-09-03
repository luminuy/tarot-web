/**
 * เครื่องมือคำนวณระดับความปลอดภัยของรหัสผ่านฝั่ง Client-Side (Password Strength Meter)
 */

export interface PasswordStrength {
  score: number; // 0 to 4
  label: string;
  colorClass: string;
  barColor: string;
}

export function calculatePasswordStrength(password: string): PasswordStrength {
  if (!password || password.length === 0) {
    return { score: 0, label: "กรุณาระบุรหัสผ่าน", colorClass: "text-gray-400", barColor: "bg-gray-700" };
  }

  let points = 0;

  // Length points
  if (password.length >= 10) points += 1;
  if (password.length >= 14) points += 1;

  // Character variety points
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) points += 1;
  if (/\d/.test(password)) points += 0.5;
  if (/[^a-zA-Z0-9]/.test(password)) points += 0.5;

  const score = Math.min(4, Math.floor(points));

  switch (score) {
    case 0:
    case 1:
      return { score: 1, label: "รหัสผ่านสั้นเกินไป", colorClass: "text-red-400", barColor: "bg-red-500" };
    case 2:
      return { score: 2, label: "พอใช้", colorClass: "text-amber-400", barColor: "bg-amber-500" };
    case 3:
      return { score: 3, label: "ปลอดภัยดี", colorClass: "text-emerald-400", barColor: "bg-emerald-500" };
    case 4:
    default:
      return { score: 4, label: "ปลอดภัยสูงมาก ✦", colorClass: "text-[#8F5C1A]", barColor: "bg-gradient-to-r from-emerald-400 to-[#8F5C1A]" };
  }
}
