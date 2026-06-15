export type Tile = {
  id: string;
  suit: "man" | "pin" | "sou" | "wind" | "dragon";
  value: number | string;
  imagePath: string;
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
  { id: "man-1", suit: "man", value: 1, imagePath: "/tiles/man-1.png" },
  { id: "man-2", suit: "man", value: 2, imagePath: "/tiles/man-2.png" },
  { id: "man-3", suit: "man", value: 3, imagePath: "/tiles/man-3.png" },
  { id: "man-4", suit: "man", value: 4, imagePath: "/tiles/man-4.png" },
  { id: "man-5", suit: "man", value: 5, imagePath: "/tiles/man-5.png" },
  { id: "man-6", suit: "man", value: 6, imagePath: "/tiles/man-6.png" },
  { id: "man-7", suit: "man", value: 7, imagePath: "/tiles/man-7.png" },
  { id: "man-8", suit: "man", value: 8, imagePath: "/tiles/man-8.png" },
  { id: "man-9", suit: "man", value: 9, imagePath: "/tiles/man-9.png" },

  // Pin (Circles) 1-9
  { id: "pin-1", suit: "pin", value: 1, imagePath: "/tiles/pin-1.png" },
  { id: "pin-2", suit: "pin", value: 2, imagePath: "/tiles/pin-2.png" },
  { id: "pin-3", suit: "pin", value: 3, imagePath: "/tiles/pin-3.png" },
  { id: "pin-4", suit: "pin", value: 4, imagePath: "/tiles/pin-4.png" },
  { id: "pin-5", suit: "pin", value: 5, imagePath: "/tiles/pin-5.png" },
  { id: "pin-6", suit: "pin", value: 6, imagePath: "/tiles/pin-6.png" },
  { id: "pin-7", suit: "pin", value: 7, imagePath: "/tiles/pin-7.png" },
  { id: "pin-8", suit: "pin", value: 8, imagePath: "/tiles/pin-8.png" },
  { id: "pin-9", suit: "pin", value: 9, imagePath: "/tiles/pin-9.png" },

  // Sou (Bamboo) 1-9
  { id: "sou-1", suit: "sou", value: 1, imagePath: "/tiles/sou-1.png" },
  { id: "sou-2", suit: "sou", value: 2, imagePath: "/tiles/sou-2.png" },
  { id: "sou-3", suit: "sou", value: 3, imagePath: "/tiles/sou-3.png" },
  { id: "sou-4", suit: "sou", value: 4, imagePath: "/tiles/sou-4.png" },
  { id: "sou-5", suit: "sou", value: 5, imagePath: "/tiles/sou-5.png" },
  { id: "sou-6", suit: "sou", value: 6, imagePath: "/tiles/sou-6.png" },
  { id: "sou-7", suit: "sou", value: 7, imagePath: "/tiles/sou-7.png" },
  { id: "sou-8", suit: "sou", value: 8, imagePath: "/tiles/sou-8.png" },
  { id: "sou-9", suit: "sou", value: 9, imagePath: "/tiles/sou-9.png" },

  // Winds 1-4
  { id: "wind-east",  suit: "wind", value: "east",  imagePath: "/tiles/wind-east.png" },
  { id: "wind-south", suit: "wind", value: "south", imagePath: "/tiles/wind-south.png" },
  { id: "wind-west",  suit: "wind", value: "west",  imagePath: "/tiles/wind-west.png" },
  { id: "wind-north", suit: "wind", value: "north", imagePath: "/tiles/wind-north.png" },

  // Dragons 1-3
  { id: "dragon-white", suit: "dragon", value: "white", imagePath: "/tiles/dragon-white.png" },
  { id: "dragon-green", suit: "dragon", value: "green", imagePath: "/tiles/dragon-green.png" },
  { id: "dragon-red",   suit: "dragon", value: "red",   imagePath: "/tiles/dragon-red.png" },
];