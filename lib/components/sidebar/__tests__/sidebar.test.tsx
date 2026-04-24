// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { Sidebar } from "../sidebar";
import { SidebarTreeNode } from "../sidebar-tree-node";
import { type NoteTreeNode } from "@/lib/db/schema";

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
}));

/** Mock next/navigation for useRouter and usePathname. */
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

describe("Sidebar", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the 'New note' button", () => {
    render(<Sidebar tree={[]} />);
    expect(screen.getByRole("button", { name: /new note/i })).toBeTruthy();
  });

  it("renders note titles from tree data", () => {
    const tree: NoteTreeNode[] = [
      makeNode({ id: "1", title: "First Note" }),
      makeNode({ id: "2", title: "Second Note" }),
    ];
    render(<Sidebar tree={tree} />);
    expect(screen.getByText("First Note")).toBeTruthy();
    expect(screen.getByText("Second Note")).toBeTruthy();
  });

  it("renders emoji icons next to titles", () => {
    const tree: NoteTreeNode[] = [
      makeNode({ id: "1", title: "Work", icon: "💼" }),
    ];
    render(<Sidebar tree={tree} />);
    expect(screen.getByText("💼")).toBeTruthy();
  });

  it("renders children when node has them (start expanded)", () => {
    const tree: NoteTreeNode[] = [
      makeNode({
        id: "parent",
        title: "Parent Note",
        children: [
          makeNode({ id: "child", title: "Child Note", parentId: "parent" }),
        ],
      }),
    ];
    render(<Sidebar tree={tree} />);
    expect(screen.getByText("Parent Note")).toBeTruthy();
    expect(screen.getByText("Child Note")).toBeTruthy();
  });

  it("shows empty state when no notes exist", () => {
    render(<Sidebar tree={[]} />);
    expect(screen.getByText(/no notes yet/i)).toBeTruthy();
  });

  it("renders the LabelHead header", () => {
    render(<Sidebar tree={[]} />);
    expect(screen.getByText("LabelHead")).toBeTruthy();
  });
});

describe("SidebarTreeNode", () => {
  const noop = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the node title as a link", () => {
    const node = makeNode({ id: "abc", title: "My Note" });
    render(
      <SidebarTreeNode
        node={node}
        depth={0}
        onNewChild={noop}
        onSetIcon={noop}
      />
    );
    const link = screen.getByRole("link", { name: /My Note/i });
    expect(link).toBeTruthy();
    expect(link.getAttribute("href")).toBe("/n/abc/edit");
  });

  it("renders default icon when node has no icon", () => {
    const node = makeNode({ icon: null });
    render(
      <SidebarTreeNode
        node={node}
        depth={0}
        onNewChild={noop}
        onSetIcon={noop}
      />
    );
    expect(screen.getByText("📄")).toBeTruthy();
  });

  it("renders custom icon when node has one", () => {
    const node = makeNode({ icon: "🚀" });
    render(
      <SidebarTreeNode
        node={node}
        depth={0}
        onNewChild={noop}
        onSetIcon={noop}
      />
    );
    expect(screen.getByText("🚀")).toBeTruthy();
  });

  it("renders expand toggle for nodes with children", () => {
    const node = makeNode({
      children: [makeNode({ id: "child", title: "Child" })],
    });
    render(
      <SidebarTreeNode
        node={node}
        depth={0}
        onNewChild={noop}
        onSetIcon={noop}
      />
    );
    expect(
      screen.getByRole("button", { name: /toggle/i })
    ).toBeTruthy();
  });

  it("does not render expand toggle for leaf nodes", () => {
    const node = makeNode({ children: [] });
    render(
      <SidebarTreeNode
        node={node}
        depth={0}
        onNewChild={noop}
        onSetIcon={noop}
      />
    );
    expect(screen.queryByRole("button", { name: /toggle/i })).toBeNull();
  });

  it("renders children expanded by default", () => {
    const node = makeNode({
      title: "Parent",
      children: [
        makeNode({ id: "child-1", title: "Child One" }),
      ],
    });
    render(
      <SidebarTreeNode
        node={node}
        depth={0}
        onNewChild={noop}
        onSetIcon={noop}
      />
    );
    expect(screen.getByText("Child One")).toBeTruthy();
  });
});
