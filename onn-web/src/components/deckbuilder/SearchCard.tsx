import React, {KeyboardEvent, useState} from "react";
import {Card, CardBody, Tooltip} from "@heroui/react";
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
    console.log(card)

    function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
        if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            onSelect(card);
        }
    }

    return (
        <Tooltip
            content={
                <div className="max-w-xs p-2">
                    <p className="font-bold">{card?.name}</p>
                    <p className="text-sm text-default-400">{card.type}</p>
                    {card.richText && (
                        <div className="mt-2 text-xs" dangerouslySetInnerHTML={{__html: card.richText}}/>
                    )}
                    {card.domains && card.domains.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                            {card.domains.map((d, i) => (
                                <span key={i} className="text-xs px-2 py-1 rounded bg-default-100 dark:bg-default-800">
                                    {d.domain.name}
                                </span>
                            ))}
                        </div>
                    )}
                </div>
            }
            placement="top"
            delay={300}
        >
            <Card
                isPressable
                shadow="sm"
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
                onPress={() => onSelect(card)}
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

                <CardBody className="gap-1 p-3">
                    <h4 className="truncate text-sm font-semibold">
                        {card.name}
                    </h4>
                    <p className="text-xs text-default-500">
                        {card.type}
                    </p>
                </CardBody>
            </Card>
        </Tooltip>
    );
}
