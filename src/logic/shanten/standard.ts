import type { Tile } from "../../data/tiles";
import {
  buildCountMap,
  getSuitCounts,
  isHonour,
  buildHeldSlots,
  buildTemplateSlots,
} from "../hand-checkers";
import type { VisualSlot } from "../hand-checkers";

export type ShantenSlot = VisualSlot & { contributing?: boolean };

export type ShantenGroup = {
  label: string;
  slots: ShantenSlot[];
};

export type StandardResult = {
  distance: number;
  decompositions: ShantenGroup[][];
};

type Group = {
  kind: "set" | "taatsu" | "pair";
  tiles: Tile[];
  missingTileId?: string;
};

function find(hand: Tile[], id: string): Tile {
  return hand.find((t) => t.id === id)!;
}

// Unchanged from the previously verified version: tries a complete
// triplet, a complete sequence, a held pair, a two-sided or closed
// taatsu, or skipping the tile entirely, recursing through whichever
// choice scores best.
function searchSuit(hand: Tile[], suit: "man" | "pin" | "sou") {
  const counts = getSuitCounts(hand, suit);

  function recurse(counts: number[]): { score: number; groups: Group[] } {
    let i = 1;
    while (i <= 9 && counts[i] === 0) i++;
    if (i > 9) return { score: 0, groups: [] };

    let best = { score: -1, groups: [] as Group[] };

    function tryOption(use: number[], group: Group | null, cost: number) {
      const next = [...counts];
      for (const v of use) next[v]--;
      const rest = recurse(next);
      const score = rest.score + cost;
      if (score > best.score) {
        best = { score, groups: group ? [group, ...rest.groups] : rest.groups };
      }
    }

    if (counts[i] >= 3) {
      const t = find(hand, `${suit}-${i}`);
      tryOption([i, i, i], { kind: "set", tiles: [t, t, t] }, 2);
    }
    if (i <= 7 && counts[i + 1] > 0 && counts[i + 2] > 0) {
      tryOption(
        [i, i + 1, i + 2],
        { kind: "set", tiles: [find(hand, `${suit}-${i}`), find(hand, `${suit}-${i + 1}`), find(hand, `${suit}-${i + 2}`)] },
        2
      );
    }
    if (counts[i] >= 2) {
      const t = find(hand, `${suit}-${i}`);
      tryOption([i, i], { kind: "pair", tiles: [t, t], missingTileId: `${suit}-${i}` }, 1);
    }
    if (i <= 8 && counts[i + 1] > 0) {
      const missing = i - 1 >= 1 ? `${suit}-${i - 1}` : `${suit}-${i + 2}`;
      tryOption(
        [i, i + 1],
        { kind: "taatsu", tiles: [find(hand, `${suit}-${i}`), find(hand, `${suit}-${i + 1}`)], missingTileId: missing },
        1
      );
    }
    if (i <= 7 && counts[i + 2] > 0) {
      tryOption(
        [i, i + 2],
        { kind: "taatsu", tiles: [find(hand, `${suit}-${i}`), find(hand, `${suit}-${i + 2}`)], missingTileId: `${suit}-${i + 1}` },
        1
      );
    }
    tryOption([i], null, 0);

    return best;
  }

  return recurse(counts).groups;
}

function searchHonours(hand: Tile[]): Group[] {
  const honourTiles = hand.filter((t) => isHonour(t));
  const countMap = buildCountMap(honourTiles);
  const groups: Group[] = [];

  for (const [id, count] of countMap.entries()) {
    const tile = find(hand, id);
    if (count >= 3) {
      groups.push({ kind: "set", tiles: [tile, tile, tile] });
    } else if (count === 2) {
      groups.push({ kind: "pair", tiles: [tile, tile], missingTileId: id });
    }
  }

  return groups;
}

// New: orders a sequence-shaped taatsu's two held tiles and one missing
// tile by true numeric value, so a missing lower neighbour correctly
// shows before the held tiles rather than always trailing after them.
function buildSequenceSlots(heldTiles: Tile[], missingTileId: string): ShantenSlot[] {
  const missingValue = Number(missingTileId.split("-")[1]);
  const items = heldTiles.map((t) => ({
    value: t.value as number,
    slot: { ref: { kind: "tile" as const, tileId: t.id }, satisfied: true },
  }));
  items.push({
    value: missingValue,
    slot: { ref: { kind: "tile" as const, tileId: missingTileId }, satisfied: false },
  });
  items.sort((a, b) => a.value - b.value);
  return items.map((i) => i.slot);
}

function isTriplet(group: Group): boolean {
  return group.tiles[0].id === group.tiles[1].id;
}

// Unchanged accounting logic from the previously verified version.
function computeLeftover(hand: Tile[], usedGroups: Group[]): Map<string, number> {
  const handCounts = buildCountMap(hand);
  const usedCounts = new Map<string, number>();
  for (const g of usedGroups) {
    for (const t of g.tiles) {
      usedCounts.set(t.id, (usedCounts.get(t.id) ?? 0) + 1);
    }
  }

  const leftover = new Map<string, number>();
  for (const [id, total] of handCounts.entries()) {
    const remaining = total - (usedCounts.get(id) ?? 0);
    if (remaining > 0) leftover.set(id, remaining);
  }
  return leftover;
}

export function calculateStandardShanten(hand: Tile[]): StandardResult {
  const suits = ["man", "pin", "sou"] as const;
  const allGroups = [
    ...suits.flatMap((suit) => searchSuit(hand, suit)),
    ...searchHonours(hand),
  ];

  const sets = allGroups.filter((g) => g.kind === "set");
  const partials = allGroups.filter((g) => g.kind === "taatsu" || g.kind === "pair");
  const pairCandidates = allGroups.filter((g) => g.kind === "pair");

  function build(reservePair: boolean) {
    let pair: Group | null = null;
    const remainingPartials = [...partials];

    if (reservePair && pairCandidates.length > 0) {
      pair = pairCandidates[0];
      remainingPartials.splice(remainingPartials.indexOf(pair), 1);
    }

    const setSlotsAvailable = Math.max(0, 4 - sets.length);
    const usedTaatsu = remainingPartials.slice(0, setSlotsAvailable);

    const completeSets = sets.length;
    const taatsuCount = usedTaatsu.length;
    const hasPair = pair !== null;
    const distance = (4 - completeSets) * 2 - taatsuCount - (hasPair ? 1 : 0);

    const groups: ShantenGroup[] = [];

    for (const g of sets) {
      groups.push({
        label: isTriplet(g) ? "Triplet" : "Sequence",
        slots: buildHeldSlots(g.tiles),
      });
    }

    for (const g of usedTaatsu) {
      if (g.kind === "pair") {
        groups.push({
          label: "Triplet",
          slots: [
            ...buildHeldSlots(g.tiles),
            { ref: { kind: "tile", tileId: g.missingTileId! }, satisfied: false },
          ],
        });
      } else {
        groups.push({ label: "Sequence", slots: buildSequenceSlots(g.tiles, g.missingTileId!) });
      }
    }

    const emptySetSlots = Math.max(0, 4 - completeSets - taatsuCount);
    for (let i = 0; i < emptySetSlots; i++) {
      groups.push({ label: "Any", slots: buildTemplateSlots("triplet", 1) });
    }

    if (pair) {
      groups.push({ label: "Pair", slots: buildHeldSlots(pair.tiles) });
    } else {
      groups.push({ label: "Pair", slots: buildTemplateSlots("pair", 1) });
    }

    const usedGroups = [...sets, ...usedTaatsu, ...(pair ? [pair] : [])];
    const leftover = computeLeftover(hand, usedGroups);
    const leftoverSlots: ShantenSlot[] = [];
    for (const [id, count] of leftover.entries()) {
      for (let i = 0; i < count; i++) {
        leftoverSlots.push({ ref: { kind: "tile", tileId: id }, satisfied: true, contributing: false });
      }
    }
    if (leftoverSlots.length > 0) groups.push({ label: "Unused", slots: leftoverSlots });

    return { distance, groups };
  }

  const builds = pairCandidates.length > 0 ? [build(true), build(false)] : [build(true)];
  const bestDistance = Math.min(...builds.map((b) => b.distance));
  const tied = builds.filter((b) => b.distance === bestDistance);
  tied.sort((a, b) => {
    const missingA = a.groups.flatMap((g) => g.slots).filter((s) => !s.satisfied).length;
    const missingB = b.groups.flatMap((g) => g.slots).filter((s) => !s.satisfied).length;
    return missingA - missingB;
  });

  return { distance: bestDistance, decompositions: tied.map((b) => b.groups) };
}