/**
 * Home page — simple welcome message directing users to
 * select or create a note from the sidebar.
 */
export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-8 py-16">
      <h1 className="text-3xl font-semibold text-zinc-900 dark:text-zinc-100">
        LabelHead
      </h1>
      <p className="mt-3 text-center text-zinc-500 dark:text-zinc-400">
        Select a note from the sidebar or create a new one.
      </p>
    </div>
  );
}
