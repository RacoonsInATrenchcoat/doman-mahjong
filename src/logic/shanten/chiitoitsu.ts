// Calculates shanten distance for the Chiitoitsu shape: 7 distinct pairs.
// Reuses computeChiitoitsuTileCost, already tested extensively for the
// Chiitoitsu yaku checker itself (Session 11), then converts from "tiles
// needed to win" to true shanten by subtracting 1, the same convention
// settled on for the Standard shape.
//
// Unlike Standard, this shape never produces multiple tied decompositions.
// Every missing pair is shown as the same generic template regardless of
// which specific single tile might cheaply extend into it, consistent
// with the original Chiitoitsu design decision (Session 10) to never
// resolve missing pairs to a specific tile, to avoid combinatorial
// overcalculation. Since there is nothing to choose between, there is
// nothing to tie.

import type { Tile } from "../../data/tiles";
import {
  buildCountMap,
  buildHeldSlots,
  buildTemplateSlots,
  computeChiitoitsuTileCost,
} from "../hand-checkers";
import type { ShantenSlot } from "./standard";

export type ChiitoitsuResult = {
  distance: number;
  decompositions: ShantenSlot[][];
};

export function calculateChiitoitsuShanten(hand: Tile[]): ChiitoitsuResult {
  const countMap = buildCountMap(hand);
  const pairTileIds = [...countMap.entries()]
    .filter(([, c]) => c >= 2)
    .map(([id]) => id);
  const uniquePairs = pairTileIds.length;
  const missingPairs = Math.max(0, 7 - uniquePairs);

  const tilesNeededToWin = computeChiitoitsuTileCost(hand, missingPairs);
  const distance = tilesNeededToWin - 1;

  const heldPairTiles = pairTileIds.flatMap((id) => {
    const tile = hand.find((t) => t.id === id)!;
    return [tile, tile];
  });

  // A pair tile id only ever uses 2 of its copies here, exactly like a
  // real triplet only ever uses 3 in the Standard shape. Anything beyond
  // that, including the 2 spare tiles in a held quad, is genuinely
  // leftover, the same accounting principle just verified for Standard,
  // applied here for the first time.
  const usedCounts = new Map<string, number>();
  for (const id of pairTileIds) usedCounts.set(id, 2);

  const leftoverSlots: ShantenSlot[] = [];
  for (const [id, total] of countMap.entries()) {
    const remaining = total - (usedCounts.get(id) ?? 0);
    for (let i = 0; i < remaining; i++) {
      leftoverSlots.push({
        ref: { kind: "tile", tileId: id },
        satisfied: true,
        contributing: false,
      });
    }
  }

  const visual: ShantenSlot[] = [
    ...buildHeldSlots(heldPairTiles),
    ...buildTemplateSlots("pair", missingPairs),
    ...leftoverSlots,
  ];

  return { distance, decompositions: [visual] };
}