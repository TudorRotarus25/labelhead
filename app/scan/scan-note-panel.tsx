"use client";

/** Data for a detected note shown in the bottom panel. */
export interface ScanNoteData {
  id: string;
  title: string;
  icon: string | null;
  preview: string;
}

/** Visible state of the bottom note panel. */
export type ScanNotePanelState = "idle" | "loading" | "loaded";

interface ScanNotePanelProps {
  state: ScanNotePanelState;
  note: ScanNoteData | null;
  onOpen: (noteId: string) => void;
  onEdit: (noteId: string) => void;
}

/**
 * Bottom half of the scanner screen. Owns three visual states:
 * idle (waiting for a scan), loading (QR parsed, fetching), and loaded
 * (note data available with Edit / Open actions).
 */
export function ScanNotePanel({ state, note, onOpen, onEdit }: ScanNotePanelProps) {
  return (
    <div
      className="flex h-full flex-col bg-white px-5 pb-6 pt-6"
      data-testid="scan-note-panel"
    >
      {state === "idle" && <EmptyState />}
      {state === "loading" && <LoadingState />}
      {state === "loaded" && note && (
        <LoadedState note={note} onOpen={onOpen} onEdit={onEdit} />
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div
      className="flex flex-1 flex-col items-center justify-center text-center"
      data-testid="scan-note-empty"
    >
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-[14px] bg-zinc-100">
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#9ca3af"
          strokeWidth={1.8}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <rect x="3" y="3" width="7" height="7" rx="1" />
          <rect x="14" y="3" width="7" height="7" rx="1" />
          <rect x="3" y="14" width="7" height="7" rx="1" />
          <path d="M14 14h3M14 17h7M14 21h3M17 14v7" />
        </svg>
      </div>
      <div className="mb-1 text-[15px] font-semibold text-zinc-900">
        Ready to scan
      </div>
      <div className="max-w-[220px] text-[13px] text-zinc-400">
        Note details will appear here the moment a LabelHead QR is detected.
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <div
      className="flex flex-1 flex-col"
      data-testid="scan-note-loading"
      aria-busy="true"
    >
      <div className="mb-3.5 flex items-start gap-3">
        <div className="h-11 w-11 flex-shrink-0 animate-pulse rounded-[12px] bg-zinc-100" />
        <div className="flex-1 space-y-2 pt-1">
          <div className="h-2.5 w-[45%] animate-pulse rounded bg-zinc-100" />
          <div className="h-4 w-[80%] animate-pulse rounded bg-zinc-200" />
        </div>
      </div>
      <div className="space-y-1.5">
        <div className="h-2.5 w-full animate-pulse rounded bg-zinc-100" />
        <div className="h-2.5 w-[92%] animate-pulse rounded bg-zinc-100" />
        <div className="h-2.5 w-[78%] animate-pulse rounded bg-zinc-100" />
      </div>
      <div className="mt-auto flex gap-2">
        <div className="h-11 flex-1 animate-pulse rounded-[12px] bg-zinc-100" />
        <div className="h-11 flex-1 animate-pulse rounded-[12px] bg-[var(--accent-soft)]" />
      </div>
    </div>
  );
}

function LoadedState({
  note,
  onOpen,
  onEdit,
}: {
  note: ScanNoteData;
  onOpen: (id: string) => void;
  onEdit: (id: string) => void;
}) {
  const displayTitle = note.title || "Untitled";
  const displayIcon = note.icon ?? "📄";

  return (
    <div className="flex flex-1 flex-col" data-testid="scan-note-loaded">
      <div className="mb-3.5 flex items-start gap-3">
        <div
          className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-[12px] bg-[var(--accent-soft)] text-[22px]"
          data-testid="scan-note-icon"
        >
          {displayIcon}
        </div>
        <div className="min-w-0 flex-1">
          <h2
            className="truncate text-[18px] font-bold leading-tight tracking-tight text-zinc-900"
            data-testid="scan-note-title"
          >
            {displayTitle}
          </h2>
        </div>
      </div>

      {note.preview && (
        <p
          className="mb-3.5 line-clamp-3 text-[14px] leading-[1.55] text-zinc-600"
          data-testid="scan-note-preview"
        >
          {note.preview}
        </p>
      )}

      <div className="mt-auto flex gap-2">
        <button
          type="button"
          onClick={() => onEdit(note.id)}
          data-testid="scan-note-edit"
          className="flex h-11 flex-1 items-center justify-center gap-1.5 rounded-[12px] bg-zinc-100 text-[14px] font-semibold text-zinc-700 active:bg-zinc-200"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            aria-hidden="true"
          >
            <path d="M12 20h9" />
            <path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
          </svg>
          Edit
        </button>
        <button
          type="button"
          onClick={() => onOpen(note.id)}
          data-testid="scan-note-open"
          className="flex h-11 flex-1 items-center justify-center gap-1.5 rounded-[12px] bg-[var(--accent)] text-[14px] font-semibold text-white shadow-[0_4px_12px_rgba(16,185,129,0.25)] active:bg-[var(--accent-hover)]"
        >
          Open note
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.5}
            strokeLinecap="round"
            aria-hidden="true"
          >
            <path d="M5 12h14M13 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
}
