import { useEffect, useId, useMemo, useRef, useState } from "react";
import { searchFamilies } from "../fonts/search";
import type { FontFamily } from "../fonts/types";

export interface FontPickerProps {
  label: string;
  /** Short note under the label, e.g. what this slot drives in the mock. */
  hint: string;
  value: FontFamily;
  onChange: (font: FontFamily) => void;
  /** True while this slot's newly selected family is downloading. */
  isLoading?: boolean;
  /** Set when this slot's family failed to load. */
  error?: string | null;
}

const RESULT_LIMIT = 8;

/**
 * Search-and-select for one font slot.
 *
 * A combobox rather than a <select>: the catalog is >100 families, so it needs
 * substring search, and a native select can't be themed to the design's
 * paper-and-ink direction. That means owning the keyboard contract by hand —
 * arrows move, Enter commits, Escape reverts.
 */
export function FontPicker({ label, hint, value, onChange, isLoading, error }: FontPickerProps) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const listId = useId();
  const optionId = (index: number) => `${listId}-option-${index}`;

  const results = useMemo(() => searchFamilies(query, { limit: RESULT_LIMIT }), [query]);

  // Keep the highlight in range as the result list shrinks under the cursor.
  useEffect(() => {
    setActiveIndex((current) => (current >= results.length ? 0 : current));
  }, [results.length]);

  // A click outside is a dismiss, not a selection: revert to the applied font.
  useEffect(() => {
    if (!isOpen) return;
    function onPointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) close();
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [isOpen]);

  function close() {
    setIsOpen(false);
    setQuery("");
  }

  function commit(font: FontFamily) {
    onChange(font);
    close();
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
        return;
      }
      if (results.length === 0) return;
      const step = event.key === "ArrowDown" ? 1 : -1;
      setActiveIndex((current) => (current + step + results.length) % results.length);
      return;
    }

    if (event.key === "Enter") {
      if (!isOpen) return;
      event.preventDefault();
      const choice = results[activeIndex];
      if (choice) commit(choice);
      return;
    }

    if (event.key === "Escape") {
      if (!isOpen) return;
      event.preventDefault();
      close();
      return;
    }

    if (event.key === "Tab") close();
  }

  const status = error ? "error" : isLoading ? "loading" : "ready";

  return (
    <div className="picker" ref={rootRef} data-status={status}>
      <div className="picker__heading">
        <label className="picker__label" htmlFor={`${listId}-input`}>
          {label}
        </label>
        <span className="picker__hint">{hint}</span>
      </div>

      <div className="picker__field">
        <input
          id={`${listId}-input`}
          className="picker__input"
          type="text"
          role="combobox"
          autoComplete="off"
          spellCheck={false}
          aria-expanded={isOpen}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={isOpen && results[activeIndex] ? optionId(activeIndex) : undefined}
          aria-describedby={`${listId}-status`}
          placeholder={value.family}
          value={isOpen ? query : value.family}
          onFocus={() => setIsOpen(true)}
          onChange={(event) => {
            setQuery(event.target.value);
            setIsOpen(true);
          }}
          onKeyDown={onKeyDown}
        />
        <span
          className="picker__spinner"
          data-visible={isLoading ? "true" : "false"}
          aria-hidden="true"
        />
      </div>

      {isOpen && (
        <ul className="picker__list" id={listId} role="listbox" aria-label={label}>
          {results.length === 0 && (
            <li className="picker__empty" role="presentation">
              No family matches &ldquo;{query.trim()}&rdquo;. Try a shorter search.
            </li>
          )}

          {results.map((font, index) => (
            <li
              key={font.family}
              id={optionId(index)}
              className="picker__option"
              role="option"
              aria-selected={index === activeIndex}
              data-active={index === activeIndex}
              // pointerdown, not click: the input's blur would otherwise close
              // the list before the click ever lands on the option.
              onPointerDown={(event) => {
                event.preventDefault();
                commit(font);
              }}
              onPointerEnter={() => setActiveIndex(index)}
            >
              <span className="picker__option-name">{font.family}</span>
              <span className="picker__option-meta">
                {font.category} · {font.weights.length}{" "}
                {font.weights.length === 1 ? "weight" : "weights"}
              </span>
            </li>
          ))}
        </ul>
      )}

      <p className="picker__status" id={`${listId}-status`} role="status">
        {error ? `${value.family} didn't load — showing a system fallback.` : ""}
      </p>
    </div>
  );
}
