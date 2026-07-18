import React from "react";
import {Button} from "@heroui/react";
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

            <Button
                variant="bordered"
                startcontent={<ArrowLeft size={16}/>}
                onPress={onBack}
            >
                Back to Decks
            </Button>
        </header>
    );
}
