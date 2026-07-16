import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { App } from "./App";
import { FontLoaderProvider } from "./fonts/FontLoaderContext";
import type { FontLoader } from "./fonts/loader";
import { FAVORITES_KEY } from "./state/favorites";

/** Loads instantly and never touches the network. */
const okLoader: FontLoader = {
  load: (font) => Promise.resolve({ family: font.family, status: "loaded" as const }),
  loaded: () => [],
};

function renderApp(loader: FontLoader = okLoader) {
  return render(
    <FontLoaderProvider value={loader}>
      <App />
    </FontLoaderProvider>,
  );
}

function setUrl(search: string) {
  window.history.replaceState(null, "", `/typematch/${search}`);
}

beforeEach(() => {
  window.localStorage.clear();
  setUrl("");
});

describe("App", () => {
  it("renders the wordmark, the pickers, and the live preview", async () => {
    renderApp();

    expect(screen.getByRole("heading", { level: 1, name: /typematch/i })).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: /display font/i })).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: /ui font/i })).toBeInTheDocument();
    expect(await screen.findByTestId("preview")).toBeInTheDocument();
  });

  it("starts on the default pairing", async () => {
    renderApp();

    await waitFor(() =>
      expect(screen.getByTestId("preview").style.getPropertyValue("--preview-display")).toContain(
        "Fraunces",
      ),
    );
    expect(screen.getByTestId("preview").style.getPropertyValue("--preview-ui")).toContain("Inter");
  });

  it("restores a pairing from a shared link", async () => {
    setUrl("?display=Playfair+Display&ui=Work+Sans&theme=dark");
    renderApp();

    const preview = await screen.findByTestId("preview");

    await waitFor(() =>
      expect(preview.style.getPropertyValue("--preview-display")).toContain("Playfair Display"),
    );
    expect(preview.style.getPropertyValue("--preview-ui")).toContain("Work Sans");
    expect(preview.dataset.theme).toBe("dark");
  });

  it("searches and applies a font, re-rendering the whole mock", async () => {
    const user = userEvent.setup();
    renderApp();

    await user.click(screen.getByRole("combobox", { name: /display font/i }));
    await user.keyboard("lora");
    await user.click(await screen.findByRole("option", { name: /Lora/ }));

    await waitFor(() =>
      expect(screen.getByTestId("preview").style.getPropertyValue("--preview-display")).toContain(
        "Lora",
      ),
    );
  });

  it("filters the option list by substring as the user types", async () => {
    const user = userEvent.setup();
    renderApp();

    await user.click(screen.getByRole("combobox", { name: /ui font/i }));
    await user.keyboard("mono");

    const options = await screen.findAllByRole("option");
    for (const option of options) {
      expect(option.textContent?.toLowerCase()).toContain("mono");
    }
  });

  it("shows a designed empty state when a search matches nothing", async () => {
    const user = userEvent.setup();
    renderApp();

    await user.click(screen.getByRole("combobox", { name: /display font/i }));
    await user.keyboard("zzzznotafont");

    expect(screen.queryAllByRole("option")).toHaveLength(0);
    expect(screen.getByText(/no family matches/i)).toBeInTheDocument();
  });

  it("selects a font by keyboard alone", async () => {
    const user = userEvent.setup();
    renderApp();

    await user.tab();
    await user.tab();
    await user.keyboard("lora{ArrowDown}{Enter}");

    await waitFor(() =>
      expect(screen.getByTestId("preview").style.getPropertyValue("--preview-display")).toContain(
        "Lora",
      ),
    );
  });

  it("reverts the search box on Escape without changing the pairing", async () => {
    const user = userEvent.setup();
    renderApp();

    const picker = screen.getByRole("combobox", { name: /display font/i });
    await user.click(picker);
    await user.keyboard("lora{Escape}");

    expect(picker).toHaveValue("Fraunces");
    expect(screen.getByTestId("preview").style.getPropertyValue("--preview-display")).toContain(
      "Fraunces",
    );
  });

  it("mirrors the selected pairing into the URL for sharing", async () => {
    const user = userEvent.setup();
    renderApp();

    await user.click(screen.getByRole("combobox", { name: /display font/i }));
    await user.keyboard("lora");
    await user.click(await screen.findByRole("option", { name: /Lora/ }));

    await waitFor(() => expect(window.location.search).toContain("display=Lora"));
    // The app's own path must survive, or a subpath deploy breaks.
    expect(window.location.pathname).toBe("/typematch/");
  });

  it("re-themes the preview when the theme toggles", async () => {
    const user = userEvent.setup();
    renderApp();

    await user.click(screen.getByRole("radio", { name: /dark/i }));

    await waitFor(() => expect(screen.getByTestId("preview").dataset.theme).toBe("dark"));
    expect(window.location.search).toContain("theme=dark");
  });

  it("persists the theme across a full reload", async () => {
    const user = userEvent.setup();
    const { unmount } = renderApp();

    await user.click(screen.getByRole("radio", { name: /dark/i }));
    await waitFor(() => expect(screen.getByTestId("preview").dataset.theme).toBe("dark"));

    // Reload from a bare URL: the preference, not the query string, must carry it.
    unmount();
    setUrl("");
    renderApp();

    expect((await screen.findByTestId("preview")).dataset.theme).toBe("dark");
  });

  it("lets a shared link's theme win over the visitor's saved preference", async () => {
    const user = userEvent.setup();
    const { unmount } = renderApp();

    await user.click(screen.getByRole("radio", { name: /dark/i }));
    unmount();

    // The sender picked light deliberately for this pairing.
    setUrl("?display=Lora&ui=Inter&theme=light");
    renderApp();

    expect((await screen.findByTestId("preview")).dataset.theme).toBe("light");
  });

  it("shows the readability score with its factor breakdown", async () => {
    renderApp();

    const score = await screen.findByRole("region", { name: /readability score/i });

    expect(within(score).getByText(/\/100/)).toBeInTheDocument();
    expect(within(score).getByText(/text contrast/i)).toBeInTheDocument();
    expect(within(score).getByRole("status")).toHaveTextContent(
      /readability score \d+ out of 100/i,
    );
  });

  it("saves a pairing and restores it after a full reload", async () => {
    const user = userEvent.setup();
    const { unmount } = renderApp();

    await user.click(screen.getByRole("button", { name: /save this pairing/i }));
    expect(screen.getByRole("button", { name: /already saved/i })).toBeDisabled();

    // Simulate a reload: tear the tree down and mount a fresh one.
    unmount();
    renderApp();

    expect(
      await screen.findByRole("button", { name: /apply fraunces with inter/i }),
    ).toBeInTheDocument();
  });

  it("removes a favorite from the list and from storage immediately", async () => {
    const user = userEvent.setup();
    renderApp();

    await user.click(screen.getByRole("button", { name: /save this pairing/i }));
    await user.click(await screen.findByRole("button", { name: /remove fraunces with inter/i }));

    expect(screen.queryByRole("button", { name: /apply fraunces/i })).not.toBeInTheDocument();
    expect(JSON.parse(window.localStorage.getItem(FAVORITES_KEY)!)).toEqual([]);
    expect(screen.getByText(/nothing saved yet/i)).toBeInTheDocument();
  });

  it("applies a saved pairing when it's clicked", async () => {
    const user = userEvent.setup();
    renderApp();

    // Save a non-default pairing, switch away, then click it back.
    await user.click(screen.getByRole("combobox", { name: /display font/i }));
    await user.keyboard("lora");
    await user.click(await screen.findByRole("option", { name: /Lora/ }));
    await user.click(screen.getByRole("button", { name: /save this pairing/i }));

    await user.click(screen.getByRole("combobox", { name: /display font/i }));
    await user.keyboard("bitter");
    await user.click(await screen.findByRole("option", { name: /Bitter/ }));

    await user.click(screen.getByRole("button", { name: /apply lora with inter/i }));

    await waitFor(() =>
      expect(screen.getByTestId("preview").style.getPropertyValue("--preview-display")).toContain(
        "Lora",
      ),
    );
  });

  it("shows a designed empty state when nothing is saved", () => {
    renderApp();
    expect(screen.getByText(/nothing saved yet/i)).toBeInTheDocument();
  });

  it("falls back to a system stack and explains itself when a font fails", async () => {
    const failing: FontLoader = {
      load: (font) =>
        Promise.resolve({ family: font.family, status: "error" as const, error: "network down" }),
      loaded: () => [],
    };
    renderApp(failing);

    // Degraded, not blank: the mock still renders and the tool says why.
    expect(await screen.findByTestId("preview")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 1, name: /typematch/i })).toBeInTheDocument();
    await waitFor(() => expect(screen.getAllByText(/didn't load/i).length).toBeGreaterThan(0));
    expect(screen.getByTestId("preview").style.getPropertyValue("--preview-display")).not.toContain(
      "Fraunces",
    );
  });

  it("keeps a broken saved record from taking the app down", async () => {
    window.localStorage.setItem(FAVORITES_KEY, "{not json at all");

    renderApp();

    expect(await screen.findByTestId("preview")).toBeInTheDocument();
    expect(screen.getByText(/nothing saved yet/i)).toBeInTheDocument();
  });

  /** Click "Copy link" and read back what actually reached the clipboard. */
  async function copiedUrl(user: ReturnType<typeof userEvent.setup>): Promise<string> {
    await user.click(screen.getByRole("button", { name: /copy link/i }));
    await screen.findByText(/copied to your clipboard/i);
    return navigator.clipboard.readText();
  }

  it("shares the pairing that is on screen right now", async () => {
    const user = userEvent.setup();
    renderApp();
    await screen.findByTestId("preview");

    // A theme flip changes the pairing without loading a font, so nothing else
    // re-renders afterwards to paper over a stale link.
    await user.click(screen.getByRole("radio", { name: /dark/i }));
    await waitFor(() => expect(screen.getByTestId("preview").dataset.theme).toBe("dark"));

    expect(await copiedUrl(user)).toContain("theme=dark");
  });

  it("shares a full pairing link on first load, before anything is touched", async () => {
    const user = userEvent.setup();
    renderApp();
    await screen.findByTestId("preview");

    const url = await copiedUrl(user);
    expect(url).toContain("display=Fraunces");
    expect(url).toContain("ui=Inter");
  });
});
