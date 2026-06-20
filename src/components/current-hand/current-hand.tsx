import type { Tile } from "../../data/tiles";

type CurrentHandProps = {
  currentHand: Tile[];
  onTileClick: (index: number) => void;
  onReset: () => void;
};

function CurrentHand({ currentHand, onTileClick, onReset }: CurrentHandProps) {
  const emptySlots = Math.max(0, 13 - currentHand.length);

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
        {currentHand.map((tile, index) => (
          <button
            key={`${tile.id}-${index}`}
            className="current-hand__tile"
            onClick={() => onTileClick(index)}
            title={`Remove ${tile.id}`}
          >
            <img src={tile.imagePath} alt={tile.id} />
          </button>
        ))}
        {Array.from({ length: emptySlots }).map((_, index) => (
          <div key={`empty-${index}`} className="current-hand__empty-slot" />
        ))}
      </div>
      <span className="current-hand__count">
        {currentHand.length} / 13
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