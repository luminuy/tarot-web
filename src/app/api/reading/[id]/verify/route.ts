import { NextResponse } from "next/server";
import { ReadingService } from "@/services/reading.service";
import { ShuffleService } from "@/services/shuffle.service";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const session = await ReadingService.getSession(id);

    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    const isValid = session.clientSeed && session.combinedHash
      ? ShuffleService.verifyCommitment(session.serverSeed, session.clientSeed, session.combinedHash)
      : false;

    return NextResponse.json({
      valid: isValid,
      serverSeed: session.serverSeed,
      clientSeed: session.clientSeed || null,
      combinedHash: session.combinedHash || null,
      pickedCardCount: session.pickedCards.length,
    });
  } catch (error) {
    console.error("Error in /api/reading/[id]/verify:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
