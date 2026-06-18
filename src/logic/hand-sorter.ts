import type { Hand } from "../data/hands";
import type { CheckResult } from "./hand-checkers";

export type SortMode = "most-han" | "least-steps" | "least-han";

export type ResultEntry = {
  hand: Hand;
  result: CheckResult;
};

export function sortResults(
  results: ResultEntry[],
  sortMode: SortMode
): ResultEntry[] {
  const sorted = [...results];

  switch (sortMode) {
    case "most-han":
      sorted.sort((a, b) => b.hand.hanValue - a.hand.hanValue);
      break;

    case "least-steps":
      sorted.sort((a, b) => a.result.tilesNeeded - b.result.tilesNeeded);
      break;

    case "least-han":
      sorted.sort((a, b) => a.hand.hanValue - b.hand.hanValue);
      break;
  }

  return sorted;
}