// Shared settings types used across App.tsx, SettingsPanel, ResultsList,
// and CombinedYakuPanel. Defined here rather than in any one component so
// no component needs to import from another component to get this type.
// ADjust here for available options.

export type LanguageOption = "japanese" | "english";

export const LANGUAGE_OPTIONS: { value: LanguageOption; label: string }[] = [
  { value: "japanese", label: "Japanese (Romaji)" },
  { value: "english",  label: "English" },
];