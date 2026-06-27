import type { Tile } from "../../data/tiles";
import {
  buildCountMap,
  buildHeldSlots,
  buildTemplateSlots,
  computeChiitoitsuTileCost,
} from "../hand-checkers";
import type { ShantenSlot, ShantenGroup } from "./standard";

export type ChiitoitsuResult = {
  distance: number;
  decompositions: ShantenGroup[][];
};

export function calculateChiitoitsuShanten(hand: Tile[]): ChiitoitsuResult {
  const countMap = buildCountMap(hand);
  const pairTileIds = [...countMap.entries()].filter(([, c]) => c >= 2).map(([id]) => id);
  const uniquePairs = pairTileIds.length;
  const missingPairs = Math.max(0, 7 - uniquePairs);

  const distance = computeChiitoitsuTileCost(hand, missingPairs) - 1;

  const groups: ShantenGroup[] = [];
  for (const id of pairTileIds) {
    const tile = hand.find((t) => t.id === id)!;
    groups.push({ label: "Pair", slots: buildHeldSlots([tile, tile]) });
  }
  for (let i = 0; i < missingPairs; i++) {
    groups.push({ label: "Pair", slots: buildTemplateSlots("pair", 1) });
  }

  const usedCounts = new Map<string, number>();
  for (const id of pairTileIds) usedCounts.set(id, 2);

  const leftoverSlots: ShantenSlot[] = [];
  for (const [id, total] of countMap.entries()) {
    const remaining = total - (usedCounts.get(id) ?? 0);
    for (let i = 0; i < remaining; i++) {
      leftoverSlots.push({ ref: { kind: "tile", tileId: id }, satisfied: true, contributing: false });
    }
  }
  if (leftoverSlots.length > 0) groups.push({ label: "Unused", slots: leftoverSlots });

  return { distance, decompositions: [groups] };
}