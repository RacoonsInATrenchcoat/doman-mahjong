export type Tile = {
  id: string;
  suit: "man" | "pin" | "sou" | "wind" | "dragon";
  value: number | string;
};

/*
Meaning:

Export: means other files in the project can import this type and use it. Elevates to "project" level access
Suit: is a union type, meaning it only accepts exactly those five string values. TypeScript will throw an error if anything else is used.
Value: Defines that it only accepts either a number (1 through 9 for suited tiles) or a string (such as "east" or "chun" for honour tiles) value. Error otherwise.
ImagePath: uses camelCase here, industry standard?
*/

export const ALL_TILES: Tile[] = [
  // Man (Characters) 1-9
  { id: "man-1", suit: "man", value: 1},
  { id: "man-2", suit: "man", value: 2},
  { id: "man-3", suit: "man", value: 3},
  { id: "man-4", suit: "man", value: 4},
  { id: "man-5", suit: "man", value: 5},
  { id: "man-6", suit: "man", value: 6},
  { id: "man-7", suit: "man", value: 7},
  { id: "man-8", suit: "man", value: 8},
  { id: "man-9", suit: "man", value: 9},

  // Pin (Circles) 1-9
  { id: "pin-1", suit: "pin", value: 1},
  { id: "pin-2", suit: "pin", value: 2},
  { id: "pin-3", suit: "pin", value: 3},
  { id: "pin-4", suit: "pin", value: 4},
  { id: "pin-5", suit: "pin", value: 5},
  { id: "pin-6", suit: "pin", value: 6},
  { id: "pin-7", suit: "pin", value: 7},
  { id: "pin-8", suit: "pin", value: 8},
  { id: "pin-9", suit: "pin", value: 9},

  // Sou (Bamboo) 1-9
  { id: "sou-1", suit: "sou", value: 1},
  { id: "sou-2", suit: "sou", value: 2},
  { id: "sou-3", suit: "sou", value: 3},
  { id: "sou-4", suit: "sou", value: 4},
  { id: "sou-5", suit: "sou", value: 5},
  { id: "sou-6", suit: "sou", value: 6},
  { id: "sou-7", suit: "sou", value: 7},
  { id: "sou-8", suit: "sou", value: 8},
  { id: "sou-9", suit: "sou", value: 9},

  // Winds 1-4
  { id: "wind-east",  suit: "wind", value: "east"},
  { id: "wind-south", suit: "wind", value: "south"},
  { id: "wind-west",  suit: "wind", value: "west"},
  { id: "wind-north", suit: "wind", value: "north"},

  // Dragons 1-3
  { id: "dragon-white", suit: "dragon", value: "white"},
  { id: "dragon-green", suit: "dragon", value: "green"},
  { id: "dragon-red",   suit: "dragon", value: "red"},
];

import type { TileSkinOption } from "../settings";
import { TILE_SKIN_EXTENSION } from "../settings";

export function getTileImagePath(tileId: string, skin: TileSkinOption): string {
  const ext = TILE_SKIN_EXTENSION[skin];
  return `/tiles/${skin}/${tileId}.${ext}`;
}