import type { Hand } from "../../data/hands";
import type { CheckResult } from "../../logic/hand-checkers";

type ResultEntry = {
  hand: Hand;
  result: CheckResult;
};

type ResultsListProps = {
  results: ResultEntry[] | null;
  isOpen: boolean;
  onToggle: () => void;
};

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