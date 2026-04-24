# Sidebar Tree Navigation (#5) + Read-Only Note View (#6)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a collapsible sidebar showing the note tree with emoji icons, and a lightweight read-only `/n/{uuid}` route for QR code scans.

**Architecture:** The root layout gains a sidebar + main content area. The sidebar is a client component fetching the tree via server action. The read-only view is a server component that renders BlockNote JSON as static HTML (no editor bundle). Both issues are independent and can be built in parallel after the shared layout task.

**Tech Stack:** Next.js 16 App Router, Tailwind CSS, BlockNote (editable=false for read-only), native emoji input via `<input type="text">` popover.

---

## File Structure

### New Files
- `lib/components/sidebar/sidebar.tsx` — Client component: tree rendering, expand/collapse, new note actions
- `lib/components/sidebar/sidebar-tree-node.tsx` — Recursive tree node with emoji icon + expand toggle
- `lib/components/sidebar/emoji-picker.tsx` — Simple emoji grid popover
- `lib/components/sidebar/__tests__/sidebar.test.tsx` — Sidebar tests
- `app/n/[id]/page.tsx` — Read-only note view (server component)
- `app/n/[id]/read-only-content.tsx` — Client component: BlockNoteView with editable=false
- `app/n/[id]/__tests__/read-only.test.tsx` — Read-only view tests
- `app/not-found.tsx` — Global 404 page

### Modified Files
- `app/layout.tsx` — Add sidebar to root layout
- `app/page.tsx` — Replace default template with welcome/empty state
- `app/actions/notes.ts` — Add `getChildren(parentId)` action
- `data/notes.ts` — Add `getChildren(parentId)` query

---

## Task 1: Add `getChildren` to Data Layer

**Files:**
- Modify: `data/notes.ts`
- Modify: `data/__tests__/notes.test.ts`

- [ ] **Step 1: Write failing test**

Add to `data/__tests__/notes.test.ts` inside the existing describe block:

```ts
describe("getChildren", () => {
  it("should return direct children ordered by order field", async () => {
    const parent = await createNote({ title: "Parent" }, testDb);
    await createNote({ title: "Second", parentId: parent.id, order: 1 }, testDb);
    await createNote({ title: "First", parentId: parent.id, order: 0 }, testDb);
    await createNote({ title: "Unrelated" }, testDb);

    const children = await getChildren(parent.id, testDb);

    expect(children).toHaveLength(2);
    expect(children[0].title).toBe("First");
    expect(children[1].title).toBe("Second");
  });

  it("should return empty array when no children exist", async () => {
    const note = await createNote({ title: "Lonely" }, testDb);
    const children = await getChildren(note.id, testDb);
    expect(children).toHaveLength(0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test:run data/__tests__/notes.test.ts`
Expected: FAIL — `getChildren is not a function`

- [ ] **Step 3: Implement getChildren**

Add to `data/notes.ts`:

```ts
/**
 * Fetches direct children of a note, ordered by the order field.
 * @param parentId - The parent note's UUID.
 * @param dbInstance - Database instance (defaults to production singleton).
 * @returns Array of child notes.
 */
export async function getChildren(
  parentId: string,
  dbInstance: Database = defaultDb
): Promise<Note[]> {
  return dbInstance
    .select()
    .from(notes)
    .where(eq(notes.parentId, parentId))
    .orderBy(asc(notes.order));
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test:run data/__tests__/notes.test.ts`
Expected: PASS

- [ ] **Step 5: Add server action**

Add to `app/actions/notes.ts`:

```ts
import { getChildren as dalGetChildren } from "@/data/notes";

/**
 * Server action: fetches direct children of a note.
 * @param parentId - The parent note's UUID.
 * @returns Array of child notes ordered by order field.
 */
export async function getChildren(parentId: string): Promise<Note[]> {
  return dalGetChildren(parentId);
}
```

- [ ] **Step 6: Commit**

```bash
git add data/notes.ts data/__tests__/notes.test.ts app/actions/notes.ts
git commit -m "feat: add getChildren query for child note listing (#5, #6)"
```

---

## Task 2: Root Layout with Sidebar Shell

**Files:**
- Modify: `app/layout.tsx`
- Create: `lib/components/sidebar/sidebar.tsx`
- Create: `lib/components/sidebar/sidebar-tree-node.tsx`
- Create: `lib/components/sidebar/__tests__/sidebar.test.tsx`
- Modify: `app/page.tsx`

- [ ] **Step 1: Write failing sidebar test**

Create `lib/components/sidebar/__tests__/sidebar.test.tsx`:

```tsx
// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("@/app/actions/notes", () => ({
  getNoteTree: vi.fn().mockResolvedValue([]),
  createNote: vi.fn().mockResolvedValue({ id: "new-id", title: "", icon: null }),
}));

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(() => ({ push: vi.fn(), refresh: vi.fn() })),
  usePathname: vi.fn(() => "/"),
}));

import Sidebar from "../sidebar";

describe("Sidebar", () => {
  it("renders the new note button", async () => {
    render(<Sidebar tree={[]} />);
    expect(screen.getByRole("button", { name: /new note/i })).toBeTruthy();
  });

  it("renders note titles from tree data", () => {
    const tree = [
      {
        id: "1", title: "Groceries", icon: "🛒", parentId: null,
        order: 0, content: [], createdAt: new Date(), updatedAt: new Date(),
        children: [],
      },
    ];
    render(<Sidebar tree={tree} />);
    expect(screen.getByText("Groceries")).toBeTruthy();
  });

  it("renders emoji icons next to titles", () => {
    const tree = [
      {
        id: "1", title: "Groceries", icon: "🛒", parentId: null,
        order: 0, content: [], createdAt: new Date(), updatedAt: new Date(),
        children: [],
      },
    ];
    render(<Sidebar tree={tree} />);
    expect(screen.getByText("🛒")).toBeTruthy();
  });

  it("renders children when node is expanded", async () => {
    const tree = [
      {
        id: "1", title: "Parent", icon: null, parentId: null,
        order: 0, content: [], createdAt: new Date(), updatedAt: new Date(),
        children: [
          {
            id: "2", title: "Child", icon: null, parentId: "1",
            order: 0, content: [], createdAt: new Date(), updatedAt: new Date(),
            children: [],
          },
        ],
      },
    ];
    render(<Sidebar tree={tree} />);
    // Nodes with children start expanded
    expect(screen.getByText("Child")).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test:run lib/components/sidebar/__tests__/sidebar.test.tsx`
Expected: FAIL — module not found

- [ ] **Step 3: Create SidebarTreeNode component**

Create `lib/components/sidebar/sidebar-tree-node.tsx`:

```tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { type NoteTreeNode } from "@/lib/db/schema";

/**
 * Recursive tree node for the sidebar. Shows emoji icon, title,
 * expand/collapse toggle for nodes with children, and a "new child" button.
 */
export default function SidebarTreeNode({
  node,
  depth,
  onNewChild,
  onSetIcon,
}: {
  node: NoteTreeNode;
  depth: number;
  onNewChild: (parentId: string) => void;
  onSetIcon: (noteId: string, icon: string | null) => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const hasChildren = node.children.length > 0;

  return (
    <li>
      <div
        className="group flex items-center gap-1 rounded px-2 py-1 hover:bg-zinc-100 dark:hover:bg-zinc-800"
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
      >
        {/* Expand/collapse toggle */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex h-5 w-5 shrink-0 items-center justify-center rounded text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700"
          aria-label={expanded ? "Collapse" : "Expand"}
        >
          {hasChildren ? (expanded ? "▾" : "▸") : " "}
        </button>

        {/* Icon */}
        <button
          onClick={() => {
            const emoji = prompt("Enter an emoji icon (or leave empty to remove):");
            onSetIcon(node.id, emoji || null);
          }}
          className="flex h-5 w-5 shrink-0 items-center justify-center rounded text-sm hover:bg-zinc-200 dark:hover:bg-zinc-700"
          aria-label="Set icon"
        >
          {node.icon || "📄"}
        </button>

        {/* Title link */}
        <Link
          href={`/n/${node.id}/edit`}
          className="flex-1 truncate text-sm text-zinc-700 dark:text-zinc-300"
        >
          {node.title || "Untitled"}
        </Link>

        {/* New child button (visible on hover) */}
        <button
          onClick={() => onNewChild(node.id)}
          className="hidden h-5 w-5 shrink-0 items-center justify-center rounded text-zinc-400 hover:bg-zinc-200 group-hover:flex dark:hover:bg-zinc-700"
          aria-label="New child note"
        >
          +
        </button>
      </div>

      {/* Children */}
      {hasChildren && expanded && (
        <ul>
          {node.children.map((child) => (
            <SidebarTreeNode
              key={child.id}
              node={child}
              depth={depth + 1}
              onNewChild={onNewChild}
              onSetIcon={onSetIcon}
            />
          ))}
        </ul>
      )}
    </li>
  );
}
```

- [ ] **Step 4: Create Sidebar component**

Create `lib/components/sidebar/sidebar.tsx`:

```tsx
"use client";

import { useRouter } from "next/navigation";
import { type NoteTreeNode } from "@/lib/db/schema";
import { createNote, updateNote } from "@/app/actions/notes";
import SidebarTreeNode from "./sidebar-tree-node";

/**
 * Left sidebar displaying all notes as a collapsible tree.
 * Receives the tree from the server layout and handles
 * create/icon actions via server actions.
 */
export default function Sidebar({ tree }: { tree: NoteTreeNode[] }) {
  const router = useRouter();

  async function handleNewNote(parentId?: string) {
    const note = await createNote(parentId ? { parentId } : {});
    router.push(`/n/${note.id}/edit`);
    router.refresh();
  }

  async function handleSetIcon(noteId: string, icon: string | null) {
    await updateNote(noteId, { icon });
    router.refresh();
  }

  return (
    <aside className="flex h-full w-60 shrink-0 flex-col border-r border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950">
      <div className="flex items-center justify-between border-b border-zinc-200 px-3 py-2 dark:border-zinc-800">
        <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
          LabelHead
        </span>
        <button
          onClick={() => handleNewNote()}
          className="rounded p-1 text-zinc-500 hover:bg-zinc-200 dark:hover:bg-zinc-700"
          aria-label="New note"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        </button>
      </div>
      <nav className="flex-1 overflow-y-auto py-2">
        {tree.length === 0 ? (
          <p className="px-3 py-4 text-center text-xs text-zinc-400">
            No notes yet. Create one to get started.
          </p>
        ) : (
          <ul>
            {tree.map((node) => (
              <SidebarTreeNode
                key={node.id}
                node={node}
                depth={0}
                onNewChild={(parentId) => handleNewNote(parentId)}
                onSetIcon={handleSetIcon}
              />
            ))}
          </ul>
        )}
      </nav>
    </aside>
  );
}
```

- [ ] **Step 5: Run sidebar test**

Run: `pnpm test:run lib/components/sidebar/__tests__/sidebar.test.tsx`
Expected: PASS

- [ ] **Step 6: Update root layout**

Replace `app/layout.tsx`:

```tsx
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Sidebar from "@/lib/components/sidebar/sidebar";
import { getNoteTree } from "@/data/notes";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "LabelHead",
  description: "QR code note-taking app",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const tree = await getNoteTree();

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex h-full">
        <Sidebar tree={tree} />
        <main className="flex-1 overflow-y-auto">{children}</main>
      </body>
    </html>
  );
}
```

- [ ] **Step 7: Update home page**

Replace `app/page.tsx`:

```tsx
/**
 * Home page — shown when no note is selected.
 * Prompts the user to select or create a note.
 */
export default function Home() {
  return (
    <div className="flex h-full items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-semibold text-zinc-800 dark:text-zinc-200">
          LabelHead
        </h1>
        <p className="mt-2 text-sm text-zinc-500">
          Select a note from the sidebar or create a new one.
        </p>
      </div>
    </div>
  );
}
```

- [ ] **Step 8: Run all tests**

Run: `pnpm test:run`
Expected: All tests PASS

- [ ] **Step 9: Commit**

```bash
git add app/layout.tsx app/page.tsx lib/components/sidebar/
git commit -m "feat: add sidebar tree navigation with emoji icons (#5)"
```

---

## Task 3: Mobile Sidebar Toggle

**Files:**
- Modify: `app/layout.tsx`
- Create: `lib/components/sidebar/sidebar-layout.tsx`

- [ ] **Step 1: Create SidebarLayout client wrapper**

Create `lib/components/sidebar/sidebar-layout.tsx`:

```tsx
"use client";

import { useState } from "react";
import { type NoteTreeNode } from "@/lib/db/schema";
import Sidebar from "./sidebar";

/**
 * Client wrapper that handles mobile sidebar toggle.
 * On desktop (md+), sidebar is always visible.
 * On mobile, it's toggled via a hamburger button.
 */
export default function SidebarLayout({
  tree,
  children,
}: {
  tree: NoteTreeNode[];
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex h-full">
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/30 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-40 transform transition-transform md:relative md:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <Sidebar tree={tree} />
      </div>

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-y-auto">
        {/* Mobile hamburger */}
        <button
          onClick={() => setOpen(true)}
          className="m-2 self-start rounded p-2 text-zinc-500 hover:bg-zinc-100 md:hidden dark:hover:bg-zinc-800"
          aria-label="Open sidebar"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
        </button>
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Update layout.tsx to use SidebarLayout**

Replace the `<body>` content in `app/layout.tsx`:

```tsx
import SidebarLayout from "@/lib/components/sidebar/sidebar-layout";

// ... (keep existing imports and metadata)

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const tree = await getNoteTree();

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="h-full">
        <SidebarLayout tree={tree}>{children}</SidebarLayout>
      </body>
    </html>
  );
}
```

- [ ] **Step 3: Run all tests**

Run: `pnpm test:run`
Expected: All PASS

- [ ] **Step 4: Commit**

```bash
git add app/layout.tsx lib/components/sidebar/sidebar-layout.tsx
git commit -m "feat: add mobile sidebar toggle with responsive layout (#5)"
```

---

## Task 4: Read-Only Note View

**Files:**
- Create: `app/n/[id]/page.tsx`
- Create: `app/n/[id]/read-only-content.tsx`
- Create: `app/n/[id]/__tests__/read-only.test.tsx`

- [ ] **Step 1: Write failing test**

Create `app/n/[id]/__tests__/read-only.test.tsx`:

```tsx
// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("@blocknote/react", () => ({
  useCreateBlockNote: vi.fn(() => ({
    document: [],
    onChange: vi.fn(),
  })),
}));

vi.mock("@blocknote/mantine", () => ({
  BlockNoteView: vi.fn(({ children }: { children?: React.ReactNode }) => (
    <div data-testid="blocknote-viewer">{children}</div>
  )),
}));

vi.mock("@blocknote/react/style.css", () => ({}));
vi.mock("@blocknote/mantine/style.css", () => ({}));

import ReadOnlyContent from "../read-only-content";

describe("ReadOnlyContent", () => {
  it("renders the BlockNote viewer", () => {
    render(<ReadOnlyContent content={[]} />);
    expect(screen.getByTestId("blocknote-viewer")).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test:run app/n/\\[id\\]/__tests__/read-only.test.tsx`
Expected: FAIL — module not found

- [ ] **Step 3: Create ReadOnlyContent client component**

Create `app/n/[id]/read-only-content.tsx`:

```tsx
"use client";

import "@blocknote/react/style.css";
import "@blocknote/mantine/style.css";

import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/mantine";
import { type Block } from "@blocknote/core";

/**
 * Renders BlockNote content in read-only mode.
 * Uses the editor with editable=false to avoid the full editing UI
 * while still rendering rich content correctly.
 */
export default function ReadOnlyContent({
  content,
}: {
  content: Record<string, unknown>[];
}) {
  const editor = useCreateBlockNote({
    initialContent: content.length > 0 ? (content as Block[]) : undefined,
  });

  return (
    <BlockNoteView
      editor={editor}
      editable={false}
      theme="light"
    />
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test:run app/n/\\[id\\]/__tests__/read-only.test.tsx`
Expected: PASS

- [ ] **Step 5: Create read-only page server component**

Create `app/n/[id]/page.tsx`:

```tsx
import Link from "next/link";
import { notFound } from "next/navigation";
import { getNote } from "@/data/notes";
import { getChildren } from "@/data/notes";
import ReadOnlyContent from "./read-only-content";

/**
 * Public read-only note view. This is the page users land on
 * when scanning a QR code. Renders note content without the
 * full editor, and lists child notes below.
 */
export default async function ReadOnlyNotePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const note = await getNote(id);

  if (!note) {
    notFound();
  }

  const children = await getChildren(id);

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <h1 className="flex items-center gap-2 text-2xl font-bold text-zinc-900 dark:text-zinc-100">
          {note.icon && <span>{note.icon}</span>}
          {note.title || "Untitled"}
        </h1>
        <Link
          href={`/n/${note.id}/edit`}
          className="rounded-md bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
        >
          Edit
        </Link>
      </div>

      {/* Content */}
      <div className="prose dark:prose-invert max-w-none">
        <ReadOnlyContent content={note.content ?? []} />
      </div>

      {/* Child notes */}
      {children.length > 0 && (
        <div className="mt-8 border-t border-zinc-200 pt-6 dark:border-zinc-700">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-500">
            Sub-notes
          </h2>
          <ul className="space-y-2">
            {children.map((child) => (
              <li key={child.id}>
                <Link
                  href={`/n/${child.id}`}
                  className="flex items-center gap-2 rounded-md border border-zinc-200 px-3 py-2 text-sm hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
                >
                  <span>{child.icon || "📄"}</span>
                  <span className="text-zinc-700 dark:text-zinc-300">
                    {child.title || "Untitled"}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 6: Run all tests**

Run: `pnpm test:run`
Expected: All PASS

- [ ] **Step 7: Commit**

```bash
git add app/n/[id]/page.tsx app/n/[id]/read-only-content.tsx app/n/[id]/__tests__/read-only.test.tsx
git commit -m "feat: add read-only note view for QR code scans (#6)"
```

---

## Task 5: Manual Verification

- [ ] **Step 1: Start dev server**

Run: `pnpm dev`

- [ ] **Step 2: Verify sidebar**
- Visit `http://localhost:3000` — sidebar should show on left with "LabelHead" header
- Click "+" to create a new note — should navigate to editor
- Type a title, see it in the sidebar
- Click the icon button (📄) to set an emoji
- Create a child note via "+" on hover
- Verify tree nesting and expand/collapse
- Resize browser to mobile width — sidebar should hide, hamburger should appear

- [ ] **Step 3: Verify read-only view**
- Visit `http://localhost:3000/n/{uuid}` for an existing note
- Content should render read-only (not editable)
- "Edit" button should link to `/n/{uuid}/edit`
- Child notes should be listed below content
- Clicking a child note should navigate to its read-only view
- Visit a non-existent UUID — should show 404

- [ ] **Step 4: Final commit if any fixes needed**

```bash
git add -A
git commit -m "fix: address issues found during manual verification (#5, #6)"
```
