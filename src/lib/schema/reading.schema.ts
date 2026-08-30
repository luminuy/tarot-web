export interface StartReadingInput {
  spreadId: string;
  question: string;
  querentName?: string;
  context?: string;
  personaId?: string;
}

export function validateStartReadingInput(input: unknown): { valid: boolean; error?: string; data?: StartReadingInput } {
  if (!input || typeof input !== "object") {
    return { valid: false, error: "Invalid request payload" };
  }

  const obj = input as Record<string, unknown>;

  if (typeof obj.spreadId !== "string" || !obj.spreadId.trim()) {
    return { valid: false, error: "spreadId is required" };
  }

  if (typeof obj.question !== "string" || !obj.question.trim()) {
    return { valid: false, error: "question is required" };
  }

  return {
    valid: true,
    data: {
      spreadId: obj.spreadId.trim(),
      question: obj.question.trim(),
      querentName: typeof obj.querentName === "string" ? obj.querentName.trim() : undefined,
      context: typeof obj.context === "string" ? obj.context.trim() : undefined,
      personaId: typeof obj.personaId === "string" ? obj.personaId.trim() : "mystic-phu",
    },
  };
}

export interface ShuffleInput {
  clientSeed: string;
}

export function validateShuffleInput(input: unknown): { valid: boolean; error?: string; data?: ShuffleInput } {
  if (!input || typeof input !== "object") {
    return { valid: false, error: "Invalid request payload" };
  }

  const obj = input as Record<string, unknown>;

  if (typeof obj.clientSeed !== "string" || !obj.clientSeed.trim()) {
    return { valid: false, error: "clientSeed is required" };
  }

  return {
    valid: true,
    data: {
      clientSeed: obj.clientSeed.trim(),
    },
  };
}
