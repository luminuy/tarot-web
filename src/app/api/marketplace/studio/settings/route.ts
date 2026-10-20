import { apiFail, apiOk } from "@/lib/api/envelope";
import { ensureReadableColor, sanitizeLogoUrl, STUDIO_LOGO_PATH_RE } from "@/lib/studio/brand";
import { readJson, studioGate } from "@/lib/studio/gate";
import { SettingsSchema } from "@/lib/studio/schemas";
import { deleteOwnLogo } from "@/lib/studio/logo";
import { saveStudioSettings } from "@/lib/studio/studio.repo";

export const runtime = "nodejs";

/**
 * PUT /api/marketplace/studio/settings — แบรนด์ของแม่หมอ + สวิตช์ตัวช่วย AI (`aiAssist` · ไม่ส่งมา = คงค่าเดิม)
 * สีอ่านไม่ออกบนพื้นเว็บ ➔ เข้มขึ้นให้อัตโนมัติแล้วบอก (`colorAdjusted`) · โลโก้ https เท่านั้น
 */
export async function PUT(request: Request) {
  const gate = await studioGate(request);
  if (!gate.ok) return gate.response;
  const parsed = SettingsSchema.safeParse(await readJson(request));
  if (!parsed.success) return apiFail("ข้อมูลไม่ถูกต้อง", 400);
  const { brandName, logoUrl, brandColor, contactLine, showAiDisclosure, aiAssist } = parsed.data;
  const logo = sanitizeLogoUrl(logoUrl);
  if (logoUrl && !logo) return apiFail("ลิงก์โลโก้ต้องขึ้นต้นด้วย https://", 400, "logo_url");
  // ไฟล์โลโก้ในระบบเรา ใช้ได้เฉพาะไฟล์ที่แม่หมอคนนี้อัปโหลดเอง — ไฟล์ที่ตั้งเป็นโลโก้จะถูกลบตามตอนเปลี่ยนโลโก้
  const internalOwner = logo ? STUDIO_LOGO_PATH_RE.exec(logo)?.[1] : undefined;
  if (internalOwner !== undefined && internalOwner !== gate.readerId) {
    return apiFail("ใช้ได้เฉพาะโลโก้ที่อัปโหลดจากสตูดิโอของคุณเอง", 400, "logo_url");
  }
  const color = ensureReadableColor(brandColor);
  await saveStudioSettings(gate.readerId, {
    brandName,
    logoUrl: logo,
    brandColor: color.color,
    contactLine,
    showAiDisclosure,
    aiAssist: aiAssist ?? gate.settings.aiAssist,
  });
  const previous = gate.settings.logoUrl;
  if (previous && previous !== logo && STUDIO_LOGO_PATH_RE.exec(previous)?.[1] === gate.readerId) {
    await deleteOwnLogo(previous, gate.readerId);
  }
  return apiOk({ brandColor: color.color, colorAdjusted: color.adjusted, contrast: color.ratio, logoUrl: logo });
}
