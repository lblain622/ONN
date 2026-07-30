"use client";

import {use, useEffect, useMemo, useState} from "react";
import {useRouter} from "next/navigation";
import {Redo2, Save, Undo2} from "lucide-react";
import {BuilderState} from "@/components/deckbuilder/types";
import {DeckHeader} from "@/components/deckbuilder/DeckHeader";
import {DeckRules} from "@/components/deckbuilder/DeckRules";
import {DeckStats} from "@/components/deckbuilder/DeckStats";
import {SearchCard} from "@/components/deckbuilder/SearchCard";
import {SelectedCard} from "@/components/deckbuilder/SelectedCard";
import {useDeckBuilder} from "@/hooks/useDeckBuilder";
import {useDeckValidation} from "@/hooks/useDeckValidation";
import {useUndoableBuilder} from "@/hooks/useUndoableBuilder";

function LoadingScreen() {
    return (
        <div className="flex min-h-screen w-full items-center justify-center bg-darkblue">
            <div className="text-center">
                <div
                    className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-gold border-r-transparent"></div>
                <p className="mt-4 text-sm text-zinc-400">Loading deck builder...</p>
            </div>
        </div>
    );
}

type DeckSection = {
    key: keyof BuilderState;
    label: string;
    limit: number;
};

const DECK_SECTIONS: DeckSection[] = [
    {key: "legend", label: "Legend", limit: 1},
    {key: "champion", label: "Champion", limit: 1},
    {key: "mainDeck", label: "Main Deck", limit: 39},
    {key: "battlefields", label: "Battlefields", limit: 3},
    {key: "runes", label: "Runes", limit: 12},
];

export default function DeckPage({params}: { params: Promise<{ id: string }> }) {
    const {id} = use(params);
    const router = useRouter();

    const {
        builder,
        setBuilder,
        deckName,
        setDeckName,
        loading,
        isSaving,
        isReadOnly,
        isPublic,
        setIsPublic,
        error: loadError,
        handleSelect,
        handleRemove,
        handleSearch,
        handleSave,
    } = useDeckBuilder(id);

    const validation = useDeckValidation(builder);
    const {undo, redo, canUndo, canRedo} = useUndoableBuilder(builder, setBuilder);

    const [targetSection, setTargetSection] = useState<keyof BuilderState>("legend");
    const [query, setQuery] = useState("");
    const [cardType, setCardType] = useState("all");
    const [isSearching, setIsSearching] = useState(false);
    const [searchError, setSearchError] = useState<string | null>(null);

    const activeSection = builder[targetSection];
    const selectedMap = useMemo(() => {
        const map = new Map<string, number>();
        activeSection.selectedCards.forEach((card) => {
            map.set(card.id, (map.get(card.id) ?? 0) + 1);
        });
        return map;
    }, [activeSection.selectedCards]);

    const groupedDeckCards = useMemo(() => {
        const groups = new Map<string, { id: string; name: string; type: string; imageUrl?: string; count: number }>();
        builder.mainDeck.selectedCards.forEach((card) => {
            const entry = groups.get(card.id);
            if (entry) {
                entry.count += 1;
            } else {
                groups.set(card.id, {id: card.id, name: card.name, type: card.type, imageUrl: card.imageUrl, count: 1});
            }
        });
        return [...groups.values()].sort((a, b) => a.name.localeCompare(b.name));
    }, [builder.mainDeck.selectedCards]);

    const handleSearchCards = async () => {
        setSearchError(null);
        setIsSearching(true);
        try {
            await handleSearch(targetSection, query.trim(), cardType);
        } catch (error) {
            setSearchError(error instanceof Error ? error.message : "Search failed");
        } finally {
            setIsSearching(false);
        }
    };

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            setSearchError(null);
            setIsSearching(true);
            handleSearch(targetSection, query.trim(), cardType)
                .catch((error) => {
                    setSearchError(error instanceof Error ? error.message : "Search failed");
                })
                .finally(() => {
                    setIsSearching(false);
                });
        }, 200);

        return () => clearTimeout(timeoutId);
    }, [cardType, handleSearch, query, targetSection]);

    if (loading) {
        return <LoadingScreen/>;
    }

    return (
        <div className="min-h-screen bg-darkblue text-white pb-20">
            <div className="max-w-[1500px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex flex-col gap-8">
                    <div className="flex flex-col gap-6">
                        <DeckHeader isReadOnly={isReadOnly} onBack={() => router.push("/decks")}/>

                        {!isReadOnly && (
                            <div className="flex flex-col gap-4 bg-black p-4 rounded-2xl border border-gold/20 shadow-sm">
                                <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
                                    <div className="flex w-full max-w-xl flex-col gap-1">
                                        <label htmlFor="deck-name" className="text-xs uppercase tracking-wider text-zinc-400">
                                            Deck Name
                                        </label>
                                        <input
                                            id="deck-name"
                                            placeholder="Enter deck name..."
                                            value={deckName}
                                            onChange={(e) => setDeckName(e.target.value)}
                                            className="h-11 rounded-xl border border-gold/20 bg-darkblue px-3 text-sm text-white outline-none transition focus:border-gold"
                                        />
                                    </div>
                                    <div className="flex flex-wrap items-center gap-2">
                                        <button type="button" onClick={undo} disabled={!canUndo}
                                                className="rounded-lg border border-gold/20 bg-darkblue p-2 text-zinc-300 disabled:opacity-50">
                                            <Undo2 size={16}/>
                                        </button>
                                        <button type="button" onClick={redo} disabled={!canRedo}
                                                className="rounded-lg border border-gold/20 bg-darkblue p-2 text-zinc-300 disabled:opacity-50">
                                            <Redo2 size={16}/>
                                        </button>
                                        <button type="button" onClick={() => setIsPublic((prev) => !prev)}
                                                className="rounded-lg border border-gold/20 bg-darkblue px-3 py-2 text-sm">
                                            {isPublic ? "Public deck" : "Private deck"}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => void handleSave({allowInvalid: !validation.isValid})}
                                            disabled={isSaving}
                                                className="inline-flex items-center gap-2 rounded-lg bg-gold px-4 py-2 text-sm font-semibold text-darkblue disabled:opacity-50">
                                            {!isSaving && <Save size={16}/>}
                                            {isSaving ? "Saving..." : validation.isValid ? "Save Deck" : "Save Draft"}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {(validation.errors.length > 0 || validation.warnings.length > 0 || loadError) && (
                        <div className="space-y-3">
                            {validation.errors.length > 0 && (
                                <div className="rounded-xl border border-danger/30 bg-danger/10 p-3">
                                    <p className="text-sm font-semibold text-danger">Deck Invalid</p>
                                    <ul className="mt-2 list-disc pl-5 text-sm text-zinc-200">
                                        {validation.errors.map((err) => <li key={err}>{err}</li>)}
                                    </ul>
                                </div>
                            )}
                            {validation.warnings.length > 0 && validation.errors.length === 0 && (
                                <div className="rounded-xl border border-warning/30 bg-warning/10 p-3">
                                    <p className="text-sm font-semibold text-warning">Deck Warnings</p>
                                    <ul className="mt-2 list-disc pl-5 text-sm text-zinc-200">
                                        {validation.warnings.map((warn) => <li key={warn}>{warn}</li>)}
                                    </ul>
                                </div>
                            )}
                            {loadError && (
                                <div className="rounded-xl border border-danger/30 bg-danger/10 p-3 text-sm text-zinc-200">
                                    {loadError}
                                </div>
                            )}
                        </div>
                    )}

                    <div className="grid gap-6 xl:grid-cols-2">
                        <section className="rounded-2xl border border-gold/20 bg-black p-4">
                            <div className="flex flex-wrap gap-2 border-b border-gold/10 pb-4">
                                {DECK_SECTIONS.map((section) => (
                                    <button
                                        key={section.key}
                                        type="button"
                                        onClick={() => setTargetSection(section.key)}
                                        className={`rounded-lg px-3 py-1.5 text-sm transition ${
                                            targetSection === section.key
                                                ? "bg-gold/20 text-gold"
                                                : "bg-darkblue text-zinc-300 hover:text-white"
                                        }`}
                                    >
                                        {section.label}
                                    </button>
                                ))}
                            </div>

                            <div className="mt-4 space-y-4">
                                <div className="flex items-center justify-between gap-3">
                                    <input
                                        placeholder={`Search ${DECK_SECTIONS.find((section) => section.key === targetSection)?.label.toLowerCase()} cards...`}
                                        value={query}
                                        onChange={(e) => setQuery(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter") {
                                                void handleSearchCards();
                                            }
                                        }}
                                        className="h-10 flex-1 rounded-lg border border-gold/20 bg-darkblue px-3 text-sm outline-none focus:border-gold"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => void handleSearchCards()}
                                        disabled={isSearching}
                                        className="rounded-lg bg-gold px-4 py-2 text-sm font-semibold text-darkblue disabled:opacity-50"
                                    >
                                        {isSearching ? "Searching..." : "Search"}
                                    </button>
                                </div>

                                <div className="flex flex-wrap gap-2">
                                    {["all", "unit", "spell", "gear", "rune", "battlefield", "legend"].map((type) => (
                                        <button
                                            key={type}
                                            type="button"
                                            onClick={() => setCardType(type)}
                                            className={`rounded-md px-2.5 py-1 text-xs uppercase tracking-wide ${
                                                cardType === type ? "bg-gold/20 text-gold" : "bg-darkblue text-zinc-400"
                                            }`}
                                        >
                                            {type}
                                        </button>
                                    ))}
                                </div>

                                {searchError && (
                                    <p className="rounded-lg border border-danger/30 bg-danger/10 p-2 text-sm text-danger">
                                        {searchError}
                                    </p>
                                )}

                                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                                    {activeSection.searchResults.map((card) => (
                                        <SearchCard
                                            key={card.id}
                                            card={card}
                                            onSelect={() => handleSelect(targetSection, card)}
                                            isSelected={selectedMap.has(card.id)}
                                        />
                                    ))}
                                </div>
                            </div>
                        </section>

                        <section className="rounded-2xl border border-gold/20 bg-black p-4">
                            <div className="mb-4 border-b border-gold/10 pb-3">
                                <h2 className="text-sm uppercase tracking-[0.28em] text-zinc-500">Deck Workspace</h2>
                                <p className="text-sm text-zinc-300">Build and organize your deck sections.</p>
                            </div>

                            <div className="space-y-5">
                                {DECK_SECTIONS.map((section) => {
                                    const cards = builder[section.key].selectedCards;
                                    const canAdd = !isReadOnly && cards.length < section.limit;
                                    const isMainDeck = section.key === "mainDeck";
                                    const isSingleCard = section.limit === 1;
                                    return (
                                        <div key={section.key} className="rounded-xl border border-gold/10 bg-darkblue/60 p-3">
                                            <div className="mb-3 flex items-center justify-between">
                                                <h3 className="text-sm uppercase tracking-wide text-gold">{section.label}</h3>
                                                <span className="rounded-md border border-gold/20 px-2 py-0.5 text-xs text-zinc-300">
                                                    {cards.length}/{section.limit}
                                                </span>
                                            </div>

                                            {isSingleCard ? (
                                                cards[0] ? (
                                                    <SelectedCard
                                                        card={cards[0]}
                                                        readOnly={isReadOnly}
                                                        onRemove={isReadOnly ? undefined : (cardId) => handleRemove(section.key, cardId)}
                                                    />
                                                ) : (
                                                    <button
                                                        type="button"
                                                        disabled={!canAdd}
                                                        onClick={() => setTargetSection(section.key)}
                                                        className="w-full rounded-lg border border-dashed border-gold/30 px-4 py-8 text-sm text-zinc-400 enabled:hover:text-gold"
                                                    >
                                                        + Add {section.label}
                                                    </button>
                                                )
                                            ) : isMainDeck ? (
                                                <div className="space-y-2">
                                                    {groupedDeckCards.length > 0 ? (
                                                        groupedDeckCards.map((card) => (
                                                            <SelectedCard
                                                                key={card.id}
                                                                card={card}
                                                                count={card.count}
                                                                readOnly={isReadOnly}
                                                                onRemove={isReadOnly ? undefined : (cardId) => handleRemove("mainDeck", cardId)}
                                                            />
                                                        ))
                                                    ) : (
                                                        <div className="rounded-lg border border-dashed border-gold/20 px-4 py-6 text-center text-sm text-zinc-500">
                                                            No main deck cards yet.
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                <div className="space-y-2">
                                                    {cards.map((card, index) => (
                                                        <SelectedCard
                                                            key={`${card.id}-${index}`}
                                                            card={card}
                                                            readOnly={isReadOnly}
                                                            onRemove={isReadOnly ? undefined : (cardId) => handleRemove(section.key, cardId)}
                                                        />
                                                    ))}
                                                    {cards.length === 0 && (
                                                        <div className="col-span-full rounded-lg border border-dashed border-gold/20 px-4 py-5 text-center text-sm text-zinc-500">
                                                            No {section.label.toLowerCase()} selected.
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            {canAdd && (
                                                <div className="mt-3">
                                                    <button
                                                        type="button"
                                                        onClick={() => setTargetSection(section.key)}
                                                        className="rounded-md border border-gold/20 px-3 py-1.5 text-xs text-zinc-300 hover:text-gold"
                                                    >
                                                        + Add {section.label}
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                            {!isReadOnly && (
                                <div className="mt-5 grid gap-5 xl:grid-cols-2">
                                    <DeckRules/>
                                    <DeckStats builder={builder}/>
                                </div>
                            )}
                        </section>
                    </div>
                </div>
            </div>
        </div>
    );
}
