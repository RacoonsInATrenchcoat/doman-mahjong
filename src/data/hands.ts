export type Hand = {
  id: string;
  name: string;
  nameEng: string;
  hanValue: number;
  description: string;
  // How many yakuman units this hand counts as under each ruleset.
  // 0 for all regular yaku, 1 for standard yakuman, 2 for double yakuman
  // under Riichi rules only. Doman Mahjong treats all yakuman as equal.
  yakumanUnits: number;
  yakumanUnitsRiichi: number;
};

export const ALL_HANDS: Hand[] = [

  // 1 Han
  { id: "pinfu",          name: "Pinfu",                  nameEng: "No Fu / All Sequences",              hanValue: 1,  yakumanUnits: 0, yakumanUnitsRiichi: 0, description: "Four sequences and a non-yakuhai pair." },
  { id: "tanyao",         name: "Tanyao",                 nameEng: "All Simples",                hanValue: 1,  yakumanUnits: 0, yakumanUnitsRiichi: 0, description: "All tiles are simples. No terminals or honours." },
  { id: "iipeikou",       name: "Iipeikou",               nameEng: "Pure Double Chi",            hanValue: 1,  yakumanUnits: 0, yakumanUnitsRiichi: 0, description: "Two identical sequences in the same suit." },
  { id: "yakuhai-white",  name: "Yakuhai (White Dragon)", nameEng: "Dragon Tile (White)",        hanValue: 1,  yakumanUnits: 0, yakumanUnitsRiichi: 0, description: "A triplet of White Dragon tiles." },
  { id: "yakuhai-green",  name: "Yakuhai (Green Dragon)", nameEng: "Dragon Tile (Green)",        hanValue: 1,  yakumanUnits: 0, yakumanUnitsRiichi: 0, description: "A triplet of Green Dragon tiles." },
  { id: "yakuhai-red",    name: "Yakuhai (Red Dragon)",   nameEng: "Dragon Tile (Red)",          hanValue: 1,  yakumanUnits: 0, yakumanUnitsRiichi: 0, description: "A triplet of Red Dragon tiles." },
  { id: "seat-wind",      name: "Seat Wind",              nameEng: "Seat Wind",                  hanValue: 1,  yakumanUnits: 0, yakumanUnitsRiichi: 0, description: "A triplet of your current seat wind tile." },
  { id: "round-wind",     name: "Round Wind",             nameEng: "Round Wind",                 hanValue: 1,  yakumanUnits: 0, yakumanUnitsRiichi: 0, description: "A triplet of the current round wind tile." },
  { id: "menzen-tsumo",   name: "Menzen Tsumo",           nameEng: "Fully Concealed Hand",       hanValue: 1,  yakumanUnits: 0, yakumanUnitsRiichi: 0, description: "Win by self-draw with a closed hand. Only detectable at 14 tiles." },

  // 2 Han
  { id: "chiitoitsu",       name: "Chiitoitsu",         nameEng: "Seven Pairs",                  hanValue: 2,  yakumanUnits: 0, yakumanUnitsRiichi: 0, description: "Seven different pairs." },
  { id: "sanshoku-doujun",  name: "Sanshoku Doujun",    nameEng: "Mixed Triple Chi",             hanValue: 2,  yakumanUnits: 0, yakumanUnitsRiichi: 0, description: "The same sequence in all three suits." },
  { id: "ittsuu",           name: "Ittsuu",             nameEng: "Pure Straight",                hanValue: 2,  yakumanUnits: 0, yakumanUnitsRiichi: 0, description: "Sequences of 1-2-3, 4-5-6, and 7-8-9 in the same suit." },
  { id: "toitoi",           name: "Toitoi",             nameEng: "All Triplets",                 hanValue: 2,  yakumanUnits: 0, yakumanUnitsRiichi: 0, description: "All four sets are triplets." },
  { id: "sanankou",         name: "Sanankou",           nameEng: "Three Concealed Triplets",     hanValue: 2,  yakumanUnits: 0, yakumanUnitsRiichi: 0, description: "Three concealed triplets." },
  { id: "sanshoku-doukou",  name: "Sanshoku Doukou",    nameEng: "Triple Triplets",              hanValue: 2,  yakumanUnits: 0, yakumanUnitsRiichi: 0, description: "The same triplet in all three suits." },
  { id: "shousangen",       name: "Shousangen",         nameEng: "Little Three Dragons",         hanValue: 2,  yakumanUnits: 0, yakumanUnitsRiichi: 0, description: "Triplets of two dragons and a pair of the third." },
  { id: "ryanpeikou",       name: "Ryanpeikou",         nameEng: "Twice Pure Double Chi",        hanValue: 3,  yakumanUnits: 0, yakumanUnitsRiichi: 0, description: "Two separate pairs of identical sequences." },

  // 3 Han
  { id: "honitsu", name: "Honitsu", nameEng: "Half Flush",            hanValue: 3, yakumanUnits: 0, yakumanUnitsRiichi: 0, description: "One suit only, plus any honours." },
  { id: "chanta",  name: "Chanta",  nameEng: "Outside Hand",          hanValue: 2, yakumanUnits: 0, yakumanUnitsRiichi: 0, description: "Every set and the pair contains a terminal or honour tile." },
  { id: "junchan", name: "Junchan", nameEng: "Terminals in All Groups", hanValue: 3, yakumanUnits: 0, yakumanUnitsRiichi: 0, description: "Every set and the pair contains a terminal tile. No honours allowed." },

  // 6 Han
  { id: "chinitsu", name: "Chinitsu", nameEng: "Full Flush", hanValue: 6, yakumanUnits: 0, yakumanUnitsRiichi: 0, description: "One suit only, no honours at all." },

  // Yakuman (represented as 13 Han internally)
  { id: "kokushi",        name: "Kokushi Musou",  nameEng: "Thirteen Orphans",           hanValue: 13, yakumanUnits: 1, yakumanUnitsRiichi: 1, description: "One of each terminal and honour tile, plus one duplicate." },
  { id: "suuankou",       name: "Suuankou",       nameEng: "Four Concealed Triplets",    hanValue: 13, yakumanUnits: 1, yakumanUnitsRiichi: 1, description: "Four concealed triplets." },
  { id: "daisangen",      name: "Daisangen",      nameEng: "Big Three Dragons",          hanValue: 13, yakumanUnits: 1, yakumanUnitsRiichi: 1, description: "Triplets of all three dragon tiles." },
  { id: "shousuushi",     name: "Shousuushi",     nameEng: "Little Four Winds",          hanValue: 13, yakumanUnits: 1, yakumanUnitsRiichi: 1, description: "Triplets of three winds and a pair of the fourth." },
  { id: "daisuushi",      name: "Daisuushi",      nameEng: "Big Four Winds",             hanValue: 13, yakumanUnits: 1, yakumanUnitsRiichi: 2, description: "Triplets of all four wind tiles." },
  { id: "tsuuiisou",      name: "Tsuuiisou",      nameEng: "All Honors",                 hanValue: 13, yakumanUnits: 1, yakumanUnitsRiichi: 1, description: "All tiles are honours. No suited tiles at all." },
  { id: "chinroutou",     name: "Chinroutou",     nameEng: "All Terminals",              hanValue: 13, yakumanUnits: 1, yakumanUnitsRiichi: 1, description: "All tiles are terminals. 1s and 9s only." },
  { id: "honroutou",      name: "Honroutou",      nameEng: "All Terminals and Honors",   hanValue: 2,  yakumanUnits: 0, yakumanUnitsRiichi: 0, description: "All tiles are terminals and honours, no simples." },
  { id: "ryuuiisou",      name: "Ryuuiisou",      nameEng: "All Green",                  hanValue: 13, yakumanUnits: 1, yakumanUnitsRiichi: 1, description: "All tiles are from the set: 2, 3, 4, 6, 8 of Sou and Green Dragon." },
  { id: "chuuren-poutou", name: "Chuuren Poutou", nameEng: "Nine Gates",                 hanValue: 13, yakumanUnits: 1, yakumanUnitsRiichi: 1, description: "1-1-1-2-3-4-5-6-7-8-9-9-9 in one suit, plus one duplicate." },

];