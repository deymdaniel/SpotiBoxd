"use client";

import { useState } from "react";
import { loginAction } from "@/actions/auth";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Music } from "lucide-react";

/**
 * Login client page component.
 * Explaining: Uses native HTML form submission intercepted by a standard onSubmit handler.
 * Feeds input to our loginAction Server Action. Uses basic React useState for state management.
 */
export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    try {
      const res = await loginAction(formData);
      if (res.success) {
        // Force router refresh to load session data globally, then push to dashboard
        router.push("/dashboard");
        router.refresh();
      } else {
        setError(res.error || "Failed to log in.");
        setLoading(false);
      }
    } catch (err) {
      setError("An unexpected error occurred.");
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center px-4 py-12">
      <div className="glass-panel w-full max-w-md p-8 rounded-2xl border border-card-border shadow-2xl">
        
        {/* Brand header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 text-white mb-3 hover:text-accent-green transition-colors">
            <Music className="text-accent-green" size={28} />
            <span className="font-bold text-xl tracking-wider font-mono">SpotiBoxd</span>
          </Link>
          <h2 className="text-2xl font-bold text-white tracking-tight">Welcome Back</h2>
          <p className="text-xs text-text-muted mt-2">Log in to manage reviews, favorites, and your watchlist.</p>
        </div>

        {/* Action Error display */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-xs rounded p-3 mb-5" role="alert">
            {error}
          </div>
        )}

        {/* Native Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex flex-col">
            <label htmlFor="identifier" className="text-xs font-semibold text-zinc-300 mb-1.5">
              Username or Email
            </label>
            <input
              id="identifier"
              name="identifier"
              type="text"
              required
              placeholder="e.g. jdoe or john@email.com"
              className="input-field text-sm"
              disabled={loading}
            />
          </div>

          <div className="flex flex-col">
            <label htmlFor="password" className="text-xs font-semibold text-zinc-300 mb-1.5">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              placeholder="••••••••"
              className="input-field text-sm"
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-accent-green hover:bg-accent-hover text-black font-semibold py-2.5 rounded-md mt-6 transition-all active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer text-sm"
          >
            {loading ? "Logging In..." : "Log In"}
          </button>
        </form>

        {/* Switch to Signup */}
        <p className="text-xs text-center text-text-muted mt-6">
          Don't have an account?{" "}
          <Link href="/signup" className="text-accent-green hover:underline font-medium">
            Sign Up
          </Link>
        </p>
      </div>
    </div>
  );
}
