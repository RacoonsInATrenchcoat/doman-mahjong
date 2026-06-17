import { useState } from "react";
import type { Tile } from "./data/tiles";
//Have to add "type" otherwise it errors out, due to Typescript rules.
import { ALL_HANDS } from "./data/hands";
import { HAND_CHECKERS } from "./logic/hand-checkers";
import TilePicker from "./components/tile-picker/tile-picker";
import CurrentHand from "./components/current-hand/current-hand";
import ResultsList from "./components/results-list/results-list";

function App() {
  const [currentHand, setCurrentHand] = useState<Tile[]>([]);
  //Start as an empty array
  const [isResultsOpen, setIsResultsOpen] = useState(true);


  const addTile = (tile: Tile) => {
    setCurrentHand((prev) => [...prev, tile]);
  };
  //Adds a new tile, while pulling the previous state with it

  const removeTile = (index: number) => {
    setCurrentHand((prev) => prev.filter((_, i) => i !== index));
  };
  //Removes a tile

    const toggleResults = () => {
    setIsResultsOpen((prev) => !prev);
  };

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
        <ResultsList
          results={results}
          isOpen={isResultsOpen}
          onToggle={toggleResults}
        />
      </div>
    </div>
  );
}

export default App;