import type { SortMode } from "../../logic/hand-sorter";

type WindValue = "east" | "south" | "west" | "north";

type SortControlsProps = {
  seatWind: WindValue;
  roundWind: WindValue;
  onSeatWindChange: (wind: WindValue) => void;
  onRoundWindChange: (wind: WindValue) => void;
  sortMode: SortMode;
  onSortModeChange: (mode: SortMode) => void;
};

const WIND_OPTIONS: WindValue[] = ["east", "south", "west", "north"];

const SORT_OPTIONS: { value: SortMode; label: string }[] = [
  { value: "least-steps", label: "Least steps" },
  { value: "most-han", label: "Most han" },
  { value: "least-han", label: "Least han" },
];

function SortControls({
  seatWind,
  roundWind,
  onSeatWindChange,
  onRoundWindChange,
  sortMode,
  onSortModeChange,
}: SortControlsProps) {
  return (
    <div className="sort-controls">
      <div className="sort-controls__group">
        <label htmlFor="seat-wind-select">Seat wind</label>
        <select
          id="seat-wind-select"
          value={seatWind}
          onChange={(e) => onSeatWindChange(e.target.value as WindValue)}
        >
          {WIND_OPTIONS.map((wind) => (
            <option key={wind} value={wind}>
              {wind.charAt(0).toUpperCase() + wind.slice(1)}
            </option>
          ))}
        </select>
      </div>

      <div className="sort-controls__group">
        <label htmlFor="round-wind-select">Round wind</label>
        <select
          id="round-wind-select"
          value={roundWind}
          onChange={(e) => onRoundWindChange(e.target.value as WindValue)}
        >
          {WIND_OPTIONS.map((wind) => (
            <option key={wind} value={wind}>
              {wind.charAt(0).toUpperCase() + wind.slice(1)}
            </option>
          ))}
        </select>
      </div>

      <div className="sort-controls__group">
        <label htmlFor="sort-mode-select">Sort by</label>
        <select
          id="sort-mode-select"
          value={sortMode}
          onChange={(e) => onSortModeChange(e.target.value as SortMode)}
        >
          {SORT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

export default SortControls;