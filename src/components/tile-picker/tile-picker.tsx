import { ALL_TILES } from "../../data/tiles";
import type { Tile } from "../../data/tiles";

type TilePickerProps = {
  currentHand: Tile[];
  onTileClick: (tile: Tile) => void;
};

function TilePicker({ currentHand, onTileClick }: TilePickerProps) {
  const suits = ["man", "pin", "sou", "wind", "dragon"] as const;
  const isHandFull = currentHand.length >= 14;
  //Change here for max hand size, used for testing.

  const getTileCount = (tileId: string) => {
    return currentHand.filter((t) => t.id === tileId).length;
  };
  //Checks for duplicates, aka. the same ID of a tile.

  return (
    <div className="tile-picker">
      {suits.map((suit) => (
        <div key={suit} className="tile-picker__suit-row">
          <span className="tile-picker__suit-label">{suit}</span>
          <div className="tile-picker__tiles">
            {ALL_TILES.filter((tile) => tile.suit === suit).map((tile) => {
              const count = getTileCount(tile.id);
              const isDisabled = count >= 4 || isHandFull;
              //This disallows more than 4 of the same tile to be picked.
              
              return (
                <button
                  key={tile.id}
                  className={`tile-picker__tile ${isDisabled ? "tile-picker__tile--disabled" : ""}`}
                  onClick={() => !isDisabled && onTileClick(tile)}
                  title={tile.id}
                >
                  <img src={tile.imagePath} alt={tile.id} />
                  {count > 0 && (
                    <span className="tile-picker__count">{count}</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

export default TilePicker;