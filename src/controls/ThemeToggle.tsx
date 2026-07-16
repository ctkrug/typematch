import { THEMES, type Theme } from "../preview/theme";

export interface ThemeToggleProps {
  theme: Theme;
  onChange: (theme: Theme) => void;
}

const LABELS: Record<Theme, string> = { light: "Light", dark: "Dark" };

/**
 * Light/dark switch for the mock product only — not for the tool's chrome.
 * A radiogroup rather than a checkbox: the two options are peers, and naming
 * them beats a switch whose "on" state is ambiguous.
 */
export function ThemeToggle({ theme, onChange }: ThemeToggleProps) {
  return (
    <div className="toggle" role="radiogroup" aria-label="Preview theme">
      <span className="toggle__legend">Preview</span>
      <div className="toggle__track">
        {THEMES.map((option) => (
          <button
            key={option}
            type="button"
            role="radio"
            aria-checked={theme === option}
            className="toggle__option"
            data-selected={theme === option}
            onClick={() => onChange(option)}
          >
            {LABELS[option]}
          </button>
        ))}
      </div>
    </div>
  );
}
