import React, {useCallback, useState} from "react";
import {BuilderState, CardOption} from "./types";
import {SearchCard} from "./SearchCard";

type SearchModalProps = {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    targetSection: keyof BuilderState;
    builder: BuilderState;
    onSearch: (
        sectionKey: keyof BuilderState,
        query: string,
        cardType: string
    ) => Promise<void>;
    onSelect: (
        sectionKey: keyof BuilderState,
        card: CardOption
    ) => void;
};

export function SearchModal({
                                isOpen,
                                onOpenChange,
                                targetSection,
                                builder,
                                onSearch,
                                onSelect,
                            }: SearchModalProps) {
    const section = builder[targetSection];
    const [query, setQuery] = useState("");
    const [cardType, setCardType] = useState("all");
    const [isSearching, setIsSearching] = useState(false);
    const [searchError, setSearchError] = useState<string | null>(null);

    const handleSearch = useCallback(async () => {
        if (!query.trim()) {
            return;
        }
        setSearchError(null);
        setIsSearching(true);
        try {
            await onSearch(targetSection, query.trim(), cardType);
        } catch (error) {
            setSearchError(error instanceof Error ? error.message : "Search failed");
        } finally {
            setIsSearching(false);
        }
    }, [cardType, onSearch, query, targetSection]);

    const handleSelect = useCallback((card: CardOption) => {
        onSelect(targetSection, card);
        onOpenChange(false);
    }, [onOpenChange, onSelect, targetSection]);

    if (!isOpen) {
        return null;
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
            <div className="max-h-[90vh] w-full max-w-6xl overflow-y-auto rounded-xl border border-gold/20 bg-darkblue p-4">
                <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-lg font-semibold">Search Cards</h2>
                    <button type="button" onClick={() => onOpenChange(false)} className="text-sm text-zinc-400 hover:text-white">
                        Close
                    </button>
                </div>

                <div className="mb-3 flex gap-2">
                    <input
                        placeholder="Search for cards..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") {
                                void handleSearch();
                            }
                        }}
                        className="h-10 flex-1 rounded-lg border border-gold/20 bg-black px-3 text-sm outline-none"
                    />
                    <button
                        type="button"
                        onClick={() => void handleSearch()}
                        disabled={!query.trim() || isSearching}
                        className="rounded-lg bg-gold px-4 py-2 text-sm font-semibold text-darkblue disabled:opacity-50"
                    >
                        {isSearching ? "Searching..." : "Search"}
                    </button>
                </div>

                <div className="mb-4 flex flex-wrap gap-2">
                    {["all", "unit", "spell", "artifact", "land", "rune", "battlefield"].map((type) => (
                        <button
                            key={type}
                            type="button"
                            onClick={() => setCardType(type)}
                            className={`rounded-md px-2.5 py-1 text-xs uppercase ${
                                cardType === type ? "bg-gold/20 text-gold" : "bg-black text-zinc-400"
                            }`}
                        >
                            {type}
                        </button>
                    ))}
                </div>

                {searchError && (
                    <p className="mb-3 rounded-md border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
                        {searchError}
                    </p>
                )}

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                    {section.searchResults.map((card) => (
                        <SearchCard
                            key={card.id}
                            card={card}
                            onSelect={() => handleSelect(card)}
                            isSelected={section.selectedCards.some((selected) => selected.id === card.id)}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}
