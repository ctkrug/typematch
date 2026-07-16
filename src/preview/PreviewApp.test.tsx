import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PreviewApp } from "./PreviewApp";
import { PREVIEW_PALETTES } from "./theme";

const PROPS = {
  displayStack: '"Fraunces", Georgia, serif',
  uiStack: '"Inter", sans-serif',
  theme: "light" as const,
};

describe("PreviewApp", () => {
  it("renders a whole fake product, not a specimen sheet", () => {
    render(<PreviewApp {...PROPS} />);

    // The wow moment is that all four surfaces render at once.
    expect(screen.getByRole("navigation", { name: /meridian/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: /pricing/i })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: /sign-up form/i })).toBeInTheDocument();
  });

  it("exposes both font stacks to the mock as custom properties", () => {
    render(<PreviewApp {...PROPS} />);

    const preview = screen.getByTestId("preview");

    expect(preview.style.getPropertyValue("--preview-display")).toBe(PROPS.displayStack);
    expect(preview.style.getPropertyValue("--preview-ui")).toBe(PROPS.uiStack);
  });

  it("applies the palette for the selected theme", () => {
    render(<PreviewApp {...PROPS} theme="dark" />);

    const preview = screen.getByTestId("preview");

    expect(preview.dataset.theme).toBe("dark");
    expect(preview.style.getPropertyValue("--preview-bg")).toBe(PREVIEW_PALETTES.dark.bg);
    expect(preview.style.getPropertyValue("--preview-text")).toBe(PREVIEW_PALETTES.dark.text);
  });

  it("re-renders in the new pairing when a font changes", () => {
    const { rerender } = render(<PreviewApp {...PROPS} />);

    rerender(<PreviewApp {...PROPS} displayStack='"Lora", serif' />);

    expect(screen.getByTestId("preview").style.getPropertyValue("--preview-display")).toBe(
      '"Lora", serif',
    );
  });

  it("keeps the mock out of the tab order so the real controls come first", () => {
    const { container } = render(<PreviewApp {...PROPS} />);

    expect(
      container.querySelectorAll("button, a[href], input, select, textarea, [tabindex]"),
    ).toHaveLength(0);
  });

  it("renders dense small-size copy, where pairings actually fail", () => {
    render(<PreviewApp {...PROPS} />);

    expect(screen.getByText(/verification link/i)).toBeInTheDocument();
    expect(screen.getByText(/at least 8 characters/i)).toBeInTheDocument();
    expect(screen.getByText(/no credit card required/i)).toBeInTheDocument();
  });

  it("renders every pricing tier", () => {
    render(<PreviewApp {...PROPS} />);

    for (const tier of ["Starter", "Team", "Scale"]) {
      expect(screen.getByRole("heading", { name: tier, level: 3 })).toBeInTheDocument();
    }
  });
});
