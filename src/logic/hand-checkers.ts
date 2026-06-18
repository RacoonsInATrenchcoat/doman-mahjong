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

// ----------------------------------------------------------------
// Dragon yakuhai checkers
// ----------------------------------------------------------------

function checkYakuhaiWhite(
  hand: Tile[],
  _seatWind: string,
  _roundWind: string
): CheckResult {
  const count = hand.filter((t) => t.id === "dragon-white").length;
  const tilesNeeded = Math.max(0, 3 - count);
  if (tilesNeeded === 0) {
    return { possible: true, tilesNeeded: 0, gapDescription: "Has White Dragon triplet." };
  }
  return { possible: true, tilesNeeded, gapDescription: `Has ${count} of 3 White Dragon tiles.` };
}

function checkYakuhaiGreen(
  hand: Tile[],
  _seatWind: string,
  _roundWind: string
): CheckResult {
  const count = hand.filter((t) => t.id === "dragon-green").length;
  const tilesNeeded = Math.max(0, 3 - count);
  if (tilesNeeded === 0) {
    return { possible: true, tilesNeeded: 0, gapDescription: "Has Green Dragon triplet." };
  }
  return { possible: true, tilesNeeded, gapDescription: `Has ${count} of 3 Green Dragon tiles.` };
}

function checkYakuhaiRed(
  hand: Tile[],
  _seatWind: string,
  _roundWind: string
): CheckResult {
  const count = hand.filter((t) => t.id === "dragon-red").length;
  const tilesNeeded = Math.max(0, 3 - count);
  if (tilesNeeded === 0) {
    return { possible: true, tilesNeeded: 0, gapDescription: "Has Red Dragon triplet." };
  }
  return { possible: true, tilesNeeded, gapDescription: `Has ${count} of 3 Red Dragon tiles.` };
}

// ----------------------------------------------------------------
// Wind yakuhai checkers
// ----------------------------------------------------------------

function checkSeatWind(
  hand: Tile[],
  seatWind: string,
  _roundWind: string
): CheckResult {
  const tileId = `wind-${seatWind}`;
  const count = hand.filter((t) => t.id === tileId).length;
  const tilesNeeded = Math.max(0, 3 - count);
  const name = seatWind.charAt(0).toUpperCase() + seatWind.slice(1);
  if (tilesNeeded === 0) {
    return { possible: true, tilesNeeded: 0, gapDescription: `Has ${name} (seat wind) triplet.` };
  }
  return { possible: true, tilesNeeded, gapDescription: `Has ${count} of 3 ${name} seat wind tiles.` };
}

function checkRoundWind(
  hand: Tile[],
  _seatWind: string,
  roundWind: string
): CheckResult {
  const tileId = `wind-${roundWind}`;
  const count = hand.filter((t) => t.id === tileId).length;
  const tilesNeeded = Math.max(0, 3 - count);
  const name = roundWind.charAt(0).toUpperCase() + roundWind.slice(1);
  if (tilesNeeded === 0) {
    return { possible: true, tilesNeeded: 0, gapDescription: `Has ${name} (round wind) triplet.` };
  }
  return { possible: true, tilesNeeded, gapDescription: `Has ${count} of 3 ${name} round wind tiles.` };
}

// ----------------------------------------------------------------
// Tile composition checkers
// ----------------------------------------------------------------

function checkHonitsu(
  hand: Tile[],
  _seatWind: string,
  _roundWind: string
): CheckResult {
  const suitedTiles = hand.filter((t) => !isHonour(t));
  if (suitedTiles.length === 0) {
    return { possible: true, tilesNeeded: 0, gapDescription: "All tiles are honours. Hand satisfies Honitsu." };
  }

  const suitCounts = new Map<string, number>();
  for (const tile of suitedTiles) {
    suitCounts.set(tile.suit, (suitCounts.get(tile.suit) ?? 0) + 1);
  }

  if (suitCounts.size === 1) {
    const suit = [...suitCounts.keys()][0];
    return { possible: true, tilesNeeded: 0, gapDescription: `All suited tiles are ${suit}. Hand satisfies Honitsu.` };
  }

  let dominantSuit = "man";
  let maxCount = 0;
  for (const [suit, count] of suitCounts) {
    if (count > maxCount) { dominantSuit = suit; maxCount = count; }
  }

  const tilesNeeded = suitedTiles.filter((t) => t.suit !== dominantSuit).length;
  return {
    possible: true,
    tilesNeeded,
    gapDescription: `Has tiles from ${suitCounts.size} suits. Replace ${tilesNeeded} off-suit tile${tilesNeeded !== 1 ? "s" : ""} with ${dominantSuit} tiles or honours.`,
  };
}

function checkChinitsu(
  hand: Tile[],
  _seatWind: string,
  _roundWind: string
): CheckResult {
  const suits = ["man", "pin", "sou"] as const;
  let dominantSuit: "man" | "pin" | "sou" = "man";
  let maxCount = 0;
  for (const suit of suits) {
    const count = hand.filter((t) => t.suit === suit).length;
    if (count > maxCount) { dominantSuit = suit; maxCount = count; }
  }

  const offSuit = hand.filter((t) => t.suit !== dominantSuit).length;
  if (offSuit === 0) {
    return { possible: true, tilesNeeded: 0, gapDescription: `All tiles are ${dominantSuit}. Hand satisfies Chinitsu.` };
  }
  return {
    possible: true,
    tilesNeeded: offSuit,
    gapDescription: `Replace ${offSuit} tile${offSuit !== 1 ? "s" : ""} with ${dominantSuit} tiles.`,
  };
}

function checkTsuuiisou(
  hand: Tile[],
  _seatWind: string,
  _roundWind: string
): CheckResult {
  const nonHonours = hand.filter((t) => !isHonour(t)).length;
  if (nonHonours === 0) {
    return { possible: true, tilesNeeded: 0, gapDescription: "All tiles are honours. Hand satisfies Tsuuiisou." };
  }
  return {
    possible: true,
    tilesNeeded: nonHonours,
    gapDescription: `Replace ${nonHonours} non-honour tile${nonHonours !== 1 ? "s" : ""} with winds or dragons.`,
  };
}

function checkChinroutou(
  hand: Tile[],
  _seatWind: string,
  _roundWind: string
): CheckResult {
  const nonTerminals = hand.filter((t) => !isTerminal(t)).length;
  if (nonTerminals === 0) {
    return { possible: true, tilesNeeded: 0, gapDescription: "All tiles are terminals. Hand satisfies Chinroutou." };
  }
  return {
    possible: true,
    tilesNeeded: nonTerminals,
    gapDescription: `Replace ${nonTerminals} non-terminal tile${nonTerminals !== 1 ? "s" : ""} with 1s and 9s.`,
  };
}

const RYUUIISOU_IDS = new Set([
  "sou-2", "sou-3", "sou-4", "sou-6", "sou-8", "dragon-green",
]);

function checkRyuuiisou(
  hand: Tile[],
  _seatWind: string,
  _roundWind: string
): CheckResult {
  const invalid = hand.filter((t) => !RYUUIISOU_IDS.has(t.id)).length;
  if (invalid === 0) {
    return { possible: true, tilesNeeded: 0, gapDescription: "All tiles are in the green set. Hand satisfies Ryuuiisou." };
  }
  return {
    possible: true,
    tilesNeeded: invalid,
    gapDescription: `Replace ${invalid} tile${invalid !== 1 ? "s" : ""} with green tiles: sou 2, 3, 4, 6, 8, or Green Dragon.`,
  };
}

// ----------------------------------------------------------------
// Triplet structure checkers
// ----------------------------------------------------------------

function checkToitoi(
  hand: Tile[],
  _seatWind: string,
  _roundWind: string
): CheckResult {
  const countMap = buildCountMap(hand);
  const triplets = [...countMap.values()].filter((c) => c >= 3).length;
  const singles = [...countMap.values()].filter((c) => c === 1).length;

  if (triplets >= 4) {
    return { possible: true, tilesNeeded: 0, gapDescription: "Four triplets present. Hand satisfies Toitoi." };
  }
  const tilesNeeded = Math.max(4 - triplets, singles);
  return {
    possible: true,
    tilesNeeded,
    gapDescription: `Has ${triplets} of 4 triplets. ${singles > 0 ? `${singles} singleton${singles !== 1 ? "s" : ""} need replacing.` : "Needs more triplets."}`,
  };
}

// Suuankou and Toitoi have identical detection since all hands are treated as closed.
// In live play the distinction is open vs closed, which this tool does not track.
function checkSuuankou(
  hand: Tile[],
  _seatWind: string,
  _roundWind: string
): CheckResult {
  const countMap = buildCountMap(hand);
  const triplets = [...countMap.values()].filter((c) => c >= 3).length;

  if (triplets >= 4) {
    return { possible: true, tilesNeeded: 0, gapDescription: "Four concealed triplets. Hand satisfies Suuankou." };
  }
  return { possible: true, tilesNeeded: 4 - triplets, gapDescription: `Has ${triplets} of 4 concealed triplets.` };
}

function checkSanankou(
  hand: Tile[],
  _seatWind: string,
  _roundWind: string
): CheckResult {
  const countMap = buildCountMap(hand);
  const triplets = [...countMap.values()].filter((c) => c >= 3).length;

  if (triplets >= 3) {
    return { possible: true, tilesNeeded: 0, gapDescription: `Has ${triplets} concealed triplets. Hand satisfies Sanankou.` };
  }
  return { possible: true, tilesNeeded: 3 - triplets, gapDescription: `Has ${triplets} of 3 needed concealed triplets.` };
}

function checkDaisangen(
  hand: Tile[],
  _seatWind: string,
  _roundWind: string
): CheckResult {
  const countMap = buildCountMap(hand);
  const dragonIds = ["dragon-white", "dragon-green", "dragon-red"];
  const tilesNeeded = dragonIds.reduce(
    (sum, id) => sum + Math.max(0, 3 - (countMap.get(id) ?? 0)), 0
  );
  const triplets = dragonIds.filter((id) => (countMap.get(id) ?? 0) >= 3).length;

  if (tilesNeeded === 0) {
    return { possible: true, tilesNeeded: 0, gapDescription: "Has all three dragon triplets. Hand satisfies Daisangen." };
  }
  return {
    possible: true,
    tilesNeeded,
    gapDescription: `Has ${triplets} of 3 dragon triplets. Needs ${tilesNeeded} more dragon tile${tilesNeeded !== 1 ? "s" : ""}.`,
  };
}

function checkDaisuushi(
  hand: Tile[],
  _seatWind: string,
  _roundWind: string
): CheckResult {
  const countMap = buildCountMap(hand);
  const windIds = ["wind-east", "wind-south", "wind-west", "wind-north"];
  const tilesNeeded = windIds.reduce(
    (sum, id) => sum + Math.max(0, 3 - (countMap.get(id) ?? 0)), 0
  );
  const triplets = windIds.filter((id) => (countMap.get(id) ?? 0) >= 3).length;

  if (tilesNeeded === 0) {
    return { possible: true, tilesNeeded: 0, gapDescription: "Has all four wind triplets. Hand satisfies Daisuushi." };
  }
  return {
    possible: true,
    tilesNeeded,
    gapDescription: `Has ${triplets} of 4 wind triplets. Needs ${tilesNeeded} more wind tile${tilesNeeded !== 1 ? "s" : ""}.`,
  };
}

function checkShousangen(
  hand: Tile[],
  _seatWind: string,
  _roundWind: string
): CheckResult {
  const countMap = buildCountMap(hand);
  const dragonCounts = [
    countMap.get("dragon-white") ?? 0,
    countMap.get("dragon-green") ?? 0,
    countMap.get("dragon-red") ?? 0,
  ].sort((a, b) => b - a);

  const tilesNeeded =
    Math.max(0, 3 - dragonCounts[0]) +
    Math.max(0, 3 - dragonCounts[1]) +
    Math.max(0, 2 - dragonCounts[2]);
  const triplets = dragonCounts.filter((c) => c >= 3).length;

  if (tilesNeeded === 0) {
    return { possible: true, tilesNeeded: 0, gapDescription: "Has two dragon triplets and one dragon pair. Hand satisfies Shousangen." };
  }
  return {
    possible: true,
    tilesNeeded,
    gapDescription: `Has ${triplets} dragon triplet${triplets !== 1 ? "s" : ""}. Needs 2 triplets and 1 dragon pair.`,
  };
}

function checkShousuushi(
  hand: Tile[],
  _seatWind: string,
  _roundWind: string
): CheckResult {
  const countMap = buildCountMap(hand);
  const windCounts = [
    countMap.get("wind-east") ?? 0,
    countMap.get("wind-south") ?? 0,
    countMap.get("wind-west") ?? 0,
    countMap.get("wind-north") ?? 0,
  ].sort((a, b) => b - a);

  const tilesNeeded =
    Math.max(0, 3 - windCounts[0]) +
    Math.max(0, 3 - windCounts[1]) +
    Math.max(0, 3 - windCounts[2]) +
    Math.max(0, 2 - windCounts[3]);
  const triplets = windCounts.filter((c) => c >= 3).length;

  if (tilesNeeded === 0) {
    return { possible: true, tilesNeeded: 0, gapDescription: "Has three wind triplets and one wind pair. Hand satisfies Shousuushi." };
  }
  return {
    possible: true,
    tilesNeeded,
    gapDescription: `Has ${triplets} wind triplet${triplets !== 1 ? "s" : ""}. Needs 3 wind triplets and 1 wind pair.`,
  };
}

function checkSanshokuDoukou(
  hand: Tile[],
  _seatWind: string,
  _roundWind: string
): CheckResult {
  const manCounts = getSuitCounts(hand, "man");
  const pinCounts = getSuitCounts(hand, "pin");
  const souCounts = getSuitCounts(hand, "sou");

  let bestTilesNeeded = 99;
  let bestValue = 1;

  for (let v = 1; v <= 9; v++) {
    const needed =
      Math.max(0, 3 - manCounts[v]) +
      Math.max(0, 3 - pinCounts[v]) +
      Math.max(0, 3 - souCounts[v]);
    if (needed < bestTilesNeeded) { bestTilesNeeded = needed; bestValue = v; }
  }

  if (bestTilesNeeded === 0) {
    return { possible: true, tilesNeeded: 0, gapDescription: `Has triplets of ${bestValue} in all three suits. Hand satisfies Sanshoku Doukou.` };
  }
  return {
    possible: true,
    tilesNeeded: bestTilesNeeded,
    gapDescription: `Best candidate: value ${bestValue} triplet across suits. Needs ${bestTilesNeeded} more tile${bestTilesNeeded !== 1 ? "s" : ""}.`,
  };
}

// ----------------------------------------------------------------
// Sequence structure checkers
// ----------------------------------------------------------------

// Note: Pinfu detection is an approximation. It checks that no honours
// are present and a valid non-yakuhai pair exists. It does not verify
// that all sets are sequences, which would require full decomposition.
function checkPinfu(
  hand: Tile[],
  seatWind: string,
  roundWind: string
): CheckResult {
  const honours = hand.filter((t) => isHonour(t)).length;
  if (honours > 0) {
    return {
      possible: true,
      tilesNeeded: honours,
      gapDescription: `Has ${honours} honour tile${honours !== 1 ? "s" : ""}. Pinfu requires sequences only, so all honours must be replaced.`,
    };
  }

  const countMap = buildCountMap(hand);
  const yakuhaiIds = new Set([
    "dragon-white", "dragon-green", "dragon-red",
    `wind-${seatWind}`, `wind-${roundWind}`,
  ]);

  const hasValidPair = [...countMap.entries()].some(
    ([id, count]) => count >= 2 && !yakuhaiIds.has(id)
  );

  if (hasValidPair) {
    return {
      possible: true,
      tilesNeeded: 0,
      gapDescription: "No honours and a valid non-yakuhai pair exists. Hand may satisfy Pinfu.",
    };
  }
  return {
    possible: true,
    tilesNeeded: 1,
    gapDescription: "No valid non-yakuhai pair found. The pair cannot be a dragon or wind tile.",
  };
}

function checkIipeiko(
  hand: Tile[],
  _seatWind: string,
  _roundWind: string
): CheckResult {
  const suits = ["man", "pin", "sou"] as const;

  for (const suit of suits) {
    const counts = getSuitCounts(hand, suit);
    for (let v = 1; v <= 7; v++) {
      if (counts[v] >= 2 && counts[v + 1] >= 2 && counts[v + 2] >= 2) {
        return {
          possible: true,
          tilesNeeded: 0,
          gapDescription: `Has two ${suit} ${v}-${v + 1}-${v + 2} sequences. Hand satisfies Iipeiko.`,
        };
      }
    }
  }

  let bestTilesNeeded = 6;
  let bestDesc = "No duplicate sequence found.";

  for (const suit of suits) {
    const counts = getSuitCounts(hand, suit);
    for (let v = 1; v <= 7; v++) {
      const needed =
        Math.max(0, 2 - counts[v]) +
        Math.max(0, 2 - counts[v + 1]) +
        Math.max(0, 2 - counts[v + 2]);
      if (needed < bestTilesNeeded) {
        bestTilesNeeded = needed;
        bestDesc = `Best candidate: two ${suit} ${v}-${v + 1}-${v + 2} sequences. Needs ${needed} more tile${needed !== 1 ? "s" : ""}.`;
      }
    }
  }

  return { possible: true, tilesNeeded: bestTilesNeeded, gapDescription: bestDesc };
}

function checkSanshokuDoujun(
  hand: Tile[],
  _seatWind: string,
  _roundWind: string
): CheckResult {
  const manCounts = getSuitCounts(hand, "man");
  const pinCounts = getSuitCounts(hand, "pin");
  const souCounts = getSuitCounts(hand, "sou");

  for (let v = 1; v <= 7; v++) {
    if (
      manCounts[v] >= 1 && manCounts[v + 1] >= 1 && manCounts[v + 2] >= 1 &&
      pinCounts[v] >= 1 && pinCounts[v + 1] >= 1 && pinCounts[v + 2] >= 1 &&
      souCounts[v] >= 1 && souCounts[v + 1] >= 1 && souCounts[v + 2] >= 1
    ) {
      return {
        possible: true,
        tilesNeeded: 0,
        gapDescription: `Has ${v}-${v + 1}-${v + 2} sequence in all three suits. Hand satisfies Sanshoku Doujun.`,
      };
    }
  }

  let bestTilesNeeded = 99;
  let bestV = 1;

  for (let v = 1; v <= 7; v++) {
    const needed =
      Math.max(0, 1 - manCounts[v]) + Math.max(0, 1 - manCounts[v + 1]) + Math.max(0, 1 - manCounts[v + 2]) +
      Math.max(0, 1 - pinCounts[v]) + Math.max(0, 1 - pinCounts[v + 1]) + Math.max(0, 1 - pinCounts[v + 2]) +
      Math.max(0, 1 - souCounts[v]) + Math.max(0, 1 - souCounts[v + 1]) + Math.max(0, 1 - souCounts[v + 2]);
    if (needed < bestTilesNeeded) { bestTilesNeeded = needed; bestV = v; }
  }

  return {
    possible: true,
    tilesNeeded: bestTilesNeeded,
    gapDescription: `Best candidate: ${bestV}-${bestV + 1}-${bestV + 2} across all suits. Needs ${bestTilesNeeded} more tile${bestTilesNeeded !== 1 ? "s" : ""}.`,
  };
}

function checkIttsu(
  hand: Tile[],
  _seatWind: string,
  _roundWind: string
): CheckResult {
  const suits = ["man", "pin", "sou"] as const;

  for (const suit of suits) {
    const counts = getSuitCounts(hand, suit);
    const allPresent = [1, 2, 3, 4, 5, 6, 7, 8, 9].every((v) => counts[v] >= 1);
    if (allPresent) {
      return {
        possible: true,
        tilesNeeded: 0,
        gapDescription: `Has 1-2-3, 4-5-6, 7-8-9 in ${suit}. Hand satisfies Ittsu.`,
      };
    }
  }

  let bestTilesNeeded = 99;
  let bestSuit: "man" | "pin" | "sou" = "man";

  for (const suit of suits) {
    const counts = getSuitCounts(hand, suit);
    const needed = [1, 2, 3, 4, 5, 6, 7, 8, 9].reduce(
      (sum, v) => sum + Math.max(0, 1 - counts[v]), 0
    );
    if (needed < bestTilesNeeded) { bestTilesNeeded = needed; bestSuit = suit; }
  }

  return {
    possible: true,
    tilesNeeded: bestTilesNeeded,
    gapDescription: `Best suit: ${bestSuit}. Needs ${bestTilesNeeded} more tile${bestTilesNeeded !== 1 ? "s" : ""} for full 1-9 coverage.`,
  };
}

function checkChuurenPoutou(
  hand: Tile[],
  _seatWind: string,
  _roundWind: string
): CheckResult {
  const honours = hand.filter((t) => isHonour(t)).length;
  if (honours > 0) {
    return {
      possible: true,
      tilesNeeded: honours,
      gapDescription: `Has ${honours} honour tile${honours !== 1 ? "s" : ""}. Chuuren Poutou requires one suit only.`,
    };
  }

  const suits = ["man", "pin", "sou"] as const;
  let bestSuit: "man" | "pin" | "sou" = "man";
  let maxCount = 0;
  for (const suit of suits) {
    const count = hand.filter((t) => t.suit === suit).length;
    if (count > maxCount) { bestSuit = suit; maxCount = count; }
  }

  const offSuit = hand.filter((t) => t.suit !== bestSuit).length;
  if (offSuit > 0) {
    return {
      possible: true,
      tilesNeeded: offSuit,
      gapDescription: `Has tiles from multiple suits. Replace ${offSuit} tile${offSuit !== 1 ? "s" : ""} with ${bestSuit} tiles.`,
    };
  }

  const counts = getSuitCounts(hand, bestSuit);
  const minRequired = [0, 3, 1, 1, 1, 1, 1, 1, 1, 3];
  const deficiency = [1, 2, 3, 4, 5, 6, 7, 8, 9].reduce(
    (sum, v) => sum + Math.max(0, minRequired[v] - counts[v]), 0
  );

  if (deficiency === 0) {
    return {
      possible: true,
      tilesNeeded: 0,
      gapDescription: `All ${bestSuit} tiles match the 1-1-1-2-3-4-5-6-7-8-9-9-9 pattern. Hand satisfies Chuuren Poutou.`,
    };
  }
  return {
    possible: true,
    tilesNeeded: deficiency,
    gapDescription: `Needs ${deficiency} more ${bestSuit} tile${deficiency !== 1 ? "s" : ""} to complete the Chuuren Poutou pattern.`,
  };
}

// ----------------------------------------------------------------
// Checker map: one entry per hand id defined in hands.ts
// ----------------------------------------------------------------

export const HAND_CHECKERS: Record<string, CheckerFn> = {
  pinfu:             checkPinfu,
  tanyao:            checkTanyao,
  iipeiko:           checkIipeiko,
  "yakuhai-white":   checkYakuhaiWhite,
  "yakuhai-green":   checkYakuhaiGreen,
  "yakuhai-red":     checkYakuhaiRed,
  "seat-wind":       checkSeatWind,
  "round-wind":      checkRoundWind,
  chiitoitsu:        checkChiitoitsu,
  "sanshoku-doujun": checkSanshokuDoujun,
  ittsu:             checkIttsu,
  toitoi:            checkToitoi,
  sanankou:          checkSanankou,
  "sanshoku-doukou": checkSanshokuDoukou,
  shousangen:        checkShousangen,
  honitsu:           checkHonitsu,
  chinitsu:          checkChinitsu,
  kokushi:           checkKokushi,
  suuankou:          checkSuuankou,
  daisangen:         checkDaisangen,
  shousuushi:        checkShousuushi,
  daisuushi:         checkDaisuushi,
  tsuuiisou:         checkTsuuiisou,
  chinroutou:        checkChinroutou,
  ryuuiisou:         checkRyuuiisou,
  "chuuren-poutou":  checkChuurenPoutou,
};