import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import { Music, Search, User as UserIcon, Shield, LogOut } from "lucide-react";
import { getSessionUser } from "@/lib/auth";
import { logoutAction } from "@/actions/auth";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SpotiBoxd | Share Your Music Journey",
  description: "Letterboxd for music albums. Search, review, rate, and track your listen history.",
};

/**
 * RootLayout.
 * Explaining: Defines the global shell around all pages.
 * Fetches the user session in-flight on the server to conditionally display authenticated links,
 * admin moderation tools, or login/signup buttons.
 */
export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getSessionUser();

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        {/* Navigation Header */}
        <header className="sticky top-0 z-50 border-b border-card-border/60 bg-background/80 backdrop-blur-md">
          <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-4">

            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 text-white hover:text-accent-green transition-colors shrink-0">
              <Music className="text-accent-green" size={24} />
              <span className="font-bold text-lg tracking-wider font-mono">SpotiBoxd</span>
            </Link>

            {/* Server-Side Album Search Form */}
            <form action="/albums/search" method="GET" className="flex-1 max-w-md relative hidden md:block">
              <input
                type="text"
                name="q"
                placeholder="Search albums..."
                required
                className="w-full bg-[#12181f] border border-card-border focus:border-accent-green text-sm text-white px-4 py-2 pl-10 rounded-full outline-none transition-all"
              />
              <Search className="absolute left-3.5 top-2.5 text-zinc-500" size={16} />
            </form>

            {/* Navigation Options */}
            <nav className="flex items-center gap-4 text-sm font-medium">
              {/* Mobile search icon link */}
              <Link href="/albums/search" className="md:hidden text-text-muted hover:text-white p-1" aria-label="Search">
                <Search size={20} />
              </Link>

              {user ? (
                <>
                  <Link
                    href="/dashboard"
                    className="flex items-center gap-1 text-text-muted hover:text-white transition-colors"
                  >
                    <UserIcon size={16} />
                    <span className="hidden sm:inline">@{user.username}</span>
                  </Link>

                  {user.role === "ADMIN" && (
                    <Link
                      href="/admin"
                      className="flex items-center gap-1 text-accent-orange hover:text-accent-orange/80 transition-colors"
                    >
                      <Shield size={16} />
                      <span className="hidden sm:inline">Moderation</span>
                    </Link>
                  )}

                  <form action={logoutAction}>
                    <button
                      type="submit"
                      className="flex items-center gap-1 text-text-muted hover:text-red-400 transition-colors cursor-pointer"
                    >
                      <LogOut size={16} />
                      <span className="hidden sm:inline">Logout</span>
                    </button>
                  </form>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="text-text-muted hover:text-white transition-colors"
                  >
                    Log In
                  </Link>
                  <Link
                    href="/signup"
                    className="bg-accent-green hover:bg-accent-hover text-black font-semibold px-4 py-1.5 rounded-full transition-colors"
                  >
                    Sign Up
                  </Link>
                </>
              )}
            </nav>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col">{children}</main>

        {/* Global Footer */}
        <footer className="border-t border-card-border/40 bg-zinc-950/60 py-6 mt-auto">
          <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-text-muted">
            <p>© {new Date().getFullYear()} SpotiBoxd</p>
            <div className="flex gap-4">
              <Link href="/" className="hover:text-white transition-colors">Home</Link>
              <span>•</span>
              <a href="https://www.last.fm" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Metadata from Last.fm</a>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
