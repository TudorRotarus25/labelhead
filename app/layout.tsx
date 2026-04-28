import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { cookies } from "next/headers";
import "./globals.css";
import { getNoteTree } from "@/data/notes";
import { Sidebar } from "@/lib/components/sidebar/sidebar";
import { AUTH_COOKIE, verifyToken } from "@/lib/auth";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "LabelHead",
  description: "QR code note-taking app",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "LabelHead",
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
};

export const viewport = {
  themeColor: "#18181b",
};

/**
 * Root layout with sidebar and main content as siblings.
 * The sidebar is a client component that manages its own mobile toggle.
 * {children} stays in the server component tree — never passed through
 * a client component — to avoid React hydration conflicts with BlockNote.
 */
export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Only fetch + render the note tree sidebar for authenticated requests.
  // The /login and /offline routes are proxy-excluded and would otherwise
  // leak note titles in the rendered HTML.
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE)?.value;
  const secret = process.env.SITE_AUTH_SECRET;
  const authed = !!(secret && token && (await verifyToken(token, secret)));
  const tree = authed ? await getNoteTree() : [];

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex h-full min-h-screen">
        {authed && <Sidebar tree={tree} />}
        <main className="flex-1 overflow-y-auto">{children}</main>
      </body>
    </html>
  );
}
