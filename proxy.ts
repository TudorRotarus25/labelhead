import { NextResponse, type NextRequest } from "next/server";
import { AUTH_COOKIE, verifyToken } from "@/lib/auth";

/**
 * Next.js 16 proxy (formerly middleware). Gates every non-excluded route
 * behind a signed auth cookie. Unauthenticated requests are redirected to
 * `/login?next=<original>` so the login action can send the user back to
 * where they were aiming.
 *
 * Excluded paths (see `config.matcher`): /login, /offline, Next.js internals,
 * the service worker, manifest, icons, favicon.
 */
export async function proxy(request: NextRequest) {
  const secret = process.env.SITE_AUTH_SECRET;
  const token = request.cookies.get(AUTH_COOKIE)?.value;

  if (secret && token && (await verifyToken(token, secret))) {
    return NextResponse.next();
  }

  const url = request.nextUrl.clone();
  url.pathname = "/login";
  url.search = "";
  const next = request.nextUrl.pathname + request.nextUrl.search;
  if (next && next !== "/") url.searchParams.set("next", next);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: [
    "/((?!login|offline|_next/static|_next/image|_next/data|manifest\\.json|sw\\.js|icon.*\\.png|apple-icon.*\\.png|favicon\\.ico).*)",
  ],
};
