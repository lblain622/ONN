import React, {useCallback, useEffect, useState} from "react";
import {Button, Input, Modal, ModalBody, ModalContainer, ModalFooter, ModalHeader, Spinner,} from "@heroui/react";

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

function SearchModal({
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

    // Reset state when modal opens
    useEffect(() => {
        if (isOpen) {
            setQuery("");
            setCardType("all");
            setSearchError(null);
        }
    }, [isOpen]);

    const handleSearch = useCallback(async () => {
        if (!query.trim()) {
            return;
        }

        setIsSearching(true);
        setSearchError(null);

        try {
            await onSearch(targetSection, query, cardType);
        } catch (error) {
            setSearchError(error instanceof Error ? error.message : "Search failed");
        } finally {
            setIsSearching(false);
        }
    }, [query, cardType, targetSection, onSearch]);

    const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
            handleSearch();
        }
    }, [handleSearch]);

    const handleSelect = useCallback((card: CardOption) => {
        onSelect(targetSection, card);
        onOpenChange(false);
    }, [targetSection, onSelect, onOpenChange]);

    const getSectionTitle = (section: keyof BuilderState): string => {
        const titles: Record<keyof BuilderState, string> = {
            legend: "Legend",
            champion: "Champion",
            mainDeck: "Main Deck",
            runes: "Runes",
            battlefields: "Battlefields",
        };
        return titles[section] || String(section);
    };

    return (
        <Modal
            isOpen={isOpen}
            onOpenChange={onOpenChange}
            size="4xl"
            placement="center"
            scrollBehavior="inside"
            backdrop="blur"
        >
            <ModalContainer>
                {(onClose) => (
                    <>
                        <ModalHeader className="flex flex-col gap-1">
                            <h2 className="text-xl font-semibold">
                                Search {getSectionTitle(targetSection)}
                            </h2>
                            <p className="text-sm text-default-500">
                                Find and add cards to your deck.
                            </p>
                        </ModalHeader>

                        <ModalBody>
                            {/* Search Input */}
                            <div className="flex gap-2 mb-4">
                                <Input
                                    placeholder="Search for cards..."
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    onKeyDown={handleKeyPress}
                                    className="flex-1"
                                    startContent={
                                        <svg
                                            className="w-4 h-4 text-default-400"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                                            />
                                        </svg>
                                    }
                                    endContent={
                                        query && !isSearching && (
                                            <button
                                                type="button"
                                                onClick={() => setQuery("")}
                                                className="text-default-400 hover:text-default-600 transition-colors"
                                                aria-label="Clear search"
                                            >
                                                <svg
                                                    className="w-4 h-4"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    viewBox="0 0 24 24"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth={2}
                                                        d="M6 18L18 6M6 6l12 12"
                                                    />
                                                </svg>
                                            </button>
                                        )
                                    }
                                />
                                <Button
                                    color="primary"
                                    onPress={handleSearch}
                                    isLoading={isSearching}
                                    isDisabled={!query.trim() || isSearching}
                                >
                                    Search
                                </Button>
                            </div>

                            {/* Card Type Filter */}
                            <div className="flex gap-2 mb-4 flex-wrap">
                                {["all", "unit", "spell", "artifact", "land", "rune", "battlefield"].map((type) => (
                                    <Button
                                        key={type}
                                        size="sm"
                                        variant={cardType === type ? "solid" : "flat"}
                                        color={cardType === type ? "primary" : "default"}
                                        onPress={() => setCardType(type)}
                                    >
                                        {type.charAt(0).toUpperCase() + type.slice(1)}
                                    </Button>
                                ))}
                            </div>

                            {/* Error Message */}
                            {searchError && (
                                <div
                                    className="mb-4 p-3 rounded-lg bg-danger-50 dark:bg-danger-950/50 text-danger-600 dark:text-danger-400 text-sm">
                                    ⚠️ {searchError}
                                </div>
                            )}

                            {/* Search Results */}
                            {isSearching ? (
                                <div className="flex justify-center items-center py-12">
                                    <Spinner size="lg" label="Searching..."/>
                                </div>
                            ) : section?.searchResults?.length > 0 ? (
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                                    {section.searchResults.map((card: CardOption) => (
                                        <SearchCard
                                            key={card.id}
                                            card={card}
                                            onSelect={() => handleSelect(card)}
                                            isSelected={section.selectedCards?.some(c => c.id === card.id)}
                                        />
                                    ))}
                                </div>
                            ) : query && !isSearching ? (
                                <div className="text-center py-12 text-default-500">
                                    <div className="text-4xl mb-3">🔍</div>
                                    <p>No cards found. Try a different search term.</p>
                                </div>
                            ) : (
                                <div className="text-center py-12 text-default-400">
                                    <div className="text-4xl mb-3">🃏</div>
                                    <p>Enter a search term to find cards.</p>
                                </div>
                            )}
                        </ModalBody>

                        <ModalFooter>
                            <Button
                                variant="flat"
                                color="default"
                                onPress={onClose}
                            >
                                Close
                            </Button>
                        </ModalFooter>
                    </>
                )}
            </ModalContainer>
        </Modal>
    );
}

export default SearchModal
