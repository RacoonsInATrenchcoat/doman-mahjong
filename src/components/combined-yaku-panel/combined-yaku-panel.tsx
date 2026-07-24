import { getTileImagePath } from "../../data/tiles";
import { TEMPLATE_IMAGES } from "../../logic/hand-checkers";
import type { CombinedYakuResult } from "../../logic/hand-sorter";
import type { LanguageOption, TileSkinOption, ScoringRuleset } from "../../settings";
import { calculateScore, calculateFu, SCORE_CATEGORY_LABELS } from "../../logic/score-calculator";
import type { ShantenGroup } from "../../logic/shanten/standard";
import type { VisualSlot } from "../../logic/hand-checkers";

type CombinedYakuPanelProps = {
  result: CombinedYakuResult | null;
  shanten: import("../../logic/shanten").ShantenResult | null;
  language: LanguageOption;
  tileSkin: TileSkinOption;
  scoringRuleset: ScoringRuleset;
  isTsumo: boolean;
  seatWind: string;
  roundWind: string;
};

function displayName(
  yaku: { name: string; nameEng: string },
  language: LanguageOption
): string {
  return language === "english" ? yaku.nameEng : yaku.name;
}

function getSlotImagePath(slot: VisualSlot, skin: TileSkinOption): string {
  return slot.ref.kind === "tile"
    ? getTileImagePath(slot.ref.tileId, skin)
    : TEMPLATE_IMAGES[slot.ref.template];
}

function getSlotAlt(slot: VisualSlot): string {
  return slot.ref.kind === "tile" ? slot.ref.tileId : slot.ref.template;
}

function CombinedYakuPanel({
  result,
  shanten,
  language,
  tileSkin,
  scoringRuleset,
  isTsumo,
  seatWind,
  roundWind,
}: CombinedYakuPanelProps) {
  if (result === null) {
    return (
      <div className="combined-yaku-panel">
        <p className="combined-yaku-panel__placeholder">Select 13 tiles to see combined yaku.</p>
      </div>
    );
  }

  const { wholeHandYaku, structuralGroups, inactiveTileIds } = result;
  const hasAnything = wholeHandYaku.length > 0 || structuralGroups.length > 0;

  if (!hasAnything) {
    return (
      <div className="combined-yaku-panel">
        <p className="combined-yaku-panel__placeholder">No yaku currently complete.</p>
        <div className="combined-yaku-panel__unused-tiles">
          {inactiveTileIds.map((_, index) => (
            <img
              key={index}
              src={TEMPLATE_IMAGES.inactive}
              alt="inactive"
              className="combined-yaku-panel__tile combined-yaku-panel__tile--inactive"
            />
          ))}
        </div>
      </div>
    );
  }

  // Built a minimal ResultEntry-compatible list from what CombinedYakuResult carries,
  // sufficient for calculateScore to work without needing the full Hand objects.
  // This uses an inline type that matches what calculateScore expects.
  const allCompleteYaku = [...wholeHandYaku, ...structuralGroups];

  // Determine fu from the Standard shape decomposition when available.
  // Fu is only meaningful below mangan (less than 5 han from regular yaku),
  // but we calculate it regardless and let calculateScore decide whether
  // to use it for threshold checks.
  const standardGroups: ShantenGroup[] | null =
    shanten !== null && shanten.standard.decompositions.length > 0
      ? shanten.standard.decompositions[0]
      : null;

  const isPinfu = allCompleteYaku.some((y) => y.id === "pinfu");
  const isChiitoitsu = allCompleteYaku.some((y) => y.id === "chiitoitsu");

  const fuResult =
    standardGroups !== null
      ? calculateFu(standardGroups, isChiitoitsu, isPinfu, isTsumo, seatWind, roundWind)
      : { total: 30, isProjected: true };

  const scoreResult = calculateScore(
    allCompleteYaku.map((y) => ({
      hand: {
        id: y.id,
        name: y.name,
        nameEng: y.nameEng,
        hanValue: y.hanValue,
        description: "",
        yakumanUnits: y.yakumanUnits,
        yakumanUnitsRiichi: y.yakumanUnitsRiichi,
      },
      result: { possible: true, tilesNeeded: 0, gapDescription: "", visual: [] },
    })),
    scoringRuleset,
    language,
    fuResult.total
  );

  const categoryLabel = SCORE_CATEGORY_LABELS[scoreResult.category];

  const breakdown = scoreResult.contributingNames.join(" + ");

  return (
    <div className="combined-yaku-panel">
      {wholeHandYaku.length > 0 && (
        <div className="combined-yaku-panel__header-row">
          <div className="combined-yaku-panel__badge-row">
            {wholeHandYaku.map((y, index) => (
              <span key={index} className="combined-yaku-panel__badge">
                {displayName(y, language)}
              </span>
            ))}
          </div>
          <p className="combined-yaku-panel__total">
            {breakdown}
            {scoreResult.isYakuman
              ? ` = ${categoryLabel}`
              : scoreResult.category === "regular"
                ? ` = ${scoreResult.regularHan} han ${scoreResult.fu} fu${fuResult.isProjected ? " (projected ron)" : ""}`
                : ` = ${scoreResult.regularHan} han ${scoreResult.fu} fu (${categoryLabel})`}
          </p>
        </div>
      )}

      {(structuralGroups.length > 0 || inactiveTileIds.length > 0) && (
        <div className="combined-yaku-panel__groups">
          {structuralGroups.map((group, index) => (
            <div key={index} className="combined-yaku-panel__group">
              <span className="combined-yaku-panel__group-label">{displayName(group, language)}</span>
              <div className="combined-yaku-panel__group-tiles">
                {group.visual.map((slot, slotIndex) => (
                  <img
                    key={slotIndex}
                    src={getSlotImagePath(slot, tileSkin)}
                    alt={getSlotAlt(slot)}
                    className="combined-yaku-panel__tile"
                  />
                ))}
              </div>
            </div>
          ))}

          {inactiveTileIds.length > 0 && (
            <div className="combined-yaku-panel__group">
              <span className="combined-yaku-panel__group-label">Unused</span>
              <div className="combined-yaku-panel__unused-tiles">
                {inactiveTileIds.map((_, index) => (
                  <img
                    key={index}
                    src={TEMPLATE_IMAGES.inactive}
                    alt="inactive"
                    className="combined-yaku-panel__tile combined-yaku-panel__tile--inactive"
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {wholeHandYaku.length === 0 && (
        <p className="combined-yaku-panel__total">
          {breakdown}
          {scoreResult.isYakuman
            ? ` = ${categoryLabel}`
            : scoreResult.category === "regular"
              ? ` = ${scoreResult.regularHan} han ${scoreResult.fu} fu${fuResult.isProjected ? " (projected ron)" : ""}`
              : ` = ${scoreResult.regularHan} han ${scoreResult.fu} fu (${categoryLabel})`}
        </p>
      )}
    </div>
  );
}

export default CombinedYakuPanel;