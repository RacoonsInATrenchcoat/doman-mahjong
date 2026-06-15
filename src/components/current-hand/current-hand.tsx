import type { Tile } from "../../data/tiles";

type CurrentHandProps = {
  currentHand: Tile[];
  onTileClick: (index: number) => void;
};
//We define the empty hand as start

function CurrentHand({ currentHand, onTileClick }: CurrentHandProps) {
  const emptySlots = Math.max(0, 13 - currentHand.length);
  //Calculate how many empty tiles to show, based on current tiles
  //If it got over 13, it would be negative, so it would show less?

  return (
    <div className="current-hand">
      <div className="current-hand__tiles">
        {currentHand.map((tile, index) => (
          <button
            key={`${tile.id}-${index}`} //gets the ID of a tile
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
    </div>
  );
}

export default CurrentHand;