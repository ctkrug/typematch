import { useCallback, useEffect, useMemo, useState } from "react";
import { CopyLinkButton } from "./controls/CopyLinkButton";
import { FavoritesList } from "./controls/FavoritesList";
import { FontPicker } from "./controls/FontPicker";
import { ScorePanel } from "./controls/ScorePanel";
import { ThemeToggle } from "./controls/ThemeToggle";
import { useLoadedFont } from "./fonts/useLoadedFont";
import { PreviewApp } from "./preview/PreviewApp";
import type { Theme } from "./preview/theme";
import { usePairingScore } from "./scoring/usePairingScore";
import {
  addFavorite,
  commitFavorites,
  isFavorite,
  loadFavorites,
  removeFavorite,
  safeLocalStorage,
} from "./state/favorites";
import {
  DEFAULT_PAIRING,
  decodePairing,
  encodePairing,
  pairingUrl,
  type Pairing,
} from "./state/pairingUrl";
import {
  loadThemePreference,
  resolveInitialTheme,
  saveThemePreference,
} from "./state/themePreference";
import "./styles/app-shell.css";

const SAVE_ERROR = "Couldn't save — your browser is blocking local storage.";

export function App() {
  // The store is resolved once: probing localStorage costs a write, and in
  // Safari's private mode the access itself throws.
  const store = useMemo(() => safeLocalStorage(), []);

  // A shared link wins over defaults on first paint, so a link recipient sees
  // the sender's pairing with no flash of Fraunces/Inter first. The theme is
  // resolved separately: the link wins if it carries one, else the visitor's
  // own saved preference applies.
  const [pairing, setPairing] = useState<Pairing>(() => {
    if (typeof window === "undefined") return DEFAULT_PAIRING;
    const fromUrl = decodePairing(window.location.search);
    const params = new URLSearchParams(window.location.search);
    return {
      ...fromUrl,
      theme: resolveInitialTheme(params.get("theme"), loadThemePreference(store)),
    };
  });
  const [favorites, setFavorites] = useState<Pairing[]>(() => loadFavorites(store));
  const [saveError, setSaveError] = useState<string | null>(null);

  const display = useLoadedFont(pairing.display);
  const ui = useLoadedFont(pairing.ui);

  const score = usePairingScore({
    displayStack: display.stack,
    uiStack: ui.stack,
    displayCategory: display.font.category,
    uiCategory: ui.font.category,
    displayFamily: display.font.family,
    uiFamily: ui.font.family,
    theme: pairing.theme,
    revision: `${display.revision}:${ui.revision}`,
  });

  // Mirror the pairing into the address bar so the page can be shared by
  // copying it out of the browser. replaceState, not push: every font change
  // would otherwise bury the referring page under a stack of near-identical
  // entries the user has to click back through.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const next = `${window.location.pathname}?${encodePairing(pairing)}`;
    window.history.replaceState(null, "", next);
  }, [pairing]);

  // Every change is applied to storage as it stands at write time, so a save
  // in this tab can't wipe out one made in another.
  const persist = useCallback(
    (change: (current: Pairing[]) => Pairing[]) => {
      const { favorites: next, ok } = commitFavorites(store, favorites, change);
      setFavorites(next);
      setSaveError(ok ? null : SAVE_ERROR);
    },
    [store, favorites],
  );

  const saved = isFavorite(favorites, pairing);

  // Built from the pairing, not read back from window.location: the address
  // bar is written by an effect *after* this render, so reading it here would
  // hand the copy button the previously rendered pairing.
  const shareUrl = useMemo(
    () => (typeof window === "undefined" ? "" : pairingUrl(pairing, window.location.href)),
    [pairing],
  );

  return (
    <div className="shell">
      <a className="skip" href="#preview">
        Skip to preview
      </a>

      <header className="shell__head">
        <div className="brand">
          {/* The wordmark is the demo: each half renders in the live pairing.
              Splitting it across two elements makes the accessible name compute
              as "Type match", so the whole name is stated once here instead. */}
          <h1 className="brand__mark" aria-label="Typematch">
            <span className="brand__type" style={{ fontFamily: display.stack }} aria-hidden="true">
              Type
            </span>
            <span className="brand__match" style={{ fontFamily: ui.stack }} aria-hidden="true">
              match
            </span>
          </h1>
          <p className="brand__tagline">Two fonts, one real interface — not a specimen sheet.</p>
        </div>

        <div className="rail">
          <FontPicker
            label="Display font"
            hint="Headings, wordmark, prices"
            value={pairing.display}
            isLoading={display.isLoading}
            error={display.error}
            onChange={(font) => setPairing((current) => ({ ...current, display: font }))}
          />
          <FontPicker
            label="UI font"
            hint="Body, labels, buttons"
            value={pairing.ui}
            isLoading={ui.isLoading}
            error={ui.error}
            onChange={(font) => setPairing((current) => ({ ...current, ui: font }))}
          />
          <ThemeToggle
            theme={pairing.theme}
            onChange={(theme: Theme) => {
              saveThemePreference(store, theme);
              setPairing((current) => ({ ...current, theme }));
            }}
          />
        </div>
      </header>

      <main className="shell__body">
        <section className="shell__preview" id="preview" aria-label="Live pairing preview">
          <PreviewApp displayStack={display.stack} uiStack={ui.stack} theme={pairing.theme} />
        </section>

        <aside className="shell__side">
          <ScorePanel score={score} />
          <CopyLinkButton url={shareUrl} />
          <FavoritesList
            favorites={favorites}
            isSaved={saved}
            onSave={() => persist((current) => addFavorite(current, pairing))}
            onApply={setPairing}
            onRemove={(target) => persist((current) => removeFavorite(current, target))}
            error={saveError}
          />
        </aside>
      </main>
    </div>
  );
}
