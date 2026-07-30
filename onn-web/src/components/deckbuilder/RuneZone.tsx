import React from "react";
import {Badge} from "@heroui/react";
import {Sparkles} from "lucide-react";

import {SelectedCard} from "./SelectedCard";
import {CardOption} from "./types";

type RuneZoneProps = {
    cards: CardOption[];
    isReadOnly: boolean;
    onOpenSearch: () => void;
    onRemove: (cardId: string) => void;
};

export function RuneZone({
                             cards,
                             isReadOnly,
                             onOpenSearch,
                             onRemove,
                         }: RuneZoneProps) {
    const maxRunes = 12;
    const progress = (cards.length / maxRunes) * 100;

    return (
        <section className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <div className="flex items-center gap-3">
                        <h3 className="text-sm font-semibold uppercase tracking-widest text-gold">
                            Runes
                        </h3>
                        <Badge
                            color={cards.length === maxRunes ? "success" : cards.length > maxRunes ? "danger" : "warning"}
                            size="sm"
                        >
                            {cards.length}/{maxRunes}
                        </Badge>
                    </div>
                    <div className="mt-1 w-32 h-1 bg-gold/10 rounded-full overflow-hidden">
                        <div
                            className={`h-full transition-all duration-300 ${
                                cards.length === maxRunes
                                    ? "bg-success"
                                    : cards.length > maxRunes
                                        ? "bg-danger"
                                        : "bg-gold/60"
                            }`}
                            style={{width: `${Math.min(progress, 100)}%`}}
                        />
                    </div>
                </div>

                {!isReadOnly && cards.length < maxRunes && (
                    <button
                        type="button"
                        onClick={onOpenSearch}
                        className="rounded-md border border-gold/20 px-3 py-1.5 text-sm text-zinc-300 hover:text-gold"
                    >
                        Add Rune
                    </button>
                )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {cards.map((card, index) => (
                    <SelectedCard
                        key={`${card.id}-${index}`}
                        card={card}
                        readOnly={isReadOnly}
                        onRemove={
                            isReadOnly
                                ? undefined
                                : () => onRemove(card.id)
                        }
                        className="hover:scale-[1.02] transition-transform"
                    />
                ))}

                {!isReadOnly && cards.length < maxRunes && (
                    <button
                        type="button"
                        onClick={onOpenSearch}
                        className="
                            group
                            flex
                            aspect-[5/7]
                            w-full
                            items-center
                            justify-center
                            rounded-2xl
                            border-2
                            border-dashed
                            border-gold/20
                            bg-black
                            transition-all
                            duration-200
                            hover:border-primary
                            hover:bg-darkblue
                            hover:scale-[1.02]
                        "
                    >
                        <div className="text-center">
                            <Sparkles
                                size={40}
                                className="mx-auto text-zinc-500 transition-colors group-hover:text-primary"
                            />
                            <p className="mt-2 text-sm text-zinc-400">
                                Add Rune
                            </p>
                            <p className="text-xs text-zinc-500">
                                {maxRunes - cards.length} remaining
                            </p>
                        </div>
                    </button>
                )}
            </div>
        </section>
    );
}
