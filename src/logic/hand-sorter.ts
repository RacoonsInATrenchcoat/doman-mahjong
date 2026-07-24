import type { Hand } from "../data/hands";
import type { Tile } from "../data/tiles";
import type { CheckResult, VisualSlot } from "./hand-checkers";

export type SortMode = "most-han" | "least-steps";

export type ResultEntry = {
  hand: Hand;
  result: CheckResult;
};

export function sortResults(
  results: ResultEntry[],
  // the _ here is forcing Typescript to not error it, as it is "intentionally present in the signature but not used in this implementation."
  _sortMode: SortMode
): ResultEntry[] {
  const sorted = [...results];

  // Both modes use steps as the primary sort key, so Kokushi at 13 han
  // and 13 steps never floats above a 1-han hand at 1 step. The mode
  // determines how ties within the same step count are broken:
  // least-steps breaks ties by han descending (most valuable option first
  // within the same distance), and most-han does the same, making both
  // modes produce an identical sort. The mode selector is kept for future
  // differentiation if the sort strategy is revisited.
  sorted.sort((a, b) => {
    if (a.result.tilesNeeded !== b.result.tilesNeeded) {
      return a.result.tilesNeeded - b.result.tilesNeeded;
    }
    return b.hand.hanValue - a.hand.hanValue;
  });

  return sorted;
}

export type CombinedYakuResult = {
  wholeHandYaku: { id: string; name: string; nameEng: string; hanValue: number; yakumanUnits: number; yakumanUnitsRiichi: number }[];
  structuralGroups: { id: string; name: string; nameEng: string; hanValue: number; yakumanUnits: number; yakumanUnitsRiichi: number; visual: VisualSlot[] }[];
  totalHan: number;
  inactiveTileIds: string[];
};

const WHOLE_HAND_YAKU_IDS = new Set([
  "tanyao", "honitsu", "chinitsu", "tsuuiisou",
  "chinroutou", "honroutou", "ryuuiisou", "chanta", "junchan",
]);

export function buildCombinedYakuResult(
  results: ResultEntry[],
  currentHand: Tile[]
): CombinedYakuResult {
  const complete = results.filter((r) => r.result.tilesNeeded === 0);

const wholeHandYaku: { id: string; name: string; nameEng: string; hanValue: number; yakumanUnits: number; yakumanUnitsRiichi: number }[] = [];
  const structuralGroups: { id: string; name: string; nameEng: string; hanValue: number; yakumanUnits: number; yakumanUnitsRiichi: number; visual: VisualSlot[] }[] = [];
  const claimedCounts = new Map<string, number>();

  for (const { hand, result } of complete) {
    if (WHOLE_HAND_YAKU_IDS.has(hand.id)) {
      wholeHandYaku.push({ id: hand.id, name: hand.name, nameEng: hand.nameEng, hanValue: hand.hanValue, yakumanUnits: hand.yakumanUnits, yakumanUnitsRiichi: hand.yakumanUnitsRiichi });
    } else {
      structuralGroups.push({ id: hand.id, name: hand.name, nameEng: hand.nameEng, hanValue: hand.hanValue, yakumanUnits: hand.yakumanUnits, yakumanUnitsRiichi: hand.yakumanUnitsRiichi, visual: result.visual });
    }
    for (const slot of result.visual) {
      if (slot.satisfied && slot.ref.kind === "tile") {
        claimedCounts.set(slot.ref.tileId, (claimedCounts.get(slot.ref.tileId) ?? 0) + 1);
      }
    }
  }

  const totalHan = complete.reduce((sum, r) => sum + r.hand.hanValue, 0);

  // Walks the real hand once, decrementing a running claim count per tile
  // id, so a 4th physical copy correctly shows inactive even when the
  // other 3 are genuinely claimed by a complete triplet-based yaku.
  const remainingClaims = new Map(claimedCounts);
  const inactiveTileIds: string[] = [];
  for (const tile of currentHand) {
    const remaining = remainingClaims.get(tile.id) ?? 0;
    if (remaining > 0) {
      remainingClaims.set(tile.id, remaining - 1);
    } else {
      inactiveTileIds.push(tile.id);
    }
  }

  return { wholeHandYaku, structuralGroups, totalHan, inactiveTileIds };
}