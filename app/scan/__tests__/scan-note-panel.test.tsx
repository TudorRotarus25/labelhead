// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ScanNotePanel } from "../scan-note-panel";

describe("ScanNotePanel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("empty state", () => {
    it("shows the ready-to-scan message when state is idle", () => {
      render(
        <ScanNotePanel state="idle" note={null} onOpen={vi.fn()} onEdit={vi.fn()} />
      );
      expect(screen.getByTestId("scan-note-empty")).toBeTruthy();
      expect(screen.getByText(/ready to scan/i)).toBeTruthy();
    });

    it("does not render Open or Edit buttons", () => {
      render(
        <ScanNotePanel state="idle" note={null} onOpen={vi.fn()} onEdit={vi.fn()} />
      );
      expect(screen.queryByTestId("scan-note-open")).toBeNull();
      expect(screen.queryByTestId("scan-note-edit")).toBeNull();
    });
  });

  describe("loading state", () => {
    it("shows a loading skeleton while note data is being fetched", () => {
      render(
        <ScanNotePanel state="loading" note={null} onOpen={vi.fn()} onEdit={vi.fn()} />
      );
      expect(screen.getByTestId("scan-note-loading")).toBeTruthy();
    });
  });

  describe("loaded state", () => {
    const sampleNote = {
      id: "note-123",
      title: "Winter gear bin",
      icon: "📦",
      preview: "Snow chains, ice scraper, emergency blanket.",
    };

    it("shows the note icon, title, and preview", () => {
      render(
        <ScanNotePanel
          state="loaded"
          note={sampleNote}
          onOpen={vi.fn()}
          onEdit={vi.fn()}
        />
      );
      expect(screen.getByTestId("scan-note-icon").textContent).toBe("📦");
      expect(screen.getByTestId("scan-note-title").textContent).toBe(
        "Winter gear bin"
      );
      expect(screen.getByTestId("scan-note-preview").textContent).toContain(
        "Snow chains"
      );
    });

    it("falls back to 📄 when the note has no icon", () => {
      render(
        <ScanNotePanel
          state="loaded"
          note={{ ...sampleNote, icon: null }}
          onOpen={vi.fn()}
          onEdit={vi.fn()}
        />
      );
      expect(screen.getByTestId("scan-note-icon").textContent).toBe("📄");
    });

    it("falls back to Untitled when the note title is empty", () => {
      render(
        <ScanNotePanel
          state="loaded"
          note={{ ...sampleNote, title: "" }}
          onOpen={vi.fn()}
          onEdit={vi.fn()}
        />
      );
      expect(screen.getByTestId("scan-note-title").textContent).toBe(
        "Untitled"
      );
    });

    it("calls onOpen with the note id when Open is tapped", () => {
      const onOpen = vi.fn();
      render(
        <ScanNotePanel
          state="loaded"
          note={sampleNote}
          onOpen={onOpen}
          onEdit={vi.fn()}
        />
      );
      fireEvent.click(screen.getByTestId("scan-note-open"));
      expect(onOpen).toHaveBeenCalledWith("note-123");
    });

    it("calls onEdit with the note id when Edit is tapped", () => {
      const onEdit = vi.fn();
      render(
        <ScanNotePanel
          state="loaded"
          note={sampleNote}
          onOpen={vi.fn()}
          onEdit={onEdit}
        />
      );
      fireEvent.click(screen.getByTestId("scan-note-edit"));
      expect(onEdit).toHaveBeenCalledWith("note-123");
    });

    it("omits the preview element when preview is empty", () => {
      render(
        <ScanNotePanel
          state="loaded"
          note={{ ...sampleNote, preview: "" }}
          onOpen={vi.fn()}
          onEdit={vi.fn()}
        />
      );
      expect(screen.queryByTestId("scan-note-preview")).toBeNull();
    });
  });
});
