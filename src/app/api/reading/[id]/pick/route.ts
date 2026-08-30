import { NextResponse } from "next/server";
import { ReadingService } from "@/services/reading.service";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const { selectedIndices } = body;

    if (!Array.isArray(selectedIndices) || selectedIndices.length === 0) {
      return NextResponse.json({ error: "selectedIndices array is required" }, { status: 400 });
    }

    const result = await ReadingService.pick(id, selectedIndices);
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ session: result.session });
  } catch (error) {
    console.error("Error in /api/reading/[id]/pick:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
