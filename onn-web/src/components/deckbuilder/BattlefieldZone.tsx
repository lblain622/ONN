import React from "react";
import {Button} from "@heroui/react";

import {SelectedCard} from "./SelectedCard";
import {CardOption} from "./types";

type BattlefieldZoneProps = {
    cards: CardOption[];
    isReadOnly: boolean;
    onOpenSearch: () => void;
    onRemove: (cardId: string) => void;
};

export function BattlefieldZone({
                                    cards,
                                    isReadOnly,
                                    onOpenSearch,
                                    onRemove,
                                }: BattlefieldZoneProps) {
    return (
        <section className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-sm font-semibold uppercase tracking-widest text-gold">
                        Battlefields
                    </h3>
                    <p className="text-xs text-zinc-400">
                        {cards.length} / 3 selected
                    </p>
                </div>

                {!isReadOnly && (
                    <Button
                        size="sm"
                        onPress={onOpenSearch}
                    >
                        Add Battlefield
                    </Button>
                )}
            </div>

            <div className="grid gap-4">
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
                    />
                ))}

                {!isReadOnly && cards.length < 3 && (
                    <button
                        type="button"
                        onClick={onOpenSearch}
                        className="
              group
              flex
              aspect-[21/9]
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
              hover:scale-[1.01]
            "
                    >
                        <div className="text-center">
                            <div
                                className="text-4xl font-light text-zinc-500 transition-colors group-hover:text-primary">
                                +
                            </div>
                            <p className="mt-2 text-sm text-zinc-400">
                                Add Battlefield
                            </p>
                        </div>
                    </button>
                )}
            </div>
        </section>
    );
}
