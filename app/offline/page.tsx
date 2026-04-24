/**
 * Offline fallback page displayed when the user has no network connection
 * and the requested page is not cached by the service worker.
 */
export default function OfflinePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <h1 className="text-2xl font-bold text-zinc-900">You&apos;re offline</h1>
      <p className="mt-2 text-zinc-600">
        Previously viewed notes are available from the sidebar.
      </p>
      <a
        href="/"
        className="mt-6 rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
      >
        Go to home
      </a>
    </div>
  );
}
