import React from "react";
import {X} from "lucide-react";
import {CardOption} from "./types";
import {CardImage} from "./CardImage";

type SelectedCardProps = {
    card: CardOption;
    onRemove?: (cardId: string) => void;
    readOnly?: boolean;
    className?: string;
    count?: number;
};

export function SelectedCard({
                                 card,
                                 onRemove,
                                 readOnly = false,
                                 className = "",
                                 count = 1,
                             }: SelectedCardProps) {
    const handleRemove = (e: React.MouseEvent) => {
        e.stopPropagation();
        onRemove?.(card.id);
    };

    return (
        <div className={`group relative ${className}`}>
            <div className="flex h-14 items-center gap-3 rounded-lg border border-gold/20 bg-black px-2.5">
                <div className="h-10 w-10 shrink-0 overflow-hidden rounded-md border border-gold/20 bg-darkblue">
                    {card.imageUrl ? (
                        <img
                            src={card.imageUrl}
                            alt={card.name}
                            loading="lazy"
                            decoding="async"
                            draggable={false}
                            className="h-full w-full object-cover"
                        />
                    ) : (
                        <div className="flex h-full w-full items-center justify-center text-xs text-zinc-400">🃏</div>
                    )}
                </div>

                <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-white" title={card.name}>
                        {card.name}
                    </p>
                    <p className="truncate text-xs text-zinc-400">{card.type}</p>
                </div>

                {count > 1 && (
                    <span className="rounded-md border border-gold/20 px-2 py-0.5 text-xs text-zinc-200">{count}x</span>
                )}

                {!readOnly && onRemove && (
                    <button
                        type="button"
                        onClick={handleRemove}
                        className="rounded border border-danger/40 px-2 py-1 text-xs text-danger hover:bg-danger/10"
                        aria-label={`Remove ${card.name}`}
                    >
                        <X size={14}/>
                    </button>
                )}
            </div>

            <div className="pointer-events-none absolute left-0 top-full z-30 mt-2 hidden w-56 group-hover:block">
                <div className="rounded-xl border border-gold/20 bg-black p-2 shadow-2xl">
                    <CardImage card={card} size="selected"/>
                </div>
            </div>
        </div>
    );
}
