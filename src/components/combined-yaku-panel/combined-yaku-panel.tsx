import { getTileImagePath } from "../../data/tiles";
import { TEMPLATE_IMAGES } from "../../logic/hand-checkers";
import type { CombinedYakuResult } from "../../logic/hand-sorter";
import type { VisualSlot } from "../../logic/hand-checkers";

type CombinedYakuPanelProps = {
    result: CombinedYakuResult | null;
};

function getSlotImagePath(slot: VisualSlot): string {
    return slot.ref.kind === "tile"
        ? getTileImagePath(slot.ref.tileId)
        : TEMPLATE_IMAGES[slot.ref.template];
}

function getSlotAlt(slot: VisualSlot): string {
    return slot.ref.kind === "tile" ? slot.ref.tileId : slot.ref.template;
}

function CombinedYakuPanel({ result }: CombinedYakuPanelProps) {
    if (result === null) {
        return (
            <div className="combined-yaku-panel">
                <p className="combined-yaku-panel__placeholder">Select 13 tiles to see combined yaku.</p>
            </div>
        );
    }

    const { wholeHandYaku, structuralGroups, totalHan, inactiveTileIds } = result;
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

    const breakdown = [...wholeHandYaku, ...structuralGroups]
        .map((y) => `${y.name} (${y.hanValue} han)`)
        .join(" + ");

    return (
    <div className="combined-yaku-panel">
      {wholeHandYaku.length > 0 && (
        <div className="combined-yaku-panel__header-row">
          <div className="combined-yaku-panel__badge-row">
            {wholeHandYaku.map((y, index) => (
              <span key={index} className="combined-yaku-panel__badge">
                {y.name}
              </span>
            ))}
          </div>
          <p className="combined-yaku-panel__total">
            {breakdown} = {totalHan} han
          </p>
        </div>
      )}

      {(structuralGroups.length > 0 || inactiveTileIds.length > 0) && (
        <div className="combined-yaku-panel__groups">
          {structuralGroups.map((group, index) => (
            <div key={index} className="combined-yaku-panel__group">
              <span className="combined-yaku-panel__group-label">{group.name}</span>
              <div className="combined-yaku-panel__group-tiles">
                {group.visual.map((slot, slotIndex) => (
                  <img
                    key={slotIndex}
                    src={getSlotImagePath(slot)}
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
          {breakdown} = {totalHan} han
        </p>
      )}
    </div>
  );
}

export default CombinedYakuPanel;