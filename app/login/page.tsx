import { LoginForm } from "./login-form";

/**
 * Site password gate. Renders outside the sidebar (the root layout skips
 * sidebar rendering when the request is unauthenticated). Accepts an
 * optional `?next=/path` query so the server action can send the user back
 * to their intended destination after unlocking.
 */
export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const params = await searchParams;
  const next = typeof params.next === "string" && params.next.startsWith("/")
    ? params.next
    : "/";

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-8 py-16">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-semibold text-zinc-100">LabelHead</h1>
        <p className="mt-2 text-sm text-zinc-400">Enter the password to continue.</p>
      </div>
      <LoginForm next={next} />
    </div>
  );
}
