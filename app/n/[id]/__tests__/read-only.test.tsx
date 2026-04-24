// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import ReadOnlyContent from "../read-only-content";

/**
 * Mocks for BlockNote packages. jsdom lacks contentEditable support,
 * so we stub the editor hook and view component for unit testing.
 */
vi.mock("@blocknote/react", () => ({
  useCreateBlockNote: vi.fn(() => ({ document: [], onChange: vi.fn() })),
}));

vi.mock("@blocknote/mantine", () => ({
  BlockNoteView: vi.fn(({ children }: { children?: React.ReactNode }) => (
    <div data-testid="blocknote-viewer">{children}</div>
  )),
}));

/** Suppress CSS import side effects in test environment. */
vi.mock("@blocknote/react/style.css", () => ({}));
vi.mock("@blocknote/mantine/style.css", () => ({}));

describe("ReadOnlyContent", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the BlockNote viewer element", () => {
    render(<ReadOnlyContent content={[]} />);
    expect(screen.getByTestId("blocknote-viewer")).toBeTruthy();
  });
});
