import { act } from "react";
import { createRoot } from "react-dom/client";
import { describe, expect, it } from "vitest";
import { App } from "./App";

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

describe("App", () => {
  it("renders the split wordmark", () => {
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);

    act(() => {
      root.render(<App />);
    });

    expect(container.textContent).toContain("Type");
    expect(container.textContent).toContain("match");

    act(() => {
      root.unmount();
    });
    container.remove();
  });
});
