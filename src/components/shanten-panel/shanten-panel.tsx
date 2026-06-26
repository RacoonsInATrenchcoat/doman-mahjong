import { useState, useEffect } from "react";
import type { Tile } from "../../data/tiles";
import { getTileImagePath } from "../../data/tiles";
import { TEMPLATE_IMAGES } from "../../logic/hand-checkers";
import type { ShapeName, ShantenResult, ShapeResult, ShantenSlot } from "../../logic/shanten";

type ShantenPanelProps = {
  currentHand: Tile[];
};

function getSlotImagePath(slot: ShantenSlot): string {
  return slot.ref.kind === "tile"
    ? getTileImagePath(slot.ref.tileId)
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

function ShantenPanel({ currentHand }: ShantenPanelProps) {
  const [result, setResult] = useState<ShantenResult | null>(null);
  const [selectedShape, setSelectedShape] = useState<ShapeName | null>(null);

  useEffect(() => {
    if (currentHand.length !== 13) {
      setResult(null);
      setSelectedShape(null);
      return;
    }
    import("../../logic/shanten").then(({ calculateShanten }) => {
      const calculated = calculateShanten(currentHand);
      setResult(calculated);
      setSelectedShape(calculated.defaultShape);
    });
  }, [currentHand]);

  if (result === null || selectedShape === null) {
    return (
      <div className="shanten-panel">
        <p className="shanten-panel__placeholder">Select 13 tiles to see shanten.</p>
      </div>
    );
  }

  const shapes: ShapeName[] = ["standard", "chiitoitsu", "kokushi"];
  const active: ShapeResult = result[selectedShape];
  const visual = active.decompositions[0];

 
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

      <div className="shanten-panel__tiles">
        {visual.map((slot, index) => (
          <img
            key={index}
            src={getSlotImagePath(slot)}
            alt={getSlotAlt(slot)}
            className={getSlotClass(slot)}
          />
        ))}
      </div>

      <p className="shanten-panel__caption">
        {SHAPE_LABELS[selectedShape]}, {active.distance} away
      </p>
    </div>
  );
}



export default ShantenPanel;