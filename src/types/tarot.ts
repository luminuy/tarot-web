export * from "@/data/cards/types";
export * from "@/data/spreads";

export interface Persona {
  id: string;
  nameTh: string;
  subtitle: string;
  title: string;
  tone: string;
  description: string;
  color: string;
  borderColor: string;
  bgGradient: string;
  voiceGender: "female" | "male";
  ttsVoiceName?: string;
  systemPrompt: string;
}
