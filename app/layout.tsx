import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { getNoteTree } from "@/data/notes";
import { Sidebar } from "@/lib/components/sidebar/sidebar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "LabelHead",
  description: "QR code note-taking app",
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
  const tree = await getNoteTree();

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex h-full min-h-screen">
        <Sidebar tree={tree} />
        <main className="flex-1 overflow-y-auto">{children}</main>
      </body>
    </html>
  );
}
