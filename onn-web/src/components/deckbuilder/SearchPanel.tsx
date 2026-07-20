import React, { useCallback, useMemo, useState } from "react";
import {
  Button,
  Card,
  CardBody,
  Input,
  Spinner,
} from "@heroui/react";
import { Search, X } from "lucide-react";

import { BuilderState, CardOption } from "./types";
import { SearchCard } from "./SearchCard";

type SearchPanelProps = {
  targetSection: keyof BuilderState;
  builder: BuilderState;
  onSearch: (
    sectionKey: keyof BuilderState,
    query: string,
    cardType: string
  ) => Promise<void>;
  onSelect: (sectionKey: keyof BuilderState, card: CardOption) => void;
};

export function SearchPanel({
  targetSection,
  builder,
  onSearch,
  onSelect,
}: SearchPanelProps) {
  const section = builder[targetSection];
  const [query, setQuery] = useState("");
  const [cardType, setCardType] = useState("all");
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = useCallback(async () => {
    if (!query.trim()) {
      return;
    }

    setIsSearching(true);
    setSearchError(null);
    setHasSearched(true);

    try {
      await onSearch(targetSection, query, cardType);
    } catch (error) {
      setSearchError(error instanceof Error ? error.message : "Search failed");
    } finally {
      setIsSearching(false);
    }
  }, [query, cardType, targetSection, onSearch]);

  const handleKeyPress = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        handleSearch();
      }
    },
    [handleSearch]
  );

  const handleSelect = useCallback(
    (card: CardOption) => {
      onSelect(targetSection, card);
    },
    [targetSection, onSelect]
  );

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

  const typeFilters = ["all", "unit", "spell", "artifact", "land", "rune", "battlefield"];

  return (
    <div className="space-y-4 sticky top-4">
      {/* Card Type Filters */}
      <Card className="border border-gold/20 bg-black">
        <CardBody className="space-y-3">
          <div>
            <h3 className="text-sm font-semibold text-gold uppercase tracking-widest">
              Search Filters
            </h3>
            <p className="text-xs text-zinc-400">Select a card type</p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {typeFilters.map((type) => (
              <Button
                key={type}
                size="sm"
                variant={cardType === type ? "solid" : "flat"}
                color={cardType === type ? "primary" : "default"}
                onPress={() => setCardType(type)}
                className="text-xs"
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </Button>
            ))}
          </div>
        </CardBody>
      </Card>

      {/* Search Input */}
      <Card className="border border-gold/20 bg-black">
        <CardBody className="space-y-3">
          <div>
            <h3 className="text-sm font-semibold text-gold uppercase tracking-widest">
              Search {getSectionTitle(targetSection)}
            </h3>
            <p className="text-xs text-zinc-400">Find and add cards</p>
          </div>
          <div className="space-y-2">
            <Input
              placeholder="Search for cards..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyPress}
              size="sm"
              startContent={<Search size={16} className="text-zinc-400" />}
              endContent={
                query && !isSearching ? (
                  <button
                    type="button"
                    onClick={() => setQuery("")}
                    className="text-zinc-400 hover:text-white"
                    aria-label="Clear search"
                  >
                    <X size={16} />
                  </button>
                ) : null
              }
            />
            <Button
              color="primary"
              onPress={handleSearch}
              isLoading={isSearching}
              isDisabled={!query.trim() || isSearching}
              fullWidth
              size="sm"
            >
              Search
            </Button>
          </div>
        </CardBody>
      </Card>

      {/* Error Message */}
      {searchError && (
        <div className="p-3 rounded-lg bg-danger-950/50 text-danger-400 text-sm border border-danger/50">
          ⚠️ {searchError}
        </div>
      )}

      {/* Search Results */}
      <Card className="border border-gold/20 bg-black">
        <CardBody className="space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-gold uppercase tracking-widest">
              Results
            </h3>
            <p className="text-xs text-zinc-400">
              {isSearching ? "Searching..." : section?.searchResults?.length || 0} cards found
            </p>
          </div>

          {isSearching ? (
            <div className="flex justify-center py-8">
              <Spinner size="sm" label="Searching..." />
            </div>
          ) : section?.searchResults?.length > 0 ? (
            <div className="grid grid-cols-2 gap-3 max-h-[600px] overflow-y-auto">
              {section.searchResults.map((card: CardOption) => (
                <SearchCard
                  key={card.id}
                  card={card}
                  onSelect={() => handleSelect(card)}
                  isSelected={section.selectedCards?.some((c) => c.id === card.id)}
                />
              ))}
            </div>
          ) : query && hasSearched && !isSearching ? (
            <div className="text-center py-8 text-zinc-400">
              <div className="text-2xl mb-2">🔍</div>
              <p className="text-sm">No cards found.</p>
              <p className="text-xs">Try a different search term.</p>
            </div>
          ) : (
            <div className="text-center py-8 text-zinc-500">
              <div className="text-2xl mb-2">🃏</div>
              <p className="text-sm">Enter a search to find cards</p>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
