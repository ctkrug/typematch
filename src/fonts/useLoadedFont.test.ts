import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { FontLoader, FontLoadResult } from "./loader";
import { fallbackStack, fontStack } from "./stack";
import type { FontFamily } from "./types";
import { useLoadedFont } from "./useLoadedFont";

const INTER: FontFamily = { family: "Inter", category: "sans-serif", weights: [400] };
const LORA: FontFamily = { family: "Lora", category: "serif", weights: [400] };

/** A loader whose every load is resolved by hand, so races are deterministic. */
function deferredLoader() {
  const pending: Array<(result: FontLoadResult) => void> = [];
  const loader: FontLoader = {
    load: () => new Promise<FontLoadResult>((resolve) => pending.push(resolve)),
    loaded: () => [],
  };
  return {
    loader,
    async settle(index: number, result: FontLoadResult) {
      await act(async () => {
        pending[index](result);
      });
    },
    get count() {
      return pending.length;
    },
  };
}

function instantLoader(result: (font: FontFamily) => FontLoadResult): FontLoader {
  return { load: (font) => Promise.resolve(result(font)), loaded: () => [] };
}

describe("useLoadedFont", () => {
  it("applies the loaded family's stack once its face resolves", async () => {
    const loader = instantLoader((font) => ({ family: font.family, status: "loaded" }));
    const { result } = renderHook(() => useLoadedFont(INTER, loader));

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.stack).toBe(fontStack(INTER));
    expect(result.current.error).toBeNull();
  });

  it("keeps painting the previous family while the next one loads", async () => {
    const deferred = deferredLoader();
    const { result, rerender } = renderHook(({ font }) => useLoadedFont(font, deferred.loader), {
      initialProps: { font: INTER },
    });
    await deferred.settle(0, { family: "Inter", status: "loaded" });

    rerender({ font: LORA });

    // Lora is in flight: Inter must still be the painted stack, not a fallback.
    expect(result.current.isLoading).toBe(true);
    expect(result.current.font).toEqual(INTER);
    expect(result.current.stack).toBe(fontStack(INTER));

    await deferred.settle(1, { family: "Lora", status: "loaded" });

    expect(result.current.font).toEqual(LORA);
    expect(result.current.stack).toBe(fontStack(LORA));
    expect(result.current.isLoading).toBe(false);
  });

  it("falls back to the system stack and reports the error when a load fails", async () => {
    const loader = instantLoader((font) => ({
      family: font.family,
      status: "error",
      error: "network down",
    }));
    const { result } = renderHook(() => useLoadedFont(LORA, loader));

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.stack).toBe(fallbackStack(LORA));
    expect(result.current.error).toBe("network down");
  });

  it("still surfaces a message when a failed load gives no reason", async () => {
    const loader = instantLoader((font) => ({ family: font.family, status: "error" }));
    const { result } = renderHook(() => useLoadedFont(LORA, loader));

    await waitFor(() => expect(result.current.error).toBeTruthy());
  });

  it("clears a previous error once a later font loads cleanly", async () => {
    const deferred = deferredLoader();
    const { result, rerender } = renderHook(({ font }) => useLoadedFont(font, deferred.loader), {
      initialProps: { font: LORA },
    });
    await deferred.settle(0, { family: "Lora", status: "error", error: "network down" });
    expect(result.current.error).toBe("network down");

    rerender({ font: INTER });
    await deferred.settle(1, { family: "Inter", status: "loaded" });

    expect(result.current.error).toBeNull();
  });

  it("ignores a stale load that resolves after a newer selection", async () => {
    const deferred = deferredLoader();
    const { result, rerender } = renderHook(({ font }) => useLoadedFont(font, deferred.loader), {
      initialProps: { font: INTER },
    });

    rerender({ font: LORA });
    await deferred.settle(1, { family: "Lora", status: "loaded" });
    // Inter's load lands late — it must not clobber the newer Lora selection.
    await deferred.settle(0, { family: "Inter", status: "loaded" });

    expect(result.current.font).toEqual(LORA);
    expect(result.current.stack).toBe(fontStack(LORA));
  });
});
