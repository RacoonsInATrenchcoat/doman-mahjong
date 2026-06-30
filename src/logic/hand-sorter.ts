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
  sortMode: SortMode
): ResultEntry[] {
  const sorted = [...results];

  sorted.sort((a, b) => {
    // Completed (0-step) yaku always float to the top, regardless of
    // sort mode, per the agreed addendum: nothing is hidden, completed
    // entries are simply prioritised.
    const aComplete = a.result.tilesNeeded === 0 ? 0 : 1;
    const bComplete = b.result.tilesNeeded === 0 ? 0 : 1;
    if (aComplete !== bComplete) return aComplete - bComplete;

    return sortMode === "most-han"
      ? b.hand.hanValue - a.hand.hanValue
      : a.result.tilesNeeded - b.result.tilesNeeded;
  });

  return sorted;
}

export type CombinedYakuResult = {
  wholeHandYaku: { name: string; hanValue: number }[];
  structuralGroups: { name: string; hanValue: number; visual: VisualSlot[] }[];
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

  const wholeHandYaku: { name: string; hanValue: number }[] = [];
  const structuralGroups: { name: string; hanValue: number; visual: VisualSlot[] }[] = [];
  const claimedCounts = new Map<string, number>();

  for (const { hand, result } of complete) {
    if (WHOLE_HAND_YAKU_IDS.has(hand.id)) {
      wholeHandYaku.push({ name: hand.name, hanValue: hand.hanValue });
    } else {
      structuralGroups.push({ name: hand.name, hanValue: hand.hanValue, visual: result.visual });
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