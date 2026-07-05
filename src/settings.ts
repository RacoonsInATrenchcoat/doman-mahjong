// Shared settings types used across App.tsx, SettingsPanel, ResultsList,
// and CombinedYakuPanel. Defined here rather than in any one component so
// no component needs to import from another component to get this type.
// ADjust here for available options.

export type LanguageOption = "japanese" | "english";

export const LANGUAGE_OPTIONS: { value: LanguageOption; label: string }[] = [
  { value: "japanese", label: "Japanese (Romaji)" },
  { value: "english",  label: "English" },
];

export type TileSkinOption = "doman" | "standard";

export const TILE_SKIN_OPTIONS: { value: TileSkinOption; label: string }[] = [
  { value: "doman",    label: "Doman (Default)" },
  { value: "standard", label: "Standard" },
];

export const TILE_SKIN_EXTENSION: Record<TileSkinOption, string> = {
  doman:    "png",
  standard: "svg",
};

//Adjust here for the specific Tile size values!
export const TILE_HEIGHT_DEFAULT = 54;
//Min value on the slider
export const TILE_HEIGHT_MIN = 27;
//Max value on the slider
export const TILE_HEIGHT_MAX = 81;

// Deliberately designed as a named-option selector rather than a boolean,
// so future rule differences (beyond just yakuman doubling) can be added
// to this type without restructuring anything. Mirrors the same pattern
// used for LanguageOption and TileSkinOption.
export type ScoringRuleset = "doman" | "riichi";

export const SCORING_RULESET_OPTIONS: { value: ScoringRuleset; label: string }[] = [
  { value: "doman",  label: "Doman Mahjong" },
  { value: "riichi", label: "Riichi Mahjong" },
  ];