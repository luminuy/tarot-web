import { DECK, cardById } from "../../src/data/cards";
import type { Category } from "../../src/data/cards/types";

const CATEGORIES: Category[] = ["general", "love", "work", "money", "self"];

function runQa() {
  console.log("🧪 Starting QA verification for 78 Tarot Cards English Meanings...");

  if (DECK.length !== 78) {
    throw new Error(`DECK length is ${DECK.length}, expected 78`);
  }

  const errors: string[] = [];

  for (const card of DECK) {
    // 1. Verify meaningsEn
    if (!card.meaningsEn) {
      errors.push(`[${card.id}] Missing meaningsEn entirely`);
      continue;
    }

    for (const cat of CATEGORIES) {
      const interp = card.meaningsEn[cat];
      if (!interp) {
        errors.push(`[${card.id}] Missing category '${cat}' in meaningsEn`);
        continue;
      }
      if (!interp.upright || typeof interp.upright !== "string" || interp.upright.trim().length < 20) {
        errors.push(`[${card.id}] '${cat}.upright' is invalid or too short (< 20 chars): "${interp.upright}"`);
      }
      if (!interp.reversed || typeof interp.reversed !== "string" || interp.reversed.trim().length < 20) {
        errors.push(`[${card.id}] '${cat}.reversed' is invalid or too short (< 20 chars): "${interp.reversed}"`);
      }
    }

    // 2. Verify astrologyEn
    if (!card.astrologyEn || typeof card.astrologyEn !== "string" || card.astrologyEn.trim().length < 3) {
      errors.push(`[${card.id}] Missing or invalid astrologyEn: "${card.astrologyEn}"`);
    }

    // 3. Verify numerologyEn
    if (!card.numerologyEn || typeof card.numerologyEn !== "string" || card.numerologyEn.trim().length < 5) {
      errors.push(`[${card.id}] Missing or invalid numerologyEn: "${card.numerologyEn}"`);
    }

    // 4. Verify keywordsEn
    if (!card.keywordsEn || !Array.isArray(card.keywordsEn.upright) || card.keywordsEn.upright.length < 3) {
      errors.push(`[${card.id}] Missing or invalid keywordsEn.upright`);
    }
    if (!card.keywordsEn || !Array.isArray(card.keywordsEn.reversed) || card.keywordsEn.reversed.length < 3) {
      errors.push(`[${card.id}] Missing or invalid keywordsEn.reversed`);
    }
  }

  // Test cardById lookup
  const fool = cardById("major-00");
  if (!fool?.meaningsEn?.general?.upright.includes("leap")) {
    errors.push("cardById('major-00') does not contain expected English interpretation");
  }

  const aceWands = cardById("wands-01");
  if (!aceWands?.meaningsEn?.work?.upright) {
    errors.push("cardById('wands-01') missing meaningsEn.work.upright");
  }

  const kingPentacles = cardById("pentacles-14");
  if (!kingPentacles?.astrologyEn) {
    errors.push("cardById('pentacles-14') missing astrologyEn");
  }

  if (errors.length > 0) {
    console.error(`❌ QA FAILED with ${errors.length} errors:`);
    for (const err of errors.slice(0, 20)) {
      console.error(`  - ${err}`);
    }
    if (errors.length > 20) {
      console.error(`  ...and ${errors.length - 20} more errors`);
    }
    process.exit(1);
  }

  console.log(`✅ All 78 cards verified successfully!`);
  console.log(`   - 78/78 cards have complete 5-dimensional English meanings (Upright & Reversed)`);
  console.log(`   - 78/78 cards have valid astrologyEn & numerologyEn`);
  console.log(`   - 78/78 cards have valid keywordsEn (upright & reversed)`);
  console.log(`   - Card lookup helpers tested and verified.`);
}

runQa();
