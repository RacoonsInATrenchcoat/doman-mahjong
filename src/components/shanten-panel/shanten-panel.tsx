import { useState, useEffect } from "react";
import { getTileImagePath } from "../../data/tiles";
import { TEMPLATE_IMAGES } from "../../logic/hand-checkers";
import type { ShapeName, ShantenResult, ShapeResult, ShantenSlot, ShantenGroup } from "../../logic/shanten";
import type { TileSkinOption } from "../../settings";

type ShantenPanelProps = {
  shanten: ShantenResult | null;
  tileSkin: TileSkinOption;
};

function getSlotImagePath(slot: ShantenSlot, skin: TileSkinOption): string {
  return slot.ref.kind === "tile"
    ? getTileImagePath(slot.ref.tileId, skin)
    : TEMPLATE_IMAGES[slot.ref.template];
}

function getSlotAlt(slot: ShantenSlot): string {
  return slot.ref.kind === "tile" ? slot.ref.tileId : slot.ref.template;
}

function getSlotClass(slot: ShantenSlot): string {
  const classes = ["shanten-panel__tile"];
  if (!slot.satisfied) classes.push("shanten-panel__tile--missing");
  if (slot.contributing === false) classes.push("shanten-panel__tile--leftover");
  return classes.join(" ");
}

const SHAPE_LABELS: Record<ShapeName, string> = {
  standard: "Standard Shape",
  chiitoitsu: "Chiitoitsu Shape",
  kokushi: "Kokushi Shape",
};

function ShantenPanel({ shanten, tileSkin }: ShantenPanelProps) {
  const [selectedShape, setSelectedShape] = useState<ShapeName | null>(null);

  // Reset shape selection whenever a new shanten result arrives.
  // This is the only remaining useEffect in this component, and it is
  // now strictly for UI state management, not computation.
  useEffect(() => {
    if (shanten === null) {
      setSelectedShape(null);
    } else {
      setSelectedShape(shanten.defaultShape);
    }
  }, [shanten]);

  if (shanten === null || selectedShape === null) {
    return (
      <div className="shanten-panel">
        <p className="shanten-panel__placeholder">Select 13 tiles to see shanten.</p>
      </div>
    );
  }

  const shapes: ShapeName[] = ["standard", "chiitoitsu", "kokushi"];
  const active: ShapeResult = shanten[selectedShape];
  const groups: ShantenGroup[] = active.decompositions[0];

  // Collect every shape currently at tenpai (distance exactly 0, not
  // -1 which is hand complete and not riichi-declarable).
  const riichiForms: ShapeName[] = shapes.filter(
    (shape) => shanten[shape].distance === 0
  );
  const activeIsRiichi = active.distance === 0;
  const otherRiichiForms = riichiForms.filter((s) => s !== selectedShape);

  return (
    <div className="shanten-panel">
      <div className="shanten-panel__header">
        {shapes.map((shape) => (
          <label key={shape} className="shanten-panel__radio-label">
            <input
              type="radio"
              name="shanten-shape"
              checked={selectedShape === shape}
              onChange={() => setSelectedShape(shape)}
            />
            {SHAPE_LABELS[shape]}
          </label>
        ))}
      </div>

      <div className="shanten-panel__groups">
        {groups.map((group, index) => (
          <div key={index} className="shanten-panel__group">
            <span className="shanten-panel__group-label">{group.label}</span>
            <div className="shanten-panel__group-tiles">
              {group.slots.map((slot, slotIndex) => (
<img
                    key={slotIndex}
                    src={getSlotImagePath(slot, tileSkin)}
                    alt={getSlotAlt(slot)}
                    className={getSlotClass(slot)}
                  />
              ))}
            </div>
          </div>
        ))}
      </div>

      <p className="shanten-panel__caption">
        {SHAPE_LABELS[selectedShape]},{" "}
        {active.distance < 0
          ? "hand complete"
          : `${active.distance} away`}
        {activeIsRiichi ? " - Riichi possible" : ""}
      </p>

      {otherRiichiForms.length > 0 && (
        <p className="shanten-panel__riichi-note">
          Also tenpai via{" "}
          {otherRiichiForms.map((s) => SHAPE_LABELS[s]).join(" and ")},
          Riichi possible.
        </p>
      )}
    </div>
  );
}

export default ShantenPanel;