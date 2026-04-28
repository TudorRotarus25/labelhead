"use client";

import { useActionState } from "react";
import { login, type LoginState } from "./actions";

const initialState: LoginState = {};

/**
 * Client-side password form. Uses `useActionState` so the server action can
 * return validation errors without throwing. On success the action redirects
 * and this component is unmounted.
 */
export function LoginForm({ next }: { next: string }) {
  const [state, formAction, pending] = useActionState(login, initialState);

  return (
    <form action={formAction} className="flex w-full max-w-sm flex-col gap-4">
      <input type="hidden" name="next" value={next} />
      <label className="flex flex-col gap-2 text-sm text-gray-600">
        Password
        <input
          type="password"
          name="password"
          autoFocus
          autoComplete="current-password"
          required
          className="rounded-[var(--radius)] border border-[var(--border)] bg-white px-3 py-2.5 text-base text-black outline-none transition focus:border-[var(--accent)]"
        />
      </label>
      {state.error ? (
        <p className="text-sm text-[var(--danger)]" role="alert">
          {state.error}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className="rounded-[var(--radius)] bg-[var(--accent)] px-3 py-2.5 text-sm font-medium text-white transition hover:bg-[var(--accent-hover)] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "Unlocking…" : "Unlock"}
      </button>
    </form>
  );
}
