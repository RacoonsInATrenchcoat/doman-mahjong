import { useState } from "react";
import type { Tile } from "./data/tiles";
//Have to add "type" otherwise it errors out, due to Typescript rules.
import { ALL_HANDS } from "./data/hands";
import { HAND_CHECKERS } from "./logic/hand-checkers";
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

const results =
    currentHand.length === 13
      ? ALL_HANDS.map((hand) => {
          const checker = HAND_CHECKERS[hand.id];
          const result = checker(currentHand, "east", "east");
          return { hand, result };
        })
      : null;

return (
    <div className="app">
      <header className="app__header">
        <h1>Doman Mahjong Hand Checker</h1>
      </header>
      <CurrentHand currentHand={currentHand} onTileClick={removeTile} />
      <div className="app__main">
        <TilePicker currentHand={currentHand} onTileClick={addTile} />
        <div className="app__results-placeholder">
          {results === null ? (
            <p>Select 13 tiles to see results.</p>
          ) : (
            <ul>
              {results.map(({ hand, result }) => (
                <li key={hand.id}>
                  <strong>{hand.name}</strong> ({hand.hanValue} han) --
                  needs {result.tilesNeeded} tile{result.tilesNeeded !== 1 ? "s" : ""} --
                  {result.gapDescription}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;