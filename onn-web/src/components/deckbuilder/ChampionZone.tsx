import React from "react";

import {SelectedCard} from "./SelectedCard";
import {CardOption} from "./types";

type ChampionZoneProps = {
    card?: CardOption;
    isReadOnly: boolean;
    onOpenSearch: () => void;
    onRemove: (cardId: string) => void;
};

export function ChampionZone({
                                 card,
                                 isReadOnly,
                                 onOpenSearch,
                                 onRemove,
                             }: ChampionZoneProps) {
    return (
        <section className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-sm font-semibold uppercase tracking-widest text-gold">
                        Champion
                    </h3>
                    <p className="text-xs text-zinc-400">
                        {card ? "Selected" : "No champion selected"}
                    </p>
                </div>

                {!isReadOnly && !card && (
                    <button
                        type="button"
                        onClick={onOpenSearch}
                        className="rounded-md border border-gold/20 px-3 py-1.5 text-sm text-zinc-300 hover:text-gold"
                    >
                        Add Champion
                    </button>
                )}
            </div>

            {card ? (
                <SelectedCard
                    card={card}
                    readOnly={isReadOnly}
                    onRemove={
                        isReadOnly
                            ? undefined
                            : () => onRemove(card.id)
                    }
                />
            ) : (
                <button
                    type="button"
                    disabled={isReadOnly}
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
            disabled:cursor-default
            disabled:opacity-70
            enabled:hover:border-primary
            enabled:hover:bg-darkblue
            enabled:hover:scale-[1.01]
          "
                >
                    <div className="text-center">
                        <div className="text-5xl opacity-50 transition-colors group-hover:text-primary">
                            👑
                        </div>

                        <p className="mt-3 text-sm font-medium text-zinc-400">
                            {isReadOnly
                                ? "No Champion Selected"
                                : "Click to Add Champion"}
                        </p>
                    </div>
                </button>
            )}
        </section>
    );
}
