"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

export default function Home() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const response = await fetch(`${API_URL}/auth/${isRegistering ? "register" : "login"}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.message || (isRegistering ? "Unable to create your account." : "Unable to sign in right now."));
      }

      router.push("/decks");
    } catch (err) {
      setError(err instanceof Error ? err.message : (isRegistering ? "Unable to create your account." : "Unable to sign in right now."));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-100 px-4 py-12 text-zinc-900 dark:bg-black dark:text-zinc-50">
      <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <div className="mb-8 space-y-2">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-amber-600">
            ONN
          </p>
          <h1 className="text-3xl font-semibold">
            {isRegistering ? "Create your account" : "Sign in to your account"}
          </h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            {isRegistering
              ? "Join ONN to start managing your card decks."
              : "Welcome back. Sign in to view the decks that belong to your account."}
          </p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <label className="block text-sm font-medium">
            Email
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 outline-none ring-0 focus:border-amber-500 dark:border-zinc-700 dark:bg-zinc-900"
              required
            />
          </label>

          <label className="block text-sm font-medium">
            Password
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="••••••••"
              className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 outline-none ring-0 focus:border-amber-500 dark:border-zinc-700 dark:bg-zinc-900"
              required
            />
          </label>

          {error ? (
            <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/50 dark:text-rose-300">
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-lg bg-amber-600 px-4 py-2.5 font-medium text-white transition hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting ? (isRegistering ? "Creating account..." : "Signing in...") : isRegistering ? "Create account" : "Sign in"}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-zinc-600 dark:text-zinc-400">
          {isRegistering ? "Already have an account?" : "Need an account?"}{" "}
          <button
            type="button"
            onClick={() => {
              setIsRegistering((value) => !value);
              setError("");
            }}
            className="font-semibold text-amber-600 underline-offset-4 hover:underline"
          >
            {isRegistering ? "Sign in instead" : "Create one"}
          </button>
        </div>
      </div>
    </div>
  );
}
