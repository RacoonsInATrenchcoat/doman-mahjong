import type { Tile } from "../data/tiles";

// ----------------------------------------------------------------
// Types


export type TemplateId =
  | "pair"
  | "triplet"
  | "straight"
  | "honour"
  | "non-honour"
  | "terminal";
// Defines the types of values used, checks that they can only be these.

export type VisualTileRef =
  | { kind: "tile"; tileId: string }
  | { kind: "template"; template: TemplateId };

export type VisualSlot = {
  ref: VisualTileRef;
  satisfied: boolean;
};

export type CheckResult = {
  possible: boolean;
  tilesNeeded: number;
  gapDescription: string;
  visual: VisualSlot[];
};

export const TEMPLATE_IMAGES: Record<TemplateId, string> = {
  pair: "/templates/pair.png",
  triplet: "/templates/triplet.png",
  straight: "/templates/straight.png",
  honour: "/templates/honour.gif",
  "non-honour": "/templates/non-honour.gif",
  terminal: "/templates/terminal.gif",
};

// ----------------------------------------------------------------
// Visual helper functions
// ----------------------------------------------------------------

// Builds `total` visual slots of one exact tile id, with `haveCount` of
// them marked satisfied and the rest marked unsatisfied.
// Example: buildTileSlots("dragon-white", 1, 3) for "has 1 of 3 White Dragon".
function buildTileSlots(
  tileId: string,
  haveCount: number,
  total: number
): VisualSlot[] {
  const slots: VisualSlot[] = [];
  for (let i = 0; i < total; i++) {
    slots.push({
      ref: { kind: "tile", tileId },
      satisfied: i < haveCount,
    });
  }
  return slots;
}

// Builds visual slots from an array of real tiles already in hand, all
// marked satisfied. Used when every tile shown genuinely exists in the hand.
function buildHeldSlots(tiles: Tile[]): VisualSlot[] {
  return tiles.map((tile) => ({
    ref: { kind: "tile", tileId: tile.id },
    satisfied: true,
  }));
}

// Builds `count` generic template slots, all marked unsatisfied.
// Used only for the four yaku that deliberately do not resolve to a
// specific tile: Chiitoitsu, Pinfu's pair, Toitoi, Sanankou, Suuankou.
function buildTemplateSlots(
  template: TemplateId,
  count: number
): VisualSlot[] {
  const slots: VisualSlot[] = [];
  for (let i = 0; i < count; i++) {
    slots.push({
      ref: { kind: "template", template },
      satisfied: false,
    });
  }
  return slots;
}

// Builds visual slots from an array of real tiles already in hand, all
// marked unsatisfied. Used when a real, known tile needs to be removed
// or replaced, as opposed to a tile that needs to be added.
function buildMissingSlots(tiles: Tile[]): VisualSlot[] {
  return tiles.map((tile) => ({
    ref: { kind: "tile", tileId: tile.id },
    satisfied: false,
  }));
}


// ----------------------------------------------------------------
// Tile-accurate cost helpers, used for tilesNeeded, not for visuals
// ----------------------------------------------------------------

// Computes the minimum number of physical tiles needed to reach `target`
// complete triplets. Existing pairs cost 1 tile each to complete, existing
// singles cost 2 tiles each, anything beyond that costs 3 tiles each for a
// triplet built from nothing. Cheapest material is always used first.
type TripletGroupPlan = {
  tilesNeeded: number;
  visual: VisualSlot[];
  leftoverSingleIds: string[];
};

// Computes the cheapest path to `target` triplets, and builds the matching
// visual at the same time, so the number and the picture can never disagree.
// Existing pairs are extended first (1 tile, shown as 2 held + 1 missing of
// the same real tile id), then existing singles (2 tiles, shown as 1 held +
// 2 missing of the same id), then anything left over is built from nothing
// and shown as the generic triplet template, since no tile identity exists
// to point to in that case.
function buildTripletGroupPlan(hand: Tile[], target: number): TripletGroupPlan {
  const countMap = buildCountMap(hand);
  const tripletIds = [...countMap.entries()].filter(([, c]) => c >= 3).map(([id]) => id);
  const pairIds = [...countMap.entries()].filter(([, c]) => c === 2).map(([id]) => id);
  const singleIds = [...countMap.entries()].filter(([, c]) => c === 1).map(([id]) => id);

  let groupsNeeded = Math.max(0, target - tripletIds.length);
  let tilesNeeded = 0;
  const visual: VisualSlot[] = [];

  for (const id of tripletIds) {
    const tile = hand.find((t) => t.id === id)!;
    visual.push(...buildHeldSlots([tile, tile, tile]));
  }

  const usedPairIds = pairIds.slice(0, groupsNeeded);
  groupsNeeded -= usedPairIds.length;
  tilesNeeded += usedPairIds.length * 1;
  for (const id of usedPairIds) {
    const tile = hand.find((t) => t.id === id)!;
    visual.push(...buildHeldSlots([tile, tile]));
    visual.push({ ref: { kind: "tile", tileId: id }, satisfied: false });
  }

  const usedSingleIds = singleIds.slice(0, groupsNeeded);
  groupsNeeded -= usedSingleIds.length;
  tilesNeeded += usedSingleIds.length * 2;
  for (const id of usedSingleIds) {
    const tile = hand.find((t) => t.id === id)!;
    visual.push(...buildHeldSlots([tile]));
    visual.push({ ref: { kind: "tile", tileId: id }, satisfied: false });
    visual.push({ ref: { kind: "tile", tileId: id }, satisfied: false });
  }

  tilesNeeded += groupsNeeded * 3;
  visual.push(...buildTemplateSlots("triplet", groupsNeeded));

  const leftoverSingleIds = singleIds.filter((id) => !usedSingleIds.includes(id));

  return { tilesNeeded, visual, leftoverSingleIds };
}

// Computes the minimum number of physical tiles needed to reach
// `missingPairs` more unique pairs, beyond what already exists. Existing
// singles cost 1 tile each to complete into a pair, anything beyond that
// costs 2 tiles each for a pair built from a tile not yet in hand.
function computeChiitoitsuTileCost(hand: Tile[], missingPairs: number): number {
  const countMap = buildCountMap(hand);
  const singles = [...countMap.values()].filter((c) => c === 1).length;

  const fromSingles = Math.min(missingPairs, singles);
  const fromScratch = missingPairs - fromSingles;
  return fromSingles * 1 + fromScratch * 2;
}


// Builds visual slots for two copies of a v, v+1, v+2 sequence in one suit.
// Used by Iipeikou, where a duplicate sequence is the goal.
function buildIipeikouVisual(
  hand: Tile[],
  suit: "man" | "pin" | "sou",
  v: number
): VisualSlot[] {
  const values = [v, v + 1, v + 2];
  return values.flatMap((val) => {
    const id = `${suit}-${val}`;
    const have = hand.filter((t) => t.id === id);
    const haveCount = Math.min(2, have.length);
    const missingCount = 2 - haveCount;
    const missingSlots: VisualSlot[] = Array.from({ length: missingCount }, () => ({
      ref: { kind: "tile", tileId: id },
      satisfied: false,
    }));
    return [...buildHeldSlots(have.slice(0, haveCount)), ...missingSlots];
  });
}

// Builds visual slots for one v, v+1, v+2 sequence appearing in all three suits.
// Used by Sanshoku Doujun.
function buildSanshokuDoujunVisual(hand: Tile[], v: number): VisualSlot[] {
  const suits = ["man", "pin", "sou"] as const;
  const values = [v, v + 1, v + 2];
  return suits.flatMap((suit) =>
    values.map((val) => {
      const id = `${suit}-${val}`;
      const satisfied = hand.some((t) => t.id === id);
      return { ref: { kind: "tile" as const, tileId: id }, satisfied };
    })
  );
}

// Builds visual slots for one full 1-9 run in one suit.
// Used by Ittsuu.
function buildIttsuuVisual(hand: Tile[], suit: "man" | "pin" | "sou"): VisualSlot[] {
  const counts = getSuitCounts(hand, suit);
  return [1, 2, 3, 4, 5, 6, 7, 8, 9].map((v) => {
    const id = `${suit}-${v}`;
    return { ref: { kind: "tile" as const, tileId: id }, satisfied: counts[v] >= 1 };
  });
}

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
  const simples = hand.filter((tile) => isSimple(tile));
  const nonSimples = hand.filter((tile) => !isSimple(tile));
  const tilesNeeded = nonSimples.length;
  const visual = [...buildHeldSlots(simples), ...buildMissingSlots(nonSimples)];

  if (tilesNeeded === 0) {
    return {
      possible: true,
      tilesNeeded: 0,
      gapDescription: "All tiles are simples. Hand satisfies Tanyao.",
      visual,
    };
  }

  return {
    possible: true,
    tilesNeeded,
    gapDescription: `Replace ${tilesNeeded} terminal or honour tile${
      tilesNeeded !== 1 ? "s" : ""
    } with simples (2 to 8).`,
    visual,
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
  const pairTileIds = [...countMap.entries()]
    .filter(([, c]) => c >= 2)
    .map(([id]) => id);
  const uniquePairs = pairTileIds.length;
  const missingPairs = Math.max(0, 7 - uniquePairs);
  const tilesNeeded = computeChiitoitsuTileCost(hand, missingPairs);

  const heldPairTiles = pairTileIds.flatMap((id) => {
    const tile = hand.find((t) => t.id === id)!;
    return [tile, tile];
  });
  const visual = [
    ...buildHeldSlots(heldPairTiles),
    ...buildTemplateSlots("pair", missingPairs),
  ];

  if (missingPairs <= 0) {
    return {
      possible: true,
      tilesNeeded: 0,
      gapDescription: "All 7 pairs present. Hand satisfies Chiitoitsu.",
      visual,
    };
  }

  return {
    possible: true,
    tilesNeeded,
    gapDescription: `Has ${uniquePairs} pair${
      uniquePairs !== 1 ? "s" : ""
    }. Needs ${missingPairs} more pair${missingPairs !== 1 ? "s" : ""} (${tilesNeeded} tile${tilesNeeded !== 1 ? "s" : ""}).`,
    visual,
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

  const heldOrphanIds = KOKUSHI_TILES.filter(
    (id) => (countMap.get(id) ?? 0) >= 1
  );
  const missingOrphanIds = KOKUSHI_TILES.filter(
    (id) => (countMap.get(id) ?? 0) === 0
  );
  const hasDuplicate = KOKUSHI_TILES.some(
    (id) => (countMap.get(id) ?? 0) >= 2
  );
  const uniqueCount = heldOrphanIds.length;
  const missingOrphans = missingOrphanIds.length;

  const heldTiles = heldOrphanIds.map((id) => hand.find((t) => t.id === id)!);
  const missingSlots: VisualSlot[] = missingOrphanIds.map((id) => ({
    ref: { kind: "tile", tileId: id },
    satisfied: false,
  }));
  let visual = [...buildHeldSlots(heldTiles), ...missingSlots];

  if (missingOrphans === 0 && !hasDuplicate) {
    visual = [
      ...visual,
      { ref: { kind: "tile", tileId: heldOrphanIds[0] }, satisfied: false },
    ];
  }

  if (missingOrphans === 0 && hasDuplicate) {
    return {
      possible: true,
      tilesNeeded: 0,
      gapDescription: "Hand satisfies Kokushi Musou.",
      visual,
    };
  }

  if (missingOrphans === 0 && !hasDuplicate) {
    return {
      possible: true,
      tilesNeeded: 1,
      gapDescription:
        "Has all 13 terminals and honours. Needs 1 duplicate of any.",
      visual,
    };
  }

  const tilesNeeded = missingOrphans + (hasDuplicate ? 0 : 1);
  return {
    possible: true,
    tilesNeeded,
    gapDescription: `Has ${uniqueCount} of 13 terminals and honours.${
      !hasDuplicate ? " Also needs 1 duplicate." : ""
    }`,
    visual,
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
  const visual = buildTileSlots("dragon-white", count, 3);
  if (tilesNeeded === 0) {
    return { possible: true, tilesNeeded: 0, gapDescription: "Has White Dragon triplet.", visual };
  }
  return { possible: true, tilesNeeded, gapDescription: `Has ${count} of 3 White Dragon tiles.`, visual };
}

function checkYakuhaiGreen(
  hand: Tile[],
  _seatWind: string,
  _roundWind: string
): CheckResult {
  const count = hand.filter((t) => t.id === "dragon-green").length;
  const tilesNeeded = Math.max(0, 3 - count);
  const visual = buildTileSlots("dragon-green", count, 3);
  if (tilesNeeded === 0) {
    return { possible: true, tilesNeeded: 0, gapDescription: "Has Green Dragon triplet.", visual };
  }
  return { possible: true, tilesNeeded, gapDescription: `Has ${count} of 3 Green Dragon tiles.`, visual };
}

function checkYakuhaiRed(
  hand: Tile[],
  _seatWind: string,
  _roundWind: string
): CheckResult {
  const count = hand.filter((t) => t.id === "dragon-red").length;
  const tilesNeeded = Math.max(0, 3 - count);
  const visual = buildTileSlots("dragon-red", count, 3);
  if (tilesNeeded === 0) {
    return { possible: true, tilesNeeded: 0, gapDescription: "Has Red Dragon triplet.", visual };
  }
  return { possible: true, tilesNeeded, gapDescription: `Has ${count} of 3 Red Dragon tiles.`, visual };
}

function checkSeatWind(
  hand: Tile[],
  seatWind: string,
  _roundWind: string
): CheckResult {
  const tileId = `wind-${seatWind}`;
  const count = hand.filter((t) => t.id === tileId).length;
  const tilesNeeded = Math.max(0, 3 - count);
  const name = seatWind.charAt(0).toUpperCase() + seatWind.slice(1);
  const visual = buildTileSlots(tileId, count, 3);
  if (tilesNeeded === 0) {
    return { possible: true, tilesNeeded: 0, gapDescription: `Has ${name} (seat wind) triplet.`, visual };
  }
  return { possible: true, tilesNeeded, gapDescription: `Has ${count} of 3 ${name} seat wind tiles.`, visual };
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
  const visual = buildTileSlots(tileId, count, 3);
  if (tilesNeeded === 0) {
    return { possible: true, tilesNeeded: 0, gapDescription: `Has ${name} (round wind) triplet.`, visual };
  }
  return { possible: true, tilesNeeded, gapDescription: `Has ${count} of 3 ${name} round wind tiles.`, visual };
}

// ----------------------------------------------------------------
// Tile composition checkers
// ----------------------------------------------------------------

function checkHonitsu(
  hand: Tile[],
  _seatWind: string,
  _roundWind: string
): CheckResult {
  const honours = hand.filter((t) => isHonour(t));
  const suitedTiles = hand.filter((t) => !isHonour(t));

  if (suitedTiles.length === 0) {
    // Bug fix: an all-honour hand does NOT satisfy Honitsu. Honitsu
    // requires exactly one suit present alongside honours, an all-honour
    // hand belongs to Tsuuiisou instead. Since no suited tile exists yet
    // to determine which suit to aim for, "man" is used as a pragmatic
    // placeholder, the same kind of documented arbitrary choice already
    // used for Kokushi's final duplicate tile back in Session 10.
    const visual: VisualSlot[] = [
      ...buildHeldSlots(honours),
      { ref: { kind: "tile", tileId: "man-1" }, satisfied: false },
    ];
    return {
      possible: true,
      tilesNeeded: 1,
      gapDescription: "All tiles are honours. Honitsu needs at least one suited tile, suit not yet determined.",
      visual,
    };
  }

  const suitCounts = new Map<string, number>();
  for (const tile of suitedTiles) {
    suitCounts.set(tile.suit, (suitCounts.get(tile.suit) ?? 0) + 1);
  }

  if (suitCounts.size === 1) {
    const suit = [...suitCounts.keys()][0];
    const visual = buildHeldSlots([...honours, ...suitedTiles]);
    return { possible: true, tilesNeeded: 0, gapDescription: `All suited tiles are ${suit}. Hand satisfies Honitsu.`, visual };
  }

  let dominantSuit = "man";
  let maxCount = 0;
  for (const [suit, count] of suitCounts) {
    if (count > maxCount) { dominantSuit = suit; maxCount = count; }
  }

  const dominantTiles = suitedTiles.filter((t) => t.suit === dominantSuit);
  const offSuitTiles = suitedTiles.filter((t) => t.suit !== dominantSuit);
  const tilesNeeded = offSuitTiles.length;
  const visual = [
    ...buildHeldSlots([...honours, ...dominantTiles]),
    ...buildMissingSlots(offSuitTiles),
  ];
  return {
    possible: true,
    tilesNeeded,
    gapDescription: `Has tiles from ${suitCounts.size} suits. Replace ${tilesNeeded} off-suit tile${tilesNeeded !== 1 ? "s" : ""} with ${dominantSuit} tiles or honours.`,
    visual,
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

  const dominantTiles = hand.filter((t) => t.suit === dominantSuit);
  const offSuitTiles = hand.filter((t) => t.suit !== dominantSuit);
  const offSuit = offSuitTiles.length;
  const visual = [...buildHeldSlots(dominantTiles), ...buildMissingSlots(offSuitTiles)];

  if (offSuit === 0) {
    return { possible: true, tilesNeeded: 0, gapDescription: `All tiles are ${dominantSuit}. Hand satisfies Chinitsu.`, visual };
  }
  return {
    possible: true,
    tilesNeeded: offSuit,
    gapDescription: `Replace ${offSuit} tile${offSuit !== 1 ? "s" : ""} with ${dominantSuit} tiles.`,
    visual,
  };
}

function checkTsuuiisou(
  hand: Tile[],
  _seatWind: string,
  _roundWind: string
): CheckResult {
  const honours = hand.filter((t) => isHonour(t));
  const nonHonours = hand.filter((t) => !isHonour(t));
  const visual = [...buildHeldSlots(honours), ...buildMissingSlots(nonHonours)];

  if (nonHonours.length === 0) {
    return { possible: true, tilesNeeded: 0, gapDescription: "All tiles are honours. Hand satisfies Tsuuiisou.", visual };
  }
  return {
    possible: true,
    tilesNeeded: nonHonours.length,
    gapDescription: `Replace ${nonHonours.length} non-honour tile${nonHonours.length !== 1 ? "s" : ""} with winds or dragons.`,
    visual,
  };
}

function checkChinroutou(
  hand: Tile[],
  _seatWind: string,
  _roundWind: string
): CheckResult {
  const terminals = hand.filter((t) => isTerminal(t));
  const nonTerminals = hand.filter((t) => !isTerminal(t));
  const visual = [...buildHeldSlots(terminals), ...buildMissingSlots(nonTerminals)];

  if (nonTerminals.length === 0) {
    return { possible: true, tilesNeeded: 0, gapDescription: "All tiles are terminals. Hand satisfies Chinroutou.", visual };
  }
  return {
    possible: true,
    tilesNeeded: nonTerminals.length,
    gapDescription: `Replace ${nonTerminals.length} non-terminal tile${nonTerminals.length !== 1 ? "s" : ""} with 1s and 9s.`,
    visual,
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
  const validTiles = hand.filter((t) => RYUUIISOU_IDS.has(t.id));
  const invalidTiles = hand.filter((t) => !RYUUIISOU_IDS.has(t.id));
  const visual = [...buildHeldSlots(validTiles), ...buildMissingSlots(invalidTiles)];

  if (invalidTiles.length === 0) {
    return { possible: true, tilesNeeded: 0, gapDescription: "All tiles are in the green set. Hand satisfies Ryuuiisou.", visual };
  }
  return {
    possible: true,
    tilesNeeded: invalidTiles.length,
    gapDescription: `Replace ${invalidTiles.length} tile${invalidTiles.length !== 1 ? "s" : ""} with green tiles: sou 2, 3, 4, 6, 8, or Green Dragon.`,
    visual,
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
  const tripletIds = [...countMap.entries()].filter(([, c]) => c >= 3).map(([id]) => id);
  const triplets = tripletIds.length;

  const heldTripletTiles = tripletIds.flatMap((id) => {
    const tile = hand.find((t) => t.id === id)!;
    return [tile, tile, tile];
  });

  if (triplets >= 4) {
    const allSingleIds = [...countMap.entries()].filter(([, c]) => c === 1).map(([id]) => id);
    const singleTiles = allSingleIds.map((id) => hand.find((t) => t.id === id)!);
    const visual = [...buildHeldSlots(heldTripletTiles), ...buildMissingSlots(singleTiles)];
    return { possible: true, tilesNeeded: 0, gapDescription: "Four triplets present. Hand satisfies Toitoi.", visual };
  }

  const plan = buildTripletGroupPlan(hand, 4);
  const leftoverSingleTiles = plan.leftoverSingleIds.map((id) => hand.find((t) => t.id === id)!);
  const visual = [...plan.visual, ...buildMissingSlots(leftoverSingleTiles)];
  const leftover = plan.leftoverSingleIds.length;

  return {
    possible: true,
    tilesNeeded: plan.tilesNeeded,
    gapDescription: `Has ${triplets} of 4 triplets. ${leftover > 0 ? `${leftover} singleton${leftover !== 1 ? "s" : ""} need replacing.` : "Needs more triplets."}`,
    visual,
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
  const tripletIds = [...countMap.entries()].filter(([, c]) => c >= 3).map(([id]) => id);
  const triplets = tripletIds.length;

  if (triplets >= 4) {
    const heldTripletTiles = tripletIds.flatMap((id) => {
      const tile = hand.find((t) => t.id === id)!;
      return [tile, tile, tile];
    });
    return {
      possible: true,
      tilesNeeded: 0,
      gapDescription: "Four concealed triplets. Hand satisfies Suuankou.",
      visual: buildHeldSlots(heldTripletTiles),
    };
  }

  const plan = buildTripletGroupPlan(hand, 4);
  return {
    possible: true,
    tilesNeeded: plan.tilesNeeded,
    gapDescription: `Has ${triplets} of 4 concealed triplets.`,
    visual: plan.visual,
  };
}

function checkSanankou(
  hand: Tile[],
  _seatWind: string,
  _roundWind: string
): CheckResult {
  const countMap = buildCountMap(hand);
  const tripletIds = [...countMap.entries()].filter(([, c]) => c >= 3).map(([id]) => id);
  const triplets = tripletIds.length;

  if (triplets >= 3) {
    const heldTripletTiles = tripletIds.flatMap((id) => {
      const tile = hand.find((t) => t.id === id)!;
      return [tile, tile, tile];
    });
    return {
      possible: true,
      tilesNeeded: 0,
      gapDescription: `Has ${triplets} concealed triplets. Hand satisfies Sanankou.`,
      visual: buildHeldSlots(heldTripletTiles),
    };
  }

  const plan = buildTripletGroupPlan(hand, 3);
  return {
    possible: true,
    tilesNeeded: plan.tilesNeeded,
    gapDescription: `Has ${triplets} of 3 needed concealed triplets.`,
    visual: plan.visual,
  };
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
  const visual = dragonIds.flatMap((id) =>
    buildTileSlots(id, countMap.get(id) ?? 0, 3)
  );

  if (tilesNeeded === 0) {
    return { possible: true, tilesNeeded: 0, gapDescription: "Has all three dragon triplets. Hand satisfies Daisangen.", visual };
  }
  return {
    possible: true,
    tilesNeeded,
    gapDescription: `Has ${triplets} of 3 dragon triplets. Needs ${tilesNeeded} more dragon tile${tilesNeeded !== 1 ? "s" : ""}.`,
    visual,
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
  const visual = windIds.flatMap((id) =>
    buildTileSlots(id, countMap.get(id) ?? 0, 3)
  );

  if (tilesNeeded === 0) {
    return { possible: true, tilesNeeded: 0, gapDescription: "Has all four wind triplets. Hand satisfies Daisuushi.", visual };
  }
  return {
    possible: true,
    tilesNeeded,
    gapDescription: `Has ${triplets} of 4 wind triplets. Needs ${tilesNeeded} more wind tile${tilesNeeded !== 1 ? "s" : ""}.`,
    visual,
  };
}

function checkShousangen(
  hand: Tile[],
  _seatWind: string,
  _roundWind: string
): CheckResult {
  const countMap = buildCountMap(hand);
  const dragonIds = ["dragon-white", "dragon-green", "dragon-red"];
  const dragonEntries = dragonIds
    .map((id) => ({ id, count: countMap.get(id) ?? 0 }))
    .sort((a, b) => b.count - a.count);

  const targets = [3, 3, 2];
  const tilesNeeded = dragonEntries.reduce(
    (sum, entry, i) => sum + Math.max(0, targets[i] - entry.count), 0
  );
  const triplets = dragonEntries.filter((e) => e.count >= 3).length;
  const visual = dragonEntries.flatMap((entry, i) =>
    buildTileSlots(entry.id, entry.count, targets[i])
  );

  if (tilesNeeded === 0) {
    return { possible: true, tilesNeeded: 0, gapDescription: "Has two dragon triplets and one dragon pair. Hand satisfies Shousangen.", visual };
  }
  return {
    possible: true,
    tilesNeeded,
    gapDescription: `Has ${triplets} dragon triplet${triplets !== 1 ? "s" : ""}. Needs 2 triplets and 1 dragon pair.`,
    visual,
  };
}

function checkShousuushi(
  hand: Tile[],
  _seatWind: string,
  _roundWind: string
): CheckResult {
  const countMap = buildCountMap(hand);
  const windIds = ["wind-east", "wind-south", "wind-west", "wind-north"];
  const windEntries = windIds
    .map((id) => ({ id, count: countMap.get(id) ?? 0 }))
    .sort((a, b) => b.count - a.count);

  const targets = [3, 3, 3, 2];
  const tilesNeeded = windEntries.reduce(
    (sum, entry, i) => sum + Math.max(0, targets[i] - entry.count), 0
  );
  const triplets = windEntries.filter((e) => e.count >= 3).length;
  const visual = windEntries.flatMap((entry, i) =>
    buildTileSlots(entry.id, entry.count, targets[i])
  );

  if (tilesNeeded === 0) {
    return { possible: true, tilesNeeded: 0, gapDescription: "Has three wind triplets and one wind pair. Hand satisfies Shousuushi.", visual };
  }
  return {
    possible: true,
    tilesNeeded,
    gapDescription: `Has ${triplets} wind triplet${triplets !== 1 ? "s" : ""}. Needs 3 wind triplets and 1 wind pair.`,
    visual,
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

  const countsBySuit = { man: manCounts, pin: pinCounts, sou: souCounts };
  const visual = (["man", "pin", "sou"] as const).flatMap((suit) =>
    buildTileSlots(`${suit}-${bestValue}`, countsBySuit[suit][bestValue], 3)
  );

  if (bestTilesNeeded === 0) {
    return { possible: true, tilesNeeded: 0, gapDescription: `Has triplets of ${bestValue} in all three suits. Hand satisfies Sanshoku Doukou.`, visual };
  }
  return {
    possible: true,
    tilesNeeded: bestTilesNeeded,
    gapDescription: `Best candidate: value ${bestValue} triplet across suits. Needs ${bestTilesNeeded} more tile${bestTilesNeeded !== 1 ? "s" : ""}.`,
    visual,
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
  const honours = hand.filter((t) => isHonour(t));
  const nonHonours = hand.filter((t) => !isHonour(t));
  if (honours.length > 0) {
    const visual = [...buildHeldSlots(nonHonours), ...buildMissingSlots(honours)];
    return {
      possible: true,
      tilesNeeded: honours.length,
      gapDescription: `Has ${honours.length} honour tile${honours.length !== 1 ? "s" : ""}. Pinfu requires sequences only, so all honours must be replaced.`,
      visual,
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
    const visual = buildHeldSlots(hand);
    return {
      possible: true,
      tilesNeeded: 0,
      gapDescription: "No honours and a valid non-yakuhai pair exists. Hand may satisfy Pinfu.",
      visual,
    };
  }
  const visual = [...buildHeldSlots(hand), ...buildTemplateSlots("pair", 1)];
  return {
    possible: true,
    tilesNeeded: 1,
    gapDescription: "No valid non-yakuhai pair found. The pair cannot be a dragon or wind tile.",
    visual,
  };
}

function checkIipeikou(
  hand: Tile[],
  _seatWind: string,
  _roundWind: string
): CheckResult {
  const suits = ["man", "pin", "sou"] as const;

  for (const suit of suits) {
    const counts = getSuitCounts(hand, suit);
    for (let v = 1; v <= 7; v++) {
      if (counts[v] >= 2 && counts[v + 1] >= 2 && counts[v + 2] >= 2) {
        const visual = buildIipeikouVisual(hand, suit, v);
        return {
          possible: true,
          tilesNeeded: 0,
          gapDescription: `Has two ${suit} ${v}-${v + 1}-${v + 2} sequences. Hand satisfies Iipeikou.`,
          visual,
        };
      }
    }
  }

  let bestTilesNeeded = 6;
  let bestDesc = "No duplicate sequence found.";
  let bestSuit: "man" | "pin" | "sou" = "man";
  let bestV = 1;

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
        bestSuit = suit;
        bestV = v;
      }
    }
  }

  const visual = buildIipeikouVisual(hand, bestSuit, bestV);
  return { possible: true, tilesNeeded: bestTilesNeeded, gapDescription: bestDesc, visual };
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
      const visual = buildSanshokuDoujunVisual(hand, v);
      return {
        possible: true,
        tilesNeeded: 0,
        gapDescription: `Has ${v}-${v + 1}-${v + 2} sequence in all three suits. Hand satisfies Sanshoku Doujun.`,
        visual,
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

  const visual = buildSanshokuDoujunVisual(hand, bestV);
  return {
    possible: true,
    tilesNeeded: bestTilesNeeded,
    gapDescription: `Best candidate: ${bestV}-${bestV + 1}-${bestV + 2} across all suits. Needs ${bestTilesNeeded} more tile${bestTilesNeeded !== 1 ? "s" : ""}.`,
    visual,
  };
}

function checkIttsuu(
  hand: Tile[],
  _seatWind: string,
  _roundWind: string
): CheckResult {
  const suits = ["man", "pin", "sou"] as const;

  for (const suit of suits) {
    const counts = getSuitCounts(hand, suit);
    const allPresent = [1, 2, 3, 4, 5, 6, 7, 8, 9].every((v) => counts[v] >= 1);
    if (allPresent) {
      const visual = buildIttsuuVisual(hand, suit);
      return {
        possible: true,
        tilesNeeded: 0,
        gapDescription: `Has 1-2-3, 4-5-6, 7-8-9 in ${suit}. Hand satisfies Ittsuu.`,
        visual,
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

  const visual = buildIttsuuVisual(hand, bestSuit);
  return {
    possible: true,
    tilesNeeded: bestTilesNeeded,
    gapDescription: `Best suit: ${bestSuit}. Needs ${bestTilesNeeded} more tile${bestTilesNeeded !== 1 ? "s" : ""} for full 1-9 coverage.`,
    visual,
  };
}

function checkChuurenPoutou(
  hand: Tile[],
  _seatWind: string,
  _roundWind: string
): CheckResult {
  const honours = hand.filter((t) => isHonour(t));
  const nonHonours = hand.filter((t) => !isHonour(t));
  if (honours.length > 0) {
    const visual = [...buildHeldSlots(nonHonours), ...buildMissingSlots(honours)];
    return {
      possible: true,
      tilesNeeded: honours.length,
      gapDescription: `Has ${honours.length} honour tile${honours.length !== 1 ? "s" : ""}. Chuuren Poutou requires one suit only.`,
      visual,
    };
  }

  const suits = ["man", "pin", "sou"] as const;
  let bestSuit: "man" | "pin" | "sou" = "man";
  let maxCount = 0;
  for (const suit of suits) {
    const count = hand.filter((t) => t.suit === suit).length;
    if (count > maxCount) { bestSuit = suit; maxCount = count; }
  }

  const dominantTiles = hand.filter((t) => t.suit === bestSuit);
  const offSuitTiles = hand.filter((t) => t.suit !== bestSuit);
  const offSuit = offSuitTiles.length;
  if (offSuit > 0) {
    const visual = [...buildHeldSlots(dominantTiles), ...buildMissingSlots(offSuitTiles)];
    return {
      possible: true,
      tilesNeeded: offSuit,
      gapDescription: `Has tiles from multiple suits. Replace ${offSuit} tile${offSuit !== 1 ? "s" : ""} with ${bestSuit} tiles.`,
      visual,
    };
  }

  const counts = getSuitCounts(hand, bestSuit);
  const minRequired = [0, 3, 1, 1, 1, 1, 1, 1, 1, 3];
  const values = [1, 2, 3, 4, 5, 6, 7, 8, 9];
  const deficiency = values.reduce(
    (sum, v) => sum + Math.max(0, minRequired[v] - counts[v]), 0
  );
  const visual = values.flatMap((v) =>
    buildTileSlots(`${bestSuit}-${v}`, counts[v], minRequired[v])
  );

  if (deficiency === 0) {
    return {
      possible: true,
      tilesNeeded: 0,
      gapDescription: `All ${bestSuit} tiles match the 1-1-1-2-3-4-5-6-7-8-9-9-9 pattern. Hand satisfies Chuuren Poutou.`,
      visual,
    };
  }
  return {
    possible: true,
    tilesNeeded: deficiency,
    gapDescription: `Needs ${deficiency} more ${bestSuit} tile${deficiency !== 1 ? "s" : ""} to complete the Chuuren Poutou pattern.`,
    visual,
  };
}

// ----------------------------------------------------------------
// Checker map: one entry per hand id defined in hands.ts
// ----------------------------------------------------------------

export const HAND_CHECKERS: Record<string, CheckerFn> = {
  pinfu:             checkPinfu,
  tanyao:            checkTanyao,
  iipeikou:           checkIipeikou,
  "yakuhai-white":   checkYakuhaiWhite,
  "yakuhai-green":   checkYakuhaiGreen,
  "yakuhai-red":     checkYakuhaiRed,
  "seat-wind":       checkSeatWind,
  "round-wind":      checkRoundWind,
  chiitoitsu:        checkChiitoitsu,
  "sanshoku-doujun": checkSanshokuDoujun,
  ittsuu:             checkIttsuu,
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