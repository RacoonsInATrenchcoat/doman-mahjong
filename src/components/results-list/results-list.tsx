import type { ResultEntry } from "../../logic/hand-sorter";
import type { VisualSlot } from "../../logic/hand-checkers";
import { TEMPLATE_IMAGES } from "../../logic/hand-checkers";
import { getTileImagePath } from "../../data/tiles";

type ResultsListProps = {
  results: ResultEntry[] | null;
  isOpen: boolean;
  onToggle: () => void;
};

function getSlotImagePath(slot: VisualSlot): string {
  return slot.ref.kind === "tile"
    ? getTileImagePath(slot.ref.tileId)
    : TEMPLATE_IMAGES[slot.ref.template];
}

function getSlotAlt(slot: VisualSlot): string {
  return slot.ref.kind === "tile" ? slot.ref.tileId : slot.ref.template;
}

function getSlotClass(slot: VisualSlot): string {
  const classes = ["results-list__visual-tile"];
  if (!slot.satisfied) classes.push("results-list__visual-tile--missing");
  if (slot.ref.kind === "template") {
    classes.push(`results-list__visual-tile--${slot.ref.template}`);
  }
  return classes.join(" ");
}

function ResultsList({ results, isOpen, onToggle }: ResultsListProps) {
  return (
    <div className="results-list">
      <div className="results-list__header">
        <h2>Results</h2>
        <button className="results-list__toggle" onClick={onToggle}>
          {isOpen ? "Hide" : "Show"}
        </button>
      </div>

      {isOpen && (
        <div className="results-list__body">
          {results === null ? (
            <p className="results-list__placeholder">
              Select 13 tiles to see results.
            </p>
          ) : (
            <ul className="results-list__items">
              {results.map(({ hand, result }) => (
                <li
                  key={hand.id}
                  className={`results-list__item ${
                    !result.possible ? "results-list__item--impossible" : ""
                  }`}
                >
                  <div className="results-list__item-top">
                    <span className="results-list__name">{hand.name}</span>
                    <span className="results-list__han">
                      {hand.hanValue} han
                    </span>
                  </div>
                  <div className="results-list__visual">
                    {result.visual.map((slot, index) => (
                      <img
                        key={index}
                        src={getSlotImagePath(slot)}
                        alt={getSlotAlt(slot)}
                        className={getSlotClass(slot)}
                      />
                    ))}
                  </div>
                  <p className="results-list__gap">{result.gapDescription}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

export default ResultsList;