import {
  CareerSpreadArt,
  CareerSwitchSpreadArt,
  CelticCrossSpreadArt,
  ChakraSpreadArt,
  DailySpreadArt,
  DecisionSpreadArt,
  ExReconciliationSpreadArt,
  FamilySpreadArt,
  HowTheyFeelSpreadArt,
  InnerPotentialSpreadArt,
  LoveSixSpreadArt,
  LoveSpreadArt,
  LuckSpreadArt,
  MindBodySpiritSpreadArt,
  MoneySpreadArt,
  MonthlySpreadArt,
  MonthlyTenSpreadArt,
  QuickSpreadArt,
  SituationSolutionSpreadArt,
  SoulmateSpreadArt,
  StudySpreadArt,
  ThreeCardSpreadArt,
  TwelveMonthsSpreadArt,
  WeeklySpreadArt,
  YesNoSpreadArt,
} from "@/components/ui/TarotArtIcons";

/**
 * ✦ ภาพไดอะแกรมผังพยากรณ์ 25 แบบ
 *
 * แยกออกมาจาก `SpreadCardSelector.tsx` เพราะไฟล์นั้น import `motion/react`
 * ไว้ที่หัวไฟล์ · หน้า /spreads ต้องการแค่ฟังก์ชันนี้ แต่การ import จากที่เดิม
 * ลาก `motion` (39.8 KB gzip) ติดเข้าไปในบันเดิลของหน้าด้วยทั้งก้อน
 * ฟังก์ชันนี้เองไม่มีอนิเมชันเลย เป็นแค่ switch คืน SVG
 */
export const renderSpreadIllustration = (spreadId: string) => {
  switch (spreadId) {
    case "daily":
      return <DailySpreadArt className="w-full h-40" />;
    case "quick":
      return <QuickSpreadArt className="w-full h-40" />;
    case "yes-no":
      return <YesNoSpreadArt className="w-full h-40" />;
    case "three-card":
      return <ThreeCardSpreadArt className="w-full h-40" />;
    case "situation-solution":
      return <SituationSolutionSpreadArt className="w-full h-40" />;
    case "mind-body-spirit":
      return <MindBodySpiritSpreadArt className="w-full h-40" />;
    case "love":
      return <LoveSpreadArt className="w-full h-40" />;
    case "how-they-feel":
      return <HowTheyFeelSpreadArt className="w-full h-40" />;
    case "ex-reconciliation":
      return <ExReconciliationSpreadArt className="w-full h-40" />;
    case "soulmate":
      return <SoulmateSpreadArt className="w-full h-40" />;
    case "career":
      return <CareerSpreadArt className="w-full h-40" />;
    case "money":
      return <MoneySpreadArt className="w-full h-40" />;
    case "career-switch":
      return <CareerSwitchSpreadArt className="w-full h-40" />;
    case "decision":
      return <DecisionSpreadArt className="w-full h-40" />;
    case "inner-potential":
      return <InnerPotentialSpreadArt className="w-full h-40" />;
    case "weekly":
      return <WeeklySpreadArt className="w-full h-40" />;
    case "monthly":
      return <MonthlySpreadArt className="w-full h-40" />;
    case "chakra":
      return <ChakraSpreadArt className="w-full h-40" />;
    case "celtic-cross":
      return <CelticCrossSpreadArt className="w-full h-40" />;
    case "year-ahead":
      return <TwelveMonthsSpreadArt className="w-full h-40" />;
    case "love-six":
      return <LoveSixSpreadArt className="w-full h-40" />;
    case "monthly-ten":
      return <MonthlyTenSpreadArt className="w-full h-40" />;
    case "family":
      return <FamilySpreadArt className="w-full h-40" />;
    case "luck":
      return <LuckSpreadArt className="w-full h-40" />;
    case "study":
      return <StudySpreadArt className="w-full h-40" />;
    default:
      return <ThreeCardSpreadArt className="w-full h-40" />;
  }
};
