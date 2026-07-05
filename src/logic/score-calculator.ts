import type { Hand } from "../data/hands";
import type { CheckResult } from "./hand-checkers";
import type { ScoringRuleset } from "../settings";

// ----------------------------------------------------------------
// Score category types
// ----------------------------------------------------------------

export type ScoreCategory =
  | "regular"
  | "mangan"
  | "haneman"
  | "baiman"
  | "sanbaiman"
  | "counted-yakuman"
  | "yakuman"
  | "double-yakuman"
  | "triple-yakuman"
  | "quadruple-yakuman";

export type ScoreResult = {
  // The total yakuman units if any yakuman are present, 0 otherwise.
  yakumanTotal: number;
  // The total regular han if no yakuman are present.
  regularHan: number;
  // The score category, used for display.
  category: ScoreCategory;
  // The names of every contributing yaku, for display in the breakdown line.
  contributingNames: string[];
  // True when the score is a yakuman or higher, meaning regular han is irrelevant.
  isYakuman: boolean;
};

// ----------------------------------------------------------------
// Score category label lookup
// ----------------------------------------------------------------

export const SCORE_CATEGORY_LABELS: Record<ScoreCategory, string> = {
//Intentionally empty, so it'll show the data raw.
  "regular":           "",
  "mangan":            "Mangan",
  "haneman":           "Haneman",
  "baiman":            "Baiman",
  "sanbaiman":         "Sanbaiman",
  "counted-yakuman":   "Counted Yakuman",
  "yakuman":           "Yakuman",
  "double-yakuman":    "Double Yakuman",
  "triple-yakuman":    "Triple Yakuman",
  "quadruple-yakuman": "Quadruple Yakuman",
};

// Maps yakuman unit count to the corresponding category name.
// 0 is handled separately before this lookup is called.
const YAKUMAN_CATEGORY: Record<number, ScoreCategory> = {
  1: "yakuman",
  2: "double-yakuman",
  3: "triple-yakuman",
  4: "quadruple-yakuman",
};

// ----------------------------------------------------------------
// Mangan threshold check
// ----------------------------------------------------------------

// Returns true if the given han total reaches mangan or above,
// without needing fu to determine this. Note that 3 han 70+ fu
// and 4 han 30+ fu also reach mangan, but those require fu values
// which are not yet computed in this session. Those cases are
// deferred to Session 23b when fu calculation is added.
function isMangan(han: number): boolean {
  return han >= 5;
}

function categoryFromHan(han: number): ScoreCategory {
  if (han >= 13) return "counted-yakuman";
  if (han >= 11) return "sanbaiman";
  if (han >= 8)  return "baiman";
  if (han >= 6)  return "haneman";
  if (han >= 5)  return "mangan";
  return "regular";
}

// ----------------------------------------------------------------
// Main scoring function
// ----------------------------------------------------------------

export type ResultEntry = {
  hand: Hand;
  result: CheckResult;
};

// Pairs of yaku where the first id supersedes the second when both are
// complete. The superseded yaku is excluded from yakuman unit counting,
// since it is structurally subsumed by the superseding hand. It remains
// visible in the contributing names list so the user can see it is
// present, but does not inflate the yakuman total.
const YAKUMAN_SUPERSESSION: [string, string][] = [
  ["daisuushi",  "shousuushi"],  // 4 wind triplets supersedes 3 wind triplets + pair
  ["suuankou",   "sanankou"],    // 4 concealed triplets supersedes 3 concealed triplets
];

export function calculateScore(
  completeYaku: ResultEntry[],
  ruleset: ScoringRuleset,
  language: "japanese" | "english"
): ScoreResult {
  const contributingNames = completeYaku.map((e) =>
    language === "english" ? e.hand.nameEng : e.hand.name
  );

  // Apply mutual exclusion rules before summing yakuman units. A superseded
  // yaku remains in contributingNames for display, but is excluded from the
  // unit total so it does not inflate the yakuman count.
  const activeIds = new Set(completeYaku.map((e) => e.hand.id));
  const supersededIds = new Set<string>();
  for (const [supersedes, superseded] of YAKUMAN_SUPERSESSION) {
    if (activeIds.has(supersedes) && activeIds.has(superseded)) {
      supersededIds.add(superseded);
    }
  }
  const scoringYaku = completeYaku.filter((e) => !supersededIds.has(e.hand.id));

  // Sum yakuman units using the correct ruleset field.
  const yakumanTotal = scoringYaku.reduce((sum, e) => {
    const units =
      ruleset === "riichi"
        ? e.hand.yakumanUnitsRiichi
        : e.hand.yakumanUnits;
    return sum + units;
  }, 0);

  if (yakumanTotal > 0) {
    const category = YAKUMAN_CATEGORY[yakumanTotal] ?? "quadruple-yakuman";
    return {
      yakumanTotal,
      regularHan: 0,
      category,
      contributingNames,
      isYakuman: true,
    };
  }

  // No yakuman: use regular han sum.
  const regularHan = scoringYaku.reduce((sum, e) => sum + e.hand.hanValue, 0);

  // Counted yakuman: 13 or more regular han counts as one yakuman payout,
  // but cannot be upgraded by adding further yakuman yaku.
  if (regularHan >= 13) {
    return {
      yakumanTotal: 0,
      regularHan,
      category: "counted-yakuman",
      contributingNames,
      isYakuman: false,
    };
  }

  const category = categoryFromHan(regularHan);
  return {
    yakumanTotal: 0,
    regularHan,
    category,
    contributingNames,
    isYakuman: false,
  };
}