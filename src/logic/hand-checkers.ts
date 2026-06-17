import type { Tile } from "../data/tiles";

// ----------------------------------------------------------------
// Types


export type CheckResult = {
  possible: boolean;
  tilesNeeded: number;
  gapDescription: string;
};
// Defines the types of values used.

export type CheckerFn = (
  hand: Tile[],
  seatWind: string,
  roundWind: string
) => CheckResult;
//Adds the wind values, is used when wincon rules are checked.

// ----------------------------------------------------------------
// Tile classification helpers
// Checking the type of the tile and save it as one value. Simplification to not check every time + error checking.

export function isHonour(tile: Tile): boolean {
  return tile.suit === "wind" || tile.suit === "dragon";
}

export function isTerminal(tile: Tile): boolean {
  return (
    (tile.suit === "man" || tile.suit === "pin" || tile.suit === "sou") &&
    (tile.value === 1 || tile.value === 9)
  );
}

export function isSimple(tile: Tile): boolean {
  return (
    (tile.suit === "man" || tile.suit === "pin" || tile.suit === "sou") &&
    typeof tile.value === "number" &&
    tile.value >= 2 &&
    tile.value <= 8
  );
}

export function isTerminalOrHonour(tile: Tile): boolean {
  return isTerminal(tile) || isHonour(tile);
}

// ----------------------------------------------------------------
// Counting helpers
// ----------------------------------------------------------------

// Returns a map of tile id to how many times it appears in the hand
export function buildCountMap(hand: Tile[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const tile of hand) {
    map.set(tile.id, (map.get(tile.id) ?? 0) + 1);
  }
  return map;
}

// Returns a length-10 array where index = tile value and value = count.
// Index 0 is always unused. Index 1 = count of value-1 tiles, and so on.
// Only works for suited tiles (man, pin, or sou).
export function getSuitCounts(
  hand: Tile[],
  suit: "man" | "pin" | "sou"
): number[] {
  const counts = new Array(10).fill(0);
  for (const tile of hand) {
    if (tile.suit === suit && typeof tile.value === "number") {
      counts[tile.value]++;
    }
  }
  return counts;
}

// ----------------------------------------------------------------
// Set extraction (recursive with backtracking)
// ----------------------------------------------------------------

// Tries to extract exactly `setsNeeded` complete sets from a suit count array.
// A set is a triplet (3 identical tiles) or a sequence (3 consecutive values).
// This function only works for one suit at a time. Honours are handled separately.
// Mutates `counts` during recursion and restores it before returning.
// Returns true if the extraction is possible, false otherwise.

function tryExtractSets(counts: number[], setsNeeded: number): boolean {
  if (setsNeeded === 0) {
    return counts.every((c) => c === 0);
  }

  // Find the first tile value index that still has tiles remaining
  let i = 1;
  while (i <= 9 && counts[i] === 0) i++;
  if (i > 9) return false;

  // Try forming a triplet at index i
  if (counts[i] >= 3) {
    counts[i] -= 3;
    if (tryExtractSets(counts, setsNeeded - 1)) {
      counts[i] += 3;
      return true;
    }
    counts[i] += 3;
  }

  // Try forming a sequence at i, i+1, i+2
  if (i <= 7 && counts[i + 1] > 0 && counts[i + 2] > 0) {
    counts[i]--;
    counts[i + 1]--;
    counts[i + 2]--;
    if (tryExtractSets(counts, setsNeeded - 1)) {
      counts[i]++;
      counts[i + 1]++;
      counts[i + 2]++;
      return true;
    }
    counts[i]++;
    counts[i + 1]++;
    counts[i + 2]++;
  }

  // The tile at index i cannot start any valid set: extraction is impossible
  return false;
}

// ----------------------------------------------------------------
// Standard hand validation (4 sets + 1 pair)
// ----------------------------------------------------------------

// Checks whether an 11-tile remainder (after removing the pair candidate)
// can form exactly 4 valid sets.
function canFormFourSets(tiles: Tile[]): boolean {
  const honours = tiles.filter(isHonour);
  const suited = tiles.filter((t) => !isHonour(t));

  // Honours can only form triplets, never sequences.
  // Each honour id must appear exactly 3 times or the hand is invalid.
  const honourMap = buildCountMap(honours);
  for (const count of honourMap.values()) {
    if (count !== 3) return false;
  }

  const honourSetCount = honourMap.size;
  const suitedSetsNeeded = 4 - honourSetCount;
  if (suitedSetsNeeded < 0) return false;

  // Try all possible splits of the remaining sets across the three suits
  const manCounts = getSuitCounts(suited, "man");
  const pinCounts = getSuitCounts(suited, "pin");
  const souCounts = getSuitCounts(suited, "sou");

  for (let manSets = 0; manSets <= suitedSetsNeeded; manSets++) {
    for (let pinSets = 0; pinSets <= suitedSetsNeeded - manSets; pinSets++) {
      const souSets = suitedSetsNeeded - manSets - pinSets;
      if (
        tryExtractSets([...manCounts], manSets) &&
        tryExtractSets([...pinCounts], pinSets) &&
        tryExtractSets([...souCounts], souSets)
      ) {
        return true;
      }
    }
  }

  return false;
}

// Checks whether a 13-tile hand can form a valid standard structure: 4 sets + 1 pair.
// Tries every unique tile as the pair candidate.
export function canFormStandardHand(hand: Tile[]): boolean {
  const countMap = buildCountMap(hand);

  for (const [pairId, pairCount] of countMap.entries()) {
    if (pairCount < 2) continue;

    // Build the 11-tile remainder by removing exactly 2 copies of the pair tile
    const remaining: Tile[] = [];
    let removed = 0;
    for (const tile of hand) {
      if (tile.id === pairId && removed < 2) {
        removed++;
      } else {
        remaining.push(tile);
      }
    }

    if (canFormFourSets(remaining)) return true;
  }

  return false;
}

// ----------------------------------------------------------------
// Individual hand checkers
// ----------------------------------------------------------------

// TANYAO: all tiles must be simples (2-8 in man, pin, or sou).
// No terminals and no honours allowed.
function checkTanyao(
  hand: Tile[],
  _seatWind: string,
  _roundWind: string
): CheckResult {
  const nonSimples = hand.filter((tile) => !isSimple(tile));
  const tilesNeeded = nonSimples.length;

  if (tilesNeeded === 0) {
    return {
      possible: true,
      tilesNeeded: 0,
      gapDescription: "All tiles are simples. Hand satisfies Tanyao.",
    };
  }

  return {
    possible: true,
    tilesNeeded,
    gapDescription: `Replace ${tilesNeeded} terminal or honour tile${
      tilesNeeded !== 1 ? "s" : ""
    } with simples (2 to 8).`,
  };
}

// CHIITOITSU: seven different pairs.
// Each of the 7 pairs must be a different tile.
function checkChiitoitsu(
  hand: Tile[],
  _seatWind: string,
  _roundWind: string
): CheckResult {
  const countMap = buildCountMap(hand);
  const uniquePairs = [...countMap.values()].filter((c) => c >= 2).length;
  const tilesNeeded = 7 - uniquePairs;

  if (tilesNeeded <= 0) {
    return {
      possible: true,
      tilesNeeded: 0,
      gapDescription: "All 7 pairs present. Hand satisfies Chiitoitsu.",
    };
  }

  return {
    possible: true,
    tilesNeeded,
    gapDescription: `Has ${uniquePairs} pair${
      uniquePairs !== 1 ? "s" : ""
    }. Needs ${tilesNeeded} more.`,
  };
}

// KOKUSHI MUSOU: one each of all 13 terminal and honour tiles, plus one duplicate.
const KOKUSHI_TILES = [
  "man-1", "man-9",
  "pin-1", "pin-9",
  "sou-1", "sou-9",
  "wind-east", "wind-south", "wind-west", "wind-north",
  "dragon-white", "dragon-green", "dragon-red",
];

function checkKokushi(
  hand: Tile[],
  _seatWind: string,
  _roundWind: string
): CheckResult {
  const countMap = buildCountMap(hand);

  const uniqueCount = KOKUSHI_TILES.filter(
    (id) => (countMap.get(id) ?? 0) >= 1
  ).length;
  const hasDuplicate = KOKUSHI_TILES.some(
    (id) => (countMap.get(id) ?? 0) >= 2
  );
  const missingOrphans = 13 - uniqueCount;

  if (missingOrphans === 0 && hasDuplicate) {
    return {
      possible: true,
      tilesNeeded: 0,
      gapDescription: "Hand satisfies Kokushi Musou.",
    };
  }

  if (missingOrphans === 0 && !hasDuplicate) {
    return {
      possible: true,
      tilesNeeded: 1,
      gapDescription:
        "Has all 13 terminals and honours. Needs 1 duplicate of any.",
    };
  }

  const tilesNeeded = missingOrphans + (hasDuplicate ? 0 : 1);
  return {
    possible: true,
    tilesNeeded,
    gapDescription: `Has ${uniqueCount} of 13 terminals and honours.${
      !hasDuplicate ? " Also needs 1 duplicate." : ""
    }`,
  };
}

// STUB: placeholder for checkers not yet implemented (Session 9).
// tilesNeeded of 8 keeps stubs at the bottom in least-steps sort order.
function stubChecker(
  _hand: Tile[],
  _seatWind: string,
  _roundWind: string
): CheckResult {
  return {
    possible: true,
    tilesNeeded: 8,
    gapDescription: "Checker not yet implemented.",
  };
}

// ----------------------------------------------------------------
// Checker map: one entry per hand id defined in hands.ts
// ----------------------------------------------------------------

export const HAND_CHECKERS: Record<string, CheckerFn> = {
  pinfu:             stubChecker,
  tanyao:            checkTanyao,
  iipeiko:           stubChecker,
  "yakuhai-white":   stubChecker,
  "yakuhai-green":   stubChecker,
  "yakuhai-red":     stubChecker,
  "seat-wind":       stubChecker,
  "round-wind":      stubChecker,
  chiitoitsu:        checkChiitoitsu,
  "sanshoku-doujun": stubChecker,
  ittsu:             stubChecker,
  toitoi:            stubChecker,
  sanankou:          stubChecker,
  "sanshoku-doukou": stubChecker,
  shousangen:        stubChecker,
  honitsu:           stubChecker,
  chinitsu:          stubChecker,
  kokushi:           checkKokushi,
  suuankou:          stubChecker,
  daisangen:         stubChecker,
  shousuushi:        stubChecker,
  daisuushi:         stubChecker,
  tsuuiisou:         stubChecker,
  chinroutou:        stubChecker,
  ryuuiisou:         stubChecker,
  "chuuren-poutou":  stubChecker,
};