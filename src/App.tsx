import { useState, useEffect, useLayoutEffect, useRef } from "react";
//Fun fact: useLayoutEffect is the same as useEffect, BUT it runs before the page is loaded, aka. there will be not "flash"  where it resizes after it has loaded.
import type { Tile } from "./data/tiles";
//Have to add "type" otherwise it errors out, due to Typescript rules.
import type { SortMode } from "./logic/hand-sorter";
//Type used here as "SortMode is only a type"
import { useHandCalculations } from "./hooks/use-hand-calculations";
import type { LanguageOption, TileSkinOption, ScoringRuleset } from "./settings";
import { TILE_HEIGHT_DEFAULT, TILE_HEIGHT_MIN, TILE_HEIGHT_MAX } from "./settings";
import TilePicker from "./components/tile-picker/tile-picker";
import CurrentHand from "./components/current-hand/current-hand";
import ResultsList from "./components/results-list/results-list";
import SortControls from "./components/sort-controls/sort-controls";
import ShantenPanel from "./components/shanten-panel/shanten-panel";
import CombinedYakuPanel from "./components/combined-yaku-panel/combined-yaku-panel";
import SettingsPanel from "./components/settings-panel/settings-panel";

type WindValue = "east" | "south" | "west" | "north";
//duplication from sort-controls.tsx, will need cleanup leater

function App() {
  const [currentHand, setCurrentHand] = useState<Tile[]>([]);
  //Start as an empty array
  const [isResultsOpen, setIsResultsOpen] = useState(true);
  const [seatWind, setSeatWind] = useState<WindValue>("east");
  const [roundWind, setRoundWind] = useState<WindValue>("east");
  const [sortMode, setSortMode] = useState<SortMode>("least-steps");

  //  Settings
  // Persist language to localStorage whenever it changes.

  const [language, setLanguage] = useState<LanguageOption>(() => {
    return (localStorage.getItem("language") as LanguageOption | null) ?? "japanese";
  });
  const [tileSkin, setTileSkin] = useState<TileSkinOption>(() => {
    return (localStorage.getItem("tileSkin") as TileSkinOption | null) ?? "doman";
  });
  const [tileHeight, setTileHeight] = useState<number>(() => {
    const saved = localStorage.getItem("tileHeight");
    const parsed = saved !== null ? parseInt(saved, 10) : NaN;
    if (!isNaN(parsed) && parsed >= TILE_HEIGHT_MIN && parsed <= TILE_HEIGHT_MAX) {
      return parsed;
    }
    return TILE_HEIGHT_DEFAULT;
  });

  const [scoringRuleset, setScoringRuleset] = useState<ScoringRuleset>(() => {
    return (localStorage.getItem("scoringRuleset") as ScoringRuleset | null) ?? "doman";
  });
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const settingsContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    localStorage.setItem("language", language);
  }, [language]);

  useEffect(() => {
    localStorage.setItem("tileSkin", tileSkin);
  }, [tileSkin]);

  useEffect(() => {
    localStorage.setItem("tileHeight", String(tileHeight));
    document.documentElement.style.setProperty("--tile-height", `${tileHeight}px`);
  }, [tileHeight]);

  useEffect(() => {
    localStorage.setItem("scoringRuleset", scoringRuleset);
  }, [scoringRuleset]);

  // Apply saved tile height synchronously before first paint, so no
  // fallback CSS value is needed. useLayoutEffect fires before the browser
  // paints, eliminating any flash of unsized tiles.
  useLayoutEffect(() => {
    document.documentElement.style.setProperty("--tile-height", `${tileHeight}px`);
  }, []);


  // Close the settings panel when clicking outside the gear button
  // and the panel together.
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        settingsContainerRef.current &&
        !settingsContainerRef.current.contains(e.target as Node)
      ) {
        setIsSettingsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const addTile = (tile: Tile) => {
    setCurrentHand((prev) => {
      if (prev.length >= 14) return prev;
      return [...prev, tile];
    });
  };
  //Adds a new tile, while pulling the previous state with it

  const removeTile = (index: number) => {
    setCurrentHand((prev) => prev.filter((_, i) => i !== index));
  };
  //Removes a tile

  const clearHand = () => {
    setCurrentHand([]);
  };
  //Used for full clearing the hand
  const toggleResults = () => {
    setIsResultsOpen((prev) => !prev);
  };

  const { results, combinedYaku, discardDistances, shanten } =
    useHandCalculations(currentHand, seatWind, roundWind, sortMode);


  // Temporary testing, Shanten verification only for debugging the results.
  /*
  if (currentHand.length === 13) {
    import("./logic/shanten/index").then(({ calculateShanten }) => {
    console.log("Shanten:", calculateShanten (currentHand));
    });
  
  }
  */

  //Here is where the main HTML part lives.
  return (
    <div className="app">
      <header className="app__header">
        <h1>Doman Mahjong Hand Checker</h1>
        <div className="app__settings-container" ref={settingsContainerRef}>
          <button
            className="app__settings-button"
            onClick={() => setIsSettingsOpen((prev) => !prev)}
            title="Settings"
          >
            ⚙
          </button>
          {isSettingsOpen && (
            <SettingsPanel
              language={language}
              onLanguageChange={setLanguage}
              tileSkin={tileSkin}
              onTileSkinChange={setTileSkin}
              tileHeight={tileHeight}
              onTileHeightChange={setTileHeight}
              scoringRuleset={scoringRuleset}
              onScoringRulesetChange={setScoringRuleset}
              onClose={() => setIsSettingsOpen(false)}
            />
          )}
        </div>
      </header>
      <CurrentHand
        currentHand={currentHand}
        onTileClick={removeTile}
        onReset={clearHand}
        discardDistances={discardDistances}
        tileSkin={tileSkin}
      />
      <div className="app__main">
        <TilePicker currentHand={currentHand} onTileClick={addTile} tileSkin={tileSkin} />
        <div className="app__results-panel">
          <ShantenPanel shanten={shanten} tileSkin={tileSkin} />
          <CombinedYakuPanel
            result={combinedYaku}
            shanten={shanten}
            language={language}
            tileSkin={tileSkin}
            scoringRuleset={scoringRuleset}
            isTsumo={currentHand.length === 14}
            seatWind={seatWind}
            roundWind={roundWind}
          />
          <ResultsList
            results={results}
            isOpen={isResultsOpen}
            onToggle={toggleResults}
            language={language}
            tileSkin={tileSkin}
            controls={
              <SortControls
                seatWind={seatWind}
                roundWind={roundWind}
                onSeatWindChange={setSeatWind}
                onRoundWindChange={setRoundWind}
                sortMode={sortMode}
                onSortModeChange={setSortMode}
              />
            }
          />
        </div>
      </div>
    </div>
  );
}

export default App;