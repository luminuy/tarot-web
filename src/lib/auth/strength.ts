/**
 * เครื่องมือคำนวณระดับความปลอดภัยของรหัสผ่านฝั่ง Client-Side (Password Strength Meter)
 */

export interface PasswordStrength {
  score: number; // 0 to 4
  label: string;
  colorClass: string;
  barColor: string;
}

export function calculatePasswordStrength(password: string, isEnglish?: boolean): PasswordStrength {
  if (!password || password.length === 0) {
    return {
      score: 0,
      label: isEnglish ? "Enter password" : "กรุณาระบุรหัสผ่าน",
      colorClass: "text-[#635B4E]",
      barColor: "bg-[#D9C8AC]",
    };
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
      return {
        score: 1,
        label: isEnglish ? "Too weak" : "รหัสผ่านสั้นเกินไป",
        colorClass: "text-[#A6392C]",
        barColor: "bg-[#A6392C]",
      };
    case 2:
      return {
        score: 2,
        label: isEnglish ? "Fair" : "พอใช้",
        colorClass: "text-[#8F5C1A]",
        barColor: "bg-[#8F5C1A]",
      };
    case 3:
      return {
        score: 3,
        label: isEnglish ? "Strong" : "ปลอดภัยดี",
        colorClass: "text-[#3A7044]",
        barColor: "bg-[#3A7044]",
      };
    case 4:
    default:
      return {
        score: 4,
        label: isEnglish ? "Very Strong" : "ปลอดภัยสูงมาก",
        colorClass: "text-[#8F5C1A]",
        barColor: "bg-[#3A7044]",
      };
  }
}
