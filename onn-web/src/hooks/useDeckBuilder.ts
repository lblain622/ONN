// hooks/useDeckBuilder.ts
import {useCallback, useEffect, useState} from "react";
import {useRouter} from "next/navigation";
import {BuilderState, CardOption, SectionState} from "@/components/deckbuilder/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

function createSection(type: string): SectionState {
    return {query: "", type, searchResults: [], selectedCards: []};
}

export function useDeckBuilder(deckId: string) {
    const router = useRouter();
    const [builder, setBuilder] = useState<BuilderState>({
        legend: createSection("LEGEND"),
        champion: createSection("UNIT"),
        mainDeck: createSection("UNIT"),
        runes: createSection("RUNE"),
        battlefields: createSection("BATTLEFIELD"),
    });
    const [deckName, setDeckName] = useState("New Deck");
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isReadOnly, setIsReadOnly] = useState(false);
    const [isPublic, setIsPublic] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const loadDeck = useCallback(async () => {
        try {
            const userRes = await fetch(`${API_URL}/auth/me`, {
                credentials: "include",
            });
            const currentUser = userRes.ok ? await userRes.json() : null;

            if (deckId === "new") {
                setLoading(false);
                return;
            }

            const response = await fetch(`${API_URL}/decks/${deckId}`, {
                credentials: "include",
            });

            if (response.status === 401) {
                router.replace("/");
                return;
            }

            if (!response.ok) throw new Error("Failed to fetch deck");

            const deckData = await response.json();
            setDeckName(deckData.name);
            setIsPublic(Boolean(deckData.isPublic));

            if (currentUser && deckData.ownerId !== currentUser.id && currentUser.role !== "ADMIN") {
                setIsReadOnly(true);
            }

            const newBuilder: BuilderState = {
                legend: createSection("LEGEND"),
                champion: createSection("UNIT"),
                mainDeck: createSection("UNIT"),
                runes: createSection("RUNE"),
                battlefields: createSection("BATTLEFIELD"),
            };

            deckData.cards.forEach((dc: any) => {
                const card = dc.card;
                const quantity = dc.quantity;
                const type = card.type;

                if (type === "LEGEND") {
                    newBuilder.legend.selectedCards = [card];
                } else if (type === "RUNE") {
                    newBuilder.runes.selectedCards.push(...Array(quantity).fill(card));
                } else if (type === "BATTLEFIELD") {
                    newBuilder.battlefields.selectedCards.push(...Array(quantity).fill(card));
                } else if (type === "UNIT") {
                    const isChampion = deckData.description?.includes(`Champion: ${card.name}`);
                    if (isChampion) {
                        newBuilder.champion.selectedCards = [card];
                    } else {
                        newBuilder.mainDeck.selectedCards.push(...Array(quantity).fill(card));
                    }
                } else {
                    newBuilder.mainDeck.selectedCards.push(...Array(quantity).fill(card));
                }
            });

            setBuilder(newBuilder);
        } catch (error) {
            setError(error instanceof Error ? error.message : "Failed to load deck");
        } finally {
            setLoading(false);
        }
    }, [deckId, router]);

    useEffect(() => {
        loadDeck();
    }, [loadDeck]);

    const handleSelect = useCallback((sectionKey: keyof BuilderState, card: CardOption) => {
        setBuilder(prev => {
            const section = prev[sectionKey];
            let newSelected = [...section.selectedCards];

            if (sectionKey === "legend" || sectionKey === "champion") {
                newSelected = [card];
            } else {
                newSelected.push(card);
            }

            return {
                ...prev,
                [sectionKey]: {
                    ...section,
                    selectedCards: newSelected
                }
            };
        });
    }, []);

    const handleRemove = useCallback((sectionKey: keyof BuilderState, cardId: string) => {
        setBuilder(prev => {
            const section = prev[sectionKey];
            const index = section.selectedCards.findIndex(c => c.id === cardId);
            if (index === -1) return prev;

            const newSelected = [...section.selectedCards];
            newSelected.splice(index, 1);

            return {
                ...prev,
                [sectionKey]: {
                    ...section,
                    selectedCards: newSelected
                }
            };
        });
    }, []);

    const handleSearch = useCallback(async (sectionKey: keyof BuilderState, query: string, cardType: string) => {
        try {
            const typeParam = cardType === "all" ? builder[sectionKey].type : cardType.toUpperCase();
            const response = await fetch(`${API_URL}/cards/search?query=${encodeURIComponent(query)}&type=${typeParam}`, {
                credentials: "include",
            });

            if (!response.ok) throw new Error("Search failed");
            const results = await response.json();

            setBuilder(prev => ({
                ...prev,
                [sectionKey]: {
                    ...prev[sectionKey],
                    searchResults: results
                }
            }));
        } catch (error) {
            throw error;
        }
    }, [builder]);

    const handleSave = useCallback(async () => {
        setIsSaving(true);
        setError(null);

        try {
            const allCards: { cardId: string, quantity: number }[] = [];
            const counts = new Map<string, number>();

            const addCards = (cards: CardOption[]) => {
                cards.forEach(c => counts.set(c.id, (counts.get(c.id) || 0) + 1));
            };

            addCards(builder.legend.selectedCards);
            addCards(builder.champion.selectedCards);
            addCards(builder.mainDeck.selectedCards);
            addCards(builder.runes.selectedCards);
            addCards(builder.battlefields.selectedCards);

            counts.forEach((quantity, cardId) => allCards.push({cardId, quantity}));

            const championCard = builder.champion.selectedCards[0];
            const legendCard = builder.legend.selectedCards[0];

            const description = [
                legendCard ? `Legend: ${legendCard.name}` : null,
                championCard ? `Champion: ${championCard.name}` : null,
            ].filter(Boolean).join("\n");

            const method = deckId === "new" ? "POST" : "PUT";
            const url = deckId === "new" ? `${API_URL}/decks` : `${API_URL}/decks/${deckId}`;

            const response = await fetch(url, {
                method,
                headers: {"Content-Type": "application/json"},
                credentials: "include",
                body: JSON.stringify({
                    name: deckName,
                    description,
                    cards: allCards,
                    isPublic,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => null);
                throw new Error(errorData?.message || "Failed to save deck");
            }

            const savedDeck = await response.json();

            if (deckId === "new") {
                router.replace(`/decks/${savedDeck.id}`);
            }

            return savedDeck;
        } catch (error) {
            setError(error instanceof Error ? error.message : "Failed to save deck");
            throw error;
        } finally {
            setIsSaving(false);
        }
    }, [builder, deckName, deckId, isPublic, router]);

    return {
        builder,
        setBuilder,
        deckName,
        setDeckName,
        loading,
        isSaving,
        isReadOnly,
        isPublic,
        setIsPublic,
        error,
        handleSelect,
        handleRemove,
        handleSearch,
        handleSave,
    };
}
