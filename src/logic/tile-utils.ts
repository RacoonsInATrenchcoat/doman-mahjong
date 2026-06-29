import type { Tile } from "../data/tiles";

// ----------------------------------------------------------------
// Visual types
// ----------------------------------------------------------------

export type TemplateId =
  | "pair"
  | "triplet"
  | "straight"
  | "honour"
  | "non-honour"
  | "terminal"
  | "wildcard";

export type VisualTileRef =
  | { kind: "tile"; tileId: string }
  | { kind: "template"; template: TemplateId };

export type VisualSlot = {
  ref: VisualTileRef;
  satisfied: boolean;
};

export const TEMPLATE_IMAGES: Record<TemplateId, string> = {
  pair: "/templates/pair.png",
  triplet: "/templates/triplet.png",
  straight: "/templates/straight.png",
  honour: "/templates/honour.gif",
  "non-honour": "/templates/non-honour.gif",
  terminal: "/templates/terminal.gif",
  wildcard: "/templates/wildcard.png",
};

// ----------------------------------------------------------------
// Tile classification helpers
// ----------------------------------------------------------------

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

export function buildCountMap(hand: Tile[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const tile of hand) {
    map.set(tile.id, (map.get(tile.id) ?? 0) + 1);
  }
  return map;
}

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
// Visual helper functions
// ----------------------------------------------------------------

export function buildTileSlots(
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

export function buildHeldSlots(tiles: Tile[]): VisualSlot[] {
  return tiles.map((tile) => ({
    ref: { kind: "tile", tileId: tile.id },
    satisfied: true,
  }));
}

export function buildMissingSlots(tiles: Tile[]): VisualSlot[] {
  return tiles.map((tile) => ({
    ref: { kind: "tile", tileId: tile.id },
    satisfied: false,
  }));
}

export function buildTemplateSlots(
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

// ----------------------------------------------------------------
// Chiitoitsu cost helper, shared by checkChiitoitsu and shanten/chiitoitsu.ts
// ----------------------------------------------------------------

export function computeChiitoitsuTileCost(hand: Tile[], missingPairs: number): number {
  const countMap = buildCountMap(hand);
  const singles = [...countMap.values()].filter((c) => c === 1).length;

  const fromSingles = Math.min(missingPairs, singles);
  const fromScratch = missingPairs - fromSingles;
  return fromSingles * 1 + fromScratch * 2;
}

// ----------------------------------------------------------------
// Kokushi tile list, shared by checkKokushi and shanten/kokushi.ts
// ----------------------------------------------------------------

export const KOKUSHI_TILES = [
  "man-1", "man-9",
  "pin-1", "pin-9",
  "sou-1", "sou-9",
  "wind-east", "wind-south", "wind-west", "wind-north",
  "dragon-white", "dragon-green", "dragon-red",
];

export type WaitShape = "ryanmen" | "kanchan" | "penchan";

// Classifies a sequence taatsu's wait shape from its held values and the
// one specific missing value already known from the search (stored as
// missingTileId on the Group). Passing the missing value directly avoids
// the earlier, broken attempt at inferring it purely from sorted spread,
// which could not distinguish kanchan from ryanmen, since both produce
// the same 2-value spread once the missing tile is included.
//
// Kanchan: the missing value sits exactly between the two held values
// (held 4 and 6, missing 5).
// Penchan: the missing value sits at an outer edge, AND that edge is the
// true edge of the 1-to-9 range, meaning no tile exists on the other
// side at all (held 1 and 2, missing 3, since 0 does not exist; or held
// 8 and 9, missing 7, since 10 does not exist).
// Ryanmen: the missing value sits at an outer edge, but the run does not
// touch either true edge, so a tile genuinely exists on both possible
// sides (held 4 and 5, missing either 3 or 6, here representing the
// missing-6 case specifically).
export function classifySequenceWait(heldValues: number[], missingValue: number): WaitShape {
  const all = [...heldValues, missingValue].sort((a, b) => a - b);
  const missingIsMiddle = all[1] === missingValue;

  if (missingIsMiddle) return "kanchan";
  if (all[0] === 1 || all[2] === 9) return "penchan";
  return "ryanmen";
}

