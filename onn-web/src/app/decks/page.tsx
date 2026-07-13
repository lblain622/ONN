"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

type Deck = {
  id: string;
  name: string;
  description: string | null;
  format: string;
  createdAt: string;
};

export default function DecksPage() {
  const [decks, setDecks] = useState<Deck[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    async function loadDecks() {
      try {
        const response = await fetch(`${API_URL}/decks`, {
          method: "GET",
          credentials: "include",
        });

        if (response.status === 401) {
          router.replace("/");
          return;
        }

        if (!response.ok) {
          throw new Error("Unable to load your decks right now.");
        }

        const data = (await response.json()) as Deck[];
        setDecks(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to load your decks right now.");
      } finally {
        setIsLoading(false);
      }
    }

    loadDecks();
  }, [router]);

  return (
    <div className="min-h-screen bg-zinc-100 px-4 py-12 text-zinc-900 dark:bg-black dark:text-zinc-50">
      <div className="mx-auto flex max-w-5xl flex-col gap-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-amber-600">ONN</p>
            <h1 className="text-3xl font-semibold">Your decks</h1>
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => router.push("/decks/new")}
              className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-amber-700"
            >
              Create deck
            </button>
            <button
              type="button"
              onClick={async () => {
                await fetch(`${API_URL}/auth/logout`, {
                  method: "POST",
                  credentials: "include",
                });
                router.replace("/");
              }}
              className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium transition hover:bg-zinc-200 dark:border-zinc-700 dark:hover:bg-zinc-900"
            >
              Sign out
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
            Loading your decks...
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-rose-700 dark:border-rose-900 dark:bg-rose-950/50 dark:text-rose-300">
            {error}
          </div>
        ) : decks.length === 0 ? (
          <div className="rounded-2xl border border-zinc-200 bg-white p-8 text-center shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
            <h2 className="text-xl font-semibold">No decks yet</h2>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              Create your first deck and it will appear here.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {decks.map((deck) => (
              <article key={deck.id} className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-semibold">{deck.name}</h2>
                    <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                      {deck.description || "No description provided."}
                    </p>
                  </div>
                  <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-amber-700 dark:bg-amber-950/60 dark:text-amber-300">
                    {deck.format}
                  </span>
                </div>
                <p className="mt-4 text-sm text-zinc-500 dark:text-zinc-400">
                  Created {new Date(deck.createdAt).toLocaleDateString()}
                </p>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
