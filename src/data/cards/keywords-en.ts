/**
 * 🌟 English Keywords Dictionary for 78 Rider-Waite-Smith (1909) Tarot Cards
 * ---------------------------------------------------------------------------
 * Provides authentic, archetypal English keywords for all 78 cards (upright & reversed).
 * Matches the core meanings and emotional nuances of the canonical Thai keywords.
 */

export interface CardKeywordsEn {
  upright: string[];
  reversed: string[];
}

export const CARD_KEYWORDS_EN: Record<string, CardKeywordsEn> = {
  // ==========================================
  // Major Arcana (0-21)
  // ==========================================
  "major-00": {
    upright: ["New Beginnings", "Freedom", "Innocence", "Leap of Faith", "Infinite Potential"],
    reversed: ["Recklessness", "Hesitation", "Aimlessness", "Unnecessary Risk"],
  },
  "major-01": {
    upright: ["Manifestation", "Resourcefulness", "Sharp Focus", "Eloquent", "Empowerment"],
    reversed: ["Deception", "Scattered Energy", "Empty Promises", "Hesitation"],
  },
  "major-02": {
    upright: ["Intuition", "Sacred Mystery", "Serenity", "Patience", "Inner Wisdom"],
    reversed: ["Secretiveness", "Ignoring Intuition", "Hidden Agendas", "Confusion"],
  },
  "major-03": {
    upright: ["Abundance", "Nurturing", "Creativity", "Gentleness", "Growth"],
    reversed: ["Overgiving", "Self-Neglect", "Codependency", "Creative Block"],
  },
  "major-04": {
    upright: ["Stability", "Structure", "Leadership", "Firm Boundaries", "Authority"],
    reversed: ["Rigidity", "Stubbornness", "Lack of Discipline", "Overbearing Control"],
  },
  "major-05": {
    upright: ["Tradition", "Spiritual Mentor", "Core Beliefs", "Wise Counsel", "Proven System"],
    reversed: ["Rebellion", "Questioning Dogma", "Blind Conformity", "Rigid Dogmatism"],
  },
  "major-06": {
    upright: ["Soul Choice", "Sacred Bond", "Harmony", "Shared Values", "Heart Alignment"],
    reversed: ["Indecision", "Misaligned Values", "Conflict", "One-Sided Bond"],
  },
  "major-07": {
    upright: ["Determination", "Victory", "Self-Mastery", "Forward Drive", "Triumph"],
    reversed: ["Loss of Control", "Burnout", "Impatience", "Conflicting Drives"],
  },
  "major-08": {
    upright: ["Inner Courage", "Endurance", "Compassionate Resolve", "Emotional Mastery", "Grace"],
    reversed: ["Self-Doubt", "Depleted Will", "Repressed Anger", "Aggression"],
  },
  "major-09": {
    upright: ["Introspection", "Solitude", "Inner Guidance", "Sage Wisdom", "Gentle Path"],
    reversed: ["Isolation", "Withdrawal", "Losing One's Way", "Escapism"],
  },
  "major-10": {
    upright: ["Turning Point", "Destiny Shift", "Cycles of Life", "Divine Timing", "Good Fortune"],
    reversed: ["Unwelcome Delay", "Stuck in Cycles", "Resisting Change", "Prolonged Waiting"],
  },
  "major-11": {
    upright: ["Fairness", "Balance", "Accountability", "Rational Judgment", "Truth Revealed"],
    reversed: ["Bias", "Evading Truth", "Emotional Reactivity", "Unresolved Conflict"],
  },
  "major-12": {
    upright: ["Surrender", "New Perspective", "Letting Go", "Sacrifice", "Patience"],
    reversed: ["Stagnation", "Stubborn Resistance", "Futile Delay", "Martyrdom"],
  },
  "major-13": {
    upright: ["Transformation", "Rebirth", "Letting Go", "Metamorphosis", "Closing a Chapter"],
    reversed: ["Clinging to Past", "Fear of Change", "Denial", "Lingering Limbo"],
  },
  "major-14": {
    upright: ["Harmony", "Moderation", "Integration", "Patience", "Healing"],
    reversed: ["Excess", "Impatience", "Imbalance", "Straining Oneself"],
  },
  "major-15": {
    upright: ["Attachment", "Entanglement", "Shadow Desire", "Repetitive Loop", "Material Trap"],
    reversed: ["Breaking Chains", "Self-Awareness", "Reclaiming Freedom", "Hesitation"],
  },
  "major-16": {
    upright: ["Sudden Awakening", "Truth Laid Bare", "Shattering Illusions", "Breakthrough", "Liberation"],
    reversed: ["Denial", "Evading the Inevitable", "Internal Turmoil", "Gradual Collapse"],
  },
  "major-17": {
    upright: ["Hope Renewed", "Spiritual Healing", "Inspiration", "Serenity", "Guiding Light"],
    reversed: ["Despair", "Discouragement", "Crisis of Faith", "Clouded Vision"],
  },
  "major-18": {
    upright: ["Uncertainty", "Subconscious Depths", "Intuitive Flash", "Illusion", "Dream Realm"],
    reversed: ["Clarity Emerging", "Lifting Fog", "Truth Unveiled", "Calming Doubts"],
  },
  "major-19": {
    upright: ["Radiant Success", "Pure Joy", "Lucid Clarity", "Vitality", "Authentic Self"],
    reversed: ["Temporary Dimming", "Fatigue", "Overlooked Blessings", "Delayed Warmth"],
  },
  "major-20": {
    upright: ["Awakening", "Higher Calling", "Forgiveness", "Life Reflection", "Second Chance"],
    reversed: ["Self-Blame", "Unforgiving", "Ignoring the Call", "Regret"],
  },
  "major-21": {
    upright: ["Wholeness", "Culmination", "Fulfillment", "Graceful Completion", "Next Chapter"],
    reversed: ["Loose Ends", "Nearly Complete", "Hesitation to Conclude", "Emptiness"],
  },

  // ==========================================
  // Suit of Wands (Fire)
  // ==========================================
  "wands-01": {
    upright: ["Creative Spark", "Inspiration", "New Venture", "Inner Fire", "Taking Initiative"],
    reversed: ["Fading Passion", "Delayed Start", "Procrastination", "Drained Drive"],
  },
  "wands-02": {
    upright: ["Strategic Vision", "Long-Term Plans", "Decision Making", "Horizon Expanding", "Departure"],
    reversed: ["Hesitation", "Fear of the Unknown", "Stalled Plans", "Playing Small"],
  },
  "wands-03": {
    upright: ["Expansion", "Progress Unfolding", "Awaiting Returns", "Foresight", "Partnership"],
    reversed: ["Delays", "Frustrated Waiting", "Overexpansion", "Narrow View"],
  },
  "wands-04": {
    upright: ["Celebration", "Homecoming", "Solid Foundation", "Milestone", "Harmony"],
    reversed: ["Tense Gathering", "Domestic Friction", "Shaky Foundation", "Postponement"],
  },
  "wands-05": {
    upright: ["Competition", "Clash of Ideas", "Dynamic Chaos", "Practice", "Diverse Opinions"],
    reversed: ["Avoiding Conflict", "Internal Struggle", "Giving In", "Underlying Friction"],
  },
  "wands-06": {
    upright: ["Victory", "Public Acclaim", "Pride", "Being Recognized", "Triumph"],
    reversed: ["Overlooked Effort", "Ego Tripping", "Hollow Victory", "Imposter Syndrome"],
  },
  "wands-07": {
    upright: ["Courageous Stand", "Holding Ground", "Defending Beliefs", "Perseverance", "Unyielding"],
    reversed: ["Exhaustion", "Yielding Ground", "Paranoia", "Fighting Wrong Battles"],
  },
  "wands-08": {
    upright: ["Swift Momentum", "Fast Communication", "Flow State", "Clear Path", "Direct Aim"],
    reversed: ["Delays", "Miscommunication", "Haste Makes Waste", "Missed Message"],
  },
  "wands-09": {
    upright: ["Resilience", "Nearly There", "Guarded Strength", "Grit", "Wounded Warrior"],
    reversed: ["Burnout", "Defensive Walls", "Urge to Surrender", "Old Trauma"],
  },
  "wands-10": {
    upright: ["Heavy Burden", "Overcommitment", "Final Stretch", "Reluctance to Yield", "Overloaded"],
    reversed: ["Releasing Burden", "Asking for Help", "Dumping Responsibility", "Collapse"],
  },
  "wands-11": {
    upright: ["Curiosity", "Good Tidings", "Enthusiasm", "Bold Inquiries", "Youthful Zeal"],
    reversed: ["Boredom", "Unfinished Projects", "Lack of Discipline", "Delayed News"],
  },
  "wands-12": {
    upright: ["Bold Advance", "Fearless Action", "Charisma", "Adventure", "Decisive Energy"],
    reversed: ["Impatience", "Impulsiveness", "Reckless Starts", "Empty Bluster"],
  },
  "wands-13": {
    upright: ["Vibrant Confidence", "Warmth", "Magnetic Allure", "Self-Worth", "Courageous Grace"],
    reversed: ["Jealousy", "Crisis of Confidence", "Quiet Insecurity", "Overextending"],
  },
  "wands-14": {
    upright: ["Visionary Leader", "Inspiring Authority", "Bold Decisions", "Presence", "Big Picture"],
    reversed: ["Autocracy", "Hotheadedness", "Overreaching Power", "Unmet Boasts"],
  },

  // ==========================================
  // Suit of Cups (Water)
  // ==========================================
  "cups-01": {
    upright: ["Open Heart", "New Affection", "Pure Love", "Spiritual Flow", "Forgiveness"],
    reversed: ["Guarded Heart", "Emotional Blockage", "Lack of Self-Love"],
  },
  "cups-02": {
    upright: ["Mutual Bond", "Soul Alignment", "Deep Connection", "Mutual Respect", "Harmonious Pact"],
    reversed: ["Imbalance", "Misunderstanding", "Unrequited Energy", "Distance"],
  },
  "cups-03": {
    upright: ["Friendship", "Celebration", "Soul Tribe", "Joyful News", "Shared Happiness"],
    reversed: ["Gossip", "Social Exhaustion", "Fading Circle", "Feeling Left Out"],
  },
  "cups-04": {
    upright: ["Contemplation", "Apathy", "Introspection", "Re-evaluating", "Retreating Inward"],
    reversed: ["Sudden Realization", "Accepting Offer", "Renewed Engagement", "Leaving the Cave"],
  },
  "cups-05": {
    upright: ["Grief", "Loss", "Regret Over Past", "Emotional Lesson", "Hope Still Standing"],
    reversed: ["Healing Begins", "Forgiveness", "Turning Forward", "Acceptance"],
  },
  "cups-06": {
    upright: ["Nostalgia", "Past Connections", "Innocence", "Comfort of Home", "Warm Memories"],
    reversed: ["Stuck in the Past", "Yearning for Yesterday", "Reluctance to Mature"],
  },
  "cups-07": {
    upright: ["Multitude of Options", "Illusion", "Daydreaming", "Wishes", "Need for Discernment"],
    reversed: ["Clarity Gained", "Decisive Action", "Shattered Illusions", "Singular Focus"],
  },
  "cups-08": {
    upright: ["Walking Away", "Deeper Search", "Letting Go", "Departing the Outgrown", "Bravery"],
    reversed: ["Fear of Leaving", "Returning to Old Ways", "Resistance to Moving On", "Lingering"],
  },
  "cups-09": {
    upright: ["Contentment", "Wish Fulfilled", "Personal Bliss", "Deserved Reward", "Deep Satisfaction"],
    reversed: ["Smugness", "Superficial Joy", "Overindulgence", "Unfulfilled Longing"],
  },
  "cups-10": {
    upright: ["Lasting Joy", "Family Harmony", "Emotional Wholeness", "Blessed Haven", "Peace"],
    reversed: ["Superficial Perfection", "Family Tension", "Unrealistic Ideals"],
  },
  "cups-11": {
    upright: ["Heartfelt News", "Gentle Vulnerability", "Creative Wonder", "Receptivity", "Sincerity"],
    reversed: ["Moody Sulking", "Hypersensitivity", "Escapism", "Immaturity"],
  },
  "cups-12": {
    upright: ["Romantic Gesture", "Poetic Soul", "Following the Heart", "Idealism", "Gracious Offer"],
    reversed: ["Empty Promises", "Moodiness", "Broken Vows", "Unrealistic Fantasy"],
  },
  "cups-13": {
    upright: ["Deep Empathy", "Keen Intuition", "Tranquil Soul", "Nurturing Presence", "Quiet Grace"],
    reversed: ["Emotional Sponge", "Martyr Complex", "Codependency", "Drained Spirit"],
  },
  "cups-14": {
    upright: ["Emotional Balance", "Wise Counselor", "Calm Composure", "Magnanimous", "Reliable Anchor"],
    reversed: ["Suppressed Emotions", "Cold Detachment", "Emotional Volatility", "Dishonesty"],
  },

  // ==========================================
  // Suit of Swords (Air)
  // ==========================================
  "swords-01": {
    upright: ["Mental Breakthrough", "Truth Revealed", "Laser Clarity", "Direct Cut", "New Perspective"],
    reversed: ["Confusion", "Harsh Words", "Clouded Vision", "Overthinking"],
  },
  "swords-02": {
    upright: ["Hesitation", "Crossroads", "Blindfolded Standoff", "Weighing Scales", "Unmade Choice"],
    reversed: ["Facing Reality", "Decisive Move", "Ending Avoidance"],
  },
  "swords-03": {
    upright: ["Painful Truth", "Heartbreak", "Disillusionment", "Cutting Words", "Grief Processing"],
    reversed: ["Recovery Dawning", "Forgiveness", "Wound Closing Slowly"],
  },
  "swords-04": {
    upright: ["Restful Sanctuary", "Strategic Pause", "Solitary Silence", "Restoring Energy", "Ceasefire"],
    reversed: ["Resuming the Journey", "Exhausting Strain", "Unable to Rest"],
  },
  "swords-05": {
    upright: ["Conflict", "Pyrrhic Victory", "Pride and Ego", "Cutting Friction"],
    reversed: ["Reconciliation", "Yielding Gracefully", "Making Peace", "Laying Down Arms"],
  },
  "swords-06": {
    upright: ["Transition", "Moving to Calmer Waters", "Leaving Behind Pain", "Journey", "Gradual Healing"],
    reversed: ["Emotional Anchors", "Inability to Move On", "Prolonged Suffering"],
  },
  "swords-07": {
    upright: ["Tactics", "Unspoken Agendas", "Secrecy", "Bypassing Confrontation"],
    reversed: ["Truth Exposed", "Confession", "Clearing the Air"],
  },
  "swords-08": {
    upright: ["Mental Trap", "Self-Imposed Limiting Beliefs", "Paralysis", "Blind to Options"],
    reversed: ["Breaking Free", "Seeing the Way Out", "Courage to Move"],
  },
  "swords-09": {
    upright: ["Nighttime Anxiety", "Overthinking", "Inner Torment", "Nightmares", "Sleeplessness"],
    reversed: ["Anxiety Easing", "Seeing Things Clearly", "Beginning to Release"],
  },
  "swords-10": {
    upright: ["The Storm Passes", "Chapter Closed", "Rock Bottom Passed", "Total Surrender", "Rebirth from Zero"],
    reversed: ["Rising Again", "Recovery", "Renewed Vitality"],
  },
  "swords-11": {
    upright: ["Curious Intellect", "Keen Observer", "Fresh Inquiries", "Truth Seeker", "Candid Speech"],
    reversed: ["Speaking Before Thinking", "Gossip", "All Talk", "Restless Mind"],
  },
  "swords-12": {
    upright: ["Direct Charge", "Fast Decisions", "Fearless Truth", "Swift Pace", "Single-Minded"],
    reversed: ["Impatience", "Harsh Words", "Rushing Into Mistakes", "Brashness"],
  },
  "swords-13": {
    upright: ["Sharp Perception", "Candid and Benevolent", "Healthy Boundaries", "Intellectual Independence", "Seasoned Wisdom"],
    reversed: ["Cold Demeanor", "Hasty Judgment", "Overly Defensive"],
  },
  "swords-14": {
    upright: ["Clear Reason", "Firm Principles", "Reliable Leader", "Unshakable Decisions", "Strategic Vision"],
    reversed: ["Dogmatism", "Aloof Detachment", "Overbearing Control"],
  },

  // ==========================================
  // Suit of Pentacles (Earth)
  // ==========================================
  "pentacles-01": {
    upright: ["Tangible Opportunity", "Seed of Abundance", "Solid Foundation", "Practical Security", "Real Action"],
    reversed: ["Missed Opportunity", "False Start", "Material Greed", "Poor Planning"],
  },
  "pentacles-02": {
    upright: ["Graceful Balance", "Adaptability", "Prioritization", "Juggling Multiple Roles", "Flexibility"],
    reversed: ["Overwhelmed", "Loss of Balance", "Procrastination", "Overcommitted"],
  },
  "pentacles-03": {
    upright: ["Teamwork", "Master Craftsmanship", "Recognition", "Collaboration", "Learning the Trade"],
    reversed: ["Carrying It Alone", "Unappreciated", "Miscommunication", "Careless Work"],
  },
  "pentacles-04": {
    upright: ["Financial Security", "Prudent Saving", "Caution", "Holding Firm", "Clear Boundaries"],
    reversed: ["Greed", "Scarcity Mindset", "Inability to Let Go", "Frivolous Spending"],
  },
  "pentacles-05": {
    upright: ["Hardship", "Isolation", "Overlooked Help", "Trial", "Faith"],
    reversed: ["Recovery", "Assistance Received", "Rebuilding", "Opening Up"],
  },
  "pentacles-06": {
    upright: ["Generosity", "Balanced Giving and Receiving", "Assistance", "Fairness", "Sharing Wealth"],
    reversed: ["One-Way Giving", "Hidden Strings", "Power Imbalance", "Refusing Help"],
  },
  "pentacles-07": {
    upright: ["Awaiting Harvest", "Patience", "Long-Term Investment", "Periodic Evaluation", "Reflection"],
    reversed: ["Impatience", "Wasted Effort", "Quitting Early", "Poor Return"],
  },
  "pentacles-08": {
    upright: ["Mastery", "Diligence", "Skill Building", "Attention to Detail", "Honest Work"],
    reversed: ["Going Through Motions", "Burnout", "Careless Output", "Refusal to Learn"],
  },
  "pentacles-09": {
    upright: ["Self-Sufficiency", "Fruits of Labor", "Grace and Poise", "Inner Independence", "Quiet Pride"],
    reversed: ["Superficial Success", "Loneliness in Wealth", "Extravagance", "Overreliance on Others"],
  },
  "pentacles-10": {
    upright: ["Generational Wealth", "Solid Legacy", "Lasting Security", "Heritage", "Home and Hearth"],
    reversed: ["Family Disputes", "Inherited Burdens", "Short-Sightedness", "Shaky Roots"],
  },
  "pentacles-11": {
    upright: ["Eager Student", "Practical Curiosity", "Steadfast Effort", "Career Opportunity", "Practical Test"],
    reversed: ["Lack of Focus", "Procrastination", "Lack of Discipline", "Unfinished Plans"],
  },
  "pentacles-12": {
    upright: ["Steadfast Method", "Reliable", "Step-by-Step", "Patience", "Dutiful"],
    reversed: ["Too Slow", "Stuck in Routine", "Stubborn Resistance", "Stagnation"],
  },
  "pentacles-13": {
    upright: ["Nurturing Provider", "Warm Hospitality", "Resourceful", "Down to Earth", "Trustworthy"],
    reversed: ["Exhausted Provider", "Financial Anxiety", "Neglecting Self", "Fussiness"],
  },
  "pentacles-14": {
    upright: ["Abundant Security", "Trusted Leader", "Self-Made Mastery", "Generosity", "Long-Term Vision"],
    reversed: ["Materialistic", "Over-controlling", "Stubborn", "Judging by Output Alone"],
  },
};

/**
 * Helper to safely resolve keywords for any card in either English or Thai.
 */
export function getCardKeywords(
  cardId: string,
  fallbackThai: { upright: string[]; reversed: string[] },
  isEnglish: boolean,
  isUpright = true
): string[] {
  if (isEnglish) {
    const en = CARD_KEYWORDS_EN[cardId];
    if (en) {
      return isUpright ? en.upright : en.reversed;
    }
  }
  return isUpright ? fallbackThai.upright : fallbackThai.reversed;
}
