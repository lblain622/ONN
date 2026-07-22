import { Button, Chip } from "@heroui/react";
import { X } from "lucide-react";

import { CardOption } from "./types";

type DeckRowProps = {
    card: CardOption;
    count?: number;
    isReadOnly?: boolean;
    onRemove?: () => void;
    onAdd?: () => void;
};

export function DeckRow({
                            card,
                            count = 1,
                            isReadOnly = false,
                            onRemove,
                            onAdd,
                        }: DeckRowProps) {
    return (
        <div className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-default-100 transition-colors">

            {/* Count */}
            <Chip
                size="sm"
                color="primary"
                variant="flat"
                className="w-10 justify-center"
            >
                {count}×
            </Chip>

            {/* Card Name */}
            <div className="flex-1 min-w-0">
                <p className="truncate font-medium">
                    {card.name}
                </p>

                <p className="text-xs text-default-500">
                    {card.type}
                </p>
            </div>

            {/* Buttons */}
            {!isReadOnly && (
                <div className="flex gap-1">

                    {onAdd && (
                        <Button
                            isIconOnly
                            size="sm"
                            variant="light"
                            onPress={onAdd}
                        >
                            +
                        </Button>
                    )}

                    {onRemove && (
                        <Button
                            isIconOnly
                            size="sm"
                            color="danger"
                            variant="light"
                            onPress={onRemove}
                        >
                            <X size={16} />
                        </Button>
                    )}

                </div>
            )}
        </div>
    );
}
