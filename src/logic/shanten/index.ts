import type { Tile } from "../../data/tiles";
import { calculateStandardShanten } from "./standard";
import { calculateChiitoitsuShanten } from "./chiitoitsu";
import { calculateKokushiShanten } from "./kokushi";
import type { ShantenSlot } from "./standard";

export type { ShantenSlot } from "./standard";

export type ShapeName = "standard" | "chiitoitsu" | "kokushi";

export type ShapeResult = {
  shape: ShapeName;
  distance: number;
  decompositions: ShantenSlot[][];
};

export type ShantenResult = {
  standard: ShapeResult;
  chiitoitsu: ShapeResult;
  kokushi: ShapeResult;
  // The shape to show by default: lowest distance wins, ties broken by
  // priority order Standard, then Chiitoitsu, then Kokushi, matching the
  // real-world frequency of each shape, as agreed during the panel's
  // design discussion.
  defaultShape: ShapeName;
};

export function calculateShanten(hand: Tile[]): ShantenResult {
  const standard: ShapeResult = { shape: "standard", ...calculateStandardShanten(hand) };
  const chiitoitsu: ShapeResult = { shape: "chiitoitsu", ...calculateChiitoitsuShanten(hand) };
  const kokushi: ShapeResult = { shape: "kokushi", ...calculateKokushiShanten(hand) };

  const priority: ShapeResult[] = [standard, chiitoitsu, kokushi];
  const lowest = Math.min(...priority.map((s) => s.distance));
  const defaultShape = priority.find((s) => s.distance === lowest)!.shape;

  return { standard, chiitoitsu, kokushi, defaultShape };
}