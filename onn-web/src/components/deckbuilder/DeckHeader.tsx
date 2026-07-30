import React from "react";
import {ArrowLeft} from "lucide-react";

type DeckHeaderProps = {
    isReadOnly: boolean;
    onBack: () => void;
};

export function DeckHeader({
                               isReadOnly,
                               onBack,
                           }: DeckHeaderProps) {
    return (
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary">
                    ONN DECK BUILDER
                </p>

                <h1 className="text-3xl font-bold tracking-tight">
                    {isReadOnly ? "View Deck" : "Build Your Deck"}
                </h1>

                <p className="text-sm text-default-500">
                    {isReadOnly
                        ? "Browse the cards in this deck."
                        : "Search, organize, and customize your deck."}
                </p>
            </div>

            <button
                type="button"
                onClick={onBack}
                className="inline-flex items-center gap-2 rounded-lg border border-gold/30 bg-black px-4 py-2 text-sm text-zinc-200 hover:text-gold"
            >
                <ArrowLeft size={16}/>
                Back to Decks
            </button>
        </header>
    );
}
