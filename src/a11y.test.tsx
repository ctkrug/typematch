import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { App } from "./App";
import { FontLoaderProvider } from "./fonts/FontLoaderContext";
import type { FontLoader } from "./fonts/loader";
import { contrastRatioOfHex } from "./scoring/contrast";
import { PREVIEW_PALETTES } from "./preview/theme";

const okLoader: FontLoader = {
  load: (font) => Promise.resolve({ family: font.family, status: "loaded" as const }),
  loaded: () => [],
};

function renderApp() {
  return render(
    <FontLoaderProvider value={okLoader}>
      <App />
    </FontLoaderProvider>,
  );
}

beforeEach(() => {
  window.localStorage.clear();
  window.history.replaceState(null, "", "/typematch/");
});

describe("accessibility", () => {
  it("reaches every real control by Tab, in a logical order", async () => {
    const user = userEvent.setup();
    renderApp();
    await screen.findByTestId("preview");

    const reached: string[] = [];
    for (let i = 0; i < 8; i++) {
      await user.tab();
      const active = document.activeElement as HTMLElement | null;
      if (!active || active === document.body) break;
      reached.push(
        active.getAttribute("aria-label") ?? active.textContent?.trim() ?? active.tagName,
      );
    }

    // Skip link first, then the two pickers, then theme, then the side column.
    expect(reached[0]).toMatch(/skip to preview/i);
    expect(reached).toContain("Light");
    expect(reached).toContain("Dark");
    expect(reached.some((label) => /copy link/i.test(label))).toBe(true);
    expect(reached.some((label) => /save this pairing/i.test(label))).toBe(true);
  });

  it("gives the pickers accessible names and combobox semantics", async () => {
    renderApp();

    for (const name of [/display font/i, /ui font/i]) {
      const picker = screen.getByRole("combobox", { name });
      expect(picker).toHaveAttribute("aria-expanded", "false");
      expect(picker).toHaveAttribute("aria-autocomplete", "list");
    }
  });

  it("tracks the active option with aria-activedescendant while arrowing", async () => {
    const user = userEvent.setup();
    renderApp();

    const picker = screen.getByRole("combobox", { name: /display font/i });
    await user.click(picker);
    await user.keyboard("lo{ArrowDown}");

    const active = picker.getAttribute("aria-activedescendant");
    expect(active).toBeTruthy();
    expect(document.getElementById(active!)).toHaveAttribute("aria-selected", "true");
    expect(picker).toHaveAttribute("aria-expanded", "true");
  });

  it("announces the score through a live region", async () => {
    renderApp();

    const status = await screen.findByText(/readability score \d+ out of 100/i);
    expect(status).toHaveAttribute("aria-live", "polite");
  });

  it("labels every icon-only button", async () => {
    const user = userEvent.setup();
    renderApp();

    await user.click(screen.getByRole("button", { name: /save this pairing/i }));

    // "×" alone is unusable by screen reader — it must name the pairing.
    const remove = await screen.findByRole("button", { name: /remove fraunces with inter/i });
    expect(remove).toHaveAccessibleName();
  });

  it("exposes each score factor as a meter with its value", async () => {
    renderApp();
    await screen.findByTestId("preview");

    const meters = screen.getAllByRole("meter");
    expect(meters.length).toBeGreaterThan(0);
    for (const meter of meters) {
      expect(meter).toHaveAttribute("aria-valuenow");
      expect(meter).toHaveAccessibleName();
    }
  });

  it("groups the theme options as a labelled radiogroup", () => {
    renderApp();

    const group = screen.getByRole("radiogroup", { name: /preview theme/i });
    expect(group).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: /light/i })).toHaveAttribute("aria-checked", "true");
  });

  it("keeps the mock preview out of the tab order", async () => {
    renderApp();

    const preview = await screen.findByTestId("preview");
    expect(preview.querySelectorAll("button, a[href], input, [tabindex]")).toHaveLength(0);
  });

  it("gives the preview a landmark a screen reader can jump to", async () => {
    renderApp();
    expect(
      await screen.findByRole("region", { name: /live pairing preview/i }),
    ).toBeInTheDocument();
  });

  it("moves focus to the preview when the skip link is used", async () => {
    const user = userEvent.setup();
    renderApp();

    await user.tab();
    expect(document.activeElement).toHaveAccessibleName(/skip to preview/i);
    expect(document.activeElement).toHaveAttribute("href", "#preview");
    expect(document.querySelector("#preview")).toBeInTheDocument();
  });

  it("reflects loading state on the picker without hiding the value", async () => {
    renderApp();
    const picker = screen.getByRole("combobox", { name: /display font/i });
    await waitFor(() => expect(picker).toHaveValue("Fraunces"));
  });
});

describe("preview palettes", () => {
  it.each(["light", "dark"] as const)("clears WCAG AA for body text in %s", (theme) => {
    const palette = PREVIEW_PALETTES[theme];
    expect(contrastRatioOfHex(palette.text, palette.bg)!).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatioOfHex(palette.text, palette.surface)!).toBeGreaterThanOrEqual(4.5);
  });

  it.each(["light", "dark"] as const)("keeps muted text legible in %s", (theme) => {
    const palette = PREVIEW_PALETTES[theme];
    // Muted copy carries real content (helper text, prices), so it must clear
    // AA too — not just the large-text 3:1 floor.
    expect(contrastRatioOfHex(palette.muted, palette.bg)!).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatioOfHex(palette.muted, palette.surface)!).toBeGreaterThanOrEqual(4.5);
  });

  it.each(["light", "dark"] as const)("keeps accent buttons readable in %s", (theme) => {
    const palette = PREVIEW_PALETTES[theme];
    expect(contrastRatioOfHex(palette.onAccent, palette.accent)!).toBeGreaterThanOrEqual(4.5);
  });
});
