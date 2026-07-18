import React from "react";
import {Button} from "@heroui/react";
import {ScrollText} from "lucide-react";

import {SelectedCard} from "./SelectedCard";
import {CardOption} from "./types";

type LegendZoneProps = {
    card?: CardOption;
    isReadOnly: boolean;
    onOpenSearch: () => void;
    onRemove: (cardId: string) => void;
};

export function LegendZone({
                               card,
                               isReadOnly,
                               onOpenSearch,
                               onRemove,
                           }: LegendZoneProps) {
    return (
        <section className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-sm font-semibold uppercase tracking-widest text-gold">
                        Legend
                    </h3>
                    <p className="text-xs text-zinc-400">
                        {card ? "Selected" : "No legend selected"}
                    </p>
                </div>

                {!isReadOnly && !card && (
                    <Button
                        size="sm"
                        variant="flat"
                        color="primary"
                        onPress={onOpenSearch}
                    >
                        Add Legend
                    </Button>
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
                        <ScrollText
                            size={52}
                            className="mx-auto text-zinc-500 transition-colors group-hover:text-primary"
                        />

                        <p className="mt-3 text-sm font-medium text-zinc-400">
                            {isReadOnly
                                ? "No Legend Selected"
                                : "Click to Add Legend"}
                        </p>
                    </div>
                </button>
            )}
        </section>
    );
}
