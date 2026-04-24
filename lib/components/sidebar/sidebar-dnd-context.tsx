"use client";

import { useState, useCallback, useRef, type ReactNode } from "react";
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
} from "@dnd-kit/core";
import { computeDropPosition } from "./dnd/compute-drop-position";
import { isDescendantOf } from "./dnd/is-descendant-of";
import { type FlattenedNode, type DropPosition } from "./dnd/types";

/** Props for the SidebarDndContext component. */
interface SidebarDndContextProps {
  /** The flattened tree used for ancestor checks and order computation. */
  flatNodes: FlattenedNode[];
  /** Callback invoked when a note is dropped at a new position. */
  onMoveNote: (id: string, newParentId: string | null, newOrder: number) => void;
  /** The tree content to render inside the DnD context. */
  children: ReactNode;
}

/** State exposed to children so tree nodes can render drop indicators. */
export interface DndDropState {
  /** The ID of the node currently being hovered over. */
  overId: string | null;
  /** Where the drop would land relative to the hovered node. */
  position: DropPosition | null;
}

/** State of the currently active drag. */
export interface DndDragState {
  /** The ID of the node being dragged. */
  activeId: string | null;
  /** Display label for the drag overlay. */
  activeTitle: string;
  /** Display icon for the drag overlay. */
  activeIcon: string;
}

/**
 * Wraps sidebar tree content in a @dnd-kit DndContext for drag-to-reparent.
 * Uses a PointerSensor with an 8px activation distance so clicks still work.
 * Renders a DragOverlay portal showing the dragged node's icon + title.
 */
export function SidebarDndContext({
  flatNodes,
  onMoveNote,
  children,
}: SidebarDndContextProps) {
  const [dragState, setDragState] = useState<DndDragState>({
    activeId: null,
    activeTitle: "",
    activeIcon: "📄",
  });
  const [dropState, setDropState] = useState<DndDropState>({
    overId: null,
    position: null,
  });

  const pointerSensor = useSensor(PointerSensor, {
    activationConstraint: { distance: 8 },
  });
  const sensors = useSensors(pointerSensor);

  /** Stores the latest pointer Y for computing drop position on dragEnd. */
  const lastPointerY = useRef(0);

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const id = String(event.active.id);
      const flatNode = flatNodes.find((n) => n.id === id);
      setDragState({
        activeId: id,
        activeTitle: flatNode?.node.title || "Untitled",
        activeIcon: flatNode?.node.icon ?? "📄",
      });
    },
    [flatNodes]
  );

  const handleDragOver = useCallback((event: DragOverEvent) => {
    const overId = event.over?.id ? String(event.over.id) : null;
    if (!overId || !event.over?.rect) {
      setDropState({ overId: null, position: null });
      return;
    }

    const rect = event.over.rect;
    const pointerY =
      (event.activatorEvent as PointerEvent)?.clientY ?? 0;
    // Use the delta to approximate current pointer position
    const currentY = pointerY + (event.delta?.y ?? 0);
    lastPointerY.current = currentY;

    const position = computeDropPosition(
      { top: rect.top, height: rect.height },
      currentY
    );
    setDropState({ overId, position });
  }, []);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const activeId = String(event.active.id);
      const overId = event.over?.id ? String(event.over.id) : null;

      setDragState({ activeId: null, activeTitle: "", activeIcon: "📄" });
      setDropState({ overId: null, position: null });

      if (!overId || activeId === overId) return;

      // Prevent dropping a node into its own descendant (circular ref)
      if (isDescendantOf(overId, activeId, flatNodes)) return;

      const overNode = flatNodes.find((n) => n.id === overId);
      if (!overNode) return;

      // Recompute position from the last known pointer Y
      let position: DropPosition = "on";
      if (event.over?.rect) {
        position = computeDropPosition(
          { top: event.over.rect.top, height: event.over.rect.height },
          lastPointerY.current
        );
      }

      let newParentId: string | null;
      let newOrder: number;

      if (position === "on") {
        // Reparent into the target node
        newParentId = overId;
        const childCount = flatNodes.filter((n) => n.parentId === overId).length;
        newOrder = childCount;
      } else {
        // Reorder as sibling
        newParentId = overNode.parentId;
        const siblings = flatNodes
          .filter((n) => n.parentId === overNode.parentId && n.id !== activeId)
          .sort((a, b) => a.index - b.index);
        const overIndex = siblings.findIndex((n) => n.id === overId);
        newOrder = position === "before" ? overIndex : overIndex + 1;
        if (newOrder < 0) newOrder = 0;
      }

      onMoveNote(activeId, newParentId, newOrder);
    },
    [flatNodes, onMoveNote]
  );

  const handleDragCancel = useCallback(() => {
    setDragState({ activeId: null, activeTitle: "", activeIcon: "📄" });
    setDropState({ overId: null, position: null });
  }, []);

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <DndDropStateContext.Provider value={dropState}>
        <DndDragStateContext.Provider value={dragState}>
          {children}
        </DndDragStateContext.Provider>
      </DndDropStateContext.Provider>

      <DragOverlay dropAnimation={null}>
        {dragState.activeId ? (
          <div className="flex items-center gap-1.5 rounded-md bg-white px-2 py-1 text-sm shadow-lg ring-1 ring-zinc-200 dark:bg-zinc-800 dark:ring-zinc-700">
            <span>{dragState.activeIcon}</span>
            <span className="truncate text-zinc-700 dark:text-zinc-300">
              {dragState.activeTitle}
            </span>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

import { createContext, useContext } from "react";

/** Context for the current drop state, consumed by tree nodes. */
const DndDropStateContext = createContext<DndDropState>({
  overId: null,
  position: null,
});

/** Context for the current drag state, consumed by tree nodes. */
const DndDragStateContext = createContext<DndDragState>({
  activeId: null,
  activeTitle: "",
  activeIcon: "📄",
});

/** Hook to read the current drop indicator state. */
export function useDndDropState(): DndDropState {
  return useContext(DndDropStateContext);
}

/** Hook to read the current drag state. */
export function useDndDragState(): DndDragState {
  return useContext(DndDragStateContext);
}
