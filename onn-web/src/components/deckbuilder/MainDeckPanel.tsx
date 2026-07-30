import React, {useMemo, useState} from "react";
import {Search, X} from "lucide-react";
import {CardOption} from "./types";

type MainDeckPanelProps = {
    selectedCards: CardOption[];
    isReadOnly: boolean;
    onOpenSearch: () => void;
    onRemove: (cardId: string) => void;
};

export function MainDeckPanel({
                                  selectedCards,
                                  isReadOnly,
                                  onOpenSearch,
                                  onRemove,
                              }: MainDeckPanelProps) {
    const [searchTerm, setSearchTerm] = useState("");

    const groupedCards = useMemo(() => {
        const map = new Map<string, { card: CardOption; count: number }>();
        selectedCards.forEach((card) => {
            const entry = map.get(card.id);
            if (entry) {
                entry.count += 1;
            } else {
                map.set(card.id, {card, count: 1});
            }
        });
        return [...map.values()].sort((a, b) => a.card.name.localeCompare(b.card.name));
    }, [selectedCards]);

    const filteredCards = useMemo(() => {
        if (!searchTerm.trim()) return groupedCards;
        const lower = searchTerm.toLowerCase();
        return groupedCards.filter(({card}) => card.name.toLowerCase().includes(lower));
    }, [groupedCards, searchTerm]);

    return (
        <section className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-sm font-semibold uppercase tracking-widest text-gold">Main Deck</h3>
                    <p className="text-xs text-zinc-400">{selectedCards.length} / 40 cards</p>
                </div>
                {!isReadOnly && (
                    <button
                        type="button"
                        onClick={onOpenSearch}
                        className="rounded-md border border-gold/20 px-3 py-1.5 text-sm text-zinc-300 hover:text-gold"
                    >
                        Add Cards
                    </button>
                )}
            </div>

            <div className="rounded-xl border border-gold/20 bg-black">
                {groupedCards.length > 0 ? (
                    <>
                        <div className="sticky top-0 z-10 flex items-center gap-2 border-b border-gold/10 bg-black/90 p-3">
                            <Search size={16} className="text-zinc-400"/>
                            <input
                                placeholder="Search cards in deck..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="h-8 flex-1 bg-transparent text-sm text-zinc-200 outline-none"
                            />
                            {searchTerm && (
                                <button type="button" onClick={() => setSearchTerm("")} className="text-zinc-400 hover:text-white">
                                    <X size={14}/>
                                </button>
                            )}
                        </div>
                        <div className="max-h-[450px] divide-y divide-gold/10 overflow-y-auto">
                            {filteredCards.map(({card, count}) => (
                                <div key={card.id} className="flex items-center justify-between px-3 py-2">
                                    <div className="min-w-0">
                                        <p className="truncate text-sm">{card.name}</p>
                                        <p className="text-xs text-zinc-500">{card.type}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm text-zinc-300">{count}x</span>
                                        {!isReadOnly && (
                                            <button
                                                type="button"
                                                onClick={() => onRemove(card.id)}
                                                className="rounded border border-danger/30 px-2 py-1 text-xs text-danger"
                                            >
                                                Remove
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                ) : (
                    <div className="flex h-32 items-center justify-center text-sm text-zinc-500">Your main deck is empty.</div>
                )}
            </div>
        </section>
    );
}
