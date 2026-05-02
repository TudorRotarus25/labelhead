// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import NoteEditor from "../note-editor";
import { updateNote } from "@/app/actions/notes";
import { type Note } from "@/lib/db/schema";

/**
 * Mock the emoji-mart picker used by IconButton. The real Picker mounts a
 * custom element that depends on browser APIs jsdom does not provide.
 */
vi.mock("@emoji-mart/react", () => ({
  default: ({
    onEmojiSelect,
  }: {
    onEmojiSelect: (emoji: { native: string }) => void;
  }) => (
    <div data-testid="emoji-picker">
      <button type="button" onClick={() => onEmojiSelect({ native: "🎯" })}>
        Pick 🎯
      </button>
    </div>
  ),
}));
vi.mock("@emoji-mart/data", () => ({ default: {} }));

/**
 * Mocks for BlockNote packages. These require a real browser DOM with
 * contentEditable support that jsdom does not fully provide, so we stub
 * the editor hook and view component for smoke testing.
 */
vi.mock("@blocknote/react", () => ({
  useCreateBlockNote: vi.fn(() => ({
    document: [],
    onChange: vi.fn(),
  })),
}));

vi.mock("@blocknote/mantine", () => ({
  BlockNoteView: vi.fn(({ children }: { children?: React.ReactNode }) => (
    <div data-testid="blocknote-editor">{children}</div>
  )),
}));

/** Suppress CSS import side effects in test environment. */
vi.mock("@blocknote/react/style.css", () => ({}));
vi.mock("@blocknote/mantine/style.css", () => ({}));

/** Mock the server action to avoid actual DB calls. */
vi.mock("@/app/actions/notes", () => ({
  updateNote: vi.fn().mockResolvedValue(null),
}));

/** Factory for a minimal Note fixture. */
function makeNote(overrides: Partial<Note> = {}): Note {
  return {
    id: "00000000-0000-0000-0000-000000000001",
    title: "Test Note",
    content: [],
    parentId: null,
    icon: null,
    order: 0,
    createdAt: new Date("2025-01-01"),
    updatedAt: new Date("2025-01-01"),
    ...overrides,
  };
}

describe("NoteEditor", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("mounts without crashing", () => {
    const note = makeNote();
    const { container } = render(<NoteEditor note={note} />);
    expect(container).toBeTruthy();
  });

  it("renders title input with the note's title value", () => {
    const note = makeNote({ title: "My Important Note" });
    render(<NoteEditor note={note} />);
    const titleInput = screen.getByDisplayValue("My Important Note");
    expect(titleInput).toBeTruthy();
    expect(titleInput.tagName).toBe("INPUT");
  });

  it("renders the BlockNote editor view", () => {
    const note = makeNote();
    render(<NoteEditor note={note} />);
    expect(screen.getByTestId("blocknote-editor")).toBeTruthy();
  });

  it("renders the note icon when present", () => {
    const note = makeNote({ icon: "📝" });
    render(<NoteEditor note={note} />);
    expect(screen.getByText("📝")).toBeTruthy();
  });

  it("renders the default placeholder icon when the note has none", () => {
    const note = makeNote({ icon: null });
    render(<NoteEditor note={note} />);
    expect(screen.getByText("📄")).toBeTruthy();
  });

  it("saves the note immediately with the chosen icon when one is picked", async () => {
    const note = makeNote({ id: "note-1", icon: null });
    render(<NoteEditor note={note} />);

    fireEvent.click(screen.getByRole("button", { name: /change icon/i }));
    await waitFor(() =>
      expect(screen.getByTestId("emoji-picker")).toBeTruthy()
    );

    fireEvent.click(screen.getByRole("button", { name: /pick 🎯/i }));

    await waitFor(() =>
      expect(updateNote).toHaveBeenCalledWith("note-1", { icon: "🎯" })
    );
  });

  it("updates the displayed icon optimistically after a pick", async () => {
    const note = makeNote({ icon: null });
    render(<NoteEditor note={note} />);

    fireEvent.click(screen.getByRole("button", { name: /change icon/i }));
    await waitFor(() =>
      expect(screen.getByTestId("emoji-picker")).toBeTruthy()
    );

    fireEvent.click(screen.getByRole("button", { name: /pick 🎯/i }));

    await waitFor(() => expect(screen.getByText("🎯")).toBeTruthy());
  });

  it("renders placeholder text when title is empty", () => {
    const note = makeNote({ title: "" });
    render(<NoteEditor note={note} />);
    const titleInput = screen.getByPlaceholderText("Untitled");
    expect(titleInput).toBeTruthy();
  });
});
