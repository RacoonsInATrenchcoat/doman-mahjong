import type { Hand } from "../data/hands";
import type { CheckResult } from "./hand-checkers";
import type { ScoringRuleset } from "../settings";
import type { ShantenGroup } from "./shanten/standard";
import { classifySequenceWait } from "../logic/tile-utils";

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
  // The amount of Fu is always a number.
  fu: number;
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
  "regular": "",
  "mangan": "Mangan",
  "haneman": "Haneman",
  "baiman": "Baiman",
  "sanbaiman": "Sanbaiman",
  "counted-yakuman": "Counted Yakuman",
  "yakuman": "Yakuman",
  "double-yakuman": "Double Yakuman",
  "triple-yakuman": "Triple Yakuman",
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
// Fu calculation
// ----------------------------------------------------------------

export type FuResult = {
  total: number;
  isProjected: boolean; // true when showing projected ron fu at tenpai
};

// Determines whether a tile id represents a simple tile (values 2-8
// in man, pin, or sou), a terminal (values 1 or 9 in man, pin, or sou),
// or an honour (wind or dragon). Used for triplet fu calculation.
function tileCategory(tileId: string): "simple" | "terminal" | "honour" {
  const [suit, valueStr] = tileId.split("-");
  if (suit === "wind" || suit === "dragon") return "honour";
  const value = parseInt(valueStr, 10);
  return value === 1 || value === 9 ? "terminal" : "simple";
}

// Calculates fu from the Standard shape decomposition.
// For Chiitoitsu: always returns 25 fu with no further calculation.
// For Pinfu + tsumo: always returns 20 fu.
// For all other closed hands: starts at 30 fu (projected closed ron)
// or 20 fu base for tsumo, then adds composition fu.
// At tenpai (not yet complete), projects assuming ron.
// At complete (14 tiles, tsumo): uses tsumo base.
export function calculateFu(
  groups: ShantenGroup[],
  isChiitoitsu: boolean,
  isPinfu: boolean,
  isTsumo: boolean,
  seatWind: string,
  roundWind: string
): FuResult {
  if (isChiitoitsu) {
    return { total: 25, isProjected: false };
  }

  // Pinfu + tsumo is a special fixed case: exactly 20 fu.
  // Pinfu + ron is 30 fu (closed ron adds 10 fu, which offsets the 0
  // composition fu, producing 30 from the base).
  if (isPinfu && isTsumo) {
    return { total: 20, isProjected: false };
  }
  if (isPinfu) {
    return { total: 30, isProjected: !isTsumo };
  }

  const isProjected = !isTsumo;
  let total = isTsumo ? 20 : 30;

  // Tsumo fu (only for non-Pinfu tsumo wins).
  if (isTsumo) total += 2;

  // Set fu: each triplet contributes 4 or 8 fu based on tile type.
  for (const group of groups) {
    if (group.label === "Triplet") {
      const heldSlot = group.slots.find(
        (s) => s.satisfied && s.ref.kind === "tile"
      );
      if (heldSlot && heldSlot.ref.kind === "tile") {
        const category = tileCategory(heldSlot.ref.tileId);
        total += category === "simple" ? 4 : 8;
      }
    }
  }

  // Pair fu: yakuhai pairs add 2 fu (or 4 fu if the tile is both
  // seat wind and round wind simultaneously).
  const pairGroup = groups.find((g) => g.label === "Pair");
  if (pairGroup) {
    const pairSlot = pairGroup.slots.find(
      (s) => s.satisfied && s.ref.kind === "tile"
    );
    if (pairSlot && pairSlot.ref.kind === "tile") {
      const id = pairSlot.ref.tileId;
      const isSeatWind = id === `wind-${seatWind}`;
      const isRoundWind = id === `wind-${roundWind}`;
      const isDragon =
        id === "dragon-white" || id === "dragon-green" || id === "dragon-red";
      if (isDragon || isSeatWind || isRoundWind) {
        // If the pair tile is both seat and round wind, it contributes 4 fu.
        total += isSeatWind && isRoundWind ? 4 : 2;
      }
    }
  }

  // Wait fu: non-ryanmen waits add 2 fu.
  // Tanki (pair wait, where the pair is incomplete) also adds 2 fu.
  const incompleteSequence = groups.find(
    (g) => g.label === "Sequence" && g.slots.some((s) => !s.satisfied)
  );
  if (incompleteSequence) {
    const heldValues = incompleteSequence.slots
      .filter((s) => s.satisfied && s.ref.kind === "tile")
      .map((s) => (s.ref.kind === "tile" ? parseInt(s.ref.tileId.split("-")[1], 10) : 0));
    const missingSlot = incompleteSequence.slots.find((s) => !s.satisfied);
    if (missingSlot && missingSlot.ref.kind === "tile") {
      const missingValue = parseInt(missingSlot.ref.tileId.split("-")[1], 10);
      const waitShape = classifySequenceWait(heldValues, missingValue);
      if (waitShape !== "ryanmen") total += 2;
    }
  } else {
    // Check for tanki: the pair group has an unsatisfied slot.
    const incompletePair = groups.find(
      (g) => g.label === "Pair" && g.slots.some((s) => !s.satisfied)
    );
    if (incompletePair) total += 2;
  }

  // Round up to nearest 10.
  const rounded = Math.ceil(total / 10) * 10;
  return { total: rounded, isProjected };
}

// ----------------------------------------------------------------
// Mangan threshold check
// ----------------------------------------------------------------

function categoryFromHanAndFu(han: number, fu: number): ScoreCategory {
  if (han >= 13) return "counted-yakuman";
  if (han >= 11) return "sanbaiman";
  if (han >= 8) return "baiman";
  if (han >= 6) return "haneman";
  if (han >= 5) return "mangan";
  // Fu-dependent mangan thresholds, only relevant below 5 han.
  if (han === 4 && fu >= 30) return "mangan";
  if (han === 3 && fu >= 70) return "mangan";
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
  ["daisuushi", "shousuushi"],  // 4 wind triplets supersedes 3 wind triplets + pair
  ["suuankou", "sanankou"],    // 4 concealed triplets supersedes 3 concealed triplets
];

export function calculateScore(
  completeYaku: ResultEntry[],
  ruleset: ScoringRuleset,
  language: "japanese" | "english",
  fu: number = 30
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
      fu: 0,
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
      fu,
      category: "counted-yakuman",
      contributingNames,
      isYakuman: false,
    };
  }

  const category = categoryFromHanAndFu(regularHan, fu);
  return {
    yakumanTotal: 0,
    regularHan,
    fu,
    category,
    contributingNames,
    isYakuman: false,
  };
}