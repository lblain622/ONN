"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

type CardOption = {
  id: string;
  name: string;
  type: string;
  imageUrl?: string;
  richText?: string;
  domains?: Array<{ domain: { name: string } }>;
  tags?: Array<{ tag: { name: string } }>;
};

type SectionState = {
  query: string;
  type: string;
  searchResults: CardOption[];
  selectedCards: CardOption[];
};

type BuilderState = {
  legend: SectionState;
  champion: SectionState;
  mainDeck: SectionState;
  runes: SectionState;
  battlefields: SectionState;
};

const createSection = (type: string): SectionState => ({
  query: "",
  type,
  searchResults: [],
  selectedCards: [],
});

const initialBuilder: BuilderState = {
  legend: createSection("LEGEND"),
  champion: createSection("UNIT"),
  mainDeck: createSection("UNIT"),
  runes: createSection("RUNE"),
  battlefields: createSection("BATTLEFIELD"),
};

export default function NewDeckPage() {
  const [deckName, setDeckName] = useState("");
  const [deckId, setDeckId] = useState<string | null>(null);
  const [builder, setBuilder] = useState<BuilderState>(initialBuilder);
  const [isCreating, setIsCreating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [matchLegendName, setMatchLegendName] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (!matchLegendName) {
      return;
    }

    const legendName = builder.legend.selectedCards[0]?.name;
    if (!legendName) {
      return;
    }

    setBuilder((current) => ({
      ...current,
      champion: {
        ...current.champion,
        query: legendName,
      },
    }));
  }, [builder.legend.selectedCards[0]?.name, matchLegendName]);

  async function handleCreateDeck(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const trimmedName = deckName.trim();
    if (!trimmedName) {
      setError("Please enter a deck name to continue.");
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
        body: JSON.stringify({ name: trimmedName }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.message || "Unable to create the deck.");
      }

      setDeckId(data.id);
      setDeckName(data.name || trimmedName);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create the deck.");
    } finally {
      setIsCreating(false);
    }
  }

  async function searchCards(sectionKey: keyof BuilderState, query: string, cardType: string) {
    const normalizedQuery = query.trim();

    setBuilder((current) => ({
      ...current,
      [sectionKey]: {
        ...current[sectionKey],
        query,
        type: cardType,
        searchResults: normalizedQuery.length < 2 ? [] : current[sectionKey].searchResults,
      },
    }));

    if (normalizedQuery.length < 2) {
      return;
    }

    try {
      const response = await fetch(
        `${API_URL}/cards/search?query=${encodeURIComponent(normalizedQuery)}&type=${encodeURIComponent(cardType)}`,
        {
          method: "GET",
          credentials: "include",
        }
      );

      const data = (await response.json()) as CardOption[];
      setBuilder((current) => ({
        ...current,
        [sectionKey]: {
          ...current[sectionKey],
          searchResults: data,
        },
      }));
    } catch {
      setBuilder((current) => ({
        ...current,
        [sectionKey]: {
          ...current[sectionKey],
          searchResults: [],
        },
      }));
    }
  }

  function selectCard(sectionKey: keyof BuilderState, card: CardOption) {
    setBuilder((current) => {
      const nextSection = current[sectionKey];
      const nextState = { ...current };

      if (sectionKey === "legend" || sectionKey === "champion") {
        nextState[sectionKey] = {
          ...nextSection,
          query: card.name,
          searchResults: [],
          selectedCards: [card],
        };
      } else {
        const alreadySelected = nextSection.selectedCards.some((item) => item.id === card.id);
        nextState[sectionKey] = {
          ...nextSection,
          query: "",
          searchResults: [],
          selectedCards: alreadySelected ? nextSection.selectedCards : [...nextSection.selectedCards, card],
        };
      }

      if (sectionKey === "legend" && matchLegendName) {
        nextState.champion = {
          ...nextState.champion,
          query: card.name,
          searchResults: [],
        };
      }

      return nextState;
    });
  }

  function removeCard(sectionKey: keyof BuilderState, cardId: string) {
    setBuilder((current) => ({
      ...current,
      [sectionKey]: {
        ...current[sectionKey],
        selectedCards: current[sectionKey].selectedCards.filter((card) => card.id !== cardId),
      },
    }));
  }

  async function saveDeck() {
    if (!deckId) {
      return;
    }

    const description = [
      `Legend: ${builder.legend.selectedCards[0]?.name || "Not selected"}`,
      `Champion: ${builder.champion.selectedCards[0]?.name || "Not selected"}`,
      `Main deck (${builder.mainDeck.selectedCards.length} cards): ${builder.mainDeck.selectedCards.map((card) => card.name).join(", ") || "No cards added"}`,
      `Runes (${builder.runes.selectedCards.length} cards): ${builder.runes.selectedCards.map((card) => card.name).join(", ") || "No cards added"}`,
      `Battlefields (${builder.battlefields.selectedCards.length} cards): ${builder.battlefields.selectedCards.map((card) => card.name).join(", ") || "No cards added"}`,
    ].join("\n");

    setIsSaving(true);
    setError("");

    try {
      const response = await fetch(`${API_URL}/decks/${deckId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          name: deckName.trim(),
          description,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.message || "Unable to save the deck.");
      }

      router.push("/decks");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save the deck.");
    } finally {
      setIsSaving(false);
    }
  }

  const selectedLegend = builder.legend.selectedCards[0];
  const selectedChampion = builder.champion.selectedCards[0];

  return (
    <div className="min-h-screen bg-zinc-100 px-4 py-12 text-zinc-900 dark:bg-black dark:text-zinc-50">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-amber-600">ONN</p>
            <h1 className="text-3xl font-semibold">Deck builder</h1>
          </div>
          <button
            type="button"
            onClick={() => router.push("/decks")}
            className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium transition hover:bg-zinc-200 dark:border-zinc-700 dark:hover:bg-zinc-900"
          >
            Back to decks
          </button>
        </div>

        {!deckId ? (
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
            <h2 className="text-xl font-semibold">Start a new deck</h2>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              Give the deck a name first, then you can build its legend, main deck, runes, and battlefields.
            </p>
            <form className="mt-6 space-y-4" onSubmit={handleCreateDeck}>
              <label className="block text-sm font-medium">
                Deck name
                <input
                  value={deckName}
                  onChange={(event) => setDeckName(event.target.value)}
                  placeholder="My deck"
                  className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 outline-none focus:border-amber-500 dark:border-zinc-700 dark:bg-zinc-900"
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
                disabled={isCreating}
                className="rounded-lg bg-amber-600 px-4 py-2.5 font-medium text-white transition hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isCreating ? "Creating deck..." : "Create deck"}
              </button>
            </form>
          </div>
        ) : (
          <>
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
              <p className="font-semibold">Deck rules</p>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                <li>1 legend card</li>
                <li>40 cards in the main deck, including the chosen champion</li>
                <li>Exactly 12 rune cards</li>
                <li>Exactly 3 battlefields</li>
                <li>Every card must match the legend&apos;s domain and colors</li>
                <li>Maximum 3 copies of any card</li>
                <li>No more than 3 total Signature cards matching your Champion&apos;s tag</li>
              </ul>
            </div>

            <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-semibold">{deckName}</h2>
                  <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                    Pick your legend and build the rest of the deck from searchable cards.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={saveDeck}
                  disabled={isSaving}
                  className="rounded-lg bg-amber-600 px-4 py-2.5 font-medium text-white transition hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isSaving ? "Saving..." : "Save deck"}
                </button>
              </div>

              {error ? (
                <p className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/50 dark:text-rose-300">
                  {error}
                </p>
              ) : null}
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
                <h3 className="text-lg font-semibold">Legend</h3>
                <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                  Choose the legend card that anchors the deck.
                </p>
                <div className="mt-4 space-y-3">
                  <label className="block text-sm font-medium">
                    Search legend cards
                    <input
                      value={builder.legend.query}
                      onChange={(event) => searchCards("legend", event.target.value, "LEGEND")}
                      placeholder="Search for a legend"
                      className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 outline-none focus:border-amber-500 dark:border-zinc-700 dark:bg-zinc-900"
                    />
                  </label>

                  {builder.legend.searchResults.length > 0 ? (
                    <ul className="rounded-lg border border-zinc-200 p-2 dark:border-zinc-800">
                      {builder.legend.searchResults.map((card) => (
                        <li key={card.id}>
                          <button
                            type="button"
                            onClick={() => selectCard("legend", card)}
                            className="flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm transition hover:bg-zinc-100 dark:hover:bg-zinc-900"
                          >
                            <span>{card.name}</span>
                            <span className="text-xs text-zinc-500">{card.type}</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : null}

                  {selectedLegend ? (
                    <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
                      <p className="font-semibold">Selected legend</p>
                      <p>{selectedLegend.name}</p>
                    </div>
                  ) : null}
                </div>
              </section>

              <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold">Champion</h3>
                    <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                      Tag the champion card and keep it aligned with the legend name.
                    </p>
                  </div>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={matchLegendName}
                      onChange={(event) => setMatchLegendName(event.target.checked)}
                    />
                    Match legend name
                  </label>
                </div>
                <div className="mt-4 space-y-3">
                  <label className="block text-sm font-medium">
                    Search champion cards
                    <input
                      value={builder.champion.query}
                      onChange={(event) => searchCards("champion", event.target.value, builder.champion.type)}
                      placeholder={matchLegendName && selectedLegend ? selectedLegend.name : "Search for a champion"}
                      className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 outline-none focus:border-amber-500 dark:border-zinc-700 dark:bg-zinc-900"
                    />
                  </label>

                  {builder.champion.searchResults.length > 0 ? (
                    <ul className="rounded-lg border border-zinc-200 p-2 dark:border-zinc-800">
                      {builder.champion.searchResults.map((card) => (
                        <li key={card.id}>
                          <button
                            type="button"
                            onClick={() => selectCard("champion", card)}
                            className="flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm transition hover:bg-zinc-100 dark:hover:bg-zinc-900"
                          >
                            <span>{card.name}</span>
                            <span className="text-xs text-zinc-500">{card.type}</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : null}

                  {selectedChampion ? (
                    <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
                      <p className="font-semibold">Selected champion</p>
                      <p>{selectedChampion.name}</p>
                    </div>
                  ) : null}
                </div>
              </section>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
              <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
                <h3 className="text-lg font-semibold">Main deck</h3>
                <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                  Add cards that fit the legend&apos;s domain and colors.
                </p>
                <div className="mt-4 space-y-3">
                  <label className="block text-sm font-medium">
                    Search cards
                    <input
                      value={builder.mainDeck.query}
                      onChange={(event) => searchCards("mainDeck", event.target.value, builder.mainDeck.type)}
                      placeholder="Search main deck cards"
                      className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 outline-none focus:border-amber-500 dark:border-zinc-700 dark:bg-zinc-900"
                    />
                  </label>
                  {builder.mainDeck.searchResults.length > 0 ? (
                    <ul className="rounded-lg border border-zinc-200 p-2 dark:border-zinc-800">
                      {builder.mainDeck.searchResults.map((card) => (
                        <li key={card.id}>
                          <button
                            type="button"
                            onClick={() => selectCard("mainDeck", card)}
                            className="flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm transition hover:bg-zinc-100 dark:hover:bg-zinc-900"
                          >
                            <span>{card.name}</span>
                            <span className="text-xs text-zinc-500">{card.type}</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : null}

                  {builder.mainDeck.selectedCards.length > 0 ? (
                    <div className="space-y-2">
                      {builder.mainDeck.selectedCards.map((card) => (
                        <div key={card.id} className="flex items-center justify-between rounded-lg border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-800">
                          <span>{card.name}</span>
                          <button type="button" onClick={() => removeCard("mainDeck", card.id)} className="text-amber-600">
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
              </section>

              <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
                <h3 className="text-lg font-semibold">Runes</h3>
                <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                  Add the rune cards that support your build.
                </p>
                <div className="mt-4 space-y-3">
                  <label className="block text-sm font-medium">
                    Search rune cards
                    <input
                      value={builder.runes.query}
                      onChange={(event) => searchCards("runes", event.target.value, "RUNE")}
                      placeholder="Search runes"
                      className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 outline-none focus:border-amber-500 dark:border-zinc-700 dark:bg-zinc-900"
                    />
                  </label>
                  {builder.runes.searchResults.length > 0 ? (
                    <ul className="rounded-lg border border-zinc-200 p-2 dark:border-zinc-800">
                      {builder.runes.searchResults.map((card) => (
                        <li key={card.id}>
                          <button
                            type="button"
                            onClick={() => selectCard("runes", card)}
                            className="flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm transition hover:bg-zinc-100 dark:hover:bg-zinc-900"
                          >
                            <span>{card.name}</span>
                            <span className="text-xs text-zinc-500">{card.type}</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : null}

                  {builder.runes.selectedCards.length > 0 ? (
                    <div className="space-y-2">
                      {builder.runes.selectedCards.map((card) => (
                        <div key={card.id} className="flex items-center justify-between rounded-lg border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-800">
                          <span>{card.name}</span>
                          <button type="button" onClick={() => removeCard("runes", card.id)} className="text-amber-600">
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
              </section>

              <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
                <h3 className="text-lg font-semibold">Battlefields</h3>
                <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                  Add the battlefields that fit your legend&apos;s domain.
                </p>
                <div className="mt-4 space-y-3">
                  <label className="block text-sm font-medium">
                    Search battlefields
                    <input
                      value={builder.battlefields.query}
                      onChange={(event) => searchCards("battlefields", event.target.value, "BATTLEFIELD")}
                      placeholder="Search battlefields"
                      className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 outline-none focus:border-amber-500 dark:border-zinc-700 dark:bg-zinc-900"
                    />
                  </label>
                  {builder.battlefields.searchResults.length > 0 ? (
                    <ul className="rounded-lg border border-zinc-200 p-2 dark:border-zinc-800">
                      {builder.battlefields.searchResults.map((card) => (
                        <li key={card.id}>
                          <button
                            type="button"
                            onClick={() => selectCard("battlefields", card)}
                            className="flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm transition hover:bg-zinc-100 dark:hover:bg-zinc-900"
                          >
                            <span>{card.name}</span>
                            <span className="text-xs text-zinc-500">{card.type}</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : null}

                  {builder.battlefields.selectedCards.length > 0 ? (
                    <div className="space-y-2">
                      {builder.battlefields.selectedCards.map((card) => (
                        <div key={card.id} className="flex items-center justify-between rounded-lg border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-800">
                          <span>{card.name}</span>
                          <button type="button" onClick={() => removeCard("battlefields", card.id)} className="text-amber-600">
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
              </section>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
