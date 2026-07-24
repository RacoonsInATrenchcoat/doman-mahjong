import { useMemo } from "react";
import type { Tile } from "../data/tiles";
import { ALL_HANDS } from "../data/hands";
import { HAND_CHECKERS } from "../logic/hand-checkers";
import { sortResults, buildCombinedYakuResult } from "../logic/hand-sorter";
import type { SortMode, ResultEntry } from "../logic/hand-sorter";
import { calculateShanten } from "../logic/shanten";
import type { ShantenResult } from "../logic/shanten";

export type HandCalculations = {
  rawResults: ResultEntry[] | null;
  results: ReturnType<typeof sortResults> | null;
  combinedYaku: ReturnType<typeof buildCombinedYakuResult> | null;
  discardDistances: number[] | null;
  shanten: ShantenResult | null;
};

export function useHandCalculations(
  currentHand: Tile[],
  seatWind: string,
  roundWind: string,
  sortMode: SortMode
): HandCalculations {
  const rawResults = useMemo(() => {
    if (currentHand.length < 13) return null;
    return ALL_HANDS.map((hand) => {
      const checker = HAND_CHECKERS[hand.id];
      const result = checker(currentHand, seatWind, roundWind);
      return { hand, result };
    });
  }, [currentHand, seatWind, roundWind]);

  const results = useMemo(() => {
    if (rawResults === null) return null;
    return sortResults(rawResults, sortMode);
  }, [rawResults, sortMode]);

  const combinedYaku = useMemo(() => {
    if (rawResults === null) return null;
    return buildCombinedYakuResult(rawResults, currentHand);
  }, [rawResults, currentHand]);

  const shanten = useMemo(() => {
    if (currentHand.length < 13) return null;
    return calculateShanten(currentHand);
  }, [currentHand]);

  const discardDistances = useMemo(() => {
    if (currentHand.length !== 14) return null;
    return currentHand.map((_, index) => {
      const subHand = currentHand.filter((_, i) => i !== index);
      const { standard, chiitoitsu, kokushi } = calculateShanten(subHand);
      return Math.min(standard.distance, chiitoitsu.distance, kokushi.distance);
    });
  }, [currentHand]);

  return { rawResults, results, combinedYaku, discardDistances, shanten };
}