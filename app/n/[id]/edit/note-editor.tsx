"use client";

import "@blocknote/react/style.css";
import "@blocknote/mantine/style.css";

import { useState, useCallback, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/mantine";
import { type Note } from "@/lib/db/schema";
import { updateNote, deleteNote } from "@/app/actions/notes";
import { IconButton } from "@/lib/components/icon-picker/icon-button";
import { NoteMenu } from "@/lib/components/note-menu/note-menu";
import { ConfirmDialog } from "@/lib/components/confirm-dialog/confirm-dialog";

/** Debounce delay in milliseconds before auto-saving. */
const DEBOUNCE_MS = 1000;

/** Duration to show "Saved" indicator before resetting to idle. */
const SAVED_DISPLAY_MS = 2000;

/** Save indicator states for the auto-save lifecycle. */
type SaveStatus = "idle" | "saving" | "saved";

/**
 * NoteEditor provides a rich-text editing experience using BlockNote.
 * It auto-saves the note title and content after a debounced delay,
 * with a visual save status indicator. The editor fills its parent's
 * height so clicks below the last block still focus the editor.
 *
 * @param props.note - The note to edit, fetched server-side.
 */
export default function NoteEditor({ note }: { note: Note }) {
  const router = useRouter();
  const [title, setTitle] = useState(note.title);
  const [icon, setIcon] = useState<string | null>(note.icon);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [confirmOpen, setConfirmOpen] = useState(false);

  /** Ref to hold the latest debounce timer so it can be cleared on new edits. */
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /** Ref to hold the "saved" display timer. */
  const savedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /** Ref to track the latest title for use in the editor onChange callback. */
  const titleRef = useRef(title);
  useEffect(() => {
    titleRef.current = title;
  }, [title]);

  /** Cast JSONB content to BlockNote's expected PartialBlock[] format. */
  const editor = useCreateBlockNote({
    initialContent:
      note.content && note.content.length > 0
        ? (note.content as NonNullable<
            Parameters<typeof useCreateBlockNote>[0]
          >["initialContent"])
        : undefined,
  });

  /**
   * Persists the current title and editor content to the server.
   * Manages the save status indicator lifecycle: idle -> saving -> saved -> idle.
   */
  const save = useCallback(
    async (currentTitle: string) => {
      setSaveStatus("saving");

      try {
        await updateNote(note.id, {
          title: currentTitle,
          content: editor.document as Record<string, unknown>[],
        });
        setSaveStatus("saved");

        if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
        savedTimerRef.current = setTimeout(() => {
          setSaveStatus("idle");
        }, SAVED_DISPLAY_MS);
      } catch {
        setSaveStatus("idle");
      }
    },
    [note.id, editor]
  );

  /**
   * Schedules an auto-save after the debounce delay.
   * Cancels any pending save to restart the timer on each edit.
   */
  const scheduleSave = useCallback(
    (currentTitle: string) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        save(currentTitle);
      }, DEBOUNCE_MS);
    },
    [save]
  );

  /** Handles title input changes and triggers debounced auto-save. */
  const handleTitleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newTitle = e.target.value;
      setTitle(newTitle);
      scheduleSave(newTitle);
    },
    [scheduleSave]
  );

  /** Handles BlockNote editor content changes and triggers debounced auto-save. */
  const handleEditorChange = useCallback(() => {
    scheduleSave(titleRef.current);
  }, [scheduleSave]);

  /**
   * Persists an icon change immediately. Icon edits are atomic (not
   * keystroke-based), so skipping the debounce gives instant visual feedback
   * and avoids racing the title/content debounce.
   */
  const handleIconChange = useCallback(
    async (next: string | null) => {
      setIcon(next);
      setSaveStatus("saving");
      try {
        await updateNote(note.id, { icon: next });
        setSaveStatus("saved");
        if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
        savedTimerRef.current = setTimeout(() => {
          setSaveStatus("idle");
        }, SAVED_DISPLAY_MS);
      } catch {
        setSaveStatus("idle");
      }
    },
    [note.id]
  );

  /** Clicking the empty space below the last block should focus the editor. */
  const handleEditorContainerClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      // Only grab clicks that land on the wrapper itself, not on an existing
      // block or UI affordance.
      if (e.target === e.currentTarget) {
        editor.focus();
      }
    },
    [editor]
  );

  /** Clean up timers on unmount. */
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
    };
  }, []);

  /**
   * Confirms deletion of the note: closes the dialog, calls the server action,
   * and navigates to the parent note (or the home page for root-level notes).
   */
  const handleConfirmDelete = useCallback(async () => {
    setConfirmOpen(false);
    await deleteNote(note.id);
    router.push(note.parentId ? `/n/${note.parentId}` : "/");
    router.refresh();
  }, [note.id, note.parentId, router]);

  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      {/* Title bar with icon and save indicator */}
      <div className="flex items-center gap-3">
        <IconButton
          icon={icon}
          onChange={handleIconChange}
          size="lg"
          ariaLabel="Change icon"
        />
        <input
          type="text"
          value={title}
          onChange={handleTitleChange}
          placeholder="Untitled"
          className="flex-1 bg-transparent text-2xl font-bold text-black outline-none placeholder:text-[var(--text-dim)]"
          aria-label="Note title"
        />
        <span
          className={`text-xs transition-opacity ${
            saveStatus === "idle"
              ? "opacity-0"
              : "flex items-center gap-1.5 text-[var(--text-muted)] opacity-100"
          }`}
          aria-live="polite"
        >
          {saveStatus === "saving" && "Saving…"}
          {saveStatus === "saved" && (
            <>
              <span
                className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--accent)]"
                aria-hidden="true"
              />
              Saved
            </>
          )}
        </span>
        <NoteMenu onDelete={() => setConfirmOpen(true)} />
      </div>

      {/* BlockNote rich-text editor — fills remaining vertical space. */}
      <div
        className="min-h-0 flex-1 cursor-text"
        onClick={handleEditorContainerClick}
      >
        <BlockNoteView
          editor={editor}
          onChange={handleEditorChange}
          theme="light"
        />
      </div>

      <ConfirmDialog
        open={confirmOpen}
        title="Delete note?"
        message="This cannot be undone. Sub-notes will be moved to this note's parent."
        confirmLabel="Delete"
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
}
