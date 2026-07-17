"use client";

import { useState } from "react";
import { signUpAction } from "@/actions/auth";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Music } from "lucide-react";

/**
 * Signup client page component.
 * Explaining: Validates passwords client-side and triggers the signUpAction Server Action.
 * Automatically handles the route updates on success.
 */
export default function SignupPage() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const password = formData.get("password") as string;
    const confirmPassword = formData.get("confirmPassword") as string;

    // Client-side validations
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      setLoading(false);
      return;
    }

    try {
      const res = await signUpAction(formData);
      if (res.success) {
        // Force router refresh to load session data globally, then push to dashboard
        router.push("/dashboard");
        router.refresh();
      } else {
        setError(res.error || "Failed to create account.");
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
          <h2 className="text-2xl font-bold text-white tracking-tight">Create Account</h2>

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
            <label htmlFor="email" className="text-xs font-semibold text-zinc-300 mb-1.5">
              Email Address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              placeholder="e.g. john@email.com"
              className="input-field text-sm"
              disabled={loading}
            />
          </div>

          <div className="flex flex-col">
            <label htmlFor="username" className="text-xs font-semibold text-zinc-300 mb-1.5">
              Username
            </label>
            <input
              id="username"
              name="username"
              type="text"
              required
              placeholder="e.g. jdoe"
              className="input-field text-sm"
              disabled={loading}
            />
          </div>

          <div className="flex flex-col">
            <label htmlFor="password" className="text-xs font-semibold text-zinc-300 mb-1.5">
              Password (min. 6 chars)
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

          <div className="flex flex-col">
            <label htmlFor="confirmPassword" className="text-xs font-semibold text-zinc-300 mb-1.5">
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
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
            {loading ? "Creating Account..." : "Sign Up"}
          </button>
        </form>

        {/* Switch to Login */}
        <p className="text-xs text-center text-text-muted mt-6">
          Already have an account?{" "}
          <Link href="/login" className="text-accent-green hover:underline font-medium">
            Log In
          </Link>
        </p>
      </div>
    </div>
  );
}
