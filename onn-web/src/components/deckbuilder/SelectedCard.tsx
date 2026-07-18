import React, {useState} from "react";
import {Button, Card, Tooltip} from "@heroui/react";
import {X} from "lucide-react";
import {CardOption} from "./types";
import {CardImage} from "./CardImage";

type SelectedCardProps = {
    card: CardOption;
    onRemove?: (cardId: string) => void;
    selectedLabel?: string;
    readOnly?: boolean;
    className?: string;
};

export function SelectedCard({
                                 card,
                                 onRemove,
                                 selectedLabel,
                                 readOnly = false,
                                 className = ""
                             }: SelectedCardProps) {
    const [isHovered, setIsHovered] = useState(false);

    const handleRemove = (e: React.MouseEvent) => {
        e.stopPropagation();
        onRemove?.(card.id);
    };

    return (
        <Card
            className={`
                overflow-hidden 
                border border-gold/20 
                bg-black 
                shadow-sm 
                transition-all 
                duration-200
                ${!readOnly && isHovered ? "border-primary shadow-lg" : ""}
                ${className}
            `}
            isPressable={!readOnly}
            onPress={!readOnly ? () => onRemove?.(card.id) : undefined}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <div className="relative">
                <CardImage card={card} size={selectedLabel ? "selected" : "compact"}/>

                {selectedLabel && (
                    <div className="absolute top-2 left-2">
                        <span
                            className="px-2 py-1 text-xs font-semibold text-gold bg-darkblue/90 backdrop-blur-sm rounded-md border border-gold/20">
                            {selectedLabel}
                        </span>
                    </div>
                )}

                {!readOnly && onRemove && isHovered && (
                    <div
                        className="absolute inset-0 bg-black/50 flex items-center justify-center backdrop-blur-sm transition-opacity duration-200">
                        <Button
                            isIconOnly
                            color="danger"
                            size="lg"
                            onPress={handleRemove}
                            className="transform transition-transform hover:scale-110"
                        >
                            <X size={24}/>
                        </Button>
                    </div>
                )}
            </div>

            <div className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
                <div className="min-w-0 flex-1">
                    <Tooltip content={card.name}>
                        <p className="truncate font-medium text-white">
                            {card.name}
                        </p>
                    </Tooltip>
                    {card.type && (
                        <p className="truncate text-xs text-zinc-400">
                            {card.type}
                        </p>
                    )}
                </div>

                {!readOnly && onRemove && !isHovered && (
                    <Button
                        size="sm"
                        variant="light"
                        color="danger"
                        onPress={handleRemove}
                        className="shrink-0 min-w-0 px-2 opacity-60 hover:opacity-100"
                        aria-label={`Remove ${card.name}`}
                    >
                        ✕
                    </Button>
                )}
            </div>
        </Card>
    );
}
