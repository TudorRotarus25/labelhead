import { notFound } from "next/navigation";
import { getNote } from "@/data/notes";
import NoteEditorLoader from "./note-editor-loader";
import { QRLabel } from "@/lib/components/qr-label";

/**
 * Server page for editing a note. Fetches the note by UUID from route params
 * and lays out editor + QR label. The page is a flex column that fills the
 * available viewport height, so the editor can grow to fill any empty space.
 */
export default async function EditNotePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const note = await getNote(id);

  if (!note) {
    notFound();
  }

  return (
    <div className="mx-auto flex h-full w-full max-w-3xl flex-col px-4 py-8 pb-24 md:pb-8">
      <div className="flex min-h-0 flex-1 flex-col">
        <NoteEditorLoader note={note} />
      </div>
      <div className="mt-8 shrink-0 border-t border-[var(--border)] pt-6">
        <QRLabel noteId={note.id} noteTitle={note.title} />
      </div>
    </div>
  );
}
