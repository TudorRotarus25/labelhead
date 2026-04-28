// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { Sidebar } from "../sidebar";
import { SidebarProvider } from "@/lib/components/sidebar-context";
import { type NoteTreeNode } from "@/lib/db/schema";

/** Wrap Sidebar in its required context for tests. */
function renderSidebar(tree: NoteTreeNode[]) {
  return render(
    <SidebarProvider>
      <Sidebar tree={tree} />
    </SidebarProvider>
  );
}

/** Mock server actions to avoid actual DB calls. */
vi.mock("@/app/actions/notes", () => ({
  createNote: vi.fn().mockResolvedValue({
    id: "new-note-id",
    title: "",
    content: [],
    parentId: null,
    icon: null,
    order: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  }),
  updateNote: vi.fn().mockResolvedValue(null),
  moveNote: vi.fn().mockResolvedValue(null),
}));

/** Mock next/navigation for useRouter. */
const mockPush = vi.fn();
const mockRefresh = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: vi.fn(() => ({
    push: mockPush,
    refresh: mockRefresh,
  })),
  usePathname: vi.fn(() => "/"),
}));

/** Factory for a minimal NoteTreeNode fixture. */
function makeNode(overrides: Partial<NoteTreeNode> = {}): NoteTreeNode {
  return {
    id: "00000000-0000-0000-0000-000000000001",
    title: "Test Note",
    content: [],
    parentId: null,
    icon: null,
    order: 0,
    createdAt: new Date("2025-01-01"),
    updatedAt: new Date("2025-01-01"),
    children: [],
    ...overrides,
  };
}

describe("Sidebar DnD integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders drag handles for each tree node", () => {
    const tree: NoteTreeNode[] = [
      makeNode({ id: "node-1", title: "Note One" }),
      makeNode({ id: "node-2", title: "Note Two" }),
    ];
    renderSidebar(tree);

    expect(screen.getByTestId("drag-handle-node-1")).toBeTruthy();
    expect(screen.getByTestId("drag-handle-node-2")).toBeTruthy();
  });

  it("renders drag handles with correct aria label", () => {
    const tree: NoteTreeNode[] = [
      makeNode({ id: "abc", title: "My Note" }),
    ];
    renderSidebar(tree);

    const handle = screen.getByTestId("drag-handle-abc");
    expect(handle.getAttribute("aria-label")).toBe("Drag to reorder");
  });

  it("renders data-node-id attributes on tree nodes", () => {
    const tree: NoteTreeNode[] = [
      makeNode({ id: "node-x", title: "Node X" }),
    ];
    renderSidebar(tree);

    const nodeEl = document.querySelector('[data-node-id="node-x"]');
    expect(nodeEl).toBeTruthy();
  });

  it("renders drag handles for nested children", () => {
    const tree: NoteTreeNode[] = [
      makeNode({
        id: "parent",
        title: "Parent",
        children: [
          makeNode({ id: "child", title: "Child", parentId: "parent" }),
        ],
      }),
    ];
    renderSidebar(tree);

    expect(screen.getByTestId("drag-handle-parent")).toBeTruthy();
    expect(screen.getByTestId("drag-handle-child")).toBeTruthy();
  });

  it("does not render drop indicators when not dragging", () => {
    const tree: NoteTreeNode[] = [
      makeNode({ id: "a", title: "Note A" }),
    ];
    renderSidebar(tree);

    expect(screen.queryByTestId("drop-indicator")).toBeNull();
  });

  it("still renders existing sidebar features alongside DnD", () => {
    const tree: NoteTreeNode[] = [
      makeNode({ id: "1", title: "My Note", icon: "🚀" }),
    ];
    renderSidebar(tree);

    // Title renders
    expect(screen.getByText("My Note")).toBeTruthy();
    // Icon renders
    expect(screen.getByText("🚀")).toBeTruthy();
    // Add child button renders
    expect(screen.getByRole("button", { name: /add child/i })).toBeTruthy();
    // New note button renders
    expect(screen.getByRole("button", { name: /new note/i })).toBeTruthy();
  });
});
