import type { LanguageOption, TileSkinOption } from "../../settings";
import {
  LANGUAGE_OPTIONS,
  TILE_SKIN_OPTIONS,
  TILE_HEIGHT_MIN,
  TILE_HEIGHT_MAX,
  TILE_HEIGHT_DEFAULT,
} from "../../settings";

type SettingsPanelProps = {
  language: LanguageOption;
  onLanguageChange: (value: LanguageOption) => void;
  tileSkin: TileSkinOption;
  onTileSkinChange: (value: TileSkinOption) => void;
  tileHeight: number;
  onTileHeightChange: (value: number) => void;
  onClose: () => void;
};

function SettingsPanel({
  language,
  onLanguageChange,
  tileSkin,
  onTileSkinChange,
  tileHeight,
  onTileHeightChange,
}: SettingsPanelProps) {
  const heightPercent = Math.round((tileHeight / TILE_HEIGHT_DEFAULT) * 100);

  return (
    <div className="settings-panel">
      <h3 className="settings-panel__title">Settings</h3>

      <div className="settings-panel__section">
        <p className="settings-panel__section-label">Yaku names</p>
        {LANGUAGE_OPTIONS.map((option) => (
          <label key={option.value} className="settings-panel__radio-label">
            <input
              type="radio"
              name="language"
              value={option.value}
              checked={language === option.value}
              onChange={() => onLanguageChange(option.value)}
            />
            {option.label}
          </label>
        ))}
      </div>

      <div className="settings-panel__section">
        <p className="settings-panel__section-label">Tile skin</p>
        {TILE_SKIN_OPTIONS.map((option) => (
          <label key={option.value} className="settings-panel__radio-label">
            <input
              type="radio"
              name="tile-skin"
              value={option.value}
              checked={tileSkin === option.value}
              onChange={() => onTileSkinChange(option.value)}
            />
            {option.label}
          </label>
        ))}
      </div>

      <div className="settings-panel__section">
        <p className="settings-panel__section-label">
          Tile size: {heightPercent}%
        </p>
        <input
          type="range"
          min={TILE_HEIGHT_MIN}
          max={TILE_HEIGHT_MAX}
          value={tileHeight}
          onChange={(e) => onTileHeightChange(parseInt(e.target.value, 10))}
          className="settings-panel__slider"
        />
        <div className="settings-panel__slider-labels">
          <span>
            {Math.round((TILE_HEIGHT_MIN / TILE_HEIGHT_DEFAULT) * 100)}%
          </span>
          <span>100%</span>
          <span>
            {Math.round((TILE_HEIGHT_MAX / TILE_HEIGHT_DEFAULT) * 100)}%
          </span>
        </div>
      </div>
    </div>
  );
}

export default SettingsPanel;