import { NextResponse } from "next/server";

import { isAdminConfigured } from "@/lib/auth/admin-auth";
import { isAdminRequest } from "@/lib/auth/require-admin";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({
    configured: isAdminConfigured(),
    admin: await isAdminRequest(),
  });
}
