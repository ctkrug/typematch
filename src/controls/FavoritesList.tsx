import type { Pairing } from "../state/pairingUrl";
import { favoriteId } from "../state/favorites";

export interface FavoritesListProps {
  favorites: Pairing[];
  current: Pairing;
  isSaved: boolean;
  onSave: () => void;
  onApply: (pairing: Pairing) => void;
  onRemove: (pairing: Pairing) => void;
  /** Set when the last save couldn't be persisted. */
  error?: string | null;
}

export function FavoritesList({
  favorites,
  current,
  isSaved,
  onSave,
  onApply,
  onRemove,
  error,
}: FavoritesListProps) {
  return (
    <section className="faves" aria-label="Saved pairings">
      <div className="faves__head">
        <h2 className="faves__title">Saved</h2>
        <button
          type="button"
          className="btn btn--outline btn--sm"
          onClick={onSave}
          disabled={isSaved}
          aria-label={isSaved ? "This pairing is already saved" : "Save this pairing"}
        >
          {isSaved ? "Saved" : "Save pairing"}
        </button>
      </div>

      {error && (
        <p className="faves__error" role="alert">
          {error}
        </p>
      )}

      {favorites.length === 0 ? (
        // A designed empty state: shows what a saved pairing will look like
        // rather than leaving a blank panel.
        <div className="faves__empty">
          <span className="faves__empty-mark" aria-hidden="true">
            <span className="faves__empty-serif">Aa</span>
            <span className="faves__empty-sans">Aa</span>
          </span>
          <p className="faves__empty-text">
            Nothing saved yet. Keep a pairing you like and it&rsquo;ll wait here — even after you
            close the tab.
          </p>
        </div>
      ) : (
        <ul className="faves__list">
          {favorites.map((pairing) => (
            <li className="fave" key={favoriteId(pairing)}>
              <button
                type="button"
                className="fave__apply"
                onClick={() => onApply(pairing)}
                aria-label={`Apply ${pairing.display.family} with ${pairing.ui.family}, ${pairing.theme} preview`}
              >
                <span className="fave__names">
                  <span className="fave__display">{pairing.display.family}</span>
                  <span className="fave__plus" aria-hidden="true">
                    +
                  </span>
                  <span className="fave__ui">{pairing.ui.family}</span>
                </span>
                <span className="fave__theme">{pairing.theme}</span>
              </button>
              <button
                type="button"
                className="fave__remove"
                onClick={() => onRemove(pairing)}
                aria-label={`Remove ${pairing.display.family} with ${pairing.ui.family}`}
              >
                <span aria-hidden="true">×</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
