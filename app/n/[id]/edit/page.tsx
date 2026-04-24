import dynamic from "next/dynamic";
import { notFound } from "next/navigation";
import { getNote } from "@/data/notes";
import { QRLabel } from "@/lib/components/qr-label";

const NoteEditor = dynamic(() => import("./note-editor"), { ssr: false });

/**
 * Server page for editing a note. Fetches the note by UUID from
 * route params and passes it to client components.
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
    <div className="mx-auto w-full max-w-3xl px-4 py-8">
      <NoteEditor note={note} />
      <div className="mt-8 border-t border-gray-200 pt-6 dark:border-gray-700">
        <QRLabel noteId={note.id} noteTitle={note.title} />
      </div>
    </div>
  );
}
