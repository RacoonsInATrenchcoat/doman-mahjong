import type { Tile } from "../../data/tiles";
import { buildCountMap, buildHeldSlots, KOKUSHI_TILES } from "../hand-checkers";
import type { ShantenSlot } from "./standard";

export type KokushiResult = {
  distance: number;
  decompositions: ShantenSlot[][];
};

export function calculateKokushiShanten(hand: Tile[]): KokushiResult {
  const countMap = buildCountMap(hand);

  const heldOrphanIds = KOKUSHI_TILES.filter((id) => (countMap.get(id) ?? 0) >= 1);
  const missingOrphanIds = KOKUSHI_TILES.filter((id) => (countMap.get(id) ?? 0) === 0);
  const duplicateId = KOKUSHI_TILES.find((id) => (countMap.get(id) ?? 0) >= 2) ?? null;
  const hasDuplicate = duplicateId !== null;

  const distance = missingOrphanIds.length - (hasDuplicate ? 1 : 0);

  const visual: ShantenSlot[] = [];

  for (const id of heldOrphanIds) {
    visual.push(...buildHeldSlots([hand.find((t) => t.id === id)!]));
  }
  for (const id of missingOrphanIds) {
    visual.push({ ref: { kind: "tile", tileId: id }, satisfied: false });
  }

  if (hasDuplicate) {
    visual.push(...buildHeldSlots([hand.find((t) => t.id === duplicateId)!]));
  } else {
    const fallbackId = heldOrphanIds[0] ?? "man-1";
    visual.push({ ref: { kind: "tile", tileId: fallbackId }, satisfied: false });
  }

  // Each held orphan type uses exactly 1 copy in the 13-slot checklist,
  // except the one designated duplicate type, which uses 2. Anything
  // beyond that, including a second, unrelated type also happening to be
  // held twice, is genuine leftover, the same accounting principle
  // already verified for Standard and Chiitoitsu.
  const usedCounts = new Map<string, number>();
  for (const id of heldOrphanIds) usedCounts.set(id, id === duplicateId ? 2 : 1);

  for (const [id, total] of countMap.entries()) {
    const remaining = total - (usedCounts.get(id) ?? 0);
    for (let i = 0; i < remaining; i++) {
      visual.push({ ref: { kind: "tile", tileId: id }, satisfied: true, contributing: false });
    }
  }

  return { distance, decompositions: [visual] };
}