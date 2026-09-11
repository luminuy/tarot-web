import { NextResponse } from "next/server";
import { z } from "zod";
import { isRequestAuthorizedOrigin } from "@/lib/security/anti-theft";
import { checkRateLimit, getClientIdentifier } from "@/lib/utils/rate-limit";
import { evaluateClarification } from "@/lib/ai/clarify";

export const runtime = "nodejs";

const BodySchema = z.object({
  question: z.string().min(1).max(500),
  category: z.enum(["general", "love", "work", "money", "self"]).default("general"),
  personaId: z.string().optional(),
  nickname: z.string().max(40).optional(),
  situation: z.string().max(500).optional(),
  lang: z.enum(["th", "en"]).default("th"),
});

export async function POST(request: Request) {
  if (!isRequestAuthorizedOrigin(request)) {
    return NextResponse.json(
      { error: "ไม่อนุญาตให้เข้าถึง API จากภายนอก (Unauthorized Origin)" },
      { status: 403 }
    );
  }

  const { isPrivilegedTestRequest } = await import("@/lib/security/privileged");
  const privileged = await isPrivilegedTestRequest(request);

  if (!privileged) {
    const clientIp = getClientIdentifier(request);
    const limit = checkRateLimit(`clarify:${clientIp}`, {
      maxRequests: 30,
      windowSeconds: 3600,
    });
    if (!limit.allowed) {
      // สำหรับ clarify หากติด rate limit ให้ข้ามเงียบ ๆ เพื่อไม่บล็อกขั้นตอนเปิดไพ่
      return NextResponse.json({ needsClarification: false, skipped: true });
    }
  }

  try {
    const body = await request.json().catch(() => ({}));
    const parsed = BodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ needsClarification: false, skipped: true });
    }

    const result = await evaluateClarification(parsed.data);
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ needsClarification: false, skipped: true });
  }
}
