import { useEffect, useRef, useState } from "react";

export interface CopyLinkButtonProps {
  /** The URL to copy. */
  url: string;
  /** Injectable for tests; defaults to the async Clipboard API. */
  copy?: (text: string) => Promise<void>;
}

type CopyState = "idle" | "copied" | "failed";

/** How long the confirmation stays up — story 3.3 requires at least 1.5s. */
const CONFIRM_MS = 2000;

function defaultCopy(text: string): Promise<void> {
  if (typeof navigator === "undefined" || !navigator.clipboard) {
    return Promise.reject(new Error("Clipboard unavailable"));
  }
  return navigator.clipboard.writeText(text);
}

/**
 * Copy the shareable link, with a visible confirmation.
 *
 * The clipboard write genuinely fails in the wild — insecure origins, denied
 * permissions, older Safari — so a failure shows the URL to copy by hand
 * instead of a dead button that silently did nothing.
 */
export function CopyLinkButton({ url, copy = defaultCopy }: CopyLinkButtonProps) {
  const [state, setState] = useState<CopyState>("idle");
  const timer = useRef<ReturnType<typeof setTimeout>>();

  // Don't set state on an unmounted component if the tab closes mid-confirm.
  useEffect(() => () => clearTimeout(timer.current), []);

  async function onClick() {
    clearTimeout(timer.current);
    try {
      await copy(url);
      setState("copied");
    } catch {
      setState("failed");
    }
    timer.current = setTimeout(() => setState("idle"), CONFIRM_MS);
  }

  return (
    <div className="copy">
      <button
        type="button"
        className="btn btn--accent copy__btn"
        onClick={onClick}
        data-state={state}
      >
        <span className="copy__icon" aria-hidden="true" data-state={state} />
        {state === "copied" ? "Link copied" : state === "failed" ? "Press ⌘C" : "Copy link"}
      </button>

      <p className="copy__status" role="status" aria-live="polite">
        {state === "copied" && "Shareable link copied to your clipboard."}
        {state === "failed" && "Couldn't reach the clipboard — the link is selected below."}
      </p>

      {state === "failed" && (
        <input
          className="copy__fallback"
          readOnly
          value={url}
          aria-label="Shareable link — copy manually"
          onFocus={(event) => event.target.select()}
          ref={(node) => node?.select()}
        />
      )}
    </div>
  );
}
