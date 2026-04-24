import dynamic from "next/dynamic";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getNote, getChildren } from "@/data/notes";

const ReadOnlyContent = dynamic(() => import("./read-only-content"), {
  ssr: false,
});

/**
 * Read-only note view. This is the public page users see when scanning
 * a QR code label. Displays the note content in a non-editable BlockNote
 * viewer with a link to edit and any sub-notes listed below.
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
      {/* Header: icon, title, edit link */}
      <div className="mb-6 flex items-center gap-3">
        {note.icon && (
          <span className="text-3xl" role="img" aria-label="Note icon">
            {note.icon}
          </span>
        )}
        <h1 className="flex-1 text-2xl font-bold text-gray-900 dark:text-gray-100">
          {note.title || "Untitled"}
        </h1>
        <Link
          href={`/n/${note.id}/edit`}
          className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-700 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-gray-300"
        >
          Edit
        </Link>
      </div>

      {/* Note content in read-only BlockNote viewer */}
      <div className="min-h-[200px] rounded-lg border border-gray-200 dark:border-gray-700">
        <ReadOnlyContent content={note.content ?? []} />
      </div>

      {/* Sub-notes section */}
      {children.length > 0 && (
        <div className="mt-8 border-t border-gray-200 pt-6 dark:border-gray-700">
          <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">
            Sub-notes
          </h2>
          <ul className="flex flex-col gap-2">
            {children.map((child) => (
              <li key={child.id}>
                <Link
                  href={`/n/${child.id}`}
                  className="flex items-center gap-2 rounded-md border border-gray-200 px-4 py-3 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
                >
                  {child.icon && (
                    <span className="text-xl" role="img" aria-label="Note icon">
                      {child.icon}
                    </span>
                  )}
                  <span className="text-gray-900 dark:text-gray-100">
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
