"use client";

import { useState } from "react";
import Link from "next/link";
import { useDroppable } from "@dnd-kit/core";
import { type NoteTreeNode as NoteTreeNodeType } from "@/lib/db/schema";
import { SidebarDropIndicator } from "./sidebar-drop-indicator";
import { useDndDropState, useDndDragState } from "./sidebar-dnd-context";

/** Props for the SidebarTreeNode component. */
interface SidebarTreeNodeProps {
  /** The note tree node to render. */
  node: NoteTreeNodeType;
  /** Nesting depth for indentation (0 = root level). */
  depth: number;
  /** Callback to create a child note under this node. */
  onNewChild: (parentId: string) => void;
  /** Callback to set the emoji icon for this node. */
  onSetIcon: (noteId: string, icon: string | null) => void;
  /** Drag handle listeners from parent (provided by useDraggable). */
  dragHandleProps?: Record<string, unknown>;
}

/**
 * Renders a single node in the sidebar note tree with expand/collapse,
 * emoji icon, title link, add-child button, and drag-and-drop support.
 */
export function SidebarTreeNode({
  node,
  depth,
  onNewChild,
  onSetIcon,
}: SidebarTreeNodeProps) {
  const [expanded, setExpanded] = useState(true);
  const hasChildren = node.children.length > 0;
  const displayIcon = node.icon ?? "📄";

  const { setNodeRef } = useDroppable({ id: node.id });
  const dropState = useDndDropState();
  const dragState = useDndDragState();

  const isOver = dropState.overId === node.id;
  const isDragging = dragState.activeId === node.id;
  const isDropOnTarget = isOver && dropState.position === "on";

  /** Prompts the user for an emoji and updates the icon. */
  function handleIconClick() {
    const emoji = prompt("Enter an emoji icon (or leave empty to reset):");
    onSetIcon(node.id, emoji || null);
  }

  return (
    <div ref={setNodeRef} data-node-id={node.id}>
      {/* Drop indicator: before */}
      {isOver && dropState.position === "before" && (
        <SidebarDropIndicator position="before" />
      )}

      <div
        className={`
          group flex items-center gap-1 py-0.5 pr-2 text-sm text-zinc-700
          hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800 rounded-md
          ${isDragging ? "opacity-40" : ""}
          ${isDropOnTarget ? "ring-2 ring-blue-500 rounded-md" : ""}
        `}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
      >
        {/* Drag handle — visible on hover */}
        <button
          type="button"
          aria-label="Drag to reorder"
          data-testid={`drag-handle-${node.id}`}
          className="flex h-5 w-4 shrink-0 cursor-grab items-center justify-center rounded text-zinc-300 opacity-0 group-hover:opacity-100 hover:text-zinc-500 active:cursor-grabbing dark:text-zinc-600 dark:hover:text-zinc-400"
          onPointerDown={(e) => {
            // Allow default so @dnd-kit PointerSensor picks it up
            e.stopPropagation();
          }}
        >
          <svg
            width="10"
            height="14"
            viewBox="0 0 10 14"
            fill="currentColor"
            aria-hidden="true"
          >
            <circle cx="3" cy="2" r="1.2" />
            <circle cx="7" cy="2" r="1.2" />
            <circle cx="3" cy="7" r="1.2" />
            <circle cx="7" cy="7" r="1.2" />
            <circle cx="3" cy="12" r="1.2" />
            <circle cx="7" cy="12" r="1.2" />
          </svg>
        </button>

        {/* Expand / collapse toggle */}
        {hasChildren ? (
          <button
            type="button"
            aria-label="Toggle children"
            className="flex h-5 w-5 shrink-0 items-center justify-center rounded text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
            onClick={() => setExpanded((prev) => !prev)}
          >
            {expanded ? "▾" : "▸"}
          </button>
        ) : (
          <span className="h-5 w-5 shrink-0" />
        )}

        {/* Emoji icon button */}
        <button
          type="button"
          aria-label="Change icon"
          className="flex h-5 w-5 shrink-0 items-center justify-center rounded text-sm hover:bg-zinc-200 dark:hover:bg-zinc-700"
          onClick={handleIconClick}
        >
          {displayIcon}
        </button>

        {/* Title as navigation link */}
        <Link
          href={`/n/${node.id}/edit`}
          className="min-w-0 flex-1 truncate hover:underline"
        >
          {node.title || "Untitled"}
        </Link>

        {/* Add child button (visible on hover) */}
        <button
          type="button"
          aria-label="Add child note"
          className="ml-auto flex h-5 w-5 shrink-0 items-center justify-center rounded text-zinc-400 opacity-0 group-hover:opacity-100 hover:bg-zinc-200 hover:text-zinc-600 dark:hover:bg-zinc-700 dark:hover:text-zinc-200"
          onClick={() => onNewChild(node.id)}
        >
          +
        </button>
      </div>

      {/* Drop indicator: after */}
      {isOver && dropState.position === "after" && (
        <SidebarDropIndicator position="after" />
      )}

      {/* Recursively render children when expanded */}
      {hasChildren && expanded && (
        <div>
          {node.children.map((child) => (
            <SidebarTreeNode
              key={child.id}
              node={child}
              depth={depth + 1}
              onNewChild={onNewChild}
              onSetIcon={onSetIcon}
            />
          ))}
        </div>
      )}
    </div>
  );
}
