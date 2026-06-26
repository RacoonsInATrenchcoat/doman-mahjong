// Calculates shanten distance for the Standard shape: 4 sets plus 1 pair.
// This is the hardest of the three shapes, since the same 13 tiles can be
// grouped multiple different ways, and different groupings can yield
// different distances. The search below tries the reasonable groupings
// and keeps whichever is best, the same backtracking spirit as
// tryExtractSets in hand-checkers.ts, extended to also recognise partial
// groups (taatsu, one tile from a complete set), not only complete ones.
//
// This is a first pass, intended to be validated against hand-constructed
// test hands rather than assumed correct, the same way every other piece
// of tricky logic in this project has been handled. Two known, deliberate
// simplifications:
//   1. When a suit holds more than one pair-shaped group, only the first
//      is tracked as a possible "reserved pair" candidate, ties between
//      multiple equally good pairs are not separately explored.
//   2. The one tie this file does explicitly check is the case discussed
//      directly: a held pair can either be reserved as the hand's pair,
//      or spent instead as a taatsu toward a 4th triplet. Both are tried,
//      and whichever gives the better picture at the same distance wins.

import type { Tile } from "../../data/tiles";
import {
  buildCountMap,
  getSuitCounts,
  isHonour,
  buildHeldSlots,
  buildTemplateSlots,
} from "../hand-checkers";
import type { VisualSlot } from "../hand-checkers";

// A leftover tile is a real, physically held tile that did not match any
// set, taatsu, or pair in the chosen decomposition, contributing nothing
// toward the shape. contributing defaults to true via omission, so every
// existing held, missing, and template slot needs no change at all, only
// leftover tiles explicitly set this to false. Styling for this (the
// agreed dimmer border) is added once the real panel component exists,
// this just carries the information for now.
export type ShantenSlot = VisualSlot & { contributing?: boolean };

export type ShantenGroup = {
  label: string;
  slots: ShantenSlot[];
};

export type StandardResult = {
  distance: number;
  // One or more tied-best pictures. When several decompositions reach the
  // same minimal distance, the one with fewest missing slots is listed
  // first, per the agreed tie-break rule.
  decompositions: ShantenSlot[][];
};

type Group = {
  kind: "set" | "taatsu" | "pair";
  tiles: Tile[];
  // The specific tile id that would complete a taatsu or pair, when known.
  missingTileId?: string;
};

function find(hand: Tile[], id: string): Tile {
  return hand.find((t) => t.id === id)!;
}

// Searches one suit's value counts for the best combination of complete
// sets and taatsu. At the first remaining value, tries a complete triplet,
// a complete sequence, a held pair, a two-sided or closed taatsu, or
// skipping the tile entirely as an isolated single, recursing through
// whichever choice scores best. Score is 2 per complete set, 1 per taatsu
// or pair, matching how much each contributes to reducing distance.
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
      const id = `${suit}-${i}`;
      const t = find(hand, id);
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
      const id = `${suit}-${i}`;
      const t = find(hand, id);
      tryOption([i, i], { kind: "pair", tiles: [t, t], missingTileId: id }, 1);
    }
    if (i <= 8 && counts[i + 1] > 0) {
      // Ryanmen (two-sided wait). Either i-1 or i+2 would complete it, one
      // representative tile is shown, the same "show one example" approach
      // already used for Sanankou's tied pairs.
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

// Honours have no sequences, so this is simple counting: 3 or more of one
// honour is always a complete triplet (never worth splitting), exactly 2
// is a pair candidate, exactly 1 contributes nothing on its own.
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

// Tiles physically in hand that the chosen groups never touched. These
// are real and held, simply not contributing to the closest shape found.
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
    // True shanten, tenpai = 0, matching standard Mahjong convention and
    // the riichi wiki definition the original feedback referenced. This
    // is deliberately one lower than "tiles needed to win," which is a
    // separate, already-existing concept elsewhere in the app.
    const distance = (4 - completeSets) * 2 - taatsuCount - (hasPair ? 1 : 0);

    const visual: ShantenSlot[] = [];
    for (const g of sets) visual.push(...buildHeldSlots(g.tiles));
    for (const g of usedTaatsu) {
      visual.push(...buildHeldSlots(g.tiles));
      if (g.missingTileId) {
        visual.push({ ref: { kind: "tile", tileId: g.missingTileId }, satisfied: false });
      }
    }
    const emptySetSlots = Math.max(0, 4 - completeSets - taatsuCount);
    visual.push(...buildTemplateSlots("triplet", emptySetSlots));

if (pair) {
      visual.push(...buildHeldSlots(pair.tiles));
    } else {
      visual.push(...buildTemplateSlots("pair", 1));
    }

    // Account for every remaining physical tile the chosen groups never
    // touched, real and held, but not contributing to this shape.
    const usedGroups = [...sets, ...usedTaatsu, ...(pair ? [pair] : [])];
    const leftover = computeLeftover(hand, usedGroups);
    for (const [id, count] of leftover.entries()) {
      for (let i = 0; i < count; i++) {
        visual.push({ ref: { kind: "tile", tileId: id }, satisfied: true, contributing: false });
      }
    }

    return { distance, visual };
  }

  const builds = pairCandidates.length > 0 ? [build(true), build(false)] : [build(true)];
  const bestDistance = Math.min(...builds.map((b) => b.distance));
  const tied = builds.filter((b) => b.distance === bestDistance);
  tied.sort(
    (a, b) =>
      a.visual.filter((s) => !s.satisfied).length - b.visual.filter((s) => !s.satisfied).length
  );

  return {
    distance: bestDistance,
    decompositions: tied.map((b) => b.visual),
  };
}