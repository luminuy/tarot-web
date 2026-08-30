import { checkQuestion, AI_DISCLOSURE } from "@/lib/safety/guardrails";
import type { CrisisCheckResult } from "@/types/safety";

export class SafetyService {
  static inspectQuestion(question: string): CrisisCheckResult {
    const verdict = checkQuestion(question);
    return {
      isSafe: !verdict.block,
      isCrisis: verdict.flag === "crisis",
      crisisType: verdict.flag === "crisis" ? "self-harm" : undefined,
      helplineTh: "สายด่วนสุขภาพจิต 1323",
      reason: verdict.message,
    };
  }

  static getAiDisclosure(): string {
    return AI_DISCLOSURE;
  }
}
