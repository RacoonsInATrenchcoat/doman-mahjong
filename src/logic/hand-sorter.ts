import type { Hand } from "../data/hands";
import type { CheckResult } from "./hand-checkers";

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