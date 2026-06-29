import type { Tile } from "../../data/tiles";
import { buildCountMap, buildHeldSlots, buildTemplateSlots, KOKUSHI_TILES } from "../tile-utils";
import type { ShantenSlot, ShantenGroup } from "./standard";

export type KokushiResult = {
  distance: number;
  decompositions: ShantenGroup[][];
};

export function calculateKokushiShanten(hand: Tile[]): KokushiResult {
  const countMap = buildCountMap(hand);

  const heldOrphanIds = KOKUSHI_TILES.filter((id) => (countMap.get(id) ?? 0) >= 1);
  const missingOrphanIds = KOKUSHI_TILES.filter((id) => (countMap.get(id) ?? 0) === 0);
  const duplicateId = KOKUSHI_TILES.find((id) => (countMap.get(id) ?? 0) >= 2) ?? null;
  const hasDuplicate = duplicateId !== null;

  const distance = missingOrphanIds.length - (hasDuplicate ? 1 : 0);

  const orphanSlots: ShantenSlot[] = [];
  for (const id of heldOrphanIds) orphanSlots.push(...buildHeldSlots([hand.find((t) => t.id === id)!]));
  for (const id of missingOrphanIds) orphanSlots.push({ ref: { kind: "tile", tileId: id }, satisfied: false });

  const duplicateSlots: ShantenSlot[] = [];
  if (hasDuplicate) {
    duplicateSlots.push(...buildHeldSlots([hand.find((t) => t.id === duplicateId)!]));
  } else {
    // No real duplicate exists yet, and any one of the currently held
    // orphans (or, if none are held, any of the 13 types) would equally
    // satisfy this slot. Rather than arbitrarily pointing at one specific
    // tile, this uses the wildcard template, the same convention already
    // established for Chiitoitsu and Toitoi's unresolved groups, to mean
    // "any tile from a known set," not one specific tile.
    duplicateSlots.push(...buildTemplateSlots("wildcard", 1));
  }

  const usedCounts = new Map<string, number>();
  for (const id of heldOrphanIds) usedCounts.set(id, id === duplicateId ? 2 : 1);

  const leftoverSlots: ShantenSlot[] = [];
  for (const [id, total] of countMap.entries()) {
    const remaining = total - (usedCounts.get(id) ?? 0);
    for (let i = 0; i < remaining; i++) {
      leftoverSlots.push({ ref: { kind: "tile", tileId: id }, satisfied: true, contributing: false });
    }
  }

  const groups: ShantenGroup[] = [
    { label: "Orphans", slots: orphanSlots },
    { label: "Any", slots: duplicateSlots },
  ];
  if (leftoverSlots.length > 0) groups.push({ label: "Unused", slots: leftoverSlots });

  return { distance, decompositions: [groups] };
}