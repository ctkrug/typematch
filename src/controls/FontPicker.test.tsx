import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { findFamily } from "../fonts/catalog";
import { FontPicker } from "./FontPicker";

const INTER = findFamily("Inter")!;

function renderPicker(props: Partial<React.ComponentProps<typeof FontPicker>> = {}) {
  const onChange = vi.fn();
  render(
    <FontPicker
      label="Display font"
      hint="Headings, wordmark, prices"
      value={INTER}
      onChange={onChange}
      {...props}
    />,
  );
  return { onChange, input: screen.getByRole("combobox", { name: /display font/i }) };
}

/**
 * A hand-built combobox rather than a <select>, so it owns the whole keyboard
 * contract itself — which means the contract has to be pinned here.
 */
describe("FontPicker keyboard contract", () => {
  it("opens the list on arrow down without selecting anything yet", async () => {
    const user = userEvent.setup();
    const { onChange, input } = renderPicker();

    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    input.focus();
    // Focus alone opens it; close it again to isolate the arrow.
    await user.keyboard("{Escape}");
    await user.keyboard("{ArrowDown}");

    expect(screen.getByRole("listbox")).toBeInTheDocument();
    expect(onChange).not.toHaveBeenCalled();
  });

  it("wraps from the first option to the last rather than dead-ending", async () => {
    const user = userEvent.setup();
    const { onChange, input } = renderPicker();

    await user.click(input);
    const last = screen
      .getAllByRole("option")
      .at(-1)!
      .querySelector(".picker__option-name")!.textContent;

    await user.keyboard("{ArrowUp}{Enter}");

    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ family: last }));
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("wraps from the last option back to the first", async () => {
    const user = userEvent.setup();
    const { onChange, input } = renderPicker();

    await user.click(input);
    const options = screen.getAllByRole("option");
    const first = options[0].querySelector(".picker__option-name")!.textContent;

    // All the way to the end, then one more step past it.
    await user.keyboard("{ArrowDown}".repeat(options.length - 1) + "{ArrowDown}{Enter}");

    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ family: first }));
  });

  it("commits the highlighted option on Enter", async () => {
    const user = userEvent.setup();
    const { onChange, input } = renderPicker();

    await user.click(input);
    await user.keyboard("lora");
    await user.keyboard("{Enter}");

    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ family: "Lora" }));
  });

  it("does nothing on Enter when no option matches", async () => {
    const user = userEvent.setup();
    const { onChange, input } = renderPicker();

    await user.click(input);
    await user.keyboard("zzzznotafont{Enter}");

    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByText(/no family matches/i)).toBeInTheDocument();
  });

  it("ignores arrow keys when nothing matches", async () => {
    const user = userEvent.setup();
    const { onChange, input } = renderPicker();

    await user.click(input);
    await user.keyboard("zzzznotafont{ArrowDown}{ArrowUp}{Enter}");

    expect(onChange).not.toHaveBeenCalled();
  });

  it("reverts the query on Escape and keeps showing the applied font", async () => {
    const user = userEvent.setup();
    const { onChange, input } = renderPicker();

    await user.click(input);
    await user.keyboard("lora{Escape}");

    expect(input).toHaveValue("Inter");
    expect(onChange).not.toHaveBeenCalled();
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("closes on Tab so the list can't swallow focus", async () => {
    const user = userEvent.setup();
    const { input } = renderPicker();

    await user.click(input);
    expect(screen.getByRole("listbox")).toBeInTheDocument();
    await user.tab();

    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });
});

describe("FontPicker status", () => {
  it("points aria-activedescendant at the highlighted option", async () => {
    const user = userEvent.setup();
    const { input } = renderPicker();

    await user.click(input);
    const active = input.getAttribute("aria-activedescendant");

    expect(active).toBeTruthy();
    expect(screen.getByRole("option", { selected: true })).toHaveAttribute("id", active);
  });

  it("reports a failed load in a live region rather than only in colour", () => {
    renderPicker({ error: "Timed out" });

    expect(screen.getByRole("status")).toHaveTextContent(/inter didn't load/i);
    expect(screen.getByRole("status")).toHaveTextContent(/system fallback/i);
  });

  it("stays quiet when the font is fine", () => {
    renderPicker();
    expect(screen.getByRole("status")).toHaveTextContent("");
  });

  it("marks the slot as loading while a face downloads", () => {
    const { input } = renderPicker({ isLoading: true });
    expect(input.closest(".picker")).toHaveAttribute("data-status", "loading");
  });

  it("lets an error outrank a still-loading state", () => {
    const { input } = renderPicker({ isLoading: true, error: "Timed out" });
    expect(input.closest(".picker")).toHaveAttribute("data-status", "error");
  });
});
