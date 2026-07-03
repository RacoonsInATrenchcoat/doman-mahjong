import type { LanguageOption } from "../../settings";
import { LANGUAGE_OPTIONS } from "../../settings";

type SettingsPanelProps = {
  language: LanguageOption;
  onLanguageChange: (value: LanguageOption) => void;
  onClose: () => void;
};

function SettingsPanel({ language, onLanguageChange }: SettingsPanelProps) {
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
    </div>
  );
}

export default SettingsPanel;