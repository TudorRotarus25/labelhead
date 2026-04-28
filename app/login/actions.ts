"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  AUTH_COOKIE,
  SESSION_MS,
  constantTimeEquals,
  hashPassword,
  signToken,
} from "@/lib/auth";

export type LoginState = { error?: string };

/**
 * Server action for the login form. Hashes the submitted password, compares
 * it against SITE_PASSWORD_HASH in constant time, and on match issues a
 * signed 30-day cookie before redirecting to `next` (or `/`).
 *
 * Returns `{ error }` on failure so the client form can render a message.
 * `redirect()` throws on success and is not caught here.
 */
export async function login(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const password = String(formData.get("password") ?? "");
  const nextRaw = String(formData.get("next") ?? "/");
  const expected = process.env.SITE_PASSWORD_HASH;
  const secret = process.env.SITE_AUTH_SECRET;

  if (!expected || !secret) {
    return { error: "Server not configured" };
  }

  const given = await hashPassword(password);
  if (!constantTimeEquals(given, expected)) {
    return { error: "Wrong password" };
  }

  const expiry = Date.now() + SESSION_MS;
  const token = await signToken(expiry, secret);
  const cookieStore = await cookies();
  cookieStore.set(AUTH_COOKIE, token, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: Math.floor(SESSION_MS / 1000),
  });

  // Refuse open redirects: `next` must be a same-origin absolute path.
  const next = nextRaw.startsWith("/") && !nextRaw.startsWith("//")
    ? nextRaw
    : "/";
  redirect(next);
}
