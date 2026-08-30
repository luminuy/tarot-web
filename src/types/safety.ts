export interface CrisisCheckResult {
  isSafe: boolean;
  reason?: string;
  isCrisis?: boolean;
  crisisType?: "self-harm" | "violence" | "medical-critical" | "illegal";
  helplineTh?: string;
  recommendedAction?: string;
}

export interface SafetyPolicy {
  blockSelfHarm: boolean;
  blockMedicalDiagnosis: boolean;
  blockLegalAdvice: boolean;
  blockFinancialGambling: boolean;
  requireAiDisclosure: boolean;
}
