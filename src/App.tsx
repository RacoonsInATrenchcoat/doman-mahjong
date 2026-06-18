import { useState } from "react";
import type { Tile } from "./data/tiles";
//Have to add "type" otherwise it errors out, due to Typescript rules.
import { ALL_HANDS } from "./data/hands";
import { HAND_CHECKERS } from "./logic/hand-checkers";
import { sortResults } from "./logic/hand-sorter";
//No type added here as "sortResults is a real function"
import type { SortMode } from "./logic/hand-sorter";
//Type used here as "SortMode is only a type"
import TilePicker from "./components/tile-picker/tile-picker";
import CurrentHand from "./components/current-hand/current-hand";
import ResultsList from "./components/results-list/results-list";
import SortControls from "./components/sort-controls/sort-controls";

type WindValue = "east" | "south" | "west" | "north";
//duplication from sort-controls.tsx, will need cleanup leater

function App() {
  const [currentHand, setCurrentHand] = useState<Tile[]>([]);
  //Start as an empty array
  const [isResultsOpen, setIsResultsOpen] = useState(true);
  const [seatWind, setSeatWind] = useState<WindValue>("east");
  const [roundWind, setRoundWind] = useState<WindValue>("east");
  const [sortMode, setSortMode] = useState<SortMode>("least-steps");


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

const rawResults =
    currentHand.length === 13
      ? ALL_HANDS.map((hand) => {
          const checker = HAND_CHECKERS[hand.id];
          const result = checker(currentHand, seatWind, roundWind);
          return { hand, result };
        })
      : null;

const results = rawResults === null ? null : sortResults(rawResults, sortMode);
//Results and rawresults are separate, as the result is checked by sort-mode filter afterwards.
//Technically it can be sorted within, but it's good code to sort things separately from the raw results.

return (
    <div className="app">
      <header className="app__header">
        <h1>Doman Mahjong Hand Checker</h1>
      </header>
      <CurrentHand currentHand={currentHand} onTileClick={removeTile} />
      <div className="app__main">
        <TilePicker currentHand={currentHand} onTileClick={addTile} />
        <div className="app__results-panel">
          <SortControls
            seatWind={seatWind}
            roundWind={roundWind}
            onSeatWindChange={setSeatWind}
            onRoundWindChange={setRoundWind}
            sortMode={sortMode}
            onSortModeChange={setSortMode}
          />
          <ResultsList
            results={results}
            isOpen={isResultsOpen}
            onToggle={toggleResults}
          />
        </div>
      </div>
    </div>
  );
}

export default App;