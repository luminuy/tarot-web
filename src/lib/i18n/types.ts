/**
 * 🌐 สถาปัตยกรรมระบบหลายภาษา (i18n Type Definitions)
 * SeerTarot Bilingual Engine (Thai & American English)
 */

export type Locale = "th" | "en";

export const DEFAULT_LOCALE: Locale = "th";
export const SUPPORTED_LOCALES: readonly Locale[] = ["th", "en"] as const;
export const LOCALE_COOKIE_KEY = "seertarot_lang";

export interface Dictionary {
  common: {
    localeName: string;
    loading: string;
    error: string;
    retry: string;
    confirm: string;
    cancel: string;
    close: string;
    back: string;
    next: string;
    done: string;
    copy: string;
    copied: string;
    share: string;
    save: string;
    saved: string;
    viewAll: string;
    provablyFairBadge: string;
    systemNotice: string;
  };
  nav: {
    brandTitle: string;
    brandTagline: string;
    spreads: string;
    spreadsDesc: string;
    cardMeanings: string;
    cardMeaningsDesc: string;
    aiOracles: string;
    aiOraclesDesc: string;
    liveReaders: string;
    liveReadersDesc: string;
    sanctuaryJournal: string;
    sanctuaryJournalDesc: string;
    dailyCard: string;
    beginReading: string;
    profile: string;
    myAccount: string;
    login: string;
    logout: string;
    openMenu: string;
    closeMenu: string;
  };
  home: {
    heroBadge: string;
    heroTitle: string;
    heroSubtitle: string;
    heroCtaBegin: string;
    heroCtaDaily: string;
    quickSpreadsBadge: string;
    quickSpreadsTitle: string;
    quickSpreadsSubtitle: string;
    dailySectionTitle: string;
    dailySectionSubtitle: string;
    oraclesTitle: string;
    oraclesSubtitle: string;
    provablyFairTitle: string;
    provablyFairSubtitle: string;
    provablyFairDescription: string;
    provablyFairVerifyCta: string;
  };
  dailyCard: {
    title: string;
    subtitle: string;
    drawInstruction: string;
    tapToReveal: string;
    revealedTitle: string;
    viewFullMeaning: string;
    shareDailyCard: string;
    alreadyDrawnToday: string;
    drawNewAnyway: string;
  };
  quickReading: {
    badge: string;
    title: string;
    subtitle: string;
    cardsCount: string;
    startSpread: string;
  };
  reading: {
    stepSpread: string;
    stepQuestion: string;
    stepShuffle: string;
    stepPick: string;
    stepReveal: string;
    stepSynthesis: string;
    // Question Step
    questionTitle: string;
    questionSubtitle: string;
    questionPlaceholder: string;
    questionSuggestionsLabel: string;
    questionSuggestions: string[];
    // Shuffle Step
    shuffleTitle: string;
    shuffleSubtitle: string;
    shufflePrompt: string;
    cutPrompt: string;
    shuffling: string;
    cutting: string;
    shuffleComplete: string;
    provablyFairHashLabel: string;
    // Pick Step
    pickTitle: string;
    pickSubtitle: string;
    pickCardPrompt: string;
    pickRemainingPrompt: string;
    pickingComplete: string;
    // Reveal & Altar
    altarTitle: string;
    altarSubtitle: string;
    tapToRevealCard: string;
    revealAllCards: string;
    allCardsRevealed: string;
    upright: string;
    reversed: string;
    cardPosition: string;
    // Synthesis & Stream
    oracleConsulting: string;
    oracleWriting: string;
    synthesisTitle: string;
    askFollowup: string;
    chatPlaceholder: string;
    sendQuestion: string;
    saveReading: string;
    savedToJournal: string;
    shareReading: string;
    newReading: string;
  };
  cards: {
    catalogTitle: string;
    catalogSubtitle: string;
    searchPlaceholder: string;
    noResults: string;
    filterAll: string;
    filterMajor: string;
    filterMinor: string;
    filterCups: string;
    filterWands: string;
    filterSwords: string;
    filterPentacles: string;
    uprightMeaning: string;
    reversedMeaning: string;
    loveMeaning: string;
    careerMeaning: string;
    financeMeaning: string;
    element: string;
    astrology: string;
    numerology: string;
    symbolism: string;
    cardDetailBack: string;
    relatedCards: string;
    drawThisCardInSpread: string;
  };
  spreads: {
    catalogTitle: string;
    catalogSubtitle: string;
    cardsUnit: string;
    estimatedTime: string;
    recommendedQuestions: string;
    positionsTitle: string;
    selectSpreadCta: string;
    viewDetails: string;
  };
  safety: {
    crisisAlertTitle: string;
    crisisAlertMessage: string;
    crisisHotlineName: string;
    crisisHotlineNumber: string;
    crisisHotlineAction: string;
    crisisEmergencyName: string;
    crisisEmergencyNumber: string;
    dismissNotice: string;
  };
  footer: {
    brandMission: string;
    spreadsHeading: string;
    resourcesHeading: string;
    legalHeading: string;
    privacyPolicy: string;
    termsOfService: string;
    ethicalDisclaimer: string;
    copyright: string;
    provablyFairBadge: string;
  };
}
