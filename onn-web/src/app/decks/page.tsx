"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

type Deck = {
  id: string;
  name: string;
  description: string | null;
  format: string;
  createdAt: string;
};

type DeckBuilderForm = {
  name: string;
  description: string;
  legendCard: string;
  championCard: string;
  domain: string;
  colors: string;
};

const initialForm: DeckBuilderForm = {
  name: "",
  description: "",
  legendCard: "",
  championCard: "",
  domain: "",
  colors: "",
};

export default function DecksPage() {
  const [decks, setDecks] = useState<Deck[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [form, setForm] = useState<DeckBuilderForm>(initialForm);
  const [formError, setFormError] = useState("");
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

  async function handleCreateDeck(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError("");

    const trimmedName = form.name.trim();
    const legendCard = form.legendCard.trim();
    const championCard = form.championCard.trim();
    const domain = form.domain.trim();
    const colors = form.colors.trim();

    if (!trimmedName || !legendCard || !championCard || !domain || !colors) {
      setFormError("Please complete the deck name, legend card, champion, domain, and colors.");
      return;
    }

    setIsCreating(true);

    try {
      const response = await fetch(`${API_URL}/decks`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          name: trimmedName,
          description: form.description.trim(),
          builderDetails: {
            legendCard,
            championCard,
            domain,
            colors,
          },
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.message || "Unable to create the deck.");
      }

      setDecks((current) => [data, ...current]);
      setShowCreateModal(false);
      setForm(initialForm);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Unable to create the deck.");
    } finally {
      setIsCreating(false);
    }
  }

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
              onClick={() => setShowCreateModal(true)}
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

        {showCreateModal ? (
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold">Deck builder</h2>
                <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                  Build a deck around a legend card and keep the structure aligned with the rules below.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowCreateModal(false);
                  setFormError("");
                  setForm(initialForm);
                }}
                className="text-sm font-medium text-zinc-500 transition hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
              >
                Close
              </button>
            </div>

            <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
              <p className="font-semibold">Deck rules</p>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                <li>1 legend card</li>
                <li>40 cards in the main deck, including the chosen champion</li>
                <li>Exactly 12 rune cards</li>
                <li>Exactly 3 battlefields</li>
                <li>Every card must match the legend&apos;s domain and colors</li>
                <li>You are limited to a maximum of 3 copies of any card</li>
                <li>You can include no more than 3 total Signature cards matching your Champion&apos;s tag</li>
              </ul>
            </div>

            <form className="space-y-4" onSubmit={handleCreateDeck}>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="block text-sm font-medium">
                  Deck name
                  <input
                    value={form.name}
                    onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                    placeholder="My new deck"
                    className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 outline-none focus:border-amber-500 dark:border-zinc-700 dark:bg-zinc-900"
                    required
                  />
                </label>

                <label className="block text-sm font-medium">
                  Legend card
                  <input
                    value={form.legendCard}
                    onChange={(event) => setForm((current) => ({ ...current, legendCard: event.target.value }))}
                    placeholder="Example: The Ashen Warden"
                    className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 outline-none focus:border-amber-500 dark:border-zinc-700 dark:bg-zinc-900"
                    required
                  />
                </label>

                <label className="block text-sm font-medium">
                  Champion card
                  <input
                    value={form.championCard}
                    onChange={(event) => setForm((current) => ({ ...current, championCard: event.target.value }))}
                    placeholder="Example: The Ashen Warden"
                    className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 outline-none focus:border-amber-500 dark:border-zinc-700 dark:bg-zinc-900"
                    required
                  />
                </label>

                <label className="block text-sm font-medium">
                  Domain
                  <input
                    value={form.domain}
                    onChange={(event) => setForm((current) => ({ ...current, domain: event.target.value }))}
                    placeholder="Example: Shadow"
                    className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 outline-none focus:border-amber-500 dark:border-zinc-700 dark:bg-zinc-900"
                    required
                  />
                </label>
              </div>

              <label className="block text-sm font-medium">
                Colors
                <input
                  value={form.colors}
                  onChange={(event) => setForm((current) => ({ ...current, colors: event.target.value }))}
                  placeholder="Example: Black / Red"
                  className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 outline-none focus:border-amber-500 dark:border-zinc-700 dark:bg-zinc-900"
                  required
                />
              </label>

              <label className="block text-sm font-medium">
                Notes
                <textarea
                  value={form.description}
                  onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                  rows={3}
                  placeholder="Optional notes for the deck"
                  className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 outline-none focus:border-amber-500 dark:border-zinc-700 dark:bg-zinc-900"
                />
              </label>

              {formError ? (
                <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/50 dark:text-rose-300">
                  {formError}
                </p>
              ) : null}

              <button
                type="submit"
                disabled={isCreating}
                className="rounded-lg bg-amber-600 px-4 py-2.5 font-medium text-white transition hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isCreating ? "Creating deck..." : "Create deck"}
              </button>
            </form>
          </div>
        ) : null}

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
