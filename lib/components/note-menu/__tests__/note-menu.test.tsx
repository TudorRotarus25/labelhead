// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { NoteMenu } from "../note-menu";

describe("NoteMenu", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the trigger button but no menu items by default", () => {
    render(<NoteMenu onDelete={vi.fn()} />);
    expect(screen.getByRole("button", { name: /note actions/i })).toBeTruthy();
    expect(screen.queryByRole("menuitem", { name: /delete note/i })).toBeNull();
  });

  it("opens the menu when the trigger is clicked", () => {
    render(<NoteMenu onDelete={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: /note actions/i }));
    expect(screen.getByRole("menuitem", { name: /delete note/i })).toBeTruthy();
  });

  it("closes the menu when Escape is pressed", () => {
    render(<NoteMenu onDelete={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: /note actions/i }));
    expect(screen.getByRole("menuitem", { name: /delete note/i })).toBeTruthy();

    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("menuitem", { name: /delete note/i })).toBeNull();
  });

  it("closes the menu when clicking outside", () => {
    render(
      <div>
        <div data-testid="outside">outside</div>
        <NoteMenu onDelete={vi.fn()} />
      </div>
    );
    fireEvent.click(screen.getByRole("button", { name: /note actions/i }));
    expect(screen.getByRole("menuitem", { name: /delete note/i })).toBeTruthy();

    fireEvent.mouseDown(screen.getByTestId("outside"));
    expect(screen.queryByRole("menuitem", { name: /delete note/i })).toBeNull();
  });

  it("invokes onDelete and closes when the delete item is clicked", () => {
    const onDelete = vi.fn();
    render(<NoteMenu onDelete={onDelete} />);
    fireEvent.click(screen.getByRole("button", { name: /note actions/i }));

    fireEvent.click(screen.getByRole("menuitem", { name: /delete note/i }));

    expect(onDelete).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("menuitem", { name: /delete note/i })).toBeNull();
  });
});
