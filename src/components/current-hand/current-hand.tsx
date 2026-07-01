import type { Tile } from "../../data/tiles";

type CurrentHandProps = {
  currentHand: Tile[];
  onTileClick: (index: number) => void;
  onReset: () => void;
  discardDistances: number[] | null;
};

// Returns a CSS class name for a discard badge based on the resulting
// shanten distance. Green for 0 (stays tenpai), yellow for 1, red for 2+.
function discardBadgeClass(distance: number): string {
  if (distance <= 0) return "current-hand__discard-badge current-hand__discard-badge--tenpai";
  if (distance === 1) return "current-hand__discard-badge current-hand__discard-badge--close";
  return "current-hand__discard-badge current-hand__discard-badge--far";
}

function CurrentHand({ currentHand, onTileClick, onReset, discardDistances }: CurrentHandProps) {
  const emptySlots = Math.max(0, 13 - Math.min(currentHand.length, 13));
  const has14 = currentHand.length === 14;

  const handleReset = () => {
    if (currentHand.length === 0) return;
    const confirmed = window.confirm("Clear all tiles from the current hand?");
    if (confirmed) {
      onReset();
    }
  };

  return (
    <div className="current-hand">
      <div className="current-hand__tiles">
        {currentHand.map((tile, index) => {
          const isDrawnTile = has14 && index === 13;
          return (
            <button
              key={`${tile.id}-${index}`}
              className={`current-hand__tile ${isDrawnTile ? "current-hand__tile--drawn" : ""}`}
              onClick={() => onTileClick(index)}
              title={isDrawnTile ? `Drawn tile: ${tile.id}` : `Remove ${tile.id}`}
            >
              <img src={tile.imagePath} alt={tile.id} />
              {discardDistances !== null && (
                <span className={discardBadgeClass(discardDistances[index])}>
                  {discardDistances[index]}
                </span>
              )}
            </button>
          );
        })}
        {Array.from({ length: emptySlots }).map((_, index) => (
          <div key={`empty-${index}`} className="current-hand__empty-slot" />
        ))}
      </div>
      <span className="current-hand__count">
        {has14 ? "13 + 1 drawn" : `${currentHand.length} / 13`}
      </span>
      <button
        className="current-hand__reset"
        onClick={handleReset}
        disabled={currentHand.length === 0}
      >
        Reset
      </button>
    </div>
  );
}

export default CurrentHand;