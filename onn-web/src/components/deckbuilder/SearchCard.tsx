import React, {KeyboardEvent, useState} from "react";
import {Check, Plus} from "lucide-react";

import {CardOption} from "./types";
import {CardImage} from "./CardImage";

type SearchCardProps = {
    card: CardOption;
    onSelect: (card: CardOption) => void;
    isSelected?: boolean;
};

export function SearchCard({
                               card,
                               onSelect,
                               isSelected = false,
                           }: SearchCardProps) {
    const [isHovered, setIsHovered] = useState(false);

    function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
        if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            onSelect(card);
        }
    }

    return (
        <div
            title={`${card.name} (${card.type})`}
            className="h-full"
        >
            <div
                className={`
                    h-full
                    overflow-hidden
                    transition-all
                    duration-200
                    hover:scale-[1.02]
                    hover:shadow-lg
                    focus-visible:ring-2
                    focus-visible:ring-primary
                    ${isSelected ? "ring-2 ring-primary" : ""}
                    ${isHovered ? "border-primary" : ""}
                `}
                role="button"
                tabIndex={0}
                onClick={() => onSelect(card)}
                onKeyDown={handleKeyDown}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
            >
                <div className="relative">
                    <CardImage card={card} size="modal"/>

                    {/* Selection overlay */}
                    <div className={`
                        absolute inset-0 flex items-center justify-center
                        transition-opacity duration-200
                        ${isSelected ? "bg-primary/20" : "bg-black/0"}
                    `}>
                        {isSelected ? (
                            <div className="bg-primary rounded-full p-2 shadow-lg">
                                <Check size={24} className="text-white"/>
                            </div>
                        ) : isHovered && (
                            <div
                                className="bg-primary/90 rounded-full p-2 shadow-lg transform transition-transform hover:scale-110">
                                <Plus size={24} className="text-white"/>
                            </div>
                        )}
                    </div>
                </div>

                <div className="gap-1 p-3">
                    <h4 className="truncate text-sm font-semibold">
                        {card.name}
                    </h4>
                    <p className="text-xs text-default-500">
                        {card.type}
                    </p>
                </div>
            </div>
        </div>
    );
}
