import Image from "next/image";
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
    <div className="flex min-h-screen flex-1 flex-col items-center justify-center bg-white px-8 py-16">
      <div className="mb-8 flex flex-col items-center gap-4 text-center">
        <Image
          src="/logo.png"
          alt="LabelHead"
          width={56}
          height={56}
          priority
        />
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-black">
            LabelHead
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Enter the password to continue.
          </p>
        </div>
      </div>
      <LoginForm next={next} />
    </div>
  );
}
