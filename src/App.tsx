import { useState } from "react";
import type { Tile } from "./data/tiles";
//Have to add "type" otherwise it errors out, due to Typescript rules.
import TilePicker from "./components/tile-picker/tile-picker";
import CurrentHand from "./components/current-hand/current-hand";

function App() {
  const [currentHand, setCurrentHand] = useState<Tile[]>([]);
  //Start as an empty array

  const addTile = (tile: Tile) => {
    setCurrentHand((prev) => [...prev, tile]);
  };
  //Adds a new tile, while pulling the previous state with it

  const removeTile = (index: number) => {
    setCurrentHand((prev) => prev.filter((_, i) => i !== index));
  };
  //Removes a tile

return (
    <div className="app">
      <header className="app__header">
        <h1>Doman Mahjong Hand Checker</h1>
      </header>
      <CurrentHand currentHand={currentHand} onTileClick={removeTile} />
      <div className="app__main">
        <TilePicker currentHand={currentHand} onTileClick={addTile} />
        <div className="app__results-placeholder">
          Results panel coming soon.
        </div>
      </div>
    </div>
  );
}

export default App;