// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { IconButton } from "../icon-button";

/**
 * Mock emoji-mart/react: the real Picker uses browser APIs and heavy emoji
 * data that we don't need to exercise here. The mock exposes a simple
 * deterministic button for selecting an emoji.
 */
vi.mock("@emoji-mart/react", () => ({
  default: ({
    onEmojiSelect,
  }: {
    onEmojiSelect: (emoji: { native: string }) => void;
  }) => (
    <div data-testid="emoji-picker">
      <button
        type="button"
        onClick={() => onEmojiSelect({ native: "🎯" })}
      >
        Pick 🎯
      </button>
    </div>
  ),
}));

/** Mock the data module — the picker mock does not read it. */
vi.mock("@emoji-mart/data", () => ({ default: {} }));

describe("IconButton", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the provided icon", () => {
    render(<IconButton icon="🚀" onChange={vi.fn()} />);
    expect(screen.getByText("🚀")).toBeTruthy();
  });

  it("falls back to 📄 when icon is null", () => {
    render(<IconButton icon={null} onChange={vi.fn()} />);
    expect(screen.getByText("📄")).toBeTruthy();
  });

  it("does not render the picker before the button is clicked", () => {
    render(<IconButton icon={null} onChange={vi.fn()} />);
    expect(screen.queryByTestId("emoji-picker")).toBeNull();
  });

  it("opens the picker when the button is clicked", async () => {
    render(<IconButton icon={null} onChange={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: /change icon/i }));
    await waitFor(() =>
      expect(screen.getByTestId("emoji-picker")).toBeTruthy()
    );
  });

  it("calls onChange with the emoji's native string and closes the picker", async () => {
    const onChange = vi.fn();
    render(<IconButton icon={null} onChange={onChange} />);

    fireEvent.click(screen.getByRole("button", { name: /change icon/i }));
    await waitFor(() =>
      expect(screen.getByTestId("emoji-picker")).toBeTruthy()
    );

    fireEvent.click(screen.getByRole("button", { name: /pick 🎯/i }));
    expect(onChange).toHaveBeenCalledWith("🎯");

    await waitFor(() =>
      expect(screen.queryByTestId("emoji-picker")).toBeNull()
    );
  });

  it("calls onChange(null) when the remove button is clicked and closes", async () => {
    const onChange = vi.fn();
    render(<IconButton icon="🚀" onChange={onChange} />);

    fireEvent.click(screen.getByRole("button", { name: /change icon/i }));
    await waitFor(() =>
      expect(screen.getByTestId("emoji-picker")).toBeTruthy()
    );

    fireEvent.click(screen.getByRole("button", { name: /remove icon/i }));
    expect(onChange).toHaveBeenCalledWith(null);

    await waitFor(() =>
      expect(screen.queryByTestId("emoji-picker")).toBeNull()
    );
  });

  it("does not show remove button when icon is already null", async () => {
    render(<IconButton icon={null} onChange={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: /change icon/i }));
    await waitFor(() =>
      expect(screen.getByTestId("emoji-picker")).toBeTruthy()
    );
    expect(screen.queryByRole("button", { name: /remove icon/i })).toBeNull();
  });

  it("closes the picker when Escape is pressed", async () => {
    render(<IconButton icon={null} onChange={vi.fn()} />);

    fireEvent.click(screen.getByRole("button", { name: /change icon/i }));
    await waitFor(() =>
      expect(screen.getByTestId("emoji-picker")).toBeTruthy()
    );

    fireEvent.keyDown(document, { key: "Escape" });
    await waitFor(() =>
      expect(screen.queryByTestId("emoji-picker")).toBeNull()
    );
  });

  it("closes the picker when a click lands outside", async () => {
    render(
      <div>
        <IconButton icon={null} onChange={vi.fn()} />
        <button type="button" data-testid="outside">
          Outside
        </button>
      </div>
    );

    fireEvent.click(screen.getByRole("button", { name: /change icon/i }));
    await waitFor(() =>
      expect(screen.getByTestId("emoji-picker")).toBeTruthy()
    );

    fireEvent.mouseDown(screen.getByTestId("outside"));
    await waitFor(() =>
      expect(screen.queryByTestId("emoji-picker")).toBeNull()
    );
  });

  it("uses the supplied aria-label on the trigger button", () => {
    render(
      <IconButton icon={null} onChange={vi.fn()} ariaLabel="Pick note icon" />
    );
    expect(screen.getByRole("button", { name: /pick note icon/i })).toBeTruthy();
  });
});
