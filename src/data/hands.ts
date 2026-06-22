export type Hand = {
  id: string;
  name: string;
  hanValue: number;
  description: string;
};

export const ALL_HANDS: Hand[] = [

  // 1 Han
  { id: "pinfu",          name: "Pinfu",                  hanValue: 1,  description: "Four sequences and a non-yakuhai pair." },
  { id: "tanyao",         name: "Tanyao",                 hanValue: 1,  description: "All tiles are simples. No terminals or honours." },
  { id: "iipeikou",        name: "Iipeikou",                hanValue: 1,  description: "Two identical sequences in the same suit." },
  { id: "yakuhai-white",  name: "Yakuhai (White Dragon)", hanValue: 1,  description: "A triplet of White Dragon tiles." },
  { id: "yakuhai-green",  name: "Yakuhai (Green Dragon)", hanValue: 1,  description: "A triplet of Green Dragon tiles." },
  { id: "yakuhai-red",    name: "Yakuhai (Red Dragon)",   hanValue: 1,  description: "A triplet of Red Dragon tiles." },
  { id: "seat-wind",      name: "Seat Wind",              hanValue: 1,  description: "A triplet of your current seat wind tile." },
  { id: "round-wind",     name: "Round Wind",             hanValue: 1,  description: "A triplet of the current round wind tile." },

  // 2 Han
  { id: "chiitoitsu",       name: "Chiitoitsu",         hanValue: 2,  description: "Seven different pairs." },
  { id: "sanshoku-doujun",  name: "Sanshoku Doujun",    hanValue: 2,  description: "The same sequence in all three suits." },
  { id: "ittsuu",            name: "Ittsuu",              hanValue: 2,  description: "Sequences of 1-2-3, 4-5-6, and 7-8-9 in the same suit." },
  { id: "toitoi",           name: "Toitoi",             hanValue: 2,  description: "All four sets are triplets." },
  { id: "sanankou",         name: "Sanankou",           hanValue: 2,  description: "Three concealed triplets." },
  { id: "sanshoku-doukou",  name: "Sanshoku Doukou",    hanValue: 2,  description: "The same triplet in all three suits." },
  { id: "shousangen",       name: "Shousangen",         hanValue: 2,  description: "Triplets of two dragons and a pair of the third." },

  // 3 Han
  { id: "honitsu", name: "Honitsu", hanValue: 3, description: "One suit only, plus any honours." },

  // 6 Han, checking only for closed hand.
  { id: "chinitsu", name: "Chinitsu", hanValue: 6, description: "One suit only, no honours at all." },

  // Yakuman (represented as 13 Han)
  { id: "kokushi",        name: "Kokushi Musou",  hanValue: 13, description: "One of each terminal and honour tile, plus one duplicate." },
  { id: "suuankou",       name: "Suuankou",       hanValue: 13, description: "Four concealed triplets." },
  { id: "daisangen",      name: "Daisangen",      hanValue: 13, description: "Triplets of all three dragon tiles." },
  { id: "shousuushi",     name: "Shousuushi",     hanValue: 13, description: "Triplets of three winds and a pair of the fourth." },
  { id: "daisuushi",      name: "Daisuushi",      hanValue: 13, description: "Triplets of all four wind tiles." },
  { id: "tsuuiisou",      name: "Tsuuiisou",      hanValue: 13, description: "All tiles are honours. No suited tiles at all." },
  { id: "chinroutou",     name: "Chinroutou",      hanValue: 13, description: "All tiles are terminals. 1s and 9s only." },
  { id: "ryuuiisou",      name: "Ryuuiisou",      hanValue: 13, description: "All tiles are from the set: 2, 3, 4, 6, 8 of Sou and Green Dragon." },
  { id: "chuuren-poutou", name: "Chuuren Poutou", hanValue: 13, description: "1-1-1-2-3-4-5-6-7-8-9-9-9 in one suit, plus one duplicate." },

];