import { NextResponse } from "next/server";
import { ReadingService } from "@/services/reading.service";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const { order } = body;

    if (typeof order !== "number") {
      return NextResponse.json({ error: "order number is required" }, { status: 400 });
    }

    const result = await ReadingService.revealCard(id, order);
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ session: result.session });
  } catch (error) {
    console.error("Error in /api/reading/[id]/reveal:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
