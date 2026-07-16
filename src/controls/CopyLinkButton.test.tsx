import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { CopyLinkButton } from "./CopyLinkButton";

const URL = "https://example.com/typematch/?display=Lora&ui=Inter&theme=dark";

describe("CopyLinkButton", () => {
  it("copies the url it was given", async () => {
    const user = userEvent.setup();
    const copy = vi.fn().mockResolvedValue(undefined);
    render(<CopyLinkButton url={URL} copy={copy} />);

    await user.click(screen.getByRole("button", { name: /copy link/i }));

    expect(copy).toHaveBeenCalledWith(URL);
    expect(await screen.findByText(/copied to your clipboard/i)).toBeInTheDocument();
  });

  // Story 3.3: the confirmation has to stay up long enough to be seen (>=1.5s).
  // fireEvent + act rather than userEvent here: userEvent and testing-library's
  // polling both drive real timers, and deadlock against vi's fake ones.
  it("holds the confirmation up for at least 1.5s, then returns to idle", async () => {
    vi.useFakeTimers();
    try {
      render(<CopyLinkButton url={URL} copy={() => Promise.resolve()} />);

      await act(async () => {
        fireEvent.click(screen.getByRole("button", { name: /copy link/i }));
      });
      expect(screen.getByRole("button", { name: /link copied/i })).toBeInTheDocument();

      // Still up at 1.5s — the floor story 3.3 sets.
      await act(async () => {
        await vi.advanceTimersByTimeAsync(1500);
      });
      expect(screen.getByRole("button", { name: /link copied/i })).toBeInTheDocument();

      await act(async () => {
        await vi.advanceTimersByTimeAsync(600);
      });
      expect(screen.getByRole("button", { name: /copy link/i })).toBeInTheDocument();
      expect(screen.queryByRole("button", { name: /link copied/i })).not.toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });

  /**
   * The clipboard genuinely fails in the wild — insecure origins, denied
   * permissions, older Safari. A dead button that silently did nothing is the
   * one outcome that isn't acceptable.
   */
  it("offers the link to copy by hand when the clipboard refuses", async () => {
    const user = userEvent.setup();
    render(<CopyLinkButton url={URL} copy={() => Promise.reject(new Error("denied"))} />);

    await user.click(screen.getByRole("button", { name: /copy link/i }));

    expect(await screen.findByText(/couldn't reach the clipboard/i)).toBeInTheDocument();
    const fallback = screen.getByRole("textbox", { name: /shareable link/i });
    expect(fallback).toHaveValue(URL);
    expect(fallback).toHaveAttribute("readonly");
  });

  it("announces the outcome in a live region", async () => {
    const user = userEvent.setup();
    render(<CopyLinkButton url={URL} copy={() => Promise.resolve()} />);

    expect(screen.getByRole("status")).toHaveAttribute("aria-live", "polite");
    await user.click(screen.getByRole("button", { name: /copy link/i }));
    expect(screen.getByRole("status")).toHaveTextContent(/copied/i);
  });

  it("recovers when a retry succeeds after a failure", async () => {
    const user = userEvent.setup();
    const copy = vi
      .fn()
      .mockRejectedValueOnce(new Error("denied"))
      .mockResolvedValueOnce(undefined);
    render(<CopyLinkButton url={URL} copy={copy} />);

    const button = screen.getByRole("button");
    await user.click(button);
    expect(await screen.findByText(/couldn't reach the clipboard/i)).toBeInTheDocument();

    await user.click(button);
    expect(await screen.findByText(/copied to your clipboard/i)).toBeInTheDocument();
    expect(screen.queryByRole("textbox", { name: /shareable link/i })).not.toBeInTheDocument();
  });

  // Double-clicking a button that fires an async write must not wedge it.
  it("survives being double-clicked", async () => {
    const user = userEvent.setup();
    const copy = vi.fn().mockResolvedValue(undefined);
    render(<CopyLinkButton url={URL} copy={copy} />);

    await user.dblClick(screen.getByRole("button"));

    expect(copy).toHaveBeenCalledTimes(2);
    expect(await screen.findByText(/copied to your clipboard/i)).toBeInTheDocument();
  });
});
